/**
 * Accessibility Utilities
 *
 * Provides helper functions and constants for improving app accessibility.
 * Following WCAG 2.1 guidelines for mobile applications.
 */

// ============================================================================
// ARIA Labels for Common Actions
// ============================================================================

export const ARIA_LABELS = {
  // Navigation
  CLOSE_MODAL: 'Close dialog',
  OPEN_MENU: 'Open menu',
  CLOSE_MENU: 'Close menu',
  GO_BACK: 'Go back',
  HOME: 'Go to home screen',

  // Tab Navigation
  HOME_TAB: 'Go to home screen',
  TIMER_TAB: 'Go to focus timer',
  COLLECTION_TAB: 'View pet collection',
  SHOP_TAB: 'Open shop',
  SETTINGS_TAB: 'Open settings',

  // Timer Actions
  START_TIMER: 'Start focus session',
  PAUSE_TIMER: 'Pause focus session',
  RESUME_TIMER: 'Resume focus session',
  STOP_TIMER: 'Stop focus session',
  RESET_TIMER: 'Reset timer',
  ADD_TIME: 'Add 5 minutes to timer',

  // Focus Session
  SELECT_DURATION: 'Select session duration',
  ADD_SESSION_NOTE: 'Add note to session',
  COMPLETE_SESSION: 'Complete focus session',
  CANCEL_SESSION: 'Cancel focus session',

  // Pet Interactions
  PET_ANIMAL: 'Pet the animal',
  FEED_ANIMAL: 'Feed the animal',
  PLAY_WITH_ANIMAL: 'Play with the animal',
  SELECT_PET: 'Select this pet',
  FAVORITE_PET: 'Add to favorites',
  UNFAVORITE_PET: 'Remove from favorites',
  VIEW_PET_DETAILS: 'View pet details',

  // Shop & Currency
  PURCHASE_ITEM: 'Purchase this item',
  VIEW_ITEM_DETAILS: 'View item details',
  SPIN_WHEEL: 'Spin the lucky wheel',
  CLAIM_REWARD: 'Claim reward',
  EQUIP_ITEM: 'Equip this item',
  UNEQUIP_ITEM: 'Unequip this item',
  VIEW_COIN_BALANCE: 'View coin balance',

  // Premium
  SUBSCRIBE: 'Subscribe to premium',
  RESTORE_PURCHASES: 'Restore previous purchases',
  MANAGE_SUBSCRIPTION: 'Manage subscription',

  // Settings
  TOGGLE_SOUND: 'Toggle sound effects',
  TOGGLE_NOTIFICATIONS: 'Toggle notifications',
  TOGGLE_HAPTIC: 'Toggle haptic feedback',
  CHANGE_THEME: 'Change app theme',
  SIGN_OUT: 'Sign out',
  DELETE_ACCOUNT: 'Delete account',

  // Progress & Stats
  VIEW_ACHIEVEMENTS: 'View achievements',
  VIEW_STATS: 'View statistics',
  VIEW_STREAK: 'View streak details',
  VIEW_QUESTS: 'View active quests',
  VIEW_LEVEL_PROGRESS: 'View level progress',

  // Daily Login
  CLAIM_DAILY_REWARD: 'Claim daily login reward',
  VIEW_REWARD_CALENDAR: 'View reward calendar',

  // App Review
  RATE_APP: 'Rate the app',
  DISMISS_REVIEW: 'Not now',
} as const;

// ============================================================================
// Dynamic ARIA Label Generators
// ============================================================================

