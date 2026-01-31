import { Target, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalRingProps {
  currentMinutes: number;
  goalMinutes: number;
  goalStreak: number;
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

export const AnalyticsGoalRing = ({
  currentMinutes,
  goalMinutes,
  goalStreak,
  formatDuration,
}: GoalRingProps) => {
  const percentage = goalMinutes > 0 ? Math.min(100, Math.round((currentMinutes / goalMinutes) * 100)) : 0;
  const isGoalMet = goalMinutes > 0 && currentMinutes >= goalMinutes;

  // SVG circle parameters
  const size = 128;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Daily Goal</span>
        {goalStreak > 0 && (
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{goalStreak} day streak</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="none"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn(
                "transition-all duration-700",
                isGoalMet ? "text-green-500" : "text-primary"
              )}
              style={{
                filter: isGoalMet ? "drop-shadow(0 0 6px hsl(142 71% 45% / 0.4))" : undefined,
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-2xl font-extrabold tabular-nums",
              isGoalMet ? "text-green-500" : ""
            )}>
              {percentage}%
            </span>
            {isGoalMet && (
              <span className="text-[10px] text-green-600 font-bold tracking-wide">COMPLETE</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="p-2.5 rounded-lg bg-muted/20">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Progress</div>
            <div className="text-sm font-bold mt-0.5">
              {formatDuration(currentMinutes * 60)} <span className="text-muted-foreground font-normal">/</span> {formatDuration(goalMinutes * 60)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/20">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Remaining</div>
            <div className={cn(
              "text-sm font-bold mt-0.5",
              isGoalMet ? "text-green-500" : ""
            )}>
              {isGoalMet ? "Goal reached!" : formatDuration(Math.max(0, goalMinutes - currentMinutes) * 60)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
