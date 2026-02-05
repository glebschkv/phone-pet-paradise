import { useEffect, useCallback, useRef } from 'react';
import { streakLogger } from '@/lib/logger';
import type { StreakData, StreakReward } from '@/types/streak-system';
import { STREAK_REWARDS } from '@/types/streak-system';
import { useStreakStore } from '@/stores/streakStore';

// Re-export types for consumers
export type { StreakData, StreakReward };

export const useStreakSystem = () => {
  // Use Zustand store as the single source of truth
  const {
    currentStreak,
    longestStreak,
    lastSessionDate,
    totalSessions,
    streakFreezeCount,
    setStreak,
    setLastSessionDate: _setLastSessionDate,
    incrementSessions: _incrementSessions,
    addStreakFreeze,
    useStreakFreeze: storeUseStreakFreeze,
    updateState,
    resetAll,
  } = useStreakStore();

  // Track if we've already checked streak validity on mount
  const hasCheckedValidityRef = useRef(false);

  // Construct streakData object for backwards compatibility
  const streakData: StreakData = {
    currentStreak,
    longestStreak,
    lastSessionDate,
    totalSessions,
    streakFreezeCount,
  };

  // Check streak validity on mount (runs only once)
  useEffect(() => {
    if (hasCheckedValidityRef.current) return;
    if (!lastSessionDate) return;

    hasCheckedValidityRef.current = true;

    const today = new Date();
    const todayString = today.toDateString();

    // Calculate yesterday's date string for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    // Calculate day before yesterday for streak freeze logic
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoString = twoDaysAgo.toDateString();

    // If the last session was today or yesterday, streak is valid
    if (lastSessionDate === todayString || lastSessionDate === yesterdayString) {
      // Streak is still valid
      return;
    }

    // If the last session was 2 days ago and we have a freeze, use it
    if (lastSessionDate === twoDaysAgoString && streakFreezeCount > 0) {
      storeUseStreakFreeze();
      streakLogger.debug('Streak freeze auto-used');
      return;
    }

    // Streak is broken - more than 1 day has passed
    setStreak(0);
    streakLogger.debug('Streak broken due to inactivity');
  }, [lastSessionDate, streakFreezeCount, storeUseStreakFreeze, setStreak]);

  // Listen for streak freeze grants from premium subscription
  useEffect(() => {
    const handleStreakFreezeGrant = (event: CustomEvent<{ amount: number }>) => {
      const { amount } = event.detail;
      if (amount > 0) {
        addStreakFreeze(amount);
      }
    };

    window.addEventListener('petIsland_grantStreakFreezes', handleStreakFreezeGrant as EventListener);

    return () => {
      window.removeEventListener('petIsland_grantStreakFreezes', handleStreakFreezeGrant as EventListener);
    };
  }, [addStreakFreeze]);

  const recordSession = useCallback((): StreakReward | null => {
    const today = new Date().toDateString();

    if (lastSessionDate === today) {
      // Already recorded today
      return null;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    let newStreak = currentStreak;

    if (lastSessionDate === yesterdayString) {
      // Continuing streak
      newStreak = currentStreak + 1;
    } else if (lastSessionDate === '') {
      // First session
      newStreak = 1;
    } else {
      // Starting new streak
      newStreak = 1;
    }

    // Update all state at once
    updateState({
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      lastSessionDate: today,
      totalSessions: totalSessions + 1,
    });

    // Check for streak rewards
    const reward = STREAK_REWARDS.find(r => r.milestone === newStreak);
    return reward || null;
  }, [currentStreak, longestStreak, lastSessionDate, totalSessions, updateState]);

  const useStreakFreeze = useCallback((): boolean => {
    return storeUseStreakFreeze();
  }, [storeUseStreakFreeze]);

  const earnStreakFreeze = useCallback((amount: number = 1) => {
    addStreakFreeze(amount);
  }, [addStreakFreeze]);

  // Add multiple streak freezes (for purchases or grants)
  const addStreakFreezes = useCallback((amount: number) => {
    if (amount <= 0) return;
    addStreakFreeze(amount);
  }, [addStreakFreeze]);

  const getNextMilestone = useCallback((): StreakReward | null => {
    return STREAK_REWARDS.find(r => r.milestone > currentStreak) || null;
  }, [currentStreak]);

  const getStreakIcon = useCallback((streak: number): string => {
    if (streak >= 100) return 'trophy';
    if (streak >= 50) return 'star';
    if (streak >= 30) return 'fire';
    if (streak >= 14) return 'muscle';
    if (streak >= 7) return 'target';
    if (streak >= 3) return 'sparkles';
    return 'sprout';
  }, []);

  const resetStreak = useCallback(() => {
    resetAll();
  }, [resetAll]);

  return {
    streakData,
    recordSession,
    useStreakFreeze,
    earnStreakFreeze,
    addStreakFreezes,
    getNextMilestone,
    getStreakIcon,
    resetStreak,
    streakRewards: STREAK_REWARDS,
  };
};
