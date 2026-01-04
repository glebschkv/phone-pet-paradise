/**
 * useBackendAppState Hook
 *
 * Central state management hook that coordinates all game systems.
 * Uses composed hooks for domain-specific state management.
 *
 * Architecture:
 * - Composed hooks handle individual domains (progress, currency, gamification, pets)
 * - This hook orchestrates cross-domain operations (e.g., awarding XP updates multiple systems)
 * - Real-time subscriptions for cross-device sync
 *
 * For simpler use cases, consider using the composed hooks directly:
 * - useProgressState() - XP, levels, biomes
 * - useCurrencyState() - Coins, boosters
 * - useGamificationState() - Achievements, quests, streaks
 * - usePetState() - Pet bonds, interactions
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useProgressState } from './composed/useProgressState';
import { useCurrencyState } from './composed/useCurrencyState';
import { useGamificationState } from './composed/useGamificationState';
import { usePetState } from './composed/usePetState';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncLogger as logger } from '@/lib/logger';

// Type definitions
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

  // Use composed hooks for domain-specific state
  const progress = useProgressState();
  const currency = useCurrencyState();
  const gamification = useGamificationState();
  const pets = usePetState();

  // Refs for callback access without stale closures
  const subsystemsRef = useRef({
    isAuthenticated,
    progress,
    currency,
    gamification,
    pets,
  });

  useEffect(() => {
    subsystemsRef.current = {
      isAuthenticated,
      progress,
      currency,
      gamification,
      pets,
    };
  }, [isAuthenticated, progress, currency, gamification, pets]);

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
          subsystemsRef.current.pets.supabaseData.loadUserData();
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
          subsystemsRef.current.gamification.achievements.loadAchievements?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  /**
   * Award XP and coins, trigger all related systems
   * This is the main cross-domain orchestration function
   */
  const awardXP = useCallback(async (sessionMinutes: number): Promise<XPRewardResult | null> => {
    const { progress, currency, gamification, pets } = subsystemsRef.current;

    try {
      // Award coins with booster multiplier
      const boosterMultiplier = currency.getCurrentMultiplier();
      const coinReward = currency.awardCoins(sessionMinutes, boosterMultiplier);
      logger.debug('Coin reward:', coinReward);

      // Award XP
      const reward = progress.awardXP(sessionMinutes);
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

      // Record streak progress
      const streakReward = await gamification.recordSession();

      // Update quest progress
      await gamification.updateQuestProgress('focus_time', sessionMinutes);

      // Update bond system for active pets
      const activePets = pets.pets.filter(pet => pet.is_favorite);
      await Promise.all(
        activePets.map(pet => pets.bondSystem.interactWithPet(pet.pet_type, 'focus_session'))
      );

      return {
        xpGained: reward.xpGained,
        oldLevel: reward.oldLevel,
        newLevel: reward.newLevel,
        leveledUp: reward.leveledUp,
        unlockedRewards: reward.unlockedRewards,
        streakReward,
        coinReward
      };
    } catch (error) {
      logger.error('Error awarding XP:', error);
      toast.error('Failed to save session progress');
      return null;
    }
  }, []);

  /**
   * Pet interaction with cross-domain updates
   */
  const interactWithPet = useCallback(async (
    petType: string,
    interactionType: string = 'play'
  ): Promise<PetInteractionResult> => {
    const { pets, gamification } = subsystemsRef.current;

    const result = await pets.interactWithPet(petType, interactionType);

    // Update quest progress for pet interactions
    await gamification.updateQuestProgress('pet_interaction', 1);

    // Check for bond-related achievements
    if (result.bondLevelUp) {
      await gamification.checkAndUnlockAchievements('bond_level', result.newBondLevel);
    }

    return result;
  }, []);

  // Memoized combined app state
  const appState = useMemo(() => ({
    // Progress
    currentXP: progress.currentXP,
    currentLevel: progress.currentLevel,
    xpToNextLevel: progress.xpToNextLevel,
    levelProgress: progress.levelProgress,
    unlockedAnimals: progress.unlockedAnimals,
    currentBiome: progress.currentBiome,
    availableBiomes: progress.availableBiomes,

    // Currency
    coinBalance: currency.coinBalance,
    totalCoinsEarned: currency.totalCoinsEarned,
    totalCoinsSpent: currency.totalCoinsSpent,
    isBoosterActive: currency.isBoosterActive,
    activeBooster: currency.activeBooster,
    boosterMultiplier: currency.boosterMultiplier,
    boosterTimeRemaining: currency.boosterTimeRemaining,

    // Gamification
    totalAchievements: gamification.totalAchievements,
    unlockedAchievements: gamification.unlockedAchievements,
    achievementPoints: gamification.achievementPoints,
    activeQuests: gamification.activeQuests,
    completedQuests: gamification.completedQuests,
    currentStreak: gamification.currentStreak,
    longestStreak: gamification.longestStreak,
    streakFreezes: gamification.streakFreezes,

    // Pets/Backend
    profile: pets.profile,
    progress: pets.progress,
    pets: pets.pets,

    // Loading
    isLoading: progress.isLoading || gamification.isLoading,
  }), [progress, currency, gamification, pets]);

  const getAppState = useCallback(() => appState, [appState]);

  return {
    // Main orchestration functions
    awardXP,
    interactWithPet,
    getLevelProgress: progress.getLevelProgress,
    getAppState,

    // Composed domain hooks for direct access
    // Use these when you need more control or only specific functionality
    progressState: progress,
    currencyState: currency,
    gamificationState: gamification,
    petState: pets,

    // Legacy: Direct subsystem access (deprecated, use composed hooks instead)
    xpSystem: progress,
    achievements: gamification.achievements,
    quests: gamification.quests,
    streaks: gamification.streaks,
    bondSystem: pets.bondSystem,
    collection: pets.collection,
    supabaseData: pets.supabaseData,
    coinSystem: currency,
    coinBooster: currency,

    // Spread state for backwards compatibility
    ...appState,
  };
};

// Export composed hooks for direct use
export {
  useProgressState,
  useCurrencyState,
  useGamificationState,
  usePetState,
} from './composed';
