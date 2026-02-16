/**
 * Achievement Service - Re-export from modular structure
 *
 * This file maintains backwards compatibility while the implementation
 * has been split into smaller, more maintainable modules in ./achievement/
 */

// Re-export everything from the achievement module
export type {
  Achievement,
  AchievementReward,
  AchievementUnlockEvent,
  AchievementCategory,
  AchievementTier,
  AchievementDefinition,
} from './achievement';

export {
  // Constants
  ACHIEVEMENT_STORAGE_KEY,
  ACHIEVEMENT_UNLOCK_EVENT,
  ACHIEVEMENT_CLAIMED_EVENT,
  TIER_POINTS,
  // Definitions
  ACHIEVEMENT_DEFINITIONS,
  // Utilities
  initializeAchievements,
  mergeWithDefinitions,
  calculateRewards,
  getAchievementsByCategory,
  getTotalAchievementPoints,
  getCompletionPercentage,
  generateShareText,
  // Progress
  checkAchievementProgress,
  // Storage
  loadFromStorage,
  saveToStorage,
  getClaimedAchievementIds,
  isAchievementClaimed,
  setAchievementUserId,
} from './achievement';
