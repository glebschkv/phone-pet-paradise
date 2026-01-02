import { useEffect, useCallback, useState, useRef } from 'react';
import { widgetDataService, WidgetData } from '@/plugins/widget-data';
import { Capacitor } from '@capacitor/core';
import { createLogger } from '@/lib/logger';
import { reportError } from '@/lib/errorReporting';

const logger = createLogger({ prefix: 'WidgetSync' });

/**
 * Safe wrapper for widget data calls
 */
async function safeWidgetCall<T>(
  call: () => Promise<T> | T,
  fallback: T,
  errorContext: string
): Promise<{ result: T; success: boolean }> {
  try {
    const result = await call();
    return { result, success: true };
  } catch (error) {
    logger.error(`[${errorContext}] Widget call failed:`, error);
    if (error instanceof Error) {
      reportError(error, { context: errorContext, plugin: 'WidgetData' });
    }
    return { result: fallback, success: false };
  }
}

/**
 * Hook to sync app state with widget data
 *
 * Use this hook in the main App component to keep widget data up to date.
 */
export const useWidgetSync = () => {
  const [pluginAvailable, setPluginAvailable] = useState(true);
  const [pluginError, setPluginError] = useState<Error | null>(null);
  const isNative = Capacitor.isNativePlatform();
  const initRef = useRef(false);

  // Initial sync on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initSync = async () => {
      const { success } = await safeWidgetCall(
        () => widgetDataService.syncFromAppState(),
        undefined,
        'syncFromAppState'
      );

      if (!success && isNative) {
        const err = new Error('Widget data sync failed');
        setPluginAvailable(false);
        setPluginError(err);
      }
    };

    initSync();
  }, [isNative]);

  // Update timer data
  const updateWidgetTimer = useCallback(
    async (timerData: Partial<WidgetData['timer']>) => {
      if (!pluginAvailable && isNative) {
        logger.debug('Skipping timer update - plugin unavailable');
        return;
      }
      await safeWidgetCall(
        () => widgetDataService.updateTimer(timerData),
        undefined,
        'updateTimer'
      );
    },
    [pluginAvailable, isNative]
  );

  // Update streak data
  const updateWidgetStreak = useCallback(
    async (streakData: Partial<WidgetData['streak']>) => {
      if (!pluginAvailable && isNative) {
        logger.debug('Skipping streak update - plugin unavailable');
        return;
      }
      await safeWidgetCall(
        () => widgetDataService.updateStreak(streakData),
        undefined,
        'updateStreak'
      );
    },
    [pluginAvailable, isNative]
  );

  // Update daily progress
  const updateWidgetProgress = useCallback(
    async (progressData: Partial<WidgetData['dailyProgress']>) => {
      if (!pluginAvailable && isNative) {
        logger.debug('Skipping progress update - plugin unavailable');
        return;
      }
      await safeWidgetCall(
        () => widgetDataService.updateDailyProgress(progressData),
        undefined,
        'updateDailyProgress'
      );
    },
    [pluginAvailable, isNative]
  );

  // Update stats
  const updateWidgetStats = useCallback(
    async (statsData: Partial<WidgetData['stats']>) => {
      if (!pluginAvailable && isNative) {
        logger.debug('Skipping stats update - plugin unavailable');
        return;
      }
      await safeWidgetCall(
        () => widgetDataService.updateStats(statsData),
        undefined,
        'updateStats'
      );
    },
    [pluginAvailable, isNative]
  );

  // Full sync
  const syncWidgetData = useCallback(async () => {
    if (!pluginAvailable && isNative) {
      logger.debug('Skipping full sync - plugin unavailable');
      return;
    }
    await safeWidgetCall(
      () => widgetDataService.syncFromAppState(),
      undefined,
      'syncFromAppState'
    );
  }, [pluginAvailable, isNative]);

  // Get current data
  const getWidgetData = useCallback(() => {
    return widgetDataService.getData();
  }, []);

  return {
    // State
    pluginAvailable,
    pluginError,
    isNative,

    // Update methods
    updateWidgetTimer,
    updateWidgetStreak,
    updateWidgetProgress,
    updateWidgetStats,
    syncWidgetData,
    getWidgetData,
  };
};
