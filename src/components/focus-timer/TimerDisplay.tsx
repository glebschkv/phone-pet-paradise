import { Volume2, VolumeX } from "lucide-react";
import { TimerPreset, formatTime } from "./constants";

interface TimerDisplayProps {
  preset: TimerPreset;
  timeLeft: number;
  sessionDuration: number;
  isRunning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TimerDisplay = ({
  preset,
  timeLeft,
  sessionDuration,
  isRunning,
  soundEnabled,
  onToggleSound
}: TimerDisplayProps) => {
  const progress = sessionDuration > 0 ? ((sessionDuration - timeLeft) / sessionDuration) * 100 : 0;

  return (
    <div className="retro-card p-6 w-full max-w-sm mb-6">
      {/* Current Mode Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, hsl(260 60% 70%) 0%, hsl(260 60% 55%) 100%)',
              boxShadow: '0 2px 0 hsl(260 60% 40%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
            }}
          >
            <preset.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{preset.name}</h2>
            <p className="text-xs text-muted-foreground">{preset.duration} minutes</p>
          </div>
        </div>
        <button
          onClick={onToggleSound}
          className="w-9 h-9 rounded-lg flex items-center justify-center active-scale retro-stat-pill"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-foreground" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
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
        >
          {formatTime(timeLeft)}
        </div>

        {/* Progress Bar */}
        <div className="retro-xp-bar w-full">
          <div
            className="retro-xp-fill"
            style={{ width: `${progress}%` }}
          >
            <div className="shine" />
          </div>
        </div>

        <p className="text-sm font-medium text-muted-foreground mt-3">
          {isRunning ? 'Focus time...' : 'Ready to focus'}
        </p>
      </div>
    </div>
  );
};
