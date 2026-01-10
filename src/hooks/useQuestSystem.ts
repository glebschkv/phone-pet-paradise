import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { questLogger } from '@/lib/logger';
import { useXPStore } from '@/stores/xpStore';
import { QUEST_CONFIG } from '@/lib/constants';
import type {
  Quest,
  QuestObjective,
  QuestReward,
  QuestSystemReturn,
  QuestObjectiveTemplate,
  QuestTemplate,
} from '@/types/quest-system';

// Re-export types for consumers
export type { Quest, QuestObjective, QuestReward, QuestSystemReturn };

const QUEST_STORAGE_KEY = 'quest-system-data';

// Quest templates for generation - balanced rewards with XP + coins
const DAILY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    title: "Quick Focus",
    description: "Complete a 30-minute focus session",
    objectives: [{ type: 'focus_time', target: 30, description: "Focus for 30 minutes" }],
    rewards: [{ type: 'xp' as const, amount: 75, description: "+75 XP" }, { type: 'coins' as const, amount: 50, description: "+50 coins" }]
  },
  {
    title: "Deep Work",
    description: "Complete a 60-minute focus session",
    objectives: [{ type: 'focus_time', target: 60, description: "Focus for 60 minutes" }],
    rewards: [{ type: 'xp' as const, amount: 150, description: "+150 XP" }, { type: 'coins' as const, amount: 100, description: "+100 coins" }]
  },
  {
    title: "Pet Companion",
    description: "Interact with 3 different pets",
    objectives: [{ type: 'pet_interaction', target: 3, description: "Interact with 3 pets" }],
    rewards: [{ type: 'xp' as const, amount: 50, description: "+50 XP" }, { type: 'coins' as const, amount: 40, description: "+40 coins" }]
  },
  {
    title: "Perfect Focus",
    description: "Complete a session with perfect focus (0 distractions)",
    objectives: [{ type: 'perfect_focus', target: 1, description: "Perfect focus session" }],
    rewards: [{ type: 'xp' as const, amount: 100, description: "+100 XP" }, { type: 'coins' as const, amount: 75, description: "+75 coins" }]
  },
  {
    title: "Double Session",
    description: "Complete 2 focus sessions today",
    objectives: [{ type: 'sessions', target: 2, description: "Complete 2 sessions" }],
    rewards: [{ type: 'xp' as const, amount: 100, description: "+100 XP" }, { type: 'coins' as const, amount: 60, description: "+60 coins" }]
  },
  {
    title: "Bond Builder",
    description: "Increase bond level with any pet",
    objectives: [{ type: 'bond_level', target: 1, description: "Level up a pet bond" }],
    rewards: [{ type: 'xp' as const, amount: 125, description: "+125 XP" }, { type: 'coins' as const, amount: 80, description: "+80 coins" }]
  }
];

const WEEKLY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    title: "Focus Champion",
    description: "Complete 5 hours of total focus time this week",
    objectives: [{ type: 'focus_time', target: 300, description: "Focus for 5 hours total" }],
    rewards: [{ type: 'xp' as const, amount: 500, description: "+500 XP" }, { type: 'coins' as const, amount: 400, description: "+400 coins" }]
  },
  {
    title: "Focus Legend",
    description: "Complete 10 hours of total focus time this week",
    objectives: [{ type: 'focus_time', target: 600, description: "Focus for 10 hours total" }],
    rewards: [{ type: 'xp' as const, amount: 1200, description: "+1200 XP" }, { type: 'coins' as const, amount: 1000, description: "+1000 coins" }]
  },
  {
    title: "Week Warrior",
    description: "Maintain a 7-day focus streak",
    objectives: [{ type: 'streak', target: 7, description: "7-day focus streak" }],
    rewards: [{ type: 'xp' as const, amount: 750, description: "+750 XP" }, { type: 'coins' as const, amount: 600, description: "+600 coins" }]
  },
  {
    title: "Session Master",
    description: "Complete 15 focus sessions this week",
    objectives: [{ type: 'sessions', target: 15, description: "Complete 15 sessions" }],
    rewards: [{ type: 'xp' as const, amount: 800, description: "+800 XP" }, { type: 'coins' as const, amount: 650, description: "+650 coins" }]
  },
  {
    title: "Perfectionist",
    description: "Complete 5 perfect focus sessions (0 distractions)",
    objectives: [{ type: 'perfect_focus', target: 5, description: "5 perfect focus sessions" }],
    rewards: [{ type: 'xp' as const, amount: 600, description: "+600 XP" }, { type: 'coins' as const, amount: 500, description: "+500 coins" }]
  },
  {
    title: "Pet Collector",
    description: "Unlock a new pet",
    objectives: [{ type: 'collection', target: 1, description: "Unlock 1 new pet" }],
    rewards: [{ type: 'xp' as const, amount: 400, description: "+400 XP" }, { type: 'coins' as const, amount: 300, description: "+300 coins" }]
  }
];

