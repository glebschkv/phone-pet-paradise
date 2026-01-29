/**
 * API Utilities
 *
 * Provides retry logic, error handling, request cancellation, and other utilities for API calls.
 */

import { logger } from './logger';

// ============================================================================
// ABORT CONTROLLER UTILITIES
// ============================================================================

/**
 * Creates an AbortController that automatically cleans up when aborted.
 * Use this for request cancellation to prevent memory leaks.
 */
export function createAbortController(): AbortController {
  return new AbortController();
}

/**
 * Creates an abortable request wrapper that can be cancelled.
 * Returns both the promise and an abort function.
 *
 * @example
 * const { promise, abort } = createAbortableRequest(async (signal) => {
 *   const response = await fetch(url, { signal });
 *   return response.json();
 * });
 *
 * // Later, to cancel:
 * abort();
 */
export function createAbortableRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>
): { promise: Promise<T>; abort: () => void } {
  const controller = new AbortController();

  const promise = requestFn(controller.signal).catch((error) => {
    if (error.name === 'AbortError') {
      logger.debug('Request aborted');
      throw error;
    }
    throw error;
  });

  return {
    promise,
    abort: () => controller.abort(),
  };
}

/**
 * Hook-friendly abort controller that tracks active requests.
 * Useful for cleaning up all pending requests on component unmount.
 */
export class RequestManager {
  private controllers: Set<AbortController> = new Set();

  /**
   * Create a new AbortController and track it
   */
  create(): AbortController {
    const controller = new AbortController();
    this.controllers.add(controller);

    // Auto-remove when aborted
    controller.signal.addEventListener('abort', () => {
      this.controllers.delete(controller);
    });

    return controller;
  }

  /**
   * Abort a specific controller and remove it from tracking
   */
  abort(controller: AbortController): void {
    controller.abort();
    this.controllers.delete(controller);
  }

  /**
   * Abort all tracked controllers (call on component unmount)
   */
  abortAll(): void {
    this.controllers.forEach((controller) => {
      controller.abort();
    });
    this.controllers.clear();
  }

  /**
   * Get the number of active requests
   */
  get activeCount(): number {
    return this.controllers.size;
  }
}

/**
 * Check if an error is an abort error
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }
  return error instanceof Error && error.name === 'AbortError';
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
  signal?: AbortSignal;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'signal'>> & { signal?: AbortSignal } = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    // Don't retry abort errors
    if (isAbortError(error)) {
      return false;
    }
    // Retry on network errors and 5xx server errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        message.includes('503') ||
        message.includes('502') ||
        message.includes('500')
      );
    }
    return false;
  },
};

/**
 * Execute an async function with exponential backoff retry
 * Supports AbortSignal for request cancellation
 */
export async function withRetry<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    // Check if aborted before each attempt
    if (config.signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    try {
      return await fn(config.signal);
    } catch (error) {
      lastError = error;

      // Don't retry if aborted
      if (isAbortError(error)) {
        throw error;
      }

      if (attempt === config.maxRetries || !config.shouldRetry(error)) {
        throw error;
      }

      logger.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`, error);

      // Use abortable sleep if signal provided
      await sleepWithSignal(delay, config.signal);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep with AbortSignal support - cancellable delay
 */
export function sleepWithSignal(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    return sleep(ms);
  }

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Sleep aborted', 'AbortError'));
      return;
    }

    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Sleep aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort);
  });
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Check if we're in a production environment
 */
export const isProduction = import.meta.env.PROD;

/**
 * Check if we're in a development environment
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: string, fallback: string = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : fallback;
}

/**
 * Get the app's base URL for redirects
 */
export function getAppBaseUrl(): string {
  // Priority: environment variable > window location
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    // For Capacitor/native apps, use the custom URL scheme for deep-link redirects
    if (
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:'
    ) {
      return 'co.nomoinc.nomo://callback';
    }

    // On web, use the current origin
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return window.location.origin;
    }
  }

  // Fallback for server-side or unknown environments
  return 'co.nomoinc.nomo://callback';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * SECURITY: Enforce strong password requirements
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  // Minimum length requirement
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  // Check against common weak passwords
  const commonPasswords = [
    'password', 'password1', '12345678', 'qwerty123', 'letmein1',
    'welcome1', 'admin123', 'iloveyou', 'sunshine1', 'princess1'
  ];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return { valid: false, message: 'Password is too common. Please choose a stronger password' };
  }

  // Suggest longer password for maximum security
  if (password.length < 12) {
    return { valid: true, message: 'Consider using 12+ characters for maximum security' };
  }

  return { valid: true, message: '' };
}

/**
 * Check if an error is a request interruption error that should be silently ignored
 * These occur during normal component lifecycle (unmount, navigation, etc.)
 */
export function isRequestInterruptedError(error: unknown): boolean {
  // DOMException may not extend Error in all environments (e.g. Node.js/jsdom)
  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('request interrupted') ||
      message.includes('aborted') ||
      message.includes('abort') ||
      error.name === 'AbortError'
    );
  }
  return false;
}

/**
 * Sanitize error messages for display to users
 * Removes sensitive information from error messages
 * Returns null for errors that should be silently ignored
 */
export function sanitizeErrorMessage(error: unknown): string | null {
  // Silently ignore request interruption errors - these are normal during component lifecycle
  if (isRequestInterruptedError(error)) {
    logger.debug('Request interrupted (normal lifecycle event)', error);
    return null;
  }

  if (error instanceof Error) {
    const message = error.message;

    // Remove sensitive patterns
    const sanitizedMessage = message
      .replace(/Bearer\s+[^\s]+/gi, '[REDACTED]')
      .replace(/api[_-]?key[:\s=]+[^\s&"']+/gi, 'api_key=[REDACTED]')
      .replace(/password[:\s=]+[^\s&"']+/gi, 'password=[REDACTED]');

    // Generic messages for common errors
    if (message.includes('fetch') || message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Session expired. Please sign in again.';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }

    return sanitizedMessage;
  }

  return 'An unexpected error occurred. Please try again.';
}
