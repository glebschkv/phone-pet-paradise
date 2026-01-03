import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComboSystem, COMBO_UPDATED_EVENT } from '@/hooks/useComboSystem';

// Mock storage module
vi.mock('@/lib/storage-keys', () => ({
  STORAGE_KEYS: {
    COMBO_SYSTEM: 'nomo_combo_system',
  },
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock gamification data
vi.mock('@/data/GamificationData', () => ({
  COMBO_TIERS: [
    { minCombo: 1, name: 'Starting', multiplier: 1.0, color: '#64748b', emoji: '▪️' },
    { minCombo: 2, name: 'Warming Up', multiplier: 1.1, color: '#22c55e', emoji: '🔥' },
    { minCombo: 3, name: 'On Fire', multiplier: 1.25, color: '#f97316', emoji: '🔥🔥' },
    { minCombo: 5, name: 'Blazing', multiplier: 1.5, color: '#ef4444', emoji: '🔥🔥🔥' },
    { minCombo: 7, name: 'Unstoppable', multiplier: 1.75, color: '#8b5cf6', emoji: '⚡' },
    { minCombo: 10, name: 'LEGENDARY', multiplier: 2.0, color: '#fbbf24', emoji: '👑' },
  ],
  getComboTier: vi.fn((comboCount: number) => {
    const tiers = [
      { minCombo: 1, name: 'Starting', multiplier: 1.0, color: '#64748b', emoji: '▪️' },
      { minCombo: 2, name: 'Warming Up', multiplier: 1.1, color: '#22c55e', emoji: '🔥' },
      { minCombo: 3, name: 'On Fire', multiplier: 1.25, color: '#f97316', emoji: '🔥🔥' },
      { minCombo: 5, name: 'Blazing', multiplier: 1.5, color: '#ef4444', emoji: '🔥🔥🔥' },
      { minCombo: 7, name: 'Unstoppable', multiplier: 1.75, color: '#8b5cf6', emoji: '⚡' },
      { minCombo: 10, name: 'LEGENDARY', multiplier: 2.0, color: '#fbbf24', emoji: '👑' },
    ];
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (comboCount >= tiers[i].minCombo) {
        return tiers[i];
      }
    }
    return tiers[0];
  }),
  getNextComboTier: vi.fn((comboCount: number) => {
    const tiers = [
      { minCombo: 1, name: 'Starting', multiplier: 1.0, color: '#64748b', emoji: '▪️' },
      { minCombo: 2, name: 'Warming Up', multiplier: 1.1, color: '#22c55e', emoji: '🔥' },
      { minCombo: 3, name: 'On Fire', multiplier: 1.25, color: '#f97316', emoji: '🔥🔥' },
      { minCombo: 5, name: 'Blazing', multiplier: 1.5, color: '#ef4444', emoji: '🔥🔥🔥' },
      { minCombo: 7, name: 'Unstoppable', multiplier: 1.75, color: '#8b5cf6', emoji: '⚡' },
      { minCombo: 10, name: 'LEGENDARY', multiplier: 2.0, color: '#fbbf24', emoji: '👑' },
    ];
    const currentIndex = tiers.findIndex(tier =>
      comboCount >= tier.minCombo &&
      (tiers[tiers.indexOf(tier) + 1]?.minCombo > comboCount || !tiers[tiers.indexOf(tier) + 1])
    );
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    return null;
  }),
}));

import { storage } from '@/lib/storage-keys';

const mockStorage = storage as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

describe('useComboSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockStorage.get.mockReturnValue(null);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state when no saved data', () => {
      const { result } = renderHook(() => useComboSystem());

      expect(result.current.state.currentCombo).toBe(0);
      expect(result.current.state.highestCombo).toBe(0);
      expect(result.current.state.lastSessionDate).toBeNull();
      expect(result.current.state.lastSessionTime).toBeNull();
      expect(result.current.state.totalBonusXPEarned).toBe(0);
      expect(result.current.state.totalBonusCoinsEarned).toBe(0);
    });

    it('should load saved state from storage', () => {
      const now = Date.now();
      const today = new Date().toDateString();

      mockStorage.get.mockReturnValue({
        currentCombo: 5,
        highestCombo: 8,
        lastSessionDate: today,
        lastSessionTime: now - 1000 * 60 * 60, // 1 hour ago
        totalBonusXPEarned: 500,
        totalBonusCoinsEarned: 300,
      });

      const { result } = renderHook(() => useComboSystem());

      expect(result.current.state.currentCombo).toBe(5);
      expect(result.current.state.highestCombo).toBe(8);
    });

    it('should reset expired combo on load', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockStorage.get.mockReturnValue({
        currentCombo: 5,
        highestCombo: 8,
        lastSessionDate: yesterday.toDateString(),
        lastSessionTime: yesterday.getTime(),
        totalBonusXPEarned: 500,
        totalBonusCoinsEarned: 300,
      });

      const { result } = renderHook(() => useComboSystem());

      expect(result.current.state.currentCombo).toBe(0);
      expect(result.current.state.highestCombo).toBe(8); // Highest is preserved
    });

    it('should have all required functions available', () => {
      const { result } = renderHook(() => useComboSystem());

      expect(typeof result.current.recordSession).toBe('function');
      expect(typeof result.current.getCurrentMultiplier).toBe('function');
      expect(typeof result.current.getTimeUntilExpiry).toBe('function');
      expect(typeof result.current.getNextTierProgress).toBe('function');
      expect(typeof result.current.applyMultiplier).toBe('function');
      expect(typeof result.current.getBonusAmount).toBe('function');
      expect(typeof result.current.trackBonusEarned).toBe('function');
      expect(typeof result.current.resetCombo).toBe('function');
      expect(typeof result.current.getStats).toBe('function');
    });
  });

  describe('recordSession', () => {
    it('should increment combo on session completion', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.recordSession();
      });

      expect(result.current.state.currentCombo).toBe(1);
    });

    it('should update highest combo when new record is set', () => {
      const { result } = renderHook(() => useComboSystem());

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.recordSession();
        });
      }

      expect(result.current.state.currentCombo).toBe(5);
      expect(result.current.state.highestCombo).toBe(5);
    });

    it('should return tier information', () => {
      const { result } = renderHook(() => useComboSystem());

      let sessionResult: ReturnType<typeof result.current.recordSession>;
      act(() => {
        sessionResult = result.current.recordSession();
      });

      expect(sessionResult!.newCombo).toBe(1);
      expect(sessionResult!.multiplier).toBe(1.0);
      expect(sessionResult!.tier).toBeTruthy();
    });

    it('should indicate when tier up occurs', () => {
      const { result } = renderHook(() => useComboSystem());

      // First session - combo 1
      act(() => {
        result.current.recordSession();
      });

      let sessionResult: ReturnType<typeof result.current.recordSession>;
      act(() => {
        // Second session - combo 2 (tier up to "Warming Up")
        sessionResult = result.current.recordSession();
      });

      expect(sessionResult!.newCombo).toBe(2);
      expect(sessionResult!.tieredUp).toBe(true);
    });

    it('should dispatch combo update event', () => {
      const { result } = renderHook(() => useComboSystem());
      const eventHandler = vi.fn();

      window.addEventListener(COMBO_UPDATED_EVENT, eventHandler);

      act(() => {
        result.current.recordSession();
      });

      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener(COMBO_UPDATED_EVENT, eventHandler);
    });

    it('should update last session time', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.recordSession();
      });

      expect(result.current.state.lastSessionTime).toBeTruthy();
      expect(result.current.state.lastSessionDate).toBe(new Date().toDateString());
    });
  });

  describe('getCurrentMultiplier', () => {
    it('should return correct multiplier for combo level', () => {
      const { result } = renderHook(() => useComboSystem());

      expect(result.current.getCurrentMultiplier()).toBe(1.0);

      // Build up combo
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.recordSession();
        });
      }

      expect(result.current.getCurrentMultiplier()).toBe(1.25); // On Fire tier
    });

    it('should return max multiplier at highest tier', () => {
      mockStorage.get.mockReturnValue({
        currentCombo: 10,
        highestCombo: 10,
        lastSessionDate: new Date().toDateString(),
        lastSessionTime: Date.now() - 1000 * 60 * 30, // 30 min ago
        totalBonusXPEarned: 0,
        totalBonusCoinsEarned: 0,
      });

      const { result } = renderHook(() => useComboSystem());

      expect(result.current.getCurrentMultiplier()).toBe(2.0);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return expired for no sessions', () => {
      const { result } = renderHook(() => useComboSystem());

      const timeUntilExpiry = result.current.getTimeUntilExpiry();

      expect(timeUntilExpiry.isExpired).toBe(true);
      expect(timeUntilExpiry.hours).toBe(0);
      expect(timeUntilExpiry.minutes).toBe(0);
    });

    it('should return time remaining for active combo', () => {
      const now = Date.now();
      mockStorage.get.mockReturnValue({
        currentCombo: 3,
        highestCombo: 3,
        lastSessionDate: new Date().toDateString(),
        lastSessionTime: now - 1000 * 60 * 60, // 1 hour ago
        totalBonusXPEarned: 0,
        totalBonusCoinsEarned: 0,
      });

      const { result } = renderHook(() => useComboSystem());

      const timeUntilExpiry = result.current.getTimeUntilExpiry();

      expect(timeUntilExpiry.isExpired).toBe(false);
      expect(timeUntilExpiry.hours).toBe(2); // 3 hours - 1 hour elapsed = 2 hours
    });

    it('should return expired after timeout period', () => {
      const now = Date.now();
      mockStorage.get.mockReturnValue({
        currentCombo: 3,
        highestCombo: 3,
        lastSessionDate: new Date().toDateString(),
        lastSessionTime: now - 1000 * 60 * 60 * 4, // 4 hours ago (past 3 hour timeout)
        totalBonusXPEarned: 0,
        totalBonusCoinsEarned: 0,
      });

      const { result } = renderHook(() => useComboSystem());

      const timeUntilExpiry = result.current.getTimeUntilExpiry();

      expect(timeUntilExpiry.isExpired).toBe(true);
    });
  });

  describe('getNextTierProgress', () => {
    it('should return next tier and progress', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.recordSession();
      });

      const progress = result.current.getNextTierProgress();

      expect(progress.nextTier).toBeTruthy();
      expect(progress.sessionsNeeded).toBeGreaterThan(0);
      expect(progress.progressPercent).toBeGreaterThanOrEqual(0);
      expect(progress.progressPercent).toBeLessThanOrEqual(100);
    });

    it('should return null next tier at max', () => {
      mockStorage.get.mockReturnValue({
        currentCombo: 10,
        highestCombo: 10,
        lastSessionDate: new Date().toDateString(),
        lastSessionTime: Date.now(),
        totalBonusXPEarned: 0,
        totalBonusCoinsEarned: 0,
      });

      const { result } = renderHook(() => useComboSystem());

      const progress = result.current.getNextTierProgress();

      expect(progress.nextTier).toBeNull();
      expect(progress.progressPercent).toBe(100);
    });
  });

  describe('applyMultiplier', () => {
    it('should apply current multiplier to amount', () => {
      const { result } = renderHook(() => useComboSystem());

      // At combo 0, multiplier is 1.0
      expect(result.current.applyMultiplier(100)).toBe(100);

      // Build combo to tier 3 (multiplier 1.25)
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.recordSession();
        });
      }

      expect(result.current.applyMultiplier(100)).toBe(125);
    });

    it('should round result', () => {
      mockStorage.get.mockReturnValue({
        currentCombo: 2,
        highestCombo: 2,
        lastSessionDate: new Date().toDateString(),
        lastSessionTime: Date.now(),
        totalBonusXPEarned: 0,
        totalBonusCoinsEarned: 0,
      });

      const { result } = renderHook(() => useComboSystem());

      // 1.1 * 77 = 84.7, should round to 85
      const applied = result.current.applyMultiplier(77);
      expect(Number.isInteger(applied)).toBe(true);
    });
  });

  describe('getBonusAmount', () => {
    it('should return bonus portion only', () => {
      mockStorage.get.mockReturnValue({
        currentCombo: 3,
        highestCombo: 3,
        lastSessionDate: new Date().toDateString(),
        lastSessionTime: Date.now(),
        totalBonusXPEarned: 0,
        totalBonusCoinsEarned: 0,
      });

      const { result } = renderHook(() => useComboSystem());

      // Multiplier 1.25 - 1 = 0.25 bonus
      // 100 * 0.25 = 25
      expect(result.current.getBonusAmount(100)).toBe(25);
    });

    it('should return 0 for base tier', () => {
      const { result } = renderHook(() => useComboSystem());

      expect(result.current.getBonusAmount(100)).toBe(0);
    });
  });

  describe('trackBonusEarned', () => {
    it('should track bonus XP earned', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.trackBonusEarned(100, 50);
      });

      expect(result.current.state.totalBonusXPEarned).toBe(100);
      expect(result.current.state.totalBonusCoinsEarned).toBe(50);
    });

    it('should accumulate bonus tracking', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.trackBonusEarned(100, 50);
      });
      act(() => {
        result.current.trackBonusEarned(200, 100);
      });

      expect(result.current.state.totalBonusXPEarned).toBe(300);
      expect(result.current.state.totalBonusCoinsEarned).toBe(150);
    });
  });

  describe('resetCombo', () => {
    it('should reset current combo to 0', () => {
      mockStorage.get.mockReturnValue({
        currentCombo: 5,
        highestCombo: 8,
        lastSessionDate: new Date().toDateString(),
        lastSessionTime: Date.now(),
        totalBonusXPEarned: 500,
        totalBonusCoinsEarned: 300,
      });

      const { result } = renderHook(() => useComboSystem());

      expect(result.current.state.currentCombo).toBe(5);

      act(() => {
        result.current.resetCombo();
      });

      expect(result.current.state.currentCombo).toBe(0);
      expect(result.current.state.lastSessionTime).toBeNull();
      // Highest combo and bonus earned should be preserved
      expect(result.current.state.highestCombo).toBe(8);
    });
  });

  describe('getStats', () => {
    it('should return all stats', () => {
      mockStorage.get.mockReturnValue({
        currentCombo: 5,
        highestCombo: 8,
        lastSessionDate: new Date().toDateString(),
        lastSessionTime: Date.now(),
        totalBonusXPEarned: 500,
        totalBonusCoinsEarned: 300,
      });

      const { result } = renderHook(() => useComboSystem());

      const stats = result.current.getStats();

      expect(stats.currentCombo).toBe(5);
      expect(stats.highestCombo).toBe(8);
      expect(stats.totalBonusXPEarned).toBe(500);
      expect(stats.totalBonusCoinsEarned).toBe(300);
      expect(stats.currentTier).toBeTruthy();
    });
  });

  describe('allTiers', () => {
    it('should expose all combo tiers', () => {
      const { result } = renderHook(() => useComboSystem());

      expect(Array.isArray(result.current.allTiers)).toBe(true);
      expect(result.current.allTiers.length).toBe(6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle combo expiry at day boundary', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockStorage.get.mockReturnValue({
        currentCombo: 5,
        highestCombo: 5,
        lastSessionDate: yesterday.toDateString(),
        lastSessionTime: yesterday.getTime(),
        totalBonusXPEarned: 0,
        totalBonusCoinsEarned: 0,
      });

      const { result } = renderHook(() => useComboSystem());

      // Combo should be reset due to new day
      expect(result.current.state.currentCombo).toBe(0);
    });

    it('should build combo from scratch after reset', () => {
      const { result } = renderHook(() => useComboSystem());

      // Build initial combo
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.recordSession();
        });
      }

      expect(result.current.state.currentCombo).toBe(5);

      // Reset
      act(() => {
        result.current.resetCombo();
      });

      expect(result.current.state.currentCombo).toBe(0);

      // Build again
      act(() => {
        result.current.recordSession();
      });

      expect(result.current.state.currentCombo).toBe(1);
    });
  });
});
