import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Hooks
import { useBattlePass } from '@/hooks/useBattlePass';
import { useGuildSystem } from '@/hooks/useGuildSystem';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { useLuckyWheel } from '@/hooks/useLuckyWheel';
import { useComboSystem } from '@/hooks/useComboSystem';
import { useSpecialEvents } from '@/hooks/useSpecialEvents';

// Components
import { BattlePassModal } from './BattlePassModal';
import { GuildPanel } from './GuildPanel';
import { BossChallengeModal } from './BossChallengeModal';
import { LuckyWheelModal } from './LuckyWheelModal';
import { ComboDisplay } from './ComboDisplay';
import { SpecialEventBanner, EventIndicator } from './SpecialEventBanner';

// Icons
import {
  Crown,
  Users,
  Swords,
  Sparkles,
  Flame,
  Calendar,
  Gift,
  ChevronRight,
  Trophy,
  Target,
} from 'lucide-react';

interface GamificationHubProps {
  onXPReward?: (amount: number) => void;
  onCoinReward?: (amount: number) => void;
}

export const GamificationHub = ({ onXPReward, onCoinReward }: GamificationHubProps) => {
  // Modal states
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showBossChallenge, setShowBossChallenge] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  // Hooks
  const { getProgress, currentSeason, getUnclaimedRewards } = useBattlePass();
  const { state: guildState, isInGuild, getGuildProgress } = useGuildSystem();
  const { getActiveChallenge, allChallenges } = useBossChallenges();
  const { canSpinToday, getStats } = useLuckyWheel();
  const { state: comboState, currentTier } = useComboSystem();
  const { activeEvents, hasUnclaimedRewards: hasEventRewards, isDoubleXPActive, isDoubleCoinsActive } = useSpecialEvents();

  const battlePassProgress = getProgress();
  const guildProgress = getGuildProgress();
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Challenges
          </h1>
          <EventIndicator />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Complete challenges and earn bonus rewards
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Active Events Banner (if any) */}
          {activeEvents.length > 0 && (
            <Card className={cn(
              "overflow-hidden",
              "bg-gradient-to-r",
              activeEvents[0].backgroundGradient
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeEvents[0].emoji}</span>
                  <div className="flex-1 text-white">
                    <h3 className="font-bold">{activeEvents[0].name}</h3>
                    <p className="text-sm text-white/80">{activeEvents[0].description}</p>
                  </div>
                  {(isDoubleXPActive() || isDoubleCoinsActive()) && (
                    <div className="flex flex-col gap-1">
                      {isDoubleXPActive() && (
                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold text-white">2x XP</span>
                      )}
                      {isDoubleCoinsActive() && (
                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold text-white">2x Coins</span>
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

          {/* Lucky Wheel */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              canSpinToday() && "ring-2 ring-purple-500 ring-offset-2"
            )}
            onClick={() => setShowLuckyWheel(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-purple-500 to-pink-500",
                  canSpinToday() && "animate-pulse"
                )}>
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">Lucky Wheel</h3>
                  <p className="text-sm text-muted-foreground">
                    {canSpinToday() ? 'Daily spin available!' : `${wheelStats.totalSpins} total spins`}
                  </p>
                </div>
                {canSpinToday() && (
                  <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    FREE
                  </div>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Battle Pass */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md overflow-hidden",
              unclaimedBattlePassRewards.length > 0 && "ring-2 ring-yellow-500"
            )}
            onClick={() => setShowBattlePass(true)}
          >
            <div className={cn(
              "h-2 bg-gradient-to-r",
              currentSeason?.backgroundGradient || "from-blue-500 to-purple-500"
            )} />
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{currentSeason?.name || 'Battle Pass'}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Tier {battlePassProgress.currentTier}</span>
                    <span>·</span>
                    <span>{battlePassProgress.daysRemaining} days left</span>
                  </div>
                </div>
                {unclaimedBattlePassRewards.length > 0 && (
                  <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    {unclaimedBattlePassRewards.length}
                  </div>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Boss Challenges */}
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              activeChallenge.challenge && "ring-2 ring-red-500"
            )}
            onClick={() => setShowBossChallenge(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Swords className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">Boss Challenges</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeChallenge.challenge
                      ? `Active: ${activeChallenge.challenge.name}`
                      : `${allChallenges.length} challenges available`}
                  </p>
                </div>
                {activeChallenge.challenge && (
                  <div className="text-sm font-bold text-orange-500">
                    {Math.round(activeChallenge.percentComplete)}%
                  </div>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Guild */}
          <Card
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => setShowGuild(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  {isInGuild ? (
                    <span className="text-2xl">{guildState.currentGuild?.emoji}</span>
                  ) : (
                    <Users className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">
                    {isInGuild ? guildState.currentGuild?.name : 'Join a Guild'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isInGuild
                      ? `Level ${guildProgress?.level} · ${guildState.myContribution} min this week`
                      : 'Team up with others for group goals'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{comboState.currentCombo}</div>
                <div className="text-xs text-muted-foreground">Current Combo</div>
                <div className="text-xs mt-1" style={{ color: currentTier.color }}>
                  {currentTier.multiplier}x multiplier
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{comboState.highestCombo}</div>
                <div className="text-xs text-muted-foreground">Best Combo</div>
                <div className="text-xs mt-1 text-muted-foreground">
                  All time record
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info section */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                How Combo Works
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete focus sessions to build your combo</li>
                <li>• Higher combos = bigger XP & coin bonuses</li>
                <li>• Combo expires after 3 hours of inactivity</li>
                <li>• Reach 10 combo for 2x legendary multiplier!</li>
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
      <GuildPanel
        isOpen={showGuild}
        onClose={() => setShowGuild(false)}
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
