/**
 * Input Validation Utilities
 *
 * Provides type guards and validation functions for user input and
 * data loaded from storage/APIs.
 */

/**
 * Validates that a value is a finite, non-NaN number
 */
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
};

/**
 * Validates that a value is a positive integer (>= 0)
 */
export const isNonNegativeInteger = (value: unknown): value is number => {
  return isValidNumber(value) && Number.isInteger(value) && value >= 0;
};

/**
 * Validates that a value is a positive number (> 0)
 */
export const isPositiveNumber = (value: unknown): value is number => {
  return isValidNumber(value) && value > 0;
};

/**
 * Clamps a number to a valid range
 */
export const clampNumber = (value: number, min: number, max: number): number => {
  if (!isValidNumber(value)) return min;
  return Math.max(min, Math.min(max, value));
};

/**
 * Validates that a value is a non-empty string
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Timer validation constants
 */
export const TIMER_VALIDATION = {
  MIN_DURATION_SECONDS: 60, // 1 minute minimum
  MAX_DURATION_SECONDS: 28800, // 8 hours maximum
  MIN_DURATION_MINUTES: 1,
  MAX_DURATION_MINUTES: 480,
} as const;

/**
 * XP validation constants
 */
export const XP_VALIDATION = {
  MIN_XP: 0,
  MAX_XP: 1000000, // 1 million XP cap
  MIN_LEVEL: 0,
  MAX_LEVEL: 50,
  MIN_SESSION_MINUTES: 1,
  MAX_SESSION_MINUTES: 480, // 8 hours
} as const;

/**
 * Coin validation constants
 */
export const COIN_VALIDATION = {
  MIN_BALANCE: 0,
  MAX_BALANCE: 10000000, // 10 million coins cap
  MIN_TRANSACTION: 1,
  MAX_TRANSACTION: 1000000,
} as const;

/**
 * Validates timer duration in seconds
 */
export const validateTimerDuration = (seconds: unknown): number => {
  if (!isNonNegativeInteger(seconds)) {
    return TIMER_VALIDATION.MIN_DURATION_SECONDS;
  }
  return clampNumber(seconds, 0, TIMER_VALIDATION.MAX_DURATION_SECONDS);
};

/**
 * Validates timer duration in minutes
 */
export const validateTimerMinutes = (minutes: unknown): number => {
  if (!isNonNegativeInteger(minutes)) {
    return TIMER_VALIDATION.MIN_DURATION_MINUTES;
  }
  return clampNumber(minutes, TIMER_VALIDATION.MIN_DURATION_MINUTES, TIMER_VALIDATION.MAX_DURATION_MINUTES);
};

/**
 * Validates XP amount
 */
export const validateXPAmount = (xp: unknown): number => {
  if (!isNonNegativeInteger(xp)) {
    return 0;
  }
  return clampNumber(xp, XP_VALIDATION.MIN_XP, XP_VALIDATION.MAX_XP);
};

/**
 * Validates level
 */
export const validateLevel = (level: unknown): number => {
  if (!isNonNegativeInteger(level)) {
    return 0;
  }
  return clampNumber(level, XP_VALIDATION.MIN_LEVEL, XP_VALIDATION.MAX_LEVEL);
};

/**
 * Validates session minutes for XP calculation
 */
export const validateSessionMinutes = (minutes: unknown): number => {
  if (!isPositiveNumber(minutes)) {
    return 0;
  }
  return clampNumber(minutes, 0, XP_VALIDATION.MAX_SESSION_MINUTES);
};

/**
 * Validates coin amount
 */
export const validateCoinAmount = (coins: unknown): number => {
  if (!isNonNegativeInteger(coins)) {
    return 0;
  }
  return clampNumber(coins, COIN_VALIDATION.MIN_BALANCE, COIN_VALIDATION.MAX_BALANCE);
};

/**
 * Validates coin transaction amount
 */
export const validateCoinTransaction = (amount: unknown): number => {
  if (!isPositiveNumber(amount)) {
    return 0;
  }
  return clampNumber(amount, 0, COIN_VALIDATION.MAX_TRANSACTION);
};

/**
 * Validates a multiplier (must be positive)
 */
export const validateMultiplier = (multiplier: unknown): number => {
  if (!isPositiveNumber(multiplier)) {
    return 1;
  }
  return clampNumber(multiplier, 0.1, 10);
};

/**
 * Validates rating (1-5 stars)
 */
export const validateRating = (rating: unknown): number => {
  if (!isNonNegativeInteger(rating)) {
    return 1;
  }
  return clampNumber(rating, 1, 5);
};

/**
 * Timer state validation schema
 */
export interface ValidatedTimerState {
  timeLeft: number;
  sessionDuration: number;
  sessionType: 'work' | 'break';
  isRunning: boolean;
  startTime: number | null;
  soundEnabled: boolean;
  completedSessions: number;
  category?: string;
  taskLabel?: string;
}

/**
 * Validates and sanitizes timer state from storage
 */
export const validateTimerState = (
  data: unknown,
  defaults: ValidatedTimerState
): ValidatedTimerState => {
  if (!data || typeof data !== 'object') {
    return defaults;
  }

  const obj = data as Record<string, unknown>;

  const sessionType = obj.sessionType === 'break' ? 'break' : 'work';
  const sessionDuration = validateTimerDuration(obj.sessionDuration) || defaults.sessionDuration;
  const timeLeft = validateTimerDuration(obj.timeLeft);
  const startTime = isNonNegativeInteger(obj.startTime) ? obj.startTime : null;

  return {
    timeLeft: Math.min(timeLeft, sessionDuration),
    sessionDuration,
    sessionType,
    isRunning: typeof obj.isRunning === 'boolean' ? obj.isRunning : false,
    startTime,
    soundEnabled: typeof obj.soundEnabled === 'boolean' ? obj.soundEnabled : true,
    completedSessions: isNonNegativeInteger(obj.completedSessions) ? obj.completedSessions : 0,
    category: typeof obj.category === 'string' ? obj.category : undefined,
    taskLabel: typeof obj.taskLabel === 'string' ? obj.taskLabel : undefined,
  };
};

/**
 * Coin state validation schema
 */
export interface ValidatedCoinState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

/**
 * Validates and sanitizes coin state from storage
 */
export const validateCoinState = (data: unknown): ValidatedCoinState => {
  const defaults: ValidatedCoinState = {
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
  };

  if (!data || typeof data !== 'object') {
    return defaults;
  }

  const obj = data as Record<string, unknown>;

  return {
    balance: validateCoinAmount(obj.balance),
    totalEarned: validateCoinAmount(obj.totalEarned),
    totalSpent: validateCoinAmount(obj.totalSpent),
  };
};
