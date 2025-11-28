import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Calendar,
  Snowflake,
  Trophy
} from 'lucide-react';
import { useAppStateTracking } from '@/hooks/useAppStateTracking';

export const StreakDisplay = () => {
  const { streakData, getNextMilestone, getStreakEmoji } = useAppStateTracking();

  const nextMilestone = getNextMilestone();
  const progressToNext = nextMilestone 
    ? (streakData.currentStreak / nextMilestone.milestone) * 100 
    : 100;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">Focus Streak</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getStreakEmoji(streakData.currentStreak)}</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {streakData.currentStreak}
            </Badge>
          </div>
        </div>

        {nextMilestone && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next milestone</span>
              <span className="font-medium">{nextMilestone.title}</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {streakData.currentStreak} / {nextMilestone.milestone} days
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-lg font-semibold">{streakData.longestStreak}</div>
            <div className="text-xs text-muted-foreground">Best</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-lg font-semibold">{streakData.totalSessions}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Snowflake className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-lg font-semibold">{streakData.streakFreezeCount}</div>
            <div className="text-xs text-muted-foreground">Freezes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};