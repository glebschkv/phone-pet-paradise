import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { XPRewardModal } from "@/components/XPRewardModal";
import { DailyLoginRewardModal } from "@/components/DailyLoginRewardModal";
import { TopStatusBar } from "@/components/TopStatusBar";
import { IOSTabBar } from "@/components/IOSTabBar";
import { MilestoneCelebration } from "@/components/gamification";
import { AchievementTracker } from "@/components/AchievementTracker";
import { useXPSystem } from "@/hooks/useXPSystem";
import { useCoinSystem } from "@/hooks/useCoinSystem";
import { useMilestoneCelebrations } from "@/hooks/useMilestoneCelebrations";
import { useState, lazy, Suspense } from "react";
import { toast } from "sonner";
import {
  TimerDisplaySkeleton,
  CollectionPageSkeleton,
  ShopPageSkeleton,
  SettingsSectionSkeleton,
  AchievementGridSkeleton,
} from "@/components/ui/skeleton-loaders";

// Lazy load heavy tab components for better initial load performance
const UnifiedFocusTimer = lazy(() => import("@/components/UnifiedFocusTimer").then(m => ({ default: m.UnifiedFocusTimer })));
const PetCollectionGrid = lazy(() => import("@/components/PetCollectionGrid").then(m => ({ default: m.PetCollectionGrid })));
const Settings = lazy(() => import("@/components/Settings").then(m => ({ default: m.Settings })));
const Shop = lazy(() => import("@/components/Shop").then(m => ({ default: m.Shop })));
const GamificationHub = lazy(() => import("@/components/gamification").then(m => ({ default: m.GamificationHub })));

// Context-aware loading skeleton based on tab
const getTabSkeleton = (tab: string) => {
  switch (tab) {
    case "timer":
      return <TimerDisplaySkeleton />;
    case "collection":
      return <CollectionPageSkeleton />;
    case "shop":
      return <ShopPageSkeleton />;
    case "settings":
      return <SettingsSectionSkeleton rows={5} />;
    case "challenges":
      return <AchievementGridSkeleton count={4} />;
    default:
      return null;
  }
};

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

  // Gamification hooks
  const { addDirectXP } = useXPSystem();
  const { addCoins } = useCoinSystem();
  const { checkMilestone } = useMilestoneCelebrations();

  // Handlers for gamification rewards
  const handleXPReward = (amount: number) => {
    const result = addDirectXP(amount);
    toast.success(`+${amount} XP earned!`);
    if (result.leveledUp) {
      checkMilestone('level', result.newLevel);
    }
  };

  const handleCoinReward = (amount: number) => {
    addCoins(amount);
    toast.success(`+${amount} Coins earned!`);
  };

  const handleMilestoneClaim = (milestone: { rewards?: { xp?: number; coins?: number } }) => {
    if (milestone.rewards?.xp) {
      addDirectXP(milestone.rewards.xp);
    }
    if (milestone.rewards?.coins) {
      addCoins(milestone.rewards.coins);
    }
  };

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
    const content = (() => {
      switch (currentTab) {
        case "timer":
          return <UnifiedFocusTimer />;
        case "collection":
          return <PetCollectionGrid />;
        case "challenges":
          return <GamificationHub onXPReward={handleXPReward} onCoinReward={handleCoinReward} />;
        case "shop":
          return <Shop />;
        case "settings":
          return <Settings />;
        default:
          return null;
      }
    })();

    // Wrap lazy-loaded components in Suspense with context-aware skeleton
    return content ? (
      <Suspense fallback={getTabSkeleton(currentTab)}>
        {content}
      </Suspense>
    ) : null;
  };

  return (
    <AchievementTracker>
      <div className="fixed inset-0 pointer-events-none z-40">
        {/* Unified Top Status Bar */}
        <TopStatusBar currentTab={currentTab} onSettingsClick={() => setCurrentTab("settings")} />

        {/* Full Screen Content */}
        {currentTab !== "home" && (
          <div className={`absolute inset-0 pointer-events-auto overflow-auto pb-24 ${currentTab === "challenges" ? "bg-[hsl(280,25%,8%)]" : "bg-background"}`}>
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

        {/* Milestone Celebration */}
        <MilestoneCelebration onClaimReward={handleMilestoneClaim} />
      </div>
    </AchievementTracker>
  );
};
