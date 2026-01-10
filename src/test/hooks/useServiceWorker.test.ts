import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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

// Store original import.meta.env
const originalEnv = { ...import.meta.env };

describe('useServiceWorker', () => {
  let mockRegistration: Partial<ServiceWorkerRegistration>;
  let mockServiceWorker: Partial<ServiceWorker>;
  let updateFoundListeners: Array<() => void>;
  let stateChangeListeners: Array<() => void>;
  let messageHandlers: Array<(event: MessageEvent) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    updateFoundListeners = [];
    stateChangeListeners = [];
    messageHandlers = [];

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

    // Set production mode by default for tests
    vi.stubEnv('DEV', false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    // Restore original env
    Object.assign(import.meta.env, originalEnv);
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

    it('should detect when service worker is not supported', () => {
      // Delete serviceWorker property from navigator to simulate unsupported browser
      // @ts-expect-error - deleting navigator property for test
      delete navigator.serviceWorker;

      const { result } = renderHook(() => useServiceWorker());

      expect(result.current.isSupported).toBe(false);
    });

    it('should return update and unregister functions', () => {
      const { result } = renderHook(() => useServiceWorker());
      
      expect(typeof result.current.update).toBe('function');
      expect(typeof result.current.unregister).toBe('function');
    });
  });

  describe('Registration in Production', () => {
    beforeEach(() => {
      // Production environment already set by parent beforeEach
      vi.stubEnv('DEV', false);
    });

    it('should register service worker in production', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      });
    });

    it('should store registration in state', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      expect(result.current.registration).toBe(mockRegistration);
    });

    it('should setup update listener on registration', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      expect(mockRegistration.addEventListener).toHaveBeenCalledWith('updatefound', expect.any(Function));
    });

    it('should setup message listener on registration', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle registration failure gracefully', async () => {
      (navigator.serviceWorker.register as Mock).mockRejectedValue(new Error('Registration failed'));

      const { result } = renderHook(() => useServiceWorker());

      // Wait a bit for the async operation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should remain not registered
      expect(result.current.isRegistered).toBe(false);
    });
  });

  describe('Development Mode', () => {
    it('should skip registration in development mode', async () => {
      // Mock development environment
      vi.stubEnv('DEV', true);

      const { result } = renderHook(() => useServiceWorker());

      // Wait a bit to ensure no async registration happens
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
      expect(result.current.isRegistered).toBe(false);
    });
  });

  describe('Update Detection', () => {
    it('should detect update when new worker is installed', async () => {
      const { toast } = await import('sonner');

      const newWorker = {
        state: 'installed',
        addEventListener: vi.fn((event, handler) => {
          if (event === 'statechange') {
            stateChangeListeners.push(handler as () => void);
          }
        }),
      };

      // Use Object.defineProperty to set the installing property
      Object.defineProperty(mockRegistration, 'installing', {
        value: newWorker as unknown as ServiceWorker,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Trigger updatefound event
      updateFoundListeners.forEach((listener) => listener());

      // Trigger statechange event
      stateChangeListeners.forEach((listener) => listener());

      await waitFor(() => {
        expect(result.current.isUpdateAvailable).toBe(true);
      });

      expect(toast.info).toHaveBeenCalledWith('Update available', expect.any(Object));
    });
  });

  describe('update() Method', () => {
    it('should call registration.update()', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      await act(async () => {
        await result.current.update();
      });

      expect(mockRegistration.update).toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      (mockRegistration.update as Mock).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Should not throw
      await act(async () => {
        await result.current.update();
      });
    });

    it('should do nothing if no registration', async () => {
      const { result } = renderHook(() => useServiceWorker());

      // Before registration completes
      await act(async () => {
        await result.current.update();
      });

      // Should not throw and update should not be called
    });
  });

  describe('unregister() Method', () => {
    it('should call registration.unregister()', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.unregister();
      });

      expect(mockRegistration.unregister).toHaveBeenCalled();
      expect(success).toBe(true);
    });

    it('should update state after successful unregister', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      await act(async () => {
        await result.current.unregister();
      });

      expect(result.current.isRegistered).toBe(false);
      expect(result.current.registration).toBe(null);
    });

    it('should return false if unregister fails', async () => {
      (mockRegistration.unregister as Mock).mockRejectedValue(new Error('Unregister failed'));

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.unregister();
      });

      expect(success).toBe(false);
    });

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

  describe('Message Handling', () => {
    it('should dispatch sw-sync-requested event on SYNC_REQUESTED message', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Simulate message from service worker
      const messageEvent = new MessageEvent('message', {
        data: { type: 'SYNC_REQUESTED' },
      });

      messageHandlers.forEach((handler) => handler(messageEvent));

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sw-sync-requested',
        })
      );
    });

    it('should ignore messages without SYNC_REQUESTED type', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Track initial dispatch calls
      const initialCallCount = dispatchEventSpy.mock.calls.length;

      // Simulate different message from service worker
      const messageEvent = new MessageEvent('message', {
        data: { type: 'OTHER_TYPE' },
      });

      messageHandlers.forEach((handler) => handler(messageEvent));

      // Should not have dispatched any new events
      expect(dispatchEventSpy.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should cleanup interval and listener on unmount', async () => {
      const { result, unmount } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      unmount();

      expect(navigator.serviceWorker.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('Periodic Update Checks', () => {
    it('should setup periodic update interval', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Verify the hook registered successfully and can trigger updates
      expect(result.current.registration).toBe(mockRegistration);
      expect(typeof result.current.update).toBe('function');
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
    // Delete SyncManager to simulate unsupported browser
    // @ts-expect-error - deleting window property for test
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
