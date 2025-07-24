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
    console.log('Test Level Up button clicked');
    const result = onTestLevelUp();
    console.log('Test Level Up result:', result);
    toast({
      title: "🎉 Level Up Test!",
      description: `Awarded XP! Check if modal appears.`,
      duration: 3000,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Pet Count */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background/20 rounded-2xl">
        <Heart className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{petCount}</span>
      </div>
      
      {/* Debug Test Button */}
      <Button 
        onClick={handleTestLevelUp}
        variant="outline" 
        size="sm"
        className="h-8 px-3 bg-background/20 backdrop-blur-sm border-border/20 hover:bg-background/40"
      >
        <TestTube className="w-3.5 h-3.5 mr-1.5" />
        <span className="text-xs">Test</span>
      </Button>
    </div>
  );
};