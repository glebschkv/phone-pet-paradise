import { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getUnlockedAnimals } from '@/data/AnimalDatabase';
import { syncLogger as logger } from '@/lib/logger';
import { withRetry } from '@/lib/apiUtils';

// Event name for cross-component XP sync
const XP_UPDATE_EVENT = 'petIsland_xpUpdate';

export const useBackendAppState = () => {
  const { isAuthenticated } = useAuth();
  const backendXPSystem = useBackendXPSystem();
  const localXPSystem = useXPSystem();

  // Use the HIGHER level between local and backend to prevent progress regression
  const effectiveLevel = Math.max(backendXPSystem.currentLevel, localXPSystem.currentLevel);

  // Use backend XP system when authenticated, local otherwise
  const xpSystem = isAuthenticated ? backendXPSystem : localXPSystem;
  const achievements = useBackendAchievements();
  const quests = useBackendQuests();
  const streaks = useBackendStreaks();
  const bondSystem = useBondSystem();
  const collection = useCollection();
  const supabaseData = useSupabaseData();
  const coinSystem = useCoinSystem();
  const coinBooster = useCoinBooster();

  const [isLoading, setIsLoading] = useState(false);

  // Real-time subscriptions for progress updates
  useEffect(() => {
    if (!isAuthenticated) return;

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
          // Actually refresh data from Supabase
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
          // Refresh achievements data
          achievements.loadAchievements?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, supabaseData, achievements]);

  // Award XP and coins, trigger all related systems
  const awardXP = useCallback(async (sessionMinutes: number) => {
    // Award coins with booster multiplier
    const boosterMultiplier = coinBooster.getCurrentMultiplier();
    const coinReward = coinSystem.awardCoins(sessionMinutes, boosterMultiplier);
    logger.debug('Coin reward:', coinReward);

    // Use local XP system when not authenticated
    if (!isAuthenticated) {
      logger.debug('Using local XP system (not authenticated)');
      try {
        const reward = localXPSystem.awardXP(sessionMinutes);
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

    setIsLoading(true);
    try {
      // Call Edge Function for server-side XP calculation with retry
      const { data: xpResult, error: xpError } = await withRetry(
        () => supabase.functions.invoke('calculate-xp', { body: { sessionMinutes } }),
        { maxRetries: 2 }
      );

      if (xpError) throw xpError;

      logger.debug('XP calculation result:', xpResult);

      // Record streak progress
      const streakReward = await streaks.recordSession();

      // Update quest progress
      await quests.updateQuestProgress('focus_time', sessionMinutes);

      // Check for achievements with retry
      const { data: achievementResult, error: achievementError } = await withRetry(
        () => supabase.functions.invoke('process-achievements', {
          body: {
            triggerType: 'session_complete',
            sessionMinutes
          }
        }),
        { maxRetries: 2 }
      );

      if (achievementError) {
        logger.error('Achievement processing error:', achievementError);
      } else {
        logger.debug('Achievement processing result:', achievementResult);
      }

      // Update bond system for active pets
      const activePets = supabaseData.pets.filter(pet => pet.is_favorite);
      for (const pet of activePets) {
        bondSystem.interactWithPet(pet.pet_type, 'focus_session');
      }

      // Dispatch custom event to sync other hook instances with new XP state
      // This ensures TopStatusBar and other components using useXPSystem get updated
      const newLevel = xpResult.newLevel;
      const newTotalXP = xpResult.totalXP; // Edge function returns totalXP
      const unlockedAnimals = getUnlockedAnimals(newLevel).map(a => a.name);

      const xpStateUpdate = {
        currentXP: newTotalXP,
        currentLevel: newLevel,
        xpToNextLevel: xpResult.xpToNextLevel,
        totalXPForCurrentLevel: xpResult.currentLevelXP,
        unlockedAnimals,
        currentBiome: backendXPSystem.currentBiome,
        availableBiomes: backendXPSystem.availableBiomes,
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
      logger.error('Error awarding XP:', error);
      toast.error('Failed to save session progress');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, localXPSystem, streaks, quests, bondSystem, supabaseData.pets, backendXPSystem, coinSystem, coinBooster]);

  // Get pet interaction handler
  const interactWithPet = useCallback(async (petType: string, interactionType: string = 'play') => {
    const interaction = await bondSystem.interactWithPet(petType, interactionType);
    
    // Update quest progress for pet interactions
    await quests.updateQuestProgress('pet_interaction', 1);
    
    // For now, just return a simple interaction result
    // TODO: Implement bond level up detection when bondSystem is integrated with backend
    const bondLevelUp = false;
    const newBondLevel = 1;
    
    if (bondLevelUp) {
      toast.success(`Bond Level Up!`, {
        description: `${petType} is now bond level ${newBondLevel}!`
      });
      
      // Check for bond-related achievements
      await achievements.checkAndUnlockAchievements('bond_level', newBondLevel);
    }
    
    return { bondLevelUp, newBondLevel, interaction };
  }, [bondSystem, quests, achievements]);

  // Get level progress percentage
  const getLevelProgress = useCallback(() => {
    return xpSystem.getLevelProgress();
  }, [xpSystem]);

  // Get comprehensive app state
  const getAppState = useCallback(() => {
    // Use effective level (max of local and backend) for unlocked animals
    const unlockedAnimals = getUnlockedAnimals(effectiveLevel).map(a => a.name);

    return {
      // XP System - use effectiveLevel to prevent progress regression
      currentXP: xpSystem.currentXP,
      currentLevel: effectiveLevel,
      xpToNextLevel: xpSystem.xpToNextLevel,
      levelProgress: getLevelProgress(),

      // Coin System
      coinBalance: coinSystem.balance,
      totalCoinsEarned: coinSystem.totalEarned,
      totalCoinsSpent: coinSystem.totalSpent,

      // Booster System
      isBoosterActive: coinBooster.isBoosterActive(),
      activeBooster: coinBooster.activeBooster,
      boosterMultiplier: coinBooster.getCurrentMultiplier(),
      boosterTimeRemaining: coinBooster.getTimeRemainingFormatted(),

      // Collection - use effectiveLevel for unlocked animals
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

      // Loading states - check if isLoading exists (backend systems have it, local don't)
      isLoading: isLoading || ('isLoading' in xpSystem && xpSystem.isLoading) || achievements.isLoading || quests.isLoading || streaks.isLoading,
    };
  }, [
    xpSystem, achievements, quests, streaks, supabaseData,
    getLevelProgress, isLoading, effectiveLevel, coinSystem, coinBooster
  ]);

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

    // Quick access to key data
    ...getAppState(),
  };
};