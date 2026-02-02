import { BOOSTER_TYPES } from '@/hooks/useCoinBooster';
import { getCoinExclusiveAnimals } from './AnimalDatabase';
import type {
  ShopCategory,
  ShopItem,
  PremiumBackground,
  UtilityItem,
  CoinPack,
  StarterBundle,
  BackgroundBundle,
  PetBundle,
} from '@/types';

// Re-export types for backwards compatibility
export type {
  ShopCategory,
  ShopItem,
  PremiumBackground,
  UtilityItem,
  CoinPack,
  StarterBundle,
  BackgroundBundle,
  PetBundle,
} from '@/types';

// Sky Bundle Backgrounds - Individual backgrounds that come with the Sky Bundle
export const SKY_BUNDLE_BACKGROUNDS: PremiumBackground[] = [
  {
    id: 'bg-sky-islands',
    name: 'Sky Islands',
    description: 'Majestic rocky islands rising from calm waters under a serene sky.',
    category: 'backgrounds',
    coinPrice: 600,
    icon: 'island',
    rarity: 'rare',
    theme: 'sky-islands',
    previewImage: '/assets/worlds/SKYBUNDLE1.png',
    bundleId: 'bundle-sky-realms',
  },
  {
    id: 'bg-calm-seas',
    name: 'Calm Seas',
    description: 'A peaceful ocean horizon under a beautiful gradient sky.',
    category: 'backgrounds',
    coinPrice: 600,
    icon: 'wave',
    rarity: 'rare',
    theme: 'calm-seas',
    previewImage: '/assets/worlds/SKYBUNDLE2.png',
    bundleId: 'bundle-sky-realms',
  },
  {
    id: 'bg-twilight-clouds',
    name: 'Twilight Clouds',
    description: 'Dramatic clouds painted in soft twilight colors over the sea.',
    category: 'backgrounds',
    coinPrice: 800,
    icon: 'cloud',
    rarity: 'epic',
    theme: 'twilight-clouds',
    previewImage: '/assets/worlds/SKYBUNDLE3.png',
    bundleId: 'bundle-sky-realms',
  },
  {
    id: 'bg-aurora-horizon',
    name: 'Aurora Horizon',
    description: 'A mesmerizing sky with ethereal light dancing across the clouds.',
    category: 'backgrounds',
    coinPrice: 800,
    icon: 'sparkles',
    rarity: 'epic',
    theme: 'aurora-horizon',
    previewImage: '/assets/worlds/SKYBUNDLE4.png',
    bundleId: 'bundle-sky-realms',
  },
  {
    id: 'bg-sunset-clouds',
    name: 'Sunset Clouds',
    description: 'Breathtaking sunset clouds reflected in still waters.',
    category: 'backgrounds',
    coinPrice: 1000,
    icon: 'sunset',
    rarity: 'legendary',
    theme: 'sunset-clouds',
    previewImage: '/assets/worlds/SKYBUNDLE5.png',
    bundleId: 'bundle-sky-realms',
  },
];

