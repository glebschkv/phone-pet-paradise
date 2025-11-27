import { CompactLevelProgress } from "@/components/CompactLevelProgress";
import { InlineStreakCounter } from "@/components/InlineStreakCounter";
import { StatusBarActions } from "@/components/StatusBarActions";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { WorldSwitcher } from "@/components/WorldSwitcher";

const HOME_BACKGROUND_KEY = 'petIsland_homeBackground';

// Map biome names to background theme IDs
const BIOME_TO_BACKGROUND: Record<string, string> = {
  'Meadow': 'day',
  'Sunset': 'sunset',
  'Night': 'night',
  'Ocean': 'ocean',
  'Forest': 'forest',
  'Snow': 'snow',
};

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

  // Handle biome switch with background update
  const handleSwitchBiome = (biomeName: string) => {
    switchBiome(biomeName);
    // Update background to match the biome
    const backgroundId = BIOME_TO_BACKGROUND[biomeName] || 'day';
    localStorage.setItem(HOME_BACKGROUND_KEY, backgroundId);
    window.dispatchEvent(new CustomEvent('homeBackgroundChange', { detail: backgroundId }));
  };

  // Only show on home tab
  if (currentTab !== "home") return null;

  return (
    <div className="absolute top-safe left-3 right-3 pointer-events-auto z-40">
      <div className="topbar-container">
        {/* Top Row - Level, XP Progress, and Stats */}
        <div className="flex items-center gap-2.5">
          {/* Level Badge */}
          <CompactLevelProgress
            currentLevel={currentLevel}
            progress={getLevelProgress()}
            currentXP={currentXP}
            xpToNextLevel={xpToNextLevel}
          />

          {/* Stats Group */}
          <StatusBarActions
            petCount={unlockedAnimals.length}
            onTestLevelUp={testLevelUp}
          />
        </div>

        {/* Bottom Row - Streak & World */}
        <div className="flex items-center justify-between mt-2.5">
          <InlineStreakCounter
            streakData={streakData}
            getStreakEmoji={getStreakEmoji}
          />

          <WorldSwitcher
            currentBiome={currentBiome}
            availableBiomes={availableBiomes}
            onSwitch={handleSwitchBiome}
          />
        </div>
      </div>
    </div>
  );
};
