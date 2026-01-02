import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collectionLogger } from '@/lib/logger';

interface CollectionState {
  // Active pets shown on home screen
  activeHomePets: string[];
  // Favorite pets
  favorites: string[];

  // Actions
  toggleHomeActive: (petId: string) => void;
  toggleFavorite: (petId: string) => void;
  setActiveHomePets: (petIds: string[]) => void;
  setFavorites: (petIds: string[]) => void;

  // Selectors
  isPetHomeActive: (petId: string) => boolean;
  isPetFavorite: (petId: string) => boolean;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      activeHomePets: ['hare'], // Default pet
      favorites: [],

      toggleHomeActive: (petId) => {
        const { activeHomePets } = get();
        const newPets = activeHomePets.includes(petId)
          ? activeHomePets.filter(id => id !== petId)
          : [...activeHomePets, petId];
        set({ activeHomePets: newPets });
        collectionLogger.debug('Active home pets updated:', newPets);
      },

      toggleFavorite: (petId) => {
        const { favorites } = get();
        const newFavorites = favorites.includes(petId)
          ? favorites.filter(id => id !== petId)
          : [...favorites, petId];
        set({ favorites: newFavorites });
        collectionLogger.debug('Favorites updated:', newFavorites);
      },

      setActiveHomePets: (petIds) => {
        set({ activeHomePets: petIds });
        collectionLogger.debug('Active home pets set:', petIds);
      },

      setFavorites: (petIds) => {
        set({ favorites: petIds });
        collectionLogger.debug('Favorites set:', petIds);
      },

      // Selectors
      isPetHomeActive: (petId) => get().activeHomePets.includes(petId),
      isPetFavorite: (petId) => get().favorites.includes(petId),
    }),
    {
      name: 'petparadise-collection',
      // Migrate from old localStorage keys
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Try to migrate from old storage keys if store is empty
          if (state.activeHomePets.length === 1 && state.activeHomePets[0] === 'hare') {
            try {
              const oldActivePets = localStorage.getItem('petparadise-active-home-pets');
              if (oldActivePets) {
                const parsed = JSON.parse(oldActivePets);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  state.activeHomePets = parsed;
                }
              }
            } catch {
              // Ignore migration errors
            }
          }

          if (state.favorites.length === 0) {
            try {
              const oldFavorites = localStorage.getItem('petparadise-favorites');
              if (oldFavorites) {
                const parsed = JSON.parse(oldFavorites);
                if (Array.isArray(parsed)) {
                  state.favorites = parsed;
                }
              }
            } catch {
              // Ignore migration errors
            }
          }

          collectionLogger.debug('Collection store rehydrated');
        }
      },
    }
  )
);

// Selector hooks for optimized re-renders
export const useActiveHomePets = () => useCollectionStore((state) => state.activeHomePets);
export const useFavorites = () => useCollectionStore((state) => state.favorites);
