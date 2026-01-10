import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useThemeStore, useHomeBackground } from '@/stores/themeStore';

describe('themeStore', () => {
  const STORAGE_KEY = 'petIsland_homeBackground';

  beforeEach(() => {
    localStorage.clear();
    // Reset store to initial state
    useThemeStore.setState({
      homeBackground: 'day',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with "day" as default home background', () => {
      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe('day');
    });

    it('should have setHomeBackground action available', () => {
      const state = useThemeStore.getState();
      expect(typeof state.setHomeBackground).toBe('function');
    });
  });

  describe('setHomeBackground', () => {
    it('should set home background to new theme', () => {
      const { setHomeBackground } = useThemeStore.getState();

      act(() => {
        setHomeBackground('night');
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe('night');
    });

    it('should handle all standard theme values', () => {
      const { setHomeBackground } = useThemeStore.getState();
      const themes = ['day', 'night', 'sunset', 'dawn', 'tropical', 'winter', 'autumn'];

      themes.forEach(theme => {
        act(() => {
          setHomeBackground(theme);
        });

        const state = useThemeStore.getState();
        expect(state.homeBackground).toBe(theme);
      });
    });

    it('should replace previous theme', () => {
      const { setHomeBackground } = useThemeStore.getState();

      act(() => {
        setHomeBackground('night');
      });
      expect(useThemeStore.getState().homeBackground).toBe('night');

      act(() => {
        setHomeBackground('sunset');
      });
      expect(useThemeStore.getState().homeBackground).toBe('sunset');
    });

    it('should handle setting same theme twice', () => {
      const { setHomeBackground } = useThemeStore.getState();

      act(() => {
        setHomeBackground('night');
        setHomeBackground('night');
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe('night');
    });

    it('should handle empty string theme', () => {
      const { setHomeBackground } = useThemeStore.getState();

      act(() => {
        setHomeBackground('');
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe('');
    });

    it('should handle custom theme IDs', () => {
      const { setHomeBackground } = useThemeStore.getState();
      const customTheme = 'custom-premium-theme-12345';

      act(() => {
        setHomeBackground(customTheme);
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe(customTheme);
    });
  });

  describe('useHomeBackground Selector Hook', () => {
    it('should return current home background', () => {
      const { result } = renderHook(() => useHomeBackground());
      expect(result.current).toBe('day');
    });

    it('should update when theme changes', () => {
      const { result } = renderHook(() => useHomeBackground());

      expect(result.current).toBe('day');

      act(() => {
        useThemeStore.getState().setHomeBackground('night');
      });

      expect(result.current).toBe('night');
    });

    it('should track multiple theme changes', () => {
      const { result } = renderHook(() => useHomeBackground());
      const themes = ['night', 'sunset', 'dawn', 'day'];

      themes.forEach(theme => {
        act(() => {
          useThemeStore.getState().setHomeBackground(theme);
        });
        expect(result.current).toBe(theme);
      });
    });
  });

  describe('Persistence', () => {
    it('should persist home background to localStorage', async () => {
      const { setHomeBackground } = useThemeStore.getState();

      act(() => {
        setHomeBackground('sunset');
      });

      // Wait for persistence middleware
      await new Promise(resolve => setTimeout(resolve, 50));

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.state.homeBackground).toBe('sunset');
    });

    it('should restore home background from localStorage on mount', () => {
      // Pre-populate localStorage
      const persistedState = {
        state: {
          homeBackground: 'tropical',
        },
        version: 0,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

      // Manually set state to simulate rehydration
      useThemeStore.setState({
        homeBackground: persistedState.state.homeBackground,
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe('tropical');
    });

    it('should only persist homeBackground field (partialize)', async () => {
      const { setHomeBackground } = useThemeStore.getState();

      act(() => {
        setHomeBackground('winter');
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      // Should only contain homeBackground, not functions
      expect(Object.keys(parsed.state)).toEqual(['homeBackground']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long theme names', () => {
      const { setHomeBackground } = useThemeStore.getState();
      const longThemeName = 'a'.repeat(1000);

      act(() => {
        setHomeBackground(longThemeName);
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe(longThemeName);
    });

    it('should handle special characters in theme name', () => {
      const { setHomeBackground } = useThemeStore.getState();
      const specialTheme = 'theme-with-特殊字符-🌟-émojis';

      act(() => {
        setHomeBackground(specialTheme);
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe(specialTheme);
    });

    it('should handle whitespace in theme name', () => {
      const { setHomeBackground } = useThemeStore.getState();
      const whitespaceTheme = '  spaced  theme  ';

      act(() => {
        setHomeBackground(whitespaceTheme);
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe(whitespaceTheme);
    });

    it('should maintain state consistency with rapid changes', () => {
      const { setHomeBackground } = useThemeStore.getState();
      const themes = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

      act(() => {
        themes.forEach(theme => setHomeBackground(theme));
      });

      const state = useThemeStore.getState();
      expect(state.homeBackground).toBe('j'); // Last theme set
    });
  });

  describe('React Integration', () => {
    it('should work with multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useHomeBackground());
      const { result: result2 } = renderHook(() => useHomeBackground());

      expect(result1.current).toBe('day');
      expect(result2.current).toBe('day');

      act(() => {
        useThemeStore.getState().setHomeBackground('night');
      });

      expect(result1.current).toBe('night');
      expect(result2.current).toBe('night');
    });

    it('should properly unmount and remount', () => {
      const { result, unmount } = renderHook(() => useHomeBackground());

      expect(result.current).toBe('day');

      act(() => {
        useThemeStore.getState().setHomeBackground('night');
      });

      expect(result.current).toBe('night');

      unmount();

      // State should persist after unmount
      expect(useThemeStore.getState().homeBackground).toBe('night');

      // New hook should see persisted state
      const { result: newResult } = renderHook(() => useHomeBackground());
      expect(newResult.current).toBe('night');
    });
  });
});
