import { Trophy, Timer, Calendar, Hash, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonalRecords } from "@/types/analytics";

interface RecordsProps {
  records: PersonalRecords;
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

export const AnalyticsRecords = ({ records, formatDuration }: RecordsProps) => {
  const recordItems = [
    {
      icon: Timer,
      label: "Longest Session",
      value: records.longestSession > 0 ? formatDuration(records.longestSession, 'long') : "--",
      date: records.longestSessionDate,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      icon: Calendar,
      label: "Most Focus in a Day",
      value: records.mostFocusInDay > 0 ? formatDuration(records.mostFocusInDay, 'long') : "--",
      date: records.mostFocusInDayDate,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      icon: Hash,
      label: "Most Sessions in a Day",
      value: records.mostSessionsInDay > 0 ? `${records.mostSessionsInDay} sessions` : "--",
      date: records.mostSessionsInDayDate,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      icon: Flame,
      label: "Longest Goal Streak",
      value: records.longestGoalStreak > 0 ? `${records.longestGoalStreak} days` : "--",
      date: records.longestGoalStreakDate,
      color: "text-orange-500 bg-orange-500/10",
    },
  ];

  const formatRecordDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold">Personal Records</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {recordItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-2.5 rounded-lg bg-muted/30"
            >
              <div className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center mb-1.5",
                item.color
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-sm font-bold truncate">{item.value}</div>
              {item.date && (
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {formatRecordDate(item.date)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All-time totals */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total Focus Time</span>
          <span className="font-bold">{formatDuration(records.totalFocusTime, 'long')}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">Total Sessions</span>
          <span className="font-bold">{records.totalSessions}</span>
        </div>
        {records.joinedDate && (
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">Tracking since</span>
            <span className="font-bold">{formatRecordDate(records.joinedDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
