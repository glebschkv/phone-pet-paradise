import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Heart, Smartphone, RotateCcw } from "lucide-react";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { RewardModal } from "@/components/RewardModal";

export const GameUI = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const {
    totalPets,
    newPetsEarned,
    timeAwayMinutes,
    showRewardModal,
    dismissRewardModal,
    resetProgress,
    minutesPerPet
  } = useAppStateTracking();
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top UI Bar */}
      <div className="flex justify-between items-start p-4 pointer-events-auto">
        <Card className="bg-card/90 backdrop-blur-sm shadow-island border-border/50">
          <div className="flex items-center gap-2 p-3">
            <Heart className="w-5 h-5 text-accent" />
            <span className="font-semibold text-foreground">{totalPets} Pets</span>
          </div>
        </Card>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-card/90 backdrop-blur-sm">
            <User className="w-4 h-4 mr-2" />
            Login
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-card/90 backdrop-blur-sm"
            onClick={resetProgress}
            title="Reset progress"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
        <Card className="bg-card/90 backdrop-blur-sm shadow-island border-border/50 mx-auto max-w-sm">
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Phone Usage Today</span>
            </div>
            <div className="text-2xl font-bold text-primary mb-1">Stay away to earn pets!</div>
            <div className="text-sm text-muted-foreground">
              🏝️ 1 pet every {minutesPerPet} minutes away • {totalPets} pets discovered 🐾
            </div>
          </div>
        </Card>
      </div>
      
      {/* Welcome Message */}
      {showWelcome && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <Card className="bg-card/95 backdrop-blur-sm shadow-glow border-primary/20 animate-float">
            <div className="p-6 text-center max-w-sm">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Welcome to Pet Island! 🏝️
              </h2>
              <p className="text-muted-foreground mb-4">
                The less you use your phone, the more adorable pets you'll discover on your island!
              </p>
              <Button 
                className="bg-gradient-ocean shadow-glow"
                onClick={() => setShowWelcome(false)}
              >
                Start Your Journey
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Reward Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={dismissRewardModal}
        newPetsEarned={newPetsEarned}
        timeAwayMinutes={timeAwayMinutes}
      />
    </div>
  );
};