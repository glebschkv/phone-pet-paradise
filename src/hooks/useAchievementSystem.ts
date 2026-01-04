import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { achievementLogger as logger } from '@/lib/logger';
import {
  Achievement,
  AchievementReward,
  AchievementUnlockEvent,
  ACHIEVEMENT_STORAGE_KEY,
  ACHIEVEMENT_UNLOCK_EVENT,
  ACHIEVEMENT_CLAIMED_EVENT,
  initializeAchievements,
  mergeWithDefinitions,
  calculateRewards,
  loadFromStorage,
  saveToStorage,
  checkAchievementProgress,
  getAchievementsByCategory as getAchievementsByCategoryUtil,
  getTotalAchievementPoints as getTotalAchievementPointsUtil,
  getCompletionPercentage as getCompletionPercentageUtil,
  generateShareText,
  getClaimedAchievementIds,
  isAchievementClaimed
} from '@/services/achievementService';

// Re-export types for backwards compatibility
export type { Achievement, AchievementReward, AchievementUnlockEvent };

export interface AchievementSystemReturn {
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  updateProgress: (achievementId: string, progress: number) => void;
  checkAndUnlockAchievements: (type: string, value: number) => Achievement[];
  getAchievementsByCategory: (category: string) => Achievement[];
  getTotalAchievementPoints: () => number;
  getCompletionPercentage: () => number;
  shareAchievement: (achievementId: string) => string;
  pendingUnlock: AchievementUnlockEvent | null;
  dismissPendingUnlock: () => void;
  claimRewards: (achievementId: string) => { xp: number; coins: number };
  // For compatibility with old useBackendAchievements consumers
  isLoading: boolean;
  loadAchievements?: () => Promise<void>;
}

/**
 * Unified Achievement System Hook
 *
 * This is the consolidated achievement system that replaces both useAchievementSystem
 * and useBackendAchievements.
 *
 * Architecture:
 * - Uses achievementService.ts for all 60+ achievement definitions
 * - localStorage is the primary storage (offline-first)
 * - When authenticated, unlocks sync to Supabase in the background
 * - All operations are synchronous for immediate UI response
 *
 * Features:
 * - Full achievement library (60+ achievements across all categories)
 * - Pending unlock queue with modal display
 * - Reward claiming with race condition prevention
 * - Cross-tab and cross-component synchronization
 * - Optional Supabase sync when authenticated
 */
