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
  const percentage = Math.min(100, Math.round((currentMinutes / goalMinutes) * 100));
  const isGoalMet = currentMinutes >= goalMinutes;

  // SVG circle parameters
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Daily Goal</span>
        {goalStreak > 0 && (
          <div className="ml-auto flex items-center gap-1 text-orange-500">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{goalStreak} day streak</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
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
              className="text-muted/20"
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
                "transition-all duration-500",
                isGoalMet ? "text-green-500" : "text-primary"
              )}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-2xl font-bold",
              isGoalMet && "text-green-500"
            )}>
              {percentage}%
            </span>
            {isGoalMet && (
              <span className="text-[10px] text-green-500 font-semibold">COMPLETE</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          <div>
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="text-base font-bold">
              {formatDuration(currentMinutes * 60)} / {formatDuration(goalMinutes * 60)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Remaining</div>
            <div className={cn(
              "text-base font-bold",
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
