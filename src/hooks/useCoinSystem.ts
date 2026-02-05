/**
 * Coin System Hook
 *
 * Provides game-specific coin functionality built on top of the Zustand coin store.
 * Includes earning coins from focus sessions, bonus multipliers, and achievement tracking.
 *
 * ARCHITECTURE: This hook is a thin wrapper around useCoinStore (the single source of truth).
 * All state is managed by the Zustand store - no local useState for coin data.
 *
 * SECURITY: All coin operations are validated server-side through the validate-coins
 * edge function. The local state (Zustand store) serves as a cache for responsive UI.
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
 *   const handlePurchase = async () => {
 *     if (await spendCoins(price)) {
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

import { useCallback, useMemo, useEffect } from 'react';
import { useCoinStore } from '@/stores/coinStore';
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from '@/hooks/useAchievementTracking';
import { TIER_BENEFITS, isValidSubscriptionTier, type SubscriptionTier } from './usePremiumStatus';
import { coinLogger } from '@/lib/logger';
import { COIN_CONFIG, RATE_LIMIT_CONFIG } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import {
  validateCoinTransaction,
  validateMultiplier,
  validateSessionMinutes,
} from '@/lib/validation';

/**
 * SECURITY: Server-side coin validation types
 * All coin operations must be validated server-side to prevent manipulation
 */
type EarnSource = 'focus_session' | 'daily_reward' | 'achievement' | 'quest_reward' | 'subscription_bonus' | 'lucky_wheel' | 'referral' | 'admin_grant' | 'iap_purchase';
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

function canPerformOperation(operation: 'earn' | 'spend'): boolean {
  const now = Date.now();
  if (now - lastOperationTime[operation] < RATE_LIMIT_CONFIG.MIN_COIN_OPERATION_INTERVAL_MS) {
    return false;
  }
  lastOperationTime[operation] = now;
  return true;
}

