// 🔴 WEBSOCKET CLIENT SERVICE - BlackRent Frontend
// Real-time komunikácia s backend WebSocket serverom

import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import { Customer, Rental, Vehicle } from '../types';
import type { Leasing } from '@/types/leasing-types';
import { getBaseUrl } from '../utils/apiUrl';
import { logger } from '@/utils/smartLogger';

// Event typy pre TypeScript
export interface WebSocketEvents {
  // Rental events
  'rental:created': (_data: {
    rental: Rental;
    createdBy: string;
    timestamp: string;
    message: string;
  }) => void;

  'rental:updated': (_data: {
    rental: Rental;
    updatedBy: string;
    changes?: string[];
    timestamp: string;
    message: string;
  }) => void;

  'rental:deleted': (_data: {
    rentalId: string;
    customerName: string;
    deletedBy: string;
    timestamp: string;
    message: string;
  }) => void;

  // Vehicle events
  'vehicle:updated': (_data: {
    vehicle: Vehicle;
    updatedBy: string;
    changes?: string[];
    timestamp: string;
    message: string;
  }) => void;

  // Customer events
  'customer:created': (_data: {
    customer: Customer;
    createdBy: string;
    timestamp: string;
    message: string;
  }) => void;

  // Protocol events
  'protocol:created': (_data: {
    rentalId: string;
    protocolType: 'handover' | 'return';
    protocolId: string;
    createdBy: string;
    timestamp: string;
    message: string;
  }) => void;

  'protocol:updated': (_data: {
    rentalId: string;
    protocolType: 'handover' | 'return';
    protocolId: string;
    updatedBy: string;
    changes?: string[];
    timestamp: string;
    message: string;
  }) => void;

  // Leasing events
  'leasing:created': (_data: {
    leasing: Leasing;
    createdBy: string;
    timestamp: string;
    message: string;
  }) => void;

  'leasing:updated': (_data: {
    leasing: Leasing;
    updatedBy: string;
    changes?: string[];
    timestamp: string;
    message: string;
  }) => void;

  'leasing:deleted': (_data: {
    leasingId: string;
    vehicleId?: string;
    deletedBy: string;
    timestamp: string;
    message: string;
  }) => void;

  'leasing:payment-marked': (_data: {
    leasingId: string;
    installmentNumber: number;
    markedBy: string;
    timestamp: string;
    message: string;
  }) => void;

  'leasing:payment-unmarked': (_data: {
    leasingId: string;
    installmentNumber: number;
    unmarkedBy: string;
    timestamp: string;
    message: string;
  }) => void;

  'leasing:bulk-payment-marked': (_data: {
    leasingId: string;
    installmentNumbers: number[];
    markedBy: string;
    timestamp: string;
    message: string;
  }) => void;

  // System events
  'system:notification': (_data: {
    type: 'info' | 'warning' | 'error';
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  }) => void;

  'system:migration': (_data: {
    migrationName: string;
    success: boolean;
    details?: string;
    timestamp: string;
    message: string;
  }) => void;

  // Connection events
  'connected-users': (_data: {
    count: number;
    users: Array<{ userName?: string; socketId: string }>;
  }) => void;

  pong: (_data: { timestamp: number }) => void;
  test: (_data: {
    message: string;
    timestamp: string;
    connectedClients: number;
  }) => void;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners = new Map<string, ((..._args: unknown[]) => void)[]>();
  private baseUrl: string = '';

  constructor() {
    this.connect();
  }

  private connect() {
    // WebSocket server beží na root, nie na /api ako REST API
    this.baseUrl = getBaseUrl();

    // OPTIMIZED: Only log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🔴 Connecting to WebSocket:', this.baseUrl);
    }

