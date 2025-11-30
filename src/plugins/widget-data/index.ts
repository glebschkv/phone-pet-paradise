/**
 * Widget Data Service
 *
 * This service manages shared data between the React app and native widgets.
 * It stores data in a shared container (App Group on iOS, SharedPreferences on Android)
 * that both the main app and widgets can access.
 *
 * NATIVE IMPLEMENTATION REQUIRED:
 * - iOS: Use App Groups and UserDefaults with the suite name
 * - Android: Use SharedPreferences with MODE_WORLD_READABLE or a ContentProvider
 */

import { Capacitor } from '@capacitor/core';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';

// Widget data structure that will be shared with native widgets
export interface WidgetData {
  // Timer data
  timer: {
    isRunning: boolean;
    timeRemaining: number; // seconds
    sessionDuration: number; // seconds
    sessionType: 'pomodoro' | 'deep-work' | 'break' | null;
    category?: string;
    taskLabel?: string;
    startTime: number | null; // timestamp
  };

  // Streak data
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastSessionDate: string | null; // YYYY-MM-DD
    streakFreezes: number;
  };

  // Daily progress
  dailyProgress: {
    date: string; // YYYY-MM-DD
    focusMinutes: number;
    goalMinutes: number;
    sessionsCompleted: number;
    percentComplete: number;
  };

  // Quick stats
  stats: {
    level: number;
    totalXP: number;
    totalFocusTime: number; // all-time seconds
    totalSessions: number;
  };

  // Last updated timestamp
  lastUpdated: number;
}

// Shared app group identifier for future use when native implementation is ready
const WIDGET_DATA_KEY = 'widget_data';

class WidgetDataService {
  private data: WidgetData;

  constructor() {
    this.data = this.getDefaultData();
  }

