import { Play, Pause, Square, SkipForward } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkip: () => void;
}

export const TimerControls = ({
  isRunning,
  onStart,
  onPause,
  onStop,
  onSkip
}: TimerControlsProps) => {
  return (
    <div className="flex justify-center gap-3">
      {!isRunning ? (
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white active-scale"
          style={{
            background: 'linear-gradient(180deg, hsl(140 50% 55%) 0%, hsl(140 50% 45%) 100%)',
            border: '2px solid hsl(140 50% 35%)',
            boxShadow: '0 3px 0 hsl(140 50% 30%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
          }}
        >
          <Play className="w-5 h-5" />
          Start
        </button>
      ) : (
        <button
          onClick={onPause}
          className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white active-scale"
          style={{
            background: 'linear-gradient(180deg, hsl(40 80% 55%) 0%, hsl(35 80% 45%) 100%)',
            border: '2px solid hsl(35 70% 35%)',
            boxShadow: '0 3px 0 hsl(35 70% 30%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
          }}
        >
          <Pause className="w-5 h-5" />
          Pause
        </button>
      )}

      <button
        onClick={onStop}
        className="w-12 h-12 rounded-lg flex items-center justify-center active-scale"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.5) 100%)',
          border: '2px solid hsl(var(--border))',
          boxShadow: '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
        }}
      >
        <Square className="w-5 h-5 text-foreground" />
      </button>

      <button
        onClick={onSkip}
        className="w-12 h-12 rounded-lg flex items-center justify-center active-scale"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.5) 100%)',
          border: '2px solid hsl(var(--border))',
          boxShadow: '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
        }}
      >
        <SkipForward className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
};
