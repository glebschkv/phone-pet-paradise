/**
 * useSoundEffects — Centralized game sound effects via Web Audio API.
 *
 * All sounds are synthesized (no audio files needed, no copyright concerns).
 * Respects the global soundEnabled / soundVolume / soundTheme settings.
 * Sound themes change the character of synthesized tones:
 *   - default (Classic): bright, arcade-style
 *   - nature: softer, warmer tones
 *   - minimal: short, clean clicks
 */

import { useCallback, useRef } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import type { AppSettings } from '@/hooks/useSettings';

// ---------------------------------------------------------------------------
// Settings helpers (read from storage, avoid hook dependency)
// ---------------------------------------------------------------------------

function getSoundSettings(): { enabled: boolean; volume: number; theme: string } {
  try {
    const s = storage.get<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
    return {
      enabled: s?.soundEnabled ?? true,
      volume: (s?.soundVolume ?? 70) / 100, // 0-1
      theme: s?.soundTheme ?? 'default',
    };
  } catch {
    return { enabled: true, volume: 0.7, theme: 'default' };
  }
}

// ---------------------------------------------------------------------------
// Shared AudioContext (lazy, one per app)
// ---------------------------------------------------------------------------

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!_ctx) {
      _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Primitive builders
// ---------------------------------------------------------------------------

function makeGain(ctx: AudioContext, volume: number, startGain: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(startGain * volume, ctx.currentTime);
  g.connect(ctx.destination);
  return g;
}

function playTone(
  freq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType,
  startGain: number,
  volume: number,
  delay = 0,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const g = makeGain(ctx, volume, startGain);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + delay + duration);
  osc.connect(g);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.01);
}

// ---------------------------------------------------------------------------
// Sound definitions per theme
// ---------------------------------------------------------------------------

type SoundFn = (vol: number, theme: string) => void;

