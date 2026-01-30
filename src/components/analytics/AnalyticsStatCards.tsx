import { Clock, Flame, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  todayFocusTime: number; // seconds
  currentStreak: number;
  weeklyFocusTime: number; // seconds
  weekOverWeekChange: number; // percentage
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

export const AnalyticsStatCards = ({
  todayFocusTime,
  currentStreak,
  weeklyFocusTime,
  weekOverWeekChange,
  formatDuration,
}: StatCardsProps) => {
  const getTrendIcon = () => {
    if (weekOverWeekChange > 0) return <TrendingUp className="w-3 h-3" />;
    if (weekOverWeekChange < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (weekOverWeekChange > 0) return "text-green-500";
    if (weekOverWeekChange < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {/* Today's Focus */}
      <div className="retro-card p-3 text-center">
        <div className="w-9 h-9 mx-auto mb-2 retro-level-badge rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
        <div className="text-base font-extrabold leading-tight tabular-nums">
          {formatDuration(todayFocusTime)}
        </div>
        <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">Today</div>
      </div>

      {/* Current Streak */}
      <div className="retro-card p-3 text-center">
        <div className="w-9 h-9 mx-auto mb-2 bg-gradient-to-b from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-sm">
          <Flame className="w-4 h-4" />
        </div>
        <div className="text-base font-extrabold leading-tight tabular-nums">{currentStreak}</div>
        <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">Streak</div>
      </div>

      {/* Weekly Focus */}
      <div className="retro-card p-3 text-center">
        <div className="w-9 h-9 mx-auto mb-2 bg-gradient-to-b from-primary/80 to-primary rounded-lg flex items-center justify-center text-white shadow-sm">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="text-base font-extrabold leading-tight tabular-nums">
          {formatDuration(weeklyFocusTime)}
        </div>
        <div className={cn(
          "text-[10px] font-bold flex items-center justify-center gap-0.5 mt-0.5",
          getTrendColor()
        )}>
          {getTrendIcon()}
          {weekOverWeekChange > 0 ? "+" : ""}{Math.abs(weekOverWeekChange)}%
        </div>
      </div>
    </div>
  );
};
