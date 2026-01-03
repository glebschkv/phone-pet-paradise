import { useCallback, useMemo } from 'react';
import { AnimalData, getAnimalById, getUnlockedAnimals, getAnimalsByBiome, ANIMAL_DATABASE, getXPUnlockableAnimals } from '@/data/AnimalDatabase';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useCollectionStore, useShopStore } from '@/stores';

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

export const useCollection = (): UseCollectionReturn => {
  // Use the unified XP system - it handles local/backend sync internally
  const xpSystem = useXPSystem();
  const { currentLevel, unlockedAnimals, currentBiome, availableBiomes } = xpSystem;

  // Use Zustand stores instead of local state + events
  const favoritesArray = useCollectionStore((state) => state.favorites);
  const activeHomePetsArray = useCollectionStore((state) => state.activeHomePets);
  const storeToggleFavorite = useCollectionStore((state) => state.toggleFavorite);
  const storeToggleHomeActive = useCollectionStore((state) => state.toggleHomeActive);

  // Use shop store for owned characters
  const shopOwnedCharacters = useShopStore((state) => state.ownedCharacters);

  // Convert arrays to Sets for backwards compatibility
  const favorites = useMemo(() => new Set(favoritesArray), [favoritesArray]);
  const activeHomePets = useMemo(() => new Set(activeHomePetsArray), [activeHomePetsArray]);

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
    totalAnimals: xpUnlockableAnimals.length,
    unlockedAnimals: unlockedAnimalsData.filter(a => !a.isExclusive).length,
    shopPetsTotal: shopExclusiveAnimals.length,
    shopPetsOwned: ownedShopPets.length,
    totalBiomes: availableBiomes.length + (5 - availableBiomes.length),
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

  // Toggle favorite status - now uses Zustand store
  const toggleFavorite = useCallback((animalId: string) => {
    storeToggleFavorite(animalId);
  }, [storeToggleFavorite]);

  // Toggle home page display status - now uses Zustand store
  const toggleHomeActive = useCallback((animalId: string) => {
    storeToggleHomeActive(animalId);
  }, [storeToggleHomeActive]);

  // Helper functions
  const isAnimalUnlocked = useCallback((animalId: string): boolean => {
    const animal = getAnimalById(animalId);
    if (!animal) return false;

    // Check if unlocked by level
    if (animal.unlockLevel <= currentLevel) return true;

    // Check if purchased from shop (direct inventory check)
    if (shopOwnedCharacters.includes(animalId)) return true;

    // Check if purchased (in unlockedAnimals list but not by level)
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
    return Array.from(activeHomePets)
      .map(id => getAnimalById(id))
      .filter((animal): animal is AnimalData => {
        if (!animal || !animal.spriteConfig) return false;
        return animal.unlockLevel <= currentLevel ||
               shopOwnedCharacters.includes(animal.id) ||
               unlockedAnimals.includes(animal.name);
      });
  }, [activeHomePets, currentLevel, unlockedAnimals, shopOwnedCharacters]);

  // Filter animals based on search, rarity, and biome
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
