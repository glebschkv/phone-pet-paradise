export interface AnimalData {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel: number;
  description: string;
  abilities: string[];
  biome: string;
  spriteConfig?: {
    spritePath: string;
    frameCount: number;
    frameWidth: number;
    frameHeight: number;
    animationSpeed?: number;
    frameRow?: number; // Row index for multi-row sprite sheets (0-indexed)
  };
  // Coin-exclusive properties
  coinPrice?: number; // If set, this animal can only be purchased with coins
  isExclusive?: boolean; // Marks as shop-exclusive (not unlockable via XP)
}

export interface BiomeData {
  name: string;
  unlockLevel: number;
  description: string;
  animals: string[];
  backgroundImage?: string;
}

// Complete animal database with real sprite assets
export const ANIMAL_DATABASE: AnimalData[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MEADOW BIOME (Levels 0-4) - Starting area, friendly creatures
  // Background: Grassy Path
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hare',
    name: 'Meadow Hare',
    emoji: '🐰',
    rarity: 'common',
    unlockLevel: 0,
    description: 'Your first loyal companion! A swift and gentle hare that brings comfort and motivation to your focus sessions.',
    abilities: ['Quick Focus', 'Gentle Support', 'Speed Boost'],
    biome: 'Meadow',
    spriteConfig: {
      spritePath: '/assets/sprites/HARE_WALK.png',
      frameCount: 4, // 112px / 28px = 4 frames
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 10
    }
  },
  {
    id: 'bird',
    name: 'Songbird',
    emoji: '🐦',
    rarity: 'common',
    unlockLevel: 1,
    description: 'A cheerful bird that sings melodies to keep you focused and uplifted.',
    abilities: ['Melodic Focus', 'Sky View', 'Morning Song'],
    biome: 'Meadow',
    spriteConfig: {
      spritePath: '/assets/sprites/Bird_Fly.png',
      frameCount: 4, // 112px / 28px = 4 frames
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 12
    }
  },
  {
    id: 'lizard',
    name: 'Garden Lizard',
    emoji: '🦎',
    rarity: 'common',
    unlockLevel: 2,
    description: 'A nimble lizard that basks in the sun and brings warmth to your sessions.',
    abilities: ['Sun Focus', 'Quick Reflexes', 'Calm Energy'],
    biome: 'Meadow',
    spriteConfig: {
      spritePath: '/assets/sprites/Lizard_Walk.png',
      frameCount: 4, // 112px / 28px = 4 frames
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 8
    }
  },
  {
    id: 'horse',
    name: 'Wild Horse',
    emoji: '🐴',
    rarity: 'rare',
    unlockLevel: 3,
    description: 'A majestic horse with flowing mane, embodying freedom and determination.',
    abilities: ['Gallop Focus', 'Endurance', 'Wild Spirit'],
    biome: 'Meadow',
    spriteConfig: {
      spritePath: '/assets/sprites/Horse_Walk.png',
      frameCount: 6, // 432px / 72px = 6 frames
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 10
    }
  },
  {
    id: 'dude-monster',
    name: 'Friendly Monster',
    emoji: '👾',
    rarity: 'rare',
    unlockLevel: 4,
    description: 'A quirky and lovable monster that brings joy and playfulness to your focus time.',
    abilities: ['Happy Vibes', 'Playful Energy', 'Monster Boost'],
    biome: 'Meadow',
    spriteConfig: {
      spritePath: '/assets/sprites/DudeMonster_Walk2.png',
      frameCount: 6, // 192px / 32px = 6 frames
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUNSET BIOME (Levels 5-8) - Golden hour, warm creatures
  // Background: Windmill
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'camel',
    name: 'Desert Camel',
    emoji: '🐪',
    rarity: 'rare',
    unlockLevel: 5,
    description: 'A patient camel that traverses vast distances with unwavering determination.',
    abilities: ['Desert Endurance', 'Long Focus', 'Heat Resistance'],
    biome: 'Sunset',
    spriteConfig: {
      spritePath: '/assets/sprites/Camel_Walk.png',
      frameCount: 6, // 432px / 72px = 6 frames
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8
    }
  },
  {
    id: 'elk',
    name: 'Golden Elk',
    emoji: '🦌',
    rarity: 'epic',
    unlockLevel: 6,
    description: 'A magnificent elk with grand antlers, representing wisdom and grace.',
    abilities: ['Forest Wisdom', 'Majestic Presence', 'Golden Focus'],
    biome: 'Sunset',
    spriteConfig: {
      spritePath: '/assets/sprites/ELK_WALK.png',
      frameCount: 6, // 432px / 72px = 6 frames
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 9
    }
  },
  {
    id: 'turtle',
    name: 'Wise Turtle',
    emoji: '🐢',
    rarity: 'rare',
    unlockLevel: 7,
    description: 'A slow but steady turtle that teaches the value of patience and persistence.',
    abilities: ['Patient Focus', 'Shell Defense', 'Steady Progress'],
    biome: 'Sunset',
    spriteConfig: {
      spritePath: '/assets/sprites/Turtle_Walk.png',
      frameCount: 6, // 432px / 72px = 6 frames
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6
    }
  },
  {
    id: 'horse-jumping',
    name: 'Sunset Stallion',
    emoji: '🐎',
    rarity: 'epic',
    unlockLevel: 8,
    description: 'A powerful stallion that leaps over obstacles with grace and power.',
    abilities: ['Leap of Focus', 'Power Stride', 'Sunset Runner'],
    biome: 'Sunset',
    spriteConfig: {
      spritePath: '/assets/sprites/Horse_Jump.png',
      frameCount: 6, // 432px / 72px = 6 frames
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 11
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NIGHT BIOME (Levels 9-12) - Mysterious nocturnal creatures
  // Background: Purple Nightsky
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bear',
    name: 'Night Bear',
    emoji: '🐻',
    rarity: 'epic',
    unlockLevel: 9,
    description: 'A powerful bear that roams the night with strength and determination.',
    abilities: ['Bear Strength', 'Night Watch', 'Powerful Focus'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/Bear_Walk.png',
      frameCount: 6, // 432px / 72px = 6 frames
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8
    }
  },
  {
    id: 'snake',
    name: 'Shadow Serpent',
    emoji: '🐍',
    rarity: 'rare',
    unlockLevel: 10,
    description: 'A mysterious snake that moves silently through the darkness.',
    abilities: ['Stealth Focus', 'Silent Strike', 'Shadow Dance'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/SNAKE_Walk.png',
      frameCount: 4, // 192px / 48px = 4 frames
      frameWidth: 48,
      frameHeight: 48,
      animationSpeed: 9
    }
  },
  {
    id: 'white-hare',
    name: 'Ghost Hare',
    emoji: '🐇',
    rarity: 'epic',
    unlockLevel: 11,
    description: 'A mystical white hare that appears under the moonlight, bringing clarity and peace.',
    abilities: ['Moonlight Focus', 'Ghost Speed', 'Mystic Presence'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/Whitehare_Walk.png',
      frameCount: 4, // 112px / 28px = 4 frames
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 11
    }
  },
  {
    id: 'monster-happy',
    name: 'Night Sprite',
    emoji: '👻',
    rarity: 'rare',
    unlockLevel: 12,
    description: 'A cheerful spirit that dances in the moonlight, spreading joy.',
    abilities: ['Happy Dance', 'Night Joy', 'Sprite Magic'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/DudeMonster_Happy.png',
      frameCount: 6, // 192px / 32px = 6 frames
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OCEAN BIOME (Levels 13-18) - Deep sea creatures
  // Background: Ocean (CSS animated waves)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'shark',
    name: 'Ocean Shark',
    emoji: '🦈',
    rarity: 'epic',
    unlockLevel: 13,
    description: 'A focused predator of the deep with razor-sharp concentration.',
    abilities: ['Predator Focus', 'Ocean Power', 'Swift Strike'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/SHARK_Walk.png',
      frameCount: 6, // 576px / 96px = 6 frames
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 10
    }
  },
  {
    id: 'octopus',
    name: 'Mystic Octopus',
    emoji: '🐙',
    rarity: 'epic',
    unlockLevel: 14,
    description: 'An intelligent cephalopod with multiple tentacles for multitasking mastery.',
    abilities: ['Multi-Focus', 'Deep Wisdom', 'Ink Escape'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/OCTOPUS_Walk.png',
      frameCount: 6, // 576px / 96px = 6 frames
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 8
    }
  },
  {
    id: 'crab',
    name: 'Coral Crab',
    emoji: '🦀',
    rarity: 'rare',
    unlockLevel: 15,
    description: 'A colorful reef guardian that teaches sideways thinking.',
    abilities: ['Lateral Focus', 'Pincer Power', 'Reef Guard'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/CRAB_CRABWALK.png',
      frameCount: 6, // 576px / 96px = 6 frames
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 9
    }
  },
  {
    id: 'sea-turtle',
    name: 'Sea Turtle',
    emoji: '🐢',
    rarity: 'rare',
    unlockLevel: 16,
    description: 'An ancient sea turtle gliding through ocean currents with timeless grace.',
    abilities: ['Ocean Current', 'Ancient Wisdom', 'Gentle Glide'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/Turtle_Swim.png',
      frameCount: 6, // 432px / 72px = 6 frames
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 7
    }
  },
  {
    id: 'shark-hunter',
    name: 'Great Hunter',
    emoji: '🦈',
    rarity: 'legendary',
    unlockLevel: 17,
    description: 'The apex predator of the ocean, unstoppable in its pursuit.',
    abilities: ['Apex Focus', 'Hunting Instinct', 'Ocean Master'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/SHARK_Special.png',
      frameCount: 6, // 576px / 96px = 6 frames
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 11
    }
  },
  {
    id: 'octopus-wise',
    name: 'Deep Oracle',
    emoji: '🐙',
    rarity: 'legendary',
    unlockLevel: 18,
    description: 'A wise oracle from the deepest trenches, holding ancient knowledge.',
    abilities: ['Deep Knowledge', 'Oracle Vision', 'Tentacle Mastery'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/OCTOPUS_Special.png',
      frameCount: 6, // 576px / 96px = 6 frames
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 8
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FOREST BIOME (Levels 19-24) - Jungle creatures
  // Background: Jungle Island
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'jungle-bird',
    name: 'Tropical Bird',
    emoji: '🦜',
    rarity: 'rare',
    unlockLevel: 19,
    description: 'A vibrant tropical bird with colorful feathers and melodic songs.',
    abilities: ['Jungle Song', 'Tropical Flight', 'Color Dance'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/Bird_Fly.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 14
    }
  },
  {
    id: 'jungle-lizard',
    name: 'Rainforest Gecko',
    emoji: '🦎',
    rarity: 'epic',
    unlockLevel: 20,
    description: 'A colorful gecko that climbs the tallest jungle trees.',
    abilities: ['Climb Focus', 'Jungle Agility', 'Camouflage'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/Lizard_Walk.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 10
    }
  },
  {
    id: 'jungle-snake',
    name: 'Vine Snake',
    emoji: '🐍',
    rarity: 'epic',
    unlockLevel: 21,
    description: 'A slender snake that moves through jungle vines with precision.',
    abilities: ['Vine Dance', 'Jungle Stealth', 'Swift Coil'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/SNAKE_Walk.png',
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      animationSpeed: 10
    }
  },
  {
    id: 'forest-monster',
    name: 'Jungle Spirit',
    emoji: '🌿',
    rarity: 'legendary',
    unlockLevel: 22,
    description: 'A mystical forest spirit that protects the jungle and its inhabitants.',
    abilities: ['Forest Protection', 'Spirit Guide', 'Nature Focus'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/DudeMonster_Roll.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 9
    }
  },
  {
    id: 'jungle-turtle',
    name: 'Ancient Tortoise',
    emoji: '🐢',
    rarity: 'legendary',
    unlockLevel: 23,
    description: 'An ancient tortoise that has witnessed centuries of jungle history.',
    abilities: ['Ancient Wisdom', 'Slow Power', 'Time Focus'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/Turtle_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 5
    }
  },
  {
    id: 'jungle-hare',
    name: 'Forest Runner',
    emoji: '🐰',
    rarity: 'rare',
    unlockLevel: 24,
    description: 'A swift hare that dashes through the jungle underbrush.',
    abilities: ['Quick Dash', 'Forest Speed', 'Undergrowth Run'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/HARE_WALK.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 12
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SNOW BIOME (Levels 25-32) - Arctic and mountain creatures
  // Background: Sky Platform World / Rocky Back
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'arctic-hare',
    name: 'Arctic Hare',
    emoji: '🐇',
    rarity: 'rare',
    unlockLevel: 25,
    description: 'A pure white hare perfectly adapted to the frozen tundra.',
    abilities: ['Snow Camouflage', 'Ice Speed', 'Arctic Focus'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/Whitehare_Walk.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 11
    }
  },
  {
    id: 'mountain-elk',
    name: 'Mountain Elk',
    emoji: '🦌',
    rarity: 'epic',
    unlockLevel: 26,
    description: 'A powerful elk that roams the snowy mountain peaks.',
    abilities: ['Peak Power', 'Mountain Stride', 'Snow King'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/ELK_WALK.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8
    }
  },
  {
    id: 'polar-bear',
    name: 'Polar Bear',
    emoji: '🐻‍❄️',
    rarity: 'legendary',
    unlockLevel: 27,
    description: 'The mighty ruler of the arctic, a symbol of strength and endurance.',
    abilities: ['Arctic Strength', 'Ice Master', 'Polar Power'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/Bear_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 7
    }
  },
  {
    id: 'snow-horse',
    name: 'Frost Stallion',
    emoji: '🐴',
    rarity: 'legendary',
    unlockLevel: 28,
    description: 'A majestic stallion with a coat as white as freshly fallen snow.',
    abilities: ['Frost Gallop', 'Snow Trail', 'Winter Spirit'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/Horse_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 10
    }
  },
  {
    id: 'ice-crab',
    name: 'Glacier Crab',
    emoji: '🦀',
    rarity: 'epic',
    unlockLevel: 29,
    description: 'A hardy crab that survives in the coldest waters of the arctic.',
    abilities: ['Ice Pincer', 'Glacier Walk', 'Cold Armor'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/CRAB_CRABWALK.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 7
    }
  },
  {
    id: 'frost-spirit',
    name: 'Frost Spirit',
    emoji: '❄️',
    rarity: 'legendary',
    unlockLevel: 30,
    description: 'A playful spirit of winter that brings snow and magic wherever it goes.',
    abilities: ['Winter Magic', 'Frost Dance', 'Snow Blessing'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/DudeMonster_Slide.png',
      frameCount: 4, // 128px / 32px = 4 frames
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 11
    }
  },
  {
    id: 'ice-shark',
    name: 'Arctic Shark',
    emoji: '🦈',
    rarity: 'legendary',
    unlockLevel: 31,
    description: 'A fearsome shark that hunts beneath the frozen seas.',
    abilities: ['Ice Hunter', 'Frozen Strike', 'Arctic Predator'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/SHARK_Walk.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 9
    }
  },
  {
    id: 'snow-camel',
    name: 'Bactrian Camel',
    emoji: '🐫',
    rarity: 'epic',
    unlockLevel: 32,
    description: 'A two-humped camel adapted to the harsh cold of the mountain steppes.',
    abilities: ['Cold Endurance', 'Mountain Trek', 'Double Strength'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/Camel_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 7
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGENDARY TIER (Levels 33-40) - Ultimate creatures
  // Special rare variants with unique abilities
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'alpha-bear',
    name: 'Alpha Bear',
    emoji: '🐻',
    rarity: 'legendary',
    unlockLevel: 33,
    description: 'The ultimate alpha predator, commanding respect from all creatures.',
    abilities: ['Alpha Command', 'Ultimate Strength', 'Focus Master', 'Leader Aura'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/Bear_Attack.png',
      frameCount: 4, // 288px / 72px = 4 frames
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 10
    }
  },
  {
    id: 'mega-octopus',
    name: 'Kraken',
    emoji: '🐙',
    rarity: 'legendary',
    unlockLevel: 34,
    description: 'The legendary Kraken, master of the deep ocean and ancient wisdom.',
    abilities: ['Ocean Domination', 'Tentacle Master', 'Deep Sea King', 'Ancient Power'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/OCTOPUS_Attack1.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 9
    }
  },
  {
    id: 'mega-crab',
    name: 'Giant Crab',
    emoji: '🦀',
    rarity: 'legendary',
    unlockLevel: 35,
    description: 'A massive crab with impenetrable armor and crushing pincers.',
    abilities: ['Armor Master', 'Crushing Grip', 'Titan Defense', 'Ocean Guardian'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/CRAB_Special.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 8
    }
  },
  {
    id: 'mega-shark',
    name: 'Megalodon',
    emoji: '🦈',
    rarity: 'legendary',
    unlockLevel: 36,
    description: 'The prehistoric apex predator returns, dominating all seas.',
    abilities: ['Prehistoric Power', 'Ultimate Hunter', 'Sea Terror', 'Ancient Might'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/SHARK_Attack1.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 11
    }
  },
  {
    id: 'king-snake',
    name: 'Serpent King',
    emoji: '🐍',
    rarity: 'legendary',
    unlockLevel: 37,
    description: 'The ruler of all serpents, wielding hypnotic power and ancient wisdom.',
    abilities: ['Hypnotic Gaze', 'Serpent Command', 'Venom Master', 'Ancient Coil'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/SNAKE_Attack.png',
      frameCount: 6, // 288px / 48px = 6 frames
      frameWidth: 48,
      frameHeight: 48,
      animationSpeed: 10
    }
  },
  {
    id: 'celestial-bird',
    name: 'Phoenix',
    emoji: '🔥',
    rarity: 'legendary',
    unlockLevel: 38,
    description: 'A mythical bird reborn from flames, eternal and ever-powerful.',
    abilities: ['Eternal Flame', 'Rebirth', 'Sky Blaze', 'Immortal Focus'],
    biome: 'Sunset',
    spriteConfig: {
      spritePath: '/assets/sprites/Bird_Fly.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 16
    }
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    emoji: '🦄',
    rarity: 'legendary',
    unlockLevel: 39,
    description: 'A mythical horse with a magical horn, bringing pure focus and magic.',
    abilities: ['Pure Magic', 'Healing Light', 'Rainbow Trail', 'Legendary Grace'],
    biome: 'Meadow',
    spriteConfig: {
      spritePath: '/assets/sprites/Horse_Jump.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 12
    }
  },
  {
    id: 'cosmic-spirit',
    name: 'Cosmic Spirit',
    emoji: '✨',
    rarity: 'legendary',
    unlockLevel: 40,
    description: 'The ultimate companion - a cosmic being of pure focus energy and infinite power.',
    abilities: ['Cosmic Focus', 'Star Power', 'Universal Wisdom', 'Infinite Energy', 'Time Master'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/DudeMonster_Squat.png',
      frameCount: 4,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COIN-EXCLUSIVE CHARACTERS - Special animals only purchasable with coins
  // These cannot be unlocked through XP progression
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'golden-hare',
    name: 'Golden Hare',
    emoji: '🐰',
    rarity: 'epic',
    unlockLevel: 999, // Never unlocks via XP
    description: 'A mystical hare with a coat of pure gold, radiating prosperity and fortune.',
    abilities: ['Golden Touch', 'Luck Boost', 'Coin Magnet', 'Prosperity Aura'],
    biome: 'Meadow',
    coinPrice: 1500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/HARE_WALK.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 10
    }
  },
  {
    id: 'crystal-shark',
    name: 'Crystal Shark',
    emoji: '💎',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A magnificent shark made of living crystal, refracting light into rainbows.',
    abilities: ['Crystal Armor', 'Prism Strike', 'Diamond Focus', 'Gem Collector'],
    biome: 'Ocean',
    coinPrice: 3000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/SHARK_Walk.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 10
    }
  },
  {
    id: 'shadow-wolf',
    name: 'Shadow Wolf',
    emoji: '🐺',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A mysterious wolf that moves through shadows, guardian of the night.',
    abilities: ['Shadow Step', 'Night Vision', 'Pack Leader', 'Stealth Master'],
    biome: 'Night',
    coinPrice: 2500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Bear_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 9
    }
  },
  {
    id: 'ember-phoenix',
    name: 'Ember Phoenix',
    emoji: '🔥',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A blazing phoenix born from eternal flames, symbol of rebirth and power.',
    abilities: ['Flame Wing', 'Rebirth', 'Fire Trail', 'Ash Rising'],
    biome: 'Sunset',
    coinPrice: 4000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Bird_Fly.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 18
    }
  },
  {
    id: 'frost-dragon',
    name: 'Frost Dragon',
    emoji: '🐉',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'An ancient dragon of ice and snow, breathing blizzards and commanding winter.',
    abilities: ['Ice Breath', 'Blizzard Call', 'Frost Shield', 'Winter King'],
    biome: 'Snow',
    coinPrice: 5000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/SNAKE_Walk.png',
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      animationSpeed: 8
    }
  },
  {
    id: 'neon-octopus',
    name: 'Neon Octopus',
    emoji: '🦑',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A bioluminescent octopus glowing with electric colors from the deep abyss.',
    abilities: ['Neon Glow', 'Electric Pulse', 'Deep Light', 'Ink Flash'],
    biome: 'Ocean',
    coinPrice: 2000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/OCTOPUS_Walk.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 9
    }
  },
  {
    id: 'spirit-deer',
    name: 'Spirit Deer',
    emoji: '🦌',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A celestial deer with starlight antlers, guide of lost souls.',
    abilities: ['Star Guide', 'Spirit Walk', 'Celestial Light', 'Soul Comfort'],
    biome: 'Forest',
    coinPrice: 3500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/ELK_WALK.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8
    }
  },
  {
    id: 'rainbow-turtle',
    name: 'Rainbow Turtle',
    emoji: '🐢',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A magical turtle with a shell that shimmers in all colors of the rainbow.',
    abilities: ['Rainbow Shell', 'Color Shift', 'Prismatic Defense', 'Joy Spread'],
    biome: 'Meadow',
    coinPrice: 1800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Turtle_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6
    }
  },
  {
    id: 'void-serpent',
    name: 'Void Serpent',
    emoji: '🌑',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A serpent from the void between stars, embodying cosmic mystery.',
    abilities: ['Void Coil', 'Dark Matter', 'Space Warp', 'Cosmic Venom'],
    biome: 'Night',
    coinPrice: 4500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/SNAKE_Attack.png',
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      animationSpeed: 10
    }
  },
  {
    id: 'aurora-horse',
    name: 'Aurora Horse',
    emoji: '🌈',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A majestic horse with a mane of northern lights, galloping across the sky.',
    abilities: ['Aurora Trail', 'Sky Gallop', 'Light Dance', 'Dream Runner'],
    biome: 'Snow',
    coinPrice: 4000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Horse_Jump.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 11
    }
  }
];

