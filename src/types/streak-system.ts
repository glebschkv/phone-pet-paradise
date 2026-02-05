// Streak System Types
// Consolidated type definitions for the streak system

/**
 * Represents the user's streak data
 */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string;
  totalSessions: number;
  streakFreezeCount: number;
  lastMonthlyFreezeGrant?: string;
}

/**
 * Represents a streak milestone reward
 */
export interface StreakReward {
  milestone: number;
  title: string;
  description: string;
  xpBonus: number;
}

/**
 * Default streak data for new users
 */
export const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastSessionDate: '',
  totalSessions: 0,
  streakFreezeCount: 0,
};

/**
 * Streak rewards configuration
 */
export const STREAK_REWARDS: StreakReward[] = [
  { milestone: 3, title: 'Getting Started', description: '3 days in a row!', xpBonus: 50 },
  { milestone: 7, title: 'Week Warrior', description: '1 week streak!', xpBonus: 100 },
  { milestone: 14, title: 'Two Week Champion', description: '2 weeks strong!', xpBonus: 200 },
  { milestone: 30, title: 'Monthly Master', description: '30 days of focus!', xpBonus: 500 },
  { milestone: 60, title: 'Unstoppable', description: '2 months of dedication!', xpBonus: 1000 },
  { milestone: 100, title: 'Legendary', description: '100 days of mastery!', xpBonus: 2000 },
];

/**
 * Return type for streak system hooks
 */
export interface StreakSystemReturn {
  streakData: StreakData;
  recordSession: () => StreakReward | null | Promise<StreakReward | null>;
  useStreakFreeze: () => boolean | Promise<boolean>;
  earnStreakFreeze: (amount?: number) => void | Promise<void>;
  addStreakFreezes?: (amount: number) => void;
  getNextMilestone: () => StreakReward | null;
  getStreakIcon: (streak: number) => string;
  resetStreak: () => void | Promise<void>;
  streakRewards: StreakReward[];
  isLoading?: boolean;
}
