import { cn } from "@/lib/utils";

interface BarData {
  day: string;
  value: number;
  maxValue: number;
  goalValue: number;
  goalMet: boolean;
  isToday: boolean;
}

interface SimpleBarChartProps {
  data: BarData[];
}

export const SimpleBarChart = ({ data }: SimpleBarChartProps) => {
  const maxDisplayValue = Math.max(...data.map(d => d.maxValue), ...data.map(d => d.goalValue), 1);

  return (
    <div className="h-44 flex items-end justify-between gap-1.5 relative px-1">
      {/* Goal line with label */}
      {data.length > 0 && data[0].goalValue > 0 && (
        <div
          className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
          style={{
            bottom: `${(data[0].goalValue / maxDisplayValue) * 100}%`,
          }}
        >
          <div className="flex-1 border-t-2 border-dashed border-primary/40" />
        </div>
      )}

      {/* Bars */}
      {data.map((item, index) => {
        const heightPercent = maxDisplayValue > 0 ? (item.value / maxDisplayValue) * 100 : 0;

        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            {/* Value label on top */}
            {item.value > 0 && (
              <span className={cn(
                "text-[9px] font-bold tabular-nums",
                item.goalMet ? "text-green-600" : "text-muted-foreground"
              )}>
                {item.value}m
              </span>
            )}
            <div className="w-full flex-1 flex items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-[28px] rounded-md transition-all duration-500 relative overflow-hidden",
                  item.goalMet
                    ? "bg-green-500"
                    : item.isToday
                      ? "bg-primary"
                      : "bg-primary/50",
                  item.isToday && !item.goalMet && "ring-2 ring-primary/30 ring-offset-1 ring-offset-card"
                )}
                style={{
                  height: `${Math.max(heightPercent, item.value > 0 ? 4 : 0)}%`,
                  minHeight: item.value > 0 ? '6px' : '0px',
                }}
              >
                {/* Glossy highlight */}
                <div className="absolute inset-x-0 top-0 h-1/3 bg-white/15 rounded-t-md" />
              </div>
            </div>
            <span className={cn(
              "text-[10px] font-semibold",
              item.isToday ? "text-primary" : "text-muted-foreground"
            )}>
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
};
