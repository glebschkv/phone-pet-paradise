import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Generate or retrieve a persistent guest ID for offline mode
const getGuestId = (): string => {
  const GUEST_ID_KEY = 'pet_paradise_guest_id';
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    // Check for existing Supabase session
    const initAuth = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('Auth check failed, using guest mode:', error.message);
          enableGuestMode();
          return;
        }

        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          setIsGuestMode(false);
        } else {
          // No session, use guest mode for offline functionality
          enableGuestMode();
        }
      } catch (error) {
        console.log('Auth initialization failed, using guest mode');
        enableGuestMode();
      } finally {
        setIsLoading(false);
      }
    };

    const enableGuestMode = () => {
      const guestId = getGuestId();
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
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          setIsGuestMode(false);
        } else if (event === 'SIGNED_OUT') {
          enableGuestMode();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (!isGuestMode) {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) throw error;
        toast.success('Signed out successfully');
      }
      window.location.href = '/auth';
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isGuestMode,
    signOut
  };
};