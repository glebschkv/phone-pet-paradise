import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { safeJsonParse } from '@/lib/apiUtils';
import { logger } from '@/lib/logger';
import { useIsGuestMode } from '@/stores/authStore';

const PREMIUM_STORAGE_KEY = 'petIsland_premium';
const LAST_VERIFICATION_KEY = 'petIsland_premium_lastVerified';
// SECURITY: Verify premium status with server periodically
const SERVER_VERIFICATION_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes

export type SubscriptionTier = 'free' | 'premium' | 'premium_plus' | 'lifetime';

const VALID_SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = ['free', 'premium', 'premium_plus', 'lifetime'];

/**
 * Type guard to validate if a value is a valid SubscriptionTier
 * Prevents implicit type coercion when loading data from storage
 */
export function isValidSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === 'string' && VALID_SUBSCRIPTION_TIERS.includes(value as SubscriptionTier);
}

// Multipliers and benefits per tier
export type AnalyticsAccess = 'basic' | 'full';

export const TIER_BENEFITS = {
  free: {
    coinMultiplier: 1,
    xpMultiplier: 1,
    monthlyStreakFreezes: 0,
    bonusCoinsMonthly: 0,
    bonusCoinsYearly: 0,
    battlePassIncluded: false,
    soundMixingSlots: 1,
    focusPresetSlots: 1,
    dailySpinLimit: 1,
    loginCoinMultiplier: 1,
    analyticsAccess: 'basic' as AnalyticsAccess,
  },
  premium: {
    coinMultiplier: 1.5,
    xpMultiplier: 1.5,
    monthlyStreakFreezes: 2,
    bonusCoinsMonthly: 500,
    bonusCoinsYearly: 1500,
    battlePassIncluded: false,
    soundMixingSlots: 2,
    focusPresetSlots: 3,
    dailySpinLimit: 2,
    loginCoinMultiplier: 1.5,
    analyticsAccess: 'full' as AnalyticsAccess,
  },
  premium_plus: {
    coinMultiplier: 2,
    xpMultiplier: 2,
    monthlyStreakFreezes: 5,
    bonusCoinsMonthly: 1500,
    bonusCoinsYearly: 5000,
    battlePassIncluded: true,
    soundMixingSlots: 3,
    focusPresetSlots: 5,
    dailySpinLimit: 3,
    loginCoinMultiplier: 2,
    analyticsAccess: 'full' as AnalyticsAccess,
  },
  lifetime: {
    coinMultiplier: 2.5,
    xpMultiplier: 2.5,
    monthlyStreakFreezes: 7,
    bonusCoinsMonthly: 0, // One-time only
    bonusCoinsYearly: 0,
    bonusCoinsLifetime: 10000,
    battlePassIncluded: true,
    soundMixingSlots: 3,
    focusPresetSlots: 10,
    dailySpinLimit: 3,
    loginCoinMultiplier: 2,
    analyticsAccess: 'full' as AnalyticsAccess,
  },
} as const;

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: string;
  priceValue: number; // Numeric value for calculations
  period: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  iapProductId: string;
  savings?: string;
  isPopular?: boolean;
  bonusCoins: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium-monthly',
    tier: 'premium',
    name: 'Premium',
    description: 'Boost your progress',
    price: '$4.99',
    priceValue: 4.99,
    period: 'monthly',
    features: [
      '1.5x Coin & XP multiplier',
      '2 Lucky Wheel spins/day',
      '1.5x Daily login coins',
      'Full analytics dashboard',
      'All 13 ambient sounds',
      'Auto-break Pomodoro cycles',
      '2 Streak Freezes/month',
      'Sound mixing (2 layers)',
    ],
    iapProductId: 'co.nomoinc.nomo.premium.monthly',
    bonusCoins: 500,
  },
  {
    id: 'premium-yearly',
    tier: 'premium',
    name: 'Premium',
    description: 'Boost your progress',
    price: '$39.99',
    priceValue: 39.99,
    period: 'yearly',
    features: [
      '1.5x Coin & XP multiplier',
      '2 Lucky Wheel spins/day',
      '1.5x Daily login coins',
      'Full analytics dashboard',
      'All 13 ambient sounds',
      'Auto-break Pomodoro cycles',
      '2 Streak Freezes/month',
      'Sound mixing (2 layers)',
    ],
    iapProductId: 'co.nomoinc.nomo.premium.yearly',
    savings: 'Save 33%',
    isPopular: true,
    bonusCoins: 1500,
  },
  {
    id: 'premium-plus-monthly',
    tier: 'premium_plus',
    name: 'Premium+',
    description: 'Maximum rewards',
    price: '$8.99',
    priceValue: 8.99,
    period: 'monthly',
    features: [
      '2x Coin & XP multiplier',
      '3 Lucky Wheel spins/day',
      '2x Daily login coins',
      'Everything in Premium',
      'Battle Pass Premium included',
      '5 Streak Freezes/month',
      'Sound mixing (3 layers)',
      'Exclusive profile frames',
    ],
    iapProductId: 'co.nomoinc.nomo.premiumplus.monthly',
    bonusCoins: 1500,
  },
  {
    id: 'premium-plus-yearly',
    tier: 'premium_plus',
    name: 'Premium+',
    description: 'Maximum rewards',
    price: '$64.99',
    priceValue: 64.99,
    period: 'yearly',
    features: [
      '2x Coin & XP multiplier',
      '3 Lucky Wheel spins/day',
      '2x Daily login coins',
      'Everything in Premium',
      'Battle Pass Premium included',
      '5 Streak Freezes/month',
      'Sound mixing (3 layers)',
      'Exclusive profile frames',
    ],
    iapProductId: 'co.nomoinc.nomo.premiumplus.yearly',
    savings: 'Save 40%',
    bonusCoins: 5000,
  },
  {
    id: 'premium-lifetime',
    tier: 'lifetime',
    name: 'Lifetime',
    description: 'Forever access + founder perks',
    price: '$149.99',
    priceValue: 149.99,
    period: 'lifetime',
    features: [
      '2.5x Coin & XP multiplier',
      '3 Lucky Wheel spins/day',
      '2x Daily login coins',
      'Everything in Premium+',
      'No recurring fees ever',
      'Exclusive Founder badge',
      'Founder-only legendary pet',
      '10 Focus presets',
    ],
    iapProductId: 'co.nomoinc.nomo.lifetime',
    savings: 'Best Value',
    bonusCoins: 10000,
  },
];

