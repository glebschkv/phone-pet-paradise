import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { cn } from '@/lib/utils';
import { Clock, Trophy, XCircle, CheckCircle, Lock, Flame, Skull, Zap, ChevronLeft, Coins, Award, X, Swords, Target } from 'lucide-react';
import { BossChallenge } from '@/data/GamificationData';

interface BossChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'arena' | 'boss-detail';

export const BossChallengeModal = ({ isOpen, onClose }: BossChallengeModalProps) => {
  const {
    startChallenge,
    abandonChallenge,
    getActiveChallenge,
    getChallengesByDifficulty,
  } = useBossChallenges();

  const [viewMode, setViewMode] = useState<ViewMode>('arena');
  const [selectedBoss, setSelectedBoss] = useState<{ challenge: BossChallenge; status: ReturnType<typeof getChallengesByDifficulty>[0]['status'] } | null>(null);
  const activeChallenge = getActiveChallenge();

  const difficulties: BossChallenge['difficulty'][] = ['normal', 'hard', 'extreme', 'legendary'];

  const getDifficultyColor = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return { bg: 'from-green-600 to-emerald-700', border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' };
      case 'hard': return { bg: 'from-amber-500 to-orange-600', border: 'border-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/30' };
      case 'extreme': return { bg: 'from-red-600 to-rose-700', border: 'border-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' };
      case 'legendary': return { bg: 'from-purple-600 to-violet-700', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/30' };
    }
  };

  const getDifficultyIcon = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return <Swords className="w-4 h-4" />;
      case 'hard': return <Flame className="w-4 h-4" />;
      case 'extreme': return <Skull className="w-4 h-4" />;
      case 'legendary': return <Award className="w-4 h-4" />;
    }
  };

  const formatCooldown = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d`;
    }
    return `${hours}h`;
  };

  const formatRequirement = (challenge: BossChallenge) => {
    const { type, value } = challenge.requirement;
    switch (type) {
      case 'focus_duration':
        return `${Math.floor(value / 60)}h focus session`;
      case 'consecutive_sessions':
        return `${value} sessions in a day`;
      case 'total_focus_week':
        return `${Math.floor(value / 60)}h weekly focus`;
      case 'perfect_day':
        return `${Math.floor(value / 60)}h in one day`;
      default:
        return `${value} required`;
    }
  };

  const handleBossSelect = (challenge: BossChallenge, status: ReturnType<typeof getChallengesByDifficulty>[0]['status']) => {
    setSelectedBoss({ challenge, status });
    setViewMode('boss-detail');
  };

  const handleBackToArena = () => {
    setViewMode('arena');
    setSelectedBoss(null);
  };

  const handleStartFight = (challengeId: string) => {
    startChallenge(challengeId);
    setViewMode('arena');
    setSelectedBoss(null);
  };

  // Boss Detail View
  if (viewMode === 'boss-detail' && selectedBoss) {
    const { challenge, status } = selectedBoss;
    const colors = getDifficultyColor(challenge.difficulty);
    const canFight = !activeChallenge.challenge && status.cooldownRemaining === 0;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden retro-modal">
          {/* Header with back button */}
          <div className="relative p-4 border-b-2 border-purple-700/50 bg-gradient-to-r from-purple-900/80 to-indigo-900/80">
            <button
              onClick={handleBackToArena}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-purple-800/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-purple-300" />
            </button>
            <DialogHeader className="text-center">
              <DialogTitle className="text-white text-lg retro-pixel-text">
                BOSS INFO
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Boss Showcase */}
          <div className="p-6">
            {/* Boss Icon */}
            <div className="flex flex-col items-center mb-6">
              <div className={cn(
                "w-24 h-24 rounded-2xl flex items-center justify-center text-5xl",
                "bg-gradient-to-br border-2 shadow-lg",
                colors.bg, colors.border, colors.glow,
                status.isActive && "animate-pulse"
              )}>
                {challenge.emoji}
              </div>
              <div className={cn(
                "mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5",
                "bg-gradient-to-r border",
                colors.bg, colors.border, "text-white"
              )}>
                {getDifficultyIcon(challenge.difficulty)}
                {challenge.difficulty}
              </div>
            </div>

            {/* Boss Name & Description */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white retro-pixel-text mb-2">
                {challenge.name}
              </h2>
              <p className="text-purple-300/80 text-sm">
                {challenge.description}
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-purple-900/30 rounded-xl p-4 mb-4 border border-purple-700/30">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Objective</span>
              </div>
              <p className="text-white font-medium">
                {formatRequirement(challenge)}
              </p>
            </div>

            {/* Rewards */}
            <div className="bg-purple-900/30 rounded-xl p-4 mb-6 border border-purple-700/30">
              <div className="flex items-center gap-2 mb-3 text-yellow-400">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Rewards</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-purple-800/40 px-3 py-2 rounded-lg">
                  <span className="text-cyan-400">⭐</span>
                  <span className="text-white font-bold">{challenge.rewards.xp}</span>
                  <span className="text-purple-300 text-sm">XP</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-800/40 px-3 py-2 rounded-lg">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-bold">{challenge.rewards.coins}</span>
                  <span className="text-purple-300 text-sm">Coins</span>
                </div>
                {challenge.rewards.badge && (
                  <div className="flex items-center gap-2 bg-purple-800/40 px-3 py-2 rounded-lg">
                    <span>🏅</span>
                    <span className="text-amber-300 text-sm">Badge</span>
                  </div>
                )}
                {challenge.rewards.specialReward && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/50 to-pink-600/50 px-3 py-2 rounded-lg border border-purple-400/30">
                    <span>✨</span>
                    <span className="text-purple-200 text-sm">Special</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status & Action */}
            {status.isActive ? (
              <div className="space-y-3">
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-orange-400 font-bold flex items-center gap-2">
                      <Flame className="w-4 h-4 animate-pulse" />
                      IN BATTLE
                    </span>
                    <span className="text-white font-bold">
                      {Math.round(activeChallenge.percentComplete)}%
                    </span>
                  </div>
                  <div className="h-3 bg-purple-900/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                      style={{ width: `${activeChallenge.percentComplete}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={abandonChallenge}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Abandon Battle
                </Button>
              </div>
            ) : status.isCompleted ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <span className="text-green-400 font-bold">DEFEATED!</span>
                {status.cooldownRemaining > 0 && (
                  <p className="text-purple-300 text-sm mt-1">
                    Respawns in {formatCooldown(status.cooldownRemaining)}
                  </p>
                )}
              </div>
            ) : status.cooldownRemaining > 0 ? (
              <div className="bg-purple-800/30 border border-purple-700/30 rounded-xl p-4 text-center">
                <Lock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <span className="text-purple-400 font-bold">ON COOLDOWN</span>
                <p className="text-purple-300 text-sm mt-1">
                  Available in {formatCooldown(status.cooldownRemaining)}
                </p>
              </div>
            ) : activeChallenge.challenge ? (
              <div className="bg-purple-800/30 border border-purple-700/30 rounded-xl p-4 text-center">
                <Swords className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <span className="text-purple-400 font-bold">BUSY</span>
                <p className="text-purple-300 text-sm mt-1">
                  Finish current battle first
                </p>
              </div>
            ) : (
              <button
                onClick={() => handleStartFight(challenge.id)}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-white text-lg",
                  "bg-gradient-to-r border-2 transition-all",
                  "active:scale-[0.98] hover:brightness-110",
                  "shadow-lg",
                  colors.bg, colors.border, colors.glow
                )}
              >
                <Zap className="w-5 h-5 inline mr-2" />
                START BATTLE
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Arena View (Main View)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden retro-modal flex flex-col">
        {/* Header */}
        <div className="retro-modal-header flex-shrink-0 relative">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center justify-center gap-3 retro-pixel-text">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center border-2 border-red-400">
                <Skull className="w-5 h-5 text-white" />
              </div>
              <span className="retro-neon-pink">BOSS ARENA</span>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Active Battle Banner - Only show when fighting */}
        {activeChallenge.challenge && (
          <div className="mx-4 mt-4 flex-shrink-0">
            <button
              onClick={() => {
                const status = getChallengesByDifficulty(activeChallenge.challenge!.difficulty)
                  .find(c => c.challenge.id === activeChallenge.challenge!.id);
                if (status) handleBossSelect(activeChallenge.challenge!, status.status);
              }}
              className="w-full retro-game-card p-4 retro-active-challenge text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                  "bg-gradient-to-br border-2",
                  getDifficultyColor(activeChallenge.challenge.difficulty).bg,
                  getDifficultyColor(activeChallenge.challenge.difficulty).border
                )}>
                  {activeChallenge.challenge.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                    <span className="text-orange-400 text-xs font-bold uppercase">In Battle</span>
                  </div>
                  <h3 className="text-white font-bold truncate">
                    {activeChallenge.challenge.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(activeChallenge.percentComplete)}%
                  </div>
                </div>
              </div>
              <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${activeChallenge.percentComplete}%` }}
                />
              </div>
            </button>
          </div>
        )}

        {/* Boss Grid by Difficulty */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-5 pb-6">
            {difficulties.map(difficulty => {
              const challenges = getChallengesByDifficulty(difficulty);
              const colors = getDifficultyColor(difficulty);

              return (
                <div key={difficulty}>
                  {/* Difficulty Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold uppercase",
                      "bg-gradient-to-r border",
                      colors.bg, colors.border, "text-white"
                    )}>
                      {getDifficultyIcon(difficulty)}
                      {difficulty}
                    </div>
                    <div className="flex-1 h-px bg-purple-700/30" />
                  </div>

                  {/* Boss Cards - Horizontal Scroll */}
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {challenges.map(({ challenge, status }) => {
                      const isActive = status.isActive;
                      const isCompleted = status.isCompleted;
                      const isLocked = status.cooldownRemaining > 0 || (activeChallenge.challenge && !isActive);

                      return (
                        <button
                          key={challenge.id}
                          onClick={() => handleBossSelect(challenge, status)}
                          className={cn(
                            "flex-shrink-0 w-28 p-3 rounded-xl text-center transition-all",
                            "border-2 bg-purple-900/40 backdrop-blur-sm",
                            "active:scale-95 hover:brightness-110",
                            isActive && "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]",
                            isCompleted && !isActive && "border-green-500/50 opacity-80",
                            isLocked && !isActive && "border-purple-700/50 opacity-60",
                            !isActive && !isCompleted && !isLocked && cn(colors.border, "border-opacity-50")
                          )}
                        >
                          {/* Boss Icon */}
                          <div className={cn(
                            "w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-2xl mb-2",
                            "bg-gradient-to-br border",
                            isLocked && !isActive ? "from-purple-800 to-purple-900 border-purple-700" : cn(colors.bg, colors.border),
                            isActive && "animate-pulse"
                          )}>
                            {isLocked && !isActive ? (
                              <Lock className="w-6 h-6 text-purple-500" />
                            ) : (
                              challenge.emoji
                            )}
                          </div>

                          {/* Boss Name */}
                          <h4 className={cn(
                            "font-bold text-xs truncate mb-1",
                            isLocked && !isActive ? "text-purple-500" : "text-white"
                          )}>
                            {challenge.name}
                          </h4>

                          {/* Status Badge */}
                          {isActive ? (
                            <div className="text-[10px] text-orange-400 font-bold flex items-center justify-center gap-1">
                              <Flame className="w-3 h-3" />
                              {Math.round(activeChallenge.percentComplete)}%
                            </div>
                          ) : isCompleted ? (
                            <div className="text-[10px] text-green-400 font-bold flex items-center justify-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </div>
                          ) : status.cooldownRemaining > 0 ? (
                            <div className="text-[10px] text-purple-400 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatCooldown(status.cooldownRemaining)}
                            </div>
                          ) : activeChallenge.challenge ? (
                            <div className="text-[10px] text-purple-500">
                              Busy
                            </div>
                          ) : (
                            <div className={cn("text-[10px] font-bold", colors.text)}>
                              Ready
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t-2 border-purple-700/50 bg-purple-900/30">
          <p className="text-xs text-center text-purple-400">
            <Zap className="w-3 h-3 inline mr-1" />
            Focus to deal damage • Tap a boss to see details
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
