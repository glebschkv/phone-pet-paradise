import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { useCoinSystem } from "@/hooks/useCoinSystem";
import { Flame, Coins, Heart, Sparkles, ChevronDown } from "lucide-react";
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

const HOME_BACKGROUND_KEY = 'petIsland_homeBackground';

const BIOME_CONFIG: Record<string, { bg: string; emoji: string }> = {
  'Meadow': { bg: 'day', emoji: '🌿' },
  'Sunset': { bg: 'sunset', emoji: '🌅' },
  'Night': { bg: 'night', emoji: '🌙' },
  'Forest': { bg: 'forest', emoji: '🌲' },
  'Snow': { bg: 'snow', emoji: '❄️' },
};

interface TopStatusBarProps {
  currentTab: string;
}

export const TopStatusBar = ({ currentTab }: TopStatusBarProps) => {
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
    const backgroundId = BIOME_CONFIG[biomeName]?.bg || 'day';
    localStorage.setItem(HOME_BACKGROUND_KEY, backgroundId);
    window.dispatchEvent(new CustomEvent('homeBackgroundChange', { detail: backgroundId }));
  };

  if (currentTab !== "home") return null;

  const progress = getLevelProgress();
  const hasActiveStreak = streakData.currentStreak >= 3;
  const currentBiomeEmoji = BIOME_CONFIG[currentBiome]?.emoji || '🌿';

  return (
    <div className="status-bar-container">
      {/* Clean Single Row Layout */}
      <div className="status-bar">
        {/* Left: Tappable Level Badge with Stats Popover */}
        <Popover open={statsOpen} onOpenChange={setStatsOpen}>
          <PopoverTrigger asChild>
            <button className="level-badge-btn" aria-label="View stats">
              <div className="level-badge-ring">
                <svg className="level-progress-svg" viewBox="0 0 40 40">
                  <circle
                    className="level-progress-bg"
                    cx="20"
                    cy="20"
                    r="17"
                    fill="none"
                    strokeWidth="3"
                  />
                  <circle
                    className="level-progress-fill"
                    cx="20"
                    cy="20"
                    r="17"
                    fill="none"
                    strokeWidth="3"
                    strokeDasharray={`${progress * 1.068} 106.8`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="level-number">{currentLevel}</span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="stats-popover" align="start" sideOffset={8}>
            <div className="stats-popover-content">
              <div className="stats-header">
                <Sparkles className="w-4 h-4 text-amber-500" />
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

        {/* Center: Coin Balance - Primary Currency */}
        <div className="coin-display">
          <div className="coin-icon-wrap">
            <Coins className="w-5 h-5" />
          </div>
          <span className="coin-amount">{coinSystem.balance.toLocaleString()}</span>
        </div>

        {/* Right: Streak Counter */}
        <div className={`streak-display ${hasActiveStreak ? 'active' : ''}`}>
          <Flame className={`w-5 h-5 ${hasActiveStreak ? 'streak-fire-active' : 'streak-fire-idle'}`} />
          <span className="streak-count">{streakData.currentStreak}</span>
        </div>
      </div>

      {/* Biome Selector - Subtle Floating Pill */}
      <div className="biome-float">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="biome-pill">
              <span className="biome-emoji-icon">{currentBiomeEmoji}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="biome-menu">
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
    </div>
  );
};