  private getDefaultData(): WidgetData {
    const today = new Date().toISOString().split('T')[0];
    return {
      timer: {
        isRunning: false,
        timeRemaining: 25 * 60,
        sessionDuration: 25 * 60,
        sessionType: null,
        startTime: null,
      },
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: null,
        streakFreezes: 0,
      },
      dailyProgress: {
        date: today,
        focusMinutes: 0,
        goalMinutes: 120, // default 2 hours
        sessionsCompleted: 0,
        percentComplete: 0,
      },
      stats: {
        level: 1,
        totalXP: 0,
        totalFocusTime: 0,
        totalSessions: 0,
      },
      lastUpdated: Date.now(),
    };
  }

  /**
   * Load widget data from storage
   */
  async load(): Promise<WidgetData> {
    try {
      // Try to load from native shared storage first (for widgets)
      if (Capacitor.isNativePlatform()) {
        const nativeData = await this.loadFromNative();
        if (nativeData) {
          this.data = nativeData;
          return this.data;
        }
      }

      // Fall back to localStorage
      const stored = localStorage.getItem(WIDGET_DATA_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load widget data:', error);
    }
    return this.data;
  }

  /**
   * Save widget data to storage (both localStorage and native shared storage)
   */
  async save(updates: Partial<WidgetData>): Promise<void> {
    try {
      this.data = {
        ...this.data,
        ...updates,
        lastUpdated: Date.now(),
      };

      // Save to localStorage
      localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(this.data));

      // Save to native shared storage for widgets
      if (Capacitor.isNativePlatform()) {
        await this.saveToNative(this.data);
      }
    } catch (error) {
      console.error('Failed to save widget data:', error);
    }
  }

  /**
   * Update timer data
   */
  async updateTimer(timerData: Partial<WidgetData['timer']>): Promise<void> {
    await this.save({
      timer: {
        ...this.data.timer,
        ...timerData,
      },
    });
  }

  /**
   * Update streak data
   */
  async updateStreak(streakData: Partial<WidgetData['streak']>): Promise<void> {
    await this.save({
      streak: {
        ...this.data.streak,
        ...streakData,
      },
    });
  }

  /**
   * Update daily progress
   */
  async updateDailyProgress(progressData: Partial<WidgetData['dailyProgress']>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Reset if it's a new day
    if (this.data.dailyProgress.date !== today) {
      this.data.dailyProgress = {
        date: today,
        focusMinutes: 0,
        goalMinutes: this.data.dailyProgress.goalMinutes,
        sessionsCompleted: 0,
        percentComplete: 0,
      };
    }

    await this.save({
      dailyProgress: {
        ...this.data.dailyProgress,
        ...progressData,
        percentComplete: Math.min(
          100,
          Math.round(
            ((progressData.focusMinutes ?? this.data.dailyProgress.focusMinutes) /
              (progressData.goalMinutes ?? this.data.dailyProgress.goalMinutes)) *
              100
          )
        ),
      },
    });
  }

  /**
   * Update stats
   */
  async updateStats(statsData: Partial<WidgetData['stats']>): Promise<void> {
    await this.save({
      stats: {
        ...this.data.stats,
        ...statsData,
      },
    });
  }

  /**
   * Get current widget data
   */
  getData(): WidgetData {
    return this.data;
  }

  /**
   * Sync all data from app state
   * Call this when the app starts or when significant changes occur
   */
  async syncFromAppState(): Promise<void> {
    try {
      // Load timer state
      const timerState = storage.get<any>(STORAGE_KEYS.TIMER_STATE);
      if (timerState) {
        await this.updateTimer({
          isRunning: timerState.isRunning ?? false,
          timeRemaining: timerState.timeLeft ?? 25 * 60,
          sessionDuration: timerState.sessionDuration ?? 25 * 60,
          sessionType: timerState.sessionType ?? null,
          category: timerState.category,
          taskLabel: timerState.taskLabel,
          startTime: timerState.startTime ?? null,
        });
      }

      // Load streak data
      const streakData = storage.get<any>(STORAGE_KEYS.STREAK_DATA);
      if (streakData) {
        await this.updateStreak({
          currentStreak: streakData.currentStreak ?? 0,
          longestStreak: streakData.longestStreak ?? 0,
          lastSessionDate: streakData.lastSessionDate ?? null,
          streakFreezes: streakData.streakFreezes ?? 0,
        });
      }

      // Load XP/level data
      const xpData = storage.get<any>(STORAGE_KEYS.XP_SYSTEM);
      if (xpData) {
        await this.updateStats({
          level: xpData.level ?? 1,
          totalXP: xpData.totalXP ?? 0,
        });
      }

      // Load analytics data
      const analyticsRecords = storage.get<any>(STORAGE_KEYS.ANALYTICS_RECORDS);
      if (analyticsRecords) {
        await this.updateStats({
          totalFocusTime: analyticsRecords.totalFocusTime ?? 0,
          totalSessions: analyticsRecords.totalSessions ?? 0,
        });
      }

      // Load today's stats
      const dailyStats = storage.get<Record<string, any>>(STORAGE_KEYS.ANALYTICS_DAILY_STATS);
      const today = new Date().toISOString().split('T')[0];
      const todayStats = dailyStats?.[today];
      if (todayStats) {
        await this.updateDailyProgress({
          focusMinutes: Math.floor((todayStats.totalFocusTime ?? 0) / 60),
          sessionsCompleted: todayStats.sessionsCompleted ?? 0,
        });
      }

      // Load goal settings
      const analyticsSettings = storage.get<any>(STORAGE_KEYS.ANALYTICS_SETTINGS);
      if (analyticsSettings?.dailyGoalMinutes) {
        await this.updateDailyProgress({
          goalMinutes: analyticsSettings.dailyGoalMinutes,
        });
      }
    } catch (error) {
      console.error('Failed to sync widget data from app state:', error);
    }
  }

  // Native storage methods - these need to be implemented with a Capacitor plugin
  private async loadFromNative(): Promise<WidgetData | null> {
    // TODO: Implement with Capacitor plugin
    // This would call a native method to read from App Groups (iOS) or SharedPreferences (Android)
    return null;
  }

  private async saveToNative(_data: WidgetData): Promise<void> {
    // TODO: Implement with Capacitor plugin
    // This would call a native method to write to App Groups (iOS) or SharedPreferences (Android)
    // The native side would then trigger a widget refresh
  }
}

// Export singleton instance
export const widgetDataService = new WidgetDataService();
