import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeJsonParse } from '@/lib/apiUtils';
import { logger } from '@/lib/logger';

const PREMIUM_STORAGE_KEY = 'petIsland_premium';

export type SubscriptionTier = 'free' | 'premium' | 'premium_plus';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: string;
  period: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  iapProductId: string;
  savings?: string;
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium-monthly',
    tier: 'premium',
    name: 'Premium',
    description: 'Unlock all focus features',
    price: '$4.99',
    period: 'monthly',
    features: [
      'All ambient sounds (lo-fi, nature, cafe)',
      'Auto-break Pomodoro cycles',
      'Session notes & reflections',
      'Advanced focus analytics',
      'No ads',
      'Priority support',
    ],
    iapProductId: 'co.nomoinc.nomo.premium.monthly',
  },
  {
    id: 'premium-yearly',
    tier: 'premium',
    name: 'Premium',
    description: 'Unlock all focus features',
    price: '$39.99',
    period: 'yearly',
    features: [
      'All ambient sounds (lo-fi, nature, cafe)',
      'Auto-break Pomodoro cycles',
      'Session notes & reflections',
      'Advanced focus analytics',
      'No ads',
      'Priority support',
    ],
    iapProductId: 'co.nomoinc.nomo.premium.yearly',
    savings: 'Save 33%',
    isPopular: true,
  },
  {
    id: 'premium-plus-monthly',
    tier: 'premium_plus',
    name: 'Premium+',
    description: 'Everything plus exclusive content',
    price: '$9.99',
    period: 'monthly',
    features: [
      'Everything in Premium',
      'Exclusive legendary pets',
      'Early access to new features',
      'Custom themes creator',
      'Cloud sync across devices',
      'Weekly XP bonus (20%)',
    ],
    iapProductId: 'co.nomoinc.nomo.premiumplus.monthly',
  },
  {
    id: 'premium-plus-yearly',
    tier: 'premium_plus',
    name: 'Premium+',
    description: 'Everything plus exclusive content',
    price: '$79.99',
    period: 'yearly',
    features: [
      'Everything in Premium',
      'Exclusive legendary pets',
      'Early access to new features',
      'Custom themes creator',
      'Cloud sync across devices',
      'Weekly XP bonus (20%)',
    ],
    iapProductId: 'co.nomoinc.nomo.premiumplus.yearly',
    savings: 'Save 33%',
  },
  {
    id: 'premium-lifetime',
    tier: 'premium_plus',
    name: 'Lifetime',
    description: 'One-time purchase, forever access',
    price: '$149.99',
    period: 'lifetime',
    features: [
      'Everything in Premium+',
      'Lifetime access - no recurring fees',
      'All future updates included',
      'Exclusive "Founder" badge',
      'Special founder-only pet',
    ],
    iapProductId: 'co.nomoinc.nomo.lifetime',
    savings: 'Best Value',
  },
];

interface PremiumState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  purchasedAt: string | null;
  planId: string | null;
}

const defaultState: PremiumState = {
  tier: 'free',
  expiresAt: null,
  purchasedAt: null,
  planId: null,
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

  const isPremium = state.tier === 'premium' || state.tier === 'premium_plus';
  const isPremiumPlus = state.tier === 'premium_plus';

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
  }, []);

  // Get current plan details
  const currentPlan = state.planId ? SUBSCRIPTION_PLANS.find(p => p.id === state.planId) : null;

  // Check if a specific feature is available
  const hasFeature = useCallback((feature: 'ambient_sounds' | 'auto_breaks' | 'session_notes' | 'advanced_analytics' | 'exclusive_pets' | 'cloud_sync') => {
    if (state.tier === 'free') return false;
    if (state.tier === 'premium_plus') return true;

    // Premium tier features
    const premiumFeatures = ['ambient_sounds', 'auto_breaks', 'session_notes', 'advanced_analytics'];
    return premiumFeatures.includes(feature);
  }, [state.tier]);

  return {
    tier: state.tier,
    isPremium,
    isPremiumPlus,
    isLoading,
    expiresAt: state.expiresAt,
    currentPlan,
    purchaseSubscription,
    validatePurchase,
    restorePurchases,
    cancelSubscription,
    hasFeature,
  };
};
