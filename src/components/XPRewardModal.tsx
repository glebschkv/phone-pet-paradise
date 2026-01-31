import { useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { XPReward } from "@/hooks/useXPSystem";
import { Star, Gift, Zap, Trophy, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const lastRewardRef = useRef<XPReward | null>(null);
  if (reward) lastRewardRef.current = reward;
  const displayReward = reward || lastRewardRef.current;

  if (!displayReward) return null;

  return (
    <Dialog open={isOpen && !!reward} onOpenChange={onClose}>
      <DialogContent className="retro-modal max-w-[320px] p-0 overflow-hidden border-0 max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Session Complete</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="retro-modal-header p-5 text-center relative">
          <div className="retro-scanlines opacity-20" />

          <div className="relative z-[1]">
            <div
              className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: 'linear-gradient(180deg, hsl(45 90% 55%), hsl(35 85% 45%))',
                border: '3px solid hsl(30 70% 40%)',
                boxShadow: '0 3px 0 hsl(30 70% 30%), 0 0 15px hsl(45 100% 50% / 0.4)',
              }}
            >
              <Zap className="w-7 h-7 text-amber-900" style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.3))' }} />
            </div>

            <h2
              className="text-xl font-black uppercase tracking-tight text-white"
              style={{ textShadow: '0 0 10px hsl(260 80% 70% / 0.5), 0 2px 0 rgba(0,0,0,0.3)' }}
            >
              Session Complete!
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* XP Gained */}
          <div className={cn("retro-reward-item legendary", "flex-col !items-center !gap-1 py-3")}>
            {displayReward.hasBonusXP && (
              <div
                className="inline-flex items-center gap-1 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider mb-1 animate-pulse border"
                style={{
                  background: displayReward.bonusType === 'jackpot'
                    ? 'linear-gradient(180deg, hsl(45 90% 55%), hsl(40 85% 45%))'
                    : displayReward.bonusType === 'super_lucky'
                    ? 'linear-gradient(180deg, hsl(280 70% 55%), hsl(280 75% 45%))'
                    : 'linear-gradient(180deg, hsl(140 65% 45%), hsl(140 70% 35%))',
                  borderColor: displayReward.bonusType === 'jackpot'
                    ? 'hsl(35 80% 40%)'
                    : displayReward.bonusType === 'super_lucky'
                    ? 'hsl(280 60% 55%)'
                    : 'hsl(140 55% 35%)',
                  color: 'white',
                  textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                }}
              >
                <Flame className="w-3 h-3" />
                {displayReward.bonusType === 'jackpot' && 'JACKPOT! 2x XP'}
                {displayReward.bonusType === 'super_lucky' && 'SUPER LUCKY! 1.5x XP'}
                {displayReward.bonusType === 'lucky' && 'LUCKY! +25% XP'}
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px hsl(45 100% 50% / 0.6))' }} />
              <span className="text-2xl font-black tabular-nums text-amber-300" style={{ textShadow: '0 0 8px hsl(45 100% 50% / 0.4)' }}>
                +{displayReward.xpGained}
              </span>
              <span className="text-sm font-bold text-amber-400/70">XP</span>
            </div>
            {displayReward.hasBonusXP && displayReward.bonusXP > 0 && (
              <p className="text-[10px] text-green-400 font-bold">
                (+{displayReward.bonusXP} bonus XP!)
              </p>
            )}
            <p className="text-[10px] text-amber-400/50">
              Great focus session!
            </p>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="retro-level-badge px-2 py-0.5 text-xs">
                <span className="font-bold">LV.{newLevel}</span>
              </div>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: 'hsl(260 20% 65%)' }}
              >
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
            <div
              className="relative overflow-hidden rounded-lg p-4 text-center animate-pulse"
              style={{
                background: 'linear-gradient(180deg, hsl(45 100% 60%) 0%, hsl(40 90% 50%) 100%)',
                border: '3px solid hsl(35 80% 40%)',
                boxShadow: '0 4px 0 hsl(35 70% 30%), inset 0 1px 0 hsl(50 100% 80% / 0.5), 0 0 20px hsl(45 100% 50% / 0.4)',
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="w-6 h-6 text-amber-900" />
                <span
                  className="text-lg font-black uppercase tracking-wide text-amber-900"
                  style={{ textShadow: '0 1px 0 hsl(45 100% 70% / 0.5)' }}
                >
                  Level Up!
                </span>
                <Sparkles className="w-5 h-5 text-amber-700 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <p className="text-sm text-amber-800 font-bold">
                You reached Level {displayReward.newLevel}!
              </p>
            </div>
          )}

          {/* Unlocked Rewards */}
          {displayReward.unlockedRewards.length > 0 && (
            <div className="space-y-2">
              <div
                className="text-[9px] font-black uppercase tracking-[0.2em] text-center"
                style={{ color: 'hsl(260 25% 45%)' }}
              >
                <Gift className="w-3 h-3 inline mr-1" />
                New Unlocks
              </div>

              <div className="space-y-1.5">
                {displayReward.unlockedRewards.map((unlock, index) => (
                  <div
                    key={index}
                    className={cn(
                      "retro-reward-item",
                      unlock.type === 'biome' ? '' : 'epic'
                    )}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: unlock.type === 'biome'
                          ? 'linear-gradient(180deg, hsl(260 30% 22%), hsl(260 35% 16%))'
                          : 'linear-gradient(180deg, hsl(320 35% 25%), hsl(320 30% 18%))',
                        border: unlock.type === 'biome'
                          ? '2px solid hsl(260 35% 30%)'
                          : '2px solid hsl(320 40% 35%)',
                      }}
                    >
                      {unlock.type === 'biome' ? (
                        <span className="text-sm">🌍</span>
                      ) : (
                        <span className="text-sm">🐾</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-purple-100/90">{unlock.name}</span>
                        <span
                          className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded"
                          style={{
                            background: unlock.type === 'biome'
                              ? 'hsl(260 40% 30%)'
                              : 'hsl(320 40% 30%)',
                            color: unlock.type === 'biome'
                              ? 'hsl(260 60% 75%)'
                              : 'hsl(320 60% 75%)',
                          }}
                        >
                          {unlock.type === 'biome' ? 'World' : 'Pet'}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-300/50">
                        {unlock.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={onClose}
            className="retro-arcade-btn retro-arcade-btn-purple w-full py-3 text-sm tracking-wider touch-manipulation"
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
