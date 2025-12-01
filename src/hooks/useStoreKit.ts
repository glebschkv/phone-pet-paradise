import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { StoreKit, StoreKitProduct, PurchaseResult, SubscriptionStatus, RestoredPurchase } from '@/plugins/store-kit';
import { SUBSCRIPTION_PLANS } from './usePremiumStatus';
import { useToast } from './use-toast';
import { storeKitLogger as logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

const PREMIUM_STORAGE_KEY = 'petIsland_premium';

/**
 * Validate a purchase with the server
 * Standalone function to avoid circular dependency issues
 */
async function serverValidatePurchase(
  purchase: PurchaseResult | RestoredPurchase
): Promise<{ success: boolean; subscription?: any }> {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      logger.warn('User not authenticated, skipping server validation');
      return { success: true }; // Allow local-only validation for non-authenticated users
    }

    if (!purchase.signedTransaction || !purchase.transactionId || !purchase.productId) {
      logger.warn('Missing required fields for server validation');
      return { success: true }; // Allow purchase but log warning
    }

    logger.debug('Validating purchase with server:', purchase.productId);

    const { data, error } = await supabase.functions.invoke('validate-receipt', {
      body: {
        signedTransaction: purchase.signedTransaction,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        originalTransactionId: purchase.originalTransactionId,
        environment: purchase.environment || 'production',
        platform: 'ios',
      },
    });

    if (error) {
      logger.error('Server validation error:', error);
      return { success: true }; // Don't fail the purchase
    }

    if (data?.success) {
      logger.debug('Server validation successful:', data.subscription);
      return { success: true, subscription: data.subscription };
    } else {
      logger.error('Server validation failed:', data?.error);
      return { success: false };
    }
  } catch (err) {
    logger.error('Error during server validation:', err);
    return { success: true }; // Don't fail the purchase
  }
}

// All IAP product IDs
const ALL_PRODUCT_IDS = [
  // Subscriptions
  'co.nomoinc.nomo.premium.monthly',
  'co.nomoinc.nomo.premium.yearly',
  'co.nomoinc.nomo.premiumplus.monthly',
  'co.nomoinc.nomo.premiumplus.yearly',
  'co.nomoinc.nomo.lifetime',
  // Consumables
  'co.nomoinc.nomo.coins.starter',
  'co.nomoinc.nomo.coins.value',
  'co.nomoinc.nomo.coins.premium',
  'co.nomoinc.nomo.coins.mega',
  // Bundles
  'co.nomoinc.nomo.bundle.starter',
  'co.nomoinc.nomo.bundle.collector',
];

