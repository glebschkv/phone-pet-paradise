import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authLogger } from '@/lib/logger';

export interface AuthState {
  guestId: string | null;
  isGuestMode: boolean;
  hasChosenGuestMode: boolean;
}

interface AuthStore extends AuthState {
  setGuestId: (id: string) => void;
  generateGuestId: () => string;
  setGuestMode: (enabled: boolean) => void;
  setGuestChosen: (chosen: boolean) => void;
  clearAuth: () => void;
  getOrCreateGuestId: () => string;
}

const initialState: AuthState = { guestId: null, isGuestMode: false, hasChosenGuestMode: false };

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setGuestId: (id) => set({ guestId: id }),
      generateGuestId: () => { const id = `guest-${crypto.randomUUID()}`; set({ guestId: id }); return id; },
      setGuestMode: (enabled) => set({ isGuestMode: enabled }),
      setGuestChosen: (chosen) => set({ hasChosenGuestMode: chosen }),
      clearAuth: () => set(initialState),
      getOrCreateGuestId: () => get().guestId || get().generateGuestId(),
    }),
    {
      name: 'nomo_auth',
      onRehydrateStorage: () => (state) => {
        if (!state || !state.guestId) {
          try {
            const legacyId = localStorage.getItem('pet_paradise_guest_id');
            const legacyChosen = localStorage.getItem('pet_paradise_guest_chosen') === 'true';
            if (legacyId || legacyChosen) return { guestId: legacyId, isGuestMode: legacyChosen, hasChosenGuestMode: legacyChosen };
          } catch { /* ignore */ }
        }
        if (state) authLogger.debug('Auth store rehydrated');
      },
    }
  )
);

export const useGuestId = () => useAuthStore((s) => s.guestId);
export const useIsGuestMode = () => useAuthStore((s) => s.isGuestMode);
export const useHasChosenGuestMode = () => useAuthStore((s) => s.hasChosenGuestMode);
