/**
 * XP System Constants
 * Configuration values for XP rewards and level progression
 */

import { ANIMAL_DATABASE, BIOME_DATABASE } from '@/data/AnimalDatabase';
import { UnlockedReward } from './xpTypes';

export const STORAGE_KEY = 'petIsland_xpSystem';
export const XP_UPDATE_EVENT = 'petIsland_xpUpdate';
export const ANIMAL_PURCHASED_EVENT = 'petIsland_animalPurchased';

export const MAX_LEVEL = 50 as const;

// XP rewards based on session duration (in minutes)
// Boosted rewards - progression should feel satisfying and impactful!
export const XP_REWARDS: Record<number, number> = {
  25: 25,   // 25 minutes = 25 XP (minimum focus session)
  30: 35,   // 30 minutes = 35 XP - good for quick wins
  45: 55,   // 45 minutes = 55 XP
  60: 80,   // 1 hour = 80 XP - sweet spot for progression
  90: 125,  // 90 minutes (deep work) = 125 XP
  120: 180, // 2 hours = 180 XP
  180: 280, // 3 hours = 280 XP
  240: 400, // 4 hours = 400 XP
  300: 550, // 5 hours = 550 XP
};

// Level progression: XP required for each level
// Early levels are quick (1-2 sessions), mid levels moderate (3-5 sessions), late levels rewarding (5+ sessions)
export const LEVEL_REQUIREMENTS = [
  0,    // Level 0 (starting - Meadow Hare)
  15,   // Level 1 - Songbird (1 session)
  35,   // Level 2 - Garden Lizard (~2 sessions total)
  60,   // Level 3 - Wild Horse (~3 sessions)
  90,   // Level 4 - Friendly Monster (~4 sessions)
  125,  // Level 5 - Desert Camel + Sunset biome (~5 sessions)
  165,  // Level 6 - Golden Elk
  210,  // Level 7 - Wise Turtle
  260,  // Level 8 - Sunset Stallion
  320,  // Level 9 - Night Bear + Night biome
  385,  // Level 10 - Shadow Serpent
  455,  // Level 11 - Ghost Hare
  530,  // Level 12 - Night Sprite
];

// Generate unlocks by level from the database (animals and biomes)
export const UNLOCKS_BY_LEVEL: Record<number, UnlockedReward[]> = {};

// Add animal unlocks
ANIMAL_DATABASE.forEach(animal => {
  const level = animal.unlockLevel;
  if (!UNLOCKS_BY_LEVEL[level]) UNLOCKS_BY_LEVEL[level] = [];
  UNLOCKS_BY_LEVEL[level].push({
    type: 'animal',
    name: animal.name,
    description: animal.description,
    level: level
  });
});

// Add biome unlocks (world themes every few levels)
BIOME_DATABASE.forEach(biome => {
  const level = biome.unlockLevel;
  if (!UNLOCKS_BY_LEVEL[level]) UNLOCKS_BY_LEVEL[level] = [];
  UNLOCKS_BY_LEVEL[level].push({
    type: 'biome',
    name: biome.name,
    description: biome.description,
    level: level
  });
});
