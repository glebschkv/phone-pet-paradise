import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCollection } from '@/hooks/useCollection';

// Mock the dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
  }),
}));

vi.mock('@/hooks/useBackendXPSystem', () => ({
  useBackendXPSystem: () => ({
    currentLevel: 1,
    unlockedAnimals: [],
    currentBiome: 'forest',
    availableBiomes: ['forest'],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useXPSystem', () => ({
  useXPSystem: () => ({
    currentLevel: 1,
    unlockedAnimals: ['Dewdrop Frog'],
    currentBiome: 'forest',
    availableBiomes: ['forest'],
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
  const FAVORITES_KEY = 'petparadise-favorites';
  const ACTIVE_PETS_KEY = 'petparadise-active-home-pets';
  const SHOP_INVENTORY_KEY = 'petIsland_shopInventory';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

    it('should load favorites from localStorage', async () => {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['dewdrop-frog']));

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.favorites.has('dewdrop-frog')).toBe(true);
      });
    });

    it('should load active home pets from localStorage', async () => {
      localStorage.setItem(ACTIVE_PETS_KEY, JSON.stringify(['moss-turtle']));

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.activeHomePets.has('moss-turtle')).toBe(true);
      });
    });

    it('should set default active pet if nothing saved', async () => {
      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.activeHomePets.has('dewdrop-frog')).toBe(true);
      });
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem(FAVORITES_KEY, 'invalid json');

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
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['dewdrop-frog']));

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

    it('should persist favorites to localStorage', async () => {
      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.toggleFavorite('moss-turtle');
      });

      await waitFor(() => {
        const saved = localStorage.getItem(FAVORITES_KEY);
        expect(saved).not.toBeNull();
        const parsed = JSON.parse(saved!);
        expect(parsed).toContain('moss-turtle');
      });
    });
  });

  describe('toggleHomeActive', () => {
    it('should add animal to active home pets', async () => {
      localStorage.setItem(ACTIVE_PETS_KEY, JSON.stringify([]));

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
      localStorage.setItem(ACTIVE_PETS_KEY, JSON.stringify(['dewdrop-frog']));

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

    it('should dispatch event when home pets change', async () => {
      const eventHandler = vi.fn();
      window.addEventListener('activeHomePetsChange', eventHandler);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.toggleHomeActive('moss-turtle');
      });

      await waitFor(() => {
        expect(eventHandler).toHaveBeenCalled();
      });

      window.removeEventListener('activeHomePetsChange', eventHandler);
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
      localStorage.setItem(SHOP_INVENTORY_KEY, JSON.stringify({
        ownedCharacters: ['golden-phoenix'],
      }));

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
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['dewdrop-frog']));

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.isAnimalFavorite('dewdrop-frog')).toBe(true);
      });
    });

    it('should return false for non-favorited animals', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.isAnimalFavorite('moss-turtle')).toBe(false);
    });
  });

  describe('isAnimalHomeActive', () => {
    it('should return true for active home pets', async () => {
      localStorage.setItem(ACTIVE_PETS_KEY, JSON.stringify(['moss-turtle']));

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.isAnimalHomeActive('moss-turtle')).toBe(true);
      });
    });

    it('should return false for non-active pets', async () => {
      localStorage.setItem(ACTIVE_PETS_KEY, JSON.stringify(['dewdrop-frog']));

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
      localStorage.setItem(ACTIVE_PETS_KEY, JSON.stringify(['dewdrop-frog', 'crystal-dragon']));

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        const activePets = result.current.getActiveHomePetsData();
        // Only dewdrop-frog should be included (crystal-dragon is level 20)
        expect(activePets.length).toBe(1);
        expect(activePets[0].id).toBe('dewdrop-frog');
      });
    });

    it('should include purchased shop animals', async () => {
      localStorage.setItem(ACTIVE_PETS_KEY, JSON.stringify(['golden-phoenix']));
      localStorage.setItem(SHOP_INVENTORY_KEY, JSON.stringify({
        ownedCharacters: ['golden-phoenix'],
      }));

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
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['dewdrop-frog', 'moss-turtle']));

      const { result } = renderHook(() => useCollection());

      await waitFor(() => {
        expect(result.current.stats.favoritesCount).toBe(2);
      });
    });

    it('should track active home pets count', async () => {
      localStorage.setItem(ACTIVE_PETS_KEY, JSON.stringify(['dewdrop-frog']));

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

  describe('shop update events', () => {
    it('should update when shop inventory changes', async () => {
      const { result } = renderHook(() => useCollection());

      act(() => {
        window.dispatchEvent(new CustomEvent('petIsland_shopUpdate', {
          detail: { ownedCharacters: ['golden-phoenix'] },
        }));
      });

      await waitFor(() => {
        expect(result.current.isAnimalUnlocked('golden-phoenix')).toBe(true);
      });
    });
  });
});
