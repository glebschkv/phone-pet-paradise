/**
 * Network Status Hook
 *
 * Provides network connectivity information from the centralized networkStore.
 * This is a convenience wrapper around the store for components that prefer hooks.
 *
 * NOTE: The actual network status management (window listeners) is handled
 * by networkStore.ts. This hook just provides a convenient interface.
 */

import { useCallback } from 'react';
import { useNetworkStore } from '@/stores/networkStore';
import { toast } from 'sonner';

/**
 * Hook to monitor network connectivity status
 * Provides offline detection and connection checking utilities
 */
export const useNetworkStatus = () => {
  const { isOnline, wasOffline, lastOnlineAt } = useNetworkStore();

  /**
   * Check if a network request should be attempted
   * Returns false if offline, showing appropriate feedback
   */
  const checkConnection = useCallback((showToast = true): boolean => {
    if (!isOnline) {
      if (showToast) {
        toast.error('No internet connection', {
          description: 'Please check your connection and try again.',
        });
      }
      return false;
    }
    return true;
  }, [isOnline]);

  return {
    isOnline,
    wasOffline,
    lastOnlineAt: lastOnlineAt ? new Date(lastOnlineAt) : null,
    checkConnection,
  };
};
