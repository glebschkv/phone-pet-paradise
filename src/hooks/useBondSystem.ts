import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { bondLogger } from '@/lib/logger';

export interface BondData {
  animalId: string;
  bondLevel: number; // 1-10
  experience: number; // 0-100 per level
  lastInteraction: number;
  totalInteractions: number;
  favoriteActivities: string[];
  personality: {
    energy: number; // 1-5
    curiosity: number; // 1-5
    loyalty: number; // 1-5
  };
  moodState: 'happy' | 'content' | 'lonely' | 'excited' | 'sleepy';
  unlockedAbilities: string[];
}

export interface BondSystemReturn {
  bonds: Record<string, BondData>;
  getBondLevel: (animalId: string) => number;
  getExperienceProgress: (animalId: string) => number;
  getMoodState: (animalId: string) => string;
  interactWithPet: (animalId: string, activity: string) => Promise<boolean>;
  feedPet: (animalId: string) => Promise<boolean>;
  playWithPet: (animalId: string) => Promise<boolean>;
  trainPet: (animalId: string, skill: string) => Promise<boolean>;
  giftTreat: (animalId: string) => Promise<boolean>;
  getAbilityBonuses: (animalId: string) => Record<string, number>;
  getPetPersonality: (animalId: string) => BondData['personality'];
  resetBond: (animalId: string) => void;
}

const BOND_STORAGE_KEY = 'pet-bond-data';
const EXPERIENCE_PER_LEVEL = 100;
const ABILITIES_BY_LEVEL = {
  1: ['Basic Companion'],
  3: ['Focus Boost +5%'],
  5: ['Experience Bonus +10%'],
  7: ['Special Animation'],
  10: ['Master Bond', 'Ultimate Ability']
};

