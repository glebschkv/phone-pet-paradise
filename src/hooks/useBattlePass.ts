import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { getCurrentSeason, Season, BattlePassTier, BattlePassReward } from '@/data/GamificationData';

export interface BattlePassState {
  seasonId: string;
  currentTier: number;
  currentXP: number;
  isPremium: boolean;
  claimedTiers: number[]; // Tiers where rewards have been claimed
  premiumClaimedTiers: number[];
}

interface BattlePassProgress {
  currentTier: number;
  currentXP: number;
  xpToNextTier: number;
  progressPercent: number;
  season: Season | null;
  daysRemaining: number;
}

const BATTLE_PASS_XP_UPDATE_EVENT = 'petIsland_battlePassXPUpdate';

export const useBattlePass = () => {
  const [state, setState] = useState<BattlePassState>({
    seasonId: '',
    currentTier: 0,
    currentXP: 0,
    isPremium: false,
    claimedTiers: [],
    premiumClaimedTiers: [],
  });

  const currentSeason = getCurrentSeason();

  // Load saved state
  useEffect(() => {
    const saved = storage.get<BattlePassState>(STORAGE_KEYS.BATTLE_PASS);
    if (saved) {
      // Check if it's a new season
      if (currentSeason && saved.seasonId !== currentSeason.id) {
        // Reset for new season
        const newState: BattlePassState = {
          seasonId: currentSeason.id,
          currentTier: 0,
          currentXP: 0,
          isPremium: saved.isPremium, // Keep premium status
          claimedTiers: [],
          premiumClaimedTiers: [],
        };
        setState(newState);
        storage.set(STORAGE_KEYS.BATTLE_PASS, newState);
      } else {
        setState(saved);
      }
    } else if (currentSeason) {
      const initial: BattlePassState = {
        seasonId: currentSeason.id,
        currentTier: 0,
        currentXP: 0,
        isPremium: false,
        claimedTiers: [],
        premiumClaimedTiers: [],
      };
      setState(initial);
      storage.set(STORAGE_KEYS.BATTLE_PASS, initial);
    }
  }, [currentSeason?.id]);

  // Listen for XP updates from focus sessions
  useEffect(() => {
    const handleXPUpdate = (event: CustomEvent<{ xp: number }>) => {
      addBattlePassXP(event.detail.xp);
    };

    window.addEventListener(BATTLE_PASS_XP_UPDATE_EVENT, handleXPUpdate as EventListener);
    return () => {
      window.removeEventListener(BATTLE_PASS_XP_UPDATE_EVENT, handleXPUpdate as EventListener);
    };
  }, [state]);

  const saveState = useCallback((newState: BattlePassState) => {
    setState(newState);
    storage.set(STORAGE_KEYS.BATTLE_PASS, newState);
  }, []);

  // Calculate current tier from XP
  const calculateTierFromXP = useCallback((xp: number): number => {
    if (!currentSeason) return 0;

    let tier = 0;
    let cumulativeXP = 0;

    for (const t of currentSeason.tiers) {
      cumulativeXP += t.xpRequired;
      if (xp >= cumulativeXP) {
        tier = t.tier;
      } else {
        break;
      }
    }

    return tier;
  }, [currentSeason]);

  // Add XP to battle pass
  const addBattlePassXP = useCallback((xp: number): { newTier: number; tieredUp: boolean } => {
    const oldTier = state.currentTier;
    const newXP = state.currentXP + xp;
    const newTier = calculateTierFromXP(newXP);

    const newState: BattlePassState = {
      ...state,
      currentXP: newXP,
      currentTier: newTier,
    };

    saveState(newState);

    return {
      newTier,
      tieredUp: newTier > oldTier,
    };
  }, [state, calculateTierFromXP, saveState]);

  // Claim a tier reward
  const claimTierReward = useCallback((tier: number, isPremiumReward: boolean): BattlePassReward | null => {
    if (!currentSeason) return null;

    const tierData = currentSeason.tiers.find(t => t.tier === tier);
    if (!tierData) return null;

    if (tier > state.currentTier) return null; // Can't claim unreached tier

    if (isPremiumReward) {
      if (!state.isPremium) return null; // Can't claim premium without premium
      if (state.premiumClaimedTiers.includes(tier)) return null; // Already claimed
      if (!tierData.premiumReward) return null;

      saveState({
        ...state,
        premiumClaimedTiers: [...state.premiumClaimedTiers, tier],
      });

      return tierData.premiumReward;
    } else {
      if (state.claimedTiers.includes(tier)) return null; // Already claimed

      saveState({
        ...state,
        claimedTiers: [...state.claimedTiers, tier],
      });

      return tierData.freeReward;
    }
  }, [state, currentSeason, saveState]);

  // Upgrade to premium
  const upgradeToPremium = useCallback(() => {
    saveState({
      ...state,
      isPremium: true,
    });
  }, [state, saveState]);

  // Get progress info
  const getProgress = useCallback((): BattlePassProgress => {
    if (!currentSeason) {
      return {
        currentTier: 0,
        currentXP: 0,
        xpToNextTier: 0,
        progressPercent: 0,
        season: null,
        daysRemaining: 0,
      };
    }

    // Calculate XP needed for next tier
    let cumulativeXP = 0;
    let xpToNextTier = 0;
    let progressPercent = 0;

    for (const tier of currentSeason.tiers) {
      const previousCumulative = cumulativeXP;
      cumulativeXP += tier.xpRequired;

      if (state.currentXP < cumulativeXP) {
        xpToNextTier = cumulativeXP - state.currentXP;
        const tierProgress = state.currentXP - previousCumulative;
        progressPercent = (tierProgress / tier.xpRequired) * 100;
        break;
      }
    }

    // Calculate days remaining
    const endDate = new Date(currentSeason.endDate);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      currentTier: state.currentTier,
      currentXP: state.currentXP,
      xpToNextTier,
      progressPercent,
      season: currentSeason,
      daysRemaining,
    };
  }, [state, currentSeason]);

  // Get unclaimed rewards
  const getUnclaimedRewards = useCallback((): { tier: number; isFree: boolean }[] => {
    const unclaimed: { tier: number; isFree: boolean }[] = [];

    for (let tier = 1; tier <= state.currentTier; tier++) {
      if (!state.claimedTiers.includes(tier)) {
        unclaimed.push({ tier, isFree: true });
      }
      if (state.isPremium && !state.premiumClaimedTiers.includes(tier)) {
        unclaimed.push({ tier, isFree: false });
      }
    }

    return unclaimed;
  }, [state]);

  // Check if tier reward is claimed
  const isTierClaimed = useCallback((tier: number, isPremium: boolean): boolean => {
    if (isPremium) {
      return state.premiumClaimedTiers.includes(tier);
    }
    return state.claimedTiers.includes(tier);
  }, [state]);

  return {
    state,
    currentSeason,
    addBattlePassXP,
    claimTierReward,
    upgradeToPremium,
    getProgress,
    getUnclaimedRewards,
    isTierClaimed,
  };
};

// Helper to dispatch battle pass XP from other hooks
export const dispatchBattlePassXP = (xp: number) => {
  window.dispatchEvent(new CustomEvent(BATTLE_PASS_XP_UPDATE_EVENT, { detail: { xp } }));
};
