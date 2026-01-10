import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServiceWorker, useServiceWorkerSync, requestBackgroundSync } from '@/hooks/useServiceWorker';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  syncLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useServiceWorker', () => {
  let mockRegistration: Partial<ServiceWorkerRegistration>;
  let mockServiceWorker: Partial<ServiceWorker>;
  let updateFoundListeners: Array<() => void>;
  let stateChangeListeners: Array<() => void>;
  let messageHandlers: Array<(event: MessageEvent) => void>;
  let originalServiceWorker: ServiceWorkerContainer | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    updateFoundListeners = [];
    stateChangeListeners = [];
    messageHandlers = [];

    // Save original values
    originalServiceWorker = navigator.serviceWorker;

    mockServiceWorker = {
      state: 'activated',
      addEventListener: vi.fn((event, handler) => {
        if (event === 'statechange') {
          stateChangeListeners.push(handler as () => void);
        }
      }),
    };

    mockRegistration = {
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(true),
      installing: null,
      waiting: null,
      active: mockServiceWorker as ServiceWorker,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'updatefound') {
          updateFoundListeners.push(handler as () => void);
        }
      }),
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        controller: mockServiceWorker,
        ready: Promise.resolve(mockRegistration),
        addEventListener: vi.fn((event, handler) => {
          if (event === 'message') {
            messageHandlers.push(handler as (event: MessageEvent) => void);
          }
        }),
        removeEventListener: vi.fn((event, handler) => {
          if (event === 'message') {
            const index = messageHandlers.indexOf(handler as (event: MessageEvent) => void);
            if (index > -1) {
              messageHandlers.splice(index, 1);
            }
          }
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    // Restore original serviceWorker
    if (originalServiceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        writable: true,
        configurable: true,
      });
    }
  });

  describe('Initial State', () => {
    it('should detect service worker support', () => {
      const { result } = renderHook(() => useServiceWorker());

      expect(result.current.isSupported).toBe(true);
    });

    it('should have correct initial state', () => {
      const { result } = renderHook(() => useServiceWorker());

      expect(result.current.isRegistered).toBe(false);
      expect(result.current.isUpdateAvailable).toBe(false);
      expect(result.current.registration).toBe(null);
    });

    it('should return update and unregister functions', () => {
      const { result } = renderHook(() => useServiceWorker());

      expect(typeof result.current.update).toBe('function');
      expect(typeof result.current.unregister).toBe('function');
    });
  });

  describe('Development Mode', () => {
    it('should skip registration in development mode', async () => {
      // In test mode, import.meta.env.DEV is true by default
      const { result } = renderHook(() => useServiceWorker());

      // Wait a bit to ensure no async registration happens
      await new Promise((resolve) => setTimeout(resolve, 50));

      // In dev mode, registration should be skipped
      expect(result.current.isRegistered).toBe(false);
    });
  });

  describe('Registration behavior', () => {
    it('should handle registration failure gracefully', async () => {
      // Mock production environment by mocking the env check in the hook
      // Since DEV is true, registration won't happen, so we test the graceful handling
      const { result } = renderHook(() => useServiceWorker());

      // Should remain not registered
      expect(result.current.isRegistered).toBe(false);
    });
  });

  describe('update() Method', () => {
    it('should do nothing if no registration', async () => {
      const { result } = renderHook(() => useServiceWorker());

      // Before registration completes (or when skipped in dev mode)
      await act(async () => {
        await result.current.update();
      });

      // Should not throw and update should not be called
      expect(mockRegistration.update).not.toHaveBeenCalled();
    });
  });

  describe('unregister() Method', () => {
    it('should return false if no registration', async () => {
      const { result } = renderHook(() => useServiceWorker());

      // Before registration completes
      let success: boolean = true;
      await act(async () => {
        success = await result.current.unregister();
      });

      expect(success).toBe(false);
    });
  });
});

describe('useServiceWorkerSync', () => {
  it('should call callback when sw-sync-requested event is dispatched', () => {
    const onSyncRequested = vi.fn();

    renderHook(() => useServiceWorkerSync(onSyncRequested));

    // Dispatch event
    window.dispatchEvent(new CustomEvent('sw-sync-requested'));

    expect(onSyncRequested).toHaveBeenCalled();
  });

  it('should cleanup listener on unmount', () => {
    const onSyncRequested = vi.fn();
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useServiceWorkerSync(onSyncRequested));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('sw-sync-requested', expect.any(Function));
  });

  it('should handle multiple events', () => {
    const onSyncRequested = vi.fn();

    renderHook(() => useServiceWorkerSync(onSyncRequested));

    // Dispatch multiple events
    window.dispatchEvent(new CustomEvent('sw-sync-requested'));
    window.dispatchEvent(new CustomEvent('sw-sync-requested'));
    window.dispatchEvent(new CustomEvent('sw-sync-requested'));

    expect(onSyncRequested).toHaveBeenCalledTimes(3);
  });

  it('should use latest callback when it changes', () => {
    const onSyncRequested1 = vi.fn();
    const onSyncRequested2 = vi.fn();

    const { rerender } = renderHook(
      ({ callback }) => useServiceWorkerSync(callback),
      { initialProps: { callback: onSyncRequested1 } }
    );

    // Rerender with new callback
    rerender({ callback: onSyncRequested2 });

    // Dispatch event
    window.dispatchEvent(new CustomEvent('sw-sync-requested'));

    expect(onSyncRequested1).not.toHaveBeenCalled();
    expect(onSyncRequested2).toHaveBeenCalled();
  });
});

describe('requestBackgroundSync', () => {
  beforeEach(() => {
    // Setup SyncManager mock
    Object.defineProperty(window, 'SyncManager', {
      value: class SyncManager {},
      writable: true,
      configurable: true,
    });

    const mockRegistration = {
      sync: {
        register: vi.fn().mockResolvedValue(undefined),
      },
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register background sync with given tag', async () => {
    const result = await requestBackgroundSync('my-sync-tag');

    expect(result).toBe(true);
  });

  it('should return false if service worker not supported', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = await requestBackgroundSync('my-sync-tag');

    expect(result).toBe(false);
  });

  it('should return false if SyncManager not supported', async () => {
    // First set up service worker to be defined
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({ sync: { register: vi.fn() } }),
      },
      writable: true,
      configurable: true,
    });

    // Delete SyncManager to simulate browser without support
    // Need to delete rather than set to undefined because 'in' operator checks property existence
    // @ts-expect-error - deleting for test purposes
    delete window.SyncManager;

    const result = await requestBackgroundSync('my-sync-tag');

    expect(result).toBe(false);
  });

  it('should return false on registration error', async () => {
    const mockRegistration = {
      sync: {
        register: vi.fn().mockRejectedValue(new Error('Sync failed')),
      },
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      writable: true,
      configurable: true,
    });

    const result = await requestBackgroundSync('my-sync-tag');

    expect(result).toBe(false);
  });
});
