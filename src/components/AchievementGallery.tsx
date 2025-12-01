import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Share2, Lock, Star, Target, Users, Zap, Heart, TrendingUp, Coins, ChevronLeft } from 'lucide-react';
import { useAchievementSystem, Achievement } from '@/hooks/useAchievementSystem';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AchievementGalleryProps {
  onClose?: () => void;
  embedded?: boolean;
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({ onClose, embedded = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const {
    achievements,
    unlockedAchievements,
    getAchievementsByCategory,
    getTotalAchievementPoints,
    getCompletionPercentage,
    shareAchievement
  } = useAchievementSystem();
  const { toast } = useToast();

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'focus', name: 'Focus', icon: Target },
    { id: 'collection', name: 'Collect', icon: Star },
    { id: 'bond', name: 'Bond', icon: Heart },
    { id: 'progression', name: 'Level', icon: TrendingUp },
    { id: 'economy', name: 'Economy', icon: Coins },
    { id: 'special', name: 'Special', icon: Zap },
    { id: 'social', name: 'Social', icon: Users }
  ];

  const tierStyles = {
    bronze: {
      bg: 'from-amber-700 to-amber-900',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/30',
      text: 'text-amber-400'
    },
    silver: {
      bg: 'from-gray-400 to-gray-600',
      border: 'border-gray-300',
      glow: 'shadow-gray-400/30',
      text: 'text-gray-300'
    },
    gold: {
      bg: 'from-yellow-500 to-yellow-700',
      border: 'border-yellow-400',
      glow: 'shadow-yellow-500/40',
      text: 'text-yellow-400'
    },
    platinum: {
      bg: 'from-cyan-400 to-cyan-600',
      border: 'border-cyan-300',
      glow: 'shadow-cyan-400/40',
      text: 'text-cyan-300'
    },
    diamond: {
      bg: 'from-purple-400 to-purple-600',
      border: 'border-purple-300',
      glow: 'shadow-purple-400/50',
      text: 'text-purple-300'
    }
  };

  const tierEmojis = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💠',
    diamond: '💎'
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : getAchievementsByCategory(selectedCategory);

  const handleShare = async (achievementId: string) => {
    const shareText = shareAchievement(achievementId);
    if (!shareText) {
      toast({
        title: "Cannot Share",
        description: "This achievement hasn't been unlocked yet.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Achievement Unlocked!",
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard",
          description: "Share text copied! Paste it anywhere to share your achievement.",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const isUnlocked = achievement.isUnlocked;
    const progress = Math.min(100, (achievement.progress / achievement.target) * 100);
    const isSecret = achievement.secret && !isUnlocked;
    const style = tierStyles[achievement.tier];

    const xpReward = achievement.rewards.find(r => r.type === 'xp')?.amount || 0;
    const coinReward = achievement.rewards.find(r => r.type === 'coins')?.amount || 0;

    return (
      <div className={cn(
        "retro-game-card p-3 transition-all",
        isUnlocked && "retro-active-challenge"
      )}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center text-2xl",
            "retro-icon-badge",
            isUnlocked && `bg-gradient-to-br ${style.bg} ${style.border} shadow-lg ${style.glow}`
          )}>
            {isSecret ? '❓' : achievement.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-bold text-sm retro-pixel-text truncate",
                isUnlocked ? "text-white" : "text-purple-300"
              )}>
                {isSecret ? '???' : achievement.title}
              </h3>
              {isUnlocked && <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
            </div>

            <p className="text-xs text-purple-300/70 line-clamp-1 mb-2">
              {isSecret ? 'Keep exploring to unlock!' : achievement.description}
            </p>

            {!isSecret && (
              <>
                {/* Progress Bar */}
                <div className="retro-health-bar retro-health-bar-purple h-3 mb-2">
                  <div
                    className="retro-health-bar-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  {/* Progress Text */}
                  <span className="text-[10px] text-purple-300/60">
                    {achievement.progress.toLocaleString()}/{achievement.target.toLocaleString()}
                  </span>

                  {/* Rewards */}
                  <div className="flex gap-1.5">
                    {xpReward > 0 && (
                      <span className="text-[10px] font-bold text-blue-400">
                        +{xpReward} XP
                      </span>
                    )}
                    {coinReward > 0 && (
                      <span className="text-[10px] font-bold text-yellow-400">
                        +{coinReward} 🪙
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {isSecret && (
              <div className="flex items-center gap-2 text-purple-400/60">
                <Lock className="w-3 h-3" />
                <span className="text-[10px]">Secret Achievement</span>
              </div>
            )}
          </div>

          {/* Tier Badge & Share */}
          <div className="flex flex-col items-end gap-2">
            <div className={cn(
              "retro-difficulty-badge text-[9px]",
              achievement.tier === 'bronze' && "retro-difficulty-normal",
              achievement.tier === 'silver' && "bg-gradient-to-b from-gray-400 to-gray-500 border-2 border-gray-300 text-white",
              achievement.tier === 'gold' && "retro-difficulty-hard",
              achievement.tier === 'platinum' && "bg-gradient-to-b from-cyan-400 to-cyan-500 border-2 border-cyan-300 text-white",
              achievement.tier === 'diamond' && "retro-difficulty-legendary"
            )}>
              {tierEmojis[achievement.tier]}
            </div>
            {isUnlocked && (
              <button
                onClick={() => handleShare(achievement.id)}
                className="w-6 h-6 rounded flex items-center justify-center bg-purple-500/30 hover:bg-purple-500/50 transition-colors"
              >
                <Share2 className="w-3 h-3 text-purple-300" />
              </button>
            )}
          </div>
        </div>

        {/* Unlock Date */}
        {isUnlocked && achievement.unlockedAt && (
          <div className="mt-2 pt-2 border-t border-purple-500/20 text-[10px] text-purple-400/50 text-right">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  const completionPercentage = getCompletionPercentage();
  const totalPoints = getTotalAchievementPoints();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="relative p-4 border-b-4 border-purple-600/50">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/30 via-transparent to-yellow-900/30" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-10 h-10 retro-icon-badge"
                >
                  <ChevronLeft className="w-5 h-5 text-purple-300" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold retro-pixel-text retro-neon-yellow">
                  ACHIEVEMENTS
                </h1>
                <p className="text-xs text-purple-300/80">
                  {unlockedAchievements.length}/{achievements.length} Unlocked
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold retro-score-display">{totalPoints}</div>
              <div className="text-[10px] text-purple-300/60 uppercase tracking-wide">Points</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="retro-health-bar retro-health-bar-yellow h-4">
            <div
              className="retro-health-bar-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-purple-300/60 mt-1">
            <span>Progress</span>
            <span className="retro-neon-yellow font-bold">{completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-2 py-2 border-b border-purple-600/30 bg-purple-900/20">
        <ScrollArea className="w-full">
          <div className="flex gap-1 w-max px-1">
            {categories.map(category => {
              const CategoryIcon = category.icon;
              const categoryAchievements = category.id === 'all'
                ? achievements
                : getAchievementsByCategory(category.id);

              if (category.id !== 'all' && categoryAchievements.length === 0) return null;

              const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length;
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "retro-tab flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px]",
                    isActive && "active"
                  )}
                >
                  <CategoryIcon className="w-4 h-4" />
                  <span className="text-[10px]">{category.name}</span>
                  <span className="text-[9px] opacity-70">{unlockedCount}/{categoryAchievements.length}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Achievement List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3 pb-6">
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 retro-icon-badge">
                <Trophy className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-purple-300/60 retro-pixel-text">No achievements yet</p>
            </div>
          ) : (
            filteredAchievements
              .sort((a, b) => {
                // Unlocked first
                if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
                // Then by tier
                const tierOrder = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
                if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[b.tier] - tierOrder[a.tier];
                // Then by progress percentage
                return (b.progress / b.target) - (a.progress / a.target);
              })
              .map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
