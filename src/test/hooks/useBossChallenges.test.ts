import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBossChallenges } from '@/hooks/useBossChallenges';

// Mock storage module
vi.mock('@/lib/storage-keys', () => ({
  STORAGE_KEYS: {
    BOSS_CHALLENGES: 'nomo_boss_challenges',
  },
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock gamification data
const mockBossChallenges = [
  {
    id: 'focus-warrior',
    name: 'Focus Warrior',
    description: 'Complete a 2-hour focus session',
    emoji: '⚔️',
    difficulty: 'normal' as const,
    requirement: { type: 'focus_duration' as const, value: 120 },
    rewards: { xp: 300, coins: 400 },
    cooldownHours: 24,
  },
  {
    id: 'triple-threat',
    name: 'Triple Threat',
    description: 'Complete 3 sessions in a day',
    emoji: '🎯',
    difficulty: 'normal' as const,
    requirement: { type: 'consecutive_sessions' as const, value: 3, timeLimit: 24 },
    rewards: { xp: 200, coins: 300 },
    cooldownHours: 24,
  },
  {
    id: 'weekly-warrior',
    name: 'Weekly Warrior',
    description: '10 hours of focus in a week',
    emoji: '📅',
    difficulty: 'hard' as const,
    requirement: { type: 'total_focus_week' as const, value: 600 },
    rewards: { xp: 1000, coins: 1200 },
    cooldownHours: 168,
  },
  {
    id: 'perfect-day',
    name: 'Perfect Day',
    description: '8 hours of focus in a day',
    emoji: '💯',
    difficulty: 'extreme' as const,
    requirement: { type: 'perfect_day' as const, value: 480 },
    rewards: { xp: 1600, coins: 2000 },
    cooldownHours: 48,
  },
];

vi.mock('@/data/GamificationData', () => ({
  BOSS_CHALLENGES: [
    {
      id: 'focus-warrior',
      name: 'Focus Warrior',
      description: 'Complete a 2-hour focus session',
      emoji: '⚔️',
      difficulty: 'normal',
      requirement: { type: 'focus_duration', value: 120 },
      rewards: { xp: 300, coins: 400 },
      cooldownHours: 24,
    },
    {
      id: 'triple-threat',
      name: 'Triple Threat',
      description: 'Complete 3 sessions in a day',
      emoji: '🎯',
      difficulty: 'normal',
      requirement: { type: 'consecutive_sessions', value: 3, timeLimit: 24 },
      rewards: { xp: 200, coins: 300 },
      cooldownHours: 24,
    },
    {
      id: 'weekly-warrior',
      name: 'Weekly Warrior',
      description: '10 hours of focus in a week',
      emoji: '📅',
      difficulty: 'hard',
      requirement: { type: 'total_focus_week', value: 600 },
      rewards: { xp: 1000, coins: 1200 },
      cooldownHours: 168,
    },
    {
      id: 'perfect-day',
      name: 'Perfect Day',
      description: '8 hours of focus in a day',
      emoji: '💯',
      difficulty: 'extreme',
      requirement: { type: 'perfect_day', value: 480 },
      rewards: { xp: 1600, coins: 2000 },
      cooldownHours: 48,
    },
  ],
  getBossChallengesByDifficulty: vi.fn((difficulty: string) => {
    return mockBossChallenges.filter(c => c.difficulty === difficulty);
  }),
}));

import { storage } from '@/lib/storage-keys';

const mockStorage = storage as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

describe('useBossChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockStorage.get.mockReturnValue(null);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state when no saved data', () => {
      const { result } = renderHook(() => useBossChallenges());

      expect(result.current.state.challengeProgress).toEqual({});
      expect(result.current.state.completedChallenges).toEqual([]);
      expect(result.current.state.activeChallengeId).toBeNull();
      expect(result.current.state.weeklyFocusMinutes).toBe(0);
      expect(result.current.state.dailyFocusMinutes).toBe(0);
      expect(result.current.state.dailySessions).toBe(0);
    });

    it('should load saved state from storage', () => {
      mockStorage.get.mockReturnValue({
        challengeProgress: {
          'focus-warrior': { challengeId: 'focus-warrior', currentProgress: 60, isActive: true }
        },
        completedChallenges: ['triple-threat'],
        activeChallengeId: 'focus-warrior',
        weeklyFocusMinutes: 300,
        dailyFocusMinutes: 120,
        dailySessions: 2,
        lastDayReset: new Date().toDateString(),
        lastWeekReset: new Date().toISOString(),
      });

      const { result } = renderHook(() => useBossChallenges());

      expect(result.current.state.activeChallengeId).toBe('focus-warrior');
      expect(result.current.state.completedChallenges).toContain('triple-threat');
    });

    it('should reset daily stats on new day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockStorage.get.mockReturnValue({
        challengeProgress: {},
        completedChallenges: [],
        activeChallengeId: null,
        weeklyFocusMinutes: 300,
        dailyFocusMinutes: 120,
        dailySessions: 3,
        lastDayReset: yesterday.toDateString(),
        lastWeekReset: new Date().toISOString(),
      });

      const { result } = renderHook(() => useBossChallenges());

      expect(result.current.state.dailyFocusMinutes).toBe(0);
      expect(result.current.state.dailySessions).toBe(0);
    });

    it('should have all required functions available', () => {
      const { result } = renderHook(() => useBossChallenges());

      expect(typeof result.current.startChallenge).toBe('function');
      expect(typeof result.current.recordFocusSession).toBe('function');
      expect(typeof result.current.abandonChallenge).toBe('function');
      expect(typeof result.current.getChallengeStatus).toBe('function');
      expect(typeof result.current.getActiveChallenge).toBe('function');
      expect(typeof result.current.getChallengesByDifficulty).toBe('function');
    });

    it('should expose all challenges', () => {
      const { result } = renderHook(() => useBossChallenges());

      expect(Array.isArray(result.current.allChallenges)).toBe(true);
      expect(result.current.allChallenges.length).toBe(4);
    });
  });

  describe('startChallenge', () => {
    it('should start a challenge successfully', () => {
      const { result } = renderHook(() => useBossChallenges());

      let success: boolean;
      act(() => {
        success = result.current.startChallenge('focus-warrior');
      });

      expect(success!).toBe(true);
      expect(result.current.state.activeChallengeId).toBe('focus-warrior');
    });

    it('should create progress entry for started challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      const progress = result.current.state.challengeProgress['focus-warrior'];
      expect(progress).toBeTruthy();
      expect(progress.isActive).toBe(true);
      expect(progress.currentProgress).toBe(0);
      expect(progress.startedAt).toBeTruthy();
    });

    it('should not start invalid challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      let success: boolean;
      act(() => {
        success = result.current.startChallenge('invalid-challenge');
      });

      expect(success!).toBe(false);
      expect(result.current.state.activeChallengeId).toBeNull();
    });

    it('should not start when already have active challenge', () => {
      mockStorage.get.mockReturnValue({
        challengeProgress: {},
        completedChallenges: [],
        activeChallengeId: 'focus-warrior',
        weeklyFocusMinutes: 0,
        dailyFocusMinutes: 0,
        dailySessions: 0,
        lastDayReset: new Date().toDateString(),
        lastWeekReset: new Date().toISOString(),
      });

      const { result } = renderHook(() => useBossChallenges());

      let success: boolean;
      act(() => {
        success = result.current.startChallenge('triple-threat');
      });

      expect(success!).toBe(false);
      expect(result.current.state.activeChallengeId).toBe('focus-warrior');
    });

    it('should not start challenge on cooldown', () => {
      const recentTime = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(); // 12 hours ago

      mockStorage.get.mockReturnValue({
        challengeProgress: {
          'focus-warrior': {
            challengeId: 'focus-warrior',
            currentProgress: 0,
            isActive: false,
            lastAttemptAt: recentTime,
          }
        },
        completedChallenges: [],
        activeChallengeId: null,
        weeklyFocusMinutes: 0,
        dailyFocusMinutes: 0,
        dailySessions: 0,
        lastDayReset: new Date().toDateString(),
        lastWeekReset: new Date().toISOString(),
      });

      const { result } = renderHook(() => useBossChallenges());

      let success: boolean;
      act(() => {
        success = result.current.startChallenge('focus-warrior');
      });

      expect(success!).toBe(false);
    });
  });

  describe('recordFocusSession', () => {
    it('should track focus minutes', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.recordFocusSession(30);
      });

      expect(result.current.state.dailyFocusMinutes).toBe(30);
      expect(result.current.state.weeklyFocusMinutes).toBe(30);
      expect(result.current.state.dailySessions).toBe(1);
    });

    it('should update duration challenge progress', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      act(() => {
        result.current.recordFocusSession(120); // Exactly 2 hours
      });

      // Challenge should complete since session >= requirement
      expect(result.current.state.completedChallenges).toContain('focus-warrior');
    });

    it('should update consecutive sessions challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('triple-threat');
      });

      // Record 3 sessions
      act(() => {
        result.current.recordFocusSession(30);
      });
      act(() => {
        result.current.recordFocusSession(25);
      });
      act(() => {
        result.current.recordFocusSession(30);
      });

      expect(result.current.state.completedChallenges).toContain('triple-threat');
    });

    it('should update weekly total challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('weekly-warrior');
      });

      // Add enough minutes to complete (600 minutes = 10 hours)
      act(() => {
        result.current.recordFocusSession(600);
      });

      expect(result.current.state.completedChallenges).toContain('weekly-warrior');
    });

    it('should update perfect day challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('perfect-day');
      });

      // Add 8 hours of focus (480 minutes)
      act(() => {
        result.current.recordFocusSession(480);
      });

      expect(result.current.state.completedChallenges).toContain('perfect-day');
    });

    it('should return completion result', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      let sessionResult: ReturnType<typeof result.current.recordFocusSession>;
      act(() => {
        sessionResult = result.current.recordFocusSession(120);
      });

      expect(sessionResult!.challengeCompleted).toBe(true);
      expect(sessionResult!.completedChallenge).toBeTruthy();
      expect(sessionResult!.completedChallenge?.id).toBe('focus-warrior');
    });

    it('should clear active challenge on completion', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      act(() => {
        result.current.recordFocusSession(120);
      });

      expect(result.current.state.activeChallengeId).toBeNull();
    });

    it('should dispatch event on completion', () => {
      const { result } = renderHook(() => useBossChallenges());
      const eventHandler = vi.fn();

      window.addEventListener('petIsland_bossChallengeUpdate', eventHandler);

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      act(() => {
        result.current.recordFocusSession(120);
      });

      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener('petIsland_bossChallengeUpdate', eventHandler);
    });
  });

  describe('abandonChallenge', () => {
    it('should abandon active challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      expect(result.current.state.activeChallengeId).toBe('focus-warrior');

      act(() => {
        result.current.abandonChallenge();
      });

      expect(result.current.state.activeChallengeId).toBeNull();
      expect(result.current.state.challengeProgress['focus-warrior'].isActive).toBe(false);
    });

    it('should do nothing when no active challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      // Should not throw
      act(() => {
        result.current.abandonChallenge();
      });

      expect(result.current.state.activeChallengeId).toBeNull();
    });
  });

  describe('getChallengeStatus', () => {
    it('should return status for available challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      const status = result.current.getChallengeStatus('focus-warrior');

      expect(status.isAvailable).toBe(true);
      expect(status.isActive).toBe(false);
      expect(status.isCompleted).toBe(false);
      expect(status.cooldownRemaining).toBe(0);
    });

    it('should return status for active challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      const status = result.current.getChallengeStatus('focus-warrior');

      expect(status.isAvailable).toBe(false);
      expect(status.isActive).toBe(true);
      expect(status.progress).toBeTruthy();
    });

    it('should return status for completed challenge', () => {
      mockStorage.get.mockReturnValue({
        challengeProgress: {},
        completedChallenges: ['focus-warrior'],
        activeChallengeId: null,
        weeklyFocusMinutes: 0,
        dailyFocusMinutes: 0,
        dailySessions: 0,
        lastDayReset: new Date().toDateString(),
        lastWeekReset: new Date().toISOString(),
      });

      const { result } = renderHook(() => useBossChallenges());

      const status = result.current.getChallengeStatus('focus-warrior');

      expect(status.isCompleted).toBe(true);
    });

    it('should return cooldown remaining for recent attempt', () => {
      const recentTime = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(); // 12 hours ago

      mockStorage.get.mockReturnValue({
        challengeProgress: {
          'focus-warrior': {
            challengeId: 'focus-warrior',
            currentProgress: 0,
            isActive: false,
            lastAttemptAt: recentTime,
          }
        },
        completedChallenges: [],
        activeChallengeId: null,
        weeklyFocusMinutes: 0,
        dailyFocusMinutes: 0,
        dailySessions: 0,
        lastDayReset: new Date().toDateString(),
        lastWeekReset: new Date().toISOString(),
      });

      const { result } = renderHook(() => useBossChallenges());

      const status = result.current.getChallengeStatus('focus-warrior');

      expect(status.cooldownRemaining).toBe(12); // 24 - 12 = 12 hours
    });

    it('should return not available status for invalid challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      const status = result.current.getChallengeStatus('invalid');

      expect(status.isAvailable).toBe(false);
    });
  });

  describe('getActiveChallenge', () => {
    it('should return null when no active challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      const active = result.current.getActiveChallenge();

      expect(active.challenge).toBeNull();
      expect(active.progress).toBeNull();
      expect(active.percentComplete).toBe(0);
    });

    it('should return active challenge details', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      const active = result.current.getActiveChallenge();

      expect(active.challenge).toBeTruthy();
      expect(active.challenge?.id).toBe('focus-warrior');
      expect(active.progress).toBeTruthy();
    });

    it('should calculate percent complete', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('triple-threat');
      });

      act(() => {
        result.current.recordFocusSession(30);
      }); // 1/3 sessions

      const active = result.current.getActiveChallenge();

      expect(active.percentComplete).toBeCloseTo(33.33, 1);
    });
  });

  describe('getChallengesByDifficulty', () => {
    it('should return challenges filtered by difficulty', () => {
      const { result } = renderHook(() => useBossChallenges());

      const normalChallenges = result.current.getChallengesByDifficulty('normal');

      expect(normalChallenges.length).toBe(2);
      normalChallenges.forEach(item => {
        expect(item.challenge.difficulty).toBe('normal');
        expect(item.status).toBeTruthy();
      });
    });

    it('should include status with each challenge', () => {
      const { result } = renderHook(() => useBossChallenges());

      const challenges = result.current.getChallengesByDifficulty('hard');

      challenges.forEach(item => {
        expect(item.status).toHaveProperty('isAvailable');
        expect(item.status).toHaveProperty('isActive');
        expect(item.status).toHaveProperty('isCompleted');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial session progress', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.startChallenge('focus-warrior');
      });

      act(() => {
        result.current.recordFocusSession(60); // Only 1 hour, need 2
      });

      expect(result.current.state.completedChallenges).not.toContain('focus-warrior');
      expect(result.current.state.activeChallengeId).toBe('focus-warrior');
    });

    it('should accumulate focus minutes across sessions', () => {
      const { result } = renderHook(() => useBossChallenges());

      act(() => {
        result.current.recordFocusSession(30);
        result.current.recordFocusSession(45);
        result.current.recordFocusSession(60);
      });

      expect(result.current.state.dailyFocusMinutes).toBe(135);
      expect(result.current.state.dailySessions).toBe(3);
    });
  });
});
