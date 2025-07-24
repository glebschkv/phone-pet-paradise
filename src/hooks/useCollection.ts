import { useState, useEffect, useCallback } from 'react';
import { AnimalData, getAnimalById, getUnlockedAnimals, getUnlockedBiomes, getAnimalsByBiome, ANIMAL_DATABASE } from '@/data/AnimalDatabase';
import { useAppStateTracking } from '@/hooks/useAppStateTracking';

interface CollectionStats {
  totalAnimals: number;
  unlockedAnimals: number;
  totalBiomes: number;
  unlockedBiomes: number;
  favoritesCount: number;
  rarityStats: Record<string, { total: number; unlocked: number }>;
}

interface UseCollectionReturn {
  // Data
  allAnimals: AnimalData[];
  unlockedAnimalsData: AnimalData[];
  currentBiomeAnimals: AnimalData[];
  favorites: Set<string>;
  stats: CollectionStats;
  
  // Actions
  toggleFavorite: (animalId: string) => void;
  isAnimalUnlocked: (animalId: string) => boolean;
  isAnimalFavorite: (animalId: string) => boolean;
  getAnimalData: (animalId: string) => AnimalData | undefined;
  
  // Filtering
  filterAnimals: (searchQuery: string, rarity?: string, biome?: string) => AnimalData[];
}

const FAVORITES_STORAGE_KEY = 'petparadise-favorites';

export const useCollection = (): UseCollectionReturn => {
  const { currentLevel, unlockedAnimals, currentBiome, availableBiomes } = useAppStateTracking();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Failed to save favorites:', error);
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

  // Helper functions
  const isAnimalUnlocked = useCallback((animalId: string): boolean => {
    const animal = getAnimalById(animalId);
    return animal ? animal.unlockLevel <= currentLevel : false;
  }, [currentLevel]);

  const isAnimalFavorite = useCallback((animalId: string): boolean => {
    return favorites.has(animalId);
  }, [favorites]);

  const getAnimalData = useCallback((animalId: string): AnimalData | undefined => {
    return getAnimalById(animalId);
  }, []);

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
    stats,
    toggleFavorite,
    isAnimalUnlocked,
    isAnimalFavorite,
    getAnimalData,
    filterAnimals
  };
};