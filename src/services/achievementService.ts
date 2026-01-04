import { achievementLogger } from '@/lib/logger';
import type { Achievement, AchievementReward, AchievementUnlockEvent } from '@/types';

// Re-export types for backwards compatibility
export type { Achievement, AchievementReward, AchievementUnlockEvent } from '@/types';

// ===== CONSTANTS =====
export const ACHIEVEMENT_STORAGE_KEY = 'achievement-system-data';
export const ACHIEVEMENT_UNLOCK_EVENT = 'achievement-unlocked';
export const ACHIEVEMENT_CLAIMED_EVENT = 'achievement-claimed';

export const TIER_POINTS = {
  bronze: 10,
  silver: 25,
  gold: 50,
  platinum: 100,
  diamond: 200
};

// Achievement definitions with BOOSTED rewards for satisfying progression!
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedAt' | 'rewardsClaimed'>[] = [
  // ===== FOCUS ACHIEVEMENTS =====
  {
    id: 'focus-beginner',
    title: 'First Steps',
    description: 'Complete your first 10 minutes of focus time',
    category: 'focus',
    tier: 'bronze',
    icon: '🌱',
    target: 10,
    rewards: [
      { type: 'xp', amount: 100, description: '+100 XP' },
      { type: 'coins', amount: 75, description: '+75 Coins' }
    ]
  },
  {
    id: 'focus-hour',
    title: 'Hour Hero',
    description: 'Accumulate 1 hour of total focus time',
    category: 'focus',
    tier: 'bronze',
    icon: '⏰',
    target: 60,
    rewards: [
      { type: 'xp', amount: 150, description: '+150 XP' },
      { type: 'coins', amount: 125, description: '+125 Coins' }
    ]
  },
  {
    id: 'focus-warrior',
    title: 'Focus Warrior',
    description: 'Accumulate 10 hours of total focus time',
    category: 'focus',
    tier: 'silver',
    icon: '⚔️',
    target: 600,
    rewards: [
      { type: 'xp', amount: 400, description: '+400 XP' },
      { type: 'coins', amount: 350, description: '+350 Coins' }
    ]
  },
  {
    id: 'focus-dedicated',
    title: 'Dedicated',
    description: 'Accumulate 50 hours of total focus time',
    category: 'focus',
    tier: 'gold',
    icon: '💪',
    target: 3000,
    rewards: [
      { type: 'xp', amount: 800, description: '+800 XP' },
      { type: 'coins', amount: 800, description: '+800 Coins' }
    ]
  },
  {
    id: 'focus-master',
    title: 'Focus Master',
    description: 'Reach 100 hours of total focus time',
    category: 'focus',
    tier: 'gold',
    icon: '🏆',
    target: 6000,
    rewards: [
      { type: 'xp', amount: 1000, description: '+1000 XP' },
      { type: 'coins', amount: 1000, description: '+1000 Coins' }
    ]
  },
  {
    id: 'focus-expert',
    title: 'Focus Expert',
    description: 'Reach 250 hours of total focus time',
    category: 'focus',
    tier: 'platinum',
    icon: '🎯',
    target: 15000,
    rewards: [
      { type: 'xp', amount: 1500, description: '+1500 XP' },
      { type: 'coins', amount: 1600, description: '+1600 Coins' }
    ]
  },
  {
    id: 'focus-legend',
    title: 'Focus Legend',
    description: 'Achieve 500 hours of total focus time',
    category: 'focus',
    tier: 'platinum',
    icon: '👑',
    target: 30000,
    rewards: [
      { type: 'xp', amount: 2000, description: '+2000 XP' },
      { type: 'coins', amount: 2000, description: '+2000 Coins' }
    ]
  },
  {
    id: 'focus-immortal',
    title: 'Focus Immortal',
    description: 'Achieve 1000 hours of total focus time',
    category: 'focus',
    tier: 'diamond',
    icon: '🌟',
    target: 60000,
    rewards: [
      { type: 'xp', amount: 4000, description: '+4000 XP' },
      { type: 'coins', amount: 5000, description: '+5000 Coins' }
    ]
  },
  {
    id: 'marathon-runner',
    title: 'Marathon Runner',
    description: 'Complete a 2-hour focus session',
    category: 'focus',
    tier: 'silver',
    icon: '🏃',
    target: 120,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 250, description: '+250 Coins' }
    ]
  },
  {
    id: 'marathon-master',
    title: 'Marathon Master',
    description: 'Complete a 4-hour focus session',
    category: 'focus',
    tier: 'gold',
    icon: '🏃‍♂️',
    target: 240,
    rewards: [
      { type: 'xp', amount: 600, description: '+600 XP' },
      { type: 'coins', amount: 700, description: '+700 Coins' }
    ]
  },
  {
    id: 'ultra-marathon',
    title: 'Ultra Marathon',
    description: 'Complete an 8-hour focus session',
    category: 'focus',
    tier: 'diamond',
    icon: '🦸',
    target: 480,
    secret: true,
    rewards: [
      { type: 'xp', amount: 3000, description: '+3000 XP' },
      { type: 'coins', amount: 4000, description: '+4000 Coins' }
    ]
  },
  {
    id: 'session-starter',
    title: 'Session Starter',
    description: 'Complete 5 focus sessions',
    category: 'focus',
    tier: 'bronze',
    icon: '🎬',
    target: 5,
    rewards: [
      { type: 'xp', amount: 100, description: '+100 XP' },
      { type: 'coins', amount: 75, description: '+75 Coins' }
    ]
  },
  {
    id: 'session-regular',
    title: 'Regular',
    description: 'Complete 25 focus sessions',
    category: 'focus',
    tier: 'silver',
    icon: '📚',
    target: 25,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 275, description: '+275 Coins' }
    ]
  },
  {
    id: 'session-veteran',
    title: 'Veteran',
    description: 'Complete 100 focus sessions',
    category: 'focus',
    tier: 'gold',
    icon: '🎖️',
    target: 100,
    rewards: [
      { type: 'xp', amount: 800, description: '+800 XP' },
      { type: 'coins', amount: 800, description: '+800 Coins' }
    ]
  },
  {
    id: 'zen-master',
    title: 'Zen Master',
    description: 'Complete 500 focus sessions',
    category: 'focus',
    tier: 'platinum',
    icon: '🧘‍♂️',
    target: 500,
    rewards: [
      { type: 'xp', amount: 1600, description: '+1600 XP' },
      { type: 'coins', amount: 1800, description: '+1800 Coins' }
    ]
  },
  {
    id: 'focus-god',
    title: 'Focus Deity',
    description: 'Complete 1000 focus sessions',
    category: 'focus',
    tier: 'diamond',
    icon: '⚡',
    target: 1000,
    secret: true,
    rewards: [
      { type: 'xp', amount: 4000, description: '+4000 XP' },
      { type: 'coins', amount: 5000, description: '+5000 Coins' }
    ]
  },

  // ===== COLLECTION ACHIEVEMENTS =====
  {
    id: 'first-friend',
    title: 'First Friend',
    description: 'Unlock your first pet companion',
    category: 'collection',
    tier: 'bronze',
    icon: '🐾',
    target: 1,
    rewards: [
      { type: 'xp', amount: 75, description: '+75 XP' },
      { type: 'coins', amount: 75, description: '+75 Coins' }
    ]
  },
  {
    id: 'pet-collector-5',
    title: 'Budding Collector',
    description: 'Unlock 5 different pets',
    category: 'collection',
    tier: 'bronze',
    icon: '🦊',
    target: 5,
    rewards: [
      { type: 'xp', amount: 150, description: '+150 XP' },
      { type: 'coins', amount: 150, description: '+150 Coins' }
    ]
  },
  {
    id: 'pet-collector',
    title: 'Pet Collector',
    description: 'Unlock 10 different pets',
    category: 'collection',
    tier: 'silver',
    icon: '🦋',
    target: 10,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 350, description: '+350 Coins' }
    ]
  },
  {
    id: 'zoo-keeper',
    title: 'Zoo Keeper',
    description: 'Unlock 20 different pets',
    category: 'collection',
    tier: 'gold',
    icon: '🦁',
    target: 20,
    rewards: [
      { type: 'xp', amount: 600, description: '+600 XP' },
      { type: 'coins', amount: 700, description: '+700 Coins' }
    ]
  },
  {
    id: 'menagerie-master',
    title: 'Menagerie Master',
    description: 'Unlock 35 different pets',
    category: 'collection',
    tier: 'platinum',
    icon: '🐘',
    target: 35,
    rewards: [
      { type: 'xp', amount: 1200, description: '+1200 XP' },
      { type: 'coins', amount: 1500, description: '+1500 Coins' }
    ]
  },
  {
    id: 'legendary-collector',
    title: 'Legendary Collector',
    description: 'Unlock all 50+ pets',
    category: 'collection',
    tier: 'diamond',
    icon: '💎',
    target: 50,
    rewards: [
      { type: 'xp', amount: 3000, description: '+3000 XP' },
      { type: 'coins', amount: 4000, description: '+4000 Coins' }
    ]
  },
  {
    id: 'rare-finder',
    title: 'Rare Finder',
    description: 'Unlock 5 rare pets',
    category: 'collection',
    tier: 'silver',
    icon: '💫',
    target: 5,
    rewards: [
      { type: 'xp', amount: 400, description: '+400 XP' },
      { type: 'coins', amount: 400, description: '+400 Coins' }
    ]
  },
  {
    id: 'epic-hunter',
    title: 'Epic Hunter',
    description: 'Unlock 5 epic pets',
    category: 'collection',
    tier: 'gold',
    icon: '🔮',
    target: 5,
    rewards: [
      { type: 'xp', amount: 800, description: '+800 XP' },
      { type: 'coins', amount: 900, description: '+900 Coins' }
    ]
  },
  {
    id: 'legendary-hunter',
    title: 'Legendary Hunter',
    description: 'Unlock 3 legendary pets',
    category: 'collection',
    tier: 'platinum',
    icon: '🌈',
    target: 3,
    rewards: [
      { type: 'xp', amount: 1500, description: '+1500 XP' },
      { type: 'coins', amount: 1600, description: '+1600 Coins' }
    ]
  },
  {
    id: 'biome-explorer',
    title: 'Biome Explorer',
    description: 'Unlock all biomes',
    category: 'collection',
    tier: 'platinum',
    icon: '🌍',
    target: 8,
    rewards: [
      { type: 'xp', amount: 1500, description: '+1500 XP' },
      { type: 'coins', amount: 1500, description: '+1500 Coins' }
    ]
  },

  // ===== BOND ACHIEVEMENTS =====
  {
    id: 'first-bond',
    title: 'First Bond',
    description: 'Reach bond level 3 with any pet',
    category: 'bond',
    tier: 'bronze',
    icon: '💕',
    target: 3,
    rewards: [
      { type: 'xp', amount: 100, description: '+100 XP' },
      { type: 'coins', amount: 100, description: '+100 Coins' }
    ]
  },
  {
    id: 'growing-bond',
    title: 'Growing Bond',
    description: 'Reach bond level 5 with any pet',
    category: 'bond',
    tier: 'silver',
    icon: '💗',
    target: 5,
    rewards: [
      { type: 'xp', amount: 200, description: '+200 XP' },
      { type: 'coins', amount: 225, description: '+225 Coins' }
    ]
  },
  {
    id: 'strong-bond',
    title: 'Strong Bond',
    description: 'Reach bond level 7 with any pet',
    category: 'bond',
    tier: 'gold',
    icon: '💖',
    target: 7,
    rewards: [
      { type: 'xp', amount: 400, description: '+400 XP' },
      { type: 'coins', amount: 500, description: '+500 Coins' }
    ]
  },
  {
    id: 'pet-whisperer',
    title: 'Pet Whisperer',
    description: 'Reach max bond (level 10) with any pet',
    category: 'bond',
    tier: 'platinum',
    icon: '✨',
    target: 10,
    rewards: [
      { type: 'xp', amount: 800, description: '+800 XP' },
      { type: 'coins', amount: 1000, description: '+1000 Coins' }
    ]
  },
  {
    id: 'bond-collector',
    title: 'Bond Collector',
    description: 'Reach max bond with 3 different pets',
    category: 'bond',
    tier: 'platinum',
    icon: '💝',
    target: 3,
    rewards: [
      { type: 'xp', amount: 1200, description: '+1200 XP' },
      { type: 'coins', amount: 1400, description: '+1400 Coins' }
    ]
  },
  {
    id: 'bond-master',
    title: 'Bond Master',
    description: 'Reach max bond with 5 different pets',
    category: 'bond',
    tier: 'diamond',
    icon: '🌟',
    target: 5,
    rewards: [
      { type: 'xp', amount: 2000, description: '+2000 XP' },
      { type: 'coins', amount: 3000, description: '+3000 Coins' }
    ]
  },

  // ===== PROGRESSION ACHIEVEMENTS =====
  {
    id: 'level-5',
    title: 'Rising Star',
    description: 'Reach level 5',
    category: 'progression',
    tier: 'bronze',
    icon: '⭐',
    target: 5,
    rewards: [
      { type: 'xp', amount: 100, description: '+100 XP' },
      { type: 'coins', amount: 125, description: '+125 Coins' }
    ]
  },
  {
    id: 'level-10',
    title: 'Getting Started',
    description: 'Reach level 10',
    category: 'progression',
    tier: 'silver',
    icon: '🌙',
    target: 10,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 350, description: '+350 Coins' }
    ]
  },
  {
    id: 'level-25',
    title: 'Halfway There',
    description: 'Reach level 25',
    category: 'progression',
    tier: 'gold',
    icon: '🌞',
    target: 25,
    rewards: [
      { type: 'xp', amount: 800, description: '+800 XP' },
      { type: 'coins', amount: 900, description: '+900 Coins' }
    ]
  },
  {
    id: 'level-40',
    title: 'Almost There',
    description: 'Reach level 40',
    category: 'progression',
    tier: 'platinum',
    icon: '🔥',
    target: 40,
    rewards: [
      { type: 'xp', amount: 1400, description: '+1400 XP' },
      { type: 'coins', amount: 1600, description: '+1600 Coins' }
    ]
  },
  {
    id: 'level-50',
    title: 'Max Level',
    description: 'Reach the maximum level 50',
    category: 'progression',
    tier: 'diamond',
    icon: '🏅',
    target: 50,
    rewards: [
      { type: 'xp', amount: 2000, description: '+2000 XP' },
      { type: 'coins', amount: 4000, description: '+4000 Coins' }
    ]
  },

  // ===== ECONOMY ACHIEVEMENTS =====
  {
    id: 'first-purchase',
    title: 'First Purchase',
    description: 'Buy your first item from the shop',
    category: 'economy',
    tier: 'bronze',
    icon: '🛒',
    target: 1,
    rewards: [
      { type: 'xp', amount: 75, description: '+75 XP' },
      { type: 'coins', amount: 75, description: '+75 Coins' }
    ]
  },
  {
    id: 'shopper',
    title: 'Shopper',
    description: 'Make 5 purchases from the shop',
    category: 'economy',
    tier: 'silver',
    icon: '🛍️',
    target: 5,
    rewards: [
      { type: 'xp', amount: 200, description: '+200 XP' },
      { type: 'coins', amount: 225, description: '+225 Coins' }
    ]
  },
  {
    id: 'big-spender',
    title: 'Big Spender',
    description: 'Make 15 purchases from the shop',
    category: 'economy',
    tier: 'gold',
    icon: '💰',
    target: 15,
    rewards: [
      { type: 'xp', amount: 600, description: '+600 XP' },
      { type: 'coins', amount: 700, description: '+700 Coins' }
    ]
  },
  {
    id: 'coin-collector-1k',
    title: 'Penny Pincher',
    description: 'Earn 1,000 total coins',
    category: 'economy',
    tier: 'bronze',
    icon: '🪙',
    target: 1000,
    rewards: [
      { type: 'xp', amount: 100, description: '+100 XP' },
      { type: 'coins', amount: 125, description: '+125 Coins' }
    ]
  },
  {
    id: 'coin-collector-5k',
    title: 'Coin Hoarder',
    description: 'Earn 5,000 total coins',
    category: 'economy',
    tier: 'silver',
    icon: '💵',
    target: 5000,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 350, description: '+350 Coins' }
    ]
  },
  {
    id: 'coin-collector-25k',
    title: 'Wealthy',
    description: 'Earn 25,000 total coins',
    category: 'economy',
    tier: 'gold',
    icon: '💎',
    target: 25000,
    rewards: [
      { type: 'xp', amount: 700, description: '+700 XP' },
      { type: 'coins', amount: 800, description: '+800 Coins' }
    ]
  },
  {
    id: 'coin-collector-100k',
    title: 'Tycoon',
    description: 'Earn 100,000 total coins',
    category: 'economy',
    tier: 'platinum',
    icon: '👑',
    target: 100000,
    rewards: [
      { type: 'xp', amount: 1500, description: '+1500 XP' },
      { type: 'coins', amount: 2000, description: '+2000 Coins' }
    ]
  },

  // ===== SPECIAL ACHIEVEMENTS =====
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete 10 focus sessions after 10 PM',
    category: 'special',
    tier: 'silver',
    icon: '🦉',
    target: 10,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 275, description: '+275 Coins' }
    ]
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete 10 focus sessions before 7 AM',
    category: 'special',
    tier: 'silver',
    icon: '🐦',
    target: 10,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 275, description: '+275 Coins' }
    ]
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Complete 20 focus sessions on weekends',
    category: 'special',
    tier: 'gold',
    icon: '🎉',
    target: 20,
    rewards: [
      { type: 'xp', amount: 500, description: '+500 XP' },
      { type: 'coins', amount: 600, description: '+600 Coins' }
    ]
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete focus sessions for 7 consecutive days',
    category: 'special',
    tier: 'gold',
    icon: '📅',
    target: 7,
    rewards: [
      { type: 'xp', amount: 600, description: '+600 XP' },
      { type: 'coins', amount: 700, description: '+700 Coins' }
    ]
  },
  {
    id: 'streak-week',
    title: 'Week Streak',
    description: 'Maintain a 7-day focus streak',
    category: 'special',
    tier: 'silver',
    icon: '🔥',
    target: 7,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 350, description: '+350 Coins' }
    ]
  },
  {
    id: 'streak-month',
    title: 'Monthly Dedication',
    description: 'Maintain a 30-day focus streak',
    category: 'special',
    tier: 'gold',
    icon: '🌟',
    target: 30,
    rewards: [
      { type: 'xp', amount: 800, description: '+800 XP' },
      { type: 'coins', amount: 1000, description: '+1000 Coins' }
    ]
  },
  {
    id: 'streak-master',
    title: 'Streak Master',
    description: 'Maintain a 60-day focus streak',
    category: 'special',
    tier: 'platinum',
    icon: '💫',
    target: 60,
    rewards: [
      { type: 'xp', amount: 1400, description: '+1400 XP' },
      { type: 'coins', amount: 1600, description: '+1600 Coins' }
    ]
  },
  {
    id: 'streak-legend',
    title: 'Streak Legend',
    description: 'Maintain a 100-day focus streak',
    category: 'special',
    tier: 'diamond',
    icon: '🏆',
    target: 100,
    rewards: [
      { type: 'xp', amount: 3000, description: '+3000 XP' },
      { type: 'coins', amount: 4000, description: '+4000 Coins' }
    ]
  },
  {
    id: 'streak-immortal',
    title: 'Unstoppable',
    description: 'Maintain a 365-day focus streak',
    category: 'special',
    tier: 'diamond',
    icon: '👑',
    target: 365,
    secret: true,
    rewards: [
      { type: 'xp', amount: 10000, description: '+10000 XP' },
      { type: 'coins', amount: 10000, description: '+10000 Coins' }
    ]
  },
  {
    id: 'lucky-winner',
    title: 'Lucky Winner',
    description: 'Win 5 jackpots from focus sessions',
    category: 'special',
    tier: 'gold',
    icon: '🎰',
    target: 5,
    rewards: [
      { type: 'xp', amount: 600, description: '+600 XP' },
      { type: 'coins', amount: 800, description: '+800 Coins' }
    ]
  },
  {
    id: 'wheel-spinner',
    title: 'Wheel Spinner',
    description: 'Spin the lucky wheel 25 times',
    category: 'special',
    tier: 'silver',
    icon: '🎡',
    target: 25,
    rewards: [
      { type: 'xp', amount: 300, description: '+300 XP' },
      { type: 'coins', amount: 350, description: '+350 Coins' }
    ]
  },

  // ===== SOCIAL ACHIEVEMENTS (Future) =====
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Share 5 achievements',
    category: 'social',
    tier: 'bronze',
    icon: '🦋',
    target: 5,
    rewards: [
      { type: 'xp', amount: 100, description: '+100 XP' },
      { type: 'coins', amount: 125, description: '+125 Coins' }
    ]
  },
  {
    id: 'achievement-hunter',
    title: 'Achievement Hunter',
    description: 'Unlock 25 achievements',
    category: 'special',
    tier: 'gold',
    icon: '🏅',
    target: 25,
    rewards: [
      { type: 'xp', amount: 1000, description: '+1000 XP' },
      { type: 'coins', amount: 1000, description: '+1000 Coins' }
    ]
  },
  {
    id: 'completionist',
    title: 'Completionist',
    description: 'Unlock all non-secret achievements',
    category: 'special',
    tier: 'diamond',
    icon: '🎖️',
    target: 50,
    secret: true,
    rewards: [
      { type: 'xp', amount: 6000, description: '+6000 XP' },
      { type: 'coins', amount: 10000, description: '+10000 Coins' }
    ]
  }
];

