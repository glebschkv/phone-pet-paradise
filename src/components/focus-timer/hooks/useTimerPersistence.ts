import { useState, useEffect, useCallback } from 'react';
import {
  TimerState,
  TimerPersistence,
  TimerPreset,
  STORAGE_KEY,
  TIMER_PERSISTENCE_KEY,
  TIMER_PRESETS,
  DEFAULT_TIMER_STATE
} from '../constants';

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

  // Save timer state to localStorage with persistence
  const saveTimerState = useCallback((state: Partial<TimerState>) => {
    setTimerState(prev => {
      const newState = { ...prev, ...state };

      // Save basic timer state
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...newState,
        isRunning: false,
        startTime: null
      }));

      // Save persistence data separately for running timers
      const persistenceData: TimerPersistence = {
        wasRunning: newState.isRunning,
        pausedAt: newState.isRunning ? null : Date.now(),
        originalStartTime: newState.startTime,
        timeLeftWhenPaused: newState.timeLeft,
        sessionDuration: newState.sessionDuration,
        sessionType: newState.sessionType
      };

      localStorage.setItem(TIMER_PERSISTENCE_KEY, JSON.stringify(persistenceData));

      return newState;
    });
  }, []);

  const clearPersistence = useCallback(() => {
    localStorage.removeItem(TIMER_PERSISTENCE_KEY);
  }, []);

  // Load timer state from localStorage with persistence restoration
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const savedPersistence = localStorage.getItem(TIMER_PERSISTENCE_KEY);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        let finalState: TimerState = {
          ...parsed,
          isRunning: false,
          startTime: null
        };

        // Check if we need to restore a running timer
        if (savedPersistence) {
          const persistence: TimerPersistence = JSON.parse(savedPersistence);

          if (persistence.wasRunning && persistence.originalStartTime) {
            // Calculate how much time has actually elapsed
            const totalElapsed = Date.now() - persistence.originalStartTime;
            const elapsedSeconds = Math.floor(totalElapsed / 1000);
            const newTimeLeft = Math.max(0, persistence.sessionDuration - elapsedSeconds);

            finalState = {
              ...finalState,
              timeLeft: newTimeLeft,
              sessionDuration: persistence.sessionDuration,
              sessionType: persistence.sessionType,
              isRunning: newTimeLeft > 0,
              startTime: persistence.originalStartTime
            };
          } else if (persistence.pausedAt) {
            // Timer was paused, restore paused state
            finalState = {
              ...finalState,
              timeLeft: persistence.timeLeftWhenPaused,
              sessionDuration: persistence.sessionDuration,
              sessionType: persistence.sessionType
            };
          }
        }

        setTimerState(finalState);

        // Set the corresponding preset
        const preset = TIMER_PRESETS.find(p => p.duration === finalState.sessionDuration / 60);
        if (preset) {
          setSelectedPreset(preset);
        }
      } catch (error) {
        console.error('Failed to load timer state:', error);
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
