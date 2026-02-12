import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { TimerPreset, TIMER_PRESETS } from "./constants";
import { XP_CONFIG } from "@/lib/constants";

interface TimerPresetGridProps {
  selectedPreset: TimerPreset;
  isRunning: boolean;
  onSelectPreset: (preset: TimerPreset) => void;
}

/** Calculate estimated base XP for a focus session duration */
const getEstimatedXP = (preset: TimerPreset): number | null => {
  // No XP for breaks or sessions under 25 min
  if (preset.type === 'break') return null;
  if (preset.isCountup) return null; // Variable, can't estimate
  if (preset.duration < 25) return null;
  return Math.floor(preset.duration * XP_CONFIG.BASE_XP_PER_MINUTE);
};

export const TimerPresetGrid = ({
  selectedPreset,
  isRunning,
  onSelectPreset
}: TimerPresetGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for arrow keys within the grid
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    if (isRunning) return;

    const cols = 3;
    const total = TIMER_PRESETS.length;
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : total - 1;
        e.preventDefault();
        break;
      case 'ArrowRight':
        nextIndex = currentIndex < total - 1 ? currentIndex + 1 : 0;
        e.preventDefault();
        break;
      case 'ArrowUp':
        nextIndex = currentIndex >= cols ? currentIndex - cols : currentIndex + (Math.ceil(total / cols) - 1) * cols;
        if (nextIndex >= total) nextIndex = currentIndex;
        e.preventDefault();
        break;
      case 'ArrowDown':
        nextIndex = currentIndex + cols < total ? currentIndex + cols : currentIndex % cols;
        e.preventDefault();
        break;
      default:
        return;
    }

    // Focus the next button
    const buttons = gridRef.current?.querySelectorAll('button');
    if (buttons && buttons[nextIndex]) {
      (buttons[nextIndex] as HTMLButtonElement).focus();
    }
  }, [isRunning]);

  return (
    <div className="w-full max-w-sm">
      <p className="timer-grid-label" id="preset-grid-label">Choose Focus Mode</p>
      <div
        ref={gridRef}
        className="grid grid-cols-3 gap-2.5"
        role="radiogroup"
        aria-labelledby="preset-grid-label"
        aria-describedby={isRunning ? "preset-grid-disabled" : undefined}
      >
        {isRunning && (
          <span id="preset-grid-disabled" className="sr-only">
            Preset selection disabled while timer is running
          </span>
        )}
        {TIMER_PRESETS.map((preset, index) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset.id === preset.id;
          const isBreak = preset.type === 'break';
          const estimatedXP = getEstimatedXP(preset);

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isRunning}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${preset.name}: ${preset.isCountup ? 'open-ended up to 6 hours' : `${preset.duration} minutes`}${isBreak ? ' (break)' : ''}${estimatedXP ? `, +${estimatedXP} XP` : ''}`}
              tabIndex={isSelected ? 0 : -1}
              className={cn(
                "timer-preset-btn focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isSelected && "selected",
                isBreak && !isSelected && "break-mode"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mx-auto mb-1",
                isSelected ? "text-white" : isBreak ? "text-warning" : preset.isCountup ? "text-info" : "text-primary"
              )} />
              <div className={cn(
                "text-xs font-bold",
                isSelected ? "text-white" : "text-foreground"
              )}>
                {preset.isCountup ? '∞' : `${preset.duration}m`}
              </div>
              <div className={cn(
                "text-[11px] font-medium leading-tight",
                isSelected ? "text-white/80" : "text-muted-foreground"
              )}>
                {preset.name}
              </div>
              {estimatedXP !== null && (
                <div className={cn(
                  "text-[11px] font-bold mt-0.5",
                  isSelected ? "text-yellow-200" : "text-yellow-600 dark:text-yellow-400"
                )}>
                  +{estimatedXP} XP
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
