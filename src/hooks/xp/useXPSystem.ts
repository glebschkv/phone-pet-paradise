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
import { TIER_BENEFITS, isValidSubscriptionTier, type SubscriptionTier } from '../usePremiumStatus';
import { useAuth } from '../useAuth';
import { useSupabaseData } from '../useSupabaseData';
import { validateXPAmount, validateLevel, validateSessionMinutes } from '@/lib/validation';
// Supabase import removed - sync handled by useSupabaseData

import { XPReward, XPSystemState } from './xpTypes';

/**
 * SECURITY: Rate limiting for client-side debouncing
 * Prevents spam requests before they hit the server
 */
let lastXPAwardTime = 0;
const MIN_XP_AWARD_INTERVAL_MS = 2000; // 2 seconds between XP awards (more restrictive than coins)

function canAwardXP(): boolean {
  const now = Date.now();
  if (now - lastXPAwardTime < MIN_XP_AWARD_INTERVAL_MS) {
    return false;
  }
  lastXPAwardTime = now;
  return true;
}

/**
 * SECURITY: Session tracking for duplicate prevention
 * Tracks session IDs that have been rewarded to prevent double-claiming
 */
const rewardedSessions = new Set<string>();
const MAX_TRACKED_SESSIONS = 100;

function markSessionRewarded(sessionId: string): boolean {
  if (rewardedSessions.has(sessionId)) {
    return false; // Already rewarded
  }

  // Cleanup if too many sessions tracked
  if (rewardedSessions.size >= MAX_TRACKED_SESSIONS) {
    const iterator = rewardedSessions.values();
    const firstValue = iterator.next().value;
    if (firstValue) {
      rewardedSessions.delete(firstValue);
    }
  }

  rewardedSessions.add(sessionId);
  return true;
}

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

// Legacy storage key for migration (petIsland_xpSystem -> nomo_xp_system)
const LEGACY_KEY = 'petIsland_xpSystem';

/**
 * Attempts to extract XP data from a storage object (handles both direct and Zustand formats)
 */
const extractXPData = (data: unknown): { xp: number; level: number; animals?: string[]; biome?: string; totalStudyMinutes?: number } | null => {
  if (!data || typeof data !== 'object') return null;

  // Handle Zustand's wrapped format { state: {...}, version: ... }
  const stateData = ('state' in (data as Record<string, unknown>))
    ? (data as Record<string, unknown>).state as Record<string, unknown>
    : data as Record<string, unknown>;

  if (!stateData || typeof stateData !== 'object') return null;

  // Extract XP (try multiple field names for compatibility)
  const xp = validateXPAmount(stateData.currentXP ?? stateData.totalXP ?? 0);
  if (xp === 0) return null;

  return {
    xp,
    level: validateLevel(stateData.currentLevel),
    animals: Array.isArray(stateData.unlockedAnimals) ? stateData.unlockedAnimals as string[] : undefined,
    biome: typeof stateData.currentBiome === 'string' ? stateData.currentBiome : undefined,
    totalStudyMinutes: typeof stateData.totalStudyMinutes === 'number' ? stateData.totalStudyMinutes : undefined,
  };
};

/**
 * Loads and recovers XP state from localStorage with fallback logic
 */
