import { FocusCategory, FOCUS_CATEGORIES } from "@/types/analytics";
import { cn } from "@/lib/utils";

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
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white/80 mb-3">
        Focus by Category
        <span className="text-white/50 font-normal ml-2">(This Week)</span>
      </h3>

      {!hasData ? (
        <div className="text-center py-6 text-white/50 text-sm">
          <p>No category data yet</p>
          <p className="text-xs mt-1">Start a focus session to track your time by category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categoriesWithTime.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-white/90 font-medium">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/70">{formatDuration(cat.time)}</span>
                  <span className="text-white/50 text-xs w-10 text-right">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    cat.color
                  )}
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="pt-2 mt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Total Focus Time</span>
              <span className="text-white font-semibold">{formatDuration(totalTime)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
