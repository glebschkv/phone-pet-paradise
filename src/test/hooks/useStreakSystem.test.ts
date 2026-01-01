import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreakSystem } from '@/hooks/useStreakSystem';

// Mock logger
vi.mock('@/lib/logger', () => ({
  streakLogger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('useStreakSystem', () => {
  const STORAGE_KEY = 'pet_paradise_streak_data';

  // Helper to get today's date string
  const getTodayString = () => new Date().toDateString();

  // Helper to get yesterday's date string
  const getYesterdayString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
  };

  // Helper to get date N days ago
  const getDaysAgoString = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toDateString();
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default streak data', () => {
      const { result } = renderHook(() => useStreakSystem());

      expect(result.current.streakData).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: '',
        totalSessions: 0,
        streakFreezeCount: 0,
      });
    });

    it('should load saved streak data from localStorage', () => {
      const savedData = {
        currentStreak: 5,
        longestStreak: 10,
        lastSessionDate: getYesterdayString(),
        totalSessions: 20,
        streakFreezeCount: 2,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      expect(result.current.streakData.currentStreak).toBe(5);
      expect(result.current.streakData.longestStreak).toBe(10);
      expect(result.current.streakData.totalSessions).toBe(20);
      expect(result.current.streakData.streakFreezeCount).toBe(2);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      const { result } = renderHook(() => useStreakSystem());

      // Should fall back to default data
      expect(result.current.streakData.currentStreak).toBe(0);
    });
  });

  describe('recordSession - Streak Calculation', () => {
    it('should start a new streak on first session', () => {
      const { result } = renderHook(() => useStreakSystem());

      let reward;
      act(() => {
        reward = result.current.recordSession();
      });

      expect(result.current.streakData.currentStreak).toBe(1);
      expect(result.current.streakData.longestStreak).toBe(1);
      expect(result.current.streakData.totalSessions).toBe(1);
      expect(result.current.streakData.lastSessionDate).toBe(getTodayString());
      expect(reward).toBeNull(); // No reward for day 1
    });

    it('should not record multiple sessions on the same day', () => {
      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.recordSession();
      });

      const firstSessionData = { ...result.current.streakData };

      act(() => {
        result.current.recordSession();
      });

      // Should be the same
      expect(result.current.streakData).toEqual(firstSessionData);
    });

    it('should continue streak on consecutive days', () => {
      const savedData = {
        currentStreak: 1,
        longestStreak: 1,
        lastSessionDate: getYesterdayString(),
        totalSessions: 1,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.recordSession();
      });

      expect(result.current.streakData.currentStreak).toBe(2);
      expect(result.current.streakData.longestStreak).toBe(2);
      expect(result.current.streakData.totalSessions).toBe(2);
    });

    it('should break streak after missing days', () => {
      const savedData = {
        currentStreak: 5,
        longestStreak: 5,
        lastSessionDate: getDaysAgoString(3), // 3 days ago
        totalSessions: 5,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.recordSession();
      });

      // Streak should reset to 1
      expect(result.current.streakData.currentStreak).toBe(1);
      expect(result.current.streakData.longestStreak).toBe(5); // Longest should remain
      expect(result.current.streakData.totalSessions).toBe(6);
    });

    it('should update longest streak when current exceeds it', () => {
      const savedData = {
        currentStreak: 9,
        longestStreak: 5,
        lastSessionDate: getYesterdayString(),
        totalSessions: 9,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.recordSession();
      });

      expect(result.current.streakData.currentStreak).toBe(10);
      expect(result.current.streakData.longestStreak).toBe(10);
    });

    it('should return reward at milestone streak', () => {
      const savedData = {
        currentStreak: 2,
        longestStreak: 2,
        lastSessionDate: getYesterdayString(),
        totalSessions: 2,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      let reward;
      act(() => {
        reward = result.current.recordSession();
      });

      // Day 3 should have a reward
      expect(reward).toEqual({
        milestone: 3,
        title: 'Getting Started',
        description: '3 days in a row!',
        xpBonus: 50,
      });
    });
  });

  describe('Streak Freeze Logic', () => {
    it('should use streak freeze when missing one day', () => {
      const savedData = {
        currentStreak: 5,
        longestStreak: 5,
        lastSessionDate: getDaysAgoString(2), // 2 days ago
        totalSessions: 5,
        streakFreezeCount: 1,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      // Hook should automatically use freeze on load
      expect(result.current.streakData.currentStreak).toBe(5);
      expect(result.current.streakData.streakFreezeCount).toBe(0);
    });

    it('should break streak if no freeze available', () => {
      const savedData = {
        currentStreak: 5,
        longestStreak: 5,
        lastSessionDate: getDaysAgoString(2), // 2 days ago
        totalSessions: 5,
        streakFreezeCount: 0, // No freezes
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      // Streak should be broken
      expect(result.current.streakData.currentStreak).toBe(0);
    });

    it('should not use freeze for longer gaps', () => {
      const savedData = {
        currentStreak: 5,
        longestStreak: 5,
        lastSessionDate: getDaysAgoString(3), // 3 days ago
        totalSessions: 5,
        streakFreezeCount: 2, // Has freezes but gap too large
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      // Streak should be broken, freezes not used
      expect(result.current.streakData.currentStreak).toBe(0);
      expect(result.current.streakData.streakFreezeCount).toBe(2);
    });

    it('should manually use a streak freeze', () => {
      const savedData = {
        currentStreak: 5,
        longestStreak: 5,
        lastSessionDate: getYesterdayString(),
        totalSessions: 5,
        streakFreezeCount: 3,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      let success;
      act(() => {
        success = result.current.useStreakFreeze();
      });

      expect(success).toBe(true);
      expect(result.current.streakData.streakFreezeCount).toBe(2);
    });

    it('should fail to use freeze when none available', () => {
      const savedData = {
        currentStreak: 5,
        longestStreak: 5,
        lastSessionDate: getYesterdayString(),
        totalSessions: 5,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      let success;
      act(() => {
        success = result.current.useStreakFreeze();
      });

      expect(success).toBe(false);
      expect(result.current.streakData.streakFreezeCount).toBe(0);
    });

    it('should earn streak freeze', () => {
      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.earnStreakFreeze();
      });

      expect(result.current.streakData.streakFreezeCount).toBe(1);
    });

    it('should earn multiple streak freezes', () => {
      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.addStreakFreezes(5);
      });

      expect(result.current.streakData.streakFreezeCount).toBe(5);
    });

    it('should not add negative freezes', () => {
      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.addStreakFreezes(-5);
      });

      expect(result.current.streakData.streakFreezeCount).toBe(0);
    });
  });

  describe('Day Rollover', () => {
    it('should handle day rollover correctly', () => {
      const yesterday = getYesterdayString();
      const savedData = {
        currentStreak: 3,
        longestStreak: 3,
        lastSessionDate: yesterday,
        totalSessions: 3,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      // Record session today
      act(() => {
        result.current.recordSession();
      });

      expect(result.current.streakData.lastSessionDate).toBe(getTodayString());
      expect(result.current.streakData.currentStreak).toBe(4);
    });

    it('should persist streak data across component remounts', () => {
      const { result: firstRender } = renderHook(() => useStreakSystem());

      act(() => {
        firstRender.current.recordSession();
      });

      const streakAfterFirst = firstRender.current.streakData.currentStreak;

      // Unmount and remount
      const { result: secondRender } = renderHook(() => useStreakSystem());

      expect(secondRender.current.streakData.currentStreak).toBe(streakAfterFirst);
    });
  });

  describe('Streak Freeze Event Listener', () => {
    it('should handle grant streak freeze event', () => {
      const { result } = renderHook(() => useStreakSystem());

      const event = new CustomEvent('petIsland_grantStreakFreezes', {
        detail: { amount: 3 },
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(result.current.streakData.streakFreezeCount).toBe(3);
    });

    it('should update lastMonthlyFreezeGrant on grant', () => {
      const { result } = renderHook(() => useStreakSystem());

      const event = new CustomEvent('petIsland_grantStreakFreezes', {
        detail: { amount: 1 },
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(result.current.streakData.lastMonthlyFreezeGrant).toBeTruthy();
    });

    it('should not grant freezes with zero amount', () => {
      const { result } = renderHook(() => useStreakSystem());

      const event = new CustomEvent('petIsland_grantStreakFreezes', {
        detail: { amount: 0 },
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(result.current.streakData.streakFreezeCount).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    it('should get next milestone correctly', () => {
      const savedData = {
        currentStreak: 5,
        longestStreak: 5,
        lastSessionDate: getTodayString(),
        totalSessions: 5,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      const nextMilestone = result.current.getNextMilestone();

      expect(nextMilestone).toEqual({
        milestone: 7,
        title: 'Week Warrior',
        description: '1 week streak!',
        xpBonus: 100,
      });
    });

    it('should return null when no next milestone', () => {
      const savedData = {
        currentStreak: 200,
        longestStreak: 200,
        lastSessionDate: getTodayString(),
        totalSessions: 200,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      const nextMilestone = result.current.getNextMilestone();

      expect(nextMilestone).toBeNull();
    });

    it('should return correct emoji for streak levels', () => {
      const { result } = renderHook(() => useStreakSystem());

      expect(result.current.getStreakEmoji(0)).toBe('🌱');
      expect(result.current.getStreakEmoji(3)).toBe('✨');
      expect(result.current.getStreakEmoji(7)).toBe('🎯');
      expect(result.current.getStreakEmoji(14)).toBe('💪');
      expect(result.current.getStreakEmoji(30)).toBe('🔥');
      expect(result.current.getStreakEmoji(50)).toBe('⭐');
      expect(result.current.getStreakEmoji(100)).toBe('🏆');
    });
  });

  describe('resetStreak', () => {
    it('should reset streak data to defaults', () => {
      const savedData = {
        currentStreak: 10,
        longestStreak: 15,
        lastSessionDate: getTodayString(),
        totalSessions: 50,
        streakFreezeCount: 2,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.resetStreak();
      });

      expect(result.current.streakData).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: '',
        totalSessions: 0,
        streakFreezeCount: 3, // Reset gives 3 freezes
      });
    });
  });

  describe('Streak Rewards', () => {
    it('should have correct streak rewards defined', () => {
      const { result } = renderHook(() => useStreakSystem());

      expect(result.current.streakRewards).toBeDefined();
      expect(result.current.streakRewards.length).toBeGreaterThan(0);

      // Check specific milestones
      const day7Reward = result.current.streakRewards.find((r) => r.milestone === 7);
      expect(day7Reward).toEqual({
        milestone: 7,
        title: 'Week Warrior',
        description: '1 week streak!',
        xpBonus: 100,
      });

      const day30Reward = result.current.streakRewards.find((r) => r.milestone === 30);
      expect(day30Reward).toEqual({
        milestone: 30,
        title: 'Monthly Master',
        description: '30 days of focus!',
        xpBonus: 500,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty lastSessionDate', () => {
      const savedData = {
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: '',
        totalSessions: 0,
        streakFreezeCount: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));

      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.recordSession();
      });

      expect(result.current.streakData.currentStreak).toBe(1);
    });

    it('should save data to localStorage after each operation', () => {
      const { result } = renderHook(() => useStreakSystem());

      act(() => {
        result.current.recordSession();
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.currentStreak).toBe(1);
    });
  });
});