const STORY_QUESTS = [
  {
    id: 'story-1',
    title: "Welcome to Paradise",
    description: "Begin your journey by meeting your first companion",
    objectives: [{ type: 'pet_interaction', target: 1, description: "Meet your first pet" }],
    rewards: [{ type: 'pet_unlock', itemId: 'panda', description: "Unlock Panda companion" }, { type: 'xp', amount: 100, description: "+100 XP" }],
    unlockLevel: 1,
    storylineChapter: 1
  },
  {
    id: 'story-2',
    title: "First Focus",
    description: "Complete your first focus session",
    objectives: [{ type: 'focus_time', target: 10, description: "Focus for 10 minutes" }],
    rewards: [{ type: 'xp', amount: 250, description: "+250 XP" }],
    unlockLevel: 1,
    storylineChapter: 1
  },
  {
    id: 'story-3',
    title: "Forest Explorer",
    description: "Unlock the mystical jungle biome",
    objectives: [{ type: 'biome_unlock', target: 1, description: "Reach level 13" }],
    rewards: [{ type: 'pet_unlock', itemId: 'jungle-bird', description: "Unlock Tropical Bird companion" }, { type: 'xp', amount: 400, description: "+400 XP" }],
    unlockLevel: 13,
    storylineChapter: 2
  },
  {
    id: 'story-4',
    title: "Arctic Adventure",
    description: "Brave the harsh tundra lands",
    objectives: [{ type: 'biome_unlock', target: 1, description: "Reach level 19" }],
    rewards: [{ type: 'pet_unlock', itemId: 'arctic-hare', description: "Unlock Arctic Hare companion" }, { type: 'xp', amount: 500, description: "+500 XP" }],
    unlockLevel: 19,
    storylineChapter: 3
  },
  {
    id: 'story-5',
    title: "Legendary Peaks",
    description: "Ascend to the mythical mountains",
    objectives: [{ type: 'biome_unlock', target: 1, description: "Reach level 27" }],
    rewards: [{ type: 'pet_unlock', itemId: 'alpha-bear', description: "Unlock Alpha Bear companion" }, { type: 'xp', amount: 750, description: "+750 XP" }],
    unlockLevel: 27,
    storylineChapter: 4
  }
];

