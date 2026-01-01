import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Achievement,
  AchievementReward,
  ACHIEVEMENT_STORAGE_KEY,
  TIER_POINTS,
  ACHIEVEMENT_DEFINITIONS,
  initializeAchievements,
  mergeWithDefinitions,
  calculateRewards,
  loadFromStorage,
  saveToStorage,
  checkAchievementProgress,
  getAchievementsByCategory,
  getTotalAchievementPoints,
  getCompletionPercentage,
  generateShareText,
  getClaimedAchievementIds,
  isAchievementClaimed,
} from '@/services/achievementService';

// Mock logger
vi.mock('@/lib/logger', () => ({
  achievementLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('achievementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('TIER_POINTS', () => {
    it('should have correct point values for each tier', () => {
      expect(TIER_POINTS.bronze).toBe(10);
      expect(TIER_POINTS.silver).toBe(25);
      expect(TIER_POINTS.gold).toBe(50);
      expect(TIER_POINTS.platinum).toBe(100);
      expect(TIER_POINTS.diamond).toBe(200);
    });
  });

  describe('ACHIEVEMENT_DEFINITIONS', () => {
    it('should have unique ids for all achievements', () => {
      const ids = ACHIEVEMENT_DEFINITIONS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have all required properties for each achievement', () => {
      ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('title');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('tier');
        expect(achievement).toHaveProperty('icon');
        expect(achievement).toHaveProperty('target');
        expect(achievement).toHaveProperty('rewards');
        expect(Array.isArray(achievement.rewards)).toBe(true);
      });
    });

    it('should have valid categories', () => {
      const validCategories = ['focus', 'collection', 'social', 'special', 'bond', 'economy', 'progression'];
      ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
        expect(validCategories).toContain(achievement.category);
      });
    });

    it('should have valid tiers', () => {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
        expect(validTiers).toContain(achievement.tier);
      });
    });
  });

  describe('initializeAchievements', () => {
    it('should return achievements with default progress values', () => {
      const achievements = initializeAchievements();

      expect(achievements.length).toBe(ACHIEVEMENT_DEFINITIONS.length);

      achievements.forEach(achievement => {
        expect(achievement.progress).toBe(0);
        expect(achievement.isUnlocked).toBe(false);
        expect(achievement.rewardsClaimed).toBe(false);
      });
    });

    it('should preserve all definition properties', () => {
      const achievements = initializeAchievements();
      const firstDef = ACHIEVEMENT_DEFINITIONS[0];
      const firstAchievement = achievements[0];

      expect(firstAchievement.id).toBe(firstDef.id);
      expect(firstAchievement.title).toBe(firstDef.title);
      expect(firstAchievement.description).toBe(firstDef.description);
      expect(firstAchievement.category).toBe(firstDef.category);
      expect(firstAchievement.tier).toBe(firstDef.tier);
      expect(firstAchievement.target).toBe(firstDef.target);
    });
  });

  describe('mergeWithDefinitions', () => {
    it('should preserve progress from saved achievements', () => {
      const saved: Achievement[] = [{
        id: 'focus-beginner',
        title: 'First Steps',
        description: 'Complete your first 10 minutes of focus time',
        category: 'focus',
        tier: 'bronze',
        icon: '🌱',
        target: 10,
        progress: 5,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      }];

      const merged = mergeWithDefinitions(saved);
      const focusBeginner = merged.find(a => a.id === 'focus-beginner');

      expect(focusBeginner?.progress).toBe(5);
    });

    it('should preserve unlocked status', () => {
      const saved: Achievement[] = [{
        id: 'focus-beginner',
        title: 'First Steps',
        description: 'Complete your first 10 minutes of focus time',
        category: 'focus',
        tier: 'bronze',
        icon: '🌱',
        target: 10,
        progress: 10,
        isUnlocked: true,
        unlockedAt: Date.now(),
        rewardsClaimed: true,
        rewards: [],
      }];

      const merged = mergeWithDefinitions(saved);
      const focusBeginner = merged.find(a => a.id === 'focus-beginner');

      expect(focusBeginner?.isUnlocked).toBe(true);
      expect(focusBeginner?.rewardsClaimed).toBe(true);
    });

    it('should add new achievements that are not in saved data', () => {
      const saved: Achievement[] = []; // Empty saved data

      const merged = mergeWithDefinitions(saved);

      expect(merged.length).toBe(ACHIEVEMENT_DEFINITIONS.length);
      merged.forEach(achievement => {
        expect(achievement.progress).toBe(0);
        expect(achievement.isUnlocked).toBe(false);
      });
    });

    it('should update achievement definitions while keeping progress', () => {
      const saved: Achievement[] = [{
        id: 'focus-beginner',
        title: 'Old Title',
        description: 'Old description',
        category: 'focus',
        tier: 'bronze',
        icon: '🌱',
        target: 10,
        progress: 7,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      }];

      const merged = mergeWithDefinitions(saved);
      const focusBeginner = merged.find(a => a.id === 'focus-beginner');
      const definition = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'focus-beginner');

      // Should use new definition values
      expect(focusBeginner?.title).toBe(definition?.title);
      expect(focusBeginner?.description).toBe(definition?.description);
      // But keep progress
      expect(focusBeginner?.progress).toBe(7);
    });
  });

  describe('calculateRewards', () => {
    it('should calculate XP and coins from rewards array', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test achievement',
        category: 'focus',
        tier: 'bronze',
        icon: '🎯',
        target: 10,
        progress: 0,
        isUnlocked: false,
        rewards: [
          { type: 'xp', amount: 100, description: '+100 XP' },
          { type: 'coins', amount: 50, description: '+50 Coins' },
        ],
      };

      const result = calculateRewards(achievement);

      expect(result.xp).toBe(100);
      expect(result.coins).toBe(50);
    });

    it('should sum multiple XP and coin rewards', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test achievement',
        category: 'focus',
        tier: 'gold',
        icon: '🎯',
        target: 10,
        progress: 0,
        isUnlocked: false,
        rewards: [
          { type: 'xp', amount: 100, description: '+100 XP' },
          { type: 'xp', amount: 50, description: '+50 XP' },
          { type: 'coins', amount: 200, description: '+200 Coins' },
          { type: 'coins', amount: 100, description: '+100 Coins' },
        ],
      };

      const result = calculateRewards(achievement);

      expect(result.xp).toBe(150);
      expect(result.coins).toBe(300);
    });

    it('should handle achievements with no XP or coins', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test achievement',
        category: 'focus',
        tier: 'bronze',
        icon: '🎯',
        target: 10,
        progress: 0,
        isUnlocked: false,
        rewards: [
          { type: 'title', itemId: 'champion', description: 'Champion title' },
        ],
      };

      const result = calculateRewards(achievement);

      expect(result.xp).toBe(0);
      expect(result.coins).toBe(0);
    });

    it('should handle empty rewards array', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test achievement',
        category: 'focus',
        tier: 'bronze',
        icon: '🎯',
        target: 10,
        progress: 0,
        isUnlocked: false,
        rewards: [],
      };

      const result = calculateRewards(achievement);

      expect(result.xp).toBe(0);
      expect(result.coins).toBe(0);
    });
  });

  describe('loadFromStorage', () => {
    it('should return null when no data in localStorage', () => {
      const result = loadFromStorage();
      expect(result).toBeNull();
    });

    it('should load and merge achievements from localStorage', () => {
      const savedData = {
        achievements: [{
          id: 'focus-beginner',
          title: 'First Steps',
          description: 'Complete your first 10 minutes of focus time',
          category: 'focus',
          tier: 'bronze',
          icon: '🌱',
          target: 10,
          progress: 8,
          isUnlocked: false,
          rewardsClaimed: false,
          rewards: [],
        }],
      };
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(savedData));

      const result = loadFromStorage();

      expect(result).not.toBeNull();
      expect(result?.length).toBe(ACHIEVEMENT_DEFINITIONS.length);
      const focusBeginner = result?.find(a => a.id === 'focus-beginner');
      expect(focusBeginner?.progress).toBe(8);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, 'invalid json');

      const result = loadFromStorage();

      expect(result).toBeNull();
    });

    it('should handle missing achievements array', () => {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify({}));

      const result = loadFromStorage();

      expect(result).not.toBeNull();
      expect(result?.length).toBe(ACHIEVEMENT_DEFINITIONS.length);
    });
  });

  describe('saveToStorage', () => {
    it('should save achievements to localStorage', () => {
      const achievements = initializeAchievements();
      achievements[0].progress = 5;

      saveToStorage(achievements);

      const saved = JSON.parse(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY) || '{}');
      expect(saved.achievements).toBeDefined();
      expect(saved.achievements.length).toBe(achievements.length);
      expect(saved.achievements[0].progress).toBe(5);
    });

    it('should preserve claimed status from localStorage', () => {
      // First save with claimed achievement
      const achievements = initializeAchievements();
      achievements[0].rewardsClaimed = true;
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify({ achievements }));

      // Then save new data without claimed status
      const newAchievements = initializeAchievements();
      saveToStorage(newAchievements);

      const saved = JSON.parse(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY) || '{}');
      expect(saved.achievements[0].rewardsClaimed).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      const achievements = initializeAchievements();

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => saveToStorage(achievements)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('checkAchievementProgress', () => {
    it('should return shouldUpdate: false for unlocked achievements', () => {
      const achievement: Achievement = {
        id: 'focus-beginner',
        title: 'First Steps',
        description: 'Complete your first 10 minutes of focus time',
        category: 'focus',
        tier: 'bronze',
        icon: '🌱',
        target: 10,
        progress: 10,
        isUnlocked: true,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'focus_time', 100);

      expect(result.shouldUpdate).toBe(false);
      expect(result.newProgress).toBe(10);
    });

    it('should update focus_time achievements', () => {
      const achievement: Achievement = {
        id: 'focus-beginner',
        title: 'First Steps',
        description: 'Complete your first 10 minutes of focus time',
        category: 'focus',
        tier: 'bronze',
        icon: '🌱',
        target: 10,
        progress: 0,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'focus_time', 5);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(5);
    });

    it('should cap progress at target value', () => {
      const achievement: Achievement = {
        id: 'focus-beginner',
        title: 'First Steps',
        description: 'Complete your first 10 minutes of focus time',
        category: 'focus',
        tier: 'bronze',
        icon: '🌱',
        target: 10,
        progress: 0,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'focus_time', 100);

      expect(result.newProgress).toBe(10);
    });

    it('should update session_duration achievements with max value', () => {
      const achievement: Achievement = {
        id: 'marathon-runner',
        title: 'Marathon Runner',
        description: 'Complete a 2-hour focus session',
        category: 'focus',
        tier: 'silver',
        icon: '🏃',
        target: 120,
        progress: 60,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'session_duration', 90);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(90);
    });

    it('should update pet_unlock achievements', () => {
      const achievement: Achievement = {
        id: 'first-friend',
        title: 'First Friend',
        description: 'Unlock your first pet companion',
        category: 'collection',
        tier: 'bronze',
        icon: '🐾',
        target: 1,
        progress: 0,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'pet_unlock', 1);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(1);
    });

    it('should update streak_days achievements', () => {
      const achievement: Achievement = {
        id: 'streak-week',
        title: 'Week Streak',
        description: 'Maintain a 7-day focus streak',
        category: 'special',
        tier: 'silver',
        icon: '🔥',
        target: 7,
        progress: 3,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'streak_days', 5);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(5);
    });

    it('should update level achievements', () => {
      const achievement: Achievement = {
        id: 'level-5',
        title: 'Rising Star',
        description: 'Reach level 5',
        category: 'progression',
        tier: 'bronze',
        icon: '⭐',
        target: 5,
        progress: 1,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'level', 3);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(3);
    });

    it('should update total_coins achievements', () => {
      const achievement: Achievement = {
        id: 'coin-collector-1k',
        title: 'Penny Pincher',
        description: 'Earn 1,000 total coins',
        category: 'economy',
        tier: 'bronze',
        icon: '🪙',
        target: 1000,
        progress: 0,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'total_coins', 500);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(500);
    });

    it('should not update for unrelated activity types', () => {
      const achievement: Achievement = {
        id: 'focus-beginner',
        title: 'First Steps',
        description: 'Complete your first 10 minutes of focus time',
        category: 'focus',
        tier: 'bronze',
        icon: '🌱',
        target: 10,
        progress: 5,
        isUnlocked: false,
        rewardsClaimed: false,
        rewards: [],
      };

      const result = checkAchievementProgress(achievement, 'pet_unlock', 10);

      expect(result.shouldUpdate).toBe(false);
      expect(result.newProgress).toBe(5);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should filter achievements by category', () => {
      const achievements = initializeAchievements();

      const focusAchievements = getAchievementsByCategory(achievements, 'focus');

      expect(focusAchievements.length).toBeGreaterThan(0);
      focusAchievements.forEach(a => {
        expect(a.category).toBe('focus');
      });
    });

    it('should return empty array for non-existent category', () => {
      const achievements = initializeAchievements();

      const result = getAchievementsByCategory(achievements, 'nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getTotalAchievementPoints', () => {
    it('should return 0 when no achievements are unlocked', () => {
      const achievements = initializeAchievements();

      const points = getTotalAchievementPoints(achievements);

      expect(points).toBe(0);
    });

    it('should calculate points based on tier', () => {
      const achievements: Achievement[] = [
        {
          id: 'bronze-1',
          title: 'Bronze',
          description: 'Test',
          category: 'focus',
          tier: 'bronze',
          icon: '🥉',
          target: 1,
          progress: 1,
          isUnlocked: true,
          rewards: [],
        },
        {
          id: 'silver-1',
          title: 'Silver',
          description: 'Test',
          category: 'focus',
          tier: 'silver',
          icon: '🥈',
          target: 1,
          progress: 1,
          isUnlocked: true,
          rewards: [],
        },
        {
          id: 'gold-1',
          title: 'Gold',
          description: 'Test',
          category: 'focus',
          tier: 'gold',
          icon: '🥇',
          target: 1,
          progress: 1,
          isUnlocked: false, // Not unlocked
          rewards: [],
        },
      ];

      const points = getTotalAchievementPoints(achievements);

      expect(points).toBe(TIER_POINTS.bronze + TIER_POINTS.silver);
    });
  });

  describe('getCompletionPercentage', () => {
    it('should return 0 when no achievements are unlocked', () => {
      const achievements = initializeAchievements();

      const percentage = getCompletionPercentage(achievements);

      expect(percentage).toBe(0);
    });

    it('should exclude secret achievements from calculation', () => {
      const achievements: Achievement[] = [
        {
          id: 'normal-1',
          title: 'Normal',
          description: 'Test',
          category: 'focus',
          tier: 'bronze',
          icon: '🎯',
          target: 1,
          progress: 1,
          isUnlocked: true,
          rewards: [],
        },
        {
          id: 'normal-2',
          title: 'Normal 2',
          description: 'Test',
          category: 'focus',
          tier: 'bronze',
          icon: '🎯',
          target: 1,
          progress: 0,
          isUnlocked: false,
          rewards: [],
        },
        {
          id: 'secret-1',
          title: 'Secret',
          description: 'Test',
          category: 'focus',
          tier: 'diamond',
          icon: '🤫',
          target: 1,
          progress: 0,
          isUnlocked: false,
          secret: true,
          rewards: [],
        },
      ];

      const percentage = getCompletionPercentage(achievements);

      // 1 out of 2 non-secret achievements = 50%
      expect(percentage).toBe(50);
    });

    it('should return 100 when all non-secret achievements are unlocked', () => {
      const achievements: Achievement[] = [
        {
          id: 'normal-1',
          title: 'Normal',
          description: 'Test',
          category: 'focus',
          tier: 'bronze',
          icon: '🎯',
          target: 1,
          progress: 1,
          isUnlocked: true,
          rewards: [],
        },
        {
          id: 'secret-1',
          title: 'Secret',
          description: 'Test',
          category: 'focus',
          tier: 'diamond',
          icon: '🤫',
          target: 1,
          progress: 0,
          isUnlocked: false,
          secret: true,
          rewards: [],
        },
      ];

      const percentage = getCompletionPercentage(achievements);

      expect(percentage).toBe(100);
    });
  });

  describe('generateShareText', () => {
    it('should return empty string for locked achievement', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test achievement',
        category: 'focus',
        tier: 'bronze',
        icon: '🎯',
        target: 10,
        progress: 0,
        isUnlocked: false,
        rewards: [],
      };

      const text = generateShareText(achievement);

      expect(text).toBe('');
    });

    it('should generate share text for unlocked achievement', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Focus Master',
        description: 'Test achievement',
        category: 'focus',
        tier: 'gold',
        icon: '🏆',
        target: 10,
        progress: 10,
        isUnlocked: true,
        rewards: [],
      };

      const text = generateShareText(achievement);

      expect(text).toContain('Focus Master');
      expect(text).toContain('#PetParadise');
      expect(text).toContain('Achievement Unlocked');
    });

    it('should increment share count in localStorage', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test achievement',
        category: 'focus',
        tier: 'bronze',
        icon: '🎯',
        target: 10,
        progress: 10,
        isUnlocked: true,
        rewards: [],
      };

      localStorage.setItem('achievement-shares', '5');

      generateShareText(achievement);

      expect(localStorage.getItem('achievement-shares')).toBe('6');
    });
  });

  describe('getClaimedAchievementIds', () => {
    it('should return empty set when no data in localStorage', () => {
      const result = getClaimedAchievementIds();

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('should return set of claimed achievement IDs', () => {
      const savedData = {
        achievements: [
          { id: 'achievement-1', rewardsClaimed: true },
          { id: 'achievement-2', rewardsClaimed: false },
          { id: 'achievement-3', rewardsClaimed: true },
        ],
      };
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(savedData));

      const result = getClaimedAchievementIds();

      expect(result.size).toBe(2);
      expect(result.has('achievement-1')).toBe(true);
      expect(result.has('achievement-3')).toBe(true);
      expect(result.has('achievement-2')).toBe(false);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, 'invalid');

      const result = getClaimedAchievementIds();

      expect(result.size).toBe(0);
    });
  });

  describe('isAchievementClaimed', () => {
    it('should return false when no data in localStorage', () => {
      const result = isAchievementClaimed('test-id');

      expect(result).toBe(false);
    });

    it('should return true for claimed achievement', () => {
      const savedData = {
        achievements: [
          { id: 'test-id', rewardsClaimed: true },
        ],
      };
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(savedData));

      const result = isAchievementClaimed('test-id');

      expect(result).toBe(true);
    });

    it('should return false for unclaimed achievement', () => {
      const savedData = {
        achievements: [
          { id: 'test-id', rewardsClaimed: false },
        ],
      };
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(savedData));

      const result = isAchievementClaimed('test-id');

      expect(result).toBe(false);
    });

    it('should return false for non-existent achievement', () => {
      const savedData = {
        achievements: [
          { id: 'other-id', rewardsClaimed: true },
        ],
      };
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(savedData));

      const result = isAchievementClaimed('test-id');

      expect(result).toBe(false);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, 'invalid');

      const result = isAchievementClaimed('test-id');

      expect(result).toBe(false);
    });
  });

  describe('checkAchievementProgress - additional activity types', () => {
    const createTestAchievement = (id: string, target: number, progress: number = 0): Achievement => ({
      id,
      title: 'Test',
      description: 'Test',
      category: 'focus',
      tier: 'bronze',
      icon: '🎯',
      target,
      progress,
      isUnlocked: false,
      rewards: [],
    });

    it('should update sessions_count achievements', () => {
      const achievement = createTestAchievement('session-starter', 5);
      const result = checkAchievementProgress(achievement, 'sessions_count', 3);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(3);
    });

    it('should update rare_pets achievements', () => {
      const achievement = createTestAchievement('rare-finder', 5);
      const result = checkAchievementProgress(achievement, 'rare_pets', 2);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(2);
    });

    it('should update epic_pets achievements', () => {
      const achievement = createTestAchievement('epic-hunter', 5);
      const result = checkAchievementProgress(achievement, 'epic_pets', 3);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(3);
    });

    it('should update legendary_pets achievements', () => {
      const achievement = createTestAchievement('legendary-hunter', 3);
      const result = checkAchievementProgress(achievement, 'legendary_pets', 1);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(1);
    });

    it('should update biome_unlock achievements', () => {
      const achievement = createTestAchievement('biome-explorer', 8);
      const result = checkAchievementProgress(achievement, 'biome_unlock', 4);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(4);
    });

    it('should update bond_level achievements', () => {
      const achievement = createTestAchievement('first-bond', 3);
      achievement.progress = 2;
      const result = checkAchievementProgress(achievement, 'bond_level', 3);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(3);
    });

    it('should update max_bonds achievements', () => {
      const achievement = createTestAchievement('bond-collector', 3);
      const result = checkAchievementProgress(achievement, 'max_bonds', 2);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(2);
    });

    it('should update purchases achievements', () => {
      const achievement = createTestAchievement('first-purchase', 1);
      const result = checkAchievementProgress(achievement, 'purchases', 1);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(1);
    });

    it('should update night_sessions achievements', () => {
      const achievement = createTestAchievement('night-owl', 10);
      const result = checkAchievementProgress(achievement, 'night_sessions', 5);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(5);
    });

    it('should update morning_sessions achievements', () => {
      const achievement = createTestAchievement('early-bird', 10);
      const result = checkAchievementProgress(achievement, 'morning_sessions', 7);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(7);
    });

    it('should update weekend_sessions achievements', () => {
      const achievement = createTestAchievement('weekend-warrior', 20);
      const result = checkAchievementProgress(achievement, 'weekend_sessions', 15);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(15);
    });

    it('should update jackpots achievements', () => {
      const achievement = createTestAchievement('lucky-winner', 5);
      const result = checkAchievementProgress(achievement, 'jackpots', 3);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(3);
    });

    it('should update wheel_spins achievements', () => {
      const achievement = createTestAchievement('wheel-spinner', 25);
      const result = checkAchievementProgress(achievement, 'wheel_spins', 20);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(20);
    });

    it('should update shares achievements', () => {
      const achievement = createTestAchievement('social-butterfly', 5);
      const result = checkAchievementProgress(achievement, 'shares', 3);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(3);
    });

    it('should update achievements_unlocked achievements', () => {
      const achievement = createTestAchievement('achievement-hunter', 25);
      const result = checkAchievementProgress(achievement, 'achievements_unlocked', 15);

      expect(result.shouldUpdate).toBe(true);
      expect(result.newProgress).toBe(15);
    });
  });
});