export const ariaLabel = {
  // Pet labels
  petCard: (name: string, isLocked: boolean, level?: number) =>
    isLocked
      ? `${name} - Locked. Unlock at level ${level}`
      : `${name} - Tap to view details`,

  favoritePet: (name: string, isFavorite: boolean) =>
    isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`,

  homeActivePet: (name: string, isActive: boolean) =>
    isActive ? `Remove ${name} from home screen` : `Add ${name} to home screen`,

  // Shop labels
  buyItem: (name: string, price: number) =>
    `Buy ${name} for ${price.toLocaleString()} coins`,

  equipBackground: (name: string, isEquipped: boolean) =>
    isEquipped ? `Unequip ${name}` : `Equip ${name}`,

  shopItem: (name: string, owned: boolean, price?: number) =>
    owned
      ? `${name} - Owned`
      : `${name} - ${price?.toLocaleString()} coins`,

  // Achievement labels
  achievement: (name: string, unlocked: boolean, progress?: string) =>
    unlocked
      ? `${name} - Unlocked`
      : `${name} - Locked${progress ? `. Progress: ${progress}` : ''}`,

  // Quest labels
  quest: (name: string, current: number, target: number) =>
    `${name}: ${current} of ${target} completed`,

  // Timer labels
  timerDuration: (minutes: number) =>
    `Select ${minutes} minute focus session`,

  // Tab labels
  tab: (name: string, isActive: boolean) =>
    `${name} tab${isActive ? ', selected' : ''}`,

  // Toggle labels
  toggle: (name: string, enabled: boolean) =>
    `${name}: ${enabled ? 'On' : 'Off'}. Tap to toggle.`,

  // World/Biome labels
  biome: (name: string, isActive: boolean, isLocked: boolean, level?: number) => {
    if (isLocked) return `${name} - Locked. Unlock at level ${level}`;
    if (isActive) return `${name} - Current location`;
    return `${name} - Tap to visit`;
  },
};

// ============================================================================
// Role Descriptions
// ============================================================================

export const ROLE_DESCRIPTIONS = {
  TIMER_DISPLAY: 'Focus timer display',
  XP_BAR: 'Experience points progress bar',
  STREAK_DISPLAY: 'Current streak counter',
  COIN_DISPLAY: 'Coin balance display',
  LEVEL_DISPLAY: 'Current level indicator',
  PET_GRID: 'Pet collection grid',
  SHOP_ITEM: 'Shop item for purchase',
  ACHIEVEMENT_BADGE: 'Achievement badge',
  QUEST_ITEM: 'Quest objective',
} as const;

// ============================================================================
// Announcement Messages
// ============================================================================

export const ANNOUNCEMENTS = {
  // Timer
  TIMER_STARTED: 'Focus session started',
  TIMER_PAUSED: 'Focus session paused',
  TIMER_RESUMED: 'Focus session resumed',
  TIMER_COMPLETED: 'Focus session completed! Great job!',
  TIMER_CANCELLED: 'Focus session cancelled',

  // Achievements
  ACHIEVEMENT_UNLOCKED: (name: string) => `Achievement unlocked: ${name}`,
  LEVEL_UP: (level: number) => `Congratulations! You reached level ${level}!`,

  // Rewards
  XP_EARNED: (amount: number) => `You earned ${amount} experience points`,
  COINS_EARNED: (amount: number) => `You earned ${amount} coins`,

  // Streak
  STREAK_CONTINUED: (days: number) => `Streak continued! ${days} days strong!`,
  STREAK_LOST: 'Your streak has been reset',
  STREAK_FROZEN: 'Streak freeze activated',

  // Shop
  PURCHASE_SUCCESS: (item: string) => `Successfully purchased ${item}`,
  PURCHASE_FAILED: 'Purchase failed. Please try again.',
  INSUFFICIENT_COINS: 'Not enough coins for this purchase',

  // Loading States
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  SYNCING: 'Syncing data...',
} as const;

// ============================================================================
// Accessibility Helper Functions
// ============================================================================

/**
 * Announces a message to screen readers using live regions
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Format time for screen readers
 */
export function formatTimeForScreenReader(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' and ');
}

/**
 * Generate accessible label for progress bar
 */
export function getProgressLabel(current: number, max: number, label: string): string {
  const percentage = Math.round((current / max) * 100);
  return `${label}: ${current} of ${max}, ${percentage}% complete`;
}

/**
 * Generate accessible label for XP progress
 */
export function getXPProgressLabel(currentXP: number, xpToNext: number, level: number): string {
  const percentage = Math.round((currentXP / (currentXP + xpToNext)) * 100);
  return `Level ${level}, ${currentXP} XP, ${percentage}% to next level`;
}

/**
 * Generate accessible label for streak
 */
export function getStreakLabel(streak: number, freezes: number): string {
  let label = `Current streak: ${streak} ${streak === 1 ? 'day' : 'days'}`;
  if (freezes > 0) {
    label += `, ${freezes} ${freezes === 1 ? 'freeze' : 'freezes'} available`;
  }
  return label;
}

/**
 * Generate accessible label for timer
 */
export function getTimerLabel(seconds: number, isRunning: boolean, sessionType: string | null): string {
  const timeStr = formatTimeForScreenReader(seconds);
  const status = isRunning ? 'running' : 'paused';
  const type = sessionType || 'focus';
  return `${type} timer ${status}, ${timeStr} remaining`;
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if high contrast mode is active
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

// ============================================================================
// Keyboard Navigation Helpers
// ============================================================================

/**
 * Trap focus within a container (for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Handle arrow key navigation in a grid
 */
export function handleGridNavigation(
  e: React.KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  columns: number,
  onNavigate: (newIndex: number) => void
): void {
  let newIndex = currentIndex;

  switch (e.key) {
    case 'ArrowRight':
      newIndex = Math.min(currentIndex + 1, totalItems - 1);
      break;
    case 'ArrowLeft':
      newIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'ArrowDown':
      newIndex = Math.min(currentIndex + columns, totalItems - 1);
      break;
    case 'ArrowUp':
      newIndex = Math.max(currentIndex - columns, 0);
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = totalItems - 1;
      break;
    default:
      return;
  }

  if (newIndex !== currentIndex) {
    e.preventDefault();
    onNavigate(newIndex);
  }
}

// ============================================================================
// CSS Utilities (add to global styles)
// ============================================================================

export const accessibilityStyles = `
  /* Screen reader only - visually hidden but accessible */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Focus visible for keyboard navigation */
  .focus-visible:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }

  /* Skip link for keyboard users */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    padding: 8px;
    z-index: 100;
  }

  .skip-link:focus {
    top: 0;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
