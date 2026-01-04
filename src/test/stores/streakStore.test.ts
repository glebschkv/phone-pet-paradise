import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock logger before importing store
vi.mock('@/lib/logger', () => ({
  streakLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  useStreakStore,
  useCurrentStreak,
  useLongestStreak,
  useStreakFreezeCount,
  useTotalSessions,
  STREAK_REWARDS,
} from '@/stores/streakStore';

describe('streakStore', () => {
  const STORAGE_KEY = 'nomo_streak_data';

  beforeEach(() => {
    localStorage.clear();
    // Reset store to initial state
    useStreakStore.setState({
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: '',
      totalSessions: 0,
      streakFreezeCount: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('STREAK_REWARDS', () => {
    it('should have correct milestone rewards defined', () => {
      expect(STREAK_REWARDS).toHaveLength(5);
      expect(STREAK_REWARDS[0].milestone).toBe(3);
      expect(STREAK_REWARDS[1].milestone).toBe(7);
      expect(STREAK_REWARDS[2].milestone).toBe(14);
      expect(STREAK_REWARDS[3].milestone).toBe(30);
      expect(STREAK_REWARDS[4].milestone).toBe(100);
    });

    it('should have XP bonuses for all milestones', () => {
      STREAK_REWARDS.forEach(reward => {
        expect(reward.xpBonus).toBeDefined();
        expect(reward.xpBonus).toBeGreaterThan(0);
      });
    });
  });

  describe('Initial State', () => {
    it('should initialize with zero currentStreak', () => {
      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(0);
    });

    it('should initialize with zero longestStreak', () => {
      const state = useStreakStore.getState();
      expect(state.longestStreak).toBe(0);
    });

    it('should initialize with empty lastSessionDate', () => {
      const state = useStreakStore.getState();
      expect(state.lastSessionDate).toBe('');
    });

    it('should initialize with zero totalSessions', () => {
      const state = useStreakStore.getState();
      expect(state.totalSessions).toBe(0);
    });

    it('should initialize with zero streakFreezeCount', () => {
      const state = useStreakStore.getState();
      expect(state.streakFreezeCount).toBe(0);
    });

    it('should have all required actions available', () => {
      const state = useStreakStore.getState();
      expect(typeof state.setStreak).toBe('function');
      expect(typeof state.incrementStreak).toBe('function');
      expect(typeof state.resetStreak).toBe('function');
      expect(typeof state.setLastSessionDate).toBe('function');
      expect(typeof state.incrementSessions).toBe('function');
      expect(typeof state.addStreakFreeze).toBe('function');
      expect(typeof state.useStreakFreeze).toBe('function');
      expect(typeof state.updateState).toBe('function');
      expect(typeof state.getNextMilestone).toBe('function');
      expect(typeof state.resetAll).toBe('function');
    });
  });

  describe('setStreak', () => {
    it('should set current streak', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(5);
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(5);
    });

    it('should update longest streak if new streak is higher', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(10);
      });

      const state = useStreakStore.getState();
      expect(state.longestStreak).toBe(10);
    });

    it('should not decrease longest streak', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(20);
        setStreak(5);
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(5);
      expect(state.longestStreak).toBe(20);
    });
  });

  describe('incrementStreak', () => {
    it('should increment current streak by 1', () => {
      const { incrementStreak, setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(3);
        incrementStreak();
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(4);
    });

    it('should update longest streak when incrementing past it', () => {
      const { incrementStreak, setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(5);
        incrementStreak();
        incrementStreak();
      });

      const state = useStreakStore.getState();
      expect(state.longestStreak).toBe(7);
    });

    it('should increment from zero', () => {
      const { incrementStreak } = useStreakStore.getState();

      act(() => {
        incrementStreak();
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(1);
    });
  });

  describe('resetStreak', () => {
    it('should reset current streak to 0', () => {
      const { setStreak, resetStreak } = useStreakStore.getState();

      act(() => {
        setStreak(15);
        resetStreak();
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(0);
    });

    it('should not reset longest streak', () => {
      const { setStreak, resetStreak } = useStreakStore.getState();

      act(() => {
        setStreak(15);
        resetStreak();
      });

      const state = useStreakStore.getState();
      expect(state.longestStreak).toBe(15);
    });
  });

  describe('setLastSessionDate', () => {
    it('should set last session date', () => {
      const { setLastSessionDate } = useStreakStore.getState();
      const date = '2024-01-15';

      act(() => {
        setLastSessionDate(date);
      });

      const state = useStreakStore.getState();
      expect(state.lastSessionDate).toBe(date);
    });
  });

  describe('incrementSessions', () => {
    it('should increment total sessions', () => {
      const { incrementSessions } = useStreakStore.getState();

      act(() => {
        incrementSessions();
        incrementSessions();
        incrementSessions();
      });

      const state = useStreakStore.getState();
      expect(state.totalSessions).toBe(3);
    });
  });

  describe('addStreakFreeze', () => {
    it('should add streak freezes', () => {
      const { addStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(3);
      });

      const state = useStreakStore.getState();
      expect(state.streakFreezeCount).toBe(3);
    });

    it('should accumulate streak freezes', () => {
      const { addStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(2);
        addStreakFreeze(3);
      });

      const state = useStreakStore.getState();
      expect(state.streakFreezeCount).toBe(5);
    });
  });

  describe('useStreakFreeze', () => {
    it('should use a streak freeze and return true', () => {
      const { addStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(3);
      });

      let result: boolean;
      act(() => {
        result = useStreakStore.getState().useStreakFreeze();
      });

      expect(result!).toBe(true);
      const state = useStreakStore.getState();
      expect(state.streakFreezeCount).toBe(2);
    });

    it('should return false when no freezes available', () => {
      let result: boolean;
      act(() => {
        result = useStreakStore.getState().useStreakFreeze();
      });

      expect(result!).toBe(false);
      const state = useStreakStore.getState();
      expect(state.streakFreezeCount).toBe(0);
    });

    it('should decrement to zero correctly', () => {
      const { addStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(1);
      });

      let result: boolean;
      act(() => {
        result = useStreakStore.getState().useStreakFreeze();
      });
      expect(result!).toBe(true);

      act(() => {
        result = useStreakStore.getState().useStreakFreeze();
      });
      expect(result!).toBe(false);
    });
  });

  describe('updateState', () => {
    it('should update partial state', () => {
      const { updateState } = useStreakStore.getState();

      act(() => {
        updateState({
          currentStreak: 10,
          totalSessions: 50,
        });
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(10);
      expect(state.totalSessions).toBe(50);
      expect(state.longestStreak).toBe(0); // unchanged
    });
  });

  describe('getNextMilestone', () => {
    it('should return first milestone for 0 streak', () => {
      const { getNextMilestone } = useStreakStore.getState();

      const milestone = getNextMilestone();
      expect(milestone?.milestone).toBe(3);
    });

    it('should return correct milestone for current streak', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(5);
      });

      const milestone = useStreakStore.getState().getNextMilestone();
      expect(milestone?.milestone).toBe(7);
    });

    it('should return null when past all milestones', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(150);
      });

      const milestone = useStreakStore.getState().getNextMilestone();
      expect(milestone).toBeNull();
    });

    it('should return milestone even when at the milestone', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(3);
      });

      const milestone = useStreakStore.getState().getNextMilestone();
      expect(milestone?.milestone).toBe(7); // Next milestone after 3
    });
  });

  describe('resetAll', () => {
    it('should reset to initial state with 3 freezes', () => {
      const { setStreak, addStreakFreeze, incrementSessions, resetAll } = useStreakStore.getState();

      act(() => {
        setStreak(50);
        addStreakFreeze(10);
        incrementSessions();
        resetAll();
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(0);
      expect(state.longestStreak).toBe(0);
      expect(state.totalSessions).toBe(0);
      expect(state.streakFreezeCount).toBe(3); // Reset gives 3 freezes
    });
  });

  describe('Selector Hooks', () => {
    it('useCurrentStreak should return currentStreak', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(7);
      });

      const { result } = renderHook(() => useCurrentStreak());
      expect(result.current).toBe(7);
    });

    it('useLongestStreak should return longestStreak', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(25);
      });

      const { result } = renderHook(() => useLongestStreak());
      expect(result.current).toBe(25);
    });

    it('useStreakFreezeCount should return streakFreezeCount', () => {
      const { addStreakFreeze } = useStreakStore.getState();

      act(() => {
        addStreakFreeze(5);
      });

      const { result } = renderHook(() => useStreakFreezeCount());
      expect(result.current).toBe(5);
    });

    it('useTotalSessions should return totalSessions', () => {
      const { incrementSessions } = useStreakStore.getState();

      act(() => {
        incrementSessions();
        incrementSessions();
      });

      const { result } = renderHook(() => useTotalSessions());
      expect(result.current).toBe(2);
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', async () => {
      const { setStreak, addStreakFreeze } = useStreakStore.getState();

      act(() => {
        setStreak(10);
        addStreakFreeze(5);
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.state.currentStreak).toBe(10);
      expect(parsed.state.streakFreezeCount).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large streak numbers', () => {
      const { setStreak } = useStreakStore.getState();

      act(() => {
        setStreak(999999);
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(999999);
      expect(state.longestStreak).toBe(999999);
    });

    it('should handle rapid increments', () => {
      const { incrementStreak } = useStreakStore.getState();

      act(() => {
        for (let i = 0; i < 100; i++) {
          incrementStreak();
        }
      });

      const state = useStreakStore.getState();
      expect(state.currentStreak).toBe(100);
      expect(state.longestStreak).toBe(100);
    });
  });
});
