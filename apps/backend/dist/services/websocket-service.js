"use strict";
// 🔴 REAL-TIME WEBSOCKET SERVICE - BlackRent
// Poskytuje real-time updates pre prenájmy, vozidlá a ďalšie entity
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
exports.initializeWebSocketService = initializeWebSocketService;
exports.getWebSocketService = getWebSocketService;
const socket_io_1 = require("socket.io");
class WebSocketService {
    constructor(httpServer) {
        this.connectedClients = new Map();
        this.io = new socket_io_1.Server(httpServer, {
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
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔗 Client connected: ${socket.id}`);
            // Registrácia užívateľa
            socket.on('register', (userData) => {
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
    broadcastConnectedUsers() {
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
    broadcastRentalCreated(rental, createdBy) {
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
    broadcastRentalUpdated(rental, updatedBy, changes) {
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
    broadcastRentalDeleted(rentalId, customerName, deletedBy) {
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
    broadcastVehicleUpdated(vehicle, updatedBy, changes) {
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
    broadcastCustomerCreated(customer, createdBy) {
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
    broadcastSystemNotification(type, message, details) {
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
    broadcastMigrationCompleted(migrationName, success, details) {
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
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    /**
     * Získaj zoznam pripojených užívateľov
     */
    getConnectedUsers() {
        return Array.from(this.connectedClients.values());
    }
    /**
     * Protokol vytvorený - špecifický event pre protokoly
     */
    broadcastProtocolCreated(rentalId, protocolType, protocolId, createdBy) {
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
    broadcastProtocolUpdated(rentalId, protocolType, protocolId, updatedBy, changes) {
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
    /**
     * Test broadcast pre všetkých klientov
     */
    broadcastTest(message) {
        this.io.emit('test', {
            message,
            timestamp: new Date().toISOString(),
            connectedClients: this.connectedClients.size
        });
    }
}
exports.WebSocketService = WebSocketService;
// Singleton instance
let websocketService = null;
/**
 * Inicializácia WebSocket service
 */
function initializeWebSocketService(httpServer) {
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
function getWebSocketService() {
    return websocketService;
}
//# sourceMappingURL=websocket-service.js.map