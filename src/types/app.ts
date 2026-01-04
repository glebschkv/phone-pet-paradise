/**
 * Core App Types
 *
 * Consolidated type definitions for core application state and settings.
 */

import type { AppTheme } from './theme';

// ============================================================================
// User Profile Types
// ============================================================================

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

// ============================================================================
// App Settings Types
// ============================================================================

/**
 * Application settings
 */
export interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  autoBreakEnabled: boolean;
  showTips: boolean;
}

/**
 * Default app settings
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  notificationsEnabled: true,
  autoBreakEnabled: false,
  showTips: true,
};

// ============================================================================
// Premium / Subscription Types
// ============================================================================

/**
 * Subscription tier levels
 */
export type SubscriptionTier = 'free' | 'premium' | 'lifetime';

/**
 * Subscription plan definition
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: string;
  period: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
}

/**
 * Premium status state
 */
export interface PremiumStatus {
  isPremium: boolean;
  tier: SubscriptionTier;
  expiresAt?: string;
  isLifetime: boolean;
}

// ============================================================================
// App State Types
// ============================================================================

/**
 * Complete application state
 */
export interface AppState {
  // User & Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;

  // Premium Status
  isPremium: boolean;
  premiumTier: SubscriptionTier;
  premiumExpiresAt?: string;

  // Theme & Settings
  theme: AppTheme;
  settings: AppSettings;

  // UI State
  isLoading: boolean;
  isOnline: boolean;
  hasUnsyncedData: boolean;

  // App Info
  appVersion: string;
  platform: string;
}

/**
 * App state action types
 */
export type AppAction =
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: { isPremium: boolean; tier: SubscriptionTier; expiresAt?: string } }
  | { type: 'SET_THEME'; payload: AppTheme }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_UNSYNCED_DATA'; payload: boolean }
  | { type: 'RESET_STATE' };

/**
 * App context value
 */
export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setUser: (user: UserProfile | null) => void;
  setTheme: (theme: AppTheme) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Main navigation tabs
 */
export type MainTab = 'home' | 'focus' | 'collection' | 'shop' | 'profile';

/**
 * Modal types
 */
export type ModalType =
  | 'settings'
  | 'achievements'
  | 'levelUp'
  | 'petDetail'
  | 'purchase'
  | 'premium'
  | 'streak'
  | 'rewards'
  | null;

/**
 * Navigation store state
 */
export interface NavigationState {
  currentTab: MainTab;
  activeModal: ModalType;
  modalData?: Record<string, unknown>;
  setTab: (tab: MainTab) => void;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

// ============================================================================
// Collection State Types
// ============================================================================

/**
 * Collection store state
 */
export interface CollectionState {
  ownedPets: string[];
  ownedBackgrounds: string[];
  ownedBadges: string[];
  activePetId: string | null;
  activeBackgroundId: string | null;
  activeBadgeId: string | null;
  addPet: (petId: string) => void;
  addBackground: (backgroundId: string) => void;
  addBadge: (badgeId: string) => void;
  setActivePet: (petId: string) => void;
  setActiveBackground: (backgroundId: string) => void;
  setActiveBadge: (badgeId: string) => void;
}