// Biome configuration with background images
export const BIOME_DATABASE: BiomeData[] = [
  {
    name: 'Meadow',
    unlockLevel: 0,
    description: 'A peaceful grassy realm where your journey begins. Gentle creatures roam freely.',
    animals: ['hare', 'bird', 'lizard', 'horse', 'dude-monster'],
    backgroundImage: '/assets/worlds/GRASSYPATH.png'
  },
  {
    name: 'Sunset',
    unlockLevel: 5,
    description: 'Golden hour meadows bathed in warm evening light. Home to enduring travelers.',
    animals: ['camel', 'elk', 'turtle', 'horse-jumping'],
    backgroundImage: '/assets/worlds/WINDMILL.png'
  },
  {
    name: 'Night',
    unlockLevel: 9,
    description: 'A mystical moonlit realm where nocturnal creatures thrive under the stars.',
    animals: ['bear', 'snake', 'white-hare', 'monster-happy'],
    backgroundImage: '/assets/worlds/PURPLE_NIGHTSKY.png'
  },
  {
    name: 'Ocean',
    unlockLevel: 13,
    description: 'Serene ocean waters where mysterious aquatic friends await in the depths.',
    animals: ['shark', 'octopus', 'crab', 'sea-turtle', 'shark-hunter', 'octopus-wise']
  },
  {
    name: 'Forest',
    unlockLevel: 19,
    description: 'Deep enchanted jungle filled with ancient wisdom and colorful life.',
    animals: ['jungle-bird', 'jungle-lizard', 'jungle-snake', 'forest-monster', 'jungle-turtle', 'jungle-hare'],
    backgroundImage: '/assets/worlds/JUNGLE_ISLAND.png'
  },
  {
    name: 'Snow',
    unlockLevel: 25,
    description: 'A magical winter wonderland of snow-capped peaks and arctic adventures.',
    animals: ['arctic-hare', 'mountain-elk', 'polar-bear', 'snow-horse', 'ice-crab', 'frost-spirit', 'ice-shark', 'snow-camel'],
    backgroundImage: '/assets/worlds/SKYPLATFORM_WORLD.png'
  }
];

