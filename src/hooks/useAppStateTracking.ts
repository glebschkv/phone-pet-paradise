import { useState, useEffect } from 'react';
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

  // Save state to localStorage
  const saveState = (newState: Partial<AppStateData>) => {
    const updatedState = { ...appState, ...newState };
    setAppState(updatedState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
  };

  // Calculate rewards based on time away
  const calculateRewards = (timeAwayMs: number): number => {
    const minutesAway = Math.floor(timeAwayMs / (1000 * 60));
    return Math.floor(minutesAway / MINUTES_PER_PET);
  };

  // Handle app becoming active (foreground)
  const handleAppActive = () => {
    const now = Date.now();
    const timeAway = now - appState.lastActiveTime;
    const minutesAway = Math.floor(timeAway / (1000 * 60));
    const newPets = calculateRewards(timeAway);

    if (newPets > 0 && minutesAway >= MINUTES_PER_PET) {
      saveState({
        totalPets: appState.totalPets + newPets,
        newPetsEarned: newPets,
        timeAwayMinutes: minutesAway,
        showRewardModal: true,
        lastActiveTime: now
      });
    } else {
      saveState({ lastActiveTime: now });
    }
  };

  // Handle app going to background
  const handleAppInactive = () => {
    saveState({ 
      lastActiveTime: Date.now(),
      showRewardModal: false 
    });
  };

  // Setup app state listeners
  useEffect(() => {
    let stateListener: any;

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
        
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    };

    setupListener();

    return () => {
      if (stateListener) {
        stateListener.remove();
      }
    };
  }, [appState.lastActiveTime, appState.totalPets]);

  const dismissRewardModal = () => {
    saveState({ 
      showRewardModal: false, 
      newPetsEarned: 0,
      timeAwayMinutes: 0 
    });
  };

  const resetProgress = () => {
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
  };

  // Native iOS tracking integration
  useEffect(() => {
    const setupNativeTracking = async () => {
      try {
        // Request permissions
        await NomoTracking.requestPermissions();
        
        // Get current streak and stats
        const { streak } = await NomoTracking.getCurrentStreak();
        const stats = await NomoTracking.getTodayStats();
        
        saveState({
          currentStreak: streak,
          todayStats: stats
        });

        // Listen for session completions
        await NomoTracking.addListener('sessionCompleted', (data) => {
          const petsEarned = Math.floor(data.points / 10); // Convert points to pets
          
          saveState({
            totalPets: appState.totalPets + petsEarned,
            newPetsEarned: petsEarned,
            timeAwayMinutes: Math.floor(data.duration / 60),
            showRewardModal: petsEarned > 0
          });
        });

      } catch (error) {
        console.log('Native tracking not available, using web fallback');
      }
    };

    setupNativeTracking();
  }, []);

  // Periodically update stats
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await NomoTracking.getTodayStats();
        const { streak } = await NomoTracking.getCurrentStreak();
        
        saveState({
          todayStats: stats,
          currentStreak: streak
        });
      } catch (error) {
        // Ignore errors, fallback to web tracking
      }
    };

    const interval = setInterval(updateStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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