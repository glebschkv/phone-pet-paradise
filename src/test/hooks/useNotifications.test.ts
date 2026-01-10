import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';

// Mock Capacitor modules
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: vi.fn(),
    checkPermissions: vi.fn(),
    register: vi.fn(),
    addListener: vi.fn(),
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn(),
    checkPermissions: vi.fn(),
    schedule: vi.fn(),
    cancel: vi.fn(),
    addListener: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  notificationLogger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

describe('useNotifications', () => {
  const mockRemove = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default to web platform
    (Capacitor.isNativePlatform as Mock).mockReturnValue(false);
    
    // Setup default listener mocks
    (PushNotifications.addListener as Mock).mockResolvedValue({ remove: mockRemove });
    (LocalNotifications.addListener as Mock).mockResolvedValue({ remove: mockRemove });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial permissions state', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(result.current.permissions).toEqual({
        pushEnabled: false,
        localEnabled: false,
      });
    });

    it('should initially not be initialized', async () => {
      const { result } = renderHook(() => useNotifications());
      
      // After mount, it will attempt to initialize
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('should return all expected methods', () => {
      const { result } = renderHook(() => useNotifications());
      
      expect(typeof result.current.scheduleLocalNotification).toBe('function');
      expect(typeof result.current.schedulePetCareReminder).toBe('function');
      expect(typeof result.current.scheduleTimerReminder).toBe('function');
      expect(typeof result.current.scheduleRewardNotification).toBe('function');
      expect(typeof result.current.scheduleStreakNotification).toBe('function');
      expect(typeof result.current.cancelAllNotifications).toBe('function');
      expect(typeof result.current.initializeNotifications).toBe('function');
    });
  });

  describe('Web Platform Initialization', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(false);
    });

    it('should request web notification permissions if Notification API exists', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      Object.defineProperty(window, 'Notification', {
        value: { requestPermission: mockRequestPermission },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.permissions.pushEnabled).toBe(true);
      expect(result.current.permissions.localEnabled).toBe(true);
    });

    it('should handle denied web notification permissions', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied');
      Object.defineProperty(window, 'Notification', {
        value: { requestPermission: mockRequestPermission },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.permissions.pushEnabled).toBe(false);
      expect(result.current.permissions.localEnabled).toBe(false);
    });

    it('should handle missing Notification API gracefully', async () => {
      // Remove Notification API
      const originalNotification = (window as any).Notification;
      delete (window as any).Notification;

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should still initialize even without Notification API
      expect(result.current.permissions.pushEnabled).toBe(false);
      expect(result.current.permissions.localEnabled).toBe(false);

      // Restore
      if (originalNotification) {
        (window as any).Notification = originalNotification;
      }
    });
  });

  describe('Native Platform Initialization', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(true);
      
      (PushNotifications.requestPermissions as Mock).mockResolvedValue({ receive: 'granted' });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (PushNotifications.checkPermissions as Mock).mockResolvedValue({ receive: 'granted' });
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (PushNotifications.register as Mock).mockResolvedValue(undefined);
    });

    it('should request native notification permissions', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(PushNotifications.requestPermissions).toHaveBeenCalled();
      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
    });

    it('should check permission status after requesting', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(PushNotifications.checkPermissions).toHaveBeenCalled();
      expect(LocalNotifications.checkPermissions).toHaveBeenCalled();
    });

    it('should register for push notifications when permitted', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(PushNotifications.register).toHaveBeenCalled();
    });

    it('should set permissions state based on native permissions', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.permissions.pushEnabled).toBe(true);
      expect(result.current.permissions.localEnabled).toBe(true);
    });

    it('should handle denied native permissions', async () => {
      (PushNotifications.checkPermissions as Mock).mockResolvedValue({ receive: 'denied' });
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({ display: 'denied' });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.permissions.pushEnabled).toBe(false);
      expect(result.current.permissions.localEnabled).toBe(false);
      expect(PushNotifications.register).not.toHaveBeenCalled();
    });

    it('should setup notification listeners on native platform', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should have setup push notification listeners
      expect(PushNotifications.addListener).toHaveBeenCalledWith('registration', expect.any(Function));
      expect(PushNotifications.addListener).toHaveBeenCalledWith('registrationError', expect.any(Function));
      expect(PushNotifications.addListener).toHaveBeenCalledWith('pushNotificationReceived', expect.any(Function));
      expect(PushNotifications.addListener).toHaveBeenCalledWith('pushNotificationActionPerformed', expect.any(Function));

      // Should have setup local notification listeners
      expect(LocalNotifications.addListener).toHaveBeenCalledWith('localNotificationReceived', expect.any(Function));
      expect(LocalNotifications.addListener).toHaveBeenCalledWith('localNotificationActionPerformed', expect.any(Function));
    });

    it('should handle initialization errors gracefully', async () => {
      (PushNotifications.requestPermissions as Mock).mockRejectedValue(new Error('Permission error'));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should still be initialized even after error
      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe('scheduleLocalNotification', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(true);
      (PushNotifications.checkPermissions as Mock).mockResolvedValue({ receive: 'granted' });
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (PushNotifications.requestPermissions as Mock).mockResolvedValue({ receive: 'granted' });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (LocalNotifications.schedule as Mock).mockResolvedValue(undefined);
    });

    it('should schedule notification on native platform', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.permissions.localEnabled).toBe(true);
      });

      await act(async () => {
        await result.current.scheduleLocalNotification({
          title: 'Test Title',
          body: 'Test Body',
          delay: 5000,
          id: 123,
        });
      });

      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            title: 'Test Title',
            body: 'Test Body',
            id: 123,
          }),
        ],
      });
    });

    it('should not schedule if permissions not granted', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({ display: 'denied' });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.scheduleLocalNotification({
          title: 'Test',
          body: 'Test',
        });
      });

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('should use Date.now() as default id if not provided', async () => {
      const mockNow = 1234567890;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.permissions.localEnabled).toBe(true);
      });

      await act(async () => {
        await result.current.scheduleLocalNotification({
          title: 'Test',
          body: 'Test',
        });
      });

      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            id: mockNow,
          }),
        ],
      });
    });

    it('should handle schedule errors gracefully', async () => {
      (LocalNotifications.schedule as Mock).mockRejectedValue(new Error('Schedule failed'));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.permissions.localEnabled).toBe(true);
      });

      // Should not throw
      await act(async () => {
        await result.current.scheduleLocalNotification({
          title: 'Test',
          body: 'Test',
        });
      });
    });
  });

  describe('Preset Notification Methods', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(true);
      (PushNotifications.checkPermissions as Mock).mockResolvedValue({ receive: 'granted' });
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (PushNotifications.requestPermissions as Mock).mockResolvedValue({ receive: 'granted' });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (LocalNotifications.schedule as Mock).mockResolvedValue(undefined);
    });

    describe('schedulePetCareReminder', () => {
      it('should schedule pet care reminder with correct parameters', async () => {
        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
          expect(result.current.permissions.localEnabled).toBe(true);
        });

        await act(async () => {
          result.current.schedulePetCareReminder();
        });

        expect(LocalNotifications.schedule).toHaveBeenCalledWith({
          notifications: [
            expect.objectContaining({
              title: '🐾 Your pets miss you!',
              body: 'Come back to feed and play with your island pets',
              id: 1001,
            }),
          ],
        });
      });
    });

    describe('scheduleTimerReminder', () => {
      it('should schedule timer reminder with correct parameters', async () => {
        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
          expect(result.current.permissions.localEnabled).toBe(true);
        });

        await act(async () => {
          result.current.scheduleTimerReminder();
        });

        expect(LocalNotifications.schedule).toHaveBeenCalledWith({
          notifications: [
            expect.objectContaining({
              title: '⏰ Focus time!',
              body: 'Ready for another productive focus session?',
              id: 1002,
            }),
          ],
        });
      });
    });

    describe('scheduleRewardNotification', () => {
      it('should schedule XP earned notification', async () => {
        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
          expect(result.current.permissions.localEnabled).toBe(true);
        });

        await act(async () => {
          result.current.scheduleRewardNotification(100);
        });

        expect(LocalNotifications.schedule).toHaveBeenCalledWith({
          notifications: [
            expect.objectContaining({
              title: '✨ XP Earned!',
              body: 'You earned 100 XP for staying focused!',
            }),
          ],
        });
      });

      it('should schedule level up notification when level provided', async () => {
        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
          expect(result.current.permissions.localEnabled).toBe(true);
        });

        await act(async () => {
          result.current.scheduleRewardNotification(100, 5);
        });

        expect(LocalNotifications.schedule).toHaveBeenCalledWith({
          notifications: [
            expect.objectContaining({
              title: '🎉 Level Up!',
              body: 'Congratulations! You reached level 5!',
            }),
          ],
        });
      });
    });

    describe('scheduleStreakNotification', () => {
      it('should use correct emoji for small streak', async () => {
        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
          expect(result.current.permissions.localEnabled).toBe(true);
        });

        await act(async () => {
          result.current.scheduleStreakNotification(2);
        });

        expect(LocalNotifications.schedule).toHaveBeenCalledWith({
          notifications: [
            expect.objectContaining({
              title: '🌟 2-Day Streak!',
            }),
          ],
        });
      });

      it('should use star emoji for medium streak (3-6 days)', async () => {
        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
          expect(result.current.permissions.localEnabled).toBe(true);
        });

        await act(async () => {
          result.current.scheduleStreakNotification(5);
        });

        expect(LocalNotifications.schedule).toHaveBeenCalledWith({
          notifications: [
            expect.objectContaining({
              title: '⭐ 5-Day Streak!',
            }),
          ],
        });
      });

      it('should use fire emoji for long streak (7+ days)', async () => {
        const { result } = renderHook(() => useNotifications());

        await waitFor(() => {
          expect(result.current.permissions.localEnabled).toBe(true);
        });

        await act(async () => {
          result.current.scheduleStreakNotification(10);
        });

        expect(LocalNotifications.schedule).toHaveBeenCalledWith({
          notifications: [
            expect.objectContaining({
              title: '🔥 10-Day Streak!',
              body: "Amazing! You're on a 10-day focus streak. Keep it going!",
            }),
          ],
        });
      });
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all notifications on native platform', async () => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(true);
      (LocalNotifications.cancel as Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.cancelAllNotifications();
      });

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({ notifications: [] });
    });

    it('should not call cancel on web platform', async () => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(false);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.cancelAllNotifications();
      });

      expect(LocalNotifications.cancel).not.toHaveBeenCalled();
    });

    it('should handle cancel errors gracefully', async () => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(true);
      (LocalNotifications.cancel as Mock).mockRejectedValue(new Error('Cancel failed'));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should not throw
      await act(async () => {
        await result.current.cancelAllNotifications();
      });
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should cleanup listeners on unmount', async () => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(true);
      (PushNotifications.checkPermissions as Mock).mockResolvedValue({ receive: 'granted' });
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (PushNotifications.requestPermissions as Mock).mockResolvedValue({ receive: 'granted' });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({ display: 'granted' });

      const { result, unmount } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Unmount should trigger cleanup
      unmount();

      // All listener remove functions should have been called
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('Web Notification Fallback', () => {
    let originalNotification: typeof Notification;
    let mockNotification: Mock;

    beforeEach(() => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(false);
      
      mockNotification = vi.fn();
      originalNotification = window.Notification;
      
      // @ts-expect-error - Mocking Notification constructor
      window.Notification = mockNotification;
      window.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    });

    afterEach(() => {
      window.Notification = originalNotification;
    });

    it('should use web Notification API for immediate notifications', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.permissions.localEnabled).toBe(true);
      });

      await act(async () => {
        await result.current.scheduleLocalNotification({
          title: 'Test',
          body: 'Test body',
        });
      });

      expect(mockNotification).toHaveBeenCalledWith('Test', {
        body: 'Test body',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    });

    it('should use setTimeout for delayed web notifications', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.permissions.localEnabled).toBe(true);
      });

      await act(async () => {
        await result.current.scheduleLocalNotification({
          title: 'Delayed Test',
          body: 'Delayed body',
          delay: 5000,
        });
      });

      // Notification should not be called immediately
      expect(mockNotification).not.toHaveBeenCalled();

      // Advance timers
      vi.advanceTimersByTime(5000);

      expect(mockNotification).toHaveBeenCalledWith('Delayed Test', {
        body: 'Delayed body',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });

      vi.useRealTimers();
    });
  });

  describe('Re-initialization Prevention', () => {
    it('should not re-initialize if already initialized', async () => {
      (Capacitor.isNativePlatform as Mock).mockReturnValue(false);
      Object.defineProperty(window, 'Notification', {
        value: { requestPermission: vi.fn().mockResolvedValue('granted') },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const requestPermissionCalls = (window.Notification.requestPermission as Mock).mock.calls.length;

      // Try to initialize again
      await act(async () => {
        await result.current.initializeNotifications();
      });

      // Should not have called requestPermission again
      expect((window.Notification.requestPermission as Mock).mock.calls.length).toBe(requestPermissionCalls);
    });
  });
});
