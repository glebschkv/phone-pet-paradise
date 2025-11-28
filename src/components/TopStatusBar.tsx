import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { Heart, Flame, ChevronDown, Zap } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const HOME_BACKGROUND_KEY = 'petIsland_homeBackground';

// Map biome names to background theme IDs and emojis
const BIOME_CONFIG: Record<string, { bg: string; emoji: string }> = {
  'Meadow': { bg: 'day', emoji: '🌿' },
  'Sunset': { bg: 'sunset', emoji: '🌅' },
  'Night': { bg: 'night', emoji: '🌙' },
  'Ocean': { bg: 'ocean', emoji: '🌊' },
  'Forest': { bg: 'forest', emoji: '🌲' },
  'Snow': { bg: 'snow', emoji: '❄️' },
};

interface TopStatusBarProps {
  currentTab: string;
}

export const TopStatusBar = ({ currentTab }: TopStatusBarProps) => {
  const { toast } = useToast();
  const {
    currentLevel,
    currentXP,
    xpToNextLevel,
    unlockedAnimals,
    getLevelProgress,
    streakData,
    testLevelUp,
    availableBiomes,
    currentBiome,
    switchBiome,
  } = useAppStateTracking();

  // Handle biome switch with background update
  const handleSwitchBiome = (biomeName: string) => {
    switchBiome(biomeName);
    const backgroundId = BIOME_CONFIG[biomeName]?.bg || 'day';
    localStorage.setItem(HOME_BACKGROUND_KEY, backgroundId);
    window.dispatchEvent(new CustomEvent('homeBackgroundChange', { detail: backgroundId }));
  };

  // Handle quick XP action
  const handleQuickXP = () => {
    testLevelUp();
    toast({
      title: "Focus Complete!",
      description: "You earned XP for your session.",
      duration: 2000,
    });
  };

  // Only show on home tab
  if (currentTab !== "home") return null;

  const progress = getLevelProgress();
  const hasActiveStreak = streakData.currentStreak >= 3;
  const currentBiomeEmoji = BIOME_CONFIG[currentBiome]?.emoji || '🌿';

  return (
    <div className="absolute top-safe left-3 right-3 pointer-events-auto z-40">
      <div className="topbar-wrapper">
        {/* Left Section - Level & XP */}
        <div className="topbar-level-pill">
          {/* Circular Level Ring with Progress */}
          <div className="level-ring-container">
            <div className="level-ring-bg" />
            <div
              className="level-ring-progress"
              style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}
            />
            <div className="level-ring-inner">
              <span>{currentLevel}</span>
            </div>
          </div>

          {/* XP Info */}
          <div className="xp-info">
            <span className="xp-label">Experience</span>
            <span className="xp-value">
              {currentXP} <span>/ {currentXP + xpToNextLevel}</span>
            </span>
          </div>
        </div>

        {/* Right Section - Stats */}
        <div className="topbar-stats-row">
          {/* Streak Counter */}
          <div className="stat-mini-pill touch-manipulation">
            <div className="stat-icon">
              <Flame className={`w-[18px] h-[18px] streak-fire ${hasActiveStreak ? 'active' : ''}`} />
            </div>
            <span className="stat-value">{streakData.currentStreak}</span>
          </div>

          {/* Pet Count */}
          <div className="stat-mini-pill touch-manipulation">
            <div className="stat-icon">
              <Heart className="w-[18px] h-[18px] pet-heart fill-current" />
            </div>
            <span className="stat-value">{unlockedAnimals.length}</span>
          </div>

          {/* Quick XP Button */}
          <button
            onClick={handleQuickXP}
            className="quick-action-btn energy-pulse touch-manipulation"
            aria-label="Quick focus"
          >
            <Zap className="w-[18px] h-[18px] fill-current" />
          </button>
        </div>
      </div>

      {/* Second Row - Biome Selector (floating) */}
      <div className="flex justify-end mt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="biome-trigger touch-manipulation">
              <span className="biome-icon">{currentBiomeEmoji}</span>
              <span className="biome-name">{currentBiome}</span>
              <ChevronDown className="biome-chevron" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="biome-dropdown-content min-w-[160px]">
            {availableBiomes.map((biome) => {
              const config = BIOME_CONFIG[biome];
              const isActive = biome === currentBiome;
              return (
                <DropdownMenuItem
                  key={biome}
                  onClick={() => handleSwitchBiome(biome)}
                  className={`biome-dropdown-item ${isActive ? 'active' : ''}`}
                >
                  <span className="biome-emoji">{config?.emoji || '🌍'}</span>
                  <span>{biome}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
