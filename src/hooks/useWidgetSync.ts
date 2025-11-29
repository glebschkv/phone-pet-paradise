import { useEffect, useCallback } from 'react';
import { widgetDataService, WidgetData } from '@/plugins/widget-data';

/**
 * Hook to sync app state with widget data
 *
 * Use this hook in the main App component to keep widget data up to date.
 */
export const useWidgetSync = () => {
  // Initial sync on mount
  useEffect(() => {
    widgetDataService.syncFromAppState();
  }, []);

  // Update timer data
  const updateWidgetTimer = useCallback(
    (timerData: Partial<WidgetData['timer']>) => {
      widgetDataService.updateTimer(timerData);
    },
    []
  );

  // Update streak data
  const updateWidgetStreak = useCallback(
    (streakData: Partial<WidgetData['streak']>) => {
      widgetDataService.updateStreak(streakData);
    },
    []
  );

  // Update daily progress
  const updateWidgetProgress = useCallback(
    (progressData: Partial<WidgetData['dailyProgress']>) => {
      widgetDataService.updateDailyProgress(progressData);
    },
    []
  );

  // Update stats
  const updateWidgetStats = useCallback(
    (statsData: Partial<WidgetData['stats']>) => {
      widgetDataService.updateStats(statsData);
    },
    []
  );

  // Full sync
  const syncWidgetData = useCallback(() => {
    widgetDataService.syncFromAppState();
  }, []);

  // Get current data
  const getWidgetData = useCallback(() => {
    return widgetDataService.getData();
  }, []);

  return {
    updateWidgetTimer,
    updateWidgetStreak,
    updateWidgetProgress,
    updateWidgetStats,
    syncWidgetData,
    getWidgetData,
  };
};
