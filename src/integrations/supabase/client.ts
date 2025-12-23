import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if environment variables are configured
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// SECURITY: Use sessionStorage instead of localStorage for auth tokens
// This provides better security as:
// 1. Data is cleared when the browser/tab is closed
// 2. Data is not shared across tabs (reduces XSS attack surface)
// 3. Data is not accessible from other tabs in case of XSS in another tab

// For mobile (Capacitor), we still need persistence, so detect the platform
const isMobileApp = typeof window !== 'undefined' && (
  window.location.protocol === 'capacitor:' ||
  window.location.protocol === 'ionic:'
);

// Custom storage adapter for better security
const secureStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    // Use sessionStorage on web, localStorage on mobile for persistence
    return isMobileApp ? localStorage.getItem(key) : sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    if (isMobileApp) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    if (isMobileApp) {
      localStorage.removeItem(key);
    } else {
      sessionStorage.removeItem(key);
    }
  },
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

let supabaseInstance: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured) {
  supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: secureStorage,
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