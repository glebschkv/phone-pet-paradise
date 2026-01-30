import { useState, useEffect, useCallback } from 'react';
import { useXPSystem, XPReward } from '@/hooks/useXPSystem';
import { useCoinSystem } from '@/hooks/useCoinSystem';
import { useStreakSystem } from '@/hooks/useStreakSystem';
import { useNotifications } from '@/hooks/useNotifications';
import { useDailyLoginRewards, DailyReward } from '@/hooks/useDailyLoginRewards';
import { logger } from '@/lib/logger';

interface AppStateData {
  lastActiveTime: number;
  timeAwayMinutes: number;
  showRewardModal: boolean;
  currentReward: XPReward | null;
}

const STORAGE_KEY = 'petIsland_appState';

export const useAppStateTracking = () => {
  const xpSystem = useXPSystem();
  const coinSystem = useCoinSystem();
  const streakSystem = useStreakSystem();
  const notifications = useNotifications();
  const dailyLoginRewards = useDailyLoginRewards();
  
  const [appState, setAppState] = useState<AppStateData>({
    lastActiveTime: Date.now(),
    timeAwayMinutes: 0,
    showRewardModal: false,
    currentReward: null
  });

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Never restore modal state from storage - it's transient UI state
        // that should not persist across sessions (prevents stale black overlay)
        setAppState(prev => ({
          ...prev,
          ...parsed,
          showRewardModal: false,
          currentReward: null,
        }));
      } catch (error) {
        logger.error('Failed to parse saved app state:', error);
      }
    }
  }, []);

  // Save state to localStorage using functional updates
  const saveState = useCallback((newState: Partial<AppStateData>) => {
    setAppState(prev => {
      const updatedState = { ...prev, ...newState };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      return updatedState;
    });
  }, []);

  // Award XP based on focus session duration (includes daily login streak bonus)
  const awardSessionXP = useCallback((minutes: number): XPReward | null => {
    if (minutes >= 30) { // Minimum 30 minutes for XP
      const xpReward = xpSystem.awardXP(minutes);
      const streakReward = streakSystem.recordSession();

      // Add focus streak bonus (from useStreakSystem)
      if (xpReward && streakReward) {
        xpReward.xpGained += streakReward.xpBonus;
        xpReward.bonusXP += streakReward.xpBonus;
      }

      // Apply daily login streak bonus multiplier
      const loginStreakBonus = dailyLoginRewards.getStreakBonus();
      if (loginStreakBonus > 0 && xpReward) {
        const bonusFromLoginStreak = Math.round(xpReward.baseXP * loginStreakBonus);
        xpReward.xpGained += bonusFromLoginStreak;
        xpReward.bonusXP += bonusFromLoginStreak;
        if (bonusFromLoginStreak > 0) {
          xpReward.hasBonusXP = true;
        }
      }

      // Schedule notification reminders
      notifications.scheduleTimerReminder();

      return xpReward;
    }
    return null;
  }, [xpSystem, streakSystem, notifications, dailyLoginRewards]);

  // Handle app becoming active (foreground)
  const handleAppActive = useCallback(() => {
    const now = Date.now();
    const timeAway = now - appState.lastActiveTime;
    const minutesAway = Math.floor(timeAway / (1000 * 60));
    
    // Award XP for focus session (minimum 30 minutes)
    const reward = awardSessionXP(minutesAway);

    if (reward && reward.xpGained > 0) {
      saveState({
        timeAwayMinutes: minutesAway,
        showRewardModal: true,
        currentReward: reward,
        lastActiveTime: now
      });
    } else {
      saveState({ lastActiveTime: now });
    }
  }, [appState.lastActiveTime, awardSessionXP, saveState]);

  // Handle app going to background
  const handleAppInactive = useCallback(() => {
    saveState({ 
      lastActiveTime: Date.now(),
      showRewardModal: false,
      currentReward: null
    });
  }, [saveState]);

  // Simple web-only visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleAppInactive();
      } else {
        handleAppActive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleAppActive, handleAppInactive]);

  const dismissRewardModal = useCallback(() => {
    saveState({ 
      showRewardModal: false, 
      currentReward: null,
      timeAwayMinutes: 0 
    });
  }, [saveState]);

  const resetProgress = useCallback(() => {
    const resetState: AppStateData = {
      lastActiveTime: Date.now(),
      timeAwayMinutes: 0,
      showRewardModal: false,
      currentReward: null
    };
    setAppState(resetState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
    xpSystem.resetProgress();
  }, [xpSystem]);

  // Manual XP award function for focus timer
  const manualAwardXP = useCallback((minutes: number): XPReward | null => {
    const reward = awardSessionXP(minutes);
    if (reward && reward.xpGained > 0) {
      saveState({
        timeAwayMinutes: minutes,
        showRewardModal: true,
        currentReward: reward
      });
    }
    return reward;
  }, [awardSessionXP, saveState]);

  // Test function to award exactly one level up
  const testLevelUp = useCallback((): XPReward | null => {
    // Award 300 minutes (5 hours) which gives 210 XP - enough for most level ups
    // The XP system will handle the actual level calculation
    const reward = xpSystem.awardXP(300);
    if (reward) {
      saveState({
        timeAwayMinutes: 300,
        showRewardModal: true,
        currentReward: reward
      });
    }
    return reward;
  }, [xpSystem, saveState]);

  // Handle claiming daily login reward - returns both daily reward and XP reward for level-ups
  const handleClaimDailyReward = useCallback((): { dailyReward: DailyReward | null; xpReward: XPReward | null } => {
    const reward = dailyLoginRewards.claimReward();
    let xpReward: XPReward | null = null;

    if (reward) {
      // Award XP if present (all daily rewards have XP)
      if (reward.xp > 0) {
        // Use addDirectXP which properly handles level-ups
        xpReward = xpSystem.addDirectXP(reward.xp);

        // If leveled up, show the XP reward modal
        if (xpReward.leveledUp) {
          saveState({
            showRewardModal: true,
            currentReward: xpReward,
          });
        }
      }

      // Award coins if present (all daily rewards have coins)
      if (reward.coins > 0) {
        coinSystem.addCoins(reward.coins, 'daily_reward');
        logger.debug(`Daily login: awarded ${reward.coins} coins`);
      }

      // Award streak freeze for streak_freeze type
      if (reward.type === 'streak_freeze' && reward.streakFreeze) {
        streakSystem.earnStreakFreeze(reward.streakFreeze);
      }
    }
    return { dailyReward: reward, xpReward };
  }, [dailyLoginRewards, xpSystem, coinSystem, streakSystem, saveState]);

  return {
    // XP System data
    ...xpSystem,

    // Streak System data
    ...streakSystem,

    // Notifications
    notifications,

    // Daily Login Rewards
    dailyLoginRewards,
    handleClaimDailyReward,

    // App state data
    timeAwayMinutes: appState.timeAwayMinutes,
    showRewardModal: appState.showRewardModal,
    currentReward: appState.currentReward,

    // Actions
    dismissRewardModal,
    resetProgress,
    awardXP: manualAwardXP,
    testLevelUp,
  };
};