import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMilestoneCelebrations } from '@/hooks/useMilestoneCelebrations';
import { cn } from '@/lib/utils';
import { Milestone } from '@/data/GamificationData';
import { Sparkles, Gift } from 'lucide-react';
import { PixelIcon } from '@/components/ui/PixelIcon';

interface MilestoneCelebrationProps {
  onClaimReward?: (milestone: Milestone) => void;
}

export const MilestoneCelebration = ({ onClaimReward }: MilestoneCelebrationProps) => {
  const { showCelebration, pendingCelebration, dismissCelebration, getCelebrationType } = useMilestoneCelebrations();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);
  const lastCelebrationRef = useRef<Milestone | null>(null);
  if (pendingCelebration) lastCelebrationRef.current = pendingCelebration;

  const celebrationType = getCelebrationType();

  useEffect(() => {
    if (showCelebration && pendingCelebration) {
      const newParticles = [];
      const colors = getParticleColors(celebrationType || 'confetti');

      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 1,
        });
      }
      setParticles(newParticles);
    }
  }, [showCelebration, pendingCelebration, celebrationType]);

  const getParticleColors = (type: string): string[] => {
    switch (type) {
      case 'confetti':
        return ['#f43f5e', '#8b5cf6', '#3b82f6', '#22c55e', '#f97316', '#fbbf24'];
      case 'fireworks':
        return ['#fbbf24', '#f97316', '#ef4444', '#ec4899', '#f43f5e'];
      case 'stars':
        return ['#fbbf24', '#f59e0b', '#fcd34d', '#fef3c7'];
      case 'rainbow':
        return ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
      default:
        return ['#3b82f6', '#8b5cf6', '#22c55e'];
    }
  };

  const handleClaim = () => {
    if (pendingCelebration && onClaimReward) {
      onClaimReward(pendingCelebration);
    }
    dismissCelebration();
  };

  const displayCelebration = pendingCelebration || lastCelebrationRef.current;
  if (!displayCelebration) return null;

  return (
    <Dialog open={showCelebration && !!pendingCelebration} onOpenChange={handleClaim}>
      <DialogContent className="retro-modal max-w-[320px] p-0 overflow-hidden border-0">
        <VisuallyHidden>
          <DialogTitle>Milestone Celebration</DialogTitle>
        </VisuallyHidden>

        {/* Header with particles */}
        <div className="retro-modal-header relative overflow-hidden" style={{ padding: '32px 24px 24px' }}>
          <div className="retro-scanlines opacity-15" />

          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(particle => (
              <div
                key={particle.id}
                className="absolute animate-celebration-particle"
                style={{
                  left: `${particle.x}%`,
                  top: '-10%',
                  backgroundColor: particle.color,
                  width: celebrationType === 'stars' ? '10px' : '6px',
                  height: celebrationType === 'stars' ? '10px' : '6px',
                  borderRadius: celebrationType === 'stars' ? '0' : '50%',
                  transform: celebrationType === 'stars' ? 'rotate(45deg)' : 'none',
                  animationDelay: `${particle.delay}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-[1] text-center">
            {/* Icon */}
            <div className="relative inline-block mb-3">
              <div
                className="absolute inset-0 rounded-full blur-xl scale-[2.5]"
                style={{ background: 'hsl(45 100% 50% / 0.2)' }}
              />
              <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
                <PixelIcon name={displayCelebration.emoji} size={80} />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-amber-300 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
            </div>

            {/* Title */}
            <h2
              className="text-2xl font-black uppercase tracking-tight text-white mb-1"
              style={{ textShadow: '0 0 15px hsl(45 100% 50% / 0.5), 0 0 30px hsl(280 80% 60% / 0.3), 0 2px 0 rgba(0,0,0,0.3)' }}
            >
              {displayCelebration.title}
            </h2>
            <p className="text-sm text-purple-200/80" style={{ textShadow: '0 1px 0 rgba(0,0,0,0.3)' }}>
              {displayCelebration.description}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Rewards */}
          {displayCelebration.rewards && (
            <div className="space-y-1.5">
              <div
                className="text-[9px] font-black uppercase tracking-[0.2em] text-center"
                style={{ color: 'hsl(260 25% 45%)' }}
              >
                Rewards
              </div>
              <div className="space-y-1.5">
                {displayCelebration.rewards.xp && (
                  <div className="retro-reward-item legendary">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'hsl(260 30% 18%)',
                        border: '2px solid hsl(260 35% 30%)',
                      }}
                    >
                      <PixelIcon name="star" size={16} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-amber-300">+{displayCelebration.rewards.xp} XP</span>
                    </div>
                  </div>
                )}
                {displayCelebration.rewards.coins && (
                  <div className="retro-reward-item legendary">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'hsl(260 30% 18%)',
                        border: '2px solid hsl(260 35% 30%)',
                      }}
                    >
                      <PixelIcon name="coin" size={16} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-amber-300">+{displayCelebration.rewards.coins} Coins</span>
                    </div>
                  </div>
                )}
                {displayCelebration.rewards.badge && (
                  <div className="retro-reward-item epic">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'hsl(280 30% 20%)',
                        border: '2px solid hsl(280 40% 35%)',
                      }}
                    >
                      <PixelIcon name="sports-medal" size={16} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-purple-200/90">New Badge!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Claim button */}
          <button
            onClick={handleClaim}
            className={cn(
              "retro-arcade-btn retro-arcade-btn-green w-full py-3 text-sm tracking-wider touch-manipulation",
              "flex items-center justify-center gap-2"
            )}
          >
            <Gift className="w-5 h-5" />
            Claim Rewards!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
