/**
 * Advanced Gamification Data
 *
 * Contains data for:
 * - Battle Pass / Seasons
 * - Boss Challenges
 * - Special Events
 * - Lucky Wheel rewards
 * - Combo system configuration
 */

// Import types from consolidated type definitions
import type {
  SeasonTheme,
  BattlePassTier,
  BattlePassReward,
  Season,
  BossChallenge,
  SpecialEvent,
  LuckyWheelPrize,
  ComboTier,
  Milestone,
  Guild,
  GuildMember,
  GuildChallenge,
} from '@/types/gamification';

// Re-export types for consumers
export type {
  SeasonTheme,
  BattlePassTier,
  BattlePassReward,
  Season,
  BossChallenge,
  SpecialEvent,
  LuckyWheelPrize,
  ComboTier,
  Milestone,
  Guild,
  GuildMember,
  GuildChallenge,
};

// Generate battle pass tiers (30 tiers per season)
const generateBattlePassTiers = (seasonTheme: SeasonTheme): BattlePassTier[] => {
  const tiers: BattlePassTier[] = [];

  for (let i = 1; i <= 30; i++) {
    const tier: BattlePassTier = {
      tier: i,
      xpRequired: i * 100 + Math.floor(i / 5) * 50, // Scaling XP requirement
      freeReward: getFreeRewardForTier(i, seasonTheme),
      premiumReward: getPremiumRewardForTier(i, seasonTheme),
    };
    tiers.push(tier);
  }

  return tiers;
};

const getFreeRewardForTier = (tier: number, _theme: SeasonTheme): BattlePassReward => {
  // Every 5th tier is a bigger reward - BOOSTED!
  if (tier % 10 === 0) {
    return { type: 'coins', amount: 1000, itemName: '1000 Coins', rarity: 'epic', icon: 'money-bag' };
  }
  if (tier % 5 === 0) {
    return { type: 'coins', amount: 400, itemName: '400 Coins', rarity: 'rare', icon: 'coin' };
  }
  if (tier % 3 === 0) {
    return { type: 'xp', amount: 100, itemName: '100 XP', rarity: 'common', icon: 'star' };
  }
  return { type: 'coins', amount: 100, itemName: '100 Coins', rarity: 'common', icon: 'coin' };
};

const getPremiumRewardForTier = (tier: number, theme: SeasonTheme): BattlePassReward => {
  // Tier 30 is the exclusive pet - BOOSTED rewards throughout!
  if (tier === 30) {
    return {
      type: 'pet',
      itemId: `${theme}-legendary`,
      itemName: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Guardian`,
      rarity: 'legendary',
      icon: 'trophy'
    };
  }
  if (tier === 20) {
    return {
      type: 'background',
      itemId: `${theme}-bg`,
      itemName: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Paradise`,
      rarity: 'epic',
      icon: 'palette'
    };
  }
  if (tier === 15) {
    return { type: 'booster', amount: 5, itemName: '5x Coin Booster (24h)', rarity: 'epic', icon: 'rocket' };
  }
  if (tier % 5 === 0) {
    return { type: 'badge', itemId: `tier-${tier}`, itemName: `Tier ${tier} Badge`, rarity: 'rare', icon: 'medal' };
  }
  if (tier % 2 === 0) {
    return { type: 'coins', amount: 300, itemName: '300 Coins', rarity: 'rare', icon: 'diamond' };
  }
  return { type: 'xp', amount: 200, itemName: '200 XP', rarity: 'common', icon: 'sparkles' };
};

// Current active season (would be managed dynamically in production)
export const SEASONS: Season[] = [
  {
    id: 'winter-2024',
    name: 'Winter Wonderland',
    theme: 'winter',
    description: 'Embrace the frost! Complete challenges and earn exclusive winter rewards.',
    startDate: '2024-12-01',
    endDate: '2025-02-28',
    tiers: generateBattlePassTiers('winter'),
    exclusivePet: 'frost-guardian',
    backgroundGradient: 'from-blue-900 via-indigo-800 to-purple-900',
    accentColor: '#60a5fa',
  },
  {
    id: 'spring-2025',
    name: 'Spring Bloom',
    theme: 'spring',
    description: 'Watch your garden grow! Collect blooming rewards this season.',
    startDate: '2025-03-01',
    endDate: '2025-05-31',
    tiers: generateBattlePassTiers('spring'),
    exclusivePet: 'bloom-spirit',
    backgroundGradient: 'from-green-600 via-emerald-500 to-teal-400',
    accentColor: '#34d399',
  },
  {
    id: 'summer-2025',
    name: 'Summer Splash',
    theme: 'summer',
    description: 'Dive into summer fun! Beach vibes and tropical rewards await.',
    startDate: '2025-06-01',
    endDate: '2025-08-31',
    tiers: generateBattlePassTiers('summer'),
    exclusivePet: 'sun-phoenix',
    backgroundGradient: 'from-orange-500 via-amber-400 to-yellow-300',
    accentColor: '#fbbf24',
  },
  {
    id: 'autumn-2025',
    name: 'Autumn Harvest',
    theme: 'autumn',
    description: 'Gather the harvest! Cozy rewards for the fall season.',
    startDate: '2025-09-01',
    endDate: '2025-11-30',
    tiers: generateBattlePassTiers('autumn'),
    exclusivePet: 'harvest-fox',
    backgroundGradient: 'from-orange-700 via-red-600 to-amber-600',
    accentColor: '#f97316',
  },
];

