// 🔔 Push Notifications Frontend Service
// Complete push notification management for BlackRent

import { getAPI_BASE_URL } from './api';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  ttl?: number;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface PushNotificationPreferences {
  rental_requests: boolean;
  rental_approvals: boolean;
  rental_reminders: boolean;
  maintenance_alerts: boolean;
  payment_reminders: boolean;
  marketing_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

class PushNotificationService {
  private vapidPublicKey: string | null = null;
  private subscription: PushSubscription | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return false;
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return false;
      }

      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      this.vapidPublicKey = await this.getVapidPublicKey();

      if (!this.vapidPublicKey) {
        console.warn('VAPID public key not available');
        return false;
      }

      console.log('✅ Push notifications initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Get VAPID public key from server
  private async getVapidPublicKey(): Promise<string | null> {
    try {
      const response = await fetch(`${getAPI_BASE_URL()}/push/vapid-key`);
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('❌ Error getting VAPID key:', error);
      return null;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    console.log('🔔 Notification permission:', permission);
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<boolean> {
    try {
      if (!this.registration || !this.vapidPublicKey) {
        console.error('Push notifications not initialized');
        return false;
      }

      // Check permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Get existing subscription
      let subscription = await this.registration.pushManager.getSubscription();

      // Subscribe if not already subscribed
      if (!subscription) {
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource,
        });
      }

      this.subscription = subscription;

      // Send subscription to server
      const success = await this.sendSubscriptionToServer(subscription);

      if (success) {
        console.log('✅ Successfully subscribed to push notifications');
        return true;
      } else {
        console.error('❌ Failed to save subscription on server');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.registration) {
        return false;
      }

      const subscription =
        await this.registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        const unsubscribed = await subscription.unsubscribe();

        if (unsubscribed) {
          // Remove from server
          await this.removeSubscriptionFromServer(subscription);
          this.subscription = null;
          console.log('✅ Successfully unsubscribed from push notifications');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<boolean> {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${getAPI_BASE_URL()}/push/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error sending subscription to server:', error);
      return false;
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(
    subscription: PushSubscription
  ): Promise<boolean> {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${getAPI_BASE_URL()}/push/subscription`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error removing subscription from server:', error);
      return false;
    }
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<{
    isSupported: boolean;
    isSubscribed: boolean;
    permission: NotificationPermission;
    subscription?: PushSubscription;
  }> {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

    if (!isSupported) {
      return {
        isSupported: false,
        isSubscribed: false,
        permission: 'denied',
      };
    }

    const permission = Notification.permission;

    if (!this.registration) {
      this.registration = await navigator.serviceWorker.ready;
    }

    const subscription = await this.registration.pushManager.getSubscription();

    return {
      isSupported,
      isSubscribed: !!subscription,
      permission,
      subscription: subscription || undefined,
    };
  }

  // Get user notification preferences
  async getNotificationPreferences(): Promise<PushNotificationPreferences | null> {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${getAPI_BASE_URL()}/push/preferences`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error);
      return null;
    }
  }

  // Update user notification preferences
  async updateNotificationPreferences(
    preferences: Partial<PushNotificationPreferences>
  ): Promise<boolean> {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${getAPI_BASE_URL()}/push/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      return false;
    }
  }

  // Send test notification (admin only)
  async sendTestNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${getAPI_BASE_URL()}/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
    }
  }

  // Show local notification (fallback)
  async showLocalNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      if (Notification.permission !== 'granted') {
        return false;
      }

      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/logo192.png',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
      });

      // Handle click event
      notification.onclick = event => {
        event.preventDefault();

        const data = payload.data || {};
        const url = (data.url as string) || '/';

        // Focus or open window
        window.focus();
        if (url !== '/') {
          window.location.href = url;
        }

        notification.close();
      };

      return true;
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
      return false;
    }
  }

  // Get notification analytics (admin only)
  async getNotificationAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, unknown> | null> {
    try {
      const token = this.getAuthToken();
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(
        `${getAPI_BASE_URL()}/push/analytics?${params}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting notification analytics:', error);
      return null;
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get auth token from storage
  private getAuthToken(): string | null {
    return (
      localStorage.getItem('blackrent_token') ||
      sessionStorage.getItem('blackrent_token')
    );
  }

  // Check if notifications are supported
  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Get current permission status
  static getPermissionStatus(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied';
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export types
export type {
  NotificationAction,
  NotificationPayload,
  PushNotificationPreferences,
  PushSubscriptionData,
};

export default PushNotificationService;
