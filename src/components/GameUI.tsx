import { Heart, Clock, Home, Users } from "lucide-react";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { RewardModal } from "@/components/RewardModal";

export const GameUI = () => {
  const {
    totalPets,
    newPetsEarned,
    timeAwayMinutes,
    showRewardModal,
    dismissRewardModal,
  } = useAppStateTracking();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Simple Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="flex justify-between items-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-white" />
              <span className="text-white font-medium">{totalPets} Pets</span>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
            <span className="text-white font-medium">W1 48</span>
          </div>
        </div>
      </div>

      {/* Bottom Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="flex">
            {/* Time */}
            <div className="flex-1 flex flex-col items-center justify-center py-4 hover:bg-white/10 transition-colors">
              <Clock className="w-6 h-6 text-white mb-1" />
              <span className="text-white text-sm font-medium">Time</span>
            </div>
            
            {/* Home */}
            <div className="flex-1 flex flex-col items-center justify-center py-4 hover:bg-white/10 transition-colors bg-white/20">
              <Home className="w-6 h-6 text-white mb-1" />
              <span className="text-white text-sm font-medium">Home</span>
            </div>
            
            {/* Friends */}
            <div className="flex-1 flex flex-col items-center justify-center py-4 hover:bg-white/10 transition-colors">
              <Users className="w-6 h-6 text-white mb-1" />
              <span className="text-white text-sm font-medium">Friends</span>
            </div>
          </div>
        </div>
      </div>

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