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
 */

import { useEffect, useCallback, useRef } from 'react';
import { useOfflineSyncStore, SyncOperationType, PendingSyncOperation } from '@/stores/offlineSyncStore';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncLogger } from '@/lib/logger';

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
 * Process a single sync operation
 */
async function processSyncOperation(
  operation: PendingSyncOperation,
  userId: string
): Promise<SyncResult> {
  const { id, type, payload } = operation;

  try {
    switch (type) {
      case 'focus_session': {
        const { error } = await supabase.from('focus_sessions').insert({
          user_id: userId,
          duration_minutes: payload.durationMinutes as number,
          xp_earned: payload.xpEarned as number,
          session_type: payload.sessionType as string || 'focus',
          completed_at: payload.completedAt as string || new Date().toISOString(),
        });
        if (error) throw error;
        break;
      }

      case 'progress_update': {
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: userId,
            ...payload,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        if (error) throw error;
        break;
      }

      case 'xp_update': {
        const { error } = await supabase
          .from('user_progress')
          .update({
            total_xp: payload.totalXp as number,
            current_level: payload.currentLevel as number,
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
            coins: payload.coins as number,
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
            current_streak: payload.currentStreak as number,
            longest_streak: payload.longestStreak as number,
            last_session_date: payload.lastSessionDate as string,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        if (error) throw error;
        break;
      }

      case 'quest_update': {
        const { error } = await supabase
          .from('quest_progress')
          .upsert({
            user_id: userId,
            quest_id: payload.questId as string,
            progress: payload.progress as number,
            completed: payload.completed as boolean,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,quest_id' });
        if (error) throw error;
        break;
      }

      case 'achievement_unlock': {
        const { error } = await supabase.from('achievements').insert({
          user_id: userId,
          achievement_id: payload.achievementId as string,
          unlocked_at: payload.unlockedAt as string || new Date().toISOString(),
        });
        // Ignore duplicate key errors for achievements
        if (error && !error.message.includes('duplicate')) throw error;
        break;
      }

      case 'pet_interaction': {
        const { error } = await supabase
          .from('pets')
          .update({
            bond_level: payload.bondLevel as number,
            experience: payload.experience as number,
            mood: payload.mood as number,
          })
          .eq('user_id', userId)
          .eq('pet_type', payload.petType as string);
        if (error) throw error;
        break;
      }

      case 'profile_update': {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        if (error) throw error;
        break;
      }

      default:
        syncLogger.warn(`[SyncManager] Unknown operation type: ${type}`);
        // Return success for unknown types to remove them from queue
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

  const {
    pendingOperations,
    syncStatus,
    lastSyncAt,
    isOnline,
    addOperation,
    removeOperation,
    removeOperations,
    incrementRetry,
    getRetryableOperations,
    setSyncStatus,
    setOnline,
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
   * Main sync function
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

    syncInProgress.current = true;
    setSyncStatus('syncing');

    try {
      syncLogger.info(`[SyncManager] Starting sync of ${retryableOps.length} operations`);

      let successCount = 0;
      let failCount = 0;

      // Process in batches with atomic removal per operation
      for (let i = 0; i < retryableOps.length; i += BATCH_SIZE) {
        const batch = retryableOps.slice(i, i + BATCH_SIZE);
        const results = await processBatch(batch);

        // Process each result immediately to ensure atomic removal
        // This prevents data duplication if removal fails for some operations
        for (const result of results) {
          if (result.success) {
            // Remove immediately after successful sync to prevent duplicates on retry
            try {
              removeOperation(result.operationId);
              successCount++;
            } catch (removeError) {
              // Log but continue - operation was synced successfully
              syncLogger.error(`[SyncManager] Failed to remove synced operation ${result.operationId}:`, removeError);
              successCount++;
            }
          } else {
            incrementRetry(result.operationId);
            failCount++;
          }
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
    removeOperation,
    markSyncComplete,
    markSyncError,
  ]);

  /**
   * Clear pending operations when user logs out to prevent stuck operations
   */
  useEffect(() => {
    if (!isAuthenticated && !isGuestMode && pendingOperations.length > 0) {
      syncLogger.info('[SyncManager] User logged out, clearing pending operations to prevent stuck state');
      // Clear all pending operations since they can't be synced without a user
      useOfflineSyncStore.getState().clearOperations();
    }
  }, [isAuthenticated, isGuestMode, pendingOperations.length]);

  /**
   * Handle online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      syncLogger.info('[SyncManager] Network restored');
      setOnline(true);

      // Delay sync slightly to ensure connection is stable
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncNow();
      }, 2000);
    };

    const handleOffline = () => {
      syncLogger.info('[SyncManager] Network lost');
      setOnline(false);

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync on mount if online with pending operations
    if (navigator.onLine && pendingOperations.length > 0 && isAuthenticated && !isGuestMode) {
      syncTimeoutRef.current = setTimeout(() => {
        syncNow();
      }, 3000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [setOnline, syncNow, pendingOperations.length, isAuthenticated, isGuestMode]);

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
