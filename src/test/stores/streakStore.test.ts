import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useStreakStore,
  useCurrentStreak,
  useLongestStreak,
  useStreakFreezeCount,
  useTotalSessions,
  STREAK_REWARDS,
} from '@/stores/streakStore';

// Mock the logger to avoid console noise
vi.mock('@/lib/logger', () => ({
  streakLogger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the validated storage
vi.mock('@/lib/validated-zustand-storage', () => ({
  createValidatedStorage: () => ({
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

describe('streakStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useStreakStore.getState().resetAll();
      // resetAll sets streakFreezeCount to 3, so reset to 0 for clean tests
      useStreakStore.setState({ streakFreezeCount: 0 });
    });
    vi.clearAllMocks();
  });

  describe('STREAK_REWARDS', () => {
    it('should have expected milestone rewards', () => {
      expect(STREAK_REWARDS).toBeDefined();
      expect(STREAK_REWARDS.length).toBeGreaterThan(0);
    });

    it('should have rewards at milestones 3, 7, 14, 30, 100', () => {
      const milestones = STREAK_REWARDS.map(r => r.milestone);
      expect(milestones).toContain(3);
      expect(milestones).toContain(7);
      expect(milestones).toContain(14);
      expect(milestones).toContain(30);
      expect(milestones).toContain(100);
    });

    it('should have increasing XP bonuses', () => {
      const xpBonuses = STREAK_REWARDS.map(r => r.xpBonus || 0);
      for (let i = 1; i < xpBonuses.length; i++) {
        expect(xpBonuses[i]).toBeGreaterThanOrEqual(xpBonuses[i - 1]);
      }
    });

    it('should have coin bonuses for weekly and above', () => {
      const weeklyReward = STREAK_REWARDS.find(r => r.milestone === 7);
      expect(weeklyReward?.coinBonus).toBeDefined();
      expect(weeklyReward?.coinBonus).toBeGreaterThan(0);
    });
  });

  describe('Initial State', () => {
    it('should have zero current streak initially', () => {
      const { currentStreak } = useStreakStore.getState();
      expect(currentStreak).toBe(0);
    });

    it('should have zero longest streak initially', () => {
      const { longestStreak } = useStreakStore.getState();
      expect(longestStreak).toBe(0);
    });

    it('should have empty lastSessionDate initially', () => {
      const { lastSessionDate } = useStreakStore.getState();
      expect(lastSessionDate).toBe('');
    });

    it('should have zero total sessions initially', () => {
      const { totalSessions } = useStreakStore.getState();
      expect(totalSessions).toBe(0);
    });

    it('should have zero streak freezes initially (after reset)', () => {
      const { streakFreezeCount } = useStreakStore.getState();
      expect(streakFreezeCount).toBe(0);
    });
  });

  describe('setStreak', () => {
    it('should set current streak', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(5);
      });

      expect(useStreakStore.getState().currentStreak).toBe(5);
    });

    it('should update longest streak if current exceeds it', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(10);
      });

      expect(useStreakStore.getState().longestStreak).toBe(10);
    });

    it('should not reduce longest streak when setting lower current', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(20);
      });

      act(() => {
        setStreak(5);
      });

      expect(useStreakStore.getState().currentStreak).toBe(5);
      expect(useStreakStore.getState().longestStreak).toBe(20);
    });

    it('should handle zero streak', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(10);
        setStreak(0);
      });

      expect(useStreakStore.getState().currentStreak).toBe(0);
      expect(useStreakStore.getState().longestStreak).toBe(10);
    });
  });

  describe('incrementStreak', () => {
    it('should increment current streak by 1', () => {
      const { incrementStreak } = useStreakStore.getState();

      act(() => {
        incrementStreak();
      });

      expect(useStreakStore.getState().currentStreak).toBe(1);
    });

    it('should accumulate over multiple increments', () => {
      const { incrementStreak } = useStreakStore.getState();

      act(() => {
        incrementStreak();
        incrementStreak();
        incrementStreak();
      });

      expect(useStreakStore.getState().currentStreak).toBe(3);
    });

    it('should update longest streak when exceeding', () => {
      const { incrementStreak } = useStreakStore.getState();

      act(() => {
        for (let i = 0; i < 7; i++) {
          incrementStreak();
        }
      });

      expect(useStreakStore.getState().longestStreak).toBe(7);
    });

    it('should track longest correctly through reset and rebuild', () => {
      const { incrementStreak, resetStreak } = useStreakStore.getState();

      act(() => {
        for (let i = 0; i < 10; i++) {
          incrementStreak();
        }
      });

      act(() => {
        resetStreak();
      });

      act(() => {
        for (let i = 0; i < 5; i++) {
          incrementStreak();
        }
      });

      expect(useStreakStore.getState().currentStreak).toBe(5);
      expect(useStreakStore.getState().longestStreak).toBe(10);
    });
  });

  describe('resetStreak', () => {
    it('should reset current streak to zero', () => {
      const { incrementStreak, resetStreak } = useStreakStore.getState();

      act(() => {
        incrementStreak();
        incrementStreak();
        incrementStreak();
      });

      act(() => {
        resetStreak();
      });

      expect(useStreakStore.getState().currentStreak).toBe(0);
    });

    it('should preserve longest streak', () => {
      const { setStreak, resetStreak } = useStreakStore.getState();

      act(() => {
        setStreak(15);
      });

      act(() => {
        resetStreak();
      });

      expect(useStreakStore.getState().longestStreak).toBe(15);
    });

    it('should preserve other state', () => {
      const { setStreak, incrementSessions, resetStreak } = useStreakStore.getState();

      act(() => {
        setStreak(5);
        incrementSessions();
        incrementSessions();
      });

      act(() => {
        resetStreak();
      });

      expect(useStreakStore.getState().totalSessions).toBe(2);
    });
  });

  describe('setLastSessionDate', () => {
    it('should set last session date', () => {
      const { setLastSessionDate } = useStreakStore.getState();
      const today = new Date().toISOString().split('T')[0];

      act(() => {
        setLastSessionDate(today);
      });

      expect(useStreakStore.getState().lastSessionDate).toBe(today);
    });

    it('should allow any date string format', () => {
      const { setLastSessionDate } = useStreakStore.getState();

      act(() => {
        setLastSessionDate('2024-01-15');
      });

      expect(useStreakStore.getState().lastSessionDate).toBe('2024-01-15');
    });
  });

  describe('incrementSessions', () => {
    it('should increment total sessions by 1', () => {
      const { incrementSessions } = useStreakStore.getState();

      act(() => {
        incrementSessions();
      });

      expect(useStreakStore.getState().totalSessions).toBe(1);
    });

    it('should accumulate sessions', () => {
      const { incrementSessions } = useStreakStore.getState();

      act(() => {
        for (let i = 0; i < 50; i++) {
          incrementSessions();
        }
      });

      expect(useStreakStore.getState().totalSessions).toBe(50);
    });
  });

  describe('addStreakFreeze', () => {
    it('should add streak freezes', () => {
      const { addStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(3);
      });

      expect(useStreakStore.getState().streakFreezeCount).toBe(3);
    });

    it('should accumulate streak freezes', () => {
      const { addStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(2);
        addStreakFreeze(3);
      });

      expect(useStreakStore.getState().streakFreezeCount).toBe(5);
    });

    it('should handle adding single freeze', () => {
      const { addStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(1);
      });

      expect(useStreakStore.getState().streakFreezeCount).toBe(1);
    });
  });

  describe('useStreakFreeze', () => {
    it('should return true and decrement when freezes available', () => {
      const { addStreakFreeze, useStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(3);
      });

      let result = false;
      act(() => {
        result = useStreakFreeze();
      });

      expect(result).toBe(true);
      expect(useStreakStore.getState().streakFreezeCount).toBe(2);
    });

    it('should return false when no freezes available', () => {
      const { useStreakFreeze } = useStreakStore.getState();

      let result = true;
      act(() => {
        result = useStreakFreeze();
      });

      expect(result).toBe(false);
      expect(useStreakStore.getState().streakFreezeCount).toBe(0);
    });

    it('should allow using all freezes', () => {
      const { addStreakFreeze, useStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(2);
      });

      act(() => {
        useStreakFreeze();
        useStreakFreeze();
      });

      expect(useStreakStore.getState().streakFreezeCount).toBe(0);

      let result = true;
      act(() => {
        result = useStreakFreeze();
      });

      expect(result).toBe(false);
    });
  });

  describe('updateState', () => {
    it('should update multiple properties at once', () => {
      const { updateState } = useStreakStore.getState();

      act(() => {
        updateState({
          currentStreak: 7,
          longestStreak: 14,
          totalSessions: 50,
        });
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(7);
      expect(state.longestStreak).toBe(14);
      expect(state.totalSessions).toBe(50);
    });

    it('should not affect unspecified properties', () => {
      const { addStreakFreeze, updateState } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(5);
      });

      act(() => {
        updateState({ currentStreak: 10 });
      });

      expect(useStreakStore.getState().streakFreezeCount).toBe(5);
    });
  });

  describe('getNextMilestone', () => {
    it('should return first milestone when streak is 0', () => {
      const { getNextMilestone } = useStreakStore.getState();
      const next = getNextMilestone();

      expect(next).not.toBeNull();
      expect(next?.milestone).toBe(3);
    });

    it('should return next milestone based on current streak', () => {
      const { setStreak, getNextMilestone } = useStreakStore.getState();

      act(() => {
        setStreak(5);
      });

      const next = getNextMilestone();
      expect(next?.milestone).toBe(7);
    });

    it('should return null when all milestones achieved', () => {
      const { setStreak, getNextMilestone } = useStreakStore.getState();

      act(() => {
        setStreak(100);
      });

      const next = getNextMilestone();
      expect(next).toBeNull();
    });

    it('should return correct milestone at boundary', () => {
      const { setStreak, getNextMilestone } = useStreakStore.getState();

      act(() => {
        setStreak(3);
      });

      const next = getNextMilestone();
      expect(next?.milestone).toBe(7);
    });

    it('should return milestone details with rewards', () => {
      const { getNextMilestone } = useStreakStore.getState();
      const next = getNextMilestone();

      expect(next).toHaveProperty('reward');
      expect(next).toHaveProperty('description');
      expect(next?.xpBonus).toBeDefined();
    });
  });

  describe('resetAll', () => {
    it('should reset to initial state with 3 streak freezes', () => {
      const { setStreak, incrementSessions, addStreakFreeze, resetAll } = useStreakStore.getState();

      act(() => {
        setStreak(50);
        incrementSessions();
        incrementSessions();
        addStreakFreeze(10);
      });

      act(() => {
        resetAll();
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(0);
      expect(state.longestStreak).toBe(0);
      expect(state.lastSessionDate).toBe('');
      expect(state.totalSessions).toBe(0);
      expect(state.streakFreezeCount).toBe(3); // resetAll gives 3 freezes
    });
  });

  describe('Selector Hooks', () => {
    it('useCurrentStreak should return current streak', () => {
      act(() => {
        useStreakStore.getState().setStreak(12);
      });

      const { result } = renderHook(() => useCurrentStreak());
      expect(result.current).toBe(12);
    });

    it('useLongestStreak should return longest streak', () => {
      act(() => {
        useStreakStore.getState().setStreak(25);
      });

      const { result } = renderHook(() => useLongestStreak());
      expect(result.current).toBe(25);
    });

    it('useStreakFreezeCount should return freeze count', () => {
      act(() => {
        useStreakStore.getState().addStreakFreeze(4);
      });

      const { result } = renderHook(() => useStreakFreezeCount());
      expect(result.current).toBe(4);
    });

    it('useTotalSessions should return total sessions', () => {
      act(() => {
        useStreakStore.getState().incrementSessions();
        useStreakStore.getState().incrementSessions();
        useStreakStore.getState().incrementSessions();
      });

      const { result } = renderHook(() => useTotalSessions());
      expect(result.current).toBe(3);
    });

    it('selectors should update on state change', () => {
      const { result } = renderHook(() => useCurrentStreak());
      expect(result.current).toBe(0);

      act(() => {
        useStreakStore.getState().incrementStreak();
      });

      expect(result.current).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high streak values', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(1000);
      });

      expect(useStreakStore.getState().currentStreak).toBe(1000);
      expect(useStreakStore.getState().longestStreak).toBe(1000);
    });

    it('should handle rapid successive increments', () => {
      const { incrementStreak, incrementSessions } = useStreakStore.getState();

      act(() => {
        for (let i = 0; i < 100; i++) {
          incrementStreak();
          incrementSessions();
        }
      });

      expect(useStreakStore.getState().currentStreak).toBe(100);
      expect(useStreakStore.getState().totalSessions).toBe(100);
    });

    it('should handle concurrent streak and freeze operations', () => {
      const { incrementStreak, addStreakFreeze, useStreakFreeze, resetStreak } = useStreakStore.getState();

      act(() => {
        incrementStreak();
        incrementStreak();
        incrementStreak();
        addStreakFreeze(2);
        resetStreak();
        useStreakFreeze();
        incrementStreak();
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(1);
      expect(state.longestStreak).toBe(3);
      expect(state.streakFreezeCount).toBe(1);
    });
  });
});
