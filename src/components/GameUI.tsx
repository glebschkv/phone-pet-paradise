/**
 * GameUI Component
 *
 * Main game interface that orchestrates navigation, status, and reward modals.
 * Refactored to use smaller, focused components with single responsibilities:
 *
 * - useRewardHandlers: Manages all reward-related logic
 * - TabContent: Renders tab content with lazy loading
 * - RewardModals: Orchestrates all reward-related modals
 */

import { useState } from "react";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { useRewardHandlers } from "@/hooks/useRewardHandlers";
import { TopStatusBar } from "@/components/TopStatusBar";
import { IOSTabBar } from "@/components/IOSTabBar";
import { AchievementTracker } from "@/components/AchievementTracker";
import { TabContent } from "@/components/TabContent";
import { RewardModals } from "@/components/RewardModals";

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

  // Reward handlers (XP, coins, milestones, daily rewards)
  const {
    handleXPReward,
    handleCoinReward,
    handleMilestoneClaim,
    handleDailyRewardClaim,
  } = useRewardHandlers(handleClaimDailyReward);

  return (
    <AchievementTracker>
      <div className="fixed inset-0 pointer-events-none z-40">
        {/* Unified Top Status Bar */}
        <TopStatusBar
          currentTab={currentTab}
          onSettingsClick={() => setCurrentTab("settings")}
        />

        {/* Full Screen Content */}
        {currentTab !== "home" && (
          <div
            className={`absolute inset-0 pointer-events-auto overflow-auto pb-24 ${
              currentTab === "challenges" ? "bg-[hsl(280,25%,8%)]" : "bg-background"
            }`}
          >
            <TabContent
              currentTab={currentTab}
              onXPReward={handleXPReward}
              onCoinReward={handleCoinReward}
            />
          </div>
        )}

        {/* Modern Floating Dock Navigation */}
        <IOSTabBar
          activeTab={currentTab}
          onTabChange={setCurrentTab}
          isCompact={isTaskbarCompact}
          onCompactChange={setIsTaskbarCompact}
        />

        {/* Reward Modals */}
        <RewardModals
          showRewardModal={showRewardModal}
          dismissRewardModal={dismissRewardModal}
          currentReward={currentReward}
          newLevel={currentLevel}
          levelProgress={getLevelProgress()}
          dailyLoginRewards={dailyLoginRewards}
          onDailyRewardClaim={handleDailyRewardClaim}
          onMilestoneClaim={handleMilestoneClaim}
        />
      </div>
    </AchievementTracker>
  );
};
