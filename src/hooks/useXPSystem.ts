import { useState, useEffect, useCallback } from 'react';
import { ANIMAL_DATABASE, BIOME_DATABASE, getUnlockedAnimals } from '@/data/AnimalDatabase';

export interface XPReward {
  xpGained: number;
  baseXP: number;
  bonusXP: number;
  bonusMultiplier: number;
  hasBonusXP: boolean;
  bonusType: 'none' | 'lucky' | 'super_lucky' | 'jackpot';
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
const XP_UPDATE_EVENT = 'petIsland_xpUpdate';
const LOGIN_REWARD_EVENT = 'petIsland_dailyLoginReward';

// Random bonus XP system - creates variable rewards (slot machine psychology)
// 20% chance of bonus, with different tiers
interface BonusResult {
  hasBonusXP: boolean;
  bonusMultiplier: number;
  bonusType: 'none' | 'lucky' | 'super_lucky' | 'jackpot';
}

const calculateRandomBonus = (): BonusResult => {
  const roll = Math.random() * 100;

  // 2% chance: Jackpot (2x XP)
  if (roll < 2) {
    return { hasBonusXP: true, bonusMultiplier: 2.0, bonusType: 'jackpot' };
  }
  // 5% chance: Super Lucky (1.5x XP)
  if (roll < 7) {
    return { hasBonusXP: true, bonusMultiplier: 1.5, bonusType: 'super_lucky' };
  }
  // 13% chance: Lucky (1.25x XP)
  if (roll < 20) {
    return { hasBonusXP: true, bonusMultiplier: 1.25, bonusType: 'lucky' };
  }
  // 80% chance: No bonus
  return { hasBonusXP: false, bonusMultiplier: 1.0, bonusType: 'none' };
};

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
    currentLevel: 0, // Start at level 0 to include Meadow Hare
    xpToNextLevel: 15, // Level 1 requires 15 XP
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

      // Recalculate available biomes from BIOME_DATABASE based on level
      // This ensures biomes always match current database, not old localStorage data
      const availableBiomes = BIOME_DATABASE
        .filter(biome => biome.unlockLevel <= level)
        .map(biome => biome.name);

      // Validate currentBiome against available biomes
      const currentBiome = availableBiomes.includes(parsed.currentBiome)
        ? parsed.currentBiome
        : availableBiomes[availableBiomes.length - 1] || 'Meadow';

      setXPState({
        currentXP: parsed.currentXP || 0,
        currentLevel: level,
        xpToNextLevel: Math.max(0, xpToNextLevel),
        totalXPForCurrentLevel: currentLevelXP,
        unlockedAnimals: allAnimals,
        currentBiome,
        availableBiomes,
      });

      console.log(`Restored XP state: Level ${level}, ${parsed.currentXP} XP, ${allAnimals.length} animals`);
    } catch (error) {
      console.error('Failed to load saved XP state:', error);
      // Fall back to defaults
      const startingAnimals = getUnlockedAnimals(0).map(a => a.name);
      setXPState({
        currentXP: 0,
        currentLevel: 0,
        xpToNextLevel: 15, // Level 1 requires 15 XP
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
      xpToNextLevel: 15, // Level 1 requires 15 XP
      totalXPForCurrentLevel: 0,
      unlockedAnimals: startingAnimals,
      currentBiome: 'Meadow',
      availableBiomes: ['Meadow'],
    });
  }
}, []);

  // Listen for XP updates from other hook instances (cross-component sync)
  useEffect(() => {
    const handleXPUpdate = (event: CustomEvent<XPSystemState>) => {
      console.log('XP state updated from another component:', event.detail);
      setXPState(event.detail);
    };

    // Listen for custom events from same window (other hook instances)
    window.addEventListener(XP_UPDATE_EVENT, handleXPUpdate as EventListener);

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          console.log('XP state updated from storage event:', parsed);
          setXPState(parsed);
        } catch (error) {
          console.error('Failed to parse XP state from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(XP_UPDATE_EVENT, handleXPUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save state to localStorage and notify other instances
  const saveState = useCallback((newState: Partial<XPSystemState>) => {
    setXPState(prev => {
      const merged = { ...prev, ...newState };
      const normalizedAnimals = normalizeAnimalList(merged.unlockedAnimals);
      const updatedState = { ...merged, unlockedAnimals: normalizedAnimals };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));

      // Dispatch custom event to notify other hook instances in the same window
      window.dispatchEvent(new CustomEvent(XP_UPDATE_EVENT, { detail: updatedState }));

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

  // Award XP and handle level ups with random bonus chance
  const awardXP = useCallback((sessionMinutes: number): XPReward => {
    const baseXP = calculateXPFromDuration(sessionMinutes);

    // Calculate random bonus
    const bonus = calculateRandomBonus();
    const xpGained = Math.round(baseXP * bonus.bonusMultiplier);
    const bonusXP = xpGained - baseXP;

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

    // Add unlocked animals
    unlockedRewards.forEach(reward => {
      if (reward.type === 'animal' && !newAnimals.includes(reward.name)) {
        newAnimals.push(reward.name);
      }
    });

    // Recalculate biomes from BIOME_DATABASE based on new level
    const newBiomes = BIOME_DATABASE
      .filter(biome => biome.unlockLevel <= newLevel)
      .map(biome => biome.name);

    // Auto-switch to newest biome if a new one was unlocked
    const oldBiomes = BIOME_DATABASE
      .filter(biome => biome.unlockLevel <= oldLevel)
      .map(biome => biome.name);
    const newlyUnlockedBiome = newBiomes.find(b => !oldBiomes.includes(b));
    const newCurrentBiome = newlyUnlockedBiome || xpState.currentBiome;

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
      baseXP,
      bonusXP,
      bonusMultiplier: bonus.bonusMultiplier,
      hasBonusXP: bonus.hasBonusXP,
      bonusType: bonus.bonusType,
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
      xpToNextLevel: 15, // Level 1 requires 15 XP
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