import { useCallback, useSyncExternalStore } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authLogger } from '@/lib/logger';

const GUEST_ID_KEY = 'pet_paradise_guest_id';
const GUEST_CHOSEN_KEY = 'pet_paradise_guest_chosen';

// Generate or retrieve a persistent guest ID for offline mode
const getGuestId = (): string => {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest-${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
};

// Check if user has explicitly chosen guest mode
const hasChosenGuestMode = (): boolean => {
  return localStorage.getItem(GUEST_CHOSEN_KEY) === 'true';
};

// Set guest mode choice
const setGuestModeChosen = (chosen: boolean) => {
  if (chosen) {
    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');
  } else {
    localStorage.removeItem(GUEST_CHOSEN_KEY);
  }
};

// ============================================================================
// Singleton Auth Store
// ============================================================================
// All useAuth() instances share ONE auth check and ONE state object.
// This prevents redundant supabase.auth.getSession() calls on startup
// (previously ~13 instances each fired their own network request).

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuestMode: boolean;
}

let _state: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isGuestMode: false,
};

const _listeners = new Set<() => void>();
let _initialized = false;

function _getSnapshot(): AuthState {
  return _state;
}

function _subscribe(onStoreChange: () => void): () => void {
  _listeners.add(onStoreChange);
  return () => _listeners.delete(onStoreChange);
}

function _setState(updates: Partial<AuthState>): void {
  _state = { ..._state, ...updates };
  _listeners.forEach(fn => fn());
}

function _enableGuestMode(): void {
  const guestId = getGuestId();
  setGuestModeChosen(true);

  const guestUser = {
    id: guestId,
    email: 'guest@local',
    app_metadata: {},
    user_metadata: { is_guest: true },
    aud: 'guest',
    created_at: new Date().toISOString()
  } as User;

  _setState({
    user: guestUser,
    session: null,
    isGuestMode: true,
  });
}

// Timeout wrapper for getSession — prevents indefinite hangs on slow networks
const AUTH_TIMEOUT_MS = 8000;

async function _getSessionWithTimeout() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const result = await supabase.auth.getSession();
    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function _initAuth(): void {
  if (_initialized) return;
  _initialized = true;

  if (!isSupabaseConfigured) {
    authLogger.debug('Supabase not configured, using guest mode');
    _enableGuestMode();
    _setState({ isLoading: false });
    return;
  }

  // Single async auth check — shared by ALL useAuth() consumers
  const doInit = async () => {
    try {
      const { data: { session: existingSession }, error } = await _getSessionWithTimeout();

      if (error) {
        authLogger.debug('Auth check failed:', error.message);
        if (hasChosenGuestMode()) {
          _enableGuestMode();
        }
        _setState({ isLoading: false });
        return;
      }

      if (existingSession) {
        _setState({
          session: existingSession,
          user: existingSession.user,
          isGuestMode: false,
          isLoading: false,
        });
        setGuestModeChosen(false);
      } else if (hasChosenGuestMode()) {
        _enableGuestMode();
        _setState({ isLoading: false });
      } else {
        // No session and no guest choice → redirect to auth page
        _setState({ isLoading: false });
      }
    } catch (_error) {
      authLogger.debug('Auth initialization failed');
      if (hasChosenGuestMode()) {
        _enableGuestMode();
      }
      _setState({ isLoading: false });
    }
  };

  doInit();

  // Single auth state change listener — shared by ALL consumers
  supabase.auth.onAuthStateChange(
    async (event, newSession) => {
      if (newSession) {
        _setState({
          session: newSession,
          user: newSession.user,
          isGuestMode: false,
        });
        setGuestModeChosen(false);
      } else if (event === 'SIGNED_OUT') {
        _setState({
          session: null,
          user: null,
          isGuestMode: false,
        });
        setGuestModeChosen(false);
      }
    }
  );
}

// ============================================================================
// Hook
// ============================================================================

export const useAuth = () => {
  // Trigger initialization on first use (before render to avoid extra frame)
  if (!_initialized) {
    _initAuth();
  }

  // All instances share the same snapshot — no duplicate network calls
  const state = useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot);

  const signOut = useCallback(async () => {
    try {
      if (!state.isGuestMode && isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) throw error;
      }

      setGuestModeChosen(false);
      localStorage.removeItem(GUEST_ID_KEY);

      _setState({
        session: null,
        user: null,
        isGuestMode: false,
      });

      toast.success('Signed out successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      toast.error(message);
      throw error;
    }
  }, [state.isGuestMode]);

  const continueAsGuest = useCallback(() => {
    _enableGuestMode();
  }, []);

  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    isGuestMode: state.isGuestMode,
    signOut,
    continueAsGuest
  };
};

/** Reset auth state — for testing only */
export function _resetAuthForTesting(): void {
  _state = { user: null, session: null, isLoading: true, isGuestMode: false };
  _initialized = false;
  _listeners.clear();
}
