import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { coinLogger } from '@/lib/logger';
import { coinSystemSchema } from '@/lib/storage-validation';
import { createValidatedStorage } from '@/lib/validated-zustand-storage';

export interface CoinState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface CoinStore extends CoinState {
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setBalance: (balance: number) => void;
  canAfford: (amount: number) => boolean;
  resetCoins: () => void;
}

const initialState: CoinState = { balance: 0, totalEarned: 0, totalSpent: 0 };

export const useCoinStore = create<CoinStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      addCoins: (amount) => {
        if (amount <= 0) return;
        set((s) => ({ balance: s.balance + amount, totalEarned: s.totalEarned + amount }));
      },
      spendCoins: (amount) => {
        if (get().balance < amount) return false;
        set((s) => ({ balance: s.balance - amount, totalSpent: s.totalSpent + amount }));
        return true;
      },
      setBalance: (balance) => set({ balance }),
      canAfford: (amount) => get().balance >= amount,
      resetCoins: () => set(initialState),
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
