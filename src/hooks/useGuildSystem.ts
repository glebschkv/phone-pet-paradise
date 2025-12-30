/**
 * @deprecated This hook is not yet ready for production.
 * The guild/team system is planned for a future release.
 * Do not use this hook in production code.
 */
import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { Guild, GuildMember, GuildChallenge, SAMPLE_GUILDS, getGuildLevel, GUILD_LEVEL_REQUIREMENTS } from '@/data/GamificationData';

/** @deprecated Guild system not yet implemented */
export interface GuildState {
  currentGuild: Guild | null;
  myContribution: number; // Weekly focus minutes
  joinedAt: string | null;
  role: 'leader' | 'officer' | 'member';
}

interface GuildProgress {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  progressPercent: number;
  weeklyProgress: number;
  weeklyGoalPercent: number;
}

const GUILD_UPDATE_EVENT = 'petIsland_guildUpdate';

/**
 * @deprecated This hook is not yet ready for production.
 * The guild/team system is planned for a future release.
 */
export const useGuildSystem = () => {
  const [state, setState] = useState<GuildState>({
    currentGuild: null,
    myContribution: 0,
    joinedAt: null,
    role: 'member',
  });

  const [challenges, setChallenges] = useState<GuildChallenge[]>([]);
  const [members, setMembers] = useState<GuildMember[]>([]);

  // Load saved state
  useEffect(() => {
    const saved = storage.get<GuildState>(STORAGE_KEYS.GUILD_DATA);
    if (saved) {
      setState(saved);
      // Generate sample members if in a guild
      if (saved.currentGuild) {
        setMembers(generateSampleMembers(saved.currentGuild.memberCount));
        setChallenges(generateWeeklyChallenges());
      }
    }
  }, []);

  // Reset weekly contribution on Monday
  useEffect(() => {
    const checkWeekReset = () => {
      const lastReset = localStorage.getItem('guild_last_week_reset');
      const now = new Date();
      const monday = getMonday(now);

      if (!lastReset || new Date(lastReset) < monday) {
        setState(prev => ({
          ...prev,
          myContribution: 0,
        }));
        localStorage.setItem('guild_last_week_reset', monday.toISOString());
        setChallenges(generateWeeklyChallenges());
      }
    };

    checkWeekReset();
  }, []);

  const saveState = useCallback((newState: GuildState) => {
    setState(newState);
    storage.set(STORAGE_KEYS.GUILD_DATA, newState);
  }, []);

  // Generate sample members for demo
  const generateSampleMembers = (count: number): GuildMember[] => {
    const names = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Parker', 'Drew', 'Charlie'];
    const members: GuildMember[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      members.push({
        id: `member-${i}`,
        name: names[i % names.length],
        role: i === 0 ? 'leader' : i < 3 ? 'officer' : 'member',
        weeklyFocusMinutes: Math.floor(Math.random() * 300) + 60,
        joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: Math.random() > 0.7,
      });
    }

    return members.sort((a, b) => b.weeklyFocusMinutes - a.weeklyFocusMinutes);
  };

  // Generate weekly challenges
  const generateWeeklyChallenges = (): GuildChallenge[] => {
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    return [
      {
        id: 'weekly-focus-1',
        name: 'Team Focus Sprint',
        description: 'Guild members collectively focus for 500 minutes',
        emoji: '🎯',
        targetMinutes: 500,
        currentMinutes: Math.floor(Math.random() * 400),
        deadline: endOfWeek.toISOString(),
        rewards: { xp: 200, coins: 300, guildXp: 100 },
        isCompleted: false,
      },
      {
        id: 'weekly-focus-2',
        name: 'Marathon Mode',
        description: 'Any member completes a 2-hour session',
        emoji: '🏃',
        targetMinutes: 120,
        currentMinutes: Math.floor(Math.random() * 100),
        deadline: endOfWeek.toISOString(),
        rewards: { xp: 150, coins: 200, guildXp: 75 },
        isCompleted: false,
      },
      {
        id: 'weekly-focus-3',
        name: 'All Hands on Deck',
        description: '5 different members complete sessions today',
        emoji: '🤝',
        targetMinutes: 5,
        currentMinutes: Math.floor(Math.random() * 4),
        deadline: endOfWeek.toISOString(),
        rewards: { xp: 100, coins: 150, guildXp: 50 },
        isCompleted: false,
      },
    ];
  };

  // Join a guild
  const joinGuild = useCallback((guild: Guild): boolean => {
    if (state.currentGuild) return false; // Already in a guild
    if (guild.memberCount >= guild.maxMembers) return false; // Guild is full

    const newGuild = { ...guild, memberCount: guild.memberCount + 1 };
    const newState: GuildState = {
      currentGuild: newGuild,
      myContribution: 0,
      joinedAt: new Date().toISOString(),
      role: 'member',
    };

    saveState(newState);
    setMembers(generateSampleMembers(newGuild.memberCount));
    setChallenges(generateWeeklyChallenges());

    return true;
  }, [state.currentGuild, saveState]);

  // Leave guild
  const leaveGuild = useCallback(() => {
    saveState({
      currentGuild: null,
      myContribution: 0,
      joinedAt: null,
      role: 'member',
    });
    setMembers([]);
    setChallenges([]);
  }, [saveState]);

  // Create a new guild
  const createGuild = useCallback((name: string, description: string, emoji: string, isPublic: boolean): Guild => {
    const newGuild: Guild = {
      id: `guild-${Date.now()}`,
      name,
      description,
      emoji,
      memberCount: 1,
      maxMembers: 50,
      totalFocusMinutes: 0,
      weeklyGoal: 1000,
      level: 1,
      createdAt: new Date().toISOString(),
      isPublic,
    };

    const newState: GuildState = {
      currentGuild: newGuild,
      myContribution: 0,
      joinedAt: new Date().toISOString(),
      role: 'leader',
    };

    saveState(newState);
    setMembers([{
      id: 'me',
      name: 'You',
      role: 'leader',
      weeklyFocusMinutes: 0,
      joinedAt: new Date().toISOString(),
      isOnline: true,
    }]);
    setChallenges(generateWeeklyChallenges());

    return newGuild;
  }, [saveState]);

  // Contribute focus minutes
  const contributeMinutes = useCallback((minutes: number) => {
    if (!state.currentGuild) return;

    const newContribution = state.myContribution + minutes;
    const newTotalMinutes = state.currentGuild.totalFocusMinutes + minutes;
    const newLevel = getGuildLevel(newTotalMinutes);

    const updatedGuild: Guild = {
      ...state.currentGuild,
      totalFocusMinutes: newTotalMinutes,
      level: newLevel,
    };

    saveState({
      ...state,
      currentGuild: updatedGuild,
      myContribution: newContribution,
    });

    // Update challenges
    setChallenges(prev => prev.map(challenge => {
      if (challenge.isCompleted) return challenge;

      let newCurrent = challenge.currentMinutes;
      if (challenge.id === 'weekly-focus-1') {
        newCurrent += minutes;
      } else if (challenge.id === 'weekly-focus-2' && minutes >= 120) {
        newCurrent = 120;
      }

      return {
        ...challenge,
        currentMinutes: newCurrent,
        isCompleted: newCurrent >= challenge.targetMinutes,
      };
    }));

    window.dispatchEvent(new CustomEvent(GUILD_UPDATE_EVENT, {
      detail: { minutes, totalMinutes: newTotalMinutes }
    }));
  }, [state, saveState]);

  // Get guild progress
  const getGuildProgress = useCallback((): GuildProgress | null => {
    if (!state.currentGuild) return null;

    const level = state.currentGuild.level;
    const currentXP = state.currentGuild.totalFocusMinutes;
    const levelStart = GUILD_LEVEL_REQUIREMENTS[level - 1] || 0;
    const levelEnd = GUILD_LEVEL_REQUIREMENTS[level] || levelStart + 10000;

    const xpInLevel = currentXP - levelStart;
    const xpNeeded = levelEnd - levelStart;
    const progressPercent = (xpInLevel / xpNeeded) * 100;

    // Calculate weekly progress (simulated - would be from backend in production)
    const weeklyProgress = state.myContribution + members.reduce((sum, m) => sum + m.weeklyFocusMinutes, 0);
    const weeklyGoalPercent = (weeklyProgress / state.currentGuild.weeklyGoal) * 100;

    return {
      level,
      currentXP,
      xpToNextLevel: levelEnd - currentXP,
      progressPercent,
      weeklyProgress,
      weeklyGoalPercent: Math.min(100, weeklyGoalPercent),
    };
  }, [state, members]);

  // Get available guilds to join
  const getAvailableGuilds = useCallback((): Guild[] => {
    return SAMPLE_GUILDS.filter(g => g.memberCount < g.maxMembers);
  }, []);

  // Get leaderboard
  const getLeaderboard = useCallback((): GuildMember[] => {
    if (!state.currentGuild) return [];

    // Add current user to members list
    const allMembers = [
      {
        id: 'me',
        name: 'You',
        role: state.role,
        weeklyFocusMinutes: state.myContribution,
        joinedAt: state.joinedAt || new Date().toISOString(),
        isOnline: true,
      } as GuildMember,
      ...members.filter(m => m.id !== 'me'),
    ];

    return allMembers.sort((a, b) => b.weeklyFocusMinutes - a.weeklyFocusMinutes);
  }, [state, members]);

  return {
    state,
    challenges,
    members,
    joinGuild,
    leaveGuild,
    createGuild,
    contributeMinutes,
    getGuildProgress,
    getAvailableGuilds,
    getLeaderboard,
    isInGuild: !!state.currentGuild,
  };
};

// Helper function
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
