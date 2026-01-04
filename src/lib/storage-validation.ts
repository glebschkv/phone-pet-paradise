/**
 * Storage Validation Schemas
 *
 * Zod schemas for validating data loaded from localStorage.
 * This protects against corrupted, malicious, or tampered data.
 *
 * Security considerations:
 * - All data from localStorage MUST be validated before use
 * - Invalid data should fallback to safe defaults, not crash the app
 * - Numeric values are clamped to reasonable ranges to prevent overflow
 * - String lengths are limited to prevent memory exhaustion
 */

import { z } from 'zod';
import { storageLogger } from '@/lib/logger';

// ============================================================================
// Common Validators
// ============================================================================

/** Safe non-negative integer (clamped to reasonable range) */
const safeNonNegativeInt = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

/** Safe positive integer */
const safePositiveInt = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);

/** Safe percentage (0-100) */
const safePercentage = z.number().min(0).max(100);

/** Safe volume (0-1) */
const safeVolume = z.number().min(0).max(1);

/** Safe string with length limit */
const safeString = (maxLength: number = 1000) => z.string().max(maxLength);

/** Safe array with length limit */
const safeArray = <T extends z.ZodTypeAny>(schema: T, maxLength: number = 1000) =>
  z.array(schema).max(maxLength);

/** ISO date string validator */
const isoDateString = z.string().refine(
  (val) => !val || !isNaN(Date.parse(val)),
  { message: 'Invalid date string' }
);

/** Nullable ISO date string */
const nullableIsoDate = z.union([isoDateString, z.null()]);

// ============================================================================
// Authentication Schemas
// ============================================================================

export const guestIdSchema = safeString(100);

export const guestChosenSchema = z.boolean();

// ============================================================================
// XP System Schema
// ============================================================================

export const xpSystemSchema = z.object({
  currentXP: safeNonNegativeInt.default(0),
  currentLevel: safeNonNegativeInt.max(100).default(0),
  xpToNextLevel: safeNonNegativeInt.default(15),
  totalXPForCurrentLevel: safeNonNegativeInt.default(0),
  unlockedAnimals: safeArray(safeString(100), 500).default([]),
  currentBiome: safeString(100).default('Meadow'),
  availableBiomes: safeArray(safeString(100), 50).default(['Meadow']),
});

export type ValidatedXPSystem = z.infer<typeof xpSystemSchema>;

// ============================================================================
// Coin System Schema
// ============================================================================

export const coinSystemSchema = z.object({
  balance: safeNonNegativeInt.default(0),
  totalEarned: safeNonNegativeInt.default(0),
  totalSpent: safeNonNegativeInt.default(0),
});

export type ValidatedCoinSystem = z.infer<typeof coinSystemSchema>;

// ============================================================================
// Premium Status Schema
// ============================================================================

const subscriptionTierSchema = z.enum(['free', 'premium', 'premium_plus', 'lifetime']);

export const premiumStatusSchema = z.object({
  tier: subscriptionTierSchema.default('free'),
  expiresAt: nullableIsoDate.default(null),
  purchasedAt: nullableIsoDate.default(null),
  planId: z.union([safeString(100), z.null()]).default(null),
});

export type ValidatedPremiumStatus = z.infer<typeof premiumStatusSchema>;

// ============================================================================
// Streak Data Schema
// ============================================================================

export const streakDataSchema = z.object({
  currentStreak: safeNonNegativeInt.max(10000).default(0),
  longestStreak: safeNonNegativeInt.max(10000).default(0),
  lastSessionDate: safeString(50).default(''),
  totalSessions: safeNonNegativeInt.default(0),
  streakFreezeCount: safeNonNegativeInt.max(100).default(0),
});

export type ValidatedStreakData = z.infer<typeof streakDataSchema>;

// ============================================================================
// Quest System Schema
// ============================================================================

const questObjectiveSchema = z.object({
  id: safeString(100),
  description: safeString(500),
  target: safePositiveInt,
  current: safeNonNegativeInt,
  type: safeString(50),
});

const questRewardSchema = z.object({
  type: z.enum(['xp', 'coins', 'item', 'badge']),
  amount: safeNonNegativeInt.optional(),
  itemId: safeString(100).optional(),
});

