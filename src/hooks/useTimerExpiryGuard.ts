/**
 * useTimerExpiryGuard Hook
 *
 * Top-level guard that runs on app startup and foreground resume.
 * Checks if a timer session has expired while the timer component
 * was not mounted (e.g. iOS killed the WebView, or user was on a
 * different tab). If expired, stops app blocking so the user isn't
 * permanently locked out of their apps.
 */

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { DeviceActivity } from '@/plugins/device-activity';
import { TIMER_VALIDATION } from '@/lib/validation';
import { MAX_COUNTUP_DURATION } from '@/components/focus-timer/constants';

const STORAGE_KEY = 'petIsland_unifiedTimer';
const BLOCKING_ACTIVE_KEY = 'petIsland_blockingActive';

interface PersistedTimerState {
  isRunning: boolean;
  startTime: number | null;
  sessionDuration: number;
  sessionType?: string;
  isCountup?: boolean;
  elapsedTime?: number;
  timeLeft?: number;
}

/** Try to stop app blocking with retries for reliability */
async function stopBlockingWithRetry(): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await DeviceActivity.stopAppBlocking();
      localStorage.removeItem(BLOCKING_ACTIVE_KEY);
      return true; // success
    } catch {
      // Wait before retrying (500ms, 1s, 2s)
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }
  // All retries failed — leave the BLOCKING_ACTIVE_KEY so the next
  // foreground resume will try again
  console.error('[TimerExpiryGuard] Failed to stop app blocking after 3 attempts');
  return false;
}

/**
 * Mark that app blocking is active. Called from timer start.
 * This persists across WebView reloads so the guard can detect orphaned blocking.
 */
export function markBlockingActive() {
  try {
    localStorage.setItem(BLOCKING_ACTIVE_KEY, Date.now().toString());
  } catch { /* ignore */ }
}

/** Mark that app blocking was stopped. Called from timer stop/complete. */
export function markBlockingStopped() {
  try {
    localStorage.removeItem(BLOCKING_ACTIVE_KEY);
  } catch { /* ignore */ }
}

function checkAndClearExpiredTimer(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const state: PersistedTimerState = JSON.parse(raw);

    // If timer is not running, check for orphaned blocking state.
    // This handles the case where the timer crashed/reset to default (25:00)
    // but apps are still blocked from a previous session.
    if (!state.isRunning || !state.startTime) {
      const blockingTimestamp = localStorage.getItem(BLOCKING_ACTIVE_KEY);
      if (blockingTimestamp) {
        // Blocking was active but timer is no longer running — stop blocking.
        // Don't remove BLOCKING_ACTIVE_KEY here; stopBlockingWithRetry will
        // clear it on success, or leave it for the next foreground attempt.
        return true;
      }
      return false;
    }

    const now = Date.now();
    const elapsedMs = now - state.startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    // Guard against clock drift / corrupted state
    if (elapsedSeconds < 0) {
      // Clock went backward (NTP correction, timezone change, DST, etc.)
      // Adjust startTime to preserve the session rather than killing it.
      if (state.isCountup) {
        const lastElapsed = state.elapsedTime || 0;
        const adjusted = { ...state, startTime: now - lastElapsed * 1000 };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(adjusted));
      } else {
        // Back-calculate elapsed from last-saved timeLeft
        const elapsed = state.sessionDuration - (state.timeLeft ?? state.sessionDuration);
        const adjusted = { ...state, startTime: now - Math.max(0, elapsed) * 1000 };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(adjusted));
      }
      return false; // Timer still running — don't stop blocking
    }

    if (elapsedSeconds > TIMER_VALIDATION.MAX_DURATION_SECONDS) {
      // Elapsed exceeds absolute maximum — clear corrupted state
      const cleared = { ...state, isRunning: false, startTime: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
      return true;
    }

    // Countup mode: only expires at max duration
    if (state.isCountup) {
      const maxDuration = MAX_COUNTUP_DURATION;
      if (elapsedSeconds >= maxDuration) {
        const cleared = { ...state, isRunning: false, startTime: null, elapsedTime: maxDuration };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
        return true;
      }
      return false;
    }

    // Countdown mode: expired when elapsed >= sessionDuration
    if (elapsedSeconds >= state.sessionDuration) {
      const cleared = { ...state, isRunning: false, startTime: null, timeLeft: 0 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function useTimerExpiryGuard() {
  const hasChecked = useRef(false);

  // Check on initial mount (app startup / WebView reload)
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    if (checkAndClearExpiredTimer()) {
      stopBlockingWithRetry().catch(() => {
        // Logged inside stopBlockingWithRetry — BLOCKING_ACTIVE_KEY preserved for next attempt
      });
    }
  }, []);

  // Check when app returns to foreground (iOS native)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let handle: { remove: () => Promise<void> } | null = null;

    CapApp.addListener('appStateChange', (appState) => {
      if (appState.isActive) {
        if (checkAndClearExpiredTimer()) {
          stopBlockingWithRetry().catch(() => {
            // Logged inside stopBlockingWithRetry
          });
        }
      }
    }).then((h) => {
      if (cancelled) {
        // Effect already cleaned up before listener registered — remove immediately
        h.remove();
      } else {
        handle = h;
      }
    });

    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, []);
}
