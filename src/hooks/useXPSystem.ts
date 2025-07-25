import { useState, useEffect, useCallback } from 'react';
import { ANIMAL_DATABASE, BIOME_DATABASE } from '@/data/AnimalDatabase';

export interface XPReward {
  xpGained: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  unlockedRewards: UnlockedReward[];
}

export interface UnlockedReward {
  type: 'animal' | 'biome';
  name: string;
  description: string;
  level: number;
}

export interface XPSystemState {
  currentXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  totalXPForCurrentLevel: number;
  unlockedAnimals: string[];
  currentBiome: string;
  availableBiomes: string[];
}

const STORAGE_KEY = 'petIsland_xpSystem';

// XP rewards based on session duration (in minutes)
const XP_REWARDS = {
  30: 10,   // 30 minutes = 10 XP
  60: 25,   // 1 hour = 25 XP
  120: 60,  // 2 hours = 60 XP
  180: 100, // 3 hours = 100 XP
  240: 150, // 4 hours = 150 XP
  300: 210, // 5 hours = 210 XP
};

// Level progression: how much XP needed to reach each level
const LEVEL_REQUIREMENTS = [
  0,   // Level 1 (starting level)
  25,  // Level 2
  50,  // Level 3 (25 + 25)
  75,  // Level 4 (50 + 25)
  125, // Level 5 (75 + 50)
];

// Memoized level requirement calculation
const levelRequirementCache = new Map<number, number>();

const calculateLevelRequirement = (level: number): number => {
  if (levelRequirementCache.has(level)) {
    return levelRequirementCache.get(level)!;
  }
  
  let result: number;
  if (level <= 5) {
    result = LEVEL_REQUIREMENTS[level - 1] || 0;
  } else {
    let totalXP = LEVEL_REQUIREMENTS[4]; // XP for level 5
    let increment = 100; // Starting increment for level 6
    
    for (let i = 6; i <= level; i++) {
      totalXP += increment;
      increment += 50; // Increase by 50 each level
    }
    result = totalXP;
  }
  
  levelRequirementCache.set(level, result);
  return result;
};


// Generate animal unlocks from the database
const ANIMAL_UNLOCKS: Record<number, UnlockedReward> = {};

// Add animal unlocks
ANIMAL_DATABASE.forEach(animal => {
  ANIMAL_UNLOCKS[animal.unlockLevel] = {
    type: 'animal',
    name: animal.name,
    description: animal.description,
    level: animal.unlockLevel
  };
});

// Add biome unlocks
BIOME_DATABASE.forEach(biome => {
  ANIMAL_UNLOCKS[biome.unlockLevel] = {
    type: 'biome',
    name: biome.name,
    description: biome.description,
    level: biome.unlockLevel
  };
});

export const useXPSystem = () => {
  const [xpState, setXPState] = useState<XPSystemState>({
    currentXP: 0,
    currentLevel: 1,
    xpToNextLevel: 25,
    totalXPForCurrentLevel: 0,
    unlockedAnimals: ['Elephant'], // Start with first animal
    currentBiome: 'Meadow',
    availableBiomes: ['Meadow'],
  });

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        console.log('Loaded XP state from localStorage:', parsed);
        // Check if we need to reset due to old data structure
        if (parsed.unlockedAnimals && parsed.unlockedAnimals[0] === 'Fox') {
          console.log('Detected old Fox data, clearing localStorage and resetting to Elephant');
          localStorage.removeItem(STORAGE_KEY);
          return; // Don't load the old state
        }
        setXPState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved XP state:', error);
      }
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<XPSystemState>) => {
    setXPState(prev => {
      const updatedState = { ...prev, ...newState };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      return updatedState;
    });
  }, []);

  // Pre-sorted durations for performance
  const sortedDurations = Object.keys(XP_REWARDS)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending

  // Calculate XP gained from session duration
  const calculateXPFromDuration = useCallback((minutes: number): number => {
    for (const duration of sortedDurations) {
      if (minutes >= duration) {
        return XP_REWARDS[duration as keyof typeof XP_REWARDS];
      }
    }
    
    return 0; // No XP for sessions less than 30 minutes
  }, []);

  // Calculate current level from total XP
  const calculateLevel = useCallback((totalXP: number): number => {
    let level = 1;
    while (totalXP >= calculateLevelRequirement(level + 1)) {
      level++;
    }
    return level;
  }, []);

  // Award XP and handle level ups
  const awardXP = useCallback((sessionMinutes: number): XPReward => {
    const xpGained = calculateXPFromDuration(sessionMinutes);
    const oldLevel = xpState.currentLevel;
    const newTotalXP = xpState.currentXP + xpGained;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    // Calculate XP progress for new level
    const currentLevelXP = calculateLevelRequirement(newLevel);
    const nextLevelXP = calculateLevelRequirement(newLevel + 1);
    const xpToNextLevel = nextLevelXP - newTotalXP;

    // Determine unlocked rewards
    const unlockedRewards: UnlockedReward[] = [];
    if (leveledUp) {
      for (let level = oldLevel + 1; level <= newLevel; level++) {
        if (ANIMAL_UNLOCKS[level]) {
          unlockedRewards.push(ANIMAL_UNLOCKS[level]);
        }
      }
    }

    // Update state
    const newAnimals = [...xpState.unlockedAnimals];
    const newBiomes = [...xpState.availableBiomes];
    let newCurrentBiome = xpState.currentBiome;

    unlockedRewards.forEach(reward => {
      if (reward.type === 'animal' && !newAnimals.includes(reward.name)) {
        newAnimals.push(reward.name);
      } else if (reward.type === 'biome' && !newBiomes.includes(reward.name.replace(' Biome', ''))) {
        const biomeName = reward.name.replace(' Biome', '');
        newBiomes.push(biomeName);
        newCurrentBiome = biomeName; // Auto-switch to new biome
      }
    });

    saveState({
      currentXP: newTotalXP,
      currentLevel: newLevel,
      xpToNextLevel,
      totalXPForCurrentLevel: currentLevelXP,
      unlockedAnimals: newAnimals,
      currentBiome: newCurrentBiome,
      availableBiomes: newBiomes,
    });

    return {
      xpGained,
      oldLevel,
      newLevel,
      leveledUp,
      unlockedRewards,
    };
  }, [xpState, calculateXPFromDuration, calculateLevel, saveState]);

  // Get progress percentage for current level
  const getLevelProgress = useCallback((): number => {
    const currentLevelXP = calculateLevelRequirement(xpState.currentLevel);
    const nextLevelXP = calculateLevelRequirement(xpState.currentLevel + 1);
    const progressXP = xpState.currentXP - currentLevelXP;
    const totalXPNeeded = nextLevelXP - currentLevelXP;
    
    return Math.min(100, (progressXP / totalXPNeeded) * 100);
  }, [xpState]);

  // Switch biome
  const switchBiome = useCallback((biomeName: string) => {
    if (xpState.availableBiomes.includes(biomeName)) {
      saveState({ currentBiome: biomeName });
    }
  }, [xpState.availableBiomes, saveState]);

  // Reset progress
  const resetProgress = useCallback(() => {
    const resetState: XPSystemState = {
      currentXP: 0,
      currentLevel: 1,
      xpToNextLevel: 25,
      totalXPForCurrentLevel: 0,
      unlockedAnimals: ['Elephant'],
      currentBiome: 'Meadow',
      availableBiomes: ['Meadow'],
    };
    setXPState(resetState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
  }, []);

  return {
    ...xpState,
    awardXP,
    getLevelProgress,
    switchBiome,
    resetProgress,
    calculateXPFromDuration,
  };
};