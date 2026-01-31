import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useStreakSystem } from "@/hooks/useStreakSystem";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { AnalyticsStatCards } from "./AnalyticsStatCards";
import { AnalyticsGoalRing } from "./AnalyticsGoalRing";
import { AnalyticsWeeklyChart } from "./AnalyticsWeeklyChart";
import { AnalyticsHeatmap } from "./AnalyticsHeatmap";
import { AnalyticsBestHours } from "./AnalyticsBestHours";
import { AnalyticsSessionHistory } from "./AnalyticsSessionHistory";
import { AnalyticsRecords } from "./AnalyticsRecords";
import { AnalyticsComparison } from "./AnalyticsComparison";
import { AnalyticsCategoryBreakdown } from "./AnalyticsCategoryBreakdown";
import { PremiumSubscription } from "@/components/PremiumSubscription";
import { Loader2, Lock, Crown } from "lucide-react";

export const Analytics = () => {
  const {
    isLoaded,
    settings,
    records,
    todayStats,
    thisWeekStats,
    lastWeekStats,
    dailyStats,
    hourlyDistribution,
    bestFocusHours,
    weekOverWeekChange,
    currentGoalStreak,
    thisWeekCategoryDistribution,
    getDailyStatsRange,
    getRecentSessions,
    formatDuration,
  } = useAnalytics();

  const { streakData } = useStreakSystem();
  const { hasFullAnalytics } = usePremiumStatus();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const fullAnalytics = hasFullAnalytics();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const recentSessions = getRecentSessions(20);
  const last7Days = getDailyStatsRange(7);

  return (
    <div className="pb-24">
      <div className="px-4 py-3 space-y-3">
        {/* Quick Stats — Free */}
        <AnalyticsStatCards
          todayFocusTime={todayStats.totalFocusTime}
          currentStreak={streakData.currentStreak}
          weeklyFocusTime={thisWeekStats.totalFocusTime}
          weekOverWeekChange={weekOverWeekChange}
          formatDuration={formatDuration}
        />

        {/* Daily Goal Ring — Free */}
        <AnalyticsGoalRing
          currentMinutes={Math.floor(todayStats.totalFocusTime / 60)}
          goalMinutes={settings.dailyGoalMinutes}
          goalStreak={currentGoalStreak}
          formatDuration={formatDuration}
        />

        {/* Weekly Chart — Free */}
        <AnalyticsWeeklyChart
          dailyStats={last7Days}
          dailyGoalMinutes={settings.dailyGoalMinutes}
        />

        {/* Premium Analytics Section */}
        {fullAnalytics ? (
          <>
            {/* Category Breakdown */}
            <AnalyticsCategoryBreakdown
              categoryDistribution={thisWeekCategoryDistribution}
              formatDuration={formatDuration}
            />

            {/* Week vs Week Comparison */}
            <AnalyticsComparison
              thisWeek={thisWeekStats}
              lastWeek={lastWeekStats}
              formatDuration={formatDuration}
            />

            {/* Activity Heatmap */}
            <AnalyticsHeatmap
              dailyStats={dailyStats}
              dailyGoalMinutes={settings.dailyGoalMinutes}
            />

            {/* Best Focus Hours */}
            <AnalyticsBestHours
              hourlyDistribution={hourlyDistribution}
              bestFocusHours={bestFocusHours}
              formatDuration={formatDuration}
            />

            {/* Personal Records */}
            <AnalyticsRecords
              records={records}
              formatDuration={formatDuration}
            />

            {/* Session History */}
            <AnalyticsSessionHistory
              sessions={recentSessions}
              formatDuration={formatDuration}
            />
          </>
        ) : (
          /* Locked Premium Analytics Preview */
          <div className="relative rounded-xl overflow-hidden">
            {/* Blurred preview of premium content */}
            <div className="pointer-events-none select-none blur-[6px] opacity-50 space-y-3">
              <AnalyticsCategoryBreakdown
                categoryDistribution={thisWeekCategoryDistribution}
                formatDuration={formatDuration}
              />
              <AnalyticsComparison
                thisWeek={thisWeekStats}
                lastWeek={lastWeekStats}
                formatDuration={formatDuration}
              />
              <AnalyticsHeatmap
                dailyStats={dailyStats}
                dailyGoalMinutes={settings.dailyGoalMinutes}
              />
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/60 backdrop-blur-sm rounded-xl">
              <div
                className="flex flex-col items-center gap-3 p-6 rounded-xl text-center"
                style={{
                  background: 'linear-gradient(180deg, hsl(260 25% 20%) 0%, hsl(260 30% 15%) 100%)',
                  border: '3px solid hsl(35 80% 50%)',
                  boxShadow: '0 4px 0 hsl(260 50% 12%), 0 0 20px hsl(35 100% 50% / 0.15)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(35 90% 55%) 0%, hsl(25 90% 50%) 100%)',
                    border: '3px solid hsl(40 80% 65%)',
                    boxShadow: '0 4px 0 hsl(25 80% 30%)',
                  }}
                >
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider retro-pixel-text">
                    Premium Analytics
                  </h3>
                  <p className="text-[11px] mt-1" style={{ color: 'hsl(260 20% 55%)' }}>
                    Category breakdown, heatmaps, best hours, records & session history
                  </p>
                </div>
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="mt-1 px-6 py-2.5 rounded-lg border-[3px] font-black uppercase tracking-wider text-sm text-white flex items-center gap-2 active:translate-y-1 transition-all"
                  style={{
                    background: 'linear-gradient(180deg, hsl(35 80% 55%) 0%, hsl(35 85% 45%) 50%, hsl(35 90% 35%) 100%)',
                    borderColor: 'hsl(35 70% 65%)',
                    boxShadow: '0 5px 0 hsl(35 90% 25%), inset 0 2px 0 hsl(35 60% 70%), 0 0 15px hsl(35 100% 50% / 0.4)',
                    textShadow: '0 2px 0 rgba(0,0,0,0.3)',
                  }}
                >
                  <Crown className="w-4 h-4" />
                  Unlock with Premium
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PremiumSubscription isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

export default Analytics;
