import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBattlePass } from '@/hooks/useBattlePass';
import { cn } from '@/lib/utils';
import { Lock, Check, Gift, Crown, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className={cn("p-4 bg-gradient-to-r", currentSeason.backgroundGradient)}>
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Crown className="w-6 h-6" />
              {currentSeason.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm mt-1">{currentSeason.description}</p>

          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-white text-sm">
              <span>Tier {progress.currentTier}</span>
              <span>{progress.daysRemaining} days left</span>
            </div>
            <Progress value={progress.progressPercent} className="h-3 bg-white/20" />
            <div className="flex justify-between text-white/70 text-xs">
              <span>{progress.currentXP} XP</span>
              <span>{progress.xpToNextTier} XP to next tier</span>
            </div>
          </div>

          {/* Premium status */}
          {!state.isPremium && (
            <Button
              className="w-full mt-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold"
              size="sm"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          )}
        </div>

        {/* Tiers grid */}
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-2">
            {currentSeason.tiers.map((tier) => {
              const isUnlocked = tier.tier <= progress.currentTier;
              const freeRewardClaimed = isTierClaimed(tier.tier, false);
              const premiumRewardClaimed = isTierClaimed(tier.tier, true);

              return (
                <div
                  key={tier.tier}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    isUnlocked ? "bg-card" : "bg-muted/50 opacity-60",
                    selectedTier === tier.tier && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedTier(tier.tier)}
                >
                  {/* Tier number */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                    isUnlocked
                      ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isUnlocked ? <Check className="w-5 h-5" /> : tier.tier}
                  </div>

                  {/* Free reward */}
                  <div className="flex-1">
                    <div className={cn(
                      "flex items-center gap-2 p-2 rounded-lg",
                      isUnlocked && !freeRewardClaimed
                        ? `bg-gradient-to-r ${getRarityColor(tier.freeReward.rarity)} text-white`
                        : "bg-muted"
                    )}>
                      <span className="text-lg">{tier.freeReward.icon}</span>
                      <span className="text-sm font-medium truncate">{tier.freeReward.itemName}</span>
                      {isUnlocked && !freeRewardClaimed && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-auto h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimReward(tier.tier, false);
                          }}
                        >
                          <Gift className="w-4 h-4" />
                        </Button>
                      )}
                      {freeRewardClaimed && (
                        <Check className="w-4 h-4 ml-auto text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Premium reward */}
                  {tier.premiumReward && (
                    <div className="flex-1">
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded-lg relative",
                        state.isPremium && isUnlocked && !premiumRewardClaimed
                          ? `bg-gradient-to-r ${getRarityColor(tier.premiumReward.rarity)} text-white`
                          : "bg-muted"
                      )}>
                        {!state.isPremium && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <Lock className="w-4 h-4 text-yellow-400" />
                          </div>
                        )}
                        <span className="text-lg">{tier.premiumReward.icon}</span>
                        <span className="text-sm font-medium truncate">{tier.premiumReward.itemName}</span>
                        {state.isPremium && isUnlocked && !premiumRewardClaimed && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="ml-auto h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimReward(tier.tier, true);
                            }}
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                        )}
                        {premiumRewardClaimed && (
                          <Check className="w-4 h-4 ml-auto text-green-500" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="flex justify-between p-3 border-t">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button variant="ghost" size="sm">
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
