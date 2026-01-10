import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock logger before importing store
vi.mock('@/lib/logger', () => ({
  collectionLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { useCollectionStore, useActiveHomePets, useFavorites } from '@/stores/collectionStore';

describe('collectionStore', () => {
  // Storage key: 'petparadise-collection'

  beforeEach(() => {
    localStorage.clear();
    // Reset store to initial state
    useCollectionStore.setState({
      activeHomePets: ['hare'],
      favorites: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default active home pet "hare"', () => {
      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toEqual(['hare']);
    });

    it('should initialize with empty favorites', () => {
      const state = useCollectionStore.getState();
      expect(state.favorites).toEqual([]);
    });

    it('should have all required actions available', () => {
      const state = useCollectionStore.getState();
      expect(typeof state.toggleHomeActive).toBe('function');
      expect(typeof state.toggleFavorite).toBe('function');
      expect(typeof state.setActiveHomePets).toBe('function');
      expect(typeof state.setFavorites).toBe('function');
      expect(typeof state.isPetHomeActive).toBe('function');
      expect(typeof state.isPetFavorite).toBe('function');
    });
  });

  describe('toggleHomeActive', () => {
    it('should add a pet to active home pets when not present', () => {
      const { toggleHomeActive } = useCollectionStore.getState();

      act(() => {
        toggleHomeActive('cat');
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toContain('cat');
      expect(state.activeHomePets).toContain('hare');
    });

    it('should remove a pet from active home pets when already present', () => {
      const { toggleHomeActive, setActiveHomePets } = useCollectionStore.getState();

      act(() => {
        setActiveHomePets(['hare', 'cat', 'dog']);
        toggleHomeActive('cat');
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).not.toContain('cat');
      expect(state.activeHomePets).toContain('hare');
      expect(state.activeHomePets).toContain('dog');
    });

    it('should handle toggling the default pet off', () => {
      const { toggleHomeActive } = useCollectionStore.getState();

      act(() => {
        toggleHomeActive('hare');
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).not.toContain('hare');
      expect(state.activeHomePets).toHaveLength(0);
    });

    it('should toggle multiple pets independently', () => {
      const { toggleHomeActive } = useCollectionStore.getState();

      act(() => {
        toggleHomeActive('cat');
        toggleHomeActive('dog');
        toggleHomeActive('bird');
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toContain('cat');
      expect(state.activeHomePets).toContain('dog');
      expect(state.activeHomePets).toContain('bird');
      expect(state.activeHomePets).toHaveLength(4); // hare + 3 new
    });

    it('should handle rapid toggle on same pet', () => {
      const { toggleHomeActive } = useCollectionStore.getState();

      act(() => {
        toggleHomeActive('cat');
        toggleHomeActive('cat');
        toggleHomeActive('cat');
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toContain('cat');
      expect(state.activeHomePets.filter(id => id === 'cat')).toHaveLength(1);
    });
  });

  describe('toggleFavorite', () => {
    it('should add a pet to favorites when not present', () => {
      const { toggleFavorite } = useCollectionStore.getState();

      act(() => {
        toggleFavorite('golden-cat');
      });

      const state = useCollectionStore.getState();
      expect(state.favorites).toContain('golden-cat');
    });

    it('should remove a pet from favorites when already present', () => {
      const { toggleFavorite, setFavorites } = useCollectionStore.getState();

      act(() => {
        setFavorites(['golden-cat', 'rainbow-dog', 'crystal-bird']);
        toggleFavorite('rainbow-dog');
      });

      const state = useCollectionStore.getState();
      expect(state.favorites).not.toContain('rainbow-dog');
      expect(state.favorites).toContain('golden-cat');
      expect(state.favorites).toContain('crystal-bird');
    });

    it('should handle empty favorites correctly', () => {
      const { toggleFavorite } = useCollectionStore.getState();

      act(() => {
        toggleFavorite('legendary-dragon');
      });

      const state = useCollectionStore.getState();
      expect(state.favorites).toEqual(['legendary-dragon']);
    });

    it('should support many favorites', () => {
      const { toggleFavorite } = useCollectionStore.getState();
      const petIds = Array.from({ length: 20 }, (_, i) => `pet-${i}`);

      act(() => {
        petIds.forEach(id => toggleFavorite(id));
      });

      const state = useCollectionStore.getState();
      expect(state.favorites).toHaveLength(20);
      petIds.forEach(id => {
        expect(state.favorites).toContain(id);
      });
    });
  });

  describe('setActiveHomePets', () => {
    it('should set active home pets to provided array', () => {
      const { setActiveHomePets } = useCollectionStore.getState();

      act(() => {
        setActiveHomePets(['cat', 'dog', 'bird']);
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toEqual(['cat', 'dog', 'bird']);
    });

    it('should replace all existing active pets', () => {
      const { setActiveHomePets } = useCollectionStore.getState();

      act(() => {
        setActiveHomePets(['cat', 'dog']);
        setActiveHomePets(['fish']);
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toEqual(['fish']);
    });

    it('should handle empty array', () => {
      const { setActiveHomePets } = useCollectionStore.getState();

      act(() => {
        setActiveHomePets([]);
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toEqual([]);
    });
  });

  describe('setFavorites', () => {
    it('should set favorites to provided array', () => {
      const { setFavorites } = useCollectionStore.getState();

      act(() => {
        setFavorites(['golden-cat', 'silver-dog']);
      });

      const state = useCollectionStore.getState();
      expect(state.favorites).toEqual(['golden-cat', 'silver-dog']);
    });

    it('should replace all existing favorites', () => {
      const { setFavorites } = useCollectionStore.getState();

      act(() => {
        setFavorites(['pet-1', 'pet-2', 'pet-3']);
        setFavorites(['pet-4']);
      });

      const state = useCollectionStore.getState();
      expect(state.favorites).toEqual(['pet-4']);
    });
  });

  describe('Selector Functions', () => {
    describe('isPetHomeActive', () => {
      it('should return true for active pets', () => {
        const { setActiveHomePets } = useCollectionStore.getState();

        act(() => {
          setActiveHomePets(['cat', 'dog', 'bird']);
        });

        const state = useCollectionStore.getState();
        expect(state.isPetHomeActive('cat')).toBe(true);
        expect(state.isPetHomeActive('dog')).toBe(true);
        expect(state.isPetHomeActive('bird')).toBe(true);
      });

      it('should return false for inactive pets', () => {
        const state = useCollectionStore.getState();
        expect(state.isPetHomeActive('dragon')).toBe(false);
        expect(state.isPetHomeActive('unicorn')).toBe(false);
      });

      it('should return true for default pet', () => {
        const state = useCollectionStore.getState();
        expect(state.isPetHomeActive('hare')).toBe(true);
      });
    });

    describe('isPetFavorite', () => {
      it('should return true for favorite pets', () => {
        const { setFavorites } = useCollectionStore.getState();

        act(() => {
          setFavorites(['golden-cat', 'silver-dog']);
        });

        const state = useCollectionStore.getState();
        expect(state.isPetFavorite('golden-cat')).toBe(true);
        expect(state.isPetFavorite('silver-dog')).toBe(true);
      });

      it('should return false for non-favorite pets', () => {
        const state = useCollectionStore.getState();
        expect(state.isPetFavorite('random-pet')).toBe(false);
      });
    });
  });

  describe('Selector Hooks', () => {
    it('useActiveHomePets should return active home pets', () => {
      const { setActiveHomePets } = useCollectionStore.getState();

      act(() => {
        setActiveHomePets(['cat', 'dog']);
      });

      const { result } = renderHook(() => useActiveHomePets());
      expect(result.current).toEqual(['cat', 'dog']);
    });

    it('useFavorites should return favorites', () => {
      const { setFavorites } = useCollectionStore.getState();

      act(() => {
        setFavorites(['golden-pet', 'silver-pet']);
      });

      const { result } = renderHook(() => useFavorites());
      expect(result.current).toEqual(['golden-pet', 'silver-pet']);
    });

    it('selector hooks should update when state changes', () => {
      const { result: activePetsResult } = renderHook(() => useActiveHomePets());
      const { result: favoritesResult } = renderHook(() => useFavorites());

      expect(activePetsResult.current).toEqual(['hare']);
      expect(favoritesResult.current).toEqual([]);

      act(() => {
        useCollectionStore.getState().toggleHomeActive('cat');
        useCollectionStore.getState().toggleFavorite('golden-cat');
      });

      expect(activePetsResult.current).toContain('cat');
      expect(favoritesResult.current).toContain('golden-cat');
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', async () => {
      const { toggleHomeActive, toggleFavorite } = useCollectionStore.getState();

      act(() => {
        toggleHomeActive('cat');
        toggleFavorite('golden-cat');
      });

      // Wait for persistence middleware to save
      await new Promise(resolve => setTimeout(resolve, 50));

      const saved = localStorage.getItem('petparadise-collection');
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.state.activeHomePets).toContain('cat');
      expect(parsed.state.favorites).toContain('golden-cat');
    });

    it('should restore state from localStorage on mount', async () => {
      // Pre-populate localStorage with valid persisted state
      const persistedState = {
        state: {
          activeHomePets: ['dragon', 'phoenix'],
          favorites: ['legendary-pet'],
        },
        version: 0,
      };
      localStorage.setItem('petparadise-collection', JSON.stringify(persistedState));

      // Reset and let Zustand rehydrate
      useCollectionStore.setState({
        activeHomePets: persistedState.state.activeHomePets,
        favorites: persistedState.state.favorites,
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toEqual(['dragon', 'phoenix']);
      expect(state.favorites).toEqual(['legendary-pet']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in pet IDs', () => {
      const { toggleHomeActive, toggleFavorite } = useCollectionStore.getState();
      const specialId = 'pet-with-special-chars-äöü-123';

      act(() => {
        toggleHomeActive(specialId);
        toggleFavorite(specialId);
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toContain(specialId);
      expect(state.favorites).toContain(specialId);
    });

    it('should handle very long pet IDs', () => {
      const { toggleHomeActive } = useCollectionStore.getState();
      const longId = 'a'.repeat(1000);

      act(() => {
        toggleHomeActive(longId);
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toContain(longId);
    });

    it('should handle empty string pet ID', () => {
      const { toggleHomeActive } = useCollectionStore.getState();

      act(() => {
        toggleHomeActive('');
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toContain('');
    });

    it('should maintain state consistency with concurrent operations', () => {
      const { toggleHomeActive, toggleFavorite, setActiveHomePets } = useCollectionStore.getState();

      act(() => {
        toggleHomeActive('pet-1');
        setActiveHomePets(['pet-2', 'pet-3']);
        toggleHomeActive('pet-4');
        toggleFavorite('fav-1');
        toggleFavorite('fav-2');
        toggleFavorite('fav-1'); // Remove
      });

      const state = useCollectionStore.getState();
      expect(state.activeHomePets).toEqual(['pet-2', 'pet-3', 'pet-4']);
      expect(state.favorites).toEqual(['fav-2']);
    });
  });
});
