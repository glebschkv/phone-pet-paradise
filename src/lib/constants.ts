/**
 * Centralized Constants File
 *
 * All magic numbers, configuration values, and constants should be defined here
 * to maintain a single source of truth across the application.
 */

// ============================================================================
// APP CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  APP_NAME: 'NoMo Phone',
  APP_VERSION: '1.0.0',
  APP_GROUP_IDENTIFIER: 'group.co.nomoinc.nomo',
  BUNDLE_IDENTIFIER: 'co.nomoinc.nomo',
  STORAGE_PREFIX: 'nomo_',
} as const;

// ============================================================================
// TIMER CONFIGURATION
// ============================================================================

export const TIMER_DURATIONS = {
  /** Available focus session durations in minutes */
  FOCUS_OPTIONS: [25, 30, 45, 60, 90, 120, 180] as const,

  /** Break durations in minutes */
  SHORT_BREAK: 5,
  LONG_BREAK: 15,

  /** Minimum session length for XP rewards in minutes */
  MIN_SESSION_FOR_XP: 25,

  /** Minimum session length for tracking in minutes */
  MIN_SESSION_FOR_TRACKING: 1,

  /** Sessions before long break */
  SESSIONS_BEFORE_LONG_BREAK: 4,

  /** Timer tick interval in milliseconds */
  TICK_INTERVAL_MS: 1000,

  /** State save interval in seconds */
  STATE_SAVE_INTERVAL_SECONDS: 5,
} as const;

export type FocusDuration = typeof TIMER_DURATIONS.FOCUS_OPTIONS[number];

// ============================================================================
// XP & LEVELING SYSTEM
// ============================================================================

export const XP_CONFIG = {
  /** Base XP per minute of focus (used for dynamic calculations) */
  BASE_XP_PER_MINUTE: 1.2,

  /** XP multipliers */
  MULTIPLIERS: {
    /** Base multiplier for all XP */
    BASE: 1.0,
    /** Streak bonus per day (additive) - 3% per day, capped at 60% */
    STREAK_BONUS_PER_DAY: 0.03,
    /** Maximum streak multiplier (reached at 20 days) */
    MAX_STREAK_MULTIPLIER: 1.6,
    /** Double XP event multiplier */
    DOUBLE_XP: 2.0,
  },

  /**
   * Level thresholds - XP required to reach each level (cumulative)
   * Balanced curve: Levels 1-5 quick (1-2 sessions), 6-15 moderate (3-4), 16-30 steady (5-7), 31-50 prestige (8-12)
   * Growth rate: ~1.12-1.15x per level
   */
  LEVEL_THRESHOLDS: [
    0,      // Level 1 (start)
    30,     // Level 2 - 1 session
    70,     // Level 3 - ~1-2 sessions
    120,    // Level 4 - ~2 sessions
    180,    // Level 5 - ~2 sessions (first biome unlock)
    260,    // Level 6
    350,    // Level 7
    460,    // Level 8
    590,    // Level 9
    740,    // Level 10 (second biome unlock)
    920,    // Level 11
    1120,   // Level 12
    1350,   // Level 13
    1610,   // Level 14
    1900,   // Level 15 (third biome unlock)
    2230,   // Level 16
    2600,   // Level 17
    3010,   // Level 18
    3470,   // Level 19
    3980,   // Level 20 (fourth biome unlock)
  ] as const,

  /** Maximum level */
  MAX_LEVEL: 50,

  /** XP required per level after threshold table (linear growth for levels 21+) */
  XP_PER_LEVEL_AFTER_20: 700,
} as const;

// ============================================================================
// FOCUS BONUS SYSTEM
// ============================================================================

export const FOCUS_BONUS = {
  /** Perfect focus: 0 blocked app attempts */
  PERFECT_FOCUS: {
    multiplier: 1.25,
    label: 'PERFECT FOCUS',
    coinBonus: 50,
    description: 'You stayed fully focused! +25% XP bonus & +50 coins!',
  },
  /** Good focus: 1-2 blocked app attempts */
  GOOD_FOCUS: {
    multiplier: 1.10,
    label: 'GOOD FOCUS',
    coinBonus: 25,
    description: 'Good focus! +10% XP bonus & +25 coins!',
  },
  /** Distracted: 3+ blocked app attempts */
  DISTRACTED: {
    multiplier: 1.0,
    label: '',
    coinBonus: 0,
    description: '',
  },

  /** Maximum attempts for good focus */
  GOOD_FOCUS_MAX_ATTEMPTS: 2,
} as const;

// ============================================================================
// QUEST SYSTEM
// ============================================================================

