import { useState, useEffect, useCallback, useRef } from 'react';
import { timerLogger } from "@/lib/logger";
import {
  TimerState,
  TimerPreset,
  STORAGE_KEY,
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
        const parsed: TimerState = JSON.parse(savedState);
        let finalState = { ...parsed };

        // If timer was running when app closed, calculate remaining time
        if (parsed.isRunning && parsed.startTime) {
          const now = Date.now();
          const elapsedMs = now - parsed.startTime;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          const newTimeLeft = Math.max(0, parsed.sessionDuration - elapsedSeconds);

          finalState = {
            ...finalState,
            timeLeft: newTimeLeft,
            isRunning: newTimeLeft > 0,
            // Keep the original startTime so the countdown continues correctly
            startTime: newTimeLeft > 0 ? parsed.startTime : null
          };
        }

        setTimerState(finalState);

        // Set the corresponding preset
        const preset = TIMER_PRESETS.find(p => p.duration === finalState.sessionDuration / 60);
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
