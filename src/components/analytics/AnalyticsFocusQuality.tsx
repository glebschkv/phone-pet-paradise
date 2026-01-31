import { Shield, Sparkles, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusQualityProps {
  stats: {
    perfect: number;
    good: number;
    distracted: number;
    total: number;
    avgShieldAttempts: number;
    perfectRate: number;
    weeklyQuality: { week: string; perfect: number; good: number; distracted: number }[];
    perfectStreak: number;
  };
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

export const AnalyticsFocusQuality = ({ stats }: FocusQualityProps) => {
  const { perfect, good, distracted, total, avgShieldAttempts, perfectRate, weeklyQuality, perfectStreak } = stats;

  // Donut chart params
  const size = 80;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { value: perfect, color: 'stroke-green-500', label: 'Perfect', dotColor: 'bg-green-500' },
    { value: good, color: 'stroke-blue-500', label: 'Good', dotColor: 'bg-blue-500' },
    { value: distracted, color: 'stroke-red-400', label: 'Distracted', dotColor: 'bg-red-400' },
  ];

  let cumulativeOffset = 0;

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Focus Quality</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Last 30 days</span>
      </div>

      {total > 0 ? (
        <>
          <div className="flex items-center gap-4 mb-4">
            {/* Donut chart */}
            <div className="relative flex-shrink-0">
              <svg width={size} height={size} className="transform -rotate-90">
                <circle
                  cx={size / 2} cy={size / 2} r={radius}
                  strokeWidth={strokeWidth} stroke="currentColor" fill="none"
                  className="text-muted/20"
                />
                {segments.map((seg, i) => {
                  if (seg.value === 0) return null;
                  const segLength = (seg.value / total) * circumference;
                  const segOffset = circumference - segLength;
                  const rotation = (cumulativeOffset / total) * 360;
                  cumulativeOffset += seg.value;

                  return (
                    <circle
                      key={i}
                      cx={size / 2} cy={size / 2} r={radius}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${segLength} ${circumference - segLength}`}
                      className={seg.color}
                      style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold tabular-nums">{perfectRate}%</span>
                <span className="text-[8px] text-muted-foreground font-semibold">PERFECT</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-1.5">
              {segments.map(seg => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", seg.dotColor)} />
                  <span className="text-[11px] text-muted-foreground flex-1">{seg.label}</span>
                  <span className="text-[11px] font-bold tabular-nums">{seg.value}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-muted/20 p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Eye className="w-3 h-3 text-amber-500" />
              </div>
              <div className="text-xs font-bold tabular-nums">{avgShieldAttempts}</div>
              <div className="text-[8px] text-muted-foreground font-medium uppercase">Avg Attempts</div>
            </div>
            <div className="rounded-lg bg-muted/20 p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Sparkles className="w-3 h-3 text-green-500" />
              </div>
              <div className="text-xs font-bold tabular-nums">{perfectStreak}</div>
              <div className="text-[8px] text-muted-foreground font-medium uppercase">Perfect Streak</div>
            </div>
            <div className="rounded-lg bg-muted/20 p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
              </div>
              <div className="text-xs font-bold tabular-nums">{distracted}</div>
              <div className="text-[8px] text-muted-foreground font-medium uppercase">Distracted</div>
            </div>
          </div>

          {/* Weekly trend bars */}
          <div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">
              Weekly Trend
            </div>
            <div className="flex gap-1.5">
              {weeklyQuality.map(week => {
                const weekTotal = week.perfect + week.good + week.distracted;
                return (
                  <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-14 rounded-md bg-muted/10 flex flex-col-reverse overflow-hidden">
                      {weekTotal > 0 && (
                        <>
                          <div
                            className="w-full bg-red-400/80"
                            style={{ height: `${(week.distracted / weekTotal) * 100}%` }}
                          />
                          <div
                            className="w-full bg-blue-500/80"
                            style={{ height: `${(week.good / weekTotal) * 100}%` }}
                          />
                          <div
                            className="w-full bg-green-500/80"
                            style={{ height: `${(week.perfect / weekTotal) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">{week.week}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No quality data yet</p>
          <p className="text-xs mt-1">Enable app blocking and complete sessions to track focus quality</p>
        </div>
      )}
    </div>
  );
};
