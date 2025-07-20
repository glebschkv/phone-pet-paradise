import { WebPlugin } from '@capacitor/core';
import type { NomoTrackingPlugin } from './definitions';

export class NomoTrackingWeb extends WebPlugin implements NomoTrackingPlugin {
  async getTodayStats(): Promise<{ totalTime: number; sessionCount: number; longestSession: number; }> {
    // Web fallback - use localStorage to simulate tracking
    const sessions = this.getStoredSessions();
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(s => new Date(s.date).toDateString() === today);
    
    const totalTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const longestSession = Math.max(...todaySessions.map(s => s.duration), 0);
    
    return {
      totalTime,
      sessionCount: todaySessions.length,
      longestSession
    };
  }

  async getCurrentStreak(): Promise<{ streak: number; }> {
    const streak = parseInt(localStorage.getItem('nomo_streak') || '0');
    return { streak };
  }

  async getWeeklyAverage(): Promise<{ averageTime: number; }> {
    const sessions = this.getStoredSessions();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekSessions = sessions.filter(s => new Date(s.date) > weekAgo);
    
    const totalTime = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    return { averageTime: totalTime / 7 };
  }

  async toggleWorkMode(): Promise<void> {
    const current = localStorage.getItem('nomo_work_mode') === 'true';
    localStorage.setItem('nomo_work_mode', (!current).toString());
  }

  async requestPermissions(): Promise<{ granted: boolean; }> {
    // Web doesn't need special permissions, always return true
    return { granted: true };
  }

  async addListener(eventName: string, listenerFunc: any): Promise<any> {
    // Register listener for web events
    const listener = (event: any) => {
      listenerFunc(event.detail);
    };
    
    window.addEventListener(`nomo-${eventName}`, listener);
    
    return {
      remove: () => {
        window.removeEventListener(`nomo-${eventName}`, listener);
      }
    };
  }

  private getStoredSessions(): Array<{ date: string; duration: number; }> {
    const stored = localStorage.getItem('nomo_sessions');
    return stored ? JSON.parse(stored) : [];
  }
}