/**
 * StatsView Component
 *
 * Displays the analytics/stats view with lazy-loaded Analytics component.
 * Includes the view toggle for switching back to timer view.
 */

import { lazy, Suspense } from "react";
import { ViewToggle } from "./ViewToggle";

// Lazy load Analytics to reduce initial bundle (contains recharts)
const Analytics = lazy(() => import("../analytics").then(m => ({ default: m.Analytics })));

type TimerViewType = 'timer' | 'stats';

interface StatsViewProps {
  currentView: TimerViewType;
  onViewChange: (view: TimerViewType) => void;
}

export const StatsView = ({ currentView, onViewChange }: StatsViewProps) => {
  return (
    <div className="relative z-10">
      {/* View Toggle - Fixed at top */}
      <div className="sticky top-0 z-20 flex justify-center pt-4 pb-2">
        <ViewToggle currentView={currentView} onViewChange={onViewChange} />
      </div>
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
