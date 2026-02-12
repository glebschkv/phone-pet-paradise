import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLuckyWheel, SpinResult } from '@/hooks/useLuckyWheel';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, History, Gift, Zap, X, Crown } from 'lucide-react';
import { LuckyWheelPrize } from '@/data/GamificationData';
import { PixelIcon } from '@/components/ui/PixelIcon';

// Single source of truth for animation timing
const SPIN_DURATION_MS = 6500;
const SPIN_FULL_ROTATIONS = 3;
const SPIN_EASING = 'cubic-bezier(0.12, 0.8, 0.18, 1)';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrizeWon?: (prize: LuckyWheelPrize) => void;
}

export const LuckyWheelModal = ({ isOpen, onClose, onPrizeWon }: LuckyWheelModalProps) => {
  const {
    isSpinning,
    canSpinToday,
    spinsRemainingToday,
    getTimeUntilNextSpin,
    spin,
    getWheelConfig,
    getStats,
    getRecentWins,
    prizes,
  } = useLuckyWheel();

  const { getDailySpinLimit, isPremium } = usePremiumStatus();
  const dailySpinLimit = getDailySpinLimit();

  const [rotation, setRotation] = useState(0);
  const [currentPrize, setCurrentPrize] = useState<LuckyWheelPrize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [localSpinning, setLocalSpinning] = useState(false);
  const [highlightSegment, setHighlightSegment] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedWin, setSelectedWin] = useState<SpinResult | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const wheelConfig = getWheelConfig();
  const stats = getStats();
  const recentWins = getRecentWins(5);
  const timeUntilNext = getTimeUntilNextSpin();
  const remaining = spinsRemainingToday(dailySpinLimit);
  const canSpin = canSpinToday(dailySpinLimit) && !isSpinning && !localSpinning;

  // Listen for transitionend to precisely sync reward reveal
  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return;
      if (!localSpinning || !currentPrize) return;

      // Brief highlight of winning segment before overlay
      const prizeIndex = prizes.findIndex(p => p.id === currentPrize.id);
      setHighlightSegment(prizeIndex);

      const isSpecial = currentPrize.rarity === 'legendary' || currentPrize.rarity === 'epic';
      const highlightDelay = isSpecial ? 800 : 400;

      if (isSpecial) {
        setShowCelebration(true);
      }

      setTimeout(() => {
        setShowResult(true);
        setLocalSpinning(false);
        setHighlightSegment(null);
        setShowCelebration(false);
        if (onPrizeWon) {
          onPrizeWon(currentPrize);
        }
      }, highlightDelay);
    };

    el.addEventListener('transitionend', handleTransitionEnd);
    return () => el.removeEventListener('transitionend', handleTransitionEnd);
  }, [localSpinning, currentPrize, prizes, onPrizeWon]);

  // Memoize expensive SVG path calculations
  const wheelPaths = useMemo(() => {
    return wheelConfig.segments.map((segment, index) => {
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
      const textRotation = (startAngle + endAngle) / 2;

      // Peg positions at segment boundaries (outer edge)
      const pegX = 50 + 47 * Math.cos(startRad);
      const pegY = 50 + 47 * Math.sin(startRad);

      return {
        segment,
        index,
        path: `M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`,
        textX,
        textY,
        textRotation,
        pegX,
        pegY,
        gradientId: `seg-grad-${index}`,
      };
    });
  }, [wheelConfig]);

  const handleSpin = useCallback(async () => {
    if (!canSpin) return;

    setLocalSpinning(true);
    setShowResult(false);
    setCurrentPrize(null);
    setHighlightSegment(null);
    setShowCelebration(false);

    try {
      const prize = await spin(dailySpinLimit);

      // Calculate target rotation — account for current wheel position
      // so subsequent spins land on the correct segment visually.
      const prizeIndex = prizes.findIndex(p => p.id === prize.id);
      const segmentAngle = 360 / prizes.length;
      const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);

      const currentAngle = rotation % 360;
      const additionalAngle = (targetAngle - currentAngle + 360) % 360;
      const fullRotations = SPIN_FULL_ROTATIONS * 360;
      const newRotation = rotation + fullRotations + additionalAngle;

      setRotation(newRotation);
      setCurrentPrize(prize);
    } catch {
      setLocalSpinning(false);
    }
  }, [canSpin, spin, rotation, prizes, dailySpinLimit]);

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-[0_0_40px_rgba(251,191,36,0.9),0_0_80px_rgba(251,191,36,0.4)]';
      case 'epic': return 'shadow-[0_0_30px_rgba(168,85,247,0.7),0_0_60px_rgba(168,85,247,0.3)]';
      case 'rare': return 'shadow-[0_0_20px_rgba(59,130,246,0.6)]';
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

  // Lighten a hex color for segment gradient highlights
  const lightenColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `rgb(${r},${g},${b})`;
  };

  const darkenColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `rgb(${r},${g},${b})`;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const getPrizeDescription = (prize: LuckyWheelPrize): string => {
    switch (prize.type) {
      case 'coins': return `${prize.amount} coins added to your balance`;
      case 'xp': return `${prize.amount} XP gained`;
      case 'jackpot': return `${prize.amount} coins jackpot bonus!`;
      case 'streak_freeze': return 'Protects your streak for 1 day';
      case 'booster': return '3x coin multiplier on next session';
      case 'mystery_box': return 'A surprise reward was unlocked';
      default: return prize.name;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
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
        <div className={cn(
          "relative p-6 flex flex-col items-center",
          "wheel-section-bg",
          localSpinning && "wheel-section-spinning"
        )}>
          {/* Background glow behind wheel */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            "wheel-bg-glow",
            localSpinning ? "opacity-100" : "opacity-30"
          )} />

          {/* Celebration burst for epic/legendary */}
          {showCelebration && (
            <div className="absolute inset-0 z-20 pointer-events-none wheel-celebration-burst" />
          )}

          {/* Decorative Lights */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-3 z-10">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  localSpinning
                    ? "wheel-light-chasing"
                    : i % 3 === 0
                    ? "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                    : i % 3 === 1
                    ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                    : "bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                )}
                style={{
                  animationDelay: localSpinning ? `${i * 0.12}s` : undefined,
                }}
              />
            ))}
          </div>

          {/* SVG Pointer - proper arrowhead with depth */}
          <div className={cn(
            "absolute top-12 z-10",
            localSpinning && "wheel-pointer-ticking"
          )}>
            <svg width="32" height="36" viewBox="0 0 32 36" className="wheel-pointer-svg">
              <defs>
                <linearGradient id="pointerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="pointerShadowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>
                <filter id="pointerGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Shadow layer */}
              <polygon points="16,34 6,6 26,6" fill="url(#pointerShadowGrad)" opacity="0.5" transform="translate(1, 1)" />
              {/* Main pointer */}
              <polygon points="16,34 4,4 28,4" fill="url(#pointerGrad)" stroke="#fbbf24" strokeWidth="1" filter="url(#pointerGlow)" />
              {/* Highlight edge */}
              <polygon points="16,30 8,6 16,4" fill="rgba(255,255,255,0.25)" />
              {/* Center dot */}
              <circle cx="16" cy="12" r="3.5" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" />
              <circle cx="16" cy="12" r="1.5" fill="#fbbf24" />
            </svg>
          </div>

          {/* Wheel Container */}
          <div className={cn(
            "relative w-64 h-64 mt-6",
            showCelebration && currentPrize?.rarity === 'legendary' && "wheel-screen-shake"
          )}>
            {/* Outer decorative ring */}
            <div className="absolute -inset-2 rounded-full wheel-outer-ring" />

            <div
              ref={wheelRef}
              className={cn(
                "w-full h-full rounded-full overflow-hidden retro-wheel",
                getRarityGlow(showResult ? (currentPrize?.rarity || '') : '')
              )}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: localSpinning
                  ? `transform ${SPIN_DURATION_MS}ms ${SPIN_EASING}`
                  : 'none',
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  {/* Segment gradients for 3D depth */}
                  {wheelPaths.map(({ segment, gradientId }) => (
                    <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={lightenColor(segment.color, 30)} />
                      <stop offset="60%" stopColor={segment.color} />
                      <stop offset="100%" stopColor={darkenColor(segment.color, 40)} />
                    </linearGradient>
                  ))}
                  {/* Inner shadow overlay for curvature */}
                  <radialGradient id="wheelInnerShadow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="60%" stopColor="rgba(0,0,0,0)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                  </radialGradient>
                  {/* Highlight overlay for top-light effect */}
                  <radialGradient id="wheelHighlight" cx="40%" cy="30%" r="60%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>
                  <radialGradient id="centerGradient">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="40%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </radialGradient>
                  <radialGradient id="centerHighlight" cx="40%" cy="35%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                  <filter id="segmentGlow">
                    <feGaussianBlur stdDeviation="1.5" />
                  </filter>
                </defs>

                {/* Segments with gradient fills */}
                {wheelPaths.map(({ segment, path, textX, textY, textRotation, gradientId, index }) => (
                  <g key={segment.id}>
                    <path
                      d={path}
                      fill={`url(#${gradientId})`}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="0.3"
                    />
                    {/* Segment separator lines - gold */}
                    <path
                      d={path}
                      fill="none"
                      stroke="rgba(251,191,36,0.3)"
                      strokeWidth="0.6"
                    />
                    {/* Highlight flash on winning segment */}
                    {highlightSegment === index && (
                      <path
                        d={path}
                        fill="rgba(255,255,255,0.5)"
                        className="wheel-segment-flash"
                      />
                    )}
                    {/* Icon */}
                    <image
                      href={`/assets/icons/${segment.icon}.png`}
                      x={textX - 5}
                      y={textY - 5}
                      width="10"
                      height="10"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                    />
                  </g>
                ))}

                {/* Inner shadow overlay for 3D curvature */}
                <circle cx="50" cy="50" r="50" fill="url(#wheelInnerShadow)" />
                {/* Top-light highlight */}
                <circle cx="50" cy="50" r="50" fill="url(#wheelHighlight)" />

                {/* Pegs at segment boundaries */}
                {wheelPaths.map(({ pegX, pegY }, i) => (
                  <g key={`peg-${i}`}>
                    <circle cx={pegX} cy={pegY} r="1.8" fill="#d97706" />
                    <circle cx={pegX} cy={pegY} r="1.3" fill="#fbbf24" />
                    <circle cx={pegX - 0.3} cy={pegY - 0.3} r="0.5" fill="#fef3c7" opacity="0.7" />
                  </g>
                ))}

                {/* Center Hub - layered for depth */}
                {/* Outer ring */}
                <circle cx="50" cy="50" r="12" fill="#92400e" />
                <circle cx="50" cy="50" r="11" fill="url(#centerGradient)" stroke="#fbbf24" strokeWidth="1.5" />
                {/* Inner ring */}
                <circle cx="50" cy="50" r="7" fill="#d97706" stroke="#fbbf24" strokeWidth="0.8" />
                {/* Highlight */}
                <circle cx="50" cy="50" r="7" fill="url(#centerHighlight)" />
                {/* Center bolt */}
                <circle cx="50" cy="50" r="3" fill="#fef3c7" />
                <circle cx="49" cy="49" r="1.2" fill="rgba(255,255,255,0.6)" />
              </svg>
            </div>
          </div>

          {/* Result Overlay */}
          {showResult && currentPrize && (
            <div className={cn(
              "absolute inset-0 flex flex-col items-center justify-center z-30",
              "wheel-result-overlay"
            )}>
              <div className={cn(
                "retro-game-card p-6 text-center wheel-result-card",
                currentPrize.rarity === 'legendary' && "wheel-result-legendary",
                currentPrize.rarity === 'epic' && "wheel-result-epic"
              )}>
                <div className={cn(
                  "mb-3 flex items-center justify-center",
                  currentPrize.rarity === 'legendary' && "animate-bounce"
                )}>
                  <PixelIcon name={currentPrize.icon} size={64} />
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
        <div className="px-6 pb-4 space-y-2">
          {canSpin ? (
            <>
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
              {dailySpinLimit > 1 && (
                <p className="text-center text-xs retro-pixel-text" style={{ color: 'hsl(260 30% 60%)' }}>
                  {remaining} / {dailySpinLimit} spins remaining today
                </p>
              )}
            </>
          ) : (
            <div className="retro-game-card p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-purple-400">
                <Clock className="w-4 h-4" />
                <span className="retro-pixel-text">
                  Next spin in {timeUntilNext.hours}h {timeUntilNext.minutes}m
                </span>
              </div>
              {!isPremium && (
                <p className="text-[10px] flex items-center justify-center gap-1" style={{ color: 'hsl(35 80% 60%)' }}>
                  <Crown className="w-3 h-3" />
                  <span>Premium members get up to 5 spins/day</span>
                </p>
              )}
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
                <button
                  key={index}
                  onClick={() => setSelectedWin(result)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-xl",
                    "retro-icon-badge cursor-pointer transition-transform hover:scale-110 active:scale-95",
                    getRarityBorder(result.prize.rarity)
                  )}
                >
                  <PixelIcon name={result.prize.icon} size={28} />
                </button>
              ))
            ) : (
              <p className="text-sm text-purple-400 retro-pixel-text">No spins yet!</p>
            )}
          </div>

          {/* Reward Detail Popup */}
          {selectedWin && (
            <div className="mt-3 relative animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className={cn(
                "retro-game-card p-4 border-2",
                getRarityBorder(selectedWin.prize.rarity)
              )}>
                <button
                  onClick={() => setSelectedWin(null)}
                  className="absolute top-2 right-2 text-purple-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0",
                    "retro-icon-badge",
                    getRarityBorder(selectedWin.prize.rarity),
                    getRarityGlow(selectedWin.prize.rarity)
                  )}>
                    <PixelIcon name={selectedWin.prize.icon} size={36} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold retro-pixel-text text-sm">
                      {selectedWin.prize.name}
                    </h4>
                    <p className="text-purple-300 text-xs mt-0.5">
                      {getPrizeDescription(selectedWin.prize)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn(
                        "text-xs capitalize retro-pixel-text px-1.5 py-0.5 rounded",
                        selectedWin.prize.rarity === 'legendary' && "bg-yellow-500/20 retro-neon-yellow",
                        selectedWin.prize.rarity === 'epic' && "bg-purple-500/20 retro-neon-pink",
                        selectedWin.prize.rarity === 'rare' && "bg-blue-500/20 retro-neon-text",
                        selectedWin.prize.rarity === 'common' && "bg-purple-500/10 text-purple-400"
                      )}>
                        {selectedWin.prize.rarity}
                      </span>
                      <span className="text-xs text-purple-500">
                        {formatTimeAgo(selectedWin.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
