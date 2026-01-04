/**
 * Currency State Hook
 *
 * Manages coins and boosters.
 * Part of the decomposed useBackendAppState pattern.
 */

import { useMemo } from 'react';
import { useCoinSystem } from '@/hooks/useCoinSystem';
import { useCoinBooster } from '@/hooks/useCoinBooster';

export interface CurrencyState {
  // Coins
  coinBalance: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;

  // Boosters
  isBoosterActive: boolean;
  activeBooster: unknown | null;
  boosterMultiplier: number;
  boosterTimeRemaining: string;
}

export interface CurrencyActions {
  awardCoins: (sessionMinutes: number, multiplier?: number) => number;
  spendCoins: (amount: number) => boolean;
  activateBooster: (boosterId: string) => void;
  getCurrentMultiplier: () => number;
}

export function useCurrencyState(): CurrencyState & CurrencyActions {
  const coinSystem = useCoinSystem();
  const coinBooster = useCoinBooster();

  const state = useMemo<CurrencyState>(() => ({
    coinBalance: coinSystem.balance,
    totalCoinsEarned: coinSystem.totalEarned,
    totalCoinsSpent: coinSystem.totalSpent,
    isBoosterActive: coinBooster.isBoosterActive(),
    activeBooster: coinBooster.activeBooster,
    boosterMultiplier: coinBooster.getCurrentMultiplier(),
    boosterTimeRemaining: coinBooster.getTimeRemainingFormatted(),
  }), [coinSystem, coinBooster]);

  return {
    ...state,
    awardCoins: coinSystem.awardCoins,
    spendCoins: coinSystem.spendCoins,
    activateBooster: coinBooster.activateBooster,
    getCurrentMultiplier: coinBooster.getCurrentMultiplier,
  };
}