// ===== PURE FUNCTIONS =====

/**
 * Initialize achievements with default values from definitions
 */
export function initializeAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    progress: 0,
    isUnlocked: false,
    rewardsClaimed: false
  }));
}

/**
 * Merge saved achievements with current definitions
 * Handles new achievements being added to the definitions
 */
export function mergeWithDefinitions(saved: Achievement[]): Achievement[] {
  const savedMap = new Map(saved.map(a => [a.id, a]));

  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const existing = savedMap.get(def.id);
    if (existing) {
      // Update definition but keep progress/unlock state
      return {
        ...def,
        progress: existing.progress,
        isUnlocked: existing.isUnlocked,
        unlockedAt: existing.unlockedAt,
        rewardsClaimed: existing.rewardsClaimed || false
      };
    }
    return {
      ...def,
      progress: 0,
      isUnlocked: false,
      rewardsClaimed: false
    };
  });
}

/**
 * Calculate total XP and coins from an achievement's rewards
 */
export function calculateRewards(achievement: Achievement): { xp: number; coins: number } {
  let xp = 0;
  let coins = 0;

  for (const reward of achievement.rewards) {
    if (reward.type === 'xp' && reward.amount) {
      xp += reward.amount;
    } else if (reward.type === 'coins' && reward.amount) {
      coins += reward.amount;
    }
  }

  return { xp, coins };
}

