import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { DeviceActivity } from '@/plugins/device-activity';
import { StoreKit } from '@/plugins/store-kit';
import { WidgetDataPlugin } from '@/plugins/widget-data';
import { createLogger } from '@/lib/logger';
import { reportError, reportWarning } from '@/lib/errorReporting';
import type { PluginStatus, PluginHealthStatus, NativePluginStatusState } from '@/types';

// Re-export types for backwards compatibility
export type { PluginStatus, PluginHealthStatus, NativePluginStatusState } from '@/types';

const logger = createLogger({ prefix: 'PluginStatus' });

/**
 * Safe wrapper for plugin calls with fallback
 */
export async function safeCallPlugin<T>(
  pluginCall: () => Promise<T>,
  fallback: T,
  errorContext: string
): Promise<T> {
  try {
    return await pluginCall();
  } catch (error) {
    logger.error(`[${errorContext}] Plugin call failed:`, error);
    if (error instanceof Error) {
      reportError(error, { context: errorContext, type: 'plugin_call' });
    }
    return fallback;
  }
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a specific plugin is available and responsive.
 * Retries up to maxRetries times with exponential backoff before reporting an error.
 */
async function checkPluginHealth(
  pluginName: string,
  testCall: () => Promise<unknown>,
  maxRetries = 2
): Promise<{ status: PluginStatus; error?: Error }> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await testCall();
      return { status: 'available' };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Check if plugin is simply not available vs actual error
      if (
        err.message.includes('not implemented') ||
        err.message.includes('not available') ||
        err.message.includes('Plugin not installed') ||
        err.message.includes('does not have web implementation')
      ) {
        logger.debug(`[${pluginName}] Plugin not available (expected on web)`);
        return { status: 'unavailable' };
      }

      lastError = err;

      if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 500; // 500ms, 1000ms
        logger.debug(`[${pluginName}] Health check attempt ${attempt + 1} failed, retrying in ${backoff}ms`);
        await delay(backoff);
      }
    }
  }

  logger.error(`[${pluginName}] Plugin error after ${maxRetries + 1} attempts:`, lastError);
  return { status: 'error', error: lastError };
}

/**
 * Hook to check native plugin availability and health
 *
 * Use this hook to:
 * - Check if running on native platform
 * - Verify each plugin is available
 * - Track plugin health status
 * - Provide fallback flags for graceful degradation
 */
export const useNativePluginStatus = () => {
  const [state, setState] = useState<NativePluginStatusState>({
    isNative: Capacitor.isNativePlatform(),
    isChecking: true,
    plugins: {
      deviceActivity: 'unavailable',
      storeKit: 'unavailable',
      widgetData: 'unavailable',
    },
    errors: [],
    hasCriticalErrors: false,
    lastChecked: null,
  });

  /**
   * Check health of all plugins
   */
  const checkAllPlugins = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();

    setState(prev => ({ ...prev, isChecking: true }));

    // If not native, all plugins are unavailable (expected)
    if (!isNative) {
      setState({
        isNative: false,
        isChecking: false,
        plugins: {
          deviceActivity: 'unavailable',
          storeKit: 'unavailable',
          widgetData: 'unavailable',
        },
        errors: [],
        hasCriticalErrors: false,
        lastChecked: Date.now(),
      });
      return;
    }

    const errors: Error[] = [];

    // Run all health checks in PARALLEL to avoid serializing bridge round-trips.
    // Sequential checks were adding ~300-600ms+ of idle wait time during startup.
    const [deviceActivityResult, storeKitResult, widgetDataResult] = await Promise.all([
      checkPluginHealth('DeviceActivity', async () => await DeviceActivity.echo()),
      checkPluginHealth('StoreKit', async () => await StoreKit.getSubscriptionStatus()),
      checkPluginHealth('WidgetData', async () => await WidgetDataPlugin.loadData()),
    ]);

    if (deviceActivityResult.error) errors.push(deviceActivityResult.error);
    if (storeKitResult.error) errors.push(storeKitResult.error);
    if (widgetDataResult.error) errors.push(widgetDataResult.error);

    const plugins: PluginHealthStatus = {
      deviceActivity: deviceActivityResult.status,
      storeKit: storeKitResult.status,
      widgetData: widgetDataResult.status,
    };

    // Critical error if StoreKit or DeviceActivity has errors (not just unavailable)
    const hasCriticalErrors =
      plugins.deviceActivity === 'error' || plugins.storeKit === 'error';

    // Report if we have critical errors
    if (hasCriticalErrors) {
      reportWarning('Critical native plugin errors detected', {
        plugins,
        errorCount: errors.length,
        errorMessages: errors.map(e => e.message),
      });
    }

    setState({
      isNative,
      isChecking: false,
      plugins,
      errors,
      hasCriticalErrors,
      lastChecked: Date.now(),
    });

    logger.debug('Plugin health check complete:', plugins);
  }, []);

  /**
   * Check a specific plugin's availability
   */
  const isPluginAvailable = useCallback(
    (pluginName: keyof PluginHealthStatus): boolean => {
      return state.plugins[pluginName] === 'available';
    },
    [state.plugins]
  );

  /**
   * Check if a plugin has an error (different from just unavailable)
   */
  const hasPluginError = useCallback(
    (pluginName: keyof PluginHealthStatus): boolean => {
      return state.plugins[pluginName] === 'error';
    },
    [state.plugins]
  );

  /**
   * Get a safe boolean for whether plugin should be used
   * Returns true only if native AND plugin is available
   */
  const shouldUsePlugin = useCallback(
    (pluginName: keyof PluginHealthStatus): boolean => {
      return state.isNative && state.plugins[pluginName] === 'available';
    },
    [state.isNative, state.plugins]
  );

  // Run initial check well after first paint — defer so the UI renders and
  // becomes interactive before health checks saturate the native bridge.
  // 300ms gives React time to commit, paint, and process the initial render
  // plus any pending user interactions (e.g. taps on already-visible buttons).
  useEffect(() => {
    const id = setTimeout(checkAllPlugins, 300);
    return () => clearTimeout(id);
  }, [checkAllPlugins]);

  // Auto-retry if critical errors are detected — plugins may need time to initialise
  useEffect(() => {
    if (!state.hasCriticalErrors || state.isChecking) return;

    const retryTimer = setTimeout(() => {
      logger.debug('Auto-retrying plugin health check after critical errors');
      checkAllPlugins();
    }, 5000); // Retry after 5 seconds

    return () => clearTimeout(retryTimer);
  }, [state.hasCriticalErrors, state.isChecking, checkAllPlugins]);

  return {
    ...state,
    checkAllPlugins,
    isPluginAvailable,
    hasPluginError,
    shouldUsePlugin,
  };
};
