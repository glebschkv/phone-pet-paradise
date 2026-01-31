import { Flag, Clock, Zap, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Milestone } from "@/types/analytics";

interface MilestonesProps {
  milestones: Milestone[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Zap,
  Flame,
  Trophy,
};

export const AnalyticsMilestones = ({ milestones }: MilestonesProps) => {
  if (milestones.length === 0) {
    return null;
  }

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flag className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Next Milestones</span>
      </div>

      <div className="space-y-3">
        {milestones.map(milestone => {
          const IconComponent = ICON_MAP[milestone.icon] || Flag;
          const progress = Math.min(100, Math.round((milestone.current / milestone.target) * 100));
          const remaining = milestone.target - milestone.current;
          const isClose = progress >= 75;

          return (
            <div key={milestone.id} className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                milestone.color,
                isClose ? 'bg-amber-500/15' : 'bg-muted/30',
              )}>
                <IconComponent className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold truncate">{milestone.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums ml-2">
                    {remaining} {milestone.unit} left
                  </span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      isClose ? "bg-amber-500" : "bg-primary/60",
                    )}
                    style={{
                      width: `${progress}%`,
                      boxShadow: isClose ? '0 0 6px hsl(35 100% 50% / 0.4)' : undefined,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] text-muted-foreground tabular-nums">
                    {milestone.current} / {milestone.target}
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold tabular-nums",
                    isClose ? "text-amber-500" : "text-muted-foreground",
                  )}>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
