/**
 * API Utilities
 *
 * Provides retry logic, error handling, and other utilities for API calls.
 */

import { logger } from './logger';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
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
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries || !config.shouldRetry(error)) {
        throw error;
      }

      logger.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`, error);
      await sleep(delay);
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

  // For Capacitor apps, use a default URL or the Supabase project URL
  if (typeof window !== 'undefined') {
    // On web, use the current origin
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return window.location.origin;
    }
  }

  // Fallback for Capacitor/native apps - should be configured via env var
  return import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '') || '';
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
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  if (password.length < 8) {
    return { valid: true, message: 'Consider using a longer password for better security' };
  }
  return { valid: true, message: '' };
}

/**
 * Sanitize error messages for display to users
 * Removes sensitive information from error messages
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    // Remove sensitive patterns
    const sensitizedMessage = message
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
