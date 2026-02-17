/**
 * useClickSound Hook
 *
 * Provides a subtle UI click sound effect for interactive elements.
 * Delegates to the centralized sound effects system so it respects
 * the global soundEnabled / soundVolume / soundTheme settings.
 * Also has its own "Button Sounds" toggle (petIsland_clickSoundEnabled).
 */

import { useCallback } from 'react';
import { playSoundEffect } from '@/hooks/useSoundEffects';

const CLICK_SOUND_KEY = 'petIsland_clickSoundEnabled';

/** Check if button click sounds are enabled (defaults to true) */
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
  const playClick = useCallback(() => {
    if (!isClickSoundEnabled()) return;
    // playSoundEffect checks global soundEnabled/soundVolume/soundTheme
    playSoundEffect('click');
  }, []);

  return { playClick };
};
