import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Clock, Trophy, Sparkles } from "lucide-react";

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPetsEarned: number;
  timeAwayMinutes: number;
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const RewardModal = ({ isOpen, onClose, newPetsEarned, timeAwayMinutes }: RewardModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-sky border-primary/20 shadow-glow">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-accent" />
            Welcome Back!
            <Trophy className="w-6 h-6 text-accent" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Time Away Display */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Time Away</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {formatTime(timeAwayMinutes)}
              </div>
              <div className="text-sm text-muted-foreground">
                Great job staying off your phone! 📱
              </div>
            </div>
          </Card>

          {/* New Pets Earned */}
          <Card className="bg-gradient-island/10 backdrop-blur-sm border-secondary/30 animate-island-glow">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-accent animate-pulse" />
                <span className="text-lg font-bold text-foreground">New Pets Discovered!</span>
                <Sparkles className="w-6 h-6 text-accent animate-pulse" />
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-4">
                <Heart className="w-8 h-8 text-accent" />
                <span className="text-4xl font-bold text-secondary">+{newPetsEarned}</span>
                <Heart className="w-8 h-8 text-accent" />
              </div>
              
              <div className="text-sm text-muted-foreground mb-4">
                {newPetsEarned === 1 
                  ? "A new friend has appeared on your island!" 
                  : `${newPetsEarned} adorable pets have joined your island!`
                }
              </div>

              <div className="grid grid-cols-3 gap-2 text-4xl justify-items-center">
                {Array.from({ length: Math.min(newPetsEarned, 6) }, (_, i) => (
                  <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.2}s` }}>
                    {['🐱', '🐶', '🐰', '🦊', '🐻', '🐼'][i % 6]}
                  </span>
                ))}
                {newPetsEarned > 6 && (
                  <span className="text-lg text-muted-foreground col-span-3">
                    +{newPetsEarned - 6} more pets!
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Continue Button */}
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-ocean shadow-glow text-lg py-3"
          >
            Explore Your Island! 🏝️
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};