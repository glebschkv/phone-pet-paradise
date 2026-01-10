// Supabase Database Model Types
// These types represent the database schema for Supabase tables
// Note: These are separate from local analytics types (see analytics.ts)

/**
 * User profile data stored in the 'profiles' table
 */
export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User progress data stored in the 'user_progress' table
 */
export interface UserProgress {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
  last_session_date: string | null;
  streak_freeze_count: number;
  coins: number;
  total_coins_earned: number;
  total_coins_spent: number;
  created_at: string;
  updated_at: string;
}

/**
 * Pet data stored in the 'pets' table
 */
export interface Pet {
  id: string;
  user_id: string;
  pet_type: string;
  name: string;
  bond_level: number;
  experience: number;
  mood: number;
  unlocked_at: string;
  is_favorite: boolean;
  created_at: string;
}

/**
 * Focus session data stored in the 'focus_sessions' table
 * Note: This is different from the local FocusSession in analytics.ts
 */
export interface DBFocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  xp_earned: number;
  session_type: string;
  completed_at: string;
}

/**
 * Default data factory functions
 */
export const createDefaultProfile = (userId: string): UserProfile => ({
  id: `profile-${userId}`,
  user_id: userId,
  display_name: 'NoMo Player',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const createDefaultProgress = (userId: string): UserProgress => ({
  id: `progress-${userId}`,
  user_id: userId,
  total_xp: 0,
  current_level: 1,
  current_streak: 0,
  longest_streak: 0,
  total_sessions: 0,
  last_session_date: null,
  streak_freeze_count: 0,
  coins: 0,
  total_coins_earned: 0,
  total_coins_spent: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const createDefaultPet = (userId: string): Pet => ({
  id: `pet-${Date.now()}`,
  user_id: userId,
  pet_type: 'panda',
  name: 'Bamboo',
  bond_level: 1,
  experience: 0,
  mood: 100,
  unlocked_at: new Date().toISOString(),
  is_favorite: true,
  created_at: new Date().toISOString(),
});
