import { useState, useEffect, useCallback } from 'react';
import { ANIMAL_DATABASE, BIOME_DATABASE, getUnlockedAnimals } from '@/data/AnimalDatabase';

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
  25: 8,    // 25 minutes = 8 XP (minimum focus session)
  30: 10,   // 30 minutes = 10 XP
  45: 15,   // 45 minutes = 15 XP
  60: 25,   // 1 hour = 25 XP
  90: 40,   // 90 minutes (deep work) = 40 XP
  120: 60,  // 2 hours = 60 XP
  180: 100, // 3 hours = 100 XP
  240: 150, // 4 hours = 150 XP
  300: 210, // 5 hours = 210 XP
};

// Level progression: how much total XP needed to reach each level
// Level 0 is the starting level (0 XP), level 1 requires 25 XP, etc.
const LEVEL_REQUIREMENTS = [
  0,   // Level 0 (starting level - included implicitly)
  25,  // Level 1
  50,  // Level 2 (25 + 25)
  75,  // Level 3 (50 + 25)
  125, // Level 4 (75 + 50)
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

// Normalize animal naming across old saves and DB
const NAME_MAP: Record<string, string> = ANIMAL_DATABASE.reduce((acc, a) => {
  acc[a.name.toLowerCase()] = a.name;
  acc[a.id.toLowerCase()] = a.name;
  return acc;
}, {} as Record<string, string>);

const normalizeAnimalList = (list: string[] | undefined): string[] => {
  // If no list provided, get animals unlocked at level 1 (starting level)
  const defaultAnimals = list ?? getUnlockedAnimals(1).map(a => a.name);
  const names = defaultAnimals.map((n) => NAME_MAP[n?.toLowerCase?.() || ''] || n);
  // Deduplicate while preserving order
  return Array.from(new Set(names));
};

export const useXPSystem = () => {
  // Get proper starting animals (level 0 and 1) - Start at level 0 to ensure Black Dog is included
  const startingAnimals = getUnlockedAnimals(0).map(a => a.name);
  console.log('Starting animals for level 0:', startingAnimals);
  
  const [xpState, setXPState] = useState<XPSystemState>({
    currentXP: 0,
    currentLevel: 0, // Start at level 0 to include Black Dog
    xpToNextLevel: 25,
    totalXPForCurrentLevel: 0,
    unlockedAnimals: startingAnimals,
    currentBiome: 'Meadow',
    availableBiomes: ['Meadow'],
  });

// Load saved state from localStorage
useEffect(() => {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      console.log('Loading saved XP state:', parsed);

      // Normalize animal names and ensure starting animals are included
      const startingAnimals = getUnlockedAnimals(0).map(a => a.name);
      const savedAnimals = normalizeAnimalList(parsed.unlockedAnimals || []);
      const allAnimals = Array.from(new Set([...startingAnimals, ...savedAnimals]));

      // Recalculate level from saved XP to ensure consistency
      let level = 0;
      while (level < MAX_LEVEL && parsed.currentXP >= calculateLevelRequirement(level + 1)) {
        level++;
      }

      // Calculate XP to next level
      const currentLevelXP = calculateLevelRequirement(level);
      const nextLevelXP = level >= MAX_LEVEL
        ? calculateLevelRequirement(level)
        : calculateLevelRequirement(level + 1);
      const xpToNextLevel = level >= MAX_LEVEL ? 0 : nextLevelXP - parsed.currentXP;

      setXPState({
        currentXP: parsed.currentXP || 0,
        currentLevel: level,
        xpToNextLevel: Math.max(0, xpToNextLevel),
        totalXPForCurrentLevel: currentLevelXP,
        unlockedAnimals: allAnimals,
        currentBiome: parsed.currentBiome || 'Meadow',
        availableBiomes: parsed.availableBiomes || ['Meadow'],
      });

      console.log(`Restored XP state: Level ${level}, ${parsed.currentXP} XP, ${allAnimals.length} animals`);
    } catch (error) {
      console.error('Failed to load saved XP state:', error);
      // Fall back to defaults
      const startingAnimals = getUnlockedAnimals(0).map(a => a.name);
      setXPState({
        currentXP: 0,
        currentLevel: 0,
        xpToNextLevel: 25,
        totalXPForCurrentLevel: 0,
        unlockedAnimals: startingAnimals,
        currentBiome: 'Meadow',
        availableBiomes: ['Meadow'],
      });
    }
  } else {
    // No saved data - initialize with defaults
    const startingAnimals = getUnlockedAnimals(0).map(a => a.name);
    console.log('No saved XP state, starting fresh with animals:', startingAnimals);
    setXPState({
      currentXP: 0,
      currentLevel: 0,
      xpToNextLevel: 25,
      totalXPForCurrentLevel: 0,
      unlockedAnimals: startingAnimals,
      currentBiome: 'Meadow',
      availableBiomes: ['Meadow'],
    });
  }
}, []);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<XPSystemState>) => {
    setXPState(prev => {
      const merged = { ...prev, ...newState };
      const normalizedAnimals = normalizeAnimalList(merged.unlockedAnimals);
      const updatedState = { ...merged, unlockedAnimals: normalizedAnimals };
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
    
    return 0; // No XP for sessions less than 25 minutes
  }, []);

  // Calculate current level from total XP (starts at level 0)
const calculateLevel = useCallback((totalXP: number): number => {
  let level = 0;
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
    if (xpState.availableBiomes.includes(biomeName)) {
      saveState({ currentBiome: biomeName });
    }
  }, [xpState.availableBiomes, saveState]);

  // Reset progress
  const resetProgress = useCallback(() => {
    const startingAnimals = getUnlockedAnimals(0).map(a => a.name);
    const resetState: XPSystemState = {
      currentXP: 0,
      currentLevel: 0, // Start at level 0
      xpToNextLevel: 25,
      totalXPForCurrentLevel: 0,
      unlockedAnimals: startingAnimals,
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