// Battle Pass Premium as separate purchase
export const BATTLE_PASS_PLANS = [
  {
    id: 'battlepass-premium',
    name: 'Battle Pass Premium',
    description: 'Unlock premium track rewards',
    price: '$4.99',
    priceValue: 4.99,
    iapProductId: 'co.nomoinc.nomo.battlepass.premium',
  },
  {
    id: 'battlepass-premium-plus',
    name: 'Battle Pass + 10 Tiers',
    description: 'Premium track + skip 10 levels',
    price: '$9.99',
    priceValue: 9.99,
    iapProductId: 'co.nomoinc.nomo.battlepass.premium.plus',
    bonusTiers: 10,
  },
];

interface PremiumState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  purchasedAt: string | null;
  planId: string | null;
  lastStreakFreezeGrant?: string; // ISO date of last monthly grant
  bonusCoinsGrantedForPlan?: string; // Plan ID that bonus coins were granted for
}

const defaultState: PremiumState = {
  tier: 'free',
  expiresAt: null,
  purchasedAt: null,
  planId: null,
};

// Event for notifying other hooks about subscription changes
const SUBSCRIPTION_CHANGE_EVENT = 'petIsland_subscriptionChange';

// Helper to dispatch subscription change events
export const dispatchSubscriptionChange = (tier: SubscriptionTier) => {
  window.dispatchEvent(new CustomEvent(SUBSCRIPTION_CHANGE_EVENT, { detail: { tier } }));
};

