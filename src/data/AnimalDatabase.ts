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

// Unified animal database with GLB models
export const ANIMAL_DATABASE: AnimalData[] = [
  // MEADOW BIOME (Levels 1-4)
  {
    id: 'panda',
    name: 'Panda',
    emoji: '🐼',
    rarity: 'common',
    unlockLevel: 1,
    description: 'A calm bamboo-loving friend that inspires gentle focus.',
    abilities: ['Calm Focus', 'Gentle Strength'],
    biome: 'Meadow',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Panda.glb', scale: 0.9, animationName: 'Walk' }
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
    modelConfig: { type: 'glb', modelPath: '/assets/models/Fox.glb', scale: 0.4, animationName: 'Idle' }
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
    modelConfig: { type: 'glb', modelPath: '/assets/models/Rabbit.glb', scale: 0.5, animationName: 'Idle' }
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
    modelConfig: { type: 'glb', modelPath: '/assets/models/Deer.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'squirrel',
    name: 'Squirrel',
    emoji: '🐿️',
    rarity: 'common',
    unlockLevel: 5,
    description: 'An energetic squirrel that loves quick bursts of focus.',
    abilities: ['Energy Burst', 'Quick Focus'],
    biome: 'Meadow',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Squirrel.glb', scale: 0.6, animationName: 'Idle' }
  },

  // FOREST BIOME (Levels 6-9)
  {
    id: 'bear-grizzly',
    name: 'Grizzly Bear',
    emoji: '🐻',
    rarity: 'epic',
    unlockLevel: 6,
    description: 'A powerful forest guardian with strength and determination.',
    abilities: ['Strength Focus', 'Endurance', 'Protection'],
    biome: 'Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Bear Grizzly.glb', scale: 0.3, animationName: 'Idle' }
  },
  {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    rarity: 'rare',
    unlockLevel: 7,
    description: 'A loyal pack leader with fierce concentration.',
    abilities: ['Pack Leadership', 'Fierce Focus', 'Loyalty'],
    biome: 'Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Wolf.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'eagle',
    name: 'Eagle',
    emoji: '🦅',
    rarity: 'epic',
    unlockLevel: 8,
    description: 'A majestic sky hunter with keen vision and focus.',
    abilities: ['Sharp Vision', 'Sky Focus', 'Leadership'],
    biome: 'Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Eagle.glb', scale: 0.5, animationName: 'Idle' }
  },
  {
    id: 'boar',
    name: 'Boar',
    emoji: '🐗',
    rarity: 'rare',
    unlockLevel: 9,
    description: 'A determined forest dweller with relentless focus.',
    abilities: ['Determination', 'Forest Wisdom', 'Persistence'],
    biome: 'Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Boar.glb', scale: 0.35, animationName: 'Idle' }
  },

  // OCEAN BIOME (Levels 10-14)
  {
    id: 'dolphin',
    name: 'Dolphin',
    emoji: '🐬',
    rarity: 'rare',
    unlockLevel: 10,
    description: 'A playful ocean companion with intelligence and joy.',
    abilities: ['Joyful Focus', 'Intelligence', 'Playfulness'],
    biome: 'Ocean',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Dolphin.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'whale',
    name: 'Whale',
    emoji: '🐋',
    rarity: 'epic',
    unlockLevel: 11,
    description: 'A magnificent ocean giant with deep wisdom.',
    abilities: ['Deep Focus', 'Ocean Wisdom', 'Peaceful Mind'],
    biome: 'Ocean',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Whale.glb', scale: 0.25, animationName: 'Idle' }
  },
  {
    id: 'shark',
    name: 'Shark',
    emoji: '🦈',
    rarity: 'epic',
    unlockLevel: 12,
    description: 'A focused predator with razor-sharp concentration.',
    abilities: ['Predator Focus', 'Determination', 'Precision'],
    biome: 'Ocean',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Shark.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'octopus',
    name: 'Octopus',
    emoji: '🐙',
    rarity: 'rare',
    unlockLevel: 13,
    description: 'An intelligent sea creature with multi-tasking abilities.',
    abilities: ['Multi-Focus', 'Intelligence', 'Adaptability'],
    biome: 'Ocean',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Octopus.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'seahorse',
    name: 'Seahorse',
    emoji: '🐴',
    rarity: 'common',
    unlockLevel: 14,
    description: 'A graceful ocean dweller with patient focus.',
    abilities: ['Patience', 'Grace', 'Calm Waters'],
    biome: 'Ocean',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Seahorse.glb', scale: 0.6, animationName: 'Idle' }
  },

  // TUNDRA BIOME (Levels 15-19)
  {
    id: 'penguin',
    name: 'Penguin',
    emoji: '🐧',
    rarity: 'common',
    unlockLevel: 15,
    description: 'A cheerful arctic companion that thrives in challenges.',
    abilities: ['Persistence', 'Cold Focus', 'Community'],
    biome: 'Tundra',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Penguin.glb', scale: 0.5, animationName: 'Idle' }
  },
  {
    id: 'polar-bear',
    name: 'Polar Bear',
    emoji: '🐻‍❄️',
    rarity: 'epic',
    unlockLevel: 16,
    description: 'A mighty arctic predator with incredible endurance.',
    abilities: ['Arctic Strength', 'Extreme Focus', 'Survival'],
    biome: 'Tundra',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Bear Polar.glb', scale: 0.3, animationName: 'Idle' }
  },
  {
    id: 'seal',
    name: 'Seal',
    emoji: '🦭',
    rarity: 'rare',
    unlockLevel: 17,
    description: 'A playful arctic swimmer with endurance focus.',
    abilities: ['Endurance', 'Playful Focus', 'Ice Wisdom'],
    biome: 'Tundra',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Seal.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'walrus',
    name: 'Walrus',
    emoji: '🦭',
    rarity: 'epic',
    unlockLevel: 18,
    description: 'A massive arctic guardian with ancient wisdom.',
    abilities: ['Ancient Wisdom', 'Arctic Mastery', 'Deep Focus'],
    biome: 'Tundra',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Walrus.glb', scale: 0.3, animationName: 'Idle' }
  },
  {
    id: 'reindeer',
    name: 'Reindeer',
    emoji: '🦌',
    rarity: 'rare',
    unlockLevel: 19,
    description: 'A magical reindeer with seasonal focus powers.',
    abilities: ['Seasonal Focus', 'Magic Touch', 'Endurance'],
    biome: 'Tundra',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Reindeer.glb', scale: 0.35, animationName: 'Idle' }
  },

  // MOUNTAINS BIOME (Levels 20-24)
  {
    id: 'tiger',
    name: 'Tiger',
    emoji: '🐅',
    rarity: 'legendary',
    unlockLevel: 20,
    description: 'A powerful striped hunter with fierce concentration.',
    abilities: ['Fierce Focus', 'Hunter Instinct', 'Power Strike'],
    biome: 'Mountains',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Tiger.glb', scale: 0.35, animationName: 'Idle' }
  },
  {
    id: 'lion-male',
    name: 'Lion',
    emoji: '🦁',
    rarity: 'legendary',
    unlockLevel: 21,
    description: 'The king of beasts with majestic leadership focus.',
    abilities: ['Royal Focus', 'Leadership', 'Courage', 'Pride Power'],
    biome: 'Mountains',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Lion Male.glb', scale: 0.35, animationName: 'Idle' }
  },
  {
    id: 'elephant-male',
    name: 'Elephant',
    emoji: '🐘',
    rarity: 'legendary',
    unlockLevel: 22,
    description: 'A wise giant with incredible memory and focus.',
    abilities: ['Memory Master', 'Wisdom', 'Gentle Giant', 'Ancient Knowledge'],
    biome: 'Mountains',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Elephant Male.glb', scale: 0.25, animationName: 'Idle' }
  },
  {
    id: 'giraffe',
    name: 'Giraffe',
    emoji: '🦒',
    rarity: 'epic',
    unlockLevel: 23,
    description: 'A tall guardian with far-reaching vision and patience.',
    abilities: ['Far Sight', 'Patience', 'High Perspective'],
    biome: 'Mountains',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Giraffe.glb', scale: 0.25, animationName: 'Idle' }
  },
  {
    id: 'rhino',
    name: 'Rhino',
    emoji: '🦏',
    rarity: 'epic',
    unlockLevel: 24,
    description: 'An armored giant with unstoppable determination.',
    abilities: ['Unstoppable Focus', 'Armor Defense', 'Determination'],
    biome: 'Mountains',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Rhino.glb', scale: 0.3, animationName: 'Idle' }
  },

  // DESERT DUNES BIOME (Levels 25-29)
  {
    id: 'camel-dromedary',
    name: 'Camel',
    emoji: '🐪',
    rarity: 'epic',
    unlockLevel: 25,
    description: 'A desert survivor with incredible endurance and patience.',
    abilities: ['Desert Endurance', 'Heat Resistance', 'Long Focus'],
    biome: 'Desert Dunes',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Camel Dromedary.glb', scale: 0.35, animationName: 'Idle' }
  },
  {
    id: 'snake',
    name: 'Desert Snake',
    emoji: '🐍',
    rarity: 'rare',
    unlockLevel: 26,
    description: 'A stealthy desert predator with hypnotic focus.',
    abilities: ['Hypnotic Focus', 'Stealth', 'Patience'],
    biome: 'Desert Dunes',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Snake.glb', scale: 0.5, animationName: 'Idle' }
  },
  {
    id: 'spider',
    name: 'Desert Spider',
    emoji: '🕷️',
    rarity: 'rare',
    unlockLevel: 27,
    description: 'A patient web-weaver with intricate focus patterns.',
    abilities: ['Web Focus', 'Patience', 'Precision'],
    biome: 'Desert Dunes',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Spider.glb', scale: 0.6, animationName: 'Idle' }
  },
  {
    id: 'rat',
    name: 'Desert Rat',
    emoji: '🐀',
    rarity: 'common',
    unlockLevel: 28,
    description: 'A resourceful survivor with quick thinking.',
    abilities: ['Quick Thinking', 'Resourcefulness', 'Survival'],
    biome: 'Desert Dunes',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Rat.glb', scale: 0.5, animationName: 'Idle' }
  },
  {
    id: 'vulture',
    name: 'Vulture',
    emoji: '🦅',
    rarity: 'epic',
    unlockLevel: 29,
    description: 'A patient desert soarer with keen observation.',
    abilities: ['Sky Patrol', 'Patience', 'Sharp Eyes'],
    biome: 'Desert Dunes',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Vulture.glb', scale: 0.4, animationName: 'Idle' }
  },

  // CORAL REEF BIOME (Levels 30-34)
  {
    id: 'crab',
    name: 'Coral Crab',
    emoji: '🦀',
    rarity: 'common',
    unlockLevel: 30,
    description: 'A colorful reef guardian with sideways thinking.',
    abilities: ['Lateral Thinking', 'Reef Guardian', 'Defense'],
    biome: 'Coral Reef',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Crab.glb', scale: 0.5, animationName: 'Idle' }
  },
  {
    id: 'fish',
    name: 'Tropical Fish',
    emoji: '🐟',
    rarity: 'common',
    unlockLevel: 31,
    description: 'A vibrant reef fish with flowing focus.',
    abilities: ['Flow State', 'Colorful Mind', 'School Focus'],
    biome: 'Coral Reef',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Fish.glb', scale: 0.6, animationName: 'Idle' }
  },
  {
    id: 'starfish',
    name: 'Starfish',
    emoji: '⭐',
    rarity: 'rare',
    unlockLevel: 32,
    description: 'A patient reef dweller with regenerative focus.',
    abilities: ['Regenerative Focus', 'Star Power', 'Patience'],
    biome: 'Coral Reef',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Starfish.glb', scale: 0.6, animationName: 'Idle' }
  },
  {
    id: 'squid',
    name: 'Squid',
    emoji: '🦑',
    rarity: 'epic',
    unlockLevel: 33,
    description: 'An intelligent cephalopod with jet-powered focus.',
    abilities: ['Jet Focus', 'Intelligence', 'Camouflage'],
    biome: 'Coral Reef',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Squid.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'jellyfish',
    name: 'Jellyfish',
    emoji: '🪼',
    rarity: 'rare',
    unlockLevel: 34,
    description: 'A graceful drifter with flowing meditation.',
    abilities: ['Flow Meditation', 'Grace', 'Gentle Power'],
    biome: 'Coral Reef',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Jellyfish.glb', scale: 0.4, animationName: 'Idle' }
  },

  // MYSTIC FOREST BIOME (Levels 35-39)
  {
    id: 'horse-unicorn',
    name: 'Unicorn',
    emoji: '🦄',
    rarity: 'legendary',
    unlockLevel: 35,
    description: 'A mythical unicorn with pure magical focus energy.',
    abilities: ['Pure Focus', 'Magic Touch', 'Healing Aura', 'Legendary Grace'],
    biome: 'Mystic Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Horse.glb', scale: 0.35, animationName: 'Idle' }
  },
  {
    id: 'parrot',
    name: 'Mystic Parrot',
    emoji: '🦜',
    rarity: 'rare',
    unlockLevel: 36,
    description: 'A wise talking bird with memory enhancement.',
    abilities: ['Memory Echo', 'Wisdom Voice', 'Color Focus'],
    biome: 'Mystic Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Parrot.glb', scale: 0.5, animationName: 'Idle' }
  },
  {
    id: 'chimpanzee',
    name: 'Forest Sage',
    emoji: '🐵',
    rarity: 'epic',
    unlockLevel: 37,
    description: 'An intelligent primate with problem-solving focus.',
    abilities: ['Problem Solving', 'Intelligence', 'Forest Wisdom'],
    biome: 'Mystic Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Chimpanzee.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'dove',
    name: 'Spirit Dove',
    emoji: '🕊️',
    rarity: 'rare',
    unlockLevel: 38,
    description: 'A peaceful spirit guide with pure focus energy.',
    abilities: ['Peace Focus', 'Spirit Guide', 'Pure Energy'],
    biome: 'Mystic Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Dove.glb', scale: 0.5, animationName: 'Idle' }
  },
  {
    id: 'cat',
    name: 'Shadow Cat',
    emoji: '🐈‍⬛',
    rarity: 'epic',
    unlockLevel: 39,
    description: 'A mystical feline with stealth and intuition.',
    abilities: ['Stealth Focus', 'Intuition', 'Nine Lives'],
    biome: 'Mystic Forest',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Cat.glb', scale: 0.5, animationName: 'Idle' }
  },

  // ALPINE PEAKS BIOME (Levels 40-44)
  {
    id: 'goat',
    name: 'Mountain Goat',
    emoji: '🐐',
    rarity: 'epic',
    unlockLevel: 40,
    description: 'A sure-footed climber with peak performance focus.',
    abilities: ['Peak Performance', 'Sure Footed', 'Mountain Wisdom'],
    biome: 'Alpine Peaks',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Goat.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'bear-grizzly-wild',
    name: 'Alpine Bear',
    emoji: '🐻',
    rarity: 'legendary',
    unlockLevel: 41,
    description: 'A wild mountain bear with untamed focus power.',
    abilities: ['Wild Focus', 'Mountain Strength', 'Untamed Power', 'Alpha Presence'],
    biome: 'Alpine Peaks',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Bear Grizzly Wild.glb', scale: 0.3, animationName: 'Idle' }
  },
  {
    id: 'sheep',
    name: 'Cloud Sheep',
    emoji: '🐑',
    rarity: 'rare',
    unlockLevel: 42,
    description: 'A fluffy companion that brings calm counting focus.',
    abilities: ['Counting Focus', 'Cloud Dreams', 'Peaceful Sleep'],
    biome: 'Alpine Peaks',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Sheep.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'buffalo',
    name: 'Sky Buffalo',
    emoji: '🐃',
    rarity: 'epic',
    unlockLevel: 43,
    description: 'A powerful herd leader with thunder focus.',
    abilities: ['Thunder Focus', 'Herd Power', 'Sky Strength'],
    biome: 'Alpine Peaks',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Buffalo.glb', scale: 0.3, animationName: 'Idle' }
  },
  {
    id: 'ostrich',
    name: 'Peak Runner',
    emoji: '🦢',
    rarity: 'rare',
    unlockLevel: 44,
    description: 'A swift mountain runner with speed focus.',
    abilities: ['Speed Focus', 'Swift Thinking', 'Peak Runner'],
    biome: 'Alpine Peaks',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Ostrich.glb', scale: 0.35, animationName: 'Idle' }
  },

  // CRYSTAL CAVES BIOME (Levels 45-49)
  {
    id: 'cockroach',
    name: 'Crystal Beetle',
    emoji: '🪲',
    rarity: 'common',
    unlockLevel: 45,
    description: 'A resilient cave dweller with survival focus.',
    abilities: ['Survival Focus', 'Resilience', 'Cave Explorer'],
    biome: 'Crystal Caves',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Cockroach.glb', scale: 0.6, animationName: 'Idle' }
  },
  {
    id: 'beaver',
    name: 'Crystal Miner',
    emoji: '🦫',
    rarity: 'rare',
    unlockLevel: 46,
    description: 'A diligent builder with construction focus.',
    abilities: ['Construction Focus', 'Diligence', 'Crystal Craft'],
    biome: 'Crystal Caves',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Beaver.glb', scale: 0.4, animationName: 'Idle' }
  },
  {
    id: 'honeybee',
    name: 'Crystal Bee',
    emoji: '🐝',
    rarity: 'rare',
    unlockLevel: 47,
    description: 'A buzzing worker with hive mind focus.',
    abilities: ['Hive Mind', 'Work Focus', 'Crystal Honey'],
    biome: 'Crystal Caves',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Honeybee.glb', scale: 0.6, animationName: 'Idle' }
  },
  {
    id: 'tapir',
    name: 'Cave Guardian',
    emoji: '🦛',
    rarity: 'epic',
    unlockLevel: 48,
    description: 'An ancient cave guardian with deep earth focus.',
    abilities: ['Earth Focus', 'Ancient Guard', 'Deep Meditation'],
    biome: 'Crystal Caves',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Tapir.glb', scale: 0.35, animationName: 'Idle' }
  },
  {
    id: 'meerkat',
    name: 'Crystal Sentinel',
    emoji: '🦦',
    rarity: 'epic',
    unlockLevel: 49,
    description: 'A vigilant sentinel with crystal clear focus.',
    abilities: ['Crystal Focus', 'Vigilance', 'Group Unity'],
    biome: 'Crystal Caves',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Meerkat.glb', scale: 0.5, animationName: 'Idle' }
  },

  // CELESTIAL ISLES BIOME (Level 50)
  {
    id: 'cosmic-wolf',
    name: 'Cosmic Wolf',
    emoji: '🐺',
    rarity: 'legendary',
    unlockLevel: 50,
    description: 'A starborne wolf with cosmic consciousness and infinite focus.',
    abilities: ['Cosmic Focus', 'Star Wisdom', 'Infinite Concentration', 'Universal Unity'],
    biome: 'Celestial Isles',
    modelConfig: { type: 'glb', modelPath: '/assets/models/Wolf.glb', scale: 0.4, animationName: 'Idle' }
  }
];

