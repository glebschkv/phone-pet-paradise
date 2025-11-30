import { Clock, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

interface BestHoursProps {
  hourlyDistribution: Record<number, number>;
  bestFocusHours: { hour: number; seconds: number }[];
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

export const AnalyticsBestHours = ({
  hourlyDistribution,
  bestFocusHours,
  formatDuration,
}: BestHoursProps) => {
  const getTimeIcon = (hour: number) => {
    if (hour >= 5 && hour < 9) return <Sunrise className="w-3.5 h-3.5 text-orange-400" />;
    if (hour >= 9 && hour < 17) return <Sun className="w-3.5 h-3.5 text-yellow-500" />;
    if (hour >= 17 && hour < 21) return <Sunset className="w-3.5 h-3.5 text-orange-500" />;
    return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };


  // Calculate max for progress bars
  const maxSeconds = Math.max(...Object.values(hourlyDistribution), 1);

  // Get overall best time range
  const getBestTimeRange = () => {
    if (bestFocusHours.length === 0) return "Not enough data";
    const hours = bestFocusHours.map(h => h.hour).sort((a, b) => a - b);
    if (hours.length === 1) return formatHour(hours[0]);

    // Check if hours are consecutive
    let consecutive = true;
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] !== hours[i-1] + 1) {
        consecutive = false;
        break;
      }
    }

    if (consecutive && hours.length > 1) {
      return `${formatHour(hours[0])} - ${formatHour(hours[hours.length - 1] + 1)}`;
    }
    return formatHour(hours[0]);
  };

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Peak Focus Hours</span>
      </div>

      {bestFocusHours.length > 0 ? (
        <>
          {/* Best time summary */}
          <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-3 mb-3">
            <div className="text-xs text-muted-foreground">You focus best during</div>
            <div className="text-base font-bold text-primary">{getBestTimeRange()}</div>
          </div>

          {/* Top 3 hours */}
          <div className="space-y-2">
            {bestFocusHours.slice(0, 3).map((item, index) => (
              <div key={item.hour} className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center",
                  index === 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted/50"
                )}>
                  {getTimeIcon(item.hour)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-medium">{formatHour(item.hour)}</span>
                    <span className="text-muted-foreground">{formatDuration(item.seconds)}</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        index === 0 ? "bg-amber-500" : "bg-primary/60"
                      )}
                      style={{ width: `${(item.seconds / maxSeconds) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Complete more sessions to see your peak hours</p>
        </div>
      )}
    </div>
  );
};
