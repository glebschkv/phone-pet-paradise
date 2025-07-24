import { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

interface NotificationPermissions {
  pushEnabled: boolean;
  localEnabled: boolean;
}

export const useNotifications = () => {
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    pushEnabled: false,
    localEnabled: false,
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializeNotifications();
    }
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request permissions
      await PushNotifications.requestPermissions();
      await LocalNotifications.requestPermissions();

      // Check permissions
      const pushStatus = await PushNotifications.checkPermissions();
      const localStatus = await LocalNotifications.checkPermissions();

      setPermissions({
        pushEnabled: pushStatus.receive === 'granted',
        localEnabled: localStatus.display === 'granted',
      });

      // Register for push notifications
      if (pushStatus.receive === 'granted') {
        await PushNotifications.register();
      }

      // Add listeners
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification);
      });

    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const scheduleLocalNotification = async (title: string, body: string, delay: number) => {
    if (!permissions.localEnabled) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + delay) },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const schedulePetCareReminder = () => {
    scheduleLocalNotification(
      '🐾 Your pets miss you!',
      'Come back to feed and play with your island pets',
      2 * 60 * 60 * 1000 // 2 hours
    );
  };

  const scheduleTimerReminder = () => {
    scheduleLocalNotification(
      '⏰ Focus time!',
      'Ready for another productive focus session?',
      24 * 60 * 60 * 1000 // 24 hours
    );
  };

  return {
    permissions,
    scheduleLocalNotification,
    schedulePetCareReminder,
    scheduleTimerReminder,
  };
};