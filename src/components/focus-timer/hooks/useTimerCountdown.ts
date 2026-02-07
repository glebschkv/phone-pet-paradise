/**
 * useTimerCountdown Hook
 *
 * Handles timer countdown/countup interval, visibility handling, and display sync.
 * Extracted from useTimerLogic for better separation of concerns.
 *
 * On iOS, the WebView's JS execution is suspended when the app is backgrounded.
 * The setInterval may not survive this suspension. This hook handles foreground
 * resume by recalculating time from the absolute startTime and restarting the
 * interval. It listens to both `visibilitychange` (web standard) and Capacitor's
 * `appStateChange` (native iOS) for reliability.
 */

import { useEffect, useRef, useCallback } from "react";
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { timerLogger } from '@/lib/logger';
import { TimerState } from "./useTimerPersistence";
import { MAX_COUNTUP_DURATION } from "../constants";

interface UseTimerCountdownProps {
  timerState: TimerState;
  saveTimerState: (updates: Partial<TimerState>) => void;
  setDisplayTime: (time: number) => void;
  setElapsedTime: (time: number) => void;
  setShowLockScreen: (show: boolean) => void;
  handleComplete: () => Promise<void>;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

interface StateRef {
  timerState: TimerState;
}

export const useTimerCountdown = ({
  timerState,
  saveTimerState,
  setDisplayTime,
  setElapsedTime,
  setShowLockScreen,
  handleComplete,
  intervalRef,
}: UseTimerCountdownProps) => {
  // Store latest values in ref to avoid callback dependency bloat
  const stateRef = useRef<StateRef>({ timerState });

  useEffect(() => {
    stateRef.current = { timerState };
  });

  // Store latest callbacks in refs for the restart helper
  const handleCompleteRef = useRef(handleComplete);
  const saveTimerStateRef = useRef(saveTimerState);
  const setDisplayTimeRef = useRef(setDisplayTime);
  const setElapsedTimeRef = useRef(setElapsedTime);

  useEffect(() => {
    handleCompleteRef.current = handleComplete;
    saveTimerStateRef.current = saveTimerState;
    setDisplayTimeRef.current = setDisplayTime;
    setElapsedTimeRef.current = setElapsedTime;
  });

  /**
   * Restart the countdown interval using the latest state from the ref.
   * Called when the app returns to foreground to ensure ticks resume
   * even if iOS killed the previous setInterval.
   */
  const restartInterval = useCallback(() => {
    const state = stateRef.current.timerState;
    if (!state.isRunning || !state.startTime) return;

    // Clear any stale interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const tick = () => {
      const s = stateRef.current.timerState;
      if (!s.isRunning || !s.startTime) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      const now = Date.now();
      const elapsedMs = now - s.startTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      if (s.isCountup) {
        const newElapsedTime = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
        setElapsedTimeRef.current(newElapsedTime);

        if (elapsedSeconds % 5 === 0) {
          saveTimerStateRef.current({ elapsedTime: newElapsedTime });
        }

        if (newElapsedTime >= MAX_COUNTUP_DURATION) {
          handleCompleteRef.current().catch((err) => timerLogger.error('Timer completion failed:', err));
        }
      } else {
        const newTimeLeft = Math.max(0, s.sessionDuration - elapsedSeconds);
        setDisplayTimeRef.current(newTimeLeft);

        if (elapsedSeconds % 5 === 0) {
          saveTimerStateRef.current({ timeLeft: newTimeLeft });
        }

        if (newTimeLeft === 0) {
          handleCompleteRef.current().catch((err) => timerLogger.error('Timer completion failed:', err));
        }
      }
    };

    tick(); // Run immediately to update display
    intervalRef.current = setInterval(tick, 1000);
  }, [intervalRef]);

  // Sync displayTime/elapsedTime with timerState when not running
  useEffect(() => {
    if (!timerState.isRunning) {
      if (timerState.isCountup) {
        setElapsedTime(timerState.elapsedTime || 0);
      } else {
        setDisplayTime(timerState.timeLeft);
      }
    }
  }, [timerState.timeLeft, timerState.elapsedTime, timerState.isRunning, timerState.isCountup, setDisplayTime, setElapsedTime]);

