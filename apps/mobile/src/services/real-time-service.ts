// Simple EventEmitter implementation for React Native
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

export interface RealTimeEvent {
  id: string;
  type: 'booking_update' | 'vehicle_availability' | 'chat_message' | 'location_update' | 'emergency_alert' | 'price_change';
  timestamp: Date;
  data: any;
  userId?: string;
  vehicleId?: string;
  bookingId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'company' | 'support';
  recipientId: string;
  recipientType: 'customer' | 'company' | 'support';
  message: string;
  timestamp: Date;
  type: 'text' | 'image' | 'location' | 'file';
  attachments?: {
    type: 'image' | 'file' | 'location';
    url?: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    fileName?: string;
    fileSize?: number;
  }[];
  status: 'sending' | 'sent' | 'delivered' | 'read';
  bookingId?: string;
}

export interface VehicleAvailability {
  vehicleId: string;
  isAvailable: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  currentBookingId?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  lastUpdated: Date;
}

export interface LiveTracking {
  bookingId: string;
  vehicleId: string;
  driverId?: string;
  status: 'pickup_pending' | 'in_transit_pickup' | 'arrived_pickup' | 'in_progress' | 'in_transit_return' | 'arrived_return' | 'completed';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    speed?: number;
    heading?: number;
  };
  estimatedArrival?: Date;
  lastUpdated: Date;
}

class RealTimeService extends EventEmitter {
  private static instance: RealTimeService;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private subscriptions = new Set<string>();
  private messageQueue: RealTimeEvent[] = [];

  public static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService();
    }
    return RealTimeService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(userId: string, token?: string): Promise<void> {
    try {
      // In production, this would be wss://api.blackrent.sk/ws
      const wsUrl = __DEV__ 
        ? 'ws://localhost:3001/ws'
        : 'wss://api.blackrent.sk/ws';

      this.websocket = new WebSocket(`${wsUrl}?userId=${userId}&token=${token || ''}`);

      this.websocket.onopen = () => {
                this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Send queued messages
        this.flushMessageQueue();
        
        // Resubscribe to channels
        this.resubscribe();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data: RealTimeEvent = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
                  }
      };

      this.websocket.onclose = () => {
                this.isConnected = false;
        this.emit('disconnected');
        this.attemptReconnect(userId, token);
      };

      this.websocket.onerror = (error) => {
                this.emit('error', error);
      };

    } catch (error) {
            throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
  }

  /**
   * Subscribe to real-time updates for specific channels
   */
  subscribe(channels: string[]): void {
    channels.forEach(channel => {
      this.subscriptions.add(channel);
      
      if (this.isConnected && this.websocket) {
        this.websocket.send(JSON.stringify({
          type: 'subscribe',
          channel,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  /**
   * Unsubscribe from channels
   */
  unsubscribe(channels: string[]): void {
    channels.forEach(channel => {
      this.subscriptions.delete(channel);
      
      if (this.isConnected && this.websocket) {
        this.websocket.send(JSON.stringify({
          type: 'unsubscribe',
          channel,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  /**
   * Send chat message
   */
  async sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>): Promise<void> {
    const chatMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'sending'
    };

    // Emit locally first for immediate UI update
    this.emit('chat_message', chatMessage);

    // Send to server
    this.sendMessage({
      id: `event_${Date.now()}`,
      type: 'chat_message',
      timestamp: new Date(),
      data: chatMessage
    });
  }

  /**
   * Update vehicle availability
   */
  async updateVehicleAvailability(availability: VehicleAvailability): Promise<void> {
    this.sendMessage({
      id: `event_${Date.now()}`,
      type: 'vehicle_availability',
      timestamp: new Date(),
      data: availability,
      vehicleId: availability.vehicleId
    });
  }

  /**
   * Update live tracking
   */
  async updateLiveTracking(tracking: LiveTracking): Promise<void> {
    this.sendMessage({
      id: `event_${Date.now()}`,
      type: 'location_update',
      timestamp: new Date(),
      data: tracking,
      bookingId: tracking.bookingId,
      vehicleId: tracking.vehicleId
    });
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(alert: any): Promise<void> {
    this.sendMessage({
      id: `event_${Date.now()}`,
      type: 'emergency_alert',
      timestamp: new Date(),
      data: alert,
      userId: alert.userId,
      vehicleId: alert.vehicleId,
      bookingId: alert.bookingId
    });
  }

  /**
   * Get connection status
   */
  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: RealTimeEvent): void {
    
    switch (event.type) {
      case 'chat_message':
        this.emit('chat_message', event.data as ChatMessage);
        break;
      
      case 'vehicle_availability':
        this.emit('vehicle_availability', event.data as VehicleAvailability);
        break;
      
      case 'location_update':
        this.emit('location_update', event.data as LiveTracking);
        break;
      
      case 'booking_update':
        this.emit('booking_update', event.data);
        break;
      
      case 'emergency_alert':
        this.emit('emergency_alert', event.data);
        break;
      
      case 'price_change':
        this.emit('price_change', event.data);
        break;
      
      default:
            }
  }

  /**
   * Send message to server
   */
  private sendMessage(event: RealTimeEvent): void {
    if (this.isConnected && this.websocket) {
      this.websocket.send(JSON.stringify(event));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(event);
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected && this.websocket) {
      const message = this.messageQueue.shift();
      if (message) {
        this.websocket.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribe(): void {
    if (this.subscriptions.size > 0) {
      this.subscribe(Array.from(this.subscriptions));
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(userId: string, token?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect(userId, token).catch(error => {
                  });
      }
    }, delay);
  }

  /**
   * Mock real-time events for development
   */
  startMockEvents(): void {
    if (!__DEV__) return;

    // Mock vehicle availability updates
    setInterval(() => {
      const mockAvailability: VehicleAvailability = {
        vehicleId: `vehicle_${Math.floor(Math.random() * 10) + 1}`,
        isAvailable: Math.random() > 0.3,
        lastUpdated: new Date(),
        location: {
          latitude: 48.1486 + (Math.random() - 0.5) * 0.1,
          longitude: 17.1077 + (Math.random() - 0.5) * 0.1,
          address: 'Bratislava, Slovakia'
        }
      };

      this.emit('vehicle_availability', mockAvailability);
    }, 10000); // Every 10 seconds

    // Mock chat messages
    setInterval(() => {
      const mockMessage: ChatMessage = {
        id: `mock_${Date.now()}`,
        senderId: 'support_1',
        senderName: 'BlackRent Support',
        senderType: 'support',
        recipientId: 'user_1',
        recipientType: 'customer',
        message: 'Ahoj! Máte nejaké otázky ohľadom vašej rezervácie?',
        timestamp: new Date(),
        type: 'text',
        status: 'delivered'
      };

      this.emit('chat_message', mockMessage);
    }, 30000); // Every 30 seconds

    // Mock live tracking
    setInterval(() => {
      const mockTracking: LiveTracking = {
        bookingId: 'booking_123',
        vehicleId: 'vehicle_1',
        status: 'in_transit_pickup',
        location: {
          latitude: 48.1486 + (Math.random() - 0.5) * 0.01,
          longitude: 17.1077 + (Math.random() - 0.5) * 0.01,
          address: 'Smerom k vám...',
          speed: Math.floor(Math.random() * 60) + 20,
          heading: Math.floor(Math.random() * 360)
        },
        estimatedArrival: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        lastUpdated: new Date()
      };

      this.emit('location_update', mockTracking);
    }, 5000); // Every 5 seconds
  }
}

export const realTimeService = RealTimeService.getInstance();
