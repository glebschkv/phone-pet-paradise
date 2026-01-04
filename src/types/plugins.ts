/**
 * Native Plugin Types
 *
 * Consolidated type definitions for native plugin status and health checking.
 */

// ============================================================================
// Plugin Status Types
// ============================================================================

/**
 * Status of a native plugin
 */
export type PluginStatus = 'available' | 'unavailable' | 'error';

/**
 * Health status for all native plugins
 */
export interface PluginHealthStatus {
  deviceActivity: PluginStatus;
  storeKit: PluginStatus;
  widgetData: PluginStatus;
}

/**
 * Plugin names as type
 */
export type PluginName = keyof PluginHealthStatus;

// ============================================================================
// Plugin State Types
// ============================================================================

/**
 * Complete native plugin status state
 */
export interface NativePluginStatusState {
  isNative: boolean;
  isChecking: boolean;
  plugins: PluginHealthStatus;
  errors: Error[];
  hasCriticalErrors: boolean;
  lastChecked: number | null;
}

// ============================================================================
// Plugin Context Types
// ============================================================================

/**
 * Native plugin context value
 */
export interface NativePluginContextValue {
  isNative: boolean;
  isChecking: boolean;
  plugins: PluginHealthStatus;
  hasCriticalErrors: boolean;
  checkAllPlugins: () => Promise<void>;
  isPluginAvailable: (pluginName: PluginName) => boolean;
  hasPluginError: (pluginName: PluginName) => boolean;
  shouldUsePlugin: (pluginName: PluginName) => boolean;
}

/**
 * Props for NativePluginProvider
 */
export interface NativePluginProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// Device Activity Plugin Types
// ============================================================================

/**
 * Status of app blocking
 */
export interface BlockingStatus {
  isBlocking: boolean;
  blockedApps: string[];
  startTime?: number;
  endTime?: number;
}

/**
 * Shield interaction attempts
 */
export interface ShieldAttempts {
  count: number;
  timestamps: number[];
}

/**
 * App selection for blocking
 */
export interface AppSelection {
  bundleId: string;
  name: string;
  category?: string;
}

/**
 * Result of starting blocking
 */
export interface StartBlockingResult {
  success: boolean;
  error?: string;
}

/**
 * Result of stopping blocking
 */
export interface StopBlockingResult {
  success: boolean;
  shieldAttempts: number;
}

/**
 * Device Activity Plugin interface
 */
export interface DeviceActivityPluginInterface {
  checkPermissions(): Promise<{ authorized: boolean }>;
  requestPermissions(): Promise<{ authorized: boolean }>;
  startBlocking(options: { duration: number }): Promise<StartBlockingResult>;
  stopBlocking(): Promise<StopBlockingResult>;
  getBlockingStatus(): Promise<BlockingStatus>;
  getShieldAttempts(): Promise<ShieldAttempts>;
  clearShieldAttempts(): Promise<void>;
  openFamilyActivityPicker(): Promise<void>;
  getSelectedApps(): Promise<{ apps: AppSelection[] }>;
}

// ============================================================================
// StoreKit Plugin Types
// ============================================================================

/**
 * Subscription status result
 */
export interface SubscriptionStatus {
  isSubscribed: boolean;
  productId?: string;
  expirationDate?: string;
  isLifetime?: boolean;
}

/**
 * Product information
 */
export interface ProductInfo {
  id: string;
  title: string;
  description: string;
  price: string;
  priceLocale: string;
}

/**
 * Purchase result
 */
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// ============================================================================
// Widget Data Plugin Types
// ============================================================================

/**
 * Widget data structure
 */
export interface WidgetData {
  focusMinutesToday: number;
  currentStreak: number;
  currentLevel: number;
  activePetName?: string;
  lastUpdated: string;
}