/** Reset rate limiter - for testing purposes only */
export function _resetRateLimiter(): void {
  lastOperationTime.earn = 0;
  lastOperationTime.spend = 0;
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
      // When edge function returns non-2xx, the response body is in error.context
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorContext = (error as any).context;
      if (errorContext && typeof errorContext === 'object' && 'success' in errorContext) {
        coinLogger.warn('Server earn rejected:', errorContext.error);
        return errorContext as ServerCoinResponse;
      }
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
      // When edge function returns non-2xx, the response body is in error.context
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorContext = (error as any).context;
      if (errorContext && typeof errorContext === 'object' && 'success' in errorContext) {
        coinLogger.warn('Server spend rejected:', errorContext.error);
        return errorContext as ServerCoinResponse;
      }
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

// Coin rewards based on session duration (in minutes)
// Balanced for healthy economy - free players earn ~490 coins/week from sessions
const COIN_REWARDS: Record<number, number> = {
  25: 20,   // 25 minutes = 20 coins
  30: 30,   // 30 minutes = 30 coins
  45: 50,   // 45 minutes = 50 coins
  60: 80,   // 1 hour = 80 coins
  90: 140,  // 90 minutes = 140 coins
  120: 200, // 2 hours = 200 coins
  180: 320, // 3 hours = 320 coins
  240: 440, // 4 hours = 440 coins
  300: 600, // 5 hours = 600 coins
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
  // Use Zustand store as the single source of truth for local state
  const balance = useCoinStore((s) => s.balance);
  const totalEarned = useCoinStore((s) => s.totalEarned);
  const totalSpent = useCoinStore((s) => s.totalSpent);
  const storeAddCoins = useCoinStore((s) => s.addCoins);
  const storeSpendCoins = useCoinStore((s) => s.spendCoins);
  const storeCanAfford = useCoinStore((s) => s.canAfford);
  const storeResetCoins = useCoinStore((s) => s.resetCoins);
  const storeSyncFromServer = useCoinStore((s) => s.syncFromServer);

  // Sync balance from server - returns true if balance was actually updated
  const syncFromServer = useCallback(async (): Promise<boolean> => {
    const response = await serverGetBalance();
    if (response.success && response.newBalance !== undefined) {
      storeSyncFromServer(
        response.newBalance,
        response.totalEarned ?? totalEarned,
        response.totalSpent ?? totalSpent
      );
      coinLogger.debug('Synced balance from server:', response.newBalance);
      return true;
    }
    coinLogger.warn('Failed to sync balance from server:', response.error || 'No balance returned');
    return false;
  }, [storeSyncFromServer, totalEarned, totalSpent]);

  // PHASE 1: Initial coin sync on authentication
  useEffect(() => {
    // Skip if Supabase is not configured (guest mode)
    if (!isSupabaseConfigured) {
      coinLogger.debug('Supabase not configured, skipping auth sync');
      return;
    }

    const initSync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await syncFromServer();
          coinLogger.debug('Initial coin sync completed on mount');
        }
      } catch (err) {
        coinLogger.debug('Initial coin sync skipped:', err);
      }
    };

    initSync();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Use setTimeout to avoid potential deadlock
          setTimeout(() => {
            syncFromServer().catch((err) => {
              coinLogger.debug('Auth sync failed:', err);
            });
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [syncFromServer]);

  // PHASE 4: Periodic background sync every 5 minutes
  useEffect(() => {
    // Skip if Supabase is not configured (guest mode)
    if (!isSupabaseConfigured) {
      return;
    }

    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await syncFromServer();
          coinLogger.debug('Periodic coin sync completed');
        }
      } catch {
        // Silent fail - just log
        coinLogger.debug('Periodic sync failed');
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [syncFromServer]);

  // Listen for bonus coin grants from subscription purchase
  useEffect(() => {
    const handleBonusCoins = (event: Event) => {
      const customEvent = event as CustomEvent<{ amount: number; planId: string }>;
      const { amount } = customEvent.detail;
      if (amount > 0) {
        storeAddCoins(amount);
        coinLogger.debug('Bonus coins granted from subscription', { amount });
      }
    };

    window.addEventListener('petIsland_grantBonusCoins', handleBonusCoins);
    return () => {
      window.removeEventListener('petIsland_grantBonusCoins', handleBonusCoins);
    };
  }, [storeAddCoins]);

  // Listen for IAP coin grants (coin packs and bundles)
  // Server has already added coins, so we just need to sync the local state
  useEffect(() => {
    const handleIAPCoins = (event: Event) => {
      const customEvent = event as CustomEvent<{ coinsGranted: number }>;
      const { coinsGranted } = customEvent.detail;
      if (coinsGranted > 0) {
        // Sync from server to get the updated balance
        syncFromServer().then(() => {
          coinLogger.debug('IAP coins synced from server', { coinsGranted });
        }).catch((err) => {
          // Fallback: optimistically add coins locally if sync fails
          storeAddCoins(coinsGranted);
          coinLogger.warn('IAP coins sync failed, added locally', { coinsGranted, err });
        });
      }
    };

    window.addEventListener('iap:coinsGranted', handleIAPCoins);
    return () => {
      window.removeEventListener('iap:coinsGranted', handleIAPCoins);
    };
  }, [syncFromServer, storeAddCoins]);

  // Helper to get subscription multiplier
  const getSubscriptionMultiplier = useCallback((): number => {
    const premiumData = localStorage.getItem('petIsland_premium');
    if (premiumData) {
      try {
        const parsed = JSON.parse(premiumData);
        if (isValidSubscriptionTier(parsed.tier)) {
          return TIER_BENEFITS[parsed.tier as SubscriptionTier].coinMultiplier;
        }
      } catch {
        // Invalid data
      }
    }
    return 1;
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
   * This function validates with the server to prevent manipulation.
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

    // Optimistically update Zustand store for responsive UI
    storeAddCoins(finalCoins);

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
        storeSyncFromServer(
          response.newBalance,
          response.totalEarned || totalEarned + finalCoins,
          response.totalSpent || totalSpent
        );
        coinLogger.debug('Server validated coin earn:', response.newBalance);
      } else if (response.duplicate) {
        // Session already rewarded - sync from server to get correct state
        coinLogger.warn('Duplicate session reward detected, syncing from server');
        serverGetBalance().then((balanceResponse) => {
          if (balanceResponse.success && balanceResponse.newBalance !== undefined) {
            storeSyncFromServer(
              balanceResponse.newBalance,
              balanceResponse.totalEarned || totalEarned,
              balanceResponse.totalSpent || totalSpent
            );
          }
        });
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
      total: totalEarned + finalCoins,
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
  }, [calculateCoinsFromDuration, getSubscriptionMultiplier, storeAddCoins, storeSyncFromServer, totalEarned, totalSpent]);

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

    // Optimistically update Zustand store
    storeAddCoins(validAmount);

    // SECURITY: Validate with server asynchronously
    serverEarnCoins(validAmount, source).then((response) => {
      if (response.success && response.newBalance !== undefined) {
        // SECURITY: Use server balance as source of truth
        storeSyncFromServer(
          response.newBalance,
          response.totalEarned || totalEarned + validAmount,
          response.totalSpent || totalSpent
        );
        coinLogger.debug('Server validated coin add:', response.newBalance);
      }
    }).catch((err) => {
      coinLogger.error('Failed to validate coin add with server:', err);
    });

    // Track coins earned for achievements
    if (amount > 0) {
      dispatchAchievementEvent(ACHIEVEMENT_EVENTS.COINS_EARNED, {
        amount,
        total: totalEarned + amount,
      });
    }
  }, [storeAddCoins, storeSyncFromServer, totalEarned, totalSpent]);

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
    if (!storeCanAfford(validAmount)) {
      return false;
    }

    // SECURITY: Validate with server BEFORE updating local state for spending
    // This prevents double-spending attacks
    const response = await serverSpendCoins(validAmount, purpose, itemId);

    if (response.success) {
      // SECURITY: Use server-provided balance as source of truth
      if (response.newBalance !== undefined) {
        storeSyncFromServer(
          response.newBalance,
          response.totalEarned ?? totalEarned,
          response.totalSpent ?? totalSpent + validAmount
        );
      } else {
        // For unauthenticated users, update local store
        storeSpendCoins(validAmount);
      }
      coinLogger.debug('Server validated coin spend:', response.newBalance ?? balance - validAmount);
      return true;
    } else {
      coinLogger.warn('Server rejected coin spend:', response.error);
      // If server says insufficient balance, sync local state
      if (response.error?.includes('Insufficient')) {
        // Sync balance from server
        serverGetBalance().then((balanceResponse) => {
          if (balanceResponse.success && balanceResponse.newBalance !== undefined) {
            storeSyncFromServer(
              balanceResponse.newBalance,
              balanceResponse.totalEarned ?? totalEarned,
              balanceResponse.totalSpent ?? totalSpent
            );
          }
        });
      }
      return false;
    }
  }, [balance, storeCanAfford, storeSpendCoins, storeSyncFromServer, totalEarned, totalSpent]);

  // Check if user can afford something
  const canAfford = useCallback((amount: number): boolean => {
    return storeCanAfford(amount);
  }, [storeCanAfford]);

  // Reset progress
  const resetProgress = useCallback(() => {
    storeResetCoins();
  }, [storeResetCoins]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    balance,
    totalEarned,
    totalSpent,
    awardCoins,
    addCoins,
    spendCoins,
    canAfford,
    resetProgress,
    calculateCoinsFromDuration,
    getSubscriptionMultiplier,
    syncFromServer,
  }), [
    balance,
    totalEarned,
    totalSpent,
    awardCoins,
    addCoins,
    spendCoins,
    canAfford,
    resetProgress,
    calculateCoinsFromDuration,
    getSubscriptionMultiplier,
    syncFromServer,
  ]);
};
