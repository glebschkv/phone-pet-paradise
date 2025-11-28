import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WheelSegment, SpinResult } from "@/hooks/useSpinWheel";
import { useState, useEffect } from "react";

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpin: () => Promise<SpinResult>;
  onClaimReward: (segment: WheelSegment) => void;
  segments: WheelSegment[];
  canSpin: boolean;
  isSpinning: boolean;
  timeUntilNextSpin: string;
}

export const SpinWheelModal = ({
  isOpen,
  onClose,
  onSpin,
  onClaimReward,
  segments,
  canSpin,
  isSpinning,
  timeUntilNextSpin,
}: SpinWheelModalProps) => {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setResult(null);
      setShowResult(false);
    }
  }, [isOpen]);

  const handleSpin = async () => {
    if (!canSpin || isSpinning) return;

    setShowResult(false);
    setResult(null);

    const spinResult = await onSpin();
    setRotation(spinResult.rotation);

    // Show result after animation
    setTimeout(() => {
      setResult(spinResult.segment);
      setShowResult(true);
    }, 4000);
  };

  const handleClaim = () => {
    if (result) {
      onClaimReward(result);
      onClose();
    }
  };

  const segmentAngle = 360 / segments.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto retro-card border-2 border-border max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div
          className="p-6 text-center"
          style={{
            background: 'linear-gradient(180deg, hsl(45 100% 50% / 0.3) 0%, transparent 100%)',
          }}
        >
          <div className="text-4xl mb-2">🎡</div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Daily Spin!
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Spin the wheel for a chance to win rewards!
          </p>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* Wheel Container */}
          <div className="relative flex items-center justify-center">
            {/* Pointer/Arrow at top */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 z-20"
              style={{
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '20px solid #f59e0b',
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
              }}
            />

            {/* Wheel */}
            <div
              className="relative w-64 h-64 rounded-full shadow-xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                  : 'none',
                background: 'conic-gradient(from 0deg, ' +
                  segments.map((seg, i) =>
                    `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
                  ).join(', ') + ')',
                border: '4px solid #1f2937',
                boxShadow: '0 0 0 4px #f59e0b, 0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              {/* Segment Labels */}
              {segments.map((segment, index) => {
                const angle = index * segmentAngle + segmentAngle / 2;
                const radians = (angle - 90) * (Math.PI / 180);
                const radius = 85;
                const x = Math.cos(radians) * radius;
                const y = Math.sin(radians) * radius;

                return (
                  <div
                    key={segment.id}
                    className="absolute text-white font-bold text-xs drop-shadow-lg"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    <span className="text-lg">{segment.icon}</span>
                    <br />
                    {segment.shortLabel}
                  </div>
                );
              })}

              {/* Center Circle */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                  border: '3px solid #1f2937',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
                }}
              >
                <span className="text-lg">🎯</span>
              </div>
            </div>
          </div>

          {/* Result Display */}
          {showResult && result && (
            <div
              className="p-4 rounded-xl text-center animate-bounce"
              style={{
                background: result.type === 'jackpot'
                  ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)'
                  : 'linear-gradient(180deg, hsl(140 60% 45%) 0%, hsl(140 60% 35%) 100%)',
                border: '2px solid',
                borderColor: result.type === 'jackpot' ? '#b45309' : 'hsl(140 50% 25%)',
                color: 'white',
              }}
            >
              <p className="text-lg font-bold mb-1">
                {result.type === 'jackpot' ? '🎉 JACKPOT! 🎉' : '🎊 You Won! 🎊'}
              </p>
              <p className="text-2xl font-bold">
                {result.icon} {result.label}
              </p>
            </div>
          )}

          {/* Spin Button or Claim Button */}
          {showResult && result ? (
            <button
              onClick={handleClaim}
              className="w-full py-4 px-6 font-bold text-base rounded-lg transition-all active:scale-95 touch-manipulation"
              style={{
                background: 'linear-gradient(180deg, hsl(140 60% 45%) 0%, hsl(140 60% 35%) 100%)',
                border: '2px solid hsl(140 50% 25%)',
                boxShadow: '0 4px 0 hsl(140 50% 20%), inset 0 1px 0 hsl(140 70% 60% / 0.4)',
                color: 'white',
              }}
            >
              Claim Reward!
            </button>
          ) : (
            <button
              onClick={handleSpin}
              disabled={!canSpin || isSpinning}
              className="w-full py-4 px-6 font-bold text-base rounded-lg transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canSpin
                  ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
                border: '2px solid',
                borderColor: canSpin ? '#b45309' : '#374151',
                boxShadow: canSpin
                  ? '0 4px 0 #92400e, inset 0 1px 0 rgba(255,255,255,0.3)'
                  : '0 4px 0 #1f2937',
                color: 'white',
              }}
            >
              {isSpinning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🎡</span> Spinning...
                </span>
              ) : canSpin ? (
                <span className="flex items-center justify-center gap-2">
                  🎰 SPIN!
                </span>
              ) : (
                <span>Next spin in {timeUntilNextSpin}</span>
              )}
            </button>
          )}

          {/* Info Text */}
          {!showResult && (
            <p className="text-xs text-center text-muted-foreground">
              You get one free spin every day!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
