/**
 * Offline Sync Queue Store
 *
 * Manages a queue of pending operations that need to be synced with the backend.
 * Operations are stored in localStorage and processed when the app comes back online.
 *
 * Key features:
 * - Persists pending operations to survive app restarts
 * - Tracks sync status and retry counts
 * - Supports different operation types (focus_session, progress_update, etc.)
 * - Handles conflict resolution with timestamps
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncLogger } from '@/lib/logger';

export type SyncOperationType =
  | 'focus_session'
  | 'progress_update'
  | 'xp_update'
  | 'coin_update'
  | 'streak_update'
  | 'quest_update'
  | 'achievement_unlock'
  | 'pet_interaction'
  | 'profile_update';

export interface PendingSyncOperation {
  id: string;
  type: SyncOperationType;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastRetryAt: number | null;
  priority: number; // Higher priority = sync first
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface OfflineSyncState {
  pendingOperations: PendingSyncOperation[];
  syncStatus: SyncStatus;
  lastSyncAt: number | null;
  lastSyncError: string | null;
  isOnline: boolean;
  totalSynced: number;
  totalFailed: number;
}

interface OfflineSyncStore extends OfflineSyncState {
  // Queue management
  addOperation: (type: SyncOperationType, payload: Record<string, unknown>, priority?: number) => string;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
  getOperationsByType: (type: SyncOperationType) => PendingSyncOperation[];

  // Sync status
  setSyncStatus: (status: SyncStatus) => void;
  setOnline: (online: boolean) => void;
  markSyncComplete: () => void;
  markSyncError: (error: string) => void;

  // Retry management
  incrementRetry: (id: string) => void;
  getRetryableOperations: () => PendingSyncOperation[];

  // Stats
  getPendingCount: () => number;
  hasPendingOperations: () => boolean;

  // Batch operations
  removeOperations: (ids: string[]) => void;
  addOperations: (operations: Array<{ type: SyncOperationType; payload: Record<string, unknown>; priority?: number }>) => string[];
}

const MAX_RETRY_COUNT = 5;
const PRIORITY_HIGH = 10;
const PRIORITY_NORMAL = 5;
const PRIORITY_LOW = 1;

export const SYNC_PRIORITIES = {
  HIGH: PRIORITY_HIGH,
  NORMAL: PRIORITY_NORMAL,
  LOW: PRIORITY_LOW,
} as const;

/**
 * SECURITY: Generate a unique ID for sync operations
 * Uses crypto.randomUUID when available (more unique) or falls back to timestamp + random
 * The monotonic counter ensures uniqueness even when called in the same millisecond
 */
let idCounter = 0;
const generateId = (): string => {
  // Use crypto.randomUUID if available (more secure/unique)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sync_${crypto.randomUUID()}`;
  }
  // Fallback: timestamp + counter + random for uniqueness
  const counter = (++idCounter) % 10000;
  return `sync_${Date.now()}_${counter.toString().padStart(4, '0')}_${Math.random().toString(36).slice(2, 11)}`;
};

const initialState: OfflineSyncState = {
  pendingOperations: [],
  syncStatus: 'idle',
  lastSyncAt: null,
  lastSyncError: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  totalSynced: 0,
  totalFailed: 0,
};

