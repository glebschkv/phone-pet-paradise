import { createContext, useContext } from 'react';

// The return type of useAppStateTracking — import it as a type
type AppStateValue = ReturnType<typeof import('@/hooks/useAppStateTracking').useAppStateTracking>;

const AppStateContext = createContext<AppStateValue | null>(null);

export const AppStateProvider = AppStateContext.Provider;

/**
 * Read shared app state from context instead of creating an independent
 * useAppStateTracking() instance. This must be used inside an
 * <AppStateProvider> (rendered by GameUI).
 */
export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider (GameUI)');
  }
  return ctx;
}