const sounds: Record<string, SoundFn> = {
  // --- UI ---
  click: (vol, theme) => {
    if (theme === 'minimal') {
      playTone(1000, 600, 0.03, 'sine', 0.06, vol);
    } else if (theme === 'nature') {
      playTone(600, 350, 0.06, 'sine', 0.06, vol);
    } else {
      playTone(800, 400, 0.04, 'sine', 0.08, vol);
    }
  },

  // --- Coins / Rewards ---
  coinCollect: (vol, theme) => {
    if (theme === 'nature') {
      playTone(520, 780, 0.08, 'sine', 0.12, vol);
      playTone(780, 1040, 0.08, 'sine', 0.10, vol, 0.07);
    } else if (theme === 'minimal') {
      playTone(880, 1320, 0.06, 'sine', 0.10, vol);
    } else {
      playTone(660, 880, 0.07, 'square', 0.08, vol);
      playTone(880, 1320, 0.07, 'square', 0.06, vol, 0.06);
    }
  },

  // --- Purchase ---
  purchase: (vol, theme) => {
    if (theme === 'minimal') {
      playTone(440, 660, 0.05, 'sine', 0.08, vol);
      playTone(660, 880, 0.05, 'sine', 0.06, vol, 0.06);
    } else if (theme === 'nature') {
      playTone(400, 600, 0.1, 'sine', 0.10, vol);
      playTone(600, 800, 0.1, 'sine', 0.08, vol, 0.1);
      playTone(800, 1000, 0.12, 'sine', 0.06, vol, 0.2);
    } else {
      playTone(523, 784, 0.08, 'square', 0.07, vol);
      playTone(659, 988, 0.08, 'square', 0.06, vol, 0.08);
      playTone(784, 1318, 0.1, 'square', 0.05, vol, 0.16);
    }
  },

  // --- Achievement / Unlock ---
  achievement: (vol, theme) => {
    const t = theme === 'nature' ? 'sine' : theme === 'minimal' ? 'sine' : 'square' as OscillatorType;
    const g = theme === 'minimal' ? 0.07 : 0.09;
    playTone(523, 523, 0.1, t, g, vol);
    playTone(659, 659, 0.1, t, g * 0.9, vol, 0.1);
    playTone(784, 784, 0.1, t, g * 0.8, vol, 0.2);
    playTone(1047, 1047, 0.15, t, g * 0.7, vol, 0.3);
  },

  // --- Level Up ---
  levelUp: (vol, theme) => {
    const t = theme === 'nature' ? 'sine' : 'square' as OscillatorType;
    playTone(440, 440, 0.08, t, 0.08, vol);
    playTone(554, 554, 0.08, t, 0.08, vol, 0.08);
    playTone(659, 659, 0.08, t, 0.08, vol, 0.16);
    playTone(880, 880, 0.12, t, 0.10, vol, 0.24);
    playTone(1109, 1109, 0.18, t, 0.08, vol, 0.34);
  },

  // --- Timer complete ---
  timerComplete: (vol, theme) => {
    if (theme === 'nature') {
      playTone(440, 440, 0.2, 'sine', 0.15, vol);
      playTone(554, 554, 0.2, 'sine', 0.12, vol, 0.22);
      playTone(660, 660, 0.3, 'sine', 0.10, vol, 0.44);
    } else if (theme === 'minimal') {
      playTone(800, 600, 0.15, 'sine', 0.10, vol);
      playTone(800, 600, 0.15, 'sine', 0.08, vol, 0.25);
    } else {
      playTone(800, 800, 0.15, 'sine', 0.15, vol);
      playTone(1000, 1000, 0.15, 'sine', 0.12, vol, 0.18);
      playTone(1200, 1200, 0.2, 'sine', 0.10, vol, 0.36);
    }
  },

  // --- Timer start ---
  timerStart: (vol, theme) => {
    if (theme === 'minimal') {
      playTone(600, 900, 0.06, 'sine', 0.06, vol);
    } else {
      playTone(440, 660, 0.08, theme === 'nature' ? 'sine' : 'square', 0.07, vol);
    }
  },

  // --- Success (quest complete, streak, etc.) ---
  success: (vol, theme) => {
    const t = theme === 'nature' ? 'sine' : 'square' as OscillatorType;
    playTone(523, 523, 0.08, t, 0.08, vol);
    playTone(659, 659, 0.08, t, 0.07, vol, 0.09);
    playTone(784, 784, 0.12, t, 0.06, vol, 0.18);
  },

  // --- Error / Fail ---
  error: (vol, theme) => {
    if (theme === 'minimal') {
      playTone(400, 300, 0.12, 'sine', 0.06, vol);
    } else {
      playTone(300, 200, 0.15, theme === 'nature' ? 'sine' : 'square', 0.08, vol);
      playTone(250, 150, 0.2, theme === 'nature' ? 'sine' : 'square', 0.06, vol, 0.15);
    }
  },

  // --- Notification / Pop-up ---
  notification: (vol, theme) => {
    if (theme === 'minimal') {
      playTone(880, 1100, 0.05, 'sine', 0.06, vol);
    } else if (theme === 'nature') {
      playTone(600, 900, 0.1, 'sine', 0.08, vol);
    } else {
      playTone(784, 1047, 0.06, 'sine', 0.08, vol);
      playTone(1047, 1318, 0.06, 'sine', 0.06, vol, 0.07);
    }
  },

  // --- Reward claim / Chest open ---
  reward: (vol, theme) => {
    const t = theme === 'nature' ? 'sine' : 'square' as OscillatorType;
    playTone(392, 392, 0.07, t, 0.07, vol);
    playTone(494, 494, 0.07, t, 0.07, vol, 0.07);
    playTone(588, 588, 0.07, t, 0.07, vol, 0.14);
    playTone(784, 784, 0.1, t, 0.08, vol, 0.21);
    playTone(988, 988, 0.15, t, 0.06, vol, 0.31);
  },

  // --- Streak milestone ---
  streak: (vol, theme) => {
    const t = theme === 'nature' ? 'sine' : 'square' as OscillatorType;
    playTone(523, 784, 0.08, t, 0.07, vol);
    playTone(659, 988, 0.08, t, 0.06, vol, 0.1);
    playTone(784, 1175, 0.12, t, 0.05, vol, 0.2);
  },
};

// ---------------------------------------------------------------------------
// Standalone function (for use outside React components, e.g. plain hooks)
// ---------------------------------------------------------------------------

export type SoundEffect = keyof typeof sounds;

const _lastPlayed: Record<string, number> = {};

export function playSoundEffect(name: SoundEffect, minIntervalMs = 50): void {
  try {
    const { enabled, volume, theme } = getSoundSettings();
    if (!enabled || volume === 0) return;

    const now = Date.now();
    if (now - (_lastPlayed[name] || 0) < minIntervalMs) return;
    _lastPlayed[name] = now;

    const fn = sounds[name];
    if (fn) fn(volume, theme);
  } catch {
    // Non-critical — silent fail
  }
}

// ---------------------------------------------------------------------------
// Hook (for React components — same logic, stable reference)
// ---------------------------------------------------------------------------

export function useSoundEffects() {
  const play = useCallback((name: SoundEffect, minIntervalMs = 50) => {
    playSoundEffect(name, minIntervalMs);
  }, []);

  return { play };
}
