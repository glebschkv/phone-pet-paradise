import { useState, useEffect, useCallback } from 'react';

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

// After level 5, each level requires 50 more XP than the previous increment
const calculateLevelRequirement = (level: number): number => {
  if (level <= 5) {
    return LEVEL_REQUIREMENTS[level - 1] || 0;
  }
  
  let totalXP = LEVEL_REQUIREMENTS[4]; // XP for level 5
  let increment = 100; // Starting increment for level 6
  
  for (let i = 6; i <= level; i++) {
    totalXP += increment;
    increment += 50; // Increase by 50 each level
  }
  
  return totalXP;
};

// Animal unlocks for each level
const ANIMAL_UNLOCKS: Record<number, UnlockedReward> = {
  1: { type: 'animal', name: 'Rabbit', description: 'A gentle meadow rabbit', level: 1 },
  2: { type: 'animal', name: 'Fox', description: 'A clever forest fox', level: 2 },
  3: { type: 'animal', name: 'Deer', description: 'A graceful woodland deer', level: 3 },
  4: { type: 'animal', name: 'Owl', description: 'A wise night owl', level: 4 },
  5: { type: 'biome', name: 'Forest Biome', description: 'Unlock the mystical forest realm', level: 5 },
  6: { type: 'animal', name: 'Bear', description: 'A gentle forest guardian', level: 6 },
  7: { type: 'animal', name: 'Wolf', description: 'A loyal pack leader', level: 7 },
  8: { type: 'animal', name: 'Eagle', description: 'A majestic sky hunter', level: 8 },
  9: { type: 'animal', name: 'Turtle', description: 'An ancient wise turtle', level: 9 },
  10: { type: 'biome', name: 'Ocean Biome', description: 'Discover the serene ocean depths', level: 10 },
  // Continue pattern...
};

export const useXPSystem = () => {
  const [xpState, setXPState] = useState<XPSystemState>({
    currentXP: 0,
    currentLevel: 1,
    xpToNextLevel: 25,
    totalXPForCurrentLevel: 0,
    unlockedAnimals: ['Rabbit'], // Start with first animal
    currentBiome: 'Meadow',
    availableBiomes: ['Meadow'],
  });

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
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

  // Calculate XP gained from session duration
  const calculateXPFromDuration = useCallback((minutes: number): number => {
    const sortedDurations = Object.keys(XP_REWARDS)
      .map(Number)
      .sort((a, b) => b - a); // Sort descending

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
      unlockedAnimals: ['Rabbit'],
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