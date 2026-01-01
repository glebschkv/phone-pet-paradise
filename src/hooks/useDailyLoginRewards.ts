import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface DailyReward {
  day: number;
  type: 'xp' | 'streak_freeze' | 'mystery_bonus';
  amount: number;
  label: string;
  description: string;
  icon: string;
}

export interface DailyLoginState {
  currentStreak: number;
  lastClaimDate: string;
  totalDaysClaimed: number;
  hasClaimedToday: boolean;
}

// 7-day reward cycle that repeats with escalating rewards - BOOSTED!
const DAILY_REWARDS: DailyReward[] = [
  { day: 1, type: 'xp', amount: 40, label: 'Welcome Back!', description: 'Start your week strong', icon: '🌟' },
  { day: 2, type: 'xp', amount: 60, label: 'Day 2 Bonus', description: 'Keep the momentum going', icon: '✨' },
  { day: 3, type: 'xp', amount: 90, label: 'Triple Treat', description: '3 days in a row!', icon: '🎁' },
  { day: 4, type: 'streak_freeze', amount: 2, label: 'Safety Net', description: 'Earn 2 Streak Freezes!', icon: '🧊' },
  { day: 5, type: 'xp', amount: 130, label: 'Halfway Hero', description: 'Over halfway there!', icon: '💪' },
  { day: 6, type: 'xp', amount: 175, label: 'Almost There', description: 'One more day!', icon: '🔥' },
  { day: 7, type: 'mystery_bonus', amount: 350, label: 'Weekly Jackpot!', description: 'MASSIVE bonus XP!', icon: '🎰' },
];

const STORAGE_KEY = 'pet_paradise_daily_login';
const LOGIN_REWARD_EVENT = 'petIsland_dailyLoginReward';

export const useDailyLoginRewards = () => {
  const [loginState, setLoginState] = useState<DailyLoginState>({
    currentStreak: 0,
    lastClaimDate: '',
    totalDaysClaimed: 0,
    hasClaimedToday: false,
  });

  const [pendingReward, setPendingReward] = useState<DailyReward | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Load saved state
  useEffect(() => {
    loadLoginState();
  }, []);

  const loadLoginState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as DailyLoginState;
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();

        // Check if already claimed today
        if (data.lastClaimDate === today) {
          setLoginState({ ...data, hasClaimedToday: true });
          return;
        }

        // Check if streak should be maintained or broken
        if (data.lastClaimDate === yesterdayString) {
          // Streak continues - show reward modal
          setLoginState({ ...data, hasClaimedToday: false });
          const nextDay = (data.currentStreak % 7) + 1;
          const reward = DAILY_REWARDS.find(r => r.day === nextDay) || DAILY_REWARDS[0];
          setPendingReward(reward);
          setShowRewardModal(true);
        } else if (data.lastClaimDate === '') {
          // First time - show day 1 reward
          setLoginState(data);
          setPendingReward(DAILY_REWARDS[0]);
          setShowRewardModal(true);
        } else {
          // Streak broken - reset to day 1
          const resetState: DailyLoginState = {
            ...data,
            currentStreak: 0,
            hasClaimedToday: false,
          };
          setLoginState(resetState);
          setPendingReward(DAILY_REWARDS[0]);
          setShowRewardModal(true);
        }
      } catch (error) {
        logger.error('Failed to load daily login state:', error);
        // First time user
        setPendingReward(DAILY_REWARDS[0]);
        setShowRewardModal(true);
      }
    } else {
      // First time user
      setPendingReward(DAILY_REWARDS[0]);
      setShowRewardModal(true);
    }
  };

  const saveLoginState = (data: DailyLoginState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setLoginState(data);
  };

  const claimReward = useCallback((): DailyReward | null => {
    if (loginState.hasClaimedToday || !pendingReward) {
      return null;
    }

    const today = new Date().toDateString();
    const newStreak = loginState.currentStreak + 1;

    const updatedState: DailyLoginState = {
      currentStreak: newStreak,
      lastClaimDate: today,
      totalDaysClaimed: loginState.totalDaysClaimed + 1,
      hasClaimedToday: true,
    };

    saveLoginState(updatedState);

    // Dispatch event for other systems to listen (XP system, streak system)
    window.dispatchEvent(new CustomEvent(LOGIN_REWARD_EVENT, {
      detail: { reward: pendingReward, streak: newStreak }
    }));

    const claimedReward = pendingReward;
    setPendingReward(null);
    setShowRewardModal(false);

    return claimedReward;
  }, [loginState, pendingReward]);

  const dismissModal = useCallback(() => {
    setShowRewardModal(false);
  }, []);

  const getTodayReward = useCallback((): DailyReward => {
    const nextDay = (loginState.currentStreak % 7) + 1;
    return DAILY_REWARDS.find(r => r.day === nextDay) || DAILY_REWARDS[0];
  }, [loginState.currentStreak]);

  const getUpcomingRewards = useCallback((): DailyReward[] => {
    const currentDay = loginState.currentStreak % 7;
    const upcoming: DailyReward[] = [];

    for (let i = 1; i <= 7; i++) {
      const dayIndex = (currentDay + i) % 7;
      upcoming.push(DAILY_REWARDS[dayIndex]);
    }

    return upcoming;
  }, [loginState.currentStreak]);

  const getStreakBonus = useCallback((): number => {
    // Bonus multiplier based on streak length
    if (loginState.currentStreak >= 30) return 0.5; // +50% XP
    if (loginState.currentStreak >= 14) return 0.3; // +30% XP
    if (loginState.currentStreak >= 7) return 0.2;  // +20% XP
    if (loginState.currentStreak >= 3) return 0.1;  // +10% XP
    return 0;
  }, [loginState.currentStreak]);

  return {
    loginState,
    pendingReward,
    showRewardModal,
    claimReward,
    dismissModal,
    getTodayReward,
    getUpcomingRewards,
    getStreakBonus,
    dailyRewards: DAILY_REWARDS,
  };
};
