import { BarChart3 } from "lucide-react";
import { DailyStats } from "@/types/analytics";
import { SimpleBarChart } from "./SimpleBarChart";

interface WeeklyChartProps {
  dailyStats: DailyStats[];
  dailyGoalMinutes: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AnalyticsWeeklyChart = ({ dailyStats, dailyGoalMinutes }: WeeklyChartProps) => {
  // Transform data for chart (last 7 days)
  const chartData = dailyStats.slice(-7).map((stat, index) => {
    const date = new Date(stat.date);
    const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

    return {
      day: DAY_LABELS[dayIndex],
      value: Math.round(stat.totalFocusTime / 60), // Convert to minutes
      maxValue: Math.round((stat.totalFocusTime + stat.totalBreakTime) / 60),
      goalValue: dailyGoalMinutes,
      goalMet: stat.goalMet,
      isToday: index === dailyStats.length - 1,
    };
  });

  // Ensure we always have 7 days
  while (chartData.length < 7) {
    chartData.unshift({
      day: DAY_LABELS[chartData.length],
      value: 0,
      maxValue: 0,
      goalValue: dailyGoalMinutes,
      goalMet: false,
      isToday: false,
    });
  }

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
