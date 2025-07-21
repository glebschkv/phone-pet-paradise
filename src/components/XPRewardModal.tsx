import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { XPReward } from "@/hooks/useXPSystem";
import { Star, Gift, Zap, Crown } from "lucide-react";

interface XPRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: XPReward | null;
  newLevel: number;
  levelProgress: number;
}

export const XPRewardModal = ({ 
  isOpen, 
  onClose, 
  reward, 
  newLevel,
  levelProgress 
}: XPRewardModalProps) => {
  if (!reward) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          
          <DialogTitle className="text-2xl font-bold">
            Focus Session Complete!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* XP Gained */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-semibold">
                +{reward.xpGained} XP
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Great job staying focused!
            </p>
          </div>

          {/* Level Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Level {newLevel}</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(levelProgress)}%
              </span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>

          {/* Level Up Celebration */}
          {reward.leveledUp && (
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 rounded-lg p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-yellow-600" />
                <span className="text-lg font-bold text-yellow-700">
                  Level Up!
                </span>
              </div>
              <p className="text-sm">
                You've reached Level {reward.newLevel}!
              </p>
            </div>
          )}

          {/* Unlocked Rewards */}
          {reward.unlockedRewards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <span className="font-semibold">New Unlocks!</span>
              </div>
              
              <div className="space-y-2">
                {reward.unlockedRewards.map((unlock, index) => (
                  <div 
                    key={index}
                    className="bg-background/80 border border-primary/20 rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{unlock.name}</span>
                      <Badge variant={unlock.type === 'biome' ? 'default' : 'secondary'}>
                        {unlock.type === 'biome' ? 'New Biome' : 'New Animal'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {unlock.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="px-8">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};