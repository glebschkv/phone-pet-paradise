import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { cn } from '@/lib/utils';
import { Clock, XCircle, CheckCircle, Lock, Flame, Skull, Zap, ChevronLeft, ChevronRight, Coins, X } from 'lucide-react';
import { BOSS_CHALLENGES, BossChallenge } from '@/data/GamificationData';
import { PixelIcon } from '@/components/ui/PixelIcon';

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

  const allChallenges = useMemo(() => BOSS_CHALLENGES, []);
  const currentChallenge = allChallenges[selectedIndex];
  const currentStatus = getChallengeStatus(currentChallenge.id);

  const getDifficultyConfig = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return {
        color: 'hsl(120 60% 55%)', borderColor: 'hsl(120 55% 45%)',
        bg: 'linear-gradient(180deg, hsl(120 50% 35%) 0%, hsl(120 55% 25%) 100%)',
        label: 'NORMAL',
      };
      case 'hard': return {
        color: 'hsl(35 90% 55%)', borderColor: 'hsl(35 80% 45%)',
        bg: 'linear-gradient(180deg, hsl(35 70% 40%) 0%, hsl(30 75% 30%) 100%)',
        label: 'HARD',
      };
      case 'extreme': return {
        color: 'hsl(0 70% 55%)', borderColor: 'hsl(0 65% 45%)',
        bg: 'linear-gradient(180deg, hsl(0 60% 40%) 0%, hsl(0 65% 30%) 100%)',
        label: 'EXTREME',
      };
      case 'legendary': return {
        color: 'hsl(280 70% 60%)', borderColor: 'hsl(280 60% 50%)',
        bg: 'linear-gradient(180deg, hsl(280 55% 40%) 0%, hsl(280 60% 30%) 100%)',
        label: 'LEGENDARY',
      };
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="retro-modal max-w-[340px] p-0 overflow-hidden border-0">
        <VisuallyHidden>
          <DialogTitle>Boss Battles</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="retro-modal-header p-4 relative">
          <div className="retro-scanlines opacity-15" />
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg z-[2] transition-colors"
            style={{ background: 'hsl(280 40% 30%)', border: '1px solid hsl(280 50% 40%)' }}
          >
            <X className="w-4 h-4 text-purple-300" />
          </button>
          <div className="flex items-center justify-center gap-2 relative z-[1]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, hsl(15 80% 50%), hsl(0 75% 40%))',
                border: '2px solid hsl(0 60% 55%)',
                boxShadow: '0 2px 0 hsl(0 60% 30%), 0 0 10px hsl(0 100% 50% / 0.3)',
              }}
            >
              <Skull className="w-4 h-4 text-white" />
            </div>
            <h2
              className="text-lg font-black tracking-wide text-white uppercase"
              style={{ textShadow: '0 0 10px hsl(260 80% 70% / 0.5), 0 2px 0 rgba(0,0,0,0.3)' }}
            >
              Boss Battles
            </h2>
          </div>
        </div>

        {/* Active Battle Alert */}
        {activeChallenge.challenge && !isActive && (
          <button
            onClick={() => {
              const idx = allChallenges.findIndex(c => c.id === activeChallenge.challenge?.id);
              setSelectedIndex(idx >= 0 ? idx : 0);
            }}
            className="retro-reward-item mx-4 mt-3"
            style={{
              borderColor: 'hsl(25 90% 50%)',
              background: 'linear-gradient(180deg, hsl(25 40% 25%) 0%, hsl(20 35% 18%) 100%)',
              boxShadow: '0 0 10px hsl(25 100% 50% / 0.3)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(180deg, hsl(15 80% 50%), hsl(0 75% 40%))',
                border: '2px solid hsl(0 60% 55%)',
              }}
            >
              <PixelIcon name={activeChallenge.challenge.emoji} size={24} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'hsl(25 90% 60%)' }}>
                <Flame className="w-3 h-3" /> IN BATTLE
              </div>
              <div className="text-white font-bold text-sm">{activeChallenge.challenge.name}</div>
            </div>
            <div className="font-black text-sm" style={{ color: 'hsl(25 90% 60%)' }}>
              {Math.round(activeChallenge.percentComplete)}%
            </div>
          </button>
        )}

        {/* Boss Display */}
        <div className="px-4 py-4">
          {/* Navigation + Boss Card */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ background: 'hsl(260 30% 20%)', border: '2px solid hsl(260 35% 30%)' }}
            >
              <ChevronLeft className="w-5 h-5 text-purple-300" />
            </button>

            {/* Boss Card */}
            <div
              className="flex-1 rounded-xl p-4 transition-all"
              style={{
                background: 'linear-gradient(180deg, hsl(260 25% 20%) 0%, hsl(260 30% 15%) 100%)',
                border: `2px solid ${isActive ? 'hsl(25 90% 50%)' : config.borderColor}`,
                boxShadow: isActive ? '0 0 15px hsl(25 100% 50% / 0.3)' : `0 0 8px ${config.color}33`,
              }}
            >
              {/* Boss Icon & Info */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={cn("w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0", isActive && "animate-pulse")}
                  style={{
                    background: config.bg,
                    border: `2px solid ${config.borderColor}`,
                    boxShadow: `0 3px 0 ${config.borderColor}88, 0 0 10px ${config.color}44`,
                  }}
                >
                  <PixelIcon name={currentChallenge.emoji} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-1 text-white"
                    style={{
                      background: config.bg,
                      border: `1px solid ${config.borderColor}`,
                    }}
                  >
                    {config.label}
                  </span>
                  <h3 className="text-white font-black text-base leading-tight">
                    {currentChallenge.name}
                  </h3>
                </div>
              </div>

              {/* Objective */}
              <p className="text-[12px] mb-3 text-purple-300/80">
                {formatRequirement(currentChallenge)}
              </p>

              {/* Progress Bar (if active) */}
              {isActive && (
                <div className="mb-3">
                  <div className="flex justify-between mb-1.5" style={{ fontSize: 11 }}>
                    <span className="font-bold flex items-center gap-1" style={{ color: 'hsl(25 90% 55%)' }}>
                      <Flame className="w-3 h-3" /> Fighting
                    </span>
                    <span className="text-white font-black">{Math.round(activeChallenge.percentComplete)}%</span>
                  </div>
                  <div className="retro-xp-bar">
                    <div
                      className="retro-xp-fill"
                      style={{
                        width: `${activeChallenge.percentComplete}%`,
                        background: 'linear-gradient(90deg, hsl(25 90% 50%), hsl(0 80% 45%))',
                      }}
                    >
                      <div className="shine" />
                    </div>
                  </div>
                </div>
              )}

              {/* Rewards */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="retro-reward-item compact">
                  <PixelIcon name="star" size={14} />
                  <span className="text-amber-300 font-bold text-xs">{currentChallenge.rewards.xp}</span>
                </div>
                <div className="retro-reward-item compact">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 font-bold text-xs">{currentChallenge.rewards.coins}</span>
                </div>
                {currentChallenge.rewards.badge && (
                  <div className="retro-reward-item compact epic">
                    <PixelIcon name="sports-medal" size={14} />
                  </div>
                )}
                {currentChallenge.rewards.specialReward && (
                  <div className="retro-reward-item compact epic">
                    <PixelIcon name="sparkles" size={14} />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={goToNext}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ background: 'hsl(260 30% 20%)', border: '2px solid hsl(260 35% 30%)' }}
            >
              <ChevronRight className="w-5 h-5 text-purple-300" />
            </button>
          </div>

          {/* Boss Selector Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {allChallenges.map((challenge, idx) => {
              const status = getChallengeStatus(challenge.id);
              return (
                <button
                  key={challenge.id}
                  onClick={() => setSelectedIndex(idx)}
                  className="rounded-full transition-all"
                  style={{
                    width: idx === selectedIndex ? 20 : 8,
                    height: 8,
                    background: idx === selectedIndex
                      ? (status.isActive ? 'hsl(25 90% 50%)' : config.color)
                      : status.isActive
                        ? 'hsl(25 90% 50% / 0.5)'
                        : status.isCompleted
                          ? 'hsl(120 60% 45% / 0.4)'
                          : 'hsl(260 30% 30%)',
                  }}
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
              className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              style={{
                background: 'linear-gradient(180deg, hsl(0 50% 25%) 0%, hsl(0 55% 18%) 100%)',
                border: '2px solid hsl(0 60% 40%)',
                color: 'hsl(0 80% 65%)',
                boxShadow: '0 3px 0 hsl(0 60% 15%)',
              }}
            >
              <XCircle className="w-4 h-4" />
              Abandon Battle
            </button>
          ) : isCompleted && !onCooldown ? (
            <div
              className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(180deg, hsl(120 40% 22%) 0%, hsl(120 45% 16%) 100%)',
                border: '2px solid hsl(120 50% 35%)',
                color: 'hsl(120 60% 60%)',
                boxShadow: '0 3px 0 hsl(120 50% 12%)',
              }}
            >
              <CheckCircle className="w-4 h-4" />
              Defeated!
            </div>
          ) : onCooldown ? (
            <div
              className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: 'hsl(260 25% 18%)',
                border: '2px solid hsl(260 30% 30%)',
                color: 'hsl(260 20% 55%)',
              }}
            >
              <Clock className="w-4 h-4" />
              Respawns in {formatCooldown(currentStatus.cooldownRemaining)}
            </div>
          ) : activeChallenge.challenge ? (
            <div
              className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: 'hsl(260 25% 18%)',
                border: '2px solid hsl(260 30% 30%)',
                color: 'hsl(260 20% 55%)',
              }}
            >
              <Lock className="w-4 h-4" />
              Finish current battle first
            </div>
          ) : (
            <button
              onClick={() => startChallenge(currentChallenge.id)}
              className="retro-arcade-btn w-full py-3.5 text-sm tracking-wider flex items-center justify-center gap-2"
              style={{
                background: config.bg,
                borderColor: config.borderColor,
                boxShadow: `0 5px 0 ${config.borderColor}88, inset 0 2px 0 ${config.color}44, 0 0 15px ${config.color}44`,
              }}
            >
              <Zap className="w-5 h-5" />
              Start Battle
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 text-center">
          <p className="text-[10px] font-bold" style={{ color: 'hsl(260 20% 40%)' }}>
            Complete focus sessions to deal damage
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
