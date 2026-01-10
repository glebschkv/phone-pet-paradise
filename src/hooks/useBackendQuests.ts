import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { questLogger } from '@/lib/logger';
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

const QUESTS_STORAGE_KEY = 'pet_paradise_quests';

// Quest templates for generation
const DAILY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    title: "Focus Marathon",
    description: "Complete 30 minutes of focus time",
    objectives: [{ type: 'focus_time', target: 30, description: "Focus for 30 minutes" }],
    rewards: [{ type: 'xp' as const, amount: 100, description: "+100 XP" }]
  },
  {
    title: "Pet Companion",
    description: "Interact with 3 different pets",
    objectives: [{ type: 'pet_interaction', target: 3, description: "Interact with 3 pets" }],
    rewards: [{ type: 'xp' as const, amount: 75, description: "+75 XP" }]
  },
  {
    title: "Bond Builder",
    description: "Increase bond level with any pet",
    objectives: [{ type: 'bond_level', target: 1, description: "Level up a pet bond" }],
    rewards: [{ type: 'xp' as const, amount: 150, description: "+150 XP" }]
  },
  {
    title: "Streak Keeper",
    description: "Maintain your focus streak",
    objectives: [{ type: 'streak', target: 1, description: "Complete a focus session" }],
    rewards: [{ type: 'xp' as const, amount: 50, description: "+50 XP" }]
  }
];

