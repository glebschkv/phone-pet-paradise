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
    <div className="grid grid-cols-3 gap-2">
      {/* Today's Focus */}
      <div className="retro-card p-3 text-center">
        <div className="w-8 h-8 mx-auto mb-1.5 retro-level-badge rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
        <div className="text-lg font-bold leading-tight">
          {formatDuration(todayFocusTime)}
        </div>
        <div className="text-[10px] text-muted-foreground font-medium">Today</div>
      </div>

      {/* Current Streak */}
      <div className="retro-card p-3 text-center">
        <div className="w-8 h-8 mx-auto mb-1.5 bg-gradient-to-b from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white shadow-sm">
          <Flame className="w-4 h-4" />
        </div>
        <div className="text-lg font-bold leading-tight">{currentStreak}</div>
        <div className="text-[10px] text-muted-foreground font-medium">Day Streak</div>
      </div>

      {/* Weekly Focus */}
      <div className="retro-card p-3 text-center">
        <div className="w-8 h-8 mx-auto mb-1.5 retro-stat-pill rounded-lg flex items-center justify-center">
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="text-lg font-bold leading-tight">
          {formatDuration(weeklyFocusTime)}
        </div>
        <div className={cn("text-[10px] font-medium flex items-center justify-center gap-0.5", getTrendColor())}>
          {getTrendIcon()}
          {Math.abs(weekOverWeekChange)}%
        </div>
      </div>
    </div>
  );
};
