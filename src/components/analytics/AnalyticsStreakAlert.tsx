import { Flame, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakAlertProps {
  currentStreak: number;
  lastSessionDate: string; // Date string from useStreakSystem
  streakFreezeCount: number;
  dailyGoalMinutes: number;
  todayFocusMinutes: number;
}

export const AnalyticsStreakAlert = ({
  currentStreak,
  lastSessionDate,
  streakFreezeCount,
  dailyGoalMinutes,
  todayFocusMinutes,
}: StreakAlertProps) => {
  if (currentStreak < 2) return null;

  const now = new Date();
  const todayStr = now.toDateString();

  // Check if goal already met today
  const goalMet = todayFocusMinutes >= dailyGoalMinutes;
  if (goalMet) return null;

  // Determine urgency based on time of day and whether they've focused today
  const hour = now.getHours();
  const isEvening = hour >= 18;
  const isLateEvening = hour >= 21;

  // If last session was today, streak is safe for now
  if (lastSessionDate === todayStr && todayFocusMinutes > 0) return null;

  // Only show alert if it's afternoon/evening and they haven't met goal
  if (hour < 14) return null;

  const minutesLeft = Math.max(0, dailyGoalMinutes - todayFocusMinutes);
  const hasFreeze = streakFreezeCount > 0;

  // Urgency levels
  const isUrgent = isLateEvening;
  const isWarning = isEvening && !isLateEvening;

  const bgStyle = isUrgent
    ? 'linear-gradient(135deg, hsl(0 70% 50% / 0.15) 0%, hsl(0 80% 40% / 0.08) 100%)'
    : isWarning
      ? 'linear-gradient(135deg, hsl(35 80% 50% / 0.12) 0%, hsl(35 90% 40% / 0.06) 100%)'
      : 'linear-gradient(135deg, hsl(35 60% 50% / 0.08) 0%, hsl(35 70% 40% / 0.04) 100%)';

  const borderColor = isUrgent
    ? 'hsl(0 60% 50% / 0.3)'
    : isWarning
      ? 'hsl(35 70% 50% / 0.25)'
      : 'hsl(35 50% 50% / 0.15)';

  const IconComponent = isUrgent ? AlertTriangle : Flame;
  const iconColor = isUrgent ? 'text-red-400' : 'text-orange-400';

  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: bgStyle, border: `1.5px solid ${borderColor}` }}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
          isUrgent ? "bg-red-500/15" : "bg-orange-500/10"
        )}
      >
        <IconComponent className={cn("w-4.5 h-4.5", iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs font-bold", isUrgent ? "text-red-400" : "text-orange-400")}>
            {isUrgent ? "Streak at risk!" : `${currentStreak}-day streak`}
          </span>
          {hasFreeze && (
            <span className="flex items-center gap-0.5 text-[9px] text-blue-400/80 font-medium">
              <Shield className="w-2.5 h-2.5" /> {streakFreezeCount} freeze{streakFreezeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
          {minutesLeft > 0
            ? `${minutesLeft}min left to meet your daily goal`
            : "Complete a focus session to keep your streak"}
        </p>
      </div>

      {/* Animated flame for urgency */}
      {isUrgent && (
        <div className="flex-shrink-0 opacity-60">
          <Flame className="w-5 h-5 text-red-400 animate-pulse" />
        </div>
      )}
    </div>
  );
};
