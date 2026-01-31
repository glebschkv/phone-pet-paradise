import { Gauge, Lock, Crown, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusScoreProps {
  score: number;
  breakdown: {
    completion: number;
    consistency: number;
    quality: number;
    duration: number;
  };
  peerBenchmark: number; // percentile 0-99
  isPremium: boolean;
  onUpgrade: () => void;
}

const SCORE_GRADE = (score: number) => {
  if (score >= 90) return { label: 'Elite', color: 'text-amber-400', bgColor: 'from-amber-500/20 to-amber-600/10', ring: 'text-amber-500' };
  if (score >= 75) return { label: 'Great', color: 'text-green-400', bgColor: 'from-green-500/20 to-green-600/10', ring: 'text-green-500' };
  if (score >= 55) return { label: 'Good', color: 'text-blue-400', bgColor: 'from-blue-500/20 to-blue-600/10', ring: 'text-blue-500' };
  if (score >= 35) return { label: 'Building', color: 'text-purple-400', bgColor: 'from-purple-500/20 to-purple-600/10', ring: 'text-purple-500' };
  return { label: 'Starting', color: 'text-muted-foreground', bgColor: 'from-muted/20 to-muted/10', ring: 'text-muted-foreground' };
};

const BREAKDOWN_ITEMS = [
  { key: 'completion' as const, label: 'Completion', max: 25, color: 'bg-green-500' },
  { key: 'consistency' as const, label: 'Consistency', max: 25, color: 'bg-blue-500' },
  { key: 'quality' as const, label: 'Focus Quality', max: 25, color: 'bg-purple-500' },
  { key: 'duration' as const, label: 'Session Length', max: 25, color: 'bg-amber-500' },
];

export const AnalyticsFocusScore = ({ score, breakdown, peerBenchmark, isPremium, onUpgrade }: FocusScoreProps) => {
  const grade = SCORE_GRADE(score);

  // SVG ring parameters
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Focus Score</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Last 30 days</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn("transition-all duration-1000", grade.ring)}
              style={{
                filter: score >= 75 ? `drop-shadow(0 0 4px currentColor)` : undefined,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-extrabold tabular-nums", grade.color)}>
              {score}
            </span>
            <span className={cn("text-[9px] font-bold uppercase tracking-wider", grade.color)}>
              {grade.label}
            </span>
          </div>
        </div>

        {/* Breakdown or Locked CTA */}
        <div className="flex-1 min-w-0">
          {isPremium ? (
            <div className="space-y-2">
              {BREAKDOWN_ITEMS.map(item => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                    <span className="text-[10px] font-bold tabular-nums">{breakdown[item.key]}/{item.max}</span>
                  </div>
                  <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", item.color)}
                      style={{ width: `${(breakdown[item.key] / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {/* Peer Benchmark */}
              {peerBenchmark > 0 && (
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/30 mt-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Better than</span>
                  <span className={cn("text-[10px] font-bold tabular-nums", peerBenchmark >= 70 ? 'text-green-500' : peerBenchmark >= 40 ? 'text-blue-400' : 'text-muted-foreground')}>
                    {peerBenchmark}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">of focusers</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Teaser breakdown — blurred values */}
              {BREAKDOWN_ITEMS.map(item => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                    <span className="text-[10px] font-bold tabular-nums blur-[4px] select-none">
                      {breakdown[item.key]}/{item.max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full opacity-30", item.color)}
                      style={{ width: `${(breakdown[item.key] / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Blurred peer benchmark teaser */}
              {peerBenchmark > 0 && (
                <div className="flex items-center gap-1.5 pt-1 opacity-40 blur-[3px] select-none pointer-events-none">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Better than {peerBenchmark}% of focusers</span>
                </div>
              )}

              {/* Unlock CTA */}
              <button
                onClick={onUpgrade}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, hsl(35 80% 50% / 0.15) 0%, hsl(35 90% 40% / 0.08) 100%)',
                  border: '1.5px solid hsl(35 70% 50% / 0.3)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-400">See score breakdown</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-500/60" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
