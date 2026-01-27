import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  createValidatedStorage,
  createValidatedRehydrateHandler,
} from '@/lib/validated-zustand-storage';
import { storageLogger } from '@/lib/logger';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  storageLogger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockedStorageLogger = vi.mocked(storageLogger);

describe('validated-zustand-storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createValidatedStorage', () => {
    const testSchema = z.object({
      count: z.number(),
      name: z.string(),
    });

    const defaultState = {
      count: 0,
      name: 'default',
    };

    it('should create a valid storage adapter', () => {
      const storage = createValidatedStorage({
        schema: testSchema,
        defaultState,
        name: 'test-store',
      });

      expect(storage).toHaveProperty('getItem');
      expect(storage).toHaveProperty('setItem');
      expect(storage).toHaveProperty('removeItem');
    });

    describe('getItem', () => {
      it('should return null when key does not exist', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        const result = storage.getItem('nonexistent');
        expect(result).toBeNull();
      });

      it('should return validated data when valid', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        const storedData = {
          state: { count: 5, name: 'test' },
          version: 0,
        };
        localStorage.setItem('test-key', JSON.stringify(storedData));

        const result = storage.getItem('test-key');
        expect(result).toEqual({
          state: { count: 5, name: 'test' },
          version: 0,
        });
      });

      it('should return default state when validation fails', async () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        const invalidData = {
          state: { count: 'not a number', name: 123 },
          version: 0,
        };
        localStorage.setItem('test-key', JSON.stringify(invalidData));

        const result = await storage.getItem('test-key');
        expect(result?.state).toEqual(defaultState);
      });

      it('should attempt repair when option is enabled', async () => {
        const schemaWithDefaults = z.object({
          count: z.number().default(0),
          name: z.string().default('default'),
          extra: z.string().optional(),
        });

        const storage = createValidatedStorage({
          schema: schemaWithDefaults,
          defaultState: { count: 0, name: 'default' },
          name: 'test-store',
          attemptRepair: true,
        });

        // Partial valid data
        const partialData = {
          state: { count: 10, name: 123 }, // name is wrong type
          version: 0,
        };
        localStorage.setItem('test-key', JSON.stringify(partialData));

        const result = await storage.getItem('test-key');
        // Should preserve valid count but use default for invalid name
        expect(result?.state.count).toBe(10);
      });

      it('should preserve XP data during repair', async () => {
        const xpSchema = z.object({
          currentXP: z.number().default(0),
          currentLevel: z.number().default(1),
          extra: z.string().default(''),
        });

        const storage = createValidatedStorage({
          schema: xpSchema,
          defaultState: { currentXP: 0, currentLevel: 1, extra: '' },
          name: 'xp-store',
          attemptRepair: true,
        });

        // Data with XP but invalid extra field
        const dataWithXP = {
          state: { currentXP: 5000, currentLevel: 10, extra: 123 },
          version: 0,
        };
        localStorage.setItem('test-key', JSON.stringify(dataWithXP));

        const result = await storage.getItem('test-key');
        // Should preserve XP values
        expect(result?.state.currentXP).toBe(5000);
        expect(result?.state.currentLevel).toBe(10);
      });

      it('should return null for invalid JSON', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        localStorage.setItem('test-key', 'not valid json');

        const result = storage.getItem('test-key');
        expect(result).toBeNull();
      });

      it('should return null for unexpected structure', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        localStorage.setItem('test-key', JSON.stringify({ unexpected: true }));

        const result = storage.getItem('test-key');
        expect(result).toBeNull();
      });

      it('should respect logErrors option', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
          logErrors: false,
        });

        const invalidData = {
          state: { count: 'invalid' },
          version: 0,
        };
        localStorage.setItem('test-key', JSON.stringify(invalidData));

        storage.getItem('test-key');

        // Should not have logged warnings
        expect(mockedStorageLogger.warn).not.toHaveBeenCalled();
      });
    });

    describe('setItem', () => {
      it('should store valid data', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        const dataToStore = {
          state: { count: 5, name: 'test' },
          version: 0,
        };

        storage.setItem('test-key', dataToStore);

        const stored = JSON.parse(localStorage.getItem('test-key')!);
        expect(stored.state).toEqual({ count: 5, name: 'test' });
      });

      it('should refuse to store invalid data', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        const invalidData = {
          state: { count: 'not a number', name: 123 },
          version: 0,
        };

        storage.setItem('test-key', invalidData as unknown as { state: { count: number; name: string }; version: number });

        // Should not have stored the invalid data
        expect(localStorage.getItem('test-key')).toBeNull();
      });

      it('should handle storage errors gracefully', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        // Mock localStorage.setItem to throw
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Storage full');
        };

        const dataToStore = {
          state: { count: 5, name: 'test' },
          version: 0,
        };

        expect(() => storage.setItem('test-key', dataToStore)).not.toThrow();

        localStorage.setItem = originalSetItem;
      });

      it('should store non-standard structure as-is', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        const weirdData = { something: 'else' };

        storage.setItem('test-key', weirdData as unknown as { state: { count: number; name: string }; version?: number });

        const stored = JSON.parse(localStorage.getItem('test-key')!);
        expect(stored).toEqual(weirdData);
      });
    });

    describe('removeItem', () => {
      it('should remove item from storage', () => {
        const storage = createValidatedStorage({
          schema: testSchema,
          defaultState,
          name: 'test-store',
        });

        localStorage.setItem('test-key', 'value');

        storage.removeItem('test-key');

        expect(localStorage.getItem('test-key')).toBeNull();
      });
    });
  });

  describe('createValidatedRehydrateHandler', () => {
    const testSchema = z.object({
      count: z.number(),
      name: z.string(),
    });

    it('should return a handler factory function', () => {
      const handler = createValidatedRehydrateHandler({
        schema: testSchema,
        name: 'test-store',
      });

      expect(typeof handler).toBe('function');
    });

    it('should call onSuccess for valid state', () => {
      const onSuccess = vi.fn();
      const handler = createValidatedRehydrateHandler({
        schema: testSchema,
        name: 'test-store',
        onSuccess,
      });

      const callback = handler();
      callback?.({ count: 5, name: 'test' });

      expect(onSuccess).toHaveBeenCalledWith({ count: 5, name: 'test' });
    });

    it('should call onError for invalid state', () => {
      const onError = vi.fn();
      const handler = createValidatedRehydrateHandler({
        schema: testSchema,
        name: 'test-store',
        onError,
      });

      const callback = handler();
      callback?.({ count: 'invalid', name: 123 } as unknown as { count: number; name: string });

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call onError when rehydration has error', () => {
      const onError = vi.fn();
      const handler = createValidatedRehydrateHandler({
        schema: testSchema,
        name: 'test-store',
        onError,
      });

      const callback = handler();
      callback?.(undefined, new Error('Rehydration failed'));

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle string errors', () => {
      const onError = vi.fn();
      const handler = createValidatedRehydrateHandler({
        schema: testSchema,
        name: 'test-store',
        onError,
      });

      const callback = handler();
      callback?.(undefined, 'String error');

      expect(onError).toHaveBeenCalled();
    });

    it('should not throw when callbacks are not provided', () => {
      const handler = createValidatedRehydrateHandler({
        schema: testSchema,
        name: 'test-store',
      });

      const callback = handler();

      expect(() => callback?.({ count: 5, name: 'test' })).not.toThrow();
      expect(() => callback?.(undefined, new Error('test'))).not.toThrow();
    });

    it('should handle null state', () => {
      const onSuccess = vi.fn();
      const handler = createValidatedRehydrateHandler({
        schema: testSchema,
        name: 'test-store',
        onSuccess,
      });

      const callback = handler();
      callback?.(undefined);

      // onSuccess should not be called for undefined state
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
