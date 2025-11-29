/**
 * Error Reporting Service
 *
 * A simple error reporting service that can be extended with Sentry, Bugsnag, etc.
 * Currently logs errors to console and stores recent errors locally for debugging.
 *
 * To add Sentry in the future:
 * 1. npm install @sentry/react @sentry/capacitor
 * 2. Initialize Sentry in main.tsx
 * 3. Replace reportError with Sentry.captureException
 */

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
  console.error('[ErrorReporting] Error captured:', errorReport);

  // Store locally
  storeError(errorReport);

  // TODO: Send to remote error tracking service
  // Example with Sentry:
  // Sentry.captureException(error, { extra: context });

  // Example with custom backend:
  // sendErrorToBackend(errorReport);
};

/**
 * Report a warning or non-critical issue
 */
export const reportWarning = (
  message: string,
  context?: Record<string, unknown>
): void => {
  console.warn('[ErrorReporting] Warning:', message, context);

  // Could be sent to analytics or error tracking as a lower-priority issue
};

/**
 * Set user context for error reports
 * Call this when the user logs in
 */
export const setUserContext = (userId: string, email?: string): void => {
  // Store in sessionStorage for inclusion in error reports
  sessionStorage.setItem('error_user_context', JSON.stringify({ userId, email }));

  // TODO: Set user context in error tracking service
  // Example with Sentry:
  // Sentry.setUser({ id: userId, email });
};

/**
 * Clear user context
 * Call this when the user logs out
 */
export const clearUserContext = (): void => {
  sessionStorage.removeItem('error_user_context');

  // TODO: Clear user context in error tracking service
  // Example with Sentry:
  // Sentry.setUser(null);
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
 * Initialize global error handlers
 * Call this in main.tsx
 */
export const initializeErrorReporting = (): void => {
  // Attach global handlers
  window.onerror = globalErrorHandler;
  window.onunhandledrejection = globalPromiseRejectionHandler;

  console.log('[ErrorReporting] Initialized');

  // TODO: Initialize Sentry or other error tracking service here
  // Example:
  // Sentry.init({
  //   dsn: 'YOUR_SENTRY_DSN',
  //   environment: import.meta.env.MODE,
  //   release: '1.0.0',
  // });
};
