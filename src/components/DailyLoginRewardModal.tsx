import { useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DailyReward } from "@/hooks/useDailyLoginRewards";
import { Gift, Flame, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelIcon } from "@/components/ui/PixelIcon";

// Map reward emojis to PixelIcon names
const EMOJI_TO_ICON: Record<string, string> = {
  '🌟': 'star',
  '✨': 'sparkles',
  '🎁': 'gift',
  '🧊': 'ice-cube',
  '💪': 'muscle',
  '🔥': 'fire',
  '🎰': 'slot-machine',
};

interface DailyLoginRewardModalProps {
  isOpen: boolean;
  onClaim: () => void;
  onDismiss: () => void;
  reward: DailyReward | null;
  currentStreak: number;
  allRewards: DailyReward[];
}

export const DailyLoginRewardModal = ({
  isOpen,
  onClaim,
  onDismiss,
  reward,
  currentStreak,
  allRewards,
}: DailyLoginRewardModalProps) => {
  const lastRewardRef = useRef<DailyReward | null>(null);
  if (reward) lastRewardRef.current = reward;
  const displayReward = reward || lastRewardRef.current;

  if (!displayReward) return null;

  const currentDayInCycle = (currentStreak % 7) + 1;

  const getRewardValue = (r: DailyReward) => {
    if (r.type === 'streak_freeze') {
      return `+${r.streakFreeze} Freeze`;
    }
    return `+${r.xp} XP`;
  };

  const iconName = EMOJI_TO_ICON[displayReward.icon] || 'star';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onDismiss(); }}>
      <DialogContent className="retro-modal max-w-[320px] p-0 overflow-hidden border-0 max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Daily Login Reward</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="retro-modal-header p-5 text-center relative">
          <div className="retro-scanlines opacity-15" />

          <div className="relative z-[1]">
            {/* Hero icon */}
            <div className="relative inline-block mb-3">
              <div
                className="absolute inset-0 rounded-full blur-xl scale-[2.5]"
                style={{ background: 'hsl(45 100% 50% / 0.2)' }}
              />
              <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
                <PixelIcon name={iconName} size={64} />
              </div>
            </div>

            {/* Title */}
            <h2
              className="text-xl font-black uppercase tracking-tight text-white"
              style={{ textShadow: '0 0 10px hsl(260 80% 70% / 0.5), 0 2px 0 rgba(0,0,0,0.3)' }}
            >
              Daily Login Reward!
            </h2>

            {/* Streak badge */}
            {currentStreak > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-black text-white"
                  style={{
                    background: 'linear-gradient(180deg, hsl(25 80% 50%), hsl(20 85% 40%))',
                    border: '2px solid hsl(25 70% 55%)',
                    boxShadow: '0 2px 0 hsl(20 70% 30%), 0 0 8px hsl(25 100% 50% / 0.3)',
                    textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                  }}
                >
                  <Flame className="w-3 h-3" />
                  {currentStreak} day streak!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Today's Reward — gold highlight card */}
          <div
            className="p-4 rounded-xl text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, hsl(45 100% 60%) 0%, hsl(40 90% 50%) 100%)',
              border: '3px solid hsl(35 80% 40%)',
              boxShadow: '0 4px 0 hsl(35 70% 30%), inset 0 1px 0 hsl(50 100% 80% / 0.5), 0 0 15px hsl(45 100% 50% / 0.3)',
            }}
          >
            <div className="relative z-10">
              <span
                className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-2 text-white"
                style={{
                  background: 'hsl(35 70% 35%)',
                  border: '1px solid hsl(30 60% 45%)',
                }}
              >
                Day {currentDayInCycle}
              </span>
              <p
                className="text-lg font-black text-amber-900 mb-1"
                style={{ textShadow: '0 1px 0 hsl(45 100% 70% / 0.5)' }}
              >
                {displayReward.label}
              </p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <PixelIcon name={iconName} size={28} />
                <span
                  className="text-3xl font-black text-amber-900"
                  style={{ textShadow: '0 1px 0 hsl(45 100% 70% / 0.4)' }}
                >
                  {getRewardValue(displayReward)}
                </span>
              </div>
              {displayReward.coins > 0 && (
                <div className="flex items-center justify-center gap-1 mb-1">
                  <PixelIcon name="coin" size={16} />
                  <span className="text-sm font-bold text-amber-800">+{displayReward.coins} Coins</span>
                </div>
              )}
              <p className="text-[11px] text-amber-800 font-semibold">
                {displayReward.description}
              </p>
            </div>
          </div>

          {/* Weekly Calendar */}
          <div className="space-y-2">
            <div
              className="text-[9px] font-black uppercase tracking-[0.2em] text-center"
              style={{ color: 'hsl(260 25% 45%)' }}
            >
              This Week's Rewards
            </div>
            <div className="grid grid-cols-7 gap-1">
              {allRewards.map((r, index) => {
                const dayNum = index + 1;
                const isClaimed = dayNum < currentDayInCycle;
                const isToday = dayNum === currentDayInCycle;
                const isFuture = dayNum > currentDayInCycle;
                const dayIconName = EMOJI_TO_ICON[r.icon] || 'star';

                return (
                  <div
                    key={r.day}
                    className={cn(
                      "relative flex flex-col items-center py-1.5 px-0.5 rounded-lg text-center transition-all",
                      isFuture && "opacity-40"
                    )}
                    style={{
                      background: isClaimed
                        ? 'linear-gradient(180deg, hsl(120 35% 22%) 0%, hsl(120 40% 16%) 100%)'
                        : isToday
                        ? 'linear-gradient(180deg, hsl(45 50% 28%) 0%, hsl(40 45% 20%) 100%)'
                        : 'linear-gradient(180deg, hsl(260 25% 22%) 0%, hsl(260 30% 16%) 100%)',
                      border: isToday
                        ? '2px solid hsl(45 100% 55%)'
                        : isClaimed
                        ? '2px solid hsl(120 50% 35%)'
                        : '2px solid hsl(260 35% 30%)',
                      boxShadow: isToday
                        ? '0 0 8px hsl(45 100% 50% / 0.4)'
                        : isClaimed
                        ? '0 0 4px hsl(120 80% 40% / 0.2)'
                        : 'none',
                    }}
                  >
                    <span
                      className="text-[8px] font-black uppercase"
                      style={{
                        color: isToday
                          ? 'hsl(45 90% 65%)'
                          : isClaimed
                          ? 'hsl(120 50% 60%)'
                          : 'hsl(260 20% 55%)',
                      }}
                    >
                      D{dayNum}
                    </span>
                    <div className="my-0.5">
                      {isClaimed ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <PixelIcon name={dayIconName} size={16} />
                      )}
                    </div>
                    <span
                      className="text-[8px] font-bold"
                      style={{
                        color: isToday
                          ? 'hsl(45 80% 60%)'
                          : isClaimed
                          ? 'hsl(120 40% 55%)'
                          : 'hsl(260 20% 50%)',
                      }}
                    >
                      {r.type === 'streak_freeze' ? 'Freeze' : r.xp}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Bonus Info */}
          {currentStreak >= 3 && (
            <div
              className="retro-reward-item"
              style={{
                borderColor: 'hsl(25 80% 50%)',
                background: 'linear-gradient(180deg, hsl(25 35% 22%) 0%, hsl(20 30% 16%) 100%)',
                boxShadow: '0 0 8px hsl(25 100% 50% / 0.2)',
              }}
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(180deg, hsl(25 60% 30%), hsl(20 55% 22%))',
                  border: '2px solid hsl(25 50% 40%)',
                }}
              >
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold" style={{ color: 'hsl(25 90% 65%)' }}>
                  Streak Bonus Active!
                </span>
                <p className="text-[10px] text-purple-300/60">
                  +{currentStreak >= 30 ? 50 : currentStreak >= 14 ? 30 : currentStreak >= 7 ? 20 : 10}% XP on focus sessions
                </p>
              </div>
            </div>
          )}

          {/* Claim Button */}
          <button
            onClick={onClaim}
            className="retro-arcade-btn retro-arcade-btn-green w-full py-3.5 text-sm tracking-wider touch-manipulation flex items-center justify-center gap-2"
          >
            <Gift className="w-5 h-5" />
            Claim Reward!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
