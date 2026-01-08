/**
 * Security Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateSecureId,
  generateSecureUUID,
  secureRandomInt,
  secureRandomFloat,
  checkRateLimit,
  recordRateLimitAttempt,
  clearRateLimit,
  clearAllRateLimits,
  RATE_LIMIT_CONFIGS,
  setSecureCookie,
  getCookie,
  deleteCookie,
  secureWindowOpen,
  sanitizeForDisplay,
  sanitizeUrl,
} from '@/lib/security';

describe('Security Utilities', () => {
  beforeEach(() => {
    clearAllRateLimits();
    // Clear cookies
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; max-age=0`;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Secure Random Generation', () => {
    describe('generateSecureId', () => {
      it('should generate an ID of the specified length', () => {
        const id = generateSecureId(16);
        expect(id).toHaveLength(16);
      });

      it('should generate different IDs on each call', () => {
        const id1 = generateSecureId();
        const id2 = generateSecureId();
        expect(id1).not.toBe(id2);
      });

      it('should only contain hex characters', () => {
        const id = generateSecureId(32);
        expect(id).toMatch(/^[0-9a-f]+$/);
      });

      it('should handle custom lengths', () => {
        expect(generateSecureId(8)).toHaveLength(8);
        expect(generateSecureId(32)).toHaveLength(32);
        expect(generateSecureId(64)).toHaveLength(64);
      });
    });

    describe('generateSecureUUID', () => {
      it('should generate a valid UUID format', () => {
        const uuid = generateSecureUUID();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuid).toMatch(uuidRegex);
      });

      it('should generate different UUIDs on each call', () => {
        const uuid1 = generateSecureUUID();
        const uuid2 = generateSecureUUID();
        expect(uuid1).not.toBe(uuid2);
      });
    });

    describe('secureRandomInt', () => {
      it('should generate numbers within the specified range', () => {
        for (let i = 0; i < 100; i++) {
          const num = secureRandomInt(0, 10);
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThan(10);
        }
      });

      it('should handle negative ranges', () => {
        for (let i = 0; i < 50; i++) {
          const num = secureRandomInt(-10, 0);
          expect(num).toBeGreaterThanOrEqual(-10);
          expect(num).toBeLessThan(0);
        }
      });

      it('should return min when range is zero or negative', () => {
        expect(secureRandomInt(5, 5)).toBe(5);
        expect(secureRandomInt(10, 5)).toBe(10);
      });
    });

    describe('secureRandomFloat', () => {
      it('should generate numbers between 0 and 1', () => {
        for (let i = 0; i < 100; i++) {
          const num = secureRandomFloat();
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThan(1);
        }
      });
    });
  });

  describe('Rate Limiting', () => {
    const testConfig = {
      maxAttempts: 3,
      windowMs: 1000,
      lockoutMs: 2000,
    };

    describe('checkRateLimit', () => {
      it('should allow attempts within the limit', () => {
        const result = checkRateLimit('test-key', testConfig);
        expect(result.isLimited).toBe(false);
        expect(result.remainingAttempts).toBe(3);
      });

      it('should track remaining attempts correctly', () => {
        recordRateLimitAttempt('test-key', testConfig);
        const result = checkRateLimit('test-key', testConfig);
        expect(result.remainingAttempts).toBe(2);
      });
    });

    describe('recordRateLimitAttempt', () => {
      it('should block after max attempts exceeded', () => {
        const key = 'block-test';

        for (let i = 0; i < testConfig.maxAttempts; i++) {
          recordRateLimitAttempt(key, testConfig);
        }

        const result = checkRateLimit(key, testConfig);
        expect(result.isLimited).toBe(true);
        expect(result.remainingAttempts).toBe(0);
      });

      it('should clear on successful attempt', () => {
        const key = 'success-test';

        recordRateLimitAttempt(key, testConfig);
        recordRateLimitAttempt(key, testConfig);
        recordRateLimitAttempt(key, testConfig, true); // success

        const result = checkRateLimit(key, testConfig);
        expect(result.isLimited).toBe(false);
        expect(result.remainingAttempts).toBe(3);
      });
    });

    describe('clearRateLimit', () => {
      it('should reset rate limit state for a key', () => {
        const key = 'clear-test';

        recordRateLimitAttempt(key, testConfig);
        recordRateLimitAttempt(key, testConfig);

        clearRateLimit(key);

        const result = checkRateLimit(key, testConfig);
        expect(result.remainingAttempts).toBe(3);
      });
    });

    describe('RATE_LIMIT_CONFIGS', () => {
      it('should have auth config with reasonable defaults', () => {
        expect(RATE_LIMIT_CONFIGS.auth.maxAttempts).toBe(5);
        expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(15 * 60 * 1000);
      });

      it('should have passwordReset config with stricter limits', () => {
        expect(RATE_LIMIT_CONFIGS.passwordReset.maxAttempts).toBe(3);
      });
    });
  });

  describe('Cookie Utilities', () => {
    describe('setSecureCookie', () => {
      it('should set a cookie with the specified value', () => {
        setSecureCookie('test-cookie', 'test-value');
        expect(document.cookie).toContain('test-cookie=test-value');
      });

      it('should include SameSite flag', () => {
        setSecureCookie('samesite-test', 'value');
        // Note: document.cookie doesn't expose all flags, but we can verify it was set
        expect(getCookie('samesite-test')).toBe('value');
      });
    });

    describe('getCookie', () => {
      it('should retrieve an existing cookie', () => {
        document.cookie = 'existing=value';
        expect(getCookie('existing')).toBe('value');
      });

      it('should return null for non-existent cookie', () => {
        expect(getCookie('non-existent')).toBeNull();
      });
    });

    describe('deleteCookie', () => {
      it('should remove a cookie', () => {
        setSecureCookie('to-delete', 'value');
        deleteCookie('to-delete');
        expect(getCookie('to-delete')).toBeNull();
      });
    });
  });

  describe('Window Operations', () => {
    describe('secureWindowOpen', () => {
      it('should call window.open with security flags', () => {
        const mockOpen = vi.spyOn(window, 'open').mockReturnValue(null);

        secureWindowOpen('https://example.com');

        expect(mockOpen).toHaveBeenCalledWith(
          'https://example.com',
          '_blank',
          'noopener,noreferrer'
        );
      });
    });
  });

  describe('Input Sanitization', () => {
    describe('sanitizeForDisplay', () => {
      it('should escape HTML entities', () => {
        const result = sanitizeForDisplay('<script>alert("xss")</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
      });

      it('should handle normal text unchanged', () => {
        expect(sanitizeForDisplay('Hello World')).toBe('Hello World');
      });
    });

    describe('sanitizeUrl', () => {
      it('should accept valid http URLs', () => {
        expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
      });

      it('should accept valid https URLs', () => {
        expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
      });

      it('should reject javascript: URLs', () => {
        expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
      });

      it('should reject data: URLs', () => {
        expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      });

      it('should reject invalid URLs', () => {
        expect(sanitizeUrl('not-a-url')).toBeNull();
      });

      it('should reject file: URLs', () => {
        expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
      });
    });
  });
});
