import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full max-w-sm mb-4" role="region" aria-label="Focus timer">
      {/* Glass-morphism header pill: preset info + sound toggle */}
      <div className="timer-header-pill mb-4">
        <div className="flex items-center gap-3">
          <div className="timer-header-icon" aria-hidden="true">
            <preset.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white drop-shadow-sm">{preset.name}</h2>
            <p className="text-[11px] text-white/55 font-medium">
              {isCountup ? 'Up to 6 hours' : `${preset.duration} minutes`}
            </p>
          </div>
        </div>
        <button
          onClick={onToggleSound}
          aria-label={ariaLabel.toggle('Sound', soundEnabled)}
          className="timer-sound-btn"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-white/80" aria-hidden="true" />
          ) : (
            <VolumeX className="w-4 h-4 text-white/40" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Circular Timer Display with frosted glass backdrop */}
      <div className="flex flex-col items-center">
        <div className="timer-ring-container">
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            {/* SVG Progress Ring */}
            <svg
              width={ringSize}
              height={ringSize}
              className="absolute inset-0 -rotate-90 timer-ring-glow"
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
                stroke="hsl(0 0% 100% / 0.08)"
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
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(260 65% 68%)" />
                  <stop offset="50%" stopColor="hsl(280 55% 62%)" />
                  <stop offset="100%" stopColor="hsl(200 55% 62%)" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-5xl font-bold font-mono tracking-wider"
                style={{
                  color: 'white',
                  textShadow: '0 2px 0 hsl(260 40% 30% / 0.4), 0 4px 12px hsl(0 0% 0% / 0.25)'
                }}
                role="timer"
                aria-live="polite"
                aria-atomic="true"
                aria-label={isCountup ? `Time elapsed: ${formatTimeForScreenReader(displayTime)}` : `Time remaining: ${formatTimeForScreenReader(displayTime)}`}
              >
                {formatTime(displayTime)}
              </div>
              <div className={cn(
                "timer-status-badge",
                isRunning && "active"
              )} aria-live="polite">
                {isRunning ? (isCountup ? 'Counting up...' : 'Focus time...') : 'Ready to focus'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
