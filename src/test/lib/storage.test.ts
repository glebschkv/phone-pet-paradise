import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';

describe('Storage Keys', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('STORAGE_KEYS', () => {
    it('should have correct prefix for all keys', () => {
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(key).toMatch(/^nomo_/);
      });
    });

    it('should have unique keys', () => {
      const keys = Object.values(STORAGE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have all required keys defined', () => {
      expect(STORAGE_KEYS.GUEST_ID).toBeDefined();
      expect(STORAGE_KEYS.XP_SYSTEM).toBeDefined();
      expect(STORAGE_KEYS.TIMER_STATE).toBeDefined();
      expect(STORAGE_KEYS.ACHIEVEMENTS).toBeDefined();
      expect(STORAGE_KEYS.STREAK_DATA).toBeDefined();
    });
  });

  describe('storage.get', () => {
    it('should return null for non-existent key', () => {
      const result = storage.get(STORAGE_KEYS.XP_SYSTEM);
      expect(result).toBeNull();
    });

    it('should parse and return stored object', () => {
      const testData = { currentXP: 100, level: 2 };
      localStorage.setItem(STORAGE_KEYS.XP_SYSTEM, JSON.stringify(testData));

      const result = storage.get<typeof testData>(STORAGE_KEYS.XP_SYSTEM);
      expect(result).toEqual(testData);
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEYS.XP_SYSTEM, 'invalid json');
      const result = storage.get(STORAGE_KEYS.XP_SYSTEM);
      expect(result).toBeNull();
    });
  });

  describe('storage.set', () => {
    it('should store data as JSON', () => {
      const testData = { key: 'value' };
      storage.set(STORAGE_KEYS.APP_SETTINGS, testData);

      const stored = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      expect(JSON.parse(stored!)).toEqual(testData);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { a: 'b' },
        },
      };
      storage.set(STORAGE_KEYS.APP_STATE, complexData);

      const result = storage.get<typeof complexData>(STORAGE_KEYS.APP_STATE);
      expect(result).toEqual(complexData);
    });
  });

  describe('storage.remove', () => {
    it('should remove stored data', () => {
      storage.set(STORAGE_KEYS.TIMER_STATE, { test: true });
      storage.remove(STORAGE_KEYS.TIMER_STATE);

      expect(storage.get(STORAGE_KEYS.TIMER_STATE)).toBeNull();
    });
  });

  describe('storage.has', () => {
    it('should return false for non-existent key', () => {
      expect(storage.has(STORAGE_KEYS.STREAK_DATA)).toBe(false);
    });

    it('should return true for existing key', () => {
      storage.set(STORAGE_KEYS.STREAK_DATA, { streak: 5 });
      expect(storage.has(STORAGE_KEYS.STREAK_DATA)).toBe(true);
    });
  });

  describe('storage.getWithDefault', () => {
    it('should return default value when key does not exist', () => {
      const defaultValue = { defaultKey: 'defaultValue' };
      const result = storage.getWithDefault(STORAGE_KEYS.BATTLE_PASS, defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it('should return stored value when key exists', () => {
      const storedValue = { storedKey: 'storedValue' };
      storage.set(STORAGE_KEYS.BATTLE_PASS, storedValue);

      const defaultValue = { defaultKey: 'defaultValue' };
      const result = storage.getWithDefault(STORAGE_KEYS.BATTLE_PASS, defaultValue);
      expect(result).toEqual(storedValue);
    });
  });

  describe('storage.update', () => {
    it('should merge updates with existing data', () => {
      storage.set(STORAGE_KEYS.APP_SETTINGS, { setting1: true, setting2: false });
      storage.update(STORAGE_KEYS.APP_SETTINGS, { setting2: true, setting3: 'new' });

      const result = storage.get<Record<string, unknown>>(STORAGE_KEYS.APP_SETTINGS);
      expect(result).toEqual({
        setting1: true,
        setting2: true,
        setting3: 'new',
      });
    });

    it('should create new object if key does not exist', () => {
      storage.update(STORAGE_KEYS.GUILD_DATA, { guildId: '123' });

      const result = storage.get<{ guildId: string }>(STORAGE_KEYS.GUILD_DATA);
      expect(result).toEqual({ guildId: '123' });
    });
  });

  describe('storage.clearAll', () => {
    it('should remove all app storage keys', () => {
      storage.set(STORAGE_KEYS.XP_SYSTEM, { xp: 100 });
      storage.set(STORAGE_KEYS.STREAK_DATA, { streak: 5 });
      storage.set(STORAGE_KEYS.ACHIEVEMENTS, []);

      storage.clearAll();

      expect(storage.has(STORAGE_KEYS.XP_SYSTEM)).toBe(false);
      expect(storage.has(STORAGE_KEYS.STREAK_DATA)).toBe(false);
      expect(storage.has(STORAGE_KEYS.ACHIEVEMENTS)).toBe(false);
    });
  });

  describe('storage.getUsageInfo', () => {
    it('should return correct count and size', () => {
      storage.set(STORAGE_KEYS.XP_SYSTEM, { xp: 100 });
      storage.set(STORAGE_KEYS.STREAK_DATA, { streak: 5 });

      const info = storage.getUsageInfo();
      expect(info.count).toBe(2);
      expect(info.totalSize).toBeGreaterThan(0);
      expect(info.keys).toContain(STORAGE_KEYS.XP_SYSTEM);
      expect(info.keys).toContain(STORAGE_KEYS.STREAK_DATA);
    });
  });

  describe('Legacy Key Migration', () => {
    it('should migrate legacy petIsland_ keys', () => {
      const legacyData = { currentXP: 500, level: 5 };
      localStorage.setItem('petIsland_xpSystem', JSON.stringify(legacyData));

      // Access through storage.get triggers migration
      const result = storage.get(STORAGE_KEYS.XP_SYSTEM);

      expect(result).toEqual(legacyData);
      expect(localStorage.getItem('petIsland_xpSystem')).toBeNull();
    });

    it('should migrate legacy pet_paradise_ keys', () => {
      const legacyData = { currentStreak: 7 };
      localStorage.setItem('pet_paradise_streak_data', JSON.stringify(legacyData));

      const result = storage.get(STORAGE_KEYS.STREAK_DATA);

      expect(result).toEqual(legacyData);
      expect(localStorage.getItem('pet_paradise_streak_data')).toBeNull();
    });

    it('should not overwrite existing new key data during migration', () => {
      const newData = { currentXP: 1000, level: 10 };
      const legacyData = { currentXP: 500, level: 5 };

      localStorage.setItem(STORAGE_KEYS.XP_SYSTEM, JSON.stringify(newData));
      localStorage.setItem('petIsland_xpSystem', JSON.stringify(legacyData));

      const result = storage.get(STORAGE_KEYS.XP_SYSTEM);

      expect(result).toEqual(newData);
      // Legacy key should be cleaned up
      expect(localStorage.getItem('petIsland_xpSystem')).toBeNull();
    });
  });
});
