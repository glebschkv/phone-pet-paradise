import { useState, useEffect } from 'react';
import { useSpecialEvents } from '@/hooks/useSpecialEvents';
import { cn } from '@/lib/utils';
import { X, Clock, Gift, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/PixelIcon';

interface SpecialEventBannerProps {
  onClaimReward?: (xp?: number, coins?: number) => void;
}

export const SpecialEventBanner = ({ onClaimReward }: SpecialEventBannerProps) => {
  const {
    getPrimaryActiveEvent,
    getTimeRemaining,
    claimEventReward,
    dismissEventBanner,
    shouldShowBanner,
    hasUnclaimedRewards,
    isDoubleXPActive,
    isDoubleCoinsActive,
  } = useSpecialEvents();

  const [isExpanded, setIsExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 });

  const activeEvent = getPrimaryActiveEvent();

  // Update countdown timer
  useEffect(() => {
    if (!activeEvent) return;

    const updateTime = () => {
      const remaining = getTimeRemaining(activeEvent);
      setTimeRemaining(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activeEvent, getTimeRemaining]);

  if (!activeEvent || !shouldShowBanner(activeEvent.id)) {
    return null;
  }

  const handleClaim = () => {
    const rewards = claimEventReward(activeEvent.id);
    if (rewards && onClaimReward) {
      onClaimReward(rewards.xp, rewards.coins);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissEventBanner(activeEvent.id);
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-30 px-4">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl shadow-lg cursor-pointer transition-all duration-300",
          "bg-gradient-to-r",
          activeEvent.backgroundGradient,
          isExpanded ? "max-h-48" : "max-h-14"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_50%)] animate-pulse" />
        </div>

        {/* Compact view */}
        <div className="relative flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <PixelIcon name={activeEvent.emoji} size={28} />
            <div>
              <h3 className="text-white font-bold text-sm">{activeEvent.name}</h3>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <Clock className="w-3 h-3" />
                <span>{timeRemaining.hours}h {timeRemaining.minutes}m left</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Multiplier badges */}
            {isDoubleXPActive() && (
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                <Zap className="w-3 h-3" />
                2x XP
              </div>
            )}
            {isDoubleCoinsActive() && (
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                <Zap className="w-3 h-3" />
                2x Coins
              </div>
            )}

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>
        </div>

        {/* Expanded view */}
        {isExpanded && (
          <div className="relative px-3 pb-3 space-y-3 animate-in slide-in-from-top duration-200">
            <p className="text-white/80 text-sm">{activeEvent.description}</p>

            {/* Rewards section */}
            {activeEvent.rewards && hasUnclaimedRewards() && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-white" />
                    <div className="text-white">
                      <span className="font-bold">Event Rewards:</span>
                      <div className="text-sm text-white/80">
                        {activeEvent.rewards.xp && `${activeEvent.rewards.xp} XP`}
                        {activeEvent.rewards.xp && activeEvent.rewards.coins && ' + '}
                        {activeEvent.rewards.coins && `${activeEvent.rewards.coins} Coins`}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaim();
                    }}
                    className="bg-white text-purple-600 hover:bg-white/90"
                  >
                    Claim
                  </Button>
                </div>
              </div>
            )}

            {/* Event type indicator */}
            <div className="flex gap-2 flex-wrap">
              {activeEvent.type === 'double_xp' && (
                <span className="bg-purple-500/50 text-white text-xs px-2 py-1 rounded-full">
                  Double XP Event
                </span>
              )}
              {activeEvent.type === 'double_coins' && (
                <span className="bg-yellow-500/50 text-white text-xs px-2 py-1 rounded-full">
                  Double Coins Event
                </span>
              )}
              {activeEvent.type === 'bonus_rewards' && (
                <span className="bg-green-500/50 text-white text-xs px-2 py-1 rounded-full">
                  Bonus Rewards Event
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mini indicator for status bar
export const EventIndicator = () => {
  const { isDoubleXPActive, isDoubleCoinsActive, activeEvents } = useSpecialEvents();

  if (activeEvents.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {isDoubleXPActive() && (
        <div className="bg-purple-500/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-0.5">
          <Zap className="w-2.5 h-2.5" />
          2x
        </div>
      )}
      {isDoubleCoinsActive() && (
        <div className="bg-yellow-500/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-0.5">
          <Zap className="w-2.5 h-2.5" />
          2x
        </div>
      )}
    </div>
  );
};
