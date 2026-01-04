/**
 * XP System Module
 * Re-exports all XP system components for easy importing
 */

// Types
export type {
  XPReward,
  UnlockedReward,
  XPSystemState,
  BonusResult,
} from './xpTypes';

// Constants
export {
  STORAGE_KEY,
  XP_UPDATE_EVENT,
  ANIMAL_PURCHASED_EVENT,
  MAX_LEVEL,
  XP_REWARDS,
  LEVEL_REQUIREMENTS,
  UNLOCKS_BY_LEVEL,
} from './xpConstants';

// Utilities
export {
  calculateRandomBonus,
  calculateLevelRequirement,
  normalizeAnimalList,
  calculateLevel,
} from './xpUtils';

// Main hook
export { useXPSystem } from './useXPSystem';
