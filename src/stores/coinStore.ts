/**
 * Coin Store
 *
 * Manages the user's in-game currency (coins). Tracks balance, total earned,
 * and total spent. Uses Zustand with persistence to localStorage.
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
import { persist } from 'zustand/middleware';
import { coinLogger } from '@/lib/logger';
import { coinSystemSchema } from '@/lib/storage-validation';
import { createValidatedStorage } from '@/lib/validated-zustand-storage';

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
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setBalance: (balance: number) => void;
  canAfford: (amount: number) => boolean;
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
  persist(
    (set, get) => ({
      ...initialState,
      addCoins: (amount) => {
        if (amount <= 0) return;
        // SECURITY: Mark as pending server validation
        // The actual server validation should be done via validate-coins edge function
        set((s) => ({
          balance: s.balance + amount,
          totalEarned: s.totalEarned + amount,
          pendingServerValidation: true,
        }));
        coinLogger.debug('Coins added locally, pending server validation', { amount });
      },
      spendCoins: (amount) => {
        const currentBalance = get().balance;
        if (currentBalance < amount) {
          coinLogger.warn('Insufficient balance for spend', { balance: currentBalance, required: amount });
          return false;
        }
        // SECURITY: Mark as pending server validation
        // The actual server validation should be done via validate-coins edge function
        set((s) => ({
          balance: s.balance - amount,
          totalSpent: s.totalSpent + amount,
          pendingServerValidation: true,
        }));
        coinLogger.debug('Coins spent locally, pending server validation', { amount });
        return true;
      },
      setBalance: (balance) => set({ balance }),
      canAfford: (amount) => get().balance >= amount,
      resetCoins: () => set(initialState),
      syncFromServer: (balance, totalEarned, totalSpent) => {
        // SECURITY: Server is authoritative - override local state
        set({
          balance,
          totalEarned,
          totalSpent,
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
          try {
            const legacy = localStorage.getItem('petIsland_coinSystem');
            if (legacy) {
              const parsed = JSON.parse(legacy);
              const validated = coinSystemSchema.safeParse(parsed);
              if (validated.success) return validated.data;
            }
          } catch { /* ignore */ }
        }
        if (state) coinLogger.debug('Coin store rehydrated and validated');
      },
    }
  )
);

export const useCoinBalance = () => useCoinStore((s) => s.balance);
export const useTotalEarned = () => useCoinStore((s) => s.totalEarned);
export const useTotalSpent = () => useCoinStore((s) => s.totalSpent);
