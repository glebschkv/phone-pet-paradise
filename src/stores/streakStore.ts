import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { streakLogger } from '@/lib/logger';
import { streakDataSchema } from '@/lib/storage-validation';
import { createValidatedStorage } from '@/lib/validated-zustand-storage';

export interface StreakReward {
  milestone: number;
  reward: string;
  description: string;
  xpBonus?: number;
  coinBonus?: number;
}

export const STREAK_REWARDS: StreakReward[] = [
  { milestone: 3, reward: 'streak_3', description: '3-day streak badge', xpBonus: 50 },
  { milestone: 7, reward: 'streak_7', description: '1-week streak badge', xpBonus: 100, coinBonus: 50 },
  { milestone: 14, reward: 'streak_14', description: '2-week streak badge', xpBonus: 200, coinBonus: 100 },
  { milestone: 30, reward: 'streak_30', description: '1-month streak badge', xpBonus: 500, coinBonus: 250 },
  { milestone: 100, reward: 'streak_100', description: '100-day streak badge', xpBonus: 1500, coinBonus: 1000 },
];

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string;
  totalSessions: number;
  streakFreezeCount: number;
}

interface StreakStore extends StreakState {
  setStreak: (streak: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setLastSessionDate: (date: string) => void;
  incrementSessions: () => void;
  addStreakFreeze: (count: number) => void;
  useStreakFreeze: () => boolean;
  updateState: (partial: Partial<StreakState>) => void;
  getNextMilestone: () => StreakReward | null;
  resetAll: () => void;
}

const initialState: StreakState = { currentStreak: 0, longestStreak: 0, lastSessionDate: '', totalSessions: 0, streakFreezeCount: 0 };

export const useStreakStore = create<StreakStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setStreak: (streak) => set((s) => ({ currentStreak: streak, longestStreak: Math.max(s.longestStreak, streak) })),
      incrementStreak: () => set((s) => ({ currentStreak: s.currentStreak + 1, longestStreak: Math.max(s.longestStreak, s.currentStreak + 1) })),
      resetStreak: () => set({ currentStreak: 0 }),
      setLastSessionDate: (date) => set({ lastSessionDate: date }),
      incrementSessions: () => set((s) => ({ totalSessions: s.totalSessions + 1 })),
      addStreakFreeze: (count) => set((s) => ({ streakFreezeCount: s.streakFreezeCount + count })),
      useStreakFreeze: () => {
        if (get().streakFreezeCount > 0) { set((s) => ({ streakFreezeCount: s.streakFreezeCount - 1 })); return true; }
        return false;
      },
      updateState: (partial) => set((s) => ({ ...s, ...partial })),
      getNextMilestone: () => STREAK_REWARDS.find(r => r.milestone > get().currentStreak) || null,
      resetAll: () => set({ ...initialState, streakFreezeCount: 3 }),
    }),
    {
      name: 'nomo_streak_data',
      storage: createValidatedStorage({
        schema: streakDataSchema,
        defaultState: initialState,
        name: 'streak-store',
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          try {
            const legacy = localStorage.getItem('pet_paradise_streak_data');
            if (legacy) {
              const parsed = JSON.parse(legacy);
              const validated = streakDataSchema.safeParse(parsed);
              if (validated.success) return validated.data;
            }
          } catch { /* ignore */ }
        }
        if (state) streakLogger.debug('Streak store rehydrated and validated');
      },
    }
  )
);

export const useCurrentStreak = () => useStreakStore((s) => s.currentStreak);
export const useLongestStreak = () => useStreakStore((s) => s.longestStreak);
export const useStreakFreezeCount = () => useStreakStore((s) => s.streakFreezeCount);
export const useTotalSessions = () => useStreakStore((s) => s.totalSessions);
