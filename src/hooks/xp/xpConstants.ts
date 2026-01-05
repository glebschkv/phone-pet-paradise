/**
 * XP System Constants
 * Configuration values for XP rewards and level progression
 */

import { ANIMAL_DATABASE, BIOME_DATABASE } from '@/data/AnimalDatabase';
import { UnlockedReward } from './xpTypes';

// Use standardized storage key - legacy 'petIsland_xpSystem' is migrated automatically
export const STORAGE_KEY = 'nomo_xp_system';
export const XP_UPDATE_EVENT = 'petIsland_xpUpdate';
export const ANIMAL_PURCHASED_EVENT = 'petIsland_animalPurchased';

export const MAX_LEVEL = 50 as const;

// XP rewards based on session duration (in minutes)
// Balanced rewards using formula: base(duration * 1.2) + bonus(floor(duration/30) * 5)
// Designed for satisfying progression: early game fast, late game rewarding
export const XP_REWARDS: Record<number, number> = {
  25: 30,   // 25 min = 30 XP (base session, level up in 1-2 sessions early)
  30: 40,   // 30 min = 40 XP (+33% for 20% more time)
  45: 65,   // 45 min = 65 XP (pomodoro-and-a-half sweet spot)
  60: 100,  // 1 hour = 100 XP (clean milestone, deep work reward)
  90: 160,  // 90 min = 160 XP (deep focus bonus)
  120: 230, // 2 hours = 230 XP (marathon feels rewarding)
  180: 360, // 3 hours = 360 XP (sub-linear scaling prevents burnout)
  240: 480, // 4 hours = 480 XP (significant achievement)
  300: 600, // 5 hours = 600 XP (diminishing returns at extreme lengths)
};

// Level progression: XP required for each level (cumulative)
// Balanced curve: Levels 1-5 quick (1-2 sessions), 6-15 moderate (3-4), 16-30 steady (5-7), 31-50 prestige (8-12)
// Formula: Smooth exponential with 1.12-1.15x growth per level
export const LEVEL_REQUIREMENTS = [
  0,      // Level 0 (starting - Meadow Hare)
  30,     // Level 1 - 1 session
  70,     // Level 2 - ~1-2 sessions
  120,    // Level 3 - ~2 sessions
  180,    // Level 4 - ~2 sessions
  260,    // Level 5 - First biome unlock (Forest)
  350,    // Level 6
  460,    // Level 7
  590,    // Level 8
  740,    // Level 9
  920,    // Level 10 - Second biome unlock (Beach)
  1120,   // Level 11
  1350,   // Level 12
  1610,   // Level 13
  1900,   // Level 14
  2230,   // Level 15 - Third biome unlock (Mountain)
  2600,   // Level 16
  3010,   // Level 17
  3470,   // Level 18
  3980,   // Level 19
  4550,   // Level 20 - Fourth biome unlock (Desert)
  5180,   // Level 21
  5880,   // Level 22
  6650,   // Level 23
  7500,   // Level 24
  8430,   // Level 25 - Fifth biome unlock (Arctic)
  9450,   // Level 26
  10560,  // Level 27
  11770,  // Level 28
  13090,  // Level 29
  14530,  // Level 30 - Sixth biome unlock (Volcano)
  16100,  // Level 31
  17810,  // Level 32
  19670,  // Level 33
  21700,  // Level 34
  23900,  // Level 35
  26290,  // Level 36
  28880,  // Level 37
  31690,  // Level 38
  34730,  // Level 39
  38020,  // Level 40 - Seventh biome unlock (Space)
  41580,  // Level 41
  45430,  // Level 42
  49590,  // Level 43
  54090,  // Level 44
  58950,  // Level 45
  64200,  // Level 46
  69870,  // Level 47
  75990,  // Level 48
  82600,  // Level 49
  89700,  // Level 50 (MAX) - Void biome unlock
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
