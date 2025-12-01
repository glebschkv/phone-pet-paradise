import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Quest {
  id: string;
  type: 'daily' | 'weekly' | 'story';
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  isCompleted: boolean;
  progress: Record<string, number>;
  unlockLevel: number;
  expiresAt?: number; // For daily/weekly quests
  storylineChapter?: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  target: number;
  current: number;
  type: 'focus_time' | 'pet_interaction' | 'bond_level' | 'biome_unlock' | 'streak' | 'collection';
}

export interface QuestReward {
  type: 'xp' | 'pet_unlock' | 'ability' | 'cosmetic';
  amount?: number;
  itemId?: string;
  description: string;
}

export interface QuestSystemReturn {
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  storyQuests: Quest[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  updateQuestProgress: (type: string, amount: number, metadata?: any) => void;
  completeQuest: (questId: string) => void;
  getQuestById: (questId: string) => Quest | undefined;
  generateDailyQuests: () => void;
  generateWeeklyQuests: () => void;
  getNextStoryQuest: (currentLevel: number) => Quest | undefined;
}

const QUEST_STORAGE_KEY = 'quest-system-data';

// Quest templates for generation - BOOSTED REWARDS!
const DAILY_QUEST_TEMPLATES = [
  {
    title: "Focus Marathon",
    description: "Complete 30 minutes of focus time",
    objectives: [{ type: 'focus_time', target: 30, description: "Focus for 30 minutes" }],
    rewards: [{ type: 'xp', amount: 200, description: "+200 XP" }]
  },
  {
    title: "Pet Companion",
    description: "Interact with 3 different pets",
    objectives: [{ type: 'pet_interaction', target: 3, description: "Interact with 3 pets" }],
    rewards: [{ type: 'xp', amount: 150, description: "+150 XP" }]
  },
  {
    title: "Bond Builder",
    description: "Increase bond level with any pet",
    objectives: [{ type: 'bond_level', target: 1, description: "Level up a pet bond" }],
    rewards: [{ type: 'xp', amount: 300, description: "+300 XP" }]
  },
  {
    title: "Streak Keeper",
    description: "Maintain your focus streak",
    objectives: [{ type: 'streak', target: 1, description: "Complete a focus session" }],
    rewards: [{ type: 'xp', amount: 125, description: "+125 XP" }]
  }
];

const WEEKLY_QUEST_TEMPLATES = [
  {
    title: "Focus Master",
    description: "Complete 5 hours of total focus time this week",
    objectives: [{ type: 'focus_time', target: 300, description: "Focus for 5 hours total" }],
    rewards: [{ type: 'xp', amount: 1000, description: "+1000 XP" }]
  },
  {
    title: "Pet Collector",
    description: "Unlock 2 new pets",
    objectives: [{ type: 'collection', target: 2, description: "Unlock 2 new pets" }],
    rewards: [{ type: 'xp', amount: 600, description: "+600 XP" }]
  },
  {
    title: "Perfect Week",
    description: "Complete focus sessions for 7 consecutive days",
    objectives: [{ type: 'streak', target: 7, description: "7-day focus streak" }],
    rewards: [{ type: 'xp', amount: 1500, description: "+1500 XP" }]
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

  // Load quest data
  const loadQuestData = useCallback(() => {
    try {
      const saved = localStorage.getItem(QUEST_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setQuests(data.quests || []);
      }
    } catch (error) {
      console.error('Failed to load quest data:', error);
    }
  }, []);

  // Save quest data
  const saveQuestData = useCallback((questData: Quest[]) => {
    try {
      localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify({ quests: questData }));
    } catch (error) {
      console.error('Failed to save quest data:', error);
    }
  }, []);

  // Generate unique quest ID
  const generateQuestId = useCallback((type: string): string => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create quest from template
  const createQuestFromTemplate = useCallback((template: any, type: 'daily' | 'weekly'): Quest => {
    const now = Date.now();
    const expiresAt = type === 'daily' 
      ? now + (24 * 60 * 60 * 1000) // 24 hours
      : now + (7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      id: generateQuestId(type),
      type,
      title: template.title,
      description: template.description,
      objectives: template.objectives.map((obj: any) => ({
        id: generateQuestId('objective'),
        description: obj.description,
        target: obj.target,
        current: 0,
        type: obj.type
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
        .slice(0, 3);

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
  const updateQuestProgress = useCallback((type: string, amount: number, _metadata?: any) => {
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

    // Process rewards
    quest.rewards.forEach(reward => {
      if (reward.type === 'xp' && reward.amount) {
        toast({
          title: "Quest Complete!",
          description: `${quest.title} completed! ${reward.description}`,
        });
      }
    });

    setQuests(prev => {
      const updated = prev.map(q => 
        q.id === questId ? { ...q, isCompleted: true } : q
      );
      saveQuestData(updated);
      return updated;
    });
  }, [quests, toast, saveQuestData]);

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