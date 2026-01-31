import { CheckCircle, XCircle, SkipForward, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompletionTrendProps {
  trend: {
    weeks: { week: string; rate: number; completed: number; total: number }[];
    overall: {
      completed: number;
      skipped: number;
      abandoned: number;
      total: number;
      rate: number;
    };
  };
}

export const AnalyticsCompletionTrend = ({ trend }: CompletionTrendProps) => {
  const { weeks, overall } = trend;

  // Ring params
  const size = 72;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overall.rate / 100) * circumference;

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 70) return 'text-blue-500';
    if (rate >= 50) return 'text-amber-500';
    return 'text-red-400';
  };

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Completion Rate</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Last 30 days</span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {/* Completion ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              strokeWidth={strokeWidth} stroke="currentColor" fill="none"
              className="text-muted/20"
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              strokeWidth={strokeWidth} stroke="currentColor" fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn("transition-all duration-700", getRateColor(overall.rate))}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-lg font-extrabold tabular-nums", getRateColor(overall.rate))}>
              {overall.rate}%
            </span>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground flex-1">Completed</span>
            <span className="text-[11px] font-bold tabular-nums">{overall.completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <SkipForward className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground flex-1">Skipped</span>
            <span className="text-[11px] font-bold tabular-nums">{overall.skipped}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground flex-1">Abandoned</span>
            <span className="text-[11px] font-bold tabular-nums">{overall.abandoned}</span>
          </div>
        </div>
      </div>

      {/* Weekly trend */}
      <div>
        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">
          Weekly Trend
        </div>
        <div className="flex items-end gap-2">
          {weeks.map(week => (
            <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
              {/* Rate label */}
              {week.total > 0 && (
                <span className={cn("text-[9px] font-bold tabular-nums", getRateColor(week.rate))}>
                  {week.rate}%
                </span>
              )}
              {/* Bar */}
              <div className="w-full h-10 rounded-md bg-muted/10 flex items-end overflow-hidden">
                <div
                  className={cn(
                    "w-full rounded-md transition-all duration-500",
                    week.rate >= 90 ? "bg-green-500/70" :
                    week.rate >= 70 ? "bg-blue-500/70" :
                    week.rate >= 50 ? "bg-amber-500/70" :
                    week.total > 0 ? "bg-red-400/70" :
                    "bg-muted/20"
                  )}
                  style={{ height: week.total > 0 ? `${Math.max(week.rate, 8)}%` : '4px' }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground font-medium">{week.week}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
