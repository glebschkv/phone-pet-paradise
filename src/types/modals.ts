/**
 * Type-safe Modal Data Types
 *
 * Uses discriminated unions to ensure type safety when opening modals.
 * Each modal type has its own data shape, enforced at compile time.
 */

// Modal type discriminator
export type ModalType =
  | 'none'
  | 'pet-detail'
  | 'background-detail'
  | 'achievement'
  | 'quest'
  | 'lucky-wheel'
  | 'battle-pass'
  | 'premium'
  | 'settings'
  | 'level-up'
  | 'streak'
  | 'reward';

// Type-safe modal data for each modal type
export interface PetDetailModalData {
  petId: string;
  petType: string;
}

export interface BackgroundDetailModalData {
  backgroundId: string;
}

export interface AchievementModalData {
  achievementId: string;
  justUnlocked?: boolean;
}

export interface QuestModalData {
  questId: string;
}

export interface LevelUpModalData {
  oldLevel: number;
  newLevel: number;
  unlockedRewards: Array<{
    name: string;
    description: string;
    type: 'pet' | 'background' | 'feature';
  }>;
}

export interface StreakModalData {
  currentStreak: number;
  longestStreak: number;
  reward?: {
    type: 'coins' | 'xp' | 'item';
    amount: number;
  };
}

export interface RewardModalData {
  rewardType: 'coins' | 'xp' | 'item' | 'pet' | 'background';
  amount?: number;
  itemId?: string;
  source: string;
}

// Discriminated union for all modal data types
export type ModalDataUnion =
  | { type: 'none' }
  | { type: 'pet-detail'; data: PetDetailModalData }
  | { type: 'background-detail'; data: BackgroundDetailModalData }
  | { type: 'achievement'; data: AchievementModalData }
  | { type: 'quest'; data: QuestModalData }
  | { type: 'lucky-wheel' }
  | { type: 'battle-pass' }
  | { type: 'premium' }
  | { type: 'settings' }
  | { type: 'level-up'; data: LevelUpModalData }
  | { type: 'streak'; data: StreakModalData }
  | { type: 'reward'; data: RewardModalData };

// Helper type to extract data type for a specific modal
export type ModalDataFor<T extends ModalType> = Extract<ModalDataUnion, { type: T }> extends { data: infer D }
  ? D
  : undefined;

// Type guard functions
export function isPetDetailModal(modal: ModalDataUnion): modal is { type: 'pet-detail'; data: PetDetailModalData } {
  return modal.type === 'pet-detail';
}

export function isAchievementModal(modal: ModalDataUnion): modal is { type: 'achievement'; data: AchievementModalData } {
  return modal.type === 'achievement';
}

export function isLevelUpModal(modal: ModalDataUnion): modal is { type: 'level-up'; data: LevelUpModalData } {
  return modal.type === 'level-up';
}

export function isQuestModal(modal: ModalDataUnion): modal is { type: 'quest'; data: QuestModalData } {
  return modal.type === 'quest';
}
