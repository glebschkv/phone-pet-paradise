import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  reportError,
  reportWarning,
  reportInfo,
  setUserContext,
  clearUserContext,
  setContextTags,
  addBreadcrumb,
  getErrorLog,
  clearErrorLog,
  globalErrorHandler,
  globalPromiseRejectionHandler,
  initializeErrorReporting,
  // ErrorReport type available if needed
} from '@/lib/errorReporting';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(() => 'web'),
  },
}));

// Mock minimalSentry
vi.mock('@/lib/minimalSentry', () => ({
  minimalSentry: {
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    setTag: vi.fn(),
    addBreadcrumb: vi.fn(),
  },
}));

describe('Error Reporting', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('reportError', () => {
    it('should create an error report with all required fields', () => {
      const error = new Error('Test error');
      const errorId = reportError(error);

      expect(typeof errorId).toBe('string');
      expect(errorId).toMatch(/^\d+-[a-z0-9]+$/);

      const errors = getErrorLog();
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Test error');
      expect(errors[0].id).toBe(errorId);
    });

    it('should include error stack in report', () => {
      const error = new Error('Stack test');
      reportError(error);

      const errors = getErrorLog();
      expect(errors[0].stack).toBeDefined();
      expect(errors[0].stack).toContain('Stack test');
    });

    it('should include context in error report', () => {
      const error = new Error('Context error');
      const context = { userId: '123', action: 'test' };
      reportError(error, context);

      const errors = getErrorLog();
      expect(errors[0].context).toEqual(context);
    });

    it('should include component stack when provided', () => {
      const error = new Error('Component error');
      const componentStack = 'at Button\nat Form\nat App';
      reportError(error, undefined, componentStack);

      const errors = getErrorLog();
      expect(errors[0].componentStack).toBe(componentStack);
    });

    it('should include user agent in report', () => {
      const error = new Error('UA test');
      reportError(error);

      const errors = getErrorLog();
      expect(errors[0].userAgent).toBeDefined();
    });

    it('should include timestamp in ISO format', () => {
      const error = new Error('Timestamp test');
      reportError(error);

      const errors = getErrorLog();
      expect(errors[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include platform from Capacitor', () => {
      const error = new Error('Platform test');
      reportError(error);

      const errors = getErrorLog();
      expect(errors[0].platform).toBe('web');
    });

    it('should limit stored errors to MAX_STORED_ERRORS', () => {
      // Store more than the max
      for (let i = 0; i < 60; i++) {
        reportError(new Error(`Error ${i}`));
      }

      const errors = getErrorLog();
      expect(errors.length).toBeLessThanOrEqual(50);
      // Most recent should be first
      expect(errors[0].message).toBe('Error 59');
    });

    it('should store errors in LIFO order', () => {
      reportError(new Error('First'));
      reportError(new Error('Second'));
      reportError(new Error('Third'));

      const errors = getErrorLog();
      expect(errors[0].message).toBe('Third');
      expect(errors[1].message).toBe('Second');
      expect(errors[2].message).toBe('First');
    });
  });

  describe('reportWarning', () => {
    it('should log warning in development', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      reportWarning('Test warning', { extra: 'data' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ErrorReporting] Warning:',
        'Test warning',
        { extra: 'data' }
      );
    });

    it('should handle missing context', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      reportWarning('Warning without context');

      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('reportInfo', () => {
    it('should log info in development', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      reportInfo('Test info', { metadata: 'value' });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[ErrorReporting] Info:',
        'Test info',
        { metadata: 'value' }
      );
    });
  });

  describe('setUserContext', () => {
    it('should store user context in sessionStorage', () => {
      setUserContext('user123', 'user@example.com');

      const stored = sessionStorage.getItem('error_user_context');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.userId).toBe('user123');
      expect(parsed.email).toBe('user@example.com');
    });

    it('should handle missing email', () => {
      setUserContext('user456');

      const stored = sessionStorage.getItem('error_user_context');
      const parsed = JSON.parse(stored!);
      expect(parsed.userId).toBe('user456');
      expect(parsed.email).toBeUndefined();
    });
  });

  describe('clearUserContext', () => {
    it('should remove user context from sessionStorage', () => {
      setUserContext('user123', 'user@example.com');
      expect(sessionStorage.getItem('error_user_context')).not.toBeNull();

      clearUserContext();

      expect(sessionStorage.getItem('error_user_context')).toBeNull();
    });
  });

  describe('setContextTags', () => {
    it('should accept tags object', () => {
      // Just verify it doesn't throw
      expect(() => setContextTags({ feature: 'test', version: '1.0' })).not.toThrow();
    });
  });

  describe('addBreadcrumb', () => {
    it('should accept breadcrumb parameters', () => {
      expect(() =>
        addBreadcrumb('User clicked button', 'ui', { buttonId: 'submit' })
      ).not.toThrow();
    });

    it('should handle missing data parameter', () => {
      expect(() => addBreadcrumb('Navigation', 'navigation')).not.toThrow();
    });
  });

  describe('getErrorLog', () => {
    it('should return empty array when no errors stored', () => {
      const errors = getErrorLog();
      expect(errors).toEqual([]);
    });

    it('should return stored errors', () => {
      reportError(new Error('Error 1'));
      reportError(new Error('Error 2'));

      const errors = getErrorLog();
      expect(errors.length).toBe(2);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('nomo_error_log', 'invalid json');

      const errors = getErrorLog();
      expect(errors).toEqual([]);
    });
  });

  describe('clearErrorLog', () => {
    it('should remove all stored errors', () => {
      reportError(new Error('Error 1'));
      reportError(new Error('Error 2'));
      expect(getErrorLog().length).toBe(2);

      clearErrorLog();

      expect(getErrorLog()).toEqual([]);
    });
  });

  describe('globalErrorHandler', () => {
    it('should create error from Error object', () => {
      const error = new Error('Global error');
      const result = globalErrorHandler('error message', 'source.js', 10, 5, error);

      expect(result).toBe(false);

      const errors = getErrorLog();
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Global error');
      expect(errors[0].context).toEqual({
        type: 'unhandled',
        source: 'source.js',
        lineno: 10,
        colno: 5,
      });
    });

    it('should create error from string message when no Error provided', () => {
      const result = globalErrorHandler('String error message', 'script.js', 1, 1);

      expect(result).toBe(false);

      const errors = getErrorLog();
      expect(errors[0].message).toBe('String error message');
    });

    it('should handle Event message type', () => {
      const event = new Event('error');
      const result = globalErrorHandler(event);

      expect(result).toBe(false);

      const errors = getErrorLog();
      expect(errors[0].message).toBe('Unknown error');
    });
  });

  describe('globalPromiseRejectionHandler', () => {
    it('should handle Error rejection', () => {
      const error = new Error('Promise rejection');
      const event = { reason: error } as PromiseRejectionEvent;

      globalPromiseRejectionHandler(event);

      const errors = getErrorLog();
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Promise rejection');
      expect(errors[0].context).toEqual({ type: 'unhandledRejection' });
    });

    it('should handle non-Error rejection', () => {
      const event = { reason: 'String rejection' } as PromiseRejectionEvent;

      globalPromiseRejectionHandler(event);

      const errors = getErrorLog();
      expect(errors[0].message).toBe('String rejection');
    });

    it('should handle object rejection', () => {
      const event = { reason: { code: 500, message: 'Server error' } } as PromiseRejectionEvent;

      globalPromiseRejectionHandler(event);

      const errors = getErrorLog();
      expect(errors[0].message).toContain('object');
    });
  });

  describe('initializeErrorReporting', () => {
    it('should attach global handlers', () => {
      initializeErrorReporting();

      expect(window.onerror).toBe(globalErrorHandler);
      expect(window.onunhandledrejection).toBe(globalPromiseRejectionHandler);
    });
  });

  describe('Error Report Structure', () => {
    it('should generate unique error IDs', () => {
      const errorId1 = reportError(new Error('Error 1'));
      const errorId2 = reportError(new Error('Error 2'));

      expect(errorId1).not.toBe(errorId2);
    });

    it('should include all ErrorReport fields', () => {
      reportError(new Error('Complete error'), { extra: 'context' }, 'component stack');

      const errors = getErrorLog();
      const report = errors[0];

      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('message');
      expect(report).toHaveProperty('stack');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('context');
      expect(report).toHaveProperty('userAgent');
      expect(report).toHaveProperty('url');
      expect(report).toHaveProperty('componentStack');
      expect(report).toHaveProperty('platform');
      expect(report).toHaveProperty('appVersion');
    });
  });

  describe('Storage Edge Cases', () => {
    it('should handle localStorage being full', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      expect(() => reportError(new Error('Storage full error'))).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage being unavailable', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('SecurityError');
      });

      const errors = getErrorLog();
      expect(errors).toEqual([]);

      localStorage.getItem = originalGetItem;
    });
  });
});
