/**
 * useRewardHandlers Hook
 *
 * Centralizes all reward-related logic for the GameUI:
 * - XP rewards
 * - Coin rewards
 * - Milestone claims
 * - Daily login reward claims
 *
 * Composes useXPSystem, useCoinSystem, and useMilestoneCelebrations.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useXPSystem, XPReward } from "@/hooks/useXPSystem";
import { useCoinSystem } from "@/hooks/useCoinSystem";
import { useMilestoneCelebrations } from "@/hooks/useMilestoneCelebrations";
import { DailyReward } from "@/hooks/useDailyLoginRewards";

interface DailyRewardClaimResult {
  dailyReward: DailyReward | null;
  xpReward?: XPReward | null;
}

export type ClaimDailyRewardFn = () => DailyRewardClaimResult;

export const useRewardHandlers = (handleClaimDailyReward: ClaimDailyRewardFn) => {
  const { addDirectXP } = useXPSystem();
  const { addCoins } = useCoinSystem();
  const { checkMilestone } = useMilestoneCelebrations();

  const handleXPReward = useCallback((amount: number) => {
    const result = addDirectXP(amount);
    toast.success(`+${amount} XP earned!`);
    if (result.leveledUp) {
      checkMilestone('level', result.newLevel);
    }
  }, [addDirectXP, checkMilestone]);

  const handleCoinReward = useCallback((amount: number) => {
    addCoins(amount);
    toast.success(`+${amount} Coins earned!`);
  }, [addCoins]);

  const handleMilestoneClaim = useCallback((milestone: { rewards?: { xp?: number; coins?: number } }) => {
    if (milestone.rewards?.xp) {
      addDirectXP(milestone.rewards.xp);
    }
    if (milestone.rewards?.coins) {
      addCoins(milestone.rewards.coins);
    }
  }, [addDirectXP, addCoins]);

  const handleDailyRewardClaim = useCallback(() => {
    const { dailyReward, xpReward } = handleClaimDailyReward();
    if (dailyReward) {
      if (dailyReward.type === 'xp' || dailyReward.type === 'mystery_bonus') {
        toast.success(`+${dailyReward.xp} XP claimed!`, {
          description: dailyReward.description,
        });
        // If leveled up, show additional toast
        if (xpReward?.leveledUp) {
          toast.success(`Level Up! You're now level ${xpReward.newLevel}!`, {
            description: xpReward.unlockedRewards.length > 0
              ? `Unlocked: ${xpReward.unlockedRewards.map(r => r.name).join(', ')}`
              : undefined,
          });
        }
      } else if (dailyReward.type === 'streak_freeze') {
        toast.success(`+${dailyReward.streakFreeze || 1} Streak Freeze earned!`, {
          description: "Use it to protect your streak!",
        });
      }
    }
  }, [handleClaimDailyReward]);

  return {
    handleXPReward,
    handleCoinReward,
    handleMilestoneClaim,
    handleDailyRewardClaim,
  };
};
