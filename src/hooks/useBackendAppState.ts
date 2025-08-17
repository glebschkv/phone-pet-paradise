import { useState, useEffect, useCallback } from 'react';
import { useBackendXPSystem } from './useBackendXPSystem';
import { useBackendAchievements } from './useBackendAchievements';
import { useBackendQuests } from './useBackendQuests';
import { useBackendStreaks } from './useBackendStreaks';
import { useSupabaseData } from './useSupabaseData';
import { useBondSystem } from './useBondSystem';
import { useCollection } from './useCollection';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBackendAppState = () => {
  const { isAuthenticated } = useAuth();
  const xpSystem = useBackendXPSystem();
  const achievements = useBackendAchievements();
  const quests = useBackendQuests();
  const streaks = useBackendStreaks();
  const bondSystem = useBondSystem();
  const collection = useCollection();
  const supabaseData = useSupabaseData();
  
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
          console.log('Real-time progress update:', payload);
          // Data will be automatically refreshed by useSupabaseData
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
          console.log('Real-time achievement unlock:', payload);
          toast.success('🏆 Achievement Unlocked!', {
            description: payload.new.title
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // Award XP and trigger all related systems
  const awardXP = useCallback(async (sessionMinutes: number) => {
    if (!isAuthenticated) {
      console.warn('Cannot award XP: not authenticated');
      return null;
    }

    setIsLoading(true);
    try {
      // Call Edge Function for server-side XP calculation
      const { data: xpResult, error: xpError } = await supabase.functions.invoke('calculate-xp', {
        body: { sessionMinutes }
      });

      if (xpError) throw xpError;

      console.log('XP calculation result:', xpResult);

      // Record streak progress
      const streakReward = await streaks.recordSession();
      
      // Update quest progress
      await quests.updateQuestProgress('focus_time', sessionMinutes);

      // Check for achievements
      const { data: achievementResult, error: achievementError } = await supabase.functions.invoke('process-achievements', {
        body: { 
          triggerType: 'session_complete',
          sessionMinutes 
        }
      });

      if (achievementError) {
        console.error('Achievement processing error:', achievementError);
      } else {
        console.log('Achievement processing result:', achievementResult);
      }

      // Update bond system for active pets
      const activePets = supabaseData.pets.filter(pet => pet.is_favorite);
      for (const pet of activePets) {
        bondSystem.interactWithPet(pet.pet_type, 'focus_session');
      }

      return {
        xpGained: xpResult.xpGained,
        oldLevel: xpResult.oldLevel,
        newLevel: xpResult.newLevel,
        leveledUp: xpResult.leveledUp,
        unlockedRewards: [],
        streakReward
      };

    } catch (error) {
      console.error('Error awarding XP:', error);
      toast.error('Failed to save session progress');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, streaks, quests, bondSystem, supabaseData.pets]);

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
    return {
      // XP System
      currentXP: xpSystem.currentXP,
      currentLevel: xpSystem.currentLevel,
      xpToNextLevel: xpSystem.xpToNextLevel,
      levelProgress: getLevelProgress(),
      
      // Collection
      unlockedAnimals: xpSystem.unlockedAnimals,
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
      isLoading: isLoading || xpSystem.isLoading || achievements.isLoading || quests.isLoading || streaks.isLoading,
    };
  }, [
    xpSystem, achievements, quests, streaks, supabaseData,
    getLevelProgress, isLoading
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
    
    // Quick access to key data
    ...getAppState(),
  };
};