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
    <div className="absolute top-4 left-4 right-4 pointer-events-auto">
      <div className="bg-gradient-glass backdrop-blur-xl border border-primary/10 rounded-3xl p-4 shadow-floating">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Level Progress */}
          <CompactLevelProgress
            currentLevel={currentLevel}
            progress={getLevelProgress()}
            currentXP={currentXP}
            xpToNextLevel={xpToNextLevel}
          />
          
          {/* Center - Streak Counter */}
          <InlineStreakCounter
            streakData={streakData}
            getStreakEmoji={getStreakEmoji}
          />
          
{/* Right Side - Actions + World Switcher */}
<div className="flex items-center gap-2">
  <WorldSwitcher 
    currentBiome={currentBiome} 
    availableBiomes={availableBiomes} 
    onSwitch={switchBiome} 
  />
  <StatusBarActions
    petCount={unlockedAnimals.length}
    onTestLevelUp={() => awardXP(60)}
  />
</div>
        </div>
      </div>
    </div>
  );
};