import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { getCurrentSeason, Season, BattlePassReward } from '@/data/GamificationData';
import { TIER_BENEFITS, SubscriptionTier, BATTLE_PASS_PLANS } from './usePremiumStatus';

export interface BattlePassState {
  seasonId: string;
  currentTier: number;
  currentXP: number;
  isPremium: boolean;
  claimedTiers: number[]; // Tiers where rewards have been claimed
  premiumClaimedTiers: number[];
  purchasedSeasonId?: string; // Season ID that battle pass was purchased for
}

// Export battle pass plans for use in UI
export { BATTLE_PASS_PLANS };

interface BattlePassProgress {
  currentTier: number;
  currentXP: number;
  xpToNextTier: number;
  progressPercent: number;
  season: Season | null;
  daysRemaining: number;
}

const BATTLE_PASS_XP_UPDATE_EVENT = 'petIsland_battlePassXPUpdate';

// Helper to check if subscription includes battle pass
const checkSubscriptionBattlePass = (): boolean => {
  const premiumData = localStorage.getItem('petIsland_premium');
  if (premiumData) {
    try {
      const parsed = JSON.parse(premiumData);
      const tier = parsed.tier as SubscriptionTier;
      if (tier && TIER_BENEFITS[tier]) {
        return TIER_BENEFITS[tier].battlePassIncluded;
      }
    } catch {
      // Invalid data
    }
  }
  return false;
};

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

  // Check subscription status on mount and when it changes
  useEffect(() => {
    const checkAndUpdatePremium = () => {
      const hasSubscriptionBP = checkSubscriptionBattlePass();
      if (hasSubscriptionBP && !state.isPremium) {
        // Subscription includes battle pass, auto-upgrade
        const updatedState = {
          ...state,
          isPremium: true,
        };
        setState(updatedState);
        storage.set(STORAGE_KEYS.BATTLE_PASS, updatedState);
      }
    };

    // Check on mount
    checkAndUpdatePremium();

    // Listen for subscription changes
    const handleSubscriptionChange = () => {
      checkAndUpdatePremium();
    };

    window.addEventListener('petIsland_subscriptionChange', handleSubscriptionChange);
    return () => {
      window.removeEventListener('petIsland_subscriptionChange', handleSubscriptionChange);
    };
  }, [state]);

  // Load saved state
  useEffect(() => {
    const saved = storage.get<BattlePassState>(STORAGE_KEYS.BATTLE_PASS);
    const hasSubscriptionBP = checkSubscriptionBattlePass();

    if (saved) {
      // Check if it's a new season
      if (currentSeason && saved.seasonId !== currentSeason.id) {
        // Reset for new season, but check subscription for premium
        const newState: BattlePassState = {
          seasonId: currentSeason.id,
          currentTier: 0,
          currentXP: 0,
          isPremium: hasSubscriptionBP || (saved.purchasedSeasonId === currentSeason.id),
          claimedTiers: [],
          premiumClaimedTiers: [],
          purchasedSeasonId: hasSubscriptionBP ? currentSeason.id : undefined,
        };
        setState(newState);
        storage.set(STORAGE_KEYS.BATTLE_PASS, newState);
      } else {
        // Keep existing state but update premium status from subscription
        const updatedState = {
          ...saved,
          isPremium: hasSubscriptionBP || saved.isPremium,
        };
        setState(updatedState);
        if (hasSubscriptionBP && !saved.isPremium) {
          storage.set(STORAGE_KEYS.BATTLE_PASS, updatedState);
        }
      }
    } else if (currentSeason) {
      const initial: BattlePassState = {
        seasonId: currentSeason.id,
        currentTier: 0,
        currentXP: 0,
        isPremium: hasSubscriptionBP,
        claimedTiers: [],
        premiumClaimedTiers: [],
        purchasedSeasonId: hasSubscriptionBP ? currentSeason.id : undefined,
      };
      setState(initial);
      storage.set(STORAGE_KEYS.BATTLE_PASS, initial);
    }
  }, [currentSeason]);

  // Listen for XP updates from focus sessions
  useEffect(() => {
    const handleXPUpdate = (event: CustomEvent<{ xp: number }>) => {
      // Use setState directly to avoid dependency on addBattlePassXP
      setState(prevState => {
        const newXP = prevState.currentXP + event.detail.xp;
        let newTier = 0;

        if (currentSeason) {
          let cumulativeXP = 0;
          for (const t of currentSeason.tiers) {
            cumulativeXP += t.xpRequired;
            if (newXP >= cumulativeXP) {
              newTier = t.tier;
            } else {
              break;
            }
          }
        }

        const newState: BattlePassState = {
          ...prevState,
          currentXP: newXP,
          currentTier: newTier,
        };
        storage.set(STORAGE_KEYS.BATTLE_PASS, newState);
        return newState;
      });
    };

    window.addEventListener(BATTLE_PASS_XP_UPDATE_EVENT, handleXPUpdate as EventListener);
    return () => {
      window.removeEventListener(BATTLE_PASS_XP_UPDATE_EVENT, handleXPUpdate as EventListener);
    };
  }, [currentSeason]);

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

  // Purchase battle pass premium (for direct purchase, not via subscription)
  const purchaseBattlePass = useCallback((bonusTiers: number = 0): boolean => {
    if (!currentSeason) return false;

    // Calculate new tier if bonus tiers are included
    let newTier = state.currentTier;
    let newXP = state.currentXP;

    if (bonusTiers > 0) {
      // Calculate XP needed to reach bonus tiers
      const targetTier = Math.min(state.currentTier + bonusTiers, currentSeason.tiers.length);
      let cumulativeXP = 0;

      for (const tier of currentSeason.tiers) {
        cumulativeXP += tier.xpRequired;
        if (tier.tier <= targetTier) {
          newXP = Math.max(newXP, cumulativeXP);
          newTier = tier.tier;
        }
      }
    }

    const updatedState: BattlePassState = {
      ...state,
      isPremium: true,
      currentTier: newTier,
      currentXP: newXP,
      purchasedSeasonId: currentSeason.id,
    };

    saveState(updatedState);
    return true;
  }, [state, currentSeason, saveState]);

  // Check if battle pass is from subscription
  const isFromSubscription = useCallback((): boolean => {
    return checkSubscriptionBattlePass();
  }, []);

  // Get available battle pass products for purchase
  const getBattlePassProducts = useCallback(() => {
    return BATTLE_PASS_PLANS;
  }, []);

  return {
    state,
    currentSeason,
    addBattlePassXP,
    claimTierReward,
    upgradeToPremium,
    purchaseBattlePass,
    getProgress,
    getUnclaimedRewards,
    isTierClaimed,
    isFromSubscription,
    getBattlePassProducts,
  };
};

// Helper to dispatch battle pass XP from other hooks
export const dispatchBattlePassXP = (xp: number) => {
  window.dispatchEvent(new CustomEvent(BATTLE_PASS_XP_UPDATE_EVENT, { detail: { xp } }));
};
