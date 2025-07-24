import { Heart, TestTube } from "lucide-react";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { XPRewardModal } from "@/components/XPRewardModal";
import { LevelProgressBar } from "@/components/LevelProgressBar";
import { UnifiedFocusTimer } from "@/components/UnifiedFocusTimer";
import { IOSTabBar } from "@/components/IOSTabBar";
import { PetCollectionGrid } from "@/components/PetCollectionGrid";
import { Settings } from "@/components/Settings";
import { StreakDisplay } from "@/components/StreakDisplay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const GameUI = () => {
  const [currentTab, setCurrentTab] = useState("home");
  const { toast } = useToast();
  const {
    currentLevel,
    currentXP,
    xpToNextLevel,
    unlockedAnimals,
    getLevelProgress,
    timeAwayMinutes,
    showRewardModal,
    currentReward,
    dismissRewardModal,
    awardXP,
  } = useAppStateTracking();

  // Test function to simulate level up
  const testLevelUp = () => {
    const reward = awardXP(60); // Award 60 minutes worth of XP
    toast({
      title: "🎉 Level Up Test!",
      description: `Awarded XP! Check if modal appears.`,
      duration: 3000,
    });
    console.log('Test Level Up triggered:', reward);
  };

  const renderContent = () => {
    switch (currentTab) {
      case "timer":
        return (
          <div className="p-4">
            <UnifiedFocusTimer />
          </div>
        );
      case "collection":
        return <PetCollectionGrid />;
      case "friends":
        return (
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Friends</h2>
            <p className="text-muted-foreground">Coming soon!</p>
          </div>
        );
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Top UI - Level Progress (only show on home) */}
      {currentTab === "home" && (
        <div className="absolute top-4 left-4 right-4 pointer-events-auto space-y-3">
          <LevelProgressBar 
            currentLevel={currentLevel}
            progress={getLevelProgress()}
            currentXP={currentXP}
            xpToNextLevel={xpToNextLevel}
          />
          <StreakDisplay />
        </div>
      )}
      
      {/* Top Right - Pet Stats (only show on home) */}
      {currentTab === "home" && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Card className="p-3 bg-card/80 backdrop-blur-sm border-border/20 shadow-lg">
            <div className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Pets: {unlockedAnimals.length}
            </div>
          </Card>
        </div>
      )}

      {/* Debug button - remove in production */}
      {currentTab === "home" && (
        <div className="absolute top-20 right-4 pointer-events-auto">
          <Button 
            onClick={testLevelUp}
            variant="outline" 
            size="sm"
            className="bg-card/80 backdrop-blur-sm"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test Level Up
          </Button>
        </div>
      )}

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