import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { BarChart3 } from "lucide-react";
import { DailyStats } from "@/types/analytics";

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
      focus: Math.round(stat.totalFocusTime / 60), // Convert to minutes
      break: Math.round(stat.totalBreakTime / 60),
      goalMet: stat.goalMet,
      isToday: index === dailyStats.length - 1,
    };
  });

  // Ensure we always have 7 days
  while (chartData.length < 7) {
    chartData.unshift({
      day: DAY_LABELS[chartData.length],
      focus: 0,
      break: 0,
      goalMet: false,
      isToday: false,
    });
  }

  const maxValue = Math.max(
    dailyGoalMinutes,
    ...chartData.map(d => d.focus + d.break)
  );

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">This Week</span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              hide
              domain={[0, maxValue * 1.1]}
            />
            <ReferenceLine
              y={dailyGoalMinutes}
              stroke="hsl(var(--primary))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <Bar
              dataKey="focus"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.goalMet
                      ? 'hsl(142 76% 36%)' // green-500
                      : entry.isToday
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--primary) / 0.6)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-primary" />
          <span>Focus Time</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-green-500" />
          <span>Goal Met</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 border-t border-dashed border-primary/50" />
          <span>Daily Goal</span>
        </div>
      </div>
    </div>
  );
};
