// Gamification Types
// Consolidated type definitions for gamification features

// ═══════════════════════════════════════════════════════════════════════════
// BATTLE PASS / SEASONS
// ═══════════════════════════════════════════════════════════════════════════

export type SeasonTheme = 'spring' | 'summer' | 'autumn' | 'winter' | 'cosmic' | 'ocean';

export type BattlePassRewardType = 'xp' | 'coins' | 'pet' | 'background' | 'badge' | 'streak_freeze' | 'booster';

export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BattlePassReward {
  type: BattlePassRewardType;
  amount?: number;
  itemId?: string;
  itemName: string;
  rarity: RewardRarity;
  icon: string;
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeReward: BattlePassReward;
  premiumReward?: BattlePassReward;
}

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

// ═══════════════════════════════════════════════════════════════════════════
// BOSS CHALLENGES
// ═══════════════════════════════════════════════════════════════════════════

export type BossDifficulty = 'normal' | 'hard' | 'extreme' | 'legendary';

export type BossRequirementType = 'focus_duration' | 'consecutive_sessions' | 'total_focus_week' | 'perfect_day';

export interface BossChallengeRequirement {
  type: BossRequirementType;
  value: number;
  timeLimit?: number;
}

export interface BossChallengeRewards {
  xp: number;
  coins: number;
  badge?: string;
  specialReward?: string;
}

export interface BossChallenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  difficulty: BossDifficulty;
  requirement: BossChallengeRequirement;
  rewards: BossChallengeRewards;
  cooldownHours: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export type SpecialEventType = 'double_xp' | 'double_coins' | 'bonus_rewards' | 'special_quest' | 'community';

export interface SpecialEventRewards {
  xp?: number;
  coins?: number;
  specialItem?: string;
}

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
  rewards?: SpecialEventRewards;
}

// ═══════════════════════════════════════════════════════════════════════════
// LUCKY WHEEL / GACHA
// ═══════════════════════════════════════════════════════════════════════════

export type LuckyWheelPrizeType = 'xp' | 'coins' | 'streak_freeze' | 'booster' | 'mystery_box' | 'jackpot';

export interface LuckyWheelPrize {
  id: string;
  name: string;
  emoji: string;
  type: LuckyWheelPrizeType;
  amount?: number;
  probability: number;
  rarity: RewardRarity;
  color: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMBO SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface ComboTier {
  minCombo: number;
  name: string;
  multiplier: number;
  color: string;
  emoji: string;
  /** Hours until combo expires if no new session - higher combos have shorter expiry */
  expiryHours?: number;
}

export interface ComboState {
  currentCombo: number;
  maxCombo: number;
  lastSessionTime: number | null;
  comboTimeoutMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MILESTONE CELEBRATIONS
// ═══════════════════════════════════════════════════════════════════════════

export type MilestoneType = 'level' | 'streak' | 'sessions' | 'focus_hours' | 'collection' | 'achievement';

export type CelebrationType = 'confetti' | 'fireworks' | 'stars' | 'rainbow';

export interface MilestoneRewards {
  xp?: number;
  coins?: number;
  badge?: string;
}

export interface Milestone {
  id: string;
  type: MilestoneType;
  threshold: number;
  title: string;
  description: string;
  emoji: string;
  celebrationType: CelebrationType;
  rewards?: MilestoneRewards;
}

// ═══════════════════════════════════════════════════════════════════════════
// GUILD / TEAM SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export type GuildMemberRole = 'leader' | 'officer' | 'member';

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

export interface GuildMember {
  id: string;
  name: string;
  avatar?: string;
  role: GuildMemberRole;
  weeklyFocusMinutes: number;
  joinedAt: string;
  isOnline: boolean;
}

export interface GuildChallengeRewards {
  xp: number;
  coins: number;
  guildXp: number;
}

export interface GuildChallenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  targetMinutes: number;
  currentMinutes: number;
  deadline: string;
  rewards: GuildChallengeRewards;
  isCompleted: boolean;
}
