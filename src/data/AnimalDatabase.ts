export interface AnimalData {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel: number;
  description: string;
  abilities: string[];
  biome: string;
  modelConfig?: {
    type: 'glb' | 'primitive';
    modelPath?: string;
    scale?: number;
    animationName?: string;
    fallbackToPrimitive?: boolean;
  };
}

export interface BiomeData {
  name: string;
  unlockLevel: number;
  description: string;
  animals: string[];
}

// Unified animal database that matches the XP system
export const ANIMAL_DATABASE: AnimalData[] = [
  {
    id: 'panda',
    name: 'Panda',
    emoji: '🐼',
    rarity: 'common',
    unlockLevel: 1,
    description: 'A calm bamboo-loving friend that inspires gentle focus.',
    abilities: ['Calm Focus', 'Gentle Strength'],
    biome: 'Meadow',
    modelConfig: {
      type: 'primitive',
      fallbackToPrimitive: true
    }
  },
  {
    id: 'fox',
    name: 'Fox',
    emoji: '🦊',
    rarity: 'rare',
    unlockLevel: 2,
    description: 'A clever forest fox, cunning and agile for focus sessions.',
    abilities: ['Quick Thinking', 'Agility Boost'],
    biome: 'Meadow',
    modelConfig: {
      type: 'primitive',
      fallbackToPrimitive: true
    }
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
    emoji: '🐰',
    rarity: 'common',
    unlockLevel: 3,
    description: 'A gentle meadow rabbit, perfect for peaceful focus.',
    abilities: ['Gentle Focus', 'Peaceful Mind'],
    biome: 'Meadow',
    modelConfig: {
      type: 'primitive',
      fallbackToPrimitive: true
    }
  },
  {
    id: 'deer',
    name: 'Deer',
    emoji: '🦌',
    rarity: 'common',
    unlockLevel: 4,
    description: 'A graceful woodland deer, bringing calm and serenity.',
    abilities: ['Grace', 'Serenity'],
    biome: 'Meadow',
    modelConfig: {
      type: 'primitive',
      fallbackToPrimitive: true
    }
  },
  {
    id: 'owl',
    name: 'Owl',
    emoji: '🦉',
    rarity: 'rare',
    unlockLevel: 5,
    description: 'A wise night owl, excellent for evening study sessions.',
    abilities: ['Night Focus', 'Wisdom', 'Silent Study'],
    biome: 'Meadow',
    modelConfig: {
      type: 'primitive',
      fallbackToPrimitive: true
    }
  },
  {
    id: 'bear',
    name: 'Bear',
    emoji: '🐻',
    rarity: 'epic',
    unlockLevel: 7,
    description: 'A powerful forest guardian with strength and determination.',
    abilities: ['Strength Focus', 'Endurance', 'Protection'],
    biome: 'Forest',
    modelConfig: {
      type: 'primitive',
      fallbackToPrimitive: true
    }
  },
  {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    rarity: 'rare',
    unlockLevel: 7,
    description: 'A loyal pack leader with fierce concentration.',
    abilities: ['Pack Leadership', 'Fierce Focus', 'Loyalty'],
    biome: 'Forest'
  },
  {
    id: 'eagle',
    name: 'Eagle',
    emoji: '🦅',
    rarity: 'epic',
    unlockLevel: 8,
    description: 'A majestic sky hunter with keen vision and focus.',
    abilities: ['Sharp Vision', 'Sky Focus', 'Leadership'],
    biome: 'Forest'
  },
  {
    id: 'turtle',
    name: 'Turtle',
    emoji: '🐢',
    rarity: 'common',
    unlockLevel: 9,
    description: 'An ancient wise turtle, perfect for long focus sessions.',
    abilities: ['Endurance', 'Patience', 'Ancient Wisdom'],
    biome: 'Ocean'
  },
  {
    id: 'dolphin',
    name: 'Dolphin',
    emoji: '🐬',
    rarity: 'rare',
    unlockLevel: 11,
    description: 'A playful ocean companion with intelligence and joy.',
    abilities: ['Joyful Focus', 'Intelligence', 'Playfulness'],
    biome: 'Ocean'
  },
  {
    id: 'whale',
    name: 'Whale',
    emoji: '🐋',
    rarity: 'epic',
    unlockLevel: 12,
    description: 'A magnificent ocean giant with deep wisdom.',
    abilities: ['Deep Focus', 'Ocean Wisdom', 'Peaceful Mind'],
    biome: 'Ocean'
  },
  {
    id: 'penguin',
    name: 'Penguin',
    emoji: '🐧',
    rarity: 'common',
    unlockLevel: 13,
    description: 'A cheerful arctic companion that thrives in challenges.',
    abilities: ['Persistence', 'Cold Focus', 'Community'],
    biome: 'Tundra'
  },
  {
    id: 'polar-bear',
    name: 'Polar Bear',
    emoji: '🐻‍❄️',
    rarity: 'epic',
    unlockLevel: 15,
    description: 'A mighty arctic predator with incredible endurance.',
    abilities: ['Arctic Strength', 'Extreme Focus', 'Survival'],
    biome: 'Tundra'
  },
  {
    id: 'arctic-fox',
    name: 'Arctic Fox',
    emoji: '🦊',
    rarity: 'rare',
    unlockLevel: 14,
    description: 'An adaptive arctic hunter with winter wisdom.',
    abilities: ['Adaptation', 'Winter Focus', 'Stealth'],
    biome: 'Tundra'
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    rarity: 'legendary',
    unlockLevel: 20,
    description: 'A mythical creature that brings powerful focus energy.',
    abilities: ['Fire Focus', 'Legendary Wisdom', 'Time Mastery', 'Ancient Power'],
    biome: 'Mountains'
  }
];

