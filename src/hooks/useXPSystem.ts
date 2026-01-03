import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ANIMAL_DATABASE, BIOME_DATABASE, getUnlockedAnimals } from '@/data/AnimalDatabase';
import { xpLogger as logger } from '@/lib/logger';
import { safeJsonParse } from '@/lib/apiUtils';
import { TIER_BENEFITS, SubscriptionTier } from './usePremiumStatus';
import { useAuth } from './useAuth';
import { useSupabaseData } from './useSupabaseData';

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
  subscriptionMultiplier: number;
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
const ANIMAL_PURCHASED_EVENT = 'petIsland_animalPurchased';

// Random bonus XP system - creates variable rewards (slot machine psychology)
interface BonusResult {
  hasBonusXP: boolean;
  bonusMultiplier: number;
  bonusType: 'none' | 'lucky' | 'super_lucky' | 'jackpot';
}

const calculateRandomBonus = (): BonusResult => {
  const roll = Math.random() * 100;

  // 5% chance: Jackpot (2.5x XP)
  if (roll < 5) {
    return { hasBonusXP: true, bonusMultiplier: 2.5, bonusType: 'jackpot' };
  }
  // 10% chance: Super Lucky (1.75x XP)
  if (roll < 15) {
    return { hasBonusXP: true, bonusMultiplier: 1.75, bonusType: 'super_lucky' };
  }
  // 20% chance: Lucky (1.5x XP)
  if (roll < 35) {
    return { hasBonusXP: true, bonusMultiplier: 1.5, bonusType: 'lucky' };
  }
  // 65% chance: No bonus
  return { hasBonusXP: false, bonusMultiplier: 1.0, bonusType: 'none' };
};

export const MAX_LEVEL = 50 as const;

// XP rewards based on session duration (in minutes)
// Boosted rewards - progression should feel satisfying and impactful!
const XP_REWARDS = {
  25: 25,   // 25 minutes = 25 XP (minimum focus session)
  30: 35,   // 30 minutes = 35 XP - good for quick wins
  45: 55,   // 45 minutes = 55 XP
  60: 80,   // 1 hour = 80 XP - sweet spot for progression
  90: 125,  // 90 minutes (deep work) = 125 XP
  120: 180, // 2 hours = 180 XP
  180: 280, // 3 hours = 280 XP
  240: 400, // 4 hours = 400 XP
  300: 550, // 5 hours = 550 XP
};

// Level progression: XP required for each level
// Early levels are quick (1-2 sessions), mid levels moderate (3-5 sessions), late levels rewarding (5+ sessions)
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
    let totalXP = LEVEL_REQUIREMENTS[LEVEL_REQUIREMENTS.length - 1]; // Level 12 = 530
    let increment = 80; // Starting increment after level 12

    for (let i = LEVEL_REQUIREMENTS.length; i <= level; i++) {
      totalXP += increment;
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

// Export for use in other modules
export { calculateLevelRequirement };

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
  const defaultAnimals = list ?? getUnlockedAnimals(1).map(a => a.name);
  const names = defaultAnimals.map((n) => NAME_MAP[n?.toLowerCase?.() || ''] || n);
  return Array.from(new Set(names));
};

/**
 * Unified XP System Hook
 *
 * This is the consolidated XP system that replaces both useXPSystem and useBackendXPSystem.
 *
 * Architecture:
 * - localStorage is the primary storage (offline-first)
 * - When authenticated, changes sync to Supabase in the background
 * - All operations are synchronous for immediate UI response
 * - Backend sync happens asynchronously without blocking
 *
 * Features:
 * - Boosted XP rewards for satisfying progression
 * - Random bonus system (lucky/super_lucky/jackpot)
 * - Subscription multipliers
 * - Cross-tab synchronization
 * - Direct XP awards (for achievements, rewards, etc.)
 */
