/**
 * Centralized storage keys for localStorage
 *
 * All storage keys now use the standardized 'nomo_' prefix.
 * Legacy key migration is handled automatically.
 *
 * Naming convention: SCREAMING_SNAKE_CASE
 * Key prefix: 'nomo_' for consistency
 */

import { APP_CONFIG } from './constants';
import { storageLogger } from '@/lib/logger';

const PREFIX = APP_CONFIG.STORAGE_PREFIX; // 'nomo_'

// Legacy prefix mapping for migration
const LEGACY_PREFIXES = {
  petIsland: 'petIsland_',
  pet_paradise: 'pet_paradise_',
  nomoPhone: 'nomoPhone_',
} as const;

// Authentication
export const STORAGE_KEYS = {
  // Auth
  GUEST_ID: `${PREFIX}guest_id`,
  GUEST_CHOSEN: `${PREFIX}guest_chosen`,

  // Onboarding
  ONBOARDING_COMPLETED: `${PREFIX}onboarding_completed`,

  // App State
  APP_STATE: `${PREFIX}app_state`,

  // XP System
  XP_SYSTEM: `${PREFIX}xp_system`,

  // Timer
  TIMER_STATE: `${PREFIX}timer_state`,
  TIMER_PERSISTENCE: `${PREFIX}timer_persistence`,

  // Backgrounds
  HOME_BACKGROUND: `${PREFIX}home_background`,
  FOCUS_BACKGROUND: `${PREFIX}focus_background`,

  // Collection & Pets
  FAVORITES: `${PREFIX}favorites`,
  BOND_DATA: `${PREFIX}bond_data`,
  COLLECTION: `${PREFIX}collection`,

  // Progress Systems
  STREAK_DATA: `${PREFIX}streak_data`,
  QUESTS: `${PREFIX}quests`,
  ACHIEVEMENTS: `${PREFIX}achievements`,
  QUEST_SYSTEM_DATA: `${PREFIX}quest_system`,
  ACHIEVEMENT_SYSTEM_DATA: `${PREFIX}achievement_system`,

  // Settings
  APP_SETTINGS: `${PREFIX}app_settings`,
  THEME: `${PREFIX}theme`,
  SOUND_SETTINGS: `${PREFIX}sound_settings`,

  // Analytics
  ANALYTICS_SESSIONS: `${PREFIX}analytics_sessions`,
  ANALYTICS_DAILY_STATS: `${PREFIX}analytics_daily_stats`,
  ANALYTICS_SETTINGS: `${PREFIX}analytics_settings`,
  ANALYTICS_RECORDS: `${PREFIX}analytics_records`,

  // Advanced Gamification
  BATTLE_PASS: `${PREFIX}battle_pass`,
  GUILD_DATA: `${PREFIX}guild_data`,
  BOSS_CHALLENGES: `${PREFIX}boss_challenges`,
  LUCKY_WHEEL: `${PREFIX}lucky_wheel`,
  COMBO_SYSTEM: `${PREFIX}combo_system`,
  SPECIAL_EVENTS: `${PREFIX}special_events`,
  MILESTONES: `${PREFIX}milestones`,

  // Coins
  COIN_SYSTEM: `${PREFIX}coin_system`,
  COIN_BOOSTER: `${PREFIX}coin_booster`,

  // Device Activity
  SELECTED_APPS: `${PREFIX}selected_apps`,
  DEVICE_ACTIVITY: `${PREFIX}device_activity`,

  // Session Notes
  SESSION_NOTES: `${PREFIX}session_notes`,

  // Error Tracking
  ERROR_LOG: `${PREFIX}error_log`,

  // Premium
  PREMIUM_STATUS: `${PREFIX}premium_status`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Legacy key mapping for migration
const LEGACY_KEY_MAP: Record<string, StorageKey> = {
  // petIsland_ prefix
  petIsland_appState: STORAGE_KEYS.APP_STATE,
  petIsland_xpSystem: STORAGE_KEYS.XP_SYSTEM,
  petIsland_unifiedTimer: STORAGE_KEYS.TIMER_STATE,
  petIsland_timerPersistence: STORAGE_KEYS.TIMER_PERSISTENCE,
  petIsland_homeBackground: STORAGE_KEYS.HOME_BACKGROUND,
  petIsland_focusBackground: STORAGE_KEYS.FOCUS_BACKGROUND,
  petIsland_sessionNotes: STORAGE_KEYS.SESSION_NOTES,
  petIsland_xpUpdate: STORAGE_KEYS.XP_SYSTEM,
  petIsland_autoBreak: STORAGE_KEYS.APP_SETTINGS,

  // pet_paradise_ prefix
  pet_paradise_guest_id: STORAGE_KEYS.GUEST_ID,
  pet_paradise_guest_chosen: STORAGE_KEYS.GUEST_CHOSEN,
  pet_paradise_onboarding_completed: STORAGE_KEYS.ONBOARDING_COMPLETED,
  pet_paradise_favorites: STORAGE_KEYS.FAVORITES,
  pet_paradise_bond_data: STORAGE_KEYS.BOND_DATA,
  pet_paradise_streak_data: STORAGE_KEYS.STREAK_DATA,
  pet_paradise_quests: STORAGE_KEYS.QUESTS,
  pet_paradise_achievements: STORAGE_KEYS.ACHIEVEMENTS,
  pet_paradise_quest_system: STORAGE_KEYS.QUEST_SYSTEM_DATA,
  pet_paradise_achievement_system: STORAGE_KEYS.ACHIEVEMENT_SYSTEM_DATA,
  pet_paradise_app_settings: STORAGE_KEYS.APP_SETTINGS,
  pet_paradise_analytics_sessions: STORAGE_KEYS.ANALYTICS_SESSIONS,
  pet_paradise_analytics_daily_stats: STORAGE_KEYS.ANALYTICS_DAILY_STATS,
  pet_paradise_analytics_settings: STORAGE_KEYS.ANALYTICS_SETTINGS,
  pet_paradise_analytics_records: STORAGE_KEYS.ANALYTICS_RECORDS,
  pet_paradise_battle_pass: STORAGE_KEYS.BATTLE_PASS,
  pet_paradise_guild_data: STORAGE_KEYS.GUILD_DATA,
  pet_paradise_boss_challenges: STORAGE_KEYS.BOSS_CHALLENGES,
  pet_paradise_lucky_wheel: STORAGE_KEYS.LUCKY_WHEEL,
  pet_paradise_combo_system: STORAGE_KEYS.COMBO_SYSTEM,
  pet_paradise_special_events: STORAGE_KEYS.SPECIAL_EVENTS,
  pet_paradise_milestones: STORAGE_KEYS.MILESTONES,

  // nomoPhone_ prefix
  nomoPhone_selectedApps: STORAGE_KEYS.SELECTED_APPS,
};

/**
 * Migrate a legacy key to the new format if needed
 */
function migrateKey(key: StorageKey): void {
  // Find legacy keys that map to this new key
  const legacyKeys = Object.entries(LEGACY_KEY_MAP)
    .filter(([_, newKey]) => newKey === key)
    .map(([legacyKey]) => legacyKey);

  for (const legacyKey of legacyKeys) {
    try {
      const legacyValue = localStorage.getItem(legacyKey);
      const currentValue = localStorage.getItem(key);

      // If legacy key has value but new key doesn't, migrate
      if (legacyValue !== null && currentValue === null) {
        localStorage.setItem(key, legacyValue);
        localStorage.removeItem(legacyKey);
        storageLogger.debug(`[Storage] Migrated ${legacyKey} -> ${key}`);
      } else if (legacyValue !== null) {
        // Clean up legacy key if new key already has data
        localStorage.removeItem(legacyKey);
      }
    } catch (error) {
      storageLogger.error(`[Storage] Migration failed for ${legacyKey}:`, error);
    }
  }
}

/**
 * Run migration for all storage keys
 */
export function migrateAllStorageKeys(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    migrateKey(key);
  });
  storageLogger.debug('[Storage] Key migration complete');
}

