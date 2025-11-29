import { useEffect, useState } from 'react';
import { useComboSystem, COMBO_UPDATED_EVENT } from '@/hooks/useComboSystem';
import { cn } from '@/lib/utils';
import { Flame, Clock, TrendingUp, Zap } from 'lucide-react';

interface ComboDisplayProps {
  variant?: 'compact' | 'full' | 'minimal';
  className?: string;
}

export const ComboDisplay = ({ variant = 'compact', className }: ComboDisplayProps) => {
  const {
    state,
    currentTier,
    getTimeUntilExpiry,
    getNextTierProgress,
    getCurrentMultiplier,
  } = useComboSystem();

  const [showAnimation, setShowAnimation] = useState(false);
  const timeUntilExpiry = getTimeUntilExpiry();
  const nextTierProgress = getNextTierProgress();
  const multiplier = getCurrentMultiplier();

  // Listen for combo updates to trigger animation
  useEffect(() => {
    const handleComboUpdate = () => {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1000);
    };

    window.addEventListener(COMBO_UPDATED_EVENT, handleComboUpdate);
    return () => window.removeEventListener(COMBO_UPDATED_EVENT, handleComboUpdate);
  }, []);

  if (state.currentCombo === 0 && variant === 'minimal') {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold retro-pixel-text",
        "bg-gradient-to-r from-orange-500/30 to-red-500/30",
        "border border-orange-500/50",
        showAnimation && "animate-pulse",
        className
      )}>
        <Flame className="w-3 h-3 text-orange-400" />
        <span className="retro-neon-orange">{state.currentCombo}x</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "retro-game-card p-3",
        showAnimation && "retro-active-challenge",
        className
      )}>
        <div className="flex items-center gap-3">
          {/* Combo Counter */}
          <div className="retro-combo-counter w-16 h-16 shrink-0">
            <span className="retro-combo-number">{state.currentCombo}</span>
            <span className="retro-combo-label">HIT</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold retro-pixel-text" style={{ color: currentTier.color }}>
                {currentTier.emoji} {currentTier.name.toUpperCase()}
              </span>
              <span className="retro-neon-green text-sm retro-pixel-text">
                {multiplier}x
              </span>
            </div>

            {/* Time until expiry */}
            {!timeUntilExpiry.isExpired && (
              <div className="flex items-center gap-1 text-xs text-purple-400 mb-2">
                <Clock className="w-3 h-3" />
                <span className="retro-pixel-text">
                  {timeUntilExpiry.hours}h {timeUntilExpiry.minutes}m left
                </span>
              </div>
            )}

            {/* Progress to next tier */}
            {nextTierProgress.nextTier && (
              <div>
                <div className="flex justify-between text-xs text-purple-400 mb-1">
                  <span className="retro-pixel-text">NEXT: {nextTierProgress.nextTier.name}</span>
                  <span>{nextTierProgress.sessionsNeeded} more</span>
                </div>
                <div className="retro-health-bar h-2">
                  <div
                    className="retro-health-bar-fill"
                    style={{ width: `${nextTierProgress.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn(
      "retro-game-card p-4 overflow-hidden relative",
      showAnimation && "retro-active-challenge",
      className
    )}>
      {/* Animated background glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${currentTier.color} 0%, transparent 50%)`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2 retro-pixel-text retro-neon-orange">
            <Zap className="w-5 h-5" />
            COMBO SYSTEM
          </h3>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-purple-400 retro-pixel-text">BEST: {state.highestCombo}</span>
          </div>
        </div>

        {/* Main combo display */}
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "retro-combo-counter w-24 h-24",
            showAnimation && "animate-bounce"
          )}>
            <span className="retro-combo-number text-4xl">{state.currentCombo}</span>
            <span className="retro-combo-label">COMBO</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{currentTier.emoji}</span>
              <span className="font-bold text-xl retro-pixel-text" style={{ color: currentTier.color }}>
                {currentTier.name.toUpperCase()}
              </span>
            </div>
            <div className="text-3xl font-bold retro-neon-green retro-pixel-text">
              {multiplier}x <span className="text-sm font-normal text-purple-400">BONUS</span>
            </div>
          </div>
        </div>

        {/* Expiry timer */}
        {state.currentCombo > 0 && (
          <div className={cn(
            "retro-game-card p-3 flex items-center justify-between mb-4",
            timeUntilExpiry.hours < 1 && "border-red-500/50"
          )}>
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "w-4 h-4",
                timeUntilExpiry.hours < 1 ? "text-red-400" : "text-purple-400"
              )} />
              <span className="text-sm retro-pixel-text text-purple-300">
                {timeUntilExpiry.isExpired
                  ? "COMBO EXPIRED!"
                  : `Expires in ${timeUntilExpiry.hours}h ${timeUntilExpiry.minutes}m`}
              </span>
            </div>
            <span className="text-xs text-purple-400">
              Keep playing!
            </span>
          </div>
        )}

        {/* Progress to next tier */}
        {nextTierProgress.nextTier && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 retro-pixel-text text-purple-300">
                NEXT TIER:
                <span className="font-bold" style={{ color: nextTierProgress.nextTier.color }}>
                  {nextTierProgress.nextTier.emoji} {nextTierProgress.nextTier.name}
                </span>
              </span>
              <span className="text-purple-400 retro-pixel-text">
                {nextTierProgress.sessionsNeeded} sessions
              </span>
            </div>
            <div className="retro-health-bar">
              <div
                className="retro-health-bar-fill"
                style={{ width: `${nextTierProgress.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-purple-400 text-center retro-pixel-text">
              {nextTierProgress.nextTier.multiplier}x at {nextTierProgress.nextTier.minCombo} combo
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="retro-stats-grid">
          <div className="retro-stat-box">
            <div className="retro-stat-value retro-neon-yellow">+{state.totalBonusXPEarned}</div>
            <div className="retro-stat-label">BONUS XP</div>
          </div>
          <div className="retro-stat-box">
            <div className="retro-stat-value retro-neon-orange">+{state.totalBonusCoinsEarned}</div>
            <div className="retro-stat-label">BONUS COINS</div>
          </div>
        </div>
      </div>
    </div>
  );
};
