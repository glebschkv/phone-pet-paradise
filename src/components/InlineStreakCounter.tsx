import { Flame } from "lucide-react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  totalSessions: number;
  streakFreezeCount: number;
}

interface InlineStreakCounterProps {
  streakData: StreakData;
  getStreakEmoji: (streak: number) => string;
}

export const InlineStreakCounter = ({
  streakData,
  getStreakEmoji
}: InlineStreakCounterProps) => {
  const hasStreak = streakData.currentStreak >= 3;

  return (
    <div className="retro-stat-pill flex items-center gap-2 px-3 py-1.5">
      <Flame className={`w-4 h-4 text-orange-500 ${hasStreak ? 'streak-glow' : ''}`} />
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-foreground tabular-nums">
          {streakData.currentStreak}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          day{streakData.currentStreak !== 1 ? 's' : ''}
        </span>
      </div>
      {hasStreak && (
        <span className="text-base leading-none">
          {getStreakEmoji(streakData.currentStreak)}
        </span>
      )}
    </div>
  );
};
