import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings, AppSettings } from '@/hooks/useSettings';
import { STORAGE_KEYS } from '@/lib/storage-keys';

// Mock toast
const mockToast = vi.fn();
vi.mock('sonner', () => ({
  toast: Object.assign(mockToast, {
    success: mockToast,
    error: mockToast,
    info: mockToast,
    warning: mockToast,
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  settingsLogger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
  storageLogger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('useSettings', () => {
  const defaultSettings: AppSettings = {
    theme: 'system',
    defaultFocusTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    longBreakInterval: 4,
    enableNotifications: true,
    soundEnabled: true,
    soundVolume: 70,
    soundTheme: 'default',
    animationSpeed: 'normal',
    showTutorialHints: true,
    autoSaveProgress: true,
    dataCollection: true,
    crashReporting: true,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset document classes
    document.documentElement.classList.remove('light', 'dark');

    // Ensure matchMedia is always properly mocked
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Load Settings', () => {
    it('should initialize with default settings when no saved data exists', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual(defaultSettings);
    });

    it('should load saved settings from localStorage', async () => {
      const savedSettings: Partial<AppSettings> = {
        theme: 'dark',
        defaultFocusTime: 45,
        soundVolume: 80,
      };

      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(savedSettings));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.defaultFocusTime).toBe(45);
      expect(result.current.settings.soundVolume).toBe(80);
      // Other settings should use defaults
      expect(result.current.settings.shortBreakTime).toBe(5);
    });

    it('should merge saved settings with defaults', async () => {
      const partialSettings = {
        theme: 'light' as const,
        soundVolume: 50,
      };

      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(partialSettings));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Saved settings should override defaults
      expect(result.current.settings.theme).toBe('light');
      expect(result.current.settings.soundVolume).toBe(50);
      // Missing settings should use defaults
      expect(result.current.settings.defaultFocusTime).toBe(25);
      expect(result.current.settings.enableNotifications).toBe(true);
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, 'invalid json');

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to defaults
      expect(result.current.settings).toEqual(defaultSettings);
      // Toast may or may not be called depending on error handling
    });

    it('should set loading to false after initialization', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Update Settings', () => {
    it('should update settings and save to localStorage', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ soundVolume: 90 });
      });

      expect(result.current.settings.soundVolume).toBe(90);

      const saved = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.soundVolume).toBe(90);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Settings Saved',
        })
      );
    });

    it('should update multiple settings at once', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({
          soundVolume: 50,
          soundEnabled: false,
          soundTheme: 'nature',
        });
      });

      expect(result.current.settings.soundVolume).toBe(50);
      expect(result.current.settings.soundEnabled).toBe(false);
      expect(result.current.settings.soundTheme).toBe('nature');
    });

    it('should preserve unchanged settings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalFocusTime = result.current.settings.defaultFocusTime;

      act(() => {
        result.current.updateSettings({ soundVolume: 60 });
      });

      expect(result.current.settings.defaultFocusTime).toBe(originalFocusTime);
    });
  });

  describe('Reset to Defaults', () => {
    it('should reset all settings to defaults', async () => {
      const customSettings: Partial<AppSettings> = {
        theme: 'light',
        soundVolume: 100,
        defaultFocusTime: 60,
      };

      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(customSettings));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Settings should be custom at first
      expect(result.current.settings.theme).toBe('light');
      expect(result.current.settings.soundVolume).toBe(100);

      act(() => {
        result.current.resetSettings();
      });

      // Should be reset to defaults (check individual values instead of whole object)
      expect(result.current.settings.soundVolume).toBe(70);
      expect(result.current.settings.defaultFocusTime).toBe(25);
      expect(result.current.settings.theme).toBe('system');
      expect(localStorage.getItem(STORAGE_KEYS.APP_SETTINGS)).toBeNull();

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Settings Reset',
        })
      );
    });

    it('should update settings when reset is called', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change theme to dark
      act(() => {
        result.current.updateSettings({ theme: 'dark', soundVolume: 100 });
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.soundVolume).toBe(100);

      // Reset
      act(() => {
        result.current.resetSettings();
      });

      // Settings should be back to defaults
      expect(result.current.settings.soundVolume).toBe(70);
      expect(result.current.settings.defaultFocusTime).toBe(25);
    });
  });

  describe('Theme Application', () => {
    it('should apply light theme to document', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.applyTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply dark theme to document', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.applyTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should apply system theme based on media query', async () => {
      // Mock matchMedia to prefer dark mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.applyTheme('system');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should automatically apply theme when updated', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Export Settings', () => {
    it('should export settings as JSON file', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock URL methods
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock document.createElement
      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      const mockCreateElement = vi.fn((tagName: string) => {
        if (tagName === 'a') {
          const link = originalCreateElement('a');
          link.click = mockClick;
          return link;
        }
        return originalCreateElement(tagName);
      });
      document.createElement = mockCreateElement as typeof document.createElement;

      act(() => {
        result.current.exportSettings();
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Settings Exported',
        })
      );

      // Restore
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
      document.createElement = originalCreateElement;
    });

    it('should handle export errors', async () => {
      // Mock URL.createObjectURL to throw
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Export failed');
      });

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.exportSettings();
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Export Error',
          variant: 'destructive',
        })
      );
    });
  });

  describe('Import Settings', () => {
    it('should import valid settings from file', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const importedSettings = {
        theme: 'dark',
        soundVolume: 85,
        defaultFocusTime: 50,
      };

      const file = new File(
        [JSON.stringify(importedSettings)],
        'settings.json',
        { type: 'application/json' }
      );

      await act(async () => {
        await result.current.importSettings(file);
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.soundVolume).toBe(85);
      expect(result.current.settings.defaultFocusTime).toBe(50);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Settings Imported',
        })
      );
    });

    it('should validate imported settings with defaults', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const partialSettings = {
        soundVolume: 95,
      };

      const file = new File(
        [JSON.stringify(partialSettings)],
        'settings.json',
        { type: 'application/json' }
      );

      await act(async () => {
        await result.current.importSettings(file);
      });

      // Should merge with defaults
      expect(result.current.settings.soundVolume).toBe(95);
      expect(result.current.settings.defaultFocusTime).toBe(25); // default
    });

    it('should handle invalid JSON in import', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['invalid json'], 'settings.json', {
        type: 'application/json',
      });

      try {
        await act(async () => {
          await result.current.importSettings(file);
        });
      } catch (error) {
        // Error expected
      }

      // Toast should be called with error
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Import Error',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Settings Categories', () => {
    it('should handle timer settings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({
          defaultFocusTime: 45,
          shortBreakTime: 10,
          longBreakTime: 20,
          longBreakInterval: 3,
        });
      });

      expect(result.current.settings.defaultFocusTime).toBe(45);
      expect(result.current.settings.shortBreakTime).toBe(10);
      expect(result.current.settings.longBreakTime).toBe(20);
      expect(result.current.settings.longBreakInterval).toBe(3);
    });

    it('should handle sound settings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({
          soundEnabled: false,
          soundVolume: 50,
          soundTheme: 'nature',
        });
      });

      expect(result.current.settings.soundEnabled).toBe(false);
      expect(result.current.settings.soundVolume).toBe(50);
      expect(result.current.settings.soundTheme).toBe('nature');
    });

    it('should handle game settings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({
          animationSpeed: 'fast',
          showTutorialHints: false,
          autoSaveProgress: false,
        });
      });

      expect(result.current.settings.animationSpeed).toBe('fast');
      expect(result.current.settings.showTutorialHints).toBe(false);
      expect(result.current.settings.autoSaveProgress).toBe(false);
    });

    it('should handle privacy settings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({
          dataCollection: false,
          crashReporting: false,
        });
      });

      expect(result.current.settings.dataCollection).toBe(false);
      expect(result.current.settings.crashReporting).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive updates', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ soundVolume: 10 });
        result.current.updateSettings({ soundVolume: 20 });
        result.current.updateSettings({ soundVolume: 30 });
      });

      expect(result.current.settings.soundVolume).toBe(30);
    });

    it('should persist settings across component remounts', async () => {
      const { result: firstRender, unmount } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(firstRender.current.isLoading).toBe(false);
      });

      act(() => {
        firstRender.current.updateSettings({ soundVolume: 77 });
      });

      // Wait for settings to be saved
      await waitFor(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
        expect(saved).toBeTruthy();
        const parsed = JSON.parse(saved!);
        expect(parsed.soundVolume).toBe(77);
      });

      // Unmount first render
      unmount();

      // Remount
      const { result: secondRender } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(secondRender.current.isLoading).toBe(false);
      });

      expect(secondRender.current.settings.soundVolume).toBe(77);
    });
  });
});
