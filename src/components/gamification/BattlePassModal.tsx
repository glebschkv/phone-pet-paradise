import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBattlePass } from '@/hooks/useBattlePass';
import { cn } from '@/lib/utils';
import { Lock, Check, Gift, Crown, ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react';

interface BattlePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward?: (type: 'xp' | 'coins', amount: number) => void;
}

export const BattlePassModal = ({ isOpen, onClose, onClaimReward }: BattlePassModalProps) => {
  const { state, currentSeason, claimTierReward, getProgress, isTierClaimed } = useBattlePass();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const progress = getProgress();

  if (!currentSeason) {
    return null;
  }

  const handleClaimReward = (tier: number, isPremium: boolean) => {
    const reward = claimTierReward(tier, isPremium);
    if (reward && onClaimReward) {
      if (reward.type === 'xp' && reward.amount) {
        onClaimReward('xp', reward.amount);
      } else if (reward.type === 'coins' && reward.amount) {
        onClaimReward('coins', reward.amount);
      }
    }
  };

  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'legendary';
      case 'epic': return 'epic';
      case 'rare': return 'border-blue-500 bg-blue-500/10';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden retro-modal">
        {/* Retro Header */}
        <div className="retro-modal-header relative overflow-hidden">
          {/* Animated Background Stars */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="absolute text-yellow-400/20 animate-pulse"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.2}s`,
                  width: 12 + (i % 3) * 4,
                  height: 12 + (i % 3) * 4,
                }}
              />
            ))}
          </div>

          <DialogHeader className="relative">
            <DialogTitle className="text-white text-xl flex items-center gap-3 retro-pixel-text">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center border-2 border-yellow-400">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <span className="retro-neon-yellow">{currentSeason.name.toUpperCase()}</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-purple-200/80 text-sm mt-2 relative">
            {currentSeason.description}
          </p>

          {/* XP Progress Bar */}
          <div className="mt-4 space-y-2 relative">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400 retro-pixel-text">LEVEL {progress.currentTier}</span>
              <span className="text-purple-300">{progress.daysRemaining} days left</span>
            </div>
            <div className="retro-health-bar retro-health-bar-purple">
              <div
                className="retro-health-bar-fill"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-purple-300/60">
              <span className="retro-neon-text">{progress.currentXP} XP</span>
              <span>{progress.xpToNextTier} XP to next level</span>
            </div>
          </div>

          {/* Premium Upgrade Button */}
          {!state.isPremium && (
            <button className="w-full mt-3 retro-arcade-btn retro-arcade-btn-yellow py-2 text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              UNLOCK PREMIUM REWARDS
            </button>
          )}
        </div>

        {/* Tiers List */}
        <ScrollArea className="h-[380px] px-4 py-3">
          <div className="space-y-3">
            {currentSeason.tiers.map((tier) => {
              const isUnlocked = tier.tier <= progress.currentTier;
              const isCurrent = tier.tier === progress.currentTier;
              const freeRewardClaimed = isTierClaimed(tier.tier, false);
              const premiumRewardClaimed = isTierClaimed(tier.tier, true);

              return (
                <div
                  key={tier.tier}
                  className={cn(
                    "retro-game-card p-3 transition-all",
                    isCurrent && "retro-active-challenge",
                    !isUnlocked && "opacity-60"
                  )}
                  onClick={() => setSelectedTier(tier.tier)}
                >
                  <div className="flex items-center gap-3">
                    {/* Tier Badge */}
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg retro-pixel-text shrink-0",
                      isUnlocked
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-green-400 text-white"
                        : isCurrent
                        ? "bg-gradient-to-br from-yellow-500 to-orange-600 border-2 border-yellow-400 text-white"
                        : "bg-purple-900/50 border-2 border-purple-600/50 text-purple-400"
                    )}>
                      {isUnlocked ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        tier.tier
                      )}
                    </div>

                    {/* Free Reward */}
                    <div className="flex-1">
                      <div className={cn(
                        "retro-reward-item",
                        getRarityClass(tier.freeReward.rarity),
                        isUnlocked && !freeRewardClaimed && "ring-2 ring-cyan-400"
                      )}>
                        <span className="text-xl">{tier.freeReward.icon}</span>
                        <span className="flex-1 text-sm truncate text-white">
                          {tier.freeReward.itemName}
                        </span>
                        {isUnlocked && !freeRewardClaimed ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimReward(tier.tier, false);
                            }}
                            className="retro-arcade-btn retro-arcade-btn-green px-2 py-1 text-[10px]"
                          >
                            <Gift className="w-3 h-3" />
                          </button>
                        ) : freeRewardClaimed ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : null}
                      </div>
                    </div>

                    {/* Premium Reward */}
                    {tier.premiumReward && (
                      <div className="flex-1">
                        <div className={cn(
                          "retro-reward-item relative",
                          getRarityClass(tier.premiumReward.rarity),
                          state.isPremium && isUnlocked && !premiumRewardClaimed && "ring-2 ring-yellow-400"
                        )}>
                          {!state.isPremium && (
                            <div className="absolute inset-0 bg-purple-900/80 rounded flex items-center justify-center">
                              <Lock className="w-4 h-4 text-yellow-400" />
                            </div>
                          )}
                          <span className="text-xl">{tier.premiumReward.icon}</span>
                          <span className="flex-1 text-sm truncate text-white">
                            {tier.premiumReward.itemName}
                          </span>
                          {state.isPremium && isUnlocked && !premiumRewardClaimed ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClaimReward(tier.tier, true);
                              }}
                              className="retro-arcade-btn retro-arcade-btn-yellow px-2 py-1 text-[10px]"
                            >
                              <Gift className="w-3 h-3" />
                            </button>
                          ) : premiumRewardClaimed ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center p-3 border-t-2 border-purple-700/50 bg-purple-900/30">
          <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="retro-pixel-text text-xs">PREV</span>
          </Button>
          <div className="text-center">
            <span className="text-xs text-purple-400 retro-pixel-text">
              ⭐ SEASON {currentSeason.id} ⭐
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
            <span className="retro-pixel-text text-xs">NEXT</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