// Helper functions
export const getAnimalById = (id: string): AnimalData | undefined => {
  return ANIMAL_DATABASE.find(animal => animal.id === id);
};

export const getAnimalByName = (name: string): AnimalData | undefined => {
  return ANIMAL_DATABASE.find(animal => animal.name === name);
};

export const getAnimalByIdOrName = (identifier: string): AnimalData | undefined => {
  return ANIMAL_DATABASE.find(animal => animal.id === identifier || animal.name === identifier);
};

export const getAnimalsByBiome = (biomeName: string): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => animal.biome === biomeName);
};

export const getUnlockedAnimals = (currentLevel: number): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => animal.unlockLevel <= currentLevel);
};

export const getUnlockedBiomes = (currentLevel: number): BiomeData[] => {
  return BIOME_DATABASE.filter(biome => biome.unlockLevel <= currentLevel);
};

export const getAnimalsByRarity = (rarity: string): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => animal.rarity === rarity);
};

export const getNextUnlock = (currentLevel: number): AnimalData | BiomeData | null => {
  const nextAnimal = ANIMAL_DATABASE.find(animal => animal.unlockLevel === currentLevel + 1);
  if (nextAnimal) return nextAnimal;

  const nextBiome = BIOME_DATABASE.find(biome => biome.unlockLevel === currentLevel + 1);
  if (nextBiome) return nextBiome;

  return null;
};

