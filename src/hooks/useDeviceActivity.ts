import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceActivity } from '@/plugins/device-activity';
import type { BlockingStatus, StartBlockingResult, StopBlockingResult } from '@/plugins/device-activity/definitions';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
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
  selectedAppsCount: number;
  selectedCategoriesCount: number;

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
    const errMsg = error instanceof Error ? error.message : String(error);
    // "not implemented" is expected on simulator / when plugin isn't loaded — don't spam errors
    if (errMsg.includes('not implemented') || errMsg.includes('not available') || errMsg.includes('Plugin not installed')) {
      deviceActivityLogger.debug(`[${errorContext}] Plugin not available on this platform`);
    } else {
      deviceActivityLogger.error(`[${errorContext}] Plugin call failed:`, error);
      if (error instanceof Error) {
        reportError(error, { context: errorContext, plugin: 'DeviceActivity' });
      }
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

// Module-level guard: ensures native initialization only runs once
// even when multiple components mount useDeviceActivity simultaneously.
// Call _invalidateInitCache() when state changes significantly (e.g. permissions granted).
let _nativeInitStarted = false;
let _nativeInitResult: DeviceActivityState | null = null;
let _nativeInitPromise: Promise<DeviceActivityState> | null = null;

function _invalidateInitCache() {
  _nativeInitResult = null;
  _nativeInitStarted = false;
  _nativeInitPromise = null;
}

export const useDeviceActivity = () => {
  const [state, setState] = useState<DeviceActivityState>(() => {
    // If we already have a cached init result, use it immediately
    if (_nativeInitResult) {
      return { ..._nativeInitResult, isLoading: false };
    }
    return {
      isPermissionGranted: false,
      isMonitoring: false,
      timeAwayMinutes: 0,
      lastActiveTime: Date.now(),
      isLoading: true,
      isBlocking: false,
      hasAppsConfigured: false,
      shieldAttempts: 0,
      lastShieldAttemptTimestamp: 0,
      selectedAppsCount: 0,
      selectedCategoriesCount: 0,
      pluginAvailable: true,
      pluginError: null,
    };
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

  // Check if we're on native platform
  const isNative = Capacitor.isNativePlatform();

  // Core native initialization logic (called only once across all hook instances)
  const _doNativeInit = useCallback(async () => {
    try {
      // Verify the native plugin bridge is working — bail immediately if not available
      try {
        const echoResult = await DeviceActivity.echo();
        deviceActivityLogger.debug(`Plugin bridge OK: platform=${echoResult.platform}, loaded=${echoResult.pluginLoaded}`);

        // CRITICAL: If running on native iOS but echo responded from the web fallback,
        // the native plugin isn't loaded (missing from capacitor.config.json packageClassList).
        // The web fallback returns fake success for ALL calls — startAppBlocking returns
        // { success: true, appsBlocked: 1 } without actually blocking anything.
        // Detect this and bail so callers know the plugin is genuinely unavailable.
        if (Capacitor.isNativePlatform() && echoResult.platform === 'web') {
          deviceActivityLogger.warn(
            'Native platform detected but DeviceActivity responded from web fallback — ' +
            'native plugin not loaded. Run "npm run ios" to rebuild with the config patch.'
          );
          setState(prev => ({ ...prev, pluginAvailable: false }));
          return;
        }

        // Log entitlement diagnostic info
        const diag = echoResult as Record<string, unknown>;
        if (diag.familyControlsEntitlementInProfile !== undefined) {
          deviceActivityLogger.info(
            `[DIAG] Family Controls entitlement: ${diag.familyControlsEntitlementInProfile ? 'YES' : 'NO ❌'}`
          );
          deviceActivityLogger.info(
            `[DIAG] Initial auth status: ${diag.initialAuthStatus}, Bundle ID: ${diag.bundleId}`
          );
        }
      } catch (echoError) {
        const errMsg = echoError instanceof Error ? echoError.message : String(echoError);
        if (errMsg.includes('not implemented') || errMsg.includes('not available') || errMsg.includes('Plugin not installed')) {
          // Plugin is not available (simulator, missing entitlement, etc.)
          // Bail immediately — no point calling checkPermissions, requestPermissions, etc.
          deviceActivityLogger.debug('DeviceActivity plugin not available on this platform — skipping all native calls');
          setState(prev => ({ ...prev, pluginAvailable: false }));
          return;
        }
        // Non-fatal error — continue with degraded functionality
        deviceActivityLogger.warn('Plugin echo failed with unexpected error:', errMsg);
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
          selectedAppsCount: 0,
          selectedCategoriesCount: 0,
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
        selectedAppsCount: blockingStatus.selectedAppsCount,
        selectedCategoriesCount: blockingStatus.selectedCategoriesCount,
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
      setState(prev => {
        // Cache the final state so subsequent hook mounts get it immediately
        const finalState = { ...prev, isLoading: false };
        _nativeInitResult = finalState;
        return finalState;
      });
    }
  }, []);

  // Dedup wrapper: ensures native init runs only once across all hook instances
  const initialize = useCallback(async () => {
    if (_nativeInitResult) {
      // Already initialized — just apply cached state
      setState(prev => ({ ...prev, ..._nativeInitResult, isLoading: false }));
      return;
    }
    if (_nativeInitStarted && _nativeInitPromise) {
      // Another instance is already initializing — wait for it
      const result = await _nativeInitPromise;
      setState({ ...result, isLoading: false });
      return;
    }
    // First caller — run the actual init
    _nativeInitStarted = true;
    setState(prev => ({ ...prev, isLoading: true }));
    _nativeInitPromise = _doNativeInit().then(() => {
      return _nativeInitResult!;
    });
    await _nativeInitPromise;
  }, [_doNativeInit]);

  // Open device Settings (for re-enabling denied permissions)
  const openSettings = useCallback(async () => {
    if (_nativeInitResult && !_nativeInitResult.pluginAvailable) return;
    await safePluginCall(
      () => DeviceActivity.openSettings(),
      { success: false },
      'openSettings'
    );
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    // If init detected plugin as unavailable, don't attempt native calls
    if (_nativeInitResult && !_nativeInitResult.pluginAvailable) {
      deviceActivityLogger.debug('requestPermissions skipped — plugin unavailable');
      return;
    }
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
        // Permission state changed — invalidate the cached init result
        // so any component that remounts gets the updated state
        _invalidateInitCache();

        // Start monitoring after permissions granted
        const { result: monitoring } = await safePluginCall(
          () => DeviceActivity.startMonitoring(),
          { success: false, monitoring: false, startTime: 0 },
          'startMonitoring'
        );

        // Refresh blocking status now that we have Screen Time permission
        // (initial getBlockingStatus during initialize() may have returned empty data
        // because it ran before permission was granted)
        const { result: blockingStatus } = await safePluginCall(
          () => DeviceActivity.getBlockingStatus(),
          {
            isBlocking: false,
            focusSessionActive: false,
            shieldAttempts: 0,
            lastShieldAttemptTimestamp: 0,
            hasAppsConfigured: false,
            selectedAppsCount: 0,
            selectedCategoriesCount: 0,
          } as BlockingStatus,
          'getBlockingStatus-afterPermission'
        );

        setState(prev => {
          const updated = {
            ...prev,
            isMonitoring: monitoring.monitoring,
            isBlocking: blockingStatus.isBlocking,
            hasAppsConfigured: blockingStatus.hasAppsConfigured,
            shieldAttempts: blockingStatus.shieldAttempts,
            lastShieldAttemptTimestamp: blockingStatus.lastShieldAttemptTimestamp,
            selectedAppsCount: blockingStatus.selectedAppsCount,
            selectedCategoriesCount: blockingStatus.selectedCategoriesCount,
          };
          // Keep init cache in sync so remounts get fresh data
          _nativeInitResult = updated;
          return updated;
        });

        toast.success("Screen Time Access Granted", {
          description: "You can now block distracting apps during focus sessions!",
        });
      } else if (currentStatus.status === 'notDetermined') {
        // Status is still notDetermined after request — the authorization
        // dialog likely never appeared. This usually means the Family Controls
        // entitlement is missing from the provisioning profile.
        const errorDetail = lastError ? ` (${lastError})` : '';
        toast.error("Permission Not Available", {
          description: `Screen Time permission dialog did not appear${errorDetail}. Try deleting and reinstalling the app, or check that Family Controls is enabled in Xcode.`,
        });
      } else {
        // Status is "denied" — user explicitly denied, or system blocked it.
        // They need to go to Settings to re-enable.
        const errorDetail = lastError ? ` Error: ${lastError}` : '';
        toast.error("Permission Denied", {
          description: `Screen Time access was denied. Tap "Open Settings" below to enable it for this app.${errorDetail}`,
        });
      }
    } catch (error) {
      deviceActivityLogger.error('Permission request failed:', error);
      if (error instanceof Error) {
        reportError(error, { context: 'DeviceActivity.requestPermissions' });
      }
      toast.error("Permission Error", {
        description: "Failed to request Screen Time permissions. Please try again.",
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

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
      deviceActivityLogger.warn('startAppBlocking native call failed — apps will NOT be blocked');
      toast.error("App Blocking Failed", {
        description: "Could not block apps. Check Screen Time permissions and try again.",
      });
      return result;
    }

    setState(prev => ({
      ...prev,
      isBlocking: true,
      shieldAttempts: 0,
    }));

    if (result.appsBlocked > 0 || result.categoriesBlocked > 0) {
      toast.success("Focus Mode Active", {
        description: `Blocking ${result.appsBlocked} apps and ${result.categoriesBlocked} categories`,
      });
    } else if (result.success) {
      // Native call succeeded but reported 0 apps blocked — selection may be missing
      deviceActivityLogger.warn('startAppBlocking succeeded but 0 apps blocked — no selection data in UserDefaults?');
      toast.warning("No Apps Blocked", {
        description: "No apps were blocked. Try re-selecting apps in Focus Settings.",
      });
    }

    return result;
  }, [state.pluginAvailable]);

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
      selectedAppsCount: 0,
      selectedCategoriesCount: 0,
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
      selectedAppsCount: status.selectedAppsCount,
      selectedCategoriesCount: status.selectedCategoriesCount,
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
      const appsSelected = result.appsSelected ?? 0;
      const categoriesSelected = result.categoriesSelected ?? 0;
      deviceActivityLogger.info(
        `App picker done: ${appsSelected} apps, ${categoriesSelected} categories`
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
          selectedAppsCount: appsSelected,
          selectedCategoriesCount: categoriesSelected,
        } as BlockingStatus,
        'getBlockingStatus-afterPicker'
      );
      setState(prev => {
        const updated = {
          ...prev,
          hasAppsConfigured: status.hasAppsConfigured || (result.hasSelection ?? false),
          selectedAppsCount: status.selectedAppsCount || appsSelected,
          selectedCategoriesCount: status.selectedCategoriesCount || categoriesSelected,
        };
        // Keep the init cache in sync so remounts don't revert to stale counts
        _nativeInitResult = updated;
        return updated;
      });
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
      selectedAppsCount: 0,
      selectedCategoriesCount: 0,
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

  // Stable ref for triggerHaptic so the lifecycle listener doesn't churn
  const triggerHapticRef = useRef(triggerHaptic);
  triggerHapticRef.current = triggerHaptic;

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

      // Trigger haptic feedback only when returning after significant time away
      if (appState === 'active' && timeAwayMinutes && timeAwayMinutes > 5) {
        triggerHapticRef.current('success');
      }
    };

    // Listen for app lifecycle events from native
    window.addEventListener('appLifecycleChange', handleAppLifecycle as EventListener);

    return () => {
      window.removeEventListener('appLifecycleChange', handleAppLifecycle as EventListener);
    };
  }, []);

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

  // Count blocked apps: use native counts on iOS, web simulation otherwise
  const blockedAppsCount = isNative
    ? state.selectedAppsCount + state.selectedCategoriesCount
    : simulatedApps.filter(app => app.isBlocked).length;

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
