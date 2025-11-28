import { useState, useEffect, useCallback } from 'react';
import { AnimalData, getAnimalById, getUnlockedAnimals, getUnlockedBiomes, getAnimalsByBiome, ANIMAL_DATABASE } from '@/data/AnimalDatabase';
import { useBackendXPSystem } from '@/hooks/useBackendXPSystem';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useAuth } from '@/hooks/useAuth';

interface CollectionStats {
  totalAnimals: number;
  unlockedAnimals: number;
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
  getAnimalData: (animalId: string) => AnimalData | undefined;
  getActiveHomePetsData: () => AnimalData[];

  // Filtering
  filterAnimals: (searchQuery: string, rarity?: string, biome?: string) => AnimalData[];
}

const FAVORITES_STORAGE_KEY = 'petparadise-favorites';
const ACTIVE_HOME_PETS_KEY = 'petparadise-active-home-pets';

export const useCollection = (): UseCollectionReturn => {
  // Use the correct XP system based on authentication status
  const { isAuthenticated } = useAuth();
  const backendXPSystem = useBackendXPSystem();
  const localXPSystem = useXPSystem();

  // Select the appropriate XP system
  const xpSystem = isAuthenticated ? backendXPSystem : localXPSystem;
  const { currentLevel, unlockedAnimals, currentBiome, availableBiomes } = xpSystem;

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeHomePets, setActiveHomePets] = useState<Set<string>>(new Set());

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
      // Default: show first unlocked pet (hare) if nothing saved
      setActiveHomePets(new Set(['hare']));
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

  // Get unlocked animals data
  const unlockedAnimalsData = getUnlockedAnimals(currentLevel);
  
  // Get animals for current biome
  const currentBiomeAnimals = getAnimalsByBiome(currentBiome);

  // Calculate collection statistics
  const stats: CollectionStats = {
    totalAnimals: ANIMAL_DATABASE.length,
    unlockedAnimals: unlockedAnimalsData.length,
    totalBiomes: availableBiomes.length + (5 - availableBiomes.length), // Total possible biomes
    unlockedBiomes: availableBiomes.length,
    favoritesCount: favorites.size,
    activeHomePetsCount: activeHomePets.size,
    rarityStats: {
      common: {
        total: ANIMAL_DATABASE.filter(a => a.rarity === 'common').length,
        unlocked: unlockedAnimalsData.filter(a => a.rarity === 'common').length
      },
      rare: {
        total: ANIMAL_DATABASE.filter(a => a.rarity === 'rare').length,
        unlocked: unlockedAnimalsData.filter(a => a.rarity === 'rare').length
      },
      epic: {
        total: ANIMAL_DATABASE.filter(a => a.rarity === 'epic').length,
        unlocked: unlockedAnimalsData.filter(a => a.rarity === 'epic').length
      },
      legendary: {
        total: ANIMAL_DATABASE.filter(a => a.rarity === 'legendary').length,
        unlocked: unlockedAnimalsData.filter(a => a.rarity === 'legendary').length
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
    return animal ? animal.unlockLevel <= currentLevel : false;
  }, [currentLevel]);

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
      .filter((animal): animal is AnimalData =>
        animal !== undefined && animal.unlockLevel <= currentLevel && animal.spriteConfig !== undefined
      );
  }, [activeHomePets, currentLevel]);

  // Filter animals based on search, rarity, and biome
  const filterAnimals = useCallback((searchQuery: string, rarity?: string, biome?: string): AnimalData[] => {
    return ANIMAL_DATABASE.filter(animal => {
      const matchesSearch = animal.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = !rarity || rarity === 'all' || animal.rarity === rarity;
      const matchesBiome = !biome || biome === 'all' || animal.biome === biome;
      
      return matchesSearch && matchesRarity && matchesBiome;
    });
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
    getAnimalData,
    getActiveHomePetsData,
    filterAnimals
  };
};