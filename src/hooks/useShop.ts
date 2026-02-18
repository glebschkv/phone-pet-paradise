import { useCallback, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCoinSystem } from './useCoinSystem';
import { useCoinBooster } from './useCoinBooster';
import { useStreakSystem } from './useStreakSystem';
import {
  ShopItem,
  ShopCategory,
  PREMIUM_BACKGROUNDS,
  UTILITY_ITEMS,
  ALL_BUNDLES,
} from '@/data/ShopData';
import { getAnimalById, AnimalData } from '@/data/AnimalDatabase';
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from '@/hooks/useAchievementTracking';
import { useShopStore } from '@/stores';
import { syncPurchasedBundlesFromServer } from '@/stores/shopStore';
import { IAP_EVENTS } from './useStoreKit';
import { shopLogger } from '@/lib/logger';

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: ShopItem | AnimalData;
}

/**
 * Configuration for a generic purchase operation
 */
interface PurchaseConfig<T> {
  /** Function to look up the item by ID */
  getItem: (id: string) => T | undefined;
  /** Displayed name for the item type (e.g., 'Character', 'Background') */
  itemTypeName: string;
  /** Array of already owned item IDs */
  ownedItems: string[];
  /** Function to add the item ID to the owned list */
  addOwned: (id: string) => void;
  /** Function to get the price from the item (returns undefined if not purchasable) */
  getPrice: (item: T) => number | undefined;
  /** Purpose of the spend for audit logging */
  spendPurpose: 'pet_unlock' | 'cosmetic' | 'booster' | 'streak_freeze';
  /** Optional validation function - return error message or null if valid */
  validate?: (item: T) => string | null;
  /** Function to get the item's display name */
  getItemName: (item: T) => string;
}

export interface ShopInventory {
  ownedCharacters: string[];
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  purchasedStarterBundleIds: string[];
}

/**
 * Spend coins with server validation, syncing balance on failure.
 * Centralises the spend-then-sync-on-error pattern used by every purchase flow.
 */
