import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  secret?: boolean; // Hidden until unlocked
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
  updateProgress: (achievementId: string, progress: number) => void;
  checkAndUnlockAchievements: (type: string, value: number) => Achievement[];
  getAchievementsByCategory: (category: string) => Achievement[];
  getTotalAchievementPoints: () => number;
  getCompletionPercentage: () => number;
  shareAchievement: (achievementId: string) => string;
}

const ACHIEVEMENT_STORAGE_KEY = 'achievement-system-data';

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
  {
    id: 'menagerie-master',
    title: 'Menagerie Master',
    description: 'Unlock 25 different pets',
    category: 'collection',
    tier: 'gold',
    icon: '🦁',
    target: 25,
    rewards: [{ type: 'xp', amount: 400, description: '+400 XP' }]
  },
  {
    id: 'legendary-collector',
    title: 'Legendary Collector',
    description: 'Unlock all 50+ pets',
    category: 'collection',
    tier: 'diamond',
    icon: '💎',
    target: 50,
    rewards: [{ type: 'xp', amount: 1500, description: '+1500 XP' }]
  },
  {
    id: 'biome-explorer',
    title: 'Biome Explorer',
    description: 'Unlock all biomes',
    category: 'collection',
    tier: 'platinum',
    icon: '🌍',
    target: 11,
    rewards: [{ type: 'xp', amount: 750, description: '+750 XP' }]
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
  {
    id: 'pet-whisperer',
    title: 'Pet Whisperer',
    description: 'Reach max bond (level 10) with any pet',
    category: 'bond',
    tier: 'gold',
    icon: '✨',
    target: 10,
    rewards: [{ type: 'xp', amount: 250, description: '+250 XP' }]
  },
  {
    id: 'bond-master',
    title: 'Bond Master',
    description: 'Reach max bond with 5 different pets',
    category: 'bond',
    tier: 'platinum',
    icon: '🌟',
    target: 5,
    rewards: [{ type: 'xp', amount: 500, description: '+500 XP' }]
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete 10 focus sessions after 10 PM',
    category: 'special',
    tier: 'silver',
    icon: '🦉',
    target: 10,
    rewards: [{ type: 'xp', amount: 150, description: '+150 XP' }]
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete 10 focus sessions before 6 AM',
    category: 'special',
    tier: 'silver',
    icon: '🐦',
    target: 10,
    rewards: [{ type: 'xp', amount: 150, description: '+150 XP' }]
  },
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
  },
  {
    id: 'zen-master',
    title: 'Zen Master',
    description: 'Complete 100 focus sessions',
    category: 'special',
    tier: 'diamond',
    icon: '🧘‍♂️',
    target: 100,
    secret: true,
    rewards: [{ type: 'xp', amount: 1000, description: '+1000 XP' }]
  }
];

const TIER_POINTS = {
  bronze: 10,
  silver: 25,
  gold: 50,
  platinum: 100,
  diamond: 200
};

export const useAchievementSystem = (): AchievementSystemReturn => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { toast } = useToast();

  // Initialize achievements from definitions
  const initializeAchievements = useCallback(() => {
    const initialized = ACHIEVEMENT_DEFINITIONS.map(def => ({
      ...def,
      progress: 0,
      isUnlocked: false
    }));
    return initialized;
  }, []);

  // Load achievement data
  const loadAchievementData = useCallback(() => {
    try {
      const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setAchievements(data.achievements || initializeAchievements());
      } else {
        setAchievements(initializeAchievements());
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error);
      setAchievements(initializeAchievements());
    }
  }, [initializeAchievements]);

  // Save achievement data
  const saveAchievementData = useCallback((achievementData: Achievement[]) => {
    try {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify({ achievements: achievementData }));
    } catch (error) {
      console.error('Failed to save achievement data:', error);
    }
  }, []);

  // Update progress for specific achievement
  const updateProgress = useCallback((achievementId: string, progress: number) => {
    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.id === achievementId && !achievement.isUnlocked) {
          const newProgress = Math.min(achievement.target, Math.max(0, progress));
          const wasUnlocked = newProgress >= achievement.target && !achievement.isUnlocked;
          
          if (wasUnlocked) {
            toast({
              title: "Achievement Unlocked!",
              description: `${achievement.title} - ${achievement.description}`,
            });
          }

          return {
            ...achievement,
            progress: newProgress,
            isUnlocked: wasUnlocked || achievement.isUnlocked,
            unlockedAt: wasUnlocked ? Date.now() : achievement.unlockedAt
          };
        }
        return achievement;
      });

      saveAchievementData(updated);
      return updated;
    });
  }, [toast, saveAchievementData]);

  // Check and unlock achievements based on activity
  const checkAndUnlockAchievements = useCallback((type: string, value: number): Achievement[] => {
    const newlyUnlocked: Achievement[] = [];

    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.isUnlocked) return achievement;

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
            if (['first-friend', 'pet-collector', 'menagerie-master', 'legendary-collector'].includes(achievement.id)) {
              newProgress = value;
              shouldUpdate = true;
            }
            break;

          case 'biome_unlock':
            if (achievement.id === 'biome-explorer') {
              newProgress = value;
              shouldUpdate = true;
            }
            break;

          case 'bond_level':
            if (['first-bond', 'pet-whisperer'].includes(achievement.id)) {
              newProgress = Math.max(newProgress, value);
              shouldUpdate = true;
            }
            break;

          case 'max_bonds':
            if (achievement.id === 'bond-master') {
              newProgress = value;
              shouldUpdate = true;
            }
            break;

          case 'streak_days':
            if (['perfect-week', 'streak-master'].includes(achievement.id)) {
              newProgress = value;
              shouldUpdate = true;
            }
            break;

          case 'sessions_count':
            if (achievement.id === 'zen-master') {
              newProgress = value;
              shouldUpdate = true;
            }
            break;

          case 'night_sessions':
            if (achievement.id === 'night-owl') {
              newProgress = value;
              shouldUpdate = true;
            }
            break;

          case 'morning_sessions':
            if (achievement.id === 'early-bird') {
              newProgress = value;
              shouldUpdate = true;
            }
            break;
        }

        if (shouldUpdate) {
          const finalProgress = Math.min(achievement.target, newProgress);
          const isNewlyUnlocked = finalProgress >= achievement.target && !achievement.isUnlocked;

          if (isNewlyUnlocked) {
            const unlockedAchievement = {
              ...achievement,
              progress: finalProgress,
              isUnlocked: true,
              unlockedAt: Date.now()
            };
            newlyUnlocked.push(unlockedAchievement);
            return unlockedAchievement;
          }

          return {
            ...achievement,
            progress: finalProgress
          };
        }

        return achievement;
      });

      saveAchievementData(updated);
      return updated;
    });

    return newlyUnlocked;
  }, [saveAchievementData]);

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

  // Initialize on mount
  useEffect(() => {
    loadAchievementData();
  }, [loadAchievementData]);

  return {
    achievements,
    unlockedAchievements,
    updateProgress,
    checkAndUnlockAchievements,
    getAchievementsByCategory,
    getTotalAchievementPoints,
    getCompletionPercentage,
    shareAchievement
  };
};