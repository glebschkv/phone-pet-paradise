/**
 * Centralized Error Handling Utilities
 *
 * Provides standardized error handling patterns across the application.
 * Ensures consistent logging and error recovery behavior.
 *
 * @module lib/errorHandling
 */

import { createLogger } from './logger';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error';

/**
 * Options for error handling
 */
export interface HandleErrorOptions {
  /** Logger prefix for error messages */
  loggerPrefix?: string;
  /** Severity level (defaults to 'error') */
  severity?: ErrorSeverity;
  /** Whether to rethrow the error after handling */
  rethrow?: boolean;
  /** Context information to include in logs */
  context?: Record<string, unknown>;
  /** Custom fallback value to return on error */
  fallback?: unknown;
}

/**
 * Standardized error handler
 *
 * Provides consistent error logging across the application.
 * Replaces inconsistent patterns like empty catch blocks and
 * explicit error logging.
 *
 * @param error - The error to handle
 * @param message - Description of what operation failed
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   handleError(error, 'Failed to fetch data', { loggerPrefix: 'API' });
 * }
 * ```
 */
export function handleError(
  error: unknown,
  message: string,
  options: HandleErrorOptions = {}
): void {
  const {
    loggerPrefix,
    severity = 'error',
    rethrow = false,
    context,
  } = options;

  const logger = loggerPrefix ? createLogger({ prefix: loggerPrefix }) : createLogger();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = context
    ? `${message}: ${errorMessage} (context: ${JSON.stringify(context)})`
    : `${message}: ${errorMessage}`;

  switch (severity) {
    case 'debug':
      logger.debug(logMessage, error);
      break;
    case 'info':
      logger.info(logMessage, error);
      break;
    case 'warn':
      logger.warn(logMessage, error);
      break;
    case 'error':
    default:
      logger.error(logMessage, error);
      break;
  }

  if (rethrow) {
    throw error;
  }
}

/**
 * Wraps a function with standardized error handling
 *
 * @param fn - The function to wrap
 * @param message - Description of what operation is being performed
 * @param options - Configuration options
 * @returns The wrapped function
 *
 * @example
 * ```typescript
 * const safeFetch = withErrorHandling(
 *   () => fetch('/api/data'),
 *   'Failed to fetch data',
 *   { loggerPrefix: 'API', fallback: null }
 * );
 * ```
 */
export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  message: string,
  options: HandleErrorOptions = {}
): (...args: Args) => T | undefined {
  return (...args: Args): T | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      handleError(error, message, options);
      return options.fallback as T | undefined;
    }
  };
}

/**
 * Wraps an async function with standardized error handling
 *
 * @param fn - The async function to wrap
 * @param message - Description of what operation is being performed
 * @param options - Configuration options
 * @returns The wrapped async function
 *
 * @example
 * ```typescript
 * const safeFetchAsync = withAsyncErrorHandling(
 *   async () => await fetch('/api/data'),
 *   'Failed to fetch data',
 *   { loggerPrefix: 'API', fallback: null }
 * );
 * ```
 */
export function withAsyncErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  message: string,
  options: HandleErrorOptions = {}
): (...args: Args) => Promise<T | undefined> {
  return async (...args: Args): Promise<T | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, message, options);
      return options.fallback as T | undefined;
    }
  };
}

/**
 * Safe JSON parse with error handling
 *
 * Replaces the common pattern of try/catch around JSON.parse with
 * standardized error handling.
 *
 * @param json - The JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @param options - Error handling options
 * @returns Parsed value or fallback
 *
 * @example
 * ```typescript
 * const data = safeJsonParse(savedData, { items: [] }, { loggerPrefix: 'Storage' });
 * ```
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  fallback: T,
  options: HandleErrorOptions = {}
): T {
  if (!json) {
    return fallback;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    handleError(error, 'Failed to parse JSON', {
      ...options,
      severity: options.severity || 'warn',
    });
    return fallback;
  }
}

/**
 * Safe localStorage operations with error handling
 */
export const safeStorage = {
  /**
   * Get item from localStorage with error handling
   */
  getItem<T>(key: string, fallback: T, options: HandleErrorOptions = {}): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return fallback;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      handleError(error, `Failed to get item from localStorage: ${key}`, {
        ...options,
        severity: options.severity || 'warn',
      });
      return fallback;
    }
  },

  /**
   * Set item in localStorage with error handling
   */
  setItem<T>(key: string, value: T, options: HandleErrorOptions = {}): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      handleError(error, `Failed to set item in localStorage: ${key}`, options);
      return false;
    }
  },

  /**
   * Remove item from localStorage with error handling
   */
  removeItem(key: string, options: HandleErrorOptions = {}): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      handleError(error, `Failed to remove item from localStorage: ${key}`, options);
      return false;
    }
  },
};

/**
 * Creates a typed error handler for a specific module
 *
 * @param loggerPrefix - The logger prefix to use for all errors
 * @returns An error handler function
 *
 * @example
 * ```typescript
 * const handleQuestError = createModuleErrorHandler('Quest');
 *
 * try {
 *   await updateQuest();
 * } catch (error) {
 *   handleQuestError(error, 'Failed to update quest');
 * }
 * ```
 */
export function createModuleErrorHandler(loggerPrefix: string) {
  return (
    error: unknown,
    message: string,
    options: Omit<HandleErrorOptions, 'loggerPrefix'> = {}
  ): void => {
    handleError(error, message, { ...options, loggerPrefix });
  };
}
