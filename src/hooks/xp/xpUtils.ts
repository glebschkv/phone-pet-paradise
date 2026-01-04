/**
 * XP System Utilities
 * Helper functions for XP calculations and data normalization
 */

import { ANIMAL_DATABASE, getUnlockedAnimals } from '@/data/AnimalDatabase';
import { BonusResult } from './xpTypes';
import { LEVEL_REQUIREMENTS, MAX_LEVEL } from './xpConstants';

// Random bonus XP system - creates variable rewards (slot machine psychology)
export const calculateRandomBonus = (): BonusResult => {
  const roll = Math.random() * 100;

  // 5% chance: Jackpot (2.5x XP)
  if (roll < 5) {
    return { hasBonusXP: true, bonusMultiplier: 2.5, bonusType: 'jackpot' };
  }
  // 10% chance: Super Lucky (1.75x XP)
  if (roll < 15) {
    return { hasBonusXP: true, bonusMultiplier: 1.75, bonusType: 'super_lucky' };
  }
  // 20% chance: Lucky (1.5x XP)
  if (roll < 35) {
    return { hasBonusXP: true, bonusMultiplier: 1.5, bonusType: 'lucky' };
  }
  // 65% chance: No bonus
  return { hasBonusXP: false, bonusMultiplier: 1.0, bonusType: 'none' };
};

// Memoized level requirement calculation
const levelRequirementCache = new Map<number, number>();

export const calculateLevelRequirement = (level: number): number => {
  if (levelRequirementCache.has(level)) {
    return levelRequirementCache.get(level)!;
  }

  let result: number;

  // Use predefined values for levels 0-12
  if (level < LEVEL_REQUIREMENTS.length) {
    result = LEVEL_REQUIREMENTS[level];
  } else {
    // For levels 13+, continue with a smooth progression
    let totalXP = LEVEL_REQUIREMENTS[LEVEL_REQUIREMENTS.length - 1]; // Level 12 = 530
    let increment = 80; // Starting increment after level 12

    for (let i = LEVEL_REQUIREMENTS.length; i <= level; i++) {
      totalXP += increment;
      if (i < 20) {
        increment += 8;  // Small increase for levels 13-19
      } else if (i < 30) {
        increment += 12; // Medium increase for levels 20-29
      } else {
        increment += 15; // Larger increase for legendary tier (30+)
      }
    }
    result = totalXP;
  }

  levelRequirementCache.set(level, result);
  return result;
};

// Normalize animal naming across old saves and DB
const NAME_MAP: Record<string, string> = ANIMAL_DATABASE.reduce((acc, a) => {
  acc[a.name.toLowerCase()] = a.name;
  acc[a.id.toLowerCase()] = a.name;
  return acc;
}, {} as Record<string, string>);

export const normalizeAnimalList = (list: string[] | undefined): string[] => {
  const defaultAnimals = list ?? getUnlockedAnimals(1).map(a => a.name);
  const names = defaultAnimals.map((n) => NAME_MAP[n?.toLowerCase?.() || ''] || n);
  return Array.from(new Set(names));
};

// Calculate current level from total XP
export const calculateLevel = (totalXP: number): number => {
  let level = 0;
  while (level < MAX_LEVEL && totalXP >= calculateLevelRequirement(level + 1)) {
    level++;
  }
  return level;
};
