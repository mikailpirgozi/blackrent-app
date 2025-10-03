// 🔴 REAL-TIME WEBSOCKET SERVICE - BlackRent
// Poskytuje real-time updates pre prenájmy, vozidlá a ďalšie entity

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Rental, Vehicle, Customer } from '../types';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients = new Map<string, { userId?: string; userName?: string; socketId: string }>();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    console.log('🔴 WebSocket Service initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Registrácia užívateľa
      socket.on('register', (userData: { userId: string; userName: string }) => {
        this.connectedClients.set(socket.id, {
          userId: userData.userId,
          userName: userData.userName,
          socketId: socket.id
        });
        
        console.log(`👤 User registered: ${userData.userName} (${socket.id})`);
        
        // Pošli info o pripojených užívateľoch
        this.broadcastConnectedUsers();
      });

      // Odpojenie klienta
      socket.on('disconnect', () => {
        const clientData = this.connectedClients.get(socket.id);
        this.connectedClients.delete(socket.id);
        
        console.log(`🔌 Client disconnected: ${socket.id}${clientData ? ` (${clientData.userName})` : ''}`);
        this.broadcastConnectedUsers();
      });

      // Test ping-pong
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  // 📊 Broadcast connected users count
  private broadcastConnectedUsers() {
    const users = Array.from(this.connectedClients.values()).map(client => ({
      userName: client.userName,
      socketId: client.socketId
    }));

    this.io.emit('connected-users', {
      count: this.connectedClients.size,
      users: users.filter(u => u.userName) // Len registrovaní
    });
  }

  // 🏢 RENTAL EVENTS
  
  /**
   * Nový prenájom vytvorený
   */
  broadcastRentalCreated(rental: Rental, createdBy: string) {
    console.log(`📢 Broadcasting rental created: ${rental.id} by ${createdBy}`);
    
    this.io.emit('rental:created', {
      rental,
      createdBy,
      timestamp: new Date().toISOString(),
      message: `${createdBy} vytvoril nový prenájom pre ${rental.customerName}`
    });
  }

  /**
   * Prenájom aktualizovaný
   */
  broadcastRentalUpdated(rental: Rental, updatedBy: string, changes?: string[]) {
    console.log(`📢 Broadcasting rental updated: ${rental.id} by ${updatedBy}`);
    
    this.io.emit('rental:updated', {
      rental,
      updatedBy,
      changes,
      timestamp: new Date().toISOString(),
      message: `${updatedBy} aktualizoval prenájom ${rental.customerName}${changes?.length ? ` (${changes.join(', ')})` : ''}`
    });
  }

  /**
   * Prenájom zmazaný
   */
  broadcastRentalDeleted(rentalId: string, customerName: string, deletedBy: string) {
    console.log(`📢 Broadcasting rental deleted: ${rentalId} by ${deletedBy}`);
    
    this.io.emit('rental:deleted', {
      rentalId,
      customerName,
      deletedBy,
      timestamp: new Date().toISOString(),
      message: `${deletedBy} zmazal prenájom ${customerName}`
    });
  }

  // 🚗 VEHICLE EVENTS
  
  /**
   * Vozidlo aktualizované
   */
  broadcastVehicleUpdated(vehicle: Vehicle, updatedBy: string, changes?: string[]) {
    console.log(`📢 Broadcasting vehicle updated: ${vehicle.id} by ${updatedBy}`);
    
    this.io.emit('vehicle:updated', {
      vehicle,
      updatedBy,
      changes,
      timestamp: new Date().toISOString(),
      message: `${updatedBy} aktualizoval vozidlo ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`
    });
  }

  // 👥 CUSTOMER EVENTS
  
  /**
   * Zákazník vytvorený
   */
  broadcastCustomerCreated(customer: Customer, createdBy: string) {
    console.log(`📢 Broadcasting customer created: ${customer.id} by ${createdBy}`);
    
    this.io.emit('customer:created', {
      customer,
      createdBy,
      timestamp: new Date().toISOString(),
      message: `${createdBy} pridal nového zákazníka ${customer.name}`
    });
  }

  // 📊 SYSTEM EVENTS
  
  /**
   * Systémové upozornenie
   */
  broadcastSystemNotification(type: 'info' | 'warning' | 'error', message: string, details?: any) {
    console.log(`📢 Broadcasting system notification: ${type} - ${message}`);
    
    this.io.emit('system:notification', {
      type,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Database migrácia dokončená
   */
  broadcastMigrationCompleted(migrationName: string, success: boolean, details?: string) {
    this.io.emit('system:migration', {
      migrationName,
      success,
      details,
      timestamp: new Date().toISOString(),
      message: success 
        ? `✅ Migrácia "${migrationName}" úspešne dokončená`
        : `❌ Migrácia "${migrationName}" zlyhala`
    });
  }

  // 🔧 UTILITY METHODS
  
  /**
   * Získaj počet pripojených klientov
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Získaj zoznam pripojených užívateľov
   */
  getConnectedUsers(): Array<{ userId?: string; userName?: string; socketId: string }> {
    return Array.from(this.connectedClients.values());
  }

  /**
   * Protokol vytvorený - špecifický event pre protokoly
   */
  broadcastProtocolCreated(rentalId: string, protocolType: 'handover' | 'return', protocolId: string, createdBy: string) {
    console.log(`📢 Broadcasting protocol created: ${protocolType} for rental ${rentalId} by ${createdBy}`);
    
    this.io.emit('protocol:created', {
      rentalId,
      protocolType,
      protocolId,
      createdBy,
      timestamp: new Date().toISOString(),
      message: `${createdBy} vytvoril ${protocolType === 'handover' ? 'odovzdávací' : 'preberací'} protokol`
    });
  }

  /**
   * Protokol aktualizovaný
   */
  broadcastProtocolUpdated(rentalId: string, protocolType: 'handover' | 'return', protocolId: string, updatedBy: string, changes?: string[]) {
    console.log(`📢 Broadcasting protocol updated: ${protocolType} ${protocolId} by ${updatedBy}`);
    
    this.io.emit('protocol:updated', {
      rentalId,
      protocolType,
      protocolId,
      updatedBy,
      changes,
      timestamp: new Date().toISOString(),
      message: `${updatedBy} aktualizoval ${protocolType === 'handover' ? 'odovzdávací' : 'preberací'} protokol${changes?.length ? ` (${changes.join(', ')})` : ''}`
    });
  }

  // 💰 LEASING EVENTS
  
  /**
   * Leasing vytvorený
   */
  broadcastLeasingCreated(leasing: any, createdBy: string) {
    console.log(`📢 Broadcasting leasing created: ${leasing.id} by ${createdBy}`);
    
    this.io.emit('leasing:created', {
      leasing,
      createdBy,
      timestamp: new Date().toISOString(),
      message: `${createdBy} vytvoril nový leasing pre ${leasing.leasingCompany}`
    });
  }

  /**
   * Leasing aktualizovaný
   */
  broadcastLeasingUpdated(leasing: any, updatedBy: string, changes?: string[]) {
    console.log(`📢 Broadcasting leasing updated: ${leasing.id} by ${updatedBy}`);
    
    this.io.emit('leasing:updated', {
      leasing,
      updatedBy,
      changes,
      timestamp: new Date().toISOString(),
      message: `${updatedBy} aktualizoval leasing ${leasing.leasingCompany}${changes?.length ? ` (${changes.join(', ')})` : ''}`
    });
  }

  /**
   * Leasing zmazaný
   */
  broadcastLeasingDeleted(leasingId: string, vehicleId: string | undefined, deletedBy: string) {
    console.log(`📢 Broadcasting leasing deleted: ${leasingId} by ${deletedBy}`);
    
    this.io.emit('leasing:deleted', {
      leasingId,
      vehicleId,
      deletedBy,
      timestamp: new Date().toISOString(),
      message: `${deletedBy} zmazal leasing`
    });
  }

  /**
   * Leasing platba označená
   */
  broadcastLeasingPaymentMarked(leasingId: string, installmentNumber: number, markedBy: string) {
    console.log(`📢 Broadcasting leasing payment marked: ${leasingId} installment ${installmentNumber} by ${markedBy}`);
    
    this.io.emit('leasing:payment-marked', {
      leasingId,
      installmentNumber,
      markedBy,
      timestamp: new Date().toISOString(),
      message: `${markedBy} označil splátku #${installmentNumber} ako zaplatenú`
    });
  }

  /**
   * Test broadcast pre všetkých klientov
   */
  broadcastTest(message: string) {
    this.io.emit('test', {
      message,
      timestamp: new Date().toISOString(),
      connectedClients: this.connectedClients.size
    });
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null;

/**
 * Inicializácia WebSocket service
 */
export function initializeWebSocketService(httpServer: HTTPServer): WebSocketService {
  if (websocketService) {
    console.log('⚠️ WebSocket service already initialized');
    return websocketService;
  }

  websocketService = new WebSocketService(httpServer);
  return websocketService;
}

/**
 * Získanie existujúcej WebSocket service instance
 */
export function getWebSocketService(): WebSocketService | null {
  return websocketService;
}