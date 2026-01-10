import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { cn } from '@/lib/utils';
import { Clock, Trophy, XCircle, CheckCircle, Lock, Flame, Skull, Zap, ChevronLeft, ChevronRight, Coins, X } from 'lucide-react';
import { BOSS_CHALLENGES, BossChallenge } from '@/data/GamificationData';

interface BossChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BossChallengeModal = ({ isOpen, onClose }: BossChallengeModalProps) => {
  const {
    startChallenge,
    abandonChallenge,
    getActiveChallenge,
    getChallengeStatus,
  } = useBossChallenges();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeChallenge = getActiveChallenge();

  // Get all challenges in a flat list
  const allChallenges = useMemo(() => BOSS_CHALLENGES, []);
  const currentChallenge = allChallenges[selectedIndex];
  const currentStatus = getChallengeStatus(currentChallenge.id);

  const getDifficultyConfig = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return { color: 'text-green-400', bg: 'from-green-600 to-emerald-700', border: 'border-green-500', label: 'NORMAL' };
      case 'hard': return { color: 'text-amber-400', bg: 'from-amber-500 to-orange-600', border: 'border-amber-500', label: 'HARD' };
      case 'extreme': return { color: 'text-red-400', bg: 'from-red-600 to-rose-700', border: 'border-red-500', label: 'EXTREME' };
      case 'legendary': return { color: 'text-purple-400', bg: 'from-purple-500 to-violet-600', border: 'border-purple-400', label: 'LEGENDARY' };
    }
  };

  const formatRequirement = (challenge: BossChallenge) => {
    const { type, value } = challenge.requirement;
    switch (type) {
      case 'focus_duration':
        return `Complete a ${Math.floor(value / 60)}-hour focus session`;
      case 'consecutive_sessions':
        return `Complete ${value} focus sessions today`;
      case 'total_focus_week':
        return `Accumulate ${Math.floor(value / 60)} hours this week`;
      case 'perfect_day':
        return `Focus ${Math.floor(value / 60)} hours in one day`;
      default:
        return `Complete ${value} units`;
    }
  };

  const formatCooldown = (hours: number) => {
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const goToPrev = () => setSelectedIndex(i => (i - 1 + allChallenges.length) % allChallenges.length);
  const goToNext = () => setSelectedIndex(i => (i + 1) % allChallenges.length);

  const config = getDifficultyConfig(currentChallenge.difficulty);
  const isActive = currentStatus.isActive;
  const isCompleted = currentStatus.isCompleted;
  const onCooldown = currentStatus.cooldownRemaining > 0;
  const canStart = !activeChallenge.challenge && !onCooldown;

  // If there's an active challenge, jump to it on open
  const activeIndex = allChallenges.findIndex(c => c.id === activeChallenge.challenge?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 border-2 border-purple-500/30 rounded-2xl">
        {/* Header */}
        <div className="relative px-4 py-3 border-b border-purple-500/20">
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-purple-800/30 transition-colors"
          >
            <X className="w-5 h-5 text-purple-400" />
          </button>
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Skull className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">BOSS BATTLES</h2>
          </div>
        </div>

        {/* Active Battle Alert */}
        {activeChallenge.challenge && !isActive && (
          <button
            onClick={() => setSelectedIndex(activeIndex >= 0 ? activeIndex : 0)}
            className="mx-4 mt-3 p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg">
              {activeChallenge.challenge.emoji}
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs text-orange-400 font-medium flex items-center gap-1">
                <Flame className="w-3 h-3" /> IN BATTLE
              </div>
              <div className="text-white font-semibold text-sm">{activeChallenge.challenge.name}</div>
            </div>
            <div className="text-orange-400 font-bold">{Math.round(activeChallenge.percentComplete)}%</div>
          </button>
        )}

        {/* Boss Display */}
        <div className="px-4 py-5">
          {/* Navigation + Boss Card */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              className="p-2 rounded-xl bg-purple-800/30 hover:bg-purple-700/40 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-purple-300" />
            </button>

            {/* Boss Card */}
            <div className={cn(
              "flex-1 rounded-2xl p-4 border-2 transition-all",
              "bg-gradient-to-br from-purple-900/60 to-slate-900/60",
              isActive ? "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]" : config.border + "/40"
            )}>
              {/* Boss Icon & Info */}
              <div className="flex items-start gap-4 mb-4">
                <div className={cn(
                  "w-16 h-16 rounded-xl flex items-center justify-center text-3xl",
                  "bg-gradient-to-br border-2 shadow-lg",
                  config.bg, config.border,
                  isActive && "animate-pulse"
                )}>
                  {currentChallenge.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold mb-1",
                    "bg-gradient-to-r", config.bg, "text-white"
                  )}>
                    {config.label}
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight">
                    {currentChallenge.name}
                  </h3>
                </div>
              </div>

              {/* Objective */}
              <div className="text-purple-300/90 text-sm mb-4">
                {formatRequirement(currentChallenge)}
              </div>

              {/* Progress Bar (if active) */}
              {isActive && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-orange-400 font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Fighting
                    </span>
                    <span className="text-white font-bold">{Math.round(activeChallenge.percentComplete)}%</span>
                  </div>
                  <div className="h-2.5 bg-purple-900/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                      style={{ width: `${activeChallenge.percentComplete}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Rewards */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-purple-800/40 px-2.5 py-1.5 rounded-lg">
                  <span className="text-cyan-400 text-sm">⭐</span>
                  <span className="text-white font-semibold text-sm">{currentChallenge.rewards.xp}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-purple-800/40 px-2.5 py-1.5 rounded-lg">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white font-semibold text-sm">{currentChallenge.rewards.coins}</span>
                </div>
                {currentChallenge.rewards.badge && (
                  <div className="flex items-center gap-1 bg-purple-800/40 px-2.5 py-1.5 rounded-lg">
                    <span className="text-sm">🏅</span>
                  </div>
                )}
                {currentChallenge.rewards.specialReward && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600/40 to-pink-600/40 px-2.5 py-1.5 rounded-lg border border-purple-400/20">
                    <span className="text-sm">✨</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={goToNext}
              className="p-2 rounded-xl bg-purple-800/30 hover:bg-purple-700/40 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-purple-300" />
            </button>
          </div>

          {/* Boss Selector Dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {allChallenges.map((challenge, idx) => {
              const status = getChallengeStatus(challenge.id);
              const diffConfig = getDifficultyConfig(challenge.difficulty);
              return (
                <button
                  key={challenge.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    idx === selectedIndex
                      ? cn("w-6", status.isActive ? "bg-orange-500" : `bg-gradient-to-r ${diffConfig.bg}`)
                      : status.isActive
                        ? "bg-orange-500/50"
                        : status.isCompleted
                          ? "bg-green-500/40"
                          : "bg-purple-600/40"
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="px-4 pb-4">
          {isActive ? (
            <button
              onClick={abandonChallenge}
              className="w-full py-3 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-600/30 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Abandon Battle
            </button>
          ) : isCompleted && !onCooldown ? (
            <div className="w-full py-3 rounded-xl bg-green-600/20 border border-green-500/40 text-green-400 font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Defeated!
            </div>
          ) : onCooldown ? (
            <div className="w-full py-3 rounded-xl bg-purple-800/30 border border-purple-600/30 text-purple-400 font-medium flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Respawns in {formatCooldown(currentStatus.cooldownRemaining)}
            </div>
          ) : activeChallenge.challenge ? (
            <div className="w-full py-3 rounded-xl bg-purple-800/30 border border-purple-600/30 text-purple-400 font-medium flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Finish current battle first
            </div>
          ) : (
            <button
              onClick={() => startChallenge(currentChallenge.id)}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2",
                "bg-gradient-to-r border-2 transition-all",
                "hover:brightness-110 active:scale-[0.98]",
                "shadow-lg",
                config.bg, config.border
              )}
            >
              <Zap className="w-5 h-5" />
              START BATTLE
            </button>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 pb-3 text-center">
          <p className="text-xs text-purple-500">
            Complete focus sessions to deal damage
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