export const QUEST_CONFIG = {
  /** Quest expiration durations in milliseconds */
  DURATIONS: {
    /** 24 hours in milliseconds */
    DAILY_MS: 24 * 60 * 60 * 1000,
    /** 7 days in milliseconds */
    WEEKLY_MS: 7 * 24 * 60 * 60 * 1000,
  },

  /** Number of daily quests to generate */
  DAILY_QUEST_COUNT: 3,
} as const;

// ============================================================================
// COIN SYSTEM
// ============================================================================

export const COIN_CONFIG = {
  /** Base coins per minute of focus */
  BASE_COINS_PER_MINUTE: 2,

  /**
   * Session completion bonuses - extra coins for completing full sessions
   * Encourages finishing sessions rather than quitting early
   */
  SESSION_COMPLETION_BONUS: {
    25: 15,   // +15 coins for completing 25-min session
    30: 20,   // +20 for 30 min
    45: 35,   // +35 for 45 min
    60: 50,   // +50 for 1 hour
    90: 80,   // +80 for 90 min
    120: 120, // +120 for 2 hours
    180: 180, // +180 for 3 hours
    240: 240, // +240 for 4 hours
    300: 300, // +300 for 5 hours
  } as const,

  /**
   * Random bonus coin probabilities (percentages)
   * The thresholds define cumulative probability ranges:
   * - 0-5: Jackpot (5% chance)
   * - 5-15: Super Lucky (10% chance)
   * - 15-35: Lucky (20% chance)
   * - 35-100: No bonus (65% chance)
   */
  BONUS_THRESHOLDS: {
    JACKPOT: 5,
    SUPER_LUCKY: 15,
    LUCKY: 35,
  },

  /** Bonus multipliers for each tier */
  BONUS_MULTIPLIERS: {
    JACKPOT: 2.5,
    SUPER_LUCKY: 1.75,
    LUCKY: 1.5,
    NONE: 1.0,
  },

  /** Coin rewards for various actions (balanced for economy) */
  REWARDS: {
    DAILY_LOGIN: 20,           // Increased from 10
    STREAK_BONUS_PER_DAY: 5,   // +5 coins per streak day
    MAX_STREAK_BONUS: 100,     // Cap at 20-day streak
    ACHIEVEMENT_UNLOCK: 50,    // Increased from 25
    QUEST_COMPLETE: 75,        // Increased from 50
    BOSS_DEFEAT_BASE: 300,     // Increased from 100
    LUCKY_WHEEL_SPIN: 0,       // Free
  },

  /** Shop item price ranges (rebalanced for accessibility) */
  PRICE_RANGES: {
    COMMON: { min: 100, max: 250 },      // 2-4 sessions
    UNCOMMON: { min: 250, max: 500 },    // 4-8 sessions
    RARE: { min: 500, max: 1000 },       // 8-15 sessions
    EPIC: { min: 1000, max: 2500 },      // 15-40 sessions
    LEGENDARY: { min: 2500, max: 5000 }, // 40-80 sessions
  },
} as const;

// ============================================================================
// STREAK SYSTEM
// ============================================================================

export const STREAK_CONFIG = {
  /** Maximum streak freezes a user can hold */
  MAX_STREAK_FREEZES: 3,

  /** Cost of a streak freeze in coins */
  STREAK_FREEZE_COST: 100,

  /** Hours before streak resets (after midnight) */
  STREAK_RESET_HOURS: 24,

  /** Streak milestones for bonus rewards */
  MILESTONES: [3, 7, 14, 30, 60, 100, 365] as const,

  /** Bonus XP per streak milestone (balanced) */
  MILESTONE_BONUS_XP: {
    3: 75,      // Getting Started
    7: 200,     // Week Warrior
    14: 400,    // Fortnight Fighter
    30: 1000,   // Monthly Master
    60: 2500,   // Two-Month Titan
    100: 5000,  // Century Champion
    365: 15000, // Year of Focus (legendary achievement)
  } as const,

  /** Bonus coins per streak milestone */
  MILESTONE_BONUS_COINS: {
    3: 100,
    7: 300,
    14: 600,
    30: 1500,
    60: 3500,
    100: 7500,
    365: 20000,
  } as const,
} as const;

// ============================================================================
// ACHIEVEMENT SYSTEM
// ============================================================================

export const ACHIEVEMENT_CONFIG = {
  /** Point values by rarity */
  POINTS_BY_RARITY: {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
    legendary: 250,
  } as const,

  /** Achievement unlock thresholds */
  THRESHOLDS: {
    FOCUS_SESSIONS: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    TOTAL_MINUTES: [60, 300, 600, 1200, 3000, 6000, 12000, 24000],
    STREAK_DAYS: [3, 7, 14, 30, 60, 100, 365],
    PETS_COLLECTED: [1, 3, 5, 10, 15, 20],
    COINS_EARNED: [100, 500, 1000, 5000, 10000, 50000],
  } as const,
} as const;

