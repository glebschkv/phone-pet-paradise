import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { XPRewardModal } from "@/components/XPRewardModal";
import { TopStatusBar } from "@/components/TopStatusBar";
import { UnifiedFocusTimer } from "@/components/UnifiedFocusTimer";
import { IOSTabBar } from "@/components/IOSTabBar";
import { PetCollectionGrid } from "@/components/PetCollectionGrid";
import { Settings } from "@/components/Settings";
import { FriendsComingSoon } from "@/components/FriendsComingSoon";
import { useState } from "react";

export const GameUI = () => {
  const [currentTab, setCurrentTab] = useState("home");
  const {
    currentLevel,
    showRewardModal,
    currentReward,
    dismissRewardModal,
    getLevelProgress,
  } = useAppStateTracking();

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
        <div className="absolute inset-0 bg-background pointer-events-auto overflow-auto pb-20">
          {renderContent()}
        </div>
      )}
      
      {/* iOS-style Tab Bar */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <IOSTabBar 
          activeTab={currentTab} 
          onTabChange={setCurrentTab} 
        />
      </div>

      {/* XP Reward Modal */}
      <XPRewardModal
        isOpen={showRewardModal}
        onClose={dismissRewardModal}
        reward={currentReward}
        newLevel={currentLevel}
        levelProgress={getLevelProgress()}
      />
    </div>
  );
};