interface UseStoreKitReturn {
  products: StoreKitProduct[];
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;
  loadProducts: () => Promise<void>;
  purchaseProduct: (productId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
  manageSubscriptions: () => Promise<void>;
  getProductById: (productId: string) => StoreKitProduct | undefined;
}

export const useStoreKit = (): UseStoreKitReturn => {
  const [products, setProducts] = useState<StoreKitProduct[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load products from App Store
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await StoreKit.getProducts({ productIds: ALL_PRODUCT_IDS });
      setProducts(result.products);

      logger.debug('Loaded products:', result.products.length);
    } catch (err) {
      logger.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check current subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const status = await StoreKit.getSubscriptionStatus();
      setSubscriptionStatus(status);

      // Sync with local storage for offline access
      if (status.hasActiveSubscription) {
        const activeSub = status.activeSubscriptions[0] || status.purchasedProducts[0];
        if (activeSub) {
          const plan = SUBSCRIPTION_PLANS.find(p => p.iapProductId === activeSub.productId);
          if (plan) {
            const premiumState = {
              tier: plan.tier,
              expiresAt: activeSub.expirationDate
                ? new Date(activeSub.expirationDate).toISOString()
                : null,
              purchasedAt: new Date(activeSub.purchaseDate).toISOString(),
              planId: plan.id,
              environment: activeSub.environment,
            };
            localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(premiumState));

            // Also validate with server if we have the signed transaction
            // This ensures server has the latest subscription state
            if (activeSub.signedTransaction) {
              // Fire and forget - don't block the UI
              serverValidatePurchase(activeSub).catch(err => {
                logger.warn('Background server validation failed:', err);
              });
            }
          }
        }
      } else {
        // No active subscription - clear local storage
        localStorage.removeItem(PREMIUM_STORAGE_KEY);
      }

      logger.debug('Subscription status:', status);
    } catch (err) {
      logger.error('Failed to check subscription:', err);
    }
  }, []);

  // Validate purchase with server (wrapper that also updates local storage)
  const validatePurchaseWithServer = useCallback(async (
    purchase: PurchaseResult | RestoredPurchase
  ): Promise<boolean> => {
    const result = await serverValidatePurchase(purchase);

    // Update local storage with server-validated subscription
    if (result.success && result.subscription) {
      const premiumState = {
        tier: result.subscription.tier,
        expiresAt: result.subscription.expiresAt,
        purchasedAt: result.subscription.purchasedAt,
        planId: result.subscription.productId,
        validated: true,
        environment: result.subscription.environment,
      };
      localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(premiumState));
    }

    return result.success;
  }, []);

  // Purchase a product
  const purchaseProduct = useCallback(async (productId: string): Promise<PurchaseResult> => {
    try {
      setIsPurchasing(true);
      setError(null);

      logger.debug('Starting purchase:', productId);
      const result = await StoreKit.purchase({ productId });

      if (result.success) {
        // Validate with server before showing success
        const serverValidated = await validatePurchaseWithServer(result);

        if (serverValidated) {
          toast({
            title: 'Purchase Successful!',
            description: 'Thank you for your purchase.',
          });
        } else {
          toast({
            title: 'Purchase Processing',
            description: 'Your purchase is being verified. It may take a moment to activate.',
          });
        }

        // Refresh subscription status
        await checkSubscriptionStatus();
      } else if (result.cancelled) {
        // User cancelled - no toast needed
        logger.debug('Purchase cancelled by user');
      } else if (result.pending) {
        toast({
          title: 'Purchase Pending',
          description: 'Your purchase is awaiting approval.',
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      setError(errorMessage);
      toast({
        title: 'Purchase Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsPurchasing(false);
    }
  }, [toast, checkSubscriptionStatus, validatePurchaseWithServer]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.debug('Restoring purchases...');
      const result = await StoreKit.restorePurchases();

      if (result.success && result.restoredCount > 0) {
        // Validate each restored purchase with the server
        let validatedCount = 0;
        for (const purchase of result.purchases) {
          const validated = await validatePurchaseWithServer(purchase);
          if (validated) {
            validatedCount++;
          }
        }

        toast({
          title: 'Purchases Restored!',
          description: `${result.restoredCount} purchase(s) restored successfully.`,
        });

        // Refresh subscription status
        await checkSubscriptionStatus();
        return true;
      } else {
        toast({
          title: 'No Purchases Found',
          description: 'No previous purchases were found to restore.',
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore purchases';
      setError(errorMessage);
      toast({
        title: 'Restore Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, checkSubscriptionStatus, validatePurchaseWithServer]);

  // Open subscription management
  const manageSubscriptions = useCallback(async () => {
    try {
      await StoreKit.manageSubscriptions();
    } catch (err) {
      logger.error('Failed to open subscription management:', err);
      toast({
        title: 'Error',
        description: 'Failed to open subscription management.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Get product by ID
  const getProductById = useCallback((productId: string): StoreKitProduct | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await loadProducts();
      await checkSubscriptionStatus();
    };

    initialize();

    // Listen for transaction updates
    let removeListener: (() => void) | undefined;

    if (Capacitor.isNativePlatform()) {
      StoreKit.addListener('transactionUpdated', (data) => {
        logger.debug('Transaction updated:', data);
        checkSubscriptionStatus();
      }).then(({ remove }) => {
        removeListener = remove;
      }).catch((err) => {
        logger.error('Failed to add transaction listener:', err);
      });
    }

    return () => {
      removeListener?.();
    };
  }, [loadProducts, checkSubscriptionStatus]);

  return {
    products,
    subscriptionStatus,
    isLoading,
    isPurchasing,
    error,
    loadProducts,
    purchaseProduct,
    restorePurchases,
    checkSubscriptionStatus,
    manageSubscriptions,
    getProductById,
  };
};
