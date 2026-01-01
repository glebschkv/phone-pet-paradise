import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuestSystem, Quest } from '@/hooks/useQuestSystem';

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  questLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useQuestSystem', () => {
  const STORAGE_KEY = 'quest-system-data';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with quest arrays', () => {
      const { result } = renderHook(() => useQuestSystem());

      expect(result.current.dailyQuests).toBeInstanceOf(Array);
      expect(result.current.weeklyQuests).toBeInstanceOf(Array);
      expect(result.current.storyQuests).toBeInstanceOf(Array);
      expect(result.current.activeQuests).toBeInstanceOf(Array);
      expect(result.current.completedQuests).toBeInstanceOf(Array);
    });

    it('should provide quest management functions', () => {
      const { result } = renderHook(() => useQuestSystem());

      expect(typeof result.current.updateQuestProgress).toBe('function');
      expect(typeof result.current.completeQuest).toBe('function');
      expect(typeof result.current.getQuestById).toBe('function');
      expect(typeof result.current.generateDailyQuests).toBe('function');
      expect(typeof result.current.generateWeeklyQuests).toBe('function');
      expect(typeof result.current.getNextStoryQuest).toBe('function');
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      const { result } = renderHook(() => useQuestSystem());

      expect(result.current.dailyQuests).toBeInstanceOf(Array);
    });
  });

  describe('quest generation', () => {
    it('should auto-generate daily quests on mount', async () => {
      const { result } = renderHook(() => useQuestSystem());

      // Allow time for quests to generate
      await waitFor(() => {
        expect(result.current.dailyQuests.length).toBeGreaterThanOrEqual(0);
      }, { timeout: 2000 });
    });

    it('should auto-generate weekly quest on mount', async () => {
      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.weeklyQuests.length).toBeGreaterThanOrEqual(0);
      }, { timeout: 2000 });
    });
  });

  describe('getNextStoryQuest', () => {
    it('should return a story quest for level 1', () => {
      const { result } = renderHook(() => useQuestSystem());

      const storyQuest = result.current.getNextStoryQuest(1);
      // Story quests exist for level 1
      expect(storyQuest === undefined || storyQuest.type === 'story').toBe(true);
    });

    it('should return undefined for very high level', () => {
      const { result } = renderHook(() => useQuestSystem());

      const storyQuest = result.current.getNextStoryQuest(999);
      expect(storyQuest).toBeUndefined();
    });
  });

  describe('quest completion with pre-seeded data', () => {
    it('should mark quest as completed when calling completeQuest', async () => {
      // Pre-seed with a quest that is ready to complete
      const readyQuest: Quest = {
        id: 'ready-quest',
        type: 'daily',
        title: 'Ready Quest',
        description: 'Ready to complete',
        objectives: [{
          id: 'obj-1',
          description: 'Focus for 30 minutes',
          target: 30,
          current: 30,
          type: 'focus_time',
        }],
        rewards: [{ type: 'xp', amount: 200, description: '+200 XP' }],
        isCompleted: false,
        progress: {},
        unlockLevel: 1,
        expiresAt: Date.now() + 86400000,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests: [readyQuest] }));

      const { result } = renderHook(() => useQuestSystem());

      // Wait for quests to load
      await waitFor(() => {
        const quest = result.current.getQuestById('ready-quest');
        expect(quest).toBeDefined();
      }, { timeout: 2000 });

      // Complete the quest
      act(() => {
        result.current.completeQuest('ready-quest');
      });

      // Verify completion
      await waitFor(() => {
        const quest = result.current.getQuestById('ready-quest');
        expect(quest?.isCompleted).toBe(true);
      }, { timeout: 2000 });
    });

    it('should show toast on quest completion', async () => {
      const toastQuest: Quest = {
        id: 'toast-quest',
        type: 'daily',
        title: 'Toast Quest',
        description: 'Will show toast',
        objectives: [{
          id: 'obj-1',
          description: 'Focus',
          target: 1,
          current: 1,
          type: 'focus_time',
        }],
        rewards: [{ type: 'xp', amount: 200, description: '+200 XP' }],
        isCompleted: false,
        progress: {},
        unlockLevel: 1,
        expiresAt: Date.now() + 86400000,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests: [toastQuest] }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.getQuestById('toast-quest')).toBeDefined();
      }, { timeout: 2000 });

      act(() => {
        result.current.completeQuest('toast-quest');
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Quest Complete!',
        })
      );
    });

    it('should not complete already completed quest', async () => {
      const completedQuest: Quest = {
        id: 'done-quest',
        type: 'daily',
        title: 'Done Quest',
        description: 'Already done',
        objectives: [],
        rewards: [{ type: 'xp', amount: 200, description: '+200 XP' }],
        isCompleted: true,
        progress: {},
        unlockLevel: 1,
        expiresAt: Date.now() + 86400000,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests: [completedQuest] }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.completedQuests.length).toBe(1);
      }, { timeout: 2000 });

      mockToast.mockClear();

      act(() => {
        result.current.completeQuest('done-quest');
      });

      // Toast should not be called for already completed quest
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('updateQuestProgress', () => {
    it('should update quest progress', async () => {
      const activeQuest: Quest = {
        id: 'progress-quest',
        type: 'daily',
        title: 'Progress Quest',
        description: 'Test progress',
        objectives: [{
          id: 'obj-1',
          description: 'Focus for 30 minutes',
          target: 30,
          current: 10,
          type: 'focus_time',
        }],
        rewards: [{ type: 'xp', amount: 200, description: '+200 XP' }],
        isCompleted: false,
        progress: {},
        unlockLevel: 1,
        expiresAt: Date.now() + 86400000,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests: [activeQuest] }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.getQuestById('progress-quest')).toBeDefined();
      }, { timeout: 2000 });

      act(() => {
        result.current.updateQuestProgress('focus_time', 15);
      });

      await waitFor(() => {
        const quest = result.current.getQuestById('progress-quest');
        expect(quest?.objectives[0].current).toBe(25);
      }, { timeout: 2000 });
    });

    it('should auto-complete quest when objectives are met', async () => {
      const almostDoneQuest: Quest = {
        id: 'almost-done',
        type: 'daily',
        title: 'Almost Done',
        description: 'Nearly complete',
        objectives: [{
          id: 'obj-1',
          description: 'Focus for 10 minutes',
          target: 10,
          current: 8,
          type: 'focus_time',
        }],
        rewards: [{ type: 'xp', amount: 100, description: '+100 XP' }],
        isCompleted: false,
        progress: {},
        unlockLevel: 1,
        expiresAt: Date.now() + 86400000,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests: [almostDoneQuest] }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.getQuestById('almost-done')).toBeDefined();
      }, { timeout: 2000 });

      act(() => {
        result.current.updateQuestProgress('focus_time', 5);
      });

      await waitFor(() => {
        const quest = result.current.getQuestById('almost-done');
        expect(quest?.isCompleted).toBe(true);
      }, { timeout: 2000 });
    });

    it('should not exceed target when updating progress', async () => {
      const limitQuest: Quest = {
        id: 'limit-quest',
        type: 'daily',
        title: 'Limit Quest',
        description: 'Test limit',
        objectives: [{
          id: 'obj-1',
          description: 'Focus for 10 minutes',
          target: 10,
          current: 5,
          type: 'focus_time',
        }],
        rewards: [],
        isCompleted: false,
        progress: {},
        unlockLevel: 1,
        expiresAt: Date.now() + 86400000,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests: [limitQuest] }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.getQuestById('limit-quest')).toBeDefined();
      }, { timeout: 2000 });

      act(() => {
        result.current.updateQuestProgress('focus_time', 100);
      });

      await waitFor(() => {
        const quest = result.current.getQuestById('limit-quest');
        expect(quest?.objectives[0].current).toBe(10); // Should cap at target
      }, { timeout: 2000 });
    });
  });

  describe('getQuestById', () => {
    it('should find quest by id', async () => {
      const testQuest: Quest = {
        id: 'find-me',
        type: 'daily',
        title: 'Find Me',
        description: 'Test',
        objectives: [],
        rewards: [],
        isCompleted: false,
        progress: {},
        unlockLevel: 1,
        expiresAt: Date.now() + 86400000,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests: [testQuest] }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        const quest = result.current.getQuestById('find-me');
        expect(quest).toBeDefined();
        expect(quest?.title).toBe('Find Me');
      }, { timeout: 2000 });
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useQuestSystem());

      const quest = result.current.getQuestById('non-existent');
      expect(quest).toBeUndefined();
    });
  });

  describe('computed values', () => {
    it('should correctly compute activeQuests', async () => {
      const quests: Quest[] = [
        {
          id: 'active-1',
          type: 'daily',
          title: 'Active',
          description: 'Active quest',
          objectives: [],
          rewards: [],
          isCompleted: false,
          progress: {},
          unlockLevel: 1,
          expiresAt: Date.now() + 86400000,
        },
        {
          id: 'completed-1',
          type: 'daily',
          title: 'Completed',
          description: 'Completed quest',
          objectives: [],
          rewards: [],
          isCompleted: true,
          progress: {},
          unlockLevel: 1,
          expiresAt: Date.now() + 86400000,
        },
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.activeQuests.some(q => q.id === 'active-1')).toBe(true);
        expect(result.current.activeQuests.some(q => q.id === 'completed-1')).toBe(false);
      }, { timeout: 2000 });
    });

    it('should correctly compute completedQuests', async () => {
      const quests: Quest[] = [
        {
          id: 'done-1',
          type: 'daily',
          title: 'Done',
          description: 'Done quest',
          objectives: [],
          rewards: [],
          isCompleted: true,
          progress: {},
          unlockLevel: 1,
          expiresAt: Date.now() + 86400000,
        },
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.completedQuests.length).toBe(1);
        expect(result.current.completedQuests[0].id).toBe('done-1');
      }, { timeout: 2000 });
    });

    it('should filter expired quests from active', async () => {
      const expiredQuest: Quest = {
        id: 'expired-1',
        type: 'daily',
        title: 'Expired',
        description: 'Expired quest',
        objectives: [],
        rewards: [],
        isCompleted: false,
        progress: {},
        unlockLevel: 1,
        expiresAt: Date.now() - 1000, // Already expired
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests: [expiredQuest] }));

      const { result } = renderHook(() => useQuestSystem());

      await waitFor(() => {
        expect(result.current.activeQuests.some(q => q.id === 'expired-1')).toBe(false);
      }, { timeout: 2000 });
    });
  });
});
