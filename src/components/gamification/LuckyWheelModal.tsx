import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLuckyWheel } from '@/hooks/useLuckyWheel';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, History, Gift } from 'lucide-react';
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
      case 'legendary': return 'shadow-[0_0_30px_rgba(251,191,36,0.5)]';
      case 'epic': return 'shadow-[0_0_20px_rgba(168,85,247,0.4)]';
      case 'rare': return 'shadow-[0_0_15px_rgba(59,130,246,0.3)]';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Lucky Wheel
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm mt-1">
            Spin daily for free rewards!
          </p>
        </div>

        {/* Wheel */}
        <div className="relative p-4 flex flex-col items-center">
          {/* Pointer */}
          <div className="absolute top-2 z-10">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 drop-shadow-lg" />
          </div>

          {/* Wheel container */}
          <div className="relative w-64 h-64">
            <div
              className={cn(
                "w-full h-full rounded-full border-4 border-yellow-400 overflow-hidden",
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
                  const textX = 50 + 30 * Math.cos(midAngle);
                  const textY = 50 + 30 * Math.sin(midAngle);

                  return (
                    <g key={segment.id}>
                      <path
                        d={`M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[8px] fill-white font-bold"
                        transform={`rotate(${(startAngle + endAngle) / 2}, ${textX}, ${textY})`}
                      >
                        {segment.emoji}
                      </text>
                    </g>
                  );
                })}
                {/* Center circle */}
                <circle cx="50" cy="50" r="8" fill="white" stroke="#fbbf24" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Result display */}
          {showResult && currentPrize && (
            <div className={cn(
              "absolute inset-0 bg-black/80 flex flex-col items-center justify-center",
              "animate-in fade-in zoom-in duration-300"
            )}>
              <div className={cn(
                "text-6xl mb-2",
                currentPrize.rarity === 'legendary' && "animate-bounce"
              )}>
                {currentPrize.emoji}
              </div>
              <h3 className="text-xl font-bold text-white">{currentPrize.name}</h3>
              <p className={cn(
                "text-sm capitalize mt-1",
                currentPrize.rarity === 'legendary' && "text-yellow-400",
                currentPrize.rarity === 'epic' && "text-purple-400",
                currentPrize.rarity === 'rare' && "text-blue-400",
                currentPrize.rarity === 'common' && "text-gray-400"
              )}>
                {currentPrize.rarity}
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowResult(false)}
              >
                <Gift className="w-4 h-4 mr-2" />
                Collect
              </Button>
            </div>
          )}
        </div>

        {/* Spin button */}
        <div className="px-4 pb-4">
          {canSpin ? (
            <Button
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
              onClick={handleSpin}
              disabled={localSpinning}
            >
              {localSpinning ? (
                <span className="animate-pulse">Spinning...</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  SPIN!
                </>
              )}
            </Button>
          ) : (
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Next spin in {timeUntilNext.hours}h {timeUntilNext.minutes}m</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats and history */}
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium flex items-center gap-1">
              <History className="w-4 h-4" />
              Recent Wins
            </span>
            <span className="text-xs text-muted-foreground">
              {stats.totalSpins} total spins
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentWins.length > 0 ? (
              recentWins.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-xl",
                    result.prize.rarity === 'legendary' && "bg-yellow-500/20 border border-yellow-500/50",
                    result.prize.rarity === 'epic' && "bg-purple-500/20 border border-purple-500/50",
                    result.prize.rarity === 'rare' && "bg-blue-500/20 border border-blue-500/50",
                    result.prize.rarity === 'common' && "bg-gray-500/20 border border-gray-500/50"
                  )}
                >
                  {result.prize.emoji}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No spins yet. Try your luck!</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