export const useOfflineSyncStore = create<OfflineSyncStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addOperation: (type, payload, priority = PRIORITY_NORMAL) => {
        const id = generateId();
        const operation: PendingSyncOperation = {
          id,
          type,
          payload,
          createdAt: Date.now(),
          retryCount: 0,
          lastRetryAt: null,
          priority,
        };

        set((state) => ({
          pendingOperations: [...state.pendingOperations, operation].sort(
            (a, b) => b.priority - a.priority || a.createdAt - b.createdAt
          ),
        }));

        syncLogger.debug(`[OfflineSync] Added operation: ${type}`, { id, payload });
        return id;
      },

      addOperations: (operations) => {
        const ids: string[] = [];
        const newOperations: PendingSyncOperation[] = operations.map((op) => {
          const id = generateId();
          ids.push(id);
          return {
            id,
            type: op.type,
            payload: op.payload,
            createdAt: Date.now(),
            retryCount: 0,
            lastRetryAt: null,
            priority: op.priority ?? PRIORITY_NORMAL,
          };
        });

        set((state) => ({
          pendingOperations: [...state.pendingOperations, ...newOperations].sort(
            (a, b) => b.priority - a.priority || a.createdAt - b.createdAt
          ),
        }));

        syncLogger.debug(`[OfflineSync] Added ${operations.length} operations`);
        return ids;
      },

      removeOperation: (id) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.filter((op) => op.id !== id),
          totalSynced: state.totalSynced + 1,
        }));
        syncLogger.debug(`[OfflineSync] Removed operation: ${id}`);
      },

      removeOperations: (ids) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.filter((op) => !ids.includes(op.id)),
          totalSynced: state.totalSynced + ids.length,
        }));
        syncLogger.debug(`[OfflineSync] Removed ${ids.length} operations`);
      },

      clearOperations: () => {
        set({ pendingOperations: [] });
        syncLogger.debug('[OfflineSync] Cleared all operations');
      },

      getOperationsByType: (type) => {
        return get().pendingOperations.filter((op) => op.type === type);
      },

      setSyncStatus: (status) => {
        set({ syncStatus: status });
      },

      setOnline: (online) => {
        set({
          isOnline: online,
          syncStatus: online ? 'idle' : 'offline',
        });
        syncLogger.debug(`[OfflineSync] Online status: ${online}`);
      },

      markSyncComplete: () => {
        set({
          syncStatus: 'idle',
          lastSyncAt: Date.now(),
          lastSyncError: null,
        });
        syncLogger.debug('[OfflineSync] Sync completed');
      },

      markSyncError: (error) => {
        set((state) => ({
          syncStatus: 'error',
          lastSyncError: error,
          totalFailed: state.totalFailed + 1,
        }));
        syncLogger.error('[OfflineSync] Sync error:', error);
      },

      incrementRetry: (id) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.map((op) =>
            op.id === id
              ? { ...op, retryCount: op.retryCount + 1, lastRetryAt: Date.now() }
              : op
          ),
        }));
      },

      getRetryableOperations: () => {
        return get().pendingOperations.filter((op) => op.retryCount < MAX_RETRY_COUNT);
      },

      getPendingCount: () => get().pendingOperations.length,

      hasPendingOperations: () => get().pendingOperations.length > 0,
    }),
    {
      name: 'nomo_offline_sync',
      partialize: (state) => ({
        pendingOperations: state.pendingOperations,
        lastSyncAt: state.lastSyncAt,
        totalSynced: state.totalSynced,
        totalFailed: state.totalFailed,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state && !error) {
          // Purge operations that exceeded the retry limit
          const before = state.pendingOperations.length;
          const alive = state.pendingOperations.filter(
            (op) => op.retryCount < MAX_RETRY_COUNT
          );
          if (alive.length < before) {
            state.pendingOperations = alive;
            state.totalFailed += before - alive.length;
            syncLogger.debug(`[OfflineSync] Purged ${before - alive.length} failed operations on rehydrate`);
          }
          syncLogger.debug('[OfflineSync] Store rehydrated', {
            pendingCount: state.pendingOperations.length,
          });
        }
      },
    }
  )
);

// Selector hooks for common use cases
export const usePendingOperationsCount = () =>
  useOfflineSyncStore((s) => s.pendingOperations.length);
export const useSyncStatus = () => useOfflineSyncStore((s) => s.syncStatus);
export const useIsOnline = () => useOfflineSyncStore((s) => s.isOnline);
export const useHasPendingSync = () =>
  useOfflineSyncStore((s) => s.pendingOperations.length > 0);
