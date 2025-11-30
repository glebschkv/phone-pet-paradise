import { useState, useEffect } from 'react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string;
  totalSessions: number;
  streakFreezeCount: number; // Allows missing one day
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

export const useStreakSystem = () => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: '',
    totalSessions: 0,
    streakFreezeCount: 3, // Start with 3 streak freezes
  });

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = () => {
    const saved = localStorage.getItem('pet_paradise_streak_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStreakData(data);
        // Check if streak should be broken due to missing days
        checkStreakValidity(data);
      } catch (error) {
        console.error('Failed to load streak data:', error);
      }
    }
  };

  const saveStreakData = (data: StreakData) => {
    localStorage.setItem('pet_paradise_streak_data', JSON.stringify(data));
    setStreakData(data);
  };

  const checkStreakValidity = (data: StreakData) => {
    if (!data.lastSessionDate) return;

    const lastSession = new Date(data.lastSessionDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) {
      // Streak is broken if more than 1 day has passed
      if (data.streakFreezeCount > 0 && daysDiff === 2) {
        // Use a streak freeze
        const updatedData = {
          ...data,
          streakFreezeCount: data.streakFreezeCount - 1,
        };
        saveStreakData(updatedData);
      } else {
        // Break the streak
        const updatedData = {
          ...data,
          currentStreak: 0,
        };
        saveStreakData(updatedData);
      }
    }
  };

  const recordSession = (): StreakReward | null => {
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

    saveStreakData(updatedData);

    // Check for streak rewards
    const reward = STREAK_REWARDS.find(r => r.milestone === newStreak);
    return reward || null;
  };

  const useStreakFreeze = (): boolean => {
    if (streakData.streakFreezeCount > 0) {
      const updatedData = {
        ...streakData,
        streakFreezeCount: streakData.streakFreezeCount - 1,
      };
      saveStreakData(updatedData);
      return true;
    }
    return false;
  };

  const earnStreakFreeze = () => {
    const updatedData = {
      ...streakData,
      streakFreezeCount: streakData.streakFreezeCount + 1,
    };
    saveStreakData(updatedData);
  };

  const getNextMilestone = (): StreakReward | null => {
    return STREAK_REWARDS.find(r => r.milestone > streakData.currentStreak) || null;
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 100) return '🏆';
    if (streak >= 50) return '⭐';
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '🎯';
    if (streak >= 3) return '✨';
    return '🌱';
  };

  const resetStreak = () => {
    const resetData: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: '',
      totalSessions: 0,
      streakFreezeCount: 3,
    };
    saveStreakData(resetData);
  };

  return {
    streakData,
    recordSession,
    useStreakFreeze,
    earnStreakFreeze,
    getNextMilestone,
    getStreakEmoji,
    resetStreak,
    streakRewards: STREAK_REWARDS,
  };
};