// ============================================================================
// BATTLE PASS
// ============================================================================

export const BATTLE_PASS_CONFIG = {
  /** XP required per tier (balanced for ~2 sessions/day completion) */
  XP_PER_TIER: 400,

  /** Total tiers per season */
  TOTAL_TIERS: 50,

  /** Premium tier unlock levels (major reward tiers) */
  PREMIUM_EXCLUSIVE_TIERS: [10, 20, 30, 40, 50] as const,

  /** Season duration in days */
  SEASON_DURATION_DAYS: 90,

  /** Daily XP target to complete pass: 400 * 50 / 90 = ~222 XP/day */
  DAILY_XP_TARGET: 222,
} as const;

// ============================================================================
// LUCKY WHEEL
// ============================================================================

export const LUCKY_WHEEL_CONFIG = {
  /** Free spins per day */
  FREE_SPINS_PER_DAY: 1,

  /** Cost per additional spin */
  SPIN_COST: 50,

  /** Cooldown between spins in hours */
  SPIN_COOLDOWN_HOURS: 24,

  /** Wheel slice probabilities (must sum to 100) */
  SLICE_PROBABILITIES: {
    COMMON: 40,
    UNCOMMON: 30,
    RARE: 20,
    EPIC: 8,
    LEGENDARY: 2,
  } as const,
} as const;

// ============================================================================
// PET SYSTEM
// ============================================================================

export const PET_CONFIG = {
  /** Maximum bond level */
  MAX_BOND_LEVEL: 10,

  /** Bond XP required per level */
  BOND_XP_PER_LEVEL: 100,

  /** Bond XP per interaction type */
  INTERACTION_XP: {
    play: 10,
    feed: 15,
    focus_session: 25,
    pet: 5,
  } as const,

  /** Interaction cooldowns in minutes */
  INTERACTION_COOLDOWNS: {
    play: 30,
    feed: 60,
    pet: 5,
  } as const,

  /** Pet unlock levels */
  UNLOCK_LEVELS: {
    STARTER: 1,
    EARLY: 5,
    MID: 10,
    LATE: 20,
    END_GAME: 30,
  } as const,
} as const;

// ============================================================================
// BIOME SYSTEM
// ============================================================================

export const BIOME_CONFIG = {
  /** Biome unlock levels (balanced progression - new biome every 5-10 levels) */
  UNLOCK_LEVELS: {
    meadow: 1,    // Starter biome
    forest: 5,    // First milestone
    beach: 10,    // Second milestone
    mountain: 15, // Mid-game
    desert: 20,   // Significant progress
    arctic: 25,   // Mastery begins
    volcano: 30,  // Advanced player
    space: 40,    // Near-endgame
    void: 50,     // Max level exclusive
  } as const,

  /** Map biome names to background theme IDs */
  BIOME_TO_BACKGROUND: {
    'Meadow': 'day',
    'Sunset': 'sunset',
    'Night': 'night',
    'Forest': 'forest',
    'Snow': 'snow',
    'City': 'city',
    'Ruins': 'ruins',
    'Deep Ocean': 'deepocean',
  } as const,

  /** Biome display icons (emoji) */
  BIOME_ICONS: {
    'Meadow': '☀️',
    'Sunset': '🌅',
    'Night': '🌙',
    'Forest': '🌲',
    'Snow': '❄️',
    'City': '🏙️',
    'Ruins': '🏛️',
    'Deep Ocean': '🌊',
  } as const,
} as const;

// ============================================================================
// BACKGROUND THEMES
// ============================================================================

export const BACKGROUND_THEME_CONFIG = {
  /** Theme unlock levels */
  UNLOCK_LEVELS: {
    sky: 1,
    sunset: 3,
    night: 5,
    aurora: 10,
    cosmic: 15,
    neon: 20,
  } as const,
} as const;

// ============================================================================
// NETWORK & API
// ============================================================================

