import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Share2, Lock, Star, Target, Users, Zap, Heart } from 'lucide-react';
import { useAchievementSystem, Achievement } from '@/hooks/useAchievementSystem';
import { useToast } from '@/hooks/use-toast';

interface AchievementGalleryProps {
  onClose?: () => void;
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({ onClose }) => {
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
    { id: 'collection', name: 'Collection', icon: Star },
    { id: 'bond', name: 'Bond', icon: Heart },
    { id: 'social', name: 'Social', icon: Users },
    { id: 'special', name: 'Special', icon: Zap }
  ];

  const tierColors = {
    bronze: 'bg-amber-600 text-white',
    silver: 'bg-gray-400 text-white',
    gold: 'bg-yellow-500 text-white',
    platinum: 'bg-blue-500 text-white',
    diamond: 'bg-purple-600 text-white'
  };

  const tierEmojis = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
    diamond: '💜'
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

    return (
      <Card className={`transition-all hover:shadow-lg ${isUnlocked ? 'ring-2 ring-primary/20' : 'opacity-75'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {isSecret ? '🔒' : achievement.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {isSecret ? 'Secret Achievement' : achievement.title}
                  {isUnlocked && <Trophy className="h-5 w-5 text-yellow-500" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isSecret ? 'Unlock to reveal details' : achievement.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={tierColors[achievement.tier]}>
                {tierEmojis[achievement.tier]} {achievement.tier}
              </Badge>
              {isUnlocked && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare(achievement.id)}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!isSecret && (
            <>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {achievement.progress}/{achievement.target}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm">Rewards</h4>
                <div className="flex flex-wrap gap-1">
                  {achievement.rewards.map((reward, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {reward.description}
                    </Badge>
                  ))}
                </div>
              </div>

              {isUnlocked && achievement.unlockedAt && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </>
          )}

          {isSecret && (
            <div className="text-center py-4">
              <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Complete specific actions to unlock this secret achievement
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const completionPercentage = getCompletionPercentage();
  const totalPoints = getTotalAchievementPoints();

  return (
    <div className="w-full max-w-6xl mx-auto">
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
            <TabsList className="grid w-full grid-cols-6">
              {categories.map(category => {
                const CategoryIcon = category.icon;
                const categoryAchievements = category.id === 'all' 
                  ? achievements 
                  : getAchievementsByCategory(category.id);
                const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length;

                return (
                  <TabsTrigger key={category.id} value={category.id} className="flex flex-col gap-1">
                    <CategoryIcon className="h-4 w-4" />
                    <span className="text-xs">{category.name}</span>
                    <Badge variant="secondary" className="text-xs px-1">
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
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredAchievements
                    .sort((a, b) => {
                      // Sort by: unlocked first, then by tier, then by progress
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
    </div>
  );
};