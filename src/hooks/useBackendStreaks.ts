import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSupabaseData } from './useSupabaseData';
import { toast } from 'sonner';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string;
  totalSessions: number;
  streakFreezeCount: number;
}

interface StreakReward {
  milestone: number;
  title: string;
  description: string;
  xpBonus: number;
}

const STREAK_REWARDS: StreakReward[] = [
  { milestone: 3, title: "Getting Started", description: "3 days in a row!", xpBonus: 50 },
  { milestone: 7, title: "Week Warrior", description: "1 week streak!", xpBonus: 100 },
  { milestone: 14, title: "Two Week Champion", description: "2 weeks strong!", xpBonus: 200 },
  { milestone: 30, title: "Monthly Master", description: "30 days of focus!", xpBonus: 500 },
  { milestone: 60, title: "Unstoppable", description: "2 months of dedication!", xpBonus: 1000 },
  { milestone: 100, title: "Legendary", description: "100 days of mastery!", xpBonus: 2000 },
];

export const useBackendStreaks = () => {
  const { isAuthenticated } = useAuth();
  const { progress, updateProgress } = useSupabaseData();
  
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: '',
    totalSessions: 0,
    streakFreezeCount: 3,
  });

  // Sync with backend progress data
  useEffect(() => {
    if (isAuthenticated && progress) {
      setStreakData({
        currentStreak: progress.current_streak,
        longestStreak: progress.longest_streak,
        lastSessionDate: progress.last_session_date || '',
        totalSessions: progress.total_sessions,
        streakFreezeCount: progress.streak_freeze_count,
      });
    }
  }, [isAuthenticated, progress]);

  // Preserved for potential use - validates streak data
  // @ts-expect-error - Method kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _checkStreakValidity = useCallback((data: StreakData) => {
    if (!data.lastSessionDate) return data;

    const lastSession = new Date(data.lastSessionDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) {
      // Streak is broken if more than 1 day has passed
      if (data.streakFreezeCount > 0 && daysDiff === 2) {
        // Use a streak freeze
        return {
          ...data,
          streakFreezeCount: data.streakFreezeCount - 1,
        };
      } else {
        // Break the streak
        return {
          ...data,
          currentStreak: 0,
        };
      }
    }
    return data;
  }, []);

  const recordSession = useCallback(async (): Promise<StreakReward | null> => {
    if (!isAuthenticated || !progress) {
      throw new Error('Must be authenticated to record session');
    }

    const today = new Date().toDateString();
    
    if (streakData.lastSessionDate === today) {
      // Already recorded today
      return null;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    let newStreak = streakData.currentStreak;
    
    if (streakData.lastSessionDate === yesterdayString) {
      // Continuing streak
      newStreak = streakData.currentStreak + 1;
    } else if (streakData.lastSessionDate === '') {
      // First session
      newStreak = 1;
    } else {
      // Starting new streak
      newStreak = 1;
    }

    const updatedData: StreakData = {
      ...streakData,
      currentStreak: newStreak,
      longestStreak: Math.max(streakData.longestStreak, newStreak),
      lastSessionDate: today,
      totalSessions: streakData.totalSessions + 1,
    };

    try {
      // Update backend
      await updateProgress({
        current_streak: newStreak,
        longest_streak: Math.max(progress.longest_streak, newStreak),
        last_session_date: new Date().toISOString().split('T')[0],
        total_sessions: progress.total_sessions + 1
      });

      // Update local state
      setStreakData(updatedData);

      // Check for streak rewards
      const reward = STREAK_REWARDS.find(r => r.milestone === newStreak);
      if (reward) {
        toast.success(`Streak Milestone!`, {
          description: `${reward.title}: ${reward.description} (+${reward.xpBonus} XP)`
        });
      }

      return reward || null;
    } catch (error) {
      console.error('Error recording session:', error);
      toast.error('Failed to update streak');
      throw error;
    }
  }, [isAuthenticated, progress, streakData, updateProgress]);

  const useStreakFreeze = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !progress) return false;

    if (streakData.streakFreezeCount > 0) {
      try {
        await updateProgress({
          streak_freeze_count: progress.streak_freeze_count - 1
        });

        setStreakData(prev => ({
          ...prev,
          streakFreezeCount: prev.streakFreezeCount - 1
        }));

        toast.success('Streak Freeze Used', {
          description: 'Your streak has been protected!'
        });

        return true;
      } catch (error) {
        console.error('Error using streak freeze:', error);
        return false;
      }
    }
    return false;
  }, [isAuthenticated, progress, streakData.streakFreezeCount, updateProgress]);

  const earnStreakFreeze = useCallback(async () => {
    if (!isAuthenticated || !progress) return;

    try {
      await updateProgress({
        streak_freeze_count: progress.streak_freeze_count + 1
      });

      setStreakData(prev => ({
        ...prev,
        streakFreezeCount: prev.streakFreezeCount + 1
      }));

      toast.success('Streak Freeze Earned!', {
        description: 'You can now protect your streak once.'
      });
    } catch (error) {
      console.error('Error earning streak freeze:', error);
    }
  }, [isAuthenticated, progress, updateProgress]);

  const getNextMilestone = useCallback((): StreakReward | null => {
    return STREAK_REWARDS.find(r => r.milestone > streakData.currentStreak) || null;
  }, [streakData.currentStreak]);

  const getStreakEmoji = useCallback((streak: number): string => {
    if (streak >= 100) return '🏆';
    if (streak >= 50) return '⭐';
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '🎯';
    if (streak >= 3) return '✨';
    return '🌱';
  }, []);

  const resetStreak = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await updateProgress({
        current_streak: 0,
        longest_streak: 0,
        total_sessions: 0,
        streak_freeze_count: 3,
        last_session_date: null
      });

      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: '',
        totalSessions: 0,
        streakFreezeCount: 3,
      });

      toast.success('Streak data reset');
    } catch (error) {
      console.error('Error resetting streak:', error);
      toast.error('Failed to reset streak');
    }
  }, [isAuthenticated, updateProgress]);

  return {
    streakData,
    recordSession,
    useStreakFreeze,
    earnStreakFreeze,
    getNextMilestone,
    getStreakEmoji,
    resetStreak,
    streakRewards: STREAK_REWARDS,
    isLoading: !progress && isAuthenticated,
  };
};