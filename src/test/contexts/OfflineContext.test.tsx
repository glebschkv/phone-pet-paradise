import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  OfflineProvider,
  useOffline,
  useIsOnline,
  useHasPendingSync,
  useSyncStatus,
} from '@/contexts/OfflineContext';

// Mock dependencies
vi.mock('@/hooks/useOfflineSyncManager', () => ({
  useOfflineSyncManager: vi.fn(),
}));

vi.mock('@/hooks/useServiceWorker', () => ({
  useServiceWorker: vi.fn(),
  useServiceWorkerSync: vi.fn(),
}));

vi.mock('@/stores/offlineSyncStore', () => ({
  useOfflineSyncStore: vi.fn(),
  SyncOperationType: {
    UPDATE_PROGRESS: 'UPDATE_PROGRESS',
    COMPLETE_SESSION: 'COMPLETE_SESSION',
    UPDATE_PET: 'UPDATE_PET',
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  syncLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { useOfflineSyncManager } from '@/hooks/useOfflineSyncManager';
import { useServiceWorker, useServiceWorkerSync } from '@/hooks/useServiceWorker';
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';
import { toast } from 'sonner';

// Test wrapper
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <OfflineProvider>{children}</OfflineProvider>;
  };
}

describe('OfflineContext', () => {
  const mockSyncManager = {
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    syncNow: vi.fn().mockResolvedValue(undefined),
    queueOperation: vi.fn(),
  };

  const mockServiceWorker = {
    isSupported: true,
    isRegistered: true,
    isUpdateAvailable: false,
    registration: null,
    update: vi.fn(),
    unregister: vi.fn(),
  };

  const mockOfflineStore = {
    isOnline: true,
    pendingOperations: [],
    setOnline: vi.fn(),
  };

  let serviceWorkerSyncCallback: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    serviceWorkerSyncCallback = null;

    // Setup default mocks
    vi.mocked(useOfflineSyncManager).mockReturnValue(mockSyncManager);
    vi.mocked(useServiceWorker).mockReturnValue(mockServiceWorker);
    vi.mocked(useOfflineSyncStore).mockReturnValue(mockOfflineStore as any);
    vi.mocked(useServiceWorkerSync).mockImplementation((callback) => {
      serviceWorkerSyncCallback = callback;
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OfflineProvider', () => {
    it('should render children', () => {
      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
    });

    it('should provide all context values', () => {
      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Network status
      expect(result.current).toHaveProperty('isOnline');
      expect(result.current).toHaveProperty('wasOffline');

      // Sync status
      expect(result.current).toHaveProperty('isSyncing');
      expect(result.current).toHaveProperty('pendingCount');
      expect(result.current).toHaveProperty('lastSyncAt');
      expect(result.current).toHaveProperty('hasPendingSync');

      // Service worker status
      expect(result.current).toHaveProperty('isServiceWorkerReady');
      expect(result.current).toHaveProperty('isUpdateAvailable');

      // Actions
      expect(typeof result.current.syncNow).toBe('function');
      expect(typeof result.current.queueOperation).toBe('function');
      expect(typeof result.current.refreshApp).toBe('function');
    });

    it('should set initial online state from navigator.onLine', () => {
      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(mockOfflineStore.setOnline).toHaveBeenCalledWith(true);
    });

    it('should register event listeners for online/offline', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Network Status Integration', () => {
    it('should reflect online status from store', () => {
      vi.mocked(useOfflineSyncStore).mockReturnValue({
        ...mockOfflineStore,
        isOnline: true,
      } as any);

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('should reflect offline status from store', () => {
      vi.mocked(useOfflineSyncStore).mockReturnValue({
        ...mockOfflineStore,
        isOnline: false,
      } as any);

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should handle going offline', async () => {
      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Simulate offline event
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(mockOfflineStore.setOnline).toHaveBeenCalledWith(false);
      expect(toast.warning).toHaveBeenCalledWith(
        "You're offline",
        expect.objectContaining({
          description: expect.stringContaining('saved locally'),
        })
      );
    });

    it('should handle coming back online', async () => {
      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Go offline first
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      // Then come back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(mockOfflineStore.setOnline).toHaveBeenCalledWith(true);
    });

    it('should show pending count when coming back online with pending operations', async () => {
      vi.mocked(useOfflineSyncStore).mockReturnValue({
        ...mockOfflineStore,
        pendingOperations: [{ id: '1' }, { id: '2' }, { id: '3' }],
      } as any);

      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Go offline first
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      // Then come back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Back online!',
        expect.objectContaining({
          description: expect.stringContaining('3 pending'),
        })
      );
    });
  });

  describe('Sync Manager Integration', () => {
    it('should expose isSyncing from sync manager', () => {
      vi.mocked(useOfflineSyncManager).mockReturnValue({
        ...mockSyncManager,
        isSyncing: true,
      });

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isSyncing).toBe(true);
    });

    it('should expose pendingCount from sync manager', () => {
      vi.mocked(useOfflineSyncManager).mockReturnValue({
        ...mockSyncManager,
        pendingCount: 5,
      });

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current.pendingCount).toBe(5);
      expect(result.current.hasPendingSync).toBe(true);
    });

    it('should expose lastSyncAt from sync manager', () => {
      const timestamp = Date.now();
      vi.mocked(useOfflineSyncManager).mockReturnValue({
        ...mockSyncManager,
        lastSyncAt: timestamp,
      });

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current.lastSyncAt).toBe(timestamp);
    });

    it('should call syncNow from sync manager', async () => {
      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSyncManager.syncNow).toHaveBeenCalled();
    });

    it('should call queueOperation from sync manager', () => {
      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.queueOperation('UPDATE_PROGRESS' as any, { xp: 100 });
      });

      expect(mockSyncManager.queueOperation).toHaveBeenCalledWith('UPDATE_PROGRESS', { xp: 100 });
    });
  });

  describe('Service Worker Integration', () => {
    it('should expose isServiceWorkerReady from service worker hook', () => {
      vi.mocked(useServiceWorker).mockReturnValue({
        ...mockServiceWorker,
        isRegistered: true,
      });

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    it('should expose isUpdateAvailable from service worker hook', () => {
      vi.mocked(useServiceWorker).mockReturnValue({
        ...mockServiceWorker,
        isUpdateAvailable: true,
      });

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isUpdateAvailable).toBe(true);
    });

    it('should register service worker sync callback', () => {
      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(useServiceWorkerSync).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should call syncNow when service worker requests sync', async () => {
      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Trigger the service worker sync callback
      expect(serviceWorkerSyncCallback).not.toBeNull();
      
      await act(async () => {
        serviceWorkerSyncCallback!();
      });

      expect(mockSyncManager.syncNow).toHaveBeenCalled();
    });
  });

  describe('refreshApp', () => {
    it('should reload the window', () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.refreshApp();
      });

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('useOffline hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useOffline());
      }).toThrow('useOffline must be used within an OfflineProvider');

      consoleSpy.mockRestore();
    });

    it('should return context value when inside provider', () => {
      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.isOnline).toBeDefined();
    });
  });

  describe('useIsOnline hook', () => {
    it('should return online status', () => {
      vi.mocked(useOfflineSyncStore).mockReturnValue({
        ...mockOfflineStore,
        isOnline: true,
      } as any);

      const { result } = renderHook(() => useIsOnline(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(true);
    });

    it('should return offline status', () => {
      vi.mocked(useOfflineSyncStore).mockReturnValue({
        ...mockOfflineStore,
        isOnline: false,
      } as any);

      const { result } = renderHook(() => useIsOnline(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(false);
    });
  });

  describe('useHasPendingSync hook', () => {
    it('should return false when no pending operations', () => {
      vi.mocked(useOfflineSyncManager).mockReturnValue({
        ...mockSyncManager,
        pendingCount: 0,
      });

      const { result } = renderHook(() => useHasPendingSync(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(false);
    });

    it('should return true when there are pending operations', () => {
      vi.mocked(useOfflineSyncManager).mockReturnValue({
        ...mockSyncManager,
        pendingCount: 3,
      });

      const { result } = renderHook(() => useHasPendingSync(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useSyncStatus hook', () => {
    it('should return sync status object', () => {
      const timestamp = Date.now();
      vi.mocked(useOfflineSyncManager).mockReturnValue({
        ...mockSyncManager,
        isSyncing: true,
        pendingCount: 5,
        lastSyncAt: timestamp,
      });

      const { result } = renderHook(() => useSyncStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toEqual({
        isSyncing: true,
        pendingCount: 5,
        lastSyncAt: timestamp,
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete offline -> online cycle', async () => {
      const pendingOps = [{ id: '1' }, { id: '2' }];
      
      vi.mocked(useOfflineSyncStore).mockReturnValue({
        ...mockOfflineStore,
        isOnline: true,
        pendingOperations: pendingOps,
      } as any);

      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // 1. Go offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(mockOfflineStore.setOnline).toHaveBeenCalledWith(false);
      expect(toast.warning).toHaveBeenCalled();

      // 2. Come back online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(mockOfflineStore.setOnline).toHaveBeenCalledWith(true);
      expect(toast.success).toHaveBeenCalledWith(
        'Back online!',
        expect.objectContaining({
          description: expect.stringContaining('2 pending'),
        })
      );
    });

    it('should handle service worker sync during offline recovery', async () => {
      vi.mocked(useOfflineSyncStore).mockReturnValue({
        ...mockOfflineStore,
        isOnline: true,
        pendingOperations: [{ id: '1' }],
      } as any);

      renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Come online
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      // Service worker requests sync
      await act(async () => {
        serviceWorkerSyncCallback!();
      });

      expect(mockSyncManager.syncNow).toHaveBeenCalled();
    });

    it('should queue operations while offline and sync when online', async () => {
      let currentOnlineState = true;
      
      vi.mocked(useOfflineSyncStore).mockImplementation(() => ({
        ...mockOfflineStore,
        isOnline: currentOnlineState,
        setOnline: (value: boolean) => {
          currentOnlineState = value;
        },
      } as any));

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Queue operation while "offline"
      act(() => {
        result.current.queueOperation('COMPLETE_SESSION' as any, { sessionId: 'test-123' });
      });

      expect(mockSyncManager.queueOperation).toHaveBeenCalledWith('COMPLETE_SESSION', { sessionId: 'test-123' });

      // Trigger sync
      await act(async () => {
        await result.current.syncNow();
      });

      expect(mockSyncManager.syncNow).toHaveBeenCalled();
    });

    it('should combine sync manager and service worker states correctly', () => {
      vi.mocked(useOfflineSyncManager).mockReturnValue({
        isSyncing: true,
        pendingCount: 3,
        lastSyncAt: 1234567890,
        syncNow: vi.fn(),
        queueOperation: vi.fn(),
      });

      vi.mocked(useServiceWorker).mockReturnValue({
        isSupported: true,
        isRegistered: true,
        isUpdateAvailable: true,
        registration: {} as any,
        update: vi.fn(),
        unregister: vi.fn(),
      });

      vi.mocked(useOfflineSyncStore).mockReturnValue({
        isOnline: false,
        pendingOperations: [{}, {}, {}],
        setOnline: vi.fn(),
      } as any);

      const { result } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Verify combined state
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isSyncing).toBe(true);
      expect(result.current.pendingCount).toBe(3);
      expect(result.current.hasPendingSync).toBe(true);
      expect(result.current.lastSyncAt).toBe(1234567890);
      expect(result.current.isServiceWorkerReady).toBe(true);
      expect(result.current.isUpdateAvailable).toBe(true);
    });
  });

  describe('Memoization', () => {
    it('should memoize context value when dependencies do not change', () => {
      const { result, rerender } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      const firstValue = result.current;

      // Rerender without changing dependencies
      rerender();

      // Value should be the same reference (memoized)
      expect(result.current).toBe(firstValue);
    });

    it('should update context value when sync manager changes', () => {
      const { result, rerender } = renderHook(() => useOffline(), {
        wrapper: createWrapper(),
      });

      // Change sync manager state
      vi.mocked(useOfflineSyncManager).mockReturnValue({
        ...mockSyncManager,
        isSyncing: true,
      });

      // Rerender
      rerender();

      // Value should be different (new object due to changed deps)
      expect(result.current.isSyncing).toBe(true);
    });
  });
});
