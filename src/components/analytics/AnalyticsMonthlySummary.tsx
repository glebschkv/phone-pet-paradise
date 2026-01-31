import { CalendarRange, Star, Clock, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyStats, FOCUS_CATEGORIES } from "@/types/analytics";

interface MonthlySummaryProps {
  stats: MonthlyStats;
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export const AnalyticsMonthlySummary = ({ stats, formatDuration }: MonthlySummaryProps) => {
  const monthIndex = parseInt(stats.month.split('-')[1]) - 1;
  const monthName = MONTH_NAMES[monthIndex] || stats.month;

  const topCategoryInfo = stats.topCategory
    ? FOCUS_CATEGORIES.find(c => c.id === stats.topCategory?.category)
    : null;

  const formatBestDay = (dateStr: string) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarRange className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Monthly Report</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{monthName}</span>
      </div>

      {/* Hero stat */}
      <div className="text-center mb-4 p-3 rounded-lg bg-gradient-to-b from-primary/10 to-transparent">
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
          Total Focus This Month
        </div>
        <div className="text-2xl font-extrabold text-primary tabular-nums">
          {formatDuration(stats.totalFocusTime)}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          across {stats.totalSessions} sessions
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2.5 rounded-lg bg-muted/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3 h-3 text-green-500" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Goals Met</span>
          </div>
          <div className="text-sm font-bold">
            {stats.goalsMet}<span className="text-muted-foreground font-normal">/{stats.totalDays}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Days Active</span>
          </div>
          <div className="text-sm font-bold">
            {stats.daysActive}<span className="text-muted-foreground font-normal">/{stats.totalDays}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Avg Daily</span>
          </div>
          <div className="text-sm font-bold">
            {formatDuration(stats.avgDailyFocus)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Best Day</span>
          </div>
          <div className="text-sm font-bold truncate">
            {stats.bestDay.focusTime > 0
              ? `${formatDuration(stats.bestDay.focusTime)}`
              : '--'}
          </div>
          {stats.bestDay.date && (
            <div className="text-[9px] text-muted-foreground">{formatBestDay(stats.bestDay.date)}</div>
          )}
        </div>
      </div>

      {/* Top category + completion rate footer */}
      <div className="pt-3 border-t border-border/50 space-y-1.5">
        {topCategoryInfo && stats.topCategory && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Top Category</span>
            <span className="font-bold flex items-center gap-1">
              <span>{topCategoryInfo.emoji}</span>
              {topCategoryInfo.label} ({formatDuration(stats.topCategory.time)})
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Completion Rate</span>
          <span className={cn(
            "font-bold",
            stats.completionRate >= 80 ? "text-green-500" : stats.completionRate >= 60 ? "text-amber-500" : "text-red-400"
          )}>
            {stats.completionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};
