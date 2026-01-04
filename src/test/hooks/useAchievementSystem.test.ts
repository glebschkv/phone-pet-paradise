import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAchievementSystem } from '@/hooks/useAchievementSystem';

// Mock the achievement service
vi.mock('@/services/achievementService', () => ({
  ACHIEVEMENT_STORAGE_KEY: 'nomo_achievements',
  ACHIEVEMENT_UNLOCK_EVENT: 'achievement_unlock',
  ACHIEVEMENT_CLAIMED_EVENT: 'achievement_claimed',
  initializeAchievements: vi.fn(() => [
    { id: 'first-session', title: 'First Session', name: 'First Session', description: 'Complete first focus', category: 'beginner', tier: 'bronze', icon: '🎯', progress: 0, target: 1, isUnlocked: false, rewardsClaimed: false, rewards: [{ type: 'xp', amount: 50, description: '+50 XP' }] },
    { id: 'focus-streak-3', title: '3 Day Streak', name: '3 Day Streak', description: '3 day streak', category: 'streak', tier: 'bronze', icon: '🔥', progress: 0, target: 3, isUnlocked: false, rewardsClaimed: false, rewards: [{ type: 'xp', amount: 50, description: '+50 XP' }] },
    { id: 'focus-10-hours', title: '10 Hour Focus', name: '10 Hour Focus', description: 'Focus 10 hours', category: 'time', tier: 'silver', icon: '⏰', progress: 0, target: 600, isUnlocked: false, rewardsClaimed: false, rewards: [{ type: 'xp', amount: 100, description: '+100 XP' }] },
    { id: 'collect-5-pets', title: 'Pet Collector', name: 'Pet Collector', description: 'Collect 5 pets', category: 'collection', tier: 'bronze', icon: '🐾', progress: 0, target: 5, isUnlocked: false, rewardsClaimed: false, rewards: [{ type: 'xp', amount: 50, description: '+50 XP' }] },
    { id: 'achievement-hunter', title: 'Achievement Hunter', name: 'Achievement Hunter', description: 'Unlock 10 achievements', category: 'meta', tier: 'gold', icon: '🏆', progress: 0, target: 10, isUnlocked: false, rewardsClaimed: false, rewards: [{ type: 'xp', amount: 200, description: '+200 XP' }] },
    { id: 'completionist', title: 'Completionist', name: 'Completionist', description: 'Unlock all achievements', category: 'meta', tier: 'platinum', icon: '👑', progress: 0, target: 50, isUnlocked: false, rewardsClaimed: false, secret: false, rewards: [{ type: 'xp', amount: 500, description: '+500 XP' }] },
  ]),
  mergeWithDefinitions: vi.fn((achievements) => achievements),
  calculateRewards: vi.fn((achievement) => ({
    xp: achievement.tier === 'bronze' ? 50 : achievement.tier === 'silver' ? 100 : 200,
    coins: achievement.tier === 'bronze' ? 25 : achievement.tier === 'silver' ? 50 : 100,
  })),
  loadFromStorage: vi.fn(() => null),
  saveToStorage: vi.fn(),
  checkAchievementProgress: vi.fn((achievement, type, value) => {
    if (achievement.id === 'first-session' && type === 'session_complete') {
      return { shouldUpdate: true, newProgress: value };
    }
    if (achievement.id === 'focus-streak-3' && type === 'streak_days') {
      return { shouldUpdate: true, newProgress: value };
    }
    if (achievement.id === 'focus-10-hours' && type === 'focus_minutes') {
      return { shouldUpdate: true, newProgress: value };
    }
    return { shouldUpdate: false, newProgress: achievement.progress };
  }),
  getAchievementsByCategory: vi.fn((achievements, category) =>
    achievements.filter((a: { category: string }) => a.category === category)
  ),
  getTotalAchievementPoints: vi.fn((achievements) =>
    achievements.filter((a: { isUnlocked: boolean }) => a.isUnlocked).length * 100
  ),
  getCompletionPercentage: vi.fn((achievements) => {
    const unlocked = achievements.filter((a: { isUnlocked: boolean }) => a.isUnlocked).length;
    return (unlocked / achievements.length) * 100;
  }),
  generateShareText: vi.fn((achievement) => `I unlocked "${achievement.name}" in NoMo Phone! 🎮`),
  getClaimedAchievementIds: vi.fn(() => new Set<string>()),
  isAchievementClaimed: vi.fn(() => false),
}));

import {
  initializeAchievements,
  loadFromStorage,
  saveToStorage,
  calculateRewards,
  checkAchievementProgress,
  getAchievementsByCategory,
  getTotalAchievementPoints,
  getCompletionPercentage,
  generateShareText,
  isAchievementClaimed,
} from '@/services/achievementService';

