import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { XPRewardModal } from "@/components/XPRewardModal";
import { DailyLoginRewardModal } from "@/components/DailyLoginRewardModal";
import { TopStatusBar } from "@/components/TopStatusBar";
import { UnifiedFocusTimer } from "@/components/UnifiedFocusTimer";
import { IOSTabBar } from "@/components/IOSTabBar";
import { PetCollectionGrid } from "@/components/PetCollectionGrid";
import { Settings } from "@/components/Settings";
import { FriendsComingSoon } from "@/components/FriendsComingSoon";
import { useState } from "react";
import { toast } from "sonner";

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
  } = useAppStateTracking();

  const handleDailyRewardClaim = () => {
    const reward = handleClaimDailyReward();
    if (reward) {
      if (reward.type === 'xp' || reward.type === 'mystery_bonus') {
        toast.success(`+${reward.amount} XP claimed!`, {
          description: reward.description,
        });
      } else if (reward.type === 'streak_freeze') {
        toast.success(`+${reward.amount} Streak Freeze earned!`, {
          description: "Use it to protect your streak!",
        });
      }
    }
  };

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
    </div>
  );
};
