import { Play, Pause, Square, SkipForward, Lock } from "lucide-react";
import { ARIA_LABELS } from "@/lib/accessibility";
import { toast } from "sonner";
import { useFocusStore } from "@/stores/focusStore";

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
  const strictMode = useFocusStore((s) => s.strictMode);
  const focusEnabled = useFocusStore((s) => s.enabled);

  // Strict mode locks pause/stop/skip while the timer is running
  const isLocked = isRunning && focusEnabled && strictMode;

  const handleLockedAction = () => {
    toast.warning("Strict Mode Active", {
      description: "You can't stop or pause until the timer completes. Disable strict mode in Settings to change this.",
      duration: 3000,
    });
  };

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
          onClick={isLocked ? handleLockedAction : onPause}
          aria-label={isLocked ? "Pause disabled — strict mode active" : ARIA_LABELS.PAUSE_TIMER}
          className={isLocked ? "timer-btn-pause opacity-50" : "timer-btn-pause"}
        >
          {isLocked ? (
            <Lock className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Pause className="w-5 h-5" aria-hidden="true" />
          )}
          {isLocked ? "Locked" : "Pause"}
        </button>
      )}

      <button
        onClick={isLocked ? handleLockedAction : onStop}
        aria-label={isLocked ? "Stop disabled — strict mode active" : ARIA_LABELS.STOP_TIMER}
        className={isLocked ? "timer-btn-secondary opacity-50" : "timer-btn-secondary"}
      >
        <Square className="w-5 h-5 timer-icon-stop" aria-hidden="true" />
      </button>

      <button
        onClick={isLocked ? handleLockedAction : onSkip}
        aria-label={isLocked ? "Skip disabled — strict mode active" : "Skip to end of session"}
        className={isLocked ? "timer-btn-secondary opacity-50" : "timer-btn-secondary"}
      >
        <SkipForward className="w-5 h-5 timer-icon-skip" aria-hidden="true" />
      </button>
    </div>
  );
};
