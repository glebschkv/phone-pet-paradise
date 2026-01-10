/**
 * Centralized storage keys for localStorage
 *
 * All storage keys now use the standardized 'nomo_' prefix.
 * Legacy key migration is handled automatically.
 *
 * Naming convention: SCREAMING_SNAKE_CASE
 * Key prefix: 'nomo_' for consistency
 */

import { z } from 'zod';
import { APP_CONFIG } from './constants';
import { storageLogger } from '@/lib/logger';

const PREFIX = APP_CONFIG.STORAGE_PREFIX; // 'nomo_'

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

  // Shop
  SHOP_INVENTORY: `${PREFIX}shop_inventory`,

  // Focus Mode
  FOCUS_MODE: `${PREFIX}focus_mode`,
  FOCUS_PRESETS: `${PREFIX}focus_presets`,
  AMBIENT_SOUND: `${PREFIX}ambient_sound`,
  SOUND_MIXER: `${PREFIX}sound_mixer`,

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
  petIsland_coinSystem: STORAGE_KEYS.COIN_SYSTEM,
  petIsland_premium: STORAGE_KEYS.PREMIUM_STATUS,
  petIsland_shopInventory: STORAGE_KEYS.SHOP_INVENTORY,
  petIsland_boosterSystem: STORAGE_KEYS.COIN_BOOSTER,
  petIsland_soundMixer: STORAGE_KEYS.SOUND_MIXER,
  petIsland_focusMode: STORAGE_KEYS.FOCUS_MODE,
  petIsland_focusPresets: STORAGE_KEYS.FOCUS_PRESETS,
  petIsland_ambientSound: STORAGE_KEYS.AMBIENT_SOUND,

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

  /**
   * Get and validate data against a Zod schema.
   * Returns null if validation fails or data doesn't exist.
   *
   * @param key - The storage key
   * @param schema - Zod schema to validate against
   * @returns Validated data or null
   */
  getValidated<T>(key: StorageKey, schema: z.ZodSchema<T>): T | null {
    migrateKey(key);

    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const result = schema.safeParse(parsed);

      if (result.success) {
        return result.data;
      }

      // Log validation failures for debugging
      const errorDetails = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      storageLogger.warn(`[Storage] Validation failed for ${key}:`, errorDetails);

      return null;
    } catch (error) {
      storageLogger.error(`[Storage] Failed to get/validate ${key}:`, error);
      return null;
    }
  },

  /**
   * Get and validate data, returning a default value if validation fails.
   * This is the recommended method for loading localStorage data safely.
   *
   * @param key - The storage key
   * @param schema - Zod schema to validate against
   * @param defaultValue - Value to return if data is missing or invalid
   * @returns Validated data or default value
   */
  getValidatedOrDefault<T>(key: StorageKey, schema: z.ZodSchema<T>, defaultValue: T): T {
    const validated = this.getValidated(key, schema);
    return validated !== null ? validated : defaultValue;
  },

  /**
   * Validate and set data. Only stores if validation passes.
   * Prevents storing invalid data that could cause issues on load.
   *
   * @param key - The storage key
   * @param schema - Zod schema to validate against
   * @param value - Value to validate and store
   * @returns true if stored successfully, false if validation failed
   */
  setValidated<T>(key: StorageKey, schema: z.ZodSchema<T>, value: T): boolean {
    const result = schema.safeParse(value);

    if (!result.success) {
      const errorDetails = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      storageLogger.warn(`[Storage] Cannot store invalid data for ${key}:`, errorDetails);
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(result.data));
      return true;
    } catch (error) {
      storageLogger.error(`[Storage] Failed to save ${key}:`, error);
      return false;
    }
  },

  /**
   * Validate existing stored data without modifying it.
   * Useful for checking data integrity.
   *
   * @param key - The storage key
   * @param schema - Zod schema to validate against
   * @returns Validation result with success status and any errors
   */
  validate<T>(key: StorageKey, schema: z.ZodSchema<T>): { valid: boolean; errors?: string[] } {
    try {
      const item = localStorage.getItem(key);
      if (!item) return { valid: true }; // No data is valid (nothing to validate)

      const parsed = JSON.parse(item);
      const result = schema.safeParse(parsed);

      if (result.success) {
        return { valid: true };
      }

      return {
        valid: false,
        errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  },

  /**
   * Repair invalid stored data by parsing with schema defaults.
   * Attempts to salvage valid fields while applying defaults to invalid ones.
   *
   * @param key - The storage key
   * @param schema - Zod schema with defaults
   * @returns true if data was repaired and saved, false otherwise
   */
  repair<T>(key: StorageKey, schema: z.ZodSchema<T>): boolean {
    try {
      const item = localStorage.getItem(key);
      if (!item) return false;

      const parsed = JSON.parse(item);

      // Try to parse with defaults - this will apply defaults to missing/invalid fields
      const result = schema.safeParse(parsed);

      if (result.success) {
        // Data is already valid or was successfully coerced
        localStorage.setItem(key, JSON.stringify(result.data));
        storageLogger.debug(`[Storage] Repaired/validated ${key}`);
        return true;
      }

      // If parsing completely failed, we can't repair
      storageLogger.warn(`[Storage] Cannot repair ${key}, data too corrupted`);
      return false;
    } catch (error) {
      storageLogger.error(`[Storage] Failed to repair ${key}:`, error);
      return false;
    }
  },
};

// Auto-migrate on module load
if (typeof window !== 'undefined') {
  // Defer migration to not block initial load
  setTimeout(() => {
    migrateAllStorageKeys();
  }, 1000);
}
