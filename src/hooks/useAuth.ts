import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAuth = () => {
  // TEMPORARY: Skip authentication - always return authenticated state
  const [user] = useState<User | null>({ id: 'temp-user', email: 'temp@example.com' } as User);
  const [session] = useState<Session | null>({ user: { id: 'temp-user', email: 'temp@example.com' } } as Session);
  const [isLoading] = useState(false);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      toast.success('Signed out successfully');
      window.location.href = '/auth';
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signOut
  };
};