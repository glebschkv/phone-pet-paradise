import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { soundLogger } from '@/lib/logger';

export interface SoundLayer {
  soundId: string;
  volume: number;
  isPlaying: boolean;
}

export interface SoundMixerState {
  layers: SoundLayer[];
  masterVolume: number;
}

export interface AmbientSoundState {
  selectedSoundId: string | null;
  volume: number;
}

interface SoundState {
  mixer: SoundMixerState;
  ambient: AmbientSoundState;
  isPlaying: boolean;
}

interface SoundStore extends SoundState {
  addLayer: (soundId: string, volume?: number) => void;
  removeLayer: (soundId: string) => void;
  setLayerVolume: (soundId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  clearLayers: () => void;
  setAmbientSound: (soundId: string | null) => void;
  setAmbientVolume: (volume: number) => void;
  setPlaying: (playing: boolean) => void;
  resetSound: () => void;
}

const initialState: SoundState = {
  mixer: { layers: [], masterVolume: 70 },
  ambient: { selectedSoundId: null, volume: 70 },
  isPlaying: false,
};

export const useSoundStore = create<SoundStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      addLayer: (soundId, volume = 70) => {
        const { mixer } = get();
        if (mixer.layers.some(l => l.soundId === soundId)) return;
        set({ mixer: { ...mixer, layers: [...mixer.layers, { soundId, volume, isPlaying: false }] } });
      },
      removeLayer: (soundId) => set((s) => ({ mixer: { ...s.mixer, layers: s.mixer.layers.filter(l => l.soundId !== soundId) } })),
      setLayerVolume: (soundId, volume) => set((s) => ({
        mixer: { ...s.mixer, layers: s.mixer.layers.map(l => l.soundId === soundId ? { ...l, volume } : l) }
      })),
      setMasterVolume: (volume) => set((s) => ({ mixer: { ...s.mixer, masterVolume: volume } })),
      clearLayers: () => set((s) => ({ mixer: { ...s.mixer, layers: [] } })),
      setAmbientSound: (soundId) => set((s) => ({ ambient: { ...s.ambient, selectedSoundId: soundId } })),
      setAmbientVolume: (volume) => set((s) => ({ ambient: { ...s.ambient, volume } })),
      setPlaying: (playing) => set({ isPlaying: playing }),
      resetSound: () => set(initialState),
    }),
    {
      name: 'nomo_sound',
      partialize: (state) => ({ mixer: { layers: state.mixer.layers, masterVolume: state.mixer.masterVolume }, ambient: state.ambient }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          try {
            const mixer = localStorage.getItem('petIsland_soundMixer');
            const ambient = localStorage.getItem('petIsland_ambientSound');
            if (mixer || ambient) {
              const m = mixer ? JSON.parse(mixer) : {};
              const a = ambient ? JSON.parse(ambient) : {};
              return { mixer: { layers: m.layers || [], masterVolume: m.masterVolume ?? 70 }, ambient: { selectedSoundId: a.selectedSoundId || null, volume: a.volume ?? 70 }, isPlaying: false };
            }
          } catch { /* ignore */ }
        }
        if (state) soundLogger.debug('Sound store rehydrated');
      },
    }
  )
);

export const useSoundLayers = () => useSoundStore((s) => s.mixer.layers);
export const useMasterVolume = () => useSoundStore((s) => s.mixer.masterVolume);
export const useAmbientSound = () => useSoundStore((s) => s.ambient.selectedSoundId);
export const useAmbientVolume = () => useSoundStore((s) => s.ambient.volume);
export const useIsSoundPlaying = () => useSoundStore((s) => s.isPlaying);