export const useQuestSystem = (): QuestSystemReturn => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const { toast } = useToast();
  const { addXP, addAnimal } = useXPStore();

  // Load quest data
  const loadQuestData = useCallback(() => {
    try {
      const saved = localStorage.getItem(QUEST_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setQuests(data.quests || []);
      }
    } catch (error) {
      questLogger.error('Failed to load quest data:', error);
    }
  }, []);

  // Save quest data
  const saveQuestData = useCallback((questData: Quest[]) => {
    try {
      localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify({ quests: questData }));
    } catch (error) {
      questLogger.error('Failed to save quest data:', error);
    }
  }, []);

  // Generate unique quest ID
  const generateQuestId = useCallback((type: string): string => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create quest from template
  const createQuestFromTemplate = useCallback((template: QuestTemplate, type: 'daily' | 'weekly'): Quest => {
    const now = Date.now();
    const expiresAt = type === 'daily'
      ? now + QUEST_CONFIG.DURATIONS.DAILY_MS
      : now + QUEST_CONFIG.DURATIONS.WEEKLY_MS;

    return {
      id: generateQuestId(type),
      type,
      title: template.title,
      description: template.description,
      objectives: template.objectives.map((obj: QuestObjectiveTemplate) => ({
        id: generateQuestId('objective'),
        description: obj.description,
        target: obj.target,
        current: 0,
        type: obj.type as QuestObjective['type']
      })),
      rewards: template.rewards,
      isCompleted: false,
      progress: {},
      unlockLevel: 1,
      expiresAt
    };
  }, [generateQuestId]);

  // Generate daily quests
  const generateDailyQuests = useCallback(() => {
    const existingDaily = quests.filter(q =>
      q.type === 'daily' && 
      q.expiresAt && 
      q.expiresAt > Date.now()
    );

    if (existingDaily.length === 0) {
      const selectedTemplates = DAILY_QUEST_TEMPLATES
        .sort(() => Math.random() - 0.5)
        .slice(0, QUEST_CONFIG.DAILY_QUEST_COUNT);

      const newDailyQuests = selectedTemplates.map(template => 
        createQuestFromTemplate(template, 'daily')
      );

      setQuests(prev => {
        const filtered = prev.filter(q => q.type !== 'daily' || (q.expiresAt && q.expiresAt > Date.now()));
        const updated = [...filtered, ...newDailyQuests];
        saveQuestData(updated);
        return updated;
      });
    }
  }, [quests, createQuestFromTemplate, saveQuestData]);

  // Generate weekly quests
  const generateWeeklyQuests = useCallback(() => {
    const existingWeekly = quests.filter(q => 
      q.type === 'weekly' && 
      q.expiresAt && 
      q.expiresAt > Date.now()
    );

    if (existingWeekly.length === 0) {
      const selectedTemplate = WEEKLY_QUEST_TEMPLATES[
        Math.floor(Math.random() * WEEKLY_QUEST_TEMPLATES.length)
      ];

      const newWeeklyQuest = createQuestFromTemplate(selectedTemplate, 'weekly');

      setQuests(prev => {
        const filtered = prev.filter(q => q.type !== 'weekly' || (q.expiresAt && q.expiresAt > Date.now()));
        const updated = [...filtered, newWeeklyQuest];
        saveQuestData(updated);
        return updated;
      });
    }
  }, [quests, createQuestFromTemplate, saveQuestData]);

  // Update quest progress
  const updateQuestProgress = useCallback((type: string, amount: number) => {
    setQuests(prev => {
      const updated = prev.map(quest => {
        if (quest.isCompleted) return quest;

        const updatedObjectives = quest.objectives.map(obj => {
          if (obj.type === type) {
            const newCurrent = Math.min(obj.target, obj.current + amount);
            return { ...obj, current: newCurrent };
          }
          return obj;
        });

        const allCompleted = updatedObjectives.every(obj => obj.current >= obj.target);
        
        return {
          ...quest,
          objectives: updatedObjectives,
          isCompleted: allCompleted
        };
      });

      saveQuestData(updated);
      return updated;
    });
  }, [saveQuestData]);

  // Complete quest and claim rewards
  const completeQuest = useCallback((questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.isCompleted) return;

    // Track total XP earned for the toast
    let totalXPEarned = 0;
    const unlockedPets: string[] = [];

    // Process and apply rewards
    quest.rewards.forEach(reward => {
      switch (reward.type) {
        case 'xp':
          if (reward.amount) {
            addXP(reward.amount);
            totalXPEarned += reward.amount;
            questLogger.debug(`Applied ${reward.amount} XP reward from quest ${questId}`);
          }
          break;
        case 'pet_unlock':
          if (reward.itemId) {
            addAnimal(reward.itemId);
            unlockedPets.push(reward.description || reward.itemId);
            questLogger.debug(`Unlocked pet ${reward.itemId} from quest ${questId}`);
          }
          break;
        case 'ability':
        case 'cosmetic':
          // TODO: Implement ability and cosmetic reward application
          questLogger.debug(`${reward.type} reward not yet implemented: ${reward.description}`);
          break;
      }
    });

    // Show completion toast with rewards summary
    const rewardMessages: string[] = [];
    if (totalXPEarned > 0) {
      rewardMessages.push(`+${totalXPEarned} XP`);
    }
    if (unlockedPets.length > 0) {
      rewardMessages.push(unlockedPets.join(', '));
    }

    toast({
      title: "Quest Complete!",
      description: `${quest.title} completed! ${rewardMessages.join(' • ')}`,
    });

    setQuests(prev => {
      const updated = prev.map(q =>
        q.id === questId ? { ...q, isCompleted: true } : q
      );
      saveQuestData(updated);
      return updated;
    });
  }, [quests, toast, saveQuestData, addXP, addAnimal]);

  // Get quest by ID
  const getQuestById = useCallback((questId: string): Quest | undefined => {
    return quests.find(q => q.id === questId);
  }, [quests]);

  // Get next story quest
  const getNextStoryQuest = useCallback((currentLevel: number): Quest | undefined => {
    return STORY_QUESTS.find(quest => 
      quest.unlockLevel === currentLevel && 
      !quests.find(q => q.id === quest.id)?.isCompleted
    ) as Quest | undefined;
  }, [quests]);

  // Computed values
  const dailyQuests = quests.filter(q => q.type === 'daily' && (!q.expiresAt || q.expiresAt > Date.now()));
  const weeklyQuests = quests.filter(q => q.type === 'weekly' && (!q.expiresAt || q.expiresAt > Date.now()));
  const storyQuests = quests.filter(q => q.type === 'story');
  const activeQuests = quests.filter(q => !q.isCompleted && (!q.expiresAt || q.expiresAt > Date.now()));
  const completedQuests = quests.filter(q => q.isCompleted);

  // Initialize on mount
  useEffect(() => {
    loadQuestData();
  }, [loadQuestData]);

  // Auto-generate daily/weekly quests
  useEffect(() => {
    generateDailyQuests();
    generateWeeklyQuests();
  }, [generateDailyQuests, generateWeeklyQuests]);

  return {
    dailyQuests,
    weeklyQuests,
    storyQuests,
    activeQuests,
    completedQuests,
    updateQuestProgress,
    completeQuest,
    getQuestById,
    generateDailyQuests,
    generateWeeklyQuests,
    getNextStoryQuest
  };
};