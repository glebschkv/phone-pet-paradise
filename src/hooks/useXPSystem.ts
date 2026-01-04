/**
 * XP System - Re-export from modular structure
 *
 * This file maintains backwards compatibility while the implementation
 * has been split into smaller, more maintainable modules in ./xp/
 */

// Re-export everything from the xp module
export type {
  XPReward,
  UnlockedReward,
  XPSystemState,
  BonusResult,
} from './xp/xpTypes';

export {
  MAX_LEVEL,
  calculateLevelRequirement,
} from './xp';

export { useXPSystem } from './xp/useXPSystem';
