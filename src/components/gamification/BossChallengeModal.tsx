import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { cn } from '@/lib/utils';
import { Swords, Clock, Trophy, XCircle, CheckCircle, Lock, Flame, Skull, Zap } from 'lucide-react';
import { BossChallenge } from '@/data/GamificationData';

interface BossChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BossChallengeModal = ({ isOpen, onClose }: BossChallengeModalProps) => {
  const {
    startChallenge,
    abandonChallenge,
    getChallengeStatus,
    getActiveChallenge,
    getChallengesByDifficulty,
  } = useBossChallenges();

  const [activeTab, setActiveTab] = useState<BossChallenge['difficulty']>('normal');
  const activeChallenge = getActiveChallenge();

  const getDifficultyClass = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return 'retro-difficulty-normal';
      case 'hard': return 'retro-difficulty-hard';
      case 'extreme': return 'retro-difficulty-extreme';
      case 'legendary': return 'retro-difficulty-legendary';
    }
  };

  const getDifficultyIcon = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return '⚔️';
      case 'hard': return '🔥';
      case 'extreme': return '💀';
      case 'legendary': return '👑';
    }
  };

  const getHealthBarClass = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return '';
      case 'hard': return 'retro-health-bar-yellow';
      case 'extreme': return 'retro-health-bar-red';
      case 'legendary': return 'retro-health-bar-purple';
    }
  };

  const formatCooldown = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  const difficulties: BossChallenge['difficulty'][] = ['normal', 'hard', 'extreme', 'legendary'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden retro-modal flex flex-col">
        {/* Retro Header */}
        <div className="retro-modal-header flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-3 retro-pixel-text">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center border-2 border-red-400">
                <Skull className="w-5 h-5 text-white" />
              </div>
              <span className="retro-neon-pink">BOSS BATTLES</span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-purple-200/80 text-sm mt-2 ml-13">
            Defeat powerful focus bosses for legendary rewards!
          </p>
        </div>

        {/* Active Challenge Banner */}
        {activeChallenge.challenge && (
          <div className="mx-4 mt-4 retro-game-card p-4 retro-active-challenge flex-shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 retro-icon-badge">
                  <span className="text-3xl">{activeChallenge.challenge.emoji}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("retro-difficulty-badge", getDifficultyClass(activeChallenge.challenge.difficulty))}>
                      {getDifficultyIcon(activeChallenge.challenge.difficulty)} {activeChallenge.challenge.difficulty}
                    </span>
                  </div>
                  <h3 className="text-white font-bold mt-1 retro-pixel-text">
                    {activeChallenge.challenge.name}
                  </h3>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={abandonChallenge}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            {/* Boss Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-400 retro-pixel-text">BOSS HP</span>
                <span className="retro-neon-orange">{Math.round(100 - activeChallenge.percentComplete)}%</span>
              </div>
              <div className={cn("retro-health-bar", getHealthBarClass(activeChallenge.challenge.difficulty))}>
                <div
                  className="retro-health-bar-fill"
                  style={{ width: `${100 - activeChallenge.percentComplete}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-purple-300/60">
                <span>Your Progress: {Math.round(activeChallenge.percentComplete)}%</span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  FIGHTING
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Difficulty Tabs */}
        <div className="px-4 pt-4 flex-shrink-0">
          <div className="flex gap-1 bg-purple-900/30 p-1 rounded-lg">
            {difficulties.map(diff => (
              <button
                key={diff}
                onClick={() => setActiveTab(diff)}
                className={cn(
                  "flex-1 py-3 px-2 sm:px-3 rounded-md text-[10px] sm:text-xs font-bold uppercase transition-all retro-pixel-text",
                  "touch-manipulation select-none active:scale-95",
                  activeTab === diff
                    ? cn("text-white", getDifficultyClass(diff))
                    : "text-purple-400 hover:text-purple-300 hover:bg-purple-800/30"
                )}
              >
                <span className="block sm:inline">{getDifficultyIcon(diff)}</span>
                <span className="block sm:inline sm:ml-1">{diff}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Challenge List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 pb-4">
          <div className="space-y-3">
            {getChallengesByDifficulty(activeTab).map(({ challenge, status }) => (
              <div
                key={challenge.id}
                className={cn(
                  "retro-game-card p-4 transition-all",
                  status.isActive && "retro-active-challenge",
                  status.isCompleted && "border-green-500/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Boss Icon */}
                  <div className={cn(
                    "w-14 h-14 retro-icon-badge shrink-0",
                    status.isCompleted && "opacity-50"
                  )}>
                    <span className="text-2xl">{challenge.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title & Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white retro-pixel-text text-sm">
                        {challenge.name}
                      </h4>
                      {status.isCompleted && (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          DEFEATED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-purple-300/70 mt-1 line-clamp-2">
                      {challenge.description}
                    </p>

                    {/* Rewards */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="retro-reward-item compact text-xs">
                        <Trophy className="w-3 h-3 text-yellow-400" />
                        <span className="retro-neon-yellow">{challenge.rewards.xp} XP</span>
                      </span>
                      <span className="retro-reward-item compact text-xs">
                        <span>🪙</span>
                        <span className="text-amber-400">{challenge.rewards.coins}</span>
                      </span>
                      {challenge.rewards.badge && (
                        <span className="retro-reward-item compact epic text-xs">
                          <span>🏅</span>
                          <span>Badge</span>
                        </span>
                      )}
                    </div>

                    {/* Cooldown */}
                    {status.cooldownRemaining > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-purple-400">
                        <Clock className="w-3 h-3" />
                        Respawns in {formatCooldown(status.cooldownRemaining)}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0">
                    {status.isActive ? (
                      <div className="flex items-center gap-1 text-orange-400">
                        <Flame className="w-5 h-5 animate-pulse" />
                      </div>
                    ) : status.cooldownRemaining > 0 ? (
                      <Lock className="w-5 h-5 text-purple-500" />
                    ) : activeChallenge.challenge ? (
                      <Button
                        size="sm"
                        disabled
                        className="opacity-50 bg-purple-800 text-purple-400"
                      >
                        BUSY
                      </Button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startChallenge(challenge.id);
                        }}
                        className={cn(
                          "retro-arcade-btn px-4 py-3 text-xs touch-manipulation select-none active:scale-95",
                          activeTab === 'normal' && "retro-arcade-btn-green",
                          activeTab === 'hard' && "retro-arcade-btn-yellow",
                          activeTab === 'extreme' && "",
                          activeTab === 'legendary' && "retro-arcade-btn-purple"
                        )}
                      >
                        <Zap className="w-3 h-3 inline mr-1" />
                        FIGHT
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar for Active */}
                {status.isActive && status.progress && (
                  <div className="mt-3">
                    <div className={cn("retro-health-bar h-2", getHealthBarClass(activeTab))}>
                      <div
                        className="retro-health-bar-fill"
                        style={{ width: `${(status.progress.currentProgress / challenge.requirement.value) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 p-3 border-t-2 border-purple-700/50 bg-purple-900/30">
          <p className="text-xs text-center text-purple-400 retro-pixel-text">
            ⚡ COMPLETE FOCUS SESSIONS TO DEAL DAMAGE ⚡
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
