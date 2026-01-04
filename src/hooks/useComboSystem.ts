import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { COMBO_TIERS, ComboTier, getComboTier, getNextComboTier } from '@/data/GamificationData';

export interface ComboState {
  currentCombo: number;
  highestCombo: number;
  lastSessionDate: string | null;
  lastSessionTime: number | null; // Unix timestamp
  totalBonusXPEarned: number;
  totalBonusCoinsEarned: number;
}

const COMBO_UPDATE_EVENT = 'petIsland_comboUpdate';
const COMBO_TIMEOUT_HOURS = 3; // Combo resets if no session within 3 hours

export const useComboSystem = () => {
  const [state, setState] = useState<ComboState>({
    currentCombo: 0,
    highestCombo: 0,
    lastSessionDate: null,
    lastSessionTime: null,
    totalBonusXPEarned: 0,
    totalBonusCoinsEarned: 0,
  });

  const [currentTier, setCurrentTier] = useState<ComboTier>(COMBO_TIERS[0]);

  // Load saved state
  useEffect(() => {
    const saved = storage.get<ComboState>(STORAGE_KEYS.COMBO_SYSTEM);
    if (saved) {
      // Check if combo has expired
      const updatedState = checkComboExpiry(saved);
      setState(updatedState);
      setCurrentTier(getComboTier(updatedState.currentCombo));

      if (updatedState !== saved) {
        storage.set(STORAGE_KEYS.COMBO_SYSTEM, updatedState);
      }
    }
  }, []);

  // Check combo expiry - only based on time elapsed, not calendar day
  // This prevents unfair combo resets at midnight when user was recently active
  const checkComboExpiry = (s: ComboState): ComboState => {
    if (!s.lastSessionTime) return s;

    const now = Date.now();
    const timeSinceLastSession = now - s.lastSessionTime;
    const timeoutMs = COMBO_TIMEOUT_HOURS * 60 * 60 * 1000;

    // Only reset if more than COMBO_TIMEOUT_HOURS have passed since last session
    if (timeSinceLastSession > timeoutMs) {
      return {
        ...s,
        currentCombo: 0,
      };
    }

    return s;
  };

  const saveState = useCallback((newState: ComboState) => {
    setState(newState);
    setCurrentTier(getComboTier(newState.currentCombo));
    storage.set(STORAGE_KEYS.COMBO_SYSTEM, newState);
  }, []);

  // Record a completed session (call after focus session ends)
  const recordSession = useCallback((): {
    newCombo: number;
    multiplier: number;
    tier: ComboTier;
    tieredUp: boolean;
    bonusXP: number;
    bonusCoins: number;
  } => {
    const now = Date.now();
    const today = new Date().toDateString();

    // Check if combo expired
    const currentState = checkComboExpiry(state);
    const oldTier = getComboTier(currentState.currentCombo);

    const newCombo = currentState.currentCombo + 1;
    const newTier = getComboTier(newCombo);
    const tieredUp = newTier.minCombo > oldTier.minCombo;


    const newState: ComboState = {
      currentCombo: newCombo,
      highestCombo: Math.max(currentState.highestCombo, newCombo),
      lastSessionDate: today,
      lastSessionTime: now,
      totalBonusXPEarned: currentState.totalBonusXPEarned,
      totalBonusCoinsEarned: currentState.totalBonusCoinsEarned,
    };

    saveState(newState);

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent(COMBO_UPDATE_EVENT, {
      detail: { combo: newCombo, tier: newTier, tieredUp }
    }));

    return {
      newCombo,
      multiplier: newTier.multiplier,
      tier: newTier,
      tieredUp,
      bonusXP: 0, // Will be calculated by caller based on session XP
      bonusCoins: 0,
    };
  }, [state, saveState]);

  // Get current multiplier
  const getCurrentMultiplier = useCallback((): number => {
    return currentTier.multiplier;
  }, [currentTier]);

  // Get time remaining before combo expires
  const getTimeUntilExpiry = useCallback((): { hours: number; minutes: number; isExpired: boolean } => {
    if (!state.lastSessionTime) {
      return { hours: 0, minutes: 0, isExpired: true };
    }

    const now = Date.now();
    const expiryTime = state.lastSessionTime + COMBO_TIMEOUT_HOURS * 60 * 60 * 1000;
    const remaining = expiryTime - now;

    if (remaining <= 0) {
      return { hours: 0, minutes: 0, isExpired: true };
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, isExpired: false };
  }, [state.lastSessionTime]);

  // Get progress to next tier
  const getNextTierProgress = useCallback((): {
    nextTier: ComboTier | null;
    sessionsNeeded: number;
    progressPercent: number;
  } => {
    const nextTier = getNextComboTier(state.currentCombo);

    if (!nextTier) {
      return { nextTier: null, sessionsNeeded: 0, progressPercent: 100 };
    }

    const sessionsNeeded = nextTier.minCombo - state.currentCombo;
    const currentTierMin = currentTier.minCombo;
    const progress = state.currentCombo - currentTierMin;
    const totalNeeded = nextTier.minCombo - currentTierMin;
    const progressPercent = (progress / totalNeeded) * 100;

    return { nextTier, sessionsNeeded, progressPercent };
  }, [state.currentCombo, currentTier]);

  // Apply multiplier to XP/coins
  const applyMultiplier = useCallback((baseAmount: number): number => {
    return Math.round(baseAmount * currentTier.multiplier);
  }, [currentTier]);

  // Get bonus amount (extra from multiplier)
  const getBonusAmount = useCallback((baseAmount: number): number => {
    return Math.round(baseAmount * (currentTier.multiplier - 1));
  }, [currentTier]);

  // Track bonus earned
  const trackBonusEarned = useCallback((bonusXP: number, bonusCoins: number) => {
    saveState({
      ...state,
      totalBonusXPEarned: state.totalBonusXPEarned + bonusXP,
      totalBonusCoinsEarned: state.totalBonusCoinsEarned + bonusCoins,
    });
  }, [state, saveState]);

  // Reset combo (for testing or manual reset)
  const resetCombo = useCallback(() => {
    saveState({
      ...state,
      currentCombo: 0,
      lastSessionTime: null,
    });
  }, [state, saveState]);

  // Get stats
  const getStats = useCallback(() => {
    return {
      currentCombo: state.currentCombo,
      highestCombo: state.highestCombo,
      currentTier,
      totalBonusXPEarned: state.totalBonusXPEarned,
      totalBonusCoinsEarned: state.totalBonusCoinsEarned,
    };
  }, [state, currentTier]);

  return {
    state,
    currentTier,
    recordSession,
    getCurrentMultiplier,
    getTimeUntilExpiry,
    getNextTierProgress,
    applyMultiplier,
    getBonusAmount,
    trackBonusEarned,
    resetCombo,
    getStats,
    allTiers: COMBO_TIERS,
  };
};

export const COMBO_UPDATED_EVENT = COMBO_UPDATE_EVENT;
