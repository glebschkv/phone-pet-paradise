/**
 * useWidgetSync Hook
 *
 * Bridges the React app state to native iOS widgets via widgetDataService.
 * Handles:
 * - Initial data load + full sync on mount
 * - App foreground re-sync (Capacitor appStateChange)
 * - Convenience methods for syncing individual data sections
 */

import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { widgetDataService, type WidgetData } from '@/plugins/widget-data';
import { widgetLogger } from '@/lib/logger';

export const useWidgetSync = () => {
  const initializedRef = useRef(false);

  // One-time init: load persisted widget data, then reconcile with current app state
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    widgetDataService
      .load()
      .then(() => widgetDataService.syncFromAppState())
      .catch((err) => {
        widgetLogger.error('Widget init failed:', err);
      });
  }, []);

  // Re-sync every time the app returns to the foreground (iOS multitasking)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => Promise<void> } | null = null;

    CapApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        widgetDataService.syncFromAppState().catch((err) => {
          widgetLogger.error('Foreground sync failed:', err);
        });
      }
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  const syncTimer = useCallback(
    (data: Partial<WidgetData['timer']>) => {
      widgetDataService.updateTimer(data).catch((err) => {
        widgetLogger.error('Timer sync failed:', err);
      });
    },
    [],
  );

  const syncStreak = useCallback(
    (data: Partial<WidgetData['streak']>) => {
      widgetDataService.updateStreak(data).catch((err) => {
        widgetLogger.error('Streak sync failed:', err);
      });
    },
    [],
  );

  const syncDailyProgress = useCallback(
    (data: Partial<WidgetData['dailyProgress']>) => {
      widgetDataService.updateDailyProgress(data).catch((err) => {
        widgetLogger.error('Progress sync failed:', err);
      });
    },
    [],
  );

  const syncStats = useCallback(
    (data: Partial<WidgetData['stats']>) => {
      widgetDataService.updateStats(data).catch((err) => {
        widgetLogger.error('Stats sync failed:', err);
      });
    },
    [],
  );

  const syncPetInfo = useCallback(
    (data: Partial<WidgetData['petInfo']>) => {
      widgetDataService.updatePetInfo(data).catch((err) => {
        widgetLogger.error('Pet info sync failed:', err);
      });
    },
    [],
  );

  const syncAll = useCallback(() => {
    widgetDataService.syncFromAppState().catch((err) => {
      widgetLogger.error('Full sync failed:', err);
    });
  }, []);

  return { syncTimer, syncStreak, syncDailyProgress, syncStats, syncPetInfo, syncAll };
};
