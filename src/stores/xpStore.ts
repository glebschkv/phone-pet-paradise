/**
 * XP Store
 *
 * Manages the user's experience points, levels, and progression. Includes
 * unlocked animals and available biomes. Uses Zustand with persistence.
 *
 * @module stores/xpStore
 *
 * @example
 * ```typescript
 * import { useXPStore, useCurrentLevel } from '@/stores/xpStore';
 *
 * // In a component
 * const { addXP, currentLevel, unlockedAnimals } = useXPStore();
 *
 * // Award XP for completing a session
 * addXP(100);
 *
 * // Or use selector hooks
 * const level = useCurrentLevel();
 * ```
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { xpLogger } from '@/lib/logger';
import { xpSystemSchema } from '@/lib/storage-validation';
import { createValidatedStorage } from '@/lib/validated-zustand-storage';

/** Maximum achievable level in the game */
export const MAX_LEVEL = 50;

export const calculateLevelRequirement = (level: number): number => {
  if (level <= 0) return 0;
  if (level === 1) return 15;
  return Math.floor(15 * Math.pow(1.15, level - 1));
};

/** Calculate level from total XP - ensures level matches XP */
export const calculateLevelFromXP = (totalXP: number): number => {
  let level = 0;
  while (level < MAX_LEVEL && totalXP >= calculateLevelRequirement(level + 1)) {
    level++;
  }
  return level;
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
  subscribeWithSelector(
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
        storage: createValidatedStorage({
          schema: xpSystemSchema,
          defaultState: initialState,
          name: 'xp-store',
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) {
            // Try to recover from legacy storage key
            try {
              const legacy = localStorage.getItem('petIsland_xpSystem');
              if (legacy) {
                let parsed = JSON.parse(legacy);
                // Handle Zustand's wrapped format
                if (parsed && typeof parsed === 'object' && 'state' in parsed) {
                  parsed = parsed.state;
                }

                const validated = xpSystemSchema.safeParse(parsed);
                if (validated.success) {
                  xpLogger.debug('Migrated XP data from legacy storage');
                  // Clean up legacy key after migration
                  localStorage.removeItem('petIsland_xpSystem');
                  return validated.data;
                }
              }
            } catch {
              xpLogger.warn('Failed to parse legacy XP data');
            }
          }
          if (state) {
            // Validate the rehydrated level makes sense for the XP
            const expectedLevel = calculateLevelFromXP(state.currentXP);
            if (state.currentLevel < expectedLevel) {
              xpLogger.warn(`Level mismatch: stored ${state.currentLevel}, expected ${expectedLevel}. Fixing.`);
              state.currentLevel = expectedLevel;
            }
            xpLogger.debug('XP store rehydrated and validated');
          }
        },
      }
    )
  )
);

// Selector hooks for efficient subscriptions
export const useCurrentXP = () => useXPStore((s) => s.currentXP);
export const useCurrentLevel = () => useXPStore((s) => s.currentLevel);
export const useUnlockedAnimals = () => useXPStore((s) => s.unlockedAnimals);
export const useCurrentBiome = () => useXPStore((s) => s.currentBiome);
export const useAvailableBiomes = () => useXPStore((s) => s.availableBiomes);

// Subscribe to XP changes for cross-component communication
// This replaces the window.dispatchEvent pattern
export const subscribeToXPChanges = (callback: (state: XPState) => void) => {
  return useXPStore.subscribe(
    (state) => ({ currentXP: state.currentXP, currentLevel: state.currentLevel }),
    () => callback(useXPStore.getState()),
    { equalityFn: (a, b) => a.currentXP === b.currentXP && a.currentLevel === b.currentLevel }
  );
};
