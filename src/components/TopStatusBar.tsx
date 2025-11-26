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
    testLevelUp,
    availableBiomes,
    currentBiome,
    switchBiome,
  } = useAppStateTracking();

  // Only show on home tab
  if (currentTab !== "home") return null;

  return (
    <div className="absolute top-safe left-3 right-3 pointer-events-auto z-40">
      <div className="retro-card p-3">
        {/* Main Row - XP Progress */}
        <div className="flex items-center gap-3">
          <CompactLevelProgress
            currentLevel={currentLevel}
            progress={getLevelProgress()}
            currentXP={currentXP}
            xpToNextLevel={xpToNextLevel}
          />

          {/* Actions on same row for mobile */}
          <div className="flex items-center gap-2 shrink-0">
            <StatusBarActions
              petCount={unlockedAnimals.length}
              onTestLevelUp={testLevelUp}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 my-2.5" />

        {/* Bottom Row - Streak & World */}
        <div className="flex items-center justify-between">
          <InlineStreakCounter
            streakData={streakData}
            getStreakEmoji={getStreakEmoji}
          />

          <WorldSwitcher
            currentBiome={currentBiome}
            availableBiomes={availableBiomes}
            onSwitch={switchBiome}
          />
        </div>
      </div>
    </div>
  );
};
