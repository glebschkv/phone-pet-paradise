import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimalData, getAnimalById, getUnlockedAnimals, getAnimalsByBiome, ANIMAL_DATABASE, getXPUnlockableAnimals } from '@/data/AnimalDatabase';
import { useBackendXPSystem } from '@/hooks/useBackendXPSystem';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useAuth } from '@/hooks/useAuth';

const SHOP_INVENTORY_KEY = 'petIsland_shopInventory';

interface CollectionStats {
  totalAnimals: number;
  unlockedAnimals: number;
  shopPetsTotal: number;
  shopPetsOwned: number;
  totalBiomes: number;
  unlockedBiomes: number;
  favoritesCount: number;
  activeHomePetsCount: number;
  rarityStats: Record<string, { total: number; unlocked: number }>;
}

interface UseCollectionReturn {
  // Data
  allAnimals: AnimalData[];
  unlockedAnimalsData: AnimalData[];
  currentBiomeAnimals: AnimalData[];
  favorites: Set<string>;
  activeHomePets: Set<string>;
  stats: CollectionStats;

  // Actions
  toggleFavorite: (animalId: string) => void;
  toggleHomeActive: (animalId: string) => void;
  isAnimalUnlocked: (animalId: string) => boolean;
  isAnimalFavorite: (animalId: string) => boolean;
  isAnimalHomeActive: (animalId: string) => boolean;
  isShopExclusive: (animalId: string) => boolean;
  getAnimalData: (animalId: string) => AnimalData | undefined;
  getActiveHomePetsData: () => AnimalData[];

  // Filtering
  filterAnimals: (searchQuery: string, rarity?: string, biome?: string) => AnimalData[];
}

const FAVORITES_STORAGE_KEY = 'petparadise-favorites';
const ACTIVE_HOME_PETS_KEY = 'petparadise-active-home-pets';