const questSchema = z.object({
  id: safeString(100),
  type: z.enum(['daily', 'weekly', 'story']),
  title: safeString(200),
  description: safeString(1000),
  objectives: safeArray(questObjectiveSchema, 20),
  rewards: safeArray(questRewardSchema, 10),
  isCompleted: z.boolean().default(false),
  isClaimed: z.boolean().default(false),
  progress: safePercentage.default(0),
  expiresAt: nullableIsoDate.optional(),
});

export const questSystemSchema = z.object({
  quests: safeArray(questSchema, 100).default([]),
  lastDailyReset: nullableIsoDate.default(null),
  lastWeeklyReset: nullableIsoDate.default(null),
});

export type ValidatedQuestSystem = z.infer<typeof questSystemSchema>;

// ============================================================================
// Pet Bond Data Schema
// ============================================================================

const petBondSchema = z.object({
  petId: safeString(100),
  level: safeNonNegativeInt.max(100).default(0),
  experience: safeNonNegativeInt.default(0),
  lastInteraction: nullableIsoDate.default(null),
  totalInteractions: safeNonNegativeInt.default(0),
  favoriteActivity: z.union([safeString(100), z.null()]).default(null),
});

export const bondDataSchema = z.object({
  bonds: z.record(safeString(100), petBondSchema).default({}),
  activePetId: z.union([safeString(100), z.null()]).default(null),
});

export type ValidatedBondData = z.infer<typeof bondDataSchema>;

// ============================================================================
// Sound Settings Schema
// ============================================================================

const soundLayerSchema = z.object({
  id: safeString(100),
  name: safeString(100),
  volume: safeVolume.default(0.5),
  enabled: z.boolean().default(true),
});

export const soundMixerSchema = z.object({
  layers: safeArray(soundLayerSchema, 20).default([]),
  masterVolume: safeVolume.default(0.7),
});

export const ambientSoundSchema = z.object({
  selectedSoundId: z.union([safeString(100), z.null()]).default(null),
  volume: safeVolume.default(0.5),
});

export type ValidatedSoundMixer = z.infer<typeof soundMixerSchema>;
export type ValidatedAmbientSound = z.infer<typeof ambientSoundSchema>;

// ============================================================================
// Focus Mode Schema
// ============================================================================

const blockedAppSchema = z.object({
  id: safeString(200),
  name: safeString(200),
  packageName: safeString(200).optional(),
});

export const focusModeSchema = z.object({
  enabled: z.boolean().default(false),
  strictMode: z.boolean().default(false),
  blockNotifications: z.boolean().default(true),
  blockedApps: safeArray(blockedAppSchema, 500).default([]),
  blockedWebsites: safeArray(safeString(500), 500).default([]),
  allowEmergencyBypass: z.boolean().default(true),
  bypassCooldown: safeNonNegativeInt.max(3600).default(300),
});

export type ValidatedFocusMode = z.infer<typeof focusModeSchema>;

// ============================================================================
// Shop Inventory Schema
// ============================================================================

export const shopInventorySchema = z.object({
  ownedCharacters: safeArray(safeString(100), 200).default([]),
  ownedBackgrounds: safeArray(safeString(100), 100).default([]),
  ownedBadges: safeArray(safeString(100), 100).default([]),
  equippedBadge: z.union([safeString(100), z.null()]).default(null),
  equippedBackground: z.union([safeString(100), z.null()]).default(null),
});

export type ValidatedShopInventory = z.infer<typeof shopInventorySchema>;

// ============================================================================
// Achievement Schema
// ============================================================================

const achievementSchema = z.object({
  id: safeString(100),
  title: safeString(200).optional(),
  description: safeString(500).optional(),
  category: safeString(50).optional(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).optional(),
  icon: safeString(100).optional(),
  progress: safeNonNegativeInt.default(0),
  target: safePositiveInt.default(1),
  isUnlocked: z.boolean().default(false),
  unlockedAt: nullableIsoDate.optional(),
  rewardsClaimed: z.boolean().default(false),
  secret: z.boolean().default(false),
});

export const achievementSystemSchema = z.object({
  achievements: safeArray(achievementSchema, 500).default([]),
});

export type ValidatedAchievementSystem = z.infer<typeof achievementSystemSchema>;

// ============================================================================
// Offline Sync Schema
// ============================================================================

const pendingOperationSchema = z.object({
  id: safeString(100),
  type: safeString(50),
  table: safeString(100),
  data: z.record(z.unknown()).optional(),
  timestamp: safeNonNegativeInt,
  retryCount: safeNonNegativeInt.max(10).default(0),
});

