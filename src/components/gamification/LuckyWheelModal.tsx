import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLuckyWheel } from '@/hooks/useLuckyWheel';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, History, Gift, Star, Zap } from 'lucide-react';
import { LuckyWheelPrize } from '@/data/GamificationData';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrizeWon?: (prize: LuckyWheelPrize) => void;
}

export const LuckyWheelModal = ({ isOpen, onClose, onPrizeWon }: LuckyWheelModalProps) => {
  const {
    isSpinning,
    canSpinToday,
    getTimeUntilNextSpin,
    spin,
    getWheelConfig,
    getStats,
    getRecentWins,
    prizes,
  } = useLuckyWheel();

  const [rotation, setRotation] = useState(0);
  const [currentPrize, setCurrentPrize] = useState<LuckyWheelPrize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [localSpinning, setLocalSpinning] = useState(false);

  const wheelConfig = getWheelConfig();
  const stats = getStats();
  const recentWins = getRecentWins(5);
  const timeUntilNext = getTimeUntilNextSpin();
  const canSpin = canSpinToday() && !isSpinning && !localSpinning;

  const handleSpin = useCallback(async () => {
    if (!canSpin) return;

    setLocalSpinning(true);
    setShowResult(false);
    setCurrentPrize(null);

    try {
      const prize = await spin();

      // Calculate target rotation
      const prizeIndex = prizes.findIndex(p => p.id === prize.id);
      const segmentAngle = 360 / prizes.length;
      const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);

      // Add multiple full rotations for effect
      const fullRotations = 5 * 360;
      const newRotation = rotation + fullRotations + targetAngle;

      setRotation(newRotation);
      setCurrentPrize(prize);

      // Show result after animation
      setTimeout(() => {
        setShowResult(true);
        setLocalSpinning(false);
        if (onPrizeWon) {
          onPrizeWon(prize);
        }
      }, 4000);
    } catch {
      setLocalSpinning(false);
    }
  }, [canSpin, spin, rotation, prizes, onPrizeWon]);

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-[0_0_30px_rgba(251,191,36,0.8)]';
      case 'epic': return 'shadow-[0_0_20px_rgba(168,85,247,0.6)]';
      case 'rare': return 'shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      default: return '';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400';
      case 'epic': return 'border-purple-400';
      case 'rare': return 'border-blue-400';
      default: return 'border-purple-600/50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden retro-modal">
        {/* Retro Header */}
        <div className="retro-modal-header">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-3 retro-pixel-text">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center border-2 border-pink-400">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="retro-neon-pink">LUCKY SPIN</span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-purple-200/80 text-sm mt-2">
            Spin daily for awesome prizes!
          </p>
        </div>

        {/* Wheel Section */}
        <div className="relative p-6 flex flex-col items-center bg-gradient-to-b from-purple-900/50 to-transparent">
          {/* Decorative Lights */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-3">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full",
                  localSpinning
                    ? "animate-pulse bg-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                    : i % 2 === 0
                    ? "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                    : "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>

          {/* Pointer */}
          <div className="absolute top-12 z-10 retro-wheel-pointer">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-yellow-400" />
            <Star className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-300" />
          </div>

          {/* Wheel Container */}
          <div className="relative w-60 h-60 mt-6">
            <div
              className={cn(
                "w-full h-full rounded-full overflow-hidden retro-wheel",
                "transition-transform duration-[4000ms] ease-out",
                getRarityGlow(currentPrize?.rarity || '')
              )}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {wheelConfig.segments.map((segment, index) => {
                  const angle = 360 / wheelConfig.segmentCount;
                  const startAngle = index * angle;
                  const endAngle = startAngle + angle;

                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  const x1 = 50 + 50 * Math.cos(startRad);
                  const y1 = 50 + 50 * Math.sin(startRad);
                  const x2 = 50 + 50 * Math.cos(endRad);
                  const y2 = 50 + 50 * Math.sin(endRad);

                  const largeArc = angle > 180 ? 1 : 0;

                  const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
                  const textX = 50 + 32 * Math.cos(midAngle);
                  const textY = 50 + 32 * Math.sin(midAngle);

                  return (
                    <g key={segment.id}>
                      <path
                        d={`M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={segment.color}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="0.5"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[10px] fill-white font-bold"
                        transform={`rotate(${(startAngle + endAngle) / 2}, ${textX}, ${textY})`}
                      >
                        {segment.emoji}
                      </text>
                    </g>
                  );
                })}
                {/* Center Hub */}
                <circle cx="50" cy="50" r="10" fill="url(#centerGradient)" stroke="#fbbf24" strokeWidth="3" />
                <defs>
                  <radialGradient id="centerGradient">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Result Overlay */}
          {showResult && currentPrize && (
            <div className={cn(
              "absolute inset-0 bg-purple-950/95 flex flex-col items-center justify-center",
              "animate-in fade-in zoom-in duration-300"
            )}>
              <div className="retro-game-card p-6 text-center">
                <div className={cn(
                  "text-6xl mb-3",
                  currentPrize.rarity === 'legendary' && "animate-bounce"
                )}>
                  {currentPrize.emoji}
                </div>
                <h3 className="text-xl font-bold text-white retro-pixel-text">
                  {currentPrize.name}
                </h3>
                <p className={cn(
                  "text-sm capitalize mt-2 retro-pixel-text",
                  currentPrize.rarity === 'legendary' && "retro-neon-yellow",
                  currentPrize.rarity === 'epic' && "retro-neon-pink",
                  currentPrize.rarity === 'rare' && "retro-neon-text",
                  currentPrize.rarity === 'common' && "text-purple-400"
                )}>
                  {currentPrize.rarity}
                </p>
                <button
                  className="mt-4 retro-arcade-btn retro-arcade-btn-green px-6 py-3 text-sm flex items-center gap-2 mx-auto touch-manipulation select-none active:scale-95"
                  onClick={() => setShowResult(false)}
                >
                  <Gift className="w-4 h-4" />
                  COLLECT
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spin Button */}
        <div className="px-6 pb-4">
          {canSpin ? (
            <button
              className={cn(
                "w-full retro-arcade-btn retro-arcade-btn-yellow py-4 text-lg flex items-center justify-center gap-2 touch-manipulation select-none",
                localSpinning ? "opacity-50 cursor-not-allowed" : "active:scale-95"
              )}
              onClick={handleSpin}
              disabled={localSpinning}
            >
              {localSpinning ? (
                <span className="animate-pulse retro-pixel-text">SPINNING...</span>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span className="retro-pixel-text">SPIN!</span>
                </>
              )}
            </button>
          ) : (
            <div className="retro-game-card p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-purple-400">
                <Clock className="w-4 h-4" />
                <span className="retro-pixel-text">
                  Next spin in {timeUntilNext.hours}h {timeUntilNext.minutes}m
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stats and History */}
        <div className="p-4 border-t-2 border-purple-700/50 bg-purple-900/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium flex items-center gap-1 text-cyan-400 retro-pixel-text">
              <History className="w-4 h-4" />
              RECENT WINS
            </span>
            <span className="text-xs text-purple-400 retro-pixel-text">
              {stats.totalSpins} spins
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentWins.length > 0 ? (
              recentWins.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-xl",
                    "retro-icon-badge",
                    getRarityBorder(result.prize.rarity)
                  )}
                >
                  {result.prize.emoji}
                </div>
              ))
            ) : (
              <p className="text-sm text-purple-400 retro-pixel-text">No spins yet!</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
