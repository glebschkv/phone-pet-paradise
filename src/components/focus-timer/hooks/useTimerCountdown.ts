/**
 * useTimerCountdown Hook
 *
 * Handles timer countdown interval, visibility handling, and display sync.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useEffect, useRef } from "react";
import { TimerState } from "./useTimerPersistence";

interface UseTimerCountdownProps {
  timerState: TimerState;
  saveTimerState: (updates: Partial<TimerState>) => void;
  setDisplayTime: (time: number) => void;
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
  setShowLockScreen,
  handleComplete,
  intervalRef,
}: UseTimerCountdownProps) => {
  // Store latest values in ref to avoid callback dependency bloat
  const stateRef = useRef<StateRef>({ timerState });

  useEffect(() => {
    stateRef.current = { timerState };
  });

  // Sync displayTime with timerState when not running
  useEffect(() => {
    if (!timerState.isRunning) {
      setDisplayTime(timerState.timeLeft);
    }
  }, [timerState.timeLeft, timerState.isRunning, setDisplayTime]);

  // Timer countdown effect
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
        const newTimeLeft = Math.max(0, timerState.sessionDuration - elapsedSeconds);

        setDisplayTime(newTimeLeft);

        if (elapsedSeconds % 5 === 0) {
          saveTimerState({ timeLeft: newTimeLeft });
        }

        if (newTimeLeft === 0) {
          handleComplete();
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
  }, [timerState.isRunning, timerState.startTime, timerState.sessionDuration, saveTimerState, handleComplete, setDisplayTime, intervalRef]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = stateRef.current;

      if (document.hidden && state.timerState.isRunning && state.timerState.sessionType !== 'break') {
        setShowLockScreen(true);
      } else if (!document.hidden && state.timerState.isRunning && state.timerState.startTime) {
        const now = Date.now();
        const elapsedMs = now - state.timerState.startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const newTimeLeft = Math.max(0, state.timerState.sessionDuration - elapsedSeconds);

        setDisplayTime(newTimeLeft);
        saveTimerState({ timeLeft: newTimeLeft });
        setShowLockScreen(false);

        if (newTimeLeft === 0) {
          handleComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveTimerState, handleComplete, setDisplayTime, setShowLockScreen]);
};
