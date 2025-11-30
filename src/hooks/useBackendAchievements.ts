import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ACHIEVEMENTS_STORAGE_KEY = 'pet_paradise_achievements';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'focus' | 'collection' | 'social' | 'special' | 'bond';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  secret?: boolean;
  rewards: AchievementReward[];
}

export interface AchievementReward {
  type: 'xp' | 'title' | 'cosmetic' | 'ability';
  amount?: number;
  itemId?: string;
  description: string;
}

export interface AchievementSystemReturn {
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  updateProgress: (achievementId: string, progress: number) => Promise<void>;
  checkAndUnlockAchievements: (type: string, value: number) => Promise<Achievement[]>;
  getAchievementsByCategory: (category: string) => Achievement[];
  getTotalAchievementPoints: () => number;
  getCompletionPercentage: () => number;
  shareAchievement: (achievementId: string) => string;
  isLoading: boolean;
  loadAchievements?: () => Promise<void>;
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedAt'>[] = [
  // FOCUS ACHIEVEMENTS
  {
    id: 'focus-beginner',
    title: 'First Steps',
    description: 'Complete your first 10 minutes of focus time',
    category: 'focus',
    tier: 'bronze',
    icon: '🌱',
    target: 10,
    rewards: [{ type: 'xp', amount: 50, description: '+50 XP' }]
  },
  {
    id: 'focus-warrior',
    title: 'Focus Warrior',
    description: 'Accumulate 10 hours of total focus time',
    category: 'focus',
    tier: 'silver',
    icon: '⚔️',
    target: 600,
    rewards: [{ type: 'xp', amount: 200, description: '+200 XP' }]
  },
  {
    id: 'focus-master',
    title: 'Focus Master',
    description: 'Reach 100 hours of total focus time',
    category: 'focus',
    tier: 'gold',
    icon: '🏆',
    target: 6000,
    rewards: [{ type: 'xp', amount: 500, description: '+500 XP' }]
  },
  {
    id: 'focus-legend',
    title: 'Focus Legend',
    description: 'Achieve 500 hours of total focus time',
    category: 'focus',
    tier: 'platinum',
    icon: '👑',
    target: 30000,
    rewards: [{ type: 'xp', amount: 1000, description: '+1000 XP' }]
  },
  {
    id: 'marathon-master',
    title: 'Marathon Master',
    description: 'Complete a 4-hour focus session',
    category: 'focus',
    tier: 'gold',
    icon: '🏃‍♂️',
    target: 240,
    rewards: [{ type: 'xp', amount: 300, description: '+300 XP' }]
  },

  // COLLECTION ACHIEVEMENTS
  {
    id: 'first-friend',
    title: 'First Friend',
    description: 'Unlock your first pet companion',
    category: 'collection',
    tier: 'bronze',
    icon: '🐾',
    target: 1,
    rewards: [{ type: 'xp', amount: 25, description: '+25 XP' }]
  },
  {
    id: 'pet-collector',
    title: 'Pet Collector',
    description: 'Unlock 10 different pets',
    category: 'collection',
    tier: 'silver',
    icon: '🦋',
    target: 10,
    rewards: [{ type: 'xp', amount: 150, description: '+150 XP' }]
  },

  // BOND ACHIEVEMENTS
  {
    id: 'first-bond',
    title: 'First Bond',
    description: 'Reach bond level 5 with any pet',
    category: 'bond',
    tier: 'bronze',
    icon: '💕',
    target: 5,
    rewards: [{ type: 'xp', amount: 100, description: '+100 XP' }]
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete focus sessions for 7 consecutive days',
    category: 'special',
    tier: 'gold',
    icon: '📅',
    target: 7,
    rewards: [{ type: 'xp', amount: 300, description: '+300 XP' }]
  },
  {
    id: 'streak-master',
    title: 'Streak Master',
    description: 'Maintain a 30-day focus streak',
    category: 'special',
    tier: 'platinum',
    icon: '🔥',
    target: 30,
    rewards: [{ type: 'xp', amount: 600, description: '+600 XP' }]
  }
];

const TIER_POINTS = {
  bronze: 10,
  silver: 25,
  gold: 50,
  platinum: 100,
  diamond: 200
};

