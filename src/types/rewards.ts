/**
 * Unified Reward Types
 *
 * Consolidated reward type definitions used across the application.
 * This eliminates duplicate reward interfaces scattered across hooks and services.
 */

// ============================================================================
// Base Reward Types
// ============================================================================

/**
 * Base reward type union - all possible reward types in the app
 */
export type RewardType =
  | 'xp'
  | 'coins'
  | 'pet'
  | 'background'
  | 'badge'
  | 'title'
  | 'cosmetic'
  | 'ability'
  | 'streak_freeze'
  | 'booster';

/**
 * Rarity levels for rewards and items
 */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Base reward interface - extended by specific reward types
 */
export interface BaseReward {
  type: RewardType;
  amount?: number;
  itemId?: string;
  description: string;
}

// ============================================================================
// XP Reward Types
// ============================================================================

/**
 * Source of XP bonus multipliers
 */
export type XPBonusSource =
  | 'streak'
  | 'double_xp_event'
  | 'perfect_focus'
  | 'good_focus'
  | 'achievement'
  | 'quest_completion'
  | 'boss_defeat'
  | 'first_session_of_day';

/**
 * XP reward result from session completion
 * Used by useXPSystem hook
 */
export interface XPReward {
  xpGained: number;
  baseXP: number;
  bonusXP: number;
  bonusMultiplier: number;
  hasBonusXP: boolean;
  bonusType: 'none' | 'lucky' | 'super_lucky' | 'jackpot';
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  unlockedRewards: UnlockedReward[];
  subscriptionMultiplier: number;
}

/**
 * Reward unlocked when leveling up
 */
export interface UnlockedReward {
  type: 'animal' | 'biome';
  name: string;
  description: string;
  level: number;
}

/**
 * XP calculation result from types/xp-system.ts
 */
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
// Coin Reward Types
// ============================================================================

/**
 * Coin reward information from session completion
 */
export interface CoinRewardInfo {
  baseCoins: number;
  focusBonus: number;
  boosterBonus: number;
  totalCoins: number;
  boosterMultiplier: number;
}

/**
 * Simple coin reward (from hooks/useCoinSystem)
 */
export interface CoinReward {
  amount: number;
  source: 'session' | 'achievement' | 'daily' | 'quest' | 'bonus';
  multiplier?: number;
}

// ============================================================================
// Quest and Daily Rewards
// ============================================================================

/**
 * Quest completion reward
 */
export interface QuestReward {
  xp: number;
  coins: number;
  bonusItem?: string;
}

/**
 * Streak milestone reward
 */
export interface StreakReward {
  xp: number;
  coins: number;
  milestone: number;
  bonusMultiplier?: number;
}

/**
 * Daily login reward
 */
export interface DailyReward {
  day: number;
  type: RewardType;
  amount: number;
  description: string;
  icon: string;
  isMilestone?: boolean;
}

// ============================================================================
// Level Up Rewards
// ============================================================================

/**
 * Result of a level up event
 */
export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  xpGained: number;
  unlockedRewards: LevelReward[];
}

/**
 * Reward unlocked at a specific level
 */
export interface LevelReward {
  type: 'pet' | 'biome' | 'background' | 'badge' | 'feature';
  id: string;
  name: string;
  description: string;
  unlockedAt: number;
  icon?: string;
}

// ============================================================================
// Battle Pass / Season Rewards
// ============================================================================

/**
 * Battle pass tier reward
 */
export interface BattlePassReward {
  type: RewardType | 'pet' | 'background' | 'badge' | 'streak_freeze' | 'booster';
  amount?: number;
  itemId?: string;
  itemName: string;
  rarity: Rarity;
  icon: string;
}

// ============================================================================
// Milestone Rewards
// ============================================================================

/**
 * Milestone celebration rewards
 */
export interface MilestoneReward {
  xp?: number;
  coins?: number;
  badge?: string;
  specialItem?: string;
}

// ============================================================================
// Boss Challenge Rewards
// ============================================================================

/**
 * Rewards from boss challenge completion
 */
export interface BossChallengeReward {
  xp: number;
  coins: number;
  badge?: string;
  specialReward?: string;
}

/**
 * Boss progress information during session
 */
export interface BossProgressInfo {
  bossDefeated: boolean;
  bossId?: string;
  bossName?: string;
  bossRewards?: {
    xp: number;
    coins: number;
    badge?: string;
  };
  currentProgress: number;
  targetProgress: number;
}