export const getCurrentSeason = (): Season | null => {
  const now = new Date();
  return SEASONS.find(season => {
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    return now >= start && now <= end;
  }) || SEASONS[0]; // Fallback to first season
};

// ═══════════════════════════════════════════════════════════════════════════
// BOSS CHALLENGES
// ═══════════════════════════════════════════════════════════════════════════

export const BOSS_CHALLENGES: BossChallenge[] = [
  // Normal difficulty - BOOSTED REWARDS!
  {
    id: 'focus-warrior',
    name: 'Focus Warrior',
    description: 'Complete a 2-hour focus session without breaks',
    emoji: 'sword',
    difficulty: 'normal',
    requirement: { type: 'focus_duration', value: 120 },
    rewards: { xp: 300, coins: 400 },
    cooldownHours: 24,
  },
  {
    id: 'triple-threat',
    name: 'Triple Threat',
    description: 'Complete 3 focus sessions in a single day',
    emoji: 'target',
    difficulty: 'normal',
    requirement: { type: 'consecutive_sessions', value: 3, timeLimit: 24 },
    rewards: { xp: 200, coins: 300 },
    cooldownHours: 24,
  },

  // Hard difficulty - BOOSTED REWARDS!
  {
    id: 'deep-focus-master',
    name: 'Deep Focus Master',
    description: 'Complete a 3-hour deep focus session',
    emoji: 'meditation',
    difficulty: 'hard',
    requirement: { type: 'focus_duration', value: 180 },
    rewards: { xp: 600, coins: 800, badge: 'deep-focus-badge' },
    cooldownHours: 48,
  },
  {
    id: 'five-streak',
    name: 'Quintuple Strike',
    description: 'Complete 5 focus sessions in a single day',
    emoji: 'fire',
    difficulty: 'hard',
    requirement: { type: 'consecutive_sessions', value: 5, timeLimit: 24 },
    rewards: { xp: 500, coins: 700 },
    cooldownHours: 48,
  },
  {
    id: 'weekly-warrior',
    name: 'Weekly Warrior',
    description: 'Accumulate 10 hours of focus time in a week',
    emoji: 'calendar',
    difficulty: 'hard',
    requirement: { type: 'total_focus_week', value: 600 },
    rewards: { xp: 1000, coins: 1200 },
    cooldownHours: 168, // 1 week
  },

  // Extreme difficulty - BOOSTED REWARDS!
  {
    id: 'marathon-runner',
    name: 'Marathon Runner',
    description: 'Complete a 4-hour focus marathon',
    emoji: 'running',
    difficulty: 'extreme',
    requirement: { type: 'focus_duration', value: 240 },
    rewards: { xp: 1000, coins: 1400, badge: 'marathon-badge' },
    cooldownHours: 72,
  },
  {
    id: 'perfect-day',
    name: 'Perfect Day',
    description: 'Complete 8 hours of total focus in a single day',
    emoji: 'hundred',
    difficulty: 'extreme',
    requirement: { type: 'perfect_day', value: 480 },
    rewards: { xp: 1600, coins: 2000, badge: 'perfect-day-badge' },
    cooldownHours: 48,
  },

  // Legendary difficulty - BOOSTED REWARDS!
  {
    id: 'ultra-endurance',
    name: 'Ultra Endurance',
    description: 'Complete a 5-hour ultra focus session',
    emoji: 'crown',
    difficulty: 'legendary',
    requirement: { type: 'focus_duration', value: 300 },
    rewards: { xp: 2000, coins: 3000, badge: 'legendary-focus-badge', specialReward: 'exclusive-pet' },
    cooldownHours: 168, // 1 week
  },
  {
    id: 'weekly-legend',
    name: 'Weekly Legend',
    description: 'Accumulate 20 hours of focus time in a week',
    emoji: 'star',
    difficulty: 'legendary',
    requirement: { type: 'total_focus_week', value: 1200 },
    rewards: { xp: 3000, coins: 4000, badge: 'weekly-legend-badge' },
    cooldownHours: 168,
  },
];

