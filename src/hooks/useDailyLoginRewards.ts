import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export interface DailyReward {
  day: number;
  type: 'xp' | 'streak_freeze' | 'mystery_bonus';
  xp: number;
  coins: number;
  streakFreeze?: number;
  luckyWheelSpin?: number;
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

// 7-day reward cycle with balanced XP + coin rewards
// Weekly total: 1,050 XP + 785 coins + streak freeze + lucky spin
const DAILY_REWARDS: DailyReward[] = [
  { day: 1, type: 'xp', xp: 50, coins: 25, label: 'Welcome Back!', description: 'Start your week strong', icon: '🌟' },
  { day: 2, type: 'xp', xp: 75, coins: 40, label: 'Day 2 Bonus', description: 'Keep the momentum going', icon: '✨' },
  { day: 3, type: 'xp', xp: 100, coins: 60, label: 'Triple Treat', description: '3 days in a row!', icon: '🎁' },
  { day: 4, type: 'streak_freeze', xp: 125, coins: 80, streakFreeze: 1, label: 'Safety Net', description: '+1 Streak Freeze!', icon: '🧊' },
  { day: 5, type: 'xp', xp: 150, coins: 120, label: 'Halfway Hero', description: 'Over halfway there!', icon: '💪' },
  { day: 6, type: 'xp', xp: 200, coins: 160, label: 'Almost There', description: 'One more day!', icon: '🔥' },
  { day: 7, type: 'mystery_bonus', xp: 350, coins: 300, luckyWheelSpin: 1, label: 'Weekly Jackpot!', description: 'Massive rewards + free spin!', icon: '🎰' },
];

const STORAGE_KEY_PREFIX = 'pet_paradise_daily_login';
const LEGACY_STORAGE_KEY = 'pet_paradise_daily_login';
const LOGIN_REWARD_EVENT = 'petIsland_dailyLoginReward';

/**
 * Build a per-user storage key so that signing out and back in with a
 * different account doesn't re-award the first user's daily reward.
 * Falls back to a shared key for guest mode.
 */
function getStorageKey(userId: string | undefined): string {
  if (userId) return `${STORAGE_KEY_PREFIX}_${userId}`;
  return LEGACY_STORAGE_KEY;
}

export const useDailyLoginRewards = () => {
  const { user, isGuestMode } = useAuth();
  const userId = user?.id;

  const [loginState, setLoginState] = useState<DailyLoginState>({
    currentStreak: 0,
    lastClaimDate: '',
    totalDaysClaimed: 0,
    hasClaimedToday: false,
  });

  const [pendingReward, setPendingReward] = useState<DailyReward | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Track the userId we loaded for so we reload when it changes
  const loadedForRef = useRef<string | undefined>(undefined);

  const storageKey = getStorageKey(userId);

  const loadLoginState = useCallback(() => {
    // Try user-specific key first, fall back to legacy shared key for migration
    let saved = localStorage.getItem(storageKey);
    if (!saved && storageKey !== LEGACY_STORAGE_KEY) {
      saved = localStorage.getItem(LEGACY_STORAGE_KEY);
      // Migrate: if we found data under the legacy key, move it to the user key
      if (saved) {
        try {
          localStorage.setItem(storageKey, saved);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // Storage full — continue with what we have
        }
      }
    }

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
          setPendingReward(null);
          setShowRewardModal(false);
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
  }, [storageKey]);

  // Reload when user changes (sign-in / sign-out) or on initial mount
  useEffect(() => {
    // Skip if auth is still loading (userId will be undefined for guest too,
    // but isGuestMode tells us the choice was made)
    if (!userId && !isGuestMode) return;

    // Only reload if the userId actually changed
    if (loadedForRef.current === userId) return;
    loadedForRef.current = userId;

    loadLoginState();
  }, [userId, isGuestMode, loadLoginState]);

  const saveLoginState = useCallback((data: DailyLoginState) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // Storage full — state still updated in-memory so UI stays correct
      logger.warn('Failed to persist daily login state (storage full)');
    }
    setLoginState(data);
  }, [storageKey]);

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

    // Fire event so the notification system can schedule tomorrow's reminder
    // (avoids needing useNotifications() here, which would duplicate the hook)
    window.dispatchEvent(new CustomEvent('schedule-daily-reward-notification'));

    return claimedReward;
  }, [loginState, pendingReward, saveLoginState]);

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
