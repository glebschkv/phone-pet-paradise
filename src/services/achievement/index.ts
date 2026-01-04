/**
 * Achievement System Module
 * Re-exports all achievement system components for easy importing
 */

// Types
export type {
  Achievement,
  AchievementReward,
  AchievementUnlockEvent,
  AchievementCategory,
  AchievementTier,
  AchievementDefinition,
} from './achievementTypes';

// Constants
export {
  ACHIEVEMENT_STORAGE_KEY,
  ACHIEVEMENT_UNLOCK_EVENT,
  ACHIEVEMENT_CLAIMED_EVENT,
  TIER_POINTS,
} from './achievementConstants';

// Definitions
export { ACHIEVEMENT_DEFINITIONS } from './achievementDefinitions';

// Utilities
export {
  initializeAchievements,
  mergeWithDefinitions,
  calculateRewards,
  getAchievementsByCategory,
  getTotalAchievementPoints,
  getCompletionPercentage,
  generateShareText,
} from './achievementUtils';

// Progress tracking
export { checkAchievementProgress } from './achievementProgress';

// Storage
export {
  loadFromStorage,
  saveToStorage,
  getClaimedAchievementIds,
  isAchievementClaimed,
} from './achievementStorage';
