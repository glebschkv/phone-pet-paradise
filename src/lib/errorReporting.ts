/**
 * Error Reporting Service
 *
 * Provides error tracking with Sentry integration for production
 * and local storage fallback for development debugging.
 *
 * Setup:
 * 1. npm install @sentry/react
 * 2. Set VITE_SENTRY_DSN in your .env file
 * 3. Errors will automatically be sent to Sentry in production
 */

import * as Sentry from '@sentry/react';
import { env } from './env';

const ERROR_STORAGE_KEY = 'nomo_error_log';
const MAX_STORED_ERRORS = 50;

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

let isInitialized = false;

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
 * Report an error to the error tracking service
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
  if (env().isDevelopment) {
    console.error('[ErrorReporting] Error captured:', errorReport);
  }

  // Store locally for debugging
  storeError(errorReport);

  // Send to Sentry if initialized
  if (isInitialized) {
    Sentry.captureException(error, {
      extra: {
        ...context,
        componentStack,
        errorId: errorReport.id,
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
  if (env().isDevelopment) {
    console.warn('[ErrorReporting] Warning:', message, context);
  }

  // Send to Sentry as a message (not an error)
  if (isInitialized) {
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
  if (isInitialized) {
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
  if (isInitialized) {
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
 * Initialize error reporting
 * Call this in main.tsx before rendering the app
 */
export const initializeErrorReporting = (): void => {
  const config = env();

  // Initialize Sentry if DSN is configured
  if (config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.mode,
      release: `nomo-phone@${config.appVersion}`,

      // Only send errors in production by default
      enabled: config.isProduction,

      // Configure error filtering
      beforeSend(event) {
        // Don't send errors that contain sensitive data patterns
        const errorMessage = event.exception?.values?.[0]?.value || '';
        if (
          errorMessage.includes('Bearer') ||
          errorMessage.includes('password') ||
          errorMessage.includes('api_key')
        ) {
          // Sanitize the message
          if (event.exception?.values?.[0]) {
            event.exception.values[0].value = '[Sanitized - contained sensitive data]';
          }
        }
        return event;
      },

      // Set sample rates
      tracesSampleRate: config.isProduction ? 0.1 : 1.0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: config.isProduction ? 0.1 : 0,

      // Ignore common non-actionable errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        /Loading chunk .* failed/,
        /Network request failed/,
      ],
    });

    isInitialized = true;
    console.log('[ErrorReporting] Sentry initialized');
  } else {
    console.log('[ErrorReporting] Sentry DSN not configured - using local storage only');
  }

  // Attach global handlers
  window.onerror = globalErrorHandler;
  window.onunhandledrejection = globalPromiseRejectionHandler;

  console.log('[ErrorReporting] Initialized');
};

/**
 * Get the Sentry React error boundary for use with React components
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Wrap a component with Sentry profiling (for performance monitoring)
 */
export const withSentryProfiler = Sentry.withProfiler;
