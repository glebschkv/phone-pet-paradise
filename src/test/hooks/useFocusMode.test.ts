import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFocusMode, SUGGESTED_APPS, SUGGESTED_WEBSITES } from '@/hooks/useFocusMode';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

// Mock DeviceActivity plugin
vi.mock('@/plugins/device-activity', () => ({
  DeviceActivity: {
    getBlockingStatus: vi.fn(() => Promise.resolve({ isBlocking: false, focusSessionActive: false })),
    startAppBlocking: vi.fn(() => Promise.resolve({ success: true })),
    stopAppBlocking: vi.fn(() => Promise.resolve({ success: true, shieldAttempts: 0 })),
    setSelectedApps: vi.fn(() => Promise.resolve()),
    clearSelectedApps: vi.fn(() => Promise.resolve()),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  focusModeLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useFocusMode', () => {
  const STORAGE_KEY = 'petIsland_focusMode';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default settings', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.enabled).toBe(true);
      expect(result.current.settings.strictMode).toBe(false);
      expect(result.current.settings.blockNotifications).toBe(true);
      expect(result.current.settings.allowEmergencyBypass).toBe(true);
    });

    it('should load saved settings from localStorage', async () => {
      const savedSettings = {
        enabled: false,
        strictMode: true,
        blockNotifications: false,
        blockedApps: [],
        blockedWebsites: [],
        allowEmergencyBypass: false,
        bypassCooldown: 60,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSettings));

      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.enabled).toBe(false);
      expect(result.current.settings.strictMode).toBe(true);
      expect(result.current.settings.blockNotifications).toBe(false);
      expect(result.current.settings.allowEmergencyBypass).toBe(false);
    });

    it('should handle invalid localStorage data', async () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should use defaults
      expect(result.current.settings.enabled).toBe(true);
    });

    it('should include suggested apps in default blocked apps', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.blockedApps.length).toBe(SUGGESTED_APPS.length);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ strictMode: true });
      });

      expect(result.current.settings.strictMode).toBe(true);
    });

    it('should save settings to localStorage', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ bypassCooldown: 120 });
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.bypassCooldown).toBe(120);
    });

    it('should preserve other settings when updating one', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ strictMode: true });
      });

      expect(result.current.settings.enabled).toBe(true); // Default preserved
      expect(result.current.settings.strictMode).toBe(true); // Updated
    });
  });

  describe('toggleAppBlocking', () => {
    it('should toggle app blocking status', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const instagramApp = result.current.settings.blockedApps.find(a => a.id === 'instagram');
      const initialBlocked = instagramApp?.isBlocked;

      act(() => {
        result.current.toggleAppBlocking('instagram', !initialBlocked);
      });

      const updatedApp = result.current.settings.blockedApps.find(a => a.id === 'instagram');
      expect(updatedApp?.isBlocked).toBe(!initialBlocked);
    });

    it('should update blocked apps count', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.blockedAppsCount;

      // Toggle an unblocked app to blocked
      const unblockedApp = result.current.settings.blockedApps.find(a => !a.isBlocked);
      if (unblockedApp) {
        act(() => {
          result.current.toggleAppBlocking(unblockedApp.id, true);
        });

        expect(result.current.blockedAppsCount).toBe(initialCount + 1);
      }
    });

    it('should persist to localStorage', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleAppBlocking('youtube', true);
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      const youtubeApp = parsed.blockedApps.find((a: any) => a.id === 'youtube');
      expect(youtubeApp?.isBlocked).toBe(true);
    });
  });

  describe('addBlockedWebsite', () => {
    it('should add website to blocked list', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.settings.blockedWebsites.length;

      act(() => {
        result.current.addBlockedWebsite('newsite.com');
      });

      expect(result.current.settings.blockedWebsites.length).toBe(initialCount + 1);
      expect(result.current.settings.blockedWebsites).toContain('newsite.com');
    });

    it('should normalize website URL', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addBlockedWebsite('https://www.example.com/');
      });

      expect(result.current.settings.blockedWebsites).toContain('example.com');
    });

    it('should not add duplicate websites', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // instagram.com is in defaults
      const initialCount = result.current.settings.blockedWebsites.length;

      act(() => {
        result.current.addBlockedWebsite('instagram.com');
      });

      expect(result.current.settings.blockedWebsites.length).toBe(initialCount);
    });

    it('should not add empty website', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.settings.blockedWebsites.length;

      act(() => {
        result.current.addBlockedWebsite('');
      });

      expect(result.current.settings.blockedWebsites.length).toBe(initialCount);
    });
  });

  describe('removeBlockedWebsite', () => {
    it('should remove website from blocked list', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.settings.blockedWebsites.length;

      act(() => {
        result.current.removeBlockedWebsite('instagram.com');
      });

      expect(result.current.settings.blockedWebsites.length).toBe(initialCount - 1);
      expect(result.current.settings.blockedWebsites).not.toContain('instagram.com');
    });

    it('should handle non-existent website gracefully', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.settings.blockedWebsites.length;

      act(() => {
        result.current.removeBlockedWebsite('nonexistent.com');
      });

      expect(result.current.settings.blockedWebsites.length).toBe(initialCount);
    });
  });

  describe('activateFocusMode', () => {
    it('should activate focus mode', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.activateFocusMode();
      });

      expect(result.current.isFocusModeActive).toBe(true);
    });

    it('should not activate if disabled in settings', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: false }));

      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.activateFocusMode();
      });

      expect(result.current.isFocusModeActive).toBe(false);
    });
  });

  describe('deactivateFocusMode', () => {
    it('should deactivate focus mode', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First activate
      await act(async () => {
        await result.current.activateFocusMode();
      });

      expect(result.current.isFocusModeActive).toBe(true);

      // Then deactivate
      await act(async () => {
        await result.current.deactivateFocusMode();
      });

      expect(result.current.isFocusModeActive).toBe(false);
    });

    it('should return success result', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let deactivateResult: any;
      await act(async () => {
        deactivateResult = await result.current.deactivateFocusMode();
      });

      expect(deactivateResult).toEqual({ success: true, shieldAttempts: 0 });
    });
  });

  describe('getBlockedApps', () => {
    it('should return only blocked apps', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const blockedApps = result.current.getBlockedApps();

      blockedApps.forEach(app => {
        expect(app.isBlocked).toBe(true);
      });
    });

    it('should update when apps are toggled', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialBlocked = result.current.getBlockedApps().length;

      // Toggle youtube to blocked
      act(() => {
        result.current.toggleAppBlocking('youtube', true);
      });

      expect(result.current.getBlockedApps().length).toBe(initialBlocked + 1);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings to defaults', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Modify settings
      act(() => {
        result.current.updateSettings({
          strictMode: true,
          bypassCooldown: 999,
        });
      });

      expect(result.current.settings.strictMode).toBe(true);

      // Reset
      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.settings.strictMode).toBe(false);
      expect(result.current.settings.bypassCooldown).toBe(30);
    });

    it('should persist reset to localStorage', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ strictMode: true });
      });

      act(() => {
        result.current.resetToDefaults();
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      expect(parsed.strictMode).toBe(false);
    });
  });

  describe('blockedAppsCount', () => {
    it('should return correct count', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const expectedCount = result.current.settings.blockedApps.filter(a => a.isBlocked).length;
      expect(result.current.blockedAppsCount).toBe(expectedCount);
    });

    it('should update when apps are toggled', async () => {
      const { result } = renderHook(() => useFocusMode());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.blockedAppsCount;

      // Unblock an app
      const blockedApp = result.current.settings.blockedApps.find(a => a.isBlocked);
      if (blockedApp) {
        act(() => {
          result.current.toggleAppBlocking(blockedApp.id, false);
        });

        expect(result.current.blockedAppsCount).toBe(initialCount - 1);
      }
    });
  });

  describe('suggested constants', () => {
    it('should export SUGGESTED_APPS', () => {
      expect(SUGGESTED_APPS).toBeDefined();
      expect(SUGGESTED_APPS.length).toBeGreaterThan(0);
    });

    it('should export SUGGESTED_WEBSITES', () => {
      expect(SUGGESTED_WEBSITES).toBeDefined();
      expect(SUGGESTED_WEBSITES.length).toBeGreaterThan(0);
    });

    it('should have valid app structure', () => {
      SUGGESTED_APPS.forEach(app => {
        expect(app.id).toBeDefined();
        expect(app.name).toBeDefined();
        expect(app.icon).toBeDefined();
        expect(typeof app.isBlocked).toBe('boolean');
      });
    });
  });
});
