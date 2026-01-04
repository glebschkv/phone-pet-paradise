/**
 * Achievement System Constants
 * Configuration values for the achievement system
 */

export const ACHIEVEMENT_STORAGE_KEY = 'achievement-system-data';
export const ACHIEVEMENT_UNLOCK_EVENT = 'achievement-unlocked';
export const ACHIEVEMENT_CLAIMED_EVENT = 'achievement-claimed';

export const TIER_POINTS: Record<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond', number> = {
  bronze: 10,
  silver: 25,
  gold: 50,
  platinum: 100,
  diamond: 200
};
