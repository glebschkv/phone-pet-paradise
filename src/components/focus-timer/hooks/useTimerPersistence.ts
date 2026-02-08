import { useState, useCallback } from 'react';
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

/**
 * Load timer state from localStorage synchronously.
 * This runs inside the useState initializer so the very first render
 * already has the correct persisted state — no flash of default values
 * when iOS reloads the WebView after a background kill.
 */
function loadPersistedTimerState(): TimerState {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return DEFAULT_TIMER_STATE;

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

      if (elapsedSeconds < 0) {
        // Clock went backwards (timezone change, etc.) — reset timer
        finalState = {
          ...finalState,
          isRunning: false,
          startTime: null,
        };
      } else if (finalState.isCountup) {
        // For countup mode, calculate total elapsed time.
        // Keep isRunning=true even when max is reached so the
        // countdown tick effect can call handleComplete() and
        // properly award XP / show the session-complete modal.
        const totalElapsed = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
        finalState = {
          ...finalState,
          elapsedTime: totalElapsed,
        };
      } else {
        // For countdown mode, calculate remaining time.
        // Keep isRunning=true even when timeLeft hits 0 so the
        // countdown tick effect can call handleComplete() and
        // properly award XP / show the session-complete modal.
        if (elapsedSeconds <= TIMER_VALIDATION.MAX_DURATION_SECONDS) {
          const newTimeLeft = Math.max(0, finalState.sessionDuration - elapsedSeconds);
          finalState = {
            ...finalState,
            timeLeft: newTimeLeft,
          };
        } else {
          // Elapsed time unreasonably large (> 8 hours) — treat as
          // expired session. Still keep running so completion fires.
          finalState = {
            ...finalState,
            timeLeft: 0,
          };
        }
      }
    }

    return finalState;
  } catch (error) {
    timerLogger.error('Failed to load timer state:', error);
    return DEFAULT_TIMER_STATE;
  }
}

function findPresetForState(state: TimerState): TimerPreset {
  if (state.isCountup) {
    return TIMER_PRESETS.find(p => p.isCountup) || TIMER_PRESETS[0];
  }
  return TIMER_PRESETS.find(p => p.duration === state.sessionDuration / 60 && !p.isCountup) || TIMER_PRESETS[0];
}

interface UseTimerPersistenceReturn {
  timerState: TimerState;
  selectedPreset: TimerPreset;
  setSelectedPreset: (preset: TimerPreset) => void;
  saveTimerState: (state: Partial<TimerState>) => void;
  clearPersistence: () => void;
}

export const useTimerPersistence = (): UseTimerPersistenceReturn => {
  // Load from localStorage synchronously so the first render already
  // has the correct state — no flash of "25:00 / Start Timer".
  const [timerState, setTimerState] = useState<TimerState>(loadPersistedTimerState);
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset>(
    () => findPresetForState(timerState)
  );

  // Save timer state to localStorage
  const saveTimerState = useCallback((state: Partial<TimerState>) => {
    setTimerState(prev => {
      const newState = { ...prev, ...state };

      // Save complete state to localStorage (guarded for storage quota)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch {
        // Storage full — state still updated in-memory
      }

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
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedState));
      } catch {
        // Storage full — state still updated in-memory
      }
      return clearedState;
    });
  }, []);

  return {
    timerState,
    selectedPreset,
    setSelectedPreset,
    saveTimerState,
    clearPersistence
  };
};
