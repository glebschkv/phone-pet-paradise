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
  FocusQuality,
  AnalyticsInsight,
  Milestone,
  MonthlyStats,
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
    try {
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
    } catch (e) {
      console.error('Failed to load analytics data:', e);
    }
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
    try { storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, prunedSessions); } catch (e) { console.error('Failed to save sessions:', e); }
  }, []);

  // Save daily stats
  const saveDailyStats = useCallback((newStats: Record<string, DailyStats>) => {
    setDailyStats(newStats);
    try { storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, newStats); } catch (e) { console.error('Failed to save daily stats:', e); }
  }, []);

  // Save settings
  const saveSettings = useCallback((newSettings: AnalyticsSettings) => {
    setSettings(newSettings);
    try { storage.set(STORAGE_KEYS.ANALYTICS_SETTINGS, newSettings); } catch (e) { console.error('Failed to save settings:', e); }
  }, []);

  // Save records
  const saveRecords = useCallback((newRecords: PersonalRecords) => {
    setRecords(newRecords);
    try { storage.set(STORAGE_KEYS.ANALYTICS_RECORDS, newRecords); } catch (e) { console.error('Failed to save records:', e); }
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

  // ============================================================================
  // FOCUS SCORE (composite 0-100) — must be defined before recordSession
  // which references focusScore.score in its body and dependency array.
  // ============================================================================
  const focusScore = useMemo(() => {
    const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentWorkSessions = sessions.filter(s =>
      s.sessionType !== 'break' && s.startTime >= last30Days
    );

    if (recentWorkSessions.length === 0) {
      return { score: 0, breakdown: { completion: 0, consistency: 0, quality: 0, duration: 0 } };
    }

    // 1. Completion rate (0-25 pts)
    const completed = recentWorkSessions.filter(s => s.status === 'completed').length;
    const completionScore = Math.round((completed / recentWorkSessions.length) * 25);

    // 2. Goal consistency (0-25 pts) — days meeting goal out of active days (last 30)
    let activeDays = 0;
    let goalDays = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = dailyStats[dateStr];
      if (stats && stats.totalFocusTime > 0) {
        activeDays++;
        if (stats.goalMet) goalDays++;
      }
    }
    const consistencyScore = activeDays > 0 ? Math.round((goalDays / Math.max(activeDays, 7)) * 25) : 0;

    // 3. Focus quality (0-25 pts) — based on shield attempts / focus quality
    const sessionsWithQuality = recentWorkSessions.filter(s => s.focusQuality);
    let qualityScore = 12; // Default middle score when no quality data
    if (sessionsWithQuality.length > 0) {
      const perfectCount = sessionsWithQuality.filter(s => s.focusQuality === 'perfect').length;
      const goodCount = sessionsWithQuality.filter(s => s.focusQuality === 'good').length;
      const qualityRatio = (perfectCount * 1.0 + goodCount * 0.6) / sessionsWithQuality.length;
      qualityScore = Math.round(qualityRatio * 25);
    }

    // 4. Session duration consistency (0-25 pts) — completing planned durations
    const completedSessions = recentWorkSessions.filter(s => s.status === 'completed');
    let durationScore = 12;
    if (completedSessions.length >= 3) {
      const avgDuration = completedSessions.reduce((sum, s) => sum + s.actualDuration, 0) / completedSessions.length;
      // Reward longer average sessions (25+ min sweet spot)
      const durationRatio = Math.min(avgDuration / (25 * 60), 1);
      // Also reward regularity (low std deviation relative to mean)
      const durations = completedSessions.map(s => s.actualDuration);
      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      const regularityRatio = mean > 0 ? Math.max(0, 1 - (stdDev / mean)) : 0;

      durationScore = Math.round(((durationRatio * 0.6) + (regularityRatio * 0.4)) * 25);
    }

    const totalScore = Math.min(100, completionScore + consistencyScore + qualityScore + durationScore);

    return {
      score: totalScore,
      breakdown: {
        completion: completionScore,
        consistency: consistencyScore,
        quality: qualityScore,
        duration: durationScore,
      },
    };
  }, [sessions, dailyStats]);

  // Record a completed session (enhanced with focus quality)
  const recordSession = useCallback((
    sessionType: SessionType,
    plannedDuration: number,
    actualDuration: number,
    status: SessionStatus,
    xpEarned: number = 0,
    category?: FocusCategory,
    taskLabel?: string,
    shieldAttempts?: number,
    focusQuality?: FocusQuality,
    appsBlocked?: boolean,
  ) => {
    // Input validation — clamp values to sane ranges
    const safePlanned = Math.max(0, Math.min(plannedDuration, 86400)); // max 24h
    const safeActual = Math.max(0, Math.min(actualDuration, 86400));
    const safeXp = Math.max(0, xpEarned);
    const safeShieldAttempts = shieldAttempts !== undefined ? Math.max(0, shieldAttempts) : undefined;

    const now = Date.now();
    const startTime = now - (safeActual * 1000);
    const dateStr = getDateString(startTime);
    const hour = getHour(startTime);

    // Create session record
    const session: FocusSession = {
      id: generateId(),
      startTime,
      endTime: now,
      plannedDuration: safePlanned,
      actualDuration: safeActual,
      sessionType,
      status,
      xpEarned: safeXp,
      category,
      taskLabel,
      shieldAttempts: safeShieldAttempts,
      focusQuality,
      appsBlocked,
    };

    // Update sessions list
    const newSessions = [...sessions, session];
    saveSessions(newSessions);

    // Update daily stats
    const existingStats = dailyStats[dateStr] || createEmptyDailyStats(dateStr);
    const isWorkSession = sessionType !== 'break';

    const newHourlyFocus = { ...existingStats.hourlyFocus };
    if (isWorkSession && status !== 'abandoned') {
      newHourlyFocus[hour] = (newHourlyFocus[hour] || 0) + safeActual;
    }

    // Update category time tracking
    const newCategoryTime = { ...(existingStats.categoryTime || {}) };
    if (isWorkSession && status !== 'abandoned' && category) {
      newCategoryTime[category] = (newCategoryTime[category] || 0) + safeActual;
    }

    const updatedStats: DailyStats = {
      ...existingStats,
      totalFocusTime: existingStats.totalFocusTime + (isWorkSession ? safeActual : 0),
      totalBreakTime: existingStats.totalBreakTime + (!isWorkSession ? safeActual : 0),
      sessionsCompleted: existingStats.sessionsCompleted + (status === 'completed' && isWorkSession ? 1 : 0),
      sessionsAbandoned: existingStats.sessionsAbandoned + (status === 'abandoned' ? 1 : 0),
      longestSession: isWorkSession && status === 'completed'
        ? Math.max(existingStats.longestSession, safeActual)
        : existingStats.longestSession,
      goalMet: (existingStats.totalFocusTime + (isWorkSession ? safeActual : 0)) >= settings.dailyGoalMinutes * 60,
      hourlyFocus: newHourlyFocus,
      categoryTime: newCategoryTime,
    };

    // Snapshot focus score for today (used for trend tracking)
    updatedStats.focusScore = focusScore.score;

    const newDailyStats = { ...dailyStats, [dateStr]: updatedStats };
    saveDailyStats(newDailyStats);

    // Update personal records
    // Track total focus time for ALL work sessions (matches dailyStats accumulation)
    if (isWorkSession) {
      const newRecords = { ...records };
      let recordsUpdated = false;

      // Total focus time — counts all work session time (completed, skipped, abandoned)
      // This keeps records.totalFocusTime consistent with sum of dailyStats.totalFocusTime
      newRecords.totalFocusTime = records.totalFocusTime + safeActual;
      recordsUpdated = true;

      if (status === 'completed') {
        // Completed session count
        newRecords.totalSessions = records.totalSessions + 1;

        // Longest session
        if (safeActual > records.longestSession) {
          newRecords.longestSession = safeActual;
          newRecords.longestSessionDate = dateStr;
        }

        // Most focus in a day
        if (updatedStats.totalFocusTime > records.mostFocusInDay) {
          newRecords.mostFocusInDay = updatedStats.totalFocusTime;
          newRecords.mostFocusInDayDate = dateStr;
        }

        // Most sessions in a day
        if (updatedStats.sessionsCompleted > records.mostSessionsInDay) {
          newRecords.mostSessionsInDay = updatedStats.sessionsCompleted;
          newRecords.mostSessionsInDayDate = dateStr;
        }

        // Check goal streak
        const newGoalStreak = calculateGoalStreak(newDailyStats, settings.dailyGoalMinutes);
        setCurrentGoalStreak(newGoalStreak);

        if (newGoalStreak > records.longestGoalStreak) {
          newRecords.longestGoalStreak = newGoalStreak;
          newRecords.longestGoalStreakDate = dateStr;
        }
      }

      if (recordsUpdated) {
        saveRecords(newRecords);
      }
    }

    return session;
  }, [sessions, dailyStats, records, settings.dailyGoalMinutes, focusScore.score, saveSessions, saveDailyStats, saveRecords]);

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

    if (recentSessions.length === 0) return 0;

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

  // ============================================================================
  // FOCUS QUALITY STATS
  // ============================================================================
  const focusQualityStats = useMemo(() => {
    const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentWork = sessions.filter(s =>
      s.sessionType !== 'break' && s.status === 'completed' && s.startTime >= last30Days
    );

    const withQuality = recentWork.filter(s => s.focusQuality);
    const perfect = withQuality.filter(s => s.focusQuality === 'perfect').length;
    const good = withQuality.filter(s => s.focusQuality === 'good').length;
    const distracted = withQuality.filter(s => s.focusQuality === 'distracted').length;
    const total = withQuality.length;

    // Average shield attempts
    const withShield = recentWork.filter(s => s.shieldAttempts !== undefined);
    const avgShieldAttempts = withShield.length > 0
      ? withShield.reduce((sum, s) => sum + (s.shieldAttempts || 0), 0) / withShield.length
      : 0;

    // Focus quality by week (last 4 weeks)
    const weeklyQuality: { week: string; perfect: number; good: number; distracted: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = Date.now() - ((w + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = Date.now() - (w * 7 * 24 * 60 * 60 * 1000);
      const weekSessions = withQuality.filter(s => s.startTime >= weekStart && s.startTime < weekEnd);
      weeklyQuality.push({
        week: `W${4 - w}`,
        perfect: weekSessions.filter(s => s.focusQuality === 'perfect').length,
        good: weekSessions.filter(s => s.focusQuality === 'good').length,
        distracted: weekSessions.filter(s => s.focusQuality === 'distracted').length,
      });
    }

    // Perfect focus streak
    let perfectStreak = 0;
    const sortedRecent = [...recentWork].sort((a, b) => b.startTime - a.startTime);
    for (const s of sortedRecent) {
      if (s.focusQuality === 'perfect') perfectStreak++;
      else break;
    }

    return {
      perfect,
      good,
      distracted,
      total,
      avgShieldAttempts: Math.round(avgShieldAttempts * 10) / 10,
      perfectRate: total > 0 ? Math.round((perfect / total) * 100) : 0,
      weeklyQuality,
      perfectStreak,
    };
  }, [sessions]);

  // ============================================================================
  // COMPLETION RATE TREND (weekly averages over 4 weeks)
  // ============================================================================
  const completionTrend = useMemo(() => {
    const weeks: { week: string; rate: number; completed: number; total: number }[] = [];

    for (let w = 3; w >= 0; w--) {
      const weekStart = Date.now() - ((w + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = Date.now() - (w * 7 * 24 * 60 * 60 * 1000);
      const weekSessions = sessions.filter(s =>
        s.sessionType !== 'break' && s.startTime >= weekStart && s.startTime < weekEnd
      );
      const completed = weekSessions.filter(s => s.status === 'completed').length;
      const total = weekSessions.length;
      weeks.push({
        week: `W${4 - w}`,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed,
        total,
      });
    }

    // Calculate overall counts for last 30 days
    const last30 = sessions.filter(s =>
      s.sessionType !== 'break' && s.startTime > Date.now() - (30 * 24 * 60 * 60 * 1000)
    );
    const completedCount = last30.filter(s => s.status === 'completed').length;
    const skippedCount = last30.filter(s => s.status === 'skipped').length;
    const abandonedCount = last30.filter(s => s.status === 'abandoned').length;

    return {
      weeks,
      overall: {
        completed: completedCount,
        skipped: skippedCount,
        abandoned: abandonedCount,
        total: last30.length,
        rate: last30.length > 0 ? Math.round((completedCount / last30.length) * 100) : 0,
      },
    };
  }, [sessions]);

  // ============================================================================
  // MILESTONES
  // ============================================================================
  const milestones = useMemo((): Milestone[] => {
    const totalHours = Math.floor(records.totalFocusTime / 3600);
    const totalSess = records.totalSessions;

    const hourMilestones = [10, 25, 50, 100, 250, 500, 1000];
    const sessionMilestones = [10, 25, 50, 100, 250, 500, 1000];
    const streakMilestones = [3, 7, 14, 30, 60, 100, 365];

    const result: Milestone[] = [];

    // Next hour milestone
    const nextHourMilestone = hourMilestones.find(m => m > totalHours);
    if (nextHourMilestone) {
      result.push({
        id: 'hours',
        label: `${nextHourMilestone}h Focus Time`,
        target: nextHourMilestone,
        current: totalHours,
        unit: 'hours',
        icon: 'Clock',
        color: 'text-blue-500',
      });
    }

    // Next session milestone
    const nextSessionMilestone = sessionMilestones.find(m => m > totalSess);
    if (nextSessionMilestone) {
      result.push({
        id: 'sessions',
        label: `${nextSessionMilestone} Sessions`,
        target: nextSessionMilestone,
        current: totalSess,
        unit: 'sessions',
        icon: 'Zap',
        color: 'text-purple-500',
      });
    }

    // Next streak milestone
    const nextStreakMilestone = streakMilestones.find(m => m > currentGoalStreak);
    if (nextStreakMilestone) {
      result.push({
        id: 'streak',
        label: `${nextStreakMilestone}-Day Streak`,
        target: nextStreakMilestone,
        current: currentGoalStreak,
        unit: 'days',
        icon: 'Flame',
        color: 'text-orange-500',
      });
    }

    // Streak record
    if (currentGoalStreak > 0 && currentGoalStreak <= records.longestGoalStreak) {
      const remaining = records.longestGoalStreak - currentGoalStreak;
      if (remaining <= 10 && remaining > 0) {
        result.push({
          id: 'streak-record',
          label: 'Beat Streak Record',
          target: records.longestGoalStreak + 1,
          current: currentGoalStreak,
          unit: 'days',
          icon: 'Trophy',
          color: 'text-amber-500',
        });
      }
    }

    return result.slice(0, 4);
  }, [records, currentGoalStreak]);

  // ============================================================================
  // MONTHLY SUMMARY
  // ============================================================================
  const currentMonthStats = useMemo((): MonthlyStats => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayOfMonth = now.getDate();

    let totalFocus = 0;
    let totalSess = 0;
    let daysActive = 0;
    let goalsMet = 0;
    let bestDay = { date: '', focusTime: 0 };
    const categoryTotals: Partial<Record<FocusCategory, number>> = {};

    let totalCompleted = 0;
    let totalAttempted = 0;

    for (let d = 1; d <= dayOfMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const stats = dailyStats[dateStr];
      if (stats) {
        totalFocus += stats.totalFocusTime;
        totalSess += stats.sessionsCompleted;
        if (stats.totalFocusTime > 0) daysActive++;
        if (stats.goalMet) goalsMet++;
        if (stats.totalFocusTime > bestDay.focusTime) {
          bestDay = { date: dateStr, focusTime: stats.totalFocusTime };
        }
        // Aggregate categories
        if (stats.categoryTime) {
          Object.entries(stats.categoryTime).forEach(([cat, time]) => {
            categoryTotals[cat as FocusCategory] = (categoryTotals[cat as FocusCategory] || 0) + time;
          });
        }
        totalCompleted += stats.sessionsCompleted;
        totalAttempted += stats.sessionsCompleted + stats.sessionsAbandoned;
      }
    }

    // Find top category
    let topCategory: { category: FocusCategory; time: number } | null = null;
    let maxCatTime = 0;
    Object.entries(categoryTotals).forEach(([cat, time]) => {
      if (time > maxCatTime) {
        maxCatTime = time;
        topCategory = { category: cat as FocusCategory, time };
      }
    });

    return {
      month: monthStr,
      totalFocusTime: totalFocus,
      totalSessions: totalSess,
      daysActive,
      goalsMet,
      totalDays: daysInMonth,
      bestDay,
      topCategory,
      avgDailyFocus: daysActive > 0 ? Math.round(totalFocus / daysActive) : 0,
      completionRate: totalAttempted > 0 ? Math.round((totalCompleted / totalAttempted) * 100) : 0,
    };
  }, [dailyStats]);

  // ============================================================================
  // AI INSIGHTS (generated from data patterns)
  // ============================================================================
  const insights = useMemo((): AnalyticsInsight[] => {
    const generated: AnalyticsInsight[] = [];

    // 1. Week-over-week improvement
    if (weekOverWeekChange > 15) {
      generated.push({
        id: 'wow-up',
        type: 'achievement',
        icon: 'TrendingUp',
        title: 'On a roll!',
        description: `You focused ${weekOverWeekChange}% more than last week. Keep the momentum going!`,
        color: 'text-green-500',
      });
    } else if (weekOverWeekChange < -20 && lastWeekStats.totalFocusTime > 0) {
      generated.push({
        id: 'wow-down',
        type: 'recommendation',
        icon: 'AlertCircle',
        title: 'Focus dip detected',
        description: `Your focus time dropped ${Math.abs(weekOverWeekChange)}% vs last week. Try scheduling your sessions in advance.`,
        color: 'text-amber-500',
      });
    }

    // 2. Best focus time recommendation
    if (bestFocusHours.length > 0) {
      const bestHour = bestFocusHours[0].hour;
      const period = bestHour < 12 ? 'morning' : bestHour < 17 ? 'afternoon' : 'evening';
      generated.push({
        id: 'best-time',
        type: 'recommendation',
        icon: 'Clock',
        title: `You're a ${period} focuser`,
        description: `Your peak productivity is at ${bestHour === 0 ? 12 : bestHour > 12 ? bestHour - 12 : bestHour}${bestHour >= 12 ? 'PM' : 'AM'}. Try scheduling deep work sessions then.`,
        color: 'text-blue-500',
      });
    }

    // 3. Streak progress
    if (currentGoalStreak > 0) {
      const nextMilestone = [3, 7, 14, 30, 60, 100].find(m => m > currentGoalStreak);
      if (nextMilestone && (nextMilestone - currentGoalStreak) <= 3) {
        generated.push({
          id: 'streak-close',
          type: 'achievement',
          icon: 'Flame',
          title: 'Streak milestone incoming!',
          description: `Just ${nextMilestone - currentGoalStreak} more day${nextMilestone - currentGoalStreak > 1 ? 's' : ''} to reach a ${nextMilestone}-day streak!`,
          color: 'text-orange-500',
        });
      }
    }

    // 4. Completion rate feedback
    if (completionRate < 70 && sessions.length >= 5) {
      generated.push({
        id: 'completion-low',
        type: 'recommendation',
        icon: 'Target',
        title: 'Try shorter sessions',
        description: `Your completion rate is ${completionRate}%. Starting with shorter focus blocks can help build consistency.`,
        color: 'text-amber-500',
      });
    } else if (completionRate >= 90 && sessions.length >= 10) {
      generated.push({
        id: 'completion-high',
        type: 'achievement',
        icon: 'CheckCircle',
        title: 'Session master!',
        description: `${completionRate}% completion rate! You rarely quit a session early — that's elite focus.`,
        color: 'text-green-500',
      });
    }

    // 5. Category diversity
    const catDist = getCategoryDistribution(7);
    const activeCats = Object.values(catDist).filter(v => v > 0).length;
    if (activeCats >= 3) {
      generated.push({
        id: 'diverse',
        type: 'trend',
        icon: 'LayoutGrid',
        title: 'Well-rounded focus',
        description: `You worked across ${activeCats} categories this week. Balanced focus leads to balanced growth.`,
        color: 'text-purple-500',
      });
    }

    // 6. Personal record proximity
    if (todayStats.totalFocusTime > 0 && records.mostFocusInDay > 0) {
      const ratio = todayStats.totalFocusTime / records.mostFocusInDay;
      if (ratio >= 0.7 && ratio < 1.0) {
        generated.push({
          id: 'record-close',
          type: 'achievement',
          icon: 'Trophy',
          title: 'Record within reach!',
          description: `You're at ${Math.round(ratio * 100)}% of your daily focus record. One more session could break it!`,
          color: 'text-amber-500',
        });
      }
    }

    // 7. Focus quality insight
    if (focusQualityStats.total >= 5) {
      if (focusQualityStats.perfectRate >= 60) {
        generated.push({
          id: 'quality-high',
          type: 'achievement',
          icon: 'Shield',
          title: 'Laser focus',
          description: `${focusQualityStats.perfectRate}% of your sessions are distraction-free. App blocking is working for you!`,
          color: 'text-green-500',
        });
      } else if (focusQualityStats.perfectRate < 30 && focusQualityStats.avgShieldAttempts > 3) {
        generated.push({
          id: 'quality-low',
          type: 'recommendation',
          icon: 'Shield',
          title: 'Tame distractions',
          description: `Avg ${focusQualityStats.avgShieldAttempts} app-open attempts per session. Try enabling strict mode for better focus.`,
          color: 'text-red-500',
        });
      }
    }

    // 8. Total focus hours — shocking stat
    if (records.totalFocusTime > 3600) {
      const totalHrs = Math.floor(records.totalFocusTime / 3600);
      const workDays = (records.totalFocusTime / (8 * 3600)).toFixed(1);
      generated.push({
        id: 'total-hours',
        type: 'achievement',
        icon: 'Clock',
        title: `${totalHrs} hours of focus`,
        description: `That's ${workDays} full work days of pure focus. Every minute adds up.`,
        color: 'text-blue-500',
      });
    }

    // 9. Day-of-week pattern
    const dayTotals: Record<number, number> = {};
    Object.entries(dailyStats).forEach(([dateStr, stats]) => {
      const day = new Date(dateStr).getDay();
      dayTotals[day] = (dayTotals[day] || 0) + stats.totalFocusTime;
    });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sortedDays = Object.entries(dayTotals).sort(([, a], [, b]) => b - a);
    if (sortedDays.length >= 2) {
      const bestDayIdx = parseInt(sortedDays[0][0]);
      const worstDayIdx = parseInt(sortedDays[sortedDays.length - 1][0]);
      const bestTotal = sortedDays[0][1];
      const worstTotal = sortedDays[sortedDays.length - 1][1];
      if (bestTotal > 0 && worstTotal >= 0 && bestDayIdx !== worstDayIdx) {
        const ratio = worstTotal > 0 ? (bestTotal / worstTotal).toFixed(1) : '∞';
        generated.push({
          id: 'day-pattern',
          type: 'trend',
          icon: 'TrendingUp',
          title: `${dayNames[bestDayIdx]}s are your power day`,
          description: `You focus ${ratio}x more on ${dayNames[bestDayIdx]}s vs ${dayNames[worstDayIdx]}s.`,
          color: 'text-purple-500',
        });
      }
    }

    // 10. Projected milestone
    if (records.totalSessions >= 5) {
      const daysSinceJoin = Math.max(1, Math.floor((Date.now() - new Date(records.joinedDate).getTime()) / (24 * 60 * 60 * 1000)));
      const dailyRate = records.totalFocusTime / daysSinceJoin;
      if (dailyRate > 0) {
        const nextTarget = [100, 250, 500, 1000].find(h => h > Math.floor(records.totalFocusTime / 3600));
        if (nextTarget) {
          const secondsNeeded = nextTarget * 3600 - records.totalFocusTime;
          const daysToTarget = Math.ceil(secondsNeeded / dailyRate);
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + daysToTarget);
          const dateStr = targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
          generated.push({
            id: 'projection',
            type: 'trend',
            icon: 'Target',
            title: `${nextTarget}h by ${dateStr}`,
            description: `At your current pace, you'll hit ${nextTarget} total focus hours by ${dateStr}.`,
            color: 'text-blue-500',
          });
        }
      }
    }

    return generated.slice(0, 5);
  }, [weekOverWeekChange, lastWeekStats, bestFocusHours, currentGoalStreak, completionRate, sessions, getCategoryDistribution, todayStats, records, focusQualityStats, dailyStats]);

  // ============================================================================
  // PERSONALIZED TEASER MESSAGES (for locked section)
  // ============================================================================
  const premiumTeasers = useMemo((): string[] => {
    const teasers: string[] = [];

    // Records teasers
    if (records.totalSessions > 0) {
      teasers.push(`You've completed ${records.totalSessions} sessions — see all your personal records`);
    }

    // Category teaser
    const catDist = getCategoryDistribution(7);
    const activeCats = Object.values(catDist).filter(v => v > 0).length;
    if (activeCats > 0) {
      teasers.push(`You focused across ${activeCats} categories this week — see the full breakdown`);
    }

    // Week comparison teaser
    if (weekOverWeekChange !== 0) {
      const direction = weekOverWeekChange > 0 ? 'more' : 'less';
      teasers.push(`You focused ${Math.abs(weekOverWeekChange)}% ${direction} than last week — unlock the full comparison`);
    }

    // Best hours teaser
    if (bestFocusHours.length > 0) {
      teasers.push(`Your peak focus hours have shifted — discover when you're most productive`);
    }

    // Heatmap teaser
    const activeDaysCount = Object.values(dailyStats).filter(s => s.totalFocusTime > 0).length;
    if (activeDaysCount > 7) {
      teasers.push(`${activeDaysCount} active days tracked — see your full activity heatmap`);
    }

    // Focus score teaser
    if (focusScore.score > 0) {
      teasers.push(`Your Focus Score is ${focusScore.score}/100 — see what's driving it`);
    }

    return teasers;
  }, [records, getCategoryDistribution, weekOverWeekChange, bestFocusHours, dailyStats, focusScore]);

  // ============================================================================
  // FOCUS SCORE HISTORY (for trend sparkline)
  // ============================================================================
  const focusScoreHistory = useMemo((): { date: string; score: number }[] => {
    const result: { date: string; score: number }[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = dailyStats[dateStr];
      if (stats?.focusScore !== undefined) {
        result.push({ date: dateStr, score: stats.focusScore });
      }
    }

    return result;
  }, [dailyStats]);

  // ============================================================================
  // PEER BENCHMARK (simulated percentile based on score distribution)
  // ============================================================================
  const peerBenchmark = useMemo((): number => {
    // Use a sigmoid-like curve centered around score 50
    // This gives realistic-feeling percentiles without real user data
    if (focusScore.score === 0) return 0;
    const x = (focusScore.score - 45) / 15; // normalize around 45 (slightly below center)
    const percentile = Math.round(100 / (1 + Math.exp(-x)));
    return Math.max(5, Math.min(99, percentile)); // clamp 5-99
  }, [focusScore.score]);

  // Format duration helper
  const formatDuration = useCallback((seconds: number, format: 'short' | 'long' = 'short') => {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);

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

    // New computed
    focusScore,
    focusScoreHistory,
    peerBenchmark,
    focusQualityStats,
    completionTrend,
    milestones,
    currentMonthStats,
    insights,
    premiumTeasers,

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
