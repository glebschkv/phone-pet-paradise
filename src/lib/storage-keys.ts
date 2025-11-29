/**
 * Centralized storage keys for localStorage
 *
 * Naming convention: SCREAMING_SNAKE_CASE
 * Key prefix: 'pet_paradise_' for consistency
 *
 * Note: Some keys use legacy prefixes ('petIsland_') for backwards
 * compatibility with existing user data. Do not change these without
 * implementing a migration strategy.
 */

// Authentication
export const STORAGE_KEYS = {
  // Auth
  GUEST_ID: 'pet_paradise_guest_id',
  GUEST_CHOSEN: 'pet_paradise_guest_chosen',

  // Onboarding
  ONBOARDING_COMPLETED: 'pet_paradise_onboarding_completed',

  // App State (legacy prefix - do not change)
  APP_STATE: 'petIsland_appState',

  // XP System (legacy prefix - do not change)
  XP_SYSTEM: 'petIsland_xpSystem',

  // Timer (legacy prefix - do not change)
  TIMER_STATE: 'petIsland_unifiedTimer',
  TIMER_PERSISTENCE: 'petIsland_timerPersistence',

  // Backgrounds (legacy prefix - do not change)
  HOME_BACKGROUND: 'petIsland_homeBackground',
  FOCUS_BACKGROUND: 'petIsland_focusBackground',

  // Collection & Pets
  FAVORITES: 'pet_paradise_favorites',
  BOND_DATA: 'pet_paradise_bond_data',

  // Progress Systems
  STREAK_DATA: 'pet_paradise_streak_data',
  QUESTS: 'pet_paradise_quests',
  ACHIEVEMENTS: 'pet_paradise_achievements',
  QUEST_SYSTEM_DATA: 'pet_paradise_quest_system',
  ACHIEVEMENT_SYSTEM_DATA: 'pet_paradise_achievement_system',

  // Settings
  SETTINGS: 'pet_paradise_settings',
  APP_SETTINGS: 'pet_paradise_app_settings',
  PERFORMANCE_SETTINGS: 'pet_paradise_performance',

  // Background Processing
  BACKGROUND_SESSION: 'pet_paradise_background_session',
  LAST_INTERACTION: 'pet_paradise_last_interaction',

  // Backup
  BACKUP_METADATA: 'pet_paradise_backup_metadata',
  LAST_AUTO_BACKUP: 'pet_paradise_last_auto_backup',

  // Analytics
  ANALYTICS_SESSIONS: 'pet_paradise_analytics_sessions',
  ANALYTICS_DAILY_STATS: 'pet_paradise_analytics_daily_stats',
  ANALYTICS_SETTINGS: 'pet_paradise_analytics_settings',
  ANALYTICS_RECORDS: 'pet_paradise_analytics_records',

  // Advanced Gamification
  BATTLE_PASS: 'pet_paradise_battle_pass',
  GUILD_DATA: 'pet_paradise_guild_data',
  BOSS_CHALLENGES: 'pet_paradise_boss_challenges',
  LUCKY_WHEEL: 'pet_paradise_lucky_wheel',
  COMBO_SYSTEM: 'pet_paradise_combo_system',
  SPECIAL_EVENTS: 'pet_paradise_special_events',
  MILESTONES: 'pet_paradise_milestones',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Type-safe localStorage wrapper
 */
export const storage = {
  get<T>(key: StorageKey): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
    }
  },

  remove(key: StorageKey): void {
    localStorage.removeItem(key);
  },

  getString(key: StorageKey): string | null {
    return localStorage.getItem(key);
  },

  setString(key: StorageKey, value: string): void {
    localStorage.setItem(key, value);
  },
};
