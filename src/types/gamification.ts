/**
 * Gamification Types
 *
 * Consolidated type definitions for gamification systems including
 * battle pass, bosses, events, combos, guilds, and milestones.
 */

import type { Rarity, BattlePassReward, MilestoneReward, BossChallengeReward } from './rewards';
import type { SeasonTheme, CelebrationType } from './theme';

// ============================================================================
// Battle Pass / Season Types
// ============================================================================

/**
 * Battle pass tier definition
 */
export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeReward: BattlePassReward;
  premiumReward?: BattlePassReward;
}

/**
 * Season definition
 */
export interface Season {
  id: string;
  name: string;
  theme: SeasonTheme;
  description: string;
  startDate: string;
  endDate: string;
  tiers: BattlePassTier[];
  exclusivePet?: string;
  backgroundGradient: string;
  accentColor: string;
}

// ============================================================================
// Boss Challenge Types
// ============================================================================

/**
 * Boss challenge difficulty levels
 */
export type BossDifficulty = 'normal' | 'hard' | 'extreme' | 'legendary';

/**
 * Boss challenge requirement types
 */
export type BossRequirementType =
  | 'focus_duration'
  | 'consecutive_sessions'
  | 'total_focus_week'
  | 'perfect_day';

/**
 * Boss challenge requirement
 */
export interface BossRequirement {
  type: BossRequirementType;
  value: number;
  timeLimit?: number;
}

/**
 * Boss challenge definition
 */
export interface BossChallenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  difficulty: BossDifficulty;
  requirement: BossRequirement;
  rewards: BossChallengeReward;
  cooldownHours: number;
}

// ============================================================================
// Special Event Types
// ============================================================================

/**
 * Special event types
 */
export type SpecialEventType =
  | 'double_xp'
  | 'double_coins'
  | 'bonus_rewards'
  | 'special_quest'
  | 'community';

/**
 * Special event definition
 */
export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: SpecialEventType;
  multiplier?: number;
  startDate: string;
  endDate: string;
  backgroundGradient: string;
  rewards?: {
    xp?: number;
    coins?: number;
    specialItem?: string;
  };
}

/**
 * Active event state (from useSpecialEvents hook)
 */
export interface ActiveEventInfo {
  id: string;
  name: string;
  type: SpecialEventType;
  multiplier: number;
  endsAt: string;
}

/**
 * Special events hook state
 */
export interface SpecialEventsState {
  activeEvents: SpecialEvent[];
  upcomingEvents: SpecialEvent[];
  xpMultiplier: number;
  coinMultiplier: number;
  hasActiveEvent: boolean;
}

// ============================================================================
// Lucky Wheel Types
// ============================================================================

/**
 * Lucky wheel prize types
 */
export type LuckyWheelPrizeType =
  | 'xp'
  | 'coins'
  | 'streak_freeze'
  | 'booster'
  | 'mystery_box'
  | 'jackpot';

/**
 * Lucky wheel prize definition
 */
export interface LuckyWheelPrize {
  id: string;
  name: string;
  emoji: string;
  type: LuckyWheelPrizeType;
  amount?: number;
  probability: number;
  rarity: Rarity;
  color: string;
}

// ============================================================================
// Combo System Types
// ============================================================================

/**
 * Combo tier definition
 */
export interface ComboTier {
  minCombo: number;
  name: string;
  multiplier: number;
  color: string;
  emoji: string;
}

// ============================================================================
// Milestone Types
// ============================================================================

/**
 * Milestone category types
 */
export type MilestoneType =
  | 'level'
  | 'streak'
  | 'sessions'
  | 'focus_hours'
  | 'collection'
  | 'achievement';

/**
 * Milestone definition
 */
export interface Milestone {
  id: string;
  type: MilestoneType;
  threshold: number;
  title: string;
  description: string;
  emoji: string;
  celebrationType: CelebrationType;
  rewards?: MilestoneReward;
}

// ============================================================================
// Guild / Team Types
// ============================================================================

/**
 * Guild member role
 */
export type GuildRole = 'leader' | 'officer' | 'member';

/**
 * Guild definition
 */
export interface Guild {
  id: string;
  name: string;
  description: string;
  emoji: string;
  memberCount: number;
  maxMembers: number;
  totalFocusMinutes: number;
  weeklyGoal: number;
  level: number;
  createdAt: string;
  isPublic: boolean;
}

/**
 * Guild member definition
 */
export interface GuildMember {
  id: string;
  name: string;
  avatar?: string;
  role: GuildRole;
  weeklyFocusMinutes: number;
  joinedAt: string;
  isOnline: boolean;
}

/**
 * Guild challenge definition
 */
export interface GuildChallenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  targetMinutes: number;
  currentMinutes: number;
  deadline: string;
  rewards: {
    xp: number;
    coins: number;
    guildXp: number;
  };
  isCompleted: boolean;
}

// ============================================================================
// Quest Types
// ============================================================================

/**
 * Quest status
 */
export type QuestStatus = 'active' | 'completed' | 'expired' | 'locked';

/**
 * Quest type
 */
export type QuestType = 'daily' | 'weekly' | 'special' | 'tutorial';

/**
 * Quest definition
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  progress: number;
  target: number;
  xpReward: number;
  coinReward: number;
  expiresAt?: string;
}

// ============================================================================
// Focus Preset Types
// ============================================================================

/**
 * Focus timer preset
 */
export interface FocusPreset {
  id: string;
  name: string;
  duration: number;
  icon: string;
  description?: string;
  isCustom?: boolean;
}
