import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { useCoinSystem } from "@/hooks/useCoinSystem";
import { Heart, ChevronDown, Settings } from "lucide-react";
import { useState } from "react";
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

const HOME_BACKGROUND_KEY = 'petIsland_homeBackground';
const SHOP_INVENTORY_KEY = 'petIsland_shopInventory';

const BIOME_CONFIG: Record<string, { bg: string; emoji: string }> = {
  'Meadow': { bg: 'day', emoji: '🌿' },
  'Sunset': { bg: 'sunset', emoji: '🌅' },
  'Night': { bg: 'night', emoji: '🌙' },
  'Forest': { bg: 'forest', emoji: '🌲' },
  'Snow': { bg: 'snow', emoji: '❄️' },
  'City': { bg: 'city', emoji: '🏙️' },
  'Ruins': { bg: 'ruins', emoji: '🏛️' },
  'Deep Ocean': { bg: 'deepocean', emoji: '🌊' },
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

  const handleSwitchBiome = (biomeName: string) => {
    switchBiome(biomeName);

    // Clear any equipped premium background when switching biomes
    const savedData = localStorage.getItem(SHOP_INVENTORY_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.equippedBackground) {
          const newInventory = {
            ...parsed,
            equippedBackground: null,
          };
          localStorage.setItem(SHOP_INVENTORY_KEY, JSON.stringify(newInventory));
          window.dispatchEvent(new CustomEvent('petIsland_shopUpdate', { detail: newInventory }));
        }
      } catch (error) {
        console.error('Failed to update shop inventory:', error);
      }
    }

    // Use the biome's background image if available, otherwise fall back to theme ID
    const biome = BIOME_DATABASE.find(b => b.name === biomeName);
    const backgroundTheme = biome?.backgroundImage || BIOME_CONFIG[biomeName]?.bg || 'day';
    localStorage.setItem(HOME_BACKGROUND_KEY, backgroundTheme);
    window.dispatchEvent(new CustomEvent('homeBackgroundChange', { detail: backgroundTheme }));
  };

  if (currentTab !== "home") return null;

  const progress = getLevelProgress();
  const hasActiveStreak = streakData.currentStreak >= 3;
  const currentBiomeEmoji = BIOME_CONFIG[currentBiome]?.emoji || '🌿';

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
                    <span className="stat-label">Level</span>
                    <span className="stat-val">{currentLevel}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">XP</span>
                    <span className="stat-val">{currentXP} / {currentXP + xpToNextLevel}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Pets Collected</span>
                    <span className="stat-val">
                      <Heart className="w-3.5 h-3.5 text-pink-500 fill-current inline mr-1" />
                      {unlockedAnimals.length}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Best Streak</span>
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
                <span className="biome-emoji">{currentBiomeEmoji}</span>
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
                    <span className="text-base">{config?.emoji || '🌍'}</span>
                    <span>{biome}</span>
                    {isActive && <span className="biome-check">✓</span>}
                  </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        {/* Center section: Coins */}
        <div className="stat-chip coin-chip">
          <span className="chip-icon coin-icon">◉</span>
          <span className="chip-value">{coinSystem.balance.toLocaleString()}</span>
        </div>

        {/* Test button for dev - adds 100k coins */}
        <button
          onClick={() => coinSystem.addCoins(100000)}
          className="test-coin-btn"
          title="Add 100k coins (dev)"
        >
          +100k
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
