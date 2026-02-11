import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { StoreKit, StoreKitProduct, PurchaseResult, SubscriptionStatus, RestoredPurchase } from '@/plugins/store-kit';
import { SUBSCRIPTION_PLANS, dispatchSubscriptionChange } from './usePremiumStatus';
import { toast } from 'sonner';
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

interface CoinPackValidationResult {
  productId: string;
  coinsGranted: number;
  transactionId?: string;
  alreadyProcessed?: boolean;
}

interface BundleValidationResult {
  productId: string;
  coinsGranted: number;
  characterId?: string;
  boosterId?: string;
  streakFreezes: number;
  transactionId?: string;
  alreadyOwned?: boolean;
}

type ProductType = 'subscription' | 'coin_pack' | 'starter_bundle';

interface ServerValidationResponse {
  success: boolean;
  productType?: ProductType;
  subscription?: SubscriptionValidationResult;
  coinPack?: CoinPackValidationResult;
  bundle?: BundleValidationResult;
  requiresRetry?: boolean;
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
): Promise<ServerValidationResponse> {
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
      // Extract the actual error details from the response body when available.
      // supabase.functions.invoke puts the response body in error.context for non-2xx.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorContext = (error as any)?.context;
      const serverErrorMsg = errorContext && typeof errorContext === 'object' && 'error' in errorContext
        ? String(errorContext.error)
        : error.message;
      logger.error('Server validation error:', serverErrorMsg);

      // If the server returned a structured error body (e.g. JWS verification failed,
      // unknown product, revoked transaction), it's a definitive rejection.
      // Only mark as retryable for truly transient errors (network, auth).
      if (errorContext && typeof errorContext === 'object' && 'success' in errorContext) {
        return { success: false }; // Definitive server rejection
      }

      // SECURITY: Fail closed - transient errors mean validation couldn't complete
      return { success: false, requiresRetry: true };
    }

    if (data?.success) {
      logger.debug('Server validation successful:', data);
      return {
        success: true,
        productType: data.productType,
        subscription: data.subscription,
        coinPack: data.coinPack,
        bundle: data.bundle,
      };
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
  // Coin Packs (Consumables)
  'co.nomoinc.nomo.coins.value',
  'co.nomoinc.nomo.coins.premium',
  'co.nomoinc.nomo.coins.mega',
  'co.nomoinc.nomo.coins.ultra',
  'co.nomoinc.nomo.coins.legendary',
  // Starter Bundles (Non-Consumables)
  'co.nomoinc.nomo.bundle.welcome',
  'co.nomoinc.nomo.bundle.starter',
  'co.nomoinc.nomo.bundle.collector',
  'co.nomoinc.nomo.bundle.ultimate',
];

// Custom events for IAP fulfillment
export const IAP_EVENTS = {
  COINS_GRANTED: 'iap:coinsGranted',
  BUNDLE_GRANTED: 'iap:bundleGranted',
} as const;

export function dispatchCoinsGranted(coinsGranted: number) {
  window.dispatchEvent(new CustomEvent(IAP_EVENTS.COINS_GRANTED, {
    detail: { coinsGranted }
  }));
}

export function dispatchBundleGranted(bundle: BundleValidationResult) {
  window.dispatchEvent(new CustomEvent(IAP_EVENTS.BUNDLE_GRANTED, {
    detail: bundle
  }));
}

// Extended purchase result that includes server validation data
export interface ExtendedPurchaseResult extends PurchaseResult {
  validationResult?: ServerValidationResponse;
}

interface UseStoreKitReturn {
  products: StoreKitProduct[];
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;
  pluginAvailable: boolean;
  pluginError: Error | null;
  loadProducts: () => Promise<void>;
  purchaseProduct: (productId: string) => Promise<ExtendedPurchaseResult>;
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
  // Track if plugin has been verified
  const pluginVerifiedRef = useRef(false);
  // Mirror pluginAvailable in a ref so callbacks don't need it as a dependency.
  // This breaks the cycle: pluginAvailable change → callback recreated → useEffect re-run.
  const pluginAvailableRef = useRef(true);

  // Track initialization retry count
  const initRetryCountRef = useRef(0);
  const MAX_INIT_RETRIES = 3;

