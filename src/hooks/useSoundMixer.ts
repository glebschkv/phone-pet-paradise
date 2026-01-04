import { useState, useCallback, useRef, useEffect } from 'react';
import { getAmbientSoundById, AmbientSound } from '@/data/AmbientSoundsData';
import { TIER_BENEFITS, isValidSubscriptionTier } from './usePremiumStatus';
import { soundLogger } from '@/lib/logger';
import type { WebkitWindow, AudioNodes } from '@/types/browser-utils';

const SOUND_MIXER_STORAGE_KEY = 'petIsland_soundMixer';

interface SoundLayer {
  soundId: string;
  volume: number; // 0-100
  isPlaying: boolean;
}

interface SoundMixerState {
  layers: SoundLayer[];
  masterVolume: number;
  isPlaying: boolean;
}

const defaultState: SoundMixerState = {
  layers: [],
  masterVolume: 70,
  isPlaying: false,
};

export const useSoundMixer = () => {
  const [state, setState] = useState<SoundMixerState>(defaultState);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const layerNodesRef = useRef<Map<string, AudioNodes>>(new Map());

  // Get max sound layers based on subscription
  const getMaxLayers = useCallback((): number => {
    const premiumData = localStorage.getItem('petIsland_premium');
    if (premiumData) {
      try {
        const parsed = JSON.parse(premiumData);
        if (isValidSubscriptionTier(parsed.tier)) {
          return TIER_BENEFITS[parsed.tier].soundMixingSlots;
        }
      } catch {
        // Invalid data
      }
    }
    return 1; // Free tier = 1 sound only
  }, []);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(SOUND_MIXER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          layers: parsed.layers || [],
          masterVolume: parsed.masterVolume ?? 70,
          isPlaying: false, // Don't auto-play on load
        }));
      } catch {
        // Invalid saved data
      }
    }
  }, []);

  // Save preferences when they change (except isPlaying)
  const savePreferences = useCallback((newState: Partial<SoundMixerState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      localStorage.setItem(SOUND_MIXER_STORAGE_KEY, JSON.stringify({
        layers: updated.layers,
        masterVolume: updated.masterVolume,
      }));
      return updated;
    });
  }, []);

  // Create noise buffer for ambient sounds
  const createNoiseBuffer = useCallback((context: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer => {
    const bufferSize = context.sampleRate * 2;
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
      } else {
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
      }
    }

    return buffer;
  }, []);

  // Create binaural beat
  const createBinauralBeat = useCallback((
    context: AudioContext,
    baseFreq: number,
    beatFreq: number,
    gainNode: GainNode
  ): { osc1: OscillatorNode; osc2: OscillatorNode } => {
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
    merger.connect(gainNode);

    osc1.start();
    osc2.start();

    return { osc1, osc2 };
  }, []);

  // Start a single sound layer
  const startSoundLayer = useCallback((
    context: AudioContext,
    masterGain: GainNode,
    sound: AmbientSound,
    layerVolume: number
  ): AudioNodes => {
    const nodes: AudioNodes = {};

    const layerGain = context.createGain();
    layerGain.gain.value = layerVolume / 100;
    layerGain.connect(masterGain);
    nodes.gain = layerGain;

    if (sound.generatorConfig?.type === 'noise') {
      const noiseType = sound.generatorConfig.noiseType || 'white';
      const buffer = createNoiseBuffer(context, noiseType);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

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
      filter.connect(layerGain);
      source.start();

      nodes.source = source;
      nodes.filter = filter;
    } else if (sound.generatorConfig?.type === 'binaural') {
      const baseFreq = sound.generatorConfig.binauralBase || 200;
      const beatFreq = sound.generatorConfig.binauralBeat || 10;
      const { osc1, osc2 } = createBinauralBeat(context, baseFreq, beatFreq, layerGain);
      nodes.source = osc1;
      nodes.oscillator2 = osc2;
    }

    return nodes;
  }, [createNoiseBuffer, createBinauralBeat]);

  // Stop a single sound layer
  const stopSoundLayer = useCallback((soundId: string) => {
    const nodes = layerNodesRef.current.get(soundId);
    if (nodes) {
      try {
        if (nodes.source && 'stop' in nodes.source) {
          nodes.source.stop();
        }
        if (nodes.oscillator2) {
          nodes.oscillator2.stop();
        }
      } catch {
        // Ignore errors during cleanup
      }
      layerNodesRef.current.delete(soundId);
    }
  }, []);

  // Stop all sounds
  const stopAll = useCallback(() => {
    layerNodesRef.current.forEach((_, soundId) => {
      stopSoundLayer(soundId);
    });
    layerNodesRef.current.clear();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      masterGainRef.current = null;
    }

    setState(prev => ({ ...prev, isPlaying: false }));
  }, [stopSoundLayer]);

  // Play all active layers
  const playAll = useCallback(() => {
    if (state.layers.length === 0) return;

    // Stop any existing playback
    stopAll();

    try {
      const windowWithWebkit = window as WebkitWindow;
      const AudioContextClass = window.AudioContext || windowWithWebkit.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      audioContextRef.current = context;

      const masterGain = context.createGain();
      masterGain.gain.value = state.masterVolume / 100;
      masterGain.connect(context.destination);
      masterGainRef.current = masterGain;

      // Start each layer
      state.layers.forEach(layer => {
        const sound = getAmbientSoundById(layer.soundId);
        if (sound) {
          const nodes = startSoundLayer(context, masterGain, sound, layer.volume);
          layerNodesRef.current.set(layer.soundId, nodes);
        }
      });

      setState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      soundLogger.error('Failed to start sound mixer:', error);
    }
  }, [state.layers, state.masterVolume, stopAll, startSoundLayer]);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (state.isPlaying) {
      stopAll();
    } else {
      playAll();
    }
  }, [state.isPlaying, stopAll, playAll]);

  // Add a sound layer
  const addLayer = useCallback((soundId: string): boolean => {
    const maxLayers = getMaxLayers();
    if (state.layers.length >= maxLayers) {
      return false; // Can't add more layers
    }

    // Check if sound already exists in layers
    if (state.layers.some(l => l.soundId === soundId)) {
      return false; // Already added
    }

    const newLayer: SoundLayer = {
      soundId,
      volume: 70,
      isPlaying: false,
    };

    const newLayers = [...state.layers, newLayer];
    savePreferences({ layers: newLayers });

    // If mixer is playing, start the new layer
    if (state.isPlaying && audioContextRef.current && masterGainRef.current) {
      const sound = getAmbientSoundById(soundId);
      if (sound) {
        const nodes = startSoundLayer(
          audioContextRef.current,
          masterGainRef.current,
          sound,
          newLayer.volume
        );
        layerNodesRef.current.set(soundId, nodes);
      }
    }

    return true;
  }, [state.layers, state.isPlaying, getMaxLayers, savePreferences, startSoundLayer]);

  // Remove a sound layer
  const removeLayer = useCallback((soundId: string) => {
    stopSoundLayer(soundId);
    const newLayers = state.layers.filter(l => l.soundId !== soundId);
    savePreferences({ layers: newLayers });

    // If no layers left, stop everything
    if (newLayers.length === 0) {
      stopAll();
    }
  }, [state.layers, savePreferences, stopSoundLayer, stopAll]);

  // Set volume for a specific layer
  const setLayerVolume = useCallback((soundId: string, volume: number) => {
    const nodes = layerNodesRef.current.get(soundId);
    if (nodes?.gain) {
      nodes.gain.gain.value = volume / 100;
    }

    const newLayers = state.layers.map(l =>
      l.soundId === soundId ? { ...l, volume } : l
    );
    savePreferences({ layers: newLayers });
  }, [state.layers, savePreferences]);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume / 100;
    }
    savePreferences({ masterVolume: volume });
  }, [savePreferences]);

  // Get current layer sounds with details
  const getLayerDetails = useCallback(() => {
    return state.layers.map(layer => ({
      ...layer,
      sound: getAmbientSoundById(layer.soundId),
    }));
  }, [state.layers]);

  // Check if a sound can be added
  const canAddLayer = useCallback(() => {
    return state.layers.length < getMaxLayers();
  }, [state.layers.length, getMaxLayers]);

  return {
    layers: state.layers,
    masterVolume: state.masterVolume,
    isPlaying: state.isPlaying,
    maxLayers: getMaxLayers(),
    // Actions
    playAll,
    stopAll,
    toggle,
    addLayer,
    removeLayer,
    setLayerVolume,
    setMasterVolume,
    // Helpers
    getLayerDetails,
    canAddLayer,
  };
};