export const useBackendAchievements = (): AchievementSystemReturn => {
  const { user, isAuthenticated, isGuestMode } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // localStorage helpers
  const saveAchievementsToStorage = useCallback((achievementsData: Achievement[]) => {
    try {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievementsData));
    } catch (error) {
      console.error('Error saving achievements to localStorage:', error);
    }
  }, []);

  const loadAchievementsFromStorage = useCallback((): Achievement[] | null => {
    try {
      const data = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading achievements from localStorage:', error);
      return null;
    }
  }, []);

  // Initialize achievements from definitions
  const initializeAchievements = useCallback(() => {
    return ACHIEVEMENT_DEFINITIONS.map(def => ({
      ...def,
      progress: 0,
      isUnlocked: false
    }));
  }, []);

  // Load achievements from backend or localStorage
  const loadAchievements = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);

    // For guest mode, use localStorage
    if (isGuestMode) {
      const savedAchievements = loadAchievementsFromStorage();
      if (savedAchievements && savedAchievements.length > 0) {
        setAchievements(savedAchievements);
      } else {
        const initialized = initializeAchievements();
        setAchievements(initialized);
        saveAchievementsToStorage(initialized);
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data: backendAchievements, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Merge with definitions
      const merged = ACHIEVEMENT_DEFINITIONS.map(def => {
        const backendAchievement = backendAchievements?.find(a => a.title === def.title);

        return {
          ...def,
          progress: 0, // Will be calculated from backend data
          isUnlocked: !!backendAchievement,
          unlockedAt: backendAchievement?.unlocked_at ? new Date(backendAchievement.unlocked_at).getTime() : undefined
        };
      });

      setAchievements(merged);
    } catch (error) {
      console.error('Error loading achievements:', error);
      // Fall back to localStorage on error
      const savedAchievements = loadAchievementsFromStorage();
      if (savedAchievements && savedAchievements.length > 0) {
        setAchievements(savedAchievements);
      } else {
        setAchievements(initializeAchievements());
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, isGuestMode, initializeAchievements, loadAchievementsFromStorage, saveAchievementsToStorage]);

  // Update progress for specific achievement
  const updateProgress = useCallback(async (achievementId: string, progress: number) => {
    if (!isAuthenticated || !user) return;

    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.isUnlocked) return;

    const newProgress = Math.min(achievement.target, Math.max(0, progress));
    const shouldUnlock = newProgress >= achievement.target;

    // Update local state immediately
    const updateLocalState = (unlock: boolean) => {
      setAchievements(prev => {
        const updated = prev.map(a =>
          a.id === achievementId
            ? { ...a, progress: newProgress, isUnlocked: unlock, unlockedAt: unlock ? Date.now() : a.unlockedAt }
            : a
        );
        if (isGuestMode) {
          saveAchievementsToStorage(updated);
        }
        return updated;
      });

      if (unlock) {
        toast.success("Achievement Unlocked!", {
          description: `${achievement.title} - ${achievement.description}`,
        });
      }
    };

    // For guest mode, just update locally
    if (isGuestMode) {
      updateLocalState(shouldUnlock);
      return;
    }

    // Update local state first
    updateLocalState(shouldUnlock);

    // If unlocked, save to backend
    if (shouldUnlock) {
      try {
        const { error } = await supabase
          .from('achievements')
          .insert({
            user_id: user.id,
            title: achievement.title,
            description: achievement.description,
            achievement_type: achievement.category,
            reward_xp: achievement.rewards.find(r => r.type === 'xp')?.amount || 0
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving achievement:', error);
        // For non-guest mode, revert on error
        if (!isGuestMode) {
          setAchievements(prev => prev.map(a =>
            a.id === achievementId
              ? { ...a, isUnlocked: false, unlockedAt: undefined }
              : a
          ));
        }
      }
    }
  }, [isAuthenticated, user, achievements, isGuestMode, saveAchievementsToStorage]);

  // Check and unlock achievements based on activity
  const checkAndUnlockAchievements = useCallback(async (type: string, value: number): Promise<Achievement[]> => {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.isUnlocked) continue;

      let shouldUpdate = false;
      let newProgress = achievement.progress;

      // Map activity types to achievement checks
      switch (type) {
        case 'focus_time':
          if (['focus-beginner', 'focus-warrior', 'focus-master', 'focus-legend'].includes(achievement.id)) {
            newProgress = value;
            shouldUpdate = true;
          }
          if (achievement.id === 'marathon-master' && value >= 240) {
            newProgress = value;
            shouldUpdate = true;
          }
          break;

        case 'pet_unlock':
          if (['first-friend', 'pet-collector'].includes(achievement.id)) {
            newProgress = value;
            shouldUpdate = true;
          }
          break;

        case 'bond_level':
          if (achievement.id === 'first-bond') {
            newProgress = Math.max(newProgress, value);
            shouldUpdate = true;
          }
          break;

        case 'streak_days':
          if (['perfect-week', 'streak-master'].includes(achievement.id)) {
            newProgress = value;
            shouldUpdate = true;
          }
          break;
      }

      if (shouldUpdate && newProgress >= achievement.target) {
        await updateProgress(achievement.id, newProgress);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }, [achievements, updateProgress]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category: string): Achievement[] => {
    return achievements.filter(a => a.category === category);
  }, [achievements]);

  // Calculate total achievement points
  const getTotalAchievementPoints = useCallback((): number => {
    return achievements
      .filter(a => a.isUnlocked)
      .reduce((total, achievement) => total + TIER_POINTS[achievement.tier], 0);
  }, [achievements]);

  // Get completion percentage
  const getCompletionPercentage = useCallback((): number => {
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.isUnlocked).length;
    return total > 0 ? Math.round((unlocked / total) * 100) : 0;
  }, [achievements]);

  // Generate shareable achievement text
  const shareAchievement = useCallback((achievementId: string): string => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.isUnlocked) return '';

    return `🏆 Achievement Unlocked: ${achievement.title}\n${achievement.description}\n\nShare your focus journey! #PetParadise #FocusAchievement`;
  }, [achievements]);

  // Computed values
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);

  // Load on mount and auth change
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  return {
    achievements,
    unlockedAchievements,
    updateProgress,
    checkAndUnlockAchievements,
    getAchievementsByCategory,
    getTotalAchievementPoints,
    getCompletionPercentage,
    shareAchievement,
    isLoading,
    loadAchievements,
  };
};