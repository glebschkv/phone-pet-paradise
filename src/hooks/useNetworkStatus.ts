import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
}

/**
 * Hook to monitor network connectivity status
 * Provides offline detection and automatic reconnection notifications
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null,
  });

  const handleOnline = useCallback(() => {
    setStatus(prev => {
      // Only show reconnection toast if we were actually offline
      if (prev.wasOffline) {
        toast.success('Back online!', {
          description: 'Your connection has been restored.',
          duration: 3000,
        });
      }

      return {
        isOnline: true,
        wasOffline: false,
        lastOnlineAt: new Date(),
      };
    });
  }, []);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: true,
    }));

    toast.warning('You are offline', {
      description: 'Some features may not work until you reconnect.',
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    // Set initial status
    setStatus(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  /**
   * Check if a network request should be attempted
   * Returns false if offline, showing appropriate feedback
   */
  const checkConnection = useCallback((showToast = true): boolean => {
    if (!status.isOnline) {
      if (showToast) {
        toast.error('No internet connection', {
          description: 'Please check your connection and try again.',
        });
      }
      return false;
    }
    return true;
  }, [status.isOnline]);

  return {
    isOnline: status.isOnline,
    wasOffline: status.wasOffline,
    lastOnlineAt: status.lastOnlineAt,
    checkConnection,
  };
};
