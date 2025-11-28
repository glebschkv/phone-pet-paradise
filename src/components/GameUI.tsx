import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { XPRewardModal } from "@/components/XPRewardModal";
import { DailyLoginRewardModal } from "@/components/DailyLoginRewardModal";
import { SpinWheelModal } from "@/components/SpinWheelModal";
import { TopStatusBar } from "@/components/TopStatusBar";
import { UnifiedFocusTimer } from "@/components/UnifiedFocusTimer";
import { IOSTabBar } from "@/components/IOSTabBar";
import { PetCollectionGrid } from "@/components/PetCollectionGrid";
import { Settings } from "@/components/Settings";
import { FriendsComingSoon } from "@/components/FriendsComingSoon";
import { useState } from "react";
import { toast } from "sonner";
import { WheelSegment } from "@/hooks/useSpinWheel";

export const GameUI = () => {
  const [currentTab, setCurrentTab] = useState("home");
  const {
    currentLevel,
    showRewardModal,
    currentReward,
    dismissRewardModal,
    getLevelProgress,
    dailyLoginRewards,
    handleClaimDailyReward,
    spinWheel,
    handleClaimSpinReward,
    comboSystem,
  } = useAppStateTracking();

  const handleDailyRewardClaim = () => {
    const { dailyReward, xpReward } = handleClaimDailyReward();
    if (dailyReward) {
      if (dailyReward.type === 'xp' || dailyReward.type === 'mystery_bonus') {
        toast.success(`+${dailyReward.amount} XP claimed!`, {
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
        toast.success(`+${dailyReward.amount} Streak Freeze earned!`, {
          description: "Use it to protect your streak!",
        });
      }
    }
  };

  const handleSpinRewardClaim = (segment: WheelSegment) => {
    const xpReward = handleClaimSpinReward(segment);

    if (segment.type === 'jackpot') {
      toast.success(`JACKPOT! +${segment.value} XP!`, {
        description: "You hit the jackpot!",
      });
    } else if (segment.type === 'streak_freeze') {
      toast.success(`+${segment.value} Streak Freeze earned!`, {
        description: "Use it to protect your streak!",
      });
    } else {
      toast.success(`+${segment.value} XP claimed!`, {
        description: segment.label,
      });
    }

    // If leveled up, show additional toast
    if (xpReward?.leveledUp) {
      toast.success(`Level Up! You're now level ${xpReward.newLevel}!`, {
        description: xpReward.unlockedRewards.length > 0
          ? `Unlocked: ${xpReward.unlockedRewards.map(r => r.name).join(', ')}`
          : undefined,
      });
    }
  };

  const currentCombo = comboSystem.getCurrentMultiplier();

  const renderContent = () => {
    switch (currentTab) {
      case "timer":
        return <UnifiedFocusTimer />;
      case "collection":
        return <PetCollectionGrid />;
      case "friends":
        return <FriendsComingSoon />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Unified Top Status Bar */}
      <TopStatusBar currentTab={currentTab} />

      {/* Full Screen Content */}
      {currentTab !== "home" && (
        <div className="absolute inset-0 bg-background pointer-events-auto overflow-auto pb-24">
          {renderContent()}
        </div>
      )}

      {/* Floating Action Buttons - Left Side */}
      {currentTab === "home" && (
        <div className="absolute left-4 top-24 flex flex-col gap-3 pointer-events-auto z-50">
          {/* Spin Wheel Button */}
          <button
            onClick={spinWheel.openWheel}
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 touch-manipulation"
            style={{
              background: spinWheel.canSpin
                ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
              border: '2px solid',
              borderColor: spinWheel.canSpin ? '#b45309' : '#374151',
              boxShadow: spinWheel.canSpin
                ? '0 4px 12px rgba(245, 158, 11, 0.4)'
                : '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <span className="text-2xl">{spinWheel.canSpin ? '🎡' : '⏰'}</span>
            {spinWheel.canSpin && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                !
              </span>
            )}
          </button>

          {/* Combo Display */}
          {currentCombo.combo >= 2 && (
            <div
              className="px-3 py-2 rounded-xl text-center shadow-lg"
              style={{
                background: `linear-gradient(180deg, ${currentCombo.color}22 0%, ${currentCombo.color}11 100%)`,
                border: `2px solid ${currentCombo.color}`,
              }}
            >
              <div className="text-xs font-bold" style={{ color: currentCombo.color }}>
                COMBO
              </div>
              <div className="text-sm font-bold" style={{ color: currentCombo.color }}>
                {currentCombo.emoji} {currentCombo.label}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modern Floating Dock Navigation */}
      <IOSTabBar
        activeTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* XP Reward Modal */}
      <XPRewardModal
        isOpen={showRewardModal}
        onClose={dismissRewardModal}
        reward={currentReward}
        newLevel={currentLevel}
        levelProgress={getLevelProgress()}
      />

      {/* Daily Login Reward Modal */}
      <DailyLoginRewardModal
        isOpen={dailyLoginRewards.showRewardModal}
        onClaim={handleDailyRewardClaim}
        onDismiss={dailyLoginRewards.dismissModal}
        reward={dailyLoginRewards.pendingReward}
        currentStreak={dailyLoginRewards.loginState.currentStreak}
        allRewards={dailyLoginRewards.dailyRewards}
      />

      {/* Spin Wheel Modal */}
      <SpinWheelModal
        isOpen={spinWheel.showWheelModal}
        onClose={spinWheel.closeWheel}
        onSpin={spinWheel.spin}
        onClaimReward={handleSpinRewardClaim}
        segments={spinWheel.segments}
        canSpin={spinWheel.canSpin}
        isSpinning={spinWheel.isSpinning}
        timeUntilNextSpin={spinWheel.getTimeUntilNextSpin()}
      />
    </div>
  );
};
