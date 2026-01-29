import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { XPReward } from "@/hooks/useXPSystem";
import { Star, Gift, Zap, Trophy, Flame } from "lucide-react";

interface XPRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: XPReward | null;
  newLevel: number;
  levelProgress: number;
}

export const XPRewardModal = ({
  isOpen,
  onClose,
  reward,
  newLevel,
  levelProgress
}: XPRewardModalProps) => {
  // Cache last valid reward so content persists during Dialog close animation
  // (prevents abrupt unmount that can leave stale overlay in DOM)
  const lastRewardRef = useRef<XPReward | null>(null);
  if (reward) lastRewardRef.current = reward;
  const displayReward = reward || lastRewardRef.current;

  if (!displayReward) return null;

  return (
    <Dialog open={isOpen && !!reward} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto retro-card border-2 border-border max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/20 to-transparent p-6 text-center">
          <div className="mx-auto w-14 h-14 retro-level-badge rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-7 h-7" />
          </div>

          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Session Complete!
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* XP Gained - Big emphasis */}
          <div className="retro-stat-pill p-4 text-center">
            {/* Bonus XP Badge */}
            {displayReward.hasBonusXP && (
              <div
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-2 text-xs font-bold animate-pulse"
                style={{
                  background: displayReward.bonusType === 'jackpot'
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)'
                    : displayReward.bonusType === 'super_lucky'
                    ? 'linear-gradient(90deg, #a855f7, #8b5cf6, #a855f7)'
                    : 'linear-gradient(90deg, #22c55e, #16a34a, #22c55e)',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                <Flame className="w-3 h-3" />
                {displayReward.bonusType === 'jackpot' && 'JACKPOT! 2x XP'}
                {displayReward.bonusType === 'super_lucky' && 'SUPER LUCKY! 1.5x XP'}
                {displayReward.bonusType === 'lucky' && 'LUCKY! +25% XP'}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold tabular-nums">
                +{displayReward.xpGained}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">XP</span>
            </div>
            {displayReward.hasBonusXP && displayReward.bonusXP > 0 && (
              <p className="text-xs text-green-500 font-semibold">
                (+{displayReward.bonusXP} bonus XP!)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Great focus session!
            </p>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="retro-level-badge px-2 py-0.5 text-xs">
                  <span className="font-bold">LV.{newLevel}</span>
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(levelProgress)}%
              </span>
            </div>
            <div className="retro-xp-bar">
              <div
                className="retro-xp-fill"
                style={{ width: `${Math.max(2, levelProgress)}%` }}
              >
                <div className="shine" />
              </div>
            </div>
          </div>

          {/* Level Up Celebration */}
          {displayReward.leveledUp && (
            <div className="relative overflow-hidden rounded-lg p-4 text-center"
              style={{
                background: 'linear-gradient(180deg, hsl(45 100% 60%) 0%, hsl(40 90% 50%) 100%)',
                border: '2px solid hsl(35 80% 40%)',
                boxShadow: '0 3px 0 hsl(35 70% 30%), inset 0 1px 0 hsl(50 100% 80% / 0.5)'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="w-6 h-6 text-amber-900" />
                <span className="text-lg font-bold text-amber-900">
                  LEVEL UP!
                </span>
              </div>
              <p className="text-sm text-amber-800 font-medium">
                You reached Level {displayReward.newLevel}!
              </p>
            </div>
          )}

          {/* Unlocked Rewards */}
          {displayReward.unlockedRewards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">New Unlocks</span>
              </div>

              <div className="space-y-2">
                {displayReward.unlockedRewards.map((unlock, index) => (
                  <div
                    key={index}
                    className="retro-stat-pill p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{unlock.name}</span>
                      <Badge
                        className={`text-[10px] px-2 py-0.5 ${
                          unlock.type === 'biome'
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-pink-500/20 text-pink-600 border-pink-500/30'
                        }`}
                        variant="outline"
                      >
                        {unlock.type === 'biome' ? 'World' : 'Pet'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {unlock.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 font-bold text-sm rounded-lg transition-all active:scale-95 touch-manipulation"
            style={{
              background: 'linear-gradient(180deg, hsl(260 60% 60%) 0%, hsl(260 60% 50%) 100%)',
              border: '2px solid hsl(260 50% 40%)',
              boxShadow: '0 3px 0 hsl(260 50% 35%), inset 0 1px 0 hsl(260 70% 75% / 0.4)',
              color: 'white',
              textShadow: '0 1px 0 hsl(260 50% 30% / 0.3)'
            }}
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
