import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineSyncManager } from '@/hooks/useOfflineSyncManager';
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  syncLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockSupabaseFrom = vi.fn();
const mockSupabaseInsert = vi.fn();
const mockSupabaseUpdate = vi.fn();
const mockSupabaseUpsert = vi.fn();
const mockSupabaseEq = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mockSupabaseFrom(table);
      return {
        insert: (data: unknown) => {
          mockSupabaseInsert(data);
          return Promise.resolve({ error: null });
        },
        update: (data: unknown) => {
          mockSupabaseUpdate(data);
          return {
            eq: (col: string, val: unknown) => {
              mockSupabaseEq(col, val);
              return Promise.resolve({ error: null });
            },
          };
        },
        upsert: (data: unknown, options?: unknown) => {
          mockSupabaseUpsert(data, options);
          return Promise.resolve({ error: null });
        },
      };
    },
  },
  isSupabaseConfigured: true,
}));

const mockUser = { id: 'test-user-123', email: 'test@example.com' };

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
    isGuestMode: false,
  })),
}));

describe('useOfflineSyncManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store to initial state
    act(() => {
      const store = useOfflineSyncStore.getState();
      store.clearOperations();
      store.setOnline(true);
      store.setSyncStatus('idle');
      // Reset lastSyncAt and lastSyncError to initial values
      useOfflineSyncStore.setState({
        lastSyncAt: null,
        lastSyncError: null,
        totalSynced: 0,
        totalFailed: 0,
      });
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should return correct initial values', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.lastSyncAt).toBeNull();
      expect(typeof result.current.syncNow).toBe('function');
      expect(typeof result.current.queueOperation).toBe('function');
    });
  });

  describe('queueOperation', () => {
    it('should queue a focus_session operation', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('focus_session', {
          durationMinutes: 25,
          xpEarned: 100,
          sessionType: 'focus',
        });
      });

      expect(result.current.pendingCount).toBe(1);
    });

    it('should queue multiple operations', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('focus_session', { durationMinutes: 25 });
        result.current.queueOperation('xp_update', { totalXp: 500, currentLevel: 5 });
        result.current.queueOperation('coin_update', { coins: 1000 });
      });

      expect(result.current.pendingCount).toBe(3);
    });

    it('should add queuedAt timestamp to payload', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      const beforeQueue = Date.now();
      act(() => {
        result.current.queueOperation('streak_update', { currentStreak: 5 });
      });
      const afterQueue = Date.now();

      const operations = useOfflineSyncStore.getState().pendingOperations;
      expect(operations[0].payload.queuedAt).toBeGreaterThanOrEqual(beforeQueue);
      expect(operations[0].payload.queuedAt).toBeLessThanOrEqual(afterQueue);
    });

    it('should queue progress_update operation', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('progress_update', {
          total_xp: 1000,
          current_level: 10,
          total_sessions: 50,
        });
      });

      const operations = useOfflineSyncStore.getState().pendingOperations;
      expect(operations[0].type).toBe('progress_update');
    });

    it('should queue achievement_unlock operation', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('achievement_unlock', {
          achievementType: 'streak_master',
          title: 'Streak Master',
          unlockedAt: new Date().toISOString(),
        });
      });

      expect(result.current.pendingCount).toBe(1);
      const operations = useOfflineSyncStore.getState().pendingOperations;
      expect(operations[0].type).toBe('achievement_unlock');
    });

    it('should queue pet_interaction operation', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('pet_interaction', {
          petType: 'panda',
          bondLevel: 5,
          experience: 250,
          mood: 90,
        });
      });

      expect(result.current.pendingCount).toBe(1);
    });

    it('should queue quest_update operation', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('quest_update', {
          questId: 'quest-123',
          progress: 50,
          completed: false,
        });
      });

      expect(result.current.pendingCount).toBe(1);
    });
  });

  describe('syncNow', () => {
    it('should not sync when offline', async () => {
      act(() => {
        useOfflineSyncStore.getState().setOnline(false);
      });

      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('focus_session', { durationMinutes: 25 });
      });

      await act(async () => {
        await result.current.syncNow();
      });

      // Operations should still be pending
      expect(result.current.pendingCount).toBe(1);
    });

    it('should not sync when no pending operations', async () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should process focus_session operations', async () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('focus_session', {
          durationMinutes: 25,
          xpEarned: 100,
          sessionType: 'focus',
          completedAt: '2024-01-15T10:00:00Z',
        });
      });

      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('focus_sessions');
      expect(mockSupabaseInsert).toHaveBeenCalled();
    });

    it('should process xp_update operations', async () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('xp_update', {
          totalXp: 500,
          currentLevel: 5,
        });
      });

      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('user_progress');
      expect(mockSupabaseUpdate).toHaveBeenCalled();
    });

    it('should process coin_update operations', async () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('coin_update', { coins: 1000 });
      });

      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('user_progress');
    });

    it('should process streak_update operations', async () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('streak_update', {
          currentStreak: 7,
          longestStreak: 14,
          lastSessionDate: '2024-01-15',
        });
      });

      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('user_progress');
    });

    it('should remove successful operations from queue', async () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('focus_session', { durationMinutes: 25 });
      });

      expect(result.current.pendingCount).toBe(1);

      await act(async () => {
        await result.current.syncNow();
      });

      // Wait for operation to be removed
      await waitFor(() => {
        expect(result.current.pendingCount).toBe(0);
      });
    });

    it('should update lastSyncAt after successful sync', async () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      expect(result.current.lastSyncAt).toBeNull();

      act(() => {
        result.current.queueOperation('focus_session', { durationMinutes: 25 });
      });

      await act(async () => {
        await result.current.syncNow();
      });

      // Give time for state updates to propagate
      await waitFor(
        () => {
          expect(result.current.lastSyncAt).not.toBeNull();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('isSyncing state', () => {
    it('should reflect syncing status from store', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      expect(result.current.isSyncing).toBe(false);

      act(() => {
        useOfflineSyncStore.getState().setSyncStatus('syncing');
      });

      expect(result.current.isSyncing).toBe(true);

      act(() => {
        useOfflineSyncStore.getState().setSyncStatus('idle');
      });

      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('pendingCount', () => {
    it('should track pending operation count', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      expect(result.current.pendingCount).toBe(0);

      act(() => {
        result.current.queueOperation('focus_session', { durationMinutes: 25 });
      });

      expect(result.current.pendingCount).toBe(1);

      act(() => {
        result.current.queueOperation('xp_update', { totalXp: 100 });
        result.current.queueOperation('coin_update', { coins: 50 });
      });

      expect(result.current.pendingCount).toBe(3);
    });
  });

  describe('Online/Offline Events', () => {
    it('should handle going offline', () => {
      renderHook(() => useOfflineSyncManager());

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(useOfflineSyncStore.getState().isOnline).toBe(false);
    });

    it('should handle coming back online', () => {
      act(() => {
        useOfflineSyncStore.getState().setOnline(false);
      });

      renderHook(() => useOfflineSyncManager());

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(useOfflineSyncStore.getState().isOnline).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty payload', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('progress_update', {});
      });

      expect(result.current.pendingCount).toBe(1);
    });

    it('should handle operations with invalid data types gracefully', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        result.current.queueOperation('xp_update', {
          totalXp: 'not-a-number' as unknown as number,
          currentLevel: null as unknown as number,
        });
      });

      expect(result.current.pendingCount).toBe(1);
    });

    it('should handle rapid successive queue operations', () => {
      const { result } = renderHook(() => useOfflineSyncManager());

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.queueOperation('focus_session', { durationMinutes: i + 1 });
        }
      });

      expect(result.current.pendingCount).toBe(20);
    });
  });
});

