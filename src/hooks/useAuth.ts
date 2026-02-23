import { useCallback, useSyncExternalStore } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authLogger } from '@/lib/logger';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { ACHIEVEMENT_STORAGE_KEY } from '@/services/achievement/achievementConstants';
import { useShopStore } from '@/stores/shopStore';
import { useStreakStore } from '@/stores/streakStore';
import { usePremiumStore } from '@/stores/premiumStore';
import { useAuthStore } from '@/stores/authStore';

const GUEST_ID_KEY = 'pet_paradise_guest_id';
const GUEST_CHOSEN_KEY = 'pet_paradise_guest_chosen';

/** Check if a Supabase user is an anonymous (guest) account */
export function isAnonymousUser(user: User | null): boolean {
  return user?.is_anonymous === true;
}

/**
 * Clear per-user data from localStorage on sign-out.
 * This prevents stale data (e.g. purchased bundles, coins) from persisting
 * when a different user signs in on the same device.
 * Device-level settings (theme, sound, onboarding) are NOT cleared.
 */
function clearUserData() {
  const userDataKeys = [
    // ── Zustand persisted stores (use their persist key) ──
    'petIsland_shopInventory',
    'petparadise-collection',  // collectionStore
    'nomo_offline_sync',       // offlineSyncStore — CRITICAL: prevents syncing wrong user's data
    'nomo_premium',            // premiumStore
    'nomo_focus_mode',         // focusStore

    // ── nomo_ prefix keys (centralized STORAGE_KEYS) ──
    'nomo_coin_system',
    'nomo_coin_booster',
    'nomo_shop_inventory',
    'nomo_xp_system',
    'nomo_streak_data',
    'nomo_quests',
    'nomo_quest_system',
    'nomo_battle_pass',
    'nomo_lucky_wheel',
    'nomo_combo_system',
    'nomo_milestones',
    'nomo_bond_data',
    'nomo_favorites',
    'nomo_premium_status',
    'nomo_analytics_sessions',
    'nomo_analytics_daily_stats',
    'nomo_analytics_records',
    'nomo_boss_challenges',
    'nomo_special_events',
    'nomo_guild_data',
    'nomo_timer_state',
    'nomo_timer_persistence',
    'nomo_collection',
    'nomo_app_state',
    'nomo_focus_presets',
    'nomo_session_notes',
    'nomo_selected_apps',
    'nomo_device_activity',

    // ── Achievement tracking ──
    'achievement-tracking-stats',
    // Legacy global achievement key — now per-user via achievement-system-data-<userId>,
    // but the old global key must be removed to prevent cross-user leaks from pre-migration data.
    ACHIEVEMENT_STORAGE_KEY,

    // ── Legacy daily login key (per-user keys use pet_paradise_daily_login_<userId>
    // and are NOT cleared — they're already isolated per-user and should persist) ──
    'pet_paradise_daily_login',

    // ── Hardcoded legacy keys (hooks that bypass STORAGE_KEYS) ──
    'pet-bond-data',           // useBondSystem
    'quest-system-data',       // useQuestSystem
    'petIsland_boosterSystem', // useCoinBooster

    // ── Legacy prefix keys ──
    'petIsland_premium',
    'petIsland_focusMode',
    'petIsland_focusPresets',
    'petIsland_sessionNotes',
    'petIsland_coinSystem',
    'petIsland_soundMixer',
    'petIsland_ambientSound',
    'petparadise_coins',
    'petparadise_xp',
    'petparadise_streak',
  ];
  for (const key of userDataKeys) {
    localStorage.removeItem(key);
  }

  // Also reset Zustand in-memory stores so stale data (e.g. purchased bundle
  // IDs, coin balance, premium tier) doesn't persist until the next full page reload.
  try { useShopStore.getState().resetShop(); } catch { /* store may not be initialized */ }
  try { useStreakStore.setState({ currentStreak: 0, longestStreak: 0, lastSessionDate: '', totalSessions: 0, streakFreezeCount: 0 }); } catch { /* store may not be initialized */ }
  try { usePremiumStore.getState().clearPremium(); } catch { /* store may not be initialized */ }
}

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
  passwordRecoveryPending: boolean;
}

let _state: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isGuestMode: false,
  passwordRecoveryPending: false,
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
  // Keep the Zustand authStore in sync so useIsGuestMode() returns the right value
  if ('isGuestMode' in updates) {
    try { useAuthStore.getState().setGuestMode(updates.isGuestMode ?? false); } catch { /* store may not be initialized */ }
  }
}

/**
 * Enable guest mode using Supabase Anonymous Auth.
 * Creates a real (anonymous) Supabase user so the guest gets a real user_id
 * and session — enabling purchases, server-side validation, and seamless
 * account linking when they later sign up.
 *
 * Falls back to local-only guest mode if anonymous auth fails (e.g. offline).
 */
