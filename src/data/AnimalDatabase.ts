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
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/sprout-bunny-walk.png',
      idleSprite: '/assets/sprites/meadow/sprout-bunny.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2
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
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/petal-puff-walk.png',
      idleSprite: '/assets/sprites/meadow/petal-puff.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2
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
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/honey-bee-walk.png',
      idleSprite: '/assets/sprites/meadow/honey-bee.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10,
      walkRows: 2
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
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/panda-walk.png',
      idleSprite: '/assets/sprites/meadow/panda.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 4
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
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/honey-bear-walk.png',
      idleSprite: '/assets/sprites/meadow/honey-bear.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 4
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
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/clover-cat-walk.png',
      idleSprite: '/assets/sprites/meadow/clover-cat.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2
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
    spriteConfig: {
      spritePath: '/assets/sprites/meadow/slime-king-walk.png',
      idleSprite: '/assets/sprites/meadow/slime-king.png',
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
    spriteConfig: {
      spritePath: '/assets/sprites/sunset/ember-fox-walk.png',
      idleSprite: '/assets/sprites/sunset/ember-fox.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 9
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
    spriteConfig: {
      spritePath: '/assets/sprites/sunset/dusk-owl-walk.png',
      idleSprite: '/assets/sprites/sunset/dusk-owl.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7
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
    spriteConfig: {
      spritePath: '/assets/sprites/sunset/golden-moth-walk.png',
      idleSprite: '/assets/sprites/sunset/golden-moth.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10
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
    spriteConfig: {
      spritePath: '/assets/sprites/night/luna-moth-walk.png',
      idleSprite: '/assets/sprites/night/luna-moth.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 2
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
    spriteConfig: {
      spritePath: '/assets/sprites/night/star-jelly-walk.png',
      idleSprite: '/assets/sprites/night/star-jelly.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6
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
    spriteConfig: {
      spritePath: '/assets/sprites/night/shadow-cat-walk.png',
      idleSprite: '/assets/sprites/night/shadow-cat.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
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
    spriteConfig: {
      spritePath: '/assets/sprites/night/cute-ghost-walk.png',
      idleSprite: '/assets/sprites/night/cute-ghost.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7
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
    spriteConfig: {
      spritePath: '/assets/sprites/night/kitsune-spirit-walk.png',
      idleSprite: '/assets/sprites/night/kitsune-spirit.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
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
    spriteConfig: {
      spritePath: '/assets/sprites/elemental/flame-spirit-walk.png',
      idleSprite: '/assets/sprites/elemental/flame-spirit.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 10,
      walkRows: 4
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
    spriteConfig: {
      spritePath: '/assets/sprites/elemental/aqua-spirit-walk.png',
      idleSprite: '/assets/sprites/elemental/aqua-spirit.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
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
      animationSpeed: 10
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
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/star-wizard-walk.png',
      idleSprite: '/assets/sprites/humanoid/star-wizard.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
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
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/mushroom-kid-walk.png',
      idleSprite: '/assets/sprites/humanoid/mushroom-kid.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
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
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/bunny-hood-walk.png',
      idleSprite: '/assets/sprites/humanoid/bunny-hood.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 9
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
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/flower-fairy-walk.png',
      idleSprite: '/assets/sprites/humanoid/flower-fairy.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
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
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/penguin-kid-walk.png',
      idleSprite: '/assets/sprites/humanoid/penguin-kid.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7,
      walkRows: 2
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
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/pirate-kid-walk.png',
      idleSprite: '/assets/sprites/humanoid/pirate-kid.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
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
    biome: 'Ruins',
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/dragon-knight-walk.png',
      idleSprite: '/assets/sprites/humanoid/dragon-knight.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
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
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/cat-hood-walk.png',
      idleSprite: '/assets/sprites/humanoid/cat-hood.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      walkRows: 4
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
    spriteConfig: {
      spritePath: '/assets/sprites/humanoid/robot-buddy-walk.png',
      idleSprite: '/assets/sprites/humanoid/robot-buddy.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OCEAN BIOME - Cute sea creatures and costume kids
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'crab-kid',
    name: 'Crab Kid',
    emoji: '🦀',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1200,
    isExclusive: true,
    description: 'A cute kid wearing an adorable orange crab costume with claws!',
    abilities: ['Claw Snap', 'Shell Shield', 'Tide Power'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/ocean/crab-kid.png',
      idleSprite: '/assets/sprites/ocean/crab-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6
    }
  },
  {
    id: 'shark-kid',
    name: 'Shark Kid',
    emoji: '🦈',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1200,
    isExclusive: true,
    description: 'A playful kid in a blue shark hoodie with a fin on top!',
    abilities: ['Shark Dash', 'Ocean Power', 'Fin Focus'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/ocean/shark-kid.png',
      idleSprite: '/assets/sprites/ocean/shark-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6
    }
  },
  {
    id: 'bubble-fish',
    name: 'Bubble Fish',
    emoji: '🐡',
    rarity: 'common',
    unlockLevel: 99,
    coinPrice: 600,
    isExclusive: true,
    description: 'A cute round pufferfish that floats around with bubbles.',
    abilities: ['Bubble Float', 'Puff Shield', 'Ocean Calm'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/ocean/bubble-fish.png',
      idleSprite: '/assets/sprites/ocean/bubble-fish.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 5
    }
  },
  {
    id: 'pearl-otter',
    name: 'Pearl Otter',
    emoji: '🦦',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1500,
    isExclusive: true,
    description: 'A cute sea otter holding a glowing pearl treasure.',
    abilities: ['Pearl Glow', 'Float Focus', 'Otter Joy'],
    biome: 'Ocean',
    spriteConfig: {
      spritePath: '/assets/sprites/ocean/pearl-otter.png',
      idleSprite: '/assets/sprites/ocean/pearl-otter.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SKY BIOME - Fluffy cloud creatures
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sheep-kid',
    name: 'Cloud Sheep Kid',
    emoji: '🐑',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1200,
    isExclusive: true,
    description: 'A sleepy kid in a fluffy white sheep costume made of clouds.',
    abilities: ['Cloud Float', 'Wool Shield', 'Dream Focus'],
    biome: 'Sky',
    spriteConfig: {
      spritePath: '/assets/sprites/sky/sheep-kid.png',
      idleSprite: '/assets/sprites/sky/sheep-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 5
    }
  },
  {
    id: 'rainbow-kid',
    name: 'Rainbow Bird Kid',
    emoji: '🌈',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 2000,
    isExclusive: true,
    description: 'A cheerful kid wearing a colorful rainbow bird costume with small wings.',
    abilities: ['Rainbow Power', 'Wing Flutter', 'Color Burst'],
    biome: 'Sky',
    spriteConfig: {
      spritePath: '/assets/sprites/sky/rainbow-kid.png',
      idleSprite: '/assets/sprites/sky/rainbow-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7
    }
  },
  {
    id: 'cloud-bunny',
    name: 'Cloud Bunny',
    emoji: '☁️',
    rarity: 'common',
    unlockLevel: 99,
    coinPrice: 800,
    isExclusive: true,
    description: 'A fluffy white bunny made entirely of soft clouds.',
    abilities: ['Cloud Hop', 'Fluffy Shield', 'Sky Float'],
    biome: 'Sky',
    spriteConfig: {
      spritePath: '/assets/sprites/sky/cloud-bunny.png',
      idleSprite: '/assets/sprites/sky/cloud-bunny.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 5
    }
  },
  {
    id: 'wind-sprite',
    name: 'Wind Sprite',
    emoji: '💨',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1500,
    isExclusive: true,
    description: 'A wispy wind elemental spirit with flowing ribbons.',
    abilities: ['Wind Dance', 'Breeze Boost', 'Air Flow'],
    biome: 'Sky',
    spriteConfig: {
      spritePath: '/assets/sprites/sky/wind-sprite.png',
      idleSprite: '/assets/sprites/sky/wind-sprite.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SWEET BIOME - Candy and dessert creatures
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'strawberry-kid',
    name: 'Strawberry Kid',
    emoji: '🍓',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1200,
    isExclusive: true,
    description: 'A sweet kid wearing a red strawberry costume with a green leaf hat.',
    abilities: ['Sweet Boost', 'Berry Shield', 'Fresh Focus'],
    biome: 'Sweet',
    spriteConfig: {
      spritePath: '/assets/sprites/sweet/strawberry-kid.png',
      idleSprite: '/assets/sprites/sweet/strawberry-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6
    }
  },
  {
    id: 'candy-kid',
    name: 'Candy Kid',
    emoji: '🍬',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1200,
    isExclusive: true,
    description: 'A happy kid wearing a pink and white candy swirl costume.',
    abilities: ['Sugar Rush', 'Candy Shield', 'Sweet Focus'],
    biome: 'Sweet',
    spriteConfig: {
      spritePath: '/assets/sprites/sweet/candy-kid.png',
      idleSprite: '/assets/sprites/sweet/candy-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7
    }
  },
  {
    id: 'macaron-cat',
    name: 'Macaron Cat',
    emoji: '🍪',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 2500,
    isExclusive: true,
    description: 'A cute cat shaped like a pastel pink macaron cookie.',
    abilities: ['Sweet Purr', 'Cookie Shield', 'Dessert Focus'],
    biome: 'Sweet',
    spriteConfig: {
      spritePath: '/assets/sprites/sweet/macaron-cat.png',
      idleSprite: '/assets/sprites/sweet/macaron-cat.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 5
    }
  },
  {
    id: 'honey-slime',
    name: 'Honey Slime',
    emoji: '🍯',
    rarity: 'common',
    unlockLevel: 99,
    coinPrice: 700,
    isExclusive: true,
    description: 'A golden honey-colored slime that drips with sweetness.',
    abilities: ['Honey Drip', 'Sticky Shield', 'Golden Focus'],
    biome: 'Sweet',
    spriteConfig: {
      spritePath: '/assets/sprites/sweet/honey-slime.png',
      idleSprite: '/assets/sprites/sweet/honey-slime.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 4
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MYTHICAL BIOME - Fantasy creatures
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'phoenix-kid',
    name: 'Phoenix Kid',
    emoji: '🔥',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 3000,
    isExclusive: true,
    description: 'A confident kid wearing an orange and red phoenix costume with flame feathers.',
    abilities: ['Flame Burst', 'Phoenix Rise', 'Fire Focus'],
    biome: 'Mythical',
    spriteConfig: {
      spritePath: '/assets/sprites/mythical/phoenix-kid.png',
      idleSprite: '/assets/sprites/mythical/phoenix-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8
    }
  },
  {
    id: 'leaf-dragon-kid',
    name: 'Leaf Dragon Kid',
    emoji: '🐲',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 3000,
    isExclusive: true,
    description: 'A curious kid wearing a green dragon costume covered in magical leaves.',
    abilities: ['Leaf Storm', 'Dragon Roar', 'Nature Focus'],
    biome: 'Mythical',
    spriteConfig: {
      spritePath: '/assets/sprites/mythical/leaf-dragon-kid.png',
      idleSprite: '/assets/sprites/mythical/leaf-dragon-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7
    }
  },
  {
    id: 'crystal-fox',
    name: 'Crystal Fox',
    emoji: '💎',
    rarity: 'legendary',
    unlockLevel: 99,
    coinPrice: 5000,
    isExclusive: true,
    description: 'A mystical fox made of shimmering blue and purple crystals.',
    abilities: ['Crystal Glow', 'Gem Shield', 'Prism Focus'],
    biome: 'Mythical',
    spriteConfig: {
      spritePath: '/assets/sprites/mythical/crystal-fox.png',
      idleSprite: '/assets/sprites/mythical/crystal-fox.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6
    }
  },
  {
    id: 'moon-bunny',
    name: 'Moon Bunny',
    emoji: '🌙',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1800,
    isExclusive: true,
    description: 'A glowing white rabbit with a crescent moon marking on its forehead.',
    abilities: ['Moon Glow', 'Lunar Shield', 'Night Focus'],
    biome: 'Mythical',
    spriteConfig: {
      spritePath: '/assets/sprites/mythical/moon-bunny.png',
      idleSprite: '/assets/sprites/mythical/moon-bunny.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 5
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COSMIC BIOME - Space and galaxy creatures
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'astro-kid',
    name: 'Astro Kid',
    emoji: '👨‍🚀',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 2800,
    isExclusive: true,
    description: 'An excited kid wearing a white space astronaut suit with a round helmet.',
    abilities: ['Space Jump', 'Orbit Shield', 'Zero-G Focus'],
    biome: 'Cosmic',
    spriteConfig: {
      spritePath: '/assets/sprites/cosmic/astro-kid.png',
      idleSprite: '/assets/sprites/cosmic/astro-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6
    }
  },
  {
    id: 'alien-kid',
    name: 'Alien Kid',
    emoji: '👽',
    rarity: 'rare',
    unlockLevel: 99,
    coinPrice: 1500,
    isExclusive: true,
    description: 'A friendly kid wearing a green alien costume with antennae.',
    abilities: ['Beam Power', 'UFO Shield', 'Cosmic Focus'],
    biome: 'Cosmic',
    spriteConfig: {
      spritePath: '/assets/sprites/cosmic/alien-kid.png',
      idleSprite: '/assets/sprites/cosmic/alien-kid.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 6
    }
  },
  {
    id: 'nebula-axolotl',
    name: 'Nebula Axolotl',
    emoji: '🌌',
    rarity: 'legendary',
    unlockLevel: 99,
    coinPrice: 5500,
    isExclusive: true,
    description: 'A cosmic axolotl with galaxy nebula colors of purple, pink, and blue.',
    abilities: ['Nebula Glow', 'Star Dust', 'Galaxy Focus'],
    biome: 'Cosmic',
    spriteConfig: {
      spritePath: '/assets/sprites/cosmic/nebula-axolotl.png',
      idleSprite: '/assets/sprites/cosmic/nebula-axolotl.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 5
    }
  },
  {
    id: 'comet-cat',
    name: 'Comet Cat',
    emoji: '☄️',
    rarity: 'epic',
    unlockLevel: 99,
    coinPrice: 3200,
    isExclusive: true,
    description: 'A magical cat with a glowing star trail tail like a comet.',
    abilities: ['Comet Dash', 'Star Trail', 'Cosmic Focus'],
    biome: 'Cosmic',
    spriteConfig: {
      spritePath: '/assets/sprites/cosmic/comet-cat.png',
      idleSprite: '/assets/sprites/cosmic/comet-cat.png',
      frameCount: 4,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 7
    }
  },
];

// Biome definitions
export const BIOME_DATABASE: BiomeData[] = [
  {
    name: 'Meadow',
    unlockLevel: 0,
    description: 'A peaceful meadow where your journey begins. Home to friendly creatures.',
    animals: ['dewdrop-frog', 'sprout-bunny', 'petal-puff', 'honey-bee', 'acorn-squirrel', 'panda', 'honey-bear', 'clover-cat', 'slime-king'],
    backgroundImage: '/assets/worlds/GRASSYPATH.png'
  },
  {
    name: 'Sunset',
    unlockLevel: 5,
    description: 'Golden fields bathed in warm sunset light.',
    animals: ['ember-fox', 'dusk-owl', 'golden-moth'],
    backgroundImage: '/assets/worlds/WINDMILL.png'
  },
  {
    name: 'Night',
    unlockLevel: 9,
    description: 'A mystical realm under the stars where nocturnal creatures thrive.',
    animals: ['luna-moth', 'star-jelly', 'shadow-cat', 'cute-ghost', 'kitsune-spirit'],
    backgroundImage: '/assets/worlds/PURPLE_NIGHTSKY.png'
  },
  {
    name: 'Forest',
    unlockLevel: 13,
    description: 'An enchanted forest where elemental spirits dwell.',
    animals: ['flame-spirit', 'aqua-spirit', 'storm-spirit'],
    backgroundImage: '/assets/worlds/JUNGLE_ISLAND.png'
  },
  {
    name: 'Snow',
    unlockLevel: 19,
    description: 'A winter wonderland of magical costume characters.',
    animals: ['star-wizard', 'mushroom-kid', 'bunny-hood', 'cat-hood'],
    backgroundImage: '/assets/worlds/SKYPLATFORM_WORLD.png'
  },
  {
    name: 'City',
    unlockLevel: 24,
    description: 'A bustling city where unique characters gather.',
    animals: ['flower-fairy', 'penguin-kid', 'pirate-kid', 'robot-buddy'],
    backgroundImage: '/assets/worlds/CITYFORPEOPLE.png'
  },
  {
    name: 'Ruins',
    unlockLevel: 29,
    description: 'Ancient ruins holding powerful warriors.',
    animals: ['dragon-knight'],
    backgroundImage: '/assets/worlds/RUINS.png'
  },
  // New themed biomes (Shop exclusive)
  {
    name: 'Ocean',
    unlockLevel: 99,
    description: 'A colorful underwater world filled with cute sea creatures.',
    animals: ['crab-kid', 'shark-kid', 'bubble-fish', 'pearl-otter'],
    backgroundImage: '/assets/worlds/GRASSYPATH.png'
  },
  {
    name: 'Sky',
    unlockLevel: 99,
    description: 'A fluffy cloud kingdom high above the world.',
    animals: ['sheep-kid', 'rainbow-kid', 'cloud-bunny', 'wind-sprite'],
    backgroundImage: '/assets/worlds/SKYPLATFORM_WORLD.png'
  },
  {
    name: 'Sweet',
    unlockLevel: 99,
    description: 'A magical candy land made of sweets and treats.',
    animals: ['strawberry-kid', 'candy-kid', 'macaron-cat', 'honey-slime'],
    backgroundImage: '/assets/worlds/WINDMILL.png'
  },
  {
    name: 'Mythical',
    unlockLevel: 99,
    description: 'An enchanted realm of fantasy creatures.',
    animals: ['phoenix-kid', 'leaf-dragon-kid', 'crystal-fox', 'moon-bunny'],
    backgroundImage: '/assets/worlds/PURPLE_NIGHTSKY.png'
  },
  {
    name: 'Cosmic',
    unlockLevel: 99,
    description: 'A galaxy far away filled with space explorers.',
    animals: ['astro-kid', 'alien-kid', 'nebula-axolotl', 'comet-cat'],
    backgroundImage: '/assets/worlds/JUNGLE_ISLAND.png'
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

// Flying/ground animal helpers for display purposes
// Currently no flying characters - all are ground-based
export const getFlyingAnimals = (animals: AnimalData[]): AnimalData[] => {
  // No flying animals in current character set
  return [];
};

export const getGroundAnimals = (animals: AnimalData[]): AnimalData[] => {
  // All current animals are ground-based
  return animals;
};
