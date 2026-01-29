import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceActivity } from '@/plugins/device-activity';
import type { BlockingStatus, StartBlockingResult, StopBlockingResult } from '@/plugins/device-activity/definitions';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { deviceActivityLogger } from '@/lib/logger';
import { reportError } from '@/lib/errorReporting';

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

  // Plugin health
  pluginAvailable: boolean;
  pluginError: Error | null;
}

/**
 * Safe wrapper for plugin calls with fallback and error reporting
 */
async function safePluginCall<T>(
  pluginCall: () => Promise<T>,
  fallback: T,
  errorContext: string
): Promise<{ result: T; success: boolean }> {
  try {
    const result = await pluginCall();
    return { result, success: true };
  } catch (error) {
    deviceActivityLogger.error(`[${errorContext}] Plugin call failed:`, error);
    if (error instanceof Error) {
      reportError(error, { context: errorContext, plugin: 'DeviceActivity' });
    }
    return { result: fallback, success: false };
  }
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
    pluginAvailable: true,
    pluginError: null,
  });

  // Track plugin initialization errors
  const pluginErrorRef = useRef<Error | null>(null);

  // Track initialization retries
  const initRetryCountRef = useRef(0);
  const MAX_INIT_RETRIES = 3;

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

  // Initialize device activity monitoring (with automatic retry on failure)
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // First, verify the native plugin bridge is working with a simple echo call
      const { result: echoResult, success: echoSuccess } = await safePluginCall(
        () => DeviceActivity.echo(),
        { pluginLoaded: false, platform: 'unknown', timestamp: 0 },
        'echo'
      );

      if (echoSuccess) {
        deviceActivityLogger.debug(`Plugin bridge OK: platform=${echoResult.platform}, loaded=${echoResult.pluginLoaded}`);
        // Log entitlement diagnostic info
        const diag = echoResult as Record<string, unknown>;
        if (diag.familyControlsEntitlementInProfile !== undefined) {
          deviceActivityLogger.info(
            `[DIAG] Family Controls entitlement in provisioning profile: ${diag.familyControlsEntitlementInProfile ? 'YES' : 'NO ❌'}`
          );
          deviceActivityLogger.info(
            `[DIAG] Initial auth status: ${diag.initialAuthStatus}, Bundle ID: ${diag.bundleId}`
          );
          if (!diag.familyControlsEntitlementInProfile) {
            deviceActivityLogger.error(
              '[DIAG] Family Controls entitlement is MISSING from provisioning profile! ' +
              'Screen Time permissions will always fail. Fix: In Xcode, toggle "Automatically manage signing" off then on, ' +
              'or manually create a profile in the Apple Developer Portal.'
            );
          }
        }
      } else {
        deviceActivityLogger.warn('Plugin echo failed - native bridge may not be available');
      }

      // Check permissions with safe wrapper.
      // Even if this fails, we DON'T mark the plugin as unavailable -
      // we treat permissions as "not determined" and let the user try requesting.
      const { result: permissions, success: permissionSuccess } = await safePluginCall(
        () => DeviceActivity.checkPermissions(),
        { status: 'notDetermined' as const, familyControlsEnabled: false },
        'checkPermissions'
      );

      if (!permissionSuccess) {
        // Retry before giving up
        if (initRetryCountRef.current < MAX_INIT_RETRIES) {
          initRetryCountRef.current += 1;
          const retryDelay = Math.pow(2, initRetryCountRef.current) * 1000; // 2s, 4s, 8s
          deviceActivityLogger.debug(
            `DeviceActivity init failed, scheduling retry ${initRetryCountRef.current}/${MAX_INIT_RETRIES} in ${retryDelay}ms`
          );
          setState(prev => ({ ...prev, isLoading: false }));
          setTimeout(() => { initialize(); }, retryDelay);
          return;
        }
        // All retries exhausted — still keep plugin available so user can try requesting permissions
        deviceActivityLogger.warn('checkPermissions failed - treating as notDetermined, user can still request permissions');
      }

      // Plugin responded — reset retry counter
      initRetryCountRef.current = 0;

      const isGranted = permissions.status === 'granted';

      // Get blocking status with safe wrapper
      const { result: blockingStatus } = await safePluginCall(
        () => DeviceActivity.getBlockingStatus(),
        {
          isBlocking: false,
          focusSessionActive: false,
          shieldAttempts: 0,
          lastShieldAttemptTimestamp: 0,
          hasAppsConfigured: false,
        } as BlockingStatus,
        'getBlockingStatus'
      );

      setState(prev => ({
        ...prev,
        isPermissionGranted: isGranted,
        isBlocking: blockingStatus.isBlocking,
        hasAppsConfigured: blockingStatus.hasAppsConfigured,
        shieldAttempts: blockingStatus.shieldAttempts,
        lastShieldAttemptTimestamp: blockingStatus.lastShieldAttemptTimestamp,
        pluginAvailable: true,
        pluginError: null,
      }));

      if (isGranted) {
        // Start monitoring if permissions granted
        const { result: monitoring } = await safePluginCall(
          () => DeviceActivity.startMonitoring(),
          { success: false, monitoring: false, startTime: 0 },
          'startMonitoring'
        );
        setState(prev => ({
          ...prev,
          isMonitoring: monitoring.monitoring
        }));
      }
    } catch (error) {
      deviceActivityLogger.error('Failed to initialize device activity:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      pluginErrorRef.current = err;
      reportError(err, { context: 'DeviceActivity.initialize' });
      // Even on error, keep plugin available so user can retry
      setState(prev => ({
        ...prev,
        pluginAvailable: true,
        pluginError: err,
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Open device Settings (for re-enabling denied permissions)
  const openSettings = useCallback(async () => {
    await safePluginCall(
      () => DeviceActivity.openSettings(),
      { success: false },
      'openSettings'
    );
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Attempt to request permissions — the native side now returns
      // detailed status including rawStatus and any error from Apple's API.
      const { result: requestResult } = await safePluginCall(
        () => DeviceActivity.requestPermissions(),
        { status: 'denied' as const, familyControlsEnabled: false },
        'requestPermissions'
      );

      // Also check via checkPermissions for consistency
      const { result: currentStatus } = await safePluginCall(
        () => DeviceActivity.checkPermissions(),
        { status: 'denied' as const, familyControlsEnabled: false },
        'checkPermissions-afterRequest'
      );

      const isGranted = currentStatus.status === 'granted';
      const rawStatus = requestResult.rawStatus || currentStatus.status;
      const lastError = requestResult.lastError;

      deviceActivityLogger.info(
        `Permission result: status=${currentStatus.status}, rawStatus=${rawStatus}, lastError=${lastError || 'none'}`
      );

      setState(prev => ({
        ...prev,
        isPermissionGranted: isGranted
      }));

      if (isGranted) {
        // Start monitoring after permissions granted
        const { result: monitoring } = await safePluginCall(
          () => DeviceActivity.startMonitoring(),
          { success: false, monitoring: false, startTime: 0 },
          'startMonitoring'
        );
        setState(prev => ({
          ...prev,
          isMonitoring: monitoring.monitoring
        }));

        toast({
          title: "Screen Time Access Granted",
          description: "You can now block distracting apps during focus sessions!",
        });
      } else if (currentStatus.status === 'notDetermined') {
        // Status is still notDetermined after request — the authorization
        // dialog likely never appeared. This usually means the Family Controls
        // entitlement is missing from the provisioning profile.
        const errorDetail = lastError ? ` (${lastError})` : '';
        toast({
          title: "Permission Not Available",
          description: `Screen Time permission dialog did not appear${errorDetail}. Try deleting and reinstalling the app, or check that Family Controls is enabled in Xcode.`,
          variant: "destructive",
        });
      } else {
        // Status is "denied" — user explicitly denied, or system blocked it.
        // They need to go to Settings to re-enable.
        const errorDetail = lastError ? ` Error: ${lastError}` : '';
        toast({
          title: "Permission Denied",
          description: `Screen Time access was denied. Tap "Open Settings" below to enable it for this app.${errorDetail}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      deviceActivityLogger.error('Permission request failed:', error);
      if (error instanceof Error) {
        reportError(error, { context: 'DeviceActivity.requestPermissions' });
      }
      toast({
        title: "Permission Error",
        description: "Failed to request Screen Time permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Start app blocking (called when timer starts)
  const startAppBlocking = useCallback(async (): Promise<StartBlockingResult> => {
    const fallbackResult: StartBlockingResult = {
      success: false,
      appsBlocked: 0,
      categoriesBlocked: 0,
      domainsBlocked: 0,
      note: 'Plugin unavailable'
    };

    // Check if plugin is available
    if (!state.pluginAvailable) {
      deviceActivityLogger.warn('startAppBlocking called but plugin is unavailable');
      return fallbackResult;
    }

    const { result, success } = await safePluginCall(
      () => DeviceActivity.startAppBlocking(),
      { ...fallbackResult, note: 'Failed to start blocking' },
      'startAppBlocking'
    );

    if (!success) {
      return result;
    }

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
  }, [toast, state.pluginAvailable]);

  // Stop app blocking (called when timer ends)
  const stopAppBlocking = useCallback(async (): Promise<StopBlockingResult> => {
    const fallbackResult: StopBlockingResult = {
      success: false,
      shieldAttempts: 0
    };

    // Check if plugin is available
    if (!state.pluginAvailable) {
      deviceActivityLogger.warn('stopAppBlocking called but plugin is unavailable');
      return fallbackResult;
    }

    const { result, success } = await safePluginCall(
      () => DeviceActivity.stopAppBlocking(),
      fallbackResult,
      'stopAppBlocking'
    );

    if (!success) {
      return result;
    }

    setState(prev => ({
      ...prev,
      isBlocking: false,
      shieldAttempts: result.shieldAttempts,
    }));

    return result;
  }, [state.pluginAvailable]);

  // Get current blocking status
  const getBlockingStatus = useCallback(async (): Promise<BlockingStatus> => {
    const fallbackStatus: BlockingStatus = {
      isBlocking: false,
      focusSessionActive: false,
      shieldAttempts: 0,
      lastShieldAttemptTimestamp: 0,
      hasAppsConfigured: false,
    };

    if (!state.pluginAvailable) {
      return fallbackStatus;
    }

    const { result: status, success } = await safePluginCall(
      () => DeviceActivity.getBlockingStatus(),
      fallbackStatus,
      'getBlockingStatus'
    );

    if (!success) {
      return status;
    }

    setState(prev => ({
      ...prev,
      isBlocking: status.isBlocking,
      hasAppsConfigured: status.hasAppsConfigured,
      shieldAttempts: status.shieldAttempts,
      lastShieldAttemptTimestamp: status.lastShieldAttemptTimestamp,
    }));

    return status;
  }, [state.pluginAvailable]);

  // Get shield attempts (for rewards calculation)
  const getShieldAttempts = useCallback(async (): Promise<number> => {
    if (!state.pluginAvailable) {
      return 0;
    }

    const { result, success } = await safePluginCall(
      () => DeviceActivity.getShieldAttempts(),
      { attempts: 0, lastAttemptTimestamp: 0 },
      'getShieldAttempts'
    );

    if (!success) {
      return 0;
    }

    setState(prev => ({
      ...prev,
      shieldAttempts: result.attempts,
      lastShieldAttemptTimestamp: result.lastAttemptTimestamp,
    }));
    return result.attempts;
  }, [state.pluginAvailable]);

  // Reset shield attempts
  const resetShieldAttempts = useCallback(async () => {
    if (!state.pluginAvailable) {
      return;
    }

    const { success } = await safePluginCall(
      () => DeviceActivity.resetShieldAttempts(),
      undefined,
      'resetShieldAttempts'
    );

    if (success) {
      setState(prev => ({
        ...prev,
        shieldAttempts: 0,
        lastShieldAttemptTimestamp: 0,
      }));
    }
  }, [state.pluginAvailable]);

  // Open native app picker (iOS only)
  const openAppPicker = useCallback(async () => {
    if (!state.pluginAvailable) {
      deviceActivityLogger.warn('openAppPicker called but plugin is unavailable');
      return;
    }

    const { result, success } = await safePluginCall(
      () => DeviceActivity.openAppPicker(),
      { success: false },
      'openAppPicker'
    );

    if (success && result?.success) {
      deviceActivityLogger.info(
        `App picker done: ${result.appsSelected ?? 0} apps, ${result.categoriesSelected ?? 0} categories`
      );
      // Refresh blocking status after selection change
      const { result: status } = await safePluginCall(
        () => DeviceActivity.getBlockingStatus(),
        {
          isBlocking: false,
          focusSessionActive: false,
          shieldAttempts: 0,
          lastShieldAttemptTimestamp: 0,
          hasAppsConfigured: false,
        } as BlockingStatus,
        'getBlockingStatus-afterPicker'
      );
      setState(prev => ({
        ...prev,
        hasAppsConfigured: status.hasAppsConfigured || (result.hasSelection ?? false),
      }));
    } else if (result?.cancelled) {
      deviceActivityLogger.info('App picker cancelled by user');
    }
  }, [state.pluginAvailable]);

  // Update simulated app selection (for web)
  const updateSimulatedApps = useCallback((apps: SimulatedBlockedApp[]) => {
    setSimulatedApps(apps);
    localStorage.setItem(SELECTED_APPS_KEY, JSON.stringify(apps));

    // Also update native if on iOS (fire and forget with safe call)
    if (state.pluginAvailable) {
      safePluginCall(
        () => DeviceActivity.setSelectedApps({ selection: JSON.stringify(apps) }),
        undefined,
        'setSelectedApps'
      );
    }

    setState(prev => ({
      ...prev,
      hasAppsConfigured: apps.some(app => app.isBlocked),
    }));
  }, [state.pluginAvailable]);

  // Toggle app blocked status
  const toggleAppBlocked = useCallback((appId: string, blocked: boolean) => {
    const updatedApps = simulatedApps.map(app =>
      app.id === appId ? { ...app, isBlocked: blocked } : app
    );
    updateSimulatedApps(updatedApps);
  }, [simulatedApps, updateSimulatedApps]);

  // Clear all selected apps
  const clearSelectedApps = useCallback(async () => {
    // Update local state regardless of plugin availability
    const resetApps = simulatedApps.map(app => ({ ...app, isBlocked: false }));
    setSimulatedApps(resetApps);
    localStorage.setItem(SELECTED_APPS_KEY, JSON.stringify(resetApps));

    setState(prev => ({
      ...prev,
      hasAppsConfigured: false,
      isBlocking: false,
    }));

    // Try to clear on native if plugin is available
    if (state.pluginAvailable) {
      await safePluginCall(
        () => DeviceActivity.clearSelectedApps(),
        undefined,
        'clearSelectedApps'
      );
    }
  }, [simulatedApps, state.pluginAvailable]);

  // Get current usage data
  const getUsageData = useCallback(async () => {
    if (!state.pluginAvailable) {
      return null;
    }

    const { result: data, success } = await safePluginCall(
      () => DeviceActivity.getUsageData(),
      null,
      'getUsageData'
    );

    if (!success || !data) {
      return null;
    }

    setState(prev => ({
      ...prev,
      timeAwayMinutes: data.timeAwayMinutes,
      lastActiveTime: data.lastActiveTime,
      isMonitoring: data.isMonitoring,
      shieldAttempts: data.shieldAttempts,
    }));
    return data;
  }, [state.pluginAvailable]);

  // Record active time
  const recordActiveTime = useCallback(async () => {
    if (!state.pluginAvailable) {
      // Just update local state when plugin unavailable
      setState(prev => ({ ...prev, lastActiveTime: Date.now() }));
      return;
    }

    const { success } = await safePluginCall(
      () => DeviceActivity.recordActiveTime(),
      undefined,
      'recordActiveTime'
    );

    if (success) {
      setState(prev => ({ ...prev, lastActiveTime: Date.now() }));
    }
  }, [state.pluginAvailable]);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(async (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
    if (!state.pluginAvailable) {
      return;
    }

    // Fire and forget - haptic feedback is non-critical
    await safePluginCall(
      () => DeviceActivity.triggerHapticFeedback({ style }),
      undefined,
      'triggerHapticFeedback'
    );
  }, [state.pluginAvailable]);

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
    openSettings,
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