export const NETWORK_CONFIG = {
  /** API retry configuration */
  RETRY: {
    MAX_RETRIES: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
    BACKOFF_MULTIPLIER: 2,
  },

  /** Request timeouts in milliseconds */
  TIMEOUTS: {
    DEFAULT: 10000,
    LONG: 30000,
    UPLOAD: 60000,
  },

  /** Debounce delays in milliseconds */
  DEBOUNCE: {
    SEARCH: 300,
    SAVE: 500,
    SYNC: 1000,
    DEFAULT: 300,
  },

  /** Real-time subscription refresh interval in milliseconds */
  REALTIME_REFRESH_INTERVAL: 30000,
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const RATE_LIMIT_CONFIG = {
  /** Minimum interval between coin operations in milliseconds */
  MIN_COIN_OPERATION_INTERVAL_MS: 1000,

  /** Error boundary retry configuration */
  ERROR_BOUNDARY: {
    /** Maximum number of retry attempts before requiring page reload */
    MAX_RETRY_ATTEMPTS: 3,
    /** Base delay for exponential backoff in milliseconds */
    BASE_BACKOFF_DELAY_MS: 1000,
    /** Maximum delay for exponential backoff in milliseconds */
    MAX_BACKOFF_DELAY_MS: 30000,
    /** Multiplier for exponential backoff */
    BACKOFF_MULTIPLIER: 2,
    /** Time window in milliseconds to reset retry count if no errors occur */
    RETRY_RESET_WINDOW_MS: 60000,
  },
} as const;

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

export const STORAGE_CONFIG = {
  /** Maximum stored errors in error log */
  MAX_STORED_ERRORS: 50,

  /** Maximum stored session notes */
  MAX_SESSION_NOTES: 100,

  /** Maximum stored activity logs */
  MAX_ACTIVITY_LOGS: 100,

  /** Local storage key prefix */
  PREFIX: 'nomo_',
} as const;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  /** Toast notification durations in milliseconds */
  TOAST_DURATION: {
    SHORT: 2000,
    DEFAULT: 3000,
    LONG: 5000,
    PERSISTENT: 10000,
  },

  /** Animation durations in milliseconds */
  ANIMATION: {
    FAST: 150,
    DEFAULT: 300,
    SLOW: 500,
  },

  /** Polling intervals in milliseconds */
  POLLING: {
    USAGE_DATA: 30000,
    EVENTS: 60000,
    SYNC: 300000,
  },
} as const;

// ============================================================================
// iOS SPECIFIC
// ============================================================================

export const IOS_CONFIG = {
  /** Background task identifier */
  BACKGROUND_TASK_ID: 'app.lovable.354c50c576064f429b59577c9adb3ef7.background-tracking',

  /** Background refresh interval in minutes */
  BACKGROUND_REFRESH_INTERVAL_MINUTES: 15,

  /** iOS minimum version */
  MIN_IOS_VERSION: '15.0',

  /** StoreKit product IDs */
  PRODUCT_IDS: {
    PREMIUM_MONTHLY: 'nomo_premium_monthly',
    PREMIUM_YEARLY: 'nomo_premium_yearly',
    PREMIUM_LIFETIME: 'nomo_premium_lifetime',
  } as const,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get XP required for a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= XP_CONFIG.LEVEL_THRESHOLDS.length) {
    return XP_CONFIG.LEVEL_THRESHOLDS[level - 1];
  }
  const baseXP = XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1];
  const extraLevels = level - XP_CONFIG.LEVEL_THRESHOLDS.length;
  return baseXP + (extraLevels * XP_CONFIG.XP_PER_LEVEL_AFTER_20);
}

/**
 * Get level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  for (let i = 0; i < XP_CONFIG.LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= XP_CONFIG.LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  if (totalXP > XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1]) {
    const extraXP = totalXP - XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1];
    level = XP_CONFIG.LEVEL_THRESHOLDS.length + Math.floor(extraXP / XP_CONFIG.XP_PER_LEVEL_AFTER_20);
  }
  return Math.min(level, XP_CONFIG.MAX_LEVEL);
}

/**
 * Get focus bonus info based on shield attempts
 */
export function getFocusBonusInfo(shieldAttempts: number, hasAppsConfigured: boolean) {
  if (!hasAppsConfigured) {
    return FOCUS_BONUS.DISTRACTED;
  }
  if (shieldAttempts === 0) {
    return FOCUS_BONUS.PERFECT_FOCUS;
  }
  if (shieldAttempts <= FOCUS_BONUS.GOOD_FOCUS_MAX_ATTEMPTS) {
    return FOCUS_BONUS.GOOD_FOCUS;
  }
  return FOCUS_BONUS.DISTRACTED;
}

/**
 * Calculate streak multiplier
 */
export function getStreakMultiplier(streakDays: number): number {
  const bonus = streakDays * XP_CONFIG.MULTIPLIERS.STREAK_BONUS_PER_DAY;
  return Math.min(
    XP_CONFIG.MULTIPLIERS.BASE + bonus,
    XP_CONFIG.MULTIPLIERS.MAX_STREAK_MULTIPLIER
  );
}
