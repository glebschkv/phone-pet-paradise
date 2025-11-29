import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { DailyStats } from "@/types/analytics";

interface HeatmapProps {
  dailyStats: Record<string, DailyStats>;
  dailyGoalMinutes: number;
}

export const AnalyticsHeatmap = ({ dailyStats, dailyGoalMinutes }: HeatmapProps) => {
  // Generate last 12 weeks of data (84 days)
  const weeks: { date: string; focusMinutes: number; goalMet: boolean }[][] = [];
  const today = new Date();

  // Start from 11 weeks ago, on a Monday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 83);
  // Adjust to start on Monday
  const dayOfWeek = startDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startDate.setDate(startDate.getDate() - daysToMonday);

  let currentWeek: { date: string; focusMinutes: number; goalMet: boolean }[] = [];

  for (let i = 0; i < 84; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const stats = dailyStats[dateStr];
    const isFuture = date > today;

    currentWeek.push({
      date: dateStr,
      focusMinutes: isFuture ? -1 : (stats?.totalFocusTime || 0) / 60,
      goalMet: isFuture ? false : (stats?.goalMet || false),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getIntensityClass = (minutes: number, goalMet: boolean) => {
    if (minutes < 0) return "bg-transparent"; // Future date
    if (minutes === 0) return "bg-muted/30";
    if (goalMet) return "bg-green-500";
    if (minutes >= dailyGoalMinutes * 0.75) return "bg-primary/80";
    if (minutes >= dailyGoalMinutes * 0.5) return "bg-primary/60";
    if (minutes >= dailyGoalMinutes * 0.25) return "bg-primary/40";
    return "bg-primary/20";
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get month markers for the header
  const getMonthMarkers = () => {
    const markers: { month: string; position: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = new Date(week[0].date);
      const month = firstDayOfWeek.getMonth();
      if (month !== lastMonth) {
        markers.push({ month: monthLabels[month], position: weekIndex });
        lastMonth = month;
      }
    });

    return markers;
  };

  const monthMarkers = getMonthMarkers();

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Activity</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Last 12 weeks</span>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 pl-6">
        {monthMarkers.map((marker, i) => (
          <div
            key={i}
            className="text-[9px] text-muted-foreground"
            style={{
              marginLeft: i === 0 ? `${marker.position * 12}px` : `${(marker.position - monthMarkers[i - 1].position - 1) * 12}px`,
            }}
          >
            {marker.month}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 text-[8px] text-muted-foreground pr-1 justify-around">
          <span>M</span>
          <span></span>
          <span>W</span>
          <span></span>
          <span>F</span>
          <span></span>
          <span>S</span>
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    "w-2.5 h-2.5 rounded-sm transition-colors",
                    getIntensityClass(day.focusMinutes, day.goalMet)
                  )}
                  title={day.focusMinutes >= 0 ? `${day.date}: ${Math.round(day.focusMinutes)}m` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-muted-foreground">
        <span>Less</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-muted/30" />
        <div className="w-2.5 h-2.5 rounded-sm bg-primary/20" />
        <div className="w-2.5 h-2.5 rounded-sm bg-primary/40" />
        <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
        <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
        <span>More</span>
      </div>
    </div>
  );
};
