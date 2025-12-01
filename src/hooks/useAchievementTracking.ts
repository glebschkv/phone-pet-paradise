import { useEffect, useCallback, useRef } from 'react';
import { useAchievementSystem } from './useAchievementSystem';

// Storage keys for tracking cumulative stats
const TRACKING_STORAGE_KEY = 'achievement-tracking-stats';

interface TrackingStats {
  totalFocusMinutes: number;
  totalSessions: number;
  longestSessionMinutes: number;
  totalCoinsEarned: number;
  totalPurchases: number;
  nightSessions: number;
  morningSessions: number;
  weekendSessions: number;
  jackpotWins: number;
  wheelSpins: number;
  shares: number;
}

const DEFAULT_STATS: TrackingStats = {
  totalFocusMinutes: 0,
  totalSessions: 0,
  longestSessionMinutes: 0,
  totalCoinsEarned: 0,
  totalPurchases: 0,
  nightSessions: 0,
  morningSessions: 0,
  weekendSessions: 0,
  jackpotWins: 0,
  wheelSpins: 0,
  shares: 0,
};

export interface AchievementTrackingHook {
  // Track focus session completion
  trackFocusSession: (minutes: number, wasJackpot?: boolean) => void;
  // Track pet unlocks
  trackPetUnlock: (totalPets: number, rarePets: number, epicPets: number, legendaryPets: number) => void;
  // Track biome unlocks
  trackBiomeUnlock: (totalBiomes: number) => void;
  // Track bond level changes
  trackBondLevel: (bondLevel: number, maxBondPets: number) => void;
  // Track level ups
  trackLevelUp: (newLevel: number) => void;
  // Track coin earnings
  trackCoinsEarned: (amount: number, totalEarned: number) => void;
  // Track shop purchases
  trackPurchase: (totalPurchases: number) => void;
  // Track streak updates
  trackStreak: (currentStreak: number) => void;
  // Track wheel spins
  trackWheelSpin: () => void;
  // Track shares
  trackShare: () => void;
  // Get current tracking stats
  getStats: () => TrackingStats;
}

