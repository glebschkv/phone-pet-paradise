import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMilestoneCelebrations, MILESTONE_ACHIEVED_EVENT } from '@/hooks/useMilestoneCelebrations';

// Mock storage module
vi.mock('@/lib/storage-keys', () => ({
  STORAGE_KEYS: {
    MILESTONES: 'nomo_milestones',
  },
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock gamification data
const mockMilestones = [
  { id: 'level-5', type: 'level' as const, threshold: 5, title: 'Rising Star', description: 'Reached Level 5!', emoji: '⭐', celebrationType: 'confetti' as const, rewards: { xp: 200, coins: 400 } },
  { id: 'level-10', type: 'level' as const, threshold: 10, title: 'Dedicated Focuser', description: 'Reached Level 10!', emoji: '🌟', celebrationType: 'stars' as const, rewards: { xp: 500, coins: 1000 } },
  { id: 'streak-7', type: 'streak' as const, threshold: 7, title: 'Week Warrior', description: '7-day streak!', emoji: '🔥', celebrationType: 'confetti' as const, rewards: { xp: 200, coins: 300 } },
  { id: 'streak-30', type: 'streak' as const, threshold: 30, title: 'Monthly Master', description: '30-day streak!', emoji: '🔥', celebrationType: 'fireworks' as const, rewards: { xp: 1000, coins: 1500 } },
  { id: 'sessions-10', type: 'sessions' as const, threshold: 10, title: 'Getting Started', description: '10 focus sessions!', emoji: '🎯', celebrationType: 'confetti' as const, rewards: { coins: 250 } },
  { id: 'hours-10', type: 'focus_hours' as const, threshold: 10, title: '10 Hour Club', description: '10 hours of focus!', emoji: '⏰', celebrationType: 'confetti' as const, rewards: { coins: 350 } },
];

vi.mock('@/data/GamificationData', () => ({
  MILESTONES: [
    { id: 'level-5', type: 'level', threshold: 5, title: 'Rising Star', description: 'Reached Level 5!', emoji: '⭐', celebrationType: 'confetti', rewards: { xp: 200, coins: 400 } },
    { id: 'level-10', type: 'level', threshold: 10, title: 'Dedicated Focuser', description: 'Reached Level 10!', emoji: '🌟', celebrationType: 'stars', rewards: { xp: 500, coins: 1000 } },
    { id: 'streak-7', type: 'streak', threshold: 7, title: 'Week Warrior', description: '7-day streak!', emoji: '🔥', celebrationType: 'confetti', rewards: { xp: 200, coins: 300 } },
    { id: 'streak-30', type: 'streak', threshold: 30, title: 'Monthly Master', description: '30-day streak!', emoji: '🔥', celebrationType: 'fireworks', rewards: { xp: 1000, coins: 1500 } },
    { id: 'sessions-10', type: 'sessions', threshold: 10, title: 'Getting Started', description: '10 focus sessions!', emoji: '🎯', celebrationType: 'confetti', rewards: { coins: 250 } },
    { id: 'hours-10', type: 'focus_hours', threshold: 10, title: '10 Hour Club', description: '10 hours of focus!', emoji: '⏰', celebrationType: 'confetti', rewards: { coins: 350 } },
  ],
  getMilestoneForValue: vi.fn((type: string, value: number) => {
    const milestones = mockMilestones.filter(m => m.type === type);
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (value === milestones[i].threshold) {
        return milestones[i];
      }
    }
    return null;
  }),
  getNextMilestone: vi.fn((type: string, currentValue: number) => {
    const typeMilestones = mockMilestones.filter(m => m.type === type);
    return typeMilestones.find(m => m.threshold > currentValue) || null;
  }),
}));

import { storage } from '@/lib/storage-keys';

const mockStorage = storage as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

describe('useMilestoneCelebrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockStorage.get.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state when no saved data', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(result.current.state.achievedMilestones).toEqual([]);
      expect(result.current.state.claimedMilestones).toEqual([]);
      expect(result.current.state.pendingCelebration).toBeNull();
    });

    it('should load saved state from storage', () => {
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5', 'streak-7'],
        claimedMilestones: ['level-5'],
        pendingCelebration: null,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(result.current.state.achievedMilestones).toContain('level-5');
      expect(result.current.state.achievedMilestones).toContain('streak-7');
      expect(result.current.state.claimedMilestones).toContain('level-5');
    });

    it('should show celebration modal if pending celebration exists', () => {
      const pendingMilestone = mockMilestones[0];
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5'],
        claimedMilestones: [],
        pendingCelebration: pendingMilestone,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(result.current.showCelebration).toBe(true);
      expect(result.current.pendingCelebration).toEqual(pendingMilestone);
    });

    it('should have all required functions available', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(typeof result.current.checkMilestone).toBe('function');
      expect(typeof result.current.checkAllMilestones).toBe('function');
      expect(typeof result.current.dismissCelebration).toBe('function');
      expect(typeof result.current.getMilestoneProgress).toBe('function');
      expect(typeof result.current.getAllProgress).toBe('function');
      expect(typeof result.current.getAchievedMilestones).toBe('function');
      expect(typeof result.current.getUnclaimedRewards).toBe('function');
      expect(typeof result.current.isMilestoneAchieved).toBe('function');
      expect(typeof result.current.getCelebrationType).toBe('function');
    });

    it('should expose all milestones', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(Array.isArray(result.current.allMilestones)).toBe(true);
      expect(result.current.allMilestones.length).toBe(6);
    });
  });

  describe('checkMilestone', () => {
    it('should detect new milestone achievement', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      let achieved;
      act(() => {
        achieved = result.current.checkMilestone('level', 5);
      });

      expect(achieved).toBeTruthy();
      expect(achieved?.id).toBe('level-5');
      expect(result.current.state.achievedMilestones).toContain('level-5');
    });

    it('should trigger celebration on achievement', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      act(() => {
        result.current.checkMilestone('level', 5);
      });

      expect(result.current.showCelebration).toBe(true);
      expect(result.current.pendingCelebration?.id).toBe('level-5');
    });

    it('should dispatch milestone event', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());
      const eventHandler = vi.fn();

      window.addEventListener(MILESTONE_ACHIEVED_EVENT, eventHandler);

      act(() => {
        result.current.checkMilestone('level', 5);
      });

      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener(MILESTONE_ACHIEVED_EVENT, eventHandler);
    });

    it('should not re-achieve already achieved milestone', () => {
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5'],
        claimedMilestones: [],
        pendingCelebration: null,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      let achieved;
      act(() => {
        achieved = result.current.checkMilestone('level', 5);
      });

      expect(achieved).toBeNull();
    });

    it('should return null for non-milestone value', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      let achieved;
      act(() => {
        achieved = result.current.checkMilestone('level', 3); // Not a milestone threshold
      });

      expect(achieved).toBeNull();
    });

    it('should persist state after achievement', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      act(() => {
        result.current.checkMilestone('level', 5);
      });

      expect(mockStorage.set).toHaveBeenCalled();
    });
  });

  describe('checkAllMilestones', () => {
    it('should check multiple milestone types at once', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      let achieved;
      act(() => {
        achieved = result.current.checkAllMilestones({
          level: 5,
          streak: 7,
        });
      });

      expect(achieved).toHaveLength(2);
      expect(result.current.state.achievedMilestones).toContain('level-5');
      expect(result.current.state.achievedMilestones).toContain('streak-7');
    });

    it('should return empty array when no milestones achieved', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      let achieved;
      act(() => {
        achieved = result.current.checkAllMilestones({
          level: 3,
          streak: 4,
        });
      });

      expect(achieved).toHaveLength(0);
    });

    it('should only return newly achieved milestones', () => {
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5'],
        claimedMilestones: [],
        pendingCelebration: null,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      let achieved;
      act(() => {
        achieved = result.current.checkAllMilestones({
          level: 5, // Already achieved
          streak: 7, // New
        });
      });

      expect(achieved).toHaveLength(1);
      expect(achieved![0].id).toBe('streak-7');
    });
  });

  describe('dismissCelebration', () => {
    it('should close celebration modal', () => {
      const pendingMilestone = mockMilestones[0];
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5'],
        claimedMilestones: [],
        pendingCelebration: pendingMilestone,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(result.current.showCelebration).toBe(true);

      act(() => {
        result.current.dismissCelebration();
      });

      expect(result.current.showCelebration).toBe(false);
    });

    it('should mark milestone as claimed', () => {
      const pendingMilestone = mockMilestones[0];
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5'],
        claimedMilestones: [],
        pendingCelebration: pendingMilestone,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      act(() => {
        result.current.dismissCelebration();
      });

      expect(result.current.state.claimedMilestones).toContain('level-5');
      expect(result.current.state.pendingCelebration).toBeNull();
    });

    it('should do nothing if no pending celebration', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      // Should not throw
      act(() => {
        result.current.dismissCelebration();
      });

      expect(result.current.showCelebration).toBe(false);
    });
  });

  describe('getMilestoneProgress', () => {
    it('should return progress toward next milestone', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      const progress = result.current.getMilestoneProgress('level', 3);

      expect(progress.type).toBe('level');
      expect(progress.currentValue).toBe(3);
      expect(progress.nextMilestone?.id).toBe('level-5');
      expect(progress.progressPercent).toBeGreaterThanOrEqual(0);
      expect(progress.progressPercent).toBeLessThan(100);
    });

    it('should return 100% when past all milestones', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      const progress = result.current.getMilestoneProgress('level', 100);

      expect(progress.progressPercent).toBe(100);
      expect(progress.nextMilestone).toBeNull();
    });

    it('should calculate correct progress percentage', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      // At value 3, next milestone is 5 (threshold)
      // Progress from 0 to 5 = 3/5 = 60%
      const progress = result.current.getMilestoneProgress('level', 3);

      expect(progress.progressPercent).toBeCloseTo(60, 0);
    });
  });

  describe('getAllProgress', () => {
    it('should return progress for all provided types', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      const allProgress = result.current.getAllProgress({
        level: 3,
        streak: 5,
        sessions: 8,
      });

      expect(allProgress).toHaveLength(3);
      expect(allProgress.some(p => p.type === 'level')).toBe(true);
      expect(allProgress.some(p => p.type === 'streak')).toBe(true);
      expect(allProgress.some(p => p.type === 'sessions')).toBe(true);
    });

    it('should handle empty values object', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      const allProgress = result.current.getAllProgress({});

      expect(allProgress).toHaveLength(0);
    });
  });

  describe('getAchievedMilestones', () => {
    it('should return list of achieved milestones with details', () => {
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5', 'streak-7'],
        claimedMilestones: [],
        pendingCelebration: null,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      const achieved = result.current.getAchievedMilestones();

      expect(achieved).toHaveLength(2);
      expect(achieved[0]).toHaveProperty('title');
      expect(achieved[0]).toHaveProperty('rewards');
    });

    it('should return empty array when no achievements', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      const achieved = result.current.getAchievedMilestones();

      expect(achieved).toHaveLength(0);
    });
  });

  describe('getUnclaimedRewards', () => {
    it('should return milestones with unclaimed rewards', () => {
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5', 'streak-7'],
        claimedMilestones: ['level-5'],
        pendingCelebration: null,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      const unclaimed = result.current.getUnclaimedRewards();

      expect(unclaimed).toHaveLength(1);
      expect(unclaimed[0].id).toBe('streak-7');
    });

    it('should return empty array when all claimed', () => {
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5', 'streak-7'],
        claimedMilestones: ['level-5', 'streak-7'],
        pendingCelebration: null,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      const unclaimed = result.current.getUnclaimedRewards();

      expect(unclaimed).toHaveLength(0);
    });
  });

  describe('isMilestoneAchieved', () => {
    it('should return true for achieved milestone', () => {
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5'],
        claimedMilestones: [],
        pendingCelebration: null,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(result.current.isMilestoneAchieved('level-5')).toBe(true);
    });

    it('should return false for unachieved milestone', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(result.current.isMilestoneAchieved('level-10')).toBe(false);
    });
  });

  describe('getCelebrationType', () => {
    it('should return celebration type when pending', () => {
      const pendingMilestone = mockMilestones[0];
      mockStorage.get.mockReturnValue({
        achievedMilestones: ['level-5'],
        claimedMilestones: [],
        pendingCelebration: pendingMilestone,
      });

      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(result.current.getCelebrationType()).toBe('confetti');
    });

    it('should return null when no pending celebration', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      expect(result.current.getCelebrationType()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple achievements in sequence', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      act(() => {
        result.current.checkMilestone('level', 5);
      });

      act(() => {
        result.current.dismissCelebration();
      });

      act(() => {
        result.current.checkMilestone('level', 10);
      });

      expect(result.current.state.achievedMilestones).toContain('level-5');
      expect(result.current.state.achievedMilestones).toContain('level-10');
      expect(result.current.showCelebration).toBe(true);
    });

    it('should handle all milestone types', () => {
      const { result } = renderHook(() => useMilestoneCelebrations());

      act(() => {
        result.current.checkMilestone('level', 5);
        result.current.checkMilestone('streak', 7);
        result.current.checkMilestone('sessions', 10);
        result.current.checkMilestone('focus_hours', 10);
      });

      expect(result.current.state.achievedMilestones.length).toBeGreaterThanOrEqual(4);
    });
  });
});
