/**
 * Global App Context
 *
 * Provides centralized state management for frequently accessed app-wide data.
 * This reduces prop drilling and improves component organization.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { APP_CONFIG } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AppTheme {
  mode: 'light' | 'dark' | 'system';
  primaryColor?: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  autoBreakEnabled: boolean;
  showTips: boolean;
}

export interface AppState {
  // User & Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;

  // Premium Status
  isPremium: boolean;
  premiumTier: 'free' | 'premium' | 'lifetime';
  premiumExpiresAt?: string;

  // Theme & Settings
  theme: AppTheme;
  settings: AppSettings;

  // UI State
  isLoading: boolean;
  isOnline: boolean;
  hasUnsyncedData: boolean;

  // App Info
  appVersion: string;
  platform: string;
}

type AppAction =
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: { isPremium: boolean; tier: 'free' | 'premium' | 'lifetime'; expiresAt?: string } }
  | { type: 'SET_THEME'; payload: AppTheme }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_UNSYNCED_DATA'; payload: boolean }
  | { type: 'RESET_STATE' };

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // Convenience methods
  setUser: (user: UserProfile | null) => void;
  setTheme: (theme: AppTheme) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

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
  isOnline: navigator.onLine,
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

    case 'SET_ONLINE':
      return {
        ...state,
        isOnline: action.payload,
      };

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

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
  return {
    isLoading: state.isLoading,
    isOnline: state.isOnline,
    hasUnsyncedData: state.hasUnsyncedData,
    setLoading,
  };
}
