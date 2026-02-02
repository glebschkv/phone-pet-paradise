/**
 * StatsView Component
 *
 * Displays the analytics/stats view with lazy-loaded Analytics component.
 * Note: ViewToggle is rendered by the parent UnifiedFocusTimer to keep
 * it in a fixed position across view switches.
 */

import { lazy, Suspense } from "react";

// Lazy load Analytics to reduce initial bundle (contains recharts)
const Analytics = lazy(() => import("../analytics").then(m => ({ default: m.Analytics })));

export const StatsView = () => {
  return (
    <div className="relative z-10">
      {/* Analytics Content - Lazy loaded */}
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Analytics />
      </Suspense>
    </div>
  );
};
