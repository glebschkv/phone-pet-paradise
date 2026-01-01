import { useState, useEffect, useCallback } from 'react';
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

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const enableGuestMode = useCallback(() => {
    const guestId = getGuestId();
    setGuestModeChosen(true);

    // Create a guest user object for local functionality
    const guestUser = {
      id: guestId,
      email: 'guest@local',
      app_metadata: {},
      user_metadata: { is_guest: true },
      aud: 'guest',
      created_at: new Date().toISOString()
    } as User;

    setUser(guestUser);
    setSession(null);
    setIsGuestMode(true);
  }, []);

  useEffect(() => {
    // If Supabase is not configured, automatically use guest mode
    if (!isSupabaseConfigured) {
      authLogger.debug('Supabase not configured, using guest mode');
      enableGuestMode();
      setIsLoading(false);
      return;
    }

    // Check for existing Supabase session
    const initAuth = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();

        if (error) {
          authLogger.debug('Auth check failed:', error.message);
          // If auth check fails and user had chosen guest mode before, re-enable it
          if (hasChosenGuestMode()) {
            enableGuestMode();
          }
          setIsLoading(false);
          return;
        }

        if (existingSession) {
          // User is logged in with Supabase
          setSession(existingSession);
          setUser(existingSession.user);
          setIsGuestMode(false);
          // Clear guest mode choice since they're now logged in
          setGuestModeChosen(false);
        } else if (hasChosenGuestMode()) {
          // No Supabase session, but user has chosen guest mode before
          enableGuestMode();
        }
        // If no session and no guest choice, user will be null (not authenticated)
        // This will trigger redirect to auth page in Index.tsx
      } catch (error) {
        authLogger.debug('Auth initialization failed');
        if (hasChosenGuestMode()) {
          enableGuestMode();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          setIsGuestMode(false);
          setGuestModeChosen(false);
        } else if (event === 'SIGNED_OUT') {
          // When signed out, clear everything and go back to unauthenticated state
          setSession(null);
          setUser(null);
          setIsGuestMode(false);
          setGuestModeChosen(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [enableGuestMode]);

  const signOut = async () => {
    try {
      if (!isGuestMode && isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) throw error;
      }

      // Clear guest mode choice
      setGuestModeChosen(false);
      localStorage.removeItem(GUEST_ID_KEY);

      // Reset state
      setSession(null);
      setUser(null);
      setIsGuestMode(false);

      toast.success('Signed out successfully');

      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      toast.error(message);
    }
  };

  // Function to explicitly enable guest mode (called from Auth page)
  const continueAsGuest = useCallback(() => {
    enableGuestMode();
  }, [enableGuestMode]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isGuestMode,
    signOut,
    continueAsGuest
  };
};
