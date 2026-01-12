import { useState, useEffect, useCallback, useRef } from 'react';
import { timerLogger } from "@/lib/logger";
import {
  validateTimerDuration,
  isNonNegativeInteger,
  TIMER_VALIDATION
} from "@/lib/validation";
import {
  TimerState as TimerStateType,
  TimerPreset,
  STORAGE_KEY,
  TIMER_PRESETS,
  DEFAULT_TIMER_STATE,
  MAX_COUNTUP_DURATION
} from '../constants';

// Re-export TimerState for other modules
export type TimerState = TimerStateType;

interface UseTimerPersistenceReturn {
  timerState: TimerState;
  selectedPreset: TimerPreset;
  setSelectedPreset: (preset: TimerPreset) => void;
  saveTimerState: (state: Partial<TimerState>) => void;
  clearPersistence: () => void;
}

export const useTimerPersistence = (): UseTimerPersistenceReturn => {
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT_TIMER_STATE);
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset>(TIMER_PRESETS[0]);
  const isInitialized = useRef(false);

  // Save timer state to localStorage
  const saveTimerState = useCallback((state: Partial<TimerState>) => {
    setTimerState(prev => {
      const newState = { ...prev, ...state };

      // Save complete state to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

      return newState;
    });
  }, []);

  const clearPersistence = useCallback(() => {
    // Clear the running timer data but keep other state
    setTimerState(prev => {
      const clearedState = {
        ...prev,
        isRunning: false,
        startTime: null
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedState));
      return clearedState;
    });
  }, []);

  // Load timer state from localStorage on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);

        // Validate all numeric fields from storage
        const sessionDuration = validateTimerDuration(parsed.sessionDuration) || DEFAULT_TIMER_STATE.sessionDuration;
        const timeLeft = validateTimerDuration(parsed.timeLeft);
        const startTime = isNonNegativeInteger(parsed.startTime) ? parsed.startTime : null;
        const completedSessions = isNonNegativeInteger(parsed.completedSessions) ? parsed.completedSessions : 0;

        // Validate session type
        const validSessionTypes = ['pomodoro', 'deep-work', 'break', 'countup'];
        const sessionType = validSessionTypes.includes(parsed.sessionType) ? parsed.sessionType : 'pomodoro';

        // Validate countup fields
        const isCountup = typeof parsed.isCountup === 'boolean' ? parsed.isCountup : false;
        const elapsedTime = isNonNegativeInteger(parsed.elapsedTime) ? parsed.elapsedTime : 0;

        let finalState: TimerState = {
          timeLeft: Math.min(timeLeft, sessionDuration),
          sessionDuration,
          sessionType,
          isRunning: typeof parsed.isRunning === 'boolean' ? parsed.isRunning : false,
          startTime,
          soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
          completedSessions,
          category: typeof parsed.category === 'string' ? parsed.category : undefined,
          taskLabel: typeof parsed.taskLabel === 'string' ? parsed.taskLabel : undefined,
          isCountup,
          elapsedTime,
        };

        // If timer was running when app closed, calculate remaining/elapsed time
        if (finalState.isRunning && finalState.startTime) {
          const now = Date.now();
          const elapsedMs = now - finalState.startTime;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);

          if (finalState.isCountup) {
            // For countup mode, calculate total elapsed time
            if (elapsedSeconds >= 0 && elapsedSeconds <= MAX_COUNTUP_DURATION) {
              const totalElapsed = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
              finalState = {
                ...finalState,
                elapsedTime: totalElapsed,
                isRunning: totalElapsed < MAX_COUNTUP_DURATION,
                startTime: totalElapsed < MAX_COUNTUP_DURATION ? finalState.startTime : null
              };
            } else {
              // Invalid elapsed time or exceeded max, reset running state
              finalState = {
                ...finalState,
                isRunning: false,
                startTime: null,
                elapsedTime: Math.min(elapsedSeconds, MAX_COUNTUP_DURATION)
              };
            }
          } else {
            // For countdown mode, calculate remaining time
            // Validate elapsed time is reasonable (not negative, not too large)
            if (elapsedSeconds >= 0 && elapsedSeconds <= TIMER_VALIDATION.MAX_DURATION_SECONDS) {
              const newTimeLeft = Math.max(0, finalState.sessionDuration - elapsedSeconds);

              finalState = {
                ...finalState,
                timeLeft: newTimeLeft,
                isRunning: newTimeLeft > 0,
                startTime: newTimeLeft > 0 ? finalState.startTime : null
              };
            } else {
              // Invalid elapsed time, reset running state
              finalState = {
                ...finalState,
                isRunning: false,
                startTime: null
              };
            }
          }
        }

        setTimerState(finalState);

        // Set the corresponding preset
        let preset: TimerPreset | undefined;
        if (finalState.isCountup) {
          preset = TIMER_PRESETS.find(p => p.isCountup);
        } else {
          preset = TIMER_PRESETS.find(p => p.duration === finalState.sessionDuration / 60 && !p.isCountup);
        }
        if (preset) {
          setSelectedPreset(preset);
        }
      } catch (error) {
        timerLogger.error('Failed to load timer state:', error);
      }
    }
  }, []);

  return {
    timerState,
    selectedPreset,
    setSelectedPreset,
    saveTimerState,
    clearPersistence
  };
};
