import { useState, useCallback, useRef, useEffect } from 'react';
import { getAmbientSoundById } from '@/data/AmbientSoundsData';
import { soundLogger } from '@/lib/logger';
import type { WebkitWindow } from '@/types/browser-utils';

const AMBIENT_STORAGE_KEY = 'petIsland_ambientSound';

interface AmbientSoundState {
  currentSoundId: string | null;
  volume: number;
  isPlaying: boolean;
}

const defaultState: AmbientSoundState = {
  currentSoundId: null,
  volume: 50,
  isPlaying: false,
};

export const useAmbientSound = () => {
  const [state, setState] = useState<AmbientSoundState>(defaultState);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    source?: AudioBufferSourceNode | OscillatorNode;
    gain?: GainNode;
    filter?: BiquadFilterNode;
    oscillator2?: OscillatorNode;
    gain2?: GainNode;
  }>({});

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(AMBIENT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed, isPlaying: false }));
      } catch {
        // Invalid saved data, use defaults
      }
    }
  }, []);

  // Save preferences when they change
  const savePreferences = useCallback((newState: Partial<AmbientSoundState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      localStorage.setItem(AMBIENT_STORAGE_KEY, JSON.stringify({
        currentSoundId: updated.currentSoundId,
        volume: updated.volume,
      }));
      return updated;
    });
  }, []);

  // Create white noise buffer
  const createNoiseBuffer = useCallback((context: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer => {
    const bufferSize = context.sampleRate * 2; // 2 seconds
    const buffer = context.createBuffer(2, bufferSize, context.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);

      if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      } else if (type === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
      } else { // brown
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // Compensate for volume loss
        }
      }
    }

    return buffer;
  }, []);

  // Create binaural beat
  const createBinauralBeat = useCallback((context: AudioContext, baseFreq: number, beatFreq: number, gain: GainNode) => {
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    const gainL = context.createGain();
    const gainR = context.createGain();
    const merger = context.createChannelMerger(2);

    osc1.frequency.value = baseFreq;
    osc2.frequency.value = baseFreq + beatFreq;
    osc1.type = 'sine';
    osc2.type = 'sine';

    gainL.gain.value = 0.5;
    gainR.gain.value = 0.5;

    osc1.connect(gainL);
    osc2.connect(gainR);
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);
    merger.connect(gain);

    osc1.start();
    osc2.start();

    return { osc1, osc2 };
  }, []);

  // Stop current sound
  const stop = useCallback(() => {
    try {
      if (nodesRef.current.source) {
        if ('stop' in nodesRef.current.source) {
          nodesRef.current.source.stop();
        }
      }
      if (nodesRef.current.oscillator2) {
        nodesRef.current.oscillator2.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch {
      // Ignore errors during cleanup
    }
    nodesRef.current = {};
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Play a sound
  const play = useCallback((soundId: string) => {
    const sound = getAmbientSoundById(soundId);
    if (!sound) return;

    // Stop any existing sound
    stop();

    try {
      const windowWithWebkit = window as WebkitWindow;
      const AudioContextClass = window.AudioContext || windowWithWebkit.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      audioContextRef.current = context;

      const masterGain = context.createGain();
      masterGain.gain.value = state.volume / 100;
      masterGain.connect(context.destination);
      nodesRef.current.gain = masterGain;

      if (sound.generatorConfig?.type === 'noise') {
        const noiseType = sound.generatorConfig.noiseType || 'white';
        const buffer = createNoiseBuffer(context, noiseType);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Add filter for variation based on sound type
        const filter = context.createBiquadFilter();
        if (sound.id.includes('rain') || sound.id.includes('ocean')) {
          filter.type = 'lowpass';
          filter.frequency.value = 2000;
        } else if (sound.id.includes('fire') || sound.id.includes('thunder')) {
          filter.type = 'lowpass';
          filter.frequency.value = 1000;
        } else {
          filter.type = 'allpass';
        }

        source.connect(filter);
        filter.connect(masterGain);
        source.start();

        nodesRef.current.source = source;
        nodesRef.current.filter = filter;
      } else if (sound.generatorConfig?.type === 'binaural') {
        const baseFreq = sound.generatorConfig.binauralBase || 200;
        const beatFreq = sound.generatorConfig.binauralBeat || 10;
        const { osc1, osc2 } = createBinauralBeat(context, baseFreq, beatFreq, masterGain);
        nodesRef.current.source = osc1;
        nodesRef.current.oscillator2 = osc2;
      }

      savePreferences({ currentSoundId: soundId, isPlaying: true });
    } catch (error) {
      soundLogger.error('Failed to play ambient sound:', error);
    }
  }, [state.volume, stop, createNoiseBuffer, createBinauralBeat, savePreferences]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    savePreferences({ volume });
    if (nodesRef.current.gain) {
      nodesRef.current.gain.gain.value = volume / 100;
    }
  }, [savePreferences]);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (state.isPlaying) {
      stop();
    } else if (state.currentSoundId) {
      play(state.currentSoundId);
    }
  }, [state.isPlaying, state.currentSoundId, play, stop]);

  // Select a sound (saves preference but doesn't auto-play)
  const selectSound = useCallback((soundId: string | null) => {
    if (soundId === null) {
      stop();
      savePreferences({ currentSoundId: null });
    } else {
      savePreferences({ currentSoundId: soundId });
    }
  }, [stop, savePreferences]);

  // Get current sound info
  const currentSound = state.currentSoundId ? getAmbientSoundById(state.currentSoundId) : null;

  return {
    currentSound,
    currentSoundId: state.currentSoundId,
    volume: state.volume,
    isPlaying: state.isPlaying,
    play,
    stop,
    toggle,
    setVolume,
    selectSound,
  };
};
