import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { useCoinSystem } from "@/hooks/useCoinSystem";
import { Heart, ChevronDown, Settings, Star, Flame, Trophy } from "lucide-react";
import { useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BIOME_DATABASE } from "@/data/AnimalDatabase";
import { useShopStore, useThemeStore } from "@/stores";
import { PixelIcon } from "@/components/ui/PixelIcon";

const BIOME_CONFIG: Record<string, { bg: string; icon: string }> = {
  'Meadow': { bg: 'day', icon: 'meadow' },
  'Sunset': { bg: 'sunset', icon: 'sunset' },
  'Night': { bg: 'night', icon: 'moon' },
  'Forest': { bg: 'forest', icon: 'leaf' },
  'Snow': { bg: 'snow', icon: 'snowflake' },
  'City': { bg: 'city', icon: 'city' },
  'Deep Ocean': { bg: 'deepocean', icon: 'wave' },
};

interface TopStatusBarProps {
  currentTab: string;
  onSettingsClick?: () => void;
}

export const TopStatusBar = ({ currentTab, onSettingsClick }: TopStatusBarProps) => {
  const [statsOpen, setStatsOpen] = useState(false);
  const {
    currentLevel,
    currentXP,
    xpToNextLevel,
    unlockedAnimals,
    getLevelProgress,
    streakData,
    availableBiomes,
    currentBiome,
    switchBiome,
  } = useAppStateTracking();
  const coinSystem = useCoinSystem();

  // Use Zustand stores instead of localStorage/events
  const equippedBackground = useShopStore((state) => state.equippedBackground);
  const setEquippedBackground = useShopStore((state) => state.setEquippedBackground);
  const setHomeBackground = useThemeStore((state) => state.setHomeBackground);

  const handleSwitchBiome = useCallback((biomeName: string) => {
    switchBiome(biomeName);

    // Clear any equipped premium background when switching biomes
    if (equippedBackground) {
      setEquippedBackground(null);
    }

    // Use the biome's background image if available, otherwise fall back to theme ID
    const biome = BIOME_DATABASE.find(b => b.name === biomeName);
    const backgroundTheme = biome?.backgroundImage || BIOME_CONFIG[biomeName]?.bg || 'day';
    setHomeBackground(backgroundTheme);
  }, [switchBiome, equippedBackground, setEquippedBackground, setHomeBackground]);

  if (currentTab !== "home") return null;

  const progress = getLevelProgress();
  const hasActiveStreak = streakData.currentStreak >= 3;
  const currentBiomeIcon = BIOME_CONFIG[currentBiome]?.icon || 'meadow';

  return (
    <div className="status-bar-container">
      {/* Game-style unified top bar */}
      <div className="game-top-bar">
        {/* Left section: Level + Biome */}
        <div className="top-bar-left">
          {/* Level Badge with Stats Popover */}
          <Popover open={statsOpen} onOpenChange={setStatsOpen}>
            <PopoverTrigger asChild>
              <button className="level-badge-btn" aria-label="View stats">
                <div className="level-badge-inner">
                  <span className="level-star">★</span>
                  <span className="level-number">{currentLevel}</span>
                </div>
                <div className="level-progress-track">
                  <div
                    className="level-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="stats-popover" align="start" sideOffset={8}>
              <div className="stats-popover-content">
                <div className="stats-header">
                  <span className="stats-header-star">★</span>
                  <span>Your Progress</span>
                </div>

                <div className="stats-grid">
                  <div className="stat-row">
                    <span className="stat-label">
                      <Star className="w-3 h-3 inline mr-1 text-amber-500" style={{ filter: 'drop-shadow(0 0 2px hsl(45 100% 50% / 0.5))' }} />
                      Level
                    </span>
                    <span className="stat-val">
                      <span className="retro-level-badge px-1.5 py-0 text-[10px]">{currentLevel}</span>
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">
                      <Trophy className="w-3 h-3 inline mr-1 text-purple-500" style={{ filter: 'drop-shadow(0 0 2px hsl(280 100% 50% / 0.4))' }} />
                      XP
                    </span>
                    <span className="stat-val">{currentXP} / {currentXP + xpToNextLevel}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">
                      <Heart className="w-3 h-3 inline mr-1 text-pink-500 fill-current" style={{ filter: 'drop-shadow(0 0 2px hsl(340 100% 50% / 0.4))' }} />
                      Pets Collected
                    </span>
                    <span className="stat-val">{unlockedAnimals.length}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">
                      <Flame className="w-3 h-3 inline mr-1 text-orange-500" style={{ filter: 'drop-shadow(0 0 2px hsl(25 100% 50% / 0.4))' }} />
                      Best Streak
                    </span>
                    <span className="stat-val">{streakData.longestStreak} days</span>
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="xp-progress-container">
                  <div className="xp-progress-bar">
                    <div
                      className="xp-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="xp-progress-label">{Math.round(progress)}% to next level</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Biome Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="biome-btn">
                <PixelIcon name={currentBiomeIcon} size={16} className="biome-icon" />
                <ChevronDown className="w-3 h-3 biome-chevron" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="biome-menu">
              {availableBiomes.map((biome) => {
                const config = BIOME_CONFIG[biome];
                const isActive = biome === currentBiome;
                return (
                  <DropdownMenuItem
                    key={biome}
                    onClick={() => handleSwitchBiome(biome)}
                    className={`biome-menu-item ${isActive ? 'selected' : ''}`}
                  >
                    <PixelIcon name={config?.icon || 'globe'} size={16} />
                    <span>{biome}</span>
                    {isActive && <span className="biome-check">✓</span>}
                  </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        {/* Center section: Coins - tappable to buy more */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('switchToTab', { detail: 'shop' }));
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('navigateToShopCategory', { detail: 'powerups' }));
            }, 50);
          }}
          className="stat-chip coin-chip"
        >
          <span className="chip-icon coin-icon">◉</span>
          <span className="chip-value">{coinSystem.balance.toLocaleString()}</span>
          <span className="coin-plus-badge">+</span>
        </button>

        {/* Right section: Streak + Settings */}
        <div className="top-bar-right">
          <div className={`stat-chip streak-chip ${hasActiveStreak ? 'active' : ''}`}>
            <span className="chip-icon streak-icon">🔥</span>
            <span className="chip-value">{streakData.currentStreak}</span>
          </div>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="settings-btn"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
