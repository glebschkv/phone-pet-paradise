import { useState, useEffect, useCallback } from 'react';
import { DeviceActivity } from '@/plugins/device-activity';
import type { BlockingStatus, StartBlockingResult, StopBlockingResult } from '@/plugins/device-activity/definitions';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { deviceActivityLogger } from '@/lib/logger';

interface DeviceActivityState {
  // Permission state
  isPermissionGranted: boolean;
  isMonitoring: boolean;
  timeAwayMinutes: number;
  lastActiveTime: number;
  isLoading: boolean;

  // App blocking state
  isBlocking: boolean;
  hasAppsConfigured: boolean;
  shieldAttempts: number;
  lastShieldAttemptTimestamp: number;
}

interface AppLifecycleEvent {
  state: 'active' | 'background' | 'foreground' | 'terminated';
  timestamp: number;
  timeAwayMinutes?: number;
  lastActiveTime?: number;
  shieldAttempts?: number;
}

// Storage key for selected apps (web simulation)
const SELECTED_APPS_KEY = 'nomoPhone_selectedApps';

// Default app selection for web simulation
export interface SimulatedBlockedApp {
  id: string;
  name: string;
  icon: string;
  isBlocked: boolean;
}

export const DEFAULT_BLOCKED_APPS: SimulatedBlockedApp[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', isBlocked: true },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', isBlocked: true },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', isBlocked: true },
  { id: 'facebook', name: 'Facebook', icon: '👥', isBlocked: true },
  { id: 'youtube', name: 'YouTube', icon: '▶️', isBlocked: false },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', isBlocked: false },
  { id: 'reddit', name: 'Reddit', icon: '🤖', isBlocked: false },
  { id: 'discord', name: 'Discord', icon: '💬', isBlocked: false },
];

