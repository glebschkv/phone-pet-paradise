import { useState, useEffect, useCallback, useRef } from 'react';
import { useDeviceActivity } from './useDeviceActivity';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface BackgroundTaskState {
  isActive: boolean;
  sessionStartTime: number;
  totalBackgroundTime: number;
  lastBackgroundEntry: number;
  rewardsPending: number;
}

export const useBackgroundProcessing = () => {
  const [state, setState] = useState<BackgroundTaskState>({
    isActive: false,
    sessionStartTime: Date.now(),
    totalBackgroundTime: 0,
    lastBackgroundEntry: 0,
    rewardsPending: 0,
  });

  const { triggerHaptic, recordActiveTime } = useDeviceActivity();
  const { toast } = useToast();

  // Track timeouts to clean up on unmount
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start background session tracking
  const startBackgroundSession = useCallback(() => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      isActive: true,
      sessionStartTime: now,
      lastBackgroundEntry: now,
    }));
    
    // Record that app became inactive
    recordActiveTime();
    
    logger.debug('Background session started at:', new Date(now).toISOString());
  }, [recordActiveTime]);

  // End background session and calculate rewards
  const endBackgroundSession = useCallback(() => {
    setState(prev => {
      if (!prev.isActive) return prev;
      
      const now = Date.now();
      const sessionDuration = now - prev.lastBackgroundEntry;
      const sessionMinutes = sessionDuration / (1000 * 60);
      
      // Calculate rewards based on time away
      let newRewards = 0;
      if (sessionMinutes >= 1) {
        newRewards = Math.floor(sessionMinutes / 5); // 1 reward per 5 minutes
      }
      
      logger.debug(`Background session ended. Duration: ${sessionMinutes.toFixed(1)} minutes, Rewards: ${newRewards}`);
      
      // Trigger haptic feedback for rewards
      if (newRewards > 0) {
        triggerHaptic('success');

        // Clear any existing timeout before setting a new one
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }

        // Show reward notification
        toastTimeoutRef.current = setTimeout(() => {
          toast({
            title: "🎉 Welcome Back!",
            description: `You earned ${newRewards} reward${newRewards > 1 ? 's' : ''} for staying focused!`,
          });
          toastTimeoutRef.current = null;
        }, 1000);
      }
      
      return {
        ...prev,
        isActive: false,
        totalBackgroundTime: prev.totalBackgroundTime + sessionDuration,
        rewardsPending: prev.rewardsPending + newRewards,
      };
    });
    
    // Record that app became active
    recordActiveTime();
  }, [triggerHaptic, toast, recordActiveTime]);

  // Process pending rewards
  const processPendingRewards = useCallback(() => {
    const rewards = state.rewardsPending;
    if (rewards > 0) {
      setState(prev => ({ ...prev, rewardsPending: 0 }));
      return rewards;
    }
    return 0;
  }, [state.rewardsPending]);

  // Get session statistics
  const getSessionStats = useCallback(() => {
    const totalMinutes = state.totalBackgroundTime / (1000 * 60);
    const currentSessionMinutes = state.isActive 
      ? (Date.now() - state.lastBackgroundEntry) / (1000 * 60)
      : 0;
    
    return {
      totalMinutes: Math.round(totalMinutes),
      currentSessionMinutes: Math.round(currentSessionMinutes),
      isActive: state.isActive,
      rewardsPending: state.rewardsPending,
    };
  }, [state]);

  // Reset session data
  const resetSession = useCallback(() => {
    setState({
      isActive: false,
      sessionStartTime: Date.now(),
      totalBackgroundTime: 0,
      lastBackgroundEntry: 0,
      rewardsPending: 0,
    });
  }, []);

  // Setup app lifecycle listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        startBackgroundSession();
      } else {
        endBackgroundSession();
      }
    };

    const handleAppPause = () => {
      startBackgroundSession();
    };

    const handleAppResume = () => {
      endBackgroundSession();
    };

    const handleBeforeUnload = () => {
      if (state.isActive) {
        // Save session data before app closes
        localStorage.setItem('background-session', JSON.stringify({
          ...state,
          lastBackgroundEntry: Date.now()
        }));
      }
    };

    // Web browser events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Capacitor events (mobile)
    window.addEventListener('pause', handleAppPause);
    window.addEventListener('resume', handleAppResume);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pause', handleAppPause);
      window.removeEventListener('resume', handleAppResume);
      // Clear any pending toast timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [startBackgroundSession, endBackgroundSession, state]);

  // Load saved session data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('background-session');
      if (saved) {
        const sessionData = JSON.parse(saved);
        
        // If there was an active session, calculate elapsed time
        if (sessionData.isActive) {
          const elapsed = Date.now() - sessionData.lastBackgroundEntry;
          const minutes = elapsed / (1000 * 60);
          const rewards = Math.floor(minutes / 5);
          
          setState(prev => ({
            ...prev,
            totalBackgroundTime: sessionData.totalBackgroundTime + elapsed,
            rewardsPending: sessionData.rewardsPending + rewards,
          }));
          
          if (rewards > 0) {
            toast({
              title: "🎉 Rewards Recovered!",
              description: `You earned ${rewards} reward${rewards > 1 ? 's' : ''} while away!`,
            });
          }
        }
        
        // Clear saved session
        localStorage.removeItem('background-session');
      }
    } catch (error) {
      logger.error('Failed to load background session:', error);
    }
  }, [toast]);

  return {
    ...state,
    processPendingRewards,
    getSessionStats,
    resetSession,
    startBackgroundSession,
    endBackgroundSession,
  };
};