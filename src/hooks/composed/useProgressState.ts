/**
 * Progress State Hook
 *
 * Manages XP, levels, and biome progression.
 * Part of the decomposed useBackendAppState pattern.
 */

import { useMemo } from 'react';
import { useXPSystem } from '@/hooks/useXPSystem';
import { getUnlockedAnimals } from '@/data/AnimalDatabase';

export interface ProgressState {
  // XP
  currentXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  levelProgress: number;

  // Biomes
  currentBiome: string;
  availableBiomes: string[];

  // Unlocks
  unlockedAnimals: string[];

  // Loading
  isLoading: boolean;
}

export interface ProgressActions {
  awardXP: (sessionMinutes: number) => {
    xpGained: number;
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
    unlockedRewards: Array<{ name: string; description: string }>;
  };
  getLevelProgress: () => number;
}

export function useProgressState(): ProgressState & ProgressActions {
  const xpSystem = useXPSystem();

  const state = useMemo<ProgressState>(() => {
    const unlockedAnimals = getUnlockedAnimals(xpSystem.currentLevel).map(a => a.name);

    return {
      currentXP: xpSystem.currentXP,
      currentLevel: xpSystem.currentLevel,
      xpToNextLevel: xpSystem.xpToNextLevel,
      levelProgress: xpSystem.getLevelProgress(),
      currentBiome: xpSystem.currentBiome,
      availableBiomes: xpSystem.availableBiomes,
      unlockedAnimals,
      isLoading: xpSystem.isLoading,
    };
  }, [xpSystem]);

  return {
    ...state,
    awardXP: xpSystem.awardXP,
    getLevelProgress: xpSystem.getLevelProgress,
  };
}
