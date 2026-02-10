/**
 * useHaptics — Lightweight haptic feedback hook
 *
 * Wraps DeviceActivity.triggerHapticFeedback() for native iOS/Android and
 * falls back to navigator.vibrate() on web when available.
 *
 * Respects the user's hapticFeedback setting in AppSettings.
 *
 * Usage:
 *   const { haptic } = useHaptics();
 *   haptic('light');   // UIImpactFeedbackGenerator style: light
 *   haptic('success'); // UINotificationFeedbackGenerator style: success
 */

import { useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { DeviceActivity } from '@/plugins/device-activity';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

// Throttle haptics to prevent motor burnout on rapid taps
const THROTTLE_MS = 50;

/** Read the haptic preference directly from storage — avoids hook dependency */
function isHapticEnabled(): boolean {
  try {
    const settings = storage.get<{ hapticFeedback?: boolean }>(STORAGE_KEYS.APP_SETTINGS);
    // Default to true if setting doesn't exist yet
    return settings?.hapticFeedback !== false;
  } catch {
    return true;
  }
}

export const useHaptics = () => {
  const lastFiredRef = useRef(0);

  const haptic = useCallback((style: HapticStyle = 'light') => {
    // Respect user's haptic preference
    if (!isHapticEnabled()) return;

    const now = Date.now();
    if (now - lastFiredRef.current < THROTTLE_MS) return;
    lastFiredRef.current = now;

    if (Capacitor.isNativePlatform()) {
      // Native — fire and forget, never block UI
      DeviceActivity.triggerHapticFeedback({ style }).catch(() => {
        // Silently ignore — haptics are non-critical
      });
    } else if ('vibrate' in navigator) {
      // Web fallback
      const patterns: Record<HapticStyle, number> = {
        light: 1,
        medium: 5,
        heavy: 10,
        success: 5,
        warning: 8,
        error: 10,
      };
      navigator.vibrate(patterns[style]);
    }
  }, []);

  return { haptic };
};
