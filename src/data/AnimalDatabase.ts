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
  // Positioning adjustment for sprites with empty space
  groundOffset?: number; // Percentage offset from default ground position (negative = lower)
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
      frameCount: 4,
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
      frameCount: 4,
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
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 8
    }
  },
  {
    id: 'slime1',
    name: 'Shadow Slime',
    emoji: '🖤',
    rarity: 'rare',
    unlockLevel: 3,
    description: 'A mysterious dark slime with glowing red eyes that lurks in shadowy meadows.',
    abilities: ['Shadow Hop', 'Dark Shield', 'Stealth Bounce'],
    biome: 'Meadow',
    groundOffset: -18,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime1_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 64,
      frameHeight: 64,
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
      frameCount: 6,
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
      frameCount: 6,
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
      frameCount: 6,
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
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6
    }
  },
  {
    id: 'huge-mushroom',
    name: 'Forest Fungus',
    emoji: '🍄',
    rarity: 'epic',
    unlockLevel: 8,
    description: 'A mystical walking mushroom from the enchanted forest, spreading spores of focus.',
    abilities: ['Spore Cloud', 'Fungal Growth', 'Nature Bond'],
    biome: 'Sunset',
    spriteConfig: {
      spritePath: '/assets/sprites/HugeMushroom_walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NIGHT BIOME (Levels 9-12) - Mysterious nocturnal creatures
  // Background: Purple Nightsky
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bear',
    name: 'Polar Bear',
    emoji: '🐻‍❄️',
    rarity: 'epic',
    unlockLevel: 9,
    description: 'A majestic white bear from the frozen lands, embodying strength and resilience.',
    abilities: ['Arctic Strength', 'Ice Guard', 'Powerful Focus'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/Bear_Walk.png',
      frameCount: 6,
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
      frameCount: 4,
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
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 11
    }
  },
  {
    id: 'vampire-bat',
    name: 'Vampire Bat',
    emoji: '🦇',
    rarity: 'rare',
    unlockLevel: 12,
    description: 'A mysterious bat that swoops through the night sky, guardian of the darkness.',
    abilities: ['Night Flight', 'Echo Sense', 'Shadow Wing'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/VampireBat_walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FOREST BIOME (Levels 13-18) - Jungle creatures
  // Background: Jungle Island
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'goblin-king',
    name: 'Goblin King',
    emoji: '👑',
    rarity: 'rare',
    unlockLevel: 13,
    description: 'The mischievous ruler of the forest goblins, wise in the ways of nature.',
    abilities: ['Royal Command', 'Forest Trickery', 'Goblin Magic'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/GoblinKing_walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 9
    }
  },
  {
    id: 'slime2',
    name: 'Flame Slime',
    emoji: '🔥',
    rarity: 'epic',
    unlockLevel: 14,
    description: 'A fiery slime engulfed in flames, leaving a trail of embers wherever it bounces.',
    abilities: ['Flame Burst', 'Heat Wave', 'Ember Trail'],
    biome: 'Forest',
    groundOffset: -18,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime2_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 11
    }
  },
  {
    id: 'mech',
    name: 'Forest Mech',
    emoji: '🤖',
    rarity: 'epic',
    unlockLevel: 15,
    description: 'An ancient mechanical guardian awakened to protect the forest.',
    abilities: ['Iron Defense', 'Laser Focus', 'Power Core'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/Mech_walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8
    }
  },
  {
    id: 'horse',
    name: 'Wild Horse',
    emoji: '🐴',
    rarity: 'rare',
    unlockLevel: 16,
    description: 'A majestic horse with flowing mane, embodying freedom and determination.',
    abilities: ['Gallop Focus', 'Endurance', 'Wild Spirit'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/Horse_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 10
    }
  },
  {
    id: 'slime3',
    name: 'Ancient Slime',
    emoji: '🟣',
    rarity: 'legendary',
    unlockLevel: 17,
    description: 'A rare purple slime that has evolved over centuries, wielding mystical powers.',
    abilities: ['Mystic Bounce', 'Ancient Knowledge', 'Power Absorption'],
    biome: 'Forest',
    groundOffset: -18,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime3_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10
    }
  },
  {
    id: 'horse-jumping',
    name: 'Sunset Stallion',
    emoji: '🐎',
    rarity: 'epic',
    unlockLevel: 18,
    description: 'A powerful stallion that leaps over obstacles with grace and power.',
    abilities: ['Leap of Focus', 'Power Stride', 'Sunset Runner'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/Horse_Jump.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 11
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SNOW BIOME (Levels 19-26) - Arctic and mountain creatures
  // Background: Sky Platform World
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'metalshark',
    name: 'Metal Shark',
    emoji: '🦈',
    rarity: 'epic',
    unlockLevel: 20,
    description: 'A cybernetic shark enhanced with metal plating, apex predator of the frozen seas.',
    abilities: ['Steel Bite', 'Sonar Scan', 'Armored Rush'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/metalshark_Swim.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 10
    }
  },
  {
    id: 'ice-crab',
    name: 'Glacier Crab',
    emoji: '🦀',
    rarity: 'epic',
    unlockLevel: 22,
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
    id: 'dragon1',
    name: 'Fire Dragon',
    emoji: '🐉',
    rarity: 'legendary',
    unlockLevel: 23,
    description: 'A majestic dragon that breathes fire and commands the sky with ancient power.',
    abilities: ['Fire Breath', 'Dragon Flight', 'Ancient Roar', 'Flame Shield'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/DRAGON1_Walk.png',
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 12
    }
  },
  {
    id: 'frost-spirit',
    name: 'Frost Spirit',
    emoji: '❄️',
    rarity: 'legendary',
    unlockLevel: 24,
    description: 'A playful spirit of winter that brings snow and magic wherever it goes.',
    abilities: ['Winter Magic', 'Frost Dance', 'Snow Blessing'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/DudeMonster_Slide.png',
      frameCount: 4,
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
    unlockLevel: 25,
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
    id: 'slime-boss1',
    name: 'King Slime',
    emoji: '👑',
    rarity: 'epic',
    unlockLevel: 26,
    description: 'The massive ruler of all slimes, commanding respect with its enormous size.',
    abilities: ['Royal Bounce', 'Slime Army', 'Crown Shield', 'Mega Absorption'],
    biome: 'Snow',
    groundOffset: -12,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime_boss1_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGENDARY TIER (Levels 27-34) - Ultimate creatures
  // Special rare variants with unique abilities
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dragon2',
    name: 'Golden Dragon',
    emoji: '🐲',
    rarity: 'legendary',
    unlockLevel: 27,
    description: 'A radiant dragon with scales of pure gold, commanding light and prosperity.',
    abilities: ['Solar Breath', 'Golden Aura', 'Radiant Wings', 'Treasure Shield'],
    biome: 'Snow',
    spriteConfig: {
      spritePath: '/assets/sprites/DRAGON2_Walk.png',
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 12
    }
  },
  {
    id: 'mega-octopus',
    name: 'Kraken',
    emoji: '🐙',
    rarity: 'legendary',
    unlockLevel: 28,
    description: 'The legendary Kraken, master of the deep and ancient wisdom.',
    abilities: ['Deep Domination', 'Tentacle Master', 'Deep Sea King', 'Ancient Power'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/OCTOPUS_Walk.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 9
    }
  },
  {
    id: 'slime-boss2',
    name: 'Earth Slime',
    emoji: '🌿',
    rarity: 'legendary',
    unlockLevel: 29,
    description: 'A massive slime infused with nature, sprouting plants and leaves from its body.',
    abilities: ['Nature Growth', 'Root Shield', 'Verdant Wave', 'Forest Bond'],
    biome: 'Night',
    groundOffset: -12,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime_boss2_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'mega-crab',
    name: 'Giant Crab',
    emoji: '🦀',
    rarity: 'legendary',
    unlockLevel: 30,
    description: 'A massive crab with impenetrable armor and crushing pincers.',
    abilities: ['Armor Master', 'Crushing Grip', 'Titan Defense', 'Beach Guardian'],
    biome: 'Sunset',
    spriteConfig: {
      spritePath: '/assets/sprites/CRAB_Special.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 8
    }
  },
  {
    id: 'dragon3',
    name: 'Shadow Dragon',
    emoji: '🖤',
    rarity: 'legendary',
    unlockLevel: 31,
    description: 'A dragon of pure darkness, existing between dimensions and commanding shadow.',
    abilities: ['Shadow Breath', 'Void Step', 'Dark Wings', 'Nightmare Aura'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/DRAGON3_Walk.png',
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 12
    }
  },
  {
    id: 'king-snake',
    name: 'Serpent King',
    emoji: '🐍',
    rarity: 'legendary',
    unlockLevel: 32,
    description: 'The ruler of all serpents, wielding hypnotic power and ancient wisdom.',
    abilities: ['Hypnotic Gaze', 'Serpent Command', 'Venom Master', 'Ancient Coil'],
    biome: 'Night',
    spriteConfig: {
      spritePath: '/assets/sprites/SNAKE_Attack.png',
      frameCount: 6,
      frameWidth: 48,
      frameHeight: 48,
      animationSpeed: 10
    }
  },
  {
    id: 'slime-boss3',
    name: 'Divine Slime',
    emoji: '✨',
    rarity: 'legendary',
    unlockLevel: 33,
    description: 'A transcendent slime that has achieved divine status, radiating pure energy.',
    abilities: ['Divine Bounce', 'Celestial Split', 'Holy Shield', 'Purification'],
    biome: 'Meadow',
    groundOffset: -12,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime_boss3_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'cosmic-spirit',
    name: 'Cosmic Spirit',
    emoji: '🌟',
    rarity: 'legendary',
    unlockLevel: 34,
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
    id: 'flying-dragon',
    name: 'Sky Dragon',
    emoji: '🐉',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A magnificent dragon that soars through the clouds, master of the skies.',
    abilities: ['Cloud Dance', 'Sky Dominion', 'Wind Breath', 'Aerial Grace'],
    biome: 'Snow',
    coinPrice: 5000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/DRAGON1_Flight.png',
      frameCount: 6,
      frameWidth: 512,
      frameHeight: 256,
      animationSpeed: 8
    }
  },
  {
    id: 'fire-dragon',
    name: 'Inferno Dragon',
    emoji: '🔥',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A blazing dragon born from volcanic flames, embodying destructive beauty.',
    abilities: ['Inferno Breath', 'Lava Shield', 'Phoenix Rise', 'Eternal Flame'],
    biome: 'Sunset',
    coinPrice: 5500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/DRAGON2_Flight.png',
      frameCount: 6,
      frameWidth: 512,
      frameHeight: 256,
      animationSpeed: 8
    }
  },
  {
    id: 'frost-dragon',
    name: 'Frost Dragon',
    emoji: '❄️',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'An ancient dragon of ice and snow, breathing blizzards and commanding winter.',
    abilities: ['Ice Breath', 'Blizzard Call', 'Frost Shield', 'Winter King'],
    biome: 'Snow',
    coinPrice: 5500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/DRAGON3_Flight.png',
      frameCount: 6,
      frameWidth: 512,
      frameHeight: 256,
      animationSpeed: 8
    }
  },
  {
    id: 'mech-warrior',
    name: 'Mech Warrior',
    emoji: '🤖',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'An elite mechanical warrior with advanced combat systems and focus enhancers.',
    abilities: ['Laser Precision', 'Shield Matrix', 'Overclock', 'Target Lock'],
    biome: 'Forest',
    coinPrice: 4000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Mech_attack1.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Cute Creatures
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'house-cat',
    name: 'House Cat',
    emoji: '🐱',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A playful house cat with a curious spirit and a love for napping in sunny spots.',
    abilities: ['Cat Nap', 'Pounce', 'Curious Spirit', 'Purr Power'],
    biome: 'Meadow',
    coinPrice: 800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Cat_Walk.png',
      frameCount: 11,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'baby-dragon',
    name: 'Baby Dragon',
    emoji: '🐲',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'An adorable young dragon just learning to breathe fire and fly.',
    abilities: ['Baby Flames', 'Wing Flutter', 'Dragon Roar', 'Fire Sneeze'],
    biome: 'Forest',
    coinPrice: 1500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/BabyDragon_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'golden-fox',
    name: 'Golden Fox',
    emoji: '🦊',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A mystical fox with fur of pure gold, bringing fortune and wisdom.',
    abilities: ['Golden Luck', 'Swift Dash', 'Fortune Blessing', 'Fox Fire'],
    biome: 'Sunset',
    coinPrice: 2500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/GoldenFox_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'little-lizard',
    name: 'Little Lizard',
    emoji: '🦎',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A tiny dragon-like lizard with big dreams and a fiery personality.',
    abilities: ['Tiny Flames', 'Quick Dash', 'Scale Shield', 'Tail Whip'],
    biome: 'Forest',
    coinPrice: 600,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/LittleLizard_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'doggo',
    name: 'Loyal Doggo',
    emoji: '🐕',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A faithful companion always ready for adventure and belly rubs.',
    abilities: ['Fetch Focus', 'Loyal Heart', 'Happy Bark', 'Tail Wag'],
    biome: 'Meadow',
    coinPrice: 800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/doggo_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'doggo2',
    name: 'Fluffy Pupper',
    emoji: '🐶',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'An extra fluffy pup who brings joy wherever they bounce.',
    abilities: ['Fluff Power', 'Bounce Joy', 'Puppy Eyes', 'Cuddle Time'],
    biome: 'Meadow',
    coinPrice: 1200,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/doggo2_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Japanese Folklore (Yokai)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'kitsune',
    name: 'Kitsune Spirit',
    emoji: '🦊',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A mystical nine-tailed fox spirit from Japanese folklore with shapeshifting powers.',
    abilities: ['Fox Fire', 'Spirit Form', 'Illusion', 'Nine Tails'],
    biome: 'Night',
    coinPrice: 4500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Kitsune_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'karasu-tengu',
    name: 'Karasu Tengu',
    emoji: '🐦‍⬛',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A crow-like tengu warrior skilled in martial arts and sword fighting.',
    abilities: ['Crow Strike', 'Wind Slash', 'Shadow Step', 'Feather Storm'],
    biome: 'Night',
    coinPrice: 3500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/KarasuTengu_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'yamabush-tengu',
    name: 'Yamabushi Tengu',
    emoji: '👺',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A mountain hermit tengu with mystical powers and ancient wisdom.',
    abilities: ['Mountain Spirit', 'Leaf Dance', 'Wind Call', 'Mystic Staff'],
    biome: 'Forest',
    coinPrice: 3500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/YamabushTengu_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Fantasy Knights
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'knight-silver',
    name: 'Silver Knight',
    emoji: '⚔️',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A noble knight in gleaming silver armor, sworn to protect the realm.',
    abilities: ['Shield Bash', 'Honor Guard', 'Silver Strike', 'Royal Defense'],
    biome: 'Meadow',
    coinPrice: 2000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/knight1_Idle_2.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8
    }
  },
  {
    id: 'knight-gold',
    name: 'Golden Knight',
    emoji: '🏅',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'An elite knight adorned in golden armor, champion of tournaments.',
    abilities: ['Golden Strike', 'Champion Spirit', 'Power Attack', 'Glory Shield'],
    biome: 'Sunset',
    coinPrice: 3000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Knight3_Idle_2.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8
    }
  },
  {
    id: 'knight-royal',
    name: 'Royal Knight',
    emoji: '👑',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'The legendary commander of the Royal Guard, feared by enemies and revered by allies.',
    abilities: ['Royal Command', 'Invocation', 'Power Strike', 'Shield Wall'],
    biome: 'Snow',
    coinPrice: 4500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/KNIGHT2REAL_knight1_Idle_2.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Elves
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'elf-archer',
    name: 'Elf Archer',
    emoji: '🏹',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A skilled elven archer with unmatched precision and grace.',
    abilities: ['Arrow Rain', 'Forest Step', 'Eagle Eye', 'Nature Bond'],
    biome: 'Forest',
    coinPrice: 2000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/elf1_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'elf-mage',
    name: 'Elf Mage',
    emoji: '✨',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'An ancient elven mage wielding powerful nature magic.',
    abilities: ['Nature Spell', 'Arcane Shield', 'Forest Magic', 'Life Bloom'],
    biome: 'Forest',
    coinPrice: 2800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/elf2_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'elf-warrior',
    name: 'Elf Warrior',
    emoji: '⚔️',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A fierce elven warrior protecting the ancient forest realms.',
    abilities: ['Blade Dance', 'Elven Strength', 'Swift Strike', 'Forest Guardian'],
    biome: 'Forest',
    coinPrice: 2800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/elf3_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Undead & Demons
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'zombie-walker',
    name: 'Zombie Walker',
    emoji: '🧟',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A slow but relentless zombie with an insatiable hunger.',
    abilities: ['Relentless', 'Undead Strength', 'Shamble', 'Infection'],
    biome: 'Night',
    coinPrice: 800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/zombie1walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 7
    }
  },
  {
    id: 'zombie-runner',
    name: 'Zombie Sprinter',
    emoji: '🧟‍♂️',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A fast and terrifying zombie that runs down its prey.',
    abilities: ['Sprint', 'Frenzy', 'Undead Speed', 'Surprise Attack'],
    biome: 'Night',
    coinPrice: 1200,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/zombie2walk.png',
      frameCount: 7,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'zombie-brute',
    name: 'Zombie Brute',
    emoji: '💀',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A massive and powerful zombie with devastating strength.',
    abilities: ['Smash', 'Undead Rage', 'Thick Skin', 'Ground Pound'],
    biome: 'Night',
    coinPrice: 2000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/zombie3walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 7
    }
  },
  {
    id: 'demon-imp',
    name: 'Demon Imp',
    emoji: '👿',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A mischievous little demon causing chaos wherever it goes.',
    abilities: ['Fire Spark', 'Mischief', 'Dark Dash', 'Chaos'],
    biome: 'Night',
    coinPrice: 1500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/demon1_Walk.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'demon-warrior',
    name: 'Demon Warrior',
    emoji: '😈',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A fearsome demon wielding dark powers and unholy strength.',
    abilities: ['Dark Blade', 'Demon Fire', 'Shadow Form', 'Hell Strike'],
    biome: 'Night',
    coinPrice: 3000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/demon2_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'demon-lord',
    name: 'Demon Lord',
    emoji: '👹',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A powerful demon lord commanding legions of the underworld.',
    abilities: ['Infernal Command', 'Dark Aura', 'Hell Gate', 'Demon Army'],
    biome: 'Night',
    coinPrice: 5000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/demon3_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Dwarves
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dwarf-miner',
    name: 'Dwarf Miner',
    emoji: '⛏️',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A sturdy dwarf who spends days mining for precious gems.',
    abilities: ['Mine Strike', 'Gem Find', 'Stone Skin', 'Tunnel Vision'],
    biome: 'Snow',
    coinPrice: 1000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/dwarf1_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'dwarf-warrior',
    name: 'Dwarf Warrior',
    emoji: '🪓',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A battle-hardened dwarf wielding a mighty axe.',
    abilities: ['Axe Swing', 'Battle Cry', 'Iron Will', 'Dwarven Rage'],
    biome: 'Snow',
    coinPrice: 1800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/dwarf2_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'dwarf-king',
    name: 'Dwarf King',
    emoji: '👑',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'The mighty king of the mountain dwarves, ruler of underground kingdoms.',
    abilities: ['Royal Decree', 'Golden Axe', 'Mountain Lord', 'Dwarven Legacy'],
    biome: 'Snow',
    coinPrice: 3500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/dwarf3_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Priests & Clerics
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'priest-healer',
    name: 'Holy Priest',
    emoji: '✝️',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A devoted priest with powerful healing and blessing abilities.',
    abilities: ['Holy Light', 'Blessing', 'Divine Shield', 'Resurrection'],
    biome: 'Meadow',
    coinPrice: 2000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Priest1_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'priest-monk',
    name: 'Temple Monk',
    emoji: '🙏',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A peaceful monk from an ancient temple, master of meditation.',
    abilities: ['Inner Peace', 'Meditation', 'Spirit Palm', 'Tranquility'],
    biome: 'Forest',
    coinPrice: 2000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Priests2_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'priest-sage',
    name: 'Ancient Sage',
    emoji: '📿',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A wise sage who has studied the sacred texts for centuries.',
    abilities: ['Ancient Wisdom', 'Sacred Text', 'Spirit Guide', 'Enlightenment'],
    biome: 'Night',
    coinPrice: 3000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Priests3_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Scientists
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'scientist-researcher',
    name: 'Lab Researcher',
    emoji: '🔬',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A dedicated scientist always seeking new discoveries.',
    abilities: ['Research', 'Experiment', 'Discovery', 'Lab Analysis'],
    biome: 'Meadow',
    coinPrice: 1000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Scientist1_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'scientist-chemist',
    name: 'Mad Chemist',
    emoji: '🧪',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A slightly unhinged chemist with explosive experiments.',
    abilities: ['Chemical Mix', 'Explosion', 'Acid Splash', 'Smoke Bomb'],
    biome: 'Forest',
    coinPrice: 1500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Scientists2_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'scientist-genius',
    name: 'Genius Inventor',
    emoji: '💡',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A brilliant inventor who creates amazing gadgets and gizmos.',
    abilities: ['Invention', 'Gadget Deploy', 'Eureka', 'Tech Mastery'],
    biome: 'Snow',
    coinPrice: 2500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Scientists3_Walk.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - City People
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'city-businessman',
    name: 'Business Man',
    emoji: '💼',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A busy professional always on the move with important meetings.',
    abilities: ['Power Walk', 'Deadline Rush', 'Coffee Boost', 'Networking'],
    biome: 'Meadow',
    coinPrice: 800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/CityMen1_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'city-executive',
    name: 'Executive',
    emoji: '🎩',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A high-powered executive with excellent leadership skills.',
    abilities: ['Leadership', 'Decision Making', 'Strategic Mind', 'Authority'],
    biome: 'Meadow',
    coinPrice: 1200,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/CityMen3_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'doctor-medic',
    name: 'Field Medic',
    emoji: '🩺',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A skilled medic always ready to help those in need.',
    abilities: ['First Aid', 'Quick Heal', 'Medical Kit', 'Life Saver'],
    biome: 'Meadow',
    coinPrice: 1500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/doctor1_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'doctor-surgeon',
    name: 'Surgeon',
    emoji: '🏥',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A skilled surgeon with steady hands and nerves of steel.',
    abilities: ['Precision', 'Steady Hands', 'Emergency Care', 'Surgery'],
    biome: 'Forest',
    coinPrice: 2500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Doctor2_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'doctor-specialist',
    name: 'Medical Specialist',
    emoji: '⚕️',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A renowned specialist with expertise in rare conditions.',
    abilities: ['Expert Diagnosis', 'Specialist Care', 'Research', 'Treatment'],
    biome: 'Snow',
    coinPrice: 2500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Doctor3_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'policeman',
    name: 'Police Officer',
    emoji: '👮',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A dedicated officer keeping the streets safe for everyone.',
    abilities: ['Patrol', 'Law Enforcement', 'Quick Response', 'Protection'],
    biome: 'Meadow',
    coinPrice: 1000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/policeman1walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'policewoman',
    name: 'Police Detective',
    emoji: '🕵️‍♀️',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A sharp detective with excellent investigative skills.',
    abilities: ['Investigation', 'Deduction', 'Case Solving', 'Sharp Mind'],
    biome: 'Forest',
    coinPrice: 1500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/policewoman3walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Adventurers & Explorers
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'raider',
    name: 'Desert Raider',
    emoji: '🏜️',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A skilled raider who survives in the harshest desert conditions.',
    abilities: ['Sand Walker', 'Desert Survival', 'Quick Shot', 'Ambush'],
    biome: 'Sunset',
    coinPrice: 2000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Raider1_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'survivalist-1',
    name: 'Jungle Survivalist',
    emoji: '🌿',
    rarity: 'common',
    unlockLevel: 999,
    description: 'An expert in jungle survival with impressive tracking skills.',
    abilities: ['Tracking', 'Jungle Craft', 'Survival Instinct', 'Nature Bond'],
    biome: 'Forest',
    coinPrice: 1200,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/survivalist1walking.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'survivalist-2',
    name: 'Mountain Climber',
    emoji: '🧗',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A fearless climber who has conquered the highest peaks.',
    abilities: ['Climbing', 'Endurance', 'High Altitude', 'Peak Explorer'],
    biome: 'Snow',
    coinPrice: 1500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/suvivalist2walking.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'survivalist-3',
    name: 'Arctic Explorer',
    emoji: '🏔️',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A hardened explorer who thrives in the frozen wilderness.',
    abilities: ['Cold Resistance', 'Ice Navigation', 'Arctic Survival', 'Blizzard Walker'],
    biome: 'Snow',
    coinPrice: 2200,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/survivalist3walking.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'sea-captain',
    name: 'Sea Captain',
    emoji: '🚢',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A legendary captain who has sailed the seven seas.',
    abilities: ['Navigation', 'Sea Legs', 'Storm Rider', 'Captain Command'],
    biome: 'Sunset',
    coinPrice: 2500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/captain1walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Kids
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'child-adventurer',
    name: 'Young Adventurer',
    emoji: '🧒',
    rarity: 'common',
    unlockLevel: 999,
    description: 'A brave young adventurer with big dreams and endless curiosity.',
    abilities: ['Curiosity', 'Wonder', 'Imagination', 'Young Spirit'],
    biome: 'Meadow',
    coinPrice: 600,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/Child1walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'child-explorer',
    name: 'Little Explorer',
    emoji: '👧',
    rarity: 'common',
    unlockLevel: 999,
    description: 'An enthusiastic little explorer discovering the wonders of the world.',
    abilities: ['Discovery', 'Joy', 'Enthusiasm', 'Bright Eyes'],
    biome: 'Forest',
    coinPrice: 600,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/child3walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'child-dreamer',
    name: 'Young Dreamer',
    emoji: '🌟',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A creative young dreamer who sees magic in everything.',
    abilities: ['Dream Power', 'Creativity', 'Magic Sight', 'Hope'],
    biome: 'Night',
    coinPrice: 800,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/child4walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITES - Birds
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bluejay',
    name: 'Blue Jay',
    emoji: '🐦',
    rarity: 'rare',
    unlockLevel: 999,
    description: 'A vibrant blue jay with distinctive markings and a bold personality. Known for its intelligence and striking plumage.',
    abilities: ['Sky Dance', 'Blue Flash', 'Forest Call', 'Wing Gust'],
    biome: 'Meadow',
    coinPrice: 1200,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/BlueJay_Fly.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 12
    }
  },
];

