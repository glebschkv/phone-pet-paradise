import { BarChart3 } from "lucide-react";
import { DailyStats } from "@/types/analytics";
import { SimpleBarChart } from "./SimpleBarChart";

interface WeeklyChartProps {
  dailyStats: DailyStats[];
  dailyGoalMinutes: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AnalyticsWeeklyChart = ({ dailyStats, dailyGoalMinutes }: WeeklyChartProps) => {
  // Build a lookup from date string to stat
  const statsByDate = new Map(dailyStats.map(s => [s.date, s]));

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Build chart data for the last 7 days with correct day labels
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i)); // 6 days ago → today
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const stat = statsByDate.get(dateStr);

    return {
      day: DAY_LABELS[dayIndex],
      value: stat ? Math.round(stat.totalFocusTime / 60) : 0,
      maxValue: stat ? Math.round((stat.totalFocusTime + stat.totalBreakTime) / 60) : 0,
      goalValue: dailyGoalMinutes,
      goalMet: stat?.goalMet || false,
      isToday: dateStr === todayStr,
    };
  });

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">This Week</span>
      </div>

      <SimpleBarChart data={chartData} />

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-primary" />
          <span>Focus Time</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-green-500" />
          <span>Goal Met</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t-2 border-dashed border-primary/40" />
          <span>Daily Goal</span>
        </div>
      </div>
    </div>
  );
};
