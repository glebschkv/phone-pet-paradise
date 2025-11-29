import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBossChallenges } from '@/hooks/useBossChallenges';
import { cn } from '@/lib/utils';
import { Swords, Clock, Trophy, XCircle, CheckCircle, Lock, Flame } from 'lucide-react';
import { BossChallenge } from '@/data/GamificationData';

interface BossChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BossChallengeModal = ({ isOpen, onClose }: BossChallengeModalProps) => {
  const {
    startChallenge,
    abandonChallenge,
    getChallengeStatus,
    getActiveChallenge,
    getChallengesByDifficulty,
  } = useBossChallenges();

  const [activeTab, setActiveTab] = useState<BossChallenge['difficulty']>('normal');
  const activeChallenge = getActiveChallenge();

  const getDifficultyColor = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return 'text-green-500 bg-green-500/10';
      case 'hard': return 'text-orange-500 bg-orange-500/10';
      case 'extreme': return 'text-red-500 bg-red-500/10';
      case 'legendary': return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  const getDifficultyGradient = (difficulty: BossChallenge['difficulty']) => {
    switch (difficulty) {
      case 'normal': return 'from-green-600 to-emerald-600';
      case 'hard': return 'from-orange-500 to-red-500';
      case 'extreme': return 'from-red-600 to-pink-600';
      case 'legendary': return 'from-yellow-500 to-orange-500';
    }
  };

  const formatCooldown = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-600 to-orange-600">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Swords className="w-6 h-6" />
              Boss Challenges
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/80 text-sm mt-1">
            Complete difficult focus challenges for massive rewards!
          </p>
        </div>

        {/* Active challenge banner */}
        {activeChallenge.challenge && (
          <div className={cn(
            "mx-4 mt-4 p-4 rounded-lg bg-gradient-to-r",
            getDifficultyGradient(activeChallenge.challenge.difficulty)
          )}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeChallenge.challenge.emoji}</span>
                <div>
                  <h3 className="text-white font-bold">{activeChallenge.challenge.name}</h3>
                  <p className="text-white/80 text-sm">{activeChallenge.challenge.description}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/20"
                onClick={abandonChallenge}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-white/80 text-xs mb-1">
                <span>Progress</span>
                <span>{Math.round(activeChallenge.percentComplete)}%</span>
              </div>
              <Progress value={activeChallenge.percentComplete} className="h-3 bg-white/20" />
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BossChallenge['difficulty'])} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 px-4">
            {(['normal', 'hard', 'extreme', 'legendary'] as const).map(diff => (
              <TabsTrigger
                key={diff}
                value={diff}
                className={cn(
                  "rounded-none border-b-2 border-transparent capitalize",
                  "data-[state=active]:border-current",
                  getDifficultyColor(diff).split(' ')[0]
                )}
              >
                {diff}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[350px]">
            {(['normal', 'hard', 'extreme', 'legendary'] as const).map(difficulty => (
              <TabsContent key={difficulty} value={difficulty} className="p-4 m-0 space-y-3">
                {getChallengesByDifficulty(difficulty).map(({ challenge, status }) => (
                  <div
                    key={challenge.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      status.isActive && "ring-2 ring-primary",
                      status.isCompleted && "bg-green-500/10 border-green-500/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center text-2xl",
                        getDifficultyColor(difficulty)
                      )}>
                        {challenge.emoji}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{challenge.name}</h4>
                          {status.isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>

                        {/* Rewards */}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-yellow-500">
                            <Trophy className="w-3 h-3" />
                            {challenge.rewards.xp} XP
                          </span>
                          <span className="flex items-center gap-1 text-amber-500">
                            🪙 {challenge.rewards.coins}
                          </span>
                          {challenge.rewards.badge && (
                            <span className="flex items-center gap-1 text-purple-500">
                              🏅 Badge
                            </span>
                          )}
                        </div>

                        {/* Cooldown info */}
                        {status.cooldownRemaining > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Cooldown: {formatCooldown(status.cooldownRemaining)}
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      <div className="ml-2">
                        {status.isActive ? (
                          <div className="flex items-center gap-1 text-primary">
                            <Flame className="w-5 h-5 animate-pulse" />
                          </div>
                        ) : status.cooldownRemaining > 0 ? (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        ) : activeChallenge.challenge ? (
                          <Button size="sm" variant="ghost" disabled>
                            Busy
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => startChallenge(challenge.id)}
                            className={cn("bg-gradient-to-r", getDifficultyGradient(difficulty))}
                          >
                            Start
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for active challenge */}
                    {status.isActive && status.progress && (
                      <div className="mt-3">
                        <Progress
                          value={(status.progress.currentProgress / challenge.requirement.value) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        {/* Info footer */}
        <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground text-center">
          Complete focus sessions to progress. Only one challenge can be active at a time.
        </div>
      </DialogContent>
    </Dialog>
  );
};
