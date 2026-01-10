/**
 * XP System Type Definitions
 *
 * Comprehensive TypeScript interfaces for the XP and leveling system.
 * This ensures type safety across all XP-related functionality.
 */

import { XP_CONFIG, FOCUS_BONUS } from '@/lib/constants';

// ============================================================================
// Core XP Types
// ============================================================================

export interface XPReward {
  /** Base XP earned from the action */
  baseXP: number;
  /** Bonus XP from multipliers */
  bonusXP: number;
  /** Total XP earned (base + bonus) */
  totalXP: number;
  /** Applied multiplier */
  multiplier: number;
  /** Source of the bonus (streak, event, etc.) */
  bonusSource?: XPBonusSource;
}

export type XPBonusSource =
  | 'streak'
  | 'double_xp_event'
  | 'perfect_focus'
  | 'good_focus'
  | 'achievement'
  | 'quest_completion'
  | 'boss_defeat'
  | 'first_session_of_day';

export interface LevelUpResult {
  /** Whether a level up occurred */
  leveledUp: boolean;
  /** Previous level before XP was awarded */
  oldLevel: number;
  /** New level after XP was awarded */
  newLevel: number;
  /** Total XP gained */
  xpGained: number;
  /** Rewards unlocked at new level */
  unlockedRewards: LevelReward[];
}

export interface LevelReward {
  /** Type of reward */
  type: 'pet' | 'biome' | 'background' | 'badge' | 'feature';
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the reward */
  description: string;
  /** Level at which this was unlocked */
  unlockedAt: number;
  /** Icon or image URL */
  icon?: string;
}

// ============================================================================
// XP State Types
// ============================================================================

export interface XPState {
  /** Current total XP */
  currentXP: number;
  /** Current level */
  currentLevel: number;
  /** XP needed to reach next level */
  xpToNextLevel: number;
  /** Total XP required for current level */
  totalXPForCurrentLevel: number;
  /** Progress percentage to next level (0-100) */
  levelProgress: number;
  /** List of unlocked animal types */
  unlockedAnimals: string[];
  /** Current biome */
  currentBiome: string;
  /** Available biomes */
  availableBiomes: string[];
  /** Total XP earned all-time */
  totalXPEarned: number;
  /** XP earned today */
  xpEarnedToday: number;
  /** Last XP award timestamp */
  lastXPAwardedAt?: string;
}

export interface XPProgress {
  /** Current XP within the level */
  currentLevelXP: number;
  /** XP needed to complete current level */
  xpNeededForLevel: number;
  /** Percentage progress (0-100) */
  percentage: number;
  /** XP remaining until next level */
  xpRemaining: number;
}

// ============================================================================
// Session XP Types
// ============================================================================

export interface SessionXPResult extends LevelUpResult {
  /** Session duration in minutes */
  sessionMinutes: number;
  /** Focus bonus applied */
  focusBonus: FocusBonusInfo;
  /** Streak bonus applied */
  streakBonus: StreakBonusInfo;
  /** Event bonus applied */
  eventBonus?: EventBonusInfo;
  /** Coin reward from session */
  coinReward: CoinRewardInfo;
  /** Boss challenge progress */
  bossProgress?: BossProgressInfo;
}

export interface FocusBonusInfo {
  /** Type of focus bonus */
  type: 'perfect' | 'good' | 'none';
  /** Multiplier applied */
  multiplier: number;
  /** Label to display */
  label: string;
  /** Number of shield attempts */
  shieldAttempts: number;
  /** Bonus coins awarded */
  bonusCoins: number;
}

export interface StreakBonusInfo {
  /** Current streak day */
  currentStreak: number;
  /** Multiplier from streak */
  multiplier: number;
  /** Whether this completed a milestone */
  milestoneReached: boolean;
  /** Milestone number if reached */
  milestoneDay?: number;
  /** Bonus XP from milestone */
  milestoneBonus?: number;
}

export interface EventBonusInfo {
  /** Event ID */
  eventId: string;
  /** Event name */
  eventName: string;
  /** Multiplier from event */
  multiplier: number;
  /** Type of event */
  eventType: 'double_xp' | 'double_coins' | 'bonus_rewards';
}

export interface CoinRewardInfo {
  /** Base coins earned */
  baseCoins: number;
  /** Bonus coins from focus */
  focusBonus: number;
  /** Bonus coins from booster */
  boosterBonus: number;
  /** Total coins earned */
  totalCoins: number;
  /** Booster multiplier applied */
  boosterMultiplier: number;
}

export interface BossProgressInfo {
  /** Whether a boss was defeated */
  bossDefeated: boolean;
  /** Boss challenge ID if defeated */
  bossId?: string;
  /** Boss name if defeated */
  bossName?: string;
  /** Rewards from defeating boss */
  bossRewards?: {
    xp: number;
    coins: number;
    badge?: string;
  };
  /** Current progress toward next boss */
  currentProgress: number;
  /** Target for next boss */
  targetProgress: number;
}

