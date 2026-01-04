/**
 * Global App Context
 *
 * Provides centralized state management for frequently accessed app-wide data.
 * This reduces prop drilling and improves component organization.
 *
 * NOTE: Network status (isOnline) is managed by networkStore.ts
 * Use useIsOnline() from '@/stores/networkStore' for network status.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';
import { useNetworkStore } from '@/stores/networkStore';
import { APP_CONFIG } from '@/lib/constants';
import type {
  UserProfile,
  AppTheme,
  AppSettings,
  AppState,
  AppAction,
  AppContextValue,
  SubscriptionTier,
} from '@/types';

// Re-export types for backwards compatibility
export type { UserProfile, AppTheme, AppSettings, AppState, AppContextValue } from '@/types';

// ============================================================================
// Initial State
// ============================================================================

const getInitialSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(`${APP_CONFIG.STORAGE_PREFIX}settings`);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings;
};

const defaultSettings: AppSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  notificationsEnabled: true,
  autoBreakEnabled: false,
  showTips: true,
};

const getInitialTheme = (): AppTheme => {
  try {
    const saved = localStorage.getItem(`${APP_CONFIG.STORAGE_PREFIX}theme`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return { mode: 'system' };
};

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isGuest: true,
  isPremium: false,
  premiumTier: 'free',
  premiumExpiresAt: undefined,
  theme: getInitialTheme(),
  settings: getInitialSettings(),
  isLoading: false,
  isOnline: true, // Deprecated: use useIsOnline() from networkStore
  hasUnsyncedData: false,
  appVersion: APP_CONFIG.APP_VERSION,
  platform: 'web',
};

// ============================================================================
// Reducer
// ============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isGuest: action.payload === null,
      };

    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload,
        isGuest: !action.payload,
      };

    case 'SET_PREMIUM_STATUS':
      return {
        ...state,
        isPremium: action.payload.isPremium,
        premiumTier: action.payload.tier,
        premiumExpiresAt: action.payload.expiresAt,
      };

    case 'SET_THEME':
      localStorage.setItem(`${APP_CONFIG.STORAGE_PREFIX}theme`, JSON.stringify(action.payload));
      return {
        ...state,
        theme: action.payload,
      };

    case 'SET_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };
      localStorage.setItem(`${APP_CONFIG.STORAGE_PREFIX}settings`, JSON.stringify(newSettings));
      return {
        ...state,
        settings: newSettings,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    // SET_ONLINE is deprecated - network state is managed by networkStore
    case 'SET_ONLINE':
      return state; // No-op for backwards compatibility

    case 'SET_UNSYNCED_DATA':
      return {
        ...state,
        hasUnsyncedData: action.payload,
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        theme: state.theme,
        settings: state.settings,
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const { isPremium, tier, expiresAt } = usePremiumStatus();
  const pendingOperationsCount = useOfflineSyncStore((s) => s.pendingOperations.length);

  // Sync auth state
  useEffect(() => {
    if (user) {
      dispatch({
        type: 'SET_USER',
        payload: {
          id: user.id,
          email: user.email,
          displayName: user.user_metadata?.display_name,
          avatarUrl: user.user_metadata?.avatar_url,
        },
      });
    } else {
      dispatch({ type: 'SET_USER', payload: null });
    }
  }, [user]);

  useEffect(() => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: isAuthenticated });
  }, [isAuthenticated]);

  // Sync premium status
  useEffect(() => {
    dispatch({
      type: 'SET_PREMIUM_STATUS',
      payload: { isPremium, tier, expiresAt },
    });
  }, [isPremium, tier, expiresAt]);

  // NOTE: Online/offline events are now handled by networkStore.ts
  // Use useIsOnline() from '@/stores/networkStore' for network status

  // Sync hasUnsyncedData with offline sync store
  useEffect(() => {
    dispatch({ type: 'SET_UNSYNCED_DATA', payload: pendingOperationsCount > 0 });
  }, [pendingOperationsCount]);

  // Convenience methods
  const setUser = useCallback((user: UserProfile | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const setTheme = useCallback((theme: AppTheme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setUser,
      setTheme,
      updateSettings,
      setLoading,
      logout,
    }),
    [state, setUser, setTheme, updateSettings, setLoading, logout]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks for specific parts of state
// eslint-disable-next-line react-refresh/only-export-components
export function useAppUser() {
  const { state } = useAppContext();
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isGuest: state.isGuest,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppPremium() {
  const { state } = useAppContext();
  return {
    isPremium: state.isPremium,
    premiumTier: state.premiumTier,
    premiumExpiresAt: state.premiumExpiresAt,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppTheme() {
  const { state, setTheme } = useAppContext();
  return {
    theme: state.theme,
    setTheme,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppSettings() {
  const { state, updateSettings } = useAppContext();
  return {
    settings: state.settings,
    updateSettings,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppStatus() {
  const { state, setLoading } = useAppContext();
  // isOnline now comes from networkStore - single source of truth
  const isOnline = useNetworkStore((s) => s.isOnline);
  return {
    isLoading: state.isLoading,
    isOnline,
    hasUnsyncedData: state.hasUnsyncedData,
    setLoading,
  };
}
