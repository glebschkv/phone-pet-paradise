/**
 * useBackendAppState Hook
 *
 * Central state management hook that coordinates all game systems.
 * Uses unified XP and Achievement systems that handle local/backend sync internally.
 *
 * Architecture:
 * - All systems use localStorage as primary storage (offline-first)
 * - When authenticated, changes sync to Supabase asynchronously
 * - Real-time subscriptions for cross-device sync
 *
 * Performance optimizations:
 * - Uses refs to hold latest subsystem values (avoids callback dependency bloat)
 * - Memoized getAppState with proper dependencies
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useXPSystem } from './useXPSystem';
import { useAchievementSystem } from './useAchievementSystem';
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
  // Use unified XP and Achievement systems - they handle local/backend sync internally
  const xpSystem = useXPSystem();
  const achievements = useAchievementSystem();
  const quests = useBackendQuests();
  const streaks = useBackendStreaks();
  const bondSystem = useBondSystem();
  const collection = useCollection();
  const supabaseData = useSupabaseData();
  const coinSystem = useCoinSystem();
  const coinBooster = useCoinBooster();

  // Use refs to hold latest subsystem values - this prevents callback dependency bloat
  // The callbacks will always have access to the latest values without recreating
  const subsystemsRef = useRef({
    isAuthenticated,
    xpSystem,
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
      xpSystem,
      streaks,
      quests,
      achievements,
      bondSystem,
      supabaseData,
      coinSystem,
      coinBooster,
    };
  }, [isAuthenticated, xpSystem, streaks, quests, achievements, bondSystem, supabaseData, coinSystem, coinBooster]);

  // The unified XP system now handles local/backend sync internally
  // No need to compare levels - the hook returns the effective (max) level
  const effectiveLevel = xpSystem.currentLevel;

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
          // Access via ref to avoid stale closures and dependency bloat
          subsystemsRef.current.supabaseData.loadUserData()?.catch((err: unknown) => {
            logger.error('Real-time data reload failed:', err);
          });
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
          const title = payload?.new?.title;
          toast.success('🏆 Achievement Unlocked!', {
            description: typeof title === 'string' ? title : 'New achievement earned!'
          });
          // Access via ref to avoid stale closures and dependency bloat
          subsystemsRef.current.achievements.loadAchievements?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // Award XP and coins, trigger all related systems
  // The unified XP system handles local storage + backend sync internally
  const awardXP = useCallback(async (sessionMinutes: number): Promise<XPRewardResult | null> => {
    const systems = subsystemsRef.current;

    // Award coins with booster multiplier
    const boosterMultiplier = systems.coinBooster.getCurrentMultiplier();
    const coinReward = systems.coinSystem.awardCoins(sessionMinutes, boosterMultiplier);
    logger.debug('Coin reward:', coinReward);

    try {
      // Use the unified XP system - it handles local storage and backend sync internally
      const reward = systems.xpSystem.awardXP(sessionMinutes);
      logger.debug('XP reward:', reward);

      // Show notifications for level up
      if (reward.leveledUp) {
        toast.success(`Level up! You reached level ${reward.newLevel}!`);
        reward.unlockedRewards.forEach(unlock => {
          toast.success(`Unlocked: ${unlock.name}!`, {
            description: unlock.description
          });
        });
      }

      // NOTE: Streak recording is handled exclusively by useTimerLogic.handleComplete()
      // to avoid double-counting. Do NOT call streaks.recordSession() here.

      // Update quest progress
      await systems.quests.updateQuestProgress('focus_time', sessionMinutes);

      // NOTE: Bond system interactions removed — they awarded phantom XP/bond
      // on every timer completion for every favorite pet, causing unearned rewards.

      return {
        xpGained: reward.xpGained,
        oldLevel: reward.oldLevel,
        newLevel: reward.newLevel,
        leveledUp: reward.leveledUp,
        unlockedRewards: reward.unlockedRewards,
        streakReward: null,
        coinReward: typeof coinReward === 'object' && coinReward !== null ? coinReward.coinsGained : (typeof coinReward === 'number' ? coinReward : 0)
      };
    } catch (error) {
      logger.error('Error awarding XP:', error);
      toast.error('Failed to save session progress');
      return null;
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

      // Loading states (subsystems handle their own loading)
      isLoading:
        xpSystem.isLoading ||
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
