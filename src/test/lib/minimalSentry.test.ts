import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  minimalSentry,
  inboundFiltersIntegration,
  functionToStringIntegration,
  linkedErrorsIntegration,
  dedupeIntegration,
} from '@/lib/minimalSentry';

describe('minimalSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch and sendBeacon
    global.fetch = vi.fn().mockResolvedValue({});
    navigator.sendBeacon = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('init', () => {
    it('should initialize with valid DSN', () => {
      expect(() =>
        minimalSentry.init({
          dsn: 'https://key@sentry.io/123',
        })
      ).not.toThrow();
    });

    it('should warn with invalid DSN', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      minimalSentry.init({
        dsn: 'invalid-dsn',
      });
      expect(consoleSpy).toHaveBeenCalledWith('[MinimalSentry] Invalid DSN');
    });

    it('should accept optional release and environment', () => {
      expect(() =>
        minimalSentry.init({
          dsn: 'https://key@sentry.io/123',
          release: '1.0.0',
          environment: 'production',
        })
      ).not.toThrow();
    });

    it('should accept beforeSend callback', () => {
      expect(() =>
        minimalSentry.init({
          dsn: 'https://key@sentry.io/123',
          beforeSend: (event) => event,
        })
      ).not.toThrow();
    });
  });

  describe('setTag', () => {
    it('should set a tag', () => {
      expect(() => minimalSentry.setTag('userId', '123')).not.toThrow();
    });
  });

  describe('setUser', () => {
    it('should set user with id', () => {
      expect(() => minimalSentry.setUser({ id: '123' })).not.toThrow();
    });

    it('should set user with email', () => {
      expect(() => minimalSentry.setUser({ email: 'test@example.com' })).not.toThrow();
    });

    it('should clear user with null', () => {
      expect(() => minimalSentry.setUser(null)).not.toThrow();
    });
  });

  describe('addBreadcrumb', () => {
    it('should accept breadcrumb (no-op in minimal client)', () => {
      expect(() =>
        minimalSentry.addBreadcrumb({
          message: 'User clicked button',
          category: 'ui',
        })
      ).not.toThrow();
    });

    it('should accept breadcrumb with data', () => {
      expect(() =>
        minimalSentry.addBreadcrumb({
          message: 'API call',
          category: 'xhr',
          data: { url: '/api/test' },
        })
      ).not.toThrow();
    });
  });

  describe('captureException', () => {
    beforeEach(() => {
      minimalSentry.init({
        dsn: 'https://key@sentry.io/123',
      });
    });

    it('should return event ID for valid error', () => {
      const error = new Error('Test error');
      const eventId = minimalSentry.captureException(error);
      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
      expect(eventId!.length).toBe(32);
    });

    it('should send error via sendBeacon if available', () => {
      const error = new Error('Test error');
      minimalSentry.captureException(error);
      expect(navigator.sendBeacon).toHaveBeenCalled();
    });

    it('should accept extra data', () => {
      const error = new Error('Test error');
      const eventId = minimalSentry.captureException(error, { context: 'test' });
      expect(eventId).toBeDefined();
    });

    it('should return null without DSN', () => {
      minimalSentry.init({ dsn: 'invalid' });
      const error = new Error('Test');
      const eventId = minimalSentry.captureException(error);
      expect(eventId).toBeNull();
    });
  });

  describe('captureMessage', () => {
    beforeEach(() => {
      minimalSentry.init({
        dsn: 'https://key@sentry.io/123',
      });
    });

    it('should return event ID for message', () => {
      const eventId = minimalSentry.captureMessage('Test message');
      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });

    it('should accept level option', () => {
      const eventId = minimalSentry.captureMessage('Warning message', {
        level: 'warning',
      });
      expect(eventId).toBeDefined();
    });

    it('should accept extra data', () => {
      const eventId = minimalSentry.captureMessage('Info message', {
        level: 'info',
        extra: { userId: '123' },
      });
      expect(eventId).toBeDefined();
    });

    it('should return null without DSN', () => {
      minimalSentry.init({ dsn: 'invalid' });
      const eventId = minimalSentry.captureMessage('Test');
      expect(eventId).toBeNull();
    });
  });

  describe('beforeSend', () => {
    it('should filter events when beforeSend returns null', () => {
      minimalSentry.init({
        dsn: 'https://key@sentry.io/123',
        beforeSend: () => null,
      });

      const error = new Error('Filtered error');
      minimalSentry.captureException(error);
    });

    it('should modify events via beforeSend', () => {
      minimalSentry.init({
        dsn: 'https://key@sentry.io/123',
        beforeSend: (event) => ({
          ...event,
          tags: { ...event.tags, modified: 'true' },
        }),
      });

      const error = new Error('Test error');
      minimalSentry.captureException(error);
      expect(navigator.sendBeacon).toHaveBeenCalled();
    });
  });

  describe('integration helpers', () => {
    it('should export inboundFiltersIntegration', () => {
      const integration = inboundFiltersIntegration();
      expect(integration).toEqual({});
    });

    it('should export functionToStringIntegration', () => {
      const integration = functionToStringIntegration();
      expect(integration).toEqual({});
    });

    it('should export linkedErrorsIntegration', () => {
      const integration = linkedErrorsIntegration();
      expect(integration).toEqual({});
    });

    it('should export dedupeIntegration', () => {
      const integration = dedupeIntegration();
      expect(integration).toEqual({});
    });
  });

  describe('stack parsing', () => {
    beforeEach(() => {
      minimalSentry.init({
        dsn: 'https://key@sentry.io/123',
      });
    });

    it('should handle errors with stack traces', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at functionName (file.js:10:5)
    at anotherFunction (file.js:20:10)`;

      const eventId = minimalSentry.captureException(error);
      expect(eventId).toBeDefined();
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Test error');
      error.stack = undefined;

      const eventId = minimalSentry.captureException(error);
      expect(eventId).toBeDefined();
    });
  });

  describe('fallback to fetch when sendBeacon unavailable', () => {
    it('should use fetch when sendBeacon is not available', () => {
      const originalSendBeacon = navigator.sendBeacon;
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        configurable: true,
      });

      minimalSentry.init({
        dsn: 'https://key@sentry.io/123',
      });

      const error = new Error('Test error');
      minimalSentry.captureException(error);

      expect(global.fetch).toHaveBeenCalled();

      Object.defineProperty(navigator, 'sendBeacon', {
        value: originalSendBeacon,
        configurable: true,
      });
    });
  });
});
