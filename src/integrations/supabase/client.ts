import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if environment variables are configured
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

let supabaseInstance: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured) {
  supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
} else {
  console.warn('Supabase environment variables not configured. Database features will be unavailable.');
}

// Export a getter that throws a helpful error if Supabase is not configured
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    if (!supabaseInstance) {
      throw new Error(
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.'
      );
    }
    return (supabaseInstance as unknown as Record<string | symbol, unknown>)[prop];
  }
});