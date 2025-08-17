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
    <div className="flex items-center gap-2.5 flex-1 min-w-0">
      {/* Level Icon - Mobile optimized */}
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-accent/20 flex items-center justify-center shrink-0 shadow-inner">
        <Crown className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />
      </div>
      
      {/* Progress Content - Mobile responsive */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs md:text-sm font-bold text-foreground truncate">Lv.{currentLevel}</span>
          <span className="text-[10px] md:text-xs text-muted-foreground font-medium">{xpToNextLevel}</span>
        </div>
        <Progress 
          value={progress} 
          className="h-1 md:h-1.5 bg-primary/10 rounded-full shadow-inner"
        />
      </div>
    </div>
  );
};