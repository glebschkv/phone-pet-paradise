import { useState, useEffect, useCallback, useRef } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { notificationLogger as logger } from '@/lib/logger';

interface NotificationPermissions {
  pushEnabled: boolean;
  localEnabled: boolean;
}

interface NotificationOptions {
  title: string;
  body: string;
  delay?: number;
  id?: number;
  actionButtons?: Array<{
    id: string;
    title: string;
  }>;
  attachments?: Array<{
    id: string;
    url: string;
  }>;
}

// Module-level flag to ensure notifications are only initialized once
// across all component instances and remounts.
let globalNotificationsInitialized = false;

export const useNotifications = () => {
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    pushEnabled: false,
    localEnabled: false,
  });
  const [isInitialized, setIsInitialized] = useState(globalNotificationsInitialized);
  const { toast } = useToast();

  // Store listener cleanup functions
  const listenerCleanupRef = useRef<Array<() => Promise<void>>>([]);

  const setupNotificationListeners = useCallback(async () => {
    // Clear any existing listeners first
    for (const cleanup of listenerCleanupRef.current) {
      try {
        await cleanup();
      } catch {
        // Ignore cleanup errors
      }
    }
    listenerCleanupRef.current = [];

    // Push notification listeners
    const registrationListener = await PushNotifications.addListener('registration', (token) => {
      logger.debug('Push registration success, token:', token.value);
    });
    listenerCleanupRef.current.push(() => registrationListener.remove());

    const registrationErrorListener = await PushNotifications.addListener('registrationError', (error) => {
      logger.error('Push registration error:', JSON.stringify(error));
    });
    listenerCleanupRef.current.push(() => registrationErrorListener.remove());

    const pushReceivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      logger.debug('Push notification received:', notification);

      // Show in-app notification for background received notifications
      toast({
        title: notification.title || "New Notification",
        description: notification.body || "You have a new notification",
      });
    });
    listenerCleanupRef.current.push(() => pushReceivedListener.remove());

    const pushActionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      logger.debug('Push notification action performed', notification);

      // Handle notification tap actions
      if (notification.actionId === 'open_app') {
        // App is already open, no action needed
      } else if (notification.actionId === 'check_pets') {
        // Navigate to pets view or trigger relevant action
        window.dispatchEvent(new CustomEvent('notification-action', {
          detail: { action: 'check_pets', data: notification.notification }
        }));
      }
    });
    listenerCleanupRef.current.push(() => pushActionListener.remove());

    // Local notification listeners
    const localReceivedListener = await LocalNotifications.addListener('localNotificationReceived', (notification) => {
      logger.debug('Local notification received:', notification);
    });
    listenerCleanupRef.current.push(() => localReceivedListener.remove());

    const localActionListener = await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      logger.debug('Local notification action performed:', notification);

      // Handle local notification actions
      window.dispatchEvent(new CustomEvent('notification-action', {
        detail: { action: notification.actionId, data: notification.notification }
      }));
    });
    listenerCleanupRef.current.push(() => localActionListener.remove());
  }, [toast]);

  const initializeNotifications = useCallback(async () => {
    // Check module-level flag to prevent re-initialization across remounts
    if (isInitialized || globalNotificationsInitialized) {
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    try {
      if (!Capacitor.isNativePlatform()) {
        // Web notification setup
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setPermissions({
            pushEnabled: permission === 'granted',
            localEnabled: permission === 'granted',
          });
        }
        globalNotificationsInitialized = true;
        setIsInitialized(true);
        return;
      }

      // Request permissions
      const [_pushPermissions, _localPermissions] = await Promise.all([
        PushNotifications.requestPermissions(),
        LocalNotifications.requestPermissions()
      ]);

      // Check final permission status
      const [pushStatus, localStatus] = await Promise.all([
        PushNotifications.checkPermissions(),
        LocalNotifications.checkPermissions()
      ]);

      setPermissions({
        pushEnabled: pushStatus.receive === 'granted',
        localEnabled: localStatus.display === 'granted',
      });

      // Register for push notifications if permitted
      if (pushStatus.receive === 'granted') {
        await PushNotifications.register();
      }

      // Setup notification listeners
      await setupNotificationListeners();

      globalNotificationsInitialized = true;
      setIsInitialized(true);
      logger.debug('Notifications initialized successfully');

    } catch (error) {
      logger.error('Error initializing notifications:', error);
      globalNotificationsInitialized = true;
      setIsInitialized(true);
    }
  }, [isInitialized, setupNotificationListeners]);

  const scheduleLocalNotification = useCallback(async (options: NotificationOptions) => {
    if (!permissions.localEnabled) {
      logger.warn('Local notifications not permitted');
      return;
    }

    try {
      const notificationId = options.id || Date.now();
      const scheduleTime = new Date(Date.now() + (options.delay || 0));

      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: options.title,
              body: options.body,
              id: notificationId,
              schedule: { at: scheduleTime },
              sound: 'default',
              attachments: options.attachments || [],
              actionTypeId: 'default',
              extra: {
                source: 'pet-paradise',
                timestamp: Date.now()
              },
            },
          ],
        });
      } else {
        // Web notification fallback
        if (options.delay && options.delay > 0) {
          setTimeout(() => {
            new Notification(options.title, {
              body: options.body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
            });
          }, options.delay);
        } else {
          new Notification(options.title, {
            body: options.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        }
      }

      logger.debug('Notification scheduled:', options.title);
    } catch (error) {
      logger.error('Error scheduling notification:', error);
    }
  }, [permissions.localEnabled]);

  const schedulePetCareReminder = useCallback(() => {
    scheduleLocalNotification({
      title: '🐾 Your pets miss you!',
      body: 'Come back to feed and play with your island pets',
      delay: 2 * 60 * 60 * 1000, // 2 hours
      id: 1001,
      actionButtons: [
        { id: 'check_pets', title: 'Check Pets' },
        { id: 'dismiss', title: 'Later' }
      ]
    });
  }, [scheduleLocalNotification]);

  const scheduleTimerReminder = useCallback(() => {
    scheduleLocalNotification({
      title: '⏰ Focus time!',
      body: 'Ready for another productive focus session?',
      delay: 24 * 60 * 60 * 1000, // 24 hours
      id: 1002,
      actionButtons: [
        { id: 'start_timer', title: 'Start Timer' },
        { id: 'dismiss', title: 'Not Now' }
      ]
    });
  }, [scheduleLocalNotification]);

  const scheduleRewardNotification = useCallback((xpGained: number, level?: number) => {
    const isLevelUp = level !== undefined;
    
    scheduleLocalNotification({
      title: isLevelUp ? '🎉 Level Up!' : '✨ XP Earned!',
      body: isLevelUp 
        ? `Congratulations! You reached level ${level}!`
        : `You earned ${xpGained} XP for staying focused!`,
      delay: 1000, // 1 second delay
      id: Date.now(),
    });
  }, [scheduleLocalNotification]);

  const scheduleStreakNotification = useCallback((streak: number) => {
    const streakEmoji = streak >= 7 ? '🔥' : streak >= 3 ? '⭐' : '🌟';
    
    scheduleLocalNotification({
      title: `${streakEmoji} ${streak}-Day Streak!`,
      body: `Amazing! You're on a ${streak}-day focus streak. Keep it going!`,
      delay: 2000, // 2 second delay
      id: Date.now(),
    });
  }, [scheduleLocalNotification]);

  const cancelAllNotifications = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [] });
      }
      logger.debug('All notifications cancelled');
    } catch (error) {
      logger.error('Error cancelling notifications:', error);
    }
  }, []);

  // Initialize on mount and cleanup on unmount
  useEffect(() => {
    initializeNotifications();

    // Cleanup function to remove all listeners
    return () => {
      for (const cleanup of listenerCleanupRef.current) {
        try {
          const result = cleanup();
          if (result && typeof result.catch === 'function') {
            result.catch(() => {
              // Ignore cleanup errors on unmount
            });
          }
        } catch {
          // Ignore cleanup errors on unmount
        }
      }
      listenerCleanupRef.current = [];
    };
  }, [initializeNotifications]);

  return {
    permissions,
    isInitialized,
    scheduleLocalNotification,
    schedulePetCareReminder,
    scheduleTimerReminder,
    scheduleRewardNotification,
    scheduleStreakNotification,
    cancelAllNotifications,
    initializeNotifications,
  };
};