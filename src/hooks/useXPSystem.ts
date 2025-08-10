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

export const MAX_LEVEL = 50 as const;

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


// Generate unlocks by level from the database (animals and biomes)
const UNLOCKS_BY_LEVEL: Record<number, UnlockedReward[]> = {};

// Add animal unlocks
ANIMAL_DATABASE.forEach(animal => {
  const level = animal.unlockLevel;
  if (!UNLOCKS_BY_LEVEL[level]) UNLOCKS_BY_LEVEL[level] = [];
  UNLOCKS_BY_LEVEL[level].push({
    type: 'animal',
    name: animal.name,
    description: animal.description,
    level: level
  });
});

// Add biome unlocks (world themes every few levels)
BIOME_DATABASE.forEach(biome => {
  const level = biome.unlockLevel;
  if (!UNLOCKS_BY_LEVEL[level]) UNLOCKS_BY_LEVEL[level] = [];
  UNLOCKS_BY_LEVEL[level].push({
    type: 'biome',
    name: biome.name,
    description: biome.description,
    level: level
  });
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

      // Convert old capitalized animal names to new lowercase IDs
      const convertAnimalNames = (oldNames: string[]) => {
        const nameMap: Record<string, string> = {
          'Rabbit': 'rabbit',
          'Fox': 'fox', 
          'Deer': 'deer',
          'Owl': 'owl',
          'Bear': 'bear',
          'Wolf': 'wolf',
          'Eagle': 'eagle',
          'Turtle': 'turtle',
          'Elephant': 'elephant'
        };
        return oldNames.map(name => nameMap[name] || name.toLowerCase());
      };

      // Convert unlocked animals to new format if needed
      let convertedAnimals = parsed.unlockedAnimals || ['elephant'];
      if (convertedAnimals.some((name: string) => name[0] === name[0].toUpperCase())) {
        console.log('Converting old animal names to new format');
        convertedAnimals = convertAnimalNames(convertedAnimals);
      }

      // Normalize state for new MAX_LEVEL and biome availability
      const clampedLevel = Math.min(parsed.currentLevel ?? 1, MAX_LEVEL);
      const unlockedBiomes = BIOME_DATABASE
        .filter(b => b.unlockLevel <= clampedLevel)
        .map(b => b.name);
      const normalizedBiome = unlockedBiomes.includes(parsed.currentBiome)
        ? parsed.currentBiome
        : (unlockedBiomes[unlockedBiomes.length - 1] || 'Meadow');

      const normalized = {
        ...parsed,
        currentLevel: clampedLevel,
        availableBiomes: unlockedBiomes.length ? unlockedBiomes : ['Meadow'],
        currentBiome: normalizedBiome,
        unlockedAnimals: convertedAnimals,
      };

      console.log('Normalized XP state:', normalized);
      setXPState(prev => ({ ...prev, ...normalized }));
    } catch (error) {
      console.error('Failed to parse saved XP state:', error);
    }
  }
}, []);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<XPSystemState>) => {
    setXPState(prev => {
      const updatedState = { ...prev, ...newState };
      console.log('Saving XP state:', updatedState);
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
  while (level < MAX_LEVEL && totalXP >= calculateLevelRequirement(level + 1)) {
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
const nextLevelXP = newLevel >= MAX_LEVEL 
  ? calculateLevelRequirement(newLevel) 
  : calculateLevelRequirement(newLevel + 1);
const xpToNextLevel = newLevel >= MAX_LEVEL ? 0 : nextLevelXP - newTotalXP;

// Determine unlocked rewards
const unlockedRewards: UnlockedReward[] = [];
if (leveledUp) {
  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    if (UNLOCKS_BY_LEVEL[lvl]) {
      unlockedRewards.push(...UNLOCKS_BY_LEVEL[lvl]);
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
  } else if (reward.type === 'biome' && !newBiomes.includes(reward.name)) {
    newBiomes.push(reward.name);
    newCurrentBiome = reward.name; // Auto-switch to new biome
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
  if (xpState.currentLevel >= MAX_LEVEL) return 100;
  const currentLevelXP = calculateLevelRequirement(xpState.currentLevel);
  const nextLevelXP = calculateLevelRequirement(xpState.currentLevel + 1);
  const progressXP = xpState.currentXP - currentLevelXP;
  const totalXPNeeded = Math.max(1, nextLevelXP - currentLevelXP);
  
  return Math.min(100, (progressXP / totalXPNeeded) * 100);
}, [xpState]);

  // Switch biome
  const switchBiome = useCallback((biomeName: string) => {
    console.log('switchBiome called with:', biomeName, 'Available biomes:', xpState.availableBiomes);
    if (xpState.availableBiomes.includes(biomeName)) {
      console.log('Switching biome from', xpState.currentBiome, 'to', biomeName);
      saveState({ currentBiome: biomeName });
    } else {
      console.log('Biome not available:', biomeName);
    }
  }, [xpState.availableBiomes, xpState.currentBiome, saveState]);

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