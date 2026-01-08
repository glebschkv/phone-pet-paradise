import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DailyReward } from "@/hooks/useDailyLoginRewards";
import { Gift, Star, Snowflake, Sparkles, Calendar } from "lucide-react";

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
  if (!reward) return null;

  const currentDayInCycle = (currentStreak % 7) + 1;

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'xp':
        return <Star className="w-6 h-6 text-yellow-500" />;
      case 'streak_freeze':
        return <Snowflake className="w-6 h-6 text-cyan-400" />;
      case 'mystery_bonus':
        return <Sparkles className="w-6 h-6 text-purple-400" />;
      default:
        return <Gift className="w-6 h-6 text-pink-400" />;
    }
  };

  const getRewardValue = (r: DailyReward) => {
    if (r.type === 'streak_freeze') {
      return `+${r.streakFreeze} Freeze`;
    }
    return `+${r.xp} XP`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="max-w-sm mx-auto retro-card border-2 border-border max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div
          className="p-6 text-center"
          style={{
            background: 'linear-gradient(180deg, hsl(280 70% 50% / 0.3) 0%, transparent 100%)',
          }}
        >
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-4xl animate-bounce">
            {reward.icon}
          </div>

          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Daily Login Reward!
            </DialogTitle>
          </DialogHeader>

          {currentStreak > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {currentStreak} day streak!
              </span>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* Today's Reward - Big emphasis */}
          <div
            className="p-5 rounded-xl text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, hsl(45 100% 60%) 0%, hsl(40 90% 50%) 100%)',
              border: '2px solid hsl(35 80% 40%)',
              boxShadow: '0 3px 0 hsl(35 70% 30%), inset 0 1px 0 hsl(50 100% 80% / 0.5)'
            }}
          >
            <div className="relative z-10">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
                Day {currentDayInCycle}
              </p>
              <p className="text-lg font-bold text-amber-900 mb-2">
                {reward.label}
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                {getRewardIcon(reward.type)}
                <span className="text-3xl font-bold text-amber-900">
                  {getRewardValue(reward)}
                </span>
              </div>
              <p className="text-sm text-amber-800">
                {reward.description}
              </p>
            </div>
          </div>

          {/* Weekly Calendar Preview */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              This Week's Rewards
            </p>
            <div className="grid grid-cols-7 gap-1">
              {allRewards.map((r, index) => {
                const dayNum = index + 1;
                const isClaimed = dayNum < currentDayInCycle;
                const isToday = dayNum === currentDayInCycle;
                const isFuture = dayNum > currentDayInCycle;

                return (
                  <div
                    key={r.day}
                    className={`
                      relative flex flex-col items-center p-2 rounded-lg text-center transition-all
                      ${isToday ? 'ring-2 ring-primary ring-offset-1 bg-primary/10' : ''}
                      ${isClaimed ? 'bg-green-500/20' : ''}
                      ${isFuture ? 'bg-muted/50 opacity-60' : ''}
                    `}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground">
                      D{dayNum}
                    </span>
                    <span className="text-lg">
                      {isClaimed ? '✓' : r.icon}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {r.type === 'streak_freeze' ? '🧊' : `${r.xp}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Bonus Info */}
          {currentStreak >= 3 && (
            <div className="retro-stat-pill p-3 text-center">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-bold">Streak Bonus Active!</span>
                {' '}+{currentStreak >= 30 ? 50 : currentStreak >= 14 ? 30 : currentStreak >= 7 ? 20 : 10}% XP on focus sessions
              </p>
            </div>
          )}

          {/* Claim Button */}
          <button
            onClick={onClaim}
            className="w-full py-4 px-6 font-bold text-base rounded-lg transition-all active:scale-95 touch-manipulation"
            style={{
              background: 'linear-gradient(180deg, hsl(140 60% 45%) 0%, hsl(140 60% 35%) 100%)',
              border: '2px solid hsl(140 50% 25%)',
              boxShadow: '0 4px 0 hsl(140 50% 20%), inset 0 1px 0 hsl(140 70% 60% / 0.4)',
              color: 'white',
              textShadow: '0 1px 0 hsl(140 50% 20% / 0.3)'
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-5 h-5" />
              <span>Claim Reward!</span>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