async function _enableGuestMode(): Promise<void> {
  setGuestModeChosen(true);

  // Try Supabase anonymous auth first — gives the guest a real server-side identity
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.session) {
        authLogger.debug('Anonymous auth succeeded, user:', data.user?.id);
        // onAuthStateChange will fire and set the state, but we also
        // set it here for immediate UI update (avoids flicker)
        _setState({
          user: data.user,
          session: data.session,
          isGuestMode: true,
          isLoading: false,
        });
        return;
      }
      authLogger.debug('Anonymous auth failed, falling back to local guest:', error?.message);
    } catch (err) {
      authLogger.debug('Anonymous auth exception, falling back to local guest:', err);
    }
  }

  // Fallback: local-only guest (no server identity, purchases unavailable)
  const guestId = getGuestId();
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

// Timeout for getSession — prevents indefinite hangs on slow networks.
// Supabase's getSession doesn't accept an AbortSignal, so we use Promise.race.
const AUTH_TIMEOUT_MS = 8000;

function _getSessionWithTimeout() {
  return Promise.race([
    supabase.auth.getSession(),
    new Promise<never>((_resolve, reject) =>
      setTimeout(() => reject(new Error('Auth session check timed out')), AUTH_TIMEOUT_MS)
    ),
  ]);
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
          await _enableGuestMode();
        }
        _setState({ isLoading: false });
        return;
      }

      if (existingSession) {
        // Anonymous sessions are still "guest mode" for UI purposes
        const isAnon = existingSession.user.is_anonymous === true;
        _setState({
          session: existingSession,
          user: existingSession.user,
          isGuestMode: isAnon,
          isLoading: false,
        });
        if (!isAnon) {
          setGuestModeChosen(false);
        }
      } else if (hasChosenGuestMode()) {
        await _enableGuestMode();
        _setState({ isLoading: false });
      } else {
        // No session and no guest choice → redirect to auth page
        _setState({ isLoading: false });
      }
    } catch (_error) {
      authLogger.debug('Auth initialization failed');
      if (hasChosenGuestMode()) {
        await _enableGuestMode();
      }
      _setState({ isLoading: false });
    }
  };

  doInit();

  // Single auth state change listener — shared by ALL consumers
  supabase.auth.onAuthStateChange(
    async (event, newSession) => {
      if (event === 'PASSWORD_RECOVERY' && newSession) {
        // Password reset deep link — session established, flag for Auth page
        _setState({
          session: newSession,
          user: newSession.user,
          isGuestMode: false,
          passwordRecoveryPending: true,
        });
        setGuestModeChosen(false);
      } else if (newSession) {
        const isAnon = newSession.user.is_anonymous === true;
        _setState({
          session: newSession,
          user: newSession.user,
          isGuestMode: isAnon,
        });
        if (!isAnon) {
          setGuestModeChosen(false);
        }
        // Dispatch custom event so other hooks (e.g. useCoinSystem) can react
        // without registering duplicate onAuthStateChange listeners
        if (event === 'SIGNED_IN') {
          window.dispatchEvent(new Event('auth:signed_in'));
        }
      } else if (event === 'SIGNED_OUT') {
        clearUserData();
        _setState({
          session: null,
          user: null,
          isGuestMode: false,
        });
        setGuestModeChosen(false);
      }
    }
  );

  // Deep link handler for magic link authentication on native (Capacitor).
  // When the user taps a magic link in their email, iOS opens the app via
  // the co.nomoinc.nomo:// URL scheme. We need to extract the auth tokens
  // from the URL and pass them to Supabase so onAuthStateChange fires.
  if (Capacitor.isNativePlatform()) {
    CapApp.addListener('appUrlOpen', async ({ url }) => {
      authLogger.debug('Deep link received:', url);
      try {
        // PKCE flow: URL contains ?code=XXX
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        if (code) {
          authLogger.debug('Exchanging auth code for session');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            authLogger.debug('Code exchange failed:', error.message);
            toast.error('Login failed. Please try again.');
          }
          return;
        }

        // Implicit flow: URL contains #access_token=XXX&refresh_token=YYY
        const hashParams = new URLSearchParams(url.split('#')[1] || '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          authLogger.debug('Setting session from magic link tokens');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            authLogger.debug('setSession failed:', error.message);
            toast.error('Login failed. Please try again.');
          }
          return;
        }
      } catch (err) {
        authLogger.debug('Deep link auth error:', err);
      }
    });
  }
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
      // Sign out from Supabase (works for both anonymous and regular sessions)
      if (state.session && isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) throw error;
      }

      setGuestModeChosen(false);
      localStorage.removeItem(GUEST_ID_KEY);

      // Clear per-user data so the next sign-in starts fresh
      // (prevents stale shop inventory, coins, etc. from leaking across accounts)
      clearUserData();

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
  }, [state.session]);

  const continueAsGuest = useCallback(async () => {
    await _enableGuestMode();
  }, []);

  const clearPasswordRecovery = useCallback(() => {
    _setState({ passwordRecoveryPending: false });
  }, []);

  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    isGuestMode: state.isGuestMode,
    /** True when the user is an anonymous Supabase user (has real session but no email/social identity yet) */
    isAnonymous: isAnonymousUser(state.user),
    passwordRecoveryPending: state.passwordRecoveryPending,
    signOut,
    continueAsGuest,
    clearPasswordRecovery,
  };
};

/** Reset auth state — for testing only */
export function _resetAuthForTesting(): void {
  _state = { user: null, session: null, isLoading: true, isGuestMode: false, passwordRecoveryPending: false };
  _initialized = false;
  _listeners.clear();
}
