import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGuildSystem } from '@/hooks/useGuildSystem';
import { cn } from '@/lib/utils';
import { Users, Trophy, Target, Crown, LogOut, Plus, Search } from 'lucide-react';

interface GuildPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuildPanel = ({ isOpen, onClose }: GuildPanelProps) => {
  const {
    state,
    challenges,
    isInGuild,
    joinGuild,
    leaveGuild,
    createGuild,
    getGuildProgress,
    getAvailableGuilds,
    getLeaderboard,
  } = useGuildSystem();

  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildEmoji, setNewGuildEmoji] = useState('🎯');

  const progress = getGuildProgress();
  const leaderboard = getLeaderboard();
  const availableGuilds = getAvailableGuilds();

  const handleCreateGuild = () => {
    if (newGuildName.trim()) {
      createGuild(newGuildName, 'A new guild for focused individuals', newGuildEmoji, true);
      setShowCreateForm(false);
      setNewGuildName('');
    }
  };

  if (!isInGuild) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              Join a Guild
            </DialogTitle>
          </DialogHeader>

          {showCreateForm ? (
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Guild Name</label>
                <Input
                  value={newGuildName}
                  onChange={(e) => setNewGuildName(e.target.value)}
                  placeholder="Enter guild name..."
                  maxLength={24}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Guild Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {['🎯', '🔥', '⚡', '🌟', '💪', '🦁', '🐉', '🏆'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewGuildEmoji(emoji)}
                      className={cn(
                        "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                        newGuildEmoji === emoji
                          ? "bg-primary text-primary-foreground scale-110"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateGuild} className="flex-1">
                  Create Guild
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Guild
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search guilds..." className="pl-10" />
              </div>

              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {availableGuilds.map(guild => (
                    <div
                      key={guild.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-2xl">
                          {guild.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{guild.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{guild.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {guild.memberCount}/{guild.maxMembers}
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              Level {guild.level}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => joinGuild(guild)}>
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        {/* Guild header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-3xl">
              {state.currentGuild?.emoji}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{state.currentGuild?.name}</h2>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Users className="w-4 h-4" />
                <span>{state.currentGuild?.memberCount} members</span>
                <span className="mx-1">·</span>
                <Trophy className="w-4 h-4" />
                <span>Level {progress?.level}</span>
              </div>
            </div>
          </div>

          {progress && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-white/80 text-xs">
                <span>Guild XP</span>
                <span>{progress.xpToNextLevel} to next level</span>
              </div>
              <Progress value={progress.progressPercent} className="h-2 bg-white/20" />
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Overview
            </TabsTrigger>
            <TabsTrigger value="challenges" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Challenges
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[300px]">
            <TabsContent value="overview" className="p-4 m-0 space-y-4">
              {/* Weekly goal */}
              {progress && (
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Weekly Goal</span>
                    <span className="text-sm text-muted-foreground">
                      {progress.weeklyProgress}/{state.currentGuild?.weeklyGoal} min
                    </span>
                  </div>
                  <Progress value={progress.weeklyGoalPercent} className="h-3" />
                </div>
              )}

              {/* Your contribution */}
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-medium mb-2">Your Contribution</h3>
                <div className="text-3xl font-bold text-primary">{state.myContribution} min</div>
                <p className="text-sm text-muted-foreground">this week</p>
              </div>

              {/* Leave guild button */}
              <Button
                variant="destructive"
                className="w-full"
                onClick={leaveGuild}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Guild
              </Button>
            </TabsContent>

            <TabsContent value="challenges" className="p-4 m-0 space-y-3">
              {challenges.map(challenge => (
                <div
                  key={challenge.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    challenge.isCompleted ? "bg-green-500/10 border-green-500/30" : "bg-card"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{challenge.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-medium">{challenge.name}</h4>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      <Progress
                        value={(challenge.currentMinutes / challenge.targetMinutes) * 100}
                        className="h-2 mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{challenge.currentMinutes}/{challenge.targetMinutes}</span>
                        <span>+{challenge.rewards.xp} XP, +{challenge.rewards.coins} coins</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="leaderboard" className="p-4 m-0">
              <div className="space-y-2">
                {leaderboard.map((member, index) => (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      member.id === 'me' ? "bg-primary/10 border border-primary/30" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      index === 0 && "bg-yellow-500 text-white",
                      index === 1 && "bg-gray-400 text-white",
                      index === 2 && "bg-orange-600 text-white",
                      index > 2 && "bg-muted-foreground/20"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        {member.role === 'leader' && <Crown className="w-4 h-4 text-yellow-500" />}
                        {member.isOnline && <div className="w-2 h-2 rounded-full bg-green-500" />}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{member.weeklyFocusMinutes} min</div>
                      <div className="text-xs text-muted-foreground">this week</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
