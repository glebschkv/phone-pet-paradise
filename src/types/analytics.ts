// Analytics Types for Focus Timer

export type SessionType = 'pomodoro' | 'deep-work' | 'break';
export type SessionStatus = 'completed' | 'skipped' | 'abandoned';

export interface FocusSession {
  id: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  plannedDuration: number; // in seconds
  actualDuration: number; // in seconds
  sessionType: SessionType;
  status: SessionStatus;
  xpEarned: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalFocusTime: number; // seconds
  totalBreakTime: number; // seconds
  sessionsCompleted: number;
  sessionsAbandoned: number;
  longestSession: number; // seconds
  goalMet: boolean;
  hourlyFocus: Record<number, number>; // hour (0-23) -> seconds focused
}

export interface AnalyticsSettings {
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  showInsights: boolean;
  trackSessionHistory: boolean;
}

export interface PersonalRecords {
  longestSession: number; // seconds
  longestSessionDate: string;
  mostFocusInDay: number; // seconds
  mostFocusInDayDate: string;
  mostSessionsInDay: number;
  mostSessionsInDayDate: string;
  longestGoalStreak: number;
  longestGoalStreakDate: string;
  totalFocusTime: number; // all-time seconds
  totalSessions: number;
  joinedDate: string;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD (Monday)
  totalFocusTime: number;
  totalBreakTime: number;
  sessionsCompleted: number;
  daysActive: number;
  goalsMet: number;
  averageSessionLength: number;
}

export interface AnalyticsState {
  sessions: FocusSession[];
  dailyStats: Record<string, DailyStats>; // keyed by date YYYY-MM-DD
  settings: AnalyticsSettings;
  records: PersonalRecords;
  currentGoalStreak: number;
}

// Default values
export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  dailyGoalMinutes: 120, // 2 hours
  weeklyGoalMinutes: 600, // 10 hours
  showInsights: true,
  trackSessionHistory: true,
};

export const DEFAULT_PERSONAL_RECORDS: PersonalRecords = {
  longestSession: 0,
  longestSessionDate: '',
  mostFocusInDay: 0,
  mostFocusInDayDate: '',
  mostSessionsInDay: 0,
  mostSessionsInDayDate: '',
  longestGoalStreak: 0,
  longestGoalStreakDate: '',
  totalFocusTime: 0,
  totalSessions: 0,
  joinedDate: new Date().toISOString().split('T')[0],
};

export const createEmptyDailyStats = (date: string): DailyStats => ({
  date,
  totalFocusTime: 0,
  totalBreakTime: 0,
  sessionsCompleted: 0,
  sessionsAbandoned: 0,
  longestSession: 0,
  goalMet: false,
  hourlyFocus: {},
});
