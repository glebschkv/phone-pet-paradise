import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { questLogger } from '@/lib/logger';

export interface QuestObjective {
  id: string;
  description: string;
  target: number;
  current: number;
  type: 'focus_time' | 'pet_interaction' | 'bond_level' | 'streak' | 'collection' | 'biome_unlock';
}

export interface QuestReward {
  type: 'xp' | 'coins' | 'pet_unlock' | 'badge' | 'item';
  amount?: number;
  itemId?: string;
  description: string;
}

export interface Quest {
  id: string;
  type: 'daily' | 'weekly' | 'story';
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  isCompleted: boolean;
  isClaimed: boolean;
  progress: Record<string, number>;
  unlockLevel?: number;
  expiresAt?: number;
}

interface QuestState {
  quests: Quest[];
  lastDailyReset: string | null;
  lastWeeklyReset: string | null;
}

interface QuestStore extends QuestState {
  addQuest: (quest: Quest) => void;
  addQuests: (quests: Quest[]) => void;
  removeQuest: (questId: string) => void;
  updateQuestProgress: (questId: string, objectiveId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  claimQuest: (questId: string) => void;
  setQuests: (quests: Quest[]) => void;
  getActiveQuests: () => Quest[];
  getDailyQuests: () => Quest[];
  getWeeklyQuests: () => Quest[];
  resetQuests: () => void;
}

const initialState: QuestState = { quests: [], lastDailyReset: null, lastWeeklyReset: null };

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      addQuest: (quest) => { if (!get().quests.some(q => q.id === quest.id)) set((s) => ({ quests: [...s.quests, quest] })); },
      addQuests: (newQuests) => {
        const existing = new Set(get().quests.map(q => q.id));
        const toAdd = newQuests.filter(q => !existing.has(q.id));
        if (toAdd.length > 0) set((s) => ({ quests: [...s.quests, ...toAdd] }));
      },
      removeQuest: (questId) => set((s) => ({ quests: s.quests.filter(q => q.id !== questId) })),
      updateQuestProgress: (questId, objectiveId, progress) => set((s) => ({
        quests: s.quests.map(quest => {
          if (quest.id !== questId) return quest;
          const updatedObjectives = quest.objectives.map(obj =>
            obj.id === objectiveId ? { ...obj, current: Math.min(obj.target, progress) } : obj
          );
          return { ...quest, objectives: updatedObjectives, isCompleted: updatedObjectives.every(o => o.current >= o.target) };
        }),
      })),
      completeQuest: (questId) => set((s) => ({ quests: s.quests.map(q => q.id === questId ? { ...q, isCompleted: true } : q) })),
      claimQuest: (questId) => set((s) => ({ quests: s.quests.map(q => q.id === questId ? { ...q, isClaimed: true } : q) })),
      setQuests: (quests) => set({ quests }),
      getActiveQuests: () => get().quests.filter(q => !q.isCompleted && (!q.expiresAt || q.expiresAt > Date.now())),
      getDailyQuests: () => get().quests.filter(q => q.type === 'daily' && (!q.expiresAt || q.expiresAt > Date.now())),
      getWeeklyQuests: () => get().quests.filter(q => q.type === 'weekly' && (!q.expiresAt || q.expiresAt > Date.now())),
      resetQuests: () => set(initialState),
    }),
    {
      name: 'nomo_quest_system',
      onRehydrateStorage: () => (state) => {
        if (!state) {
          try {
            const legacy = localStorage.getItem('quest-system-data') || localStorage.getItem('pet_paradise_quest_system');
            if (legacy) { const parsed = JSON.parse(legacy); return { quests: parsed.quests || [], lastDailyReset: null, lastWeeklyReset: null }; }
          } catch { /* ignore */ }
        }
        if (state) questLogger.debug('Quest store rehydrated');
      },
    }
  )
);

export const useQuests = () => useQuestStore((s) => s.quests);
export const useActiveQuests = () => useQuestStore((s) => s.quests.filter(q => !q.isCompleted && (!q.expiresAt || q.expiresAt > Date.now())));
export const useDailyQuests = () => useQuestStore((s) => s.quests.filter(q => q.type === 'daily' && (!q.expiresAt || q.expiresAt > Date.now())));
export const useWeeklyQuests = () => useQuestStore((s) => s.quests.filter(q => q.type === 'weekly' && (!q.expiresAt || q.expiresAt > Date.now())));
