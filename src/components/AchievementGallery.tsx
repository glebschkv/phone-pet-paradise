import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Share2, Lock, Star, Target, Zap, TrendingUp, Coins, ChevronLeft, Check } from 'lucide-react';
import { useAchievementSystem, Achievement } from '@/hooks/useAchievementSystem';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useCoinSystem } from '@/hooks/useCoinSystem';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AchievementGalleryProps {
  onClose?: () => void;
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const {
    achievements,
    unlockedAchievements,
    getAchievementsByCategory,
    getTotalAchievementPoints,
    getCompletionPercentage,
    shareAchievement,
    claimRewards
  } = useAchievementSystem();
  const { addDirectXP } = useXPSystem();
  const coinSystem = useCoinSystem();
  const { toast } = useToast();

  // Simplified categories that fit on screen
  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'focus', name: 'Focus', icon: Target },
    { id: 'collection', name: 'Pets', icon: Star },
    { id: 'progression', name: 'Level', icon: TrendingUp },
    { id: 'economy', name: 'Coins', icon: Coins },
    { id: 'special', name: 'Special', icon: Zap },
  ];

  const tierEmoji: Record<string, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💠',
    diamond: '💎'
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : getAchievementsByCategory(selectedCategory);

  const handleClaim = (achievement: Achievement) => {
    const rewards = claimRewards(achievement.id);
    if (rewards.xp > 0) {
      addDirectXP(rewards.xp);
    }
    if (rewards.coins > 0) {
      coinSystem.addCoins(rewards.coins);
    }
    toast({
      title: "Rewards Claimed!",
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
          toast({ title: "Copied!", description: "Share text copied" });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const AchievementRow: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const isUnlocked = achievement.isUnlocked;
    const isClaimed = achievement.rewardsClaimed;
    const isSecret = achievement.secret && !isUnlocked;
    const progress = Math.min(100, (achievement.progress / achievement.target) * 100);
    const canClaim = isUnlocked && !isClaimed;

    const xpReward = achievement.rewards.find(r => r.type === 'xp')?.amount || 0;
    const coinReward = achievement.rewards.find(r => r.type === 'coins')?.amount || 0;

    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all",
        canClaim
          ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/40"
          : isUnlocked
          ? "bg-green-500/10 border border-green-500/20"
          : "bg-purple-900/40 border border-purple-500/20"
      )}>
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border-2",
          canClaim
            ? "bg-yellow-500/20 border-yellow-500/50"
            : isUnlocked
            ? "bg-green-500/20 border-green-500/30"
            : "bg-purple-800/50 border-purple-600/30"
        )}>
          {isSecret ? '❓' : achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn(
              "font-bold text-sm truncate",
              canClaim ? "text-yellow-300" : isUnlocked ? "text-white" : "text-purple-200"
            )}>
              {isSecret ? '???' : achievement.title}
            </span>
            {isUnlocked && isClaimed && (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
            <span className="text-sm flex-shrink-0">{tierEmoji[achievement.tier]}</span>
          </div>

          {!isSecret ? (
            <>
              {/* Compact progress */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-purple-900/60 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      canClaim ? "bg-yellow-500" : isUnlocked ? "bg-green-500" : "bg-purple-500"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-purple-400 w-16 text-right">
                  {achievement.progress}/{achievement.target}
                </span>
              </div>
              {/* Rewards inline */}
              <div className="flex gap-3 text-[11px]">
                <span className="text-blue-400 font-medium">+{xpReward} XP</span>
                <span className="text-yellow-400 font-medium">+{coinReward} 🪙</span>
              </div>
            </>
          ) : (
            <span className="text-[11px] text-purple-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Secret achievement
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {canClaim ? (
            <button
              onClick={() => handleClaim(achievement)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-xs font-bold uppercase shadow-lg shadow-yellow-500/30 transition-all active:scale-95"
            >
              Claim
            </button>
          ) : isUnlocked ? (
            <button
              onClick={() => handleShare(achievement.id)}
              className="w-9 h-9 rounded-lg bg-purple-500/30 hover:bg-purple-500/50 flex items-center justify-center transition-colors"
            >
              <Share2 className="w-4 h-4 text-purple-300" />
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const completionPercentage = getCompletionPercentage();
  const totalPoints = getTotalAchievementPoints();
  const unclaimedCount = unlockedAchievements.filter(a => !a.rewardsClaimed).length;

  return (
    <div className="h-full flex flex-col bg-[hsl(260,30%,10%)]">
      {/* Compact Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-purple-300" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Achievements</h1>
            <p className="text-xs text-purple-400">
              {unlockedAchievements.length}/{achievements.length} complete
              {unclaimedCount > 0 && (
                <span className="text-yellow-400 ml-1">• {unclaimedCount} to claim</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{totalPoints}</div>
            <div className="text-[10px] text-purple-400">points</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-purple-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="text-right text-[10px] text-purple-400 mt-1">{completionPercentage}% complete</div>
      </div>

      {/* Category Tabs - Compact horizontal */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => {
            const catAchievements = cat.id === 'all' ? achievements : getAchievementsByCategory(cat.id);
            if (cat.id !== 'all' && catAchievements.length === 0) return null;

            const catUnlocked = catAchievements.filter(a => a.isUnlocked).length;
            const isActive = selectedCategory === cat.id;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                  isActive
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                    : "bg-purple-900/50 text-purple-300 hover:bg-purple-800/60"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-white/20" : "bg-purple-700/50"
                )}>
                  {catUnlocked}/{catAchievements.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievement List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-6">
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-16 text-purple-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No achievements in this category</p>
            </div>
          ) : (
            filteredAchievements
              .sort((a, b) => {
                // Unclaimed unlocked first
                const aCanClaim = a.isUnlocked && !a.rewardsClaimed;
                const bCanClaim = b.isUnlocked && !b.rewardsClaimed;
                if (aCanClaim !== bCanClaim) return aCanClaim ? -1 : 1;
                // Then unlocked
                if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
                // Then by progress percentage
                return (b.progress / b.target) - (a.progress / a.target);
              })
              .map(achievement => (
                <AchievementRow key={achievement.id} achievement={achievement} />
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