export const useBondSystem = (): BondSystemReturn => {
  const [bonds, setBonds] = useState<Record<string, BondData>>({});
  // Load bond data from localStorage
  const loadBondData = useCallback(() => {
    try {
      const saved = localStorage.getItem(BOND_STORAGE_KEY);
      if (saved) {
        setBonds(JSON.parse(saved));
      }
    } catch (error) {
      bondLogger.error('Failed to load bond data:', error);
    }
  }, []);

  // Save bond data to localStorage
  const saveBondData = useCallback((bondData: Record<string, BondData>) => {
    try {
      localStorage.setItem(BOND_STORAGE_KEY, JSON.stringify(bondData));
    } catch (error) {
      bondLogger.error('Failed to save bond data:', error);
    }
  }, []);

  // Initialize bond data for new animal
  const initializeBond = useCallback((animalId: string): BondData => {
    return {
      animalId,
      bondLevel: 1,
      experience: 0,
      lastInteraction: Date.now(),
      totalInteractions: 0,
      favoriteActivities: [],
      personality: {
        energy: Math.floor(Math.random() * 5) + 1,
        curiosity: Math.floor(Math.random() * 5) + 1,
        loyalty: Math.floor(Math.random() * 5) + 1
      },
      moodState: 'content',
      unlockedAbilities: ['Basic Companion']
    };
  }, []);

  // Get bond level for animal
  const getBondLevel = useCallback((animalId: string): number => {
    return bonds[animalId]?.bondLevel || 1;
  }, [bonds]);

  // Get experience progress (0-100)
  const getExperienceProgress = useCallback((animalId: string): number => {
    return bonds[animalId]?.experience || 0;
  }, [bonds]);

  // Get mood state
  const getMoodState = useCallback((animalId: string): string => {
    return bonds[animalId]?.moodState || 'content';
  }, [bonds]);

  // Calculate mood based on interactions
  const calculateMood = useCallback((bondData: BondData): BondData['moodState'] => {
    const timeSinceLastInteraction = Date.now() - bondData.lastInteraction;
    const hoursAgo = timeSinceLastInteraction / (1000 * 60 * 60);

    if (hoursAgo > 24) return 'lonely';
    if (hoursAgo < 1) return 'excited';
    if (bondData.totalInteractions % 5 === 0) return 'happy';
    return 'content';
  }, []);

  // Add experience and handle level ups
  const addExperience = useCallback((animalId: string, amount: number): boolean => {
    setBonds(prev => {
      const current = prev[animalId] || initializeBond(animalId);
      const newExperience = current.experience + amount;
      const newLevel = Math.min(10, current.bondLevel + Math.floor(newExperience / EXPERIENCE_PER_LEVEL));
      const remainingExp = newExperience % EXPERIENCE_PER_LEVEL;

      const leveledUp = newLevel > current.bondLevel;
      const newAbilities = leveledUp ? [...current.unlockedAbilities] : current.unlockedAbilities;

      // Add new abilities for level up
      if (leveledUp && ABILITIES_BY_LEVEL[newLevel as keyof typeof ABILITIES_BY_LEVEL]) {
        newAbilities.push(...ABILITIES_BY_LEVEL[newLevel as keyof typeof ABILITIES_BY_LEVEL]);
      }

      const updated = {
        ...current,
        bondLevel: newLevel,
        experience: newLevel === 10 ? 100 : remainingExp,
        lastInteraction: Date.now(),
        totalInteractions: current.totalInteractions + 1,
        moodState: calculateMood({ ...current, lastInteraction: Date.now() }),
        unlockedAbilities: newAbilities
      };

      const newBonds = { ...prev, [animalId]: updated };
      saveBondData(newBonds);

      if (leveledUp) {
        toast.success("Bond Level Up!", {
          description: `Your bond with ${animalId} reached level ${newLevel}!`,
        });
      }

      return newBonds;
    });

    return true;
  }, [initializeBond, calculateMood, saveBondData]);

  // Generic interaction method
  const interactWithPet = useCallback(async (animalId: string, activity: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const experienceGain = Math.floor(Math.random() * 15) + 10;
        addExperience(animalId, experienceGain);
        
        toast.success("Pet Interaction", {
          description: `${activity} with your pet! +${experienceGain} bond experience`,
        });
        
        resolve(true);
      }, 1000);
    });
  }, [addExperience]);

  // Specific interaction methods
  const feedPet = useCallback(async (animalId: string): Promise<boolean> => {
    return interactWithPet(animalId, "Fed");
  }, [interactWithPet]);

  const playWithPet = useCallback(async (animalId: string): Promise<boolean> => {
    return interactWithPet(animalId, "Played");
  }, [interactWithPet]);

  const trainPet = useCallback(async (animalId: string, skill: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const experienceGain = Math.floor(Math.random() * 25) + 20;
        addExperience(animalId, experienceGain);
        
        toast.success("Training Complete", {
          description: `Trained ${skill}! +${experienceGain} bond experience`,
        });
        
        resolve(true);
      }, 2000);
    });
  }, [addExperience]);

  const giftTreat = useCallback(async (animalId: string): Promise<boolean> => {
    return interactWithPet(animalId, "Gave treat to");
  }, [interactWithPet]);

  // Get ability bonuses based on bond level
  const getAbilityBonuses = useCallback((animalId: string): Record<string, number> => {
    const bondLevel = getBondLevel(animalId);
    return {
      focusBonus: bondLevel * 2, // 2% per level
      experienceBonus: Math.floor(bondLevel / 2) * 5, // 5% every 2 levels
      timeBonus: bondLevel >= 5 ? 10 : 0 // 10% at level 5+
    };
  }, [getBondLevel]);

  // Get pet personality
  const getPetPersonality = useCallback((animalId: string): BondData['personality'] => {
    return bonds[animalId]?.personality || { energy: 3, curiosity: 3, loyalty: 3 };
  }, [bonds]);

  // Reset bond (for testing)
  const resetBond = useCallback((animalId: string): void => {
    setBonds(prev => {
      const updated = { ...prev };
      delete updated[animalId];
      saveBondData(updated);
      return updated;
    });
  }, [saveBondData]);

  // Load data on mount
  useEffect(() => {
    loadBondData();
  }, [loadBondData]);

  return {
    bonds,
    getBondLevel,
    getExperienceProgress,
    getMoodState,
    interactWithPet,
    feedPet,
    playWithPet,
    trainPet,
    giftTreat,
    getAbilityBonuses,
    getPetPersonality,
    resetBond
  };
};