import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useXPStore,
  useCurrentXP,
  useCurrentLevel,
  useUnlockedAnimals,
  useCurrentBiome,
  useAvailableBiomes,
  subscribeToXPChanges,
  calculateLevelRequirement,
  calculateLevelFromXP,
  MAX_LEVEL,
} from '@/stores/xpStore';

// Mock the logger to avoid console noise
vi.mock('@/lib/logger', () => ({
  xpLogger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the validated storage
vi.mock('@/lib/validated-zustand-storage', () => ({
  createValidatedStorage: () => ({
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

describe('xpStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useXPStore.getState().resetXP();
    });
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('MAX_LEVEL should be 50', () => {
      expect(MAX_LEVEL).toBe(50);
    });
  });

  describe('calculateLevelRequirement', () => {
    it('should return 0 for level 0', () => {
      expect(calculateLevelRequirement(0)).toBe(0);
    });

    it('should return 15 for level 1', () => {
      expect(calculateLevelRequirement(1)).toBe(15);
    });

    it('should return increasing values for higher levels', () => {
      const level2 = calculateLevelRequirement(2);
      const level3 = calculateLevelRequirement(3);
      const level4 = calculateLevelRequirement(4);

      expect(level2).toBeGreaterThan(15);
      expect(level3).toBeGreaterThan(level2);
      expect(level4).toBeGreaterThan(level3);
    });

    it('should handle negative levels gracefully', () => {
      expect(calculateLevelRequirement(-1)).toBe(0);
    });

    it('should use exponential scaling (1.15^n)', () => {
      // Level 2 should be 15 * 1.15^1 = 17.25 -> 17
      expect(calculateLevelRequirement(2)).toBe(Math.floor(15 * Math.pow(1.15, 1)));
    });
  });

  describe('calculateLevelFromXP', () => {
    it('should return 0 for 0 XP', () => {
      expect(calculateLevelFromXP(0)).toBe(0);
    });

    it('should return level 1 when XP meets requirement', () => {
      expect(calculateLevelFromXP(15)).toBe(1);
    });

    it('should return correct level for accumulated XP', () => {
      // Calculate XP needed for level 5
      let totalXP = 0;
      for (let i = 1; i <= 5; i++) {
        totalXP += calculateLevelRequirement(i);
      }
      // Should be exactly level 5 or close
      const level = calculateLevelFromXP(totalXP);
      expect(level).toBeGreaterThanOrEqual(5);
    });

    it('should cap at MAX_LEVEL', () => {
      expect(calculateLevelFromXP(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL);
    });
  });

  describe('Initial State', () => {
    it('should have zero XP initially', () => {
      const { currentXP } = useXPStore.getState();
      expect(currentXP).toBe(0);
    });

    it('should have level 0 initially', () => {
      const { currentLevel } = useXPStore.getState();
      expect(currentLevel).toBe(0);
    });

    it('should have 15 XP to next level initially', () => {
      const { xpToNextLevel } = useXPStore.getState();
      expect(xpToNextLevel).toBe(15);
    });

    it('should have empty unlocked animals initially', () => {
      const { unlockedAnimals } = useXPStore.getState();
      expect(unlockedAnimals).toEqual([]);
    });

    it('should have Snow as default biome', () => {
      const { currentBiome } = useXPStore.getState();
      expect(currentBiome).toBe('Snow');
    });

    it('should have Snow in available biomes', () => {
      const { availableBiomes } = useXPStore.getState();
      expect(availableBiomes).toContain('Snow');
    });
  });

  describe('setXP', () => {
    it('should set XP to specific value', () => {
      const { setXP } = useXPStore.getState();

      act(() => {
        setXP(100);
      });

      expect(useXPStore.getState().currentXP).toBe(100);
    });

    it('should allow setting to zero', () => {
      const { setXP } = useXPStore.getState();

      act(() => {
        setXP(500);
      });

      act(() => {
        setXP(0);
      });

      expect(useXPStore.getState().currentXP).toBe(0);
    });
  });

  describe('addXP', () => {
    it('should add XP to current amount', () => {
      const { addXP } = useXPStore.getState();

      act(() => {
        addXP(50);
      });

      expect(useXPStore.getState().currentXP).toBe(50);
    });

    it('should accumulate XP over multiple additions', () => {
      const { addXP } = useXPStore.getState();

      act(() => {
        addXP(25);
        addXP(25);
        addXP(50);
      });

      expect(useXPStore.getState().currentXP).toBe(100);
    });

    it('should handle negative XP (allowing it for corrections)', () => {
      const { addXP, setXP } = useXPStore.getState();

      act(() => {
        setXP(100);
        addXP(-50);
      });

      expect(useXPStore.getState().currentXP).toBe(50);
    });
  });

  describe('setLevel', () => {
    it('should set level directly', () => {
      const { setLevel } = useXPStore.getState();

      act(() => {
        setLevel(5);
      });

      expect(useXPStore.getState().currentLevel).toBe(5);
    });

    it('should update totalXPForCurrentLevel', () => {
      const { setLevel } = useXPStore.getState();

      act(() => {
        setLevel(5);
      });

      const expectedXP = calculateLevelRequirement(5);
      expect(useXPStore.getState().totalXPForCurrentLevel).toBe(expectedXP);
    });

    it('should update xpToNextLevel', () => {
      const { setLevel, setXP } = useXPStore.getState();

      act(() => {
        setXP(100);
        setLevel(3);
      });

      const nextLevelXP = calculateLevelRequirement(4);
      const currentXP = useXPStore.getState().currentXP;
      expect(useXPStore.getState().xpToNextLevel).toBe(nextLevelXP - currentXP);
    });
  });

  describe('addAnimal', () => {
    it('should add a new animal', () => {
      const { addAnimal } = useXPStore.getState();

      act(() => {
        addAnimal('panda');
      });

      expect(useXPStore.getState().unlockedAnimals).toContain('panda');
    });

    it('should not add duplicate animals', () => {
      const { addAnimal } = useXPStore.getState();

      act(() => {
        addAnimal('cat');
        addAnimal('cat');
        addAnimal('cat');
      });

      const animals = useXPStore.getState().unlockedAnimals;
      expect(animals.filter(a => a === 'cat')).toHaveLength(1);
    });

    it('should maintain existing animals when adding new', () => {
      const { addAnimal } = useXPStore.getState();

      act(() => {
        addAnimal('dog');
        addAnimal('cat');
      });

      const { unlockedAnimals } = useXPStore.getState();
      expect(unlockedAnimals).toContain('dog');
      expect(unlockedAnimals).toContain('cat');
    });
  });

  describe('addAnimals', () => {
    it('should add multiple animals at once', () => {
      const { addAnimals } = useXPStore.getState();

      act(() => {
        addAnimals(['bird', 'fish', 'rabbit']);
      });

      const { unlockedAnimals } = useXPStore.getState();
      expect(unlockedAnimals).toContain('bird');
      expect(unlockedAnimals).toContain('fish');
      expect(unlockedAnimals).toContain('rabbit');
    });

    it('should filter out duplicates when adding multiple', () => {
      const { addAnimal, addAnimals } = useXPStore.getState();

      act(() => {
        addAnimal('dog');
        addAnimals(['dog', 'cat', 'bird']);
      });

      const { unlockedAnimals } = useXPStore.getState();
      expect(unlockedAnimals.filter(a => a === 'dog')).toHaveLength(1);
      expect(unlockedAnimals).toHaveLength(3);
    });

    it('should not update state if no new animals', () => {
      const { addAnimals } = useXPStore.getState();

      act(() => {
        addAnimals(['cat', 'dog']);
      });

      const initialAnimals = [...useXPStore.getState().unlockedAnimals];

      act(() => {
        addAnimals(['cat', 'dog']);
      });

      expect(useXPStore.getState().unlockedAnimals).toEqual(initialAnimals);
    });
  });

  describe('switchBiome', () => {
    it('should switch to available biome', () => {
      const { addBiome, switchBiome } = useXPStore.getState();

      act(() => {
        addBiome('Forest');
        switchBiome('Forest');
      });

      expect(useXPStore.getState().currentBiome).toBe('Forest');
    });

    it('should not switch to unavailable biome', () => {
      const { switchBiome } = useXPStore.getState();

      act(() => {
        switchBiome('Desert');
      });

      expect(useXPStore.getState().currentBiome).toBe('Snow');
    });

    it('should allow switching back to original biome', () => {
      const { addBiome, switchBiome } = useXPStore.getState();

      act(() => {
        addBiome('Beach');
        switchBiome('Beach');
      });

      expect(useXPStore.getState().currentBiome).toBe('Beach');

      act(() => {
        switchBiome('Snow');
      });

      expect(useXPStore.getState().currentBiome).toBe('Snow');
    });
  });

  describe('addBiome', () => {
    it('should add a new biome', () => {
      const { addBiome } = useXPStore.getState();

      act(() => {
        addBiome('Mountain');
      });

      expect(useXPStore.getState().availableBiomes).toContain('Mountain');
    });

    it('should not add duplicate biomes', () => {
      const { addBiome } = useXPStore.getState();

      act(() => {
        addBiome('Forest');
        addBiome('Forest');
      });

      const biomes = useXPStore.getState().availableBiomes;
      expect(biomes.filter(b => b === 'Forest')).toHaveLength(1);
    });

    it('should keep default Snow when adding new biomes', () => {
      const { addBiome } = useXPStore.getState();

      act(() => {
        addBiome('Ocean');
        addBiome('Cave');
      });

      expect(useXPStore.getState().availableBiomes).toContain('Snow');
    });
  });

  describe('updateState', () => {
    it('should update multiple state properties at once', () => {
      const { updateState } = useXPStore.getState();

      act(() => {
        updateState({
          currentXP: 500,
          currentLevel: 10,
          currentBiome: 'Meadow',
        });
      });

      const state = useXPStore.getState();
      expect(state.currentXP).toBe(500);
      expect(state.currentLevel).toBe(10);
    });

    it('should not affect unspecified properties', () => {
      const { addAnimal, updateState } = useXPStore.getState();

      act(() => {
        addAnimal('tiger');
      });

      act(() => {
        updateState({ currentXP: 100 });
      });

      expect(useXPStore.getState().unlockedAnimals).toContain('tiger');
    });
  });

  describe('resetXP', () => {
    it('should reset all state to initial values', () => {
      const { addXP, setLevel, addAnimal, addBiome, resetXP } = useXPStore.getState();

      act(() => {
        addXP(1000);
        setLevel(15);
        addAnimal('lion');
        addBiome('Jungle');
      });

      act(() => {
        resetXP();
      });

      const state = useXPStore.getState();
      expect(state.currentXP).toBe(0);
      expect(state.currentLevel).toBe(0);
      expect(state.unlockedAnimals).toEqual([]);
      expect(state.availableBiomes).toEqual(['Snow']);
      expect(state.currentBiome).toBe('Snow');
    });
  });

  describe('Selector Hooks', () => {
    it('useCurrentXP should return current XP', () => {
      act(() => {
        useXPStore.getState().setXP(250);
      });

      const { result } = renderHook(() => useCurrentXP());
      expect(result.current).toBe(250);
    });

    it('useCurrentLevel should return current level', () => {
      act(() => {
        useXPStore.getState().setLevel(7);
      });

      const { result } = renderHook(() => useCurrentLevel());
      expect(result.current).toBe(7);
    });

    it('useUnlockedAnimals should return animals array', () => {
      act(() => {
        useXPStore.getState().addAnimals(['bear', 'deer']);
      });

      const { result } = renderHook(() => useUnlockedAnimals());
      expect(result.current).toContain('bear');
      expect(result.current).toContain('deer');
    });

    it('useCurrentBiome should return current biome', () => {
      const { result } = renderHook(() => useCurrentBiome());
      expect(result.current).toBe('Snow');
    });

    it('useAvailableBiomes should return available biomes', () => {
      act(() => {
        useXPStore.getState().addBiome('Meadow');
      });

      const { result } = renderHook(() => useAvailableBiomes());
      expect(result.current).toContain('Snow');
      expect(result.current).toContain('Meadow');
    });

    it('selectors should update on state change', () => {
      const { result } = renderHook(() => useCurrentXP());
      expect(result.current).toBe(0);

      act(() => {
        useXPStore.getState().addXP(75);
      });

      expect(result.current).toBe(75);
    });
  });

  describe('subscribeToXPChanges', () => {
    it('should call callback on XP changes', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToXPChanges(callback);

      act(() => {
        useXPStore.getState().addXP(100);
      });

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('should call callback on level changes', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToXPChanges(callback);

      act(() => {
        useXPStore.getState().setLevel(5);
      });

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('should not call callback after unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToXPChanges(callback);

      unsubscribe();

      act(() => {
        useXPStore.getState().addXP(100);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large XP values', () => {
      const { addXP } = useXPStore.getState();

      act(() => {
        addXP(1000000);
      });

      expect(useXPStore.getState().currentXP).toBe(1000000);
    });

    it('should handle rapid successive XP additions', () => {
      const { addXP } = useXPStore.getState();

      act(() => {
        for (let i = 0; i < 100; i++) {
          addXP(10);
        }
      });

      expect(useXPStore.getState().currentXP).toBe(1000);
    });

    it('should handle many animals without issue', () => {
      const { addAnimals } = useXPStore.getState();
      const manyAnimals = Array.from({ length: 50 }, (_, i) => `animal_${i}`);

      act(() => {
        addAnimals(manyAnimals);
      });

      expect(useXPStore.getState().unlockedAnimals).toHaveLength(50);
    });
  });
});
