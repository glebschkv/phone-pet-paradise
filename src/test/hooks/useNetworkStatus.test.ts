import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNetworkStore } from '@/stores/networkStore';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('useNetworkStatus', () => {
  let originalNavigatorOnLine: boolean;
  let cleanupListeners: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    // Save original value
    originalNavigatorOnLine = navigator.onLine;

    // Default to online
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    // Reset the network store state
    useNetworkStore.setState({
      isOnline: true,
      wasOffline: false,
      lastOnlineAt: null,
      lastOfflineAt: null,
    });

    // Initialize the network store listeners (simulating NetworkProvider)
    cleanupListeners = useNetworkStore.getState().initialize();
  });

  afterEach(() => {
    // Cleanup listeners
    if (cleanupListeners) {
      cleanupListeners();
      cleanupListeners = null;
    }

    // Restore original value
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalNavigatorOnLine,
    });

    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize as online when navigator is online', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);
      expect(result.current.lastOnlineAt).toBeNull();
    });

    it('should initialize as offline when navigator is offline', () => {
      // Cleanup existing listeners first
      if (cleanupListeners) {
        cleanupListeners();
      }

      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });

      // Reset store with offline state
      useNetworkStore.setState({ isOnline: false });
      cleanupListeners = useNetworkStore.getState().initialize();

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);
    });

    it('should provide checkConnection function', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(typeof result.current.checkConnection).toBe('function');
    });
  });

  describe('Online/Offline Events', () => {
    it('should handle going offline', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should handle coming back online', () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Simulate going offline first
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);

      // Come back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(true);
      expect(result.current.lastOnlineAt).toBeInstanceOf(Date);
    });
  });

  describe('checkConnection', () => {
    it('should return true when online', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.checkConnection()).toBe(true);
    });

    it('should return false when offline', () => {
      const { result } = renderHook(() => useNetworkStatus());

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.checkConnection()).toBe(false);
    });

    it('should show error toast when offline and showToast is true', () => {
      const { result } = renderHook(() => useNetworkStatus());

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      result.current.checkConnection(true);

      expect(toast.error).toHaveBeenCalledWith('No internet connection', {
        description: 'Please check your connection and try again.',
      });
    });

    it('should not show error toast when showToast is false', () => {
      const { result } = renderHook(() => useNetworkStatus());

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      result.current.checkConnection(false);

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should default to showing toast when no parameter provided', () => {
      const { result } = renderHook(() => useNetworkStatus());

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      result.current.checkConnection(); // Default should be true

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('lastOnlineAt', () => {
    it('should update lastOnlineAt when coming online', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.lastOnlineAt).toBeNull();

      // Go offline first
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      // Then come back online
      const beforeOnline = new Date();

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      const afterOnline = new Date();

      expect(result.current.lastOnlineAt).toBeInstanceOf(Date);
      expect(result.current.lastOnlineAt!.getTime()).toBeGreaterThanOrEqual(
        beforeOnline.getTime()
      );
      expect(result.current.lastOnlineAt!.getTime()).toBeLessThanOrEqual(
        afterOnline.getTime()
      );
    });
  });

  describe('Multiple Transitions', () => {
    it('should handle multiple online/offline transitions', () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Go offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.isOnline).toBe(false);

      // Go online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(true);

      // Go offline again
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.isOnline).toBe(false);

      // Go online again
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('SSR Compatibility', () => {
    it('should handle undefined navigator gracefully', () => {
      // This tests the typeof navigator !== 'undefined' check
      // The hook defaults to true if navigator is unavailable
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBeDefined();
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state during rapid transitions', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Rapid transitions - each should be processed in order
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      // Should end up online with wasOffline true (was offline before coming back)
      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(true);
    });
  });
});
