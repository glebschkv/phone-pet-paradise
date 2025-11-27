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
    <div className="streak-pill">
      <div className={`streak-icon-wrapper ${hasStreak ? 'has-streak' : ''}`}>
        <Flame className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-foreground tabular-nums">
          {streakData.currentStreak}
        </span>
        <span className="text-xs text-foreground/50 font-medium">
          day{streakData.currentStreak !== 1 ? 's' : ''}
        </span>
      </div>
      {hasStreak && (
        <span className="text-sm leading-none ml-0.5">
          {getStreakEmoji(streakData.currentStreak)}
        </span>
      )}
    </div>
  );
};