    this.socket = io(this.baseUrl, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: process.env.NODE_ENV === 'development' ? 30000 : 15000, // Zvýšený timeout
      forceNew: true,
      autoConnect: false, // Necháme sa pripojiť manuálne
      // Pridané pre lepšiu kompatibilitu
      upgrade: true,
      rememberUpgrade: false,
      // Pridané pre lepšiu kompatibilitu s backend
      path: '/socket.io/',
      withCredentials: true,
      // ✅ OPTIMIZATION: Silent mode - no console errors
      reconnection: true,
      // Pridané pre lepšiu stabilitu
      // pingTimeout a pingInterval nie sú podporované v tejto verzii
    });

    // Pripoj sa manuálne s retry logikou
    this.connectWithRetry();

    this.setupEventHandlers();
  }

  private connectWithRetry() {
    if (!this.socket) return;

    // Skús pripojenie s timeout
    const connectTimeout = window.setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        // ✅ SILENT MODE: No log noise in production
        if (process.env.NODE_ENV === 'development') {
          logger.debug(
            '⏰ WebSocket connection timeout, trying polling fallback...'
          );
        }
        this.socket.disconnect();
        this.socket.io.opts.transports = ['polling']; // Fallback na polling
        this.socket.connect();
      }
    }, 5000);

    this.socket.on('connect', () => {
      window.clearTimeout(connectTimeout);
      // ✅ SILENT MODE: Log only in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug('✅ WebSocket connected successfully');
      }
    });

    this.socket.on('connect_error', error => {
      window.clearTimeout(connectTimeout);
      // ✅ SILENT MODE: Only log critical errors, not every reconnect attempt
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          '❌ WebSocket connection failed, will retry silently...',
          error.message
        );
      }
      // Don't throw or show errors - just retry silently
    });

    // Pripoj sa
    this.socket.connect();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // OPTIMIZED: Only log in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug('✅ WebSocket connected:', this.socket?.id);
      }
      this.reconnectAttempts = 0;

      // Registruj užívateľa ak je prihlásený
      const userData = this.getUserData();
      if (userData) {
        this.register(userData.userId, userData.userName);
      }
    });

    this.socket.on('disconnect', reason => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('❌ WebSocket disconnected:', reason);
      }
    });

    this.socket.on('connect_error', error => {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚫 WebSocket connection error:', error);
        logger.debug('🔍 WebSocket connection details:', {
          baseUrl: this.baseUrl,
          errorType: (error as any).type || 'unknown',
          errorMessage: error.message,
          reconnectAttempts: this.reconnectAttempts + 1,
        });
      }
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            '💀 Max reconnection attempts reached. WebSocket disabled.'
          );
          logger.debug('🔧 WebSocket troubleshooting tips:', {
            '1': 'Check if backend is running on port 3001',
            '2': 'Verify WebSocket server is enabled in backend',
            '3': 'Check firewall/network settings',
            '4': 'Try refreshing the page',
          });
        }
      }
    });

    this.socket.on('reconnect', attemptNumber => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          `🔄 WebSocket reconnected after ${attemptNumber} attempts`
        );
      }
      this.reconnectAttempts = 0;
    });
  }

  private getUserData(): { userId: string; userName: string } | null {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          userId: user.id,
          userName: user.username || user.name || 'Neznámy užívateľ',
        };
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    return null;
  }

  // 🔧 PUBLIC METHODS

  /**
   * Registrácia užívateľa pre personalizované notifikácie
   */
  register(userId: string, userName: string) {
    if (!this.socket?.connected) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚫 Cannot register - WebSocket not connected');
      }
      return;
    }

    this.socket.emit('register', { userId, userName });
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`👤 Registered user: ${userName} (${userId})`);
    }
  }

  /**
   * Test ping-pong komunikácie
   */
  ping() {
    if (!this.socket?.connected) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚫 Cannot ping - WebSocket not connected');
      }
      return;
    }

    this.socket.emit('ping');
  }

  /**
   * Pridaj event listener
   */
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    if (!this.socket) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `🚫 Cannot add listener for ${event} - WebSocket not initialized`
        );
      }
      return;
    }

    // @ts-expect-error - Socket.IO type compatibility issue
    this.socket.on(event, callback);

    // Uchováme callback pre cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners
      .get(event)!
      .push(callback as (..._args: unknown[]) => void);
  }

  /**
   * Odstráň event listener
   */
  off<K extends keyof WebSocketEvents>(
    event: K,
    callback?: WebSocketEvents[K]
  ) {
    if (!this.socket) return;

    if (callback) {
      // @ts-expect-error - Socket.IO type compatibility issue
      this.socket.off(event, callback);

      // Odstráň z našej mapy
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(
          callback as (..._args: unknown[]) => void
        );
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      // Odstráň všetky listenery pre event
      this.socket.off(event);
      this.eventListeners.delete(event);
    }
  }

  /**
   * Odpoj WebSocket
   */
  disconnect() {
    if (this.socket) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('🔌 Disconnecting WebSocket...');
      }

      // Vyčisti všetky event listeners
      this.eventListeners.forEach((_listeners, event) => {
        this.socket?.off(event);
      });
      this.eventListeners.clear();

      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Znovu pripoj WebSocket
   */
  reconnect() {
    this.disconnect();
    window.setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * Je WebSocket pripojený?
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Získaj Socket.IO inštanciu (pre pokročilé použitie)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
let websocketClient: WebSocketClient | null = null;

/**
 * Získaj WebSocket client inštanciu
 */
export function getWebSocketClient(): WebSocketClient {
  if (!websocketClient) {
    websocketClient = new WebSocketClient();
  }
  return websocketClient;
}

/**
 * Vyčisti WebSocket client
 */
export function cleanupWebSocketClient() {
  if (websocketClient) {
    websocketClient.disconnect();
    websocketClient = null;
  }
}
