// 🔔 Push Notifications React Hook
// Easy-to-use React hook for push notification management

import { useCallback, useEffect, useState } from 'react';

import {
  pushNotificationService,
  type NotificationPayload,
  type PushNotificationPreferences,
} from '../services/pushNotifications';

interface UsePushNotificationsReturn {
  // Status
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  loading: boolean;
  error: string | null;

  // Preferences
  preferences: PushNotificationPreferences | null;

  // Actions
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  updatePreferences: (
    prefs: Partial<PushNotificationPreferences>
  ) => Promise<boolean>;
  sendTestNotification: (payload: NotificationPayload) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] =
    useState<PushNotificationPreferences | null>(null);

  // Initialize push notifications
  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialize service
      const initialized = await pushNotificationService.initialize();

      if (!initialized) {
        throw new Error('Failed to initialize push notification service');
      }

      // Get current status
      const status = await pushNotificationService.getSubscriptionStatus();
      setIsSupported(status.isSupported);
      setIsSubscribed(status.isSubscribed);
      setPermission(status.permission);

      // Load preferences if subscribed
      if (status.isSubscribed) {
        const prefs =
          await pushNotificationService.getNotificationPreferences();
        setPreferences(prefs);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to initialize push notifications';
      setError(errorMessage);
      console.error('Push notifications initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = await pushNotificationService.subscribe();

      if (success) {
        setIsSubscribed(true);
        setPermission('granted');

        // Load preferences
        const prefs =
          await pushNotificationService.getNotificationPreferences();
        setPreferences(prefs);

        return true;
      } else {
        throw new Error('Failed to subscribe to push notifications');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      console.error('Push notification subscription error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const success = await pushNotificationService.unsubscribe();

      if (success) {
        setIsSubscribed(false);
        setPreferences(null);
        return true;
      } else {
        throw new Error('Failed to unsubscribe from push notifications');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      console.error('Push notification unsubscription error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(
    async (
      newPreferences: Partial<PushNotificationPreferences>
    ): Promise<boolean> => {
      if (!preferences) return false;

      const oldPreferences = { ...preferences };

      // Optimistic update
      setPreferences(prev => (prev ? { ...prev, ...newPreferences } : null));

      try {
        const success =
          await pushNotificationService.updateNotificationPreferences(
            newPreferences
          );

        if (!success) {
          // Revert on failure
          setPreferences(oldPreferences);
          throw new Error('Failed to update preferences');
        }

        return true;
      } catch (err: unknown) {
        // Revert on error
        setPreferences(oldPreferences);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update preferences';
        setError(errorMessage);
        console.error('Push notification preferences update error:', err);
        return false;
      }
    },
    [preferences]
  );

  // Send test notification
  const sendTestNotification = useCallback(
    async (payload: NotificationPayload): Promise<boolean> => {
      setError(null);

      try {
        const success =
          await pushNotificationService.sendTestNotification(payload);

        if (!success) {
          throw new Error('Failed to send test notification');
        }

        return true;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to send test notification';
        setError(errorMessage);
        console.error('Test notification error:', err);
        return false;
      }
    },
    []
  );

  // Refresh current status
  const refreshStatus = useCallback(async (): Promise<void> => {
    await initialize();
  }, [initialize]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for permission changes
  useEffect(() => {
    const handlePermissionChange = () => {
      const newPermission = Notification.permission;
      setPermission(newPermission);

      // If permission was granted, try to refresh status
      if (newPermission === 'granted' && !isSubscribed) {
        refreshStatus();
      }

      // If permission was denied, update subscription status
      if (newPermission === 'denied' && isSubscribed) {
        setIsSubscribed(false);
        setPreferences(null);
      }
    };

    // Listen for visibility change to refresh status
    const handleVisibilityChange = () => {
      if (!document.hidden && isSupported) {
        refreshStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Note: There's no direct way to listen for permission changes
    // We could poll, but it's better to refresh on visibility change

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported, isSubscribed, refreshStatus]);

  return {
    // Status
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,

    // Preferences
    preferences,

    // Actions
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
    refreshStatus,
  };
};

// Simplified hook for basic usage
export const useSimplePushNotifications = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    canSubscribe: isSupported && !isSubscribed && permission !== 'denied',
    needsPermission: isSupported && permission === 'default',
    isBlocked: permission === 'denied',
  };
};

export default usePushNotifications;
