/**
 * Pet State Hook
 *
 * Manages pet bonds, interactions, and collection.
 * Part of the decomposed useBackendAppState pattern.
 */

import { useMemo, useCallback } from 'react';
import { useBondSystem } from '@/hooks/useBondSystem';
import { useCollection } from '@/hooks/useCollection';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

export interface PetState {
  // Backend pet data
  pets: Array<{
    id: string;
    pet_type: string;
    is_favorite: boolean;
    bond_level: number;
    experience: number;
    mood: number;
  }>;

  // Profile
  profile: unknown | null;
  progress: unknown | null;
}

export interface PetInteractionResult {
  bondLevelUp: boolean;
  newBondLevel: number;
  interaction: unknown;
}

export interface PetActions {
  interactWithPet: (petType: string, interactionType?: string) => Promise<PetInteractionResult>;
  getBondLevel: (petType: string) => number;
}

export function usePetState(): PetState & PetActions & {
  // Direct access for components that need full data
  bondSystem: ReturnType<typeof useBondSystem>;
  collection: ReturnType<typeof useCollection>;
  supabaseData: ReturnType<typeof useSupabaseData>;
} {
  const bondSystem = useBondSystem();
  const collection = useCollection();
  const supabaseData = useSupabaseData();

  const state = useMemo<PetState>(() => ({
    pets: supabaseData.pets,
    profile: supabaseData.profile,
    progress: supabaseData.progress,
  }), [supabaseData]);

  const interactWithPet = useCallback(async (
    petType: string,
    interactionType: string = 'play'
  ): Promise<PetInteractionResult> => {
    const previousBondLevel = bondSystem.getBondLevel(petType);
    const interaction = await bondSystem.interactWithPet(petType, interactionType);

    const newBondLevel = bondSystem.getBondLevel(petType);
    const bondLevelUp = newBondLevel > previousBondLevel;

    if (bondLevelUp) {
      toast.success(`Bond Level Up!`, {
        description: `${petType} is now bond level ${newBondLevel}!`
      });
    }

    return { bondLevelUp, newBondLevel, interaction };
  }, [bondSystem]);

  return {
    ...state,
    interactWithPet,
    getBondLevel: bondSystem.getBondLevel,
    // Direct access
    bondSystem,
    collection,
    supabaseData,
  };
}
