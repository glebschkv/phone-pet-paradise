import { FocusCategory, FOCUS_CATEGORIES } from "@/types/analytics";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";

const CATEGORY_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  work: { bar: "bg-blue-500", bg: "bg-blue-500/10", text: "text-blue-600" },
  study: { bar: "bg-purple-500", bg: "bg-purple-500/10", text: "text-purple-600" },
  creative: { bar: "bg-pink-500", bg: "bg-pink-500/10", text: "text-pink-600" },
  personal: { bar: "bg-green-500", bg: "bg-green-500/10", text: "text-green-600" },
  health: { bar: "bg-orange-500", bg: "bg-orange-500/10", text: "text-orange-600" },
  other: { bar: "bg-slate-400", bg: "bg-slate-400/10", text: "text-slate-500" },
};

interface AnalyticsCategoryBreakdownProps {
  categoryDistribution: Record<FocusCategory, number>;
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

export const AnalyticsCategoryBreakdown = ({
  categoryDistribution,
  formatDuration,
}: AnalyticsCategoryBreakdownProps) => {
  // Calculate total time and filter out categories with 0 time
  const totalTime = Object.values(categoryDistribution).reduce((sum, time) => sum + time, 0);

  const categoriesWithTime = FOCUS_CATEGORIES
    .map(cat => ({
      ...cat,
      time: categoryDistribution[cat.id] || 0,
      percentage: totalTime > 0 ? ((categoryDistribution[cat.id] || 0) / totalTime) * 100 : 0,
    }))
    .sort((a, b) => b.time - a.time);

  const hasData = totalTime > 0;

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Focus by Category</span>
        <span className="ml-auto text-[10px] text-muted-foreground">This Week</span>
      </div>

      {!hasData ? (
        <div className="text-center py-6 text-muted-foreground">
          <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No category data yet</p>
          <p className="text-xs mt-1">Start a focus session to track your time by category</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {categoriesWithTime.map((cat) => {
            const colors = CATEGORY_COLORS[cat.id] || CATEGORY_COLORS.other;
            return (
              <div key={cat.id} className="flex items-center gap-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base",
                  colors.bg,
                )}>
                  <PixelIcon name={cat.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{cat.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{formatDuration(cat.time)}</span>
                      <span className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                        cat.percentage > 0 ? cn(colors.bg, colors.text) : "text-muted-foreground"
                      )}>
                        {cat.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        colors.bar
                      )}
                      style={{ width: `${Math.max(cat.percentage, cat.time > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="pt-2.5 mt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Total Focus Time</span>
              <span className="text-sm font-bold">{formatDuration(totalTime)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
