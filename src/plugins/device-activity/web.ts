import { WebPlugin } from '@capacitor/core';
import { deviceActivityLogger } from "@/lib/logger";
import type {
  DeviceActivityPlugin,
  BlockingStatus,
  ShieldAttempts,
  AppSelection,
  StartBlockingResult,
  StopBlockingResult
} from './definitions';

// Simple inline logger for the plugin (avoiding circular dependencies)
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const log = (...args: unknown[]) => isDev && deviceActivityLogger.debug('[DeviceActivity Web]', ...args);

// Storage keys for web simulation
const STORAGE_KEYS = {
  SELECTED_APPS: 'nomoPhone_selectedApps',
  IS_BLOCKING: 'nomoPhone_isBlocking',
  SHIELD_ATTEMPTS: 'nomoPhone_shieldAttempts',
};

export class DeviceActivityWeb extends WebPlugin implements DeviceActivityPlugin {
  private isMonitoring = false;
  private lastActiveTime = Date.now();
  private sessionStartTime = Date.now();
  private visibilityHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  private isBlocking = false;
  private shieldAttempts = 0;

  // Diagnostic methods
  async echo(): Promise<{ pluginLoaded: boolean; platform: string; timestamp: number }> {
    return { pluginLoaded: true, platform: 'web', timestamp: Date.now() };
  }

  // Permission methods
  async requestPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }> {
    log('Permissions requested (simulation)');
    return { status: 'granted', familyControlsEnabled: false };
  }

  async checkPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }> {
    return { status: 'granted', familyControlsEnabled: false };
  }

  // App selection methods (web simulation)
  async openAppPicker(): Promise<{ success: boolean }> {
    log('App picker requested (web simulation - not available)');
    // On web, we dispatch an event to show a simulated picker
    this.notifyListeners('showAppPicker', {});
    return { success: true };
  }

  async setSelectedApps(options: { selection: string }): Promise<{ success: boolean; message: string }> {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_APPS, options.selection);
      log('Selected apps saved:', options.selection);
      return { success: true, message: 'App selection saved (web simulation)' };
    } catch {
      return { success: false, message: 'Failed to save selection' };
    }
  }

  async getSelectedApps(): Promise<AppSelection> {
    const selection = localStorage.getItem(STORAGE_KEYS.SELECTED_APPS);
    return {
      hasSelection: !!selection,
      selection: selection || ''
    };
  }

  async clearSelectedApps(): Promise<{ success: boolean }> {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_APPS);
    this.isBlocking = false;
    log('Selected apps cleared');
    return { success: true };
  }

  // App blocking methods (web simulation)
  async startAppBlocking(): Promise<StartBlockingResult> {
    this.isBlocking = true;
    this.shieldAttempts = 0;
    localStorage.setItem(STORAGE_KEYS.IS_BLOCKING, 'true');
    log('App blocking started (web simulation)');

    const selection = localStorage.getItem(STORAGE_KEYS.SELECTED_APPS);
    const hasApps = !!selection;

    return {
      success: true,
      appsBlocked: hasApps ? 1 : 0, // Simulated count
      categoriesBlocked: 0,
      domainsBlocked: 0,
      note: 'Web simulation - actual blocking only works on iOS'
    };
  }

  async stopAppBlocking(): Promise<StopBlockingResult> {
    this.isBlocking = false;
    const attempts = this.shieldAttempts;
    localStorage.removeItem(STORAGE_KEYS.IS_BLOCKING);
    log('App blocking stopped (web simulation)');

    return {
      success: true,
      shieldAttempts: attempts
    };
  }

  async getBlockingStatus(): Promise<BlockingStatus> {
    return {
      isBlocking: this.isBlocking,
      focusSessionActive: this.isBlocking,
      shieldAttempts: this.shieldAttempts,
      lastShieldAttemptTimestamp: 0,
      hasAppsConfigured: !!localStorage.getItem(STORAGE_KEYS.SELECTED_APPS)
    };
  }

  async getShieldAttempts(): Promise<ShieldAttempts> {
    return {
      attempts: this.shieldAttempts,
      lastAttemptTimestamp: 0
    };
  }

  async resetShieldAttempts(): Promise<{ success: boolean }> {
    this.shieldAttempts = 0;
    return { success: true };
  }

  // Monitoring methods
  async startMonitoring(): Promise<{ success: boolean; monitoring: boolean; startTime: number }> {
    this.isMonitoring = true;
    this.sessionStartTime = Date.now();
    log('Started monitoring (simulation)');

    // Simulate app lifecycle events
    this.setupWebLifecycleListeners();

    return {
      success: true,
      monitoring: true,
      startTime: this.sessionStartTime
    };
  }

  async stopMonitoring(): Promise<{ success: boolean; monitoring: boolean }> {
    this.isMonitoring = false;
    this.cleanupWebLifecycleListeners();
    log('Stopped monitoring');
    return { success: true, monitoring: false };
  }

  async getUsageData(): Promise<{
    timeAwayMinutes: number;
    isMonitoring: boolean;
    lastActiveTime: number;
    currentTime: number;
    shieldAttempts: number;
  }> {
    const now = Date.now();
    const timeAwayMinutes = (now - this.lastActiveTime) / (1000 * 60);

    return {
      timeAwayMinutes,
      isMonitoring: this.isMonitoring,
      lastActiveTime: this.lastActiveTime,
      currentTime: now,
      shieldAttempts: this.shieldAttempts
    };
  }

  async recordActiveTime(): Promise<{ success: boolean; timestamp: number }> {
    this.lastActiveTime = Date.now();
    return { success: true, timestamp: this.lastActiveTime };
  }

  // Haptic feedback
  async triggerHapticFeedback(options: { style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' }): Promise<{ success: boolean }> {
    // Web haptic feedback simulation
    if ('vibrate' in navigator) {
      switch (options.style) {
        case 'light':
          navigator.vibrate(50);
          break;
        case 'medium':
          navigator.vibrate(100);
          break;
        case 'heavy':
          navigator.vibrate(200);
          break;
        case 'success':
          navigator.vibrate([50, 50, 100]);
          break;
        case 'warning':
          navigator.vibrate([100, 50, 100]);
          break;
        case 'error':
          navigator.vibrate([200, 100, 200]);
          break;
        default:
          navigator.vibrate(100);
      }
    }

    log(`Haptic feedback (${options.style})`);
    return { success: true };
  }

  private setupWebLifecycleListeners() {
    // Clean up any existing listeners first
    this.cleanupWebLifecycleListeners();

    // Page visibility API for web
    this.visibilityHandler = () => {
      const now = Date.now();

      if (document.hidden) {
        this.lastActiveTime = now;
        this.notifyListeners('appLifecycleChange', {
          state: 'background',
          timestamp: now,
          lastActiveTime: this.lastActiveTime
        });
      } else {
        const timeAwayMinutes = (now - this.lastActiveTime) / (1000 * 60);
        this.notifyListeners('appLifecycleChange', {
          state: 'active',
          timestamp: now,
          timeAwayMinutes,
          lastActiveTime: this.lastActiveTime,
          shieldAttempts: this.shieldAttempts
        });
        this.lastActiveTime = now;
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Beforeunload for app termination
    this.beforeUnloadHandler = () => {
      this.lastActiveTime = Date.now();
      this.notifyListeners('appLifecycleChange', {
        state: 'terminated',
        timestamp: this.lastActiveTime
      });
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private cleanupWebLifecycleListeners() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }
}
