// 🔴 WEBSOCKET CLIENT SERVICE - BlackRent Frontend
// Real-time komunikácia s backend WebSocket serverom

import { io, Socket } from 'socket.io-client';
import { Rental, Vehicle, Customer } from '../types';
import { getBaseUrl } from '../utils/apiUrl';

// Event typy pre TypeScript
export interface WebSocketEvents {
  // Rental events
  'rental:created': (data: { 
    rental: Rental; 
    createdBy: string; 
    timestamp: string; 
    message: string;
  }) => void;

  'rental:updated': (data: { 
    rental: Rental; 
    updatedBy: string; 
    changes?: string[];
    timestamp: string; 
    message: string;
  }) => void;

  'rental:deleted': (data: { 
    rentalId: string; 
    customerName: string;
    deletedBy: string; 
    timestamp: string; 
    message: string;
  }) => void;

  // Vehicle events
  'vehicle:updated': (data: { 
    vehicle: Vehicle; 
    updatedBy: string; 
    changes?: string[];
    timestamp: string; 
    message: string;
  }) => void;

  // Customer events
  'customer:created': (data: { 
    customer: Customer; 
    createdBy: string; 
    timestamp: string; 
    message: string;
  }) => void;

  // System events
  'system:notification': (data: { 
    type: 'info' | 'warning' | 'error'; 
    message: string; 
    details?: any;
    timestamp: string;
  }) => void;

  'system:migration': (data: { 
    migrationName: string; 
    success: boolean; 
    details?: string;
    timestamp: string;
    message: string;
  }) => void;

  // Connection events
  'connected-users': (data: { 
    count: number; 
    users: Array<{ userName?: string; socketId: string }>;
  }) => void;

  'pong': (data: { timestamp: number }) => void;
  'test': (data: { message: string; timestamp: string; connectedClients: number }) => void;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners = new Map<string, Function[]>();

  constructor() {
    this.connect();
  }

  private connect() {
    // WebSocket server beží na root, nie na /api ako REST API
    const baseUrl = getBaseUrl();
    
    // Optimalized logging - reduced verbosity
    if (process.env.NODE_ENV === 'development') {
      console.log('🔴 Connecting to WebSocket:', baseUrl);
    }
    
    this.socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // Optimalized: Single consolidated log for connection
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Registruj užívateľa ak je prihlásený
      const userData = this.getUserData();
      if (userData) {
        this.register(userData.userId, userData.userName);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('💀 Max reconnection attempts reached. WebSocket disabled.');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
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
          userName: user.username || user.name || 'Neznámy užívateľ'
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
      console.warn('🚫 Cannot register - WebSocket not connected');
      return;
    }

    this.socket.emit('register', { userId, userName });
    console.log(`👤 Registered user: ${userName} (${userId})`);
  }

  /**
   * Test ping-pong komunikácie
   */
  ping() {
    if (!this.socket?.connected) {
      console.warn('🚫 Cannot ping - WebSocket not connected');
      return;
    }

    this.socket.emit('ping');
  }

  /**
   * Pridaj event listener
   */
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    if (!this.socket) {
      console.warn(`🚫 Cannot add listener for ${event} - WebSocket not initialized`);
      return;
    }

    this.socket.on(event, callback as any);
    
    // Uchováme callback pre cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback as Function);
  }

  /**
   * Odstráň event listener
   */
  off<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback as any);
      
      // Odstráň z našej mapy
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback as Function);
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
      console.log('🔌 Disconnecting WebSocket...');
      
      // Vyčisti všetky event listeners
      this.eventListeners.forEach((listeners, event) => {
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
    setTimeout(() => {
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