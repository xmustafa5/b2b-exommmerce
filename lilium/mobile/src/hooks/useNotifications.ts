import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { notificationService, NotificationData } from '../services/notifications';

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isLoading: boolean;
  error: string | null;
  registerForNotifications: () => Promise<boolean>;
  unregisterNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<any>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Handle notification navigation
  const handleNotificationNavigation = useCallback((data: NotificationData | null) => {
    if (!data) return;

    switch (data.type) {
      case 'ORDER_UPDATE':
        // Navigate to order details
        if (data.orderId) {
          navigation.navigate('OrderDetails', { orderId: data.orderId });
        }
        break;

      case 'STOCK_ALERT':
        // Navigate to product details (for admins)
        if (data.productId) {
          navigation.navigate('ProductDetails', { productId: data.productId });
        }
        break;

      case 'BACK_IN_STOCK':
        // Navigate to product details
        if (data.productId) {
          navigation.navigate('ProductDetails', { productId: data.productId });
        }
        break;

      case 'PROMOTION':
        // Navigate to promotions or product
        if (data.productId) {
          navigation.navigate('ProductDetails', { productId: data.productId });
        } else {
          navigation.navigate('Promotions');
        }
        break;

      default:
        console.log('Unknown notification type:', data.type);
    }
  }, [navigation]);

  // Register for push notifications
  const registerForNotifications = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await notificationService.registerTokenWithBackend();
      if (success) {
        setExpoPushToken(notificationService.getToken());
      }
      return success;
    } catch (err) {
      setError('Failed to register for notifications');
      console.error('Error registering for notifications:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unregister notifications
  const unregisterNotifications = useCallback(async (): Promise<void> => {
    try {
      await notificationService.unregisterToken();
      setExpoPushToken(null);
    } catch (err) {
      console.error('Error unregistering notifications:', err);
    }
  }, []);

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        setNotification(notification);
      }
    );

    // Listen for user interaction with notification
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification response:', response);
        const data = notificationService.handleNotificationResponse(response);
        handleNotificationNavigation(data);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationNavigation]);

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    registerForNotifications,
    unregisterNotifications,
  };
}
