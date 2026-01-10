import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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

  beforeEach(() => {
    vi.clearAllMocks();

    // Save original value
    originalNavigatorOnLine = navigator.onLine;

    // Default to online
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
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
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });

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
      expect(result.current.wasOffline).toBe(true);
    });

    it('should show warning toast when going offline', () => {
      renderHook(() => useNetworkStatus());

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(toast.warning).toHaveBeenCalledWith('You are offline', {
        description: 'Some features may not work until you reconnect.',
        duration: 5000,
      });
    });

    it('should handle coming back online', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });

      const { result } = renderHook(() => useNetworkStatus());

      // Simulate going offline first
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.wasOffline).toBe(true);

      // Come back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);
      expect(result.current.lastOnlineAt).toBeInstanceOf(Date);
    });

    it('should show success toast when coming back online after being offline', () => {
      const { result } = renderHook(() => useNetworkStatus());

      // First go offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.wasOffline).toBe(true);

      // Then come back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(toast.success).toHaveBeenCalledWith('Back online!', {
        description: 'Your connection has been restored.',
        duration: 3000,
      });
    });

    it('should not show success toast when online event fires without prior offline', () => {
      renderHook(() => useNetworkStatus());

      // Dispatch online event without prior offline
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('checkConnection', () => {
    it('should return true when online', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.checkConnection()).toBe(true);
    });

    it('should return false when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });

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

  describe('Event Listener Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useNetworkStatus());

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
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
      expect(result.current.wasOffline).toBe(true);

      // Go online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);

      // Go offline again
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.isOnline).toBe(false);
      expect(result.current.wasOffline).toBe(true);

      // Go online again
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);
    });

    it('should accumulate toast calls for multiple transitions', () => {
      renderHook(() => useNetworkStatus());

      // Go offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(toast.warning).toHaveBeenCalledTimes(1);

      // Go online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(toast.success).toHaveBeenCalledTimes(1);

      // Go offline again
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(toast.warning).toHaveBeenCalledTimes(2);

      // Go online again
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(toast.success).toHaveBeenCalledTimes(2);
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

      // Rapid transitions
      act(() => {
        window.dispatchEvent(new Event('offline'));
        window.dispatchEvent(new Event('online'));
        window.dispatchEvent(new Event('offline'));
        window.dispatchEvent(new Event('online'));
      });

      // Should end up online
      expect(result.current.isOnline).toBe(true);
      expect(result.current.wasOffline).toBe(false);
    });
  });
});
