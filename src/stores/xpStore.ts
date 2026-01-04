import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { xpLogger } from '@/lib/logger';

export const MAX_LEVEL = 50;

export const calculateLevelRequirement = (level: number): number => {
  if (level <= 0) return 0;
  if (level === 1) return 15;
  return Math.floor(15 * Math.pow(1.15, level - 1));
};

export interface XPState {
  currentXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  totalXPForCurrentLevel: number;
  unlockedAnimals: string[];
  currentBiome: string;
  availableBiomes: string[];
}

interface XPStore extends XPState {
  setXP: (xp: number) => void;
  addXP: (amount: number) => void;
  setLevel: (level: number) => void;
  addAnimal: (animalName: string) => void;
  addAnimals: (animalNames: string[]) => void;
  switchBiome: (biomeName: string) => void;
  addBiome: (biomeName: string) => void;
  updateState: (partial: Partial<XPState>) => void;
  resetXP: () => void;
}

const initialState: XPState = {
  currentXP: 0,
  currentLevel: 0,
  xpToNextLevel: 15,
  totalXPForCurrentLevel: 0,
  unlockedAnimals: [],
  currentBiome: 'Meadow',
  availableBiomes: ['Meadow'],
};

export const useXPStore = create<XPStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setXP: (xp) => set({ currentXP: xp }),
      addXP: (amount) => set((s) => ({ currentXP: s.currentXP + amount })),
      setLevel: (level) => {
        const xpRequired = calculateLevelRequirement(level);
        const nextLevelXP = level >= MAX_LEVEL ? xpRequired : calculateLevelRequirement(level + 1);
        set({ currentLevel: level, totalXPForCurrentLevel: xpRequired, xpToNextLevel: nextLevelXP - get().currentXP });
      },
      addAnimal: (name) => {
        const { unlockedAnimals } = get();
        if (!unlockedAnimals.includes(name)) set({ unlockedAnimals: [...unlockedAnimals, name] });
      },
      addAnimals: (names) => {
        const { unlockedAnimals } = get();
        const newAnimals = names.filter(n => !unlockedAnimals.includes(n));
        if (newAnimals.length > 0) set({ unlockedAnimals: [...unlockedAnimals, ...newAnimals] });
      },
      switchBiome: (name) => { if (get().availableBiomes.includes(name)) set({ currentBiome: name }); },
      addBiome: (name) => {
        const { availableBiomes } = get();
        if (!availableBiomes.includes(name)) set({ availableBiomes: [...availableBiomes, name] });
      },
      updateState: (partial) => set((s) => ({ ...s, ...partial })),
      resetXP: () => set(initialState),
    }),
    {
      name: 'nomo_xp_system',
      onRehydrateStorage: () => (state) => {
        if (!state) {
          try {
            const legacy = localStorage.getItem('petIsland_xpSystem');
            if (legacy) return JSON.parse(legacy);
          } catch { /* ignore */ }
        }
        if (state) xpLogger.debug('XP store rehydrated');
      },
    }
  )
);

export const useCurrentXP = () => useXPStore((s) => s.currentXP);
export const useCurrentLevel = () => useXPStore((s) => s.currentLevel);
export const useUnlockedAnimals = () => useXPStore((s) => s.unlockedAnimals);
export const useCurrentBiome = () => useXPStore((s) => s.currentBiome);
export const useAvailableBiomes = () => useXPStore((s) => s.availableBiomes);
