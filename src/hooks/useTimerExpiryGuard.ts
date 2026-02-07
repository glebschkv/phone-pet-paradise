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

const STORAGE_KEY = 'petIsland_unifiedTimer';

interface PersistedTimerState {
  isRunning: boolean;
  startTime: number | null;
  sessionDuration: number;
  isCountup?: boolean;
  elapsedTime?: number;
}

/** Try to stop app blocking with retries for reliability */
async function stopBlockingWithRetry() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await DeviceActivity.stopAppBlocking();
      return; // success
    } catch {
      // Wait before retrying (500ms, 1s, 2s)
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }
}

function checkAndClearExpiredTimer(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const state: PersistedTimerState = JSON.parse(raw);
    if (!state.isRunning || !state.startTime) return false;

    const now = Date.now();
    const elapsedMs = now - state.startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    // Guard against clock drift / corrupted state
    if (elapsedSeconds < 0 || elapsedSeconds > TIMER_VALIDATION.MAX_DURATION_SECONDS) {
      // Clear corrupted state
      const cleared = { ...state, isRunning: false, startTime: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
      return true;
    }

    // Countup mode: only expires at max duration (6 hours)
    if (state.isCountup) {
      const maxDuration = 6 * 60 * 60; // 21600 seconds
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
      stopBlockingWithRetry();
    }
  }, []);

  // Check when app returns to foreground (iOS native)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => Promise<void> } | null = null;

    CapApp.addListener('appStateChange', (appState) => {
      if (appState.isActive) {
        if (checkAndClearExpiredTimer()) {
          stopBlockingWithRetry();
        }
      }
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, []);
}
