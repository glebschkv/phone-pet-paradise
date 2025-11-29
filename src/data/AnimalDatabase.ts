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
    name: 'Meadow Slime',
    emoji: '🟢',
    rarity: 'rare',
    unlockLevel: 3,
    description: 'A bouncy and cheerful slime that hops through the meadow spreading joy.',
    abilities: ['Bounce', 'Jelly Shield', 'Happy Hop'],
    biome: 'Meadow',
    groundOffset: -8,
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
    name: 'Night Bear',
    emoji: '🐻',
    rarity: 'epic',
    unlockLevel: 9,
    description: 'A powerful bear that roams the night with strength and determination.',
    abilities: ['Bear Strength', 'Night Watch', 'Powerful Focus'],
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
    name: 'Forest Slime',
    emoji: '🔵',
    rarity: 'epic',
    unlockLevel: 14,
    description: 'A blue slime that has adapted to the forest, more agile than its meadow cousin.',
    abilities: ['Forest Bounce', 'Camouflage', 'Rapid Split'],
    biome: 'Forest',
    groundOffset: -8,
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
    groundOffset: -8,
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
    id: 'arctic-hare',
    name: 'Arctic Hare',
    emoji: '🐇',
    rarity: 'rare',
    unlockLevel: 19,
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
    id: 'polar-bear',
    name: 'Polar Bear',
    emoji: '🐻‍❄️',
    rarity: 'legendary',
    unlockLevel: 21,
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
    groundOffset: -5,
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
    name: 'Ice Dragon',
    emoji: '🐲',
    rarity: 'legendary',
    unlockLevel: 27,
    description: 'An ancient dragon of frost and ice, commanding blizzards with a single breath.',
    abilities: ['Ice Breath', 'Blizzard Storm', 'Frozen Wings', 'Glacier Shield'],
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
    name: 'Emperor Slime',
    emoji: '👾',
    rarity: 'legendary',
    unlockLevel: 29,
    description: 'The ultimate evolution of slime-kind, wielding power beyond imagination.',
    abilities: ['Emperor Decree', 'Slime Tsunami', 'Absorption Field', 'Ultimate Split'],
    biome: 'Night',
    groundOffset: -5,
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
    groundOffset: -5,
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
    id: 'golden-hare',
    name: 'Golden Hare',
    emoji: '🐰',
    rarity: 'epic',
    unlockLevel: 999,
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
    biome: 'Snow',
    coinPrice: 3000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/metalshark_Swim.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 10
    }
  },
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
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 14
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
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 14
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
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 14
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
    biome: 'Night',
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
  },
  {
    id: 'royal-slime',
    name: 'Royal Slime',
    emoji: '👑',
    rarity: 'epic',
    unlockLevel: 999,
    description: 'A magnificent slime wearing a golden crown, commanding respect from all slime-kind.',
    abilities: ['Royal Bounce', 'Crown Shield', 'Slime Army', 'Mega Absorption'],
    biome: 'Snow',
    coinPrice: 2500,
    isExclusive: true,
    groundOffset: -5,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime_boss1_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 9
    }
  },
  {
    id: 'emperor-slime',
    name: 'Emperor Slime',
    emoji: '👾',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'The ultimate evolution of slime royalty, wielding power beyond imagination.',
    abilities: ['Emperor Decree', 'Slime Tsunami', 'Absorption Field', 'Ultimate Split'],
    biome: 'Night',
    coinPrice: 4500,
    isExclusive: true,
    groundOffset: -5,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime_boss2_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'divine-slime',
    name: 'Divine Slime',
    emoji: '✨',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A transcendent slime that has achieved divine status, radiating pure celestial energy.',
    abilities: ['Divine Bounce', 'Celestial Split', 'Holy Shield', 'Purification'],
    biome: 'Meadow',
    coinPrice: 6000,
    isExclusive: true,
    groundOffset: -5,
    spriteConfig: {
      spritePath: '/assets/sprites/Slime_boss3_Walk_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10
    }
  },
  {
    id: 'shadow-kraken',
    name: 'Shadow Kraken',
    emoji: '🦑',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A massive octopus shrouded in darkness, master of the abyssal depths.',
    abilities: ['Deep Domination', 'Tentacle Master', 'Ink Cloud', 'Ancient Power'],
    biome: 'Night',
    coinPrice: 5000,
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
    id: 'titan-crab',
    name: 'Titan Crab',
    emoji: '🦀',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'An enormous crab with impenetrable armor and devastating pincers.',
    abilities: ['Armor Master', 'Crushing Grip', 'Titan Defense', 'Beach Guardian'],
    biome: 'Sunset',
    coinPrice: 4000,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/CRAB_Special.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 8
    }
  },
  {
    id: 'arctic-predator',
    name: 'Arctic Predator',
    emoji: '🦈',
    rarity: 'legendary',
    unlockLevel: 999,
    description: 'A fearsome shark that hunts beneath the frozen seas, terror of the arctic.',
    abilities: ['Ice Hunter', 'Frozen Strike', 'Arctic Predator', 'Blizzard Bite'],
    biome: 'Snow',
    coinPrice: 3500,
    isExclusive: true,
    spriteConfig: {
      spritePath: '/assets/sprites/SHARK_Walk.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 9
    }
  }
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
    animals: ['arctic-hare', 'metalshark', 'polar-bear', 'ice-crab', 'dragon1', 'frost-spirit', 'ice-shark', 'slime-boss1'],
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

// Flying animals (birds and bats) that should appear in the sky instead of walking
const FLYING_ANIMAL_IDS = ['bird', 'vampire-bat', 'flying-dragon', 'fire-dragon', 'frost-dragon'];

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
