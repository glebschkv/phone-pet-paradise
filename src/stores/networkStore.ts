/**
 * Network Status Store
 *
 * SINGLE SOURCE OF TRUTH for network connectivity status.
 *
 * This store consolidates what was previously scattered across:
 * - AppContext (isOnline state + window listeners)
 * - OfflineSyncStore (isOnline state + setOnline)
 * - OfflineContext (window listeners + wasOffline tracking)
 * - useOfflineSyncManager (window listeners)
 * - useNetworkStatus hook (window listeners + state)
 *
 * Now there's ONE place that:
 * - Listens to window online/offline events
 * - Maintains the isOnline state
 * - Provides derived state like wasOffline, lastOnlineAt
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { syncLogger } from '@/lib/logger';

export interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
}

interface NetworkStore extends NetworkState {
  // Actions
  setOnline: (online: boolean) => void;

  // Initialization (called once at app startup)
  initialize: () => () => void;
}

const initialState: NetworkState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  wasOffline: false,
  lastOnlineAt: null,
  lastOfflineAt: null,
};

export const useNetworkStore = create<NetworkStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setOnline: (online: boolean) => {
      const currentState = get();

      if (online === currentState.isOnline) {
        return; // No change
      }

      if (online) {
        // Coming back online
        set({
          isOnline: true,
          wasOffline: true, // Was previously offline
          lastOnlineAt: Date.now(),
        });
        syncLogger.info('[NetworkStore] Network restored');
      } else {
        // Going offline
        set({
          isOnline: false,
          lastOfflineAt: Date.now(),
        });
        syncLogger.info('[NetworkStore] Network lost');
      }
    },

    initialize: () => {
      const { setOnline } = get();

      const handleOnline = () => setOnline(true);
      const handleOffline = () => setOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Set initial state
      set({ isOnline: navigator.onLine });

      syncLogger.debug('[NetworkStore] Initialized with isOnline:', navigator.onLine);

      // Return cleanup function
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    },
  }))
);

// Selector hooks for optimized rendering
export const useIsOnline = () => useNetworkStore((s) => s.isOnline);
export const useWasOffline = () => useNetworkStore((s) => s.wasOffline);

/**
 * Subscribe to online/offline transitions
 * Returns unsubscribe function
 */
export function onNetworkStatusChange(
  callback: (isOnline: boolean, wasOffline: boolean) => void
): () => void {
  return useNetworkStore.subscribe(
    (state) => state.isOnline,
    (isOnline) => {
      const wasOffline = useNetworkStore.getState().wasOffline;
      callback(isOnline, wasOffline);
    }
  );
}

/**
 * Clear the wasOffline flag (e.g., after showing a "back online" notification)
 */
export function clearWasOffline() {
  useNetworkStore.setState({ wasOffline: false });
}
