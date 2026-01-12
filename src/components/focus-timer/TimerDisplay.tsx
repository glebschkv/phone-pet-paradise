import { Volume2, VolumeX } from "lucide-react";
import { TimerPreset, formatTime, MAX_COUNTUP_DURATION } from "./constants";
import { ariaLabel, formatTimeForScreenReader } from "@/lib/accessibility";

interface TimerDisplayProps {
  preset: TimerPreset;
  timeLeft: number;
  sessionDuration: number;
  isRunning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isCountup?: boolean;
  elapsedTime?: number;
}

export const TimerDisplay = ({
  preset,
  timeLeft,
  sessionDuration,
  isRunning,
  soundEnabled,
  onToggleSound,
  isCountup = false,
  elapsedTime = 0
}: TimerDisplayProps) => {
  // For countup mode, show elapsed time; for countdown, show remaining time
  const displayTime = isCountup ? elapsedTime : timeLeft;

  // For countup mode, progress is based on elapsed time toward max duration
  // For countdown mode, progress is based on time spent in session
  const progress = isCountup
    ? (elapsedTime / MAX_COUNTUP_DURATION) * 100
    : sessionDuration > 0 ? ((sessionDuration - timeLeft) / sessionDuration) * 100 : 0;
  const progressPercent = Math.round(progress);

  return (
    <div className="retro-card p-6 w-full max-w-sm mb-6" role="region" aria-label="Focus timer">
      {/* Current Mode Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, hsl(260 60% 70%) 0%, hsl(260 60% 55%) 100%)',
              boxShadow: '0 2px 0 hsl(260 60% 40%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
            }}
            aria-hidden="true"
          >
            <preset.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{preset.name}</h2>
            <p className="text-xs text-muted-foreground">
              {isCountup ? 'Up to 6 hours' : `${preset.duration} minutes`}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleSound}
          aria-label={ariaLabel.toggle('Sound', soundEnabled)}
          className="w-9 h-9 rounded-lg flex items-center justify-center active-scale retro-stat-pill"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-foreground" aria-hidden="true" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Large Timer Display */}
      <div className="text-center mb-6">
        <div
          className="text-6xl font-bold font-mono tracking-wider mb-4"
          style={{
            color: 'hsl(220 25% 15%)',
            textShadow: '0 2px 0 hsl(0 0% 100% / 0.5), 0 -1px 0 hsl(0 0% 0% / 0.1)'
          }}
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          aria-label={isCountup ? `Time elapsed: ${formatTimeForScreenReader(displayTime)}` : `Time remaining: ${formatTimeForScreenReader(displayTime)}`}
        >
          {formatTime(displayTime)}
        </div>

        {/* Progress Bar */}
        <div
          className="retro-xp-bar w-full"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={isCountup ? `Elapsed: ${progressPercent}% of 6 hours` : `Session progress: ${progressPercent}% complete`}
        >
          <div
            className="retro-xp-fill"
            style={{ width: `${progress}%` }}
          >
            <div className="shine" />
          </div>
        </div>

        <p className="text-sm font-medium text-muted-foreground mt-3" aria-live="polite">
          {isRunning ? (isCountup ? 'Counting up...' : 'Focus time...') : 'Ready to focus'}
        </p>
      </div>
    </div>
  );
};
