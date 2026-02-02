import { Play, Pause, Square, SkipForward } from "lucide-react";
import { ARIA_LABELS } from "@/lib/accessibility";

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
    <div className="flex justify-center items-center gap-3" role="group" aria-label="Timer controls">
      {!isRunning ? (
        <button
          onClick={onStart}
          aria-label={ARIA_LABELS.START_TIMER}
          className="timer-btn-start"
        >
          <Play className="w-5 h-5" aria-hidden="true" />
          Start
        </button>
      ) : (
        <button
          onClick={onPause}
          aria-label={ARIA_LABELS.PAUSE_TIMER}
          className="timer-btn-pause"
        >
          <Pause className="w-5 h-5" aria-hidden="true" />
          Pause
        </button>
      )}

      <button
        onClick={onStop}
        aria-label={ARIA_LABELS.STOP_TIMER}
        className="timer-btn-secondary"
      >
        <Square className="w-5 h-5 timer-icon-stop" aria-hidden="true" />
      </button>

      <button
        onClick={onSkip}
        aria-label="Skip to end of session"
        className="timer-btn-secondary"
      >
        <SkipForward className="w-5 h-5 timer-icon-skip" aria-hidden="true" />
      </button>
    </div>
  );
};
