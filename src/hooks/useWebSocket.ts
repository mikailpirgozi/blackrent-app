// 🔴 REACT WEBSOCKET HOOK - BlackRent
// Custom React hook pre jednoduché použitie WebSocket real-time updates

import { useEffect, useRef, useState, useCallback } from 'react';

import type { WebSocketClient } from '../services/websocket-client';
import {
  getWebSocketClient,
  WebSocketEvents,
} from '../services/websocket-client';
import type { Rental, Vehicle } from '../types';
import { Customer } from '../types';

// Notification typy
export interface NotificationData {
  id: string;
  type:
    | 'rental_created'
    | 'rental_updated'
    | 'rental_deleted'
    | 'vehicle_updated'
    | 'customer_created'
    | 'system';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  read?: boolean;
}

/**
 * Hook pre WebSocket pripojenie a základné eventy
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<{
    count: number;
    users: any[];
  }>({ count: 0, users: [] });
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    // Inicializácia WebSocket client
    clientRef.current = getWebSocketClient();

    // Event handlers - optimalized logging
    const handleConnect = () => {
      setIsConnected(true);
      // Removed redundant log - already logged in websocket-client.ts
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      // Removed redundant log - already logged in websocket-client.ts
    };

    const handleConnectedUsers = (data: { count: number; users: any[] }) => {
      setConnectedUsers(data);
    };

    // Setup events
    const socket = clientRef.current.getSocket();
    if (socket) {
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Check initial connection state
      setIsConnected(socket.connected);
    }

    clientRef.current.on('connected-users', handleConnectedUsers);

    return () => {
      // Cleanup
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      }
      clientRef.current?.off('connected-users', handleConnectedUsers);
    };
  }, []);

  const addNotification = useCallback(
    (notification: Omit<NotificationData, 'id'>) => {
      const newNotification: NotificationData = {
        ...notification,
        id: Date.now().toString(),
        read: false,
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50 notifications
    },
    []
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected,
    connectedUsers,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markNotificationRead,
    clearNotifications,
    client: clientRef.current,
  };
}

/**
 * Hook pre real-time rental updates
 */
export function useRentalUpdates(
  onRentalChange?: (type: string, rental?: Rental, rentalId?: string) => void
) {
  const { client, addNotification } = useWebSocket();

  useEffect(() => {
    if (!client) return;

    const handleRentalCreated = (data: any) => {
      console.log('📢 Rental created:', data);
      // 🔴 REMOVED: Notification popup that was causing UI issues
      onRentalChange?.('created', data.rental);
    };

    const handleRentalUpdated = (data: any) => {
      console.log('📢 Rental updated:', data);
      // 🔴 REMOVED: Notification popup that was causing UI issues
      onRentalChange?.('updated', data.rental);
    };

    const handleRentalDeleted = (data: any) => {
      console.log('📢 Rental deleted:', data);
      // 🔴 REMOVED: Notification popup that was causing UI issues
      onRentalChange?.('deleted', undefined, data.rentalId);
    };

    // Register event listeners
    client.on('rental:created', handleRentalCreated);
    client.on('rental:updated', handleRentalUpdated);
    client.on('rental:deleted', handleRentalDeleted);

    return () => {
      // Cleanup
      client.off('rental:created', handleRentalCreated);
      client.off('rental:updated', handleRentalUpdated);
      client.off('rental:deleted', handleRentalDeleted);
    };
  }, [client, addNotification, onRentalChange]);
}

/**
 * Hook pre real-time vehicle updates
 */
export function useVehicleUpdates(
  onVehicleChange?: (vehicle: Vehicle) => void
) {
  const { client, addNotification } = useWebSocket();

  useEffect(() => {
    if (!client) return;

    const handleVehicleUpdated = (data: any) => {
      console.log('📢 Vehicle updated:', data);
      // 🔴 REMOVED: Notification popup that was causing UI issues
      onVehicleChange?.(data.vehicle);
    };

    client.on('vehicle:updated', handleVehicleUpdated);

    return () => {
      client.off('vehicle:updated', handleVehicleUpdated);
    };
  }, [client, addNotification, onVehicleChange]);
}

/**
 * Hook pre real-time protocol updates
 */
export function useProtocolUpdates(
  onProtocolChange?: (type: string, data: any) => void
) {
  const { client, addNotification } = useWebSocket();

  useEffect(() => {
    if (!client) return;

    const handleProtocolCreated = (data: any) => {
      console.log('📢 Protocol created:', data);
      // 🔴 REMOVED: Notification popup that was causing UI issues
      onProtocolChange?.('created', data);

      // Trigger rental list refresh
      window.dispatchEvent(
        new CustomEvent('rental-list-refresh', { detail: data })
      );
    };

    const handleProtocolUpdated = (data: any) => {
      console.log('📢 Protocol updated:', data);
      // 🔴 REMOVED: Notification popup that was causing UI issues
      onProtocolChange?.('updated', data);

      // Trigger rental list refresh
      window.dispatchEvent(
        new CustomEvent('rental-list-refresh', { detail: data })
      );
    };

    // Register event listeners
    client.on('protocol:created', handleProtocolCreated);
    client.on('protocol:updated', handleProtocolUpdated);

    return () => {
      // Cleanup
      client.off('protocol:created', handleProtocolCreated);
      client.off('protocol:updated', handleProtocolUpdated);
    };
  }, [client, addNotification, onProtocolChange]);
}

/**
 * Hook pre system notifications
 */
export function useSystemNotifications() {
  const { client, addNotification } = useWebSocket();

  useEffect(() => {
    if (!client) return;

    const handleSystemNotification = (data: any) => {
      console.log('📢 System notification:', data);
      addNotification({
        type: 'system',
        title: `${data.type === 'error' ? '❌' : data.type === 'warning' ? '⚠️' : 'ℹ️'} Systém`,
        message: data.message,
        timestamp: data.timestamp,
        data: data.details,
      });
    };

    const handleMigration = (data: any) => {
      console.log('📢 Migration completed:', data);
      addNotification({
        type: 'system',
        title: data.success ? '✅ Migrácia' : '❌ Migrácia',
        message: data.message,
        timestamp: data.timestamp,
        data: data,
      });
    };

    client.on('system:notification', handleSystemNotification);
    client.on('system:migration', handleMigration);

    return () => {
      client.off('system:notification', handleSystemNotification);
      client.off('system:migration', handleMigration);
    };
  }, [client, addNotification]);
}

/**
 * Hook pre testing WebSocket funkcionalitu
 */
export function useWebSocketTest() {
  const { client } = useWebSocket();

  const sendPing = useCallback(() => {
    client?.ping();
  }, [client]);

  const [lastPong, setLastPong] = useState<number | null>(null);

  useEffect(() => {
    if (!client) return;

    const handlePong = (data: { timestamp: number }) => {
      const latency = Date.now() - data.timestamp;
      setLastPong(latency);
      console.log(`🏓 Pong received - latency: ${latency}ms`);
    };

    const handleTest = (data: any) => {
      console.log('🧪 Test message:', data);
    };

    client.on('pong', handlePong);
    client.on('test', handleTest);

    return () => {
      client.off('pong', handlePong);
      client.off('test', handleTest);
    };
  }, [client]);

  return {
    sendPing,
    lastPong, // latency in ms
  };
}
