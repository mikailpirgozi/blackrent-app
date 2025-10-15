/**
 * Notification Service
 * Push notifications with Expo Notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../config/api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type NotificationType =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'vehicle_ready'
  | 'payment_confirmed'
  | 'special_offer'
  | 'return_reminder'
  | 'protocol_submitted';

interface NotificationData {
  type: NotificationType;
  bookingId?: string;
  vehicleId?: string;
  [key: string]: unknown;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize notifications
   */
  async initialize(): Promise<void> {
    if (!Device.isDevice) {
      console.warn('[Notifications] Push notifications only work on physical devices');
      return;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Notifications] Permission not granted');
        return;
      }

      // Get push token
      const token = await this.getExpoPushToken();
      if (token) {
        await this.registerToken(token);
      }

      // Setup notification handlers
      this.setupNotificationHandlers();

      console.log('[Notifications] Initialized successfully');
    } catch (error) {
      console.error('[Notifications] Initialization failed:', error);
    }
  }

  /**
   * Get Expo push token
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      
      if (!projectId) {
        console.warn('[Notifications] EXPO_PUBLIC_PROJECT_ID not configured');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      console.log('[Notifications] Push token:', token.data);

      return token.data;
    } catch (error) {
      console.error('[Notifications] Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  private async registerToken(token: string): Promise<void> {
    try {
      await api.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceInfo: {
          model: Device.modelName,
          osVersion: Device.osVersion,
        },
      });

      console.log('[Notifications] Token registered with backend');
    } catch (error) {
      console.error('[Notifications] Failed to register token:', error);
    }
  }

  /**
   * Setup notification handlers
   */
  private setupNotificationHandlers(): void {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] Received:', notification);
      
      const data = notification.request.content.data as NotificationData;
      this.handleNotificationData(data);
    });

    // Handle notification interaction (tap)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Notifications] Response:', response);
      
      const data = response.notification.request.content.data as NotificationData;
      this.handleNotificationAction(data);
    });
  }

  /**
   * Handle notification data
   */
  private handleNotificationData(data: NotificationData): void {
    // Process notification based on type
    switch (data.type) {
      case 'booking_confirmation':
        // Show in-app confirmation
        break;
      case 'booking_reminder':
        // Show reminder
        break;
      case 'vehicle_ready':
        // Navigate to booking detail
        break;
      default:
        console.log('[Notifications] Unhandled type:', data.type);
    }
  }

  /**
   * Handle notification action (user tapped notification)
   */
  private handleNotificationAction(data: NotificationData): void {
    // Navigate based on notification type
    // This will be implemented with navigation
    console.log('[Notifications] Action:', data);
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: trigger || null,
    });
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all notifications
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

  /**
   * Check permission status
   */
  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Request permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export hook for React components
export const useNotifications = () => {
  return notificationService;
};

