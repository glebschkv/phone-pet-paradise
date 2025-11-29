import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMilestoneCelebrations } from '@/hooks/useMilestoneCelebrations';
import { cn } from '@/lib/utils';
import { Milestone } from '@/data/GamificationData';
import { PartyPopper, Sparkles, Star, Gift } from 'lucide-react';

interface MilestoneCelebrationProps {
  onClaimReward?: (milestone: Milestone) => void;
}

export const MilestoneCelebration = ({ onClaimReward }: MilestoneCelebrationProps) => {
  const { showCelebration, pendingCelebration, dismissCelebration, getCelebrationType } = useMilestoneCelebrations();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);

  const celebrationType = getCelebrationType();

  // Generate celebration particles
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

  const getBackgroundGradient = (type: string | null): string => {
    switch (type) {
      case 'fireworks':
        return 'from-indigo-900 via-purple-900 to-pink-900';
      case 'stars':
        return 'from-yellow-900 via-amber-800 to-orange-900';
      case 'rainbow':
        return 'from-pink-500 via-purple-500 to-blue-500';
      default:
        return 'from-blue-600 via-purple-600 to-pink-600';
    }
  };

  const handleClaim = () => {
    if (pendingCelebration && onClaimReward) {
      onClaimReward(pendingCelebration);
    }
    dismissCelebration();
  };

  if (!showCelebration || !pendingCelebration) {
    return null;
  }

  return (
    <Dialog open={showCelebration} onOpenChange={handleClaim}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-0">
        {/* Celebration background */}
        <div className={cn(
          "relative min-h-[400px] flex flex-col items-center justify-center p-6",
          "bg-gradient-to-br",
          getBackgroundGradient(celebrationType)
        )}>
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(particle => (
              <div
                key={particle.id}
                className="absolute animate-celebration-particle"
                style={{
                  left: `${particle.x}%`,
                  top: `-10%`,
                  backgroundColor: particle.color,
                  width: celebrationType === 'stars' ? '12px' : '8px',
                  height: celebrationType === 'stars' ? '12px' : '8px',
                  borderRadius: celebrationType === 'stars' ? '0' : '50%',
                  transform: celebrationType === 'stars' ? 'rotate(45deg)' : 'none',
                  animationDelay: `${particle.delay}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Content */}
          <div className="relative z-10 text-center space-y-4">
            {/* Icon */}
            <div className="relative inline-block">
              <div className="text-8xl animate-bounce">
                {pendingCelebration.emoji}
              </div>
              <div className="absolute -top-2 -right-2">
                {celebrationType === 'stars' ? (
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                ) : celebrationType === 'fireworks' ? (
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-ping" />
                ) : (
                  <PartyPopper className="w-8 h-8 text-white animate-pulse" />
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-1 animate-in slide-in-from-bottom duration-500">
                {pendingCelebration.title}
              </h2>
              <p className="text-white/80 text-lg animate-in slide-in-from-bottom duration-700">
                {pendingCelebration.description}
              </p>
            </div>

            {/* Rewards */}
            {pendingCelebration.rewards && (
              <div className="flex items-center justify-center gap-4 mt-4 animate-in fade-in duration-1000">
                {pendingCelebration.rewards.xp && (
                  <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-yellow-400">+{pendingCelebration.rewards.xp}</div>
                    <div className="text-white/70 text-sm">XP</div>
                  </div>
                )}
                {pendingCelebration.rewards.coins && (
                  <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-amber-400">+{pendingCelebration.rewards.coins}</div>
                    <div className="text-white/70 text-sm">Coins</div>
                  </div>
                )}
                {pendingCelebration.rewards.badge && (
                  <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                    <div className="text-2xl">🏅</div>
                    <div className="text-white/70 text-sm">Badge</div>
                  </div>
                )}
              </div>
            )}

            {/* Claim button */}
            <Button
              size="lg"
              onClick={handleClaim}
              className="mt-6 bg-white text-purple-600 hover:bg-white/90 font-bold px-8 animate-in slide-in-from-bottom duration-1000"
            >
              <Gift className="w-5 h-5 mr-2" />
              Claim Rewards!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add this CSS to your global styles for the particle animation
// @keyframes celebration-particle {
//   0% { transform: translateY(0) rotate(0deg); opacity: 1; }
//   100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
// }
// .animate-celebration-particle {
//   animation: celebration-particle 2s ease-out forwards;
// }