export const getBiomeByName = (name: string): BiomeData | undefined => {
  return BIOME_DATABASE.find(biome => biome.name === name);
};

export const getTotalAnimals = (): number => {
  return ANIMAL_DATABASE.length;
};

export const getAnimalsCountByRarity = (): Record<string, number> => {
  return ANIMAL_DATABASE.reduce((acc, animal) => {
    acc[animal.rarity] = (acc[animal.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

// Flying animals (birds) that should appear in the sky instead of walking
const FLYING_ANIMAL_IDS = ['bird', 'jungle-bird', 'celestial-bird'];

export const isFlyingAnimal = (animalId: string): boolean => {
  return FLYING_ANIMAL_IDS.includes(animalId);
};

export const getFlyingAnimals = (animals: AnimalData[]): AnimalData[] => {
  return animals.filter(animal => FLYING_ANIMAL_IDS.includes(animal.id));
};

export const getGroundAnimals = (animals: AnimalData[]): AnimalData[] => {
  return animals.filter(animal => !FLYING_ANIMAL_IDS.includes(animal.id));
};

// Coin-exclusive animal helpers
export const getCoinExclusiveAnimals = (): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => animal.isExclusive === true);
};

export const getXPUnlockableAnimals = (): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => !animal.isExclusive);
};

export const isAnimalCoinExclusive = (animalId: string): boolean => {
  const animal = getAnimalById(animalId);
  return animal?.isExclusive === true;
};

export const getAnimalCoinPrice = (animalId: string): number | undefined => {
  const animal = getAnimalById(animalId);
  return animal?.coinPrice;
};
