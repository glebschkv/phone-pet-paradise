import { Sparkles } from "lucide-react";

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
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {/* Level Badge - Retro gold style */}
      <div className="retro-level-badge px-2.5 py-1 flex items-center gap-1.5 shrink-0">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-sm font-bold tracking-tight">LV.{currentLevel}</span>
      </div>

      {/* XP Bar Container */}
      <div className="flex-1 min-w-0">
        {/* XP Text Row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">EXP</span>
          <span className="text-[10px] font-mono text-foreground/70">
            {xpToNextLevel} <span className="text-muted-foreground">to next</span>
          </span>
        </div>

        {/* Retro XP Bar */}
        <div className="retro-xp-bar">
          <div
            className="retro-xp-fill"
            style={{ width: `${Math.max(2, progress)}%` }}
          >
            <div className="shine" />
          </div>
        </div>
      </div>
    </div>
  );
};
