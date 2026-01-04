/**
 * Navigation Store
 *
 * Zustand store for app navigation state.
 * Replaces window.dispatchEvent('switchToTab') pattern with proper state management.
 *
 * Benefits:
 * - Type-safe navigation with discriminated unions for modal data
 * - No global event listeners
 * - Easy debugging with Zustand devtools
 * - Proper React integration
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ModalType,
  ModalDataUnion,
  ModalDataFor,
  PetDetailModalData,
  BackgroundDetailModalData,
  AchievementModalData,
  QuestModalData,
  LevelUpModalData,
  StreakModalData,
  RewardModalData,
} from '@/types/modals';

// Re-export modal types for convenience
export type { ModalType } from '@/types/modals';

// Tab types for the main app navigation
export type MainTab = 'home' | 'timer' | 'collection' | 'shop' | 'settings';

interface NavigationState {
  // Current active tab
  activeTab: MainTab;

  // Currently open modal (using discriminated union)
  activeModal: ModalDataUnion;

  // Navigation history for back button support
  history: MainTab[];

  // Actions
  setActiveTab: (tab: MainTab) => void;
  closeModal: () => void;
  goBack: () => void;
  reset: () => void;
}

// Type-safe openModal overloads
interface ModalActions {
  // Modals without data
  openModal(modal: 'none' | 'lucky-wheel' | 'battle-pass' | 'premium' | 'settings'): void;
  // Modals with required data
  openModal(modal: 'pet-detail', data: PetDetailModalData): void;
  openModal(modal: 'background-detail', data: BackgroundDetailModalData): void;
  openModal(modal: 'achievement', data: AchievementModalData): void;
  openModal(modal: 'quest', data: QuestModalData): void;
  openModal(modal: 'level-up', data: LevelUpModalData): void;
  openModal(modal: 'streak', data: StreakModalData): void;
  openModal(modal: 'reward', data: RewardModalData): void;
  // Generic fallback (for backwards compatibility)
  openModal(modal: ModalType, data?: Record<string, unknown>): void;
}

// Initial state
const initialState = {
  activeTab: 'home' as MainTab,
  activeModal: { type: 'none' } as ModalDataUnion,
  history: ['home'] as MainTab[],
};

type NavigationStore = NavigationState & ModalActions;

export const useNavigationStore = create<NavigationStore>()(
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

    // Type-safe openModal implementation
    openModal: ((modal: ModalType, data?: Record<string, unknown>) => {
      // Build the discriminated union based on modal type
      let modalData: ModalDataUnion;

      switch (modal) {
        case 'none':
        case 'lucky-wheel':
        case 'battle-pass':
        case 'premium':
        case 'settings':
          modalData = { type: modal };
          break;
        case 'pet-detail':
          modalData = { type: 'pet-detail', data: data as PetDetailModalData };
          break;
        case 'background-detail':
          modalData = { type: 'background-detail', data: data as BackgroundDetailModalData };
          break;
        case 'achievement':
          modalData = { type: 'achievement', data: data as AchievementModalData };
          break;
        case 'quest':
          modalData = { type: 'quest', data: data as QuestModalData };
          break;
        case 'level-up':
          modalData = { type: 'level-up', data: data as LevelUpModalData };
          break;
        case 'streak':
          modalData = { type: 'streak', data: data as StreakModalData };
          break;
        case 'reward':
          modalData = { type: 'reward', data: data as RewardModalData };
          break;
        default:
          modalData = { type: 'none' };
      }

      set({ activeModal: modalData });
    }) as ModalActions['openModal'],

    closeModal: () => {
      set({ activeModal: { type: 'none' } });
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
 * Get just the active modal type (optimized selector)
 */
export const useActiveModal = () =>
  useNavigationStore((state) => state.activeModal.type);

/**
 * Get the full active modal with data (type-safe)
 */
export const useActiveModalWithData = () =>
  useNavigationStore((state) => state.activeModal);

/**
 * Type-safe hook to get modal data for a specific modal type
 * Returns the data if the modal matches, undefined otherwise
 */
export function useTypedModalData<T extends ModalType>(
  modalType: T
): ModalDataFor<T> | undefined {
  const activeModal = useNavigationStore((state) => state.activeModal);

  if (activeModal.type !== modalType) {
    return undefined;
  }

  // Return the data if the modal has data
  if ('data' in activeModal) {
    return activeModal.data as ModalDataFor<T>;
  }

  return undefined;
}

/**
 * Legacy: Get modal data as Record<string, unknown>
 * @deprecated Use useTypedModalData instead for type safety
 */
export const useModalData = <T extends Record<string, unknown>>() =>
  useNavigationStore((state) => {
    const modal = state.activeModal;
    if ('data' in modal) {
      return modal.data as T;
    }
    return null;
  });

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
  return ['home', 'timer', 'collection', 'shop', 'settings'].includes(tab as string);
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
    (state) => state.activeModal.type,
    (modal, previousModal) => {
      callback(modal, previousModal);
    }
  );
}