/**
 * Load achievement data from localStorage
 */
export function loadFromStorage(): Achievement[] | null {
  try {
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return mergeWithDefinitions(data.achievements || []);
    }
    return null;
  } catch (error) {
    achievementLogger.error('Failed to load achievement data:', error);
    return null;
  }
}

/**
 * Save achievement data to localStorage with merging to preserve claimed status
 */
export function saveToStorage(achievementData: Achievement[]): void {
  try {
    // Read current localStorage to preserve any claimed status set by other instances
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    let mergedData = achievementData;

    if (saved) {
      const currentData = JSON.parse(saved);
      const currentAchievements: Achievement[] = currentData.achievements || [];
      const claimedIds = new Set(
        currentAchievements
          .filter(a => a.rewardsClaimed)
          .map(a => a.id)
      );

      // Merge: preserve any claimed status from localStorage
      mergedData = achievementData.map(a => ({
        ...a,
        rewardsClaimed: a.rewardsClaimed || claimedIds.has(a.id)
      }));
    }

    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify({ achievements: mergedData }));
  } catch (error) {
    achievementLogger.error('Failed to save achievement data:', error);
  }
}

/**
 * Check if an achievement should be updated based on activity type and value
 * Returns updated achievement if it should update, null otherwise
 */
export function checkAchievementProgress(
  achievement: Achievement,
  type: string,
  value: number
): { shouldUpdate: boolean; newProgress: number } {
  if (achievement.isUnlocked) {
    return { shouldUpdate: false, newProgress: achievement.progress };
  }

  let shouldUpdate = false;
  let newProgress = achievement.progress;

  // Map activity types to achievement checks
  switch (type) {
    case 'focus_time':
      if (['focus-beginner', 'focus-hour', 'focus-warrior', 'focus-dedicated',
           'focus-master', 'focus-expert', 'focus-legend', 'focus-immortal'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'session_duration':
      if (['marathon-runner', 'marathon-master', 'ultra-marathon'].includes(achievement.id)) {
        newProgress = Math.max(newProgress, value);
        shouldUpdate = true;
      }
      break;

    case 'sessions_count':
      if (['session-starter', 'session-regular', 'session-veteran',
           'zen-master', 'focus-god'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'pet_unlock':
      if (['first-friend', 'pet-collector-5', 'pet-collector', 'zoo-keeper',
           'menagerie-master', 'legendary-collector'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'rare_pets':
      if (achievement.id === 'rare-finder') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'epic_pets':
      if (achievement.id === 'epic-hunter') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'legendary_pets':
      if (achievement.id === 'legendary-hunter') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'biome_unlock':
      if (achievement.id === 'biome-explorer') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'bond_level':
      if (['first-bond', 'growing-bond', 'strong-bond', 'pet-whisperer'].includes(achievement.id)) {
        newProgress = Math.max(newProgress, value);
        shouldUpdate = true;
      }
      break;

    case 'max_bonds':
      if (['bond-collector', 'bond-master'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'level':
      if (['level-5', 'level-10', 'level-25', 'level-40', 'level-50'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'total_coins':
      if (['coin-collector-1k', 'coin-collector-5k', 'coin-collector-25k',
           'coin-collector-100k'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'purchases':
      if (['first-purchase', 'shopper', 'big-spender'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'streak_days':
      if (['streak-week', 'streak-month', 'streak-master',
           'streak-legend', 'streak-immortal', 'perfect-week'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'night_sessions':
      if (achievement.id === 'night-owl') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'morning_sessions':
      if (achievement.id === 'early-bird') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'weekend_sessions':
      if (achievement.id === 'weekend-warrior') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'jackpots':
      if (achievement.id === 'lucky-winner') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'wheel_spins':
      if (achievement.id === 'wheel-spinner') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'shares':
      if (achievement.id === 'social-butterfly') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'achievements_unlocked':
      if (['achievement-hunter', 'completionist'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;
  }

  return { shouldUpdate, newProgress: Math.min(achievement.target, newProgress) };
}

/**
 * Filter achievements by category
 */
export function getAchievementsByCategory(achievements: Achievement[], category: string): Achievement[] {
  return achievements.filter(a => a.category === category);
}

/**
 * Calculate total achievement points based on tier
 */
export function getTotalAchievementPoints(achievements: Achievement[]): number {
  return achievements
    .filter(a => a.isUnlocked)
    .reduce((total, achievement) => total + TIER_POINTS[achievement.tier], 0);
}

/**
 * Get completion percentage (non-secret achievements only)
 */
export function getCompletionPercentage(achievements: Achievement[]): number {
  const nonSecretAchievements = achievements.filter(a => !a.secret);
  const total = nonSecretAchievements.length;
  const unlocked = nonSecretAchievements.filter(a => a.isUnlocked).length;
  return total > 0 ? Math.round((unlocked / total) * 100) : 0;
}

/**
 * Generate shareable achievement text and track share count
 */
export function generateShareText(achievement: Achievement): string {
  if (!achievement.isUnlocked) return '';

  // Track share for achievement
  const currentShares = parseInt(localStorage.getItem('achievement-shares') || '0', 10);
  localStorage.setItem('achievement-shares', String(currentShares + 1));

  return `🏆 Achievement Unlocked: ${achievement.title}\n${achievement.description}\n\nShare your focus journey! #PetParadise #FocusAchievement`;
}

/**
 * Get claimed achievement IDs from localStorage
 */
export function getClaimedAchievementIds(): Set<string> {
  try {
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      const achievements: Achievement[] = data.achievements || [];
      return new Set(achievements.filter(a => a.rewardsClaimed).map(a => a.id));
    }
    return new Set();
  } catch (error) {
    achievementLogger.error('Failed to get claimed achievement IDs:', error);
    return new Set();
  }
}

/**
 * Check if an achievement has been claimed in localStorage
 */
export function isAchievementClaimed(achievementId: string): boolean {
  try {
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      const savedAchievement = (data.achievements || []).find((a: Achievement) => a.id === achievementId);
      return savedAchievement?.rewardsClaimed || false;
    }
    return false;
  } catch (error) {
    achievementLogger.error('Failed to check if achievement is claimed:', error);
    return false;
  }
}
