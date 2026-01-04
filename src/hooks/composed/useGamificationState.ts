/**
 * Gamification State Hook
 *
 * Manages achievements, quests, and streaks.
 * Part of the decomposed useBackendAppState pattern.
 */

import { useMemo } from 'react';
import { useAchievementSystem } from '@/hooks/useAchievementSystem';
import { useBackendQuests } from '@/hooks/useBackendQuests';
import { useBackendStreaks } from '@/hooks/useBackendStreaks';

export interface GamificationState {
  // Achievements
  totalAchievements: number;
  unlockedAchievements: number;
  achievementPoints: number;

  // Quests
  activeQuests: number;
  completedQuests: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;

  // Loading
  isLoading: boolean;
}

export interface GamificationActions {
  checkAndUnlockAchievements: (type: string, value: number) => Promise<void>;
  updateQuestProgress: (type: string, amount: number) => Promise<void>;
  recordSession: () => Promise<unknown>;
}

export function useGamificationState(): GamificationState & GamificationActions & {
  // Direct access for components that need full data
  achievements: ReturnType<typeof useAchievementSystem>;
  quests: ReturnType<typeof useBackendQuests>;
  streaks: ReturnType<typeof useBackendStreaks>;
} {
  const achievements = useAchievementSystem();
  const quests = useBackendQuests();
  const streaks = useBackendStreaks();

  const state = useMemo<GamificationState>(() => ({
    totalAchievements: achievements.achievements.length,
    unlockedAchievements: achievements.unlockedAchievements.length,
    achievementPoints: achievements.getTotalAchievementPoints(),
    activeQuests: quests.activeQuests.length,
    completedQuests: quests.completedQuests.length,
    currentStreak: streaks.streakData.currentStreak,
    longestStreak: streaks.streakData.longestStreak,
    streakFreezes: streaks.streakData.streakFreezeCount,
    isLoading: achievements.isLoading || quests.isLoading || streaks.isLoading,
  }), [achievements, quests, streaks]);

  return {
    ...state,
    checkAndUnlockAchievements: achievements.checkAndUnlockAchievements,
    updateQuestProgress: quests.updateQuestProgress,
    recordSession: streaks.recordSession,
    // Direct access for components needing full data
    achievements,
    quests,
    streaks,
  };
}
