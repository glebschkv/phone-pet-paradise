/**
 * Achievement System Types
 *
 * Consolidated type definitions for the achievement system.
 */

import type { BaseReward } from './rewards';

// ============================================================================
// Achievement Categories and Tiers
// ============================================================================

/**
 * Achievement category types
 */
export type AchievementCategory =
  | 'focus'
  | 'collection'
  | 'social'
  | 'special'
  | 'bond'
  | 'economy'
  | 'progression';

/**
 * Achievement tier levels
 */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// ============================================================================
// Achievement Types
// ============================================================================

/**
 * Achievement reward structure
 */
export interface AchievementReward extends BaseReward {
  type: 'xp' | 'coins' | 'title' | 'cosmetic' | 'ability';
}

/**
 * Core achievement interface
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  rewardsClaimed?: boolean;
  secret?: boolean;
  rewards: AchievementReward[];
}

/**
 * Achievement definition without runtime state
 * Used for ACHIEVEMENT_DEFINITIONS constant
 */
export type AchievementDefinition = Omit<
  Achievement,
  'progress' | 'isUnlocked' | 'unlockedAt' | 'rewardsClaimed'
>;

/**
 * Event emitted when an achievement is unlocked
 */
export interface AchievementUnlockEvent {
  achievement: Achievement;
  rewards: { xp: number; coins: number };
}

// ============================================================================
// Achievement System Return Types
// ============================================================================

/**
 * Return type for useAchievementSystem hook
 */
export interface AchievementSystemReturn {
  achievements: Achievement[];
  isLoading: boolean;
  updateProgress: (type: string, value: number) => void;
  claimReward: (achievementId: string) => Promise<{ xp: number; coins: number } | null>;
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getCompletionPercentage: () => number;
  getTotalPoints: () => number;
  getUnclaimedCount: () => number;
  refreshAchievements: () => void;
}

/**
 * Return type for useAchievementTracking hook
 */
export interface AchievementTrackingHook {
  trackFocusSession: (durationMinutes: number, sessionCount: number) => void;
  trackPetUnlock: (petCount: number, rarity?: string) => void;
  trackBondLevel: (level: number, maxBondCount: number) => void;
  trackLevelUp: (level: number) => void;
  trackCoinsEarned: (totalCoins: number) => void;
  trackPurchase: (purchaseCount: number) => void;
  trackStreak: (streakDays: number) => void;
  trackSpecialSession: (type: 'night' | 'morning' | 'weekend') => void;
  trackWheelSpin: (spinCount: number) => void;
  trackJackpot: (jackpotCount: number) => void;
  trackShare: (shareCount: number) => void;
  trackBiomeUnlock: (biomeCount: number) => void;
  trackAchievementsUnlocked: (count: number) => void;
}

// ============================================================================
// Achievement Constants
// ============================================================================

/**
 * Points awarded per achievement tier
 */
export const TIER_POINTS: Record<AchievementTier, number> = {
  bronze: 10,
  silver: 25,
  gold: 50,
  platinum: 100,
  diamond: 200,
};