export const useDeviceActivity = () => {
  const [state, setState] = useState<DeviceActivityState>({
    isPermissionGranted: false,
    isMonitoring: false,
    timeAwayMinutes: 0,
    lastActiveTime: Date.now(),
    isLoading: true,
    isBlocking: false,
    hasAppsConfigured: false,
    shieldAttempts: 0,
    lastShieldAttemptTimestamp: 0,
  });

  // Web simulation state for app selection
  const [simulatedApps, setSimulatedApps] = useState<SimulatedBlockedApp[]>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_APPS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_BLOCKED_APPS;
  });

  const { toast } = useToast();

  // Check if we're on native platform
  const isNative = Capacitor.isNativePlatform();

  // Initialize device activity monitoring
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Check permissions
      const permissions = await DeviceActivity.checkPermissions();
      const isGranted = permissions.status === 'granted';

      // Get blocking status
      const blockingStatus = await DeviceActivity.getBlockingStatus();

      setState(prev => ({
        ...prev,
        isPermissionGranted: isGranted,
        isBlocking: blockingStatus.isBlocking,
        hasAppsConfigured: blockingStatus.hasAppsConfigured,
        shieldAttempts: blockingStatus.shieldAttempts,
        lastShieldAttemptTimestamp: blockingStatus.lastShieldAttemptTimestamp,
      }));

      if (isGranted) {
        // Start monitoring if permissions granted
        const monitoring = await DeviceActivity.startMonitoring();
        setState(prev => ({
          ...prev,
          isMonitoring: monitoring.monitoring
        }));
      }
    } catch (error) {
      deviceActivityLogger.error('Failed to initialize device activity:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const result = await DeviceActivity.requestPermissions();
      const isGranted = result.status === 'granted';

      setState(prev => ({
        ...prev,
        isPermissionGranted: isGranted
      }));

      if (isGranted) {
        // Start monitoring after permissions granted
        const monitoring = await DeviceActivity.startMonitoring();
        setState(prev => ({
          ...prev,
          isMonitoring: monitoring.monitoring
        }));

        toast({
          title: "Screen Time Access Granted",
          description: "You can now block distracting apps during focus sessions!",
        });
      } else {
        toast({
          title: "Permissions Denied",
          description: "App blocking requires Screen Time permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      deviceActivityLogger.error('Permission request failed:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request Screen Time permissions",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Start app blocking (called when timer starts)
  const startAppBlocking = useCallback(async (): Promise<StartBlockingResult> => {
    try {
      const result = await DeviceActivity.startAppBlocking();

      setState(prev => ({
        ...prev,
        isBlocking: true,
        shieldAttempts: 0,
      }));

      if (result.appsBlocked > 0 || result.categoriesBlocked > 0) {
        toast({
          title: "Focus Mode Active",
          description: `Blocking ${result.appsBlocked} apps and ${result.categoriesBlocked} categories`,
        });
      }

      return result;
    } catch (error) {
      deviceActivityLogger.error('Failed to start app blocking:', error);
      return {
        success: false,
        appsBlocked: 0,
        categoriesBlocked: 0,
        domainsBlocked: 0,
        note: 'Failed to start blocking'
      };
    }
  }, [toast]);

  // Stop app blocking (called when timer ends)
  const stopAppBlocking = useCallback(async (): Promise<StopBlockingResult> => {
    try {
      const result = await DeviceActivity.stopAppBlocking();

      setState(prev => ({
        ...prev,
        isBlocking: false,
        shieldAttempts: result.shieldAttempts,
      }));

      return result;
    } catch (error) {
      deviceActivityLogger.error('Failed to stop app blocking:', error);
      return {
        success: false,
        shieldAttempts: 0
      };
    }
  }, []);

  // Get current blocking status
  const getBlockingStatus = useCallback(async (): Promise<BlockingStatus> => {
    try {
      const status = await DeviceActivity.getBlockingStatus();

      setState(prev => ({
        ...prev,
        isBlocking: status.isBlocking,
        hasAppsConfigured: status.hasAppsConfigured,
        shieldAttempts: status.shieldAttempts,
        lastShieldAttemptTimestamp: status.lastShieldAttemptTimestamp,
      }));

      return status;
    } catch (error) {
      deviceActivityLogger.error('Failed to get blocking status:', error);
      return {
        isBlocking: false,
        focusSessionActive: false,
        shieldAttempts: 0,
        lastShieldAttemptTimestamp: 0,
        hasAppsConfigured: false,
      };
    }
  }, []);

  // Get shield attempts (for rewards calculation)
  const getShieldAttempts = useCallback(async (): Promise<number> => {
    try {
      const result = await DeviceActivity.getShieldAttempts();
      setState(prev => ({
        ...prev,
        shieldAttempts: result.attempts,
        lastShieldAttemptTimestamp: result.lastAttemptTimestamp,
      }));
      return result.attempts;
    } catch (error) {
      deviceActivityLogger.error('Failed to get shield attempts:', error);
      return 0;
    }
  }, []);

  // Reset shield attempts
  const resetShieldAttempts = useCallback(async () => {
    try {
      await DeviceActivity.resetShieldAttempts();
      setState(prev => ({
        ...prev,
        shieldAttempts: 0,
        lastShieldAttemptTimestamp: 0,
      }));
    } catch (error) {
      deviceActivityLogger.error('Failed to reset shield attempts:', error);
    }
  }, []);

  // Open native app picker (iOS only)
  const openAppPicker = useCallback(async () => {
    try {
      await DeviceActivity.openAppPicker();
    } catch (error) {
      deviceActivityLogger.error('Failed to open app picker:', error);
    }
  }, []);

  // Update simulated app selection (for web)
  const updateSimulatedApps = useCallback((apps: SimulatedBlockedApp[]) => {
    setSimulatedApps(apps);
    localStorage.setItem(SELECTED_APPS_KEY, JSON.stringify(apps));

    // Also update native if on iOS
    DeviceActivity.setSelectedApps({ selection: JSON.stringify(apps) });

    setState(prev => ({
      ...prev,
      hasAppsConfigured: apps.some(app => app.isBlocked),
    }));
  }, []);

  // Toggle app blocked status
  const toggleAppBlocked = useCallback((appId: string, blocked: boolean) => {
    const updatedApps = simulatedApps.map(app =>
      app.id === appId ? { ...app, isBlocked: blocked } : app
    );
    updateSimulatedApps(updatedApps);
  }, [simulatedApps, updateSimulatedApps]);

  // Clear all selected apps
  const clearSelectedApps = useCallback(async () => {
    try {
      await DeviceActivity.clearSelectedApps();
      const resetApps = simulatedApps.map(app => ({ ...app, isBlocked: false }));
      setSimulatedApps(resetApps);
      localStorage.setItem(SELECTED_APPS_KEY, JSON.stringify(resetApps));

      setState(prev => ({
        ...prev,
        hasAppsConfigured: false,
        isBlocking: false,
      }));
    } catch (error) {
      deviceActivityLogger.error('Failed to clear selected apps:', error);
    }
  }, [simulatedApps]);

  // Get current usage data
  const getUsageData = useCallback(async () => {
    try {
      const data = await DeviceActivity.getUsageData();
      setState(prev => ({
        ...prev,
        timeAwayMinutes: data.timeAwayMinutes,
        lastActiveTime: data.lastActiveTime,
        isMonitoring: data.isMonitoring,
        shieldAttempts: data.shieldAttempts,
      }));
      return data;
    } catch (error) {
      deviceActivityLogger.error('Failed to get usage data:', error);
      return null;
    }
  }, []);

  // Record active time
  const recordActiveTime = useCallback(async () => {
    try {
      await DeviceActivity.recordActiveTime();
      setState(prev => ({ ...prev, lastActiveTime: Date.now() }));
    } catch (error) {
      deviceActivityLogger.error('Failed to record active time:', error);
    }
  }, []);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(async (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
    try {
      await DeviceActivity.triggerHapticFeedback({ style });
    } catch (error) {
      deviceActivityLogger.error('Haptic feedback failed:', error);
    }
  }, []);

  // Handle app lifecycle events
  useEffect(() => {
    const handleAppLifecycle = (event: CustomEvent<AppLifecycleEvent>) => {
      const { state: appState, timeAwayMinutes, timestamp, shieldAttempts: attempts } = event.detail;

      deviceActivityLogger.debug('App lifecycle change:', appState, timeAwayMinutes);

      setState(prev => ({
        ...prev,
        timeAwayMinutes: timeAwayMinutes || prev.timeAwayMinutes,
        lastActiveTime: timestamp,
        shieldAttempts: attempts ?? prev.shieldAttempts,
      }));

      // Trigger haptic feedback for certain events
      if (appState === 'active' && timeAwayMinutes && timeAwayMinutes > 5) {
        triggerHaptic('success');
      }
    };

    // Listen for app lifecycle events from native
    window.addEventListener('appLifecycleChange', handleAppLifecycle as EventListener);

    return () => {
      window.removeEventListener('appLifecycleChange', handleAppLifecycle as EventListener);
    };
  }, [triggerHaptic]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Periodic usage data refresh
  useEffect(() => {
    if (state.isMonitoring) {
      const interval = setInterval(getUsageData, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.isMonitoring, getUsageData]);

  // Count blocked apps
  const blockedAppsCount = simulatedApps.filter(app => app.isBlocked).length;

  return {
    // State
    ...state,
    isNative,
    simulatedApps,
    blockedAppsCount,

    // Permission methods
    requestPermissions,
    initialize,

    // App blocking methods
    startAppBlocking,
    stopAppBlocking,
    getBlockingStatus,
    getShieldAttempts,
    resetShieldAttempts,

    // App selection methods
    openAppPicker,
    updateSimulatedApps,
    toggleAppBlocked,
    clearSelectedApps,

    // Monitoring methods
    getUsageData,
    recordActiveTime,
    triggerHaptic,
  };
};
