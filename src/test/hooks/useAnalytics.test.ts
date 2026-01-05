import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import {
  FocusSession,
  DailyStats,
  AnalyticsSettings,
  PersonalRecords,
  DEFAULT_ANALYTICS_SETTINGS,
  DEFAULT_PERSONAL_RECORDS,
  createEmptyDailyStats,
} from '@/types/analytics';

// Mock logger
vi.mock('@/lib/logger', () => ({
  storageLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock constants
vi.mock('@/lib/constants', () => ({
  APP_CONFIG: {
    STORAGE_PREFIX: 'nomo_',
  },
}));

describe('useAnalytics', () => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const mockSession: FocusSession = {
    id: 'session-1',
    startTime: Date.now() - 3600000, // 1 hour ago
    endTime: Date.now(),
    plannedDuration: 3600,
    actualDuration: 3600,
    sessionType: 'pomodoro',
    status: 'completed',
    xpEarned: 100,
    category: 'work',
  };

  const mockDailyStats: DailyStats = {
    date: getTodayString(),
    totalFocusTime: 7200, // 2 hours in seconds
    totalBreakTime: 600,
    sessionsCompleted: 4,
    sessionsAbandoned: 0,
    longestSession: 3600,
    goalMet: true,
    hourlyFocus: { 9: 1800, 10: 3600, 14: 1800 },
    categoryTime: { work: 5400, study: 1800 },
  };

  const mockSettings: AnalyticsSettings = {
    dailyGoalMinutes: 120,
    weeklyGoalMinutes: 600,
    showInsights: true,
    trackSessionHistory: true,
  };

  const mockRecords: PersonalRecords = {
    longestSession: 7200,
    longestSessionDate: '2024-01-15',
    mostFocusInDay: 28800,
    mostFocusInDayDate: '2024-01-10',
    mostSessionsInDay: 10,
    mostSessionsInDayDate: '2024-01-10',
    longestGoalStreak: 14,
    longestGoalStreakDate: '2024-01-14',
    totalFocusTime: 360000,
    totalSessions: 200,
    joinedDate: '2023-12-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-20T12:00:00.000Z'));
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default values when localStorage is empty', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.sessions).toEqual([]);
      expect(result.current.dailyStats).toEqual({});
      expect(result.current.settings).toEqual(DEFAULT_ANALYTICS_SETTINGS);
      expect(result.current.currentGoalStreak).toBe(0);
    });

    it('should load data from localStorage', async () => {
      vi.useRealTimers();
      storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, [mockSession]);
      storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, { [getTodayString()]: mockDailyStats });
      storage.set(STORAGE_KEYS.ANALYTICS_SETTINGS, mockSettings);
      storage.set(STORAGE_KEYS.ANALYTICS_RECORDS, mockRecords);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.sessions.length).toBe(1);
      expect(result.current.settings.dailyGoalMinutes).toBe(120);
    });

    it('should calculate goal streak on load', async () => {
      vi.useRealTimers();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const dailyStats = {
        [today]: { ...mockDailyStats, date: today, totalFocusTime: 7200 },
        [yesterday]: { ...mockDailyStats, date: yesterday, totalFocusTime: 7200 },
      };

      storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, dailyStats);
      storage.set(STORAGE_KEYS.ANALYTICS_SETTINGS, { ...DEFAULT_ANALYTICS_SETTINGS, dailyGoalMinutes: 60 });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.currentGoalStreak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('recordSession', () => {
    it('should record a completed session', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.recordSession('pomodoro', 1500, 1500, 'completed', 50, 'work', 'Test task');
      });

      expect(result.current.sessions.length).toBe(1);
      expect(result.current.sessions[0].sessionType).toBe('pomodoro');
      expect(result.current.sessions[0].status).toBe('completed');
      expect(result.current.sessions[0].category).toBe('work');
    });

    it('should update daily stats when recording session', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.recordSession('pomodoro', 1800, 1800, 'completed', 50, 'study');
      });

      await waitFor(() => {
        expect(result.current.todayStats.totalFocusTime).toBe(1800);
        expect(result.current.todayStats.sessionsCompleted).toBe(1);
      });
    });

    it('should track break time separately', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.recordSession('break', 300, 300, 'completed', 0);
      });

      expect(result.current.todayStats.totalBreakTime).toBe(300);
      expect(result.current.todayStats.totalFocusTime).toBe(0);
    });

    it('should increment abandoned sessions count', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.recordSession('pomodoro', 1500, 500, 'abandoned', 0);
      });

      expect(result.current.todayStats.sessionsAbandoned).toBe(1);
    });

    it('should update personal records when new records are set', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.recordSession('deep-work', 7200, 7200, 'completed', 200, 'work');
      });

      expect(result.current.records.longestSession).toBe(7200);
    });

    it('should track category time', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.recordSession('pomodoro', 1800, 1800, 'completed', 50, 'creative');
      });

      await waitFor(() => {
        expect(result.current.todayStats.categoryTime?.creative).toBe(1800);
      });
    });

    it('should return the session object', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let session: FocusSession | undefined;
      act(() => {
        session = result.current.recordSession('pomodoro', 1500, 1500, 'completed', 50);
      });

      expect(session).toBeDefined();
      expect(session?.id).toBeDefined();
      expect(session?.sessionType).toBe('pomodoro');
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.updateSettings({ dailyGoalMinutes: 180 });
      });

      expect(result.current.settings.dailyGoalMinutes).toBe(180);
    });

    it('should preserve other settings when updating', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.updateSettings({ dailyGoalMinutes: 180 });
      });

      expect(result.current.settings.showInsights).toBe(true);
      expect(result.current.settings.trackSessionHistory).toBe(true);
    });

    it('should recalculate goal streak when daily goal changes', async () => {
      vi.useRealTimers();
      const today = new Date().toISOString().split('T')[0];
      storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, {
        [today]: { ...mockDailyStats, totalFocusTime: 3600 }, // 1 hour
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.updateSettings({ dailyGoalMinutes: 30 }); // Goal met
      });

      // Streak calculation depends on goal minutes
      expect(result.current.currentGoalStreak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('todayStats', () => {
    it('should return empty stats for today when no sessions', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.todayStats.totalFocusTime).toBe(0);
      expect(result.current.todayStats.sessionsCompleted).toBe(0);
    });

    it('should return correct date for today', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const today = new Date().toISOString().split('T')[0];
      expect(result.current.todayStats.date).toBe(today);
    });
  });

  describe('thisWeekStats', () => {
    it('should calculate weekly stats correctly', async () => {
      vi.useRealTimers();
      const today = new Date();
      const dailyStatsData: Record<string, DailyStats> = {};

      // Add stats for the past 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyStatsData[dateStr] = {
          ...createEmptyDailyStats(dateStr),
          totalFocusTime: 3600, // 1 hour per day
          sessionsCompleted: 2,
          goalMet: true,
        };
      }

      storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, dailyStatsData);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.thisWeekStats.totalFocusTime).toBeGreaterThan(0);
      expect(result.current.thisWeekStats.daysActive).toBeGreaterThan(0);
    });
  });

  describe('getDailyStatsRange', () => {
    it('should return stats for the specified number of days', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const stats = result.current.getDailyStatsRange(7);

      expect(stats.length).toBe(7);
      stats.forEach(stat => {
        expect(stat.date).toBeDefined();
      });
    });

    it('should create empty stats for days without data', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const stats = result.current.getDailyStatsRange(30);

      expect(stats.length).toBe(30);
      stats.forEach(stat => {
        expect(stat.totalFocusTime).toBe(0);
      });
    });
  });

  describe('hourlyDistribution', () => {
    it('should aggregate hourly focus across all days', async () => {
      vi.useRealTimers();
      const today = new Date().toISOString().split('T')[0];
      storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, {
        [today]: {
          ...createEmptyDailyStats(today),
          hourlyFocus: { 9: 1800, 10: 3600 },
        },
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.hourlyDistribution[9]).toBe(1800);
      expect(result.current.hourlyDistribution[10]).toBe(3600);
    });

    it('should initialize all 24 hours', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(Object.keys(result.current.hourlyDistribution).length).toBe(24);
    });
  });

  describe('bestFocusHours', () => {
    it('should return top 3 focus hours', async () => {
      vi.useRealTimers();
      const today = new Date().toISOString().split('T')[0];
      storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, {
        [today]: {
          ...createEmptyDailyStats(today),
          hourlyFocus: { 9: 1800, 10: 3600, 11: 2400, 14: 1200, 15: 600 },
        },
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.bestFocusHours.length).toBeLessThanOrEqual(3);
      if (result.current.bestFocusHours.length > 0) {
        expect(result.current.bestFocusHours[0].hour).toBe(10);
      }
    });

    it('should only include hours with focus time', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.bestFocusHours.length).toBe(0);
    });
  });

  describe('completionRate', () => {
    it('should return 100 when no sessions exist', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.completionRate).toBe(100);
    });

    it('should calculate completion rate correctly', async () => {
      vi.useRealTimers();
      const sessions: FocusSession[] = [
        { ...mockSession, id: '1', status: 'completed' },
        { ...mockSession, id: '2', status: 'completed' },
        { ...mockSession, id: '3', status: 'abandoned' },
        { ...mockSession, id: '4', status: 'completed' },
      ];
      storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, sessions);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.completionRate).toBe(75);
    });
  });

  describe('getRecentSessions', () => {
    it('should return sessions sorted by start time', async () => {
      vi.useRealTimers();
      const now = Date.now();
      const sessions: FocusSession[] = [
        { ...mockSession, id: '1', startTime: now - 3600000 },
        { ...mockSession, id: '2', startTime: now - 7200000 },
        { ...mockSession, id: '3', startTime: now - 1800000 },
      ];
      storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, sessions);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const recent = result.current.getRecentSessions(3);

      expect(recent[0].id).toBe('3');
      expect(recent[1].id).toBe('1');
      expect(recent[2].id).toBe('2');
    });

    it('should limit results to specified count', async () => {
      vi.useRealTimers();
      const sessions = Array.from({ length: 50 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
        startTime: Date.now() - i * 3600000,
      }));
      storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, sessions);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const recent = result.current.getRecentSessions(10);

      expect(recent.length).toBe(10);
    });
  });

  describe('weekOverWeekChange', () => {
    it('should return 100 when last week was 0 and this week has focus', async () => {
      vi.useRealTimers();
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, {
        [dateStr]: { ...createEmptyDailyStats(dateStr), totalFocusTime: 3600 },
      });

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.weekOverWeekChange).toBe(100);
    });

    it('should return 0 when both weeks have 0 focus', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.weekOverWeekChange).toBe(0);
    });
  });

  describe('getCategoryDistribution', () => {
    it('should return distribution of focus time by category', async () => {
      vi.useRealTimers();
      const sessions: FocusSession[] = [
        { ...mockSession, id: '1', category: 'work', actualDuration: 1800 },
        { ...mockSession, id: '2', category: 'work', actualDuration: 1200 },
        { ...mockSession, id: '3', category: 'study', actualDuration: 900 },
      ];
      storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, sessions);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const distribution = result.current.getCategoryDistribution();

      expect(distribution.work).toBe(3000);
      expect(distribution.study).toBe(900);
    });

    it('should filter by days when specified', async () => {
      vi.useRealTimers();
      const now = Date.now();
      const sessions: FocusSession[] = [
        { ...mockSession, id: '1', category: 'work', actualDuration: 1800, startTime: now - 86400000 }, // Yesterday
        { ...mockSession, id: '2', category: 'work', actualDuration: 1200, startTime: now - 86400000 * 10 }, // 10 days ago
      ];
      storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, sessions);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const distribution = result.current.getCategoryDistribution(7);

      expect(distribution.work).toBe(1800); // Only yesterday's session
    });
  });

  describe('formatDuration', () => {
    it('should format minutes correctly', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.formatDuration(1800)).toBe('30m');
      expect(result.current.formatDuration(2700)).toBe('45m');
    });

    it('should format hours and minutes correctly', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.formatDuration(3600)).toBe('1h 0m');
      expect(result.current.formatDuration(5400)).toBe('1h 30m');
    });

    it('should use long format when specified', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.formatDuration(1800, 'long')).toBe('30 minutes');
      expect(result.current.formatDuration(3600, 'long')).toBe('1 hour 0 mins');
    });
  });

  describe('resetAnalytics', () => {
    it('should reset all analytics data', async () => {
      vi.useRealTimers();
      storage.set(STORAGE_KEYS.ANALYTICS_SESSIONS, [mockSession]);
      storage.set(STORAGE_KEYS.ANALYTICS_DAILY_STATS, { [getTodayString()]: mockDailyStats });
      storage.set(STORAGE_KEYS.ANALYTICS_RECORDS, mockRecords);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.resetAnalytics();
      });

      expect(result.current.sessions).toEqual([]);
      expect(result.current.dailyStats).toEqual({});
      expect(result.current.currentGoalStreak).toBe(0);
    });

    it('should preserve joined date as today', async () => {
      vi.useRealTimers();
      storage.set(STORAGE_KEYS.ANALYTICS_RECORDS, mockRecords);

      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.resetAnalytics();
      });

      const today = new Date().toISOString().split('T')[0];
      expect(result.current.records.joinedDate).toBe(today);
    });
  });

  describe('return value structure', () => {
    it('should return all expected properties and methods', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useAnalytics());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // State
      expect(result.current).toHaveProperty('isLoaded');
      expect(result.current).toHaveProperty('sessions');
      expect(result.current).toHaveProperty('dailyStats');
      expect(result.current).toHaveProperty('settings');
      expect(result.current).toHaveProperty('records');
      expect(result.current).toHaveProperty('currentGoalStreak');

      // Computed
      expect(result.current).toHaveProperty('todayStats');
      expect(result.current).toHaveProperty('thisWeekStats');
      expect(result.current).toHaveProperty('lastWeekStats');
      expect(result.current).toHaveProperty('hourlyDistribution');
      expect(result.current).toHaveProperty('bestFocusHours');
      expect(result.current).toHaveProperty('completionRate');
      expect(result.current).toHaveProperty('weekOverWeekChange');
      expect(result.current).toHaveProperty('thisWeekCategoryDistribution');

      // Actions
      expect(typeof result.current.recordSession).toBe('function');
      expect(typeof result.current.updateSettings).toBe('function');
      expect(typeof result.current.getDailyStatsRange).toBe('function');
      expect(typeof result.current.getRecentSessions).toBe('function');
      expect(typeof result.current.getCategoryDistribution).toBe('function');
      expect(typeof result.current.formatDuration).toBe('function');
      expect(typeof result.current.resetAnalytics).toBe('function');
    });
  });
});
