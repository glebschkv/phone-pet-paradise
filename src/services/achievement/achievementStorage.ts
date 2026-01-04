/**
 * Achievement Storage Functions
 * localStorage operations for achievement data
 */

import { achievementLogger } from '@/lib/logger';
import { Achievement } from './achievementTypes';
import { ACHIEVEMENT_STORAGE_KEY } from './achievementConstants';
import { mergeWithDefinitions } from './achievementUtils';

/**
 * Load achievement data from localStorage
 */
export function loadFromStorage(): Achievement[] | null {
  try {
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return mergeWithDefinitions(data.achievements || []);
    }
    return null;
  } catch (error) {
    achievementLogger.error('Failed to load achievement data:', error);
    return null;
  }
}

/**
 * Save achievement data to localStorage with merging to preserve claimed status
 */
export function saveToStorage(achievementData: Achievement[]): void {
  try {
    // Read current localStorage to preserve any claimed status set by other instances
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    let mergedData = achievementData;

    if (saved) {
      const currentData = JSON.parse(saved);
      const currentAchievements: Achievement[] = currentData.achievements || [];
      const claimedIds = new Set(
        currentAchievements
          .filter(a => a.rewardsClaimed)
          .map(a => a.id)
      );

      // Merge: preserve any claimed status from localStorage
      mergedData = achievementData.map(a => ({
        ...a,
        rewardsClaimed: a.rewardsClaimed || claimedIds.has(a.id)
      }));
    }

    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify({ achievements: mergedData }));
  } catch (error) {
    achievementLogger.error('Failed to save achievement data:', error);
  }
}

/**
 * Get claimed achievement IDs from localStorage
 */
export function getClaimedAchievementIds(): Set<string> {
  try {
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      const achievements: Achievement[] = data.achievements || [];
      return new Set(achievements.filter(a => a.rewardsClaimed).map(a => a.id));
    }
    return new Set();
  } catch (error) {
    achievementLogger.error('Failed to get claimed achievement IDs:', error);
    return new Set();
  }
}

/**
 * Check if an achievement has been claimed in localStorage
 */
export function isAchievementClaimed(achievementId: string): boolean {
  try {
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      const savedAchievement = (data.achievements || []).find((a: Achievement) => a.id === achievementId);
      return savedAchievement?.rewardsClaimed || false;
    }
    return false;
  } catch (error) {
    achievementLogger.error('Failed to check if achievement is claimed:', error);
    return false;
  }
}
