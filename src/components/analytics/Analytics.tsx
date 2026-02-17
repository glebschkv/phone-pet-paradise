import { useState, useEffect, useRef } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useStreakSystem } from "@/hooks/useStreakSystem";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { AnalyticsStatCards } from "./AnalyticsStatCards";
import { AnalyticsGoalRing } from "./AnalyticsGoalRing";
import { AnalyticsWeeklyChart } from "./AnalyticsWeeklyChart";
import { AnalyticsFocusScore } from "./AnalyticsFocusScore";
import { AnalyticsFocusScoreTrend } from "./AnalyticsFocusScoreTrend";
import { AnalyticsWeeklyReport } from "./AnalyticsWeeklyReport";
import { AnalyticsStreakAlert } from "./AnalyticsStreakAlert";
import { AnalyticsHeatmap } from "./AnalyticsHeatmap";
import { AnalyticsBestHours } from "./AnalyticsBestHours";
import { AnalyticsSessionHistory } from "./AnalyticsSessionHistory";
import { AnalyticsRecords } from "./AnalyticsRecords";
import { AnalyticsComparison } from "./AnalyticsComparison";
import { AnalyticsCategoryBreakdown } from "./AnalyticsCategoryBreakdown";
import { AnalyticsFocusQuality } from "./AnalyticsFocusQuality";
import { AnalyticsInsights } from "./AnalyticsInsights";
import { AnalyticsMilestones } from "./AnalyticsMilestones";
import { AnalyticsCompletionTrend } from "./AnalyticsCompletionTrend";
import { AnalyticsMonthlySummary } from "./AnalyticsMonthlySummary";
import { CollapsibleAnalyticsSection } from "./CollapsibleAnalyticsSection";
import { PremiumSubscription } from "@/components/PremiumSubscription";
import {
  Loader2,
  Lock,
  Crown,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  CalendarDays,
  Clock,
  BarChart3,
  ListChecks,
  Shield,
  PieChart,
  Flag,
  CalendarRange,
  Trophy,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tab types ───────────────────────────────────────────
type AnalyticsTab = "overview" | "trends" | "details";

const TABS: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "trends", label: "Trends", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: "details", label: "Details", icon: <ListChecks className="w-3.5 h-3.5" /> },
];

// ─── Inline upgrade prompt ───────────────────────────────
const InlineUpgradePrompt = ({
  icon: Icon,
  text,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
    style={{
      background: 'linear-gradient(135deg, hsl(35 80% 50% / 0.08) 0%, hsl(280 60% 50% / 0.06) 100%)',
      border: '1.5px dashed hsl(35 70% 50% / 0.25)',
    }}
  >
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, hsl(35 80% 50% / 0.2) 0%, hsl(35 90% 40% / 0.1) 100%)',
      }}
    >
      <Icon className="w-3.5 h-3.5 text-amber-500" />
    </div>
    <span className="text-[11px] text-amber-700 font-semibold flex-1 text-left">
      {text}
    </span>
    <div className="flex items-center gap-1">
      <Crown className="w-3 h-3 text-amber-500/50" />
      <ChevronRight className="w-3 h-3 text-amber-500/40" />
    </div>
  </button>
);

