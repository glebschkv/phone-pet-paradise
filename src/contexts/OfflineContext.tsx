/**
 * Offline Context Provider
 *
 * Provides offline-first functionality across the app.
 * Manages sync queue and service worker integration.
 *
 * Features:
 * - Manages pending sync operations
 * - Auto-syncs when coming back online
 * - Provides offline-safe data mutation helpers
 *
 * NOTE: Network status (isOnline) is managed by networkStore.ts
 * This context now reads from the store instead of managing its own state.
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useOfflineSyncManager, UseOfflineSyncManagerReturn } from '@/hooks/useOfflineSyncManager';
import { useServiceWorker, useServiceWorkerSync } from '@/hooks/useServiceWorker';
import { useOfflineSyncStore, SyncOperationType } from '@/stores/offlineSyncStore';
import { useNetworkStore, clearWasOffline } from '@/stores/networkStore';
import { toast } from 'sonner';
import { syncLogger } from '@/lib/logger';

interface OfflineContextValue {
  // Network status
  isOnline: boolean;
  wasOffline: boolean;

  // Sync status
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  hasPendingSync: boolean;

  // Service worker status
  isServiceWorkerReady: boolean;
  isUpdateAvailable: boolean;

  // Actions
  syncNow: () => Promise<void>;
  queueOperation: (type: SyncOperationType, payload: Record<string, unknown>) => void;
  refreshApp: () => void;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const syncManager = useOfflineSyncManager();
  const serviceWorker = useServiceWorker();
  const { pendingOperations } = useOfflineSyncStore();

  // Network status now comes from networkStore - single source of truth
  const { isOnline, wasOffline } = useNetworkStore();
  const prevIsOnlineRef = useRef(isOnline);

  // Handle service worker sync requests
  useServiceWorkerSync(() => {
    syncLogger.info('[OfflineContext] Service worker requested sync');
    syncManager.syncNow();
  });

  // React to network status changes from networkStore
  useEffect(() => {
    const prevIsOnline = prevIsOnlineRef.current;
    prevIsOnlineRef.current = isOnline;

    // Show toast when coming back online
    if (isOnline && !prevIsOnline && wasOffline) {
      toast.success('Back online!', {
        description: pendingOperations.length > 0
          ? `Syncing ${pendingOperations.length} pending updates...`
          : 'Your connection has been restored.',
        duration: 3000,
      });
      // Clear the wasOffline flag after showing notification
      clearWasOffline();
    }

    // Show toast when going offline
    if (!isOnline && prevIsOnline) {
      toast.warning('You\'re offline', {
        description: 'Don\'t worry - your data is saved locally and will sync when you\'re back online.',
        duration: 5000,
      });
    }
  }, [isOnline, wasOffline, pendingOperations.length]);

  // Refresh app (for updates)
  const refreshApp = React.useCallback(() => {
    window.location.reload();
  }, []);

  const value = useMemo<OfflineContextValue>(
    () => ({
      // Network status
      isOnline,
      wasOffline,

      // Sync status
      isSyncing: syncManager.isSyncing,
      pendingCount: syncManager.pendingCount,
      lastSyncAt: syncManager.lastSyncAt,
      hasPendingSync: syncManager.pendingCount > 0,

      // Service worker status
      isServiceWorkerReady: serviceWorker.isRegistered,
      isUpdateAvailable: serviceWorker.isUpdateAvailable,

      // Actions
      syncNow: syncManager.syncNow,
      queueOperation: syncManager.queueOperation,
      refreshApp,
    }),
    [isOnline, wasOffline, syncManager, serviceWorker, refreshApp]
  );

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

/**
 * Hook to access offline context
 */
export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

/**
 * Hook to check if the app is online
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOffline();
  return isOnline;
}

/**
 * Hook to check if there are pending sync operations
 */
export function useHasPendingSync(): boolean {
  const { hasPendingSync } = useOffline();
  return hasPendingSync;
}

/**
 * Hook to get sync status
 */
export function useSyncStatus() {
  const { isSyncing, pendingCount, lastSyncAt } = useOffline();
  return { isSyncing, pendingCount, lastSyncAt };
}