describe('offlineSyncStore', () => {
  beforeEach(() => {
    act(() => {
      const store = useOfflineSyncStore.getState();
      store.clearOperations();
      store.setOnline(true);
      store.setSyncStatus('idle');
      // Reset lastSyncAt and lastSyncError to initial values
      useOfflineSyncStore.setState({
        lastSyncAt: null,
        lastSyncError: null,
        totalSynced: 0,
        totalFailed: 0,
      });
    });
  });

  describe('addOperation', () => {
    it('should add operation with unique ID', () => {
      const id = useOfflineSyncStore.getState().addOperation('focus_session', { test: true });

      expect(id).toBeDefined();
      expect(id.startsWith('sync_')).toBe(true);
    });

    it('should set correct default values', () => {
      useOfflineSyncStore.getState().addOperation('xp_update', { xp: 100 });

      const ops = useOfflineSyncStore.getState().pendingOperations;
      expect(ops[0].retryCount).toBe(0);
      expect(ops[0].lastRetryAt).toBeNull();
      expect(ops[0].createdAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('removeOperation', () => {
    it('should remove operation by ID', () => {
      const id = useOfflineSyncStore.getState().addOperation('focus_session', {});

      expect(useOfflineSyncStore.getState().pendingOperations.length).toBe(1);

      useOfflineSyncStore.getState().removeOperation(id);

      expect(useOfflineSyncStore.getState().pendingOperations.length).toBe(0);
    });

    it('should increment totalSynced counter', () => {
      const initialSynced = useOfflineSyncStore.getState().totalSynced;
      const id = useOfflineSyncStore.getState().addOperation('focus_session', {});

      useOfflineSyncStore.getState().removeOperation(id);

      expect(useOfflineSyncStore.getState().totalSynced).toBe(initialSynced + 1);
    });
  });

  describe('getOperationsByType', () => {
    it('should filter operations by type', () => {
      useOfflineSyncStore.getState().addOperation('focus_session', { a: 1 });
      useOfflineSyncStore.getState().addOperation('xp_update', { b: 2 });
      useOfflineSyncStore.getState().addOperation('focus_session', { c: 3 });

      const focusSessions = useOfflineSyncStore.getState().getOperationsByType('focus_session');

      expect(focusSessions.length).toBe(2);
    });
  });

  describe('incrementRetry', () => {
    it('should increment retry count', () => {
      const id = useOfflineSyncStore.getState().addOperation('focus_session', {});

      expect(useOfflineSyncStore.getState().pendingOperations[0].retryCount).toBe(0);

      useOfflineSyncStore.getState().incrementRetry(id);

      expect(useOfflineSyncStore.getState().pendingOperations[0].retryCount).toBe(1);
    });

    it('should update lastRetryAt', () => {
      const id = useOfflineSyncStore.getState().addOperation('focus_session', {});
      const before = Date.now();

      useOfflineSyncStore.getState().incrementRetry(id);

      const op = useOfflineSyncStore.getState().pendingOperations[0];
      expect(op.lastRetryAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('getRetryableOperations', () => {
    it('should exclude operations with max retries', () => {
      const id = useOfflineSyncStore.getState().addOperation('focus_session', {});

      // Increment retry 5 times (max is 5)
      for (let i = 0; i < 5; i++) {
        useOfflineSyncStore.getState().incrementRetry(id);
      }

      const retryable = useOfflineSyncStore.getState().getRetryableOperations();
      expect(retryable.length).toBe(0);
    });

    it('should include operations under max retries', () => {
      const id = useOfflineSyncStore.getState().addOperation('focus_session', {});

      for (let i = 0; i < 3; i++) {
        useOfflineSyncStore.getState().incrementRetry(id);
      }

      const retryable = useOfflineSyncStore.getState().getRetryableOperations();
      expect(retryable.length).toBe(1);
    });
  });

  describe('markSyncComplete', () => {
    it('should set status to idle', () => {
      useOfflineSyncStore.getState().setSyncStatus('syncing');
      useOfflineSyncStore.getState().markSyncComplete();

      expect(useOfflineSyncStore.getState().syncStatus).toBe('idle');
    });

    it('should update lastSyncAt', () => {
      const before = Date.now();
      useOfflineSyncStore.getState().markSyncComplete();

      expect(useOfflineSyncStore.getState().lastSyncAt).toBeGreaterThanOrEqual(before);
    });

    it('should clear lastSyncError', () => {
      useOfflineSyncStore.getState().markSyncError('Test error');
      useOfflineSyncStore.getState().markSyncComplete();

      expect(useOfflineSyncStore.getState().lastSyncError).toBeNull();
    });
  });

  describe('markSyncError', () => {
    it('should set error status and message', () => {
      useOfflineSyncStore.getState().markSyncError('Network error');

      expect(useOfflineSyncStore.getState().syncStatus).toBe('error');
      expect(useOfflineSyncStore.getState().lastSyncError).toBe('Network error');
    });

    it('should increment totalFailed counter', () => {
      const initial = useOfflineSyncStore.getState().totalFailed;
      useOfflineSyncStore.getState().markSyncError('Error');

      expect(useOfflineSyncStore.getState().totalFailed).toBe(initial + 1);
    });
  });

  describe('Batch Operations', () => {
    it('should add multiple operations at once', () => {
      const ids = useOfflineSyncStore.getState().addOperations([
        { type: 'focus_session', payload: { a: 1 } },
        { type: 'xp_update', payload: { b: 2 } },
        { type: 'coin_update', payload: { c: 3 } },
      ]);

      expect(ids.length).toBe(3);
      expect(useOfflineSyncStore.getState().pendingOperations.length).toBe(3);
    });

    it('should remove multiple operations at once', () => {
      const ids = useOfflineSyncStore.getState().addOperations([
        { type: 'focus_session', payload: {} },
        { type: 'xp_update', payload: {} },
      ]);

      useOfflineSyncStore.getState().removeOperations(ids);

      expect(useOfflineSyncStore.getState().pendingOperations.length).toBe(0);
    });
  });

  describe('Priority Sorting', () => {
    it('should sort operations by priority (higher first)', () => {
      useOfflineSyncStore.getState().addOperation('focus_session', { a: 1 }, 1); // low
      useOfflineSyncStore.getState().addOperation('xp_update', { b: 2 }, 10); // high
      useOfflineSyncStore.getState().addOperation('coin_update', { c: 3 }, 5); // normal

      const ops = useOfflineSyncStore.getState().pendingOperations;
      expect(ops[0].priority).toBe(10);
      expect(ops[1].priority).toBe(5);
      expect(ops[2].priority).toBe(1);
    });
  });
});
