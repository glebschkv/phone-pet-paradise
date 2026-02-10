/**
 * useClickSound Hook
 *
 * Provides a subtle UI click sound effect for interactive elements.
 * Uses Web Audio API to generate a short sine wave pop (~40ms).
 * Respects the user's sound settings (can be disabled in Settings > General).
 */

import { useCallback, useRef } from 'react';

const CLICK_SOUND_KEY = 'petIsland_clickSoundEnabled';

/** Check if click sounds are enabled (defaults to true) */
const isClickSoundEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(CLICK_SOUND_KEY);
    return stored !== 'false';
  } catch {
    return true;
  }
};

export const setClickSoundEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(CLICK_SOUND_KEY, String(enabled));
  } catch { /* ignore */ }
};

export const useClickSound = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClick = useCallback(() => {
    if (!isClickSoundEnabled()) return;

    try {
      // Lazily create AudioContext on first interaction (required by browsers)
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a short sine wave pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Silently fail — audio is non-critical
    }
  }, []);

  return { playClick };
};
