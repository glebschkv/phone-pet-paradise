import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  expiresAt?: number;
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
  updateQuestProgress: (type: string, amount: number, metadata?: any) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  getQuestById: (questId: string) => Quest | undefined;
  generateDailyQuests: () => Promise<void>;
  generateWeeklyQuests: () => Promise<void>;
  getNextStoryQuest: (currentLevel: number) => Quest | undefined;
  isLoading: boolean;
}

// Quest templates for generation
const DAILY_QUEST_TEMPLATES = [
  {
    title: "Focus Marathon",
    description: "Complete 30 minutes of focus time",
    objectives: [{ type: 'focus_time', target: 30, description: "Focus for 30 minutes" }],
    rewards: [{ type: 'xp', amount: 100, description: "+100 XP" }]
  },
  {
    title: "Pet Companion",
    description: "Interact with 3 different pets",
    objectives: [{ type: 'pet_interaction', target: 3, description: "Interact with 3 pets" }],
    rewards: [{ type: 'xp', amount: 75, description: "+75 XP" }]
  },
  {
    title: "Bond Builder",
    description: "Increase bond level with any pet",
    objectives: [{ type: 'bond_level', target: 1, description: "Level up a pet bond" }],
    rewards: [{ type: 'xp', amount: 150, description: "+150 XP" }]
  },
  {
    title: "Streak Keeper",
    description: "Maintain your focus streak",
    objectives: [{ type: 'streak', target: 1, description: "Complete a focus session" }],
    rewards: [{ type: 'xp', amount: 50, description: "+50 XP" }]
  }
];

const WEEKLY_QUEST_TEMPLATES = [
  {
    title: "Focus Master",
    description: "Complete 5 hours of total focus time this week",
    objectives: [{ type: 'focus_time', target: 300, description: "Focus for 5 hours total" }],
    rewards: [{ type: 'xp', amount: 500, description: "+500 XP" }]
  },
  {
    title: "Pet Collector",
    description: "Unlock 2 new pets",
    objectives: [{ type: 'collection', target: 2, description: "Unlock 2 new pets" }],
    rewards: [{ type: 'xp', amount: 300, description: "+300 XP" }]
  },
  {
    title: "Perfect Week",
    description: "Complete focus sessions for 7 consecutive days",
    objectives: [{ type: 'streak', target: 7, description: "7-day focus streak" }],
    rewards: [{ type: 'xp', amount: 750, description: "+750 XP" }]
  }
];

const STORY_QUESTS = [
  {
    id: 'story-1',
    title: "Welcome to Paradise",
    description: "Begin your journey by meeting your first companion",
    objectives: [{ type: 'pet_interaction', target: 1, description: "Meet your first pet" }],
    rewards: [{ type: 'pet_unlock', itemId: 'panda', description: "Unlock Panda companion" }],
    unlockLevel: 1,
    storylineChapter: 1
  },
  {
    id: 'story-2',
    title: "First Focus",
    description: "Complete your first focus session",
    objectives: [{ type: 'focus_time', target: 10, description: "Focus for 10 minutes" }],
    rewards: [{ type: 'xp', amount: 100, description: "+100 XP" }],
    unlockLevel: 1,
    storylineChapter: 1
  }
];

