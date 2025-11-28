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
// Designed to feel rewarding - a 30 min session should feel impactful
const XP_REWARDS = {
  25: 12,   // 25 minutes = 12 XP (minimum focus session)
  30: 15,   // 30 minutes = 15 XP - good for quick unlocks
  45: 25,   // 45 minutes = 25 XP
  60: 35,   // 1 hour = 35 XP - sweet spot for progression
  90: 55,   // 90 minutes (deep work) = 55 XP
  120: 80,  // 2 hours = 80 XP
  180: 120, // 3 hours = 120 XP
  240: 170, // 4 hours = 170 XP
  300: 230, // 5 hours = 230 XP
};

// Level progression: XP required for each level
// Early levels are quick (1-2 sessions), mid levels moderate (3-5 sessions), late levels rewarding (5+ sessions)
// This creates an addicting but sustainable progression curve
const LEVEL_REQUIREMENTS = [
  0,    // Level 0 (starting - Meadow Hare)
  15,   // Level 1 - Songbird (1 session)
  35,   // Level 2 - Garden Lizard (~2 sessions total)
  60,   // Level 3 - Wild Horse (~3 sessions)
  90,   // Level 4 - Friendly Monster (~4 sessions)
  125,  // Level 5 - Desert Camel + Sunset biome (~5 sessions)
  165,  // Level 6 - Golden Elk
  210,  // Level 7 - Wise Turtle
  260,  // Level 8 - Sunset Stallion
  320,  // Level 9 - Night Bear + Night biome
  385,  // Level 10 - Shadow Serpent
  455,  // Level 11 - Ghost Hare
  530,  // Level 12 - Night Sprite
];

// Memoized level requirement calculation
const levelRequirementCache = new Map<number, number>();

const calculateLevelRequirement = (level: number): number => {
  if (levelRequirementCache.has(level)) {
    return levelRequirementCache.get(level)!;
  }

  let result: number;

  // Use predefined values for levels 0-12
  if (level < LEVEL_REQUIREMENTS.length) {
    result = LEVEL_REQUIREMENTS[level];
  } else {
    // For levels 13+, continue with a smooth progression
    // Base: last defined level's XP + incremental growth
    let totalXP = LEVEL_REQUIREMENTS[LEVEL_REQUIREMENTS.length - 1]; // Level 12 = 530
    let increment = 80; // Starting increment after level 12

    for (let i = LEVEL_REQUIREMENTS.length; i <= level; i++) {
      totalXP += increment;
      // Gradually increase XP needed per level (addicting but challenging)
      // Early teens: 80-100 XP per level (2-3 sessions)
      // Level 20s: 100-150 XP per level (3-5 sessions)
      // Level 30s+: 150-200+ XP per level (5+ sessions for legendaries)
      if (i < 20) {
        increment += 8;  // Small increase for levels 13-19
      } else if (i < 30) {
        increment += 12; // Medium increase for levels 20-29
      } else {
        increment += 15; // Larger increase for legendary tier (30+)
      }
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
    currentLevel: 0, // Start at level 0 to include Black Dog
    xpToNextLevel: 25,
    totalXPForCurrentLevel: 0,
    unlockedAnimals: getUnlockedAnimals(0).map(a => a.name),
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

      // Calculate unlocked animals based on level
      const unlockedAnimals = getUnlockedAnimals(currentLevel).map(a => a.name);
      console.log(`Backend XP: Level ${currentLevel}, unlocked animals:`, unlockedAnimals);

      // Calculate available biomes directly from BIOME_DATABASE based on level
      // This ensures biomes always match current database, not any cached data
      const availableBiomes = BIOME_DATABASE
        .filter(biome => biome.unlockLevel <= currentLevel)
        .map(biome => biome.name);

      // Set current biome to the highest unlocked biome
      const currentBiome = availableBiomes[availableBiomes.length - 1] || 'Meadow';

      console.log(`Backend XP: Available biomes:`, availableBiomes);

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