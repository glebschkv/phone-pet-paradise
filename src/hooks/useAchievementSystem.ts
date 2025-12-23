import { useState, useEffect, useCallback, useRef } from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'focus' | 'collection' | 'social' | 'special' | 'bond' | 'economy' | 'progression';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  rewardsClaimed?: boolean;
  secret?: boolean;
  rewards: AchievementReward[];
}

export interface AchievementReward {
  type: 'xp' | 'coins' | 'title' | 'cosmetic' | 'ability';
  amount?: number;
  itemId?: string;
  description: string;
}

export interface AchievementUnlockEvent {
  achievement: Achievement;
  rewards: { xp: number; coins: number };
}

export interface AchievementSystemReturn {
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  updateProgress: (achievementId: string, progress: number) => void;
  checkAndUnlockAchievements: (type: string, value: number) => Achievement[];
  getAchievementsByCategory: (category: string) => Achievement[];
  getTotalAchievementPoints: () => number;
  getCompletionPercentage: () => number;
  shareAchievement: (achievementId: string) => string;
  pendingUnlock: AchievementUnlockEvent | null;
  dismissPendingUnlock: () => void;
  claimRewards: (achievementId: string) => { xp: number; coins: number };
}

const ACHIEVEMENT_STORAGE_KEY = 'achievement-system-data';
const ACHIEVEMENT_UNLOCK_EVENT = 'achievement-unlocked';
const ACHIEVEMENT_CLAIMED_EVENT = 'achievement-claimed';

// Achievement definitions with BOOSTED rewards for satisfying progression!
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedAt' | 'rewardsClaimed'>[] = [
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

const TIER_POINTS = {
  bronze: 10,
  silver: 25,
  gold: 50,
  platinum: 100,
  diamond: 200
};

