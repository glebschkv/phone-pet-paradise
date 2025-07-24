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
    <div className="bg-gradient-glass backdrop-blur-xl border border-primary/10 rounded-3xl p-6 shadow-floating">
      {/* Minimalist Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Current Level</span>
            <div className="text-lg font-bold text-foreground">{currentLevel}</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-muted-foreground">To Next Level</span>
          <div className="text-sm font-semibold text-accent">{xpToNextLevel} XP</div>
        </div>
      </div>

      {/* Elegant Progress Bar */}
      <div className="space-y-3">
        <Progress 
          value={progress} 
          className="h-2 bg-primary/10 rounded-full"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-foreground">{currentXP} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};