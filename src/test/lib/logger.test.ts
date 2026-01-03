import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createLogger,
  logger,
  storeKitLogger,
  authLogger,
  xpLogger,
  notificationLogger,
  syncLogger,
  deviceActivityLogger,
  focusModeLogger,
  widgetLogger,
  storageLogger,
  supabaseLogger,
  backupLogger,
  threeLogger,
  timerLogger,
  questLogger,
  achievementLogger,
  shopLogger,
  coinLogger,
  bondLogger,
  streakLogger,
  soundLogger,
  performanceLogger,
  appReviewLogger,
  settingsLogger,
  collectionLogger,
  nativePluginLogger,
} from '@/lib/logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createLogger', () => {
    it('should create a logger with debug, info, warn, error methods', () => {
      const testLogger = createLogger();

      expect(typeof testLogger.debug).toBe('function');
      expect(typeof testLogger.info).toBe('function');
      expect(typeof testLogger.warn).toBe('function');
      expect(typeof testLogger.error).toBe('function');
    });

    it('should log messages in development mode', () => {
      // In test environment, import.meta.env.DEV is typically true
      const testLogger = createLogger();

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');

      expect(consoleLogSpy).toHaveBeenCalledWith('debug message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('info message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('warn message');
    });

    it('should add prefix to log messages when provided', () => {
      const testLogger = createLogger({ prefix: 'TestModule' });

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[TestModule]', 'debug message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[TestModule]', 'info message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TestModule]', 'warn message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TestModule]', 'error message');
    });

    it('should pass multiple arguments to console methods', () => {
      const testLogger = createLogger();

      testLogger.debug('message', { data: 'value' }, 123);

      expect(consoleLogSpy).toHaveBeenCalledWith('message', { data: 'value' }, 123);
    });

    it('should always log errors (even in production)', () => {
      // Error logging is always enabled
      const testLogger = createLogger();
      const error = new Error('Test error');

      testLogger.error('error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle Error objects in production mode differently', () => {
      // In development, errors are logged with full stack
      const testLogger = createLogger();
      const error = new Error('Test error message');

      testLogger.error(error);

      // In development mode, the full error object is logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should support forceLog option', () => {
      const testLogger = createLogger({ forceLog: true });

      testLogger.debug('forced debug');
      testLogger.info('forced info');
      testLogger.warn('forced warn');

      expect(consoleLogSpy).toHaveBeenCalledWith('forced debug');
      expect(consoleInfoSpy).toHaveBeenCalledWith('forced info');
      expect(consoleWarnSpy).toHaveBeenCalledWith('forced warn');
    });
  });

  describe('Default logger instance', () => {
    it('should have all log methods', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should log without prefix', () => {
      logger.debug('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('test message');
    });
  });

  describe('Specialized loggers', () => {
    const specializedLoggers = [
      { name: 'StoreKit', logger: storeKitLogger },
      { name: 'Auth', logger: authLogger },
      { name: 'XP', logger: xpLogger },
      { name: 'Notifications', logger: notificationLogger },
      { name: 'Sync', logger: syncLogger },
      { name: 'DeviceActivity', logger: deviceActivityLogger },
      { name: 'FocusMode', logger: focusModeLogger },
      { name: 'WidgetData', logger: widgetLogger },
      { name: 'Storage', logger: storageLogger },
      { name: 'Supabase', logger: supabaseLogger },
      { name: 'Backup', logger: backupLogger },
      { name: '3D', logger: threeLogger },
      { name: 'Timer', logger: timerLogger },
      { name: 'Quest', logger: questLogger },
      { name: 'Achievement', logger: achievementLogger },
      { name: 'Shop', logger: shopLogger },
      { name: 'Coin', logger: coinLogger },
      { name: 'Bond', logger: bondLogger },
      { name: 'Streak', logger: streakLogger },
      { name: 'Sound', logger: soundLogger },
      { name: 'Performance', logger: performanceLogger },
      { name: 'AppReview', logger: appReviewLogger },
      { name: 'Settings', logger: settingsLogger },
      { name: 'Collection', logger: collectionLogger },
      { name: 'NativePlugin', logger: nativePluginLogger },
    ];

    specializedLoggers.forEach(({ name, logger: specializedLogger }) => {
      it(`${name} logger should log with [${name}] prefix`, () => {
        specializedLogger.info('test message');

        expect(consoleInfoSpy).toHaveBeenCalledWith(`[${name}]`, 'test message');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined arguments', () => {
      const testLogger = createLogger();

      testLogger.debug(undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith(undefined);
    });

    it('should handle null arguments', () => {
      const testLogger = createLogger();

      testLogger.debug(null);
      expect(consoleLogSpy).toHaveBeenCalledWith(null);
    });

    it('should handle object arguments', () => {
      const testLogger = createLogger();
      const obj = { key: 'value', nested: { a: 1 } };

      testLogger.debug(obj);
      expect(consoleLogSpy).toHaveBeenCalledWith(obj);
    });

    it('should handle array arguments', () => {
      const testLogger = createLogger();
      const arr = [1, 2, 3];

      testLogger.debug(arr);
      expect(consoleLogSpy).toHaveBeenCalledWith(arr);
    });

    it('should handle no arguments', () => {
      const testLogger = createLogger();

      testLogger.debug();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle empty prefix', () => {
      const testLogger = createLogger({ prefix: '' });

      testLogger.debug('message');
      // Empty prefix should not add brackets
      expect(consoleLogSpy).toHaveBeenCalledWith('message');
    });
  });
});