// Biome configuration
export const BIOME_DATABASE: BiomeData[] = [
  {
    name: 'Meadow',
    unlockLevel: 1,
    description: 'A peaceful starting realm where your journey begins.',
    animals: ['panda', 'fox', 'rabbit', 'deer', 'owl']
  },
  {
    name: 'Forest',
    unlockLevel: 5,
    description: 'A mystical forest realm filled with woodland creatures.',
    animals: ['bear', 'wolf', 'eagle']
  },
  {
    name: 'Ocean',
    unlockLevel: 10,
    description: 'Serene ocean depths where aquatic friends await.',
    animals: ['turtle', 'dolphin', 'whale']
  },
  {
    name: 'Tundra',
    unlockLevel: 15,
    description: 'Harsh arctic lands where the strongest companions thrive.',
    animals: ['penguin', 'arctic-fox', 'polar-bear']
  },
  {
    name: 'Mountains',
    unlockLevel: 20,
    description: 'Legendary peaks where mythical creatures dwell.',
    animals: ['dragon']
  },
  {
    name: 'Desert Dunes',
    unlockLevel: 25,
    description: 'Golden sands and ancient ruins under blazing suns.',
    animals: []
  },
  {
    name: 'Coral Reef',
    unlockLevel: 30,
    description: 'Vibrant underwater gardens teeming with life.',
    animals: []
  },
  {
    name: 'Mystic Forest',
    unlockLevel: 35,
    description: 'Enchanted groves glowing with ethereal light.',
    animals: []
  },
  {
    name: 'Alpine Peaks',
    unlockLevel: 40,
    description: 'Snowy cliffs and crystal-clear skies above the clouds.',
    animals: []
  },
  {
    name: 'Crystal Caves',
    unlockLevel: 45,
    description: 'Shimmering caverns echoing with ancient energy.',
    animals: []
  },
  {
    name: 'Celestial Isles',
    unlockLevel: 50,
    description: 'Floating islands among the stars—the ultimate realm.',
    animals: []
  }
];

// Helper functions
export const getAnimalById = (id: string): AnimalData | undefined => {
  return ANIMAL_DATABASE.find(animal => animal.id === id);
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