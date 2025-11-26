import { Heart, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StatusBarActionsProps {
  petCount: number;
  onTestLevelUp: () => any;
}

export const StatusBarActions = ({
  petCount,
  onTestLevelUp
}: StatusBarActionsProps) => {
  const { toast } = useToast();

  const handleTestLevelUp = () => {
    onTestLevelUp();
    toast({
      title: "XP Awarded!",
      description: `Focus session completed. Check your progress!`,
      duration: 3000,
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Pet Count - Retro pill style */}
      <div className="retro-stat-pill flex items-center gap-1.5 px-2.5 py-1 touch-manipulation">
        <Heart className="w-3.5 h-3.5 text-pink-500" />
        <span className="text-sm font-bold text-foreground tabular-nums">{petCount}</span>
      </div>

      {/* Debug Test Button */}
      <button
        onClick={handleTestLevelUp}
        className="retro-stat-pill flex items-center gap-1 px-2.5 py-1 hover:brightness-95 active:scale-95 transition-all touch-manipulation"
      >
        <Zap className="w-3.5 h-3.5 text-yellow-500" />
        <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">Test</span>
      </button>
    </div>
  );
};
