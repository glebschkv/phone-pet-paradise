import { useState, useEffect, useCallback } from 'react';
import { useSupabaseData } from './useSupabaseData';
import { useAuth } from './useAuth';
import { ANIMAL_DATABASE, BIOME_DATABASE, getUnlockedAnimals } from '@/data/AnimalDatabase';
import { toast } from 'sonner';

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

export const useBackendXPSystem = () => {
  const { isAuthenticated } = useAuth();
  const { progress, updateProgress, addFocusSession } = useSupabaseData();
  
  const [xpState, setXPState] = useState<XPSystemState>({
    currentXP: 0,
    currentLevel: 1,
    xpToNextLevel: 25,
    totalXPForCurrentLevel: 0,
    unlockedAnimals: getUnlockedAnimals(1).map(a => a.name),
    currentBiome: 'Meadow',
    availableBiomes: ['Meadow'],
  });

  // Sync with backend progress data
  useEffect(() => {
    if (isAuthenticated && progress) {
      const currentLevel = progress.current_level;
      const currentXP = progress.total_xp;
      const currentLevelXP = calculateLevelRequirement(currentLevel);
      const nextLevelXP = currentLevel >= MAX_LEVEL 
        ? calculateLevelRequirement(currentLevel) 
        : calculateLevelRequirement(currentLevel + 1);
      const xpToNextLevel = currentLevel >= MAX_LEVEL ? 0 : nextLevelXP - currentXP;

      // Calculate unlocked animals and biomes based on level
      const unlockedAnimals = getUnlockedAnimals(currentLevel).map(a => a.name);
      const availableBiomes = ['Meadow'];
      let currentBiome = 'Meadow';

      for (let lvl = 1; lvl <= currentLevel; lvl++) {
        if (UNLOCKS_BY_LEVEL[lvl]) {
          UNLOCKS_BY_LEVEL[lvl].forEach(reward => {
            if (reward.type === 'animal' && !unlockedAnimals.includes(reward.name)) {
              unlockedAnimals.push(reward.name);
            } else if (reward.type === 'biome' && !availableBiomes.includes(reward.name)) {
              availableBiomes.push(reward.name);
              currentBiome = reward.name; // Auto-switch to latest biome
            }
          });
        }
      }

      setXPState({
        currentXP,
        currentLevel,
        xpToNextLevel,
        totalXPForCurrentLevel: currentLevelXP,
        unlockedAnimals,
        currentBiome,
        availableBiomes,
      });
    }
  }, [isAuthenticated, progress]);

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
  const awardXP = useCallback(async (sessionMinutes: number): Promise<XPReward> => {
    if (!isAuthenticated || !progress) {
      throw new Error('Must be authenticated to award XP');
    }

    const xpGained = calculateXPFromDuration(sessionMinutes);
    const oldLevel = progress.current_level;
    const newTotalXP = progress.total_xp + xpGained;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    // Determine unlocked rewards
    const unlockedRewards: UnlockedReward[] = [];
    if (leveledUp) {
      for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
        if (UNLOCKS_BY_LEVEL[lvl]) {
          unlockedRewards.push(...UNLOCKS_BY_LEVEL[lvl]);
        }
      }
    }

    try {
      // Save focus session and update progress
      await addFocusSession(sessionMinutes, xpGained);
      
      // Update user progress
      await updateProgress({
        total_xp: newTotalXP,
        current_level: newLevel,
        total_sessions: progress.total_sessions + 1,
        last_session_date: new Date().toISOString().split('T')[0]
      });

      // Show level up notifications
      if (leveledUp) {
        toast.success(`Level up! You reached level ${newLevel}!`);
        
        unlockedRewards.forEach(reward => {
          toast.success(`Unlocked: ${reward.name}!`, {
            description: reward.description
          });
        });
      }

      return {
        xpGained,
        oldLevel,
        newLevel,
        leveledUp,
        unlockedRewards,
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      toast.error('Failed to save session progress');
      throw error;
    }
  }, [isAuthenticated, progress, calculateXPFromDuration, calculateLevel, addFocusSession, updateProgress]);

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
      setXPState(prev => ({
        ...prev,
        currentBiome: biomeName
      }));
    }
  }, [xpState.availableBiomes]);

  return {
    ...xpState,
    awardXP,
    getLevelProgress,
    switchBiome,
    calculateXPFromDuration,
    isLoading: !progress && isAuthenticated,
  };
};