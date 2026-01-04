import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock logger before importing store
vi.mock('@/lib/logger', () => ({
  xpLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  useXPStore,
  useCurrentXP,
  useCurrentLevel,
  useUnlockedAnimals,
  useCurrentBiome,
  useAvailableBiomes,
  calculateLevelRequirement,
  MAX_LEVEL,
} from '@/stores/xpStore';

describe('xpStore', () => {
  const STORAGE_KEY = 'nomo_xp_system';

  beforeEach(() => {
    localStorage.clear();
    // Reset store to initial state
    useXPStore.setState({
      currentXP: 0,
      currentLevel: 0,
      xpToNextLevel: 15,
      totalXPForCurrentLevel: 0,
      unlockedAnimals: [],
      currentBiome: 'Meadow',
      availableBiomes: ['Meadow'],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateLevelRequirement', () => {
    it('should return 0 for level 0 or less', () => {
      expect(calculateLevelRequirement(0)).toBe(0);
      expect(calculateLevelRequirement(-1)).toBe(0);
    });

    it('should return 15 for level 1', () => {
      expect(calculateLevelRequirement(1)).toBe(15);
    });

    it('should scale exponentially for higher levels', () => {
      expect(calculateLevelRequirement(2)).toBeGreaterThan(15);
      expect(calculateLevelRequirement(5)).toBeGreaterThan(calculateLevelRequirement(4));
      expect(calculateLevelRequirement(10)).toBeGreaterThan(calculateLevelRequirement(5));
    });

    it('should handle MAX_LEVEL', () => {
      const result = calculateLevelRequirement(MAX_LEVEL);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('MAX_LEVEL', () => {
    it('should be set to 50', () => {
      expect(MAX_LEVEL).toBe(50);
    });
  });

  describe('Initial State', () => {
    it('should initialize with zero currentXP', () => {
      const state = useXPStore.getState();
      expect(state.currentXP).toBe(0);
    });

    it('should initialize with level 0', () => {
      const state = useXPStore.getState();
      expect(state.currentLevel).toBe(0);
    });

    it('should initialize with 15 XP to next level', () => {
      const state = useXPStore.getState();
      expect(state.xpToNextLevel).toBe(15);
    });

    it('should initialize with empty unlocked animals', () => {
      const state = useXPStore.getState();
      expect(state.unlockedAnimals).toEqual([]);
    });

    it('should initialize with Meadow biome', () => {
      const state = useXPStore.getState();
      expect(state.currentBiome).toBe('Meadow');
    });

    it('should initialize with Meadow in available biomes', () => {
      const state = useXPStore.getState();
      expect(state.availableBiomes).toEqual(['Meadow']);
    });

    it('should have all required actions available', () => {
      const state = useXPStore.getState();
      expect(typeof state.setXP).toBe('function');
      expect(typeof state.addXP).toBe('function');
      expect(typeof state.setLevel).toBe('function');
      expect(typeof state.addAnimal).toBe('function');
      expect(typeof state.addAnimals).toBe('function');
      expect(typeof state.switchBiome).toBe('function');
      expect(typeof state.addBiome).toBe('function');
      expect(typeof state.updateState).toBe('function');
      expect(typeof state.resetXP).toBe('function');
    });
  });

  describe('setXP', () => {
    it('should set current XP', () => {
      const { setXP } = useXPStore.getState();

      act(() => {
        setXP(100);
      });

      const state = useXPStore.getState();
      expect(state.currentXP).toBe(100);
    });
  });

  describe('addXP', () => {
    it('should add XP to current amount', () => {
      const { addXP } = useXPStore.getState();

      act(() => {
        addXP(50);
        addXP(30);
      });

      const state = useXPStore.getState();
      expect(state.currentXP).toBe(80);
    });

    it('should handle zero XP addition', () => {
      const { setXP, addXP } = useXPStore.getState();

      act(() => {
        setXP(100);
        addXP(0);
      });

      const state = useXPStore.getState();
      expect(state.currentXP).toBe(100);
    });
  });

  describe('setLevel', () => {
    it('should set current level', () => {
      const { setLevel } = useXPStore.getState();

      act(() => {
        setLevel(5);
      });

      const state = useXPStore.getState();
      expect(state.currentLevel).toBe(5);
    });

    it('should update totalXPForCurrentLevel', () => {
      const { setLevel } = useXPStore.getState();

      act(() => {
        setLevel(5);
      });

      const state = useXPStore.getState();
      expect(state.totalXPForCurrentLevel).toBe(calculateLevelRequirement(5));
    });

    it('should handle MAX_LEVEL', () => {
      const { setLevel } = useXPStore.getState();

      act(() => {
        setLevel(MAX_LEVEL);
      });

      const state = useXPStore.getState();
      expect(state.currentLevel).toBe(MAX_LEVEL);
    });
  });

  describe('addAnimal', () => {
    it('should add a new animal', () => {
      const { addAnimal } = useXPStore.getState();

      act(() => {
        addAnimal('cat');
      });

      const state = useXPStore.getState();
      expect(state.unlockedAnimals).toContain('cat');
    });

    it('should not add duplicate animals', () => {
      const { addAnimal } = useXPStore.getState();

      act(() => {
        addAnimal('cat');
        addAnimal('cat');
      });

      const state = useXPStore.getState();
      expect(state.unlockedAnimals.filter(a => a === 'cat')).toHaveLength(1);
    });

    it('should add multiple different animals', () => {
      const { addAnimal } = useXPStore.getState();

      act(() => {
        addAnimal('cat');
        addAnimal('dog');
        addAnimal('bird');
      });

      const state = useXPStore.getState();
      expect(state.unlockedAnimals).toEqual(['cat', 'dog', 'bird']);
    });
  });

  describe('addAnimals', () => {
    it('should add multiple animals at once', () => {
      const { addAnimals } = useXPStore.getState();

      act(() => {
        addAnimals(['cat', 'dog', 'bird']);
      });

      const state = useXPStore.getState();
      expect(state.unlockedAnimals).toEqual(['cat', 'dog', 'bird']);
    });

    it('should not add duplicate animals', () => {
      const { addAnimal, addAnimals } = useXPStore.getState();

      act(() => {
        addAnimal('cat');
        addAnimals(['cat', 'dog', 'bird']);
      });

      const state = useXPStore.getState();
      expect(state.unlockedAnimals).toEqual(['cat', 'dog', 'bird']);
    });

    it('should handle empty array', () => {
      const { addAnimals } = useXPStore.getState();

      act(() => {
        addAnimals([]);
      });

      const state = useXPStore.getState();
      expect(state.unlockedAnimals).toEqual([]);
    });
  });

  describe('switchBiome', () => {
    it('should switch to available biome', () => {
      const { addBiome, switchBiome } = useXPStore.getState();

      act(() => {
        addBiome('Forest');
        switchBiome('Forest');
      });

      const state = useXPStore.getState();
      expect(state.currentBiome).toBe('Forest');
    });

    it('should not switch to unavailable biome', () => {
      const { switchBiome } = useXPStore.getState();

      act(() => {
        switchBiome('Forest');
      });

      const state = useXPStore.getState();
      expect(state.currentBiome).toBe('Meadow');
    });
  });

  describe('addBiome', () => {
    it('should add a new biome', () => {
      const { addBiome } = useXPStore.getState();

      act(() => {
        addBiome('Forest');
      });

      const state = useXPStore.getState();
      expect(state.availableBiomes).toContain('Forest');
    });

    it('should not add duplicate biomes', () => {
      const { addBiome } = useXPStore.getState();

      act(() => {
        addBiome('Forest');
        addBiome('Forest');
      });

      const state = useXPStore.getState();
      expect(state.availableBiomes.filter(b => b === 'Forest')).toHaveLength(1);
    });

    it('should preserve existing biomes', () => {
      const { addBiome } = useXPStore.getState();

      act(() => {
        addBiome('Forest');
        addBiome('Snow');
      });

      const state = useXPStore.getState();
      expect(state.availableBiomes).toEqual(['Meadow', 'Forest', 'Snow']);
    });
  });

  describe('updateState', () => {
    it('should update partial state', () => {
      const { updateState } = useXPStore.getState();

      act(() => {
        updateState({
          currentXP: 500,
          currentLevel: 10,
        });
      });

      const state = useXPStore.getState();
      expect(state.currentXP).toBe(500);
      expect(state.currentLevel).toBe(10);
      expect(state.currentBiome).toBe('Meadow'); // unchanged
    });
  });

  describe('resetXP', () => {
    it('should reset to initial state', () => {
      const { setXP, setLevel, addAnimal, addBiome, resetXP } = useXPStore.getState();

      act(() => {
        setXP(1000);
        setLevel(20);
        addAnimal('dragon');
        addBiome('Snow');
        resetXP();
      });

      const state = useXPStore.getState();
      expect(state.currentXP).toBe(0);
      expect(state.currentLevel).toBe(0);
      expect(state.unlockedAnimals).toEqual([]);
      expect(state.availableBiomes).toEqual(['Meadow']);
      expect(state.currentBiome).toBe('Meadow');
    });
  });

  describe('Selector Hooks', () => {
    it('useCurrentXP should return currentXP', () => {
      const { setXP } = useXPStore.getState();

      act(() => {
        setXP(250);
      });

      const { result } = renderHook(() => useCurrentXP());
      expect(result.current).toBe(250);
    });

    it('useCurrentLevel should return currentLevel', () => {
      const { setLevel } = useXPStore.getState();

      act(() => {
        setLevel(15);
      });

      const { result } = renderHook(() => useCurrentLevel());
      expect(result.current).toBe(15);
    });

    it('useUnlockedAnimals should return unlockedAnimals', () => {
      const { addAnimals } = useXPStore.getState();

      act(() => {
        addAnimals(['cat', 'dog']);
      });

      const { result } = renderHook(() => useUnlockedAnimals());
      expect(result.current).toEqual(['cat', 'dog']);
    });

    it('useCurrentBiome should return currentBiome', () => {
      const { result } = renderHook(() => useCurrentBiome());
      expect(result.current).toBe('Meadow');
    });

    it('useAvailableBiomes should return availableBiomes', () => {
      const { addBiome } = useXPStore.getState();

      act(() => {
        addBiome('Forest');
      });

      const { result } = renderHook(() => useAvailableBiomes());
      expect(result.current).toEqual(['Meadow', 'Forest']);
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', async () => {
      const { setXP, setLevel, addAnimal } = useXPStore.getState();

      act(() => {
        setXP(500);
        setLevel(10);
        addAnimal('dragon');
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.state.currentXP).toBe(500);
      expect(parsed.state.currentLevel).toBe(10);
      expect(parsed.state.unlockedAnimals).toContain('dragon');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large XP values', () => {
      const { setXP } = useXPStore.getState();

      act(() => {
        setXP(9999999);
      });

      const state = useXPStore.getState();
      expect(state.currentXP).toBe(9999999);
    });

    it('should handle many animals', () => {
      const { addAnimals } = useXPStore.getState();
      const animals = Array.from({ length: 100 }, (_, i) => `animal-${i}`);

      act(() => {
        addAnimals(animals);
      });

      const state = useXPStore.getState();
      expect(state.unlockedAnimals).toHaveLength(100);
    });

    it('should handle many biomes', () => {
      const { addBiome } = useXPStore.getState();
      const biomes = ['Forest', 'Snow', 'Desert', 'Ocean', 'Mountain', 'Jungle'];

      act(() => {
        biomes.forEach(b => addBiome(b));
      });

      const state = useXPStore.getState();
      expect(state.availableBiomes).toHaveLength(7); // Meadow + 6 added
    });
  });
});
