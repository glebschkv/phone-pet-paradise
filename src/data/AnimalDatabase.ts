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
    spritePath: string;      // Walk animation sprite sheet
    idleSprite?: string;     // Static sprite for idle (front-facing)
    frameCount: number;
    frameWidth: number;
    frameHeight: number;
    animationSpeed?: number;
    frameRow?: number;       // Which row contains east-facing frames (0-indexed)
    walkRows?: number;       // Total rows in walk sprite (1, 2, or 4)
    facesLeft?: boolean;     // True if sprite naturally faces left (flip logic inverted)
  };
  // Coin-exclusive properties
  coinPrice?: number;
  isExclusive?: boolean;
  // Positioning adjustment
  groundOffset?: number;
}

export interface BiomeData {
  name: string;
  unlockLevel: number;
  description: string;
  animals: string[];
  backgroundImage?: string;
  groundLevel?: number; // Percentage from bottom where pets walk (default: 8)
}

// Complete animal database with new chibi pixel art characters
export const ANIMAL_DATABASE: AnimalData[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MEADOW BIOME (Levels 0-7) - Starting area, friendly creatures
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dewdrop-frog',
    name: 'Dewdrop Frog',
    emoji: '🐸',
    rarity: 'common',
    unlockLevel: 0,
    description: 'Your first companion! A cheerful frog with a dewdrop on its head that brings refreshing energy to your focus sessions.',
    abilities: ['Fresh Start', 'Dewdrop Shield', 'Hop Focus'],
    biome: 'Meadow',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/dewdrop-frog-walk.png',
      idleSprite: '/assets/sprites/meadow/dewdrop-frog.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2
    }
  },
  {
    id: 'sprout-bunny',
    name: 'Sprout Bunny',
    emoji: '🌱',
    rarity: 'common',
    unlockLevel: 1,
    description: 'A gentle bunny with a sprouting plant on its head, nurturing your growth with every session.',
    abilities: ['Growth Boost', 'Nature Bond', 'Gentle Hop'],
    biome: 'Meadow',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/sprout-bunny-walk.png',
      idleSprite: '/assets/sprites/meadow/sprout-bunny.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'petal-puff',
    name: 'Petal Puff',
    emoji: '🌸',
    rarity: 'common',
    unlockLevel: 2,
    description: 'A fluffy flower spirit that spreads petals of calm wherever it goes.',
    abilities: ['Petal Dance', 'Calm Aura', 'Bloom Power'],
    biome: 'Meadow',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/petal-puff-walk.png',
      idleSprite: '/assets/sprites/meadow/petal-puff.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'honey-bee',
    name: 'Honey Bee',
    emoji: '🐝',
    rarity: 'common',
    unlockLevel: 3,
    description: 'A busy little bee that buzzes with productive energy and sweet motivation.',
    abilities: ['Busy Buzz', 'Sweet Focus', 'Pollen Power'],
    biome: 'Meadow',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/honey-bee-walk.png',
      idleSprite: '/assets/sprites/meadow/honey-bee.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'acorn-squirrel',
    name: 'Acorn Squirrel',
    emoji: '🐿️',
    rarity: 'rare',
    unlockLevel: 4,
    description: 'A playful squirrel that saves up energy like acorns for when you need it most.',
    abilities: ['Acorn Stash', 'Quick Dash', 'Forest Friend'],
    biome: 'Meadow',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/acorn-squirrel-walk.png',
      idleSprite: '/assets/sprites/meadow/acorn-squirrel.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10,
      walkRows: 2
    }
  },
  {
    id: 'panda',
    name: 'Bamboo Panda',
    emoji: '🐼',
    rarity: 'rare',
    unlockLevel: 6,
    description: 'A zen panda that brings peace and balanced energy to your focus time.',
    abilities: ['Zen Focus', 'Bamboo Strength', 'Peaceful Mind'],
    biome: 'Meadow',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/panda-walk.png',
      idleSprite: '/assets/sprites/meadow/panda.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'honey-bear',
    name: 'Honey Bear',
    emoji: '🧸',
    rarity: 'rare',
    unlockLevel: 7,
    description: 'A cuddly bear that rewards your hard work with sweet honey motivation.',
    abilities: ['Honey Time', 'Bear Hug', 'Sweet Reward'],
    biome: 'Meadow',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/honey-bear-walk.png',
      idleSprite: '/assets/sprites/meadow/honey-bear.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 2,
      frameRow: 1
    }
  },
  // Meadow Shop Exclusives
  {
    id: 'clover-cat',
    name: 'Clover Cat',
    emoji: '🍀',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 800,
    isExclusive: true,
    description: 'A lucky cat with a four-leaf clover that brings fortune to your sessions.',
    abilities: ['Lucky Charm', 'Clover Shield', 'Fortune Focus'],
    biome: 'Meadow',
    groundOffset: -2.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/clover-cat-walk.png',
      idleSprite: '/assets/sprites/meadow/clover-cat.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'slime-king',
    name: 'Slime King',
    emoji: '👑',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 2000,
    isExclusive: true,
    description: 'The royal ruler of all slimes, bouncing with majestic energy.',
    abilities: ['Royal Bounce', 'Slime Shield', 'King\'s Focus'],
    biome: 'Meadow',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/slime-king-walk.png',
      idleSprite: '/assets/sprites/meadow/slime-king.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'frog-hood',
    name: 'Frog Hood',
    emoji: '🐸',
    rarity: 'common',
    unlockLevel: 5,
    description: 'A cheerful kid in an adorable green frog hoodie, hopping with joy and spreading happy vibes.',
    abilities: ['Froggy Hop', 'Lily Pad Shield', 'Ribbit Power'],
    biome: 'Meadow',
    groundOffset: -4.65,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/frog-hood-walk.png',
      idleSprite: '/assets/sprites/humanoid/frog-hood.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 4,
      frameRow: 1
    }
  },
  {
    id: 'bear-hood',
    name: 'Bear Hood',
    emoji: '🐻',
    rarity: 'common',
    unlockLevel: 6,
    description: 'A cozy kid in a warm brown bear hoodie, spreading comfort and fuzzy hugs.',
    abilities: ['Bear Hug', 'Honey Power', 'Cozy Nap'],
    biome: 'Meadow',
    groundOffset: -4.65,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/bear-hood-walk.png',
      idleSprite: '/assets/sprites/humanoid/bear-hood.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2
    }
  },
  {
    id: 'shark-hood',
    name: 'Shark Hood',
    emoji: '🦈',
    rarity: 'rare',
    unlockLevel: 8,
    description: 'A cool kid in a sleek blue shark hoodie, making waves wherever they go.',
    abilities: ['Shark Bite', 'Ocean Wave', 'Fin Dash'],
    biome: 'Sunset',
    groundOffset: -4.65,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/shark-hood-walk.png',
      idleSprite: '/assets/sprites/humanoid/shark-hood.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 4,
      frameRow: 1
    }
  },
  {
    id: 'dino-kid',
    name: 'Dino Kid',
    emoji: '🦖',
    rarity: 'rare',
    unlockLevel: 10,
    description: 'A fierce kid in a spiky green dinosaur costume, roaring with prehistoric power.',
    abilities: ['Dino Roar', 'Tail Whip', 'Stomp Attack'],
    biome: 'Forest',
    groundOffset: -4.65,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/dino-kid-walk.png',
      idleSprite: '/assets/sprites/humanoid/dino-kid.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUNSET BIOME (Levels 5, 8) - Golden hour creatures
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ember-fox',
    name: 'Ember Fox',
    emoji: '🦊',
    rarity: 'common',
    unlockLevel: 5,
    description: 'A warm fox with ember-colored fur that glows during sunset focus sessions.',
    abilities: ['Sunset Glow', 'Warm Focus', 'Fox Fire'],
    biome: 'Sunset',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/sunset/ember-fox-walk.png',
      idleSprite: '/assets/sprites/sunset/ember-fox.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 9,
      walkRows: 1
    }
  },
  {
    id: 'dusk-owl',
    name: 'Dusk Owl',
    emoji: '🦉',
    rarity: 'rare',
    unlockLevel: 8,
    description: 'A wise owl that awakens at dusk, bringing wisdom to your evening sessions.',
    abilities: ['Dusk Wisdom', 'Night Vision', 'Owl Focus'],
    biome: 'Sunset',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/sunset/dusk-owl-walk.png',
      idleSprite: '/assets/sprites/sunset/dusk-owl.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 1
    }
  },
  // Sunset Shop Exclusive
  {
    id: 'golden-moth',
    name: 'Golden Moth',
    emoji: '🦋',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 3000,
    isExclusive: true,
    description: 'A magnificent moth with golden wings that sparkle in the sunset light.',
    abilities: ['Golden Dust', 'Twilight Dance', 'Moth Glow'],
    biome: 'Sunset',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/sunset/golden-moth-walk.png',
      idleSprite: '/assets/sprites/sunset/golden-moth.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10,
      walkRows: 1
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NIGHT BIOME (Levels 9-11) - Mysterious nocturnal creatures
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'luna-moth',
    name: 'Luna Moth',
    emoji: '🌙',
    rarity: 'common',
    unlockLevel: 9,
    description: 'A mystical moth that dances under moonlight, bringing calm night focus.',
    abilities: ['Moonbeam', 'Night Flutter', 'Luna Shield'],
    biome: 'Night',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/night/luna-moth-walk.png',
      idleSprite: '/assets/sprites/night/luna-moth.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'star-jelly',
    name: 'Star Jelly',
    emoji: '⭐',
    rarity: 'rare',
    unlockLevel: 10,
    description: 'A translucent jellyfish that glows with starlight energy.',
    abilities: ['Star Glow', 'Jelly Float', 'Cosmic Calm'],
    biome: 'Night',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/night/star-jelly-walk.png',
      idleSprite: '/assets/sprites/night/star-jelly.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6,
      walkRows: 1
    }
  },
  {
    id: 'shadow-cat',
    name: 'Shadow Cat',
    emoji: '🐱',
    rarity: 'rare',
    unlockLevel: 11,
    description: 'A mysterious cat that blends with shadows, watching over your night sessions.',
    abilities: ['Shadow Step', 'Night Watch', 'Silent Focus'],
    biome: 'Night',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/night/shadow-cat-walk.png',
      idleSprite: '/assets/sprites/night/shadow-cat.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  // Night Shop Exclusives
  {
    id: 'cute-ghost',
    name: 'Cute Ghost',
    emoji: '👻',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 2500,
    isExclusive: true,
    description: 'A friendly ghost that floats alongside you, bringing supernatural focus.',
    abilities: ['Ghost Float', 'Boo Boost', 'Spirit Shield'],
    biome: 'Night',
    groundOffset: -2.85,
    spriteConfig: {
      spritePath: '/assets/sprites/night/cute-ghost-walk.png',
      idleSprite: '/assets/sprites/night/cute-ghost.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 1
    }
  },
  {
    id: 'kitsune-spirit',
    name: 'Kitsune Spirit',
    emoji: '🦊',
    rarity: 'legendary',
    unlockLevel: 99,
    coinPrice: 5000,
    isExclusive: true,
    description: 'A mystical nine-tailed fox spirit with ancient wisdom and magical powers.',
    abilities: ['Fox Fire', 'Spirit Wisdom', 'Nine Tails'],
    biome: 'Night',
    groundOffset: -2.85,
    spriteConfig: {
      spritePath: '/assets/sprites/night/kitsune-spirit-walk.png',
      idleSprite: '/assets/sprites/night/kitsune-spirit.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 1
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELEMENTAL (Levels 15, 18) - Elemental spirits
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'flame-spirit',
    name: 'Flame Spirit',
    emoji: '🔥',
    rarity: 'epic',
    unlockLevel: 15,
    description: 'A fiery spirit that burns with passionate focus and determination.',
    abilities: ['Fire Focus', 'Ember Shield', 'Blaze Power'],
    biome: 'Forest',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/elemental/flame-spirit-walk.png',
      idleSprite: '/assets/sprites/elemental/flame-spirit.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'aqua-spirit',
    name: 'Aqua Spirit',
    emoji: '💧',
    rarity: 'epic',
    unlockLevel: 18,
    description: 'A water spirit that flows with calm, refreshing energy.',
    abilities: ['Water Flow', 'Calm Waves', 'Aqua Shield'],
    biome: 'Forest',
    groundOffset: -3.85,
    spriteConfig: {
      spritePath: '/assets/sprites/elemental/aqua-spirit-walk.png',
      idleSprite: '/assets/sprites/elemental/aqua-spirit.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  // Elemental Shop Exclusive
  {
    id: 'storm-spirit',
    name: 'Storm Spirit',
    emoji: '⚡',
    rarity: 'legendary',
    unlockLevel: 99,
    coinPrice: 4500,
    isExclusive: true,
    description: 'A powerful lightning spirit that electrifies your focus sessions.',
    abilities: ['Thunder Strike', 'Storm Power', 'Lightning Focus'],
    biome: 'Forest',
    spriteConfig: {
      spritePath: '/assets/sprites/elemental/storm-spirit-walk.png',
      idleSprite: '/assets/sprites/elemental/storm-spirit.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10,
      walkRows: 1
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HUMANOID CHARACTERS (Various levels) - Cute costume characters
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'star-wizard',
    name: 'Star Wizard',
    emoji: '🧙',
    rarity: 'rare',
    unlockLevel: 12,
    description: 'A young wizard in training who casts spells of concentration.',
    abilities: ['Magic Focus', 'Star Spell', 'Wizard Wisdom'],
    biome: 'Snow',
    groundOffset: -2.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/star-wizard-walk.png',
      idleSprite: '/assets/sprites/humanoid/star-wizard.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  {
    id: 'mushroom-kid',
    name: 'Mushroom Kid',
    emoji: '🍄',
    rarity: 'common',
    unlockLevel: 13,
    description: 'A cheerful kid in a mushroom costume, spreading fun and focus.',
    abilities: ['Spore Shield', 'Mushroom Power', 'Fun Focus'],
    biome: 'Snow',
    groundOffset: -2.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/mushroom-kid-walk.png',
      idleSprite: '/assets/sprites/humanoid/mushroom-kid.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  {
    id: 'bunny-hood',
    name: 'Bunny Hood',
    emoji: '🐰',
    rarity: 'common',
    unlockLevel: 14,
    description: 'A cute kid wearing a bunny hood, hopping with enthusiasm.',
    abilities: ['Bunny Hop', 'Ear Power', 'Happy Bounce'],
    biome: 'Snow',
    groundOffset: -3.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/bunny-hood-walk.png',
      idleSprite: '/assets/sprites/humanoid/bunny-hood.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 9,
      walkRows: 1
    }
  },
  {
    id: 'flower-fairy',
    name: 'Flower Fairy',
    emoji: '🧚',
    rarity: 'rare',
    unlockLevel: 16,
    description: 'A magical fairy surrounded by flower petals and sparkles.',
    abilities: ['Fairy Dust', 'Flower Power', 'Magic Wings'],
    biome: 'City',
    groundOffset: -3.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/flower-fairy-walk.png',
      idleSprite: '/assets/sprites/humanoid/flower-fairy.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  {
    id: 'penguin-kid',
    name: 'Penguin Kid',
    emoji: '🐧',
    rarity: 'common',
    unlockLevel: 17,
    description: 'A kid in an adorable penguin costume, waddling with determination.',
    abilities: ['Waddle Walk', 'Ice Slide', 'Cool Focus'],
    biome: 'City',
    groundOffset: -3.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/penguin-kid-walk.png',
      idleSprite: '/assets/sprites/humanoid/penguin-kid.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'pirate-kid',
    name: 'Pirate Kid',
    emoji: '🏴‍☠️',
    rarity: 'rare',
    unlockLevel: 19,
    description: 'A young adventurer dressed as a pirate, seeking treasure and knowledge.',
    abilities: ['Treasure Hunt', 'Pirate Spirit', 'Adventure Focus'],
    biome: 'City',
    groundOffset: -2.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/pirate-kid-walk.png',
      idleSprite: '/assets/sprites/humanoid/pirate-kid.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  {
    id: 'dragon-knight',
    name: 'Dragon Knight',
    emoji: '🐉',
    rarity: 'epic',
    unlockLevel: 20,
    description: 'A brave knight in dragon armor, ready to conquer any challenge.',
    abilities: ['Dragon Fire', 'Knight Shield', 'Brave Focus'],
    biome: 'City',
    groundOffset: -3.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/dragon-knight-walk.png',
      idleSprite: '/assets/sprites/humanoid/dragon-knight.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  // Humanoid Shop Exclusives
  {
    id: 'cat-hood',
    name: 'Cat Hood',
    emoji: '😺',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1500,
    isExclusive: true,
    description: 'A playful kid in a cat hood costume, full of curiosity and energy.',
    abilities: ['Cat Nap', 'Meow Power', 'Curious Focus'],
    biome: 'Snow',
    groundOffset: -2.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/cat-hood-walk.png',
      idleSprite: '/assets/sprites/humanoid/cat-hood.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2,
      frameRow: 1
    }
  },
  {
    id: 'robot-buddy',
    name: 'Robot Buddy',
    emoji: '🤖',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 3500,
    isExclusive: true,
    description: 'A friendly robot companion programmed to maximize your productivity.',
    abilities: ['Power Mode', 'System Boost', 'Binary Focus'],
    biome: 'City',
    groundOffset: -2.5,
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/robot-buddy-walk.png',
      idleSprite: '/assets/sprites/humanoid/robot-buddy.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 1
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSIC SPRITES (128x128 detailed art style) - Restored from legacy
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'playful-cat',
    name: 'Playful Cat',
    emoji: '🐱',
    rarity: 'rare',
    unlockLevel: 21,
    description: 'A mischievous cat with silky fur who loves to jump and play during your focus sessions.',
    abilities: ['Cat Nap', 'Playful Pounce', 'Whisker Wisdom'],
    biome: 'Meadow',
    groundOffset: 0,
    spriteConfig: {
      spritePath: '/assets/sprites/Cat_Walk.png',
      frameCount: 11,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      walkRows: 1
    }
  },
  {
    id: 'mystic-kitsune',
    name: 'Mystic Kitsune',
    emoji: '🦊',
    rarity: 'epic',
    unlockLevel: 23,
    description: 'A mystical fox spirit with flowing tails that dances gracefully through your sessions.',
    abilities: ['Fox Magic', 'Spirit Dash', 'Mystic Leap'],
    biome: 'Night',
    groundOffset: 0,
    spriteConfig: {
      spritePath: '/assets/sprites/Kitsune_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      walkRows: 1
    }
  },
  {
    id: 'happy-doggo',
    name: 'Happy Doggo',
    emoji: '🐕',
    rarity: 'common',
    unlockLevel: 22,
    description: 'An energetic pup that jumps for joy and keeps your spirits high.',
    abilities: ['Tail Wag', 'Joyful Jump', 'Loyal Friend'],
    biome: 'Meadow',
    groundOffset: 0,
    spriteConfig: {
      spritePath: '/assets/sprites/doggo_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      walkRows: 1
    }
  },
  {
    id: 'spotted-doggo',
    name: 'Spotted Doggo',
    emoji: '🐶',
    rarity: 'rare',
    unlockLevel: 24,
    description: 'A spotted companion full of tricks and boundless energy.',
    abilities: ['Spot Power', 'Quick Dash', 'Friendly Bark'],
    biome: 'Meadow',
    groundOffset: -2.35,
    spriteConfig: {
      spritePath: '/assets/sprites/doggo2_Walk.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      walkRows: 1
    }
  },
  {
    id: 'dude-monster',
    name: 'Dude Monster',
    emoji: '👾',
    rarity: 'common',
    unlockLevel: 25,
    description: 'A cheerful blob monster that rolls and bounces with infectious happiness.',
    abilities: ['Happy Roll', 'Bounce Attack', 'Monster Hug'],
    biome: 'Forest',
    groundOffset: 0.5,
    spriteConfig: {
      spritePath: '/assets/sprites/DudeMonster_Walk2.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 10,
      walkRows: 1
    }
  },
  {
    id: 'wild-horse',
    name: 'Wild Horse',
    emoji: '🐴',
    rarity: 'rare',
    unlockLevel: 26,
    description: 'A majestic horse that gallops freely, bringing untamed energy to your focus.',
    abilities: ['Wild Gallop', 'Mane Power', 'Horse Leap'],
    biome: 'Sunset',
    groundOffset: -0.35,
    spriteConfig: {
      spritePath: '/assets/sprites/Horse_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 10,
      walkRows: 1
    }
  },
  {
    id: 'sea-turtle',
    name: 'Sea Turtle',
    emoji: '🐢',
    rarity: 'common',
    unlockLevel: 27,
    description: 'A wise turtle that swims through the currents of time with patience and grace.',
    abilities: ['Shell Shield', 'Ocean Wisdom', 'Calm Swim'],
    biome: 'Sunset',
    groundOffset: 0.5,
    spriteConfig: {
      spritePath: '/assets/sprites/Turtle_Walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  {
    id: 'vampire-bat',
    name: 'Vampire Bat',
    emoji: '🦇',
    rarity: 'rare',
    unlockLevel: 28,
    description: 'A mischievous bat that sneers playfully and brings spooky fun to night sessions.',
    abilities: ['Night Flight', 'Spooky Sneer', 'Echo Focus'],
    biome: 'Night',
    groundOffset: -0.35,
    spriteConfig: {
      spritePath: '/assets/sprites/VampireBat_walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 10,
      walkRows: 1
    }
  },
  {
    id: 'goblin-king',
    name: 'Goblin King',
    emoji: '👺',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 4000,
    isExclusive: true,
    description: 'The mischievous ruler of goblins who sneers at distraction and commands focus.',
    abilities: ['Royal Sneer', 'Goblin Command', 'King\'s Focus'],
    biome: 'City',
    groundOffset: -0.35,
    spriteConfig: {
      spritePath: '/assets/sprites/GoblinKing_walk.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8,
      walkRows: 1
    }
  },
  {
    id: 'golden-fox',
    name: 'Golden Fox',
    emoji: '🦊',
    rarity: 'epic',
    unlockLevel: 30,
    description: 'A magnificent fox with golden fur that shimmers with ancient wisdom.',
    abilities: ['Golden Glow', 'Fox Wisdom', 'Sunset Dash'],
    biome: 'Sunset',
    groundOffset: 0,
    spriteConfig: {
      spritePath: '/assets/sprites/GoldenFox_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      walkRows: 1
    }
  },
  {
    id: 'baby-dragon',
    name: 'Baby Dragon',
    emoji: '🐲',
    rarity: 'legendary',
    unlockLevel: 99,
    coinPrice: 6000,
    isExclusive: true,
    description: 'An adorable dragon hatchling with tiny wings and a fiery spirit.',
    abilities: ['Baby Flame', 'Dragon Roar', 'Hatchling Power'],
    biome: 'City',
    groundOffset: -2.35,
    spriteConfig: {
      spritePath: '/assets/sprites/BabyDragon_Walk.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      walkRows: 1
    }
  },
];

// Biome definitions with ground levels for pet positioning
export const BIOME_DATABASE: BiomeData[] = [
  {
    name: 'Meadow',
    unlockLevel: 0,
    description: 'A peaceful meadow where your journey begins. Home to friendly creatures.',
    animals: ['dewdrop-frog', 'sprout-bunny', 'petal-puff', 'honey-bee', 'acorn-squirrel', 'panda', 'honey-bear', 'clover-cat', 'slime-king', 'frog-hood', 'bear-hood', 'playful-cat', 'happy-doggo', 'spotted-doggo'],
    backgroundImage: '/assets/worlds/meadowbiome.png',
    groundLevel: 19
  },
  {
    name: 'Sunset',
    unlockLevel: 5,
    description: 'Golden fields bathed in warm sunset light.',
    animals: ['ember-fox', 'dusk-owl', 'golden-moth', 'shark-hood', 'wild-horse', 'sea-turtle', 'golden-fox'],
    backgroundImage: '/assets/worlds/autumnbiome1.png',
    groundLevel: 19
  },
  {
    name: 'Night',
    unlockLevel: 9,
    description: 'A mystical realm under the stars where nocturnal creatures thrive.',
    animals: ['luna-moth', 'star-jelly', 'shadow-cat', 'cute-ghost', 'kitsune-spirit', 'mystic-kitsune', 'vampire-bat'],
    backgroundImage: '/assets/worlds/NIGHT_LAVENDER.png',
    groundLevel: 19.4
  },
  {
    name: 'Forest',
    unlockLevel: 13,
    description: 'An enchanted forest where elemental spirits dwell.',
    animals: ['flame-spirit', 'aqua-spirit', 'storm-spirit', 'dino-kid', 'dude-monster'],
    backgroundImage: '/assets/worlds/junglerealbackground.png',
    groundLevel: 17.7
  },
  {
    name: 'Snow',
    unlockLevel: 19,
    description: 'A winter wonderland of magical costume characters.',
    animals: ['star-wizard', 'mushroom-kid', 'bunny-hood', 'cat-hood'],
    backgroundImage: '/assets/worlds/snowbiome1.png',
    groundLevel: 16.1
  },
  {
    name: 'City',
    unlockLevel: 24,
    description: 'A bustling city where unique characters gather.',
    animals: ['flower-fairy', 'penguin-kid', 'pirate-kid', 'robot-buddy'],
    backgroundImage: '/assets/worlds/CITY_NIGHT.png',
    groundLevel: 23
  }
];

// Helper functions
export const getAnimalById = (id: string): AnimalData | undefined => {
  return ANIMAL_DATABASE.find(animal => animal.id === id);
};

export const getAnimalsByBiome = (biome: string): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => animal.biome === biome);
};

export const getAnimalsByRarity = (rarity: AnimalData['rarity']): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => animal.rarity === rarity);
};

