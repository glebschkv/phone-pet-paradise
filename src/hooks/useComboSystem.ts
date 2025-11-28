import { useState, useEffect, useCallback } from 'react';

export interface ComboState {
  currentCombo: number;
  maxCombo: number;
  lastSessionDate: string;
  sessionsToday: number;
  totalComboSessions: number;
}

export interface ComboMultiplier {
  combo: number;
  multiplier: number;
  label: string;
  color: string;
  emoji: string;
}

// Combo multipliers - higher combo = more XP
const COMBO_TIERS: ComboMultiplier[] = [
  { combo: 0, multiplier: 1.0, label: 'No Combo', color: '#6b7280', emoji: '' },
  { combo: 1, multiplier: 1.0, label: 'x1', color: '#6b7280', emoji: '' },
  { combo: 2, multiplier: 1.1, label: 'x1.1', color: '#22c55e', emoji: '🔥' },
  { combo: 3, multiplier: 1.2, label: 'x1.2', color: '#22c55e', emoji: '🔥🔥' },
  { combo: 4, multiplier: 1.3, label: 'x1.3', color: '#eab308', emoji: '🔥🔥🔥' },
  { combo: 5, multiplier: 1.5, label: 'x1.5', color: '#f59e0b', emoji: '⚡' },
  { combo: 6, multiplier: 1.6, label: 'x1.6', color: '#f59e0b', emoji: '⚡⚡' },
  { combo: 7, multiplier: 1.8, label: 'x1.8', color: '#ef4444', emoji: '💥' },
  { combo: 8, multiplier: 2.0, label: 'x2.0', color: '#dc2626', emoji: '💥💥' },
  { combo: 9, multiplier: 2.2, label: 'x2.2', color: '#a855f7', emoji: '🌟' },
  { combo: 10, multiplier: 2.5, label: 'x2.5 MAX', color: '#8b5cf6', emoji: '👑' },
];

const STORAGE_KEY = 'pet_paradise_combo_system';

export const useComboSystem = () => {
  const [comboState, setComboState] = useState<ComboState>({
    currentCombo: 0,
    maxCombo: 0,
    lastSessionDate: '',
    sessionsToday: 0,
    totalComboSessions: 0,
  });

  // Load saved state
  useEffect(() => {
    loadComboState();
  }, []);

  const loadComboState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as ComboState;
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();

        // Check if combo should continue or break
        if (data.lastSessionDate === today) {
          // Same day - combo continues
          setComboState(data);
        } else if (data.lastSessionDate === yesterdayString) {
          // Yesterday - combo continues but reset sessions today
          setComboState({
            ...data,
            sessionsToday: 0,
          });
        } else if (data.lastSessionDate !== '') {
          // More than a day - combo breaks
          setComboState({
            ...data,
            currentCombo: 0,
            sessionsToday: 0,
          });
        }
      } catch (error) {
        console.error('Failed to load combo state:', error);
      }
    }
  };

  const saveComboState = (data: ComboState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setComboState(data);
  };

  // Get current multiplier based on combo count
  const getCurrentMultiplier = useCallback((): ComboMultiplier => {
    const combo = comboState.currentCombo;
    // Find the highest tier that applies
    for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
      if (combo >= COMBO_TIERS[i].combo) {
        return COMBO_TIERS[i];
      }
    }
    return COMBO_TIERS[0];
  }, [comboState.currentCombo]);

  // Get next tier info
  const getNextTier = useCallback((): ComboMultiplier | null => {
    const combo = comboState.currentCombo;
    for (const tier of COMBO_TIERS) {
      if (tier.combo > combo) {
        return tier;
      }
    }
    return null; // Already at max
  }, [comboState.currentCombo]);

  // Record a completed session and increase combo
  const recordSession = useCallback((): { newCombo: number; multiplier: number; isNewMax: boolean } => {
    const today = new Date().toDateString();
    const newCombo = comboState.currentCombo + 1;
    const cappedCombo = Math.min(newCombo, 10); // Max combo is 10
    const isNewMax = cappedCombo > comboState.maxCombo;

    const updatedState: ComboState = {
      currentCombo: cappedCombo,
      maxCombo: Math.max(comboState.maxCombo, cappedCombo),
      lastSessionDate: today,
      sessionsToday: comboState.lastSessionDate === today
        ? comboState.sessionsToday + 1
        : 1,
      totalComboSessions: comboState.totalComboSessions + 1,
    };

    saveComboState(updatedState);

    // Get multiplier for the NEW combo level
    const multiplierTier = COMBO_TIERS.find(t => t.combo === cappedCombo) ||
      COMBO_TIERS[COMBO_TIERS.length - 1];

    return {
      newCombo: cappedCombo,
      multiplier: multiplierTier.multiplier,
      isNewMax,
    };
  }, [comboState]);

  // Check if combo will break (no session since yesterday)
  const checkComboStatus = useCallback((): 'active' | 'at_risk' | 'broken' => {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    if (comboState.lastSessionDate === today) {
      return 'active';
    } else if (comboState.lastSessionDate === yesterdayString) {
      return 'at_risk'; // Need to do a session today to maintain
    } else {
      return 'broken';
    }
  }, [comboState.lastSessionDate]);

  // Get sessions needed for next multiplier tier
  const getSessionsToNextTier = useCallback((): number => {
    const nextTier = getNextTier();
    if (!nextTier) return 0;
    return nextTier.combo - comboState.currentCombo;
  }, [comboState.currentCombo, getNextTier]);

  // Reset combo (for testing or penalties)
  const resetCombo = useCallback(() => {
    const updatedState: ComboState = {
      ...comboState,
      currentCombo: 0,
      sessionsToday: 0,
    };
    saveComboState(updatedState);
  }, [comboState]);

  return {
    comboState,
    getCurrentMultiplier,
    getNextTier,
    recordSession,
    checkComboStatus,
    getSessionsToNextTier,
    resetCombo,
    comboTiers: COMBO_TIERS,
  };
};
