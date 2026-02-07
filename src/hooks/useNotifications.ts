import { useState, useEffect, useCallback, useRef } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
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

// Module-level dedup: ensures notification initialization only runs once
// even when multiple components mount useNotifications simultaneously
// (e.g. GameUI and TopStatusBar both call useAppStateTracking → useNotifications).
let globalNotificationsInitialized = false;
let _notificationInitPromise: Promise<void> | null = null;
// Cache permissions at module level so every useNotifications() instance can
// schedule notifications — not just the one that happened to initialize first.
let _cachedPermissions: NotificationPermissions = { pushEnabled: false, localEnabled: false };

export const useNotifications = () => {
  const [permissions, setPermissionsState] = useState<NotificationPermissions>(_cachedPermissions);

  // Wrap setPermissions to also update the module-level cache
  const setPermissions = useCallback((p: NotificationPermissions) => {
    _cachedPermissions = p;
    setPermissionsState(p);
  }, []);
  const [isInitialized, setIsInitialized] = useState(globalNotificationsInitialized);
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
      toast.info(notification.title || "New Notification", {
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
  }, []);

  const initializeNotifications = useCallback(async () => {
    // Module-level guard — prevents re-initialization across remounts.
    // IMPORTANT: Do NOT add `isInitialized` to deps — that causes the
    // callback to be recreated on state change, which triggers the useEffect
    // cleanup (removing all listeners) and re-run (returning early = listeners
    // never re-added). Use the module-level flag instead.
    if (globalNotificationsInitialized) {
      // Sync cached permissions into this instance's state so
      // scheduleLocalNotification's guard doesn't block.
      setPermissionsState(_cachedPermissions);
      setIsInitialized(true);
      return;
    }

    // If another instance is already initializing (race condition: GameUI and
    // TopStatusBar both call useAppStateTracking → useNotifications, and both
    // useEffects fire in the same React commit), wait for it instead of
    // duplicating all bridge calls.
    if (_notificationInitPromise) {
      await _notificationInitPromise;
      setIsInitialized(true);
      return;
    }

    // First caller — claim the init
    _notificationInitPromise = (async () => {
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

        logger.debug('Notifications initialized successfully');

      } catch (error) {
        logger.error('Error initializing notifications:', error);
      } finally {
        globalNotificationsInitialized = true;
      }
    })();

    await _notificationInitPromise;
    setIsInitialized(true);
  }, [setupNotificationListeners]);

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

  // Schedule a notification that fires when a focus timer session ends.
  // Called at timer START so the notification fires even if the app is killed.
  const scheduleTimerCompletionNotification = useCallback((durationSeconds: number) => {
    scheduleLocalNotification({
      title: '🎉 Focus session complete!',
      body: 'Great work staying focused! Come back to collect your rewards.',
      delay: durationSeconds * 1000,
      id: 1003,
    });
  }, [scheduleLocalNotification]);

  // Cancel the timer completion notification (on pause/stop/skip).
  const cancelTimerCompletionNotification = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id: 1003 }] });
      }
      logger.debug('Timer completion notification cancelled');
    } catch (error) {
      logger.error('Error cancelling timer notification:', error);
    }
  }, []);

  // Schedule a notification for when the daily reward is available (next day at 8 AM).
  const scheduleDailyRewardNotification = useCallback(() => {
    const now = new Date();
    const tomorrow8AM = new Date(now);
    tomorrow8AM.setDate(tomorrow8AM.getDate() + 1);
    tomorrow8AM.setHours(8, 0, 0, 0);
    const delayMs = tomorrow8AM.getTime() - now.getTime();

    if (delayMs > 0) {
      scheduleLocalNotification({
        title: '🎁 Daily reward ready!',
        body: 'Your daily login reward is waiting. Don\'t break your streak!',
        delay: delayMs,
        id: 1004,
      });
    }
  }, [scheduleLocalNotification]);

  // Schedule a reminder when a boss challenge is about to expire (fires at 75% of the time limit).
  const scheduleBossChallengeReminder = useCallback((challengeName: string, cooldownHours: number) => {
    const reminderDelayMs = cooldownHours * 0.75 * 60 * 60 * 1000;

    if (reminderDelayMs > 0) {
      scheduleLocalNotification({
        title: '⚔️ Boss challenge expiring soon!',
        body: `Your "${challengeName}" challenge is running out of time. Get back to focusing!`,
        delay: reminderDelayMs,
        id: 1005,
      });
    }
  }, [scheduleLocalNotification]);

  const cancelBossChallengeReminder = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id: 1005 }] });
      }
    } catch (error) {
      logger.error('Error cancelling boss challenge notification:', error);
    }
  }, []);

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
    scheduleTimerCompletionNotification,
    cancelTimerCompletionNotification,
    scheduleDailyRewardNotification,
    scheduleBossChallengeReminder,
    cancelBossChallengeReminder,
    scheduleRewardNotification,
    scheduleStreakNotification,
    cancelAllNotifications,
    initializeNotifications,
  };
};

/** Reset module-level singleton state. Test-only — do NOT call in production. */
export function _resetNotificationsForTesting() {
  globalNotificationsInitialized = false;
  _notificationInitPromise = null;
}