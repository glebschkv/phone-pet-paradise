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
