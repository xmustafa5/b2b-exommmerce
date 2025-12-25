import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Types
export interface NotificationData {
  type: string;
  [key: string]: any;
}

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications and get the token
   */
  async registerForPushNotifications(): Promise<string | null> {
    let token: string | null = null;

    // Check if running on physical device (required for push notifications)
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token: permission not granted');
      return null;
    }

    try {
      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (projectId) {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = pushTokenData.data;
      } else {
        // Fallback for development
        const pushTokenData = await Notifications.getExpoPushTokenAsync();
        token = pushTokenData.data;
      }

      this.expoPushToken = token;
      console.log('Push token:', token);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('lilium_default', {
          name: 'Lilium B2B',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        // Create channel for stock alerts
        await Notifications.setNotificationChannelAsync('stock_alerts', {
          name: 'Stock Alerts',
          description: 'Notifications about low stock and inventory',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });

        // Create channel for order updates
        await Notifications.setNotificationChannelAsync('order_updates', {
          name: 'Order Updates',
          description: 'Notifications about order status changes',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }

      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register the FCM token with the backend
   */
  async registerTokenWithBackend(): Promise<boolean> {
    try {
      const token = await this.registerForPushNotifications();

      if (!token) {
        console.log('No push token available to register');
        return false;
      }

      // Get auth token from storage
      const authToken = await AsyncStorage.getItem('accessToken');
      if (!authToken) {
        console.log('No auth token available');
        return false;
      }

      // Register with backend
      await api.post('/notifications/register-token', {
        fcmToken: token,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('FCM token registered with backend');
      return true;
    } catch (error) {
      console.error('Error registering token with backend:', error);
      return false;
    }
  }

  /**
   * Unregister the FCM token (call on logout)
   */
  async unregisterToken(): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('accessToken');
      if (authToken) {
        await api.delete('/notifications/unregister-token', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log('FCM token unregistered from backend');
      }
    } catch (error) {
      console.error('Error unregistering token:', error);
    }

    this.expoPushToken = null;
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Add listener for received notifications (foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add listener for notification responses (user tapped notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Handle notification response (navigation, etc.)
   */
  handleNotificationResponse(response: Notifications.NotificationResponse): NotificationData | null {
    const data = response.notification.request.content.data as NotificationData;

    if (!data) return null;

    console.log('Notification data:', data);

    // Return data for navigation handling
    return data;
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null, // null = immediate
    });
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type { Notifications };
