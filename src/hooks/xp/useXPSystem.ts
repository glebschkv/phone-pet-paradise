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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BIOME_DATABASE, getUnlockedAnimals } from '@/data/AnimalDatabase';
import { xpLogger as logger } from '@/lib/logger';
import { safeJsonParse } from '@/lib/apiUtils';
import { TIER_BENEFITS, isValidSubscriptionTier } from '../usePremiumStatus';
import { useAuth } from '../useAuth';
import { useSupabaseData } from '../useSupabaseData';

import { XPReward, XPSystemState } from './xpTypes';
import {
  STORAGE_KEY,
  XP_UPDATE_EVENT,
  ANIMAL_PURCHASED_EVENT,
  MAX_LEVEL,
  XP_REWARDS,
  UNLOCKS_BY_LEVEL,
} from './xpConstants';
import {
  calculateRandomBonus,
  calculateLevelRequirement,
  normalizeAnimalList,
  calculateLevel,
} from './xpUtils';

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
    const defaultStartingAnimals = getUnlockedAnimals(0).map(a => a.name);

    // Try multiple storage keys for backwards compatibility and data recovery
    // This fixes the dual storage key issue where data might be in either location
    const LEGACY_KEY = 'nomo_xp_system'; // Zustand store key
    const storageKeys = [STORAGE_KEY, LEGACY_KEY];

    let bestData: { currentXP: number; currentLevel: number; unlockedAnimals?: string[]; currentBiome?: string } | null = null;
    let bestDataSource = '';

    for (const key of storageKeys) {
      try {
        const savedData = localStorage.getItem(key);
        if (!savedData) continue;

        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = JSON.parse(savedData);
        } catch {
          logger.warn(`Failed to parse JSON from ${key}, skipping`);
          continue;
        }

        // Handle Zustand's wrapped format { state: {...}, version: ... }
        const stateData = (parsed && typeof parsed === 'object' && 'state' in parsed)
          ? parsed.state as Record<string, unknown>
          : parsed;

        if (!stateData || typeof stateData !== 'object') continue;

        // Extract XP value - try multiple possible field names
        let xpValue = 0;
        if (typeof stateData.currentXP === 'number' && stateData.currentXP >= 0) {
          xpValue = stateData.currentXP;
        } else if (typeof stateData.totalXP === 'number' && stateData.totalXP >= 0) {
          xpValue = stateData.totalXP;
        }

        // Extract level - but we'll recalculate to ensure consistency
        const levelValue = typeof stateData.currentLevel === 'number' ? stateData.currentLevel : 0;

        // Keep the data with the highest XP (most progress)
        if (xpValue > 0 && (!bestData || xpValue > bestData.currentXP)) {
          bestData = {
            currentXP: xpValue,
            currentLevel: levelValue,
            unlockedAnimals: Array.isArray(stateData.unlockedAnimals) ? stateData.unlockedAnimals as string[] : undefined,
            currentBiome: typeof stateData.currentBiome === 'string' ? stateData.currentBiome : undefined,
          };
          bestDataSource = key;
          logger.debug(`Found valid XP data in ${key}: ${xpValue} XP, level ${levelValue}`);
        }
      } catch (error) {
        logger.warn(`Error reading from ${key}:`, error);
      }
    }

    if (bestData && bestData.currentXP > 0) {
      const savedAnimals = normalizeAnimalList(bestData.unlockedAnimals || []);
      const allAnimals = Array.from(new Set([...defaultStartingAnimals, ...savedAnimals]));

      // Recalculate level from saved XP to ensure consistency
      // This prevents level from being reset if only the level field got corrupted
      let level = 0;
      while (level < MAX_LEVEL && bestData.currentXP >= calculateLevelRequirement(level + 1)) {
        level++;
      }

      // Sanity check: if saved level is higher and XP supports it, use the higher level
      // This prevents regression from data inconsistency
      if (bestData.currentLevel > level) {
        const minXPForSavedLevel = calculateLevelRequirement(bestData.currentLevel);
        if (bestData.currentXP >= minXPForSavedLevel * 0.9) {
          // Close enough - likely just rounding, use the saved level
          level = bestData.currentLevel;
        }
      }

      const currentLevelXP = calculateLevelRequirement(level);
      const nextLevelXP = level >= MAX_LEVEL
        ? calculateLevelRequirement(level)
        : calculateLevelRequirement(level + 1);
      const xpToNextLevel = level >= MAX_LEVEL ? 0 : nextLevelXP - bestData.currentXP;

      const availableBiomes = BIOME_DATABASE
        .filter(biome => biome.unlockLevel <= level)
        .map(biome => biome.name);

      const currentBiome = availableBiomes.includes(bestData.currentBiome || '')
        ? bestData.currentBiome!
        : availableBiomes[availableBiomes.length - 1] || 'Meadow';

      const newState = {
        currentXP: bestData.currentXP,
        currentLevel: level,
        xpToNextLevel: Math.max(0, xpToNextLevel),
        totalXPForCurrentLevel: currentLevelXP,
        unlockedAnimals: allAnimals,
        currentBiome,
        availableBiomes,
      };
      setXPState(newState);
      xpStateRef.current = newState;

      // Ensure data is saved to primary key for consistency
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

      logger.debug(`Restored XP state from ${bestDataSource}: Level ${level}, ${bestData.currentXP} XP, ${allAnimals.length} animals`);
    } else {
      // No valid data found - check if there's any corrupted data we should warn about
      const primaryData = localStorage.getItem(STORAGE_KEY);
      const legacyData = localStorage.getItem(LEGACY_KEY);
      if (primaryData || legacyData) {
        logger.warn('Found storage data but could not extract valid XP. Data may be corrupted. Starting fresh.');
        // Don't clear the corrupted data - leave it for potential manual recovery
      } else {
        logger.debug('No saved XP state, starting fresh with animals:', defaultStartingAnimals);
      }

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
        if (isValidSubscriptionTier(parsed.tier)) {
          return TIER_BENEFITS[parsed.tier].xpMultiplier;
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

    const unlockedRewards: typeof UNLOCKS_BY_LEVEL[number] = [];
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
  }, [xpState, calculateXPFromDuration, saveState, getSubscriptionMultiplier, syncToBackend]);

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

    const unlockedRewards: typeof UNLOCKS_BY_LEVEL[number] = [];
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
  }, [xpState, saveState, syncToBackend]);

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
