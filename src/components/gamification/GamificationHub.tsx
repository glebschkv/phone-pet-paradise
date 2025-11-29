import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Hooks
import { useBattlePass } from '@/hooks/useBattlePass';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { useLuckyWheel } from '@/hooks/useLuckyWheel';
import { useComboSystem } from '@/hooks/useComboSystem';
import { useSpecialEvents } from '@/hooks/useSpecialEvents';

// Components
import { BattlePassModal } from './BattlePassModal';
import { BossChallengeModal } from './BossChallengeModal';
import { LuckyWheelModal } from './LuckyWheelModal';
import { ComboDisplay } from './ComboDisplay';
import { EventIndicator } from './SpecialEventBanner';

// Icons
import {
  Crown,
  Swords,
  Sparkles,
  Flame,
  Gift,
  ChevronRight,
  Trophy,
  Target,
  Star,
  Zap,
} from 'lucide-react';

interface GamificationHubProps {
  onXPReward?: (amount: number) => void;
  onCoinReward?: (amount: number) => void;
}

export const GamificationHub = ({ onXPReward, onCoinReward }: GamificationHubProps) => {
  // Modal states
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showBossChallenge, setShowBossChallenge] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  // Hooks
  const { getProgress, currentSeason, getUnclaimedRewards } = useBattlePass();
  const { getActiveChallenge, allChallenges } = useBossChallenges();
  const { canSpinToday, getStats } = useLuckyWheel();
  const { state: comboState, currentTier } = useComboSystem();
  const { activeEvents, isDoubleXPActive, isDoubleCoinsActive } = useSpecialEvents();

  const battlePassProgress = getProgress();
  const activeChallenge = getActiveChallenge();
  const wheelStats = getStats();
  const unclaimedBattlePassRewards = getUnclaimedRewards();

  const handleRewardClaim = (type: 'xp' | 'coins', amount: number) => {
    if (type === 'xp' && onXPReward) {
      onXPReward(amount);
    } else if (type === 'coins' && onCoinReward) {
      onCoinReward(amount);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header with retro pixel style */}
      <div className="p-4 border-b-2 border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Challenges</h1>
              <p className="text-xs text-muted-foreground">Earn rewards & level up!</p>
            </div>
          </div>
          <EventIndicator />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Active Events Banner */}
          {activeEvents.length > 0 && (
            <Card className={cn(
              "overflow-hidden border-2 retro-card",
              "bg-gradient-to-r",
              activeEvents[0].backgroundGradient
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl animate-bounce">{activeEvents[0].emoji}</div>
                  <div className="flex-1 text-white">
                    <h3 className="font-bold text-lg">{activeEvents[0].name}</h3>
                    <p className="text-sm text-white/80">{activeEvents[0].description}</p>
                  </div>
                  {(isDoubleXPActive() || isDoubleCoinsActive()) && (
                    <div className="flex flex-col gap-1">
                      {isDoubleXPActive() && (
                        <span className="bg-white/25 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                          <Zap className="w-3 h-3" /> 2x XP
                        </span>
                      )}
                      {isDoubleCoinsActive() && (
                        <span className="bg-white/25 px-3 py-1 rounded-full text-xs font-bold text-white">2x Coins</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Combo Display */}
          {comboState.currentCombo > 0 && (
            <ComboDisplay variant="compact" />
          )}

          {/* Daily Spin - Lucky Wheel (Featured) */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] overflow-hidden border-2",
              canSpinToday()
                ? "ring-2 ring-purple-400 ring-offset-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50"
                : "bg-card"
            )}
            onClick={() => setShowLuckyWheel(true)}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center relative",
                  "bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500",
                  "shadow-lg shadow-purple-500/30"
                )}>
                  <Sparkles className="w-8 h-8 text-white" />
                  {canSpinToday() && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">Daily Spin</h3>
                    {canSpinToday() && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        READY!
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {canSpinToday() ? 'Spin for free rewards!' : `${wheelStats.totalSpins} spins completed`}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              {canSpinToday() && (
                <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-pulse" />
              )}
            </CardContent>
          </Card>

          {/* Season Pass */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] overflow-hidden border-2",
              unclaimedBattlePassRewards.length > 0 && "ring-2 ring-amber-400"
            )}
            onClick={() => setShowBattlePass(true)}
          >
            <div className={cn(
              "h-1.5 bg-gradient-to-r",
              currentSeason?.backgroundGradient || "from-blue-500 to-purple-500"
            )} />
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{currentSeason?.name || 'Season Pass'}</h3>
                    {unclaimedBattlePassRewards.length > 0 && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {unclaimedBattlePassRewards.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <Star className="w-3 h-3 text-amber-500" />
                    <span>Tier {battlePassProgress.currentTier}/30</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{battlePassProgress.daysRemaining}d left</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                      style={{ width: `${(battlePassProgress.currentTier / 30) * 100}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Boss Challenges */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] border-2",
              activeChallenge.challenge && "ring-2 ring-red-400 boss-challenge-active"
            )}
            onClick={() => setShowBossChallenge(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Swords className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">Boss Challenges</h3>
                    {activeChallenge.challenge && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activeChallenge.challenge
                      ? activeChallenge.challenge.name
                      : `${allChallenges.length} challenges available`}
                  </p>
                  {activeChallenge.challenge && (
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                        style={{ width: `${activeChallenge.percentComplete}%` }}
                      />
                    </div>
                  )}
                </div>
                {activeChallenge.challenge ? (
                  <div className="text-lg font-bold text-orange-500">
                    {Math.round(activeChallenge.percentComplete)}%
                  </div>
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-2 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold" style={{ color: currentTier.color }}>
                  {comboState.currentCombo}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Combo Streak</div>
                <div className="text-xs mt-1 font-bold" style={{ color: currentTier.color }}>
                  {currentTier.multiplier}x bonus
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {comboState.highestCombo}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Best Combo</div>
                <div className="text-xs mt-1 text-muted-foreground">Personal record</div>
              </CardContent>
            </Card>
          </div>

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-bold mb-3 flex items-center gap-2 text-primary">
                <Zap className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Complete focus sessions to build combo streaks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Higher combos = bigger XP & coin rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Don't forget to spin the wheel daily!</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Modals */}
      <BattlePassModal
        isOpen={showBattlePass}
        onClose={() => setShowBattlePass(false)}
        onClaimReward={handleRewardClaim}
      />
      <BossChallengeModal
        isOpen={showBossChallenge}
        onClose={() => setShowBossChallenge(false)}
      />
      <LuckyWheelModal
        isOpen={showLuckyWheel}
        onClose={() => setShowLuckyWheel(false)}
        onPrizeWon={(prize) => {
          if (prize.type === 'xp' && prize.amount && onXPReward) {
            onXPReward(prize.amount);
          }
          if (prize.type === 'coins' && prize.amount && onCoinReward) {
            onCoinReward(prize.amount);
          }
        }}
      />
    </div>
  );
};

export default GamificationHub;
