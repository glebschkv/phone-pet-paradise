import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shopLogger } from '@/lib/logger';

export interface ShopInventory {
  ownedCharacters: string[];
  ownedBackgrounds: string[];
  ownedBadges: string[];
  equippedBadge: string | null;
  equippedBackground: string | null;
}

interface ShopState extends ShopInventory {
  // Actions
  addOwnedCharacter: (characterId: string) => void;
  addOwnedBackground: (backgroundId: string) => void;
  addOwnedBadge: (badgeId: string) => void;
  addOwnedCharacters: (characterIds: string[]) => void;
  addOwnedBackgrounds: (backgroundIds: string[]) => void;
  setEquippedBadge: (badgeId: string | null) => void;
  setEquippedBackground: (backgroundId: string | null) => void;
  setInventory: (inventory: Partial<ShopInventory>) => void;
  resetShop: () => void;

  // Selectors
  isCharacterOwned: (characterId: string) => boolean;
  isBackgroundOwned: (backgroundId: string) => boolean;
  isBadgeOwned: (badgeId: string) => boolean;
}

const initialState: ShopInventory = {
  ownedCharacters: [],
  ownedBackgrounds: [],
  ownedBadges: [],
  equippedBadge: null,
  equippedBackground: null,
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

      addOwnedBadge: (badgeId) => {
        const { ownedBadges } = get();
        if (!ownedBadges.includes(badgeId)) {
          set({ ownedBadges: [...ownedBadges, badgeId] });
          shopLogger.debug('Badge added to inventory:', badgeId);
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

      setEquippedBadge: (badgeId) => {
        set({ equippedBadge: badgeId });
        shopLogger.debug('Badge equipped:', badgeId);
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
      isBadgeOwned: (badgeId) => get().ownedBadges.includes(badgeId),
    }),
    {
      name: 'petIsland_shopInventory',
      // Migrate from old localStorage format if it exists
      onRehydrateStorage: () => (state) => {
        if (state) {
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
