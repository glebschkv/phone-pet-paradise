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

import { useState, useEffect } from "react";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { useRewardHandlers } from "@/hooks/useRewardHandlers";
import { TopStatusBar } from "@/components/TopStatusBar";
import { IOSTabBar } from "@/components/IOSTabBar";
import { AchievementTracker } from "@/components/AchievementTracker";
import { TabContent, preloadTabComponents } from "@/components/TabContent";
import { RewardModals } from "@/components/RewardModals";
import { QuickFocusButton } from "@/components/QuickFocusButton";

export const GameUI = () => {
  const [currentTab, setCurrentTab] = useState("home");
  const [isTaskbarCompact, setIsTaskbarCompact] = useState(false);

  // Preload tab components after initial render for faster navigation
  useEffect(() => {
    preloadTabComponents();
  }, []);

  // Update meta theme-color to match current tab's top background color
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;

    const themeColors: Record<string, string> = {
      home: 'hsl(200, 60%, 85%)',
      timer: 'hsl(200, 60%, 85%)',
      collection: 'hsl(252, 40%, 16%)',
      settings: 'hsl(200, 60%, 85%)',
      shop: 'hsl(45, 50%, 92%)',
      challenges: 'hsl(280, 25%, 8%)',
    };

    meta.setAttribute('content', themeColors[currentTab] || 'hsl(200, 60%, 85%)');
  }, [currentTab]);

  // Listen for programmatic tab switches (e.g. from collection "Buy from Shop" button)
  useEffect(() => {
    const handleSwitchToTab = (event: CustomEvent<string>) => {
      const tab = event.detail;
      if (tab) setCurrentTab(tab);
    };
    window.addEventListener('switchToTab', handleSwitchToTab as EventListener);
    return () => {
      window.removeEventListener('switchToTab', handleSwitchToTab as EventListener);
    };
  }, []);

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

        {/* Quick Focus Button — only on home screen */}
        {currentTab === "home" && (
          <QuickFocusButton onStartFocus={() => setCurrentTab("timer")} />
        )}

        {/* Full Screen Content */}
        {currentTab !== "home" && (
          <div
            className={`absolute inset-0 pointer-events-auto overflow-auto pt-safe pb-24 ${
              currentTab === "challenges" ? "bg-[hsl(280,25%,8%)]" :
              currentTab === "shop" ? "bg-[hsl(45,50%,92%)]" :
              currentTab === "collection" ? "collection-page-bg" :
              currentTab === "settings" ? "" :
              "bg-background"
            }`}
            style={currentTab === "settings" ? { background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)' } : undefined}
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
