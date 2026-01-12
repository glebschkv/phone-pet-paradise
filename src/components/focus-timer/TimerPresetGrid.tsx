import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { TimerPreset, TIMER_PRESETS } from "./constants";

interface TimerPresetGridProps {
  selectedPreset: TimerPreset;
  isRunning: boolean;
  onSelectPreset: (preset: TimerPreset) => void;
}

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
      <p className="text-xs text-center text-muted-foreground mb-3 font-medium" id="preset-grid-label">Choose Focus Mode</p>
      <div
        ref={gridRef}
        className="grid grid-cols-3 gap-2"
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

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isRunning}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${preset.name}: ${preset.isCountup ? 'open-ended up to 6 hours' : `${preset.duration} minutes`}${isBreak ? ' (break)' : ''}`}
              tabIndex={isSelected ? 0 : -1}
              className={cn(
                "p-3 rounded-lg text-center active-scale transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isRunning && "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: isSelected
                  ? 'linear-gradient(180deg, hsl(260 60% 70%) 0%, hsl(260 60% 55%) 100%)'
                  : 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.9) 100%)',
                border: isSelected
                  ? '2px solid hsl(260 60% 45%)'
                  : '2px solid hsl(var(--border))',
                boxShadow: isSelected
                  ? '0 3px 0 hsl(260 60% 40%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
                  : '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.15)'
              }}
            >
              <Icon className={cn(
                "w-5 h-5 mx-auto mb-1",
                isSelected ? "text-white" : isBreak ? "text-warning" : preset.isCountup ? "text-info" : "text-primary"
              )} />
              <div className={cn(
                "text-xs font-semibold",
                isSelected ? "text-white" : "text-foreground"
              )}>
                {preset.isCountup ? '∞' : `${preset.duration}m`}
              </div>
              <div className={cn(
                "text-[10px]",
                isSelected ? "text-white/80" : "text-muted-foreground"
              )}>
                {preset.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
