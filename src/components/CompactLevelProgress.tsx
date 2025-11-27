import { Star } from "lucide-react";

interface CompactLevelProgressProps {
  currentLevel: number;
  progress: number;
  currentXP: number;
  xpToNextLevel: number;
}

export const CompactLevelProgress = ({
  currentLevel,
  progress,
  currentXP,
  xpToNextLevel
}: CompactLevelProgressProps) => {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* Level Badge - Enhanced gold style */}
      <div className="level-badge-enhanced shrink-0">
        <Star className="w-3.5 h-3.5 fill-current" />
        <span className="font-bold tracking-tight">LV.{currentLevel}</span>
      </div>

      {/* XP Progress Section */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* XP Bar with inline label */}
        <div className="xp-bar-container">
          <div
            className="xp-bar-fill"
            style={{ width: `${Math.max(3, progress)}%` }}
          />
          <span className="xp-bar-label">EXP</span>
        </div>

        {/* XP Numbers below */}
        <div className="flex items-center justify-end">
          <span className="text-[10px] font-medium text-foreground/60 tabular-nums">
            {xpToNextLevel} to next
          </span>
        </div>
      </div>
    </div>
  );
};
