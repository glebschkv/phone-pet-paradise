import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { LUCKY_WHEEL_PRIZES, LuckyWheelPrize, spinWheel } from '@/data/GamificationData';
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from '@/hooks/useAchievementTracking';

export interface LuckyWheelState {
  lastSpinDate: string | null;
  totalSpins: number;
  jackpotsWon: number;
  totalCoinsWon: number;
  totalXPWon: number;
  spinHistory: SpinResult[];
}

export interface SpinResult {
  prize: LuckyWheelPrize;
  timestamp: string;
}

const MAX_HISTORY = 20;

export const useLuckyWheel = () => {
  const [state, setState] = useState<LuckyWheelState>({
    lastSpinDate: null,
    totalSpins: 0,
    jackpotsWon: 0,
    totalCoinsWon: 0,
    totalXPWon: 0,
    spinHistory: [],
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<LuckyWheelPrize | null>(null);

  // Load saved state
  useEffect(() => {
    const saved = storage.get<LuckyWheelState>(STORAGE_KEYS.LUCKY_WHEEL);
    if (saved) {
      setState(saved);
    }
  }, []);

  const saveState = useCallback((newState: LuckyWheelState) => {
    setState(newState);
    storage.set(STORAGE_KEYS.LUCKY_WHEEL, newState);
  }, []);

  // Check if spin is available today
  const canSpinToday = useCallback((): boolean => {
    if (!state.lastSpinDate) return true;
    const lastSpin = new Date(state.lastSpinDate);
    const today = new Date();
    return lastSpin.toDateString() !== today.toDateString();
  }, [state.lastSpinDate]);

  // Get time until next spin
  const getTimeUntilNextSpin = useCallback((): { hours: number; minutes: number } => {
    if (canSpinToday()) return { hours: 0, minutes: 0 };

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  }, [canSpinToday]);

  // Perform the spin
  const spin = useCallback((): Promise<LuckyWheelPrize> => {
    return new Promise((resolve, reject) => {
      if (!canSpinToday()) {
        reject(new Error('Already spun today'));
        return;
      }

      if (isSpinning) {
        reject(new Error('Already spinning'));
        return;
      }

      setIsSpinning(true);

      // Determine prize immediately but delay reveal for animation
      const prize = spinWheel();
      setCurrentPrize(prize);

      // Simulate spin animation time (will be handled by component)
      setTimeout(() => {
        const now = new Date().toISOString();

        const newHistory: SpinResult[] = [
          { prize, timestamp: now },
          ...state.spinHistory.slice(0, MAX_HISTORY - 1),
        ];

        const newState: LuckyWheelState = {
          lastSpinDate: now,
          totalSpins: state.totalSpins + 1,
          jackpotsWon: prize.type === 'jackpot' ? state.jackpotsWon + 1 : state.jackpotsWon,
          totalCoinsWon: prize.type === 'coins' ? state.totalCoinsWon + (prize.amount || 0) : state.totalCoinsWon,
          totalXPWon: prize.type === 'xp' ? state.totalXPWon + (prize.amount || 0) : state.totalXPWon,
          spinHistory: newHistory,
        };

        saveState(newState);
        setIsSpinning(false);

        // Track wheel spin for achievements
        dispatchAchievementEvent(ACHIEVEMENT_EVENTS.WHEEL_SPIN, {});

        resolve(prize);
      }, 100); // Small delay, actual animation handled in component
    });
  }, [state, canSpinToday, isSpinning, saveState]);

  // Get winning segment index for wheel animation
  const getWinningSegmentIndex = useCallback((prize: LuckyWheelPrize): number => {
    return LUCKY_WHEEL_PRIZES.findIndex(p => p.id === prize.id);
  }, []);

  // Get wheel configuration
  const getWheelConfig = useCallback(() => {
    return {
      segments: LUCKY_WHEEL_PRIZES.map(prize => ({
        id: prize.id,
        label: prize.name,
        emoji: prize.emoji,
        color: prize.color,
        rarity: prize.rarity,
      })),
      segmentCount: LUCKY_WHEEL_PRIZES.length,
    };
  }, []);

  // Get stats
  const getStats = useCallback(() => {
    return {
      totalSpins: state.totalSpins,
      jackpotsWon: state.jackpotsWon,
      totalCoinsWon: state.totalCoinsWon,
      totalXPWon: state.totalXPWon,
      averageCoinsPerSpin: state.totalSpins > 0 ? Math.round(state.totalCoinsWon / state.totalSpins) : 0,
      averageXPPerSpin: state.totalSpins > 0 ? Math.round(state.totalXPWon / state.totalSpins) : 0,
    };
  }, [state]);

  // Get recent wins
  const getRecentWins = useCallback((count: number = 5): SpinResult[] => {
    return state.spinHistory.slice(0, count);
  }, [state.spinHistory]);

  // Get rarity distribution from history
  const getRarityDistribution = useCallback((): Record<string, number> => {
    const distribution: Record<string, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    state.spinHistory.forEach(result => {
      distribution[result.prize.rarity]++;
    });

    return distribution;
  }, [state.spinHistory]);

  return {
    state,
    isSpinning,
    currentPrize,
    canSpinToday,
    getTimeUntilNextSpin,
    spin,
    getWinningSegmentIndex,
    getWheelConfig,
    getStats,
    getRecentWins,
    getRarityDistribution,
    prizes: LUCKY_WHEEL_PRIZES,
  };
};