export const PREMIUM_BACKGROUNDS: PremiumBackground[] = [
  // Include Sky Bundle backgrounds
  ...SKY_BUNDLE_BACKGROUNDS,
  {
    id: 'bg-sakura',
    name: 'Sakura Garden',
    description: 'A serene Japanese garden with cherry blossoms in full bloom.',
    category: 'backgrounds',
    coinPrice: 800,
    icon: 'sakura',
    rarity: 'rare',
    theme: 'sakura',
    comingSoon: true,
  },
  {
    id: 'bg-cyberpunk',
    name: 'Neon City',
    description: 'A futuristic cyberpunk cityscape with neon lights and holograms.',
    category: 'backgrounds',
    coinPrice: 1200,
    icon: 'neon-city',
    rarity: 'epic',
    theme: 'cyberpunk',
    comingSoon: true,
  },
  {
    id: 'bg-aurora',
    name: 'Aurora Borealis',
    description: 'Dance under the magical northern lights in this stunning arctic scene.',
    category: 'backgrounds',
    coinPrice: 1500,
    icon: 'aurora',
    rarity: 'epic',
    theme: 'aurora',
    comingSoon: true,
  },
  {
    id: 'bg-crystal-cave',
    name: 'Crystal Cavern',
    description: 'A mystical underground cave filled with glowing crystals.',
    category: 'backgrounds',
    coinPrice: 1000,
    icon: 'diamond',
    rarity: 'rare',
    theme: 'crystal',
    comingSoon: true,
  },
  {
    id: 'bg-volcano',
    name: 'Volcanic Island',
    description: 'A dramatic volcanic landscape with flowing lava and ash.',
    category: 'backgrounds',
    coinPrice: 1800,
    icon: 'volcano',
    rarity: 'legendary',
    theme: 'volcano',
    comingSoon: true,
  },
  {
    id: 'bg-space',
    name: 'Cosmic Void',
    description: 'Float among the stars in the endless expanse of space.',
    category: 'backgrounds',
    coinPrice: 2000,
    icon: 'rocket',
    rarity: 'legendary',
    theme: 'space',
    comingSoon: true,
  },
  {
    id: 'bg-underwater',
    name: 'Deep Sea Reef',
    description: 'Explore a vibrant coral reef teeming with colorful life.',
    category: 'backgrounds',
    coinPrice: 900,
    icon: 'fish',
    rarity: 'rare',
    theme: 'underwater',
    comingSoon: true,
  },
  {
    id: 'bg-halloween',
    name: 'Spooky Hollow',
    description: 'A haunted forest perfect for the spookiest of pets.',
    category: 'backgrounds',
    coinPrice: 1500,
    icon: 'pumpkin',
    rarity: 'epic',
    isLimited: true,
    theme: 'halloween',
    comingSoon: true,
  },
  {
    id: 'bg-winter-wonderland',
    name: 'Winter Wonderland',
    description: 'A magical snowy scene with twinkling lights and cozy vibes.',
    category: 'backgrounds',
    coinPrice: 1500,
    icon: 'christmas-tree',
    rarity: 'epic',
    isLimited: true,
    theme: 'winter',
    comingSoon: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY ITEMS (Streak Freezes, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export const UTILITY_ITEMS: UtilityItem[] = [
  {
    id: 'streak-freeze-1',
    name: 'Streak Freeze',
    description: 'Protect your streak for one missed day.',
    category: 'utilities',
    coinPrice: 150,
    icon: 'ice-cube',
    rarity: 'common',
    quantity: 1,
  },
  {
    id: 'streak-freeze-3',
    name: 'Streak Freeze Pack',
    description: 'A pack of 3 streak freezes at a discount.',
    category: 'utilities',
    coinPrice: 400,
    icon: 'ice-cube',
    rarity: 'rare',
    quantity: 3,
  },
  {
    id: 'streak-freeze-7',
    name: 'Streak Freeze Bundle',
    description: 'A bundle of 7 streak freezes - best value!',
    category: 'utilities',
    coinPrice: 800,
    icon: 'ice-cube',
    rarity: 'epic',
    quantity: 7,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COIN PACKS (In-App Purchases)
// ═══════════════════════════════════════════════════════════════════════════

export const COIN_PACKS: CoinPack[] = [
  {
    id: 'coins-starter',
    name: 'Starter Pack',
    description: 'A small pack of coins to get started.',
    category: 'coins',
    iapPrice: '$0.99',
    iapProductId: 'co.nomoinc.nomo.coins.starter',
    icon: 'coin',
    coinAmount: 500,
    bonusCoins: 100,
    rarity: 'common',
  },
  {
    id: 'coins-value',
    name: 'Value Pack',
    description: 'Great value for regular shoppers.',
    category: 'coins',
    iapPrice: '$2.99',
    iapProductId: 'co.nomoinc.nomo.coins.value',
    icon: 'money-bag',
    coinAmount: 1500,
    bonusCoins: 300,
    rarity: 'rare',
  },
  {
    id: 'coins-premium',
    name: 'Premium Pack',
    description: 'For the serious collector.',
    category: 'coins',
    iapPrice: '$7.99',
    iapProductId: 'co.nomoinc.nomo.coins.premium',
    icon: 'diamond',
    coinAmount: 5000,
    bonusCoins: 1000,
    rarity: 'epic',
  },
  {
    id: 'coins-mega',
    name: 'Mega Pack',
    description: 'The ultimate coin pack - best value!',
    category: 'coins',
    iapPrice: '$19.99',
    iapProductId: 'co.nomoinc.nomo.coins.mega',
    icon: 'trophy',
    coinAmount: 15000,
    bonusCoins: 5000,
    rarity: 'legendary',
  },
  {
    id: 'coins-ultra',
    name: 'Ultra Pack',
    description: 'The VIP experience - maximum coins!',
    category: 'coins',
    iapPrice: '$49.99',
    iapProductId: 'co.nomoinc.nomo.coins.ultra',
    icon: 'ultra-crown',
    coinAmount: 40000,
    bonusCoins: 20000,
    rarity: 'legendary',
    isBestValue: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// STARTER BUNDLES (Special offers combining items)
// ═══════════════════════════════════════════════════════════════════════════

export const STARTER_BUNDLES: StarterBundle[] = [
  {
    id: 'bundle-welcome',
    name: 'Welcome Gift',
    description: 'A perfect start to your journey! Coins, protection, and a boost.',
    category: 'coins',
    iapPrice: '$1.99',
    iapProductId: 'co.nomoinc.nomo.bundle.welcome',
    icon: 'gift',
    rarity: 'rare',
    contents: {
      coins: 400,
      boosterId: 'focus_boost',
      streakFreezes: 1,
    },
    savings: '60%',
  },
  {
    id: 'bundle-starter',
    name: 'Starter Bundle',
    description: 'Perfect for new players! Includes coins, a booster, and an exclusive character.',
    category: 'coins',
    iapPrice: '$4.99',
    iapProductId: 'co.nomoinc.nomo.bundle.starter',
    icon: 'gift',
    rarity: 'epic',
    contents: {
      coins: 1000,
      boosterId: 'focus_boost',
      characterId: 'clover-cat', // Lucky Clover Cat - rare tier unlock
    },
    savings: '50%',
  },
  {
    id: 'bundle-collector',
    name: 'Collector Bundle',
    description: 'For the dedicated collector - premium coins and exclusive rewards.',
    category: 'coins',
    iapPrice: '$14.99',
    iapProductId: 'co.nomoinc.nomo.bundle.collector',
    icon: 'gift',
    rarity: 'legendary',
    contents: {
      coins: 5000,
      boosterId: 'super_boost',
      characterId: 'kitsune-spirit', // Legendary Kitsune Spirit
    },
    savings: '60%',
  },
  {
    id: 'bundle-ultimate',
    name: 'Ultimate Bundle',
    description: 'The ultimate collection - exclusive pets, massive coins, and premium extras.',
    category: 'coins',
    iapPrice: '$29.99',
    iapProductId: 'co.nomoinc.nomo.bundle.ultimate',
    icon: 'treasure-chest',
    rarity: 'legendary',
    contents: {
      coins: 12000,
      boosterId: 'super_boost',
      characterId: 'storm-spirit', // Legendary Storm Spirit
      streakFreezes: 5,
    },
    savings: '65%',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND BUNDLES (Purchasable with coins)
// ═══════════════════════════════════════════════════════════════════════════

export const BACKGROUND_BUNDLES: BackgroundBundle[] = [
  {
    id: 'bundle-sky-realms',
    name: 'Sky Realms Bundle',
    description: 'A collection of 5 breathtaking sky and ocean themed backgrounds.',
    category: 'bundles',
    coinPrice: 2000,
    icon: 'sun-cloud',
    rarity: 'legendary',
    backgroundIds: [
      'bg-sky-islands',
      'bg-calm-seas',
      'bg-twilight-clouds',
      'bg-aurora-horizon',
      'bg-sunset-clouds',
    ],
    previewImages: [
      '/assets/worlds/SKYBUNDLE1.png',
      '/assets/worlds/SKYBUNDLE2.png',
      '/assets/worlds/SKYBUNDLE3.png',
      '/assets/worlds/SKYBUNDLE4.png',
      '/assets/worlds/SKYBUNDLE5.png',
    ],
    totalValue: 3800, // Sum of individual prices: 600+600+800+800+1000
    savings: '47%',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PET BUNDLES (Special themed pet collections)
// ═══════════════════════════════════════════════════════════════════════════

export const PET_BUNDLES: PetBundle[] = [
  {
    id: 'bundle-mystical-spirits',
    name: 'Mystical Spirits Bundle',
    description: 'Harness the power of the elements! Includes Kitsune Spirit and Storm Spirit.',
    category: 'bundles',
    coinPrice: 7500,
    icon: 'sparkles',
    rarity: 'legendary',
    petIds: ['kitsune-spirit', 'storm-spirit'],
    totalValue: 9500, // 5000+4500
    savings: '21%',
  },
  {
    id: 'bundle-night-creatures',
    name: 'Night Creatures Bundle',
    description: 'Embrace the darkness! Includes Cute Ghost and Golden Moth.',
    category: 'bundles',
    coinPrice: 4400,
    icon: 'moon',
    rarity: 'epic',
    petIds: ['cute-ghost', 'golden-moth'],
    totalValue: 5500, // 2500+3000
    savings: '20%',
  },
  {
    id: 'bundle-costume-kids',
    name: 'Costume Kids Bundle',
    description: 'Adorable costume characters! Includes Cat Hood and Robot Buddy.',
    category: 'bundles',
    coinPrice: 4000,
    icon: 'masks',
    rarity: 'epic',
    petIds: ['cat-hood', 'robot-buddy'],
    totalValue: 5000, // 1500+3500
    savings: '20%',
  },
  {
    id: 'bundle-meadow-friends',
    name: 'Meadow Friends Bundle',
    description: 'Cheerful meadow companions! Includes Clover Cat and Slime King.',
    category: 'bundles',
    coinPrice: 2200,
    icon: 'leaf',
    rarity: 'rare',
    petIds: ['clover-cat', 'slime-king'],
    totalValue: 2800, // 800+2000
    savings: '21%',
  },
  {
    id: 'bundle-complete-collection',
    name: 'Complete Collection Bundle',
    description: 'All 8 exclusive pets in one legendary bundle! The ultimate collector\'s dream.',
    category: 'bundles',
    coinPrice: 18000,
    icon: 'crown',
    rarity: 'legendary',
    petIds: ['clover-cat', 'slime-king', 'cute-ghost', 'kitsune-spirit', 'golden-moth', 'storm-spirit', 'cat-hood', 'robot-buddy'],
    totalValue: 22800, // 800+2000+2500+5000+3000+4500+1500+3500
    savings: '21%',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SHOP HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const getAllShopItems = (): ShopItem[] => {
  return [
    ...PREMIUM_BACKGROUNDS,
    ...UTILITY_ITEMS,
    ...COIN_PACKS,
    ...STARTER_BUNDLES,
    ...BACKGROUND_BUNDLES,
    ...PET_BUNDLES,
  ];
};

export const getBackgroundBundleById = (bundleId: string): BackgroundBundle | undefined => {
  return BACKGROUND_BUNDLES.find(bundle => bundle.id === bundleId);
};

export const getPetBundleById = (bundleId: string): PetBundle | undefined => {
  return PET_BUNDLES.find(bundle => bundle.id === bundleId);
};

export const getBackgroundsInBundle = (bundleId: string): PremiumBackground[] => {
  return PREMIUM_BACKGROUNDS.filter(bg => bg.bundleId === bundleId);
};

export const getShopItemsByCategory = (category: ShopCategory): ShopItem[] => {
  switch (category) {
    case 'featured':
      // Featured tab shows bundles, pet bundles and limited time items
      return [...STARTER_BUNDLES, ...PET_BUNDLES.slice(0, 4), ...getLimitedTimeItems()];
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
      return [...PREMIUM_BACKGROUNDS];
    case 'powerups': {
      // Combine boosters, utility items, and coins
      const boosters = BOOSTER_TYPES.map(booster => ({
        id: booster.id,
        name: booster.name,
        description: booster.description,
        category: 'powerups' as ShopCategory,
        coinPrice: booster.coinPrice,
        iapPrice: booster.iapPrice,
        icon: booster.id === 'focus_boost' ? 'lightning' : booster.id === 'super_boost' ? 'rocket' : 'calendar',
        rarity: (booster.id === 'weekly_pass' ? 'epic' : booster.id === 'super_boost' ? 'rare' : 'common') as 'common' | 'rare' | 'epic' | 'legendary',
      }));
      return [...boosters, ...UTILITY_ITEMS, ...COIN_PACKS];
    }
    case 'bundles':
      // All pet and background bundles
      return [...PET_BUNDLES, ...BACKGROUND_BUNDLES];
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
  { id: 'featured', name: 'Featured', icon: 'star' },
  { id: 'pets', name: 'Collection', icon: 'paw' },
  { id: 'bundles', name: 'Bundles', icon: 'gift' },
  { id: 'powerups', name: 'Power-Ups', icon: 'lightning' },
];
