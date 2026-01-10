// Quest System Types
// Consolidated type definitions for the quest system

/**
 * The type of quest objective
 */
export type QuestObjectiveType =
  | 'focus_time'
  | 'pet_interaction'
  | 'bond_level'
  | 'biome_unlock'
  | 'streak'
  | 'collection'
  | 'sessions'
  | 'perfect_focus';

/**
 * The type of quest reward
 */
export type QuestRewardType = 'xp' | 'coins' | 'pet_unlock' | 'ability' | 'cosmetic';

/**
 * The type of quest (daily, weekly, or story-based)
 */
export type QuestType = 'daily' | 'weekly' | 'story';

/**
 * Represents a single objective within a quest
 */
export interface QuestObjective {
  id: string;
  description: string;
  target: number;
  current: number;
  type: QuestObjectiveType;
}

/**
 * Represents a reward given upon quest completion
 */
export interface QuestReward {
  type: QuestRewardType;
  amount?: number;
  itemId?: string;
  description: string;
}

/**
 * Represents a quest in the system
 */
export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  isCompleted: boolean;
  progress: Record<string, number>;
  unlockLevel: number;
  expiresAt?: number;
  storylineChapter?: number;
}

/**
 * Template for generating quest objectives
 */
export interface QuestObjectiveTemplate {
  type: string;
  target: number;
  description: string;
}

/**
 * Template for generating quests
 */
export interface QuestTemplate {
  title: string;
  description: string;
  objectives: QuestObjectiveTemplate[];
  rewards: QuestReward[];
}

/**
 * Return type for quest system hooks
 */
export interface QuestSystemReturn {
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  storyQuests: Quest[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  updateQuestProgress: (type: string, amount: number, metadata?: Record<string, unknown>) => void | Promise<void>;
  completeQuest: (questId: string) => void | Promise<void>;
  getQuestById: (questId: string) => Quest | undefined;
  generateDailyQuests: () => void | Promise<void>;
  generateWeeklyQuests: () => void | Promise<void>;
  getNextStoryQuest: (currentLevel: number) => Quest | undefined;
  isLoading?: boolean;
}
