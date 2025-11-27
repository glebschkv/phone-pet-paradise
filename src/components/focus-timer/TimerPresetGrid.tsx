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
  return (
    <div className="w-full max-w-sm">
      <p className="text-xs text-center text-muted-foreground mb-3 font-medium">Choose Focus Mode</p>
      <div className="grid grid-cols-3 gap-2">
        {TIMER_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset.id === preset.id;
          const isBreak = preset.type === 'break';

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              disabled={isRunning}
              className={cn(
                "p-3 rounded-lg text-center active-scale transition-all",
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
                isSelected ? "text-white" : isBreak ? "text-warning" : "text-primary"
              )} />
              <div className={cn(
                "text-xs font-semibold",
                isSelected ? "text-white" : "text-foreground"
              )}>
                {preset.duration}m
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
