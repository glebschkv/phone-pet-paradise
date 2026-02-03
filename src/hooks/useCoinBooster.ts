import { useState, useEffect, useCallback } from 'react';
import { coinLogger } from '@/lib/logger';

export interface BoosterType {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  durationDays: number;
  coinPrice: number;
  iapPrice?: string; // For in-app purchase display
}

export interface ActiveBooster {
  boosterId: string;
  multiplier: number;
  activatedAt: number;
  expiresAt: number;
}

export interface BoosterState {
  activeBooster: ActiveBooster | null;
  boosterHistory: ActiveBooster[];
}

const STORAGE_KEY = 'petIsland_boosterSystem';
const BOOSTER_UPDATE_EVENT = 'petIsland_boosterUpdate';

// Available booster types
export const BOOSTER_TYPES: BoosterType[] = [
  {
    id: 'focus_boost',
    name: 'Focus Boost',
    description: '2x coins for 1 day',
    multiplier: 2,
    durationDays: 1,
    coinPrice: 400,
    iapPrice: '$0.99',
  },
  {
    id: 'super_boost',
    name: 'Super Boost',
    description: '3x coins for 3 days',
    multiplier: 3,
    durationDays: 3,
    coinPrice: 1000,
    iapPrice: '$2.99',
  },
  {
    id: 'weekly_pass',
    name: 'Weekly Pass',
    description: '1.5x coins for 7 days',
    multiplier: 1.5,
    durationDays: 7,
    coinPrice: 1500,
    iapPrice: '$4.99',
  },
];

export const useCoinBooster = () => {
  const [boosterState, setBoosterState] = useState<BoosterState>({
    activeBooster: null,
    boosterHistory: [],
  });

  // Check and clear expired boosters
  const checkExpiration = useCallback((state: BoosterState): BoosterState => {
    if (state.activeBooster && Date.now() > state.activeBooster.expiresAt) {
      return {
        ...state,
        activeBooster: null,
      };
    }
    return state;
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const checkedState = checkExpiration({
          activeBooster: parsed.activeBooster || null,
          boosterHistory: parsed.boosterHistory || [],
        });
        setBoosterState(checkedState);

        // Save back if expiration changed the state
        if (checkedState.activeBooster !== parsed.activeBooster) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState));
        }
      } catch (error) {
        coinLogger.error('Failed to load booster state:', error);
      }
    }
  }, [checkExpiration]);

  // Periodic check for expiration
  useEffect(() => {
    const checkInterval = setInterval(() => {
      setBoosterState(prev => {
        const checked = checkExpiration(prev);
        if (checked.activeBooster !== prev.activeBooster) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
          window.dispatchEvent(new CustomEvent(BOOSTER_UPDATE_EVENT, { detail: checked }));
        }
        return checked;
      });
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [checkExpiration]);

  // Listen for updates from other components
  useEffect(() => {
    const handleBoosterUpdate = (event: CustomEvent<BoosterState>) => {
      setBoosterState(event.detail);
    };

    window.addEventListener(BOOSTER_UPDATE_EVENT, handleBoosterUpdate as EventListener);

    return () => {
      window.removeEventListener(BOOSTER_UPDATE_EVENT, handleBoosterUpdate as EventListener);
    };
  }, []);

  // Save state and notify other components
  const saveState = useCallback((newState: BoosterState) => {
    const checkedState = checkExpiration(newState);
    setBoosterState(checkedState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState));
    window.dispatchEvent(new CustomEvent(BOOSTER_UPDATE_EVENT, { detail: checkedState }));
  }, [checkExpiration]);

  // Activate a booster
  const activateBooster = useCallback((boosterId: string): boolean => {
    const boosterType = BOOSTER_TYPES.find(b => b.id === boosterId);
    if (!boosterType) return false;

    const now = Date.now();
    const expiresAt = now + (boosterType.durationDays * 24 * 60 * 60 * 1000);

    const newBooster: ActiveBooster = {
      boosterId,
      multiplier: boosterType.multiplier,
      activatedAt: now,
      expiresAt,
    };

    const newState: BoosterState = {
      activeBooster: newBooster,
      boosterHistory: [...boosterState.boosterHistory, newBooster],
    };

    saveState(newState);
    return true;
  }, [boosterState.boosterHistory, saveState]);

  // Get current multiplier (1 if no booster active)
  const getCurrentMultiplier = useCallback((): number => {
    const checkedState = checkExpiration(boosterState);
    return checkedState.activeBooster?.multiplier ?? 1;
  }, [boosterState, checkExpiration]);

  // Check if a booster is currently active
  const isBoosterActive = useCallback((): boolean => {
    const checkedState = checkExpiration(boosterState);
    return checkedState.activeBooster !== null;
  }, [boosterState, checkExpiration]);

  // Get time remaining on current booster (in milliseconds)
  const getTimeRemaining = useCallback((): number => {
    const checkedState = checkExpiration(boosterState);
    if (!checkedState.activeBooster) return 0;
    return Math.max(0, checkedState.activeBooster.expiresAt - Date.now());
  }, [boosterState, checkExpiration]);

  // Format time remaining as human-readable string
  const getTimeRemainingFormatted = useCallback((): string => {
    const remaining = getTimeRemaining();
    if (remaining === 0) return '';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }

    return `${hours}h ${minutes}m`;
  }, [getTimeRemaining]);

  // Get booster type info by ID
  const getBoosterType = useCallback((boosterId: string): BoosterType | undefined => {
    return BOOSTER_TYPES.find(b => b.id === boosterId);
  }, []);

  // Reset all boosters
  const resetBoosters = useCallback(() => {
    const resetState: BoosterState = {
      activeBooster: null,
      boosterHistory: [],
    };
    saveState(resetState);
  }, [saveState]);

  return {
    activeBooster: checkExpiration(boosterState).activeBooster,
    boosterHistory: boosterState.boosterHistory,
    activateBooster,
    getCurrentMultiplier,
    isBoosterActive,
    getTimeRemaining,
    getTimeRemainingFormatted,
    getBoosterType,
    resetBoosters,
    availableBoosters: BOOSTER_TYPES,
  };
};
