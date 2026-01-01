/**
 * Production-safe logger
 *
 * Only logs in development mode. In production, logs are suppressed
 * to prevent exposing sensitive information and improve performance.
 */

const isDevelopment = import.meta.env.DEV;

interface LoggerOptions {
  prefix?: string;
  forceLog?: boolean; // Force logging even in production (use sparingly)
}

const formatMessage = (prefix: string | undefined, ...args: unknown[]): unknown[] => {
  if (prefix) {
    return [`[${prefix}]`, ...args];
  }
  return args;
};

/**
 * Create a logger instance with optional prefix
 */
export const createLogger = (options: LoggerOptions = {}) => {
  const { prefix, forceLog = false } = options;
  const shouldLog = isDevelopment || forceLog;

  return {
    debug: (...args: unknown[]) => {
      if (shouldLog) {
        console.log(...formatMessage(prefix, ...args));
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog) {
        console.info(...formatMessage(prefix, ...args));
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog) {
        console.warn(...formatMessage(prefix, ...args));
      }
    },
    error: (...args: unknown[]) => {
      // Errors are always logged, but with less detail in production
      if (isDevelopment) {
        console.error(...formatMessage(prefix, ...args));
      } else {
        // In production, only log the error message without stack traces
        const sanitizedArgs = args.map(arg => {
          if (arg instanceof Error) {
            return arg.message;
          }
          return arg;
        });
        console.error(...formatMessage(prefix, ...sanitizedArgs));
      }
    },
  };
};

// Default logger instance
export const logger = createLogger();

// Specialized loggers for different modules
export const storeKitLogger = createLogger({ prefix: 'StoreKit' });
export const authLogger = createLogger({ prefix: 'Auth' });
export const xpLogger = createLogger({ prefix: 'XP' });
export const notificationLogger = createLogger({ prefix: 'Notifications' });
export const syncLogger = createLogger({ prefix: 'Sync' });
export const deviceActivityLogger = createLogger({ prefix: 'DeviceActivity' });
export const focusModeLogger = createLogger({ prefix: 'FocusMode' });
export const widgetLogger = createLogger({ prefix: 'WidgetData' });
export const storageLogger = createLogger({ prefix: 'Storage' });
export const supabaseLogger = createLogger({ prefix: 'Supabase' });
export const backupLogger = createLogger({ prefix: 'Backup' });
export const threeLogger = createLogger({ prefix: '3D' });
export const timerLogger = createLogger({ prefix: 'Timer' });
export const questLogger = createLogger({ prefix: 'Quest' });
export const achievementLogger = createLogger({ prefix: 'Achievement' });
export const shopLogger = createLogger({ prefix: 'Shop' });
export const coinLogger = createLogger({ prefix: 'Coin' });
export const bondLogger = createLogger({ prefix: 'Bond' });
export const streakLogger = createLogger({ prefix: 'Streak' });
export const soundLogger = createLogger({ prefix: 'Sound' });
export const performanceLogger = createLogger({ prefix: 'Performance' });
export const appReviewLogger = createLogger({ prefix: 'AppReview' });
export const settingsLogger = createLogger({ prefix: 'Settings' });
export const collectionLogger = createLogger({ prefix: 'Collection' });
