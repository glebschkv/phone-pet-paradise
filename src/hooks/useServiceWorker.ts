/**
 * Service Worker Registration Hook
 *
 * Handles service worker registration and lifecycle management.
 * Provides update notifications and manual update triggers.
 */

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { syncLogger } from '@/lib/logger';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  update: () => Promise<void>;
  unregister: () => Promise<boolean>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
  });

  const handleUpdate = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();
      syncLogger.info('[ServiceWorker] Update check triggered');
    } catch (error) {
      syncLogger.error('[ServiceWorker] Update check failed:', error);
    }
  }, [state.registration]);

  const handleUnregister = useCallback(async (): Promise<boolean> => {
    if (!state.registration) return false;

    try {
      const success = await state.registration.unregister();
      if (success) {
        setState((prev) => ({
          ...prev,
          isRegistered: false,
          registration: null,
        }));
        syncLogger.info('[ServiceWorker] Unregistered successfully');
      }
      return success;
    } catch (error) {
      syncLogger.error('[ServiceWorker] Unregister failed:', error);
      return false;
    }
  }, [state.registration]);

  useEffect(() => {
    if (!state.isSupported) {
      syncLogger.info('[ServiceWorker] Service workers not supported');
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let updateInterval: ReturnType<typeof setInterval> | undefined;
    let messageHandler: ((event: MessageEvent) => void) | undefined;

    const registerServiceWorker = async () => {
      try {
        // Register the service worker
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        syncLogger.info('[ServiceWorker] Registered successfully');

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                setState((prev) => ({
                  ...prev,
                  isUpdateAvailable: true,
                }));

                toast.info('Update available', {
                  description: 'A new version is available. Refresh to update.',
                  action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload(),
                  },
                  duration: 10000,
                });
              }
            });
          }
        });

        // Check for updates periodically (every 30 minutes)
        updateInterval = setInterval(() => {
          registration?.update().catch((error) => {
            syncLogger.warn('[ServiceWorker] Periodic update check failed:', error);
          });
        }, 30 * 60 * 1000);

        // Listen for messages from the service worker
        messageHandler = (event: MessageEvent) => {
          if (event.data?.type === 'SYNC_REQUESTED') {
            // Dispatch custom event for the sync manager to handle
            window.dispatchEvent(new CustomEvent('sw-sync-requested'));
          }
        };
        navigator.serviceWorker.addEventListener('message', messageHandler);
      } catch (error) {
        syncLogger.error('[ServiceWorker] Registration failed:', error);
      }
    };

    // Only register in production or when not in development mode
    const isDev = import.meta.env.DEV;
    if (!isDev) {
      registerServiceWorker();
    } else {
      syncLogger.info('[ServiceWorker] Skipping registration in development mode');
    }

    // Cleanup on unmount
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (messageHandler) {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      }
    };
  }, [state.isSupported]);

  return {
    ...state,
    update: handleUpdate,
    unregister: handleUnregister,
  };
}

/**
 * Hook to listen for service worker sync requests
 */
export function useServiceWorkerSync(onSyncRequested: () => void) {
  useEffect(() => {
    const handleSyncRequest = () => {
      onSyncRequested();
    };

    window.addEventListener('sw-sync-requested', handleSyncRequest);

    return () => {
      window.removeEventListener('sw-sync-requested', handleSyncRequest);
    };
  }, [onSyncRequested]);
}

/**
 * Request background sync registration
 */
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-expect-error - sync is not yet in TypeScript types
    await registration.sync.register(tag);
    return true;
  } catch (error) {
    syncLogger.error('[ServiceWorker] Background sync registration failed:', error);
    return false;
  }
}
