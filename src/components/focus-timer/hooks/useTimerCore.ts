/**
 * useTimerCore Hook
 *
 * Core timer countdown logic with visibility handling.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TIMER_DURATIONS } from '@/lib/constants';

interface TimerCoreState {
  displayTime: number;
  isRunning: boolean;
  startTime: number | null;
  sessionDuration: number;
}

interface UseTimerCoreOptions {
  initialState: TimerCoreState;
  onComplete: () => void;
  onTick?: (timeLeft: number) => void;
  saveInterval?: number;
}

export function useTimerCore({
  initialState,
  onComplete,
  onTick,
  saveInterval = TIMER_DURATIONS.STATE_SAVE_INTERVAL_SECONDS,
}: UseTimerCoreOptions) {
  const [displayTime, setDisplayTime] = useState(initialState.displayTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletingRef = useRef(false);

  // Store callbacks in refs to avoid dependency issues
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  });

  /**
   * Calculate time remaining based on start time
   */
  const calculateTimeRemaining = useCallback((
    startTime: number,
    sessionDuration: number
  ): number => {
    const now = Date.now();
    const elapsedMs = now - startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    return Math.max(0, sessionDuration - elapsedSeconds);
  }, []);

  /**
   * Start the countdown
   */
  const startCountdown = useCallback((
    startTime: number,
    sessionDuration: number
  ) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const tick = () => {
      const newTimeLeft = calculateTimeRemaining(startTime, sessionDuration);
      setDisplayTime(newTimeLeft);

      // Notify on tick for saving state
      const elapsedSeconds = sessionDuration - newTimeLeft;
      if (elapsedSeconds % saveInterval === 0) {
        onTickRef.current?.(newTimeLeft);
      }

      // Timer completed
      if (newTimeLeft === 0 && !isCompletingRef.current) {
        isCompletingRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current();
        isCompletingRef.current = false;
      }
    };

    // Run immediately
    tick();

    // Set up interval
    intervalRef.current = setInterval(tick, TIMER_DURATIONS.TICK_INTERVAL_MS);
  }, [calculateTimeRemaining, saveInterval]);

  /**
   * Stop the countdown
   */
  const stopCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Reset display time
   */
  const resetDisplayTime = useCallback((newTime: number) => {
    setDisplayTime(newTime);
  }, []);

  /**
   * Sync with external state when not running
   */
  const syncDisplayTime = useCallback((externalTime: number, isRunning: boolean) => {
    if (!isRunning) {
      setDisplayTime(externalTime);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    displayTime,
    startCountdown,
    stopCountdown,
    resetDisplayTime,
    syncDisplayTime,
    calculateTimeRemaining,
  };
}

/**
 * Hook for handling page visibility changes
 */
export function useTimerVisibility(options: {
  isRunning: boolean;
  startTime: number | null;
  sessionDuration: number;
  sessionType: string;
  onRecalculate: (timeLeft: number) => void;
  onComplete: () => void;
  onShowLockScreen?: () => void;
  onHideLockScreen?: () => void;
}) {
  const {
    isRunning,
    startTime,
    sessionDuration,
    sessionType,
    onRecalculate,
    onComplete,
    onShowLockScreen,
    onHideLockScreen,
  } = options;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && sessionType !== 'break') {
        // App going to background during work session
        onShowLockScreen?.();
      } else if (!document.hidden && isRunning && startTime) {
        // App coming to foreground - recalculate time
        const now = Date.now();
        const elapsedMs = now - startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const newTimeLeft = Math.max(0, sessionDuration - elapsedSeconds);

        onRecalculate(newTimeLeft);
        onHideLockScreen?.();

        if (newTimeLeft === 0) {
          onComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [
    isRunning,
    startTime,
    sessionDuration,
    sessionType,
    onRecalculate,
    onComplete,
    onShowLockScreen,
    onHideLockScreen,
  ]);
}

// Re-export formatTimeExtended as formatTime for backwards compatibility
export { formatTimeExtended as formatTime } from '@/lib/utils';

/**
 * Calculate progress percentage
 */
export function calculateProgress(timeLeft: number, totalDuration: number): number {
  if (totalDuration === 0) return 0;
  return ((totalDuration - timeLeft) / totalDuration) * 100;
}
