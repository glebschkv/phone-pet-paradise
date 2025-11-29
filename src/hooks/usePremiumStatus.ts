import { useState, useEffect, useCallback } from 'react';

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
    iapProductId: 'com.petparadise.premium.monthly',
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
    iapProductId: 'com.petparadise.premium.yearly',
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
    iapProductId: 'com.petparadise.premiumplus.monthly',
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
    iapProductId: 'com.petparadise.premiumplus.yearly',
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
    iapProductId: 'com.petparadise.lifetime',
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
    try {
      const saved = localStorage.getItem(PREMIUM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if subscription is still valid
        if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
          // Subscription expired
          setState(defaultState);
          localStorage.removeItem(PREMIUM_STORAGE_KEY);
        } else {
          setState(parsed);
        }
      }
    } catch {
      // Invalid data
    }
    setIsLoading(false);
  }, []);

  const isPremium = state.tier === 'premium' || state.tier === 'premium_plus';
  const isPremiumPlus = state.tier === 'premium_plus';

  // Simulate purchase (in production, this would connect to App Store / Play Store)
  const purchaseSubscription = useCallback((planId: string): { success: boolean; message: string } => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return { success: false, message: 'Plan not found' };
    }

    // In production, this would trigger IAP flow
    // For now, simulate success
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

    return { success: true, message: `Successfully subscribed to ${plan.name}!` };
  }, []);

  // Restore purchases (for app reinstalls)
  const restorePurchases = useCallback((): { success: boolean; message: string } => {
    // In production, this would query App Store / Play Store for previous purchases
    // For now, just return the stored state
    const saved = localStorage.getItem(PREMIUM_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tier !== 'free') {
          setState(parsed);
          return { success: true, message: 'Purchases restored successfully!' };
        }
      } catch {
        // Invalid data
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
    restorePurchases,
    cancelSubscription,
    hasFeature,
  };
};
