import { useState, useEffect } from 'react';
import { Play, X, Timer, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useSettings } from '@/hooks/useSettings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BreakTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreak: (duration: number) => void;
  onSkipBreak: () => void;
  isLongBreak: boolean;
  completedSessions: number;
  autoStartEnabled: boolean;
  onToggleAutoStart: (enabled: boolean) => void;
}

const BREAK_OPTIONS = [
  { duration: 5, label: '5 min', description: 'Quick refresh', icon: 'lightning' },
  { duration: 10, label: '10 min', description: 'Short rest', icon: 'tea-cup' },
  { duration: 15, label: '15 min', description: 'Full break', icon: 'sprout' },
  { duration: 20, label: '20 min', description: 'Extended rest', icon: 'meditation' },
];

export const BreakTransitionModal = ({
  isOpen,
  onStartBreak,
  onSkipBreak,
  isLongBreak,
  completedSessions,
  autoStartEnabled,
  onToggleAutoStart,
}: BreakTransitionModalProps) => {
  const { settings: appSettings } = useSettings();
  const shortBreak = appSettings.shortBreakTime || 5;
  const longBreak = appSettings.longBreakTime || 15;
  const longBreakInterval = appSettings.longBreakInterval || 4;
  const [selectedDuration, setSelectedDuration] = useState(isLongBreak ? longBreak : shortBreak);
  const [autoStartCountdown, setAutoStartCountdown] = useState(10);
  const { isPremium } = usePremiumStatus();

  // Auto-start countdown
  useEffect(() => {
    if (!isOpen || !autoStartEnabled || !isPremium) {
      setAutoStartCountdown(10);
      return;
    }

    const interval = setInterval(() => {
      setAutoStartCountdown(prev => {
        if (prev <= 1) {
          onStartBreak(selectedDuration);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoStartEnabled, isPremium, selectedDuration, onStartBreak]);

  // Reset countdown when duration changes
  useEffect(() => {
    setAutoStartCountdown(10);
  }, [selectedDuration]);

  // Set recommended break duration from settings
  useEffect(() => {
    setSelectedDuration(isLongBreak ? longBreak : shortBreak);
  }, [isLongBreak, longBreak, shortBreak]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onSkipBreak()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <PixelIcon name="tea-cup" size={28} />
                Time for a Break!
              </DialogTitle>
            </DialogHeader>
            <button
              onClick={onSkipBreak}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-white/90">
            {isLongBreak
              ? `Great job! ${completedSessions} sessions done. Take a longer break!`
              : "You've earned a break. Rest up for the next session!"}
          </p>

          {/* Sessions indicator */}
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: longBreakInterval }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className={cn(
                  "w-3 h-3 rounded-full",
                  n <= (completedSessions % longBreakInterval || longBreakInterval)
                    ? "bg-white"
                    : "bg-white/30"
                )}
              />
            ))}
            <span className="text-xs text-white/80 ml-2">
              {completedSessions % longBreakInterval || longBreakInterval}/{longBreakInterval} until long break
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Break duration options */}
          <div>
            <label className="text-sm font-bold mb-2 block">Choose break length:</label>
            <div className="grid grid-cols-2 gap-2">
              {BREAK_OPTIONS.map((option) => (
                <button
                  key={option.duration}
                  onClick={() => setSelectedDuration(option.duration)}
                  className={cn(
                    "p-3 rounded-xl text-left transition-all",
                    selectedDuration === option.duration
                      ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 ring-2 ring-amber-400"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PixelIcon name={option.icon} size={20} />
                    <span className="font-bold text-sm">{option.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-start toggle (Premium feature) */}
          <div className={cn(
            "rounded-xl p-3",
            isPremium
              ? "bg-purple-50 dark:bg-purple-900/20"
              : "bg-gray-50 dark:bg-gray-800"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm font-semibold">Auto-start breaks</p>
                  <p className="text-xs text-muted-foreground">
                    {isPremium
                      ? "Automatically start break timer"
                      : "Premium feature"}
                  </p>
                </div>
              </div>
              {isPremium ? (
                <button
                  onClick={() => onToggleAutoStart(!autoStartEnabled)}
                  className={cn(
                    "w-12 h-7 rounded-full transition-all relative",
                    autoStartEnabled
                      ? "bg-purple-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all",
                      autoStartEnabled ? "right-1" : "left-1"
                    )}
                  />
                </button>
              ) : (
                <div className="flex items-center gap-1 text-amber-500">
                  <Crown className="w-4 h-4" />
                  <span className="text-xs font-semibold">Premium</span>
                </div>
              )}
            </div>

            {/* Auto-start countdown */}
            {isPremium && autoStartEnabled && (
              <div className="mt-3 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">
                  Starting in {autoStartCountdown}s...
                </span>
                <button
                  onClick={() => setAutoStartCountdown(10)}
                  className="text-xs underline hover:no-underline"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onSkipBreak}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Skip Break
            </button>
            <button
              onClick={() => onStartBreak(selectedDuration)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-white text-sm font-bold shadow-md hover:from-amber-500 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Break
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
