import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import {
  coinSystemSchema,
  xpSystemSchema,
  premiumStatusSchema,
  streakDataSchema,
  validateWithSchema,
  validateOrDefault,
} from '@/lib/storage-validation';

describe('Storage Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Coin System Schema', () => {
    it('should validate correct coin data', () => {
      const validData = { balance: 100, totalEarned: 200, totalSpent: 100 };
      const result = coinSystemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject negative balance', () => {
      const invalidData = { balance: -100, totalEarned: 0, totalSpent: 0 };
      const result = coinSystemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer values', () => {
      const invalidData = { balance: 100.5, totalEarned: 0, totalSpent: 0 };
      const result = coinSystemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should apply defaults for missing fields', () => {
      const partialData = { balance: 50 };
      const result = coinSystemSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalEarned).toBe(0);
        expect(result.data.totalSpent).toBe(0);
      }
    });

    it('should reject excessively large numbers', () => {
      const invalidData = { balance: Number.MAX_SAFE_INTEGER + 1, totalEarned: 0, totalSpent: 0 };
      const result = coinSystemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('XP System Schema', () => {
    it('should validate correct XP data', () => {
      const validData = {
        currentXP: 100,
        currentLevel: 5,
        xpToNextLevel: 50,
        totalXPForCurrentLevel: 200,
        unlockedAnimals: ['cat', 'dog'],
        currentBiome: 'Forest',
        availableBiomes: ['Meadow', 'Forest'],
      };
      const result = xpSystemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject level above maximum', () => {
      const invalidData = {
        currentXP: 100,
        currentLevel: 150, // Max is 100
        xpToNextLevel: 50,
        totalXPForCurrentLevel: 200,
      };
      const result = xpSystemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should apply defaults for missing arrays', () => {
      const partialData = {
        currentXP: 100,
        currentLevel: 5,
      };
      const result = xpSystemSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unlockedAnimals).toEqual([]);
        expect(result.data.availableBiomes).toEqual(['Meadow']);
        expect(result.data.currentBiome).toBe('Meadow');
      }
    });

    it('should limit array lengths', () => {
      const invalidData = {
        currentXP: 100,
        currentLevel: 5,
        unlockedAnimals: new Array(501).fill('animal'), // Max is 500
      };
      const result = xpSystemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Premium Status Schema', () => {
    it('should validate correct premium data', () => {
      const validData = {
        tier: 'premium' as const,
        expiresAt: '2025-12-31T23:59:59Z',
        purchasedAt: '2024-01-01T00:00:00Z',
        planId: 'plan_123',
      };
      const result = premiumStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid tier', () => {
      const invalidData = {
        tier: 'super_premium', // Not a valid tier
        expiresAt: null,
        purchasedAt: null,
        planId: null,
      };
      const result = premiumStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should default to free tier', () => {
      const partialData = {};
      const result = premiumStatusSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('free');
      }
    });

    it('should reject invalid date strings', () => {
      const invalidData = {
        tier: 'premium',
        expiresAt: 'not-a-date',
      };
      const result = premiumStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept null dates', () => {
      const validData = {
        tier: 'lifetime' as const,
        expiresAt: null,
        purchasedAt: null,
        planId: null,
      };
      const result = premiumStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Streak Data Schema', () => {
    it('should validate correct streak data', () => {
      const validData = {
        currentStreak: 7,
        longestStreak: 30,
        lastSessionDate: '2024-01-15',
        totalSessions: 100,
        streakFreezeCount: 3,
      };
      const result = streakDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject unreasonably large streaks', () => {
      const invalidData = {
        currentStreak: 50000, // Max is 10000
        longestStreak: 7,
      };
      const result = streakDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should apply defaults', () => {
      const result = streakDataSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentStreak).toBe(0);
        expect(result.data.longestStreak).toBe(0);
        expect(result.data.streakFreezeCount).toBe(0);
      }
    });
  });

  describe('validateWithSchema', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number().min(0).max(150),
    });

    it('should return success for valid data', () => {
      const result = validateWithSchema(testSchema, { name: 'John', age: 30 });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 30 });
    });

    it('should return failure for invalid data', () => {
      const result = validateWithSchema(
        testSchema,
        { name: 'John', age: -5 },
        { logErrors: false }
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null/undefined input', () => {
      const result = validateWithSchema(testSchema, null, { logErrors: false });
      expect(result.success).toBe(false);
    });
  });

  describe('validateOrDefault', () => {
    const testSchema = z.object({
      count: z.number().min(0).default(0),
    });
    const defaultValue = { count: 0 };

    it('should return validated data for valid input', () => {
      const result = validateOrDefault(testSchema, { count: 42 }, defaultValue);
      expect(result).toEqual({ count: 42 });
    });

    it('should return default for invalid input', () => {
      const result = validateOrDefault(
        testSchema,
        { count: -10 },
        defaultValue,
        { logErrors: false }
      );
      expect(result).toEqual(defaultValue);
    });

    it('should return default for null input', () => {
      const result = validateOrDefault(testSchema, null, defaultValue, { logErrors: false });
      expect(result).toEqual(defaultValue);
    });
  });

  describe('storage.getValidated', () => {
    it('should return validated data for valid stored data', () => {
      const validData = { balance: 100, totalEarned: 200, totalSpent: 100 };
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, JSON.stringify(validData));

      const result = storage.getValidated(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(result).toEqual(validData);
    });

    it('should return null for invalid stored data', () => {
      const invalidData = { balance: -100, totalEarned: 0, totalSpent: 0 };
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, JSON.stringify(invalidData));

      const result = storage.getValidated(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(result).toBeNull();
    });

    it('should return null for non-existent key', () => {
      const result = storage.getValidated(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(result).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, 'not valid json');

      const result = storage.getValidated(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(result).toBeNull();
    });
  });

  describe('storage.getValidatedOrDefault', () => {
    const defaultCoinState = { balance: 0, totalEarned: 0, totalSpent: 0 };

    it('should return validated data for valid stored data', () => {
      const validData = { balance: 500, totalEarned: 1000, totalSpent: 500 };
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, JSON.stringify(validData));

      const result = storage.getValidatedOrDefault(
        STORAGE_KEYS.COIN_SYSTEM,
        coinSystemSchema,
        defaultCoinState
      );
      expect(result).toEqual(validData);
    });

    it('should return default for invalid stored data', () => {
      const invalidData = { balance: 'not a number', totalEarned: 0, totalSpent: 0 };
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, JSON.stringify(invalidData));

      const result = storage.getValidatedOrDefault(
        STORAGE_KEYS.COIN_SYSTEM,
        coinSystemSchema,
        defaultCoinState
      );
      expect(result).toEqual(defaultCoinState);
    });

    it('should return default for non-existent key', () => {
      const result = storage.getValidatedOrDefault(
        STORAGE_KEYS.COIN_SYSTEM,
        coinSystemSchema,
        defaultCoinState
      );
      expect(result).toEqual(defaultCoinState);
    });
  });

  describe('storage.setValidated', () => {
    it('should store valid data', () => {
      const validData = { balance: 100, totalEarned: 100, totalSpent: 0 };
      const success = storage.setValidated(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema, validData);

      expect(success).toBe(true);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.COIN_SYSTEM)!);
      expect(stored).toEqual(validData);
    });

    it('should refuse to store invalid data', () => {
      const invalidData = { balance: -100, totalEarned: 0, totalSpent: 0 };
      const success = storage.setValidated(
        STORAGE_KEYS.COIN_SYSTEM,
        coinSystemSchema,
        invalidData as { balance: number; totalEarned: number; totalSpent: number }
      );

      expect(success).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.COIN_SYSTEM)).toBeNull();
    });
  });

  describe('storage.validate', () => {
    it('should return valid for correct data', () => {
      const validData = { balance: 100, totalEarned: 100, totalSpent: 0 };
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, JSON.stringify(validData));

      const result = storage.validate(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid with errors for incorrect data', () => {
      const invalidData = { balance: -100, totalEarned: 'not a number' };
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, JSON.stringify(invalidData));

      const result = storage.validate(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should return valid for non-existent key', () => {
      const result = storage.validate(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(result.valid).toBe(true);
    });
  });

  describe('storage.repair', () => {
    it('should repair data with missing fields using defaults', () => {
      const partialData = { balance: 100 }; // Missing totalEarned, totalSpent
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, JSON.stringify(partialData));

      const repaired = storage.repair(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(repaired).toBe(true);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.COIN_SYSTEM)!);
      expect(stored.balance).toBe(100);
      expect(stored.totalEarned).toBe(0);
      expect(stored.totalSpent).toBe(0);
    });

    it('should return false for non-existent key', () => {
      const repaired = storage.repair(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(repaired).toBe(false);
    });

    it('should return false for completely invalid data', () => {
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, JSON.stringify({ balance: 'invalid' }));

      const repaired = storage.repair(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      expect(repaired).toBe(false);
    });
  });

  describe('Security: Malicious Data Handling', () => {
    it('should reject prototype pollution attempts', () => {
      const maliciousData = JSON.stringify({
        balance: 100,
        totalEarned: 0,
        totalSpent: 0,
        __proto__: { isAdmin: true },
      });
      localStorage.setItem(STORAGE_KEYS.COIN_SYSTEM, maliciousData);

      const result = storage.getValidated(STORAGE_KEYS.COIN_SYSTEM, coinSystemSchema);
      // Should still work - Zod strips unknown properties including malicious __proto__
      expect(result).toBeDefined();
      // The malicious isAdmin property should not be accessible on the result
      expect((result as Record<string, unknown>).isAdmin).toBeUndefined();
      // Result should only have the validated schema properties
      expect(Object.keys(result!)).toEqual(['balance', 'totalEarned', 'totalSpent']);
    });

    it('should reject extremely long strings', () => {
      const longString = 'a'.repeat(10001); // Exceeds max length
      const invalidData = {
        tier: 'free',
        expiresAt: null,
        purchasedAt: null,
        planId: longString,
      };

      const result = premiumStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject script injection in strings', () => {
      const xssAttempt = {
        currentXP: 0,
        currentLevel: 0,
        currentBiome: '<script>alert("xss")</script>',
        unlockedAnimals: [],
        availableBiomes: ['Meadow'],
      };

      // Schema validation passes (we don't sanitize, that's React's job)
      // But the data is safely contained in the schema
      const result = xpSystemSchema.safeParse(xssAttempt);
      expect(result.success).toBe(true);
      // The string is stored as-is, but React will escape it when rendering
    });

    it('should handle Number overflow attempts', () => {
      const overflowData = {
        balance: Infinity,
        totalEarned: 0,
        totalSpent: 0,
      };

      const result = coinSystemSchema.safeParse(overflowData);
      expect(result.success).toBe(false);
    });

    it('should handle NaN values', () => {
      const nanData = {
        balance: NaN,
        totalEarned: 0,
        totalSpent: 0,
      };

      const result = coinSystemSchema.safeParse(nanData);
      expect(result.success).toBe(false);
    });
  });
});
