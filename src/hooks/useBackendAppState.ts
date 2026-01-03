/**
 * useBackendAppState Hook
 *
 * Central state management hook that coordinates all backend systems.
 * Refactored to use refs for stable callbacks and reduce unnecessary recreations.
 *
 * Performance optimizations:
 * - Uses refs to hold latest subsystem values (avoids callback dependency bloat)
 * - Memoized getAppState with proper dependencies
 * - Request cancellation support via RequestManager
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useBackendXPSystem } from './useBackendXPSystem';
import { useXPSystem } from './useXPSystem';
import { useBackendAchievements } from './useBackendAchievements';
import { useBackendQuests } from './useBackendQuests';
import { useBackendStreaks } from './useBackendStreaks';
import { useSupabaseData } from './useSupabaseData';
import { useBondSystem } from './useBondSystem';
import { useCollection } from './useCollection';
import { useCoinSystem } from './useCoinSystem';
import { useCoinBooster } from './useCoinBooster';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getUnlockedAnimals } from '@/data/AnimalDatabase';
import { syncLogger as logger } from '@/lib/logger';
import { withRetry, RequestManager, isAbortError } from '@/lib/apiUtils';

// Event name for cross-component XP sync
const XP_UPDATE_EVENT = 'petIsland_xpUpdate';

// Type definitions for better type safety
interface XPRewardResult {
  xpGained: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  unlockedRewards: Array<{ name: string; description: string }>;
  streakReward: unknown;
  coinReward: number;
}

interface PetInteractionResult {
  bondLevelUp: boolean;
  newBondLevel: number;
  interaction: unknown;
}

export const useBackendAppState = () => {
  const { isAuthenticated } = useAuth();
  const backendXPSystem = useBackendXPSystem();
  const localXPSystem = useXPSystem();
  const achievements = useBackendAchievements();
  const quests = useBackendQuests();
  const streaks = useBackendStreaks();
  const bondSystem = useBondSystem();
  const collection = useCollection();
  const supabaseData = useSupabaseData();
  const coinSystem = useCoinSystem();
  const coinBooster = useCoinBooster();

  const [isLoading, setIsLoading] = useState(false);

  // Request manager for cancellation support
  const requestManagerRef = useRef<RequestManager>(new RequestManager());

  // Use refs to hold latest subsystem values - this prevents callback dependency bloat
  // The callbacks will always have access to the latest values without recreating
  const subsystemsRef = useRef({
    isAuthenticated,
    localXPSystem,
    backendXPSystem,
    streaks,
    quests,
    achievements,
    bondSystem,
    supabaseData,
    coinSystem,
    coinBooster,
  });

  // Update refs whenever subsystems change
  useEffect(() => {
    subsystemsRef.current = {
      isAuthenticated,
      localXPSystem,
      backendXPSystem,
      streaks,
      quests,
      achievements,
      bondSystem,
      supabaseData,
      coinSystem,
      coinBooster,
    };
  });

  // Cleanup pending requests on unmount
  useEffect(() => {
    const manager = requestManagerRef.current;
    return () => {
      manager.abortAll();
    };
  }, []);

  // Use the HIGHER level between local and backend to prevent progress regression
  const effectiveLevel = useMemo(
    () => Math.max(backendXPSystem.currentLevel, localXPSystem.currentLevel),
    [backendXPSystem.currentLevel, localXPSystem.currentLevel]
  );

  // Use backend XP system when authenticated, local otherwise
  const xpSystem = isAuthenticated ? backendXPSystem : localXPSystem;

  // Real-time subscriptions for progress updates
  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('user-progress-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_progress'
        },
        (payload) => {
          logger.debug('Real-time progress update:', payload);
          supabaseData.loadUserData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievements'
        },
        (payload) => {
          logger.debug('Real-time achievement unlock:', payload);
          toast.success('🏆 Achievement Unlocked!', {
            description: payload.new.title
          });
          achievements.loadAchievements?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]); // Reduced dependencies - functions accessed via ref

  // Award XP and coins, trigger all related systems
  // Uses ref pattern to avoid dependency array bloat
  const awardXP = useCallback(async (sessionMinutes: number): Promise<XPRewardResult | null> => {
    const systems = subsystemsRef.current;
    const requestManager = requestManagerRef.current;

    // Award coins with booster multiplier
    const boosterMultiplier = systems.coinBooster.getCurrentMultiplier();
    const coinReward = systems.coinSystem.awardCoins(sessionMinutes, boosterMultiplier);
    logger.debug('Coin reward:', coinReward);

    // Use local XP system when not authenticated
    if (!systems.isAuthenticated) {
      logger.debug('Using local XP system (not authenticated)');
      try {
        const reward = systems.localXPSystem.awardXP(sessionMinutes);
        logger.debug('Local XP reward:', reward);

        // Show notifications for level up
        if (reward.leveledUp) {
          toast.success(`Level up! You reached level ${reward.newLevel}!`);
          reward.unlockedRewards.forEach(unlock => {
            toast.success(`Unlocked: ${unlock.name}!`, {
              description: unlock.description
            });
          });
        }

        return {
          xpGained: reward.xpGained,
          oldLevel: reward.oldLevel,
          newLevel: reward.newLevel,
          leveledUp: reward.leveledUp,
          unlockedRewards: reward.unlockedRewards,
          streakReward: null,
          coinReward
        };
      } catch (error) {
        logger.error('Error awarding local XP:', error);
        return null;
      }
    }

    // Create abort controller for this request
    const controller = requestManager.create();

    setIsLoading(true);
    try {
      // Call Edge Function for server-side XP calculation with retry and cancellation
      const { data: xpResult, error: xpError } = await withRetry(
        (signal) => supabase.functions.invoke('calculate-xp', {
          body: { sessionMinutes }
        }),
        { maxRetries: 2, signal: controller.signal }
      );

      if (xpError) throw xpError;

      logger.debug('XP calculation result:', xpResult);

      // Record streak progress (use latest systems from ref)
      const latestSystems = subsystemsRef.current;
      const streakReward = await latestSystems.streaks.recordSession();

      // Update quest progress
      await latestSystems.quests.updateQuestProgress('focus_time', sessionMinutes);

      // Check for achievements with retry
      const { data: achievementResult, error: achievementError } = await withRetry(
        (signal) => supabase.functions.invoke('process-achievements', {
          body: {
            triggerType: 'session_complete',
            sessionMinutes
          }
        }),
        { maxRetries: 2, signal: controller.signal }
      );

      if (achievementError) {
        logger.error('Achievement processing error:', achievementError);
      } else {
        logger.debug('Achievement processing result:', achievementResult);
      }

      // Update bond system for active pets (parallel execution to avoid N+1)
      const activePets = latestSystems.supabaseData.pets.filter(pet => pet.is_favorite);
      await Promise.all(
        activePets.map(pet => latestSystems.bondSystem.interactWithPet(pet.pet_type, 'focus_session'))
      );

      // Dispatch custom event to sync other hook instances with new XP state
      const newLevel = xpResult.newLevel;
      const newTotalXP = xpResult.totalXP;
      const unlockedAnimals = getUnlockedAnimals(newLevel).map(a => a.name);

      const xpStateUpdate = {
        currentXP: newTotalXP,
        currentLevel: newLevel,
        xpToNextLevel: xpResult.xpToNextLevel,
        totalXPForCurrentLevel: xpResult.currentLevelXP,
        unlockedAnimals,
        currentBiome: latestSystems.backendXPSystem.currentBiome,
        availableBiomes: latestSystems.backendXPSystem.availableBiomes,
      };

      // Dispatch event to notify other hook instances
      window.dispatchEvent(new CustomEvent(XP_UPDATE_EVENT, { detail: xpStateUpdate }));
      logger.debug('Dispatched XP update event for authenticated user:', xpStateUpdate);

      return {
        xpGained: xpResult.xpGained,
        oldLevel: xpResult.oldLevel,
        newLevel: xpResult.newLevel,
        leveledUp: xpResult.leveledUp,
        unlockedRewards: [],
        streakReward,
        coinReward
      };

    } catch (error) {
      // Don't show error for aborted requests
      if (isAbortError(error)) {
        logger.debug('XP award request was cancelled');
        return null;
      }
      logger.error('Error awarding XP:', error);
      toast.error('Failed to save session progress');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - uses refs for all subsystem access

  // Get pet interaction handler
  const interactWithPet = useCallback(async (
    petType: string,
    interactionType: string = 'play'
  ): Promise<PetInteractionResult> => {
    const systems = subsystemsRef.current;

    // Get bond level before interaction to detect level ups
    const previousBondLevel = systems.bondSystem.getBondLevel(petType);

    const interaction = await systems.bondSystem.interactWithPet(petType, interactionType);

    // Update quest progress for pet interactions
    await systems.quests.updateQuestProgress('pet_interaction', 1);

    // Get new bond level after interaction to detect level up
    const newBondLevel = systems.bondSystem.getBondLevel(petType);
    const bondLevelUp = newBondLevel > previousBondLevel;

    if (bondLevelUp) {
      toast.success(`Bond Level Up!`, {
        description: `${petType} is now bond level ${newBondLevel}!`
      });

      // Check for bond-related achievements
      await systems.achievements.checkAndUnlockAchievements('bond_level', newBondLevel);
    }

    return { bondLevelUp, newBondLevel, interaction };
  }, []); // Empty dependency array - uses refs

  // Get level progress percentage
  const getLevelProgress = useCallback(() => {
    return xpSystem.getLevelProgress();
  }, [xpSystem]);

  // Memoized app state to prevent unnecessary recalculations
  const appState = useMemo(() => {
    const unlockedAnimals = getUnlockedAnimals(effectiveLevel).map(a => a.name);

    return {
      // XP System
      currentXP: xpSystem.currentXP,
      currentLevel: effectiveLevel,
      xpToNextLevel: xpSystem.xpToNextLevel,
      levelProgress: xpSystem.getLevelProgress(),

      // Coin System
      coinBalance: coinSystem.balance,
      totalCoinsEarned: coinSystem.totalEarned,
      totalCoinsSpent: coinSystem.totalSpent,

      // Booster System
      isBoosterActive: coinBooster.isBoosterActive(),
      activeBooster: coinBooster.activeBooster,
      boosterMultiplier: coinBooster.getCurrentMultiplier(),
      boosterTimeRemaining: coinBooster.getTimeRemainingFormatted(),

      // Collection
      unlockedAnimals,
      currentBiome: xpSystem.currentBiome,
      availableBiomes: xpSystem.availableBiomes,

      // Achievements
      totalAchievements: achievements.achievements.length,
      unlockedAchievements: achievements.unlockedAchievements.length,
      achievementPoints: achievements.getTotalAchievementPoints(),

      // Quests
      activeQuests: quests.activeQuests.length,
      completedQuests: quests.completedQuests.length,

      // Streaks
      currentStreak: streaks.streakData.currentStreak,
      longestStreak: streaks.streakData.longestStreak,
      streakFreezes: streaks.streakData.streakFreezeCount,

      // Backend data
      profile: supabaseData.profile,
      progress: supabaseData.progress,
      pets: supabaseData.pets,

      // Loading states
      isLoading: isLoading ||
        ('isLoading' in xpSystem && xpSystem.isLoading) ||
        achievements.isLoading ||
        quests.isLoading ||
        streaks.isLoading,
    };
  }, [
    xpSystem,
    effectiveLevel,
    coinSystem,
    coinBooster,
    achievements,
    quests,
    streaks,
    supabaseData,
    isLoading,
  ]);

  // Stable getAppState function that returns memoized state
  const getAppState = useCallback(() => appState, [appState]);

  return {
    // Main functions
    awardXP,
    interactWithPet,
    getLevelProgress,
    getAppState,

    // Direct access to subsystems
    xpSystem,
    achievements,
    quests,
    streaks,
    bondSystem,
    collection,
    supabaseData,
    coinSystem,
    coinBooster,

    // Quick access to key data (spread memoized state)
    ...appState,
  };
};