export const useXPSystem = () => {
  // Auth and backend sync
  const { isAuthenticated } = useAuth();
  const { progress, updateProgress, addFocusSession } = useSupabaseData();

  // Get proper starting animals (level 0 and 1)
  const startingAnimals = getUnlockedAnimals(0).map(a => a.name);
  logger.debug('Starting animals for level 0:', startingAnimals);

  // Use ref to track latest state for event handlers (fixes stale closure)
  const xpStateRef = useRef<XPSystemState | null>(null);

  const [xpState, setXPState] = useState<XPSystemState>({
    currentXP: 0,
    currentLevel: 0,
    xpToNextLevel: 15,
    totalXPForCurrentLevel: 0,
    unlockedAnimals: startingAnimals,
    currentBiome: 'Meadow',
    availableBiomes: ['Meadow'],
  });

  // Sync state from backend when authenticated and progress loads
  useEffect(() => {
    if (isAuthenticated && progress) {
      const backendLevel = progress.current_level;
      const backendXP = progress.total_xp;

      // Use the higher of local or backend values to prevent regression
      const currentLocal = xpStateRef.current;
      const effectiveLevel = currentLocal
        ? Math.max(backendLevel, currentLocal.currentLevel)
        : backendLevel;
      const effectiveXP = currentLocal
        ? Math.max(backendXP, currentLocal.currentXP)
        : backendXP;

      if (effectiveLevel !== currentLocal?.currentLevel || effectiveXP !== currentLocal?.currentXP) {
        const currentLevelXP = calculateLevelRequirement(effectiveLevel);
        const nextLevelXP = effectiveLevel >= MAX_LEVEL
          ? calculateLevelRequirement(effectiveLevel)
          : calculateLevelRequirement(effectiveLevel + 1);
        const xpToNextLevel = effectiveLevel >= MAX_LEVEL ? 0 : nextLevelXP - effectiveXP;

        const unlockedAnimals = getUnlockedAnimals(effectiveLevel).map(a => a.name);
        const availableBiomes = BIOME_DATABASE
          .filter(biome => biome.unlockLevel <= effectiveLevel)
          .map(biome => biome.name);
        const currentBiome = availableBiomes[availableBiomes.length - 1] || 'Meadow';

        const newState = {
          currentXP: effectiveXP,
          currentLevel: effectiveLevel,
          xpToNextLevel,
          totalXPForCurrentLevel: currentLevelXP,
          unlockedAnimals,
          currentBiome,
          availableBiomes,
        };

        setXPState(newState);
        xpStateRef.current = newState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        logger.debug('Synced with backend:', newState);
      }
    }
  }, [isAuthenticated, progress]);

  // Load saved state from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const defaultStartingAnimals = getUnlockedAnimals(0).map(a => a.name);

    if (savedData) {
      const parsed = safeJsonParse<Partial<XPSystemState> & { currentXP?: number }>(savedData, {});
      logger.debug('Loading saved XP state:', parsed);

      if (parsed && typeof parsed.currentXP === 'number') {
        const savedAnimals = normalizeAnimalList(parsed.unlockedAnimals || []);
        const allAnimals = Array.from(new Set([...defaultStartingAnimals, ...savedAnimals]));

        // Recalculate level from saved XP to ensure consistency
        let level = 0;
        while (level < MAX_LEVEL && parsed.currentXP >= calculateLevelRequirement(level + 1)) {
          level++;
        }

        const currentLevelXP = calculateLevelRequirement(level);
        const nextLevelXP = level >= MAX_LEVEL
          ? calculateLevelRequirement(level)
          : calculateLevelRequirement(level + 1);
        const xpToNextLevel = level >= MAX_LEVEL ? 0 : nextLevelXP - parsed.currentXP;

        const availableBiomes = BIOME_DATABASE
          .filter(biome => biome.unlockLevel <= level)
          .map(biome => biome.name);

        const currentBiome = availableBiomes.includes(parsed.currentBiome || '')
          ? parsed.currentBiome!
          : availableBiomes[availableBiomes.length - 1] || 'Meadow';

        const newState = {
          currentXP: parsed.currentXP || 0,
          currentLevel: level,
          xpToNextLevel: Math.max(0, xpToNextLevel),
          totalXPForCurrentLevel: currentLevelXP,
          unlockedAnimals: allAnimals,
          currentBiome,
          availableBiomes,
        };
        setXPState(newState);
        xpStateRef.current = newState;

        logger.debug(`Restored XP state: Level ${level}, ${parsed.currentXP} XP, ${allAnimals.length} animals`);
      } else {
        logger.warn('Invalid saved XP data, starting fresh');
        const newState = {
          currentXP: 0,
          currentLevel: 0,
          xpToNextLevel: 15,
          totalXPForCurrentLevel: 0,
          unlockedAnimals: defaultStartingAnimals,
          currentBiome: 'Meadow',
          availableBiomes: ['Meadow'],
        };
        setXPState(newState);
        xpStateRef.current = newState;
      }
    } else {
      logger.debug('No saved XP state, starting fresh with animals:', defaultStartingAnimals);
      const newState = {
        currentXP: 0,
        currentLevel: 0,
        xpToNextLevel: 15,
        totalXPForCurrentLevel: 0,
        unlockedAnimals: defaultStartingAnimals,
        currentBiome: 'Meadow',
        availableBiomes: ['Meadow'],
      };
      setXPState(newState);
      xpStateRef.current = newState;
    }
  }, []);

  // Listen for XP updates from other hook instances (cross-component sync)
  useEffect(() => {
    const handleXPUpdate = (event: CustomEvent<XPSystemState>) => {
      logger.debug('XP state updated from another component:', event.detail);
      setXPState(event.detail);
      xpStateRef.current = event.detail;
    };

    window.addEventListener(XP_UPDATE_EVENT, handleXPUpdate as EventListener);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        const parsed = safeJsonParse<XPSystemState>(event.newValue, xpStateRef.current || xpState);
        logger.debug('XP state updated from storage event:', parsed);
        setXPState(parsed);
        xpStateRef.current = parsed;
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(XP_UPDATE_EVENT, handleXPUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [xpState]);

  // Listen for animal purchase events (from shop)
  useEffect(() => {
    const handleAnimalPurchased = (event: CustomEvent<{ animalId: string; animalName: string }>) => {
      logger.debug('Animal purchased:', event.detail);
      const { animalName } = event.detail;

      setXPState(prev => {
        if (prev.unlockedAnimals.includes(animalName)) {
          return prev;
        }

        const updatedState = {
          ...prev,
          unlockedAnimals: [...prev.unlockedAnimals, animalName],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
        xpStateRef.current = updatedState;
        window.dispatchEvent(new CustomEvent(XP_UPDATE_EVENT, { detail: updatedState }));
        return updatedState;
      });
    };

    window.addEventListener(ANIMAL_PURCHASED_EVENT, handleAnimalPurchased as EventListener);

    return () => {
      window.removeEventListener(ANIMAL_PURCHASED_EVENT, handleAnimalPurchased as EventListener);
    };
  }, []);

  // Save state to localStorage and notify other instances
  const saveState = useCallback((newState: Partial<XPSystemState>) => {
    setXPState(prev => {
      const merged = { ...prev, ...newState };
      const normalizedAnimals = normalizeAnimalList(merged.unlockedAnimals);
      const updatedState = { ...merged, unlockedAnimals: normalizedAnimals };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      xpStateRef.current = updatedState;
      window.dispatchEvent(new CustomEvent(XP_UPDATE_EVENT, { detail: updatedState }));
      return updatedState;
    });
  }, []);

  // Sync to backend (fire-and-forget, doesn't block UI)
  const syncToBackend = useCallback(async (newTotalXP: number, newLevel: number, sessionMinutes?: number, xpGained?: number) => {
    if (!isAuthenticated) return;

    try {
      // If this was from a session, record it
      if (sessionMinutes && xpGained) {
        await addFocusSession(sessionMinutes, xpGained);
      }

      // Update user progress
      await updateProgress({
        total_xp: newTotalXP,
        current_level: newLevel,
        last_session_date: new Date().toISOString().split('T')[0]
      });
      logger.debug('Synced to backend:', { newTotalXP, newLevel });
    } catch (error) {
      logger.error('Failed to sync to backend (will retry on next action):', error);
      // Don't throw - local state is source of truth
    }
  }, [isAuthenticated, addFocusSession, updateProgress]);

  // Pre-sorted durations for performance
  const sortedDurations = useMemo(() =>
    Object.keys(XP_REWARDS)
      .map(Number)
      .sort((a, b) => b - a),
    []
  );

  // Helper to get subscription multiplier
  const getSubscriptionMultiplier = useCallback((): number => {
    const premiumData = localStorage.getItem('petIsland_premium');
    if (premiumData) {
      try {
        const parsed = JSON.parse(premiumData);
        const tier = parsed.tier as SubscriptionTier;
        if (tier && TIER_BENEFITS[tier]) {
          return TIER_BENEFITS[tier].xpMultiplier;
        }
      } catch {
        // Invalid data
      }
    }
    return 1;
  }, []);

  // Calculate XP gained from session duration
  const calculateXPFromDuration = useCallback((minutes: number): number => {
    for (const duration of sortedDurations) {
      if (minutes >= duration) {
        return XP_REWARDS[duration as keyof typeof XP_REWARDS];
      }
    }
    return 0;
  }, [sortedDurations]);

  // Calculate current level from total XP
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
    const subscriptionMultiplier = getSubscriptionMultiplier();
    const bonus = calculateRandomBonus();

    const xpAfterSubscription = Math.round(baseXP * subscriptionMultiplier);
    const xpGained = Math.round(xpAfterSubscription * bonus.bonusMultiplier);
    const bonusXP = xpGained - baseXP;

    const oldLevel = xpState.currentLevel;
    const newTotalXP = xpState.currentXP + xpGained;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    const currentLevelXP = calculateLevelRequirement(newLevel);
    const nextLevelXP = newLevel >= MAX_LEVEL
      ? calculateLevelRequirement(newLevel)
      : calculateLevelRequirement(newLevel + 1);
    const xpToNextLevel = newLevel >= MAX_LEVEL ? 0 : nextLevelXP - newTotalXP;

    const unlockedRewards: UnlockedReward[] = [];
    if (leveledUp) {
      for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
        if (UNLOCKS_BY_LEVEL[lvl]) {
          unlockedRewards.push(...UNLOCKS_BY_LEVEL[lvl]);
        }
      }
    }

    const newAnimals = [...xpState.unlockedAnimals];
    unlockedRewards.forEach(reward => {
      if (reward.type === 'animal' && !newAnimals.includes(reward.name)) {
        newAnimals.push(reward.name);
      }
    });

    const newBiomes = BIOME_DATABASE
      .filter(biome => biome.unlockLevel <= newLevel)
      .map(biome => biome.name);

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

    // Sync to backend asynchronously (doesn't block)
    syncToBackend(newTotalXP, newLevel, sessionMinutes, xpGained);

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
      subscriptionMultiplier,
    };
  }, [xpState, calculateXPFromDuration, calculateLevel, saveState, getSubscriptionMultiplier, syncToBackend]);

  // Add direct XP (for achievements, daily login, bonuses, etc.)
  const addDirectXP = useCallback((xpAmount: number): XPReward => {
    const oldLevel = xpState.currentLevel;
    const newTotalXP = xpState.currentXP + xpAmount;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    const currentLevelXP = calculateLevelRequirement(newLevel);
    const nextLevelXP = newLevel >= MAX_LEVEL
      ? calculateLevelRequirement(newLevel)
      : calculateLevelRequirement(newLevel + 1);
    const xpToNextLevel = newLevel >= MAX_LEVEL ? 0 : nextLevelXP - newTotalXP;

    const unlockedRewards: UnlockedReward[] = [];
    if (leveledUp) {
      for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
        if (UNLOCKS_BY_LEVEL[lvl]) {
          unlockedRewards.push(...UNLOCKS_BY_LEVEL[lvl]);
        }
      }
    }

    const newAnimals = [...xpState.unlockedAnimals];
    unlockedRewards.forEach(reward => {
      if (reward.type === 'animal' && !newAnimals.includes(reward.name)) {
        newAnimals.push(reward.name);
      }
    });

    const newBiomes = BIOME_DATABASE
      .filter(biome => biome.unlockLevel <= newLevel)
      .map(biome => biome.name);

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

    // Sync to backend asynchronously
    syncToBackend(newTotalXP, newLevel);

    return {
      xpGained: xpAmount,
      baseXP: xpAmount,
      bonusXP: 0,
      bonusMultiplier: 1,
      hasBonusXP: false,
      bonusType: 'none',
      oldLevel,
      newLevel,
      leveledUp,
      unlockedRewards,
      subscriptionMultiplier: 1,
    };
  }, [xpState, calculateLevel, saveState, syncToBackend]);

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
      currentLevel: 0,
      xpToNextLevel: 15,
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
    addDirectXP,
    getLevelProgress,
    switchBiome,
    resetProgress,
    calculateXPFromDuration,
    getSubscriptionMultiplier,
    // For compatibility with old useBackendXPSystem consumers
    isLoading: false,
  };
};
