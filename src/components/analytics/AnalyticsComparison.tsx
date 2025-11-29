import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyStats } from "@/types/analytics";

interface ComparisonProps {
  thisWeek: WeeklyStats;
  lastWeek: WeeklyStats;
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

export const AnalyticsComparison = ({ thisWeek, lastWeek, formatDuration }: ComparisonProps) => {
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return {
        icon: ArrowUpRight,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        label: `+${change}%`,
      };
    }
    if (change < 0) {
      return {
        icon: ArrowDownRight,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        label: `${change}%`,
      };
    }
    return {
      icon: Minus,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      label: "0%",
    };
  };

  const comparisons = [
    {
      label: "Focus Time",
      thisWeek: formatDuration(thisWeek.totalFocusTime),
      lastWeek: formatDuration(lastWeek.totalFocusTime),
      change: calculateChange(thisWeek.totalFocusTime, lastWeek.totalFocusTime),
    },
    {
      label: "Sessions",
      thisWeek: thisWeek.sessionsCompleted.toString(),
      lastWeek: lastWeek.sessionsCompleted.toString(),
      change: calculateChange(thisWeek.sessionsCompleted, lastWeek.sessionsCompleted),
    },
    {
      label: "Days Active",
      thisWeek: `${thisWeek.daysActive}/7`,
      lastWeek: `${lastWeek.daysActive}/7`,
      change: calculateChange(thisWeek.daysActive, lastWeek.daysActive),
    },
    {
      label: "Goals Met",
      thisWeek: `${thisWeek.goalsMet}/7`,
      lastWeek: `${lastWeek.goalsMet}/7`,
      change: calculateChange(thisWeek.goalsMet, lastWeek.goalsMet),
    },
  ];

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Week vs Week</span>
      </div>

      <div className="space-y-2">
        {comparisons.map((item) => {
          const indicator = getChangeIndicator(item.change);
          const IndicatorIcon = indicator.icon;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            >
              <div className="flex-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {item.label}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-sm font-bold">{item.thisWeek}</span>
                  <span className="text-[10px] text-muted-foreground">
                    vs {item.lastWeek}
                  </span>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-semibold",
                indicator.bgColor,
                indicator.color
              )}>
                <IndicatorIcon className="w-3 h-3" />
                {indicator.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Average session length */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Avg. Session Length</span>
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {thisWeek.averageSessionLength > 0 ? formatDuration(thisWeek.averageSessionLength) : "--"}
            </span>
            {lastWeek.averageSessionLength > 0 && thisWeek.averageSessionLength > 0 && (
              <span className={cn(
                "text-[10px]",
                thisWeek.averageSessionLength >= lastWeek.averageSessionLength
                  ? "text-green-500"
                  : "text-red-500"
              )}>
                {thisWeek.averageSessionLength >= lastWeek.averageSessionLength ? "↑" : "↓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
