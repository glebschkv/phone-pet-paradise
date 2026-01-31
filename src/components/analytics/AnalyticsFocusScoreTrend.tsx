import { TrendingUp, Lock, Crown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusScoreTrendProps {
  history: { date: string; score: number }[];
  currentScore: number;
  isPremium: boolean;
  onUpgrade: () => void;
}

export const AnalyticsFocusScoreTrend = ({ history, currentScore, isPremium, onUpgrade }: FocusScoreTrendProps) => {
  if (history.length < 2 && !isPremium) return null;

  // Build SVG sparkline path
  const width = 240;
  const height = 60;
  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = history.length >= 2 ? history : [{ date: '', score: currentScore }, { date: '', score: currentScore }];
  const minScore = Math.max(0, Math.min(...points.map(p => p.score)) - 10);
  const maxScore = Math.min(100, Math.max(...points.map(p => p.score)) + 10);
  const range = Math.max(maxScore - minScore, 1);

  const coords = points.map((p, i) => ({
    x: padding + (i / (points.length - 1)) * chartW,
    y: padding + chartH - ((p.score - minScore) / range) * chartH,
  }));

  // Create smooth path
  const pathD = coords.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = coords[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  // Gradient fill path
  const fillD = `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

  // Trend direction
  const firstScore = points[0].score;
  const trend = currentScore - firstScore;
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-400' : 'text-muted-foreground';
  const strokeColor = trend >= 0 ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)';
  const fillColor = trend >= 0 ? 'hsl(142 71% 45% / 0.1)' : 'hsl(0 84% 60% / 0.08)';

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Score Trend</span>
        <span className="ml-auto text-[10px] text-muted-foreground">30 days</span>
      </div>

      {isPremium ? (
        <>
          {history.length < 2 ? (
            <div className="text-center py-6 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Score trend will appear after 2+ days</p>
              <p className="text-xs mt-1">Keep focusing to build your trend line</p>
            </div>
          ) : (
            <>
              {/* Sparkline */}
              <div className="mb-3">
                <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                  {/* Fill area */}
                  <path d={fillD} fill={fillColor} />
                  {/* Line */}
                  <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
                  {/* Current point */}
                  <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3.5" fill={strokeColor} />
                  <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="5" fill="none" stroke={strokeColor} strokeWidth="1" opacity="0.4" />
                </svg>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Change</div>
                  <div className={cn("text-sm font-bold tabular-nums", trendColor)}>
                    {trend > 0 ? '+' : ''}{trend} pts
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Started at</div>
                  <div className="text-sm font-bold tabular-nums">{firstScore}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Now</div>
                  <div className="text-sm font-extrabold tabular-nums text-primary">{currentScore}</div>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="relative">
          {/* Blurred sparkline teaser */}
          <div className="pointer-events-none select-none blur-[5px] opacity-30">
            <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
              <path d={fillD} fill={fillColor} />
              <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" />
            </svg>
          </div>
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-all active:scale-[0.98] mt-2"
            style={{
              background: 'linear-gradient(135deg, hsl(35 80% 50% / 0.12) 0%, hsl(35 90% 40% / 0.06) 100%)',
              border: '1.5px solid hsl(35 70% 50% / 0.25)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-700">Track your score over time</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-amber-500/60" />
          </button>
        </div>
      )}
    </div>
  );
};
