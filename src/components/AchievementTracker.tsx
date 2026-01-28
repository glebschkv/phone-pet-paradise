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
  const {
    trackFocusSession,
    trackLevelUp,
    trackPetUnlock,
    trackStreak,
    trackCoinsEarned,
    trackPurchase,
    trackWheelSpin,
    trackBondLevel,
  } = useAchievementTracking();
  const { addDirectXP, currentLevel } = useXPSystem();
  const coinSystem = useCoinSystem();
  const { unlockedAnimalsData } = useCollection();
  const streakSystem = useStreakSystem();
  const { inventory } = useShop();
  const hasInitialized = useRef(false);
  const prevLevelRef = useRef(currentLevel);
  const prevStreakRef = useRef(0);
  const prevPetsRef = useRef(0);
  const prevCoinsRef = useRef(0);
  const prevPurchasesRef = useRef(0);

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
      trackFocusSession(minutes, wasJackpot);
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
  }, [trackFocusSession]);

  // Track level changes - only when level actually changes
  useEffect(() => {
    if (currentLevel > 0 && currentLevel !== prevLevelRef.current) {
      prevLevelRef.current = currentLevel;
      trackLevelUp(currentLevel);
    }
  }, [currentLevel, trackLevelUp]);

  // Track pet collection changes - only when count changes
  useEffect(() => {
    const petCount = unlockedAnimalsData?.length || 0;
    if (petCount > 0 && petCount !== prevPetsRef.current) {
      prevPetsRef.current = petCount;
      trackPetUnlock(petCount, 0, 0, 0);
    }
  }, [unlockedAnimalsData, trackPetUnlock]);

  // Track streak changes - only when streak changes
  useEffect(() => {
    const streak = streakSystem?.streakData?.currentStreak || 0;
    if (streak > 0 && streak !== prevStreakRef.current) {
      prevStreakRef.current = streak;
      trackStreak(streak);
    }
  }, [streakSystem?.streakData?.currentStreak, trackStreak]);

  // Track coin events via custom events
  useEffect(() => {
    const handleCoinsEarned = (event: CustomEvent) => {
      const { amount, total } = event.detail;
      trackCoinsEarned(amount, total);
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
  }, [trackCoinsEarned]);

  // Track purchase events via custom events
  useEffect(() => {
    const handlePurchase = (event: CustomEvent) => {
      const { totalPurchases } = event.detail;
      trackPurchase(totalPurchases);
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
  }, [trackPurchase]);

  // Track wheel spin events
  useEffect(() => {
    const handleWheelSpin = () => {
      trackWheelSpin();
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
  }, [trackWheelSpin]);

  // Track bond level events
  useEffect(() => {
    const handleBondUpdate = (event: CustomEvent) => {
      const { bondLevel, maxBondPets } = event.detail;
      trackBondLevel(bondLevel, maxBondPets);
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
  }, [trackBondLevel]);

  // Initial tracking on mount - sync with current state (runs once)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Initialize refs with current values
    prevLevelRef.current = currentLevel;
    prevStreakRef.current = streakSystem?.streakData?.currentStreak || 0;
    prevPetsRef.current = unlockedAnimalsData?.length || 0;
    prevCoinsRef.current = coinSystem?.totalEarned || 0;
    prevPurchasesRef.current =
      (inventory?.ownedCharacters?.length || 0) +
      (inventory?.ownedBackgrounds?.length || 0);

    // Track initial state
    if (currentLevel > 0) {
      trackLevelUp(currentLevel);
    }
    if (prevStreakRef.current > 0) {
      trackStreak(prevStreakRef.current);
    }
    if (prevPetsRef.current > 0) {
      trackPetUnlock(prevPetsRef.current, 0, 0, 0);
    }
    if (prevCoinsRef.current > 0) {
      trackCoinsEarned(0, prevCoinsRef.current);
    }
    if (prevPurchasesRef.current > 0) {
      trackPurchase(prevPurchasesRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {children}
      <AchievementUnlockModal onClaimReward={handleRewardClaim} />
    </>
  );
};
