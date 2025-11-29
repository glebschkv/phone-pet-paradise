import { useState, useEffect, useCallback } from 'react';
import { useCoinSystem } from './useCoinSystem';
import { useCoinBooster } from './useCoinBooster';
import { useStreakSystem } from './useStreakSystem';
import {
  ShopItem,
  ShopCategory,
  PREMIUM_BACKGROUNDS,
  PROFILE_BADGES,
  UTILITY_ITEMS,
  BACKGROUND_BUNDLES,
  BackgroundBundle,
} from '@/data/ShopData';
import { getAnimalById, AnimalData } from '@/data/AnimalDatabase';

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: ShopItem | AnimalData;
}

export interface ShopInventory {
  ownedCharacters: string[];
  ownedBackgrounds: string[];
  ownedBadges: string[];
  equippedBadge: string | null;
  equippedBackground: string | null;
}

const STORAGE_KEY = 'petIsland_shopInventory';
const SHOP_UPDATE_EVENT = 'petIsland_shopUpdate';

export const useShop = () => {
  const coinSystem = useCoinSystem();
  const boosterSystem = useCoinBooster();
  const streakSystem = useStreakSystem();

  const [inventory, setInventory] = useState<ShopInventory>({
    ownedCharacters: [],
    ownedBackgrounds: [],
    ownedBadges: [],
    equippedBadge: null,
    equippedBackground: null,
  });

  // Load inventory from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setInventory({
          ownedCharacters: parsed.ownedCharacters || [],
          ownedBackgrounds: parsed.ownedBackgrounds || [],
          ownedBadges: parsed.ownedBadges || [],
          equippedBadge: parsed.equippedBadge || null,
          equippedBackground: parsed.equippedBackground || null,
        });
      } catch (error) {
        console.error('Failed to load shop inventory:', error);
      }
    }
  }, []);

  // Listen for updates from other components
  useEffect(() => {
    const handleShopUpdate = (event: CustomEvent<ShopInventory>) => {
      setInventory(event.detail);
    };

    window.addEventListener(SHOP_UPDATE_EVENT, handleShopUpdate as EventListener);

    return () => {
      window.removeEventListener(SHOP_UPDATE_EVENT, handleShopUpdate as EventListener);
    };
  }, []);

  // Save inventory
  const saveInventory = useCallback((newInventory: ShopInventory) => {
    setInventory(newInventory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newInventory));
    window.dispatchEvent(new CustomEvent(SHOP_UPDATE_EVENT, { detail: newInventory }));
  }, []);

  // Check if item is owned
  const isOwned = useCallback((itemId: string, category: ShopCategory): boolean => {
    switch (category) {
      case 'pets':
        return inventory.ownedCharacters.includes(itemId);
      case 'customize':
        // Check both backgrounds and badges
        return inventory.ownedBackgrounds.includes(itemId) || inventory.ownedBadges.includes(itemId);
      default:
        return false;
    }
  }, [inventory]);

  // Purchase a character
  const purchaseCharacter = useCallback((characterId: string): PurchaseResult => {
    const animal = getAnimalById(characterId);
    if (!animal) {
      return { success: false, message: 'Character not found' };
    }

    if (!animal.isExclusive || !animal.coinPrice) {
      return { success: false, message: 'This character cannot be purchased' };
    }

    if (inventory.ownedCharacters.includes(characterId)) {
      return { success: false, message: 'You already own this character' };
    }

    if (!coinSystem.canAfford(animal.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    coinSystem.spendCoins(animal.coinPrice);
    const newInventory = {
      ...inventory,
      ownedCharacters: [...inventory.ownedCharacters, characterId],
    };
    saveInventory(newInventory);

    // Dispatch event to unlock the animal in the XP system
    window.dispatchEvent(new CustomEvent('petIsland_animalPurchased', {
      detail: { animalId: characterId, animalName: animal.name }
    }));

    return { success: true, message: `${animal.name} purchased!`, item: animal };
  }, [inventory, coinSystem, saveInventory]);

  // Purchase a background
  const purchaseBackground = useCallback((backgroundId: string): PurchaseResult => {
    const background = PREMIUM_BACKGROUNDS.find(bg => bg.id === backgroundId);
    if (!background) {
      return { success: false, message: 'Background not found' };
    }

    if (inventory.ownedBackgrounds.includes(backgroundId)) {
      return { success: false, message: 'You already own this background' };
    }

    if (!background.coinPrice || !coinSystem.canAfford(background.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    coinSystem.spendCoins(background.coinPrice);
    const newInventory = {
      ...inventory,
      ownedBackgrounds: [...inventory.ownedBackgrounds, backgroundId],
    };
    saveInventory(newInventory);

    return { success: true, message: `${background.name} purchased!`, item: background };
  }, [inventory, coinSystem, saveInventory]);

  // Purchase a badge
  const purchaseBadge = useCallback((badgeId: string): PurchaseResult => {
    const badge = PROFILE_BADGES.find(b => b.id === badgeId);
    if (!badge) {
      return { success: false, message: 'Badge not found' };
    }

    if (inventory.ownedBadges.includes(badgeId)) {
      return { success: false, message: 'You already own this badge' };
    }

    if (!badge.coinPrice || !coinSystem.canAfford(badge.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    coinSystem.spendCoins(badge.coinPrice);
    const newInventory = {
      ...inventory,
      ownedBadges: [...inventory.ownedBadges, badgeId],
    };
    saveInventory(newInventory);

    return { success: true, message: `${badge.name} purchased!`, item: badge };
  }, [inventory, coinSystem, saveInventory]);

  // Purchase a background bundle
  const purchaseBackgroundBundle = useCallback((bundleId: string): PurchaseResult => {
    const bundle = BACKGROUND_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) {
      return { success: false, message: 'Bundle not found' };
    }

    // Check if all backgrounds are already owned
    const allOwned = bundle.backgroundIds.every(id => inventory.ownedBackgrounds.includes(id));
    if (allOwned) {
      return { success: false, message: 'You already own all backgrounds in this bundle' };
    }

    if (!bundle.coinPrice || !coinSystem.canAfford(bundle.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    coinSystem.spendCoins(bundle.coinPrice);

    // Add all backgrounds from the bundle that aren't already owned
    const newBackgrounds = bundle.backgroundIds.filter(id => !inventory.ownedBackgrounds.includes(id));
    const newInventory = {
      ...inventory,
      ownedBackgrounds: [...inventory.ownedBackgrounds, ...newBackgrounds],
    };
    saveInventory(newInventory);

    return { success: true, message: `${bundle.name} purchased! ${newBackgrounds.length} backgrounds added!` };
  }, [inventory, coinSystem, saveInventory]);

  // Check if bundle is owned (all backgrounds in bundle are owned)
  const isBundleOwned = useCallback((bundleId: string): boolean => {
    const bundle = BACKGROUND_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return false;
    return bundle.backgroundIds.every(id => inventory.ownedBackgrounds.includes(id));
  }, [inventory]);

  // Purchase a booster
  const purchaseBooster = useCallback((boosterId: string): PurchaseResult => {
    const booster = boosterSystem.getBoosterType(boosterId);
    if (!booster) {
      return { success: false, message: 'Booster not found' };
    }

    if (boosterSystem.isBoosterActive()) {
      return { success: false, message: 'You already have an active booster' };
    }

    if (!coinSystem.canAfford(booster.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    coinSystem.spendCoins(booster.coinPrice);
    boosterSystem.activateBooster(boosterId);

    return { success: true, message: `${booster.name} activated!` };
  }, [coinSystem, boosterSystem]);

  // Purchase streak freeze
  const purchaseStreakFreeze = useCallback((quantity: number, price: number): PurchaseResult => {
    if (!coinSystem.canAfford(price)) {
      return { success: false, message: 'Not enough coins' };
    }

    coinSystem.spendCoins(price);

    // Add streak freezes
    for (let i = 0; i < quantity; i++) {
      streakSystem.earnStreakFreeze();
    }

    return { success: true, message: `${quantity} Streak Freeze${quantity > 1 ? 's' : ''} added!` };
  }, [coinSystem, streakSystem]);

  // Generic purchase function
  const purchaseItem = useCallback((itemId: string, category: ShopCategory): PurchaseResult => {
    switch (category) {
      case 'pets':
        return purchaseCharacter(itemId);
      case 'customize':
        // Try background first, then badge
        if (itemId.startsWith('bg-')) {
          return purchaseBackground(itemId);
        }
        return purchaseBadge(itemId);
      case 'powerups':
        // Handle boosters and utility items
        if (itemId.includes('boost') || itemId.includes('pass')) {
          return purchaseBooster(itemId);
        }
        const utilityItem = UTILITY_ITEMS.find(u => u.id === itemId);
        if (utilityItem && utilityItem.coinPrice) {
          return purchaseStreakFreeze(utilityItem.quantity, utilityItem.coinPrice);
        }
        return { success: false, message: 'Item not found' };
      default:
        return { success: false, message: 'Invalid category' };
    }
  }, [purchaseCharacter, purchaseBackground, purchaseBadge, purchaseBooster, purchaseStreakFreeze]);

  // Equip a badge
  const equipBadge = useCallback((badgeId: string | null) => {
    if (badgeId && !inventory.ownedBadges.includes(badgeId)) {
      return false;
    }
    saveInventory({ ...inventory, equippedBadge: badgeId });
    return true;
  }, [inventory, saveInventory]);

  // Equip a background
  const equipBackground = useCallback((backgroundId: string | null) => {
    if (backgroundId && !inventory.ownedBackgrounds.includes(backgroundId)) {
      return false;
    }
    saveInventory({ ...inventory, equippedBackground: backgroundId });
    return true;
  }, [inventory, saveInventory]);

  // Reset shop data
  const resetShop = useCallback(() => {
    const resetInventory: ShopInventory = {
      ownedCharacters: [],
      ownedBackgrounds: [],
      ownedBadges: [],
      equippedBadge: null,
      equippedBackground: null,
    };
    saveInventory(resetInventory);
  }, [saveInventory]);

  return {
    inventory,
    isOwned,
    isBundleOwned,
    purchaseItem,
    purchaseCharacter,
    purchaseBackground,
    purchaseBackgroundBundle,
    purchaseBadge,
    purchaseBooster,
    purchaseStreakFreeze,
    equipBadge,
    equipBackground,
    resetShop,
    coinBalance: coinSystem.balance,
    canAfford: coinSystem.canAfford,
  };
};
