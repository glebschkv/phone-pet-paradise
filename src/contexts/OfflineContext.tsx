/**
 * Offline Context Provider
 *
 * Provides offline-first functionality across the app.
 * Manages network status, sync queue, and service worker integration.
 *
 * Features:
 * - Tracks online/offline status
 * - Manages pending sync operations
 * - Auto-syncs when coming back online
 * - Provides offline-safe data mutation helpers
 */

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useOfflineSyncManager, UseOfflineSyncManagerReturn } from '@/hooks/useOfflineSyncManager';
import { useServiceWorker, useServiceWorkerSync } from '@/hooks/useServiceWorker';
import { useOfflineSyncStore, SyncOperationType } from '@/stores/offlineSyncStore';
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
  const { isOnline, pendingOperations, setOnline } = useOfflineSyncStore();

  // Track if we were previously offline (for showing "back online" notifications)
  const [wasOffline, setWasOffline] = React.useState(false);

  // Handle service worker sync requests
  useServiceWorkerSync(() => {
    syncLogger.info('[OfflineContext] Service worker requested sync');
    syncManager.syncNow();
  });

  // Handle online/offline transitions
  useEffect(() => {
    const handleOnline = () => {
      syncLogger.info('[OfflineContext] Network restored');
      setOnline(true);

      if (wasOffline) {
        toast.success('Back online!', {
          description: pendingOperations.length > 0
            ? `Syncing ${pendingOperations.length} pending updates...`
            : 'Your connection has been restored.',
          duration: 3000,
        });
      }

      setWasOffline(false);
    };

    const handleOffline = () => {
      syncLogger.info('[OfflineContext] Network lost');
      setOnline(false);
      setWasOffline(true);

      toast.warning('You\'re offline', {
        description: 'Don\'t worry - your data is saved locally and will sync when you\'re back online.',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, wasOffline, pendingOperations.length]);

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
