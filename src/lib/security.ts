/**
 * Security Utilities
 *
 * Provides secure alternatives to common operations:
 * - Cryptographically secure random ID generation
 * - Rate limiting for authentication and sensitive operations
 * - Secure cookie management
 * - Input sanitization utilities
 */

// ============================================================================
// CRYPTOGRAPHICALLY SECURE RANDOM UTILITIES
// ============================================================================

/**
 * Generate a cryptographically secure random ID
 * Uses crypto.getRandomValues() instead of Math.random()
 *
 * @param length - Length of the ID (default: 16)
 * @returns A secure random hex string
 */
export function generateSecureId(length: number = 16): string {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

/**
 * Generate a cryptographically secure UUID v4
 * Uses crypto.randomUUID() if available, falls back to manual generation
 */
export function generateSecureUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Set version (4) and variant (8, 9, A, or B)
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;

  const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Generate a secure random number within a range
 * Uses crypto.getRandomValues() instead of Math.random()
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return min;

  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
}

/**
 * Generate a secure random float between 0 and 1
 * Replacement for Math.random()
 */
export function secureRandomFloat(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs?: number;
}

interface RateLimitState {
  attempts: number;
  windowStart: number;
  lockedUntil: number | null;
}

const rateLimitStates = new Map<string, RateLimitState>();

/**
 * Default rate limit configurations for different operations
 */
export const RATE_LIMIT_CONFIGS = {
  auth: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 30 * 60 * 1000, // 30 minute lockout after max attempts
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
  },
  api: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Check if an operation is rate limited
 *
 * @param key - Unique key for the operation (e.g., 'auth:user@email.com')
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and remaining attempts/time
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.auth
): {
  isLimited: boolean;
  remainingAttempts: number;
  retryAfterMs: number | null;
  message: string;
} {
  const now = Date.now();
  let state = rateLimitStates.get(key);

  // Check if currently locked out
  if (state?.lockedUntil && now < state.lockedUntil) {
    const retryAfterMs = state.lockedUntil - now;
    return {
      isLimited: true,
      remainingAttempts: 0,
      retryAfterMs,
      message: `Too many attempts. Please try again in ${Math.ceil(retryAfterMs / 60000)} minutes.`,
    };
  }

  // Reset state if window has expired or no state exists
  if (!state || now - state.windowStart > config.windowMs) {
    state = {
      attempts: 0,
      windowStart: now,
      lockedUntil: null,
    };
    rateLimitStates.set(key, state);
  }

  const remainingAttempts = config.maxAttempts - state.attempts;

  return {
    isLimited: remainingAttempts <= 0,
    remainingAttempts: Math.max(0, remainingAttempts),
    retryAfterMs: remainingAttempts <= 0 ? config.windowMs - (now - state.windowStart) : null,
    message:
      remainingAttempts <= 0
        ? `Rate limit exceeded. Please try again later.`
        : `${remainingAttempts} attempts remaining.`,
  };
}

/**
 * Record an attempt for rate limiting
 *
 * @param key - Unique key for the operation
 * @param config - Rate limit configuration
 * @param success - Whether the attempt was successful (resets counter on success)
 */
export function recordRateLimitAttempt(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.auth,
  success: boolean = false
): void {
  const now = Date.now();
  let state = rateLimitStates.get(key);

  if (!state || now - state.windowStart > config.windowMs) {
    state = {
      attempts: 0,
      windowStart: now,
      lockedUntil: null,
    };
  }

  if (success) {
    // Reset on successful attempt
    rateLimitStates.delete(key);
    return;
  }

  state.attempts++;

  // Apply lockout if max attempts exceeded
  if (state.attempts >= config.maxAttempts && config.lockoutMs) {
    state.lockedUntil = now + config.lockoutMs;
  }

  rateLimitStates.set(key, state);
}

/**
 * Clear rate limit state for a key (e.g., after successful login)
 */
export function clearRateLimit(key: string): void {
  rateLimitStates.delete(key);
}

/**
 * Clear all rate limit states (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStates.clear();
}

// ============================================================================
// SECURE COOKIE UTILITIES
// ============================================================================

interface CookieOptions {
  maxAge?: number;
  path?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  httpOnly?: boolean;
}

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  sameSite: 'Strict',
};

/**
 * Set a cookie with secure defaults
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
export function setSecureCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options };

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (opts.maxAge !== undefined) {
    cookie += `; max-age=${opts.maxAge}`;
  }
  if (opts.path) {
    cookie += `; path=${opts.path}`;
  }
  if (opts.secure) {
    cookie += '; Secure';
  }
  if (opts.sameSite) {
    cookie += `; SameSite=${opts.sameSite}`;
  }
  // Note: httpOnly cannot be set from JavaScript, it must be set by the server

  document.cookie = cookie;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  const encodedName = encodeURIComponent(name);

  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === encodedName) {
      return decodeURIComponent(cookieValue || '');
    }
  }

  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, path: string = '/'): void {
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0; Secure; SameSite=Strict`;
}

// ============================================================================
// SECURE WINDOW OPERATIONS
// ============================================================================

/**
 * Open a URL in a new window/tab with security flags
 * Prevents reverse tabnabbing attacks
 */
export function secureWindowOpen(
  url: string,
  target: string = '_blank'
): Window | null {
  return window.open(url, target, 'noopener,noreferrer');
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize a string for safe display (prevents XSS in edge cases)
 */
export function sanitizeForDisplay(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate and sanitize a URL
 * Returns null if the URL is invalid or potentially malicious
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Check for javascript: or data: in hostname (unlikely but defensive)
    if (parsed.hostname.includes('javascript') || parsed.hostname.includes('data')) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}