export const getBossChallengesByDifficulty = (difficulty: BossChallenge['difficulty']): BossChallenge[] => {
  return BOSS_CHALLENGES.filter(c => c.difficulty === difficulty);
};

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export const SPECIAL_EVENTS: SpecialEvent[] = [
  {
    id: 'double-xp-weekend',
    name: 'Double XP Weekend',
    description: 'Earn double XP on all focus sessions!',
    emoji: 'lightning',
    type: 'double_xp',
    multiplier: 2,
    startDate: '2024-12-14',
    endDate: '2024-12-15',
    backgroundGradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'coin-rush',
    name: 'Coin Rush Hour',
    description: '2x coins for the next 3 hours!',
    emoji: 'money-bag',
    type: 'double_coins',
    multiplier: 2,
    startDate: '2024-12-20T18:00:00',
    endDate: '2024-12-20T21:00:00',
    backgroundGradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'holiday-bonus',
    name: 'Holiday Celebration',
    description: 'Special holiday rewards and exclusive content!',
    emoji: 'christmas-tree',
    type: 'bonus_rewards',
    startDate: '2024-12-24',
    endDate: '2024-12-26',
    backgroundGradient: 'from-red-600 to-green-600',
    rewards: {
      xp: 500,
      coins: 1000,
      specialItem: 'holiday-pet',
    },
  },
  {
    id: 'new-year-2025',
    name: 'New Year Celebration',
    description: 'Ring in 2025 with bonus rewards!',
    emoji: 'fireworks',
    type: 'bonus_rewards',
    startDate: '2024-12-31',
    endDate: '2025-01-02',
    backgroundGradient: 'from-indigo-600 to-purple-600',
    rewards: {
      xp: 2025,
      coins: 2025,
    },
  },
];

export const getActiveEvents = (): SpecialEvent[] => {
  const now = new Date();
  return SPECIAL_EVENTS.filter(event => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return now >= start && now <= end;
  });
};

