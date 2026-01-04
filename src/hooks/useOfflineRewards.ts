/**
 * Offline-Aware Rewards Hook
 *
 * Wraps the reward system to ensure all rewards are saved locally first,
 * then queued for sync with the backend when online.
 *
 * This hook ensures:
 * - Rewards are always saved to localStorage immediately
 * - Operations are queued for backend sync
 * - User experience is unaffected by network status
 */

import { useCallback } from 'react';
import { useOfflineSyncStore, SYNC_PRIORITIES } from '@/stores/offlineSyncStore';
import { useCoinStore } from '@/stores/coinStore';
import { useXPStore } from '@/stores/xpStore';
import { useStreakStore } from '@/stores/streakStore';
import { useAuth } from './useAuth';
import { syncLogger } from '@/lib/logger';

interface OfflineRewardsReturn {
  // Coin operations
  addCoinsOffline: (amount: number) => void;
  spendCoinsOffline: (amount: number) => boolean;

  // XP operations
  addXPOffline: (amount: number) => void;

  // Streak operations
  recordSessionOffline: () => void;

  // Focus session (combines all rewards)
  recordFocusSessionOffline: (params: {
    durationMinutes: number;
    xpEarned: number;
    coinsEarned: number;
  }) => void;

  // Sync status
  pendingCount: number;
  isOnline: boolean;
}

export function useOfflineRewards(): OfflineRewardsReturn {
  const { user, isGuestMode } = useAuth();
  const { addOperation, pendingOperations, isOnline } = useOfflineSyncStore();
  const coinStore = useCoinStore();
  const xpStore = useXPStore();
  const streakStore = useStreakStore();

  /**
   * Add coins with offline support
   */
  const addCoinsOffline = useCallback(
    (amount: number) => {
      // Always update local store first (immediate feedback)
      coinStore.addCoins(amount);

      // Queue for backend sync if authenticated (not guest)
      if (user && !isGuestMode) {
        addOperation(
          'coin_update',
          {
            coins: coinStore.balance + amount,
            totalEarned: coinStore.totalEarned + amount,
          },
          SYNC_PRIORITIES.HIGH
        );
      }

      syncLogger.debug('[OfflineRewards] Added coins:', amount);
    },
    [user, isGuestMode, coinStore, addOperation]
  );

  /**
   * Spend coins with offline support
   */
  const spendCoinsOffline = useCallback(
    (amount: number): boolean => {
      // Check if can afford
      if (!coinStore.canAfford(amount)) {
        return false;
      }

      // Update local store first
      const success = coinStore.spendCoins(amount);

      if (success && user && !isGuestMode) {
        addOperation(
          'coin_update',
          {
            coins: coinStore.balance,
            totalSpent: coinStore.totalSpent,
          },
          SYNC_PRIORITIES.HIGH
        );
      }

      return success;
    },
    [user, isGuestMode, coinStore, addOperation]
  );

  /**
   * Add XP with offline support
   */
  const addXPOffline = useCallback(
    (amount: number) => {
      // Update local store first
      xpStore.addXP(amount);

      // Queue for backend sync
      if (user && !isGuestMode) {
        addOperation(
          'xp_update',
          {
            totalXp: xpStore.currentXP + amount,
            currentLevel: xpStore.currentLevel,
          },
          SYNC_PRIORITIES.HIGH
        );
      }

      syncLogger.debug('[OfflineRewards] Added XP:', amount);
    },
    [user, isGuestMode, xpStore, addOperation]
  );

  /**
   * Record a focus session with offline support
   */
  const recordSessionOffline = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastSessionDate = streakStore.lastSessionDate;

    // Calculate if streak should continue or reset
    if (lastSessionDate) {
      const lastDate = new Date(lastSessionDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        // Consecutive day - increment streak
        streakStore.incrementStreak();
      } else if (diffDays > 1) {
        // Missed days - reset streak
        streakStore.resetStreak();
        streakStore.incrementStreak();
      }
      // Same day - don't change streak
    } else {
      // First session ever
      streakStore.incrementStreak();
    }

    streakStore.setLastSessionDate(today);
    streakStore.incrementSessions();

    // Queue for backend sync
    if (user && !isGuestMode) {
      addOperation(
        'streak_update',
        {
          currentStreak: streakStore.currentStreak,
          longestStreak: streakStore.longestStreak,
          lastSessionDate: today,
          totalSessions: streakStore.totalSessions,
        },
        SYNC_PRIORITIES.NORMAL
      );
    }

    syncLogger.debug('[OfflineRewards] Recorded session');
  }, [user, isGuestMode, streakStore, addOperation]);

  /**
   * Record a complete focus session with all rewards
   */
  const recordFocusSessionOffline = useCallback(
    (params: { durationMinutes: number; xpEarned: number; coinsEarned: number }) => {
      const { durationMinutes, xpEarned, coinsEarned } = params;

      // Update local stores
      if (coinsEarned > 0) {
        coinStore.addCoins(coinsEarned);
      }
      if (xpEarned > 0) {
        xpStore.addXP(xpEarned);
      }

      // Record streak
      recordSessionOffline();

      // Queue complete focus session for backend
      if (user && !isGuestMode) {
        addOperation(
          'focus_session',
          {
            durationMinutes,
            xpEarned,
            coinsEarned,
            completedAt: new Date().toISOString(),
            sessionType: 'focus',
          },
          SYNC_PRIORITIES.HIGH
        );
      }

      syncLogger.debug('[OfflineRewards] Recorded focus session:', params);
    },
    [user, isGuestMode, coinStore, xpStore, recordSessionOffline, addOperation]
  );

  return {
    addCoinsOffline,
    spendCoinsOffline,
    addXPOffline,
    recordSessionOffline,
    recordFocusSessionOffline,
    pendingCount: pendingOperations.length,
    isOnline,
  };
}
