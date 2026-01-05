import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCoinSystem, _resetRateLimiter } from '@/hooks/useCoinSystem';
import { useCoinStore } from '@/stores/coinStore';

// Mock achievement tracking
vi.mock('@/hooks/useAchievementTracking', () => ({
  dispatchAchievementEvent: vi.fn(),
  ACHIEVEMENT_EVENTS: {
    COINS_EARNED: 'coins_earned',
  },
}));

// Mock logger with all required loggers
vi.mock('@/lib/logger', () => ({
  coinLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  supabaseLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  storeKitLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  storageLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
  isSupabaseConfigured: false,
}));

describe('useCoinSystem', () => {
  // The new storage key used by Zustand
  const STORAGE_KEY = 'nomo_coin_system';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset the Zustand store to initial state
    useCoinStore.getState().resetCoins();
    // Reset rate limiter for tests
    _resetRateLimiter();
  });

  afterEach(() => {
    localStorage.clear();
    useCoinStore.getState().resetCoins();
  });

  describe('initialization', () => {
    it('should initialize with default state when no saved data', () => {
      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.balance).toBe(0);
      expect(result.current.totalEarned).toBe(0);
      expect(result.current.totalSpent).toBe(0);
    });

    it('should use Zustand store state', async () => {
      // Set initial state in the store
      act(() => {
        useCoinStore.getState().addCoins(500);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(500);
        expect(result.current.totalEarned).toBe(500);
        expect(result.current.totalSpent).toBe(0);
      });
    });
  });

  describe('calculateCoinsFromDuration', () => {
    it('should return correct coins for 25 minute session', () => {
      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.calculateCoinsFromDuration(25)).toBe(25);
    });

    it('should return correct coins for 30 minute session', () => {
      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.calculateCoinsFromDuration(30)).toBe(40);
    });

    it('should return correct coins for 60 minute session', () => {
      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.calculateCoinsFromDuration(60)).toBe(100);
    });

    it('should return correct coins for 120 minute session', () => {
      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.calculateCoinsFromDuration(120)).toBe(260);
    });

    it('should return 0 for sessions under 25 minutes', () => {
      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.calculateCoinsFromDuration(10)).toBe(0);
      expect(result.current.calculateCoinsFromDuration(20)).toBe(0);
    });

    it('should use closest lower tier for intermediate durations', () => {
      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.calculateCoinsFromDuration(50)).toBe(65); // Uses 45 min tier
      expect(result.current.calculateCoinsFromDuration(100)).toBe(175); // Uses 90 min tier
    });
  });

  describe('awardCoins', () => {
    it('should award coins for a session', () => {
      const { result } = renderHook(() => useCoinSystem());

      act(() => {
        const reward = result.current.awardCoins(25);
        expect(reward.baseCoins).toBe(25);
        expect(reward.coinsGained).toBeGreaterThanOrEqual(25);
      });
    });

    it('should increase balance after awarding', async () => {
      const { result } = renderHook(() => useCoinSystem());

      act(() => {
        result.current.awardCoins(25);
      });

      await waitFor(() => {
        expect(result.current.balance).toBeGreaterThanOrEqual(25);
      });
    });

    it('should track total earned', async () => {
      const { result } = renderHook(() => useCoinSystem());

      act(() => {
        result.current.awardCoins(25);
      });

      await waitFor(() => {
        expect(result.current.totalEarned).toBeGreaterThanOrEqual(25);
      });
    });

    it('should apply booster multiplier when provided', () => {
      const { result } = renderHook(() => useCoinSystem());

      act(() => {
        const reward = result.current.awardCoins(25, 2);
        expect(reward.boosterActive).toBe(true);
        expect(reward.boosterMultiplier).toBe(2);
        // With 2x booster, coins should be at least double base
        expect(reward.coinsGained).toBeGreaterThanOrEqual(50);
      });
    });

    it('should return bonus information', () => {
      const { result } = renderHook(() => useCoinSystem());

      act(() => {
        const reward = result.current.awardCoins(25);
        expect(reward.bonusType).toBeDefined();
        expect(['none', 'lucky', 'super_lucky', 'jackpot']).toContain(reward.bonusType);
        expect(typeof reward.hasBonusCoins).toBe('boolean');
      });
    });

    it('should update Zustand store after awarding', async () => {
      const { result } = renderHook(() => useCoinSystem());

      act(() => {
        result.current.awardCoins(30);
      });

      await waitFor(() => {
        const storeState = useCoinStore.getState();
        expect(storeState.balance).toBeGreaterThanOrEqual(40);
      });
    });
  });

  describe('addCoins', () => {
    it('should add coins to balance', async () => {
      const { result } = renderHook(() => useCoinSystem());

      act(() => {
        result.current.addCoins(100);
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
        expect(result.current.totalEarned).toBe(100);
      });
    });

    it('should add to existing balance', async () => {
      // Set initial state
      act(() => {
        useCoinStore.getState().addCoins(50);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(50);
      });

      act(() => {
        result.current.addCoins(100);
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(150);
        expect(result.current.totalEarned).toBe(150);
      });
    });

    it('should ignore invalid (negative or zero) amounts', async () => {
      act(() => {
        useCoinStore.getState().addCoins(100);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      // Adding negative or zero coins should be ignored
      act(() => {
        result.current.addCoins(-50);
      });

      await waitFor(() => {
        // Balance should remain unchanged
        expect(result.current.balance).toBe(100);
      });

      act(() => {
        result.current.addCoins(0);
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });
    });
  });

  describe('spendCoins (async)', () => {
    it('should return true when balance is sufficient', async () => {
      act(() => {
        useCoinStore.getState().addCoins(100);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      let success = false;
      await act(async () => {
        success = await result.current.spendCoins(50);
      });

      expect(success).toBe(true);
      await waitFor(() => {
        expect(result.current.balance).toBe(50);
        expect(result.current.totalSpent).toBe(50);
      });
    });

    it('should return false when balance is insufficient', async () => {
      act(() => {
        useCoinStore.getState().addCoins(30);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(30);
      });

      let success = true;
      await act(async () => {
        success = await result.current.spendCoins(50);
      });

      expect(success).toBe(false);
      expect(result.current.balance).toBe(30); // Unchanged
    });

    it('should track total spent', async () => {
      act(() => {
        useCoinStore.getState().addCoins(200);
        useCoinStore.getState().spendCoins(50); // Spend initial amount
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(150);
        expect(result.current.totalSpent).toBe(50);
      });

      await act(async () => {
        await result.current.spendCoins(75);
      });

      await waitFor(() => {
        expect(result.current.totalSpent).toBe(125);
      });
    });

    it('should allow spending entire balance', async () => {
      act(() => {
        useCoinStore.getState().addCoins(100);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      let success = false;
      await act(async () => {
        success = await result.current.spendCoins(100);
      });

      expect(success).toBe(true);
      await waitFor(() => {
        expect(result.current.balance).toBe(0);
      });
    });
  });

  describe('canAfford', () => {
    it('should return true when balance is sufficient', async () => {
      act(() => {
        useCoinStore.getState().addCoins(100);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      expect(result.current.canAfford(50)).toBe(true);
      expect(result.current.canAfford(100)).toBe(true);
    });

    it('should return false when balance is insufficient', async () => {
      act(() => {
        useCoinStore.getState().addCoins(30);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(30);
      });

      expect(result.current.canAfford(50)).toBe(false);
      expect(result.current.canAfford(31)).toBe(false);
    });

    it('should return true for exact amount', async () => {
      act(() => {
        useCoinStore.getState().addCoins(100);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(100);
      });

      expect(result.current.canAfford(100)).toBe(true);
    });
  });

  describe('resetProgress', () => {
    it('should reset all values to zero', async () => {
      act(() => {
        useCoinStore.getState().addCoins(1000);
        useCoinStore.getState().spendCoins(500);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(500);
      });

      act(() => {
        result.current.resetProgress();
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(0);
        expect(result.current.totalEarned).toBe(0);
        expect(result.current.totalSpent).toBe(0);
      });
    });

    it('should reset Zustand store state', async () => {
      act(() => {
        useCoinStore.getState().addCoins(1000);
        useCoinStore.getState().spendCoins(500);
      });

      const { result } = renderHook(() => useCoinSystem());

      await waitFor(() => {
        expect(result.current.balance).toBe(500);
      });

      act(() => {
        result.current.resetProgress();
      });

      await waitFor(() => {
        const storeState = useCoinStore.getState();
        expect(storeState.balance).toBe(0);
        expect(storeState.totalEarned).toBe(0);
        expect(storeState.totalSpent).toBe(0);
      });
    });
  });

  describe('subscription multiplier', () => {
    it('should return 1 when no premium subscription', () => {
      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.getSubscriptionMultiplier()).toBe(1);
    });

    it('should return premium multiplier when subscribed', () => {
      localStorage.setItem('petIsland_premium', JSON.stringify({
        tier: 'premium',
      }));

      const { result } = renderHook(() => useCoinSystem());

      expect(result.current.getSubscriptionMultiplier()).toBeGreaterThan(1);
    });
  });

  describe('event handling', () => {
    it('should handle bonus coin grants from subscription', async () => {
      const { result } = renderHook(() => useCoinSystem());

      act(() => {
        window.dispatchEvent(new CustomEvent('petIsland_grantBonusCoins', {
          detail: { amount: 500, planId: 'premium' },
        }));
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(500);
        expect(result.current.totalEarned).toBe(500);
      });
    });
  });

  describe('Zustand store integration', () => {
    it('should reflect changes made directly to the store', async () => {
      const { result } = renderHook(() => useCoinSystem());

      // Make changes directly to the store
      act(() => {
        useCoinStore.getState().addCoins(250);
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(250);
      });
    });

    it('should share state across multiple hook instances', async () => {
      const { result: result1 } = renderHook(() => useCoinSystem());
      const { result: result2 } = renderHook(() => useCoinSystem());

      act(() => {
        result1.current.addCoins(100);
      });

      await waitFor(() => {
        expect(result1.current.balance).toBe(100);
        expect(result2.current.balance).toBe(100);
      });
    });
  });
});
