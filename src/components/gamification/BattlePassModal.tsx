import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBattlePass } from '@/hooks/useBattlePass';
import { cn } from '@/lib/utils';
import { Lock, Check, Gift, Crown, Star, Sparkles, Zap } from 'lucide-react';

interface BattlePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward?: (type: 'xp' | 'coins', amount: number) => void;
}

export const BattlePassModal = ({ isOpen, onClose, onClaimReward }: BattlePassModalProps) => {
  const { state, currentSeason, claimTierReward, getProgress, isTierClaimed, upgradeToPremium } = useBattlePass();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [claimingTier, setClaimingTier] = useState<number | null>(null);
  const progress = getProgress();

  if (!currentSeason) {
    return null;
  }

  const handleClaimReward = async (tier: number, isPremium: boolean) => {
    setClaimingTier(tier);

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 200));

    const reward = claimTierReward(tier, isPremium);
    if (reward && onClaimReward) {
      if (reward.type === 'xp' && reward.amount) {
        onClaimReward('xp', reward.amount);
      } else if (reward.type === 'coins' && reward.amount) {
        onClaimReward('coins', reward.amount);
      }
    }

    setClaimingTier(null);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-amber-400 via-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 via-fuchsia-500 to-pink-500';
      case 'rare': return 'from-blue-400 via-cyan-500 to-teal-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-amber-400 shadow-amber-500/30';
      case 'epic': return 'border-purple-400 shadow-purple-500/30';
      case 'rare': return 'border-blue-400 shadow-blue-500/30';
      default: return 'border-slate-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden border-2">
        {/* Header with gradient */}
        <div className={cn("p-5 bg-gradient-to-r relative overflow-hidden", currentSeason.backgroundGradient)}>
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 opacity-20">
            <Sparkles className="w-16 h-16 text-white" />
          </div>

          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              {currentSeason.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm mt-2">{currentSeason.description}</p>

          {/* Progress section */}
          <div className="mt-4 p-3 rounded-xl bg-black/20 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-300" />
                <span className="text-white font-bold">Tier {progress.currentTier}</span>
                <span className="text-white/60 text-sm">/ 30</span>
              </div>
              <span className="text-white/80 text-sm">{progress.daysRemaining} days left</span>
            </div>
            <Progress value={progress.progressPercent} className="h-3 bg-white/20" />
            <div className="flex justify-between text-white/70 text-xs mt-2">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {progress.currentXP} XP
              </span>
              <span>{progress.xpToNextTier} XP to next tier</span>
            </div>
          </div>

          {/* Premium status */}
          {!state.isPremium ? (
            <Button
              className="w-full mt-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black font-bold hover:from-amber-500 hover:to-orange-600 shadow-lg"
              size="default"
              onClick={() => upgradeToPremium()}
            >
              <Crown className="w-5 h-5 mr-2" />
              Unlock Premium Rewards
            </Button>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-2 p-2 rounded-lg bg-amber-500/20 border border-amber-400/50">
              <Crown className="w-4 h-4 text-amber-300" />
              <span className="text-amber-200 font-medium text-sm">Premium Active</span>
            </div>
          )}
        </div>

        {/* Tiers list */}
        <ScrollArea className="h-[350px]">
          <div className="p-4 space-y-3">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-2 text-xs text-muted-foreground font-medium">
              <div className="w-12">Tier</div>
              <div className="flex-1 text-center">Free Reward</div>
              <div className="flex-1 text-center">
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              </div>
            </div>

            {currentSeason.tiers.map((tier) => {
              const isUnlocked = tier.tier <= progress.currentTier;
              const isCurrent = tier.tier === progress.currentTier + 1;
              const freeRewardClaimed = isTierClaimed(tier.tier, false);
              const premiumRewardClaimed = isTierClaimed(tier.tier, true);
              const canClaimFree = isUnlocked && !freeRewardClaimed;
              const canClaimPremium = state.isPremium && isUnlocked && !premiumRewardClaimed;

              return (
                <div
                  key={tier.tier}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                    isUnlocked
                      ? "bg-card border-border"
                      : isCurrent
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-transparent opacity-50",
                    selectedTier === tier.tier && "ring-2 ring-primary",
                    (canClaimFree || canClaimPremium) && "ring-2 ring-amber-400 tier-unlock-animate"
                  )}
                  onClick={() => setSelectedTier(tier.tier)}
                >
                  {/* Tier number */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                    isUnlocked
                      ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-md shadow-emerald-500/30"
                      : isCurrent
                        ? "bg-gradient-to-br from-primary/80 to-primary text-white shadow-md"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {isUnlocked ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span className="text-lg">{tier.tier}</span>
                    )}
                  </div>

                  {/* Free reward */}
                  <div className="flex-1">
                    <div className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all",
                      canClaimFree
                        ? `bg-gradient-to-r ${getRarityColor(tier.freeReward.rarity)} text-white border-transparent shadow-lg`
                        : freeRewardClaimed
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : `bg-muted/50 border-muted ${getRarityBorder(tier.freeReward.rarity)}`
                    )}>
                      <span className="text-xl">{tier.freeReward.icon}</span>
                      <span className="text-xs font-medium truncate flex-1">{tier.freeReward.itemName}</span>
                      {canClaimFree && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className={cn(
                            "h-7 px-2 bg-white/90 text-black hover:bg-white",
                            claimingTier === tier.tier && "animate-pulse"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimReward(tier.tier, false);
                          }}
                          disabled={claimingTier !== null}
                        >
                          <Gift className="w-4 h-4" />
                        </Button>
                      )}
                      {freeRewardClaimed && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Premium reward */}
                  {tier.premiumReward && (
                    <div className="flex-1">
                      <div className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border-2 relative transition-all",
                        canClaimPremium
                          ? `bg-gradient-to-r ${getRarityColor(tier.premiumReward.rarity)} text-white border-transparent shadow-lg`
                          : premiumRewardClaimed
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : `bg-muted/50 border-muted ${getRarityBorder(tier.premiumReward.rarity)}`
                      )}>
                        {!state.isPremium && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center gap-1">
                            <Lock className="w-4 h-4 text-amber-400" />
                          </div>
                        )}
                        <span className="text-xl">{tier.premiumReward.icon}</span>
                        <span className="text-xs font-medium truncate flex-1">{tier.premiumReward.itemName}</span>
                        {canClaimPremium && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className={cn(
                              "h-7 px-2 bg-white/90 text-black hover:bg-white",
                              claimingTier === tier.tier && "animate-pulse"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimReward(tier.tier, true);
                            }}
                            disabled={claimingTier !== null}
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                        )}
                        {premiumRewardClaimed && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer info */}
        <div className="p-3 border-t bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Complete focus sessions to earn XP and unlock rewards!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
