import { useState, useEffect, useCallback } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

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

export const useNotifications = () => {
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    pushEnabled: false,
    localEnabled: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const initializeNotifications = useCallback(async () => {
    if (isInitialized) return;
    
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
        setIsInitialized(true);
        return;
      }

      // Request permissions
      const [pushPermissions, localPermissions] = await Promise.all([
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
      setupNotificationListeners();
      
      setIsInitialized(true);
      
      toast({
        title: "Notifications Ready",
        description: "You'll receive helpful reminders and rewards notifications",
      });

    } catch (error) {
      console.error('Error initializing notifications:', error);
      toast({
        title: "Notification Setup Failed",
        description: "Some notification features may not work",
        variant: "destructive",
      });
      setIsInitialized(true);
    }
  }, [isInitialized, toast]);

  const setupNotificationListeners = useCallback(() => {
    // Push notification listeners
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
      
      // Show in-app notification for background received notifications
      toast({
        title: notification.title || "New Notification",
        description: notification.body || "You have a new notification",
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed', notification);
      
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

    // Local notification listeners
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Local notification received:', notification);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Local notification action performed:', notification);
      
      // Handle local notification actions
      window.dispatchEvent(new CustomEvent('notification-action', {
        detail: { action: notification.actionId, data: notification.notification }
      }));
    });
  }, [toast]);

  const scheduleLocalNotification = useCallback(async (options: NotificationOptions) => {
    if (!permissions.localEnabled) {
      console.warn('Local notifications not permitted');
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

      console.log('Notification scheduled:', options.title);
    } catch (error) {
      console.error('Error scheduling notification:', error);
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
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
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