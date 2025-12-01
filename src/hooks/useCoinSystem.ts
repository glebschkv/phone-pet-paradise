import { useState, useEffect, useCallback } from 'react';
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from './useAchievementTracking';

export interface CoinReward {
  coinsGained: number;
  baseCoins: number;
  bonusCoins: number;
  bonusMultiplier: number;
  hasBonusCoins: boolean;
  bonusType: 'none' | 'lucky' | 'super_lucky' | 'jackpot';
  boosterActive: boolean;
  boosterMultiplier: number;
}

export interface CoinSystemState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

const STORAGE_KEY = 'petIsland_coinSystem';
const COIN_UPDATE_EVENT = 'petIsland_coinUpdate';

// Coin rewards based on session duration (in minutes)
// Designed to scale with XP but be slightly more generous for shop purchases
const COIN_REWARDS: Record<number, number> = {
  25: 10,   // 25 minutes = 10 coins
  30: 15,   // 30 minutes = 15 coins
  45: 25,   // 45 minutes = 25 coins
  60: 40,   // 1 hour = 40 coins
  90: 75,   // 90 minutes = 75 coins
  120: 110, // 2 hours = 110 coins
  180: 170, // 3 hours = 170 coins
  240: 240, // 4 hours = 240 coins
  300: 320, // 5 hours = 320 coins
};

// Random bonus coin system (same odds as XP)
interface BonusResult {
  hasBonusCoins: boolean;
  bonusMultiplier: number;
  bonusType: 'none' | 'lucky' | 'super_lucky' | 'jackpot';
}

const calculateRandomBonus = (): BonusResult => {
  const roll = Math.random() * 100;

  // 2% chance: Jackpot (2x coins)
  if (roll < 2) {
    return { hasBonusCoins: true, bonusMultiplier: 2.0, bonusType: 'jackpot' };
  }
  // 5% chance: Super Lucky (1.5x coins)
  if (roll < 7) {
    return { hasBonusCoins: true, bonusMultiplier: 1.5, bonusType: 'super_lucky' };
  }
  // 13% chance: Lucky (1.25x coins)
  if (roll < 20) {
    return { hasBonusCoins: true, bonusMultiplier: 1.25, bonusType: 'lucky' };
  }
  // 80% chance: No bonus
  return { hasBonusCoins: false, bonusMultiplier: 1.0, bonusType: 'none' };
};

// Pre-sorted durations for efficient lookup
const sortedDurations = Object.keys(COIN_REWARDS)
  .map(Number)
  .sort((a, b) => b - a);

export const useCoinSystem = () => {
  const [coinState, setCoinState] = useState<CoinSystemState>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
  });

  // Load saved state from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCoinState({
          balance: parsed.balance || 0,
          totalEarned: parsed.totalEarned || 0,
          totalSpent: parsed.totalSpent || 0,
        });
      } catch (error) {
        console.error('Failed to load coin state:', error);
      }
    }
  }, []);

  // Listen for coin updates from other components
  useEffect(() => {
    const handleCoinUpdate = (event: CustomEvent<CoinSystemState>) => {
      setCoinState(event.detail);
    };

    window.addEventListener(COIN_UPDATE_EVENT, handleCoinUpdate as EventListener);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          setCoinState(parsed);
        } catch (error) {
          console.error('Failed to parse coin state from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(COIN_UPDATE_EVENT, handleCoinUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save state and notify other components
  const saveState = useCallback((newState: CoinSystemState) => {
    setCoinState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    window.dispatchEvent(new CustomEvent(COIN_UPDATE_EVENT, { detail: newState }));
  }, []);

  // Calculate coins from session duration
  const calculateCoinsFromDuration = useCallback((minutes: number): number => {
    for (const duration of sortedDurations) {
      if (minutes >= duration) {
        return COIN_REWARDS[duration];
      }
    }
    return 0;
  }, []);

  // Award coins from a focus session (with optional booster multiplier)
  const awardCoins = useCallback((
    sessionMinutes: number,
    boosterMultiplier: number = 1
  ): CoinReward => {
    const baseCoins = calculateCoinsFromDuration(sessionMinutes);
    const bonus = calculateRandomBonus();

    // Apply random bonus first, then booster
    const coinsAfterBonus = Math.round(baseCoins * bonus.bonusMultiplier);
    const finalCoins = Math.round(coinsAfterBonus * boosterMultiplier);
    const bonusCoins = finalCoins - baseCoins;

    const newState: CoinSystemState = {
      balance: coinState.balance + finalCoins,
      totalEarned: coinState.totalEarned + finalCoins,
      totalSpent: coinState.totalSpent,
    };

    saveState(newState);

    // Track coins earned for achievements
    dispatchAchievementEvent(ACHIEVEMENT_EVENTS.COINS_EARNED, {
      amount: finalCoins,
      total: newState.totalEarned,
    });

    return {
      coinsGained: finalCoins,
      baseCoins,
      bonusCoins,
      bonusMultiplier: bonus.bonusMultiplier,
      hasBonusCoins: bonus.hasBonusCoins,
      bonusType: bonus.bonusType,
      boosterActive: boosterMultiplier > 1,
      boosterMultiplier,
    };
  }, [coinState, calculateCoinsFromDuration, saveState]);

  // Add coins directly (for purchases, rewards, etc.)
  const addCoins = useCallback((amount: number): void => {
    const newState: CoinSystemState = {
      balance: coinState.balance + amount,
      totalEarned: coinState.totalEarned + amount,
      totalSpent: coinState.totalSpent,
    };
    saveState(newState);

    // Track coins earned for achievements
    if (amount > 0) {
      dispatchAchievementEvent(ACHIEVEMENT_EVENTS.COINS_EARNED, {
        amount,
        total: newState.totalEarned,
      });
    }
  }, [coinState, saveState]);

  // Spend coins (returns true if successful, false if insufficient balance)
  const spendCoins = useCallback((amount: number): boolean => {
    if (coinState.balance < amount) {
      return false;
    }

    const newState: CoinSystemState = {
      balance: coinState.balance - amount,
      totalEarned: coinState.totalEarned,
      totalSpent: coinState.totalSpent + amount,
    };
    saveState(newState);
    return true;
  }, [coinState, saveState]);

  // Check if user can afford something
  const canAfford = useCallback((amount: number): boolean => {
    return coinState.balance >= amount;
  }, [coinState.balance]);

  // Reset progress
  const resetProgress = useCallback(() => {
    const resetState: CoinSystemState = {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    };
    saveState(resetState);
  }, [saveState]);

  return {
    ...coinState,
    awardCoins,
    addCoins,
    spendCoins,
    canAfford,
    resetProgress,
    calculateCoinsFromDuration,
  };
};
