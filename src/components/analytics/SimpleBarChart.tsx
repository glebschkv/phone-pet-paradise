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
  const maxDisplayValue = Math.max(...data.map(d => d.maxValue), ...data.map(d => d.goalValue));

  return (
    <div className="h-40 flex items-end justify-between gap-2 relative px-1">
      {/* Goal line */}
      {data.length > 0 && data[0].goalValue > 0 && (
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-primary/50"
          style={{
            bottom: `${(data[0].goalValue / maxDisplayValue) * 100}%`,
          }}
        />
      )}

      {/* Bars */}
      {data.map((item, index) => {
        const heightPercent = maxDisplayValue > 0 ? (item.value / maxDisplayValue) * 100 : 0;

        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-8 rounded-t transition-all duration-300",
                  item.goalMet
                    ? "bg-green-500"
                    : item.isToday
                      ? "bg-primary"
                      : "bg-primary/60"
                )}
                style={{
                  height: `${Math.max(heightPercent, item.value > 0 ? 4 : 0)}%`,
                  minHeight: item.value > 0 ? '4px' : '0px',
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
};
