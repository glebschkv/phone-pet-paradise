import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGuildSystem } from '@/hooks/useGuildSystem';
import { cn } from '@/lib/utils';
import { Users, Trophy, Crown, LogOut, Plus, Search, Shield, Swords, Star } from 'lucide-react';

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

  const tabs = [
    { id: 'overview', label: 'HQ', icon: Shield },
    { id: 'challenges', label: 'MISSIONS', icon: Swords },
    { id: 'leaderboard', label: 'RANKS', icon: Trophy },
  ];

  if (!isInGuild) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden retro-modal">
          <div className="retro-modal-header">
            <DialogHeader>
              <DialogTitle className="text-white text-xl flex items-center gap-3 retro-pixel-text">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-indigo-400">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="retro-neon-text">JOIN A GUILD</span>
              </DialogTitle>
            </DialogHeader>
            <p className="text-purple-200/80 text-sm mt-2">
              Team up with other players for group missions!
            </p>
          </div>

          <div className="p-4">
            {showCreateForm ? (
              <div className="space-y-4">
                <div className="retro-game-card p-4">
                  <h3 className="text-white font-bold mb-3 retro-pixel-text">CREATE GUILD</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-purple-400 retro-pixel-text mb-1 block">
                        GUILD NAME
                      </label>
                      <Input
                        value={newGuildName}
                        onChange={(e) => setNewGuildName(e.target.value)}
                        placeholder="Enter guild name..."
                        maxLength={24}
                        className="bg-purple-900/50 border-purple-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-purple-400 retro-pixel-text mb-2 block">
                        GUILD EMBLEM
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {['🎯', '🔥', '⚡', '🌟', '💪', '🦁', '🐉', '🏆'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setNewGuildEmoji(emoji)}
                            className={cn(
                              "w-12 h-12 rounded-lg text-xl flex items-center justify-center transition-all",
                              "retro-icon-badge",
                              newGuildEmoji === emoji
                                ? "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                                : "border-purple-600/50"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 retro-arcade-btn px-4 py-2 text-sm"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleCreateGuild}
                    className="flex-1 retro-arcade-btn retro-arcade-btn-green px-4 py-2 text-sm"
                  >
                    CREATE
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full retro-arcade-btn retro-arcade-btn-purple py-3 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="retro-pixel-text">CREATE NEW GUILD</span>
                </button>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <Input
                    placeholder="Search guilds..."
                    className="pl-10 bg-purple-900/50 border-purple-600 text-white placeholder:text-purple-500"
                  />
                </div>

                <ScrollArea className="h-[320px]">
                  <div className="space-y-3">
                    {availableGuilds.map(guild => (
                      <div
                        key={guild.id}
                        className="retro-game-card p-4 hover:border-cyan-500 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 retro-icon-badge shrink-0">
                            <span className="text-2xl">{guild.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white truncate retro-pixel-text">
                              {guild.name}
                            </h3>
                            <p className="text-xs text-purple-300/70 truncate">
                              {guild.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-purple-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {guild.memberCount}/{guild.maxMembers}
                              </span>
                              <span className="flex items-center gap-1 retro-neon-yellow">
                                <Trophy className="w-3 h-3" />
                                LVL {guild.level}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => joinGuild(guild)}
                            className="retro-arcade-btn retro-arcade-btn-green px-3 py-1.5 text-xs"
                          >
                            JOIN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden retro-modal">
        {/* Guild Header Banner */}
        <div className="retro-guild-banner p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 retro-icon-badge shrink-0">
              <span className="text-3xl">{state.currentGuild?.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white retro-pixel-text truncate">
                {state.currentGuild?.name}
              </h2>
              <div className="flex items-center gap-3 text-sm mt-1">
                <span className="flex items-center gap-1 text-purple-200">
                  <Users className="w-4 h-4" />
                  {state.currentGuild?.memberCount}
                </span>
                <span className="retro-neon-yellow flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  LVL {progress?.level}
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          {progress && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-400 retro-pixel-text">GUILD XP</span>
                <span className="text-purple-300">{progress.xpToNextLevel} to next</span>
              </div>
              <div className="retro-health-bar retro-health-bar-purple h-3">
                <div
                  className="retro-health-bar-fill"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 flex gap-1 bg-purple-900/30">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-xs font-bold uppercase transition-all retro-pixel-text flex items-center justify-center gap-1",
                activeTab === tab.id
                  ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                  : "text-purple-400 hover:text-purple-300 hover:bg-purple-800/30"
              )}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <ScrollArea className="h-[300px] px-4 py-3">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Weekly Goal */}
              {progress && (
                <div className="retro-game-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-400 retro-pixel-text text-sm">WEEKLY GOAL</span>
                    <span className="text-purple-300 text-sm">
                      {progress.weeklyProgress}/{state.currentGuild?.weeklyGoal} min
                    </span>
                  </div>
                  <div className="retro-health-bar">
                    <div
                      className="retro-health-bar-fill"
                      style={{ width: `${progress.weeklyGoalPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Your Contribution */}
              <div className="retro-game-card p-4 text-center">
                <h3 className="text-purple-400 text-xs retro-pixel-text mb-2">YOUR CONTRIBUTION</h3>
                <div className="retro-score-display text-4xl">{state.myContribution}</div>
                <p className="text-purple-300/60 text-xs mt-1">minutes this week</p>
              </div>

              {/* Leave Button */}
              <button
                onClick={leaveGuild}
                className="w-full retro-arcade-btn py-3 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="retro-pixel-text">LEAVE GUILD</span>
              </button>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="space-y-3">
              {challenges.map(challenge => (
                <div
                  key={challenge.id}
                  className={cn(
                    "retro-game-card p-4",
                    challenge.isCompleted && "border-green-500/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 retro-icon-badge shrink-0">
                      <span className="text-2xl">{challenge.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white retro-pixel-text text-sm">
                        {challenge.name}
                      </h4>
                      <p className="text-xs text-purple-300/70 mt-1">
                        {challenge.description}
                      </p>
                      <div className="mt-2">
                        <div className="retro-health-bar h-2">
                          <div
                            className="retro-health-bar-fill"
                            style={{ width: `${(challenge.currentMinutes / challenge.targetMinutes) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-purple-400 mt-1">
                          <span>{challenge.currentMinutes}/{challenge.targetMinutes} min</span>
                          <span className="retro-neon-yellow">
                            +{challenge.rewards.xp} XP, +{challenge.rewards.coins} coins
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-2">
              {leaderboard.map((member, index) => (
                <div
                  key={member.id}
                  className={cn(
                    "retro-game-card p-3 flex items-center gap-3",
                    member.id === 'me' && "retro-active-challenge"
                  )}
                >
                  {/* Rank Badge */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm retro-pixel-text",
                    index === 0 && "bg-gradient-to-br from-yellow-500 to-orange-600 border-2 border-yellow-400 text-white",
                    index === 1 && "bg-gradient-to-br from-gray-400 to-gray-500 border-2 border-gray-300 text-white",
                    index === 2 && "bg-gradient-to-br from-orange-600 to-orange-700 border-2 border-orange-400 text-white",
                    index > 2 && "bg-purple-900/50 border-2 border-purple-600/50 text-purple-400"
                  )}>
                    {index === 0 ? '👑' : index + 1}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white retro-pixel-text text-sm truncate">
                        {member.name}
                      </span>
                      {member.role === 'leader' && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                      {member.isOnline && (
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                      )}
                    </div>
                    <span className="text-xs text-purple-400 capitalize">{member.role}</span>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="font-bold text-cyan-400 retro-pixel-text">
                      {member.weeklyFocusMinutes}
                    </div>
                    <div className="text-xs text-purple-400">min</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t-2 border-purple-700/50 bg-purple-900/30 text-center">
          <p className="text-xs text-purple-400 retro-pixel-text flex items-center justify-center gap-2">
            <Star className="w-3 h-3" />
            FOCUS TOGETHER, WIN TOGETHER
            <Star className="w-3 h-3" />
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