// Biome configuration
export const BIOME_DATABASE: BiomeData[] = [
  {
    name: 'Meadow',
    unlockLevel: 1,
    description: 'A peaceful starting realm where your journey begins.',
    animals: ['panda', 'fox', 'rabbit', 'deer', 'squirrel']
  },
  {
    name: 'Forest',
    unlockLevel: 6,
    description: 'A mystical forest realm filled with woodland creatures.',
    animals: ['bear-grizzly', 'wolf', 'eagle', 'boar']
  },
  {
    name: 'Ocean',
    unlockLevel: 10,
    description: 'Serene ocean depths where aquatic friends await.',
    animals: ['dolphin', 'whale', 'shark', 'octopus', 'seahorse']
  },
  {
    name: 'Tundra',
    unlockLevel: 15,
    description: 'Harsh arctic lands where the strongest companions thrive.',
    animals: ['penguin', 'polar-bear', 'seal', 'walrus', 'reindeer']
  },
  {
    name: 'Mountains',
    unlockLevel: 20,
    description: 'Legendary peaks where mythical creatures dwell.',
    animals: ['tiger', 'lion-male', 'elephant-male', 'giraffe', 'rhino']
  },
  {
    name: 'Desert Dunes',
    unlockLevel: 25,
    description: 'Golden sands and ancient ruins under blazing suns.',
    animals: ['camel-dromedary', 'snake', 'spider', 'rat', 'vulture']
  },
  {
    name: 'Coral Reef',
    unlockLevel: 30,
    description: 'Vibrant underwater gardens teeming with life.',
    animals: ['crab', 'fish', 'starfish', 'squid', 'jellyfish']
  },
  {
    name: 'Mystic Forest',
    unlockLevel: 35,
    description: 'Enchanted groves glowing with ethereal light.',
    animals: ['horse-unicorn', 'parrot', 'chimpanzee', 'dove', 'cat']
  },
  {
    name: 'Alpine Peaks',
    unlockLevel: 40,
    description: 'Snowy cliffs and crystal-clear skies above the clouds.',
    animals: ['goat', 'bear-grizzly-wild', 'sheep', 'buffalo', 'ostrich']
  },
  {
    name: 'Crystal Caves',
    unlockLevel: 45,
    description: 'Shimmering caverns echoing with ancient energy.',
    animals: ['cockroach', 'beaver', 'honeybee', 'tapir', 'meerkat']
  },
  {
    name: 'Celestial Isles',
    unlockLevel: 50,
    description: 'Floating islands among the stars—the ultimate realm.',
    animals: ['cosmic-wolf']
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