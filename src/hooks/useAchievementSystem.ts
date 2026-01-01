import { useState, useEffect, useCallback, useRef } from 'react';
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
}

export const useAchievementSystem = (): AchievementSystemReturn => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pendingUnlock, setPendingUnlock] = useState<AchievementUnlockEvent | null>(null);
  const pendingUnlockQueue = useRef<AchievementUnlockEvent[]>([]);
  // Track claimed achievement IDs synchronously to prevent race conditions
  const claimedIdsRef = useRef<Set<string>>(new Set());
  // Track queued unlock IDs to prevent duplicates from event listeners
  const queuedUnlockIdsRef = useRef<Set<string>>(new Set());

  // Load achievement data
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

  // Queue an achievement unlock for display
  const queueAchievementUnlock = useCallback((achievement: Achievement) => {
    // Prevent duplicate queuing
    if (queuedUnlockIdsRef.current.has(achievement.id)) {
      return;
    }
    queuedUnlockIdsRef.current.add(achievement.id);

    const rewards = calculateRewards(achievement);
    const event: AchievementUnlockEvent = { achievement, rewards };

    if (pendingUnlock === null) {
      setPendingUnlock(event);
    } else {
      pendingUnlockQueue.current.push(event);
    }

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent(ACHIEVEMENT_UNLOCK_EVENT, { detail: event }));
  }, [pendingUnlock, calculateRewards]);

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
            queueAchievementUnlock(unlockedAchievement);
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
  }, [queueAchievementUnlock]);

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
            newlyUnlocked.push(unlockedAchievement);
            queueAchievementUnlock(unlockedAchievement);
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
  }, [queueAchievementUnlock]);

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

      // Queue this unlock in this hook instance too
      if (pendingUnlock === null) {
        setPendingUnlock(unlockEvent);
      } else {
        pendingUnlockQueue.current.push(unlockEvent);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(ACHIEVEMENT_CLAIMED_EVENT, handleClaimEvent as EventListener);
    window.addEventListener(ACHIEVEMENT_UNLOCK_EVENT, handleUnlockEvent as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(ACHIEVEMENT_CLAIMED_EVENT, handleClaimEvent as EventListener);
      window.removeEventListener(ACHIEVEMENT_UNLOCK_EVENT, handleUnlockEvent as EventListener);
    };
  }, [loadAchievementData, pendingUnlock]);

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
    claimRewards
  };
};
