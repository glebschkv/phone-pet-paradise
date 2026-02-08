import { useState, useCallback, useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
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

/** Key used for native UserDefaults backup via @capacitor/preferences */
const NATIVE_BACKUP_KEY = 'timer_state_backup';

/**
 * Parse and validate a raw JSON string into a TimerState.
 * Shared between localStorage (sync) and Preferences (async) loading paths.
 * If the timer was running, recalculates timeLeft/elapsedTime from startTime.
 */
function parseTimerStateJSON(raw: string): TimerState | null {
  try {
    const parsed = JSON.parse(raw);

    const sessionDuration = validateTimerDuration(parsed.sessionDuration) || DEFAULT_TIMER_STATE.sessionDuration;
    const timeLeft = validateTimerDuration(parsed.timeLeft);
    const startTime = isNonNegativeInteger(parsed.startTime) ? parsed.startTime : null;
    const completedSessions = isNonNegativeInteger(parsed.completedSessions) ? parsed.completedSessions : 0;

    const validSessionTypes = ['pomodoro', 'deep-work', 'break', 'countup'];
    const sessionType = validSessionTypes.includes(parsed.sessionType) ? parsed.sessionType : 'pomodoro';

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
        finalState = { ...finalState, isRunning: false, startTime: null };
      } else if (finalState.isCountup) {
        const totalElapsed = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
        finalState = { ...finalState, elapsedTime: totalElapsed };
      } else {
        if (elapsedSeconds <= TIMER_VALIDATION.MAX_DURATION_SECONDS) {
          const newTimeLeft = Math.max(0, finalState.sessionDuration - elapsedSeconds);
          finalState = { ...finalState, timeLeft: newTimeLeft };
        } else {
          finalState = { ...finalState, timeLeft: 0 };
        }
      }
    }

    return finalState;
  } catch {
    return null;
  }
}

/**
 * Load timer state from localStorage synchronously.
 * This runs inside the useState initializer so the very first render
 * already has the correct persisted state — no flash of default values
 * when iOS reloads the WebView after a background kill.
 */
function loadPersistedTimerState(): TimerState {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) {
      timerLogger.debug('[Persistence] localStorage empty — using default state');
      return DEFAULT_TIMER_STATE;
    }

    const state = parseTimerStateJSON(savedState);
    if (state) {
      timerLogger.debug('[Persistence] Loaded from localStorage:', {
        isRunning: state.isRunning,
        timeLeft: state.timeLeft,
        startTime: state.startTime ? 'set' : 'null',
      });
      return state;
    }

    timerLogger.warn('[Persistence] localStorage data invalid — using default');
    return DEFAULT_TIMER_STATE;
  } catch (error) {
    timerLogger.error('[Persistence] Failed to load from localStorage:', error);
    return DEFAULT_TIMER_STATE;
  }
}

function findPresetForState(state: TimerState): TimerPreset {
  if (state.isCountup) {
    return TIMER_PRESETS.find(p => p.isCountup) || TIMER_PRESETS[0];
  }
  return TIMER_PRESETS.find(p => p.duration === state.sessionDuration / 60 && !p.isCountup) || TIMER_PRESETS[0];
}

/** Save to native UserDefaults as a backup (fire-and-forget). */
function saveToNativeBackup(state: TimerState): void {
  Preferences.set({
    key: NATIVE_BACKUP_KEY,
    value: JSON.stringify(state),
  }).catch(() => {
    // Silent fail — this is a backup, localStorage is the primary store
  });
}

/** Clear the native backup (fire-and-forget). */
function clearNativeBackup(): void {
  Preferences.remove({ key: NATIVE_BACKUP_KEY }).catch(() => {});
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

  // Track whether native recovery has already been attempted
  const nativeRecoveryAttemptedRef = useRef(false);

  // Async recovery: if localStorage was empty/cleared by iOS, try native backup.
  // This covers the case where iOS kills the app and clears WKWebView localStorage.
  useEffect(() => {
    if (nativeRecoveryAttemptedRef.current) return;
    nativeRecoveryAttemptedRef.current = true;

    // Only try recovery if localStorage gave us a non-running default state
    // (meaning it was likely cleared). If it loaded a running timer, we're fine.
    const localStorageHadData = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY) !== null;
      } catch {
        return false;
      }
    })();

    if (localStorageHadData) {
      timerLogger.debug('[Persistence] localStorage has data — skipping native recovery');
      return;
    }

    timerLogger.debug('[Persistence] localStorage empty — attempting native backup recovery');

    Preferences.get({ key: NATIVE_BACKUP_KEY }).then(({ value }) => {
      if (!value) {
        timerLogger.debug('[Persistence] No native backup found');
        return;
      }

      const nativeState = parseTimerStateJSON(value);
      if (!nativeState) {
        timerLogger.warn('[Persistence] Native backup data invalid');
        return;
      }

      // Only restore if the native backup had a running timer
      // (otherwise the default state is fine)
      if (nativeState.isRunning && nativeState.startTime) {
        timerLogger.info('[Persistence] Recovered running timer from native backup!', {
          timeLeft: nativeState.timeLeft,
          startTime: nativeState.startTime,
        });

        // Restore to both React state and localStorage
        setTimerState(nativeState);
        setSelectedPreset(findPresetForState(nativeState));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nativeState));
        } catch {
          // Storage full — state still updated in-memory
        }
      } else {
        timerLogger.debug('[Persistence] Native backup exists but timer not running — no recovery needed');
      }
    }).catch(err => {
      timerLogger.warn('[Persistence] Native backup read failed:', err);
    });
  }, []);

  // Save timer state to both localStorage AND native backup
  const saveTimerState = useCallback((state: Partial<TimerState>) => {
    setTimerState(prev => {
      const newState = { ...prev, ...state };

      // Primary: localStorage (synchronous, fast)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch {
        // Storage full — state still updated in-memory
      }

      // Backup: native UserDefaults (async, survives iOS app termination)
      saveToNativeBackup(newState);

      return newState;
    });
  }, []);

  const clearPersistence = useCallback(() => {
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

      // Also clear the native backup so we don't restore a stale timer
      clearNativeBackup();

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
