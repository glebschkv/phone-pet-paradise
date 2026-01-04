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
import { supabase } from '@/integrations/supabase/client';
import {
  validateCoinAmount,
  validateCoinTransaction,
  validateMultiplier,
  validateSessionMinutes,
  isNonNegativeInteger
} from '@/lib/validation';

/**
 * SECURITY: Server-side coin validation types
 * All coin operations must be validated server-side to prevent manipulation
 */
type EarnSource = 'focus_session' | 'daily_reward' | 'achievement' | 'quest_reward' | 'subscription_bonus' | 'lucky_wheel' | 'referral' | 'admin_grant';
type SpendPurpose = 'shop_purchase' | 'pet_unlock' | 'cosmetic' | 'booster' | 'streak_freeze';

interface ServerCoinResponse {
  success: boolean;
  newBalance?: number;
  totalEarned?: number;
  totalSpent?: number;
  error?: string;
  duplicate?: boolean;
  retry?: boolean;
}

/**
 * SECURITY: Rate limiting for client-side debouncing
 * Prevents spam requests before they hit the server
 */
const lastOperationTime = { earn: 0, spend: 0 };
const MIN_OPERATION_INTERVAL_MS = 1000; // 1 second between operations

function canPerformOperation(operation: 'earn' | 'spend'): boolean {
  const now = Date.now();
  if (now - lastOperationTime[operation] < MIN_OPERATION_INTERVAL_MS) {
    return false;
  }
  lastOperationTime[operation] = now;
  return true;
}

/**
 * SECURITY: Server-validated coin operations
 * These functions call the validate-coins edge function for all operations
 */
async function serverEarnCoins(
  amount: number,
  source: EarnSource,
  sessionId?: string,
  metadata?: Record<string, unknown>
): Promise<ServerCoinResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // For unauthenticated users, allow local-only operation but log warning
      coinLogger.warn('Unauthenticated coin earn - operating locally only');
      return { success: true }; // Fall back to local for offline/unauthenticated
    }

    const { data, error } = await supabase.functions.invoke('validate-coins', {
      body: {
        operation: 'earn',
        amount,
        source,
        sessionId,
        metadata,
      },
    });

    if (error) {
      coinLogger.error('Server earn validation failed:', error);
      return { success: false, error: error.message, retry: true };
    }

    return data as ServerCoinResponse;
  } catch (err) {
    coinLogger.error('Error during server coin validation:', err);
    return { success: false, error: 'Network error', retry: true };
  }
}

async function serverSpendCoins(
  amount: number,
  purpose: SpendPurpose,
  itemId?: string,
  metadata?: Record<string, unknown>
): Promise<ServerCoinResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // For unauthenticated users, allow local-only operation but log warning
      coinLogger.warn('Unauthenticated coin spend - operating locally only');
      return { success: true }; // Fall back to local for offline/unauthenticated
    }

    const { data, error } = await supabase.functions.invoke('validate-coins', {
      body: {
        operation: 'spend',
        amount,
        purpose,
        itemId,
        metadata,
      },
    });

    if (error) {
      coinLogger.error('Server spend validation failed:', error);
      return { success: false, error: error.message, retry: true };
    }

    return data as ServerCoinResponse;
  } catch (err) {
    coinLogger.error('Error during server coin validation:', err);
    return { success: false, error: 'Network error', retry: true };
  }
}

