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

/**
 * SECURITY: Server-side purchase validation
 *
 * CRITICAL: This function now follows fail-closed security pattern.
 * Any validation failure returns { success: false } to prevent unauthorized access.
 * Users must retry or restore purchases on failure.
 */
async function serverValidatePurchase(
  purchase: PurchaseResult | RestoredPurchase
): Promise<{ success: boolean; subscription?: SubscriptionValidationResult; requiresRetry?: boolean }> {
  try {
    // SECURITY: Require authentication for validation
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      logger.warn('User not authenticated - validation requires sign-in');
      // SECURITY: Fail closed - require authentication for premium features
      return { success: false, requiresRetry: true };
    }

    // SECURITY: Require all necessary fields for validation
    if (!purchase.signedTransaction || !purchase.transactionId || !purchase.productId) {
      logger.error('Missing required fields for server validation - rejecting');
      // SECURITY: Fail closed - missing data means invalid purchase
      return { success: false };
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

    // SECURITY: Server errors should fail closed, not grant access
    if (error) {
      logger.error('Server validation error:', error);
      // SECURITY: Fail closed - server errors mean validation failed
      // User should retry the validation
      return { success: false, requiresRetry: true };
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
    // SECURITY: Fail closed - exceptions mean validation failed
    // User should retry the validation
    return { success: false, requiresRetry: true };
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

  // Track initialization retry count
  const initRetryCountRef = useRef(0);
  const MAX_INIT_RETRIES = 3;

  // Load products from App Store with automatic retry on first failure
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { result, success } = await safeStoreKitCall(
      () => StoreKit.getProducts({ productIds: ALL_PRODUCT_IDS }),
      { products: [] },
      'getProducts'
    );

    if (!success) {
      // On first load failure, schedule a retry instead of permanently marking unavailable
      if (!pluginVerifiedRef.current && initRetryCountRef.current < MAX_INIT_RETRIES) {
        initRetryCountRef.current += 1;
        const retryDelay = Math.pow(2, initRetryCountRef.current) * 1000; // 2s, 4s, 8s
        logger.debug(`StoreKit init failed, scheduling retry ${initRetryCountRef.current}/${MAX_INIT_RETRIES} in ${retryDelay}ms`);
        setError('Loading products...');
        setIsLoading(false);
        setTimeout(() => { loadProducts(); }, retryDelay);
        return;
      }
      // All retries exhausted — mark as unavailable
      if (!pluginVerifiedRef.current) {
        const err = new Error('StoreKit plugin initialization failed');
        setPluginAvailable(false);
        setPluginError(err);
      }
      setError('Failed to load products. Please try again.');
    } else {
      pluginVerifiedRef.current = true;
      initRetryCountRef.current = 0;
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
      // SECURITY: Validate with server before granting access
      const validationResult = await serverValidatePurchase(result);

      if (validationResult.success) {
        // Update local storage with server-validated subscription
        if (validationResult.subscription) {
          const premiumState = {
            tier: validationResult.subscription.tier,
            expiresAt: validationResult.subscription.expiresAt,
            purchasedAt: validationResult.subscription.purchasedAt,
            planId: validationResult.subscription.productId,
            validated: true,
            environment: validationResult.subscription.environment,
          };
          localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(premiumState));
        }

        toast({
          title: 'Purchase Successful!',
          description: 'Thank you for your purchase.',
        });

        // Refresh subscription status
        await checkSubscriptionStatus();
      } else if (validationResult.requiresRetry) {
        // SECURITY: Validation failed but may succeed on retry (network issue, etc.)
        toast({
          title: 'Verification Pending',
          description: 'Unable to verify purchase. Please try restoring purchases or check your connection.',
          variant: 'destructive',
        });
        // Don't grant access - user needs to restore purchases
      } else {
        // SECURITY: Validation failed definitively
        toast({
          title: 'Verification Failed',
          description: 'Purchase could not be verified. Please contact support if this persists.',
          variant: 'destructive',
        });
        // Don't grant access
      }
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
  }, [toast, checkSubscriptionStatus, pluginAvailable]);

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
      // SECURITY: Validate each restored purchase with the server (fail-closed)
      let validatedCount = 0;

      for (const purchase of result.purchases) {
        const validationResult = await serverValidatePurchase(purchase);
        if (validationResult.success) {
          // Update local storage with server-validated subscription
          if (validationResult.subscription) {
            const premiumState = {
              tier: validationResult.subscription.tier,
              expiresAt: validationResult.subscription.expiresAt,
              purchasedAt: validationResult.subscription.purchasedAt,
              planId: validationResult.subscription.productId,
              validated: true,
              environment: validationResult.subscription.environment,
            };
            localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(premiumState));
          }
          validatedCount++;
        } else {
          // Log but don't track count since we show generic error anyway
          logger.warn('Failed to validate restored purchase:', purchase.productId);
        }
      }

      if (validatedCount > 0) {
        toast({
          title: 'Purchases Restored!',
          description: `${validatedCount} purchase(s) restored successfully.`,
        });

        // Refresh subscription status
        await checkSubscriptionStatus();
        setIsLoading(false);
        return true;
      } else {
        // SECURITY: No purchases could be validated - don't grant access
        toast({
          title: 'Restore Failed',
          description: 'Unable to verify purchases. Please check your connection and try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return false;
      }
    } else {
      toast({
        title: 'No Purchases Found',
        description: 'No previous purchases were found to restore.',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast, checkSubscriptionStatus, pluginAvailable]);

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