export const useAchievementSystem = (): AchievementSystemReturn => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pendingUnlock, setPendingUnlock] = useState<AchievementUnlockEvent | null>(null);
  const pendingUnlockQueue = useRef<AchievementUnlockEvent[]>([]);
  // Track claimed achievement IDs synchronously to prevent race conditions
  const claimedIdsRef = useRef<Set<string>>(new Set());
  // Track queued unlock IDs to prevent duplicates from event listeners
  const queuedUnlockIdsRef = useRef<Set<string>>(new Set());

  // Initialize achievements from definitions
  const initializeAchievements = useCallback(() => {
    const initialized = ACHIEVEMENT_DEFINITIONS.map(def => ({
      ...def,
      progress: 0,
      isUnlocked: false,
      rewardsClaimed: false
    }));
    return initialized;
  }, []);

  // Merge saved data with definitions (handles new achievements)
  const mergeWithDefinitions = useCallback((saved: Achievement[]): Achievement[] => {
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
  }, []);

  // Load achievement data
  const loadAchievementData = useCallback(() => {
    try {
      const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const merged = mergeWithDefinitions(data.achievements || []);
        // Initialize claimed IDs ref from stored data
        claimedIdsRef.current = new Set(
          merged.filter(a => a.rewardsClaimed).map(a => a.id)
        );
        setAchievements(merged);
      } else {
        claimedIdsRef.current = new Set();
        setAchievements(initializeAchievements());
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error);
      claimedIdsRef.current = new Set();
      setAchievements(initializeAchievements());
    }
  }, [initializeAchievements, mergeWithDefinitions]);

  // Save achievement data (merges to preserve claimed status from other instances)
  const saveAchievementData = useCallback((achievementData: Achievement[]) => {
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

        // Also update the ref with any newly discovered claimed IDs
        claimedIds.forEach(id => claimedIdsRef.current.add(id));
      }

      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify({ achievements: mergedData }));
    } catch (error) {
      console.error('Failed to save achievement data:', error);
    }
  }, []);

  // Calculate total rewards for an achievement
  const calculateRewards = useCallback((achievement: Achievement): { xp: number; coins: number } => {
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
  }, []);

  // Queue an achievement unlock for display
  const queueAchievementUnlock = useCallback((achievement: Achievement) => {
    // Prevent duplicate queuing
    if (queuedUnlockIdsRef.current.has(achievement.id)) {
      return;
    }
    queuedUnlockIdsRef.current.add(achievement.id);

    const rewards = calculateRewards(achievement);
    const event: AchievementUnlockEvent = { achievement, rewards };

    if (pendingUnlock === null) {
      setPendingUnlock(event);
    } else {
      pendingUnlockQueue.current.push(event);
    }

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent(ACHIEVEMENT_UNLOCK_EVENT, { detail: event }));
  }, [pendingUnlock, calculateRewards]);

  // Dismiss the current pending unlock and show next if any
  const dismissPendingUnlock = useCallback(() => {
    if (pendingUnlockQueue.current.length > 0) {
      setPendingUnlock(pendingUnlockQueue.current.shift()!);
    } else {
      setPendingUnlock(null);
    }
  }, []);

  // Claim rewards for an achievement (called externally)
  const claimRewards = useCallback((achievementId: string): { xp: number; coins: number } => {
    // Synchronous check - prevents race conditions from multiple calls
    if (claimedIdsRef.current.has(achievementId)) {
      return { xp: 0, coins: 0 };
    }

    // Also check localStorage for cross-component sync
    try {
      const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const savedAchievement = (data.achievements || []).find((a: Achievement) => a.id === achievementId);
        if (savedAchievement?.rewardsClaimed) {
          claimedIdsRef.current.add(achievementId);
          return { xp: 0, coins: 0 };
        }
      }
    } catch (error) {
      console.error('Failed to check localStorage:', error);
    }

    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.isUnlocked || achievement.rewardsClaimed) {
      return { xp: 0, coins: 0 };
    }

    // Mark as claimed IMMEDIATELY in ref to prevent race conditions
    claimedIdsRef.current.add(achievementId);

    const rewards = calculateRewards(achievement);

    // Mark rewards as claimed in state and persist
    setAchievements(prev => {
      const updated = prev.map(a =>
        a.id === achievementId ? { ...a, rewardsClaimed: true } : a
      );
      saveAchievementData(updated);
      return updated;
    });

    // Dispatch event for same-tab sync across hook instances
    window.dispatchEvent(new CustomEvent(ACHIEVEMENT_CLAIMED_EVENT, {
      detail: { achievementId }
    }));

    return rewards;
  }, [achievements, calculateRewards, saveAchievementData]);

  // Update progress for specific achievement
  const updateProgress = useCallback((achievementId: string, progress: number) => {
    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.id === achievementId && !achievement.isUnlocked) {
          const newProgress = Math.min(achievement.target, Math.max(0, progress));
          const wasUnlocked = newProgress >= achievement.target && !achievement.isUnlocked;

          if (wasUnlocked) {
            const unlockedAchievement = {
              ...achievement,
              progress: newProgress,
              isUnlocked: true,
              unlockedAt: Date.now(),
              rewardsClaimed: false
            };
            queueAchievementUnlock(unlockedAchievement);
            return unlockedAchievement;
          }

          return {
            ...achievement,
            progress: newProgress
          };
        }
        return achievement;
      });

      saveAchievementData(updated);
      return updated;
    });
  }, [queueAchievementUnlock, saveAchievementData]);

  // Check and unlock achievements based on activity
  const checkAndUnlockAchievements = useCallback((type: string, value: number): Achievement[] => {
    const newlyUnlocked: Achievement[] = [];

    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.isUnlocked) return achievement;

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

        if (shouldUpdate) {
          const finalProgress = Math.min(achievement.target, newProgress);
          const isNewlyUnlocked = finalProgress >= achievement.target && !achievement.isUnlocked;

          if (isNewlyUnlocked) {
            const unlockedAchievement = {
              ...achievement,
              progress: finalProgress,
              isUnlocked: true,
              unlockedAt: Date.now(),
              rewardsClaimed: false
            };
            newlyUnlocked.push(unlockedAchievement);
            queueAchievementUnlock(unlockedAchievement);
            return unlockedAchievement;
          }

          return {
            ...achievement,
            progress: finalProgress
          };
        }

        return achievement;
      });

      saveAchievementData(updated);
      return updated;
    });

    return newlyUnlocked;
  }, [queueAchievementUnlock, saveAchievementData]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category: string): Achievement[] => {
    return achievements.filter(a => a.category === category);
  }, [achievements]);

  // Calculate total achievement points
  const getTotalAchievementPoints = useCallback((): number => {
    return achievements
      .filter(a => a.isUnlocked)
      .reduce((total, achievement) => total + TIER_POINTS[achievement.tier], 0);
  }, [achievements]);

  // Get completion percentage
  const getCompletionPercentage = useCallback((): number => {
    const nonSecretAchievements = achievements.filter(a => !a.secret);
    const total = nonSecretAchievements.length;
    const unlocked = nonSecretAchievements.filter(a => a.isUnlocked).length;
    return total > 0 ? Math.round((unlocked / total) * 100) : 0;
  }, [achievements]);

  // Generate shareable achievement text
  const shareAchievement = useCallback((achievementId: string): string => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.isUnlocked) return '';

    // Track share for achievement
    const currentShares = parseInt(localStorage.getItem('achievement-shares') || '0', 10);
    localStorage.setItem('achievement-shares', String(currentShares + 1));

    return `🏆 Achievement Unlocked: ${achievement.title}\n${achievement.description}\n\nShare your focus journey! #PetParadise #FocusAchievement`;
  }, [achievements]);

  // Computed values
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);

  // Initialize on mount and listen for storage changes (cross-component sync)
  useEffect(() => {
    loadAchievementData();

    // Listen for storage changes from other components/tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACHIEVEMENT_STORAGE_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          const merged = mergeWithDefinitions(data.achievements || []);
          // Update claimed IDs ref
          claimedIdsRef.current = new Set(
            merged.filter(a => a.rewardsClaimed).map(a => a.id)
          );
          setAchievements(merged);
        } catch (error) {
          console.error('Failed to sync achievement data:', error);
        }
      }
    };

    // Listen for claim events from other hook instances in the same tab
    const handleClaimEvent = (e: CustomEvent<{ achievementId: string }>) => {
      const { achievementId } = e.detail;
      // Update ref immediately
      claimedIdsRef.current.add(achievementId);
      // Update state to reflect the claim
      setAchievements(prev =>
        prev.map(a =>
          a.id === achievementId ? { ...a, rewardsClaimed: true } : a
        )
      );
    };

    // Listen for unlock events from other hook instances (syncs pendingUnlock across instances)
    const handleUnlockEvent = (e: CustomEvent<AchievementUnlockEvent>) => {
      const unlockEvent = e.detail;
      // Prevent duplicates - check if already queued
      if (queuedUnlockIdsRef.current.has(unlockEvent.achievement.id)) {
        return;
      }
      queuedUnlockIdsRef.current.add(unlockEvent.achievement.id);

      // Queue this unlock in this hook instance too
      if (pendingUnlock === null) {
        setPendingUnlock(unlockEvent);
      } else {
        pendingUnlockQueue.current.push(unlockEvent);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(ACHIEVEMENT_CLAIMED_EVENT, handleClaimEvent as EventListener);
    window.addEventListener(ACHIEVEMENT_UNLOCK_EVENT, handleUnlockEvent as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(ACHIEVEMENT_CLAIMED_EVENT, handleClaimEvent as EventListener);
      window.removeEventListener(ACHIEVEMENT_UNLOCK_EVENT, handleUnlockEvent as EventListener);
    };
  }, [loadAchievementData, mergeWithDefinitions, pendingUnlock]);

  // Check achievement-based achievements when unlocks change
  useEffect(() => {
    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    if (unlockedCount > 0) {
      // Check meta achievements (achievements about achievements)
      const achievementHunter = achievements.find(a => a.id === 'achievement-hunter');
      const completionist = achievements.find(a => a.id === 'completionist');

      if (achievementHunter && !achievementHunter.isUnlocked && unlockedCount >= achievementHunter.target) {
        checkAndUnlockAchievements('achievements_unlocked', unlockedCount);
      }

      const nonSecretCount = achievements.filter(a => !a.secret && a.isUnlocked).length;
      if (completionist && !completionist.isUnlocked && nonSecretCount >= completionist.target) {
        checkAndUnlockAchievements('achievements_unlocked', nonSecretCount);
      }
    }
  }, [achievements, checkAndUnlockAchievements]);

  return {
    achievements,
    unlockedAchievements,
    updateProgress,
    checkAndUnlockAchievements,
    getAchievementsByCategory,
    getTotalAchievementPoints,
    getCompletionPercentage,
    shareAchievement,
    pendingUnlock,
    dismissPendingUnlock,
    claimRewards
  };
};
