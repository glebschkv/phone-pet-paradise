import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Trophy, Sparkles, Star } from 'lucide-react';
import { useAchievementSystem } from '@/hooks/useAchievementSystem';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/PixelIcon';

interface AchievementUnlockModalProps {
  onClaimReward: (xp: number, coins: number) => void;
}

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  onClaimReward
}) => {
  const { pendingUnlock, dismissPendingUnlock, claimRewards } = useAchievementSystem();
  const [isAnimating, setIsAnimating] = useState(false);
  const [claimed, setClaimed] = useState(false);
  // Keep a snapshot of the last unlock data so the Dialog can animate out
  // before the content disappears (prevents abrupt unmount leaving stale overlay)
  const [displayData, setDisplayData] = useState<typeof pendingUnlock>(null);

  const tierStyles = {
    bronze: {
      gradient: 'from-amber-600 to-amber-800',
      border: 'border-amber-500',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
      neon: 'retro-neon-orange'
    },
    silver: {
      gradient: 'from-gray-400 to-gray-600',
      border: 'border-gray-300',
      glow: 'shadow-[0_0_30px_rgba(156,163,175,0.5)]',
      neon: 'text-gray-300'
    },
    gold: {
      gradient: 'from-yellow-400 to-yellow-600',
      border: 'border-yellow-300',
      glow: 'shadow-[0_0_30px_rgba(250,204,21,0.6)]',
      neon: 'retro-neon-yellow'
    },
    platinum: {
      gradient: 'from-cyan-400 to-cyan-600',
      border: 'border-cyan-300',
      glow: 'shadow-[0_0_30px_rgba(34,211,238,0.6)]',
      neon: 'retro-neon-text'
    },
    diamond: {
      gradient: 'from-purple-400 to-purple-600',
      border: 'border-purple-300',
      glow: 'shadow-[0_0_40px_rgba(168,85,247,0.7)]',
      neon: 'retro-neon-pink'
    }
  };

  const tierIcons: Record<string, string> = {
    bronze: 'badge-bronze',
    silver: 'badge-silver',
    gold: 'badge-gold',
    platinum: 'diamond',
    diamond: 'diamond'
  };

  useEffect(() => {
    if (pendingUnlock) {
      setDisplayData(pendingUnlock);
      setIsAnimating(true);
      setClaimed(false);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [pendingUnlock]);

  const handleClaim = () => {
    if (!pendingUnlock || claimed) return;

    const rewards = claimRewards(pendingUnlock.achievement.id);
    onClaimReward(rewards.xp, rewards.coins);
    setClaimed(true);

    setTimeout(() => {
      dismissPendingUnlock();
    }, 400);
  };

  const handleDismiss = () => {
    dismissPendingUnlock();
  };

  // Use displayData for rendering so content persists during close animation
  const data = pendingUnlock || displayData;
  if (!data) return null;

  const { achievement, rewards } = data;
  const style = tierStyles[achievement.tier];

  return (
    <Dialog open={!!pendingUnlock} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent
        className={cn(
          "max-w-[340px] p-0 overflow-hidden border-0 rounded-xl",
          "retro-arcade-container retro-modal"
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Achievement Unlocked</DialogTitle>
        </VisuallyHidden>
        {/* Animated scanlines overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
          <div className="absolute inset-0" style={{
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
          }} />
        </div>

        {/* Sparkle effects */}
        {isAnimating && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            <Sparkles className="absolute top-6 left-6 w-6 h-6 text-yellow-400 animate-ping" />
            <Sparkles className="absolute top-10 right-10 w-4 h-4 text-yellow-400 animate-ping" style={{ animationDelay: '0.1s' }} />
            <Sparkles className="absolute bottom-24 left-10 w-5 h-5 text-yellow-400 animate-ping" style={{ animationDelay: '0.2s' }} />
            <Star className="absolute top-16 right-6 w-5 h-5 text-yellow-300 animate-spin" />
            <Star className="absolute bottom-32 right-12 w-4 h-4 text-cyan-400 animate-spin" style={{ animationDelay: '0.3s' }} />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 p-6 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-bold retro-pixel-text retro-neon-yellow uppercase tracking-wider">
              Achievement Unlocked!
            </span>
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>

          {/* Achievement Icon */}
          <div className={cn(
            "relative mx-auto w-24 h-24 mb-4 rounded-xl",
            "bg-gradient-to-br",
            style.gradient,
            style.border,
            "border-4",
            style.glow,
            isAnimating && "animate-bounce"
          )}>
            <div className="absolute inset-0 flex items-center justify-center">
              <PixelIcon name={achievement.icon} size={48} />
            </div>
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent",
                "transform -skew-x-12 -translate-x-full",
                isAnimating && "animate-[shine_1s_ease-in-out]"
              )} />
            </div>
          </div>

          {/* Tier Badge */}
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3",
            "retro-difficulty-badge",
            achievement.tier === 'bronze' && "retro-difficulty-normal",
            achievement.tier === 'silver' && "bg-gradient-to-b from-gray-400 to-gray-500 border-2 border-gray-300",
            achievement.tier === 'gold' && "retro-difficulty-hard",
            achievement.tier === 'platinum' && "bg-gradient-to-b from-cyan-400 to-cyan-500 border-2 border-cyan-300",
            achievement.tier === 'diamond' && "retro-difficulty-legendary"
          )}>
            <PixelIcon name={tierIcons[achievement.tier]} size={20} />
            <span className="text-xs font-bold uppercase">{achievement.tier}</span>
          </div>

          {/* Achievement Title */}
          <h2 className={cn(
            "text-2xl font-bold mb-2 retro-pixel-text",
            style.neon
          )}>
            {achievement.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-purple-300/80 mb-5 px-2">
            {achievement.description}
          </p>

          {/* Rewards Box */}
          <div className="retro-game-card p-4 mb-5">
            <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-3 retro-pixel-text">
              Rewards
            </p>
            <div className="flex justify-center gap-4">
              {rewards.xp > 0 && (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-gradient-to-b from-blue-500/30 to-blue-600/30",
                  "border-2 border-blue-400/50",
                  isAnimating && "animate-pulse"
                )}>
                  <Star className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <div className="text-lg font-bold text-blue-400 retro-pixel-text">+{rewards.xp}</div>
                    <div className="text-[10px] text-blue-400/70 uppercase">XP</div>
                  </div>
                </div>
              )}
              {rewards.coins > 0 && (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-gradient-to-b from-yellow-500/30 to-yellow-600/30",
                  "border-2 border-yellow-400/50",
                  isAnimating && "animate-pulse"
                )}>
                  <PixelIcon name="coin" size={24} />
                  <div className="text-left">
                    <div className="text-lg font-bold text-yellow-400 retro-pixel-text">+{rewards.coins}</div>
                    <div className="text-[10px] text-yellow-400/70 uppercase">Coins</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={claimed}
            className={cn(
              "w-full py-4 rounded-lg font-bold text-lg retro-pixel-text uppercase tracking-wider transition-all",
              claimed
                ? "bg-green-600 text-white cursor-default"
                : "retro-arcade-btn retro-arcade-btn-yellow"
            )}
          >
            {claimed ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Claimed!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                Claim Rewards
              </span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
