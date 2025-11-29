import { BOOSTER_TYPES } from '@/hooks/useCoinBooster';
import { getCoinExclusiveAnimals } from './AnimalDatabase';

// ═══════════════════════════════════════════════════════════════════════════
// SHOP ITEM TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ShopCategory = 'featured' | 'pets' | 'customize' | 'powerups';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  coinPrice?: number;
  iapPrice?: string;
  iapProductId?: string; // For actual IAP integration
  icon: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  isLimited?: boolean;
  limitedUntil?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM BACKGROUNDS
// ═══════════════════════════════════════════════════════════════════════════

export interface PremiumBackground extends ShopItem {
  category: 'backgrounds';
  previewImage?: string;
  theme: string;
}

export const PREMIUM_BACKGROUNDS: PremiumBackground[] = [
  {
    id: 'bg-sakura',
    name: 'Sakura Garden',
    description: 'A serene Japanese garden with cherry blossoms in full bloom.',
    category: 'backgrounds',
    coinPrice: 800,
    icon: '🌸',
    rarity: 'rare',
    theme: 'sakura',
  },
  {
    id: 'bg-cyberpunk',
    name: 'Neon City',
    description: 'A futuristic cyberpunk cityscape with neon lights and holograms.',
    category: 'backgrounds',
    coinPrice: 1200,
    icon: '🌃',
    rarity: 'epic',
    theme: 'cyberpunk',
  },
  {
    id: 'bg-aurora',
    name: 'Aurora Borealis',
    description: 'Dance under the magical northern lights in this stunning arctic scene.',
    category: 'backgrounds',
    coinPrice: 1500,
    icon: '🌌',
    rarity: 'epic',
    theme: 'aurora',
  },
  {
    id: 'bg-crystal-cave',
    name: 'Crystal Cavern',
    description: 'A mystical underground cave filled with glowing crystals.',
    category: 'backgrounds',
    coinPrice: 1000,
    icon: '💎',
    rarity: 'rare',
    theme: 'crystal',
  },
  {
    id: 'bg-volcano',
    name: 'Volcanic Island',
    description: 'A dramatic volcanic landscape with flowing lava and ash.',
    category: 'backgrounds',
    coinPrice: 1800,
    icon: '🌋',
    rarity: 'legendary',
    theme: 'volcano',
  },
  {
    id: 'bg-space',
    name: 'Cosmic Void',
    description: 'Float among the stars in the endless expanse of space.',
    category: 'backgrounds',
    coinPrice: 2000,
    icon: '🚀',
    rarity: 'legendary',
    theme: 'space',
  },
  {
    id: 'bg-underwater',
    name: 'Deep Sea Reef',
    description: 'Explore a vibrant coral reef teeming with colorful life.',
    category: 'backgrounds',
    coinPrice: 900,
    icon: '🐠',
    rarity: 'rare',
    theme: 'underwater',
  },
  {
    id: 'bg-halloween',
    name: 'Spooky Hollow',
    description: 'A haunted forest perfect for the spookiest of pets.',
    category: 'backgrounds',
    coinPrice: 1500,
    icon: '🎃',
    rarity: 'epic',
    isLimited: true,
    theme: 'halloween',
  },
  {
    id: 'bg-winter-wonderland',
    name: 'Winter Wonderland',
    description: 'A magical snowy scene with twinkling lights and cozy vibes.',
    category: 'backgrounds',
    coinPrice: 1500,
    icon: '🎄',
    rarity: 'epic',
    isLimited: true,
    theme: 'winter',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE BADGES
// ═══════════════════════════════════════════════════════════════════════════

export interface ProfileBadge extends ShopItem {
  category: 'badges';
  frameStyle: string;
}

export const PROFILE_BADGES: ProfileBadge[] = [
  {
    id: 'badge-bronze-star',
    name: 'Bronze Star',
    description: 'A shiny bronze frame for your profile.',
    category: 'badges',
    coinPrice: 300,
    icon: '⭐',
    rarity: 'common',
    frameStyle: 'bronze',
  },
  {
    id: 'badge-silver-crown',
    name: 'Silver Crown',
    description: 'Show your royal dedication with this silver crown frame.',
    category: 'badges',
    coinPrice: 600,
    icon: '👑',
    rarity: 'rare',
    frameStyle: 'silver-crown',
  },
  {
    id: 'badge-gold-flame',
    name: 'Golden Flame',
    description: 'A fiery golden frame for the most dedicated focusers.',
    category: 'badges',
    coinPrice: 1000,
    icon: '🔥',
    rarity: 'epic',
    frameStyle: 'gold-flame',
  },
  {
    id: 'badge-diamond',
    name: 'Diamond Elite',
    description: 'The ultimate badge of prestige and dedication.',
    category: 'badges',
    coinPrice: 2500,
    icon: '💎',
    rarity: 'legendary',
    frameStyle: 'diamond',
  },
  {
    id: 'badge-rainbow',
    name: 'Rainbow Aura',
    description: 'A magical rainbow frame that shifts colors.',
    category: 'badges',
    coinPrice: 1500,
    icon: '🌈',
    rarity: 'epic',
    frameStyle: 'rainbow',
  },
  {
    id: 'badge-cosmic',
    name: 'Cosmic Ring',
    description: 'A frame with swirling galaxies and stars.',
    category: 'badges',
    coinPrice: 2000,
    icon: '🌟',
    rarity: 'legendary',
    frameStyle: 'cosmic',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY ITEMS (Streak Freezes, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export interface UtilityItem extends ShopItem {
  category: 'utilities';
  quantity: number;
}

export const UTILITY_ITEMS: UtilityItem[] = [
  {
    id: 'streak-freeze-1',
    name: 'Streak Freeze',
    description: 'Protect your streak for one missed day.',
    category: 'utilities',
    coinPrice: 150,
    icon: '🧊',
    rarity: 'common',
    quantity: 1,
  },
  {
    id: 'streak-freeze-3',
    name: 'Streak Freeze Pack',
    description: 'A pack of 3 streak freezes at a discount.',
    category: 'utilities',
    coinPrice: 400,
    icon: '🧊',
    rarity: 'rare',
    quantity: 3,
  },
  {
    id: 'streak-freeze-7',
    name: 'Streak Freeze Bundle',
    description: 'A bundle of 7 streak freezes - best value!',
    category: 'utilities',
    coinPrice: 800,
    icon: '🧊',
    rarity: 'epic',
    quantity: 7,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COIN PACKS (In-App Purchases)
// ═══════════════════════════════════════════════════════════════════════════

export interface CoinPack extends ShopItem {
  category: 'coins';
  coinAmount: number;
  bonusCoins?: number;
  isBestValue?: boolean;
}

export const COIN_PACKS: CoinPack[] = [
  {
    id: 'coins-starter',
    name: 'Starter Pack',
    description: 'A small pack of coins to get started.',
    category: 'coins',
    iapPrice: '$0.99',
    iapProductId: 'com.petparadise.coins.starter',
    icon: '🪙',
    coinAmount: 500,
    rarity: 'common',
  },
  {
    id: 'coins-value',
    name: 'Value Pack',
    description: 'Great value for regular shoppers.',
    category: 'coins',
    iapPrice: '$2.99',
    iapProductId: 'com.petparadise.coins.value',
    icon: '💰',
    coinAmount: 1500,
    bonusCoins: 100,
    rarity: 'rare',
  },
  {
    id: 'coins-premium',
    name: 'Premium Pack',
    description: 'For the serious collector.',
    category: 'coins',
    iapPrice: '$7.99',
    iapProductId: 'com.petparadise.coins.premium',
    icon: '💎',
    coinAmount: 5000,
    bonusCoins: 500,
    rarity: 'epic',
  },
  {
    id: 'coins-mega',
    name: 'Mega Pack',
    description: 'The ultimate coin pack - best value!',
    category: 'coins',
    iapPrice: '$19.99',
    iapProductId: 'com.petparadise.coins.mega',
    icon: '🏆',
    coinAmount: 15000,
    bonusCoins: 2500,
    rarity: 'legendary',
    isBestValue: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// STARTER BUNDLES (Special offers combining items)
// ═══════════════════════════════════════════════════════════════════════════

export interface StarterBundle extends ShopItem {
  category: 'coins';
  contents: {
    coins: number;
    boosterId?: string;
    characterId?: string;
    badgeId?: string;
  };
  savings: string;
}

export const STARTER_BUNDLES: StarterBundle[] = [
  {
    id: 'bundle-starter',
    name: 'Starter Bundle',
    description: 'Perfect for new players! Includes coins, a booster, and an exclusive character.',
    category: 'coins',
    iapPrice: '$4.99',
    iapProductId: 'com.petparadise.bundle.starter',
    icon: '🎁',
    rarity: 'epic',
    contents: {
      coins: 1000,
      boosterId: 'focus_boost',
      characterId: 'golden-hare',
    },
    savings: '50%',
  },
  {
    id: 'bundle-collector',
    name: 'Collector Bundle',
    description: 'For the dedicated collector - premium coins and exclusive rewards.',
    category: 'coins',
    iapPrice: '$14.99',
    iapProductId: 'com.petparadise.bundle.collector',
    icon: '🎁',
    rarity: 'legendary',
    contents: {
      coins: 5000,
      boosterId: 'super_boost',
      characterId: 'crystal-shark',
      badgeId: 'badge-gold-flame',
    },
    savings: '60%',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SHOP HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const getAllShopItems = (): ShopItem[] => {
  return [
    ...PREMIUM_BACKGROUNDS,
    ...PROFILE_BADGES,
    ...UTILITY_ITEMS,
    ...COIN_PACKS,
    ...STARTER_BUNDLES,
  ];
};

export const getShopItemsByCategory = (category: ShopCategory): ShopItem[] => {
  switch (category) {
    case 'featured':
      // Featured tab shows bundles and limited time items
      return [...STARTER_BUNDLES, ...getLimitedTimeItems()];
    case 'pets':
      return getCoinExclusiveAnimals().map(animal => ({
        id: animal.id,
        name: animal.name,
        description: animal.description,
        category: 'pets' as ShopCategory,
        coinPrice: animal.coinPrice,
        icon: animal.emoji,
        rarity: animal.rarity,
      }));
    case 'customize':
      // Combine backgrounds and badges
      return [...PREMIUM_BACKGROUNDS, ...PROFILE_BADGES];
    case 'powerups':
      // Combine boosters, utility items, and coins
      const boosters = BOOSTER_TYPES.map(booster => ({
        id: booster.id,
        name: booster.name,
        description: booster.description,
        category: 'powerups' as ShopCategory,
        coinPrice: booster.coinPrice,
        iapPrice: booster.iapPrice,
        icon: booster.id === 'focus_boost' ? '⚡' : booster.id === 'super_boost' ? '🚀' : '📅',
        rarity: (booster.id === 'weekly_pass' ? 'epic' : booster.id === 'super_boost' ? 'rare' : 'common') as 'common' | 'rare' | 'epic' | 'legendary',
      }));
      return [...boosters, ...UTILITY_ITEMS, ...COIN_PACKS];
    default:
      return [];
  }
};

export const getShopItemById = (itemId: string): ShopItem | undefined => {
  return getAllShopItems().find(item => item.id === itemId);
};

export const getBackgroundById = (backgroundId: string): PremiumBackground | undefined => {
  return PREMIUM_BACKGROUNDS.find(bg => bg.id === backgroundId);
};

export const getBadgeById = (badgeId: string): ProfileBadge | undefined => {
  return PROFILE_BADGES.find(badge => badge.id === badgeId);
};

export const getCoinPackById = (packId: string): CoinPack | undefined => {
  return COIN_PACKS.find(pack => pack.id === packId);
};

export const getLimitedTimeItems = (): ShopItem[] => {
  return getAllShopItems().filter(item => item.isLimited);
};

export const getItemsByRarity = (rarity: 'common' | 'rare' | 'epic' | 'legendary'): ShopItem[] => {
  return getAllShopItems().filter(item => item.rarity === rarity);
};

// Shop categories for UI - Streamlined for better UX
export const SHOP_CATEGORIES: { id: ShopCategory; name: string; icon: string }[] = [
  { id: 'featured', name: 'Featured', icon: '⭐' },
  { id: 'pets', name: 'Pets', icon: '🐾' },
  { id: 'customize', name: 'Customize', icon: '🎨' },
  { id: 'powerups', name: 'Power-Ups', icon: '⚡' },
];