// ─── Premium locked preview ──────────────────────────────
const PremiumLockedPreview = ({
  dailyStats,
  thisWeekCategoryDistribution,
  settings,
  formatDuration,
  premiumTeasers,
  teaserIndex,
  onUpgrade,
}: {
  dailyStats: Record<string, any>;
  thisWeekCategoryDistribution: any;
  settings: any;
  formatDuration: any;
  premiumTeasers: string[];
  teaserIndex: number;
  onUpgrade: () => void;
}) => (
  <div className="relative rounded-xl overflow-hidden">
    {/* Blurred premium content preview */}
    <div className="pointer-events-none select-none blur-[6px] opacity-40 space-y-3">
      <AnalyticsCategoryBreakdown
        categoryDistribution={thisWeekCategoryDistribution}
        formatDuration={formatDuration}
      />
      <AnalyticsHeatmap
        dailyStats={dailyStats}
        dailyGoalMinutes={settings.dailyGoalMinutes}
      />
    </div>

    {/* Personalized lock overlay */}
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/60 backdrop-blur-sm rounded-xl">
      <div
        className="flex flex-col items-center gap-3 p-6 rounded-xl text-center max-w-[280px]"
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

        {/* Rotating personalized teaser */}
        <div className="min-h-[44px] flex flex-col justify-center">
          <h3 className="text-white font-black text-sm uppercase tracking-wider retro-pixel-text">
            Premium Analytics
          </h3>
          {premiumTeasers.length > 0 ? (
            <p
              key={teaserIndex}
              className="text-[11px] mt-1 animate-in fade-in duration-500"
              style={{ color: 'hsl(260 20% 55%)' }}
            >
              {premiumTeasers[teaserIndex]}
            </p>
          ) : (
            <p className="text-[11px] mt-1" style={{ color: 'hsl(260 20% 55%)' }}>
              Insights, heatmaps, focus quality, milestones & more
            </p>
          )}
        </div>

        {/* Feature count */}
        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'hsl(260 20% 45%)' }}>
          <span>15 Premium Features</span>
          <span>|</span>
          <span>Unlimited History</span>
        </div>

        <button
          onClick={onUpgrade}
          className="mt-1 px-6 py-2.5 rounded-lg border-[3px] font-black uppercase tracking-wider text-sm text-white flex items-center gap-2 active:translate-y-1 transition-all"
          style={{
            background: 'linear-gradient(180deg, hsl(35 80% 55%) 0%, hsl(35 85% 45%) 50%, hsl(35 90% 35%) 100%)',
            borderColor: 'hsl(35 70% 65%)',
            boxShadow: '0 5px 0 hsl(35 90% 25%), inset 0 2px 0 hsl(35 60% 70%), 0 0 15px hsl(35 100% 50% / 0.4)',
            textShadow: '0 2px 0 rgba(0,0,0,0.3)',
          }}
        >
          <Crown className="w-4 h-4" />
          Unlock Premium
        </button>
      </div>
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────
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
    focusScore,
    focusScoreHistory,
    peerBenchmark,
    focusQualityStats,
    completionTrend,
    milestones,
    currentMonthStats,
    previousMonthStats,
    insights,
    premiumTeasers,
    getDailyStatsRange,
    getRecentSessions,
    formatDuration,
  } = useAnalytics();

  const { streakData } = useStreakSystem();
  const { hasFullAnalytics } = usePremiumStatus();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");

  const fullAnalytics = hasFullAnalytics();

  // Rotating teaser index
  const [teaserIndex, setTeaserIndex] = useState(0);
  useEffect(() => {
    if (premiumTeasers.length <= 1) return;
    const interval = setInterval(() => {
      setTeaserIndex(prev => (prev + 1) % premiumTeasers.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [premiumTeasers.length]);

  // Tab bar sliding indicator
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeBtn = tabBarRef.current.querySelector(
      `[data-tab="${activeTab}"]`
    ) as HTMLElement | null;
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeTab]);

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
      {/* ─── Sticky Tab Bar ─── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div ref={tabBarRef} className="flex relative px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground/60"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          {/* Sliding underline */}
          <div
            className="absolute bottom-0 h-[2.5px] rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* ════════════════════════════════════════════════════════════════
            OVERVIEW TAB — Today snapshot, score, weekly chart
            ════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Quick Stats */}
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

            {/* Streak Alert */}
            <AnalyticsStreakAlert
              currentStreak={streakData.currentStreak}
              lastSessionDate={streakData.lastSessionDate}
              streakFreezeCount={streakData.streakFreezeCount}
              dailyGoalMinutes={settings.dailyGoalMinutes}
              todayFocusMinutes={Math.floor(todayStats.totalFocusTime / 60)}
            />

            {/* Focus Score */}
            <AnalyticsFocusScore
              score={focusScore.score}
              breakdown={focusScore.breakdown}
              peerBenchmark={peerBenchmark}
              isPremium={fullAnalytics}
              onUpgrade={() => setShowPremiumModal(true)}
            />

            {/* Weekly Chart */}
            <AnalyticsWeeklyChart
              dailyStats={last7Days}
              dailyGoalMinutes={settings.dailyGoalMinutes}
            />

            {/* Upgrade prompt (free tier) */}
            {!fullAnalytics && (
              <InlineUpgradePrompt
                icon={TrendingUp}
                text="See how this week compares to last week"
                onClick={() => setShowPremiumModal(true)}
              />
            )}

            {/* Weekly Report */}
            <AnalyticsWeeklyReport
              thisWeek={thisWeekStats}
              lastWeek={lastWeekStats}
              focusScore={focusScore.score}
              weekOverWeekChange={weekOverWeekChange}
              categoryDistribution={thisWeekCategoryDistribution}
              formatDuration={formatDuration}
              isPremium={fullAnalytics}
              onUpgrade={() => setShowPremiumModal(true)}
            />

            {/* Insights */}
            {fullAnalytics ? (
              <AnalyticsInsights insights={insights} />
            ) : (
              insights.length > 0 && (
                <div className="relative">
                  <AnalyticsInsights insights={insights.slice(0, 1)} />
                  {insights.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent rounded-b-xl" />
                  )}
                </div>
              )
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TRENDS TAB — Comparisons, quality, monthly
            ════════════════════════════════════════════════════════════════ */}
        {activeTab === "trends" && (
          <>
            {fullAnalytics ? (
              <>
                {/* Focus Score Trend */}
                <AnalyticsFocusScoreTrend
                  history={focusScoreHistory}
                  currentScore={focusScore.score}
                  isPremium={true}
                  onUpgrade={() => setShowPremiumModal(true)}
                />

                {/* Week vs Week */}
                <AnalyticsComparison
                  thisWeek={thisWeekStats}
                  lastWeek={lastWeekStats}
                  formatDuration={formatDuration}
                />

                {/* Completion Rate (collapsible) */}
                <CollapsibleAnalyticsSection
                  title="Completion Rate"
                  icon={<PieChart className="w-4 h-4" />}
                  badge="30 days"
                >
                  <AnalyticsCompletionTrend trend={completionTrend} />
                </CollapsibleAnalyticsSection>

                {/* Focus Quality (collapsible) */}
                <CollapsibleAnalyticsSection
                  title="Focus Quality"
                  icon={<Shield className="w-4 h-4" />}
                  badge="30 days"
                >
                  <AnalyticsFocusQuality
                    stats={focusQualityStats}
                    formatDuration={formatDuration}
                  />
                </CollapsibleAnalyticsSection>

                {/* Monthly Report (collapsible) */}
                <CollapsibleAnalyticsSection
                  title="Monthly Report"
                  icon={<CalendarRange className="w-4 h-4" />}
                >
                  <AnalyticsMonthlySummary
                    stats={currentMonthStats}
                    previousMonth={previousMonthStats}
                    formatDuration={formatDuration}
                  />
                </CollapsibleAnalyticsSection>
              </>
            ) : (
              <>
                {/* Score trend teaser */}
                <AnalyticsFocusScoreTrend
                  history={focusScoreHistory}
                  currentScore={focusScore.score}
                  isPremium={false}
                  onUpgrade={() => setShowPremiumModal(true)}
                />

                <InlineUpgradePrompt
                  icon={LayoutGrid}
                  text="See your focus time breakdown by category"
                  onClick={() => setShowPremiumModal(true)}
                />

                <PremiumLockedPreview
                  dailyStats={dailyStats}
                  thisWeekCategoryDistribution={thisWeekCategoryDistribution}
                  settings={settings}
                  formatDuration={formatDuration}
                  premiumTeasers={premiumTeasers}
                  teaserIndex={teaserIndex}
                  onUpgrade={() => setShowPremiumModal(true)}
                />

                <InlineUpgradePrompt
                  icon={CalendarDays}
                  text="View your 12-week activity heatmap"
                  onClick={() => setShowPremiumModal(true)}
                />
                <InlineUpgradePrompt
                  icon={Clock}
                  text="Discover your peak focus hours"
                  onClick={() => setShowPremiumModal(true)}
                />
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            DETAILS TAB — Categories, heatmap, records, sessions
            ════════════════════════════════════════════════════════════════ */}
        {activeTab === "details" && (
          <>
            {fullAnalytics ? (
              <>
                {/* Category Breakdown */}
                <AnalyticsCategoryBreakdown
                  categoryDistribution={thisWeekCategoryDistribution}
                  formatDuration={formatDuration}
                />

                {/* Activity Heatmap */}
                <AnalyticsHeatmap
                  dailyStats={dailyStats}
                  dailyGoalMinutes={settings.dailyGoalMinutes}
                />

                {/* Peak Focus Hours (collapsible) */}
                <CollapsibleAnalyticsSection
                  title="Peak Focus Hours"
                  icon={<Clock className="w-4 h-4" />}
                >
                  <AnalyticsBestHours
                    hourlyDistribution={hourlyDistribution}
                    bestFocusHours={bestFocusHours}
                    formatDuration={formatDuration}
                  />
                </CollapsibleAnalyticsSection>

                {/* Milestones (collapsible) */}
                <CollapsibleAnalyticsSection
                  title="Next Milestones"
                  icon={<Flag className="w-4 h-4" />}
                >
                  <AnalyticsMilestones milestones={milestones} />
                </CollapsibleAnalyticsSection>

                {/* Personal Records (collapsible) */}
                <CollapsibleAnalyticsSection
                  title="Personal Records"
                  icon={<Trophy className="w-4 h-4" />}
                >
                  <AnalyticsRecords
                    records={records}
                    formatDuration={formatDuration}
                  />
                </CollapsibleAnalyticsSection>

                {/* Session History (collapsed by default) */}
                <CollapsibleAnalyticsSection
                  title="Recent Sessions"
                  icon={<History className="w-4 h-4" />}
                  badge={`${recentSessions.length}`}
                  defaultOpen={false}
                >
                  <AnalyticsSessionHistory
                    sessions={recentSessions}
                    formatDuration={formatDuration}
                  />
                </CollapsibleAnalyticsSection>
              </>
            ) : (
              <>
                <PremiumLockedPreview
                  dailyStats={dailyStats}
                  thisWeekCategoryDistribution={thisWeekCategoryDistribution}
                  settings={settings}
                  formatDuration={formatDuration}
                  premiumTeasers={premiumTeasers}
                  teaserIndex={teaserIndex}
                  onUpgrade={() => setShowPremiumModal(true)}
                />

                <InlineUpgradePrompt
                  icon={CalendarDays}
                  text="View your 12-week activity heatmap"
                  onClick={() => setShowPremiumModal(true)}
                />
                <InlineUpgradePrompt
                  icon={Clock}
                  text="Discover your peak focus hours"
                  onClick={() => setShowPremiumModal(true)}
                />
                <InlineUpgradePrompt
                  icon={Trophy}
                  text="Track your personal records & milestones"
                  onClick={() => setShowPremiumModal(true)}
                />
              </>
            )}
          </>
        )}
      </div>

      <PremiumSubscription isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

export default Analytics;
