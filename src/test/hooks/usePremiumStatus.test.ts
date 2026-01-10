import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePremiumStatus, dispatchSubscriptionChange, TIER_BENEFITS, SUBSCRIPTION_PLANS } from '@/hooks/usePremiumStatus';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase
const mockSupabaseInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockSupabaseInvoke(...args),
    },
  },
}));

// Mock import.meta.env
const _originalEnv = import.meta.env;

describe('usePremiumStatus', () => {
  const STORAGE_KEY = 'petIsland_premium';

  // Helper to create a future date
  const getFutureDate = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  };

  // Helper to create a past date
  const getPastDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset to dev mode
    vi.stubGlobal('import', { meta: { env: { PROD: false, DEV: true } } });
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe('Initialization', () => {
    it('should initialize with default free tier when no saved data', () => {
      const { result } = renderHook(() => usePremiumStatus());

      expect(result.current.tier).toBe('free');
      expect(result.current.isPremium).toBe(false);
      expect(result.current.isPremiumPlus).toBe(false);
      expect(result.current.isLifetime).toBe(false);
      expect(result.current.expiresAt).toBeNull();
      expect(result.current.purchasedAt).toBeNull();
      expect(result.current.currentPlan).toBeNull();
    });

    it('should load saved premium state from localStorage', async () => {
      const savedState = {
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tier).toBe('premium');
      expect(result.current.isPremium).toBe(true);
      expect(result.current.isPremiumPlus).toBe(false);
      expect(result.current.expiresAt).toBe(savedState.expiresAt);
    });

    it('should load premium_plus state correctly', async () => {
      const savedState = {
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tier).toBe('premium_plus');
      expect(result.current.isPremium).toBe(true);
      expect(result.current.isPremiumPlus).toBe(true);
      expect(result.current.isLifetime).toBe(false);
    });

    it('should load lifetime state correctly', async () => {
      const savedState = {
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tier).toBe('lifetime');
      expect(result.current.isPremium).toBe(true);
      expect(result.current.isPremiumPlus).toBe(true);
      expect(result.current.isLifetime).toBe(true);
      expect(result.current.expiresAt).toBeNull();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json data');

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tier).toBe('free');
      expect(result.current.isPremium).toBe(false);
    });

    it('should clear state and set to free when subscription is expired', async () => {
      const savedState = {
        tier: 'premium',
        expiresAt: getPastDate(5), // Expired 5 days ago
        purchasedAt: getPastDate(35),
        planId: 'premium-monthly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tier).toBe('free');
      expect(result.current.isPremium).toBe(false);
      // Should have cleared localStorage
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should keep active subscription when not expired', async () => {
      const futureExpiry = getFutureDate(10);
      const savedState = {
        tier: 'premium',
        expiresAt: futureExpiry,
        purchasedAt: getPastDate(20),
        planId: 'premium-monthly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tier).toBe('premium');
      expect(result.current.isPremium).toBe(true);
      expect(result.current.expiresAt).toBe(futureExpiry);
    });
  });

  describe('Subscription Change Events', () => {
    it('should update state when subscription change event is fired', async () => {
      const savedState = {
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tier).toBe('premium');

      // Update localStorage and dispatch event
      const newState = {
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: new Date().toISOString(),
        planId: 'premium-plus-yearly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

      act(() => {
        dispatchSubscriptionChange('premium_plus');
      });

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      expect(result.current.isPremiumPlus).toBe(true);
    });

    it('should handle downgrade to free tier via event', async () => {
      const savedState = {
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      // Clear localStorage and dispatch free event
      localStorage.removeItem(STORAGE_KEY);

      act(() => {
        dispatchSubscriptionChange('free');
      });

      await waitFor(() => {
        expect(result.current.tier).toBe('free');
      });

      expect(result.current.isPremium).toBe(false);
    });
  });

  describe('Premium Tier Detection', () => {
    it('should correctly identify free tier', () => {
      const { result } = renderHook(() => usePremiumStatus());

      expect(result.current.tier).toBe('free');
      expect(result.current.isPremium).toBe(false);
      expect(result.current.isPremiumPlus).toBe(false);
      expect(result.current.isLifetime).toBe(false);
    });

    it('should correctly identify premium tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      expect(result.current.isPremium).toBe(true);
      expect(result.current.isPremiumPlus).toBe(false);
      expect(result.current.isLifetime).toBe(false);
    });

    it('should correctly identify premium_plus tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      expect(result.current.isPremium).toBe(true);
      expect(result.current.isPremiumPlus).toBe(true);
      expect(result.current.isLifetime).toBe(false);
    });

    it('should correctly identify lifetime tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('lifetime');
      });

      expect(result.current.isPremium).toBe(true);
      expect(result.current.isPremiumPlus).toBe(true);
      expect(result.current.isLifetime).toBe(true);
    });
  });

  describe('Tier Benefits', () => {
    it('should return free tier benefits for free users', () => {
      const { result } = renderHook(() => usePremiumStatus());

      const benefits = result.current.getTierBenefits();

      expect(benefits).toEqual(TIER_BENEFITS.free);
      expect(benefits.coinMultiplier).toBe(1);
      expect(benefits.xpMultiplier).toBe(1);
      expect(benefits.monthlyStreakFreezes).toBe(0);
      expect(benefits.battlePassIncluded).toBe(false);
    });

    it('should return premium tier benefits for premium users', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      const benefits = result.current.getTierBenefits();

      expect(benefits).toEqual(TIER_BENEFITS.premium);
      expect(benefits.coinMultiplier).toBe(2);
      expect(benefits.xpMultiplier).toBe(2);
      expect(benefits.monthlyStreakFreezes).toBe(2);
      expect(benefits.battlePassIncluded).toBe(false);
    });

    it('should return premium_plus tier benefits', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      const benefits = result.current.getTierBenefits();

      expect(benefits).toEqual(TIER_BENEFITS.premium_plus);
      expect(benefits.coinMultiplier).toBe(3);
      expect(benefits.xpMultiplier).toBe(3);
      expect(benefits.monthlyStreakFreezes).toBe(5);
      expect(benefits.battlePassIncluded).toBe(true);
    });

    it('should return lifetime tier benefits', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('lifetime');
      });

      const benefits = result.current.getTierBenefits();

      expect(benefits).toEqual(TIER_BENEFITS.lifetime);
      expect(benefits.coinMultiplier).toBe(4);
      expect(benefits.xpMultiplier).toBe(4);
      expect(benefits.monthlyStreakFreezes).toBe(7);
      expect(benefits.battlePassIncluded).toBe(true);
    });
  });

  describe('Multipliers', () => {
    it('should return correct coin multiplier for free tier', () => {
      const { result } = renderHook(() => usePremiumStatus());

      expect(result.current.getCoinMultiplier()).toBe(1);
    });

    it('should return correct coin multiplier for premium tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      expect(result.current.getCoinMultiplier()).toBe(2);
    });

    it('should return correct XP multiplier for premium_plus tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      expect(result.current.getXPMultiplier()).toBe(3);
    });

    it('should return correct multipliers for lifetime tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('lifetime');
      });

      expect(result.current.getCoinMultiplier()).toBe(4);
      expect(result.current.getXPMultiplier()).toBe(4);
    });
  });

  describe('Sound Mixing and Focus Preset Slots', () => {
    it('should return 1 sound mixing slot for free users', () => {
      const { result } = renderHook(() => usePremiumStatus());

      expect(result.current.getSoundMixingSlots()).toBe(1);
    });

    it('should return 2 sound mixing slots for premium users', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      expect(result.current.getSoundMixingSlots()).toBe(2);
    });

    it('should return 3 sound mixing slots for premium_plus users', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      expect(result.current.getSoundMixingSlots()).toBe(3);
    });

    it('should return correct focus preset slots for each tier', async () => {
      // Free tier
      const { result: freeResult } = renderHook(() => usePremiumStatus());
      expect(freeResult.current.getFocusPresetSlots()).toBe(1);

      // Premium tier
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result: premiumResult } = renderHook(() => usePremiumStatus());
      await waitFor(() => {
        expect(premiumResult.current.tier).toBe('premium');
      });
      expect(premiumResult.current.getFocusPresetSlots()).toBe(3);
    });

    it('should return 10 focus preset slots for lifetime users', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('lifetime');
      });

      expect(result.current.getFocusPresetSlots()).toBe(10);
    });
  });

  describe('Battle Pass Inclusion', () => {
    it('should not include battle pass for free tier', () => {
      const { result } = renderHook(() => usePremiumStatus());

      expect(result.current.hasBattlePassIncluded()).toBe(false);
    });

    it('should not include battle pass for premium tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      expect(result.current.hasBattlePassIncluded()).toBe(false);
    });

    it('should include battle pass for premium_plus tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      expect(result.current.hasBattlePassIncluded()).toBe(true);
    });

    it('should include battle pass for lifetime tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('lifetime');
      });

      expect(result.current.hasBattlePassIncluded()).toBe(true);
    });
  });

  describe('Monthly Streak Freezes', () => {
    it('should return 0 streak freezes for free tier', () => {
      const { result } = renderHook(() => usePremiumStatus());

      expect(result.current.getMonthlyStreakFreezes()).toBe(0);
    });

    it('should return 2 streak freezes for premium tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      expect(result.current.getMonthlyStreakFreezes()).toBe(2);
    });

    it('should return 5 streak freezes for premium_plus tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      expect(result.current.getMonthlyStreakFreezes()).toBe(5);
    });

    it('should return 7 streak freezes for lifetime tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('lifetime');
      });

      expect(result.current.getMonthlyStreakFreezes()).toBe(7);
    });
  });

  describe('checkAndGrantMonthlyStreakFreezes', () => {
    it('should not grant freezes for free tier', async () => {
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.checkAndGrantMonthlyStreakFreezes();
      });

      expect(grantResult?.granted).toBe(false);
      expect(grantResult?.amount).toBe(0);
    });

    it('should grant freezes for premium tier when not granted this month', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The useEffect automatically grants streak freezes on mount for premium users
      // So we check that the event was dispatched during initialization
      await waitFor(() => {
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'petIsland_grantStreakFreezes',
            detail: { amount: 2 },
          })
        );
      });

      // Calling again should not grant (already granted this month)
      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.checkAndGrantMonthlyStreakFreezes();
      });

      expect(grantResult?.granted).toBe(false);
      expect(grantResult?.amount).toBe(0);

      dispatchEventSpy.mockRestore();
    });

    it('should not grant freezes if already granted this month', async () => {
      const now = new Date();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
        lastStreakFreezeGrant: now.toISOString(), // Already granted today
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.checkAndGrantMonthlyStreakFreezes();
      });

      expect(grantResult?.granted).toBe(false);
      expect(grantResult?.amount).toBe(0);
    });

    it('should grant freezes in a new month', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      // Last grant was last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(40),
        planId: 'premium-plus-yearly',
        lastStreakFreezeGrant: lastMonth.toISOString(),
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The useEffect automatically grants streak freezes on mount when last grant was previous month
      // So we check that the event was dispatched during initialization
      await waitFor(() => {
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'petIsland_grantStreakFreezes',
            detail: { amount: 5 },
          })
        );
      });

      // Calling again should not grant (already granted this month due to auto-grant)
      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.checkAndGrantMonthlyStreakFreezes();
      });

      expect(grantResult?.granted).toBe(false);
      expect(grantResult?.amount).toBe(0);

      dispatchEventSpy.mockRestore();
    });
  });

  describe('grantBonusCoins', () => {
    it('should not grant bonus coins for invalid plan', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.grantBonusCoins('invalid-plan-id');
      });

      expect(grantResult?.granted).toBe(false);
      expect(grantResult?.amount).toBe(0);
    });

    it('should grant bonus coins for valid plan', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.grantBonusCoins('premium-monthly');
      });

      expect(grantResult?.granted).toBe(true);
      expect(grantResult?.amount).toBe(1000);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'petIsland_grantBonusCoins',
          detail: { amount: 1000, planId: 'premium-monthly' },
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should not grant bonus coins if already granted for same plan', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
        bonusCoinsGrantedForPlan: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.grantBonusCoins('premium-monthly');
      });

      expect(grantResult?.granted).toBe(false);
      expect(grantResult?.amount).toBe(0);
    });

    it('should grant bonus coins for different plan', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(5),
        planId: 'premium-plus-yearly',
        bonusCoinsGrantedForPlan: 'premium-monthly', // Previous plan
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.grantBonusCoins('premium-plus-yearly');
      });

      expect(grantResult?.granted).toBe(true);
      expect(grantResult?.amount).toBe(7500);
    });

    it('should grant 10000 bonus coins for lifetime plan', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(1),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let grantResult: { granted: boolean; amount: number } | undefined;
      act(() => {
        grantResult = result.current.grantBonusCoins('premium-lifetime');
      });

      expect(grantResult?.granted).toBe(true);
      expect(grantResult?.amount).toBe(10000);
    });
  });

  describe('validatePurchase', () => {
    it('should validate purchase successfully', async () => {
      mockSupabaseInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          subscription: {
            tier: 'premium',
            expiresAt: getFutureDate(30),
            purchasedAt: new Date().toISOString(),
          },
        },
        error: null,
      });

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let validateResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        validateResult = await result.current.validatePurchase(
          'co.nomoinc.nomo.premium.monthly',
          'txn_123',
          'receipt_data'
        );
      });

      expect(validateResult?.success).toBe(true);
      expect(validateResult?.message).toBe('Purchase validated successfully!');
      expect(result.current.tier).toBe('premium');
    });

    it('should handle validation failure from server', async () => {
      mockSupabaseInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid receipt' },
      });

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let validateResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        validateResult = await result.current.validatePurchase(
          'co.nomoinc.nomo.premium.monthly',
          'txn_123',
          'receipt_data'
        );
      });

      expect(validateResult?.success).toBe(false);
      expect(validateResult?.message).toBe('Failed to validate purchase. Please try again.');
      expect(result.current.tier).toBe('free');
    });

    it('should handle validation response with success false', async () => {
      mockSupabaseInvoke.mockResolvedValueOnce({
        data: {
          success: false,
          error: 'Receipt already used',
        },
        error: null,
      });

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let validateResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        validateResult = await result.current.validatePurchase(
          'co.nomoinc.nomo.premium.monthly',
          'txn_123',
          'receipt_data'
        );
      });

      expect(validateResult?.success).toBe(false);
      expect(validateResult?.message).toBe('Receipt already used');
    });

    it('should handle network errors during validation', async () => {
      mockSupabaseInvoke.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let validateResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        validateResult = await result.current.validatePurchase(
          'co.nomoinc.nomo.premium.monthly',
          'txn_123',
          'receipt_data'
        );
      });

      expect(validateResult?.success).toBe(false);
      expect(validateResult?.message).toBe('An error occurred during validation');
    });

    it('should dispatch subscription change event after successful validation', async () => {
      mockSupabaseInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          subscription: {
            tier: 'premium_plus',
            expiresAt: getFutureDate(365),
            purchasedAt: new Date().toISOString(),
          },
        },
        error: null,
      });

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.validatePurchase(
          'co.nomoinc.nomo.premiumplus.yearly',
          'txn_456'
        );
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'petIsland_subscriptionChange',
          detail: { tier: 'premium_plus' },
        })
      );

      dispatchEventSpy.mockRestore();
    });
  });

  describe('purchaseSubscription (dev mode)', () => {
    it('should simulate monthly subscription purchase in dev mode', async () => {
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let purchaseResult: { success: boolean; message: string } | undefined;
      act(() => {
        purchaseResult = result.current.purchaseSubscription('premium-monthly');
      });

      expect(purchaseResult?.success).toBe(true);
      expect(purchaseResult?.message).toBe('Successfully subscribed to Premium!');
      expect(result.current.tier).toBe('premium');
      expect(result.current.expiresAt).not.toBeNull();
    });

    it('should simulate yearly subscription purchase in dev mode', async () => {
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let purchaseResult: { success: boolean; message: string } | undefined;
      act(() => {
        purchaseResult = result.current.purchaseSubscription('premium-plus-yearly');
      });

      expect(purchaseResult?.success).toBe(true);
      expect(result.current.tier).toBe('premium_plus');
      expect(result.current.isPremiumPlus).toBe(true);
    });

    it('should simulate lifetime purchase with no expiry', async () => {
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let purchaseResult: { success: boolean; message: string } | undefined;
      act(() => {
        purchaseResult = result.current.purchaseSubscription('premium-lifetime');
      });

      expect(purchaseResult?.success).toBe(true);
      expect(result.current.tier).toBe('lifetime');
      expect(result.current.isLifetime).toBe(true);
      expect(result.current.expiresAt).toBeNull();
    });

    it('should fail for invalid plan ID', async () => {
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let purchaseResult: { success: boolean; message: string } | undefined;
      act(() => {
        purchaseResult = result.current.purchaseSubscription('invalid-plan');
      });

      expect(purchaseResult?.success).toBe(false);
      expect(purchaseResult?.message).toBe('Plan not found');
      expect(result.current.tier).toBe('free');
    });

    it('should dispatch subscription change event after purchase', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.purchaseSubscription('premium-monthly');
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'petIsland_subscriptionChange',
          detail: { tier: 'premium' },
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should save purchase to localStorage', async () => {
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.purchaseSubscription('premium-monthly');
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.tier).toBe('premium');
      expect(parsed.planId).toBe('premium-monthly');
      expect(parsed.purchasedAt).not.toBeNull();
    });
  });

  describe('restorePurchases', () => {
    it('should restore purchases from localStorage', async () => {
      const savedState = {
        tier: 'premium',
        expiresAt: getFutureDate(15),
        purchasedAt: getPastDate(15),
        planId: 'premium-monthly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let restoreResult: { success: boolean; message: string } | undefined;
      act(() => {
        restoreResult = result.current.restorePurchases();
      });

      expect(restoreResult?.success).toBe(true);
      expect(restoreResult?.message).toBe('Purchases restored successfully!');
      expect(result.current.tier).toBe('premium');
    });

    it('should fail when no previous purchases exist', async () => {
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let restoreResult: { success: boolean; message: string } | undefined;
      act(() => {
        restoreResult = result.current.restorePurchases();
      });

      expect(restoreResult?.success).toBe(false);
      expect(restoreResult?.message).toBe('No previous purchases found');
    });

    it('should fail when stored tier is free', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'free',
        expiresAt: null,
        purchasedAt: null,
        planId: null,
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let restoreResult: { success: boolean; message: string } | undefined;
      act(() => {
        restoreResult = result.current.restorePurchases();
      });

      expect(restoreResult?.success).toBe(false);
      expect(restoreResult?.message).toBe('No previous purchases found');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription and reset to free tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      act(() => {
        result.current.cancelSubscription();
      });

      expect(result.current.tier).toBe('free');
      expect(result.current.isPremium).toBe(false);
      expect(result.current.expiresAt).toBeNull();
    });

    it('should clear localStorage on cancel', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      act(() => {
        result.current.cancelSubscription();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should dispatch subscription change event on cancel', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      act(() => {
        result.current.cancelSubscription();
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'petIsland_subscriptionChange',
          detail: { tier: 'free' },
        })
      );

      dispatchEventSpy.mockRestore();
    });
  });

  describe('hasFeature', () => {
    it('should return false for all features when free tier', () => {
      const { result } = renderHook(() => usePremiumStatus());

      expect(result.current.hasFeature('ambient_sounds')).toBe(false);
      expect(result.current.hasFeature('auto_breaks')).toBe(false);
      expect(result.current.hasFeature('session_notes')).toBe(false);
      expect(result.current.hasFeature('battle_pass')).toBe(false);
      expect(result.current.hasFeature('founder_badge')).toBe(false);
      expect(result.current.hasFeature('founder_pet')).toBe(false);
    });

    it('should return true for basic premium features when premium tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      expect(result.current.hasFeature('ambient_sounds')).toBe(true);
      expect(result.current.hasFeature('auto_breaks')).toBe(true);
      expect(result.current.hasFeature('session_notes')).toBe(true);
      expect(result.current.hasFeature('advanced_analytics')).toBe(true);
    });

    it('should return false for premium_plus features when premium tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      expect(result.current.hasFeature('battle_pass')).toBe(false);
    });

    it('should return false for lifetime-only features when premium tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      expect(result.current.hasFeature('founder_badge')).toBe(false);
      expect(result.current.hasFeature('founder_pet')).toBe(false);
    });

    it('should return true for battle_pass when premium_plus tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      expect(result.current.hasFeature('battle_pass')).toBe(true);
    });

    it('should return false for lifetime-only features when premium_plus tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium_plus',
        expiresAt: getFutureDate(365),
        purchasedAt: getPastDate(10),
        planId: 'premium-plus-yearly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium_plus');
      });

      expect(result.current.hasFeature('founder_badge')).toBe(false);
      expect(result.current.hasFeature('founder_pet')).toBe(false);
    });

    it('should return true for all features including founder when lifetime tier', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('lifetime');
      });

      expect(result.current.hasFeature('ambient_sounds')).toBe(true);
      expect(result.current.hasFeature('auto_breaks')).toBe(true);
      expect(result.current.hasFeature('battle_pass')).toBe(true);
      expect(result.current.hasFeature('founder_badge')).toBe(true);
      expect(result.current.hasFeature('founder_pet')).toBe(true);
    });
  });

  describe('currentPlan', () => {
    it('should return null when no plan is selected', () => {
      const { result } = renderHook(() => usePremiumStatus());

      expect(result.current.currentPlan).toBeNull();
    });

    it('should return the correct plan details', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('premium');
      });

      const plan = result.current.currentPlan;
      expect(plan).not.toBeNull();
      expect(plan?.id).toBe('premium-monthly');
      expect(plan?.tier).toBe('premium');
      expect(plan?.price).toBe('$5.99');
      expect(plan?.period).toBe('monthly');
    });

    it('should return lifetime plan details', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'lifetime',
        expiresAt: null,
        purchasedAt: getPastDate(100),
        planId: 'premium-lifetime',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.tier).toBe('lifetime');
      });

      const plan = result.current.currentPlan;
      expect(plan).not.toBeNull();
      expect(plan?.id).toBe('premium-lifetime');
      expect(plan?.tier).toBe('lifetime');
      expect(plan?.price).toBe('$199.99');
      expect(plan?.period).toBe('lifetime');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty localStorage value', async () => {
      localStorage.setItem(STORAGE_KEY, '');

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tier).toBe('free');
    });

    it('should handle null values in saved state', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: null,
        expiresAt: null,
        purchasedAt: null,
        planId: null,
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to free tier
      expect(result.current.isPremium).toBe(false);
    });

    it('should persist state changes to localStorage', async () => {
      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.purchaseSubscription('premium-yearly');
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.tier).toBe('premium');
      expect(parsed.planId).toBe('premium-yearly');
    });

    it('should handle subscription state across component remounts', async () => {
      const savedState = {
        tier: 'premium_plus',
        expiresAt: getFutureDate(200),
        purchasedAt: getPastDate(165),
        planId: 'premium-plus-yearly',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // First mount
      const { result: firstResult, unmount } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(firstResult.current.tier).toBe('premium_plus');
      });

      unmount();

      // Second mount
      const { result: secondResult } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(secondResult.current.tier).toBe('premium_plus');
      });

      expect(secondResult.current.isPremiumPlus).toBe(true);
    });

    it('should handle subscription expiring in the future by 1 second', async () => {
      // Set expiry to 1 second in the future
      const futureDate = new Date(Date.now() + 1000).toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: futureDate,
        purchasedAt: getPastDate(30),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should NOT be expired yet
      expect(result.current.tier).toBe('premium');
    });

    it('should handle subscription that expired 1 second ago', async () => {
      // Set expiry to 1 second in the past
      const pastDate = new Date(Date.now() - 1000).toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tier: 'premium',
        expiresAt: pastDate,
        purchasedAt: getPastDate(30),
        planId: 'premium-monthly',
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should be expired since expiry date is in the past
      expect(result.current.tier).toBe('free');
    });

    it('should handle undefined tier in localStorage gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        expiresAt: getFutureDate(30),
        purchasedAt: getPastDate(5),
        planId: 'premium-monthly',
        // tier is missing
      }));

      const { result } = renderHook(() => usePremiumStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle missing tier
      expect(result.current.isPremium).toBe(false);
    });
  });

  describe('Subscription Plans Data', () => {
    it('should have all required subscription plans', () => {
      expect(SUBSCRIPTION_PLANS).toHaveLength(5);

      const planIds = SUBSCRIPTION_PLANS.map(p => p.id);
      expect(planIds).toContain('premium-monthly');
      expect(planIds).toContain('premium-yearly');
      expect(planIds).toContain('premium-plus-monthly');
      expect(planIds).toContain('premium-plus-yearly');
      expect(planIds).toContain('premium-lifetime');
    });

    it('should have correct tier assignments for each plan', () => {
      const premiumMonthly = SUBSCRIPTION_PLANS.find(p => p.id === 'premium-monthly');
      expect(premiumMonthly?.tier).toBe('premium');

      const premiumPlusYearly = SUBSCRIPTION_PLANS.find(p => p.id === 'premium-plus-yearly');
      expect(premiumPlusYearly?.tier).toBe('premium_plus');

      const lifetime = SUBSCRIPTION_PLANS.find(p => p.id === 'premium-lifetime');
      expect(lifetime?.tier).toBe('lifetime');
    });

    it('should have correct periods for each plan type', () => {
      const monthlyPlans = SUBSCRIPTION_PLANS.filter(p => p.period === 'monthly');
      const yearlyPlans = SUBSCRIPTION_PLANS.filter(p => p.period === 'yearly');
      const lifetimePlans = SUBSCRIPTION_PLANS.filter(p => p.period === 'lifetime');

      expect(monthlyPlans).toHaveLength(2);
      expect(yearlyPlans).toHaveLength(2);
      expect(lifetimePlans).toHaveLength(1);
    });

    it('should have bonus coins defined for each plan', () => {
      SUBSCRIPTION_PLANS.forEach(plan => {
        expect(plan.bonusCoins).toBeDefined();
        expect(typeof plan.bonusCoins).toBe('number');
        expect(plan.bonusCoins).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Tier Benefits Data', () => {
    it('should have correct multipliers for each tier', () => {
      expect(TIER_BENEFITS.free.coinMultiplier).toBe(1);
      expect(TIER_BENEFITS.premium.coinMultiplier).toBe(2);
      expect(TIER_BENEFITS.premium_plus.coinMultiplier).toBe(3);
      expect(TIER_BENEFITS.lifetime.coinMultiplier).toBe(4);
    });

    it('should have increasing streak freezes by tier', () => {
      expect(TIER_BENEFITS.free.monthlyStreakFreezes).toBe(0);
      expect(TIER_BENEFITS.premium.monthlyStreakFreezes).toBe(2);
      expect(TIER_BENEFITS.premium_plus.monthlyStreakFreezes).toBe(5);
      expect(TIER_BENEFITS.lifetime.monthlyStreakFreezes).toBe(7);
    });

    it('should have battle pass included only for premium_plus and lifetime', () => {
      expect(TIER_BENEFITS.free.battlePassIncluded).toBe(false);
      expect(TIER_BENEFITS.premium.battlePassIncluded).toBe(false);
      expect(TIER_BENEFITS.premium_plus.battlePassIncluded).toBe(true);
      expect(TIER_BENEFITS.lifetime.battlePassIncluded).toBe(true);
    });
  });

  describe('dispatchSubscriptionChange helper', () => {
    it('should dispatch custom event with tier', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      dispatchSubscriptionChange('premium');

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'petIsland_subscriptionChange',
          detail: { tier: 'premium' },
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should dispatch event for all tier types', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      const tiers: Array<'free' | 'premium' | 'premium_plus' | 'lifetime'> = ['free', 'premium', 'premium_plus', 'lifetime'];

      tiers.forEach(tier => {
        dispatchSubscriptionChange(tier);
      });

      expect(dispatchEventSpy).toHaveBeenCalledTimes(4);

      dispatchEventSpy.mockRestore();
    });
  });
});
