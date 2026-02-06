import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDailyLoginRewards } from '@/hooks/useDailyLoginRewards';

const TEST_USER_ID = 'test-user-123';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: TEST_USER_ID },
    isGuestMode: false,
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useDailyLoginRewards', () => {
  const STORAGE_KEY = `pet_paradise_daily_login_${TEST_USER_ID}`;
  const LEGACY_STORAGE_KEY = 'pet_paradise_daily_login';
  const LOGIN_REWARD_EVENT = 'petIsland_dailyLoginReward';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state for first-time user', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.loginState.currentStreak).toBe(0);
      expect(result.current.loginState.totalDaysClaimed).toBe(0);
      expect(result.current.loginState.hasClaimedToday).toBe(false);
    });

    it('should show day 1 reward for first-time user', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.pendingReward).toBeTruthy();
      expect(result.current.pendingReward?.day).toBe(1);
      expect(result.current.showRewardModal).toBe(true);
    });

    it('should load saved state from localStorage', () => {
      const today = new Date().toDateString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 5,
        lastClaimDate: today,
        totalDaysClaimed: 10,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.loginState.currentStreak).toBe(5);
      expect(result.current.loginState.hasClaimedToday).toBe(true);
    });

    it('should not show reward modal if already claimed today', () => {
      const today = new Date().toDateString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 3,
        lastClaimDate: today,
        totalDaysClaimed: 3,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.showRewardModal).toBe(false);
    });

    it('should have all required functions available', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      expect(typeof result.current.claimReward).toBe('function');
      expect(typeof result.current.dismissModal).toBe('function');
      expect(typeof result.current.getTodayReward).toBe('function');
      expect(typeof result.current.getUpcomingRewards).toBe('function');
      expect(typeof result.current.getStreakBonus).toBe('function');
    });

    it('should expose daily rewards data', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      expect(Array.isArray(result.current.dailyRewards)).toBe(true);
      expect(result.current.dailyRewards.length).toBe(7);
    });
  });

  describe('Streak Continuation', () => {
    it('should continue streak when claimed yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 3,
        lastClaimDate: yesterday.toDateString(),
        totalDaysClaimed: 3,
        hasClaimedToday: false,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.loginState.currentStreak).toBe(3);
      expect(result.current.showRewardModal).toBe(true);
      // Should show day 4 reward (next in streak)
      expect(result.current.pendingReward?.day).toBe(4);
    });

    it('should reset streak when gap in claims', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 5,
        lastClaimDate: twoDaysAgo.toDateString(),
        totalDaysClaimed: 5,
        hasClaimedToday: false,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.loginState.currentStreak).toBe(0);
      // Should show day 1 reward (streak reset)
      expect(result.current.pendingReward?.day).toBe(1);
    });
  });

  describe('claimReward', () => {
    it('should claim reward and update state', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.loginState.hasClaimedToday).toBe(false);

      let claimedReward;
      act(() => {
        claimedReward = result.current.claimReward();
      });

      expect(claimedReward).toBeTruthy();
      expect(result.current.loginState.hasClaimedToday).toBe(true);
      expect(result.current.loginState.currentStreak).toBe(1);
      expect(result.current.loginState.totalDaysClaimed).toBe(1);
    });

    it('should close modal after claiming', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.showRewardModal).toBe(true);

      act(() => {
        result.current.claimReward();
      });

      expect(result.current.showRewardModal).toBe(false);
      expect(result.current.pendingReward).toBeNull();
    });

    it('should persist claim to localStorage', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      act(() => {
        result.current.claimReward();
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.hasClaimedToday).toBe(true);
      expect(parsed.currentStreak).toBe(1);
    });

    it('should dispatch reward event', () => {
      const { result } = renderHook(() => useDailyLoginRewards());
      const eventHandler = vi.fn();

      window.addEventListener(LOGIN_REWARD_EVENT, eventHandler);

      act(() => {
        result.current.claimReward();
      });

      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener(LOGIN_REWARD_EVENT, eventHandler);
    });

    it('should return null when already claimed today', () => {
      const today = new Date().toDateString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 3,
        lastClaimDate: today,
        totalDaysClaimed: 3,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      let claimedReward;
      act(() => {
        claimedReward = result.current.claimReward();
      });

      expect(claimedReward).toBeNull();
    });

    it('should return null when no pending reward', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      // Claim first
      act(() => {
        result.current.claimReward();
      });

      // Try to claim again
      let secondClaim;
      act(() => {
        secondClaim = result.current.claimReward();
      });

      expect(secondClaim).toBeNull();
    });
  });

  describe('dismissModal', () => {
    it('should close the reward modal', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.showRewardModal).toBe(true);

      act(() => {
        result.current.dismissModal();
      });

      expect(result.current.showRewardModal).toBe(false);
    });
  });

  describe('getTodayReward', () => {
    it('should return day 1 reward for new user', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      const todayReward = result.current.getTodayReward();

      expect(todayReward.day).toBe(1);
    });

    it('should return correct day based on streak', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 3,
        lastClaimDate: yesterday.toDateString(),
        totalDaysClaimed: 3,
        hasClaimedToday: false,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      const todayReward = result.current.getTodayReward();

      expect(todayReward.day).toBe(4);
    });

    it('should cycle back after day 7', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 7, // Week completed
        lastClaimDate: yesterday.toDateString(),
        totalDaysClaimed: 7,
        hasClaimedToday: false,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      const todayReward = result.current.getTodayReward();

      expect(todayReward.day).toBe(1); // Cycles back
    });
  });

  describe('getUpcomingRewards', () => {
    it('should return 7 upcoming rewards', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      const upcoming = result.current.getUpcomingRewards();

      expect(upcoming.length).toBe(7);
    });

    it('should start from current position in cycle', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 2,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 2,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      const upcoming = result.current.getUpcomingRewards();

      // After claiming at streak position 2, upcoming starts from next position in cycle
      // currentDay = 2 % 7 = 2, dayIndex for i=1 = (2+1) % 7 = 3, which is day 4
      expect(upcoming[0].day).toBe(4);
    });
  });

  describe('getStreakBonus', () => {
    it('should return 0 for streak < 3', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 2,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 2,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.getStreakBonus()).toBe(0);
    });

    it('should return 0.1 for streak >= 3', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 3,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 3,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.getStreakBonus()).toBe(0.1);
    });

    it('should return 0.2 for streak >= 7', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 7,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 7,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.getStreakBonus()).toBe(0.2);
    });

    it('should return 0.3 for streak >= 14', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 14,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 14,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.getStreakBonus()).toBe(0.3);
    });

    it('should return 0.5 for streak >= 30', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 30,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 30,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.getStreakBonus()).toBe(0.5);
    });
  });

  describe('Daily Rewards Data', () => {
    it('should have correct reward types for each day', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      const rewards = result.current.dailyRewards;

      expect(rewards[0].type).toBe('xp');
      expect(rewards[3].type).toBe('streak_freeze');
      expect(rewards[6].type).toBe('mystery_bonus');
    });

    it('should have increasing XP rewards through the week', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      const rewards = result.current.dailyRewards;
      const xpRewards = rewards.filter(r => r.type === 'xp');

      for (let i = 1; i < xpRewards.length; i++) {
        expect(xpRewards[i].xp).toBeGreaterThan(xpRewards[i - 1].xp);
      }
    });

    it('should have day 7 as jackpot day', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      const day7 = result.current.dailyRewards.find(r => r.day === 7);

      expect(day7).toBeTruthy();
      expect(day7?.type).toBe('mystery_bonus');
      expect(day7?.label).toContain('Jackpot');
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      const { result } = renderHook(() => useDailyLoginRewards());

      // Should fallback to first-time user experience
      expect(result.current.pendingReward?.day).toBe(1);
      expect(result.current.showRewardModal).toBe(true);
    });

    it('should handle empty localStorage entry', () => {
      localStorage.setItem(STORAGE_KEY, '');

      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.showRewardModal).toBe(true);
    });

    it('should handle very long streaks', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 365,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 365,
        hasClaimedToday: true,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      // Should still work with modulo
      expect(result.current.getStreakBonus()).toBe(0.5);
      expect(result.current.getTodayReward().day).toBeGreaterThanOrEqual(1);
      expect(result.current.getTodayReward().day).toBeLessThanOrEqual(7);
    });

    it('should handle date boundary crossing', () => {
      // Set time to just before midnight
      vi.setSystemTime(new Date('2024-06-15T23:59:59.999Z'));

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStreak: 3,
        lastClaimDate: '2024-06-15', // Today but as string
        totalDaysClaimed: 3,
        hasClaimedToday: false,
      }));

      const { result } = renderHook(() => useDailyLoginRewards());

      // Behavior depends on date parsing
      expect(result.current.loginState).toBeTruthy();
    });
  });

  describe('Per-User Storage', () => {
    it('should use per-user storage key', () => {
      const { result } = renderHook(() => useDailyLoginRewards());

      act(() => {
        result.current.claimReward();
      });

      // Data should be stored under the user-specific key
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      // Legacy key should NOT have data
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });

    it('should migrate legacy data to user-specific key', () => {
      // Simulate pre-migration data under the legacy key
      const legacyData = JSON.stringify({
        currentStreak: 5,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 10,
        hasClaimedToday: true,
      });
      localStorage.setItem(LEGACY_STORAGE_KEY, legacyData);

      const { result } = renderHook(() => useDailyLoginRewards());

      // Should have loaded the migrated data
      expect(result.current.loginState.currentStreak).toBe(5);
      expect(result.current.loginState.hasClaimedToday).toBe(true);

      // Legacy key should be removed after migration
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
      // Data should now be under the user-specific key
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    it('should not cross-contaminate between users', () => {
      // User A's data under their key
      const otherUserKey = 'pet_paradise_daily_login_other-user-456';
      localStorage.setItem(otherUserKey, JSON.stringify({
        currentStreak: 99,
        lastClaimDate: new Date().toDateString(),
        totalDaysClaimed: 99,
        hasClaimedToday: true,
      }));

      // Current user should see fresh state (no data under their key)
      const { result } = renderHook(() => useDailyLoginRewards());

      expect(result.current.loginState.currentStreak).toBe(0);
      expect(result.current.loginState.hasClaimedToday).toBe(false);
    });
  });
});
