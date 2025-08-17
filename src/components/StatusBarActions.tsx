import { Heart, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      title: "🎉 Level Up Test!",
      description: `Awarded XP! Check if modal appears.`,
      duration: 3000,
    });
  };

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      {/* Pet Count - Mobile optimized */}
      <div className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-primary/10 rounded-xl md:rounded-2xl min-h-[28px] md:min-h-[32px] touch-manipulation">
        <Heart className="w-3 h-3 md:w-4 md:h-4 text-primary" />
        <span className="text-xs md:text-sm font-semibold text-foreground">{petCount}</span>
      </div>
      
      {/* Debug Test Button - Mobile friendly */}
      <Button 
        onClick={handleTestLevelUp}
        variant="outline" 
        size="sm"
        className="h-7 md:h-8 px-2 md:px-3 text-xs bg-background/30 backdrop-blur-sm border-border/30 hover:bg-background/50 rounded-xl md:rounded-2xl touch-manipulation active:scale-95 transition-transform"
      >
        <TestTube className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />
        <span className="hidden md:inline">Test</span>
      </Button>
    </div>
  );
};