export const useBackendQuests = (): QuestSystemReturn => {
  const { user, isAuthenticated } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load quests from backend
  const loadQuests = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      const { data: backendQuests, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Convert backend data to Quest format
      const convertedQuests: Quest[] = (backendQuests || []).map(q => ({
        id: q.id,
        type: q.quest_type as 'daily' | 'weekly' | 'story',
        title: q.title,
        description: q.description || '',
        objectives: [{
          id: `${q.id}-obj-1`,
          description: q.description || '',
          target: q.target_value,
          current: q.current_progress,
          type: 'focus_time' // Default type, could be enhanced
        }],
        rewards: [{
          type: 'xp',
          amount: q.reward_xp,
          description: `+${q.reward_xp} XP`
        }],
        isCompleted: !!q.completed_at,
        progress: {},
        unlockLevel: 1,
        expiresAt: undefined
      }));

      setQuests(convertedQuests);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Generate unique quest ID
  const generateQuestId = useCallback((type: string): string => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create quest from template
  const createQuestFromTemplate = useCallback(async (template: any, type: 'daily' | 'weekly'): Promise<Quest | null> => {
    if (!user) return null;

    try {
      const questData = {
        user_id: user.id,
        quest_type: type,
        title: template.title,
        description: template.description,
        target_value: template.objectives[0].target,
        reward_xp: template.rewards[0].amount,
        current_progress: 0
      };

      const { data, error } = await supabase
        .from('quests')
        .insert(questData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
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
        expiresAt: undefined
      };
    } catch (error) {
      console.error('Error creating quest:', error);
      return null;
    }
  }, [user, generateQuestId]);

  // Generate daily quests
  const generateDailyQuests = useCallback(async () => {
    const existingDaily = quests.filter(q => q.type === 'daily' && !q.isCompleted);

    if (existingDaily.length < 3) {
      const selectedTemplates = DAILY_QUEST_TEMPLATES
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - existingDaily.length);

      for (const template of selectedTemplates) {
        const newQuest = await createQuestFromTemplate(template, 'daily');
        if (newQuest) {
          setQuests(prev => [...prev, newQuest]);
        }
      }
    }
  }, [quests, createQuestFromTemplate]);

  // Generate weekly quests
  const generateWeeklyQuests = useCallback(async () => {
    const existingWeekly = quests.filter(q => q.type === 'weekly' && !q.isCompleted);

    if (existingWeekly.length === 0) {
      const selectedTemplate = WEEKLY_QUEST_TEMPLATES[
        Math.floor(Math.random() * WEEKLY_QUEST_TEMPLATES.length)
      ];

      const newQuest = await createQuestFromTemplate(selectedTemplate, 'weekly');
      if (newQuest) {
        setQuests(prev => [...prev, newQuest]);
      }
    }
  }, [quests, createQuestFromTemplate]);

  // Update quest progress
  const updateQuestProgress = useCallback(async (type: string, amount: number, metadata?: any) => {
    if (!user) return;

    const activeQuests = quests.filter(q => !q.isCompleted);
    
    for (const quest of activeQuests) {
      const relevantObjective = quest.objectives.find(obj => obj.type === type);
      if (!relevantObjective) continue;

      const newProgress = Math.min(relevantObjective.target, relevantObjective.current + amount);
      const isCompleted = newProgress >= relevantObjective.target;

      try {
        const { error } = await supabase
          .from('quests')
          .update({
            current_progress: newProgress,
            completed_at: isCompleted ? new Date().toISOString() : null
          })
          .eq('id', quest.id);

        if (error) throw error;

        // Update local state
        setQuests(prev => prev.map(q => 
          q.id === quest.id 
            ? {
                ...q,
                objectives: q.objectives.map(obj => 
                  obj.type === type ? { ...obj, current: newProgress } : obj
                ),
                isCompleted
              }
            : q
        ));

        if (isCompleted) {
          toast.success("Quest Complete!", {
            description: `${quest.title} completed! ${quest.rewards[0]?.description}`
          });
        }
      } catch (error) {
        console.error('Error updating quest progress:', error);
      }
    }
  }, [user, quests]);

  // Complete quest and claim rewards
  const completeQuest = useCallback(async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.isCompleted) return;

    try {
      const { error } = await supabase
        .from('quests')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', questId);

      if (error) throw error;

      setQuests(prev => prev.map(q => 
        q.id === questId ? { ...q, isCompleted: true } : q
      ));

      toast.success("Quest Complete!", {
        description: `${quest.title} completed! ${quest.rewards[0]?.description}`
      });
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  }, [quests]);

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
  const dailyQuests = quests.filter(q => q.type === 'daily');
  const weeklyQuests = quests.filter(q => q.type === 'weekly');
  const storyQuests = quests.filter(q => q.type === 'story');
  const activeQuests = quests.filter(q => !q.isCompleted);
  const completedQuests = quests.filter(q => q.isCompleted);

  // Load on mount and auth change
  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  // Auto-generate quests
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      generateDailyQuests();
      generateWeeklyQuests();
    }
  }, [isAuthenticated, isLoading, generateDailyQuests, generateWeeklyQuests]);

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
    getNextStoryQuest,
    isLoading
  };
};