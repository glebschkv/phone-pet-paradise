/**
 * Error Reporting Service
 *
 * Integrated with Sentry for production error tracking.
 * Falls back to local logging when Sentry DSN is not configured.
 */

import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';

const ERROR_STORAGE_KEY = 'nomo_error_log';
const MAX_STORED_ERRORS = 50;

// Sentry DSN - set this in your environment variables
// Create a project at https://sentry.io and get your DSN
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userAgent: string;
  url: string;
  componentStack?: string;
}

// Check if Sentry is configured
const isSentryEnabled = (): boolean => {
  return !!SENTRY_DSN && SENTRY_DSN.length > 0;
};

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
    console.warn('[ErrorReporting] Could not store error');
  }
};

/**
 * Report an error to Sentry and local storage
 */
export const reportError = (
  error: Error,
  context?: Record<string, unknown>,
  componentStack?: string
): void => {
  const errorReport: ErrorReport = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    componentStack,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorReporting] Error captured:', errorReport);
  }

  // Store locally for debugging
  storeError(errorReport);

  // Send to Sentry if configured
  if (isSentryEnabled()) {
    Sentry.captureException(error, {
      extra: {
        ...context,
        componentStack,
        errorReportId: errorReport.id,
      },
    });
  }
};

/**
 * Report a warning or non-critical issue
 */
export const reportWarning = (
  message: string,
  context?: Record<string, unknown>
): void => {
  if (import.meta.env.DEV) {
    console.warn('[ErrorReporting] Warning:', message, context);
  }

  // Send to Sentry as a message with warning level
  if (isSentryEnabled()) {
    Sentry.captureMessage(message, {
      level: 'warning',
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
  sessionStorage.setItem('error_user_context', JSON.stringify({ userId, email }));

  // Set user context in Sentry
  if (isSentryEnabled()) {
    Sentry.setUser({
      id: userId,
      email: email,
    });
  }
};

/**
 * Clear user context
 * Call this when the user logs out
 */
export const clearUserContext = (): void => {
  sessionStorage.removeItem('error_user_context');

  // Clear user context in Sentry
  if (isSentryEnabled()) {
    Sentry.setUser(null);
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
 * Should be attached to window.onerror
 */
export const globalErrorHandler = (
  message: Event | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): boolean => {
  const errorObj = error || new Error(typeof message === 'string' ? message : 'Unknown error');

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
 * Should be attached to window.onunhandledrejection
 */
export const globalPromiseRejectionHandler = (event: PromiseRejectionEvent): void => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));

  reportError(error, {
    type: 'unhandledRejection',
  });
};

/**
 * Initialize error reporting with Sentry
 * Call this in main.tsx before rendering
 */
export const initializeErrorReporting = (): void => {
  // Initialize Sentry if DSN is configured
  if (isSentryEnabled()) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: `nomo-phone@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

      // Performance monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

      // Session replay for debugging (only in production)
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
      replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,

      // Filter out sensitive data
      beforeSend(event) {
        // Don't send events in development unless explicitly enabled
        if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEBUG) {
          return null;
        }
        return event;
      },

      // Additional context
      initialScope: {
        tags: {
          platform: Capacitor.getPlatform(),
          isNative: Capacitor.isNativePlatform().toString(),
        },
      },

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
    });

    console.log('[ErrorReporting] Sentry initialized');
  } else {
    console.log('[ErrorReporting] Sentry not configured - using local error logging only');
    console.log('[ErrorReporting] To enable Sentry, set VITE_SENTRY_DSN in your environment');
  }

  // Attach global handlers as fallback
  window.onerror = globalErrorHandler;
  window.onunhandledrejection = globalPromiseRejectionHandler;

  console.log('[ErrorReporting] Global error handlers initialized');
};

/**
 * Create a Sentry error boundary wrapper
 * Use this to wrap your app or specific components
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with Sentry error boundary
 */
export const withErrorBoundary = Sentry.withErrorBoundary;
