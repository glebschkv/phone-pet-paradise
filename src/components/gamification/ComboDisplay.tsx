import { useEffect, useState } from 'react';
import { useComboSystem, COMBO_UPDATED_EVENT } from '@/hooks/useComboSystem';
import { cn } from '@/lib/utils';
import { Flame, Clock, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
        "bg-gradient-to-r from-orange-500/20 to-red-500/20",
        showAnimation && "animate-pulse",
        className
      )}>
        <Flame className="w-3 h-3 text-orange-500" />
        <span style={{ color: currentTier.color }}>{state.currentCombo}x</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card",
        showAnimation && "ring-2 ring-orange-500 animate-pulse",
        className
      )}>
        {/* Combo count */}
        <div className={cn(
          "w-12 h-12 rounded-full flex flex-col items-center justify-center",
          "bg-gradient-to-br from-orange-500 to-red-500"
        )}>
          <span className="text-white font-bold text-lg">{state.currentCombo}</span>
          <span className="text-white/80 text-[8px]">COMBO</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: currentTier.color }}>
              {currentTier.emoji} {currentTier.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {multiplier}x bonus
            </span>
          </div>

          {/* Time until expiry */}
          {!timeUntilExpiry.isExpired && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>Expires in {timeUntilExpiry.hours}h {timeUntilExpiry.minutes}m</span>
            </div>
          )}

          {/* Progress to next tier */}
          {nextTierProgress.nextTier && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Next: {nextTierProgress.nextTier.name}</span>
                <span>{nextTierProgress.sessionsNeeded} sessions</span>
              </div>
              <Progress value={nextTierProgress.progressPercent} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn(
      "p-4 rounded-xl border bg-card overflow-hidden relative",
      showAnimation && "ring-2 ring-orange-500",
      className
    )}>
      {/* Animated background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentTier.color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Combo System
          </h3>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Best: {state.highestCombo}</span>
          </div>
        </div>

        {/* Main combo display */}
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex flex-col items-center justify-center",
            "bg-gradient-to-br from-orange-500 to-red-600",
            showAnimation && "animate-bounce"
          )}>
            <span className="text-white font-bold text-3xl">{state.currentCombo}</span>
            <span className="text-white/80 text-xs">COMBO</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{currentTier.emoji}</span>
              <span className="font-bold text-xl" style={{ color: currentTier.color }}>
                {currentTier.name}
              </span>
            </div>
            <div className="text-3xl font-bold text-green-500">
              {multiplier}x <span className="text-sm font-normal text-muted-foreground">multiplier</span>
            </div>
          </div>
        </div>

        {/* Expiry timer */}
        {state.currentCombo > 0 && (
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg mb-4",
            timeUntilExpiry.hours < 1 ? "bg-red-500/10" : "bg-muted"
          )}>
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "w-4 h-4",
                timeUntilExpiry.hours < 1 ? "text-red-500" : "text-muted-foreground"
              )} />
              <span className="text-sm">
                {timeUntilExpiry.isExpired
                  ? "Combo expired!"
                  : `Combo expires in ${timeUntilExpiry.hours}h ${timeUntilExpiry.minutes}m`}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Complete a session to keep it going!
            </span>
          </div>
        )}

        {/* Progress to next tier */}
        {nextTierProgress.nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                Next tier:
                <span className="font-bold" style={{ color: nextTierProgress.nextTier.color }}>
                  {nextTierProgress.nextTier.emoji} {nextTierProgress.nextTier.name}
                </span>
              </span>
              <span className="text-muted-foreground">
                {nextTierProgress.sessionsNeeded} more sessions
              </span>
            </div>
            <Progress value={nextTierProgress.progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Reach {nextTierProgress.nextTier.multiplier}x multiplier at {nextTierProgress.nextTier.minCombo} combo
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
          <div className="text-center p-2 rounded-lg bg-muted">
            <div className="text-xl font-bold text-yellow-500">+{state.totalBonusXPEarned}</div>
            <div className="text-xs text-muted-foreground">Bonus XP earned</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted">
            <div className="text-xl font-bold text-amber-500">+{state.totalBonusCoinsEarned}</div>
            <div className="text-xs text-muted-foreground">Bonus coins earned</div>
          </div>
        </div>
      </div>
    </div>
  );
};
