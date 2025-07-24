import { Heart, Clock, Home, Users, Star } from "lucide-react";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { XPRewardModal } from "@/components/XPRewardModal";
import { LevelProgressBar } from "@/components/LevelProgressBar";
import { FocusTimer } from "@/components/FocusTimer";
import { useState } from "react";

export const GameUI = () => {
  const [showTimer, setShowTimer] = useState(false);
  const {
    currentLevel,
    currentXP,
    xpToNextLevel,
    unlockedAnimals,
    getLevelProgress,
    timeAwayMinutes,
    showRewardModal,
    currentReward,
    dismissRewardModal,
  } = useAppStateTracking();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating Top Stats */}
      <div className="absolute top-safe left-4 right-4 pointer-events-auto flex justify-between items-start gap-3 mt-4">
        {/* Level Badge */}
        <div className="bg-gradient-glass backdrop-blur-md rounded-2xl px-4 py-3 border border-primary/10 shadow-floating">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Star className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Level</span>
              <span className="text-sm font-bold text-foreground">{currentLevel}</span>
            </div>
          </div>
        </div>
        
        {/* Animals Badge */}
        <div className="bg-gradient-glass backdrop-blur-md rounded-2xl px-4 py-3 border border-primary/10 shadow-floating">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Pets</span>
              <span className="text-sm font-bold text-foreground">{unlockedAnimals.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Progress Card */}
      <div className="absolute top-28 left-4 right-4 pointer-events-auto">
        <LevelProgressBar
          currentLevel={currentLevel}
          progress={getLevelProgress()}
          currentXP={currentXP}
          xpToNextLevel={xpToNextLevel}
        />
      </div>

      {/* Floating Bottom Navigation */}
      <div className="absolute bottom-8 left-6 right-6 pointer-events-auto">
        <div className="bg-gradient-glass backdrop-blur-xl rounded-3xl border border-primary/10 shadow-floating p-2">
          <div className="flex items-center justify-around">
            {/* Timer Button */}
            <button 
              onClick={() => setShowTimer(!showTimer)}
              className="flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 hover:bg-primary/10 active:scale-95"
            >
              <Clock className="w-6 h-6 text-muted-foreground" />
            </button>
            
            {/* Home Button - Active */}
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-glow">
              <Home className="w-7 h-7 text-primary-foreground" />
            </div>
            
            {/* Friends Button */}
            <button className="flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 hover:bg-primary/10 active:scale-95">
              <Users className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Focus Timer Overlay */}
      {showTimer && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50">
          <div className="relative">
            <button 
              onClick={() => setShowTimer(false)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-card rounded-2xl flex items-center justify-center text-lg font-bold shadow-floating border border-border z-10 transition-transform hover:scale-105 active:scale-95"
            >
              ×
            </button>
            <FocusTimer />
          </div>
        </div>
      )}

      {/* XP Reward Modal */}
      <XPRewardModal
        isOpen={showRewardModal}
        onClose={dismissRewardModal}
        reward={currentReward}
        newLevel={currentLevel}
        levelProgress={getLevelProgress()}
      />
    </div>
  );
};