import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Star, Trophy, CheckCircle, Circle } from 'lucide-react';
import { useQuestSystem, Quest } from '@/hooks/useQuestSystem';

interface QuestJournalProps {
  onClose?: () => void;
}

export const QuestJournal: React.FC<QuestJournalProps> = ({ onClose }) => {
  const {
    dailyQuests,
    weeklyQuests,
    storyQuests,
    activeQuests,
    completedQuests,
    completeQuest
  } = useQuestSystem();

  const formatTimeRemaining = (expiresAt: number): string => {
    const now = Date.now();
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const getQuestTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="h-4 w-4" />;
      case 'weekly': return <Clock className="h-4 w-4" />;
      case 'story': return <Star className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-500';
      case 'weekly': return 'bg-purple-500';
      case 'story': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const QuestCard: React.FC<{ quest: Quest; showTimer?: boolean }> = ({ quest, showTimer = false }) => {
    const isCompleted = quest.isCompleted;
    const allObjectivesComplete = quest.objectives.every(obj => obj.current >= obj.target);
    const canComplete = allObjectivesComplete && !isCompleted;

    return (
      <Card className={`transition-all ${isCompleted ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${getQuestTypeColor(quest.type)} text-white`}>
                {getQuestTypeIcon(quest.type)}
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {quest.title}
                  {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{quest.description}</p>
              </div>
            </div>
            {showTimer && quest.expiresAt && (
              <Badge variant="outline" className="text-xs">
                {formatTimeRemaining(quest.expiresAt)}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Objectives</h4>
            <div className="space-y-2">
              {quest.objectives.map(objective => {
                const progress = Math.min(100, (objective.current / objective.target) * 100);
                const isObjectiveComplete = objective.current >= objective.target;

                return (
                  <div key={objective.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={isObjectiveComplete ? 'line-through text-muted-foreground' : ''}>
                        {objective.description}
                      </span>
                      <span className="font-medium">
                        {objective.current}/{objective.target}
                        {isObjectiveComplete && <CheckCircle className="inline h-4 w-4 ml-1 text-green-500" />}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Rewards</h4>
            <div className="flex flex-wrap gap-2">
              {quest.rewards.map((reward, index) => (
                <Badge key={index} variant="secondary">
                  <Trophy className="h-3 w-3 mr-1" />
                  {reward.description}
                </Badge>
              ))}
            </div>
          </div>

          {canComplete && (
            <Button 
              onClick={() => completeQuest(quest.id)}
              className="w-full"
            >
              Claim Rewards
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Quest Journal
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">
                Active ({activeQuests.length})
              </TabsTrigger>
              <TabsTrigger value="daily">
                Daily ({dailyQuests.length})
              </TabsTrigger>
              <TabsTrigger value="weekly">
                Weekly ({weeklyQuests.length})
              </TabsTrigger>
              <TabsTrigger value="story">
                Story ({storyQuests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active quests</p>
                  <p className="text-sm">Complete your current quests or wait for new ones!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} showTimer />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="daily" className="space-y-4">
              {dailyQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No daily quests available</p>
                  <p className="text-sm">Check back tomorrow for new challenges!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} showTimer />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              {weeklyQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No weekly quests available</p>
                  <p className="text-sm">Check back next week for new challenges!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weeklyQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} showTimer />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="story" className="space-y-4">
              {storyQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No story quests available</p>
                  <p className="text-sm">Level up to unlock the next chapter!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {storyQuests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {completedQuests.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-3 text-muted-foreground">
                Recently Completed ({completedQuests.slice(-3).length})
              </h3>
              <div className="space-y-2">
                {completedQuests.slice(-3).map(quest => (
                  <div key={quest.id} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="line-through text-muted-foreground">{quest.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {quest.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

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