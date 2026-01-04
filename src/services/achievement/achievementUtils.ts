/**
 * Achievement Utility Functions
 * Pure functions for achievement operations
 */

import { Achievement } from './achievementTypes';
import { ACHIEVEMENT_DEFINITIONS } from './achievementDefinitions';
import { TIER_POINTS } from './achievementConstants';

/**
 * Initialize achievements with default values from definitions
 */
export function initializeAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    progress: 0,
    isUnlocked: false,
    rewardsClaimed: false
  }));
}

/**
 * Merge saved achievements with current definitions
 * Handles new achievements being added to the definitions
 */
export function mergeWithDefinitions(saved: Achievement[]): Achievement[] {
  const savedMap = new Map(saved.map(a => [a.id, a]));

  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const existing = savedMap.get(def.id);
    if (existing) {
      // Update definition but keep progress/unlock state
      return {
        ...def,
        progress: existing.progress,
        isUnlocked: existing.isUnlocked,
        unlockedAt: existing.unlockedAt,
        rewardsClaimed: existing.rewardsClaimed || false
      };
    }
    return {
      ...def,
      progress: 0,
      isUnlocked: false,
      rewardsClaimed: false
    };
  });
}

/**
 * Calculate total XP and coins from an achievement's rewards
 */
export function calculateRewards(achievement: Achievement): { xp: number; coins: number } {
  let xp = 0;
  let coins = 0;

  for (const reward of achievement.rewards) {
    if (reward.type === 'xp' && reward.amount) {
      xp += reward.amount;
    } else if (reward.type === 'coins' && reward.amount) {
      coins += reward.amount;
    }
  }

  return { xp, coins };
}

/**
 * Filter achievements by category
 */
export function getAchievementsByCategory(achievements: Achievement[], category: string): Achievement[] {
  return achievements.filter(a => a.category === category);
}

/**
 * Calculate total achievement points based on tier
 */
export function getTotalAchievementPoints(achievements: Achievement[]): number {
  return achievements
    .filter(a => a.isUnlocked)
    .reduce((total, achievement) => total + TIER_POINTS[achievement.tier], 0);
}

/**
 * Get completion percentage (non-secret achievements only)
 */
export function getCompletionPercentage(achievements: Achievement[]): number {
  const nonSecretAchievements = achievements.filter(a => !a.secret);
  const total = nonSecretAchievements.length;
  const unlocked = nonSecretAchievements.filter(a => a.isUnlocked).length;
  return total > 0 ? Math.round((unlocked / total) * 100) : 0;
}

/**
 * Generate shareable achievement text and track share count
 */
export function generateShareText(achievement: Achievement): string {
  if (!achievement.isUnlocked) return '';

  // Track share for achievement
  const currentShares = parseInt(localStorage.getItem('achievement-shares') || '0', 10);
  localStorage.setItem('achievement-shares', String(currentShares + 1));

  return `🏆 Achievement Unlocked: ${achievement.title}\n${achievement.description}\n\nShare your focus journey! #PetParadise #FocusAchievement`;
}
