import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { XPRewardModal } from "@/components/XPRewardModal";
import { DailyLoginRewardModal } from "@/components/DailyLoginRewardModal";
import { TopStatusBar } from "@/components/TopStatusBar";
import { UnifiedFocusTimer } from "@/components/UnifiedFocusTimer";
import { IOSTabBar } from "@/components/IOSTabBar";
import { PetCollectionGrid } from "@/components/PetCollectionGrid";
import { Settings } from "@/components/Settings";
import { Shop } from "@/components/Shop";
import { Analytics } from "@/components/analytics";
import { useState } from "react";
import { toast } from "sonner";

export const GameUI = () => {
  const [currentTab, setCurrentTab] = useState("home");
  const [isTaskbarCompact, setIsTaskbarCompact] = useState(false);
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

  const renderContent = () => {
    switch (currentTab) {
      case "timer":
        return <UnifiedFocusTimer />;
      case "collection":
        return <PetCollectionGrid />;
      case "analytics":
        return <Analytics />;
      case "shop":
        return <Shop />;
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
        isCompact={isTaskbarCompact}
        onCompactChange={setIsTaskbarCompact}
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
