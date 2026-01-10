/**
 * Native Plugin Context
 *
 * Provides centralized management for native Capacitor plugin availability and health.
 * This context enables graceful degradation when plugins fail to load or have errors.
 */

import { createContext, useContext, ReactNode, useMemo, useCallback, useState, useEffect } from 'react';
import { useNativePluginStatus, PluginHealthStatus, safeCallPlugin } from '@/hooks/useNativePluginStatus';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: 'NativePluginContext' });

// ============================================================================
// Types
// ============================================================================

export interface NativePluginStatus {
  isNative: boolean;
  plugins: PluginHealthStatus;
  errors: Error[];
}

interface NativePluginContextValue {
  // Status
  status: NativePluginStatus;
  isChecking: boolean;
  hasCriticalErrors: boolean;
  lastChecked: number | null;

  // Banner state
  showBanner: boolean;
  dismissBanner: () => void;

  // Plugin utilities
  isPluginAvailable: (pluginName: keyof PluginHealthStatus) => boolean;
  hasPluginError: (pluginName: keyof PluginHealthStatus) => boolean;
  shouldUsePlugin: (pluginName: keyof PluginHealthStatus) => boolean;

  // Actions
  recheckPlugins: () => Promise<void>;
  safeCallPlugin: typeof safeCallPlugin;

  // Helper flags
  canUseDeviceActivity: boolean;
  canUseStoreKit: boolean;
  canUseWidgetData: boolean;
}

// ============================================================================
// Context
// ============================================================================

const NativePluginContext = createContext<NativePluginContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface NativePluginProviderProps {
  children: ReactNode;
}

export function NativePluginProvider({ children }: NativePluginProviderProps) {
  const {
    isNative,
    isChecking,
    plugins,
    errors,
    hasCriticalErrors,
    lastChecked,
    checkAllPlugins,
    isPluginAvailable,
    hasPluginError,
    shouldUsePlugin,
  } = useNativePluginStatus();

  // Banner dismissal state (persisted in session)
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('plugin_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Show banner if there are critical errors and not dismissed
  const showBanner = hasCriticalErrors && !bannerDismissed && !isChecking;

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem('plugin_banner_dismissed', 'true');
    } catch {
      // Session storage not available
    }
  }, []);

  // Reset banner dismissal if plugin status changes significantly
  useEffect(() => {
    if (!hasCriticalErrors && bannerDismissed) {
      // Plugins recovered - reset dismissal for future issues
      setBannerDismissed(false);
      try {
        sessionStorage.removeItem('plugin_banner_dismissed');
      } catch {
        // Session storage not available
      }
    }
  }, [hasCriticalErrors, bannerDismissed]);

  // Log plugin status changes
  useEffect(() => {
    if (!isChecking && lastChecked) {
      logger.debug('Plugin status updated:', {
        isNative,
        plugins,
        hasCriticalErrors,
        errorCount: errors.length,
      });
    }
  }, [isNative, isChecking, plugins, hasCriticalErrors, errors.length, lastChecked]);

  const status: NativePluginStatus = useMemo(
    () => ({
      isNative,
      plugins,
      errors,
    }),
    [isNative, plugins, errors]
  );

  const value = useMemo(
    (): NativePluginContextValue => ({
      // Status
      status,
      isChecking,
      hasCriticalErrors,
      lastChecked,

      // Banner state
      showBanner,
      dismissBanner,

      // Plugin utilities
      isPluginAvailable,
      hasPluginError,
      shouldUsePlugin,

      // Actions
      recheckPlugins: checkAllPlugins,
      safeCallPlugin,

      // Helper flags for common checks
      canUseDeviceActivity: shouldUsePlugin('deviceActivity'),
      canUseStoreKit: shouldUsePlugin('storeKit'),
      canUseWidgetData: shouldUsePlugin('widgetData'),
    }),
    [
      status,
      isChecking,
      hasCriticalErrors,
      lastChecked,
      showBanner,
      dismissBanner,
      isPluginAvailable,
      hasPluginError,
      shouldUsePlugin,
      checkAllPlugins,
    ]
  );

  return (
    <NativePluginContext.Provider value={value}>
      {children}
    </NativePluginContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useNativePlugins(): NativePluginContextValue {
  const context = useContext(NativePluginContext);
  if (context === undefined) {
    throw new Error('useNativePlugins must be used within a NativePluginProvider');
  }
  return context;
}

// Convenience hooks for specific plugins

// eslint-disable-next-line react-refresh/only-export-components
export function useDeviceActivityPlugin() {
  const { canUseDeviceActivity, hasPluginError, safeCallPlugin } = useNativePlugins();
  return {
    isAvailable: canUseDeviceActivity,
    hasError: hasPluginError('deviceActivity'),
    safeCall: safeCallPlugin,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStoreKitPlugin() {
  const { canUseStoreKit, hasPluginError, safeCallPlugin } = useNativePlugins();
  return {
    isAvailable: canUseStoreKit,
    hasError: hasPluginError('storeKit'),
    safeCall: safeCallPlugin,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWidgetDataPlugin() {
  const { canUseWidgetData, hasPluginError, safeCallPlugin } = useNativePlugins();
  return {
    isAvailable: canUseWidgetData,
    hasError: hasPluginError('widgetData'),
    safeCall: safeCallPlugin,
  };
}

// Export plugin status type for consumers
export type { PluginStatus, PluginHealthStatus } from '@/hooks/useNativePluginStatus';
