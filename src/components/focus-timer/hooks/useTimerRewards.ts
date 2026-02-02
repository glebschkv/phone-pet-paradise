/**
 * useTimerRewards Hook
 *
 * Handles XP and coin rewards for completed focus sessions.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useCallback } from 'react';
import { useBackendAppState } from '@/hooks/useBackendAppState';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { useBondSystem } from '@/hooks/useBondSystem';
import { useActiveHomePets } from '@/stores';
import { timerLogger } from '@/lib/logger';
import { toast } from 'sonner';
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from '@/hooks/useAchievementTracking';
import { FOCUS_BONUS } from '@/lib/constants';

interface RewardResult {
  xpEarned: number;
  coinsEarned: number;
  focusBonusType: string;
  bondBonusPercent: number;
  bondPetName: string | null;
  bossDefeated: boolean;
  bossChallenge?: {
    name: string;
    xp: number;
    coins: number;
    hasBadge: boolean;
  };
}

interface SessionInfo {
  sessionType: string;
  sessionDuration: number;
  category?: string;
  taskLabel?: string;
}

export function useTimerRewards() {
  const { awardXP, coinSystem, xpSystem } = useBackendAppState();
  const { recordFocusSession } = useBossChallenges();
  const { getAbilityBonuses, getBondLevel } = useBondSystem();
  const activeHomePets = useActiveHomePets();

  /**
   * Calculate and award rewards for a completed session
   */
  const awardSessionRewards = useCallback(async (
    completedMinutes: number,
    shieldAttempts: number,
    hasAppsConfigured: boolean,
    blockedAppsCount: number,
    sessionInfo: SessionInfo
  ): Promise<RewardResult> => {
    const result: RewardResult = {
      xpEarned: 0,
      coinsEarned: 0,
      focusBonusType: '',
      bondBonusPercent: 0,
      bondPetName: null,
      bossDefeated: false,
    };

    // Calculate bond bonus from highest-bond active home pet
    let bondFocusBonus = 0;
    let bondXPBonus = 0;
    if (activeHomePets && activeHomePets.length > 0) {
      let bestPetId: string | null = null;
      let bestBondLevel = 0;
      for (const petId of activeHomePets) {
        const level = getBondLevel(petId);
        if (level > bestBondLevel) {
          bestBondLevel = level;
          bestPetId = petId;
        }
      }
      if (bestPetId && bestBondLevel > 1) {
        const bonuses = getAbilityBonuses(bestPetId);
        bondFocusBonus = bonuses.focusBonus || 0;  // % coin bonus
        bondXPBonus = bonuses.experienceBonus || 0; // % XP bonus
        result.bondBonusPercent = bondFocusBonus;
        result.bondPetName = bestPetId;
      }
    }

    // Calculate focus bonus based on shield attempts
    let focusMultiplier: number = FOCUS_BONUS.DISTRACTED.multiplier;
    if (hasAppsConfigured && blockedAppsCount > 0) {
      if (shieldAttempts === 0) {
        focusMultiplier = FOCUS_BONUS.PERFECT_FOCUS.multiplier;
        result.focusBonusType = FOCUS_BONUS.PERFECT_FOCUS.label;
      } else if (shieldAttempts <= FOCUS_BONUS.GOOD_FOCUS_MAX_ATTEMPTS) {
        focusMultiplier = FOCUS_BONUS.GOOD_FOCUS.multiplier;
        result.focusBonusType = FOCUS_BONUS.GOOD_FOCUS.label;
      }
    }

    // Award XP for work sessions (minimum 25 minutes)
    if (sessionInfo.sessionType !== 'break' && completedMinutes >= 25) {
      try {
        const reward = await awardXP(completedMinutes);
        result.xpEarned = reward?.xpGained || 0;

        // Apply focus bonus to XP
        if (focusMultiplier > 1.0 && result.xpEarned > 0 && xpSystem && 'addDirectXP' in xpSystem) {
          const bonusXP = Math.floor(result.xpEarned * (focusMultiplier - 1));
          if (bonusXP > 0) {
            (xpSystem as { addDirectXP: (xp: number) => void }).addDirectXP(bonusXP);
            result.xpEarned += bonusXP;
          }
        }

        // Apply pet bond XP bonus
        if (bondXPBonus > 0 && result.xpEarned > 0 && xpSystem && 'addDirectXP' in xpSystem) {
          const petBonusXP = Math.floor(result.xpEarned * (bondXPBonus / 100));
          if (petBonusXP > 0) {
            (xpSystem as { addDirectXP: (xp: number) => void }).addDirectXP(petBonusXP);
            result.xpEarned += petBonusXP;
          }
        }
      } catch (error) {
        timerLogger.error('Failed to award XP:', error);
      }
    }

    // Award focus bonus coins
    if (focusMultiplier > 1.0 && sessionInfo.sessionType !== 'break' && coinSystem) {
      const bonusCoins = focusMultiplier === FOCUS_BONUS.PERFECT_FOCUS.multiplier
        ? FOCUS_BONUS.PERFECT_FOCUS.coinBonus
        : FOCUS_BONUS.GOOD_FOCUS.coinBonus;
      coinSystem.addCoins(bonusCoins);
      result.coinsEarned = bonusCoins;
    }

    // Apply pet bond coin bonus
    if (bondFocusBonus > 0 && result.coinsEarned > 0 && coinSystem) {
      const petBonusCoins = Math.floor(result.coinsEarned * (bondFocusBonus / 100));
      if (petBonusCoins > 0) {
        coinSystem.addCoins(petBonusCoins);
        result.coinsEarned += petBonusCoins;
      }
    }

    // Dispatch achievement tracking event for focus sessions
    if (sessionInfo.sessionType !== 'break' && completedMinutes >= 1) {
      dispatchAchievementEvent(ACHIEVEMENT_EVENTS.FOCUS_SESSION_COMPLETE, {
        minutes: completedMinutes,
        hasNotes: false,
      });
    }

    // Record focus session for boss challenge progress
    if (sessionInfo.sessionType !== 'break' && completedMinutes >= 1) {
      const bossResult = recordFocusSession(completedMinutes);

      if (bossResult.challengeCompleted && bossResult.completedChallenge) {
        const challenge = bossResult.completedChallenge;
        result.bossDefeated = true;
        result.bossChallenge = {
          name: challenge.name,
          xp: challenge.rewards.xp,
          coins: challenge.rewards.coins,
          hasBadge: !!challenge.rewards.badge,
        };

        // Award boss XP
        if (challenge.rewards.xp > 0 && xpSystem && 'addDirectXP' in xpSystem) {
          try {
            (xpSystem as { addDirectXP: (xp: number) => void }).addDirectXP(challenge.rewards.xp);
          } catch (error) {
            timerLogger.error('Failed to award boss XP:', error);
          }
        }

        // Award boss coins
        if (challenge.rewards.coins > 0 && coinSystem) {
          coinSystem.addCoins(challenge.rewards.coins);
        }

        // Show boss defeat toast
        toast.success(`🏆 BOSS DEFEATED: ${challenge.name}!`, {
          description: `+${challenge.rewards.xp} XP, +${challenge.rewards.coins} Coins${challenge.rewards.badge ? ', +Badge!' : ''}`,
          duration: 5000,
        });
      }
    }

    return result;
  }, [awardXP, coinSystem, xpSystem, recordFocusSession, activeHomePets, getBondLevel, getAbilityBonuses]);

  /**
   * Show focus bonus toast notification
   */
  const showFocusBonusToast = useCallback((focusBonusType: string) => {
    if (!focusBonusType) return;

    const isPerfect = focusBonusType === FOCUS_BONUS.PERFECT_FOCUS.label;
    toast.success(`${focusBonusType}!`, {
      description: isPerfect
        ? FOCUS_BONUS.PERFECT_FOCUS.description
        : FOCUS_BONUS.GOOD_FOCUS.description,
      duration: 4000,
    });
  }, []);

  return {
    awardSessionRewards,
    showFocusBonusToast,
  };
}
