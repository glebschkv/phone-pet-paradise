/**
 * Navigation Store
 *
 * Zustand store for app navigation state.
 * Replaces window.dispatchEvent('switchToTab') pattern with proper state management.
 *
 * Benefits:
 * - Type-safe navigation
 * - No global event listeners
 * - Easy debugging with Zustand devtools
 * - Proper React integration
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Tab types for the main app navigation
export type MainTab = 'home' | 'timer' | 'collection' | 'challenges' | 'shop' | 'settings';

// Modal types that can be opened from anywhere
export type ModalType =
  | 'none'
  | 'pet-detail'
  | 'background-detail'
  | 'achievement'
  | 'quest'
  | 'lucky-wheel'
  | 'battle-pass'
  | 'premium'
  | 'settings';

interface NavigationState {
  // Current active tab
  activeTab: MainTab;

  // Currently open modal
  activeModal: ModalType;

  // Modal data (type-safe union would be better, but keeping it simple)
  modalData: Record<string, unknown> | null;

  // Navigation history for back button support
  history: MainTab[];

  // Actions
  setActiveTab: (tab: MainTab) => void;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  goBack: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  activeTab: 'home' as MainTab,
  activeModal: 'none' as ModalType,
  modalData: null,
  history: ['home'] as MainTab[],
};

export const useNavigationStore = create<NavigationState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setActiveTab: (tab: MainTab) => {
      const { activeTab, history } = get();

      // Don't add duplicate history entries
      if (tab === activeTab) return;

      set({
        activeTab: tab,
        history: [...history.slice(-9), tab], // Keep last 10 entries
      });
    },

    openModal: (modal: ModalType, data?: Record<string, unknown>) => {
      set({
        activeModal: modal,
        modalData: data ?? null,
      });
    },

    closeModal: () => {
      set({
        activeModal: 'none',
        modalData: null,
      });
    },

    goBack: () => {
      const { history } = get();

      if (history.length <= 1) return;

      const newHistory = history.slice(0, -1);
      const previousTab = newHistory[newHistory.length - 1];

      set({
        activeTab: previousTab,
        history: newHistory,
      });
    },

    reset: () => {
      set(initialState);
    },
  }))
);

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/**
 * Get just the active tab (optimized selector)
 */
export const useActiveTab = () =>
  useNavigationStore((state) => state.activeTab);

/**
 * Get just the active modal (optimized selector)
 */
export const useActiveModal = () =>
  useNavigationStore((state) => state.activeModal);

/**
 * Get modal data (optimized selector)
 */
export const useModalData = <T extends Record<string, unknown>>() =>
  useNavigationStore((state) => state.modalData as T | null);

/**
 * Check if can go back
 */
export const useCanGoBack = () =>
  useNavigationStore((state) => state.history.length > 1);

// ============================================================================
// ACTION HOOKS (for components that only need actions)
// ============================================================================

/**
 * Get navigation actions without subscribing to state
 */
export const useNavigationActions = () => {
  const store = useNavigationStore;
  return {
    setActiveTab: store.getState().setActiveTab,
    openModal: store.getState().openModal,
    closeModal: store.getState().closeModal,
    goBack: store.getState().goBack,
    reset: store.getState().reset,
  };
};

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Subscribe to legacy window events and update store
 * Call this once at app initialization for backwards compatibility
 * Can be removed once all components are migrated to use the store
 */
export function setupLegacyEventBridge(): () => void {
  const handleSwitchToTab = (event: CustomEvent<MainTab | string>) => {
    const tab = event.detail;
    if (isValidTab(tab)) {
      useNavigationStore.getState().setActiveTab(tab);
    }
  };

  window.addEventListener('switchToTab', handleSwitchToTab as EventListener);

  return () => {
    window.removeEventListener('switchToTab', handleSwitchToTab as EventListener);
  };
}

function isValidTab(tab: unknown): tab is MainTab {
  return ['home', 'timer', 'collection', 'challenges', 'shop', 'settings'].includes(tab as string);
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to tab changes
 * Useful for analytics or side effects
 */
export function onTabChange(callback: (tab: MainTab, previousTab: MainTab) => void): () => void {
  return useNavigationStore.subscribe(
    (state) => state.activeTab,
    (tab, previousTab) => {
      callback(tab, previousTab);
    }
  );
}

/**
 * Subscribe to modal changes
 */
export function onModalChange(
  callback: (modal: ModalType, previousModal: ModalType) => void
): () => void {
  return useNavigationStore.subscribe(
    (state) => state.activeModal,
    (modal, previousModal) => {
      callback(modal, previousModal);
    }
  );
}
