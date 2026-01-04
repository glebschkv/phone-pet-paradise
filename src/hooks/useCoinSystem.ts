/**
 * Coin System Hook
 *
 * Manages the in-game currency system including earning coins from focus sessions,
 * spending coins on purchases, and tracking coin statistics. Supports bonus
 * multipliers from premium subscriptions and boosters.
 *
 * @module hooks/useCoinSystem
 *
 * @example
 * ```typescript
 * import { useCoinSystem } from '@/hooks/useCoinSystem';
 *
 * function ShopItem({ price }: { price: number }) {
 *   const { balance, canAfford, spendCoins } = useCoinSystem();
 *
 *   const handlePurchase = () => {
 *     if (spendCoins(price)) {
 *       // Purchase successful
 *     }
 *   };
 *
 *   return (
 *     <button disabled={!canAfford(price)} onClick={handlePurchase}>
 *       Buy for {price} coins
 *     </button>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from '@/hooks/useAchievementTracking';
import { TIER_BENEFITS, isValidSubscriptionTier } from './usePremiumStatus';
import { coinLogger } from '@/lib/logger';
import { COIN_CONFIG } from '@/lib/constants';
import {
  validateCoinAmount,
  validateCoinTransaction,
  validateMultiplier,
  validateSessionMinutes,
  isNonNegativeInteger
} from '@/lib/validation';

/**
 * Result of awarding coins from a focus session
 */
export interface CoinReward {
  coinsGained: number;
  baseCoins: number;
  bonusCoins: number;
  bonusMultiplier: number;
  hasBonusCoins: boolean;
  bonusType: 'none' | 'lucky' | 'super_lucky' | 'jackpot';
  boosterActive: boolean;
  boosterMultiplier: number;
  subscriptionMultiplier: number;
}

export interface CoinSystemState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

const STORAGE_KEY = 'petIsland_coinSystem';
const COIN_UPDATE_EVENT = 'petIsland_coinUpdate';

// Coin rewards based on session duration (in minutes)
// Boosted rewards - players should be able to buy things regularly!
const COIN_REWARDS: Record<number, number> = {
  25: 25,   // 25 minutes = 25 coins - more than doubled
  30: 40,   // 30 minutes = 40 coins - more than doubled
  45: 65,   // 45 minutes = 65 coins - more than doubled
  60: 100,  // 1 hour = 100 coins - 2.5x increase
  90: 175,  // 90 minutes = 175 coins - more than doubled
  120: 260, // 2 hours = 260 coins - more than doubled
  180: 400, // 3 hours = 400 coins - more than doubled
  240: 550, // 4 hours = 550 coins - more than doubled
  300: 750, // 5 hours = 750 coins - more than doubled
};

// Random bonus coin system (same odds as XP)
interface BonusResult {
  hasBonusCoins: boolean;
  bonusMultiplier: number;
  bonusType: 'none' | 'lucky' | 'super_lucky' | 'jackpot';
}