const loadXPState = (defaultAnimals: string[]): XPSystemState => {
  const defaultState: XPSystemState = {
    currentXP: 0,
    currentLevel: 0,
    xpToNextLevel: 15,
    totalXPForCurrentLevel: 0,
    unlockedAnimals: defaultAnimals,
    currentBiome: 'Meadow',
    availableBiomes: ['Meadow'],
    totalStudyMinutes: 0,
  };

  // Try primary key first, then legacy key
  const storageKeys = [STORAGE_KEY, LEGACY_KEY];
  let bestData: ReturnType<typeof extractXPData> = null;

  for (const key of storageKeys) {
    try {
      const savedData = localStorage.getItem(key);
      if (!savedData) continue;

      const parsed = JSON.parse(savedData);
      const extracted = extractXPData(parsed);

      // Keep the data with the highest XP (most progress)
      if (extracted && (!bestData || extracted.xp > bestData.xp)) {
        bestData = extracted;
        logger.debug(`Found valid XP data in ${key}: ${extracted.xp} XP`);
      }
    } catch {
      logger.warn(`Failed to parse data from ${key}`);
    }
  }

  if (!bestData || bestData.xp === 0) {
    logger.debug('No saved XP state, starting fresh');
    return defaultState;
  }

  // Recalculate level from XP to ensure consistency
  const calculatedLevel = calculateLevel(bestData.xp);

  // Use saved level if it's higher and XP supports it (within 10% tolerance)
  const level = (bestData.level > calculatedLevel &&
    bestData.xp >= calculateLevelRequirement(bestData.level) * 0.9)
    ? bestData.level
    : calculatedLevel;

  const currentLevelXP = calculateLevelRequirement(level);
  const nextLevelXP = level >= MAX_LEVEL ? currentLevelXP : calculateLevelRequirement(level + 1);

  const savedAnimals = normalizeAnimalList(bestData.animals);
  const allAnimals = Array.from(new Set([...defaultAnimals, ...savedAnimals]));

  const availableBiomes = BIOME_DATABASE
    .filter(biome => biome.unlockLevel <= level)
    .map(biome => biome.name);

  const currentBiome = availableBiomes.includes(bestData.biome || '')
    ? bestData.biome!
    : availableBiomes[availableBiomes.length - 1] || 'Meadow';

  const recoveredState: XPSystemState = {
    currentXP: bestData.xp,
    currentLevel: level,
    xpToNextLevel: level >= MAX_LEVEL ? 0 : Math.max(0, nextLevelXP - bestData.xp),
    totalXPForCurrentLevel: currentLevelXP,
    unlockedAnimals: allAnimals,
    currentBiome,
    availableBiomes,
    totalStudyMinutes: bestData.totalStudyMinutes ?? 0,
  };

  // Save to primary key for consistency
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recoveredState));
  logger.debug(`Restored XP state: Level ${level}, ${bestData.xp} XP, ${allAnimals.length} animals`);

  return recoveredState;
};

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
    totalStudyMinutes: 0,
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
          totalStudyMinutes: currentLocal?.totalStudyMinutes ?? 0,
        };

        setXPState(newState);
        xpStateRef.current = newState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        logger.debug('Synced with backend:', newState);
      }
    }
  }, [isAuthenticated, progress]);

  // Load saved state from localStorage using simplified recovery logic
  useEffect(() => {
    const defaultAnimals = getUnlockedAnimals(0).map(a => a.name);
    const recoveredState = loadXPState(defaultAnimals);
    setXPState(recoveredState);
    xpStateRef.current = recoveredState;
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
          return TIER_BENEFITS[parsed.tier as SubscriptionTier].xpMultiplier;
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

  /**
   * SECURITY: Award XP with rate limiting and server validation
   *
   * This function now includes:
   * - Client-side rate limiting to prevent spam
   * - Session ID tracking to prevent duplicate rewards
   * - Server validation for authenticated users
   *
   * @param sessionMinutes - Duration of the focus session
   * @param sessionId - Optional unique session ID for deduplication
   */
  const awardXP = useCallback((sessionMinutes: number, sessionId?: string): XPReward => {
    // SECURITY: Client-side rate limiting
    if (!canAwardXP()) {
      logger.warn('Rate limited: XP award throttled');
      return {
        xpGained: 0,
        baseXP: 0,
        bonusXP: 0,
        bonusMultiplier: 1,
        hasBonusXP: false,
        bonusType: 'none',
        oldLevel: xpState.currentLevel,
        newLevel: xpState.currentLevel,
        leveledUp: false,
        unlockedRewards: [],
        subscriptionMultiplier: 1,
      };
    }

    // SECURITY: Generate session ID if not provided
    const effectiveSessionId = sessionId || `xp_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // SECURITY: Check if session was already rewarded
    if (!markSessionRewarded(effectiveSessionId)) {
      logger.warn('Duplicate XP award attempt blocked:', effectiveSessionId);
      return {
        xpGained: 0,
        baseXP: 0,
        bonusXP: 0,
        bonusMultiplier: 1,
        hasBonusXP: false,
        bonusType: 'none',
        oldLevel: xpState.currentLevel,
        newLevel: xpState.currentLevel,
        leveledUp: false,
        unlockedRewards: [],
        subscriptionMultiplier: 1,
      };
    }

    const validMinutes = validateSessionMinutes(sessionMinutes);
    const baseXP = calculateXPFromDuration(validMinutes);
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

    const newTotalStudyMinutes = (xpState.totalStudyMinutes || 0) + validMinutes;

    saveState({
      currentXP: newTotalXP,
      currentLevel: newLevel,
      xpToNextLevel,
      totalXPForCurrentLevel: currentLevelXP,
      unlockedAnimals: newAnimals,
      currentBiome: newCurrentBiome,
      availableBiomes: newBiomes,
      totalStudyMinutes: newTotalStudyMinutes,
    });

    // SECURITY: Sync to backend asynchronously with server validation
    // The server calculate-xp function validates the session and prevents duplicates
    syncToBackend(newTotalXP, newLevel, validMinutes, xpGained);

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

  /**
   * SECURITY: Add direct XP with rate limiting
   *
   * Used for achievements, daily login, bonuses, etc.
   * Includes rate limiting to prevent abuse.
   */
  const addDirectXP = useCallback((xpAmount: number): XPReward => {
    // SECURITY: Client-side rate limiting
    if (!canAwardXP()) {
      logger.warn('Rate limited: direct XP award throttled');
      return {
        xpGained: 0,
        baseXP: 0,
        bonusXP: 0,
        bonusMultiplier: 1,
        hasBonusXP: false,
        bonusType: 'none',
        oldLevel: xpState.currentLevel,
        newLevel: xpState.currentLevel,
        leveledUp: false,
        unlockedRewards: [],
        subscriptionMultiplier: 1,
      };
    }

    const validAmount = validateXPAmount(xpAmount);
    if (validAmount <= 0) {
      logger.warn('Invalid XP amount:', xpAmount);
      return {
        xpGained: 0,
        baseXP: 0,
        bonusXP: 0,
        bonusMultiplier: 1,
        hasBonusXP: false,
        bonusType: 'none',
        oldLevel: xpState.currentLevel,
        newLevel: xpState.currentLevel,
        leveledUp: false,
        unlockedRewards: [],
        subscriptionMultiplier: 1,
      };
    }

    const oldLevel = xpState.currentLevel;
    const newTotalXP = xpState.currentXP + validAmount;
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
      xpGained: validAmount,
      baseXP: validAmount,
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
      totalStudyMinutes: 0,
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