export const useAchievementSystem = (): AchievementSystemReturn => {
  const { isAuthenticated, user } = useAuth();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pendingUnlock, setPendingUnlock] = useState<AchievementUnlockEvent | null>(null);
  const pendingUnlockQueue = useRef<AchievementUnlockEvent[]>([]);
  // Track claimed achievement IDs synchronously to prevent race conditions
  const claimedIdsRef = useRef<Set<string>>(new Set());
  // Track queued unlock IDs to prevent duplicates from event listeners
  const queuedUnlockIdsRef = useRef<Set<string>>(new Set());
  // Track achievements that need to be queued for unlock notification
  const pendingToQueue = useRef<Achievement[]>([]);

  // Load achievement data from localStorage
  const loadAchievementData = useCallback(() => {
    const loaded = loadFromStorage();
    if (loaded) {
      claimedIdsRef.current = getClaimedAchievementIds();
      setAchievements(loaded);
    } else {
      claimedIdsRef.current = new Set();
      setAchievements(initializeAchievements());
    }
  }, []);

  // Sync achievement unlock to backend (fire-and-forget)
  const syncUnlockToBackend = useCallback(async (achievement: Achievement) => {
    if (!isAuthenticated || !user || !isSupabaseConfigured) return;

    try {
      const xpReward = achievement.rewards.find(r => r.type === 'xp')?.amount || 0;

      const { error } = await supabase
        .from('achievements')
        .insert({
          user_id: user.id,
          title: achievement.title,
          description: achievement.description,
          achievement_type: achievement.category,
          reward_xp: xpReward
        });

      if (error) {
        // Ignore duplicate errors (achievement already synced)
        if (!error.message.includes('duplicate')) {
          logger.error('Failed to sync achievement unlock:', error);
        }
      } else {
        logger.debug('Synced achievement unlock to backend:', achievement.title);
      }
    } catch (error) {
      logger.error('Error syncing achievement unlock:', error);
      // Don't throw - local state is source of truth
    }
  }, [isAuthenticated, user]);

  // Queue an achievement unlock for display
  const queueAchievementUnlock = useCallback((achievement: Achievement) => {
    // Prevent duplicate queuing
    if (queuedUnlockIdsRef.current.has(achievement.id)) {
      return;
    }
    queuedUnlockIdsRef.current.add(achievement.id);

    const rewards = calculateRewards(achievement);
    const event: AchievementUnlockEvent = { achievement, rewards };

    // Use functional update to get current state value (avoids stale closure)
    setPendingUnlock(current => {
      if (current === null) {
        return event;
      } else {
        pendingUnlockQueue.current.push(event);
        return current;
      }
    });

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent(ACHIEVEMENT_UNLOCK_EVENT, { detail: event }));

    // Sync to backend asynchronously
    syncUnlockToBackend(achievement);
  }, [syncUnlockToBackend]);

  // Dismiss the current pending unlock and show next if any
  const dismissPendingUnlock = useCallback(() => {
    if (pendingUnlockQueue.current.length > 0) {
      setPendingUnlock(pendingUnlockQueue.current.shift()!);
    } else {
      setPendingUnlock(null);
    }
  }, []);

  // Claim rewards for an achievement (called externally)
  const claimRewards = useCallback((achievementId: string): { xp: number; coins: number } => {
    // Synchronous check - prevents race conditions from multiple calls
    if (claimedIdsRef.current.has(achievementId)) {
      return { xp: 0, coins: 0 };
    }

    // Also check localStorage for cross-component sync
    if (isAchievementClaimed(achievementId)) {
      claimedIdsRef.current.add(achievementId);
      return { xp: 0, coins: 0 };
    }

    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.isUnlocked || achievement.rewardsClaimed) {
      return { xp: 0, coins: 0 };
    }

    // Mark as claimed IMMEDIATELY in ref to prevent race conditions
    claimedIdsRef.current.add(achievementId);

    const rewards = calculateRewards(achievement);

    // Mark rewards as claimed in state and persist
    setAchievements(prev => {
      const updated = prev.map(a =>
        a.id === achievementId ? { ...a, rewardsClaimed: true } : a
      );
      saveToStorage(updated);
      return updated;
    });

    // Dispatch event for same-tab sync across hook instances
    window.dispatchEvent(new CustomEvent(ACHIEVEMENT_CLAIMED_EVENT, {
      detail: { achievementId }
    }));

    return rewards;
  }, [achievements]);

  // Update progress for specific achievement
  const updateProgress = useCallback((achievementId: string, progress: number) => {
    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.id === achievementId && !achievement.isUnlocked) {
          const newProgress = Math.min(achievement.target, Math.max(0, progress));
          const wasUnlocked = newProgress >= achievement.target && !achievement.isUnlocked;

          if (wasUnlocked) {
            const unlockedAchievement = {
              ...achievement,
              progress: newProgress,
              isUnlocked: true,
              unlockedAt: Date.now(),
              rewardsClaimed: false
            };
            // Add to pending queue ref for processing in useEffect
            pendingToQueue.current.push(unlockedAchievement);
            return unlockedAchievement;
          }

          return {
            ...achievement,
            progress: newProgress
          };
        }
        return achievement;
      });

      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Check and unlock achievements based on activity
  const checkAndUnlockAchievements = useCallback((type: string, value: number): Achievement[] => {
    const newlyUnlocked: Achievement[] = [];

    setAchievements(prev => {
      const updated = prev.map(achievement => {
        const { shouldUpdate, newProgress } = checkAchievementProgress(achievement, type, value);

        if (shouldUpdate) {
          const isNewlyUnlocked = newProgress >= achievement.target && !achievement.isUnlocked;

          if (isNewlyUnlocked) {
            const unlockedAchievement = {
              ...achievement,
              progress: newProgress,
              isUnlocked: true,
              unlockedAt: Date.now(),
              rewardsClaimed: false
            };
            // Add to pending queue ref for processing in useEffect
            pendingToQueue.current.push(unlockedAchievement);
            newlyUnlocked.push(unlockedAchievement);
            return unlockedAchievement;
          }

          return {
            ...achievement,
            progress: newProgress
          };
        }

        return achievement;
      });

      saveToStorage(updated);
      return updated;
    });

    return newlyUnlocked;
  }, []);

  // Get achievements by category
  const getAchievementsByCategoryCallback = useCallback((category: string): Achievement[] => {
    return getAchievementsByCategoryUtil(achievements, category);
  }, [achievements]);

  // Calculate total achievement points
  const getTotalAchievementPointsCallback = useCallback((): number => {
    return getTotalAchievementPointsUtil(achievements);
  }, [achievements]);

  // Get completion percentage
  const getCompletionPercentageCallback = useCallback((): number => {
    return getCompletionPercentageUtil(achievements);
  }, [achievements]);

  // Generate shareable achievement text
  const shareAchievement = useCallback((achievementId: string): string => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return '';
    return generateShareText(achievement);
  }, [achievements]);

  // Computed values
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);

  // Process pending unlock queue when achievements change
  useEffect(() => {
    if (pendingToQueue.current.length > 0) {
      const toQueue = [...pendingToQueue.current];
      pendingToQueue.current = [];
      toQueue.forEach(achievement => {
        queueAchievementUnlock(achievement);
      });
    }
  }, [achievements, queueAchievementUnlock]);

  // Initialize on mount and listen for storage changes (cross-component sync)
  useEffect(() => {
    loadAchievementData();

    // Listen for storage changes from other components/tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACHIEVEMENT_STORAGE_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          const merged = mergeWithDefinitions(data.achievements || []);
          // Update claimed IDs ref
          claimedIdsRef.current = getClaimedAchievementIds();
          setAchievements(merged);
        } catch (error) {
          // Error already logged in mergeWithDefinitions if needed
        }
      }
    };

    // Listen for claim events from other hook instances in the same tab
    const handleClaimEvent = (e: CustomEvent<{ achievementId: string }>) => {
      const { achievementId } = e.detail;
      // Update ref immediately
      claimedIdsRef.current.add(achievementId);
      // Update state to reflect the claim
      setAchievements(prev =>
        prev.map(a =>
          a.id === achievementId ? { ...a, rewardsClaimed: true } : a
        )
      );
    };

    // Listen for unlock events from other hook instances (syncs pendingUnlock across instances)
    const handleUnlockEvent = (e: CustomEvent<AchievementUnlockEvent>) => {
      const unlockEvent = e.detail;
      // Prevent duplicates - check if already queued
      if (queuedUnlockIdsRef.current.has(unlockEvent.achievement.id)) {
        return;
      }
      queuedUnlockIdsRef.current.add(unlockEvent.achievement.id);

      // Queue this unlock in this hook instance too (use functional update to avoid stale closure)
      setPendingUnlock(current => {
        if (current === null) {
          return unlockEvent;
        } else {
          pendingUnlockQueue.current.push(unlockEvent);
          return current;
        }
      });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(ACHIEVEMENT_CLAIMED_EVENT, handleClaimEvent as EventListener);
    window.addEventListener(ACHIEVEMENT_UNLOCK_EVENT, handleUnlockEvent as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(ACHIEVEMENT_CLAIMED_EVENT, handleClaimEvent as EventListener);
      window.removeEventListener(ACHIEVEMENT_UNLOCK_EVENT, handleUnlockEvent as EventListener);
    };
  }, [loadAchievementData]);

  // Check achievement-based achievements when unlocks change
  useEffect(() => {
    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    if (unlockedCount > 0) {
      // Check meta achievements (achievements about achievements)
      const achievementHunter = achievements.find(a => a.id === 'achievement-hunter');
      const completionist = achievements.find(a => a.id === 'completionist');

      if (achievementHunter && !achievementHunter.isUnlocked && unlockedCount >= achievementHunter.target) {
        checkAndUnlockAchievements('achievements_unlocked', unlockedCount);
      }

      const nonSecretCount = achievements.filter(a => !a.secret && a.isUnlocked).length;
      if (completionist && !completionist.isUnlocked && nonSecretCount >= completionist.target) {
        checkAndUnlockAchievements('achievements_unlocked', nonSecretCount);
      }
    }
  }, [achievements, checkAndUnlockAchievements]);

  // Async load function for compatibility with useBackendAchievements
  const loadAchievements = useCallback(async () => {
    loadAchievementData();

    // If authenticated, also fetch from backend and merge
    if (isAuthenticated && user && isSupabaseConfigured) {
      try {
        const { data: backendAchievements, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          logger.error('Failed to fetch backend achievements:', error);
          return;
        }

        if (backendAchievements && backendAchievements.length > 0) {
          // Merge backend unlocks with local state
          setAchievements(prev => {
            const updated = prev.map(achievement => {
              const backendMatch = backendAchievements.find(
                ba => ba.title === achievement.title
              );

              if (backendMatch && !achievement.isUnlocked) {
                return {
                  ...achievement,
                  isUnlocked: true,
                  unlockedAt: new Date(backendMatch.unlocked_at).getTime(),
                  progress: achievement.target
                };
              }
              return achievement;
            });

            saveToStorage(updated);
            return updated;
          });
        }
      } catch (error) {
        logger.error('Error loading backend achievements:', error);
      }
    }
  }, [loadAchievementData, isAuthenticated, user]);

  return {
    achievements,
    unlockedAchievements,
    updateProgress,
    checkAndUnlockAchievements,
    getAchievementsByCategory: getAchievementsByCategoryCallback,
    getTotalAchievementPoints: getTotalAchievementPointsCallback,
    getCompletionPercentage: getCompletionPercentageCallback,
    shareAchievement,
    pendingUnlock,
    dismissPendingUnlock,
    claimRewards,
    // For compatibility with old useBackendAchievements consumers
    isLoading: false,
    loadAchievements
  };
};
