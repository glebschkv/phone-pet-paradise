import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLuckyWheel } from '@/hooks/useLuckyWheel';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, History, Gift, Star, Trophy, Zap } from 'lucide-react';
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

      // Add multiple full rotations for effect (more spins for excitement)
      const fullRotations = 6 * 360;
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
      }, 4500);
    } catch {
      setLocalSpinning(false);
    }
  }, [canSpin, spin, rotation, prizes, onPrizeWon]);

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-[0_0_40px_rgba(251,191,36,0.6)]';
      case 'epic': return 'shadow-[0_0_30px_rgba(168,85,247,0.5)]';
      case 'rare': return 'shadow-[0_0_20px_rgba(59,130,246,0.4)]';
      default: return 'shadow-lg';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500';
      case 'epic': return 'bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500';
      case 'rare': return 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500';
      default: return 'bg-gradient-to-br from-slate-400 to-slate-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-2">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 relative overflow-hidden">
          {/* Decorative sparkles */}
          <div className="absolute top-1 right-1 opacity-30 animate-pulse">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="absolute bottom-1 left-1 opacity-20">
            <Star className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '8s' }} />
          </div>

          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              Daily Spin
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm mt-2">
            Try your luck for amazing rewards!
          </p>

          {/* Stats row */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 p-2 rounded-lg bg-white/10 backdrop-blur-sm text-center">
              <div className="text-white font-bold">{stats.totalSpins}</div>
              <div className="text-white/60 text-xs">Total Spins</div>
            </div>
            <div className="flex-1 p-2 rounded-lg bg-white/10 backdrop-blur-sm text-center">
              <div className="text-white font-bold">{stats.jackpotsWon}</div>
              <div className="text-white/60 text-xs">Jackpots</div>
            </div>
            <div className="flex-1 p-2 rounded-lg bg-white/10 backdrop-blur-sm text-center">
              <div className="text-white font-bold">{stats.totalCoinsWon}</div>
              <div className="text-white/60 text-xs">Coins Won</div>
            </div>
          </div>
        </div>

        {/* Wheel */}
        <div className="relative p-6 flex flex-col items-center bg-gradient-to-b from-background to-muted/30">
          {/* Pointer */}
          <div className="absolute top-4 z-20">
            <div className="relative">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-lg" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-amber-200" />
            </div>
          </div>

          {/* Wheel container with outer ring */}
          <div className="relative w-72 h-72">
            {/* Outer decorative ring */}
            <div className={cn(
              "absolute inset-0 rounded-full border-8",
              localSpinning
                ? "border-amber-400 animate-pulse"
                : "border-purple-400/50",
              "shadow-xl"
            )} />

            {/* Inner spinning wheel */}
            <div
              className={cn(
                "absolute inset-2 rounded-full overflow-hidden",
                "transition-transform ease-out",
                localSpinning ? "duration-[4500ms]" : "duration-0",
                getRarityGlow(currentPrize?.rarity || '')
              )}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Segments */}
                {wheelConfig.segments.map((segment, index) => {
                  const angle = 360 / wheelConfig.segmentCount;
                  const startAngle = index * angle;
                  const endAngle = startAngle + angle;

                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  const x1 = 50 + 48 * Math.cos(startRad);
                  const y1 = 50 + 48 * Math.sin(startRad);
                  const x2 = 50 + 48 * Math.cos(endRad);
                  const y2 = 50 + 48 * Math.sin(endRad);

                  const largeArc = angle > 180 ? 1 : 0;

                  const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
                  const textX = 50 + 32 * Math.cos(midAngle);
                  const textY = 50 + 32 * Math.sin(midAngle);

                  return (
                    <g key={segment.id}>
                      <path
                        d={`M50,50 L${x1},${y1} A48,48 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="0.8"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[12px]"
                        transform={`rotate(${(startAngle + endAngle) / 2}, ${textX}, ${textY})`}
                      >
                        {segment.emoji}
                      </text>
                    </g>
                  );
                })}
                {/* Center circle */}
                <circle cx="50" cy="50" r="10" fill="white" stroke="#fbbf24" strokeWidth="3" />
                <circle cx="50" cy="50" r="6" fill="#fbbf24" />
              </svg>
            </div>
          </div>

          {/* Result display */}
          {showResult && currentPrize && (
            <div className={cn(
              "absolute inset-0 flex flex-col items-center justify-center z-30",
              "animate-in fade-in zoom-in duration-300"
            )}>
              {/* Background overlay */}
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

              {/* Content */}
              <div className="relative flex flex-col items-center">
                {/* Prize icon with glow */}
                <div className={cn(
                  "w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mb-4",
                  getRarityBg(currentPrize.rarity),
                  getRarityGlow(currentPrize.rarity),
                  currentPrize.rarity === 'legendary' && "animate-bounce"
                )}>
                  {currentPrize.emoji}
                </div>

                {/* Prize name */}
                <h3 className="text-2xl font-bold text-white mb-1">{currentPrize.name}</h3>

                {/* Rarity badge */}
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                  currentPrize.rarity === 'legendary' && "bg-amber-500/30 text-amber-300 border border-amber-400/50",
                  currentPrize.rarity === 'epic' && "bg-purple-500/30 text-purple-300 border border-purple-400/50",
                  currentPrize.rarity === 'rare' && "bg-blue-500/30 text-blue-300 border border-blue-400/50",
                  currentPrize.rarity === 'common' && "bg-slate-500/30 text-slate-300 border border-slate-400/50"
                )}>
                  {currentPrize.rarity}
                </span>

                {/* Collect button */}
                <Button
                  className={cn(
                    "mt-6 h-12 px-8 text-lg font-bold",
                    getRarityBg(currentPrize.rarity),
                    "text-white hover:opacity-90"
                  )}
                  onClick={() => setShowResult(false)}
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Collect!
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Spin button */}
        <div className="px-4 pb-4 bg-gradient-to-b from-muted/30 to-background">
          {canSpin ? (
            <Button
              className={cn(
                "w-full h-14 text-xl font-bold",
                "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500",
                "hover:from-amber-500 hover:to-orange-600",
                "shadow-lg shadow-amber-500/30",
                "border-2 border-amber-300/50",
                "active:scale-95 transition-transform"
              )}
              onClick={handleSpin}
              disabled={localSpinning}
            >
              {localSpinning ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-6 h-6 animate-pulse" />
                  Spinning...
                </span>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  SPIN NOW!
                </>
              )}
            </Button>
          ) : (
            <div className="text-center p-4 bg-muted/50 rounded-xl border-2 border-muted">
              <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">
                Next spin in <span className="text-foreground">{timeUntilNext.hours}h {timeUntilNext.minutes}m</span>
              </p>
            </div>
          )}
        </div>

        {/* Recent wins */}
        <div className="p-4 border-t-2 bg-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Recent Wins
            </span>
            <span className="text-xs text-muted-foreground">
              Tap to view history
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentWins.length > 0 ? (
              recentWins.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-2 transition-transform hover:scale-105",
                    result.prize.rarity === 'legendary' && "bg-amber-500/20 border-amber-400/50 shadow-amber-500/20 shadow-md",
                    result.prize.rarity === 'epic' && "bg-purple-500/20 border-purple-400/50 shadow-purple-500/20 shadow-md",
                    result.prize.rarity === 'rare' && "bg-blue-500/20 border-blue-400/50",
                    result.prize.rarity === 'common' && "bg-muted border-muted-foreground/20"
                  )}
                >
                  {result.prize.emoji}
                </div>
              ))
            ) : (
              <div className="flex-1 text-center py-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No spins yet. Try your luck!</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
