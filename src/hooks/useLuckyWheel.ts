import { useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { LUCKY_WHEEL_PRIZES, LuckyWheelPrize, spinWheel } from '@/data/GamificationData';
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from '@/hooks/useAchievementTracking';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { storageLogger } from '@/lib/logger';

export interface LuckyWheelState {
  lastSpinDate: string | null;
  spinsUsedToday: number;
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
const LUCKY_WHEEL_SYNC_EVENT = 'luckyWheel_stateSync';
const LEGACY_LUCKY_WHEEL_KEY = STORAGE_KEYS.LUCKY_WHEEL; // 'nomo_lucky_wheel'

/**
 * Build a per-user storage key so that switching accounts doesn't share
 * spin state. Falls back to the global key for guest mode.
 */
function getLuckyWheelStorageKey(userId: string | undefined): string {
  if (userId) return `${LEGACY_LUCKY_WHEEL_KEY}_${userId}`;
  return LEGACY_LUCKY_WHEEL_KEY;
}

export const useLuckyWheel = () => {
  const { user, isGuestMode } = useAuth();
  const userId = user?.id;
  const storageKey = getLuckyWheelStorageKey(userId);

  const [state, setState] = useState<LuckyWheelState>({
    lastSpinDate: null,
    spinsUsedToday: 0,
    totalSpins: 0,
    jackpotsWon: 0,
    totalCoinsWon: 0,
    totalXPWon: 0,
    spinHistory: [],
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<LuckyWheelPrize | null>(null);

  // Track which userId we last loaded for, so we reload on user change
  const loadedForRef = useRef<string | undefined>(undefined);

  // Load saved state (also used to reload on cross-instance sync)
  const reloadFromStorage = useCallback(() => {
    // Try user-specific key first
    let raw = localStorage.getItem(storageKey);

    // Fall back to legacy global key for migration
    if (!raw && storageKey !== LEGACY_LUCKY_WHEEL_KEY) {
      raw = localStorage.getItem(LEGACY_LUCKY_WHEEL_KEY);
      if (raw) {
        try {
          localStorage.setItem(storageKey, raw);
          localStorage.removeItem(LEGACY_LUCKY_WHEEL_KEY);
        } catch {
          // Storage full — continue with what we have
        }
      }
    }

    if (raw) {
      try {
        const saved = JSON.parse(raw) as LuckyWheelState;
        const migrated: LuckyWheelState = {
          ...saved,
          spinsUsedToday: saved.spinsUsedToday ?? (
            saved.lastSpinDate && new Date(saved.lastSpinDate).toDateString() === new Date().toDateString() ? 1 : 0
          ),
        };
        setState(migrated);
      } catch {
        // Corrupted data — reset to defaults
      }
    } else {
      // No saved state — reset to defaults
      setState({
        lastSpinDate: null,
        spinsUsedToday: 0,
        totalSpins: 0,
        jackpotsWon: 0,
        totalCoinsWon: 0,
        totalXPWon: 0,
        spinHistory: [],
      });
    }
  }, [storageKey]);

  // Reload when user changes (sign-in / sign-out) or on initial mount
  useEffect(() => {
    if (!userId && !isGuestMode) return; // Auth still loading
    if (loadedForRef.current === userId) return;
    loadedForRef.current = userId;
    reloadFromStorage();
  }, [userId, isGuestMode, reloadFromStorage]);

  // Sync across instances: when another useLuckyWheel saves, reload here
  useEffect(() => {
    const handleSync = () => reloadFromStorage();
    window.addEventListener(LUCKY_WHEEL_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(LUCKY_WHEEL_SYNC_EVENT, handleSync);
  }, [reloadFromStorage]);

  const saveState = useCallback((newState: LuckyWheelState): boolean => {
    setState(newState);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newState));
      // Notify other useLuckyWheel instances (e.g. GamificationHub) to reload
      window.dispatchEvent(new CustomEvent(LUCKY_WHEEL_SYNC_EVENT));
      return true;
    } catch (error) {
      storageLogger.error('[LuckyWheel] Failed to save state:', error);
      toast.error('Could not save your spin result', {
        description: 'Your progress may be lost. Try clearing some browser storage.',
        duration: 5000,
      });
      return false;
    }
  }, [storageKey]);

  // Get number of spins used today (resets on new day)
  const getSpinsUsedToday = useCallback((): number => {
    if (!state.lastSpinDate) return 0;
    const lastSpin = new Date(state.lastSpinDate);
    const today = new Date();
    if (lastSpin.toDateString() !== today.toDateString()) return 0;
    return state.spinsUsedToday;
  }, [state.lastSpinDate, state.spinsUsedToday]);

  // Check how many spins remain today
  const spinsRemainingToday = useCallback((dailyLimit: number): number => {
    return Math.max(0, dailyLimit - getSpinsUsedToday());
  }, [getSpinsUsedToday]);

  // Check if spin is available today
  const canSpinToday = useCallback((dailyLimit: number = 1): boolean => {
    return spinsRemainingToday(dailyLimit) > 0;
  }, [spinsRemainingToday]);

  // Get time until next spin (midnight reset)
  const getTimeUntilNextSpin = useCallback((): { hours: number; minutes: number } => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  }, []);

  // Perform the spin
  const spin = useCallback((dailyLimit: number = 1): Promise<LuckyWheelPrize> => {
    return new Promise((resolve, reject) => {
      if (!canSpinToday(dailyLimit)) {
        reject(new Error('No spins remaining today'));
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

      // Save state IMMEDIATELY so spin count is persisted before any
      // modal close/reopen could reload stale data from storage
      const now = new Date().toISOString();
      const usedToday = getSpinsUsedToday();

      const newHistory: SpinResult[] = [
        { prize, timestamp: now },
        ...state.spinHistory.slice(0, MAX_HISTORY - 1),
      ];

      const coinPrizeTypes = ['coins', 'jackpot'];
      const newState: LuckyWheelState = {
        lastSpinDate: now,
        spinsUsedToday: usedToday + 1,
        totalSpins: state.totalSpins + 1,
        jackpotsWon: prize.type === 'jackpot' ? state.jackpotsWon + 1 : state.jackpotsWon,
        totalCoinsWon: coinPrizeTypes.includes(prize.type) ? state.totalCoinsWon + (prize.amount || 0) : state.totalCoinsWon,
        totalXPWon: prize.type === 'xp' ? state.totalXPWon + (prize.amount || 0) : state.totalXPWon,
        spinHistory: newHistory,
      };

      saveState(newState);

      // Defer only UI animation state — actual data is already persisted
      setTimeout(() => {
        setIsSpinning(false);

        // Track wheel spin for achievements
        dispatchAchievementEvent(ACHIEVEMENT_EVENTS.WHEEL_SPIN, {});

        resolve(prize);
      }, 100); // Small delay, actual animation handled in component
    });
  }, [state, canSpinToday, isSpinning, saveState, getSpinsUsedToday]);

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
        icon: prize.icon,
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
    spinsRemainingToday,
    getSpinsUsedToday,
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