export const useCollection = (): UseCollectionReturn => {
  // Get both XP systems
  const { isAuthenticated } = useAuth();
  const backendXPSystem = useBackendXPSystem();
  const localXPSystem = useXPSystem();

  // Use the HIGHER level between local and backend to prevent progress appearing to regress
  // This handles cases where local and backend are out of sync
  const backendLevel = backendXPSystem.currentLevel;
  const localLevel = localXPSystem.currentLevel;
  const currentLevel = Math.max(backendLevel, localLevel);

  // For other properties, prefer backend when authenticated and loaded, otherwise local
  const backendIsLoading = 'isLoading' in backendXPSystem && backendXPSystem.isLoading;
  const xpSystem = (isAuthenticated && !backendIsLoading) ? backendXPSystem : localXPSystem;
  const { unlockedAnimals, currentBiome, availableBiomes } = xpSystem;

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeHomePets, setActiveHomePets] = useState<Set<string>>(new Set());

  // Track shop-purchased characters directly from shop inventory
  // This ensures purchased pets show as owned regardless of XP system state
  const [shopOwnedCharacters, setShopOwnedCharacters] = useState<string[]>([]);

  // Load shop inventory from localStorage and listen for updates
  useEffect(() => {
    const loadShopInventory = () => {
      const savedData = localStorage.getItem(SHOP_INVENTORY_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setShopOwnedCharacters(parsed.ownedCharacters || []);
        } catch (error) {
          console.error('Failed to load shop inventory:', error);
        }
      }
    };

    // Load initial data
    loadShopInventory();

    // Listen for shop updates
    const handleShopUpdate = (event: CustomEvent) => {
      if (event.detail?.ownedCharacters) {
        setShopOwnedCharacters(event.detail.ownedCharacters);
      }
    };

    window.addEventListener('petIsland_shopUpdate', handleShopUpdate as EventListener);

    return () => {
      window.removeEventListener('petIsland_shopUpdate', handleShopUpdate as EventListener);
    };
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (savedFavorites) {
      try {
        const favoritesArray = JSON.parse(savedFavorites);
        setFavorites(new Set(favoritesArray));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // Load active home pets from localStorage
  useEffect(() => {
    const savedActivePets = localStorage.getItem(ACTIVE_HOME_PETS_KEY);
    if (savedActivePets) {
      try {
        const activePetsArray = JSON.parse(savedActivePets);
        setActiveHomePets(new Set(activePetsArray));
      } catch (error) {
        console.error('Failed to load active home pets:', error);
      }
    } else {
      // Default: show first unlocked pet (dewdrop-frog) if nothing saved
      setActiveHomePets(new Set(['dewdrop-frog']));
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }, []);

  // Save active home pets to localStorage
  const saveActiveHomePets = useCallback((newActivePets: Set<string>) => {
    try {
      const petsArray = Array.from(newActivePets);
      localStorage.setItem(ACTIVE_HOME_PETS_KEY, JSON.stringify(petsArray));
      // Dispatch event so home page can react immediately
      window.dispatchEvent(new CustomEvent('activeHomePetsChange', { detail: petsArray }));
    } catch (error) {
      console.error('Failed to save active home pets:', error);
    }
  }, []);

  // Get unlocked animals data (level-based + purchased coin-exclusive)
  const unlockedAnimalsData = useMemo(() => {
    const levelUnlocked = getUnlockedAnimals(currentLevel);

    // Also include any coin-exclusive animals that are:
    // 1. In the unlockedAnimals list from XP system, OR
    // 2. In the shopOwnedCharacters from shop inventory (direct source of truth for purchases)
    const purchasedAnimals = ANIMAL_DATABASE.filter(animal =>
      animal.isExclusive &&
      (unlockedAnimals.includes(animal.name) || shopOwnedCharacters.includes(animal.id)) &&
      !levelUnlocked.some(a => a.id === animal.id)
    );

    return [...levelUnlocked, ...purchasedAnimals];
  }, [currentLevel, unlockedAnimals, shopOwnedCharacters]);

  // Get animals for current biome
  const currentBiomeAnimals = getAnimalsByBiome(currentBiome);

  // Calculate collection statistics (only count XP-unlockable animals for progression)
  const xpUnlockableAnimals = getXPUnlockableAnimals();
  const shopExclusiveAnimals = ANIMAL_DATABASE.filter(a => a.isExclusive && a.coinPrice);
  // Check both XP system and shop inventory for owned shop pets
  const ownedShopPets = shopExclusiveAnimals.filter(a =>
    unlockedAnimals.includes(a.name) || shopOwnedCharacters.includes(a.id)
  );

  const stats: CollectionStats = {
    totalAnimals: xpUnlockableAnimals.length, // Only XP-unlockable for main progression
    unlockedAnimals: unlockedAnimalsData.filter(a => !a.isExclusive).length,
    shopPetsTotal: shopExclusiveAnimals.length,
    shopPetsOwned: ownedShopPets.length,
    totalBiomes: availableBiomes.length + (5 - availableBiomes.length), // Total possible biomes
    unlockedBiomes: availableBiomes.length,
    favoritesCount: favorites.size,
    activeHomePetsCount: activeHomePets.size,
    rarityStats: {
      common: {
        total: xpUnlockableAnimals.filter(a => a.rarity === 'common').length,
        unlocked: unlockedAnimalsData.filter(a => a.rarity === 'common' && !a.isExclusive).length
      },
      rare: {
        total: xpUnlockableAnimals.filter(a => a.rarity === 'rare').length,
        unlocked: unlockedAnimalsData.filter(a => a.rarity === 'rare' && !a.isExclusive).length
      },
      epic: {
        total: xpUnlockableAnimals.filter(a => a.rarity === 'epic').length,
        unlocked: unlockedAnimalsData.filter(a => a.rarity === 'epic' && !a.isExclusive).length
      },
      legendary: {
        total: xpUnlockableAnimals.filter(a => a.rarity === 'legendary').length,
        unlocked: unlockedAnimalsData.filter(a => a.rarity === 'legendary' && !a.isExclusive).length
      }
    }
  };

  // Toggle favorite status
  const toggleFavorite = useCallback((animalId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(animalId)) {
        newFavorites.delete(animalId);
      } else {
        newFavorites.add(animalId);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // Toggle home page display status
  const toggleHomeActive = useCallback((animalId: string) => {
    setActiveHomePets(prev => {
      const newActivePets = new Set(prev);
      if (newActivePets.has(animalId)) {
        newActivePets.delete(animalId);
      } else {
        newActivePets.add(animalId);
      }
      saveActiveHomePets(newActivePets);
      return newActivePets;
    });
  }, [saveActiveHomePets]);

  // Helper functions
  const isAnimalUnlocked = useCallback((animalId: string): boolean => {
    const animal = getAnimalById(animalId);
    if (!animal) return false;

    // Check if unlocked by level
    if (animal.unlockLevel <= currentLevel) return true;

    // Check if purchased from shop (direct inventory check)
    if (shopOwnedCharacters.includes(animalId)) return true;

    // Check if purchased (in unlockedAnimals list but not by level)
    // This handles coin-exclusive animals that were purchased from the shop
    if (unlockedAnimals.includes(animal.name)) return true;

    return false;
  }, [currentLevel, unlockedAnimals, shopOwnedCharacters]);

  const isAnimalFavorite = useCallback((animalId: string): boolean => {
    return favorites.has(animalId);
  }, [favorites]);

  const isAnimalHomeActive = useCallback((animalId: string): boolean => {
    return activeHomePets.has(animalId);
  }, [activeHomePets]);

  const getAnimalData = useCallback((animalId: string): AnimalData | undefined => {
    return getAnimalById(animalId);
  }, []);

  // Get active home pets data (animals shown on home page)
  const getActiveHomePetsData = useCallback((): AnimalData[] => {
    // Only include unlocked pets that are active
    return Array.from(activeHomePets)
      .map(id => getAnimalById(id))
      .filter((animal): animal is AnimalData => {
        if (!animal || !animal.spriteConfig) return false;
        // Check level-based unlock OR purchased from shop OR in unlockedAnimals list
        return animal.unlockLevel <= currentLevel ||
               shopOwnedCharacters.includes(animal.id) ||
               unlockedAnimals.includes(animal.name);
      });
  }, [activeHomePets, currentLevel, unlockedAnimals, shopOwnedCharacters]);

  // Filter animals based on search, rarity, and biome
  // Shows all animals including shop-exclusive ones
  const filterAnimals = useCallback((searchQuery: string, rarity?: string, biome?: string): AnimalData[] => {
    return ANIMAL_DATABASE.filter(animal => {
      const matchesSearch = animal.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = !rarity || rarity === 'all' || animal.rarity === rarity;
      const matchesBiome = !biome || biome === 'all' || animal.biome === biome;

      return matchesSearch && matchesRarity && matchesBiome;
    });
  }, []);

  // Check if an animal is shop-exclusive (purchasable only, not level-based)
  const isShopExclusive = useCallback((animalId: string): boolean => {
    const animal = getAnimalById(animalId);
    return animal?.isExclusive === true && animal?.coinPrice !== undefined;
  }, []);

  return {
    allAnimals: ANIMAL_DATABASE,
    unlockedAnimalsData,
    currentBiomeAnimals,
    favorites,
    activeHomePets,
    stats,
    toggleFavorite,
    toggleHomeActive,
    isAnimalUnlocked,
    isAnimalFavorite,
    isAnimalHomeActive,
    isShopExclusive,
    getAnimalData,
    getActiveHomePetsData,
    filterAnimals
  };
};