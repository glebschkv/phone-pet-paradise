import { useCallback, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
  STARTER_BUNDLES,
  PET_BUNDLES,
} from '@/data/ShopData';
import { getAnimalById, AnimalData } from '@/data/AnimalDatabase';
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from '@/hooks/useAchievementTracking';
import { useShopStore } from '@/stores';

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

export const useShop = () => {
  const coinSystem = useCoinSystem();
  const boosterSystem = useCoinBooster();
  const streakSystem = useStreakSystem();

  // Use Zustand store with shallow comparison to prevent unnecessary re-renders
  // State values - use useShallow for efficient change detection
  const {
    ownedCharacters,
    ownedBackgrounds,
    ownedBadges,
    equippedBadge,
    equippedBackground,
  } = useShopStore(
    useShallow((state) => ({
      ownedCharacters: state.ownedCharacters,
      ownedBackgrounds: state.ownedBackgrounds,
      ownedBadges: state.ownedBadges,
      equippedBadge: state.equippedBadge,
      equippedBackground: state.equippedBackground,
    }))
  );

  // Actions - stable references, extract once with useShallow
  const {
    addOwnedCharacter,
    addOwnedBackground,
    addOwnedBadge,
    addOwnedCharacters,
    addOwnedBackgrounds,
    storeSetEquippedBadge,
    storeSetEquippedBackground,
    storeResetShop,
  } = useShopStore(
    useShallow((state) => ({
      addOwnedCharacter: state.addOwnedCharacter,
      addOwnedBackground: state.addOwnedBackground,
      addOwnedBadge: state.addOwnedBadge,
      addOwnedCharacters: state.addOwnedCharacters,
      addOwnedBackgrounds: state.addOwnedBackgrounds,
      storeSetEquippedBadge: state.setEquippedBadge,
      storeSetEquippedBackground: state.setEquippedBackground,
      storeResetShop: state.resetShop,
    }))
  );

  // For backwards compatibility, provide inventory object
  const inventory: ShopInventory = {
    ownedCharacters,
    ownedBackgrounds,
    ownedBadges,
    equippedBadge,
    equippedBackground,
  };

  // Track total purchases for achievements
  const purchaseCountRef = useRef(
    ownedCharacters.length + ownedBackgrounds.length + ownedBadges.length
  );

  // Track purchase count changes for achievements
  useEffect(() => {
    const totalItems = ownedCharacters.length + ownedBackgrounds.length + ownedBadges.length;
    if (totalItems > purchaseCountRef.current) {
      purchaseCountRef.current = totalItems;
      dispatchAchievementEvent(ACHIEVEMENT_EVENTS.PURCHASE_MADE, {
        totalPurchases: totalItems,
      });
    }
  }, [ownedCharacters.length, ownedBackgrounds.length, ownedBadges.length]);

  // Check if item is owned
  const isOwned = useCallback((itemId: string, category: ShopCategory): boolean => {
    switch (category) {
      case 'pets':
        return ownedCharacters.includes(itemId);
      case 'customize':
        return ownedBackgrounds.includes(itemId) || ownedBadges.includes(itemId);
      default:
        return false;
    }
  }, [ownedCharacters, ownedBackgrounds, ownedBadges]);

  // Purchase a character
  const purchaseCharacter = useCallback((characterId: string): PurchaseResult => {
    const animal = getAnimalById(characterId);
    if (!animal) {
      return { success: false, message: 'Character not found' };
    }

    if (!animal.isExclusive || !animal.coinPrice) {
      return { success: false, message: 'This character cannot be purchased' };
    }

    if (ownedCharacters.includes(characterId)) {
      return { success: false, message: 'You already own this character' };
    }

    if (!coinSystem.canAfford(animal.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    const spendSuccess = coinSystem.spendCoins(animal.coinPrice);
    if (!spendSuccess) {
      return { success: false, message: 'Failed to process payment' };
    }

    addOwnedCharacter(characterId);

    return { success: true, message: `${animal.name} purchased!`, item: animal };
  }, [ownedCharacters, coinSystem, addOwnedCharacter]);

  // Purchase a background
  const purchaseBackground = useCallback((backgroundId: string): PurchaseResult => {
    const background = PREMIUM_BACKGROUNDS.find(bg => bg.id === backgroundId);
    if (!background) {
      return { success: false, message: 'Background not found' };
    }

    if (ownedBackgrounds.includes(backgroundId)) {
      return { success: false, message: 'You already own this background' };
    }

    if (!background.coinPrice || !coinSystem.canAfford(background.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    const spendSuccess = coinSystem.spendCoins(background.coinPrice);
    if (!spendSuccess) {
      return { success: false, message: 'Failed to process payment' };
    }

    addOwnedBackground(backgroundId);

    return { success: true, message: `${background.name} purchased!`, item: background };
  }, [ownedBackgrounds, coinSystem, addOwnedBackground]);

  // Purchase a badge
  const purchaseBadge = useCallback((badgeId: string): PurchaseResult => {
    const badge = PROFILE_BADGES.find(b => b.id === badgeId);
    if (!badge) {
      return { success: false, message: 'Badge not found' };
    }

    if (ownedBadges.includes(badgeId)) {
      return { success: false, message: 'You already own this badge' };
    }

    if (!badge.coinPrice || !coinSystem.canAfford(badge.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    const spendSuccess = coinSystem.spendCoins(badge.coinPrice);
    if (!spendSuccess) {
      return { success: false, message: 'Failed to process payment' };
    }

    addOwnedBadge(badgeId);

    return { success: true, message: `${badge.name} purchased!`, item: badge };
  }, [ownedBadges, coinSystem, addOwnedBadge]);

  // Unlock a character (without payment - used for bundles and rewards)
  const unlockCharacter = useCallback((characterId: string): boolean => {
    const animal = getAnimalById(characterId);
    if (!animal) {
      return false;
    }

    if (ownedCharacters.includes(characterId)) {
      return true; // Already owned
    }

    addOwnedCharacter(characterId);
    return true;
  }, [ownedCharacters, addOwnedCharacter]);

  // Unlock a badge (without payment - used for bundles and rewards)
  const unlockBadge = useCallback((badgeId: string): boolean => {
    const badge = PROFILE_BADGES.find(b => b.id === badgeId);
    if (!badge) {
      return false;
    }

    if (ownedBadges.includes(badgeId)) {
      return true; // Already owned
    }

    addOwnedBadge(badgeId);
    return true;
  }, [ownedBadges, addOwnedBadge]);

  // Purchase a starter bundle (IAP simulation - grants all contents)
  const purchaseStarterBundle = useCallback((bundleId: string): PurchaseResult => {
    const bundle = STARTER_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) {
      return { success: false, message: 'Bundle not found' };
    }

    const results: string[] = [];

    // Grant coins
    if (bundle.contents.coins > 0) {
      coinSystem.addCoins(bundle.contents.coins);
      results.push(`${bundle.contents.coins} coins`);
    }

    // Activate booster (if no booster is currently active)
    if (bundle.contents.boosterId) {
      if (!boosterSystem.isBoosterActive()) {
        boosterSystem.activateBooster(bundle.contents.boosterId);
        const booster = boosterSystem.getBoosterType(bundle.contents.boosterId);
        results.push(booster?.name || 'Booster');
      } else {
        results.push('Booster (saved for later - one already active)');
      }
    }

    // Unlock character
    if (bundle.contents.characterId) {
      const animal = getAnimalById(bundle.contents.characterId);
      if (animal) {
        unlockCharacter(bundle.contents.characterId);
        results.push(animal.name);
      }
    }

    // Unlock badge
    if (bundle.contents.badgeId) {
      const badge = PROFILE_BADGES.find(b => b.id === bundle.contents.badgeId);
      if (badge) {
        unlockBadge(bundle.contents.badgeId);
        results.push(badge.name);
      }
    }

    return {
      success: true,
      message: `${bundle.name} purchased! Received: ${results.join(', ')}`
    };
  }, [coinSystem, boosterSystem, unlockCharacter, unlockBadge]);

  // Purchase a background bundle
  const purchaseBackgroundBundle = useCallback((bundleId: string): PurchaseResult => {
    const bundle = BACKGROUND_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) {
      return { success: false, message: 'Bundle not found' };
    }

    // Check if all backgrounds are already owned
    const allOwned = bundle.backgroundIds.every(id => ownedBackgrounds.includes(id));
    if (allOwned) {
      return { success: false, message: 'You already own all backgrounds in this bundle' };
    }

    if (!bundle.coinPrice || !coinSystem.canAfford(bundle.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    const spendSuccess = coinSystem.spendCoins(bundle.coinPrice);
    if (!spendSuccess) {
      return { success: false, message: 'Failed to process payment' };
    }

    // Add all backgrounds from the bundle that aren't already owned
    const newBackgrounds = bundle.backgroundIds.filter(id => !ownedBackgrounds.includes(id));
    addOwnedBackgrounds(newBackgrounds);

    return { success: true, message: `${bundle.name} purchased! ${newBackgrounds.length} backgrounds added!` };
  }, [ownedBackgrounds, coinSystem, addOwnedBackgrounds]);

  // Purchase a pet bundle
  const purchasePetBundle = useCallback((bundleId: string): PurchaseResult => {
    const bundle = PET_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) {
      return { success: false, message: 'Bundle not found' };
    }

    // Check if all pets are already owned
    const allOwned = bundle.petIds.every(id => ownedCharacters.includes(id));
    if (allOwned) {
      return { success: false, message: 'You already own all pets in this bundle' };
    }

    if (!bundle.coinPrice || !coinSystem.canAfford(bundle.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    const spendSuccess = coinSystem.spendCoins(bundle.coinPrice);
    if (!spendSuccess) {
      return { success: false, message: 'Failed to process payment' };
    }

    // Add all pets from the bundle that aren't already owned
    const newPets = bundle.petIds.filter(id => !ownedCharacters.includes(id));
    addOwnedCharacters(newPets);

    return { success: true, message: `${bundle.name} purchased! ${newPets.length} pets added!` };
  }, [ownedCharacters, coinSystem, addOwnedCharacters]);

  // Check if bundle is owned (all backgrounds in bundle are owned)
  const isBundleOwned = useCallback((bundleId: string): boolean => {
    const bundle = BACKGROUND_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return false;
    return bundle.backgroundIds.every(id => ownedBackgrounds.includes(id));
  }, [ownedBackgrounds]);

  // Check if pet bundle is owned (all pets in bundle are owned)
  const isPetBundleOwned = useCallback((bundleId: string): boolean => {
    const bundle = PET_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return false;
    return bundle.petIds.every(id => ownedCharacters.includes(id));
  }, [ownedCharacters]);

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

    const spendSuccess = coinSystem.spendCoins(booster.coinPrice);
    if (!spendSuccess) {
      return { success: false, message: 'Failed to process payment' };
    }

    boosterSystem.activateBooster(boosterId);

    return { success: true, message: `${booster.name} activated!` };
  }, [coinSystem, boosterSystem]);

  // Purchase streak freeze
  const purchaseStreakFreeze = useCallback((quantity: number, price: number): PurchaseResult => {
    if (!coinSystem.canAfford(price)) {
      return { success: false, message: 'Not enough coins' };
    }

    const spendSuccess = coinSystem.spendCoins(price);
    if (!spendSuccess) {
      return { success: false, message: 'Failed to process payment' };
    }

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
      case 'powerups': {
        // Handle boosters and utility items
        if (itemId.includes('boost') || itemId.includes('pass')) {
          return purchaseBooster(itemId);
        }
        const utilityItem = UTILITY_ITEMS.find(u => u.id === itemId);
        if (utilityItem && utilityItem.coinPrice) {
          return purchaseStreakFreeze(utilityItem.quantity, utilityItem.coinPrice);
        }
        return { success: false, message: 'Item not found' };
      }
      default:
        return { success: false, message: 'Invalid category' };
    }
  }, [purchaseCharacter, purchaseBackground, purchaseBadge, purchaseBooster, purchaseStreakFreeze]);

  // Equip a badge
  const equipBadge = useCallback((badgeId: string | null) => {
    if (badgeId && !ownedBadges.includes(badgeId)) {
      return false;
    }
    storeSetEquippedBadge(badgeId);
    return true;
  }, [ownedBadges, storeSetEquippedBadge]);

  // Equip a background
  const equipBackground = useCallback((backgroundId: string | null) => {
    if (backgroundId && !ownedBackgrounds.includes(backgroundId)) {
      return false;
    }
    storeSetEquippedBackground(backgroundId);
    return true;
  }, [ownedBackgrounds, storeSetEquippedBackground]);

  // Reset shop data
  const resetShop = useCallback(() => {
    storeResetShop();
  }, [storeResetShop]);

  return {
    inventory,
    isOwned,
    isBundleOwned,
    isPetBundleOwned,
    purchaseItem,
    purchaseCharacter,
    purchaseBackground,
    purchaseBackgroundBundle,
    purchasePetBundle,
    purchaseStarterBundle,
    purchaseBadge,
    purchaseBooster,
    purchaseStreakFreeze,
    unlockCharacter,
    unlockBadge,
    equipBadge,
    equipBackground,
    resetShop,
    coinBalance: coinSystem.balance,
    canAfford: coinSystem.canAfford,
  };
};
