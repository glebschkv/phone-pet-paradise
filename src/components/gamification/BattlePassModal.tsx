import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBattlePass } from '@/hooks/useBattlePass';
import { SEASONS } from '@/data/GamificationData';
import { cn } from '@/lib/utils';
import { Lock, Check, Gift, Crown, ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react';

interface BattlePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward?: (type: 'xp' | 'coins', amount: number) => void;
}

export const BattlePassModal = ({ isOpen, onClose, onClaimReward }: BattlePassModalProps) => {
  const { state, currentSeason, claimTierReward, getProgress, isTierClaimed, upgradeToPremium } = useBattlePass();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [viewingSeasonIndex, setViewingSeasonIndex] = useState<number>(() => {
    // Start with the current season
    const currentIndex = SEASONS.findIndex(s => s.id === currentSeason?.id);
    return currentIndex >= 0 ? currentIndex : 0;
  });
  const progress = getProgress();

  // Get the season being viewed
  const viewingSeason = SEASONS[viewingSeasonIndex];
  const isViewingCurrentSeason = viewingSeason?.id === currentSeason?.id;

  // Navigation functions
  const canGoPrev = viewingSeasonIndex > 0;
  const canGoNext = viewingSeasonIndex < SEASONS.length - 1;

  const goToPrevSeason = () => {
    if (canGoPrev) {
      setViewingSeasonIndex(prev => prev - 1);
    }
  };

  const goToNextSeason = () => {
    if (canGoNext) {
      setViewingSeasonIndex(prev => prev + 1);
    }
  };

  // Calculate days remaining for the viewing season
  const viewingSeasonDaysRemaining = useMemo(() => {
    if (!viewingSeason) return 0;
    const endDate = new Date(viewingSeason.endDate);
    const now = new Date();
    return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }, [viewingSeason]);

  // Handle premium upgrade
  const handlePremiumUpgrade = () => {
    upgradeToPremium();
  };

  if (!currentSeason || !viewingSeason) {
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
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden retro-modal flex flex-col">
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
              <span className="retro-neon-yellow">{viewingSeason.name.toUpperCase()}</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-purple-200/80 text-sm mt-2 relative">
            {viewingSeason.description}
          </p>

          {/* XP Progress Bar - Only show for current season */}
          {isViewingCurrentSeason ? (
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
          ) : (
            <div className="mt-4 space-y-2 relative">
              <div className="flex justify-between text-xs">
                <span className="text-purple-400 retro-pixel-text">
                  {viewingSeasonDaysRemaining > 0 ? 'UPCOMING SEASON' : 'PAST SEASON'}
                </span>
                <span className="text-purple-300">
                  {viewingSeasonDaysRemaining > 0
                    ? `Starts in ${viewingSeasonDaysRemaining} days`
                    : 'Season ended'}
                </span>
              </div>
            </div>
          )}

          {/* Premium Upgrade Button - Only show for current season */}
          {isViewingCurrentSeason && !state.isPremium && (
            <button
              onClick={handlePremiumUpgrade}
              className="w-full mt-3 retro-arcade-btn retro-arcade-btn-yellow py-3 text-sm flex items-center justify-center gap-2 touch-manipulation select-none active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              UNLOCK PREMIUM REWARDS
            </button>
          )}
        </div>

        {/* Tiers List */}
        <ScrollArea className="flex-1 min-h-0 max-h-[45vh] sm:max-h-[380px] px-4 py-3">
          <div className="space-y-3 pb-2">
            {viewingSeason.tiers.map((tier) => {
              // Only show unlocked status for current season
              const isUnlocked = isViewingCurrentSeason && tier.tier <= progress.currentTier;
              const isCurrent = isViewingCurrentSeason && tier.tier === progress.currentTier;
              const freeRewardClaimed = isViewingCurrentSeason && isTierClaimed(tier.tier, false);
              const premiumRewardClaimed = isViewingCurrentSeason && isTierClaimed(tier.tier, true);
              const canClaimRewards = isViewingCurrentSeason;

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
                        {canClaimRewards && isUnlocked && !freeRewardClaimed ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimReward(tier.tier, false);
                            }}
                            className="retro-arcade-btn retro-arcade-btn-green px-3 py-2 text-[10px] touch-manipulation select-none active:scale-95"
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
                          "retro-reward-item relative overflow-hidden",
                          getRarityClass(tier.premiumReward.rarity),
                          canClaimRewards && state.isPremium && isUnlocked && !premiumRewardClaimed && "ring-2 ring-yellow-400"
                        )}>
                          {!state.isPremium ? (
                            <>
                              <div className="absolute inset-0 bg-purple-900/95 rounded flex items-center justify-center z-10">
                                <Lock className="w-4 h-4 text-yellow-400" />
                              </div>
                              <span className="text-xl opacity-30">{tier.premiumReward.icon}</span>
                              <span className="flex-1 text-sm truncate text-purple-400/50">
                                {tier.premiumReward.itemName}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl">{tier.premiumReward.icon}</span>
                              <span className="flex-1 text-sm truncate text-white">
                                {tier.premiumReward.itemName}
                              </span>
                              {canClaimRewards && isUnlocked && !premiumRewardClaimed ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClaimReward(tier.tier, true);
                                  }}
                                  className="retro-arcade-btn retro-arcade-btn-yellow px-3 py-2 text-[10px] touch-manipulation select-none active:scale-95"
                                >
                                  <Gift className="w-3 h-3" />
                                </button>
                              ) : premiumRewardClaimed ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : null}
                            </>
                          )}
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
        <div className="flex justify-between items-center p-3 border-t-2 border-purple-700/50 bg-purple-900/30 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevSeason}
            disabled={!canGoPrev}
            className={cn(
              "touch-manipulation active:scale-95 py-3 px-4",
              canGoPrev
                ? "text-purple-400 hover:text-purple-300"
                : "text-purple-600/50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="retro-pixel-text text-xs">PREV</span>
          </Button>
          <div className="text-center">
            <span className="text-xs text-purple-400 retro-pixel-text">
              ⭐ SEASON {viewingSeason.id} ⭐
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextSeason}
            disabled={!canGoNext}
            className={cn(
              "touch-manipulation active:scale-95 py-3 px-4",
              canGoNext
                ? "text-purple-400 hover:text-purple-300"
                : "text-purple-600/50 cursor-not-allowed"
            )}
          >
            <span className="retro-pixel-text text-xs">NEXT</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
