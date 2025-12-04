import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Hooks
import { useBattlePass } from '@/hooks/useBattlePass';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { useLuckyWheel } from '@/hooks/useLuckyWheel';
import { useComboSystem } from '@/hooks/useComboSystem';
import { useSpecialEvents } from '@/hooks/useSpecialEvents';
import { useAchievementSystem } from '@/hooks/useAchievementSystem';

// Components
import { BattlePassModal } from './BattlePassModal';
import { BossChallengeModal } from './BossChallengeModal';
import { LuckyWheelModal } from './LuckyWheelModal';
import { ComboDisplay } from './ComboDisplay';
import { EventIndicator } from './SpecialEventBanner';
import { AchievementUnlockModal } from './AchievementUnlockModal';
import { AchievementGallery } from '@/components/AchievementGallery';

// Icons
import {
  Crown,
  Swords,
  Sparkles,
  Flame,
  Zap,
  Gift,
  ChevronRight,
  Gamepad2,
  Star,
  Trophy,
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
  const [showAchievements, setShowAchievements] = useState(false);

  // Hooks
  const { getProgress, currentSeason, getUnclaimedRewards } = useBattlePass();
  const { getActiveChallenge, allChallenges } = useBossChallenges();
  const { canSpinToday, getStats } = useLuckyWheel();
  const { state: comboState, currentTier } = useComboSystem();
  const { activeEvents, isDoubleXPActive, isDoubleCoinsActive } = useSpecialEvents();
  const {
    achievements,
    unlockedAchievements,
    getTotalAchievementPoints,
    getCompletionPercentage
  } = useAchievementSystem();

  const battlePassProgress = getProgress();
  const activeChallenge = getActiveChallenge();
  const wheelStats = getStats();
  const unclaimedBattlePassRewards = getUnclaimedRewards();
  const achievementPoints = getTotalAchievementPoints();
  const achievementPercent = getCompletionPercentage();

  const handleRewardClaim = (type: 'xp' | 'coins', amount: number) => {
    if (type === 'xp' && onXPReward) {
      onXPReward(amount);
    } else if (type === 'coins' && onCoinReward) {
      onCoinReward(amount);
    }
  };

  const handleAchievementRewardClaim = (xp: number, coins: number) => {
    if (xp > 0 && onXPReward) {
      onXPReward(xp);
    }
    if (coins > 0 && onCoinReward) {
      onCoinReward(coins);
    }
  };

  // If achievements view is open, show it instead
  if (showAchievements) {
    return (
      <div className="h-full flex flex-col retro-arcade-container">
        <AchievementGallery
          embedded={true}
          onClose={() => setShowAchievements(false)}
        />
        <AchievementUnlockModal onClaimReward={handleAchievementRewardClaim} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col retro-arcade-container">
      {/* Retro Header */}
      <div className="relative p-4 border-b-4 border-purple-600/50">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-transparent to-pink-900/50" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 retro-icon-badge">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold retro-pixel-text retro-neon-text">
                ARCADE
              </h1>
              <p className="text-xs text-purple-300/80 uppercase tracking-wider">
                Challenges & Rewards
              </p>
            </div>
          </div>
          <EventIndicator />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4 pb-6">
          {/* Active Events Banner */}
          {activeEvents.length > 0 && (
            <div className="retro-game-card p-4 retro-active-challenge">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 retro-icon-badge flex items-center justify-center">
                  <span className="text-3xl">{activeEvents[0].emoji}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white retro-pixel-text">
                    {activeEvents[0].name}
                  </h3>
                  <p className="text-sm text-purple-300/80">
                    {activeEvents[0].description}
                  </p>
                </div>
                {(isDoubleXPActive() || isDoubleCoinsActive()) && (
                  <div className="flex flex-col gap-1">
                    {isDoubleXPActive() && (
                      <span className="retro-difficulty-badge retro-difficulty-legendary text-xs">
                        2x XP
                      </span>
                    )}
                    {isDoubleCoinsActive() && (
                      <span className="retro-difficulty-badge retro-difficulty-hard text-xs">
                        2x COINS
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Combo Display */}
          {comboState.currentCombo > 0 && (
            <ComboDisplay variant="compact" />
          )}

          {/* Achievements - NEW SECTION */}
          <button
            className={cn(
              "w-full retro-game-card overflow-hidden cursor-pointer transition-all text-left touch-manipulation select-none active:scale-[0.98]",
              unlockedAchievements.length > 0 && "retro-active-challenge"
            )}
            onClick={() => setShowAchievements(true)}
          >
            {/* Progress Bar at Top */}
            <div className="h-2 bg-purple-900/50">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all"
                style={{ width: `${achievementPercent}%` }}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white retro-pixel-text">ACHIEVEMENTS</h3>
                  <div className="flex items-center gap-2 text-sm text-purple-300/80">
                    <span className="retro-neon-yellow">{achievementPoints} PTS</span>
                    <span>·</span>
                    <span>{unlockedAchievements.length}/{achievements.length} unlocked</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-400">{achievementPercent}%</div>
                  <div className="text-[10px] text-purple-300/60">Complete</div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </button>

          {/* Lucky Wheel - Arcade Style */}
          <button
            className={cn(
              "w-full retro-game-card p-4 cursor-pointer transition-all text-left touch-manipulation select-none active:scale-[0.98]",
              canSpinToday() && "retro-active-challenge"
            )}
            onClick={() => setShowLuckyWheel(true)}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br from-pink-500 to-purple-600",
                "border-2 border-pink-400",
                "shadow-[0_0_15px_rgba(236,72,153,0.5)]",
                canSpinToday() && "animate-pulse"
              )}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white retro-pixel-text">LUCKY SPIN</h3>
                <p className="text-sm text-purple-300/80">
                  {canSpinToday() ? (
                    <span className="retro-neon-green">FREE SPIN READY!</span>
                  ) : (
                    `${wheelStats.totalSpins} total spins`
                  )}
                </p>
              </div>
              {canSpinToday() && (
                <div className="retro-arcade-btn retro-arcade-btn-yellow px-3 py-1.5 text-xs">
                  FREE
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-purple-400" />
            </div>
          </button>

          {/* Battle Pass - Season Pass Style */}
          <button
            className={cn(
              "w-full retro-game-card overflow-hidden cursor-pointer transition-all text-left touch-manipulation select-none active:scale-[0.98]",
              unclaimedBattlePassRewards.length > 0 && "retro-active-challenge"
            )}
            onClick={() => setShowBattlePass(true)}
          >
            {/* Progress Bar at Top */}
            <div className="h-2 bg-purple-900/50">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
                style={{ width: `${battlePassProgress.progressPercent}%` }}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center border-2 border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white retro-pixel-text">
                    {currentSeason?.name || 'SEASON PASS'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-purple-300/80">
                    <span className="retro-neon-yellow">LVL {battlePassProgress.currentTier}</span>
                    <span>·</span>
                    <span>{battlePassProgress.daysRemaining} days left</span>
                  </div>
                </div>
                {unclaimedBattlePassRewards.length > 0 && (
                  <div className="flex items-center gap-1 retro-arcade-btn retro-arcade-btn-yellow px-2 py-1 text-xs">
                    <Gift className="w-3 h-3" />
                    {unclaimedBattlePassRewards.length}
                  </div>
                )}
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </button>

          {/* Boss Challenges - Boss Battle Style */}
          <button
            className={cn(
              "w-full retro-game-card p-4 cursor-pointer transition-all text-left touch-manipulation select-none active:scale-[0.98]",
              activeChallenge.challenge && "retro-active-challenge"
            )}
            onClick={() => setShowBossChallenge(true)}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <Swords className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white retro-pixel-text">BOSS BATTLES</h3>
                <p className="text-sm text-purple-300/80">
                  {activeChallenge.challenge ? (
                    <span className="retro-neon-orange">
                      FIGHTING: {activeChallenge.challenge.name}
                    </span>
                  ) : (
                    `${allChallenges.length} bosses available`
                  )}
                </p>
              </div>
              {activeChallenge.challenge && (
                <div className="flex flex-col items-end gap-1">
                  <div className="retro-health-bar retro-health-bar-red w-20 h-3">
                    <div
                      className="retro-health-bar-fill"
                      style={{ width: `${activeChallenge.percentComplete}%` }}
                    />
                  </div>
                  <span className="text-xs retro-neon-orange font-bold">
                    {Math.round(activeChallenge.percentComplete)}%
                  </span>
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-purple-400" />
            </div>
          </button>

          {/* Retro Stats Grid */}
          <div className="retro-stats-grid">
            <div className="retro-stat-box">
              <div className="flex items-center justify-center mb-2">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div className="retro-stat-value">{comboState.currentCombo}</div>
              <div className="retro-stat-label">Current Combo</div>
              <div className="text-xs mt-1 retro-pixel-text" style={{ color: currentTier.color }}>
                {currentTier.multiplier}x MULT
              </div>
            </div>
            <div className="retro-stat-box">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="retro-stat-value">{comboState.highestCombo}</div>
              <div className="retro-stat-label">Best Combo</div>
              <div className="text-xs mt-1 text-purple-400">
                ALL TIME RECORD
              </div>
            </div>
          </div>

          {/* Info Panel - Arcade Style */}
          <div className="retro-game-card p-4">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-cyan-400 retro-pixel-text">
              <Zap className="w-4 h-4" />
              HOW TO PLAY
            </h4>
            <ul className="text-sm text-purple-300/80 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">►</span>
                Complete focus sessions to build your combo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">►</span>
                Higher combos = bigger XP & coin bonuses
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">►</span>
                Combo expires after 3 hours of inactivity
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">►</span>
                Unlock achievements for bonus rewards!
              </li>
            </ul>
          </div>
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

      {/* Achievement Unlock Modal */}
      <AchievementUnlockModal onClaimReward={handleAchievementRewardClaim} />
    </div>
  );
};

export default GamificationHub;
