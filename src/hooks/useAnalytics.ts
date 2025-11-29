import { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import {
  FocusSession,
  DailyStats,
  AnalyticsSettings,
  PersonalRecords,
  SessionType,
  SessionStatus,
  WeeklyStats,
  FocusCategory,
  DEFAULT_ANALYTICS_SETTINGS,
  DEFAULT_PERSONAL_RECORDS,
  createEmptyDailyStats,
} from '@/types/analytics';

// Helper to get today's date string
const getTodayString = () => new Date().toISOString().split('T')[0];

// Helper to get date string from timestamp
const getDateString = (timestamp: number) => new Date(timestamp).toISOString().split('T')[0];

// Helper to get hour from timestamp
const getHour = (timestamp: number) => new Date(timestamp).getHours();

// Helper to get start of week (Monday)
const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

// Helper to generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Keep only last 90 days of sessions for storage efficiency
const MAX_SESSION_DAYS = 90;

export const useAnalytics = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [dailyStats, setDailyStats] = useState<Record<string, DailyStats>>({});
  const [settings, setSettings] = useState<AnalyticsSettings>(DEFAULT_ANALYTICS_SETTINGS);
  const [records, setRecords] = useState<PersonalRecords>(DEFAULT_PERSONAL_RECORDS);
  const [currentGoalStreak, setCurrentGoalStreak] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedSessions = storage.get<FocusSession[]>(STORAGE_KEYS.ANALYTICS_SESSIONS) || [];
    const loadedDailyStats = storage.get<Record<string, DailyStats>>(STORAGE_KEYS.ANALYTICS_DAILY_STATS) || {};
    const loadedSettings = storage.get<AnalyticsSettings>(STORAGE_KEYS.ANALYTICS_SETTINGS) || DEFAULT_ANALYTICS_SETTINGS;
    const loadedRecords = storage.get<PersonalRecords>(STORAGE_KEYS.ANALYTICS_RECORDS) || {
      ...DEFAULT_PERSONAL_RECORDS,
      joinedDate: getTodayString(),
    };

    setSessions(loadedSessions);
    setDailyStats(loadedDailyStats);
    setSettings(loadedSettings);
    setRecords(loadedRecords);

    // Calculate current goal streak
    const streak = calculateGoalStreak(loadedDailyStats, loadedSettings.dailyGoalMinutes);
    setCurrentGoalStreak(streak);
    setIsLoaded(true);
  }, []);

  // Save sessions
  const saveSessions = useCallback((newSessions: FocusSession[]) => {
    // Prune old sessions
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_SESSION_DAYS);
    const cutoffTimestamp = cutoffDate.getTime();

    const prunedSessions = newSessions.filter(s => s.startTime >= cutoffTimestamp);
    setSessions(prunedSessions);
    storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, prunedSessions);
  }, []);

  // Save daily stats
  const saveDailyStats = useCallback((newStats: Record<string, DailyStats>) => {
    setDailyStats(newStats);
    storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, newStats);
  }, []);

  // Save settings
  const saveSettings = useCallback((newSettings: AnalyticsSettings) => {
    setSettings(newSettings);
    storage.set(STORAGE_KEYS.ANALYTICS_SETTINGS, newSettings);
  }, []);

  // Save records
  const saveRecords = useCallback((newRecords: PersonalRecords) => {
    setRecords(newRecords);
    storage.set(STORAGE_KEYS.ANALYTICS_RECORDS, newRecords);
  }, []);

  // Calculate goal streak from daily stats
  const calculateGoalStreak = (stats: Record<string, DailyStats>, goalMinutes: number): number => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = stats[dateStr];

      if (dayStats && dayStats.totalFocusTime >= goalMinutes * 60) {
        streak++;
      } else if (i > 0) {
        // Allow today to be incomplete
        break;
      }
    }

    return streak;
  };

  // Record a completed session
  const recordSession = useCallback((
    sessionType: SessionType,
    plannedDuration: number,
    actualDuration: number,
    status: SessionStatus,
    xpEarned: number = 0,
    category?: FocusCategory,
    taskLabel?: string
  ) => {
    const now = Date.now();
    const startTime = now - (actualDuration * 1000);
    const dateStr = getDateString(startTime);
    const hour = getHour(startTime);

    // Create session record
    const session: FocusSession = {
      id: generateId(),
      startTime,
      endTime: now,
      plannedDuration,
      actualDuration,
      sessionType,
      status,
      xpEarned,
      category,
      taskLabel,
    };

    // Update sessions list
    const newSessions = [...sessions, session];
    saveSessions(newSessions);

    // Update daily stats
    const existingStats = dailyStats[dateStr] || createEmptyDailyStats(dateStr);
    const isWorkSession = sessionType !== 'break';

    const newHourlyFocus = { ...existingStats.hourlyFocus };
    if (isWorkSession && status === 'completed') {
      newHourlyFocus[hour] = (newHourlyFocus[hour] || 0) + actualDuration;
    }

    // Update category time tracking
    const newCategoryTime = { ...(existingStats.categoryTime || {}) };
    if (isWorkSession && status === 'completed' && category) {
      newCategoryTime[category] = (newCategoryTime[category] || 0) + actualDuration;
    }

    const updatedStats: DailyStats = {
      ...existingStats,
      totalFocusTime: existingStats.totalFocusTime + (isWorkSession ? actualDuration : 0),
      totalBreakTime: existingStats.totalBreakTime + (!isWorkSession ? actualDuration : 0),
      sessionsCompleted: existingStats.sessionsCompleted + (status === 'completed' && isWorkSession ? 1 : 0),
      sessionsAbandoned: existingStats.sessionsAbandoned + (status === 'abandoned' ? 1 : 0),
      longestSession: isWorkSession && status === 'completed'
        ? Math.max(existingStats.longestSession, actualDuration)
        : existingStats.longestSession,
      goalMet: (existingStats.totalFocusTime + (isWorkSession ? actualDuration : 0)) >= settings.dailyGoalMinutes * 60,
      hourlyFocus: newHourlyFocus,
      categoryTime: newCategoryTime,
    };

    const newDailyStats = { ...dailyStats, [dateStr]: updatedStats };
    saveDailyStats(newDailyStats);

    // Update personal records
    if (isWorkSession && status === 'completed') {
      const newRecords = { ...records };
      let recordsUpdated = false;

      // Longest session
      if (actualDuration > records.longestSession) {
        newRecords.longestSession = actualDuration;
        newRecords.longestSessionDate = dateStr;
        recordsUpdated = true;
      }

      // Most focus in a day
      if (updatedStats.totalFocusTime > records.mostFocusInDay) {
        newRecords.mostFocusInDay = updatedStats.totalFocusTime;
        newRecords.mostFocusInDayDate = dateStr;
        recordsUpdated = true;
      }

      // Most sessions in a day
      if (updatedStats.sessionsCompleted > records.mostSessionsInDay) {
        newRecords.mostSessionsInDay = updatedStats.sessionsCompleted;
        newRecords.mostSessionsInDayDate = dateStr;
        recordsUpdated = true;
      }

      // Update totals
      newRecords.totalFocusTime = records.totalFocusTime + actualDuration;
      newRecords.totalSessions = records.totalSessions + 1;
      recordsUpdated = true;

      // Check goal streak
      const newGoalStreak = calculateGoalStreak(newDailyStats, settings.dailyGoalMinutes);
      setCurrentGoalStreak(newGoalStreak);

      if (newGoalStreak > records.longestGoalStreak) {
        newRecords.longestGoalStreak = newGoalStreak;
        newRecords.longestGoalStreakDate = dateStr;
      }

      if (recordsUpdated) {
        saveRecords(newRecords);
      }
    }

    return session;
  }, [sessions, dailyStats, records, settings.dailyGoalMinutes, saveSessions, saveDailyStats, saveRecords]);

  // Update analytics settings
  const updateSettings = useCallback((updates: Partial<AnalyticsSettings>) => {
    const newSettings = { ...settings, ...updates };
    saveSettings(newSettings);

    // Recalculate goal streak if daily goal changed
    if (updates.dailyGoalMinutes !== undefined) {
      const newStreak = calculateGoalStreak(dailyStats, updates.dailyGoalMinutes);
      setCurrentGoalStreak(newStreak);
    }
  }, [settings, dailyStats, saveSettings]);

  // Get today's stats
  const todayStats = useMemo(() => {
    const today = getTodayString();
    return dailyStats[today] || createEmptyDailyStats(today);
  }, [dailyStats]);

  // Get this week's stats
  const thisWeekStats = useMemo((): WeeklyStats => {
    const weekStart = getWeekStart(new Date());
    let totalFocus = 0;
    let totalBreak = 0;
    let sessionsCompleted = 0;
    let daysActive = 0;
    let goalsMet = 0;
    let totalSessionDuration = 0;
    let sessionCount = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = dailyStats[dateStr];

      if (stats) {
        totalFocus += stats.totalFocusTime;
        totalBreak += stats.totalBreakTime;
        sessionsCompleted += stats.sessionsCompleted;
        if (stats.totalFocusTime > 0) daysActive++;
        if (stats.goalMet) goalsMet++;

        // For average session length
        const daySessions = sessions.filter(s =>
          getDateString(s.startTime) === dateStr &&
          s.sessionType !== 'break' &&
          s.status === 'completed'
        );
        daySessions.forEach(s => {
          totalSessionDuration += s.actualDuration;
          sessionCount++;
        });
      }
    }

    return {
      weekStart,
      totalFocusTime: totalFocus,
      totalBreakTime: totalBreak,
      sessionsCompleted,
      daysActive,
      goalsMet,
      averageSessionLength: sessionCount > 0 ? Math.round(totalSessionDuration / sessionCount) : 0,
    };
  }, [dailyStats, sessions]);

  // Get last week's stats for comparison
  const lastWeekStats = useMemo((): WeeklyStats => {
    const thisWeekStart = new Date(getWeekStart(new Date()));
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const weekStartStr = lastWeekStart.toISOString().split('T')[0];

    let totalFocus = 0;
    let totalBreak = 0;
    let sessionsCompleted = 0;
    let daysActive = 0;
    let goalsMet = 0;
    let totalSessionDuration = 0;
    let sessionCount = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(lastWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = dailyStats[dateStr];

      if (stats) {
        totalFocus += stats.totalFocusTime;
        totalBreak += stats.totalBreakTime;
        sessionsCompleted += stats.sessionsCompleted;
        if (stats.totalFocusTime > 0) daysActive++;
        if (stats.goalMet) goalsMet++;

        const daySessions = sessions.filter(s =>
          getDateString(s.startTime) === dateStr &&
          s.sessionType !== 'break' &&
          s.status === 'completed'
        );
        daySessions.forEach(s => {
          totalSessionDuration += s.actualDuration;
          sessionCount++;
        });
      }
    }

    return {
      weekStart: weekStartStr,
      totalFocusTime: totalFocus,
      totalBreakTime: totalBreak,
      sessionsCompleted,
      daysActive,
      goalsMet,
      averageSessionLength: sessionCount > 0 ? Math.round(totalSessionDuration / sessionCount) : 0,
    };
  }, [dailyStats, sessions]);

  // Get daily stats for the last N days (for charts)
  const getDailyStatsRange = useCallback((days: number): DailyStats[] => {
    const result: DailyStats[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push(dailyStats[dateStr] || createEmptyDailyStats(dateStr));
    }

    return result;
  }, [dailyStats]);

  // Get hourly distribution (best focus hours)
  const hourlyDistribution = useMemo(() => {
    const distribution: Record<number, number> = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      distribution[i] = 0;
    }

    // Sum up hourly focus from all days
    Object.values(dailyStats).forEach(day => {
      Object.entries(day.hourlyFocus || {}).forEach(([hour, seconds]) => {
        distribution[parseInt(hour)] += seconds;
      });
    });

    return distribution;
  }, [dailyStats]);

  // Get best focus hours
  const bestFocusHours = useMemo(() => {
    const entries = Object.entries(hourlyDistribution)
      .map(([hour, seconds]) => ({ hour: parseInt(hour), seconds }))
      .sort((a, b) => b.seconds - a.seconds);

    // Return top 3 hours with significant focus time
    return entries.filter(e => e.seconds > 0).slice(0, 3);
  }, [hourlyDistribution]);

  // Calculate completion rate
  const completionRate = useMemo(() => {
    const recentSessions = sessions.filter(s =>
      s.sessionType !== 'break' &&
      s.startTime > Date.now() - (30 * 24 * 60 * 60 * 1000) // Last 30 days
    );

    if (recentSessions.length === 0) return 100;

    const completed = recentSessions.filter(s => s.status === 'completed').length;
    return Math.round((completed / recentSessions.length) * 100);
  }, [sessions]);

  // Get recent sessions (for history)
  const getRecentSessions = useCallback((limit: number = 20): FocusSession[] => {
    return [...sessions]
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }, [sessions]);

  // Calculate week-over-week change
  const weekOverWeekChange = useMemo(() => {
    if (lastWeekStats.totalFocusTime === 0) {
      return thisWeekStats.totalFocusTime > 0 ? 100 : 0;
    }
    return Math.round(((thisWeekStats.totalFocusTime - lastWeekStats.totalFocusTime) / lastWeekStats.totalFocusTime) * 100);
  }, [thisWeekStats, lastWeekStats]);

  // Get category distribution (all-time or date range)
  const getCategoryDistribution = useCallback((days?: number): Record<FocusCategory, number> => {
    const distribution: Record<FocusCategory, number> = {
      work: 0,
      study: 0,
      creative: 0,
      personal: 0,
      health: 0,
      other: 0,
    };

    const cutoffDate = days ? Date.now() - (days * 24 * 60 * 60 * 1000) : 0;

    sessions.forEach(session => {
      if (
        session.sessionType !== 'break' &&
        session.status === 'completed' &&
        session.category &&
        session.startTime >= cutoffDate
      ) {
        distribution[session.category] += session.actualDuration;
      }
    });

    return distribution;
  }, [sessions]);

  // This week's category breakdown
  const thisWeekCategoryDistribution = useMemo(() => {
    return getCategoryDistribution(7);
  }, [getCategoryDistribution]);

  // Format duration helper
  const formatDuration = useCallback((seconds: number, format: 'short' | 'long' = 'short') => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (format === 'long') {
      if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
      }
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  // Reset all analytics data
  const resetAnalytics = useCallback(() => {
    const defaultRecords = {
      ...DEFAULT_PERSONAL_RECORDS,
      joinedDate: getTodayString(),
    };

    setSessions([]);
    setDailyStats({});
    setRecords(defaultRecords);
    setCurrentGoalStreak(0);

    storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, []);
    storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, {});
    storage.set(STORAGE_KEYS.ANALYTICS_RECORDS, defaultRecords);
  }, []);

  return {
    // State
    isLoaded,
    sessions,
    dailyStats,
    settings,
    records,
    currentGoalStreak,

    // Computed
    todayStats,
    thisWeekStats,
    lastWeekStats,
    hourlyDistribution,
    bestFocusHours,
    completionRate,
    weekOverWeekChange,
    thisWeekCategoryDistribution,

    // Actions
    recordSession,
    updateSettings,
    getDailyStatsRange,
    getRecentSessions,
    getCategoryDistribution,
    formatDuration,
    resetAnalytics,
  };
};
