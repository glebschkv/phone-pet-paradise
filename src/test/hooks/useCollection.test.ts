import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCollection } from '@/hooks/useCollection';
import { useCollectionStore, useShopStore } from '@/stores';

// Mock the dependencies - useXPSystem now handles both local and backend sync internally
vi.mock('@/hooks/useXPSystem', () => ({
  useXPSystem: () => ({
    currentLevel: 1,
    unlockedAnimals: ['Dewdrop Frog'],
    currentBiome: 'forest',
    availableBiomes: ['forest'],
    isLoading: false,
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  collectionLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock AnimalDatabase
vi.mock('@/data/AnimalDatabase', () => ({
  ANIMAL_DATABASE: [
    {
      id: 'dewdrop-frog',
      name: 'Dewdrop Frog',
      rarity: 'common',
      biome: 'forest',
      unlockLevel: 1,
      isExclusive: false,
      spriteConfig: { idle: 'sprite.png' },
    },
    {
      id: 'moss-turtle',
      name: 'Moss Turtle',
      rarity: 'common',
      biome: 'forest',
      unlockLevel: 2,
      isExclusive: false,
      spriteConfig: { idle: 'sprite.png' },
    },
    {
      id: 'golden-phoenix',
      name: 'Golden Phoenix',
      rarity: 'legendary',
      biome: 'volcano',
      unlockLevel: 99,
      isExclusive: true,
      coinPrice: 5000,
      spriteConfig: { idle: 'sprite.png' },
    },
    {
      id: 'crystal-dragon',
      name: 'Crystal Dragon',
      rarity: 'epic',
      biome: 'mountain',
      unlockLevel: 20,
      isExclusive: false,
      spriteConfig: { idle: 'sprite.png' },
    },
  ],
  getAnimalById: vi.fn((id: string) => {
    const animals = [
      { id: 'dewdrop-frog', name: 'Dewdrop Frog', rarity: 'common', biome: 'forest', unlockLevel: 1, isExclusive: false, spriteConfig: { idle: 'sprite.png' } },
      { id: 'moss-turtle', name: 'Moss Turtle', rarity: 'common', biome: 'forest', unlockLevel: 2, isExclusive: false, spriteConfig: { idle: 'sprite.png' } },
      { id: 'golden-phoenix', name: 'Golden Phoenix', rarity: 'legendary', biome: 'volcano', unlockLevel: 99, isExclusive: true, coinPrice: 5000, spriteConfig: { idle: 'sprite.png' } },
      { id: 'crystal-dragon', name: 'Crystal Dragon', rarity: 'epic', biome: 'mountain', unlockLevel: 20, isExclusive: false, spriteConfig: { idle: 'sprite.png' } },
    ];
    return animals.find(a => a.id === id);
  }),
  getUnlockedAnimals: vi.fn((level: number) => {
    const animals = [
      { id: 'dewdrop-frog', name: 'Dewdrop Frog', rarity: 'common', biome: 'forest', unlockLevel: 1, isExclusive: false },
      { id: 'moss-turtle', name: 'Moss Turtle', rarity: 'common', biome: 'forest', unlockLevel: 2, isExclusive: false },
      { id: 'crystal-dragon', name: 'Crystal Dragon', rarity: 'epic', biome: 'mountain', unlockLevel: 20, isExclusive: false },
    ];
    return animals.filter(a => a.unlockLevel <= level);
  }),
  getAnimalsByBiome: vi.fn((biome: string) => {
    const animals = [
      { id: 'dewdrop-frog', name: 'Dewdrop Frog', rarity: 'common', biome: 'forest', unlockLevel: 1 },
      { id: 'moss-turtle', name: 'Moss Turtle', rarity: 'common', biome: 'forest', unlockLevel: 2 },
    ];
    return animals.filter(a => a.biome === biome);
  }),
  getXPUnlockableAnimals: vi.fn(() => [
    { id: 'dewdrop-frog', name: 'Dewdrop Frog', rarity: 'common' },
    { id: 'moss-turtle', name: 'Moss Turtle', rarity: 'common' },
    { id: 'crystal-dragon', name: 'Crystal Dragon', rarity: 'epic' },
  ]),
}));

describe('useCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset Zustand stores to known state
    useCollectionStore.setState({
      activeHomePets: [],
      favorites: [],
    });
    useShopStore.setState({
      ownedCharacters: [],
      ownedBackgrounds: [],
      equippedBackground: null,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should return all animals from database', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.allAnimals).toBeDefined();
      expect(result.current.allAnimals.length).toBeGreaterThan(0);
    });

    it('should load favorites from store', async () => {
      // Set up store state
      useCollectionStore.setState({ favorites: ['dewdrop-frog'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.favorites.has('dewdrop-frog')).toBe(true);
      });
    });

    it('should load active home pets from store', async () => {
      // Set up store state
      useCollectionStore.setState({ activeHomePets: ['moss-turtle'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.activeHomePets.has('moss-turtle')).toBe(true);
      });
    });

    it('should have empty active pets when nothing in store', async () => {
      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        // Store is reset to empty in beforeEach
        expect(result.current.activeHomePets.size).toBe(0);
      });
    });

    it('should handle empty store gracefully', () => {
      // Store is already reset to empty in beforeEach
      const { result } = renderHook(() => useCollection());

      expect(result.current.favorites.size).toBe(0);
    });
  });

  describe('toggleFavorite', () => {
    it('should add animal to favorites', async () => {
      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.favorites.size).toBe(0);
      });

      act(() => {
        result.current.toggleFavorite('dewdrop-frog');
      });

      await waitFor(() => {
        expect(result.current.favorites.has('dewdrop-frog')).toBe(true);
      });
    });

    it('should remove animal from favorites', async () => {
      // Set up store state with a favorite
      useCollectionStore.setState({ favorites: ['dewdrop-frog'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.favorites.has('dewdrop-frog')).toBe(true);
      });

      act(() => {
        result.current.toggleFavorite('dewdrop-frog');
      });

      await waitFor(() => {
        expect(result.current.favorites.has('dewdrop-frog')).toBe(false);
      });
    });

    it('should persist favorites to store', async () => {
      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.toggleFavorite('moss-turtle');
      });

      await waitFor(() => {
        // Check the Zustand store state
        const storeState = useCollectionStore.getState();
        expect(storeState.favorites).toContain('moss-turtle');
      });
    });
  });

  describe('toggleHomeActive', () => {
    it('should add animal to active home pets', async () => {
      // Store is already reset to empty in beforeEach

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.activeHomePets.size).toBe(0);
      });

      act(() => {
        result.current.toggleHomeActive('dewdrop-frog');
      });

      await waitFor(() => {
        expect(result.current.activeHomePets.has('dewdrop-frog')).toBe(true);
      });
    });

    it('should remove animal from active home pets', async () => {
      // Set up store state
      useCollectionStore.setState({ activeHomePets: ['dewdrop-frog'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.activeHomePets.has('dewdrop-frog')).toBe(true);
      });

      act(() => {
        result.current.toggleHomeActive('dewdrop-frog');
      });

      await waitFor(() => {
        expect(result.current.activeHomePets.has('dewdrop-frog')).toBe(false);
      });
    });

    it('should update store when home pets change', async () => {
      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.toggleHomeActive('moss-turtle');
      });

      await waitFor(() => {
        // Verify store was updated
        const storeState = useCollectionStore.getState();
        expect(storeState.activeHomePets).toContain('moss-turtle');
      });
    });
  });

  describe('isAnimalUnlocked', () => {
    it('should return true for level-unlocked animals', () => {
      const { result } = renderHook(() => useCollection());

      // Level 1 animal should be unlocked
      expect(result.current.isAnimalUnlocked('dewdrop-frog')).toBe(true);
    });

    it('should return false for high-level animals', () => {
      const { result } = renderHook(() => useCollection());

      // Level 20 animal should not be unlocked at level 1
      expect(result.current.isAnimalUnlocked('crystal-dragon')).toBe(false);
    });

    it('should return true for purchased shop animals', async () => {
      // Set up shop store with owned character
      useShopStore.setState({ ownedCharacters: ['golden-phoenix'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.isAnimalUnlocked('golden-phoenix')).toBe(true);
      });
    });

    it('should return false for non-existent animals', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.isAnimalUnlocked('non-existent')).toBe(false);
    });
  });

  describe('isAnimalFavorite', () => {
    it('should return true for favorited animals', async () => {
      // Set up store with favorite
      useCollectionStore.setState({ favorites: ['dewdrop-frog'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.isAnimalFavorite('dewdrop-frog')).toBe(true);
      });
    });

    it('should return false for non-favorited animals', () => {
      // Store is reset to empty in beforeEach
      const { result } = renderHook(() => useCollection());

      expect(result.current.isAnimalFavorite('moss-turtle')).toBe(false);
    });
  });

  describe('isAnimalHomeActive', () => {
    it('should return true for active home pets', async () => {
      // Set up store with active pet
      useCollectionStore.setState({ activeHomePets: ['moss-turtle'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.isAnimalHomeActive('moss-turtle')).toBe(true);
      });
    });

    it('should return false for non-active pets', async () => {
      // Set up store with a different pet
      useCollectionStore.setState({ activeHomePets: ['dewdrop-frog'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.isAnimalHomeActive('moss-turtle')).toBe(false);
      });
    });
  });

  describe('isShopExclusive', () => {
    it('should return true for shop-exclusive animals', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.isShopExclusive('golden-phoenix')).toBe(true);
    });

    it('should return false for non-exclusive animals', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.isShopExclusive('dewdrop-frog')).toBe(false);
    });
  });

  describe('getAnimalData', () => {
    it('should return animal data by id', () => {
      const { result } = renderHook(() => useCollection());

      const animal = result.current.getAnimalData('dewdrop-frog');
      expect(animal).toBeDefined();
      expect(animal?.name).toBe('Dewdrop Frog');
    });

    it('should return undefined for non-existent animal', () => {
      const { result } = renderHook(() => useCollection());

      const animal = result.current.getAnimalData('non-existent');
      expect(animal).toBeUndefined();
    });
  });

  describe('getActiveHomePetsData', () => {
    it('should return only unlocked active pets', async () => {
      // Set up store with mixed pets (one unlocked, one locked by level)
      useCollectionStore.setState({ activeHomePets: ['dewdrop-frog', 'crystal-dragon'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        const activePets = result.current.getActiveHomePetsData();
        // Only dewdrop-frog should be included (crystal-dragon is level 20)
        expect(activePets.length).toBe(1);
        expect(activePets[0].id).toBe('dewdrop-frog');
      });
    });

    it('should include purchased shop animals', async () => {
      // Set up both stores
      useCollectionStore.setState({ activeHomePets: ['golden-phoenix'] });
      useShopStore.setState({ ownedCharacters: ['golden-phoenix'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        const activePets = result.current.getActiveHomePetsData();
        expect(activePets.some(p => p.id === 'golden-phoenix')).toBe(true);
      });
    });
  });

  describe('filterAnimals', () => {
    it('should filter by search query', () => {
      const { result } = renderHook(() => useCollection());

      const filtered = result.current.filterAnimals('frog');
      expect(filtered.some(a => a.name.toLowerCase().includes('frog'))).toBe(true);
    });

    it('should filter by rarity', () => {
      const { result } = renderHook(() => useCollection());

      const filtered = result.current.filterAnimals('', 'common');
      filtered.forEach(animal => {
        expect(animal.rarity).toBe('common');
      });
    });

    it('should filter by biome', () => {
      const { result } = renderHook(() => useCollection());

      const filtered = result.current.filterAnimals('', undefined, 'forest');
      filtered.forEach(animal => {
        expect(animal.biome).toBe('forest');
      });
    });

    it('should combine multiple filters', () => {
      const { result } = renderHook(() => useCollection());

      const filtered = result.current.filterAnimals('', 'common', 'forest');
      filtered.forEach(animal => {
        expect(animal.rarity).toBe('common');
        expect(animal.biome).toBe('forest');
      });
    });

    it('should return all when filters are "all"', () => {
      const { result } = renderHook(() => useCollection());

      const allAnimals = result.current.allAnimals.length;
      const filtered = result.current.filterAnimals('', 'all', 'all');
      expect(filtered.length).toBe(allAnimals);
    });
  });

  describe('stats', () => {
    it('should compute collection stats', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.stats).toBeDefined();
      expect(typeof result.current.stats.totalAnimals).toBe('number');
      expect(typeof result.current.stats.unlockedAnimals).toBe('number');
      expect(typeof result.current.stats.shopPetsTotal).toBe('number');
      expect(typeof result.current.stats.shopPetsOwned).toBe('number');
    });

    it('should track favorites count', async () => {
      // Set up store with favorites
      useCollectionStore.setState({ favorites: ['dewdrop-frog', 'moss-turtle'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.stats.favoritesCount).toBe(2);
      });
    });

    it('should track active home pets count', async () => {
      // Set up store with active pet
      useCollectionStore.setState({ activeHomePets: ['dewdrop-frog'] });

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.stats.activeHomePetsCount).toBe(1);
      });
    });

    it('should compute rarity stats', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.stats.rarityStats).toBeDefined();
      expect(result.current.stats.rarityStats.common).toBeDefined();
      expect(result.current.stats.rarityStats.rare).toBeDefined();
      expect(result.current.stats.rarityStats.epic).toBeDefined();
      expect(result.current.stats.rarityStats.legendary).toBeDefined();
    });
  });

  describe('shop store updates', () => {
    it('should reflect shop store changes', async () => {
      const { result } = renderHook(() => useCollection());

      // Initially not unlocked
      expect(result.current.isAnimalUnlocked('golden-phoenix')).toBe(false);

      // Update shop store
      act(() => {
        useShopStore.setState({ ownedCharacters: ['golden-phoenix'] });
      });

      await waitFor(() => {
        expect(result.current.isAnimalUnlocked('golden-phoenix')).toBe(true);
      });
    });
  });
});
