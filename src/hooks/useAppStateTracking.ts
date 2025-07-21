import { useState, useEffect, useCallback, useRef } from 'react';
import { App, AppState } from '@capacitor/app';
import { NomoTracking } from '@/plugins/nomo-tracking';
import { useXPSystem, XPReward } from '@/hooks/useXPSystem';

interface AppStateData {
  lastActiveTime: number;
  timeAwayMinutes: number;
  showRewardModal: boolean;
  currentStreak: number;
  currentReward: XPReward | null;
  todayStats: {
    totalTime: number;
    sessionCount: number;
    longestSession: number;
  };
}

const STORAGE_KEY = 'petIsland_appState';

export const useAppStateTracking = () => {
  const xpSystem = useXPSystem();
  
  const [appState, setAppState] = useState<AppStateData>({
    lastActiveTime: Date.now(),
    timeAwayMinutes: 0,
    showRewardModal: false,
    currentStreak: 0,
    currentReward: null,
    todayStats: {
      totalTime: 0,
      sessionCount: 0,
      longestSession: 0
    }
  });

  // Use refs to track values without causing re-renders
  const appStateRef = useRef(appState);
  appStateRef.current = appState;

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
      return xpSystem.awardXP(minutes);
    }
    return null;
  }, [xpSystem]);

  // Handle app becoming active (foreground)
  const handleAppActive = useCallback(() => {
    const currentState = appStateRef.current;
    const now = Date.now();
    const timeAway = now - currentState.lastActiveTime;
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
  }, [awardSessionXP, saveState]);

  // Handle app going to background
  const handleAppInactive = useCallback(() => {
    saveState({ 
      lastActiveTime: Date.now(),
      showRewardModal: false,
      currentReward: null
    });
  }, [saveState]);

  // Setup app state listeners
  useEffect(() => {
    let stateListener: any;
    let visibilityCleanup: (() => void) | undefined;

    const setupListener = async () => {
      try {
        stateListener = await App.addListener('appStateChange', (state: AppState) => {
          if (state.isActive) {
            handleAppActive();
          } else {
            handleAppInactive();
          }
        });
      } catch (error) {
        console.log('Capacitor App plugin not available, using web fallback');
        
        // Web fallback using Page Visibility API
        const handleVisibilityChange = () => {
          if (document.hidden) {
            handleAppInactive();
          } else {
            handleAppActive();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        visibilityCleanup = () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    };

    setupListener();

    return () => {
      if (stateListener) {
        stateListener.remove();
      }
      if (visibilityCleanup) {
        visibilityCleanup();
      }
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
      currentStreak: 0,
      currentReward: null,
      todayStats: {
        totalTime: 0,
        sessionCount: 0,
        longestSession: 0
      }
    };
    setAppState(resetState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
    xpSystem.resetProgress();
  }, [xpSystem]);

  // Native iOS tracking integration
  useEffect(() => {
    let sessionListener: { remove: () => void } | undefined;

    const setupNativeTracking = async () => {
      try {
        // Request permissions
        const { granted } = await NomoTracking.requestPermissions();
        if (!granted) {
          console.log('Permissions not granted, using web fallback');
          return;
        }
        
        // Get current streak and stats
        const [streakResult, statsResult] = await Promise.all([
          NomoTracking.getCurrentStreak(),
          NomoTracking.getTodayStats()
        ]);
        
        saveState({
          currentStreak: streakResult.streak,
          todayStats: statsResult
        });

        // Listen for session completions
        sessionListener = await NomoTracking.addListener('sessionCompleted', (data) => {
          const sessionMinutes = Math.floor(data.duration / 60);
          const reward = awardSessionXP(sessionMinutes);
          
          if (reward) {
            saveState({
              timeAwayMinutes: sessionMinutes,
              showRewardModal: true,
              currentReward: reward
            });
          }
        });

      } catch (error) {
        console.log('Native tracking not available, using web fallback');
      }
    };

    setupNativeTracking();

    return () => {
      if (sessionListener) {
        sessionListener.remove();
      }
    };
  }, [saveState, awardSessionXP]);

  // Periodically update stats
  useEffect(() => {
    const updateStats = async () => {
      try {
        const [statsResult, streakResult] = await Promise.all([
          NomoTracking.getTodayStats(),
          NomoTracking.getCurrentStreak()
        ]);
        
        saveState({
          todayStats: statsResult,
          currentStreak: streakResult.streak
        });
      } catch (error) {
        // Ignore errors, fallback to web tracking
        console.log('Failed to update native stats:', error);
      }
    };

    const interval = setInterval(updateStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [saveState]);

  return {
    // XP System data
    ...xpSystem,
    
    // App state data
    timeAwayMinutes: appState.timeAwayMinutes,
    showRewardModal: appState.showRewardModal,
    currentReward: appState.currentReward,
    currentStreak: appState.currentStreak,
    todayStats: appState.todayStats,
    
    // Actions
    dismissRewardModal,
    resetProgress,
  };
};