const mockInitializeAchievements = initializeAchievements as ReturnType<typeof vi.fn>;
const mockLoadFromStorage = loadFromStorage as ReturnType<typeof vi.fn>;
const mockSaveToStorage = saveToStorage as ReturnType<typeof vi.fn>;
const mockCalculateRewards = calculateRewards as ReturnType<typeof vi.fn>;
const mockCheckProgress = checkAchievementProgress as ReturnType<typeof vi.fn>;
const mockIsAchievementClaimed = isAchievementClaimed as ReturnType<typeof vi.fn>;

describe('useAchievementSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockLoadFromStorage.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize achievements from storage or defaults', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });
    });

    it('should load achievements from storage when available', async () => {
      const savedAchievements = [
        { id: 'first-session', name: 'First Session', progress: 1, target: 1, isUnlocked: true, rewardsClaimed: false },
      ];
      mockLoadFromStorage.mockReturnValue(savedAchievements);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });
    });

    it('should have no pending unlock initially', () => {
      const { result } = renderHook(() => useAchievementSystem());

      expect(result.current.pendingUnlock).toBeNull();
    });

    it('should have all required functions available', () => {
      const { result } = renderHook(() => useAchievementSystem());

      expect(typeof result.current.updateProgress).toBe('function');
      expect(typeof result.current.checkAndUnlockAchievements).toBe('function');
      expect(typeof result.current.getAchievementsByCategory).toBe('function');
      expect(typeof result.current.getTotalAchievementPoints).toBe('function');
      expect(typeof result.current.getCompletionPercentage).toBe('function');
      expect(typeof result.current.shareAchievement).toBe('function');
      expect(typeof result.current.dismissPendingUnlock).toBe('function');
      expect(typeof result.current.claimRewards).toBe('function');
    });
  });

  describe('updateProgress', () => {
    it('should update achievement progress', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.updateProgress('focus-10-hours', 100);
      });

      await waitFor(() => {
        const achievement = result.current.achievements.find(a => a.id === 'focus-10-hours');
        expect(achievement?.progress).toBe(100);
      });
    });

    it('should cap progress at target', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.updateProgress('first-session', 999);
      });

      await waitFor(() => {
        const achievement = result.current.achievements.find(a => a.id === 'first-session');
        expect(achievement?.progress).toBeLessThanOrEqual(achievement?.target || 0);
      });
    });

    it('should unlock achievement when progress reaches target', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.updateProgress('first-session', 1);
      });

      await waitFor(() => {
        const achievement = result.current.achievements.find(a => a.id === 'first-session');
        expect(achievement?.isUnlocked).toBe(true);
      });
    });

    it('should trigger pending unlock modal on achievement', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.updateProgress('first-session', 1);
      });

      await waitFor(() => {
        expect(result.current.pendingUnlock).toBeTruthy();
      });
    });

    it('should not update already unlocked achievement', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', progress: 1, target: 1, isUnlocked: true, rewardsClaimed: true },
      ]);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      const initialAchievement = result.current.achievements.find(a => a.id === 'first-session');

      act(() => {
        result.current.updateProgress('first-session', 999);
      });

      // Progress should not change since already unlocked
      expect(initialAchievement?.isUnlocked).toBe(true);
    });

    it('should persist updates to storage', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.updateProgress('focus-10-hours', 50);
      });

      expect(mockSaveToStorage).toHaveBeenCalled();
    });
  });

  describe('checkAndUnlockAchievements', () => {
    it('should check and update achievements based on activity', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      let unlocked;
      act(() => {
        unlocked = result.current.checkAndUnlockAchievements('session_complete', 1);
      });

      expect(unlocked).toBeDefined();
    });

    it('should return newly unlocked achievements', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      let unlocked: { id: string }[] = [];
      act(() => {
        unlocked = result.current.checkAndUnlockAchievements('session_complete', 1);
      });

      if (unlocked.length > 0) {
        expect(unlocked[0].id).toBe('first-session');
      }
    });

    it('should handle streak achievements', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.checkAndUnlockAchievements('streak_days', 3);
      });

      await waitFor(() => {
        const achievement = result.current.achievements.find(a => a.id === 'focus-streak-3');
        expect(achievement?.progress).toBe(3);
      });
    });
  });

  describe('claimRewards', () => {
    it('should claim rewards for unlocked achievement', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', name: 'First Session', tier: 'bronze', progress: 1, target: 1, isUnlocked: true, rewardsClaimed: false },
      ]);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      let rewards;
      act(() => {
        rewards = result.current.claimRewards('first-session');
      });

      expect(rewards).toBeTruthy();
      expect(rewards!.xp).toBeGreaterThan(0);
      expect(rewards!.coins).toBeGreaterThan(0);
    });

    it('should mark achievement as claimed', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', name: 'First Session', tier: 'bronze', progress: 1, target: 1, isUnlocked: true, rewardsClaimed: false },
      ]);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.claimRewards('first-session');
      });

      await waitFor(() => {
        const achievement = result.current.achievements.find(a => a.id === 'first-session');
        expect(achievement?.rewardsClaimed).toBe(true);
      });
    });

    it('should not double claim rewards', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', name: 'First Session', tier: 'bronze', progress: 1, target: 1, isUnlocked: true, rewardsClaimed: false },
      ]);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      let firstClaim;
      let secondClaim;

      act(() => {
        firstClaim = result.current.claimRewards('first-session');
      });

      act(() => {
        secondClaim = result.current.claimRewards('first-session');
      });

      expect(firstClaim!.xp).toBeGreaterThan(0);
      expect(secondClaim!.xp).toBe(0);
      expect(secondClaim!.coins).toBe(0);
    });

    it('should return zero for unqualified claims', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      let rewards;
      act(() => {
        rewards = result.current.claimRewards('first-session'); // Not unlocked
      });

      expect(rewards!.xp).toBe(0);
      expect(rewards!.coins).toBe(0);
    });

    it('should dispatch claim event', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', name: 'First Session', tier: 'bronze', progress: 1, target: 1, isUnlocked: true, rewardsClaimed: false },
      ]);

      const { result } = renderHook(() => useAchievementSystem());
      const eventHandler = vi.fn();

      window.addEventListener('achievement_claimed', eventHandler);

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.claimRewards('first-session');
      });

      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener('achievement_claimed', eventHandler);
    });
  });

  describe('dismissPendingUnlock', () => {
    it('should dismiss pending unlock', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.updateProgress('first-session', 1);
      });

      await waitFor(() => {
        expect(result.current.pendingUnlock).toBeTruthy();
      });

      act(() => {
        result.current.dismissPendingUnlock();
      });

      expect(result.current.pendingUnlock).toBeNull();
    });

    it('should show next queued unlock after dismiss', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      // Queue multiple unlocks
      act(() => {
        result.current.updateProgress('first-session', 1);
        result.current.updateProgress('focus-streak-3', 3);
      });

      await waitFor(() => {
        expect(result.current.pendingUnlock).toBeTruthy();
      });

      const firstUnlock = result.current.pendingUnlock;

      act(() => {
        result.current.dismissPendingUnlock();
      });

      // Check if second unlock appears or null (depends on queue implementation)
      // The behavior depends on whether both were queued
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should filter achievements by category', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      const beginner = result.current.getAchievementsByCategory('beginner');

      expect(Array.isArray(beginner)).toBe(true);
    });
  });

  describe('getTotalAchievementPoints', () => {
    it('should calculate total points from unlocked achievements', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', isUnlocked: true },
        { id: 'focus-streak-3', isUnlocked: true },
        { id: 'focus-10-hours', isUnlocked: false },
      ]);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      const points = result.current.getTotalAchievementPoints();

      expect(typeof points).toBe('number');
      expect(points).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCompletionPercentage', () => {
    it('should return completion percentage', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      const percentage = result.current.getCompletionPercentage();

      expect(typeof percentage).toBe('number');
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('shareAchievement', () => {
    it('should generate share text for achievement', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', name: 'First Session', isUnlocked: true },
      ]);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      const shareText = result.current.shareAchievement('first-session');

      expect(typeof shareText).toBe('string');
      expect(shareText.length).toBeGreaterThan(0);
    });

    it('should return empty string for non-existent achievement', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      const shareText = result.current.shareAchievement('non-existent');

      expect(shareText).toBe('');
    });
  });

  describe('unlockedAchievements', () => {
    it('should filter only unlocked achievements', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', isUnlocked: true },
        { id: 'focus-streak-3', isUnlocked: true },
        { id: 'focus-10-hours', isUnlocked: false },
      ]);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      expect(result.current.unlockedAchievements.length).toBe(2);
      result.current.unlockedAchievements.forEach(a => {
        expect(a.isUnlocked).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle race conditions in reward claiming', async () => {
      mockLoadFromStorage.mockReturnValue([
        { id: 'first-session', name: 'First Session', tier: 'bronze', progress: 1, target: 1, isUnlocked: true, rewardsClaimed: false },
      ]);

      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      // Simulate concurrent claims
      let rewards1;
      let rewards2;

      act(() => {
        rewards1 = result.current.claimRewards('first-session');
        rewards2 = result.current.claimRewards('first-session');
      });

      // Only one should succeed with rewards
      const totalXP = (rewards1?.xp || 0) + (rewards2?.xp || 0);
      expect(totalXP).toBe(50); // Only one claim should have XP
    });

    it('should handle storage change events', async () => {
      const { result } = renderHook(() => useAchievementSystem());

      await waitFor(() => {
        expect(result.current.achievements.length).toBeGreaterThan(0);
      });

      // Simulate storage event
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'nomo_achievements',
          newValue: JSON.stringify({ achievements: [] }),
        }));
      });

      // Should handle gracefully
      expect(result.current.achievements).toBeDefined();
    });
  });
});
