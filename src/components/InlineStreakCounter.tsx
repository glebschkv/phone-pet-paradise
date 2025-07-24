import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-background/20 rounded-2xl">
      <Flame className="w-4 h-4 text-orange-500" />
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-foreground">
          {streakData.currentStreak}
        </span>
        <span className="text-lg leading-none">
          {getStreakEmoji(streakData.currentStreak)}
        </span>
      </div>
      {streakData.currentStreak >= 3 && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5">
          Streak!
        </Badge>
      )}
    </div>
  );
};