/**
 * Type-safe localStorage wrapper with automatic migration
 */
export const storage = {
  get<T>(key: StorageKey): T | null {
    // Attempt migration on first access
    migrateKey(key);

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
      storageLogger.error(`[Storage] Failed to save: ${key}`, error);
    }
  },

  remove(key: StorageKey): void {
    localStorage.removeItem(key);
  },

  getString(key: StorageKey): string | null {
    migrateKey(key);
    return localStorage.getItem(key);
  },

  setString(key: StorageKey, value: string): void {
    localStorage.setItem(key, value);
  },

  /**
   * Check if a key exists
   */
  has(key: StorageKey): boolean {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Get with default value
   */
  getWithDefault<T>(key: StorageKey, defaultValue: T): T {
    const value = this.get<T>(key);
    return value !== null ? value : defaultValue;
  },

  /**
   * Update a stored object by merging with new values
   */
  update<T extends Record<string, unknown>>(key: StorageKey, updates: Partial<T>): void {
    const current = this.get<T>(key) || ({} as T);
    this.set(key, { ...current, ...updates });
  },

  /**
   * Clear all app storage
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    storageLogger.debug('[Storage] All app storage cleared');
  },

  /**
   * Get storage usage info
   */
  getUsageInfo(): { count: number; totalSize: number; keys: string[] } {
    const keys = Object.values(STORAGE_KEYS).filter((key) => localStorage.getItem(key) !== null);

    let totalSize = 0;
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    });

    return {
      count: keys.length,
      totalSize,
      keys,
    };
  },
};

// Auto-migrate on module load
if (typeof window !== 'undefined') {
  // Defer migration to not block initial load
  setTimeout(() => {
    migrateAllStorageKeys();
  }, 1000);
}
