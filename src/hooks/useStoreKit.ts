import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { StoreKit, StoreKitProduct, PurchaseResult, SubscriptionStatus, RestoredPurchase } from '@/plugins/store-kit';
import { SUBSCRIPTION_PLANS, dispatchSubscriptionChange } from './usePremiumStatus';
import { useToast } from './use-toast';
import { storeKitLogger as logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { reportError } from '@/lib/errorReporting';

/**
 * Safe wrapper for StoreKit plugin calls with fallback and error reporting
 */
async function safeStoreKitCall<T>(
  pluginCall: () => Promise<T>,
  fallback: T,
  errorContext: string
): Promise<{ result: T; success: boolean }> {
  try {
    const result = await pluginCall();
    return { result, success: true };
  } catch (error) {
    logger.error(`[${errorContext}] Plugin call failed:`, error);
    if (error instanceof Error) {
      reportError(error, { context: errorContext, plugin: 'StoreKit' });
    }
    return { result: fallback, success: false };
  }
}

const PREMIUM_STORAGE_KEY = 'petIsland_premium';

/**
 * Validate a purchase with the server
 * Standalone function to avoid circular dependency issues
 */
interface SubscriptionValidationResult {
  tier?: string;
  expiresAt?: string;
  purchasedAt?: string;
  productId?: string;
  environment?: string;
}

async function serverValidatePurchase(
  purchase: PurchaseResult | RestoredPurchase
): Promise<{ success: boolean; subscription?: SubscriptionValidationResult }> {
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
  pluginAvailable: boolean;
  pluginError: Error | null;
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
  const [pluginAvailable, setPluginAvailable] = useState(true);
  const [pluginError, setPluginError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Track if plugin has been verified
  const pluginVerifiedRef = useRef(false);

  // Load products from App Store
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { result, success } = await safeStoreKitCall(
      () => StoreKit.getProducts({ productIds: ALL_PRODUCT_IDS }),
      { products: [] },
      'getProducts'
    );

    if (!success) {
      // Check if this is a plugin availability issue
      if (!pluginVerifiedRef.current) {
        const err = new Error('StoreKit plugin initialization failed');
        setPluginAvailable(false);
        setPluginError(err);
      }
      setError('Failed to load products. Please try again.');
    } else {
      pluginVerifiedRef.current = true;
      setPluginAvailable(true);
      setPluginError(null);
      setProducts(result.products);
      logger.debug('Loaded products:', result.products.length);
    }

    setIsLoading(false);
  }, []);

  // Check current subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!pluginAvailable) {
      logger.debug('Skipping subscription check - plugin unavailable');
      return;
    }

    const { result: status, success } = await safeStoreKitCall(
      () => StoreKit.getSubscriptionStatus(),
      { hasActiveSubscription: false, activeSubscriptions: [], purchasedProducts: [] },
      'getSubscriptionStatus'
    );

    if (!success) {
      logger.error('Failed to check subscription status');
      return;
    }

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

          // Dispatch subscription change event for other hooks (Battle Pass, streak freezes, etc.)
          dispatchSubscriptionChange(plan.tier);

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
      dispatchSubscriptionChange('free');
    }

    logger.debug('Subscription status:', status);
  }, [pluginAvailable]);

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
    const failedResult: PurchaseResult = {
      success: false,
      message: 'Purchase failed',
    };

    if (!pluginAvailable) {
      toast({
        title: 'Purchases Unavailable',
        description: 'In-app purchases are not available. Please restart the app.',
        variant: 'destructive',
      });
      return { ...failedResult, message: 'Plugin unavailable' };
    }

    setIsPurchasing(true);
    setError(null);

    logger.debug('Starting purchase:', productId);
    const { result, success } = await safeStoreKitCall(
      () => StoreKit.purchase({ productId }),
      failedResult,
      'purchase'
    );

    if (!success) {
      setIsPurchasing(false);
      setError('Purchase failed. Please try again.');
      toast({
        title: 'Purchase Failed',
        description: 'Unable to complete the purchase. Please try again.',
        variant: 'destructive',
      });
      return result;
    }

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

    setIsPurchasing(false);
    return result;
  }, [toast, checkSubscriptionStatus, validatePurchaseWithServer, pluginAvailable]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!pluginAvailable) {
      toast({
        title: 'Restore Unavailable',
        description: 'In-app purchases are not available. Please restart the app.',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    setError(null);

    logger.debug('Restoring purchases...');
    const { result, success } = await safeStoreKitCall(
      () => StoreKit.restorePurchases(),
      { success: false, restoredCount: 0, purchases: [] },
      'restorePurchases'
    );

    if (!success) {
      setIsLoading(false);
      setError('Failed to restore purchases. Please try again.');
      toast({
        title: 'Restore Failed',
        description: 'Unable to restore purchases. Please try again.',
        variant: 'destructive',
      });
      return false;
    }

    if (result.success && result.restoredCount > 0) {
      // Validate each restored purchase with the server
      for (const purchase of result.purchases) {
        await validatePurchaseWithServer(purchase);
      }

      toast({
        title: 'Purchases Restored!',
        description: `${result.restoredCount} purchase(s) restored successfully.`,
      });

      // Refresh subscription status
      await checkSubscriptionStatus();
      setIsLoading(false);
      return true;
    } else {
      toast({
        title: 'No Purchases Found',
        description: 'No previous purchases were found to restore.',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, checkSubscriptionStatus, validatePurchaseWithServer, pluginAvailable]);

  // Open subscription management
  const manageSubscriptions = useCallback(async () => {
    if (!pluginAvailable) {
      toast({
        title: 'Feature Unavailable',
        description: 'Subscription management is not available. Please restart the app.',
        variant: 'destructive',
      });
      return;
    }

    const { success } = await safeStoreKitCall(
      () => StoreKit.manageSubscriptions(),
      { success: false },
      'manageSubscriptions'
    );

    if (!success) {
      toast({
        title: 'Error',
        description: 'Failed to open subscription management.',
        variant: 'destructive',
      });
    }
  }, [toast, pluginAvailable]);

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
        // Don't mark plugin as unavailable - listener failure is non-critical
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
    pluginAvailable,
    pluginError,
    loadProducts,
    purchaseProduct,
    restorePurchases,
    checkSubscriptionStatus,
    manageSubscriptions,
    getProductById,
  };
};
