import { useState, useEffect, useCallback } from 'react';
import { useXPSystem, XPReward } from '@/hooks/useXPSystem';
import { useStreakSystem } from '@/hooks/useStreakSystem';
import { useNotifications } from '@/hooks/useNotifications';

interface AppStateData {
  lastActiveTime: number;
  timeAwayMinutes: number;
  showRewardModal: boolean;
  currentReward: XPReward | null;
}

const STORAGE_KEY = 'petIsland_appState';

export const useAppStateTracking = () => {
  const xpSystem = useXPSystem();
  const streakSystem = useStreakSystem();
  const notifications = useNotifications();
  
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
        setAppState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved app state:', error);
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

  // Award XP based on focus session duration
  const awardSessionXP = useCallback((minutes: number): XPReward | null => {
    if (minutes >= 30) { // Minimum 30 minutes for XP
      const xpReward = xpSystem.awardXP(xpSystem.calculateXPFromDuration(minutes));
      const streakReward = streakSystem.recordSession();
      
      if (xpReward && streakReward) {
        xpReward.xpGained += streakReward.xpBonus;
      }

      // Schedule notification reminders
      notifications.scheduleTimerReminder();
      
      return xpReward;
    }
    return null;
  }, [xpSystem, streakSystem, notifications]);

  // Handle app becoming active (foreground)
  const handleAppActive = useCallback(() => {
    const now = Date.now();
    const timeAway = now - appState.lastActiveTime;
    const minutesAway = Math.floor(timeAway / (1000 * 60));
    
    // Award XP for focus session (minimum 30 minutes)
    const reward = awardSessionXP(minutesAway);

    if (reward) {
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
    if (reward) {
      saveState({
        timeAwayMinutes: minutes,
        showRewardModal: true,
        currentReward: reward
      });
    }
    return reward;
  }, [awardSessionXP, saveState]);

  return {
    // XP System data
    ...xpSystem,
    
    // Streak System data
    ...streakSystem,
    
    // Notifications
    notifications,
    
    // App state data
    timeAwayMinutes: appState.timeAwayMinutes,
    showRewardModal: appState.showRewardModal,
    currentReward: appState.currentReward,
    
    // Actions
    dismissRewardModal,
    resetProgress,
    awardXP: manualAwardXP,
  };
};