const WEEKLY_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    title: "Focus Master",
    description: "Complete 5 hours of total focus time this week",
    objectives: [{ type: 'focus_time', target: 300, description: "Focus for 5 hours total" }],
    rewards: [{ type: 'xp' as const, amount: 500, description: "+500 XP" }]
  },
  {
    title: "Pet Collector",
    description: "Unlock 2 new pets",
    objectives: [{ type: 'collection', target: 2, description: "Unlock 2 new pets" }],
    rewards: [{ type: 'xp' as const, amount: 300, description: "+300 XP" }]
  },
  {
    title: "Perfect Week",
    description: "Complete focus sessions for 7 consecutive days",
    objectives: [{ type: 'streak', target: 7, description: "7-day focus streak" }],
    rewards: [{ type: 'xp' as const, amount: 750, description: "+750 XP" }]
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
  const { user, isAuthenticated, isGuestMode } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // localStorage helpers
  const saveQuestsToStorage = useCallback((questsData: Quest[]) => {
    try {
      localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(questsData));
    } catch (error) {
      questLogger.error('Error saving quests to localStorage:', error);
    }
  }, []);

  const loadQuestsFromStorage = useCallback((): Quest[] => {
    try {
      const data = localStorage.getItem(QUESTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      questLogger.error('Error loading quests from localStorage:', error);
      return [];
    }
  }, []);

  // Load quests from backend or localStorage
  const loadQuests = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);

    // For guest mode, use localStorage
    if (isGuestMode) {
      const savedQuests = loadQuestsFromStorage();
      setQuests(savedQuests);
      setIsLoading(false);
      return;
    }

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
      questLogger.error('Error loading quests:', error);
      // Fall back to localStorage on error
      const savedQuests = loadQuestsFromStorage();
      setQuests(savedQuests);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, isGuestMode, loadQuestsFromStorage]);

  // Generate unique quest ID
  const generateQuestId = useCallback((type: string): string => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create quest from template
  const createQuestFromTemplate = useCallback(async (template: QuestTemplate, type: 'daily' | 'weekly'): Promise<Quest | null> => {
    if (!user) return null;

    const newQuest: Quest = {
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
      expiresAt: undefined
    };

    // For guest mode, just create locally
    if (isGuestMode) {
      return newQuest;
    }

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
        ...newQuest,
        id: data.id
      };
    } catch (error) {
      questLogger.error('Error creating quest:', error);
      // Return local quest on error
      return newQuest;
    }
  }, [user, isGuestMode, generateQuestId]);

  // Generate daily quests
  const generateDailyQuests = useCallback(async () => {
    const existingDaily = quests.filter(q => q.type === 'daily' && !q.isCompleted);

    if (existingDaily.length < 3) {
      const selectedTemplates = DAILY_QUEST_TEMPLATES
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - existingDaily.length);

      const newQuests: Quest[] = [];
      for (const template of selectedTemplates) {
        const newQuest = await createQuestFromTemplate(template, 'daily');
        if (newQuest) {
          newQuests.push(newQuest);
        }
      }

      if (newQuests.length > 0) {
        setQuests(prev => {
          const updated = [...prev, ...newQuests];
          if (isGuestMode) {
            saveQuestsToStorage(updated);
          }
          return updated;
        });
      }
    }
  }, [quests, createQuestFromTemplate, isGuestMode, saveQuestsToStorage]);

  // Generate weekly quests
  const generateWeeklyQuests = useCallback(async () => {
    const existingWeekly = quests.filter(q => q.type === 'weekly' && !q.isCompleted);

    if (existingWeekly.length === 0) {
      const selectedTemplate = WEEKLY_QUEST_TEMPLATES[
        Math.floor(Math.random() * WEEKLY_QUEST_TEMPLATES.length)
      ];

      const newQuest = await createQuestFromTemplate(selectedTemplate, 'weekly');
      if (newQuest) {
        setQuests(prev => {
          const updated = [...prev, newQuest];
          if (isGuestMode) {
            saveQuestsToStorage(updated);
          }
          return updated;
        });
      }
    }
  }, [quests, createQuestFromTemplate, isGuestMode, saveQuestsToStorage]);

  // Update quest progress - batched to avoid N+1 queries
  const updateQuestProgress = useCallback(async (type: string, amount: number, _metadata?: Record<string, unknown>) => {
    if (!user) return;

    const activeQuests = quests.filter(q => !q.isCompleted);

    // Collect all quest updates to batch them
    const questUpdates: Array<{
      quest: Quest;
      newProgress: number;
      isCompleted: boolean;
    }> = [];

    for (const quest of activeQuests) {
      const relevantObjective = quest.objectives.find(obj => obj.type === type);
      if (!relevantObjective) continue;

      const newProgress = Math.min(relevantObjective.target, relevantObjective.current + amount);
      const isCompleted = newProgress >= relevantObjective.target;
      questUpdates.push({ quest, newProgress, isCompleted });
    }

    // No matching quests to update
    if (questUpdates.length === 0) return;

    // Update local state for all quests at once
    const updateLocalState = () => {
      setQuests(prev => {
        const updated = prev.map(q => {
          const update = questUpdates.find(u => u.quest.id === q.id);
          if (!update) return q;

          return {
            ...q,
            objectives: q.objectives.map(obj =>
              obj.type === type ? { ...obj, current: update.newProgress } : obj
            ),
            isCompleted: update.isCompleted
          };
        });
        if (isGuestMode) {
          saveQuestsToStorage(updated);
        }
        return updated;
      });

      // Show completion notifications
      for (const { quest, isCompleted } of questUpdates) {
        if (isCompleted) {
          toast.success("Quest Complete!", {
            description: `${quest.title} completed! ${quest.rewards[0]?.description}`
          });
        }
      }
    };

    // For guest mode, just update locally
    if (isGuestMode) {
      updateLocalState();
      return;
    }

    // Batch all backend updates using Promise.all to avoid N+1 queries
    try {
      const updatePromises = questUpdates.map(({ quest, newProgress, isCompleted }) =>
        supabase
          .from('quests')
          .update({
            current_progress: newProgress,
            completed_at: isCompleted ? new Date().toISOString() : null
          })
          .eq('id', quest.id)
      );

      const results = await Promise.all(updatePromises);

      // Check for any errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        questLogger.error('Some quest updates failed:', errors.map(e => e.error));
      }

      updateLocalState();
    } catch (error) {
      questLogger.error('Error updating quest progress:', error);
      // Fall back to local update on error
      updateLocalState();
    }
  }, [user, quests, isGuestMode, saveQuestsToStorage]);

  // Complete quest and claim rewards
  const completeQuest = useCallback(async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.isCompleted) return;

    const markComplete = () => {
      setQuests(prev => {
        const updated = prev.map(q =>
          q.id === questId ? { ...q, isCompleted: true } : q
        );
        if (isGuestMode) {
          saveQuestsToStorage(updated);
        }
        return updated;
      });

      toast.success("Quest Complete!", {
        description: `${quest.title} completed! ${quest.rewards[0]?.description}`
      });
    };

    // For guest mode, just update locally
    if (isGuestMode) {
      markComplete();
      return;
    }

    try {
      const { error } = await supabase
        .from('quests')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', questId);

      if (error) throw error;

      markComplete();
    } catch (error) {
      questLogger.error('Error completing quest:', error);
      // Fall back to local update on error
      markComplete();
    }
  }, [quests, isGuestMode, saveQuestsToStorage]);

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