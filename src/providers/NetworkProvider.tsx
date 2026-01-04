/**
 * Network Provider
 *
 * Initializes the network status store and sets up window event listeners.
 * This must be rendered once at the app root to enable network status tracking.
 */

import { useEffect, ReactNode } from 'react';
import { useNetworkStore } from '@/stores/networkStore';

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const initialize = useNetworkStore((s) => s.initialize);

  useEffect(() => {
    // Initialize network listeners and return cleanup function
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  return <>{children}</>;
}
