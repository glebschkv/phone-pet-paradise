import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeJsonParse } from '@/lib/apiUtils';
import { logger } from '@/lib/logger';

const PREMIUM_STORAGE_KEY = 'petIsland_premium';

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
  },
  premium: {
    coinMultiplier: 2,
    xpMultiplier: 2,
    monthlyStreakFreezes: 2,
    bonusCoinsMonthly: 1000,
    bonusCoinsYearly: 2500,
    battlePassIncluded: false,
    soundMixingSlots: 2,
    focusPresetSlots: 3,
  },
  premium_plus: {
    coinMultiplier: 3,
    xpMultiplier: 3,
    monthlyStreakFreezes: 5,
    bonusCoinsMonthly: 3000,
    bonusCoinsYearly: 7500,
    battlePassIncluded: true,
    soundMixingSlots: 3,
    focusPresetSlots: 5,
  },
  lifetime: {
    coinMultiplier: 4,
    xpMultiplier: 4,
    monthlyStreakFreezes: 7,
    bonusCoinsMonthly: 0, // One-time only
    bonusCoinsYearly: 0,
    bonusCoinsLifetime: 10000,
    battlePassIncluded: true,
    soundMixingSlots: 3,
    focusPresetSlots: 10,
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
    description: 'Double your progress',
    price: '$5.99',
    priceValue: 5.99,
    period: 'monthly',
    features: [
      '2x Coin & XP multiplier',
      'All 13 ambient sounds',
      'Auto-break Pomodoro cycles',
      'Session notes & reflections',
      'Focus analytics dashboard',
      '2 Streak Freezes/month',
      'Sound mixing (2 layers)',
      '3 Focus presets',
    ],
    iapProductId: 'co.nomoinc.nomo.premium.monthly',
    bonusCoins: 1000,
  },
  {
    id: 'premium-yearly',
    tier: 'premium',
    name: 'Premium',
    description: 'Double your progress',
    price: '$44.99',
    priceValue: 44.99,
    period: 'yearly',
    features: [
      '2x Coin & XP multiplier',
      'All 13 ambient sounds',
      'Auto-break Pomodoro cycles',
      'Session notes & reflections',
      'Focus analytics dashboard',
      '2 Streak Freezes/month',
      'Sound mixing (2 layers)',
      '3 Focus presets',
    ],
    iapProductId: 'co.nomoinc.nomo.premium.yearly',
    savings: 'Save 37%',
    isPopular: true,
    bonusCoins: 2500,
  },
  {
    id: 'premium-plus-monthly',
    tier: 'premium_plus',
    name: 'Premium+',
    description: 'Maximum rewards',
    price: '$9.99',
    priceValue: 9.99,
    period: 'monthly',
    features: [
      '3x Coin & XP multiplier',
      'Everything in Premium',
      'Battle Pass Premium included',
      'Sound mixing (3 layers)',
      '5 Focus presets',
      '5 Streak Freezes/month',
      'Early access to features',
      'Exclusive profile frames',
    ],
    iapProductId: 'co.nomoinc.nomo.premiumplus.monthly',
    bonusCoins: 3000,
  },
  {
    id: 'premium-plus-yearly',
    tier: 'premium_plus',
    name: 'Premium+',
    description: 'Maximum rewards',
    price: '$74.99',
    priceValue: 74.99,
    period: 'yearly',
    features: [
      '3x Coin & XP multiplier',
      'Everything in Premium',
      'Battle Pass Premium included',
      'Sound mixing (3 layers)',
      '5 Focus presets',
      '5 Streak Freezes/month',
      'Early access to features',
      'Exclusive profile frames',
    ],
    iapProductId: 'co.nomoinc.nomo.premiumplus.yearly',
    savings: 'Save 37%',
    bonusCoins: 7500,
  },
  {
    id: 'premium-lifetime',
    tier: 'lifetime',
    name: 'Lifetime',
    description: 'Forever access + founder perks',
    price: '$199.99',
    priceValue: 199.99,
    period: 'lifetime',
    features: [
      '4x Coin & XP multiplier',
      'Everything in Premium+',
      'No recurring fees ever',
      'All future updates included',
      'Exclusive Founder badge',
      'Founder-only legendary pet',
      '7 Streak Freezes/month',
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
    price: '$6.99',
    priceValue: 6.99,
    iapProductId: 'co.nomoinc.nomo.battlepass.premium',
  },
  {
    id: 'battlepass-premium-plus',
    name: 'Battle Pass + 10 Tiers',
    description: 'Premium track + skip 10 levels',
    price: '$12.99',
    priceValue: 12.99,
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

  // Load subscription status
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
  }, []);

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
  const effectiveTier = state.tier === 'lifetime' ? 'lifetime' : state.tier;

  const isPremium = state.tier === 'premium' || state.tier === 'premium_plus' || state.tier === 'lifetime';
  const isPremiumPlus = state.tier === 'premium_plus' || state.tier === 'lifetime';
  const isLifetime = state.tier === 'lifetime';

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
  }, []);

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
    expiresAt: state.expiresAt,
    purchasedAt: state.purchasedAt,
    currentPlan,
    // Subscription actions
    purchaseSubscription,
    validatePurchase,
    restorePurchases,
    cancelSubscription,
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
    // Grants
    checkAndGrantMonthlyStreakFreezes,
    grantBonusCoins,
  };
};
