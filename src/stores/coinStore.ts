/**
 * Coin Store
 *
 * Manages the user's in-game currency (coins). Tracks balance, total earned,
 * and total spent. Uses Zustand with persistence to localStorage.
 *
 * This is the SINGLE SOURCE OF TRUTH for coin state. All coin operations
 * should go through this store. The useCoinSystem hook is a thin wrapper
 * that adds game-specific functionality (rewards, bonuses, etc).
 *
 * SECURITY: This store handles local state only. All coin operations should
 * be validated server-side through the validate-coins edge function.
 * The local state serves as a cache and for offline support.
 *
 * @module stores/coinStore
 *
 * @example
 * ```typescript
 * import { useCoinStore, useCoinBalance } from '@/stores/coinStore';
 *
 * // In a component
 * const { addCoins, spendCoins, canAfford } = useCoinStore();
 *
 * // Check if user can afford an item
 * if (canAfford(100)) {
 *   spendCoins(100);
 * }
 *
 * // Or use selector hooks
 * const balance = useCoinBalance();
 * ```
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { coinLogger } from '@/lib/logger';
import { coinSystemSchema } from '@/lib/storage-validation';
import { createValidatedStorage } from '@/lib/validated-zustand-storage';
import {
  validateCoinAmount,
  validateCoinTransaction,
  isNonNegativeInteger,
} from '@/lib/validation';

/**
 * Represents the user's coin balance state
 */
export interface CoinState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  /** Last server-verified balance timestamp */
  lastServerSync: number | null;
  /** Pending operations that need server validation */
  pendingServerValidation: boolean;
}

interface CoinStore extends CoinState {
  /** Add coins with validation */
  addCoins: (amount: number) => void;
  /** Spend coins with validation - returns true if successful */
  spendCoins: (amount: number) => boolean;
  /** Set balance directly (use with caution) */
  setBalance: (balance: number) => void;
  /** Check if user can afford an amount */
  canAfford: (amount: number) => boolean;
  /** Reset all coin state */
  resetCoins: () => void;
  /** Sync balance from server - called after server validation */
  syncFromServer: (balance: number, totalEarned: number, totalSpent: number) => void;
  /** Mark that server validation is pending */
  setPendingValidation: (pending: boolean) => void;
}

const initialState: CoinState = {
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  lastServerSync: null,
  pendingServerValidation: false,
};

export const useCoinStore = create<CoinStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        addCoins: (amount) => {
          const validAmount = validateCoinTransaction(amount);
          if (validAmount <= 0) {
            coinLogger.warn('Invalid coin amount to add:', amount);
            return;
          }
          // SECURITY: Mark as pending server validation
          // The actual server validation should be done via validate-coins edge function
          set((s) => ({
            balance: s.balance + validAmount,
            totalEarned: s.totalEarned + validAmount,
            pendingServerValidation: true,
          }));
          coinLogger.debug('Coins added locally, pending server validation', { amount: validAmount });
        },
        spendCoins: (amount) => {
          const validAmount = validateCoinTransaction(amount);
          if (validAmount <= 0) {
            coinLogger.warn('Invalid coin amount to spend:', amount);
            return false;
          }
          const currentBalance = get().balance;
          if (currentBalance < validAmount) {
            coinLogger.warn('Insufficient balance for spend', { balance: currentBalance, required: validAmount });
            return false;
          }
          // SECURITY: Mark as pending server validation
          // The actual server validation should be done via validate-coins edge function
          set((s) => ({
            balance: s.balance - validAmount,
            totalSpent: s.totalSpent + validAmount,
            pendingServerValidation: true,
          }));
          coinLogger.debug('Coins spent locally, pending server validation', { amount: validAmount });
          return true;
        },
        setBalance: (balance) => {
          const validBalance = validateCoinAmount(balance);
          set({ balance: validBalance });
        },
        canAfford: (amount) => {
          if (!isNonNegativeInteger(amount)) return false;
          return get().balance >= amount;
        },
        resetCoins: () => set(initialState),
        syncFromServer: (balance, totalEarned, totalSpent) => {
          // SECURITY: Server is authoritative - override local state
          set({
            balance: validateCoinAmount(balance),
            totalEarned: validateCoinAmount(totalEarned),
            totalSpent: validateCoinAmount(totalSpent),
            lastServerSync: Date.now(),
            pendingServerValidation: false,
          });
          coinLogger.debug('Coins synced from server', { balance, totalEarned, totalSpent });
        },
        setPendingValidation: (pending) => set({ pendingServerValidation: pending }),
      }),
      {
        name: 'nomo_coin_system',
        storage: createValidatedStorage({
          schema: coinSystemSchema,
          defaultState: initialState,
          name: 'coin-store',
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) {
            // Try to migrate from legacy storage key
            try {
              const legacy = localStorage.getItem('petIsland_coinSystem');
              if (legacy) {
                const parsed = JSON.parse(legacy);
                const validated = coinSystemSchema.safeParse(parsed);
                if (validated.success) {
                  coinLogger.debug('Migrated coin data from legacy storage');
                  // Clean up legacy key after migration
                  localStorage.removeItem('petIsland_coinSystem');
                  return validated.data;
                }
              }
            } catch { /* ignore */ }
          }
          if (state) coinLogger.debug('Coin store rehydrated and validated');
        },
      }
    )
  )
);

// Selector hooks for efficient subscriptions
export const useCoinBalance = () => useCoinStore((s) => s.balance);
export const useTotalEarned = () => useCoinStore((s) => s.totalEarned);
export const useTotalSpent = () => useCoinStore((s) => s.totalSpent);

// Subscribe to coin changes for cross-component communication
// This replaces the window.dispatchEvent pattern
export const subscribeToCoinChanges = (callback: (state: CoinState) => void) => {
  return useCoinStore.subscribe(
    (state) => ({ balance: state.balance, totalEarned: state.totalEarned, totalSpent: state.totalSpent }),
    (newState) => callback({
      ...newState,
      lastServerSync: useCoinStore.getState().lastServerSync,
      pendingServerValidation: useCoinStore.getState().pendingServerValidation,
    }),
    { equalityFn: (a, b) => a.balance === b.balance && a.totalEarned === b.totalEarned && a.totalSpent === b.totalSpent }
  );
};