async function spendCoinsWithSync(
  coinSystem: ReturnType<typeof useCoinSystem>,
  amount: number,
  purpose: 'shop_purchase' | 'pet_unlock' | 'cosmetic' | 'booster' | 'streak_freeze',
  referenceId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const spendSuccess = await coinSystem.spendCoins(amount, purpose, referenceId);
  if (spendSuccess) return { ok: true };

  let syncSucceeded = false;
  try { syncSucceeded = await coinSystem.syncFromServer(); } catch { /* silent */ }
  const message = syncSucceeded
    ? 'Your balance has been updated. Please try again.'
    : 'Purchase failed. Please check your connection and try again.';
  return { ok: false, message };
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
    equippedBackground,
    purchasedStarterBundleIds,
  } = useShopStore(
    useShallow((state) => ({
      ownedCharacters: state.ownedCharacters,
      ownedBackgrounds: state.ownedBackgrounds,
      equippedBackground: state.equippedBackground,
      purchasedStarterBundleIds: state.purchasedStarterBundleIds,
    }))
  );

  // Actions - stable references, extract once with useShallow
  const {
    addOwnedCharacter,
    addOwnedBackground,
    addOwnedCharacters,
    addOwnedBackgrounds,
    addPurchasedStarterBundleId,
    storeSetEquippedBackground,
    storeResetShop,
  } = useShopStore(
    useShallow((state) => ({
      addOwnedCharacter: state.addOwnedCharacter,
      addOwnedBackground: state.addOwnedBackground,
      addOwnedCharacters: state.addOwnedCharacters,
      addOwnedBackgrounds: state.addOwnedBackgrounds,
      addPurchasedStarterBundleId: state.addPurchasedStarterBundleId,
      storeSetEquippedBackground: state.setEquippedBackground,
      storeResetShop: state.resetShop,
    }))
  );

  // For backwards compatibility, provide inventory object
  const inventory: ShopInventory = {
    ownedCharacters,
    ownedBackgrounds,
    equippedBackground,
    purchasedStarterBundleIds,
  };

  // Track total purchases for achievements
  const purchaseCountRef = useRef(
    ownedCharacters.length + ownedBackgrounds.length
  );

  // Track purchase count changes for achievements
  useEffect(() => {
    const totalItems = ownedCharacters.length + ownedBackgrounds.length;
    if (totalItems > purchaseCountRef.current) {
      purchaseCountRef.current = totalItems;
      dispatchAchievementEvent(ACHIEVEMENT_EVENTS.PURCHASE_MADE, {
        totalPurchases: totalItems,
      });
    }
  }, [ownedCharacters.length, ownedBackgrounds.length]);

  // Sync purchased bundle IDs from server on mount to clear stale localStorage
  useEffect(() => {
    syncPurchasedBundlesFromServer();
  }, []);

  // Refs for the bundle grant handler — keeps the event listener stable so it
  // is never removed/re-registered during a purchase (which could miss events).
  const bundleGrantDepsRef = useRef({
    ownedCharacters, addOwnedCharacter, addPurchasedStarterBundleId,
    boosterSystem, streakSystem,
  });
  bundleGrantDepsRef.current = {
    ownedCharacters, addOwnedCharacter, addPurchasedStarterBundleId,
    boosterSystem, streakSystem,
  };

  // Listen for IAP bundle grants to fulfill non-coin contents
  useEffect(() => {
    const handleBundleGranted = (event: Event) => {
      try {
        const deps = bundleGrantDepsRef.current;
        const customEvent = event as CustomEvent<{
          productId?: string;
          characterId?: string;
          boosterId?: string;
          streakFreezes: number;
          alreadyOwned?: boolean;
        }>;
        const { productId, characterId, boosterId, streakFreezes, alreadyOwned } = customEvent.detail;

        // Always record the bundle as purchased (shows OWNED badge in UI)
        if (productId) {
          deps.addPurchasedStarterBundleId(productId);
        }

        // Only grant actual rewards for NEW purchases, not re-purchases
        if (alreadyOwned) {
          shopLogger.debug('Bundle already owned, recorded but skipping grants:', productId);
          return;
        }

        // Grant character if included
        if (characterId) {
          const animal = getAnimalById(characterId);
          if (animal && !deps.ownedCharacters.includes(characterId)) {
            deps.addOwnedCharacter(characterId);
          }
        }

        // Activate booster if included (and no active booster)
        if (boosterId && !deps.boosterSystem.isBoosterActive()) {
          deps.boosterSystem.activateBooster(boosterId);
        }

        // Grant streak freezes if included
        if (streakFreezes && streakFreezes > 0) {
          for (let i = 0; i < streakFreezes; i++) {
            deps.streakSystem.earnStreakFreeze();
          }
        }
      } catch (e) {
        shopLogger.error('Failed to fulfill IAP bundle grant:', e);
      }
    };

    window.addEventListener(IAP_EVENTS.BUNDLE_GRANTED, handleBundleGranted);
    return () => {
      window.removeEventListener(IAP_EVENTS.BUNDLE_GRANTED, handleBundleGranted);
    };
  }, []); // Stable — deps accessed via ref

  // Check if item is owned
  const isOwned = useCallback((itemId: string, category: ShopCategory): boolean => {
    switch (category) {
      case 'pets':
        return ownedCharacters.includes(itemId);
      case 'customize':
        return ownedBackgrounds.includes(itemId);
      default:
        return false;
    }
  }, [ownedCharacters, ownedBackgrounds]);

  /**
   * SECURITY: Generic purchase function with server-validated coin spending
   *
   * This function encapsulates the common purchase pattern:
   * 1. Look up item by ID
   * 2. Validate item exists and is purchasable
   * 3. Check if already owned
   * 4. Check if can afford
   * 5. Spend coins (async with server validation)
   * 6. Add to owned list
   */
  const genericPurchase = useCallback(async <T>(
    itemId: string,
    config: PurchaseConfig<T>
  ): Promise<PurchaseResult> => {
    const item = config.getItem(itemId);
    if (!item) {
      return { success: false, message: `${config.itemTypeName} not found` };
    }

    // Run custom validation if provided
    if (config.validate) {
      const validationError = config.validate(item);
      if (validationError) {
        return { success: false, message: validationError };
      }
    }

    if (config.ownedItems.includes(itemId)) {
      return { success: false, message: `You already own this ${config.itemTypeName.toLowerCase()}` };
    }

    const price = config.getPrice(item);
    if (!price || !coinSystem.canAfford(price)) {
      return { success: false, message: 'Not enough coins' };
    }

    const spend = await spendCoinsWithSync(coinSystem, price, config.spendPurpose, itemId);
    if (!spend.ok) return { success: false, message: spend.message };

    config.addOwned(itemId);

    const itemName = config.getItemName(item);
    return { success: true, message: `${itemName} purchased!`, item: item as unknown as ShopItem | AnimalData };
  }, [coinSystem]);

  /**
   * SECURITY: Purchase a character with server-validated coin spending
   */
  const purchaseCharacter = useCallback(async (characterId: string): Promise<PurchaseResult> => {
    return genericPurchase(characterId, {
      getItem: getAnimalById,
      itemTypeName: 'Character',
      ownedItems: ownedCharacters,
      addOwned: addOwnedCharacter,
      getPrice: (animal) => animal.isExclusive ? animal.coinPrice : undefined,
      spendPurpose: 'pet_unlock',
      validate: (animal) => (!animal.isExclusive || !animal.coinPrice) ? 'This character cannot be purchased' : null,
      getItemName: (animal) => animal.name,
    });
  }, [genericPurchase, ownedCharacters, addOwnedCharacter]);

  /**
   * SECURITY: Purchase a background with server-validated coin spending
   */
  const purchaseBackground = useCallback(async (backgroundId: string): Promise<PurchaseResult> => {
    return genericPurchase(backgroundId, {
      getItem: (id) => PREMIUM_BACKGROUNDS.find(bg => bg.id === id),
      itemTypeName: 'Background',
      ownedItems: ownedBackgrounds,
      addOwned: addOwnedBackground,
      getPrice: (bg) => bg.coinPrice,
      spendPurpose: 'cosmetic',
      validate: () => null,
      getItemName: (bg) => bg.name,
    });
  }, [genericPurchase, ownedBackgrounds, addOwnedBackground]);

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

  /**
   * SECURITY: Purchase a coin bundle (pets or backgrounds) with server-validated spending
   */
  const purchaseBundle = useCallback(async (bundleId: string): Promise<PurchaseResult> => {
    const bundle = ALL_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) {
      return { success: false, message: 'Bundle not found' };
    }

    const ownedList = bundle.bundleType === 'pets' ? ownedCharacters : ownedBackgrounds;
    const allOwned = bundle.itemIds.every(id => ownedList.includes(id));
    if (allOwned) {
      return { success: false, message: `You already own all ${bundle.bundleType} in this bundle` };
    }

    if (!bundle.coinPrice || !coinSystem.canAfford(bundle.coinPrice)) {
      return { success: false, message: 'Not enough coins' };
    }

    const purpose = bundle.bundleType === 'pets' ? 'pet_unlock' : 'cosmetic' as const;
    const spend = await spendCoinsWithSync(coinSystem, bundle.coinPrice, purpose, bundleId);
    if (!spend.ok) return { success: false, message: spend.message };

    const newItems = bundle.itemIds.filter(id => !ownedList.includes(id));
    if (bundle.bundleType === 'pets') {
      addOwnedCharacters(newItems);
    } else {
      addOwnedBackgrounds(newItems);
    }

    return { success: true, message: `${bundle.name} purchased! ${newItems.length} ${bundle.bundleType} added!` };
  }, [ownedCharacters, ownedBackgrounds, coinSystem, addOwnedCharacters, addOwnedBackgrounds]);

  // Check if all items in a bundle are already owned
  const isBundleOwned = useCallback((bundleId: string): boolean => {
    const bundle = ALL_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return false;
    const ownedList = bundle.bundleType === 'pets' ? ownedCharacters : ownedBackgrounds;
    return bundle.itemIds.every(id => ownedList.includes(id));
  }, [ownedCharacters, ownedBackgrounds]);

  /**
   * SECURITY: Purchase a booster with server-validated coin spending
   */
  const purchaseBooster = useCallback(async (boosterId: string): Promise<PurchaseResult> => {
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

    const spend = await spendCoinsWithSync(coinSystem, booster.coinPrice, 'booster', boosterId);
    if (!spend.ok) return { success: false, message: spend.message };

    boosterSystem.activateBooster(boosterId);

    return { success: true, message: `${booster.name} activated!` };
  }, [coinSystem, boosterSystem]);

  /**
   * SECURITY: Purchase streak freeze with server-validated coin spending
   */
  const purchaseStreakFreeze = useCallback(async (quantity: number, price: number): Promise<PurchaseResult> => {
    if (!coinSystem.canAfford(price)) {
      return { success: false, message: 'Not enough coins' };
    }

    const spend = await spendCoinsWithSync(coinSystem, price, 'streak_freeze', `streak_freeze_x${quantity}`);
    if (!spend.ok) return { success: false, message: spend.message };

    // Add streak freezes
    for (let i = 0; i < quantity; i++) {
      streakSystem.earnStreakFreeze();
    }

    return { success: true, message: `${quantity} Streak Freeze${quantity > 1 ? 's' : ''} added!` };
  }, [coinSystem, streakSystem]);

  /**
   * SECURITY: Generic purchase function with server validation
   *
   * All purchases go through server-validated coin spending.
   */
  const purchaseItem = useCallback(async (itemId: string, category: ShopCategory): Promise<PurchaseResult> => {
    switch (category) {
      case 'pets':
        return purchaseCharacter(itemId);
      case 'customize':
        return purchaseBackground(itemId);
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
  }, [purchaseCharacter, purchaseBackground, purchaseBooster, purchaseStreakFreeze]);

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
    purchaseItem,
    purchaseCharacter,
    purchaseBackground,
    purchaseBundle,
    purchaseBooster,
    purchaseStreakFreeze,
    unlockCharacter,
    equipBackground,
    resetShop,
    coinBalance: coinSystem.balance,
    canAfford: coinSystem.canAfford,
  };
};
