/**
 * Offline Sync Manager Hook
 *
 * Manages the synchronization of offline operations with the backend.
 * Automatically triggers sync when coming back online and provides
 * manual sync capabilities.
 *
 * Features:
 * - Automatic sync on reconnection
 * - Exponential backoff for retries
 * - Batch processing of pending operations
 * - Conflict resolution using timestamps
 * - Progress tracking and notifications
 *
 * NOTE: Network status is managed by networkStore.ts
 * This hook subscribes to network changes instead of adding its own listeners.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useOfflineSyncStore, SyncOperationType, PendingSyncOperation } from '@/stores/offlineSyncStore';
import { useNetworkStore } from '@/stores/networkStore';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncLogger } from '@/lib/logger';
import {
  resolveConflict,
  deduplicateOperations,
  validateOperation,
} from '@/lib/conflictResolution';

// Retry configuration
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const BATCH_SIZE = 10; // Process 10 operations at a time

interface SyncResult {
  success: boolean;
  operationId: string;
  error?: string;
}

/**
 * Fetch current server state for conflict resolution
 */
async function fetchServerState(
  type: SyncOperationType,
  userId: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  try {
    switch (type) {
      case 'xp_update':
      case 'coin_update':
      case 'progress_update':
      case 'streak_update': {
        const { data } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single();
        return data || null;
      }

      case 'quest_update': {
        const { data } = await supabase
          .from('quest_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('quest_id', payload.questId as string)
          .single();
        return data || null;
      }

      case 'pet_interaction': {
        const { data } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', userId)
          .eq('pet_type', payload.petType as string)
          .single();
        return data || null;
      }

      case 'profile_update': {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        return data || null;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Process a single sync operation with conflict resolution
 */
async function processSyncOperation(
  operation: PendingSyncOperation,
  userId: string
): Promise<SyncResult> {
  const { id, type, payload } = operation;

  // Validate operation before processing
  if (!validateOperation(operation)) {
    syncLogger.warn(`[SyncManager] Invalid operation ${id}, skipping`);
    return { success: true, operationId: id }; // Mark as success to remove from queue
  }

  try {
    // Fetch current server state for conflict resolution (except for insert-only operations)
    let resolvedPayload = payload;
    if (type !== 'focus_session' && type !== 'achievement_unlock') {
      const serverState = await fetchServerState(type, userId, payload);
      if (serverState) {
        resolvedPayload = resolveConflict(type, payload, serverState);
        syncLogger.debug(`[SyncManager] Resolved conflict for ${type}`, { original: payload, resolved: resolvedPayload });
      }
    }

    switch (type) {
      case 'focus_session': {
        const { error } = await supabase.from('focus_sessions').insert({
          user_id: userId,
          duration_minutes: resolvedPayload.durationMinutes as number,
          xp_earned: resolvedPayload.xpEarned as number,
          session_type: resolvedPayload.sessionType as string || 'focus',
          completed_at: resolvedPayload.completedAt as string || new Date().toISOString(),
        });
        if (error) throw error;
        break;
      }

      case 'progress_update': {
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: userId,
            ...resolvedPayload,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        if (error) throw error;
        break;
      }

      case 'xp_update': {
        const { error } = await supabase
          .from('user_progress')
          .update({
            total_xp: resolvedPayload.totalXp as number ?? resolvedPayload.total_xp as number,
            current_level: resolvedPayload.currentLevel as number ?? resolvedPayload.current_level as number,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        if (error) throw error;
        break;
      }

      case 'coin_update': {
        const { error } = await supabase
          .from('user_progress')
          .update({
            coins: resolvedPayload.coins as number,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        if (error) throw error;
        break;
      }

      case 'streak_update': {
        const { error } = await supabase
          .from('user_progress')
          .update({
            current_streak: resolvedPayload.currentStreak as number ?? resolvedPayload.current_streak as number,
            longest_streak: resolvedPayload.longestStreak as number ?? resolvedPayload.longest_streak as number,
            last_session_date: resolvedPayload.lastSessionDate as string ?? resolvedPayload.last_session_date as string,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        if (error) throw error;
        break;
      }

      case 'quest_update': {
        // Use MAX for progress values
        const currentProgress = resolvedPayload.progress as number;
        const { error } = await supabase
          .from('quest_progress')
          .upsert({
            user_id: userId,
            quest_id: resolvedPayload.questId as string ?? resolvedPayload.quest_id as string,
            progress: currentProgress,
            completed: resolvedPayload.completed as boolean,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,quest_id' });
        if (error) throw error;
        break;
      }

      case 'achievement_unlock': {
        const { error } = await supabase.from('achievements').insert({
          user_id: userId,
          achievement_id: resolvedPayload.achievementId as string ?? resolvedPayload.achievement_id as string,
          unlocked_at: resolvedPayload.unlockedAt as string ?? resolvedPayload.unlocked_at as string ?? new Date().toISOString(),
        });
        // Ignore duplicate key errors for achievements (they're idempotent)
        if (error && !error.message.includes('duplicate')) throw error;
        break;
      }

      case 'pet_interaction': {
        const { error } = await supabase
          .from('pets')
          .update({
            bond_level: resolvedPayload.bondLevel as number ?? resolvedPayload.bond_level as number,
            experience: resolvedPayload.experience as number,
            mood: resolvedPayload.mood as number,
          })
          .eq('user_id', userId)
          .eq('pet_type', resolvedPayload.petType as string ?? resolvedPayload.pet_type as string);
        if (error) throw error;
        break;
      }

      case 'profile_update': {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...resolvedPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        if (error) throw error;
        break;
      }

      default:
        syncLogger.warn(`[SyncManager] Unknown operation type: ${type}`);
        return { success: true, operationId: id };
    }

    return { success: true, operationId: id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    syncLogger.error(`[SyncManager] Failed to sync operation ${id}:`, error);
    return { success: false, operationId: id, error: errorMessage };
  }
}

export interface UseOfflineSyncManagerReturn {
  syncNow: () => Promise<void>;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  queueOperation: (type: SyncOperationType, payload: Record<string, unknown>) => void;
}

export function useOfflineSyncManager(): UseOfflineSyncManagerReturn {
  const { user, isAuthenticated, isGuestMode } = useAuth();
  const syncInProgress = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Network status from the single source of truth
  const isOnline = useNetworkStore((s) => s.isOnline);

  const {
    pendingOperations,
    syncStatus,
    lastSyncAt,
    addOperation,
    removeOperations,
    incrementRetry,
    getRetryableOperations,
    setSyncStatus,
    markSyncComplete,
    markSyncError,
  } = useOfflineSyncStore();

  /**
   * Queue an operation for sync
   */
  const queueOperation = useCallback(
    (type: SyncOperationType, payload: Record<string, unknown>) => {
      // Always queue the operation, even if online (for reliability)
      addOperation(type, {
        ...payload,
        queuedAt: Date.now(),
      });

      syncLogger.debug(`[SyncManager] Queued operation: ${type}`);
    },
    [addOperation]
  );

  /**
   * Process pending operations in batches
   */
  const processBatch = useCallback(
    async (operations: PendingSyncOperation[]): Promise<SyncResult[]> => {
      if (!user || !isSupabaseConfigured) {
        return operations.map((op) => ({
          success: false,
          operationId: op.id,
          error: 'Not authenticated or Supabase not configured',
        }));
      }

      const results = await Promise.all(
        operations.map((op) => processSyncOperation(op, user.id))
      );

      return results;
    },
    [user]
  );

  /**
   * Main sync function with deduplication and conflict resolution
   */
  const syncNow = useCallback(async () => {
    // Skip if already syncing, offline, or guest mode
    if (syncInProgress.current || !isOnline || isGuestMode || !isAuthenticated) {
      return;
    }

    const retryableOps = getRetryableOperations();
    if (retryableOps.length === 0) {
      return;
    }

    // Deduplicate operations before syncing
    const deduplicatedOps = deduplicateOperations(retryableOps);
    if (deduplicatedOps.length < retryableOps.length) {
      syncLogger.info(`[SyncManager] Deduplicated ${retryableOps.length} ops to ${deduplicatedOps.length}`);
    }

    syncInProgress.current = true;
    setSyncStatus('syncing');

    try {
      syncLogger.info(`[SyncManager] Starting sync of ${deduplicatedOps.length} operations`);

      let successCount = 0;
      let failCount = 0;

      // Process in batches
      for (let i = 0; i < deduplicatedOps.length; i += BATCH_SIZE) {
        const batch = deduplicatedOps.slice(i, i + BATCH_SIZE);
        const results = await processBatch(batch);

        const successIds: string[] = [];
        for (const result of results) {
          if (result.success) {
            successIds.push(result.operationId);
            successCount++;
          } else {
            incrementRetry(result.operationId);
            failCount++;
          }
        }

        // Remove successful operations
        if (successIds.length > 0) {
          removeOperations(successIds);
        }
      }

      // Report results
      if (successCount > 0) {
        syncLogger.info(`[SyncManager] Synced ${successCount} operations`);
      }

      if (failCount > 0) {
        syncLogger.warn(`[SyncManager] Failed to sync ${failCount} operations`);
        markSyncError(`Failed to sync ${failCount} operations`);
      } else {
        markSyncComplete();
      }

      // Show toast for significant syncs
      if (successCount > 0) {
        toast.success('Data synced', {
          description: `${successCount} pending ${successCount === 1 ? 'update' : 'updates'} synced successfully`,
          duration: 3000,
        });
      }
    } catch (error) {
      syncLogger.error('[SyncManager] Sync failed:', error);
      markSyncError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      syncInProgress.current = false;
    }
  }, [
    isOnline,
    isGuestMode,
    isAuthenticated,
    getRetryableOperations,
    processBatch,
    setSyncStatus,
    incrementRetry,
    removeOperations,
    markSyncComplete,
    markSyncError,
  ]);

  /**
   * Trigger sync when coming back online
   * Network status is managed by networkStore - no duplicate listeners
   */
  const prevIsOnlineRef = useRef(isOnline);
  useEffect(() => {
    const wasOffline = !prevIsOnlineRef.current;
    prevIsOnlineRef.current = isOnline;

    if (isOnline && wasOffline) {
      syncLogger.info('[SyncManager] Network restored - scheduling sync');
      // Delay sync slightly to ensure connection is stable
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncNow();
      }, 2000);
    }

    if (!isOnline) {
      // Cancel pending sync when going offline
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, syncNow]);

  // Initial sync on mount if online with pending operations
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0 && isAuthenticated && !isGuestMode) {
      syncTimeoutRef.current = setTimeout(() => {
        syncNow();
      }, 3000);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Periodic sync for reliability
   */
  useEffect(() => {
    if (!isOnline || isGuestMode || !isAuthenticated) {
      return;
    }

    // Sync every 5 minutes if there are pending operations
    const intervalId = setInterval(() => {
      if (pendingOperations.length > 0 && !syncInProgress.current) {
        syncNow();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isOnline, isGuestMode, isAuthenticated, pendingOperations.length, syncNow]);

  return {
    syncNow,
    isSyncing: syncStatus === 'syncing',
    pendingCount: pendingOperations.length,
    lastSyncAt,
    queueOperation,
  };
}
