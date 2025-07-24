import { Progress } from "@/components/ui/progress";
import { Crown } from "lucide-react";

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
      {/* Level Icon */}
      <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
        <Crown className="w-4 h-4 text-accent" />
      </div>
      
      {/* Progress Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-foreground">Level {currentLevel}</span>
          <span className="text-xs text-muted-foreground">{xpToNextLevel} XP</span>
        </div>
        <Progress 
          value={progress} 
          className="h-1.5 bg-primary/10 rounded-full"
        />
      </div>
    </div>
  );
};