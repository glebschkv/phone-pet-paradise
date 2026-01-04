import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { coinLogger } from '@/lib/logger';

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
      onRehydrateStorage: () => (state) => {
        if (!state) {
          try {
            const legacy = localStorage.getItem('petIsland_coinSystem');
            if (legacy) return JSON.parse(legacy);
          } catch { /* ignore */ }
        }
        if (state) coinLogger.debug('Coin store rehydrated');
      },
    }
  )
);

export const useCoinBalance = () => useCoinStore((s) => s.balance);
export const useTotalEarned = () => useCoinStore((s) => s.totalEarned);
export const useTotalSpent = () => useCoinStore((s) => s.totalSpent);
