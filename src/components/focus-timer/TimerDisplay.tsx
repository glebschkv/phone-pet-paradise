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

  // Circular progress ring dimensions
  const ringSize = 220;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full max-w-sm mb-4" role="region" aria-label="Focus timer">
      {/* Compact mode header: preset info + sound toggle */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, hsl(260 60% 70%) 0%, hsl(260 60% 55%) 100%)',
              boxShadow: '0 2px 0 hsl(260 60% 40%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
            }}
            aria-hidden="true"
          >
            <preset.icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white drop-shadow-sm">{preset.name}</h2>
            <p className="text-[11px] text-white/60">
              {isCountup ? 'Up to 6 hours' : `${preset.duration} minutes`}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleSound}
          aria-label={ariaLabel.toggle('Sound', soundEnabled)}
          className="w-8 h-8 rounded-lg flex items-center justify-center active-scale"
          style={{
            background: 'hsl(0 0% 100% / 0.1)',
            border: '1.5px solid hsl(0 0% 100% / 0.15)',
          }}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-white/80" aria-hidden="true" />
          ) : (
            <VolumeX className="w-4 h-4 text-white/50" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Circular Timer Display */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          {/* SVG Progress Ring */}
          <svg
            width={ringSize}
            height={ringSize}
            className="absolute inset-0 -rotate-90"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={isCountup ? `Elapsed: ${progressPercent}% of 6 hours` : `Session progress: ${progressPercent}% complete`}
          >
            {/* Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(0 0% 100% / 0.1)"
              strokeWidth={strokeWidth}
            />
            {/* Progress fill */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(260 70% 65%)" />
                <stop offset="50%" stopColor="hsl(280 60% 60%)" />
                <stop offset="100%" stopColor="hsl(200 60% 60%)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="text-5xl font-bold font-mono tracking-wider"
              style={{
                color: 'white',
                textShadow: '0 2px 8px hsl(0 0% 0% / 0.3)'
              }}
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={isCountup ? `Time elapsed: ${formatTimeForScreenReader(displayTime)}` : `Time remaining: ${formatTimeForScreenReader(displayTime)}`}
            >
              {formatTime(displayTime)}
            </div>
            <p className="text-xs font-medium text-white/60 mt-1" aria-live="polite">
              {isRunning ? (isCountup ? 'Counting up...' : 'Focus time...') : 'Ready to focus'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
