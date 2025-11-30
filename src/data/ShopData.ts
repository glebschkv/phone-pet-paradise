import { BOOSTER_TYPES } from '@/hooks/useCoinBooster';
import { getCoinExclusiveAnimals } from './AnimalDatabase';

// ═══════════════════════════════════════════════════════════════════════════
// SHOP ITEM TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ShopCategory = 'featured' | 'pets' | 'customize' | 'powerups' | 'backgrounds' | 'badges' | 'utilities' | 'coins' | 'bundles';

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
  bundleId?: string; // If part of a bundle
}

// Sky Bundle Backgrounds - Individual backgrounds that come with the Sky Bundle
export const SKY_BUNDLE_BACKGROUNDS: PremiumBackground[] = [
  {
    id: 'bg-sky-islands',
    name: 'Sky Islands',
    description: 'Majestic rocky islands rising from calm waters under a serene sky.',
    category: 'backgrounds',
    coinPrice: 600,
    icon: '🏝️',
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
    icon: '🌊',
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
    icon: '☁️',
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
    icon: '✨',
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
    icon: '🌅',
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
    iapProductId: 'co.nomoinc.nomo.coins.starter',
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
    iapProductId: 'co.nomoinc.nomo.coins.value',
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
    iapProductId: 'co.nomoinc.nomo.coins.premium',
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
    iapProductId: 'co.nomoinc.nomo.coins.mega',
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
    iapProductId: 'co.nomoinc.nomo.bundle.starter',
    icon: '🎁',
    rarity: 'epic',
    contents: {
      coins: 1000,
      boosterId: 'focus_boost',
      characterId: 'white-hare', // Ghost Hare - epic tier unlock
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
    icon: '🎁',
    rarity: 'legendary',
    contents: {
      coins: 5000,
      boosterId: 'super_boost',
      characterId: 'mech-warrior', // Exclusive Mech Warrior
      badgeId: 'badge-gold-flame',
    },
    savings: '60%',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND BUNDLES (Purchasable with coins)
// ═══════════════════════════════════════════════════════════════════════════

export interface BackgroundBundle extends ShopItem {
  category: 'bundles';
  backgroundIds: string[];
  previewImages: string[];
  totalValue: number;
  savings: string;
}

export const BACKGROUND_BUNDLES: BackgroundBundle[] = [
  {
    id: 'bundle-sky-realms',
    name: 'Sky Realms Bundle',
    description: 'A collection of 5 breathtaking sky and ocean themed backgrounds.',
    category: 'bundles',
    coinPrice: 2000,
    icon: '🌤️',
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

export interface PetBundle extends ShopItem {
  category: 'bundles';
  petIds: string[];
  totalValue: number;
  savings: string;
}

export const PET_BUNDLES: PetBundle[] = [
  {
    id: 'bundle-cute-companions',
    name: 'Cute Companions Bundle',
    description: 'An adorable collection of the cutest pets! Includes House Cat, Baby Dragon, Loyal Doggo, Fluffy Pupper, and Little Lizard.',
    category: 'bundles',
    coinPrice: 3000,
    icon: '🐾',
    rarity: 'epic',
    petIds: ['house-cat', 'baby-dragon', 'doggo', 'doggo2', 'little-lizard'],
    totalValue: 4900, // 800+1500+800+1200+600
    savings: '39%',
  },
  {
    id: 'bundle-yokai-spirits',
    name: 'Yokai Spirits Bundle',
    description: 'Mystical spirits from Japanese folklore! Includes Kitsune Spirit, Karasu Tengu, and Yamabushi Tengu.',
    category: 'bundles',
    coinPrice: 8500,
    icon: '👺',
    rarity: 'legendary',
    petIds: ['kitsune', 'karasu-tengu', 'yamabush-tengu'],
    totalValue: 11500, // 4500+3500+3500
    savings: '26%',
  },
  {
    id: 'bundle-knights-order',
    name: 'Knights Order Bundle',
    description: 'The complete knight collection! Includes Silver Knight, Golden Knight, and Royal Knight.',
    category: 'bundles',
    coinPrice: 7000,
    icon: '⚔️',
    rarity: 'legendary',
    petIds: ['knight-silver', 'knight-gold', 'knight-royal'],
    totalValue: 9500, // 2000+3000+4500
    savings: '26%',
  },
  {
    id: 'bundle-elf-kingdom',
    name: 'Elf Kingdom Bundle',
    description: 'The complete elven court! Includes Elf Archer, Elf Mage, and Elf Warrior.',
    category: 'bundles',
    coinPrice: 5500,
    icon: '🏹',
    rarity: 'epic',
    petIds: ['elf-archer', 'elf-mage', 'elf-warrior'],
    totalValue: 7600, // 2000+2800+2800
    savings: '28%',
  },
  {
    id: 'bundle-undead-horde',
    name: 'Undead Horde Bundle',
    description: 'Rise the dead! Includes Zombie Walker, Zombie Sprinter, and Zombie Brute.',
    category: 'bundles',
    coinPrice: 3000,
    icon: '🧟',
    rarity: 'epic',
    petIds: ['zombie-walker', 'zombie-runner', 'zombie-brute'],
    totalValue: 4000, // 800+1200+2000
    savings: '25%',
  },
  {
    id: 'bundle-demon-legion',
    name: 'Demon Legion Bundle',
    description: 'Command the forces of darkness! Includes Demon Imp, Demon Warrior, and Demon Lord.',
    category: 'bundles',
    coinPrice: 7000,
    icon: '😈',
    rarity: 'legendary',
    petIds: ['demon-imp', 'demon-warrior', 'demon-lord'],
    totalValue: 9500, // 1500+3000+5000
    savings: '26%',
  },
  {
    id: 'bundle-mountain-dwarves',
    name: 'Mountain Dwarves Bundle',
    description: 'Masters of the mountain! Includes Dwarf Miner, Dwarf Warrior, and Dwarf King.',
    category: 'bundles',
    coinPrice: 4500,
    icon: '⛏️',
    rarity: 'epic',
    petIds: ['dwarf-miner', 'dwarf-warrior', 'dwarf-king'],
    totalValue: 6300, // 1000+1800+3500
    savings: '29%',
  },
  {
    id: 'bundle-holy-order',
    name: 'Holy Order Bundle',
    description: 'Blessed companions! Includes Holy Priest, Temple Monk, and Ancient Sage.',
    category: 'bundles',
    coinPrice: 5000,
    icon: '✝️',
    rarity: 'epic',
    petIds: ['priest-healer', 'priest-monk', 'priest-sage'],
    totalValue: 7000, // 2000+2000+3000
    savings: '29%',
  },
  {
    id: 'bundle-science-team',
    name: 'Science Team Bundle',
    description: 'Brilliant minds unite! Includes Lab Researcher, Mad Chemist, and Genius Inventor.',
    category: 'bundles',
    coinPrice: 3500,
    icon: '🔬',
    rarity: 'epic',
    petIds: ['scientist-researcher', 'scientist-chemist', 'scientist-genius'],
    totalValue: 5000, // 1000+1500+2500
    savings: '30%',
  },
  {
    id: 'bundle-medical-team',
    name: 'Medical Team Bundle',
    description: 'Ready to save lives! Includes Field Medic, Surgeon, and Medical Specialist.',
    category: 'bundles',
    coinPrice: 4500,
    icon: '🏥',
    rarity: 'epic',
    petIds: ['doctor-medic', 'doctor-surgeon', 'doctor-specialist'],
    totalValue: 6500, // 1500+2500+2500
    savings: '31%',
  },
  {
    id: 'bundle-explorers-guild',
    name: 'Explorers Guild Bundle',
    description: 'Adventure awaits! Includes Desert Raider, Jungle Survivalist, Mountain Climber, Arctic Explorer, and Sea Captain.',
    category: 'bundles',
    coinPrice: 6500,
    icon: '🧭',
    rarity: 'legendary',
    petIds: ['raider', 'survivalist-1', 'survivalist-2', 'survivalist-3', 'sea-captain'],
    totalValue: 9400, // 2000+1200+1500+2200+2500
    savings: '31%',
  },
  {
    id: 'bundle-young-heroes',
    name: 'Young Heroes Bundle',
    description: 'The next generation! Includes Young Adventurer, Little Explorer, and Young Dreamer.',
    category: 'bundles',
    coinPrice: 1500,
    icon: '🌟',
    rarity: 'rare',
    petIds: ['child-adventurer', 'child-explorer', 'child-dreamer'],
    totalValue: 2000, // 600+600+800
    savings: '25%',
  },
  {
    id: 'bundle-city-life',
    name: 'City Life Bundle',
    description: 'Urban professionals! Includes Business Man, Executive, Police Officer, and Police Detective.',
    category: 'bundles',
    coinPrice: 3200,
    icon: '🏙️',
    rarity: 'epic',
    petIds: ['city-businessman', 'city-executive', 'policeman', 'policewoman'],
    totalValue: 4500, // 800+1200+1000+1500
    savings: '29%',
  },
  {
    id: 'bundle-golden-legends',
    name: 'Golden Legends Bundle',
    description: 'The most majestic creatures! Includes Golden Fox and Kitsune Spirit.',
    category: 'bundles',
    coinPrice: 5500,
    icon: '✨',
    rarity: 'legendary',
    petIds: ['golden-fox', 'kitsune'],
    totalValue: 7000, // 2500+4500
    savings: '21%',
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
  { id: 'bundles', name: 'Bundles', icon: '🎁' },
  { id: 'customize', name: 'Customize', icon: '🎨' },
  { id: 'powerups', name: 'Power-Ups', icon: '⚡' },
];