  // Guard against setState after unmount (retries fire on a timer)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Guard against the initialization useEffect running more than once
  const initStartedRef = useRef(false);

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
        setTimeout(() => { if (mountedRef.current) loadProducts(); }, retryDelay);
        return;
      }
      // On native platforms, the StoreKit plugin bridge is always available —
      // a product fetch failure just means products aren't configured in
      // App Store Connect yet or there's a transient network issue.
      if (Capacitor.isNativePlatform()) {
        logger.warn('Product fetch failed on native — plugin is still available for purchase attempts');
        pluginVerifiedRef.current = true;
        pluginAvailableRef.current = true;
        setPluginAvailable(true);
      } else if (!pluginVerifiedRef.current) {
        const err = new Error('StoreKit plugin not available on this platform');
        pluginAvailableRef.current = false;
        setPluginAvailable(false);
        setPluginError(err);
      }
      setError('Failed to load products. Please try again.');
    } else {
      pluginVerifiedRef.current = true;
      initRetryCountRef.current = 0;
      pluginAvailableRef.current = true;
      setPluginAvailable(true);
      setPluginError(null);
      setProducts(result.products);

      // Log which products were loaded vs. requested so we can
      // diagnose "purchase failed" for missing products.
      const loadedIds = new Set(result.products.map(p => p.id));
      const missingIds = ALL_PRODUCT_IDS.filter(id => !loadedIds.has(id));
      logger.debug(`Loaded ${result.products.length}/${ALL_PRODUCT_IDS.length} products`);
      if (missingIds.length > 0) {
        logger.warn('Products NOT found in App Store Connect:', missingIds);
      }
    }

    setIsLoading(false);
  }, []);

  // Check current subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!pluginAvailableRef.current) {
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
    // Check active subscriptions first, then look for lifetime purchase
    // in purchasedProducts (non-consumable bundles are also in purchasedProducts
    // but should NOT count as subscriptions)
    const activeSub = status.activeSubscriptions?.[0];
    const lifetimePurchase = status.purchasedProducts?.find(
      (p: { productId: string }) => SUBSCRIPTION_PLANS.some(plan => plan.iapProductId === p.productId)
    );
    const subscriptionProduct = activeSub || lifetimePurchase;

    if (subscriptionProduct) {
      const plan = SUBSCRIPTION_PLANS.find(p => p.iapProductId === subscriptionProduct.productId);
      if (plan) {
        const premiumState = {
          tier: plan.tier,
          expiresAt: subscriptionProduct.expirationDate
            ? new Date(subscriptionProduct.expirationDate).toISOString()
            : null,
          purchasedAt: new Date(subscriptionProduct.purchaseDate).toISOString(),
          planId: plan.id,
          environment: subscriptionProduct.environment,
        };
        try {
          localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(premiumState));
        } catch { /* storage full */ }

        // Dispatch subscription change event for other hooks (Battle Pass, streak freezes, etc.)
        dispatchSubscriptionChange(plan.tier);

        // Also validate with server if we have the signed transaction
        // This ensures server has the latest subscription state
        if (subscriptionProduct.signedTransaction) {
          // Fire and forget - don't block the UI
          serverValidatePurchase(subscriptionProduct).catch(err => {
            logger.warn('Background server validation failed:', err);
          });
        }
      }
    } else {
      // No active subscription or lifetime purchase - clear local storage
      try { localStorage.removeItem(PREMIUM_STORAGE_KEY); } catch { /* ignore */ }
      dispatchSubscriptionChange('free');
    }

    logger.debug('Subscription status:', status);
  }, []);

  // Keep a ref to products so purchaseProduct doesn't need it as a dependency
  const productsRef = useRef<StoreKitProduct[]>([]);
  useEffect(() => { productsRef.current = products; }, [products]);

  // Purchase a product
  const purchaseProduct = useCallback(async (productId: string): Promise<ExtendedPurchaseResult> => {
    const failedResult: ExtendedPurchaseResult = {
      success: false,
      message: 'Purchase failed',
    };

    if (!pluginAvailableRef.current) {
      toast.error('Purchases Unavailable', {
        description: 'In-app purchases are not available. Please restart the app.',
      });
      return { ...failedResult, message: 'Plugin unavailable' };
    }

    // Check if the product was in the initial bulk load. If not, log a
    // warning but still attempt the purchase — the native StoreKit layer
    // will try to fetch the product individually and may succeed even when
    // the bulk getProducts() call didn't return it (Apple sandbox quirk).
    const loadedProduct = productsRef.current.find(p => p.id === productId);
    if (!loadedProduct) {
      logger.warn(`Product "${productId}" not in pre-loaded list — attempting direct purchase via native StoreKit`);
    }

    setIsPurchasing(true);
    setError(null);

    try {
      logger.debug('Starting purchase:', productId, loadedProduct ? `(${loadedProduct.displayName})` : '(not pre-loaded)');
      const { result, success } = await safeStoreKitCall(
        () => StoreKit.purchase({ productId }),
        failedResult,
        'purchase'
      );

      if (!success) {
        setError('Purchase failed. Please try again.');
        toast.error('Purchase Failed', {
          description: `Could not purchase "${loadedProduct?.displayName || productId}". Check your internet connection and try again.`,
          duration: 5000,
        });
        return result;
      }

      if (result.success) {
        // SECURITY: Validate with server before granting access
        const validationResult = await serverValidatePurchase(result);

        if (validationResult.success) {
          // Server validated — finish the transaction with Apple.
          // This tells Apple the purchase was delivered to the user.
          // Must await so Apple doesn't re-deliver on next launch.
          if (result.transactionId) {
            await safeStoreKitCall(
              () => StoreKit.finishTransaction({ transactionId: result.transactionId! }),
              { success: false },
              'finishTransaction'
            );
          }

          // Handle different product types
          if (validationResult.productType === 'subscription' && validationResult.subscription) {
            // Update local storage with server-validated subscription
            const premiumState = {
              tier: validationResult.subscription.tier,
              expiresAt: validationResult.subscription.expiresAt,
              purchasedAt: validationResult.subscription.purchasedAt,
              planId: validationResult.subscription.productId,
              validated: true,
              environment: validationResult.subscription.environment,
            };
            try {
              localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(premiumState));
            } catch { /* storage full */ }
            // Refresh subscription status
            await checkSubscriptionStatus();
          } else if (validationResult.productType === 'coin_pack' && validationResult.coinPack) {
            // Dispatch event for coin balance refresh
            dispatchCoinsGranted(validationResult.coinPack.coinsGranted);
            logger.debug('Coins granted:', validationResult.coinPack.coinsGranted);
          } else if (validationResult.productType === 'starter_bundle' && validationResult.bundle) {
            // Only dispatch grant events for NEW purchases, not already-owned bundles
            if (!validationResult.bundle.alreadyOwned) {
              dispatchCoinsGranted(validationResult.bundle.coinsGranted);
              dispatchBundleGranted(validationResult.bundle);
              logger.debug('Bundle granted:', validationResult.bundle);
            } else {
              logger.debug('Bundle already owned, skipping grant:', validationResult.bundle);
            }
          }

          // Return success with validation data for caller to use
          return { ...result, validationResult };
        } else if (validationResult.requiresRetry) {
          // SECURITY: Validation failed but may succeed on retry (network issue, etc.)
          // Transaction is NOT finished — Apple will retry delivery on next app launch.
          toast.error('Verification Pending', {
            description: 'Unable to verify purchase right now. Your payment is safe — try "Restore Purchases" later.',
            duration: 6000,
          });
          // Don't grant access - user needs to restore purchases
        } else {
          // SECURITY: Validation failed definitively
          // Transaction is NOT finished — so Apple may refund or retry.
          toast.error('Verification Failed', {
            description: 'Purchase could not be verified. Try "Restore Purchases" or contact support.',
            duration: 6000,
          });
          // Don't grant access
        }
      } else if (result.cancelled) {
        // User cancelled - no toast needed
        logger.debug('Purchase cancelled by user');
      } else if (result.pending) {
        toast.info('Purchase Pending', {
          description: 'Your purchase is awaiting approval.',
        });
      }

      return result;
    } finally {
      setIsPurchasing(false);
    }
  }, [checkSubscriptionStatus]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!pluginAvailableRef.current) {
      toast.error('Restore Unavailable', {
        description: 'In-app purchases are not available. Please restart the app.',
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
      toast.error('Restore Failed', {
        description: 'Unable to restore purchases. Please try again.',
      });
      return false;
    }

    if (result.success && result.restoredCount > 0) {
      // SECURITY: Validate each restored purchase with the server (fail-closed)
      let validatedCount = 0;

      for (const purchase of result.purchases) {
        const validationResult = await serverValidatePurchase(purchase);
        if (validationResult.success) {
          // Handle different product types
          if (validationResult.productType === 'subscription' && validationResult.subscription) {
            // Update local storage with server-validated subscription
            const premiumState = {
              tier: validationResult.subscription.tier,
              expiresAt: validationResult.subscription.expiresAt,
              purchasedAt: validationResult.subscription.purchasedAt,
              planId: validationResult.subscription.productId,
              validated: true,
              environment: validationResult.subscription.environment,
            };
            try {
              localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(premiumState));
            } catch { /* storage full */ }
          } else if (validationResult.productType === 'starter_bundle' && validationResult.bundle) {
            // For bundles: always dispatch to restore characters/boosters/freezes on new devices
            // Server returns coinsGranted=0 when alreadyOwned, so no double coin grant
            dispatchBundleGranted(validationResult.bundle);
            // Only sync coins if this is a new purchase (not alreadyOwned)
            if (!validationResult.bundle.alreadyOwned && validationResult.bundle.coinsGranted > 0) {
              dispatchCoinsGranted(validationResult.bundle.coinsGranted);
            }
          }
          // Note: coin packs are consumable and NOT restored (they were already used)

          // Finish the restored transaction so Apple doesn't re-deliver it
          if (purchase.transactionId) {
            await safeStoreKitCall(
              () => StoreKit.finishTransaction({ transactionId: purchase.transactionId! }),
              { success: false },
              'finishTransaction'
            );
          }
          validatedCount++;
        } else {
          // Log but don't track count since we show generic error anyway
          logger.warn('Failed to validate restored purchase:', purchase.productId);
        }
      }

      if (validatedCount > 0) {
        toast.success('Purchases Restored!', {
          description: `${validatedCount} purchase(s) restored successfully.`,
        });

        // Refresh subscription status
        await checkSubscriptionStatus();
        setIsLoading(false);
        return true;
      } else {
        // SECURITY: No purchases could be validated - don't grant access
        toast.error('Restore Failed', {
          description: 'Unable to verify purchases. Please check your connection and try again.',
        });
        setIsLoading(false);
        return false;
      }
    } else {
      toast.info('No Purchases Found', {
        description: 'No previous purchases were found to restore.',
      });
      setIsLoading(false);
      return false;
    }
  }, [checkSubscriptionStatus]);

  // Open subscription management — re-check status when user returns
  const manageSubscriptions = useCallback(async () => {
    if (!pluginAvailableRef.current) {
      toast.error('Feature Unavailable', {
        description: 'Subscription management is not available. Please restart the app.',
      });
      return;
    }

    const { success } = await safeStoreKitCall(
      () => StoreKit.manageSubscriptions(),
      { success: false },
      'manageSubscriptions'
    );

    if (!success) {
      toast.error('Error', {
        description: 'Failed to open subscription management.',
      });
    }

    // After returning from subscription management, re-check status
    // (user may have cancelled, upgraded, or downgraded)
    await checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  // Get product by ID
  const getProductById = useCallback((productId: string): StoreKitProduct | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  // Initialize on mount — runs exactly once per hook instance.
  // Dependencies intentionally omitted to prevent the re-initialization loop
  // caused by pluginAvailable → checkSubscriptionStatus → useEffect cascade.
  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const initialize = async () => {
      await loadProducts();
      await checkSubscriptionStatus();
    };

    initialize();

    // Listen for transaction updates
    let cancelled = false;
    let listenerHandle: { remove: () => void } | null = null;

    if (Capacitor.isNativePlatform()) {
      StoreKit.addListener('transactionUpdated', (data) => {
        logger.debug('Transaction updated:', data);
        checkSubscriptionStatus();
      }).then((handle) => {
        if (cancelled) {
          // Effect already cleaned up before listener registered — remove immediately
          handle.remove();
        } else {
          listenerHandle = handle;
        }
      }).catch((err) => {
        logger.error('Failed to add transaction listener:', err);
        // Don't mark plugin as unavailable - listener failure is non-critical
      });
    }

    // Periodically re-check subscription status so expired subscriptions
    // are detected without requiring an app restart or transactionUpdated event.
    const SUB_CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
    const subCheckInterval = setInterval(() => {
      if (!document.hidden) {
        checkSubscriptionStatus();
      }
    }, SUB_CHECK_INTERVAL_MS);

    // Re-check when app returns from background (e.g., after user visits
    // Settings > Subscriptions to cancel/upgrade)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSubscriptionStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      listenerHandle?.remove();
      clearInterval(subCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