const calculateRandomBonus = (): BonusResult => {
  const roll = Math.random() * 100;
  const { BONUS_THRESHOLDS, BONUS_MULTIPLIERS } = COIN_CONFIG;

  // 5% chance: Jackpot (2.5x coins)
  if (roll < BONUS_THRESHOLDS.JACKPOT) {
    return { hasBonusCoins: true, bonusMultiplier: BONUS_MULTIPLIERS.JACKPOT, bonusType: 'jackpot' };
  }
  // 10% chance: Super Lucky (1.75x coins)
  if (roll < BONUS_THRESHOLDS.SUPER_LUCKY) {
    return { hasBonusCoins: true, bonusMultiplier: BONUS_MULTIPLIERS.SUPER_LUCKY, bonusType: 'super_lucky' };
  }
  // 20% chance: Lucky (1.5x coins)
  if (roll < BONUS_THRESHOLDS.LUCKY) {
    return { hasBonusCoins: true, bonusMultiplier: BONUS_MULTIPLIERS.LUCKY, bonusType: 'lucky' };
  }
  // 65% chance: No bonus
  return { hasBonusCoins: false, bonusMultiplier: BONUS_MULTIPLIERS.NONE, bonusType: 'none' };
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

  // Ref to track self-dispatched events to prevent feedback loops
  const isSelfDispatch = useRef(false);
  // Ref to track current state for event handlers to avoid stale closures
  const coinStateRef = useRef(coinState);

  // Load saved state from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Validate all numeric fields from storage
        setCoinState({
          balance: validateCoinAmount(parsed.balance),
          totalEarned: validateCoinAmount(parsed.totalEarned),
          totalSpent: validateCoinAmount(parsed.totalSpent),
        });
      } catch (error) {
        coinLogger.error('Failed to load coin state:', error);
      }
    }
  }, []);

  // Helper to get subscription multiplier
  const getSubscriptionMultiplier = useCallback((): number => {
    const premiumData = localStorage.getItem('petIsland_premium');
    if (premiumData) {
      try {
        const parsed = JSON.parse(premiumData);
        if (isValidSubscriptionTier(parsed.tier)) {
          return TIER_BENEFITS[parsed.tier].coinMultiplier;
        }
      } catch {
        // Invalid data
      }
    }
    return 1;
  }, []);

  // Keep ref in sync with state for event handlers
  useEffect(() => {
    coinStateRef.current = coinState;
  }, [coinState]);

  // Listen for coin updates from other components
  // Uses AbortController for cleaner event listener cleanup
  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const handleCoinUpdate = (event: Event) => {
      // Skip self-dispatched events to prevent feedback loops
      if (isSelfDispatch.current) {
        isSelfDispatch.current = false;
        return;
      }
      const customEvent = event as CustomEvent<CoinSystemState>;
      setCoinState(customEvent.detail);
    };

    const handleStorageChange = (event: StorageEvent) => {
      // Only handle our namespaced storage key to avoid processing unrelated storage events
      if (event.key !== STORAGE_KEY || !event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue);
        setCoinState(parsed);
      } catch (error) {
        coinLogger.error('Failed to parse coin state from storage:', error);
      }
    };

    // Listen for bonus coin grants from subscription purchase
    const handleBonusCoins = (event: Event) => {
      const customEvent = event as CustomEvent<{ amount: number; planId: string }>;
      const { amount } = customEvent.detail;
      if (amount > 0) {
        // Use ref to get current state and avoid stale closures
        const currentState = coinStateRef.current;
        const newState = {
          ...currentState,
          balance: currentState.balance + amount,
          totalEarned: currentState.totalEarned + amount,
        };
        setCoinState(newState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        isSelfDispatch.current = true;
        window.dispatchEvent(new CustomEvent(COIN_UPDATE_EVENT, { detail: newState }));
      }
    };

    // Register all listeners with abort signal for automatic cleanup
    window.addEventListener(COIN_UPDATE_EVENT, handleCoinUpdate, { signal });
    window.addEventListener('storage', handleStorageChange, { signal });
    window.addEventListener('petIsland_grantBonusCoins', handleBonusCoins, { signal });

    return () => {
      abortController.abort();
    };
  }, []);

  // Save state and notify other components
  const saveState = useCallback((newState: CoinSystemState) => {
    setCoinState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    // Mark as self-dispatch to prevent feedback loop
    isSelfDispatch.current = true;
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
    // Validate inputs
    const validMinutes = validateSessionMinutes(sessionMinutes);
    const validMultiplier = validateMultiplier(boosterMultiplier);
    const baseCoins = calculateCoinsFromDuration(validMinutes);
    const bonus = calculateRandomBonus();
    const subscriptionMultiplier = getSubscriptionMultiplier();

    // Apply subscription multiplier first, then random bonus, then booster
    const coinsAfterSubscription = Math.round(baseCoins * subscriptionMultiplier);
    const coinsAfterBonus = Math.round(coinsAfterSubscription * bonus.bonusMultiplier);
    const finalCoins = Math.round(coinsAfterBonus * validMultiplier);
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
      boosterActive: validMultiplier > 1,
      boosterMultiplier: validMultiplier,
      subscriptionMultiplier,
    };
  }, [coinState, calculateCoinsFromDuration, saveState, getSubscriptionMultiplier]);

  // Add coins directly (for purchases, rewards, etc.)
  const addCoins = useCallback((amount: number): void => {
    // Validate input - must be a positive integer
    const validAmount = validateCoinTransaction(amount);
    if (validAmount <= 0) {
      coinLogger.warn('Invalid coin amount:', amount);
      return;
    }

    const newState: CoinSystemState = {
      balance: coinState.balance + validAmount,
      totalEarned: coinState.totalEarned + validAmount,
      totalSpent: coinState.totalSpent,
    };
    saveState(newState);

    // Track coins earned for achievements
    dispatchAchievementEvent(ACHIEVEMENT_EVENTS.COINS_EARNED, {
      amount: validAmount,
      total: newState.totalEarned,
    });
  }, [coinState, saveState]);

  // Spend coins (returns true if successful, false if insufficient balance)
  const spendCoins = useCallback((amount: number): boolean => {
    // Validate input - must be a positive integer
    const validAmount = validateCoinTransaction(amount);
    if (validAmount <= 0) {
      coinLogger.warn('Invalid spend amount:', amount);
      return false;
    }

    if (coinState.balance < validAmount) {
      return false;
    }

    const newState: CoinSystemState = {
      balance: coinState.balance - validAmount,
      totalEarned: coinState.totalEarned,
      totalSpent: coinState.totalSpent + validAmount,
    };
    saveState(newState);
    return true;
  }, [coinState, saveState]);

  // Check if user can afford something
  const canAfford = useCallback((amount: number): boolean => {
    if (!isNonNegativeInteger(amount)) return false;
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
    getSubscriptionMultiplier,
  };
};
