import { CompactLevelProgress } from "@/components/CompactLevelProgress";
import { InlineStreakCounter } from "@/components/InlineStreakCounter";
import { StatusBarActions } from "@/components/StatusBarActions";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { WorldSwitcher } from "@/components/WorldSwitcher";

interface TopStatusBarProps {
  currentTab: string;
}

export const TopStatusBar = ({ currentTab }: TopStatusBarProps) => {
  const {
    currentLevel,
    currentXP,
    xpToNextLevel,
    unlockedAnimals,
    getLevelProgress,
    streakData,
    getStreakEmoji,
    awardXP,
    availableBiomes,
    currentBiome,
    switchBiome,
  } = useAppStateTracking();

  // Only show on home tab
  if (currentTab !== "home") return null;

  return (
    <div className="absolute top-safe left-3 right-3 pointer-events-auto z-40">
      <div className="bg-card/80 backdrop-blur-2xl border border-border/20 rounded-2xl shadow-floating-soft">
        {/* Mobile Layout - Stacked for better readability */}
        <div className="p-3 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
          {/* Top Row - Level Progress */}
          <div className="flex items-center justify-between gap-3">
            <CompactLevelProgress
              currentLevel={currentLevel}
              progress={getLevelProgress()}
              currentXP={currentXP}
              xpToNextLevel={xpToNextLevel}
            />
            
            {/* Mobile-only Actions on same row */}
            <div className="flex items-center gap-2 md:hidden">
              <StatusBarActions
                petCount={unlockedAnimals.length}
                onTestLevelUp={() => awardXP(60)}
              />
            </div>
          </div>
          
          {/* Bottom Row - Streak & World Switcher */}
          <div className="flex items-center justify-between gap-3">
            <InlineStreakCounter
              streakData={streakData}
              getStreakEmoji={getStreakEmoji}
            />
            
            <div className="flex items-center gap-2">
              <WorldSwitcher 
                currentBiome={currentBiome} 
                availableBiomes={availableBiomes} 
                onSwitch={switchBiome} 
              />
              
              {/* Desktop Actions */}
              <div className="hidden md:flex">
                <StatusBarActions
                  petCount={unlockedAnimals.length}
                  onTestLevelUp={() => awardXP(60)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};