  // Timer countdown/countup effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timerState.isRunning && timerState.startTime) {
      const tick = () => {
        const now = Date.now();
        const elapsedMs = now - timerState.startTime!;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        if (timerState.isCountup) {
          // Countup mode: track elapsed time up to max duration
          const newElapsedTime = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
          setElapsedTime(newElapsedTime);

          if (elapsedSeconds % 5 === 0) {
            saveTimerState({ elapsedTime: newElapsedTime });
          }

          // Complete when max duration is reached
          if (newElapsedTime >= MAX_COUNTUP_DURATION) {
            handleComplete().catch((err) => timerLogger.error('Timer completion failed:', err));
          }
        } else {
          // Countdown mode: track remaining time
          const newTimeLeft = Math.max(0, timerState.sessionDuration - elapsedSeconds);
          setDisplayTime(newTimeLeft);

          if (elapsedSeconds % 5 === 0) {
            saveTimerState({ timeLeft: newTimeLeft });
          }

          if (newTimeLeft === 0) {
            handleComplete().catch((err) => timerLogger.error('Timer completion failed:', err));
          }
        }
      };

      tick();
      intervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.startTime, timerState.sessionDuration, timerState.isCountup, saveTimerState, handleComplete, setDisplayTime, setElapsedTime, intervalRef]);

  // Page visibility + Capacitor appStateChange handling
  useEffect(() => {
    const handleForegroundResume = () => {
      const state = stateRef.current;

      if (!state.timerState.isRunning || !state.timerState.startTime) return;

      const now = Date.now();
      const elapsedMs = now - state.timerState.startTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      if (state.timerState.isCountup) {
        const newElapsedTime = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
        setElapsedTime(newElapsedTime);
        saveTimerState({ elapsedTime: newElapsedTime });
        setShowLockScreen(false);

        if (newElapsedTime >= MAX_COUNTUP_DURATION) {
          handleComplete().catch((err) => timerLogger.error('Timer completion failed:', err));
          return;
        }
      } else {
        const newTimeLeft = Math.max(0, state.timerState.sessionDuration - elapsedSeconds);
        setDisplayTime(newTimeLeft);
        saveTimerState({ timeLeft: newTimeLeft });
        setShowLockScreen(false);

        if (newTimeLeft === 0) {
          handleComplete().catch((err) => timerLogger.error('Timer completion failed:', err));
          return;
        }
      }

      // Restart the interval to ensure it's alive after iOS suspension
      restartInterval();

      // Safety net: React re-renders from saveTimerState above can cause the
      // countdown effect to re-run its cleanup, killing the interval we just
      // created. Verify the interval survived after renders settle.
      setTimeout(() => {
        const s = stateRef.current;
        if (s.timerState.isRunning && s.timerState.startTime && !intervalRef.current) {
          restartInterval();
        }
      }, 250);
    };

    const handleVisibilityChange = () => {
      const state = stateRef.current;

      if (document.hidden && state.timerState.isRunning && state.timerState.sessionType !== 'break') {
        setShowLockScreen(true);
      } else if (!document.hidden && state.timerState.isRunning && state.timerState.startTime) {
        handleForegroundResume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // On iOS, also listen to Capacitor's appStateChange for reliability
    let capHandle: { remove: () => Promise<void> } | null = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appStateChange', (appState) => {
        if (appState.isActive) {
          // Always dismiss lock screen when app becomes active
          setShowLockScreen(false);

          const state = stateRef.current;
          if (state.timerState.isRunning && state.timerState.startTime) {
            handleForegroundResume();
          }
        } else {
          const state = stateRef.current;
          if (state.timerState.isRunning && state.timerState.sessionType !== 'break') {
            setShowLockScreen(true);
          }
        }
      }).then((h) => {
        capHandle = h;
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      capHandle?.remove();
    };
  }, [saveTimerState, handleComplete, setDisplayTime, setElapsedTime, setShowLockScreen, restartInterval]);
};
