/**
 * useTimerCountdown Hook
 *
 * Handles timer countdown/countup interval, visibility handling, and display sync.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useEffect, useRef } from "react";
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
            handleComplete();
          }
        } else {
          // Countdown mode: track remaining time
          const newTimeLeft = Math.max(0, timerState.sessionDuration - elapsedSeconds);
          setDisplayTime(newTimeLeft);

          if (elapsedSeconds % 5 === 0) {
            saveTimerState({ timeLeft: newTimeLeft });
          }

          if (newTimeLeft === 0) {
            handleComplete();
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

        if (state.timerState.isCountup) {
          // Countup mode: update elapsed time
          const newElapsedTime = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
          setElapsedTime(newElapsedTime);
          saveTimerState({ elapsedTime: newElapsedTime });
          setShowLockScreen(false);

          if (newElapsedTime >= MAX_COUNTUP_DURATION) {
            handleComplete();
          }
        } else {
          // Countdown mode: update remaining time
          const newTimeLeft = Math.max(0, state.timerState.sessionDuration - elapsedSeconds);
          setDisplayTime(newTimeLeft);
          saveTimerState({ timeLeft: newTimeLeft });
          setShowLockScreen(false);

          if (newTimeLeft === 0) {
            handleComplete();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveTimerState, handleComplete, setDisplayTime, setElapsedTime, setShowLockScreen]);
};
