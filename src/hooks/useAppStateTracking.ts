import { useState, useEffect, useCallback, useRef } from 'react';
import { App, AppState } from '@capacitor/app';
import { NomoTracking } from '@/plugins/nomo-tracking';

interface AppStateData {
  totalPets: number;
  lastActiveTime: number;
  timeAwayMinutes: number;
  newPetsEarned: number;
  showRewardModal: boolean;
  currentStreak: number;
  todayStats: {
    totalTime: number;
    sessionCount: number;
    longestSession: number;
  };
}

const STORAGE_KEY = 'petIsland_appState';
const MINUTES_PER_PET = 30; // Earn 1 pet every 30 minutes away

export const useAppStateTracking = () => {
  const [appState, setAppState] = useState<AppStateData>({
    totalPets: 0,
    lastActiveTime: Date.now(),
    timeAwayMinutes: 0,
    newPetsEarned: 0,
    showRewardModal: false,
    currentStreak: 0,
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

  // Calculate rewards based on time away
  const calculateRewards = useCallback((timeAwayMs: number): number => {
    const minutesAway = Math.floor(timeAwayMs / (1000 * 60));
    return Math.floor(minutesAway / MINUTES_PER_PET);
  }, []);

  // Handle app becoming active (foreground)
  const handleAppActive = useCallback(() => {
    const currentState = appStateRef.current;
    const now = Date.now();
    const timeAway = now - currentState.lastActiveTime;
    const minutesAway = Math.floor(timeAway / (1000 * 60));
    const newPets = calculateRewards(timeAway);

    if (newPets > 0 && minutesAway >= MINUTES_PER_PET) {
      saveState({
        totalPets: currentState.totalPets + newPets,
        newPetsEarned: newPets,
        timeAwayMinutes: minutesAway,
        showRewardModal: true,
        lastActiveTime: now
      });
    } else {
      saveState({ lastActiveTime: now });
    }
  }, [calculateRewards, saveState]);

  // Handle app going to background
  const handleAppInactive = useCallback(() => {
    saveState({ 
      lastActiveTime: Date.now(),
      showRewardModal: false 
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
      newPetsEarned: 0,
      timeAwayMinutes: 0 
    });
  }, [saveState]);

  const resetProgress = useCallback(() => {
    const resetState: AppStateData = {
      totalPets: 0,
      lastActiveTime: Date.now(),
      timeAwayMinutes: 0,
      newPetsEarned: 0,
      showRewardModal: false,
      currentStreak: 0,
      todayStats: {
        totalTime: 0,
        sessionCount: 0,
        longestSession: 0
      }
    };
    setAppState(resetState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
  }, []);

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
          const petsEarned = Math.floor(data.points / 10); // Convert points to pets
          
          if (petsEarned > 0) {
            const currentState = appStateRef.current;
            saveState({
              totalPets: currentState.totalPets + petsEarned,
              newPetsEarned: petsEarned,
              timeAwayMinutes: Math.floor(data.duration / 60),
              showRewardModal: true
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
  }, [saveState]);

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
    totalPets: appState.totalPets,
    timeAwayMinutes: appState.timeAwayMinutes,
    newPetsEarned: appState.newPetsEarned,
    showRewardModal: appState.showRewardModal,
    currentStreak: appState.currentStreak,
    todayStats: appState.todayStats,
    dismissRewardModal,
    resetProgress,
    minutesPerPet: MINUTES_PER_PET
  };
};