export const offlineSyncSchema = z.object({
  pendingOperations: safeArray(pendingOperationSchema, 1000).default([]),
  syncStatus: z.enum(['idle', 'syncing', 'error']).default('idle'),
  lastSyncAt: z.union([safeNonNegativeInt, z.null()]).default(null),
  lastSyncError: z.union([safeString(500), z.null()]).default(null),
  isOnline: z.boolean().default(true),
  totalSynced: safeNonNegativeInt.default(0),
  totalFailed: safeNonNegativeInt.default(0),
});

export type ValidatedOfflineSync = z.infer<typeof offlineSyncSchema>;

// ============================================================================
// App Settings Schema
// ============================================================================

export const appSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: z.boolean().default(true),
  hapticFeedback: z.boolean().default(true),
  reducedMotion: z.boolean().default(false),
  soundEnabled: z.boolean().default(true),
});

export type ValidatedAppSettings = z.infer<typeof appSettingsSchema>;

// ============================================================================
// Onboarding Schema
// ============================================================================

export const onboardingSchema = z.object({
  completed: z.boolean().default(false),
  currentStep: safeNonNegativeInt.max(20).default(0),
  completedSteps: safeArray(safeString(50), 20).default([]),
});

export type ValidatedOnboarding = z.infer<typeof onboardingSchema>;

// ============================================================================
// Collection Schema
// ============================================================================

export const collectionSchema = z.object({
  activeHomePets: safeArray(safeString(100), 50).default([]),
  favorites: safeArray(safeString(100), 100).default([]),
});

export type ValidatedCollection = z.infer<typeof collectionSchema>;

// ============================================================================
// Schema Registry
// ============================================================================

import { STORAGE_KEYS, type StorageKey } from './storage-keys';

/**
 * Maps storage keys to their validation schemas
 */
export const STORAGE_SCHEMAS: Partial<Record<StorageKey, z.ZodSchema>> = {
  [STORAGE_KEYS.XP_SYSTEM]: xpSystemSchema,
  [STORAGE_KEYS.COIN_SYSTEM]: coinSystemSchema,
  [STORAGE_KEYS.PREMIUM_STATUS]: premiumStatusSchema,
  [STORAGE_KEYS.STREAK_DATA]: streakDataSchema,
  [STORAGE_KEYS.QUEST_SYSTEM_DATA]: questSystemSchema,
  [STORAGE_KEYS.BOND_DATA]: bondDataSchema,
  [STORAGE_KEYS.SOUND_MIXER]: soundMixerSchema,
  [STORAGE_KEYS.AMBIENT_SOUND]: ambientSoundSchema,
  [STORAGE_KEYS.FOCUS_MODE]: focusModeSchema,
  [STORAGE_KEYS.SHOP_INVENTORY]: shopInventorySchema,
  [STORAGE_KEYS.ACHIEVEMENT_SYSTEM_DATA]: achievementSystemSchema,
  [STORAGE_KEYS.APP_SETTINGS]: appSettingsSchema,
  [STORAGE_KEYS.ONBOARDING_COMPLETED]: onboardingSchema,
  [STORAGE_KEYS.FAVORITES]: collectionSchema,
  [STORAGE_KEYS.COLLECTION]: collectionSchema,
};

// ============================================================================
// Validation Utilities
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Validate data against a Zod schema with safe error handling
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: { logErrors?: boolean; keyName?: string }
): ValidationResult<T> {
  const { logErrors = true, keyName = 'unknown' } = options ?? {};

  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errorMessage = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    if (logErrors) {
      storageLogger.warn(`[Storage] Validation failed for ${keyName}:`, errorMessage);
    }

    return { success: false, data: null, error: errorMessage };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

    if (logErrors) {
      storageLogger.error(`[Storage] Validation error for ${keyName}:`, error);
    }

    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Validate and sanitize data, returning defaults on failure
 */
export function validateOrDefault<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultValue: T,
  options?: { logErrors?: boolean; keyName?: string }
): T {
  const result = validateWithSchema(schema, data, options);
  return result.success && result.data !== null ? result.data : defaultValue;
}

/**
 * Check if a storage key has a registered schema
 */
export function hasSchema(key: StorageKey): boolean {
  return key in STORAGE_SCHEMAS;
}

/**
 * Get the schema for a storage key
 */
export function getSchema(key: StorageKey): z.ZodSchema | undefined {
  return STORAGE_SCHEMAS[key];
}