// Biome configuration with background images
export const BIOME_DATABASE: BiomeData[] = [
  {
    name: 'Meadow',
    unlockLevel: 0,
    description: 'A peaceful grassy realm where your journey begins. Gentle creatures roam freely.',
    animals: ['hare', 'bird', 'lizard', 'slime1', 'dude-monster'],
    backgroundImage: '/assets/worlds/GRASSYPATH.png'
  },
  {
    name: 'Sunset',
    unlockLevel: 5,
    description: 'Golden hour meadows bathed in warm evening light. Home to enduring travelers.',
    animals: ['camel', 'elk', 'turtle', 'huge-mushroom'],
    backgroundImage: '/assets/worlds/WINDMILL.png'
  },
  {
    name: 'Night',
    unlockLevel: 9,
    description: 'A mystical moonlit realm where nocturnal creatures thrive under the stars.',
    animals: ['bear', 'snake', 'white-hare', 'vampire-bat'],
    backgroundImage: '/assets/worlds/PURPLE_NIGHTSKY.png'
  },
  {
    name: 'Forest',
    unlockLevel: 13,
    description: 'Deep enchanted jungle filled with ancient wisdom and colorful life.',
    animals: ['goblin-king', 'slime2', 'mech', 'horse', 'slime3', 'horse-jumping'],
    backgroundImage: '/assets/worlds/JUNGLE_ISLAND.png'
  },
  {
    name: 'Snow',
    unlockLevel: 19,
    description: 'A magical winter wonderland of snow-capped peaks and arctic adventures.',
    animals: ['metalshark', 'ice-crab', 'dragon1', 'frost-spirit', 'ice-shark', 'slime-boss1'],
    backgroundImage: '/assets/worlds/SKYPLATFORM_WORLD.png'
  },
  {
    name: 'City',
    unlockLevel: 24,
    description: 'A bustling urban landscape where nature meets civilization.',
    animals: [],
    backgroundImage: '/assets/worlds/CITYFORPEOPLE.png'
  },
  {
    name: 'Ruins',
    unlockLevel: 29,
    description: 'Ancient crumbling structures shrouded in mystery and forgotten secrets.',
    animals: [],
    backgroundImage: '/assets/worlds/RUINS.png'
  },
  {
    name: 'Deep Ocean',
    unlockLevel: 35,
    description: 'The mysterious depths of the ocean where legendary creatures dwell.',
    animals: [],
    backgroundImage: '/assets/worlds/DEEP_OCEAN.png'
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

// Flying animals (birds and bats) that should appear in the sky instead of walking
const FLYING_ANIMAL_IDS = ['bird', 'bluejay', 'vampire-bat', 'flying-dragon', 'fire-dragon', 'frost-dragon'];

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