export const usePremiumStatus = () => {
  const [state, setState] = useState<PremiumState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationInProgressRef = useRef(false);

  // SECURITY: Guest users cannot have premium status
  const isGuestMode = useIsGuestMode();

  /**
   * SECURITY: Verify premium status with server
   * Server is authoritative - if server says no subscription, clear local state
   */
  const verifyWithServer = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent verification
    if (verificationInProgressRef.current) {
      return false;
    }

    if (!isSupabaseConfigured) {
      logger.debug('Supabase not configured, skipping server verification');
      return false;
    }

    verificationInProgressRef.current = true;
    setIsVerifying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Not authenticated, can't verify
        logger.debug('User not authenticated, skipping server verification');
        return false;
      }

      // Call the server function to get the user's actual subscription tier
      const { data, error } = await supabase.rpc('get_user_subscription_tier', {
        p_user_id: user.id
      });

      if (error) {
        logger.error('Failed to verify subscription with server:', error);
        // SECURITY: On error, don't change state - fail safe but allow cached state
        // This prevents network issues from locking out legitimate subscribers
        return false;
      }

      // Server returns array with one element or empty array
      const serverSub = data?.[0];

      if (!serverSub || !serverSub.tier || serverSub.tier === 'free') {
        // SECURITY: Server says no subscription - clear local state
        const localState = safeJsonParse<PremiumState>(
          localStorage.getItem(PREMIUM_STORAGE_KEY) || '',
          defaultState
        );

        if (localState.tier !== 'free') {
          logger.warn('SECURITY: Server says no subscription but local has premium - clearing local state');
          setState(defaultState);
          localStorage.removeItem(PREMIUM_STORAGE_KEY);
          dispatchSubscriptionChange('free');
        }

        localStorage.setItem(LAST_VERIFICATION_KEY, Date.now().toString());
        return true;
      }

      // Server has a valid subscription
      const serverTier = serverSub.tier as SubscriptionTier;

      // Check if local state matches server
      const localState = safeJsonParse<PremiumState>(
        localStorage.getItem(PREMIUM_STORAGE_KEY) || '',
        defaultState
      );

      if (localState.tier !== serverTier) {
        logger.info(`SECURITY: Syncing subscription tier from server: ${serverTier}`);

        const newState: PremiumState = {
          tier: serverTier,
          expiresAt: serverSub.expires_at || null,
          purchasedAt: localState.purchasedAt, // Preserve local purchase date
          planId: localState.planId,
          lastStreakFreezeGrant: localState.lastStreakFreezeGrant,
          bonusCoinsGrantedForPlan: localState.bonusCoinsGrantedForPlan,
        };

        setState(newState);
        localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(newState));
        dispatchSubscriptionChange(serverTier);
      } else if (serverSub.expires_at && localState.expiresAt !== serverSub.expires_at) {
        // Update expiration if different
        const newState = {
          ...localState,
          expiresAt: serverSub.expires_at,
        };
        setState(newState);
        localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(newState));
      }

      localStorage.setItem(LAST_VERIFICATION_KEY, Date.now().toString());
      logger.debug('Server verification complete, tier:', serverTier);
      return true;

    } catch (err) {
      logger.error('Error verifying subscription with server:', err);
      return false;
    } finally {
      verificationInProgressRef.current = false;
      setIsVerifying(false);
    }
  }, []);

  // Load subscription status and trigger initial verification
  useEffect(() => {
    const saved = localStorage.getItem(PREMIUM_STORAGE_KEY);
    if (saved) {
      const parsed = safeJsonParse<PremiumState>(saved, defaultState);
      // Check if subscription is still valid
      if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
        // Subscription expired
        setState(defaultState);
        localStorage.removeItem(PREMIUM_STORAGE_KEY);
        logger.debug('Subscription expired, clearing state');
      } else if (parsed.tier !== 'free') {
        setState(parsed);
        logger.debug('Loaded subscription state:', parsed.tier);
      }
    }
    setIsLoading(false);

    // SECURITY: Trigger server verification after loading local state
    const lastVerified = localStorage.getItem(LAST_VERIFICATION_KEY);
    const timeSinceVerification = lastVerified
      ? Date.now() - parseInt(lastVerified, 10)
      : Infinity;

    // Verify if never verified or verification is stale
    if (timeSinceVerification > SERVER_VERIFICATION_INTERVAL_MS) {
      // Delay slightly to allow auth to initialize
      const timeoutId = setTimeout(() => {
        verifyWithServer();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [verifyWithServer]);

  // SECURITY: Periodic server verification
  useEffect(() => {
    if (isLoading) return;

    const intervalId = setInterval(() => {
      verifyWithServer();
    }, SERVER_VERIFICATION_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isLoading, verifyWithServer]);

  // Listen for subscription changes from other sources (e.g., StoreKit)
  // This keeps usePremiumStatus in sync when localStorage is updated externally
  useEffect(() => {
    const handleSubscriptionChange = (event: CustomEvent<{ tier: SubscriptionTier }>) => {
      const newTier = event.detail.tier;
      logger.debug('Subscription change event received:', newTier);

      // Reload state from localStorage to get full premium state
      const saved = localStorage.getItem(PREMIUM_STORAGE_KEY);
      if (saved) {
        const parsed = safeJsonParse<PremiumState>(saved, defaultState);
        if (parsed.tier === newTier) {
          setState(parsed);
        }
      } else if (newTier === 'free') {
        setState(defaultState);
      }
    };

    window.addEventListener(SUBSCRIPTION_CHANGE_EVENT, handleSubscriptionChange as EventListener);
    return () => {
      window.removeEventListener(SUBSCRIPTION_CHANGE_EVENT, handleSubscriptionChange as EventListener);
    };
  }, []);

  // Get effective tier (lifetime is treated as premium_plus for features)
  // SECURITY: Guest users are always treated as free tier
  const effectiveTier = isGuestMode ? 'free' : (state.tier === 'lifetime' ? 'lifetime' : state.tier);

  // SECURITY: Guest users cannot have premium status - must sign up first
  const isPremium = !isGuestMode && (state.tier === 'premium' || state.tier === 'premium_plus' || state.tier === 'lifetime');
  const isPremiumPlus = !isGuestMode && (state.tier === 'premium_plus' || state.tier === 'lifetime');
  const isLifetime = !isGuestMode && state.tier === 'lifetime';

  // Get current tier benefits
  const getTierBenefits = useCallback(() => {
    return TIER_BENEFITS[effectiveTier] || TIER_BENEFITS.free;
  }, [effectiveTier]);

  // Get multipliers
  const getCoinMultiplier = useCallback(() => {
    return getTierBenefits().coinMultiplier;
  }, [getTierBenefits]);

  const getXPMultiplier = useCallback(() => {
    return getTierBenefits().xpMultiplier;
  }, [getTierBenefits]);

  // Get sound mixing slots
  const getSoundMixingSlots = useCallback(() => {
    return getTierBenefits().soundMixingSlots;
  }, [getTierBenefits]);

  // Get focus preset slots
  const getFocusPresetSlots = useCallback(() => {
    return getTierBenefits().focusPresetSlots;
  }, [getTierBenefits]);

  // Check if Battle Pass Premium is included
  const hasBattlePassIncluded = useCallback(() => {
    return getTierBenefits().battlePassIncluded;
  }, [getTierBenefits]);

  // Get monthly streak freezes allowance
  const getMonthlyStreakFreezes = useCallback(() => {
    return getTierBenefits().monthlyStreakFreezes;
  }, [getTierBenefits]);

  // Get daily lucky wheel spin limit
  const getDailySpinLimit = useCallback(() => {
    return getTierBenefits().dailySpinLimit;
  }, [getTierBenefits]);

  // Get daily login coin multiplier
  const getLoginCoinMultiplier = useCallback(() => {
    return getTierBenefits().loginCoinMultiplier;
  }, [getTierBenefits]);

  // Check if user has full analytics access
  const hasFullAnalytics = useCallback(() => {
    return getTierBenefits().analyticsAccess === 'full';
  }, [getTierBenefits]);

  // Check and grant monthly streak freezes if needed
  const checkAndGrantMonthlyStreakFreezes = useCallback((): { granted: boolean; amount: number } => {
    if (state.tier === 'free') {
      return { granted: false, amount: 0 };
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;

    // Check if we already granted this month
    const lastGrant = state.lastStreakFreezeGrant;
    if (lastGrant) {
      const lastGrantDate = new Date(lastGrant);
      const lastGrantMonth = `${lastGrantDate.getFullYear()}-${lastGrantDate.getMonth()}`;
      if (lastGrantMonth === currentMonth) {
        return { granted: false, amount: 0 };
      }
    }

    // Grant streak freezes for this month
    const amount = getMonthlyStreakFreezes();
    if (amount > 0) {
      const newState = {
        ...state,
        lastStreakFreezeGrant: now.toISOString(),
      };
      setState(newState);
      localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(newState));

      // Dispatch event for streak system to listen to
      window.dispatchEvent(new CustomEvent('petIsland_grantStreakFreezes', {
        detail: { amount }
      }));

      logger.debug(`Granted ${amount} monthly streak freezes`);
      return { granted: true, amount };
    }

    return { granted: false, amount: 0 };
  }, [state, getMonthlyStreakFreezes]);

  // Grant bonus coins on subscription purchase
  const grantBonusCoins = useCallback((planId: string): { granted: boolean; amount: number } => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return { granted: false, amount: 0 };
    }

    // Check if bonus coins were already granted for this plan
    if (state.bonusCoinsGrantedForPlan === planId) {
      return { granted: false, amount: 0 };
    }

    const amount = plan.bonusCoins;
    if (amount > 0) {
      const newState = {
        ...state,
        bonusCoinsGrantedForPlan: planId,
      };
      setState(newState);
      localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(newState));

      // Dispatch event for coin system to listen to
      window.dispatchEvent(new CustomEvent('petIsland_grantBonusCoins', {
        detail: { amount, planId }
      }));

      logger.debug(`Granted ${amount} bonus coins for ${plan.name}`);
      return { granted: true, amount };
    }

    return { granted: false, amount: 0 };
  }, [state]);

  /**
   * Validate a purchase with the server
   * This should be called AFTER a successful StoreKit purchase to verify and record the transaction
   */
  const validatePurchase = useCallback(async (
    productId: string,
    transactionId: string,
    receiptData?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-receipt', {
        body: {
          productId,
          transactionId,
          receiptData: receiptData || '',
          platform: 'ios', // or detect from Capacitor
        }
      });

      if (error) {
        logger.error('Receipt validation failed:', error);
        return { success: false, message: 'Failed to validate purchase. Please try again.' };
      }

      if (data?.success && data?.subscription) {
        const newState: PremiumState = {
          tier: data.subscription.tier,
          expiresAt: data.subscription.expiresAt,
          purchasedAt: data.subscription.purchasedAt,
          planId: productId,
        };

        setState(newState);
        localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(newState));
        logger.debug('Purchase validated and saved:', newState.tier);

        // Dispatch subscription change event for other hooks (Battle Pass, streak freezes, etc.)
        dispatchSubscriptionChange(data.subscription.tier);

        return { success: true, message: 'Purchase validated successfully!' };
      }

      return { success: false, message: data?.error || 'Validation failed' };
    } catch (err) {
      logger.error('Purchase validation error:', err);
      return { success: false, message: 'An error occurred during validation' };
    }
  }, []);

  /**
   * @deprecated Use validatePurchase instead for production.
   * This function is only for development/testing purposes.
   */
  const purchaseSubscription = useCallback((planId: string): { success: boolean; message: string } => {
    // SECURITY: Guest users must sign up before purchasing
    if (isGuestMode) {
      logger.warn('purchaseSubscription blocked - guest users must sign up first');
      return { success: false, message: 'Please create an account to subscribe.' };
    }

    // In development, we allow direct state setting for testing
    // In production, this should NEVER be used - use validatePurchase with StoreKit instead
    if (import.meta.env.PROD) {
      logger.warn('purchaseSubscription called in production - use validatePurchase instead');
      return { success: false, message: 'Direct purchase not allowed. Use App Store.' };
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return { success: false, message: 'Plan not found' };
    }

    // Development only: simulate purchase
    const now = new Date();
    let expiresAt: string | null = null;

    if (plan.period === 'monthly') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (plan.period === 'yearly') {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    // Lifetime has no expiry

    const newState: PremiumState = {
      tier: plan.tier,
      expiresAt,
      purchasedAt: now.toISOString(),
      planId: plan.id,
    };

    setState(newState);
    localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(newState));
    logger.debug('DEV: Simulated purchase for', plan.name);

    // Dispatch subscription change event for other hooks (Battle Pass, etc.)
    dispatchSubscriptionChange(plan.tier);

    return { success: true, message: `Successfully subscribed to ${plan.name}!` };
  }, [isGuestMode]);

  // Restore purchases (for app reinstalls)
  const restorePurchases = useCallback((): { success: boolean; message: string } => {
    // In production, this would query App Store / Play Store for previous purchases
    // For now, just return the stored state
    const saved = localStorage.getItem(PREMIUM_STORAGE_KEY);
    if (saved) {
      const parsed = safeJsonParse<PremiumState>(saved, defaultState);
      if (parsed.tier !== 'free') {
        setState(parsed);
        logger.debug('Restored purchases:', parsed.tier);
        return { success: true, message: 'Purchases restored successfully!' };
      }
    }
    return { success: false, message: 'No previous purchases found' };
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(PREMIUM_STORAGE_KEY);
    dispatchSubscriptionChange('free');
  }, []);

  // Get current plan details
  const currentPlan = state.planId ? SUBSCRIPTION_PLANS.find(p => p.id === state.planId) : null;

  // Check if a specific feature is available
  type FeatureType = 'ambient_sounds' | 'auto_breaks' | 'session_notes' | 'advanced_analytics' |
                     'sound_mixing' | 'focus_presets' | 'battle_pass' | 'founder_badge' | 'founder_pet';

  const hasFeature = useCallback((feature: FeatureType) => {
    if (state.tier === 'free') return false;

    // Lifetime-only features
    if (feature === 'founder_badge' || feature === 'founder_pet') {
      return state.tier === 'lifetime';
    }

    // Premium+ and Lifetime features
    if (feature === 'battle_pass') {
      return state.tier === 'premium_plus' || state.tier === 'lifetime';
    }

    // All premium tiers get these features
    return true;
  }, [state.tier]);

  // Check and grant streak freezes on mount and when tier changes
  useEffect(() => {
    if (!isLoading && state.tier !== 'free') {
      checkAndGrantMonthlyStreakFreezes();
    }
  }, [isLoading, state.tier, checkAndGrantMonthlyStreakFreezes]);

  return {
    tier: state.tier,
    isPremium,
    isPremiumPlus,
    isLifetime,
    isLoading,
    isVerifying,
    // SECURITY: Expose guest mode status for UI to show sign-up prompts
    isGuestMode,
    expiresAt: state.expiresAt,
    purchasedAt: state.purchasedAt,
    currentPlan,
    // Subscription actions
    purchaseSubscription,
    validatePurchase,
    restorePurchases,
    cancelSubscription,
    // SECURITY: Server verification
    verifyWithServer,
    // Feature checks
    hasFeature,
    // Tier benefits
    getTierBenefits,
    getCoinMultiplier,
    getXPMultiplier,
    getSoundMixingSlots,
    getFocusPresetSlots,
    hasBattlePassIncluded,
    getMonthlyStreakFreezes,
    getDailySpinLimit,
    getLoginCoinMultiplier,
    hasFullAnalytics,
    // Grants
    checkAndGrantMonthlyStreakFreezes,
    grantBonusCoins,
  };
};
