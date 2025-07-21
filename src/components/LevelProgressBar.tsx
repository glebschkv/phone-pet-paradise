import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Crown } from "lucide-react";

interface LevelProgressBarProps {
  currentLevel: number;
  progress: number;
  currentXP: number;
  xpToNextLevel: number;
}

export const LevelProgressBar = ({ 
  currentLevel, 
  progress, 
  currentXP, 
  xpToNextLevel 
}: LevelProgressBarProps) => {
  return (
    <div className="bg-background/80 backdrop-blur-sm border border-primary/20 rounded-lg p-4 space-y-3">
      {/* Level Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <span className="font-semibold">Level {currentLevel}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {xpToNextLevel} XP to next level
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progress} 
          className="h-3 bg-primary/10"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{Math.round(progress)}% complete</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            <span>{currentXP} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};