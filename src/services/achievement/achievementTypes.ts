/**
 * Achievement System Types
 * Type definitions for the achievement system
 */

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

export type AchievementCategory = Achievement['category'];
export type AchievementTier = Achievement['tier'];

export type AchievementDefinition = Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedAt' | 'rewardsClaimed'>;
