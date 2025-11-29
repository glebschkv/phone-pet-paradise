import { useAnalytics } from "@/hooks/useAnalytics";
import { useStreakSystem } from "@/hooks/useStreakSystem";
import { AnalyticsStatCards } from "./AnalyticsStatCards";
import { AnalyticsGoalRing } from "./AnalyticsGoalRing";
import { AnalyticsWeeklyChart } from "./AnalyticsWeeklyChart";
import { AnalyticsHeatmap } from "./AnalyticsHeatmap";
import { AnalyticsBestHours } from "./AnalyticsBestHours";
import { AnalyticsSessionHistory } from "./AnalyticsSessionHistory";
import { AnalyticsRecords } from "./AnalyticsRecords";
import { AnalyticsComparison } from "./AnalyticsComparison";
import { BarChart3, Loader2 } from "lucide-react";

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
    getDailyStatsRange,
    getRecentSessions,
    formatDuration,
  } = useAnalytics();

  const { streakData } = useStreakSystem();

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
      <div className="px-4 py-2 space-y-4">
        {/* Stat Cards */}
        <AnalyticsStatCards
          todayFocusTime={todayStats.totalFocusTime}
          currentStreak={streakData.currentStreak}
          weeklyFocusTime={thisWeekStats.totalFocusTime}
          weekOverWeekChange={weekOverWeekChange}
          formatDuration={formatDuration}
        />

        {/* Daily Goal Ring */}
        <AnalyticsGoalRing
          currentMinutes={Math.floor(todayStats.totalFocusTime / 60)}
          goalMinutes={settings.dailyGoalMinutes}
          goalStreak={currentGoalStreak}
          formatDuration={formatDuration}
        />

        {/* Weekly Chart */}
        <AnalyticsWeeklyChart
          dailyStats={last7Days}
          dailyGoalMinutes={settings.dailyGoalMinutes}
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
      </div>
    </div>
  );
};

export default Analytics;
