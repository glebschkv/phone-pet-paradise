import React from 'react';
import { logger } from "@/lib/logger";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Share2, Lock, ChevronLeft, Check } from 'lucide-react';
import { useAchievementSystem, Achievement } from '@/hooks/useAchievementSystem';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useCoinSystem } from '@/hooks/useCoinSystem';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/PixelIcon';

export interface AchievementGalleryProps {
  onClose?: () => void;
  embedded?: boolean;
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({ onClose }) => {
  const {
    achievements,
    unlockedAchievements,
    getTotalAchievementPoints,
    getCompletionPercentage,
    shareAchievement,
    claimRewards
  } = useAchievementSystem();
  const { addDirectXP } = useXPSystem();
  const coinSystem = useCoinSystem();
  const tierColors: Record<string, { bg: string; border: string; text: string }> = {
    bronze: { bg: 'bg-amber-900/30', border: 'border-amber-600/40', text: 'text-amber-400' },
    silver: { bg: 'bg-slate-400/20', border: 'border-slate-400/40', text: 'text-slate-300' },
    gold: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' },
    platinum: { bg: 'bg-cyan-400/20', border: 'border-cyan-400/40', text: 'text-cyan-300' },
    diamond: { bg: 'bg-purple-400/20', border: 'border-purple-400/40', text: 'text-purple-300' }
  };

  const tierLabel: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond'
  };

  const handleClaim = (achievement: Achievement) => {
    const rewards = claimRewards(achievement.id);
    if (rewards.xp === 0 && rewards.coins === 0) {
      return; // Already claimed by another path (e.g., unlock popup)
    }
    if (rewards.xp > 0) {
      addDirectXP(rewards.xp);
    }
    if (rewards.coins > 0) {
      coinSystem.addCoins(rewards.coins);
    }
    toast.success("Rewards Claimed!", {
      description: `+${rewards.xp} XP, +${rewards.coins} Coins`,
    });
  };

  const handleShare = async (achievementId: string) => {
    const shareText = shareAchievement(achievementId);
    if (shareText) {
      try {
        if (navigator.share) {
          await navigator.share({ title: "Achievement!", text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          toast.success("Copied!", { description: "Share text copied" });
        }
      } catch (e) {
        logger.error(e);
      }
    }
  };

  const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const isUnlocked = achievement.isUnlocked;
    const isClaimed = achievement.rewardsClaimed;
    const isSecret = achievement.secret && !isUnlocked;
    const progress = Math.min(100, (achievement.progress / achievement.target) * 100);
    const canClaim = isUnlocked && !isClaimed;
    const tier = tierColors[achievement.tier];

    const xpReward = achievement.rewards.find(r => r.type === 'xp')?.amount || 0;
    const coinReward = achievement.rewards.find(r => r.type === 'coins')?.amount || 0;

    return (
      <div className={cn(
        "p-4 rounded-2xl transition-all border",
        canClaim
          ? "bg-gradient-to-br from-yellow-500/15 to-amber-600/10 border-yellow-500/50 shadow-lg shadow-yellow-500/10"
          : isUnlocked
          ? "bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/30"
          : "bg-purple-950/40 border-purple-700/30"
      )}>
        {/* Top row: Icon, Title, Tier badge */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border-2",
            canClaim
              ? "bg-yellow-500/20 border-yellow-500/60"
              : isUnlocked
              ? "bg-green-500/15 border-green-500/40"
              : "bg-purple-800/40 border-purple-600/30"
          )}>
            {isSecret ? <PixelIcon name="question-mark" size={28} /> : <PixelIcon name={achievement.icon} size={28} />}
          </div>

          {/* Title & Tier */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-bold text-base",
                canClaim ? "text-yellow-200" : isUnlocked ? "text-white" : "text-purple-100"
              )}>
                {isSecret ? '???' : achievement.title}
              </h3>
              {isUnlocked && isClaimed && (
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              )}
            </div>

            {/* Tier Badge */}
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
              tier.bg, tier.border, tier.text
            )}>
              {tierLabel[achievement.tier]}
            </span>
          </div>

          {/* Claim/Share button */}
          <div className="flex-shrink-0">
            {canClaim ? (
              <button
                onClick={() => handleClaim(achievement)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-xs font-bold uppercase shadow-lg shadow-yellow-500/25 transition-all active:scale-95"
              >
                Claim
              </button>
            ) : isUnlocked ? (
              <button
                onClick={() => handleShare(achievement.id)}
                className="w-10 h-10 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 flex items-center justify-center transition-colors"
              >
                <Share2 className="w-4 h-4 text-purple-300" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Description */}
        {!isSecret ? (
          <>
            <p className={cn(
              "text-sm mb-3 leading-relaxed",
              isUnlocked ? "text-purple-200" : "text-purple-300/80"
            )}>
              {achievement.description}
            </p>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-purple-400">Progress</span>
                <span className={cn(
                  "text-xs font-medium",
                  canClaim ? "text-yellow-400" : isUnlocked ? "text-green-400" : "text-purple-300"
                )}>
                  {achievement.progress}/{achievement.target}
                </span>
              </div>
              <div className="h-2 bg-purple-900/60 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    canClaim
                      ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                      : isUnlocked
                      ? "bg-gradient-to-r from-green-500 to-emerald-400"
                      : "bg-gradient-to-r from-purple-500 to-purple-400"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Rewards */}
            <div className="flex items-center gap-4 pt-2 border-t border-purple-700/30">
              <span className="text-xs text-purple-400">Rewards:</span>
              <span className="text-xs font-semibold text-blue-400">+{xpReward} XP</span>
              <span className="text-xs font-semibold text-yellow-400 inline-flex items-center gap-0.5">+{coinReward} <PixelIcon name="coin" size={14} /></span>
            </div>
          </>
        ) : (
          <p className="text-sm text-purple-400/70 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            This is a secret achievement. Keep playing to discover it!
          </p>
        )}
      </div>
    );
  };

  const completionPercentage = getCompletionPercentage();
  const totalPoints = getTotalAchievementPoints();
  const unclaimedCount = unlockedAchievements.filter(a => !a.rewardsClaimed).length;

  // Sort achievements: claimable first, then by progress percentage
  const sortedAchievements = [...achievements].sort((a, b) => {
    const aCanClaim = a.isUnlocked && !a.rewardsClaimed;
    const bCanClaim = b.isUnlocked && !b.rewardsClaimed;
    if (aCanClaim !== bCanClaim) return aCanClaim ? -1 : 1;
    if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
    return (b.progress / b.target) - (a.progress / a.target);
  });

  return (
    <div className="h-full flex flex-col bg-[hsl(260,30%,10%)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center hover:bg-purple-500/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-purple-300" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Achievements
            </h1>
            <p className="text-sm text-purple-300 mt-0.5">
              {unlockedAchievements.length} of {achievements.length} unlocked
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{totalPoints}</div>
            <div className="text-xs text-purple-400">points</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-purple-900/40 rounded-xl p-3 border border-purple-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-300">Overall Progress</span>
            <span className="text-sm font-semibold text-yellow-400">{completionPercentage}%</span>
          </div>
          <div className="h-3 bg-purple-950/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {unclaimedCount > 0 && (
            <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              {unclaimedCount} achievement{unclaimedCount > 1 ? 's' : ''} ready to claim!
            </p>
          )}
        </div>
      </div>

      {/* Achievement List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 pb-6">
          {sortedAchievements.length === 0 ? (
            <div className="text-center py-16 text-purple-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No achievements yet</p>
            </div>
          ) : (
            sortedAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
