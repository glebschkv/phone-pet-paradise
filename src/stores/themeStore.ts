import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  // Home screen background theme
  homeBackground: string;

  // Actions
  setHomeBackground: (theme: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      homeBackground: 'day',

      setHomeBackground: (theme) => {
        set({ homeBackground: theme });
      },
    }),
    {
      name: 'petIsland_homeBackground',
      // Store as simple string value for compatibility
      partialize: (state) => ({ homeBackground: state.homeBackground }),
    }
  )
);

// Selector hook
export const useHomeBackground = () => useThemeStore((state) => state.homeBackground);

// Expose store globally for debugging (use in browser console: window.setDebugBackground())
if (typeof window !== 'undefined') {
  (window as unknown as { setDebugBackground: () => void }).setDebugBackground = () => {
    useThemeStore.getState().setHomeBackground('debug');
    console.log('Debug background enabled! Refresh if needed.');
  };
  (window as unknown as { setDayBackground: () => void }).setDayBackground = () => {
    useThemeStore.getState().setHomeBackground('day');
    console.log('Day background restored! Refresh if needed.');
  };
}
