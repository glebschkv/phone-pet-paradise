/**
 * Achievement Progress Tracking
 * Functions for checking and updating achievement progress
 */

import { Achievement } from './achievementTypes';

/**
 * Check if an achievement should be updated based on activity type and value
 * Returns updated achievement if it should update, null otherwise
 */
export function checkAchievementProgress(
  achievement: Achievement,
  type: string,
  value: number
): { shouldUpdate: boolean; newProgress: number } {
  if (achievement.isUnlocked) {
    return { shouldUpdate: false, newProgress: achievement.progress };
  }

  let shouldUpdate = false;
  let newProgress = achievement.progress;

  // Map activity types to achievement checks
  switch (type) {
    case 'focus_time':
      if (['focus-beginner', 'focus-hour', 'focus-warrior', 'focus-dedicated',
           'focus-master', 'focus-expert', 'focus-legend', 'focus-immortal'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'session_duration':
      if (['marathon-runner', 'marathon-master', 'ultra-marathon'].includes(achievement.id)) {
        newProgress = Math.max(newProgress, value);
        shouldUpdate = true;
      }
      break;

    case 'sessions_count':
      if (['session-starter', 'session-regular', 'session-veteran',
           'zen-master', 'focus-god'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'pet_unlock':
      if (['first-friend', 'pet-collector-5', 'pet-collector', 'zoo-keeper',
           'menagerie-master', 'legendary-collector'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'rare_pets':
      if (achievement.id === 'rare-finder') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'epic_pets':
      if (achievement.id === 'epic-hunter') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'legendary_pets':
      if (achievement.id === 'legendary-hunter') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'biome_unlock':
      if (achievement.id === 'biome-explorer') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'bond_level':
      if (['first-bond', 'growing-bond', 'strong-bond', 'pet-whisperer'].includes(achievement.id)) {
        newProgress = Math.max(newProgress, value);
        shouldUpdate = true;
      }
      break;

    case 'max_bonds':
      if (['bond-collector', 'bond-master'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'level':
      if (['level-5', 'level-10', 'level-25', 'level-40', 'level-50'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'total_coins':
      if (['coin-collector-1k', 'coin-collector-5k', 'coin-collector-25k',
           'coin-collector-100k'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'purchases':
      if (['first-purchase', 'shopper', 'big-spender'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'streak_days':
      if (['streak-week', 'streak-month', 'streak-master',
           'streak-legend', 'streak-immortal', 'perfect-week'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'night_sessions':
      if (achievement.id === 'night-owl') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'morning_sessions':
      if (achievement.id === 'early-bird') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'weekend_sessions':
      if (achievement.id === 'weekend-warrior') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'jackpots':
      if (achievement.id === 'lucky-winner') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'wheel_spins':
      if (achievement.id === 'wheel-spinner') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'shares':
      if (achievement.id === 'social-butterfly') {
        newProgress = value;
        shouldUpdate = true;
      }
      break;

    case 'achievements_unlocked':
      if (['achievement-hunter', 'completionist'].includes(achievement.id)) {
        newProgress = value;
        shouldUpdate = true;
      }
      break;
  }

  return { shouldUpdate, newProgress: Math.min(achievement.target, newProgress) };
}