async function serverGetBalance(): Promise<ServerCoinResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase.functions.invoke('validate-coins', {
      body: { operation: 'get_balance' },
    });

    if (error) {
      coinLogger.error('Failed to get server balance:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      newBalance: data.balance,
      totalEarned: data.totalEarned,
      totalSpent: data.totalSpent,
    };
  } catch (err) {
    coinLogger.error('Error fetching server balance:', err);
    return { success: false, error: 'Network error' };
  }
}

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

  // 5% chance: Jackpot (2.5x coins) - increased from 2%
  if (roll < 5) {
    return { hasBonusCoins: true, bonusMultiplier: 2.5, bonusType: 'jackpot' };
  }
  // 10% chance: Super Lucky (1.75x coins) - increased from 5%
  if (roll < 15) {
    return { hasBonusCoins: true, bonusMultiplier: 1.75, bonusType: 'super_lucky' };
  }
  // 20% chance: Lucky (1.5x coins) - increased from 13%
  if (roll < 35) {
    return { hasBonusCoins: true, bonusMultiplier: 1.5, bonusType: 'lucky' };
  }
  // 65% chance: No bonus - reduced from 80%
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

  // Ref to track self-dispatched events to prevent feedback loops
  const isSelfDispatch = useRef(false);

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
    // Uses functional setState to avoid stale closure issues
    const handleBonusCoins = (event: Event) => {
      const customEvent = event as CustomEvent<{ amount: number; planId: string }>;
      const { amount } = customEvent.detail;
      if (amount > 0) {
        // Use functional update to always have the latest state
        setCoinState(prevState => {
          const newState = {
            ...prevState,
            balance: prevState.balance + amount,
            totalEarned: prevState.totalEarned + amount,
          };
          // Side effects in a microtask to not block the state update
          queueMicrotask(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
            isSelfDispatch.current = true;
            window.dispatchEvent(new CustomEvent(COIN_UPDATE_EVENT, { detail: newState }));
          });
          return newState;
        });
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

  /**
   * SECURITY: Award coins from a focus session with server validation
   *
   * This function now validates with the server to prevent manipulation.
   * The sessionId is used to prevent duplicate rewards for the same session.
   */
  const awardCoins = useCallback((
    sessionMinutes: number,
    boosterMultiplier: number = 1,
    sessionId?: string
  ): CoinReward => {
    // SECURITY: Client-side rate limiting
    if (!canPerformOperation('earn')) {
      coinLogger.warn('Rate limited: earn operation throttled');
      return {
        coinsGained: 0,
        baseCoins: 0,
        bonusCoins: 0,
        bonusMultiplier: 1,
        hasBonusCoins: false,
        bonusType: 'none',
        boosterActive: false,
        boosterMultiplier: 1,
        subscriptionMultiplier: 1,
      };
    }

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

    // Generate session ID if not provided (for deduplication)
    const effectiveSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Optimistically update local state for responsive UI
    const newState: CoinSystemState = {
      balance: coinState.balance + finalCoins,
      totalEarned: coinState.totalEarned + finalCoins,
      totalSpent: coinState.totalSpent,
    };
    saveState(newState);

    // SECURITY: Validate with server asynchronously
    // Server is source of truth - if validation fails, we should handle accordingly
    serverEarnCoins(finalCoins, 'focus_session', effectiveSessionId, {
      sessionMinutes: validMinutes,
      boosterMultiplier: validMultiplier,
      subscriptionMultiplier,
      bonusType: bonus.bonusType,
    }).then((response) => {
      if (response.success && response.newBalance !== undefined) {
        // SECURITY: Use server balance as source of truth
        const serverState: CoinSystemState = {
          balance: response.newBalance,
          totalEarned: response.totalEarned || newState.totalEarned,
          totalSpent: response.totalSpent || coinState.totalSpent,
        };
        saveState(serverState);
        coinLogger.debug('Server validated coin earn:', response.newBalance);
      } else if (response.duplicate) {
        // Session already rewarded - revert optimistic update
        coinLogger.warn('Duplicate session reward detected, reverting');
        saveState(coinState); // Revert to previous state
      } else if (!response.success) {
        coinLogger.warn('Server validation failed, local state may be inconsistent');
        // For non-authenticated users, keep local state
        // For authenticated users with server error, sync on next opportunity
      }
    }).catch((err) => {
      coinLogger.error('Failed to validate coin earn with server:', err);
    });

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

  /**
   * SECURITY: Add coins directly with server validation
   *
   * Used for direct rewards (achievements, daily rewards, etc.)
   * Source parameter tracks where the coins came from for audit purposes.
   */
  const addCoins = useCallback((
    amount: number,
    source: EarnSource = 'achievement'
  ): void => {
    // SECURITY: Client-side rate limiting
    if (!canPerformOperation('earn')) {
      coinLogger.warn('Rate limited: addCoins operation throttled');
      return;
    }

    // Validate input - must be a positive integer
    const validAmount = validateCoinTransaction(amount);
    if (validAmount <= 0) {
      coinLogger.warn('Invalid coin amount:', amount);
      return;
    }

    // Optimistically update local state
    const newState: CoinSystemState = {
      balance: coinState.balance + validAmount,
      totalEarned: coinState.totalEarned + validAmount,
      totalSpent: coinState.totalSpent,
    };
    saveState(newState);

    // SECURITY: Validate with server asynchronously
    serverEarnCoins(validAmount, source).then((response) => {
      if (response.success && response.newBalance !== undefined) {
        // SECURITY: Use server balance as source of truth
        const serverState: CoinSystemState = {
          balance: response.newBalance,
          totalEarned: response.totalEarned || newState.totalEarned,
          totalSpent: response.totalSpent || coinState.totalSpent,
        };
        saveState(serverState);
        coinLogger.debug('Server validated coin add:', response.newBalance);
      }
    }).catch((err) => {
      coinLogger.error('Failed to validate coin add with server:', err);
    });

    // Track coins earned for achievements
    dispatchAchievementEvent(ACHIEVEMENT_EVENTS.COINS_EARNED, {
      amount: validAmount,
      total: newState.totalEarned,
    });
  }, [coinState, saveState]);

  /**
   * SECURITY: Spend coins with server validation
   *
   * CRITICAL: For spending, we validate with the server before confirming.
   * This prevents double-spending and ensures server is source of truth.
   *
   * @param amount - Amount to spend
   * @param purpose - What the coins are being spent on (for audit)
   * @param itemId - Optional ID of the item being purchased
   * @returns Promise<boolean> - true if spend was successful
   */
  const spendCoins = useCallback(async (
    amount: number,
    purpose: SpendPurpose = 'shop_purchase',
    itemId?: string
  ): Promise<boolean> => {
    // SECURITY: Client-side rate limiting
    if (!canPerformOperation('spend')) {
      coinLogger.warn('Rate limited: spend operation throttled');
      return false;
    }

    // Validate input - must be a positive integer
    const validAmount = validateCoinTransaction(amount);
    if (validAmount <= 0) {
      coinLogger.warn('Invalid spend amount:', amount);
      return false;
    }

    // Local balance check (quick fail for obviously invalid requests)
    if (coinState.balance < validAmount) {
      return false;
    }

    // SECURITY: Validate with server BEFORE updating local state for spending
    // This prevents double-spending attacks
    const response = await serverSpendCoins(validAmount, purpose, itemId);

    if (response.success) {
      // SECURITY: Use server-provided balance as source of truth
      const newState: CoinSystemState = {
        balance: response.newBalance ?? (coinState.balance - validAmount),
        totalEarned: response.totalEarned ?? coinState.totalEarned,
        totalSpent: response.totalSpent ?? (coinState.totalSpent + validAmount),
      };
      saveState(newState);
      coinLogger.debug('Server validated coin spend:', newState.balance);
      return true;
    } else {
      coinLogger.warn('Server rejected coin spend:', response.error);
      // If server says insufficient balance, sync local state
      if (response.error?.includes('Insufficient')) {
        // Sync balance from server
        serverGetBalance().then((balanceResponse) => {
          if (balanceResponse.success && balanceResponse.newBalance !== undefined) {
            saveState({
              balance: balanceResponse.newBalance,
              totalEarned: balanceResponse.totalEarned || coinState.totalEarned,
              totalSpent: balanceResponse.totalSpent || coinState.totalSpent,
            });
          }
        });
      }
      return false;
    }
  }, [coinState, saveState]);

  /**
   * SECURITY: Synchronous spend for backwards compatibility
   *
   * This function provides a synchronous interface but validates asynchronously.
   * Use spendCoins (async) when possible for proper server validation.
   *
   * @deprecated Use spendCoins (async version) instead for proper server validation
   */
  const spendCoinsSync = useCallback((amount: number): boolean => {
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

    // SECURITY: Validate with server asynchronously and sync state
    serverSpendCoins(validAmount, 'shop_purchase').then((response) => {
      if (response.success && response.newBalance !== undefined) {
        saveState({
          balance: response.newBalance,
          totalEarned: response.totalEarned || newState.totalEarned,
          totalSpent: response.totalSpent || newState.totalSpent,
        });
      } else if (!response.success) {
        // Server rejected - revert and sync
        coinLogger.warn('Server rejected spend, reverting local state');
        serverGetBalance().then((balanceResponse) => {
          if (balanceResponse.success && balanceResponse.newBalance !== undefined) {
            saveState({
              balance: balanceResponse.newBalance,
              totalEarned: balanceResponse.totalEarned || coinState.totalEarned,
              totalSpent: balanceResponse.totalSpent || coinState.totalSpent,
            });
          }
        });
      }
    });

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

  /**
   * SECURITY: Sync balance from server
   *
   * Fetches the authoritative balance from the server and updates local state.
   * Call this periodically or after authentication to ensure consistency.
   */
  const syncFromServer = useCallback(async (): Promise<void> => {
    const response = await serverGetBalance();
    if (response.success && response.newBalance !== undefined) {
      const serverState: CoinSystemState = {
        balance: response.newBalance,
        totalEarned: response.totalEarned || coinState.totalEarned,
        totalSpent: response.totalSpent || coinState.totalSpent,
      };
      saveState(serverState);
      coinLogger.debug('Synced balance from server:', serverState.balance);
    }
  }, [coinState, saveState]);

  return {
    ...coinState,
    awardCoins,
    addCoins,
    spendCoins,
    spendCoinsSync, // For backwards compatibility
    canAfford,
    resetProgress,
    calculateCoinsFromDuration,
    getSubscriptionMultiplier,
    syncFromServer, // New: sync balance from server
  };
};