// ============================================================================
// XP System Interface (Hook Return Type)
// ============================================================================

export interface IXPSystem {
  // State
  currentXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  totalXPForCurrentLevel: number;
  unlockedAnimals: string[];
  currentBiome: string;
  availableBiomes: string[];
  isLoading: boolean;

  // Methods
  awardXP: (sessionMinutes: number) => LevelUpResult | Promise<LevelUpResult>;
  addDirectXP: (amount: number) => void;
  getLevelProgress: () => number;
  getXPState: () => XPState;
  getXPProgress: () => XPProgress;
  setCurrentBiome: (biome: string) => void;
  refreshFromBackend?: () => Promise<void>;
}

export interface IBackendXPSystem extends IXPSystem {
  isLoading: boolean;
  error: Error | null;
  refreshFromBackend: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type XPMultiplierType = keyof typeof XP_CONFIG.MULTIPLIERS;
export type FocusBonusType = keyof typeof FOCUS_BONUS;

export interface XPCalculationInput {
  sessionMinutes: number;
  streakDays: number;
  shieldAttempts: number;
  hasAppsConfigured: boolean;
  activeEventMultiplier?: number;
  boosterMultiplier?: number;
}

export interface XPCalculationResult {
  baseXP: number;
  streakBonus: number;
  focusBonus: number;
  eventBonus: number;
  totalXP: number;
  appliedMultipliers: {
    streak: number;
    focus: number;
    event: number;
    total: number;
  };
}

// ============================================================================
// Level Thresholds
// ============================================================================

export interface LevelThreshold {
  level: number;
  totalXPRequired: number;
  xpForThisLevel: number;
  unlocks: LevelReward[];
}

export function getLevelThresholds(): LevelThreshold[] {
  const thresholds: LevelThreshold[] = [];

  for (let level = 1; level <= XP_CONFIG.MAX_LEVEL; level++) {
    const totalXP = level <= XP_CONFIG.LEVEL_THRESHOLDS.length
      ? XP_CONFIG.LEVEL_THRESHOLDS[level - 1]
      : XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1] +
        (level - XP_CONFIG.LEVEL_THRESHOLDS.length) * XP_CONFIG.XP_PER_LEVEL_AFTER_20;

    const prevTotalXP = level === 1
      ? 0
      : level <= XP_CONFIG.LEVEL_THRESHOLDS.length
        ? XP_CONFIG.LEVEL_THRESHOLDS[level - 2]
        : XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1] +
          (level - 1 - XP_CONFIG.LEVEL_THRESHOLDS.length) * XP_CONFIG.XP_PER_LEVEL_AFTER_20;

    thresholds.push({
      level,
      totalXPRequired: totalXP,
      xpForThisLevel: totalXP - prevTotalXP,
      unlocks: [], // Populated by the game data
    });
  }

  return thresholds;
}

// ============================================================================
// XP Calculation Helpers
// ============================================================================

export function calculateSessionXP(input: XPCalculationInput): XPCalculationResult {
  const { sessionMinutes, streakDays, shieldAttempts, hasAppsConfigured, activeEventMultiplier = 1, boosterMultiplier: _boosterMultiplier = 1 } = input;

  // Base XP calculation
  const baseXP = sessionMinutes * XP_CONFIG.BASE_XP_PER_MINUTE;

  // Streak multiplier
  const streakMultiplier = Math.min(
    1 + streakDays * XP_CONFIG.MULTIPLIERS.STREAK_BONUS_PER_DAY,
    XP_CONFIG.MULTIPLIERS.MAX_STREAK_MULTIPLIER
  );
  const streakBonus = Math.floor(baseXP * (streakMultiplier - 1));

  // Focus bonus
  let focusMultiplier = 1;
  if (hasAppsConfigured) {
    if (shieldAttempts === 0) {
      focusMultiplier = FOCUS_BONUS.PERFECT_FOCUS.multiplier;
    } else if (shieldAttempts <= FOCUS_BONUS.GOOD_FOCUS_MAX_ATTEMPTS) {
      focusMultiplier = FOCUS_BONUS.GOOD_FOCUS.multiplier;
    }
  }
  const focusBonus = Math.floor(baseXP * (focusMultiplier - 1));

  // Event bonus
  const eventBonus = Math.floor(baseXP * (activeEventMultiplier - 1));

  // Total calculation
  const totalMultiplier = streakMultiplier * focusMultiplier * activeEventMultiplier;
  const totalXP = Math.floor(baseXP * totalMultiplier);

  return {
    baseXP,
    streakBonus,
    focusBonus,
    eventBonus,
    totalXP,
    appliedMultipliers: {
      streak: streakMultiplier,
      focus: focusMultiplier,
      event: activeEventMultiplier,
      total: totalMultiplier,
    },
  };
}