export const useAchievementTracking = (): AchievementTrackingHook => {
  const { checkAndUnlockAchievements } = useAchievementSystem();
  const statsRef = useRef<TrackingStats>(DEFAULT_STATS);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TRACKING_STORAGE_KEY);
      if (saved) {
        statsRef.current = { ...DEFAULT_STATS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load achievement tracking stats:', error);
    }
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback(() => {
    try {
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(statsRef.current));
    } catch (error) {
      console.error('Failed to save achievement tracking stats:', error);
    }
  }, []);

  // Track focus session completion
  const trackFocusSession = useCallback((minutes: number, wasJackpot = false) => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isNight = hour >= 22 || hour < 5;
    const isMorning = hour >= 5 && hour < 7;

    // Update cumulative stats
    statsRef.current.totalFocusMinutes += minutes;
    statsRef.current.totalSessions += 1;
    statsRef.current.longestSessionMinutes = Math.max(statsRef.current.longestSessionMinutes, minutes);

    if (isNight) statsRef.current.nightSessions += 1;
    if (isMorning) statsRef.current.morningSessions += 1;
    if (isWeekend) statsRef.current.weekendSessions += 1;
    if (wasJackpot) statsRef.current.jackpotWins += 1;

    saveStats();

    // Check focus time achievements
    checkAndUnlockAchievements('focus_time', statsRef.current.totalFocusMinutes);

    // Check session duration achievements (for longest single session)
    checkAndUnlockAchievements('session_duration', minutes);

    // Check session count achievements
    checkAndUnlockAchievements('sessions_count', statsRef.current.totalSessions);

    // Check special time-based achievements
    if (isNight) {
      checkAndUnlockAchievements('night_sessions', statsRef.current.nightSessions);
    }
    if (isMorning) {
      checkAndUnlockAchievements('morning_sessions', statsRef.current.morningSessions);
    }
    if (isWeekend) {
      checkAndUnlockAchievements('weekend_sessions', statsRef.current.weekendSessions);
    }
    if (wasJackpot) {
      checkAndUnlockAchievements('jackpots', statsRef.current.jackpotWins);
    }
  }, [checkAndUnlockAchievements, saveStats]);

  // Track pet unlocks
  const trackPetUnlock = useCallback((
    totalPets: number,
    rarePets: number,
    epicPets: number,
    legendaryPets: number
  ) => {
    checkAndUnlockAchievements('pet_unlock', totalPets);
    checkAndUnlockAchievements('rare_pets', rarePets);
    checkAndUnlockAchievements('epic_pets', epicPets);
    checkAndUnlockAchievements('legendary_pets', legendaryPets);
  }, [checkAndUnlockAchievements]);

  // Track biome unlocks
  const trackBiomeUnlock = useCallback((totalBiomes: number) => {
    checkAndUnlockAchievements('biome_unlock', totalBiomes);
  }, [checkAndUnlockAchievements]);

  // Track bond level changes
  const trackBondLevel = useCallback((bondLevel: number, maxBondPets: number) => {
    checkAndUnlockAchievements('bond_level', bondLevel);
    checkAndUnlockAchievements('max_bonds', maxBondPets);
  }, [checkAndUnlockAchievements]);

  // Track level ups
  const trackLevelUp = useCallback((newLevel: number) => {
    checkAndUnlockAchievements('level', newLevel);
  }, [checkAndUnlockAchievements]);

  // Track coin earnings
  const trackCoinsEarned = useCallback((amount: number, totalEarned: number) => {
    statsRef.current.totalCoinsEarned = totalEarned;
    saveStats();
    checkAndUnlockAchievements('total_coins', totalEarned);
  }, [checkAndUnlockAchievements, saveStats]);

  // Track shop purchases
  const trackPurchase = useCallback((totalPurchases: number) => {
    statsRef.current.totalPurchases = totalPurchases;
    saveStats();
    checkAndUnlockAchievements('purchases', totalPurchases);
  }, [checkAndUnlockAchievements, saveStats]);

  // Track streak updates
  const trackStreak = useCallback((currentStreak: number) => {
    checkAndUnlockAchievements('streak_days', currentStreak);
  }, [checkAndUnlockAchievements]);

  // Track wheel spins
  const trackWheelSpin = useCallback(() => {
    statsRef.current.wheelSpins += 1;
    saveStats();
    checkAndUnlockAchievements('wheel_spins', statsRef.current.wheelSpins);
  }, [checkAndUnlockAchievements, saveStats]);

  // Track shares
  const trackShare = useCallback(() => {
    statsRef.current.shares += 1;
    saveStats();
    checkAndUnlockAchievements('shares', statsRef.current.shares);
  }, [checkAndUnlockAchievements, saveStats]);

  // Get current stats
  const getStats = useCallback(() => statsRef.current, []);

  return {
    trackFocusSession,
    trackPetUnlock,
    trackBiomeUnlock,
    trackBondLevel,
    trackLevelUp,
    trackCoinsEarned,
    trackPurchase,
    trackStreak,
    trackWheelSpin,
    trackShare,
    getStats,
  };
};

// Custom event names for cross-component communication
export const ACHIEVEMENT_EVENTS = {
  FOCUS_SESSION_COMPLETE: 'achievement:focus-session-complete',
  PET_UNLOCKED: 'achievement:pet-unlocked',
  LEVEL_UP: 'achievement:level-up',
  COINS_EARNED: 'achievement:coins-earned',
  PURCHASE_MADE: 'achievement:purchase-made',
  STREAK_UPDATED: 'achievement:streak-updated',
  WHEEL_SPIN: 'achievement:wheel-spin',
  BOND_UPDATED: 'achievement:bond-updated',
};

// Helper to dispatch achievement events from anywhere in the app
export const dispatchAchievementEvent = (
  eventType: string,
  detail: Record<string, unknown>
) => {
  window.dispatchEvent(new CustomEvent(eventType, { detail }));
};
