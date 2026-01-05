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
import { useXPSystem } from "@/hooks/useXPSystem";
import { useCoinSystem } from "@/hooks/useCoinSystem";
import { useMilestoneCelebrations } from "@/hooks/useMilestoneCelebrations";
import type { DailyReward } from "@/hooks/useDailyLoginRewards";

interface XPResult {
  leveledUp: boolean;
  newLevel: number;
  unlockedRewards: Array<{ name: string }>;
}

interface DailyRewardClaimResult {
  dailyReward: DailyReward | null;
  xpReward?: XPResult | null;
}

interface ClaimDailyRewardFn {
  (): DailyRewardClaimResult;
}

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
      // Build reward message
      const rewardParts: string[] = [];
      if (dailyReward.xp > 0) rewardParts.push(`+${dailyReward.xp} XP`);
      if (dailyReward.coins > 0) rewardParts.push(`+${dailyReward.coins} coins`);
      if (dailyReward.streakFreeze) rewardParts.push(`+${dailyReward.streakFreeze} Streak Freeze`);
      if (dailyReward.luckyWheelSpin) rewardParts.push(`+${dailyReward.luckyWheelSpin} Free Spin`);

      toast.success(rewardParts.join(' & ') + ' claimed!', {
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
    }
  }, [handleClaimDailyReward]);

  return {
    handleXPReward,
    handleCoinReward,
    handleMilestoneClaim,
    handleDailyRewardClaim,
  };
};
