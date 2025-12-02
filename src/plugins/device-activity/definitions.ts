// App blocking status response
export interface BlockingStatus {
  isBlocking: boolean;
  focusSessionActive: boolean;
  shieldAttempts: number;
  lastShieldAttemptTimestamp: number;
  hasAppsConfigured: boolean;
}

// Shield attempts response
export interface ShieldAttempts {
  attempts: number;
  lastAttemptTimestamp: number;
}

// App selection response
export interface AppSelection {
  hasSelection: boolean;
  selection: string;
}

// Start blocking response
export interface StartBlockingResult {
  success: boolean;
  appsBlocked: number;
  categoriesBlocked: number;
  domainsBlocked: number;
  note?: string;
}

// Stop blocking response
export interface StopBlockingResult {
  success: boolean;
  shieldAttempts: number;
}

export interface DeviceActivityPlugin {
  // Permission methods
  requestPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }>;
  checkPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }>;

  // App selection methods
  openAppPicker(): Promise<{ success: boolean }>;
  setSelectedApps(options: { selection: string }): Promise<{ success: boolean; message: string }>;
  getSelectedApps(): Promise<AppSelection>;
  clearSelectedApps(): Promise<{ success: boolean }>;

  // App blocking methods
  startAppBlocking(): Promise<StartBlockingResult>;
  stopAppBlocking(): Promise<StopBlockingResult>;
  getBlockingStatus(): Promise<BlockingStatus>;
  getShieldAttempts(): Promise<ShieldAttempts>;
  resetShieldAttempts(): Promise<{ success: boolean }>;

  // Monitoring methods
  startMonitoring(): Promise<{ success: boolean; monitoring: boolean; startTime: number }>;
  stopMonitoring(): Promise<{ success: boolean; monitoring: boolean }>;
  getUsageData(): Promise<{
    timeAwayMinutes: number;
    isMonitoring: boolean;
    lastActiveTime: number;
    currentTime: number;
    shieldAttempts: number;
  }>;
  recordActiveTime(): Promise<{ success: boolean; timestamp: number }>;

  // Haptic feedback
  triggerHapticFeedback(options: { style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' }): Promise<{ success: boolean }>;
}