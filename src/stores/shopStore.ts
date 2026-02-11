/**
 * Shop Store
 *
 * Manages the user's shop inventory including owned characters, backgrounds,
 * badges, and currently equipped items. Uses Zustand with persistence to
 * localStorage for offline-first functionality.
 *
 * @module stores/shopStore
 *
 * @example
 * ```typescript
 * import { useShopStore, useOwnedCharacters } from '@/stores/shopStore';
 *
 * // In a component
 * const { addOwnedCharacter, isCharacterOwned } = useShopStore();
 *
 * // Or use selector hooks for optimized re-renders
 * const ownedCharacters = useOwnedCharacters();
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shopLogger } from '@/lib/logger';

/**
 * Represents the user's shop inventory
 */
export interface ShopInventory {
  ownedCharacters: string[];
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  purchasedStarterBundleIds: string[];
}

interface ShopState extends ShopInventory {
  // Actions
  addOwnedCharacter: (characterId: string) => void;
  addOwnedBackground: (backgroundId: string) => void;
  addOwnedCharacters: (characterIds: string[]) => void;
  addOwnedBackgrounds: (backgroundIds: string[]) => void;
  addPurchasedStarterBundleId: (productId: string) => void;
  setEquippedBackground: (backgroundId: string | null) => void;
  setInventory: (inventory: Partial<ShopInventory>) => void;
  resetShop: () => void;

  // Selectors
  isCharacterOwned: (characterId: string) => boolean;
  isBackgroundOwned: (backgroundId: string) => boolean;
}

const initialState: ShopInventory = {
  ownedCharacters: [],
  ownedBackgrounds: [],
  equippedBackground: null,
  purchasedStarterBundleIds: [],
};

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addOwnedCharacter: (characterId) => {
        const { ownedCharacters } = get();
        if (!ownedCharacters.includes(characterId)) {
          set({ ownedCharacters: [...ownedCharacters, characterId] });
          shopLogger.debug('Character added to inventory:', characterId);
        }
      },

      addOwnedBackground: (backgroundId) => {
        const { ownedBackgrounds } = get();
        if (!ownedBackgrounds.includes(backgroundId)) {
          set({ ownedBackgrounds: [...ownedBackgrounds, backgroundId] });
          shopLogger.debug('Background added to inventory:', backgroundId);
        }
      },

      addOwnedCharacters: (characterIds) => {
        const { ownedCharacters } = get();
        const newCharacters = characterIds.filter(id => !ownedCharacters.includes(id));
        if (newCharacters.length > 0) {
          set({ ownedCharacters: [...ownedCharacters, ...newCharacters] });
          shopLogger.debug('Characters added to inventory:', newCharacters);
        }
      },

      addOwnedBackgrounds: (backgroundIds) => {
        const { ownedBackgrounds } = get();
        const newBackgrounds = backgroundIds.filter(id => !ownedBackgrounds.includes(id));
        if (newBackgrounds.length > 0) {
          set({ ownedBackgrounds: [...ownedBackgrounds, ...newBackgrounds] });
          shopLogger.debug('Backgrounds added to inventory:', newBackgrounds);
        }
      },

      addPurchasedStarterBundleId: (productId) => {
        const { purchasedStarterBundleIds } = get();
        if (!purchasedStarterBundleIds.includes(productId)) {
          set({ purchasedStarterBundleIds: [...purchasedStarterBundleIds, productId] });
          shopLogger.debug('Starter bundle recorded as purchased:', productId);
        }
      },

      setEquippedBackground: (backgroundId) => {
        set({ equippedBackground: backgroundId });
        shopLogger.debug('Background equipped:', backgroundId);
      },

      setInventory: (inventory) => {
        set((state) => ({ ...state, ...inventory }));
        shopLogger.debug('Inventory updated:', inventory);
      },

      resetShop: () => {
        set(initialState);
        shopLogger.debug('Shop reset');
      },

      // Selectors
      isCharacterOwned: (characterId) => get().ownedCharacters.includes(characterId),
      isBackgroundOwned: (backgroundId) => get().ownedBackgrounds.includes(backgroundId),
    }),
    {
      name: 'petIsland_shopInventory',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Guard against corrupt localStorage where arrays became null/undefined
          if (!Array.isArray(state.ownedCharacters)) state.ownedCharacters = [];
          if (!Array.isArray(state.ownedBackgrounds)) state.ownedBackgrounds = [];
          if (!Array.isArray(state.purchasedStarterBundleIds)) state.purchasedStarterBundleIds = [];
          shopLogger.debug('Shop store rehydrated');
        }
      },
    }
  )
);

// Selector hooks for optimized re-renders
export const useOwnedCharacters = () => useShopStore((state) => state.ownedCharacters);
export const useOwnedBackgrounds = () => useShopStore((state) => state.ownedBackgrounds);
export const useEquippedBackground = () => useShopStore((state) => state.equippedBackground);
