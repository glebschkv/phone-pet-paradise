import { useEffect, useCallback, useRef } from 'react';
import { useAchievementTracking, ACHIEVEMENT_EVENTS } from '@/hooks/useAchievementTracking';
import { AchievementUnlockModal } from '@/components/gamification/AchievementUnlockModal';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useCoinSystem } from '@/hooks/useCoinSystem';
import { useCollection } from '@/hooks/useCollection';
import { useStreakSystem } from '@/hooks/useStreakSystem';
import { useShop } from '@/hooks/useShop';

interface AchievementTrackerProps {
  children?: React.ReactNode;
}

export const AchievementTracker: React.FC<AchievementTrackerProps> = ({ children }) => {
  const tracking = useAchievementTracking();
  const { addDirectXP, currentLevel } = useXPSystem();
  const coinSystem = useCoinSystem();
  const { unlockedAnimalsData } = useCollection();
  const streakSystem = useStreakSystem();
  const { inventory } = useShop();
  const hasInitialized = useRef(false);

  // Handle achievement reward claims
  const handleRewardClaim = useCallback((xp: number, coins: number) => {
    if (xp > 0) {
      addDirectXP(xp);
    }
    if (coins > 0) {
      coinSystem.addCoins(coins);
    }
  }, [addDirectXP, coinSystem]);

  // Track focus session events
  useEffect(() => {
    const handleFocusSession = (event: CustomEvent) => {
      const { minutes, wasJackpot } = event.detail;
      tracking.trackFocusSession(minutes, wasJackpot);
    };

    window.addEventListener(
      ACHIEVEMENT_EVENTS.FOCUS_SESSION_COMPLETE,
      handleFocusSession as EventListener
    );

    return () => {
      window.removeEventListener(
        ACHIEVEMENT_EVENTS.FOCUS_SESSION_COMPLETE,
        handleFocusSession as EventListener
      );
    };
  }, [tracking]);

  // Track level changes
  useEffect(() => {
    if (currentLevel > 0) {
      tracking.trackLevelUp(currentLevel);
    }
  }, [currentLevel, tracking]);

  // Track pet collection changes
  useEffect(() => {
    if (unlockedAnimalsData && unlockedAnimalsData.length > 0) {
      // Count pets by rarity (would need to cross-reference with animal database)
      // For now, just track total count
      tracking.trackPetUnlock(unlockedAnimalsData.length, 0, 0, 0);
    }
  }, [unlockedAnimalsData, tracking]);

  // Track streak changes
  useEffect(() => {
    const streak = streakSystem?.streakData?.currentStreak || 0;
    if (streak > 0) {
      tracking.trackStreak(streak);
    }
  }, [streakSystem?.streakData?.currentStreak, tracking]);

  // Track coin events
  useEffect(() => {
    const handleCoinsEarned = (event: CustomEvent) => {
      const { amount, total } = event.detail;
      tracking.trackCoinsEarned(amount, total);
    };

    window.addEventListener(
      ACHIEVEMENT_EVENTS.COINS_EARNED,
      handleCoinsEarned as EventListener
    );

    return () => {
      window.removeEventListener(
        ACHIEVEMENT_EVENTS.COINS_EARNED,
        handleCoinsEarned as EventListener
      );
    };
  }, [tracking]);

  // Track purchase events
  useEffect(() => {
    const handlePurchase = (event: CustomEvent) => {
      const { totalPurchases } = event.detail;
      tracking.trackPurchase(totalPurchases);
    };

    window.addEventListener(
      ACHIEVEMENT_EVENTS.PURCHASE_MADE,
      handlePurchase as EventListener
    );

    return () => {
      window.removeEventListener(
        ACHIEVEMENT_EVENTS.PURCHASE_MADE,
        handlePurchase as EventListener
      );
    };
  }, [tracking]);

  // Track wheel spin events
  useEffect(() => {
    const handleWheelSpin = () => {
      tracking.trackWheelSpin();
    };

    window.addEventListener(
      ACHIEVEMENT_EVENTS.WHEEL_SPIN,
      handleWheelSpin as EventListener
    );

    return () => {
      window.removeEventListener(
        ACHIEVEMENT_EVENTS.WHEEL_SPIN,
        handleWheelSpin as EventListener
      );
    };
  }, [tracking]);

  // Track bond level events
  useEffect(() => {
    const handleBondUpdate = (event: CustomEvent) => {
      const { bondLevel, maxBondPets } = event.detail;
      tracking.trackBondLevel(bondLevel, maxBondPets);
    };

    window.addEventListener(
      ACHIEVEMENT_EVENTS.BOND_UPDATED,
      handleBondUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        ACHIEVEMENT_EVENTS.BOND_UPDATED,
        handleBondUpdate as EventListener
      );
    };
  }, [tracking]);

  // Initial tracking on mount - sync with current state
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Track current level
    if (currentLevel > 0) {
      tracking.trackLevelUp(currentLevel);
    }

    // Track current streak
    const streak = streakSystem?.streakData?.currentStreak || 0;
    if (streak > 0) {
      tracking.trackStreak(streak);
    }

    // Track current collection
    if (unlockedAnimalsData && unlockedAnimalsData.length > 0) {
      tracking.trackPetUnlock(unlockedAnimalsData.length, 0, 0, 0);
    }

    // Track total coins earned
    const totalCoins = coinSystem?.totalEarned || 0;
    if (totalCoins > 0) {
      tracking.trackCoinsEarned(0, totalCoins);
    }

    // Track total purchases
    const totalPurchases =
      (inventory?.ownedCharacters?.length || 0) +
      (inventory?.ownedBackgrounds?.length || 0) +
      (inventory?.ownedBadges?.length || 0);
    if (totalPurchases > 0) {
      tracking.trackPurchase(totalPurchases);
    }
  }, [currentLevel, streakSystem, unlockedAnimalsData, coinSystem, inventory, tracking]);

  return (
    <>
      {children}
      <AchievementUnlockModal onClaimReward={handleRewardClaim} />
    </>
  );
};
