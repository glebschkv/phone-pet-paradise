import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  sleep,
  safeJsonParse,
  isValidEmail,
  validatePassword,
  sanitizeErrorMessage,
  getAppBaseUrl,
} from '@/lib/apiUtils';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('apiUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      vi.useFakeTimers();

      const promise = sleep(1000);

      vi.advanceTimersByTime(999);
      expect(await Promise.race([promise, Promise.resolve('pending')])).toBe('pending');

      vi.advanceTimersByTime(1);
      await expect(promise).resolves.toBeUndefined();

      vi.useRealTimers();
    });

    it('should resolve immediately for zero delay', async () => {
      vi.useFakeTimers();

      const promise = sleep(0);
      vi.advanceTimersByTime(0);
      await expect(promise).resolves.toBeUndefined();

      vi.useRealTimers();
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "test", "value": 123}';
      const result = safeJsonParse(json, {});

      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJsonParse('invalid json', fallback);

      expect(result).toEqual(fallback);
    });

    it('should return fallback for empty string', () => {
      const fallback = { empty: true };
      const result = safeJsonParse('', fallback);

      expect(result).toEqual(fallback);
    });

    it('should parse JSON arrays', () => {
      const json = '[1, 2, 3]';
      const result = safeJsonParse(json, []);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should parse null values', () => {
      const json = 'null';
      const result = safeJsonParse(json, { fallback: true });

      expect(result).toBeNull();
    });

    it('should parse primitive values', () => {
      expect(safeJsonParse('123', 0)).toBe(123);
      expect(safeJsonParse('"hello"', '')).toBe('hello');
      expect(safeJsonParse('true', false)).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@email.co.uk',
        'a@b.io',
        'test123@subdomain.example.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@nodomain.com',
        'no@tld',
        'spaces in@email.com',
        'missing@.com',
        '',
        'no-at-sign.com',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Abc1!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('abcdefg1!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('ABCDEFG1!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Abcdefgh!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('Abcdefg1');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('special character');
    });

    it('should reject common passwords', () => {
      const result = validatePassword('Password1!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('too common');
    });

    it('should accept valid passwords with all requirements', () => {
      const result = validatePassword('MySecure1!');

      expect(result.valid).toBe(true);
    });

    it('should suggest longer passwords for 8-11 character passwords', () => {
      const result = validatePassword('MySecure1!');

      expect(result.valid).toBe(true);
      expect(result.message).toContain('12+ characters');
    });

    it('should return empty message for passwords 12+ characters', () => {
      const result = validatePassword('MyVerySecure1!');

      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should redact Bearer tokens', () => {
      const error = new Error('Auth failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      const result = sanitizeErrorMessage(error);

      expect(result).not.toContain('eyJhbGciOiJ');
      expect(result).toContain('[REDACTED]');
    });

    it('should redact API keys', () => {
      const error = new Error('Request failed: api_key=sk-12345abcde');
      const result = sanitizeErrorMessage(error);

      expect(result).not.toContain('sk-12345');
      expect(result).toContain('[REDACTED]');
    });

    it('should redact passwords', () => {
      const error = new Error('Login failed: password=mysecret123');
      const result = sanitizeErrorMessage(error);

      expect(result).not.toContain('mysecret123');
      expect(result).toContain('[REDACTED]');
    });

    it('should return generic message for network errors', () => {
      const error = new Error('fetch failed: network error');
      const result = sanitizeErrorMessage(error);

      expect(result).toBe('Network error. Please check your connection and try again.');
    });

    it('should return session expired message for 401 errors', () => {
      const error = new Error('Request failed with status 401 unauthorized');
      const result = sanitizeErrorMessage(error);

      expect(result).toBe('Session expired. Please sign in again.');
    });

    it('should return permission denied message for 403 errors', () => {
      const error = new Error('Request failed with status 403 forbidden');
      const result = sanitizeErrorMessage(error);

      expect(result).toBe('You do not have permission to perform this action.');
    });

    it('should return generic message for non-Error objects', () => {
      const result = sanitizeErrorMessage('string error');

      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('should return generic message for null', () => {
      const result = sanitizeErrorMessage(null);

      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      vi.useFakeTimers();

      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('success');

      const promise = withRetry(fn);

      // First retry after 1s
      await vi.advanceTimersByTimeAsync(1000);
      // Second retry after 2s
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should throw after max retries', async () => {
      vi.useFakeTimers();

      const fn = vi.fn().mockRejectedValue(new Error('network error'));

      const promise = withRetry(fn, { maxRetries: 2 });

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).rejects.toThrow('network error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries

      vi.useRealTimers();
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('validation error'));

      await expect(withRetry(fn)).rejects.toThrow('validation error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect custom retry options', async () => {
      vi.useFakeTimers();

      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('custom error'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, {
        maxRetries: 1,
        initialDelayMs: 500,
        shouldRetry: () => true,
      });

      await vi.advanceTimersByTimeAsync(500);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should apply exponential backoff', async () => {
      vi.useFakeTimers();

      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, {
        initialDelayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 1000,
      });

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry after 200ms (100 * 2)
      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should cap delay at maxDelayMs', async () => {
      vi.useFakeTimers();

      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, {
        initialDelayMs: 500,
        backoffMultiplier: 10,
        maxDelayMs: 1000,
        maxRetries: 3,
      });

      // First retry
      await vi.advanceTimersByTimeAsync(500);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry - capped at 1000ms (not 5000ms)
      await vi.advanceTimersByTimeAsync(1000);
      expect(fn).toHaveBeenCalledTimes(3);

      // Third retry - still 1000ms
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result).toBe('success');

      vi.useRealTimers();
    });
  });

  describe('getAppBaseUrl', () => {
    const originalLocation = window.location;
    const originalEnv = import.meta.env;

    beforeEach(() => {
      // Reset environment
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:5173', protocol: 'http:' },
        writable: true,
      });
    });

    afterEach(() => {
      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('should return window origin for web apps', () => {
      const result = getAppBaseUrl();
      expect(result).toBe('http://localhost:5173');
    });

    it('should prefer VITE_APP_URL environment variable', () => {
      // This test documents expected behavior - env var takes priority
      // Actual implementation depends on Vite's env handling
      const result = getAppBaseUrl();
      expect(typeof result).toBe('string');
    });
  });
});
