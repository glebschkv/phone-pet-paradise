import { CalendarCheck, Crown, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyStats, FocusCategory, FOCUS_CATEGORIES } from "@/types/analytics";

interface WeeklyReportProps {
  thisWeek: WeeklyStats;
  lastWeek: WeeklyStats;
  focusScore: number;
  weekOverWeekChange: number;
  categoryDistribution: Record<FocusCategory, number>;
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
  isPremium: boolean;
  onUpgrade: () => void;
}

export const AnalyticsWeeklyReport = ({
  thisWeek,
  lastWeek,
  focusScore,
  weekOverWeekChange,
  categoryDistribution,
  formatDuration,
  isPremium,
  onUpgrade,
}: WeeklyReportProps) => {
  const ChangeIcon = weekOverWeekChange > 0 ? TrendingUp : weekOverWeekChange < 0 ? TrendingDown : Minus;
  const changeColor = weekOverWeekChange > 0 ? 'text-green-500' : weekOverWeekChange < 0 ? 'text-red-400' : 'text-muted-foreground';

  // Find top category
  const topCat = Object.entries(categoryDistribution)
    .filter(([, time]) => time > 0)
    .sort(([, a], [, b]) => b - a)[0];
  const topCatInfo = topCat ? FOCUS_CATEGORIES.find(c => c.id === topCat[0]) : null;

  // Best day this week (derive from weekStart)
  const completionRate = thisWeek.sessionsCompleted > 0
    ? Math.round((thisWeek.sessionsCompleted / Math.max(thisWeek.sessionsCompleted, 1)) * 100)
    : 0;

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarCheck className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Weekly Report</span>
        <span className="ml-auto text-[10px] text-muted-foreground">This week</span>
      </div>

      {/* Hero row: Focus Time + Change */}
      <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Focus Time</div>
          <div className="text-2xl font-extrabold tabular-nums text-primary">
            {formatDuration(thisWeek.totalFocusTime)}
          </div>
        </div>
        <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold", changeColor, weekOverWeekChange > 0 ? 'bg-green-500/10' : weekOverWeekChange < 0 ? 'bg-red-500/10' : 'bg-muted/20')}>
          <ChangeIcon className="w-3.5 h-3.5" />
          {weekOverWeekChange > 0 ? '+' : ''}{weekOverWeekChange}%
        </div>
      </div>

      {/* Free tier: summary only */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2.5 rounded-lg bg-muted/20 text-center">
          <div className="text-sm font-extrabold tabular-nums">{thisWeek.sessionsCompleted}</div>
          <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Sessions</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/20 text-center">
          <div className="text-sm font-extrabold tabular-nums">{thisWeek.daysActive}/7</div>
          <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Active</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/20 text-center">
          <div className="text-sm font-extrabold tabular-nums">{thisWeek.goalsMet}/7</div>
          <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Goals Met</div>
        </div>
      </div>

      {/* Premium section: detailed breakdown */}
      {isPremium ? (
        <div className="space-y-2 pt-3 border-t border-border/50">
          {/* Focus Score */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Focus Score</span>
            <span className="font-bold">{focusScore}/100</span>
          </div>

          {/* Avg Session */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Avg Session</span>
            <span className="font-bold">
              {thisWeek.averageSessionLength > 0 ? formatDuration(thisWeek.averageSessionLength) : '--'}
            </span>
          </div>

          {/* Top Category */}
          {topCatInfo && topCat && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Top Category</span>
              <span className="font-bold flex items-center gap-1">
                <span>{topCatInfo.emoji}</span> {topCatInfo.label}
              </span>
            </div>
          )}

          {/* vs Last Week */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Last Week</span>
            <span className="text-muted-foreground font-medium">
              {formatDuration(lastWeek.totalFocusTime)} / {lastWeek.sessionsCompleted} sessions
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={onUpgrade}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all active:scale-[0.98] mt-1"
          style={{
            background: 'linear-gradient(135deg, hsl(35 80% 50% / 0.12) 0%, hsl(35 90% 40% / 0.06) 100%)',
            border: '1.5px solid hsl(35 70% 50% / 0.25)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-400">See full report with score & categories</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-amber-500/60" />
        </button>
      )}
    </div>
  );
};
