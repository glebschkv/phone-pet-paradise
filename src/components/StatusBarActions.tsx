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
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Pet Count - Clean pill style */}
      <div className="stat-pill-clean touch-manipulation">
        <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
        <span className="text-sm font-bold text-foreground tabular-nums">{petCount}</span>
      </div>

      {/* Energy/Debug Button */}
      <button
        onClick={handleTestLevelUp}
        className="stat-pill-clean hover:brightness-95 active:scale-95 transition-all touch-manipulation"
        title="Test XP gain"
      >
        <Zap className="w-4 h-4 text-amber-400 fill-amber-400/30" />
      </button>
    </div>
  );
};
