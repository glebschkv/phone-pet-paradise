import { useAnalytics } from "@/hooks/useAnalytics";

export const TimerStats = () => {
  const { todayStats } = useAnalytics();

  return (
    <div className="w-full max-w-sm">
      <div className="retro-card p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Sessions today</span>
          <span className="retro-level-badge px-3 py-1 text-sm">
            {todayStats.sessionsCompleted}
          </span>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-3">
          Complete 25+ min sessions to earn XP!
        </p>
      </div>
    </div>
  );
};
