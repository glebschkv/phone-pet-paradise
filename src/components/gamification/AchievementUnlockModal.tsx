import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles, Coins, Star } from 'lucide-react';
import { useAchievementSystem, AchievementUnlockEvent } from '@/hooks/useAchievementSystem';
import { cn } from '@/lib/utils';

interface AchievementUnlockModalProps {
  onClaimReward: (xp: number, coins: number) => void;
}

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  onClaimReward
}) => {
  const { pendingUnlock, dismissPendingUnlock, claimRewards } = useAchievementSystem();
  const [isAnimating, setIsAnimating] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const tierColors = {
    bronze: 'from-amber-500 to-amber-700',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-cyan-400 to-cyan-600',
    diamond: 'from-purple-400 to-purple-600'
  };

  const tierGlows = {
    bronze: 'shadow-amber-500/50',
    silver: 'shadow-gray-400/50',
    gold: 'shadow-yellow-500/50',
    platinum: 'shadow-cyan-500/50',
    diamond: 'shadow-purple-500/50'
  };

  const tierEmojis = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💠',
    diamond: '💎'
  };

  useEffect(() => {
    if (pendingUnlock) {
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

    // Auto dismiss after claiming
    setTimeout(() => {
      dismissPendingUnlock();
    }, 500);
  };

  if (!pendingUnlock) return null;

  const { achievement, rewards } = pendingUnlock;

  return (
    <Dialog open={!!pendingUnlock} onOpenChange={() => {}}>
      <DialogContent
        className={cn(
          "max-w-sm p-0 overflow-hidden border-0",
          "bg-gradient-to-b from-slate-900 to-slate-950"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={cn(
            "absolute inset-0 opacity-30",
            `bg-gradient-to-br ${tierColors[achievement.tier]}`
          )} />
          {isAnimating && (
            <>
              <div className="absolute inset-0 animate-pulse bg-white/10" />
              <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-400 animate-ping" />
              <Sparkles className="absolute top-8 right-8 w-4 h-4 text-yellow-400 animate-ping delay-100" />
              <Sparkles className="absolute bottom-20 left-8 w-5 h-5 text-yellow-400 animate-ping delay-200" />
              <Star className="absolute top-12 right-4 w-5 h-5 text-yellow-300 animate-spin" />
            </>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 text-center">
          {/* Trophy animation */}
          <div className={cn(
            "relative mx-auto w-24 h-24 mb-4",
            isAnimating && "animate-bounce"
          )}>
            <div className={cn(
              "absolute inset-0 rounded-full",
              `bg-gradient-to-br ${tierColors[achievement.tier]}`,
              `shadow-2xl ${tierGlows[achievement.tier]}`,
              isAnimating && "animate-pulse"
            )} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">{achievement.icon}</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-2">
            <Badge className={cn(
              "text-xs px-3 py-1 mb-2",
              `bg-gradient-to-r ${tierColors[achievement.tier]} text-white border-0`
            )}>
              {tierEmojis[achievement.tier]} {achievement.tier.toUpperCase()}
            </Badge>
          </div>

          <h2 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievement Unlocked!
          </h2>

          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
            {achievement.title}
          </h3>

          <p className="text-sm text-slate-400 mb-6">
            {achievement.description}
          </p>

          {/* Rewards */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Rewards</p>
            <div className="flex justify-center gap-4">
              {rewards.xp > 0 && (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-blue-500/20 border border-blue-500/30",
                  isAnimating && "animate-pulse"
                )}>
                  <Star className="w-5 h-5 text-blue-400" />
                  <span className="text-lg font-bold text-blue-400">+{rewards.xp}</span>
                  <span className="text-xs text-blue-400/80">XP</span>
                </div>
              )}
              {rewards.coins > 0 && (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-yellow-500/20 border border-yellow-500/30",
                  isAnimating && "animate-pulse"
                )}>
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-lg font-bold text-yellow-400">+{rewards.coins}</span>
                  <span className="text-xs text-yellow-400/80">Coins</span>
                </div>
              )}
            </div>
          </div>

          {/* Claim button */}
          <Button
            onClick={handleClaim}
            disabled={claimed}
            className={cn(
              "w-full py-6 text-lg font-bold",
              "bg-gradient-to-r from-yellow-500 to-orange-500",
              "hover:from-yellow-400 hover:to-orange-400",
              "text-white shadow-lg shadow-orange-500/30",
              "transition-all duration-300",
              claimed && "opacity-50"
            )}
          >
            {claimed ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Claimed!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Claim Rewards
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
