import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Share2, Lock, Star, Target, Users, Zap, Heart, TrendingUp, Coins, ChevronLeft } from 'lucide-react';
import { useAchievementSystem, Achievement } from '@/hooks/useAchievementSystem';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AchievementGalleryProps {
  onClose?: () => void;
  embedded?: boolean;
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({ onClose, embedded = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const {
    achievements,
    unlockedAchievements,
    getAchievementsByCategory,
    getTotalAchievementPoints,
    getCompletionPercentage,
    shareAchievement
  } = useAchievementSystem();
  const { toast } = useToast();

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'focus', name: 'Focus', icon: Target },
    { id: 'collection', name: 'Collect', icon: Star },
    { id: 'bond', name: 'Bond', icon: Heart },
    { id: 'progression', name: 'Level', icon: TrendingUp },
    { id: 'economy', name: 'Economy', icon: Coins },
    { id: 'special', name: 'Special', icon: Zap },
    { id: 'social', name: 'Social', icon: Users }
  ];

  const tierColors = {
    bronze: 'bg-amber-600 text-white',
    silver: 'bg-gray-400 text-white',
    gold: 'bg-yellow-500 text-white',
    platinum: 'bg-cyan-500 text-white',
    diamond: 'bg-purple-600 text-white'
  };

  const tierGradients = {
    bronze: 'from-amber-600/20 to-amber-800/20',
    silver: 'from-gray-400/20 to-gray-600/20',
    gold: 'from-yellow-400/20 to-yellow-600/20',
    platinum: 'from-cyan-400/20 to-cyan-600/20',
    diamond: 'from-purple-400/20 to-purple-600/20'
  };

  const tierEmojis = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💠',
    diamond: '💎'
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : getAchievementsByCategory(selectedCategory);

  const handleShare = async (achievementId: string) => {
    const shareText = shareAchievement(achievementId);
    if (!shareText) {
      toast({
        title: "Cannot Share",
        description: "This achievement hasn't been unlocked yet.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Achievement Unlocked!",
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard",
          description: "Share text copied! Paste it anywhere to share your achievement.",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share Failed",
        description: "Could not share the achievement. Please try again.",
        variant: "destructive"
      });
    }
  };

  const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const isUnlocked = achievement.isUnlocked;
    const progress = Math.min(100, (achievement.progress / achievement.target) * 100);
    const isSecret = achievement.secret && !isUnlocked;

    // Calculate rewards display
    const xpReward = achievement.rewards.find(r => r.type === 'xp')?.amount || 0;
    const coinReward = achievement.rewards.find(r => r.type === 'coins')?.amount || 0;

    return (
      <Card className={cn(
        "transition-all duration-300",
        isUnlocked
          ? `ring-2 ring-primary/30 bg-gradient-to-br ${tierGradients[achievement.tier]}`
          : "opacity-80 hover:opacity-100",
        embedded && "border-purple-500/20"
      )}>
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "text-3xl w-12 h-12 flex items-center justify-center rounded-lg",
              isUnlocked ? "bg-primary/10" : "bg-muted",
              isSecret && "blur-sm"
            )}>
              {isSecret ? '❓' : achievement.icon}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                {isSecret ? 'Secret Achievement' : achievement.title}
                {isUnlocked && <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {isSecret ? 'Complete specific actions to unlock' : achievement.description}
              </p>
            </div>
            <Badge className={cn(tierColors[achievement.tier], "text-[10px] px-1.5 py-0.5 flex-shrink-0")}>
              {tierEmojis[achievement.tier]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-3 pb-3">
          {!isSecret && (
            <>
              <div className="space-y-1.5 mb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {achievement.progress.toLocaleString()}/{achievement.target.toLocaleString()}
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {xpReward > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30">
                      +{xpReward} XP
                    </Badge>
                  )}
                  {coinReward > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                      +{coinReward} 🪙
                    </Badge>
                  )}
                </div>
                {isUnlocked && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleShare(achievement.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {isUnlocked && achievement.unlockedAt && (
                <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </>
          )}

          {isSecret && (
            <div className="text-center py-2">
              <Lock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">
                Keep exploring to unlock!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const completionPercentage = getCompletionPercentage();
  const totalPoints = getTotalAchievementPoints();

  const containerClass = embedded
    ? "w-full h-full flex flex-col"
    : "w-full max-w-6xl mx-auto";

  return (
    <div className={containerClass}>
      {embedded ? (
        // Embedded version for GamificationHub
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-purple-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-purple-300 hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white retro-pixel-text">ACHIEVEMENTS</h2>
                  <p className="text-xs text-purple-300/80">
                    {unlockedAchievements.length}/{achievements.length} Unlocked
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-yellow-400">{totalPoints}</div>
                <div className="text-[10px] text-purple-300/80">Points</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-purple-300">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2 bg-purple-900/50" />
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col min-h-0">
            <div className="px-2 py-2 border-b border-purple-600/20">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex h-auto gap-1 bg-transparent p-0 w-max">
                  {categories.map(category => {
                    const CategoryIcon = category.icon;
                    const categoryAchievements = category.id === 'all'
                      ? achievements
                      : getAchievementsByCategory(category.id);

                    if (category.id !== 'all' && categoryAchievements.length === 0) return null;

                    const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length;

                    return (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className={cn(
                          "flex flex-col gap-0.5 px-3 py-1.5 rounded-lg text-purple-300",
                          "data-[state=active]:bg-purple-600/30 data-[state=active]:text-white",
                          "hover:bg-purple-600/20 transition-colors"
                        )}
                      >
                        <CategoryIcon className="h-4 w-4" />
                        <span className="text-[10px]">{category.name}</span>
                        <span className="text-[9px] opacity-70">{unlockedCount}/{categoryAchievements.length}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </ScrollArea>
            </div>

            <TabsContent value={selectedCategory} className="flex-1 m-0 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-3">
                  {filteredAchievements.length === 0 ? (
                    <div className="text-center py-8 text-purple-300/70">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No achievements in this category</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 grid-cols-1">
                      {filteredAchievements
                        .sort((a, b) => {
                          if (a.isUnlocked !== b.isUnlocked) {
                            return a.isUnlocked ? -1 : 1;
                          }
                          const tierOrder = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
                          if (tierOrder[a.tier] !== tierOrder[b.tier]) {
                            return tierOrder[b.tier] - tierOrder[a.tier];
                          }
                          return (b.progress / b.target) - (a.progress / a.target);
                        })
                        .map(achievement => (
                          <AchievementCard key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        // Standalone Card version
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Achievement Gallery
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Track your progress and unlock rewards
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{totalPoints}</div>
                <div className="text-sm text-muted-foreground">Achievement Points</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{unlockedAchievements.length}/{achievements.length} ({completionPercentage}%)</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
                {categories.map(category => {
                  const CategoryIcon = category.icon;
                  const categoryAchievements = category.id === 'all'
                    ? achievements
                    : getAchievementsByCategory(category.id);

                  if (category.id !== 'all' && categoryAchievements.length === 0) return null;

                  const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length;

                  return (
                    <TabsTrigger key={category.id} value={category.id} className="flex flex-col gap-1 py-2">
                      <CategoryIcon className="h-4 w-4" />
                      <span className="text-xs">{category.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1">
                        {unlockedCount}/{categoryAchievements.length}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-6">
                {filteredAchievements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements in this category</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAchievements
                      .sort((a, b) => {
                        if (a.isUnlocked !== b.isUnlocked) {
                          return a.isUnlocked ? -1 : 1;
                        }
                        const tierOrder = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
                        if (tierOrder[a.tier] !== tierOrder[b.tier]) {
                          return tierOrder[b.tier] - tierOrder[a.tier];
                        }
                        return (b.progress / b.target) - (a.progress / a.target);
                      })
                      .map(achievement => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {onClose && (
              <div className="mt-6 text-center">
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
