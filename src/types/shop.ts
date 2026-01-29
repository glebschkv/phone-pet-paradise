/**
 * Shop Types
 *
 * Consolidated type definitions for shop items and purchases.
 */

import type { Rarity } from './rewards';

// ============================================================================
// Shop Category Types
// ============================================================================

/**
 * Shop category identifiers
 */
export type ShopCategory =
  | 'featured'
  | 'pets'
  | 'customize'
  | 'powerups'
  | 'backgrounds'
  | 'utilities'
  | 'coins'
  | 'bundles'
  | 'inventory';

// ============================================================================
// Base Shop Item Types
// ============================================================================

/**
 * Base shop item interface
 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  coinPrice?: number;
  iapPrice?: string;
  iapProductId?: string;
  icon: string;
  rarity?: Rarity;
  isLimited?: boolean;
  limitedUntil?: string;
  comingSoon?: boolean;
}

// ============================================================================
// Specific Shop Item Types
// ============================================================================

/**
 * Premium background item
 */
export interface PremiumBackground extends ShopItem {
  category: 'backgrounds';
  previewImage?: string;
  theme: string;
  bundleId?: string;
}

/**
 * Utility item (streak freezes, etc.)
 */
export interface UtilityItem extends ShopItem {
  category: 'utilities';
  quantity: number;
}

/**
 * Coin pack for purchase
 */
export interface CoinPack extends ShopItem {
  category: 'coins';
  coinAmount: number;
  bonusCoins?: number;
  isBestValue?: boolean;
}

// ============================================================================
// Bundle Types
// ============================================================================

/**
 * Starter bundle with mixed contents
 */
export interface StarterBundle extends ShopItem {
  category: 'coins';
  contents: {
    coins: number;
    boosterId?: string;
    characterId?: string;
  };
  savings: string;
}

/**
 * Background bundle
 */
export interface BackgroundBundle extends ShopItem {
  category: 'bundles';
  backgroundIds: string[];
  previewImages: string[];
  totalValue: number;
  savings: string;
}

/**
 * Pet bundle
 */
export interface PetBundle extends ShopItem {
  category: 'bundles';
  petIds: string[];
  totalValue: number;
  savings: string;
}

// ============================================================================
// Booster Types
// ============================================================================

/**
 * Booster type identifiers
 */
export type BoosterType = 'focus_boost' | 'super_boost' | 'weekly_pass';

/**
 * Booster definition
 */
export interface Booster {
  id: BoosterType;
  name: string;
  description: string;
  multiplier: number;
  durationHours: number;
  coinPrice: number;
  iapPrice?: string;
}

/**
 * Active booster state
 */
export interface ActiveBooster {
  type: BoosterType;
  multiplier: number;
  expiresAt: number;
  remainingTime: number;
}

// ============================================================================
// Purchase Types
// ============================================================================

/**
 * Purchase result
 */
export interface PurchaseResult {
  success: boolean;
  itemId: string;
  error?: string;
  transactionId?: string;
}

/**
 * Purchase history entry
 */
export interface PurchaseHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  purchaseType: 'coins' | 'iap';
  amount: number;
  timestamp: number;
}

// ============================================================================
// Shop State Types
// ============================================================================

/**
 * Shop category definition for UI
 */
export interface ShopCategoryDef {
  id: ShopCategory;
  name: string;
  icon: string;
}

/**
 * Owned items state
 */
export interface OwnedItems {
  backgrounds: string[];
  pets: string[];
  boosters: ActiveBooster[];
  streakFreezes: number;
}