export const getUnlockableAnimals = (level: number): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => animal.unlockLevel <= level && !animal.isExclusive);
};

// Alias for getUnlockableAnimals (backward compatibility)
export const getUnlockedAnimals = getUnlockableAnimals;

// Get only XP-unlockable animals (excludes shop exclusives)
export const getXPUnlockableAnimals = (): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => !animal.isExclusive);
};

export const getShopExclusiveAnimals = (): AnimalData[] => {
  return ANIMAL_DATABASE.filter(animal => animal.isExclusive);
};

// Alias for backward compatibility
export const getCoinExclusiveAnimals = getShopExclusiveAnimals;

export const getBiomeByName = (name: string): BiomeData | undefined => {
  return BIOME_DATABASE.find(biome => biome.name === name);
};

export const getUnlockedBiomes = (level: number): BiomeData[] => {
  return BIOME_DATABASE.filter(biome => biome.unlockLevel <= level);
};

// Map theme names to biome names for ground level lookup
const THEME_TO_BIOME: Record<string, string> = {
  'day': 'Meadow',
  'sunset': 'Sunset',
  'night': 'Night',
  'forest': 'Forest',
  'snow': 'Snow',
  'city': 'City',
  'deepocean': 'Meadow', // Fallback
};

// Get ground level for a given background theme or image path
export const getGroundLevelForBackground = (background: string): number => {
  const DEFAULT_GROUND_LEVEL = 8;

  // Check if it's a theme name
  if (THEME_TO_BIOME[background]) {
    const biome = getBiomeByName(THEME_TO_BIOME[background]);
    return biome?.groundLevel ?? DEFAULT_GROUND_LEVEL;
  }

  // Check if it's a direct image path - try to match by filename
  if (background.startsWith('/assets/worlds/')) {
    const biome = BIOME_DATABASE.find(b => b.backgroundImage === background);
    if (biome?.groundLevel !== undefined) {
      return biome.groundLevel;
    }
  }

  return DEFAULT_GROUND_LEVEL;
};