export const getUpcomingEvents = (): SpecialEvent[] => {
  const now = new Date();
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return SPECIAL_EVENTS.filter(event => {
    const start = new Date(event.startDate);
    return start > now && start <= oneWeek;
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// LUCKY WHEEL / GACHA
// ═══════════════════════════════════════════════════════════════════════════

export const LUCKY_WHEEL_PRIZES: LuckyWheelPrize[] = [
  // BOOSTED prizes with better odds for jackpot!
  { id: 'coins-100', name: '100 Coins', emoji: 'coin', type: 'coins', amount: 100, probability: 22, rarity: 'common', color: '#64748b' },
  { id: 'coins-200', name: '200 Coins', emoji: 'money-bag', type: 'coins', amount: 200, probability: 18, rarity: 'common', color: '#71717a' },
  { id: 'xp-50', name: '50 XP', emoji: 'star', type: 'xp', amount: 50, probability: 18, rarity: 'common', color: '#6366f1' },
  { id: 'xp-100', name: '100 XP', emoji: 'sparkles', type: 'xp', amount: 100, probability: 14, rarity: 'rare', color: '#8b5cf6' },
  { id: 'coins-500', name: '500 Coins', emoji: 'diamond', type: 'coins', amount: 500, probability: 12, rarity: 'rare', color: '#0ea5e9' },
  { id: 'streak-freeze', name: 'Streak Freeze', emoji: 'ice-cube', type: 'streak_freeze', amount: 1, probability: 6, rarity: 'epic', color: '#06b6d4' },
  { id: 'booster', name: '3x Coin Booster', emoji: 'rocket', type: 'booster', amount: 1, probability: 5, rarity: 'epic', color: '#10b981' },
  { id: 'mystery-box', name: 'Mystery Box', emoji: 'gift', type: 'mystery_box', probability: 2, rarity: 'epic', color: '#f59e0b' },
  { id: 'jackpot', name: 'JACKPOT!', emoji: 'slot-machine', type: 'jackpot', amount: 2500, probability: 3, rarity: 'legendary', color: '#ef4444' },
];

export const spinWheel = (): LuckyWheelPrize => {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const prize of LUCKY_WHEEL_PRIZES) {
    cumulative += prize.probability;
    if (roll < cumulative) {
      return prize;
    }
  }

  return LUCKY_WHEEL_PRIZES[0]; // Fallback
};

// ═══════════════════════════════════════════════════════════════════════════
// COMBO SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

// Combo tiers with balanced multipliers and expiry windows
// Higher combos have shorter expiry to create urgency
export const COMBO_TIERS: ComboTier[] = [
  { minCombo: 1, name: 'Starting', multiplier: 1.0, color: '#64748b', emoji: 'target', expiryHours: 6 },
  { minCombo: 2, name: 'Warming Up', multiplier: 1.1, color: '#22c55e', emoji: 'fire', expiryHours: 4 },
  { minCombo: 3, name: 'On Fire', multiplier: 1.2, color: '#f97316', emoji: 'fire', expiryHours: 4 },
  { minCombo: 5, name: 'Blazing', multiplier: 1.35, color: '#ef4444', emoji: 'fire', expiryHours: 3 },
  { minCombo: 7, name: 'Unstoppable', multiplier: 1.5, color: '#8b5cf6', emoji: 'lightning', expiryHours: 3 },
  { minCombo: 10, name: 'LEGENDARY', multiplier: 1.75, color: '#fbbf24', emoji: 'crown', expiryHours: 2 },
];

export const getComboTier = (comboCount: number): ComboTier => {
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (comboCount >= COMBO_TIERS[i].minCombo) {
      return COMBO_TIERS[i];
    }
  }
  return COMBO_TIERS[0];
};

export const getNextComboTier = (comboCount: number): ComboTier | null => {
  const currentIndex = COMBO_TIERS.findIndex(tier =>
    comboCount >= tier.minCombo &&
    (COMBO_TIERS[COMBO_TIERS.indexOf(tier) + 1]?.minCombo > comboCount || !COMBO_TIERS[COMBO_TIERS.indexOf(tier) + 1])
  );

  if (currentIndex < COMBO_TIERS.length - 1) {
    return COMBO_TIERS[currentIndex + 1];
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// MILESTONE CELEBRATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const MILESTONES: Milestone[] = [
  // Level milestones - BOOSTED!
  { id: 'level-5', type: 'level', threshold: 5, title: 'Rising Star', description: 'Reached Level 5!', emoji: 'star', celebrationType: 'confetti', rewards: { xp: 200, coins: 400 } },
  { id: 'level-10', type: 'level', threshold: 10, title: 'Dedicated Focuser', description: 'Reached Level 10!', emoji: 'star', celebrationType: 'stars', rewards: { xp: 500, coins: 1000 } },
  { id: 'level-20', type: 'level', threshold: 20, title: 'Focus Master', description: 'Reached Level 20!', emoji: 'sparkles', celebrationType: 'fireworks', rewards: { xp: 1000, coins: 2000, badge: 'focus-master' } },
  { id: 'level-30', type: 'level', threshold: 30, title: 'Focus Legend', description: 'Reached Level 30!', emoji: 'crown', celebrationType: 'rainbow', rewards: { xp: 2000, coins: 4000, badge: 'focus-legend' } },
  { id: 'level-50', type: 'level', threshold: 50, title: 'Max Level!', description: 'Reached Maximum Level!', emoji: 'trophy', celebrationType: 'rainbow', rewards: { xp: 5000, coins: 10000, badge: 'max-level' } },

  // Streak milestones - BOOSTED!
  { id: 'streak-7', type: 'streak', threshold: 7, title: 'Week Warrior', description: '7-day streak!', emoji: 'fire', celebrationType: 'confetti', rewards: { xp: 200, coins: 300 } },
  { id: 'streak-30', type: 'streak', threshold: 30, title: 'Monthly Master', description: '30-day streak!', emoji: 'fire', celebrationType: 'fireworks', rewards: { xp: 1000, coins: 1500 } },
  { id: 'streak-100', type: 'streak', threshold: 100, title: 'Century Streak', description: '100-day streak!', emoji: 'fire', celebrationType: 'rainbow', rewards: { xp: 4000, coins: 6000, badge: 'century-streak' } },

  // Session milestones - BOOSTED!
  { id: 'sessions-10', type: 'sessions', threshold: 10, title: 'Getting Started', description: '10 focus sessions!', emoji: 'target', celebrationType: 'confetti', rewards: { coins: 250 } },
  { id: 'sessions-50', type: 'sessions', threshold: 50, title: 'Consistent', description: '50 focus sessions!', emoji: 'target', celebrationType: 'stars', rewards: { xp: 400, coins: 600 } },
  { id: 'sessions-100', type: 'sessions', threshold: 100, title: 'Century Sessions', description: '100 focus sessions!', emoji: 'target', celebrationType: 'fireworks', rewards: { xp: 1000, coins: 1500 } },
  { id: 'sessions-500', type: 'sessions', threshold: 500, title: 'Focus Veteran', description: '500 focus sessions!', emoji: 'target', celebrationType: 'rainbow', rewards: { xp: 4000, coins: 6000, badge: 'veteran' } },

  // Focus hours milestones - BOOSTED!
  { id: 'hours-10', type: 'focus_hours', threshold: 10, title: '10 Hour Club', description: '10 hours of focus!', emoji: 'clock', celebrationType: 'confetti', rewards: { coins: 350 } },
  { id: 'hours-50', type: 'focus_hours', threshold: 50, title: '50 Hour Club', description: '50 hours of focus!', emoji: 'clock', celebrationType: 'stars', rewards: { xp: 600, coins: 1000 } },
  { id: 'hours-100', type: 'focus_hours', threshold: 100, title: 'Century Hours', description: '100 hours of focus!', emoji: 'clock', celebrationType: 'fireworks', rewards: { xp: 1500, coins: 2000, badge: 'century-hours' } },
  { id: 'hours-500', type: 'focus_hours', threshold: 500, title: 'Time Master', description: '500 hours of focus!', emoji: 'clock', celebrationType: 'rainbow', rewards: { xp: 6000, coins: 10000, badge: 'time-master' } },

  // Collection milestones - BOOSTED!
  { id: 'pets-5', type: 'collection', threshold: 5, title: 'Pet Collector', description: 'Collected 5 pets!', emoji: 'paw', celebrationType: 'confetti', rewards: { coins: 400 } },
  { id: 'pets-15', type: 'collection', threshold: 15, title: 'Pet Enthusiast', description: 'Collected 15 pets!', emoji: 'paw', celebrationType: 'stars', rewards: { xp: 600, coins: 1000 } },
  { id: 'pets-30', type: 'collection', threshold: 30, title: 'Pet Master', description: 'Collected 30 pets!', emoji: 'paw', celebrationType: 'fireworks', rewards: { xp: 1500, coins: 2000, badge: 'pet-master' } },
];

export const getMilestoneForValue = (type: Milestone['type'], value: number): Milestone | null => {
  const typeMilestones = MILESTONES.filter(m => m.type === type);
  // Find the highest milestone that the value has just reached
  for (let i = typeMilestones.length - 1; i >= 0; i--) {
    if (value === typeMilestones[i].threshold) {
      return typeMilestones[i];
    }
  }
  return null;
};

export const getNextMilestone = (type: Milestone['type'], currentValue: number): Milestone | null => {
  const typeMilestones = MILESTONES.filter(m => m.type === type);
  return typeMilestones.find(m => m.threshold > currentValue) || null;
};

// ═══════════════════════════════════════════════════════════════════════════
// GUILD / TEAM SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

// Sample guilds for demo purposes
export const SAMPLE_GUILDS: Guild[] = [
  {
    id: 'focus-masters',
    name: 'Focus Masters',
    description: 'A guild for dedicated focusers who want to maximize productivity together.',
    emoji: 'target',
    memberCount: 45,
    maxMembers: 50,
    totalFocusMinutes: 125000,
    weeklyGoal: 5000,
    level: 12,
    createdAt: '2024-01-15',
    isPublic: true,
  },
  {
    id: 'night-owls',
    name: 'Night Owls',
    description: 'For those who do their best work when the world sleeps.',
    emoji: 'owl',
    memberCount: 28,
    maxMembers: 50,
    totalFocusMinutes: 78000,
    weeklyGoal: 3000,
    level: 8,
    createdAt: '2024-03-20',
    isPublic: true,
  },
  {
    id: 'study-squad',
    name: 'Study Squad',
    description: 'Students helping students stay focused and ace their exams!',
    emoji: 'books',
    memberCount: 50,
    maxMembers: 50,
    totalFocusMinutes: 200000,
    weeklyGoal: 7500,
    level: 15,
    createdAt: '2023-09-01',
    isPublic: true,
  },
];

export const GUILD_LEVEL_REQUIREMENTS = [
  0, 1000, 3000, 6000, 10000, 15000, 22000, 30000, 40000, 52000,
  66000, 82000, 100000, 120000, 145000, 175000, 210000, 250000, 300000, 360000
];

export const getGuildLevel = (totalMinutes: number): number => {
  for (let i = GUILD_LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (totalMinutes >= GUILD_LEVEL_REQUIREMENTS[i]) {
      return i + 1;
    }
  }
  return 1;
};
