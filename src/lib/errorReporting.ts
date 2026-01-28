/**
 * Error Reporting Service
 *
 * Provides comprehensive error tracking with a minimal Sentry client (~3KB).
 * For advanced features like Session Replay, the full SDK can be lazy-loaded.
 * Falls back to local storage when Sentry is not configured.
 */

import { Capacitor } from '@capacitor/core';
import { STORAGE_CONFIG, APP_CONFIG } from './constants';
import { minimalSentry } from './minimalSentry';

const ERROR_STORAGE_KEY = `${APP_CONFIG.STORAGE_PREFIX}error_log`;
const MAX_STORED_ERRORS = STORAGE_CONFIG.MAX_STORED_ERRORS;

// Environment check for Sentry DSN
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const IS_PRODUCTION = import.meta.env.PROD;
const IS_SENTRY_ENABLED = Boolean(SENTRY_DSN) && IS_PRODUCTION;

let sentryInitialized = false;

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userAgent: string;
  url: string;
  componentStack?: string;
  platform: string;
  appVersion: string;
}

// Store errors locally for debugging
const getStoredErrors = (): ErrorReport[] => {
  try {
    const stored = localStorage.getItem(ERROR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const storeError = (error: ErrorReport) => {
  try {
    const errors = getStoredErrors();
    errors.unshift(error);

    // Keep only the most recent errors
    if (errors.length > MAX_STORED_ERRORS) {
      errors.splice(MAX_STORED_ERRORS);
    }

    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
  } catch {
    // Storage full or unavailable, just log
    if (!IS_PRODUCTION) {
      console.warn('[ErrorReporting] Could not store error locally');
    }
  }
};

/**
 * Initialize the minimal Sentry client
 */
const initMinimalSentry = (): void => {
  if (sentryInitialized || !IS_SENTRY_ENABLED) {
    return;
  }

  minimalSentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `${APP_CONFIG.APP_NAME}@${APP_CONFIG.APP_VERSION}`,
    beforeSend(event) {
      // Filter out common non-actionable errors
      const errorValue = event.exception?.values?.[0]?.value || event.message?.formatted || '';
      if (errorValue.includes('Failed to fetch') || errorValue.includes('ResizeObserver')) {
        return null;
      }
      return event;
    },
  });

  // Set platform tag
  minimalSentry.setTag('platform', Capacitor.getPlatform());
  minimalSentry.setTag('appVersion', APP_CONFIG.APP_VERSION);

  sentryInitialized = true;
};

/**
 * Report an error to the error tracking service
 */
export const reportError = (
  error: Error,
  context?: Record<string, unknown>,
  componentStack?: string
): string => {
  const errorId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const errorReport: ErrorReport = {
    id: errorId,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    componentStack,
    platform: Capacitor.getPlatform(),
    appVersion: APP_CONFIG.APP_VERSION,
  };

  // Log to console in development
  if (!IS_PRODUCTION) {
    console.error('[ErrorReporting] Error captured:', errorReport);
  }

  // Store locally for debugging
  storeError(errorReport);

  // Send to Sentry if configured
  if (IS_SENTRY_ENABLED && sentryInitialized) {
    minimalSentry.captureException(error, {
      ...context,
      errorId,
      componentStack,
      platform: errorReport.platform,
    });
  }

  return errorId;
};

/**
 * Report a warning or non-critical issue
 */
export const reportWarning = (
  message: string,
  context?: Record<string, unknown>
): void => {
  if (!IS_PRODUCTION) {
    console.warn('[ErrorReporting] Warning:', message, context);
  }

  if (IS_SENTRY_ENABLED && sentryInitialized) {
    minimalSentry.captureMessage(message, {
      level: 'warning',
      extra: context,
    });
  }
};

/**
 * Report an informational message
 */
export const reportInfo = (
  message: string,
  context?: Record<string, unknown>
): void => {
  if (!IS_PRODUCTION) {
    console.info('[ErrorReporting] Info:', message, context);
  }

  if (IS_SENTRY_ENABLED && sentryInitialized) {
    minimalSentry.captureMessage(message, {
      level: 'info',
      extra: context,
    });
  }
};

/**
 * Set user context for error reports
 * Call this when the user logs in
 */
export const setUserContext = (userId: string, email?: string): void => {
  // Store in sessionStorage for inclusion in error reports
  sessionStorage.setItem(
    'error_user_context',
    JSON.stringify({ userId, email })
  );

  // Set user context in Sentry
  if (IS_SENTRY_ENABLED && sentryInitialized) {
    minimalSentry.setUser({ id: userId, email });
  }
};

/**
 * Clear user context
 * Call this when the user logs out
 */
export const clearUserContext = (): void => {
  sessionStorage.removeItem('error_user_context');

  if (IS_SENTRY_ENABLED && sentryInitialized) {
    minimalSentry.setUser(null);
  }
};

/**
 * Set additional context tags
 */
export const setContextTags = (tags: Record<string, string>): void => {
  if (IS_SENTRY_ENABLED && sentryInitialized) {
    Object.entries(tags).forEach(([key, value]) => {
      minimalSentry.setTag(key, value);
    });
  }
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
): void => {
  if (IS_SENTRY_ENABLED && sentryInitialized) {
    minimalSentry.addBreadcrumb({ message, category, data });
  }
};

/**
 * Get stored errors for debugging
 */
export const getErrorLog = (): ErrorReport[] => {
  return getStoredErrors();
};

/**
 * Clear stored errors
 */
export const clearErrorLog = (): void => {
  localStorage.removeItem(ERROR_STORAGE_KEY);
};

/**
 * Global error handler for unhandled errors
 */
export const globalErrorHandler = (
  message: Event | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): boolean => {
  const errorObj =
    error || new Error(typeof message === 'string' ? message : 'Unknown error');

  reportError(errorObj, {
    type: 'unhandled',
    source,
    lineno,
    colno,
  });

  // Return false to allow the error to propagate
  return false;
};

/**
 * Global handler for unhandled promise rejections
 */
export const globalPromiseRejectionHandler = (
  event: PromiseRejectionEvent
): void => {
  const error =
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

  reportError(error, {
    type: 'unhandledRejection',
  });
};

/**
 * Initialize error reporting
 * Sets up global handlers and initializes minimal Sentry client
 */
export const initializeErrorReporting = (): void => {
  // Initialize minimal Sentry (production only, ~3KB)
  initMinimalSentry();

  // Attach global handlers (works without Sentry)
  window.onerror = globalErrorHandler;
  window.onunhandledrejection = globalPromiseRejectionHandler;
};

/**
 * Get Sentry error boundary component (if available)
 * Note: Returns null since we use minimal client without React integration
 * Use the custom ErrorBoundary component instead
 */
export const getSentryErrorBoundary = () => {
  // We use custom error boundaries that call reportError()
  return null;
};

/**
 * Wrap component with profiling (no-op since we use minimal client)
 */
export function withSentryProfiler<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  // No-op - we use minimal client without profiling
  return Component;
}

export { IS_SENTRY_ENABLED };
