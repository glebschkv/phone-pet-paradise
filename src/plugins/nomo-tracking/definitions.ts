export interface NomoTrackingPlugin {
  getTodayStats(): Promise<{
    totalTime: number;
    sessionCount: number;
    longestSession: number;
  }>;
  
  getCurrentStreak(): Promise<{ streak: number }>;
  
  getWeeklyAverage(): Promise<{ averageTime: number }>;
  
  toggleWorkMode(): Promise<void>;
  
  requestPermissions(): Promise<{ granted: boolean }>;
  
  addListener(
    eventName: 'sessionCompleted',
    listenerFunc: (data: {
      points: number;
      duration: number;
      sessionType: string;
    }) => void,
  ): Promise<{ remove: () => void }>;
}