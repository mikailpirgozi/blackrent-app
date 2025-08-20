import { Server as HTTPServer } from 'http';
import { Rental, Vehicle, Customer } from '../types';
export declare class WebSocketService {
    private io;
    private connectedClients;
    constructor(httpServer: HTTPServer);
    private setupEventHandlers;
    private broadcastConnectedUsers;
    /**
     * Nový prenájom vytvorený
     */
    broadcastRentalCreated(rental: Rental, createdBy: string): void;
    /**
     * Prenájom aktualizovaný
     */
    broadcastRentalUpdated(rental: Rental, updatedBy: string, changes?: string[]): void;
    /**
     * Prenájom zmazaný
     */
    broadcastRentalDeleted(rentalId: string, customerName: string, deletedBy: string): void;
    /**
     * Vozidlo aktualizované
     */
    broadcastVehicleUpdated(vehicle: Vehicle, updatedBy: string, changes?: string[]): void;
    /**
     * Zákazník vytvorený
     */
    broadcastCustomerCreated(customer: Customer, createdBy: string): void;
    /**
     * Systémové upozornenie
     */
    broadcastSystemNotification(type: 'info' | 'warning' | 'error', message: string, details?: any): void;
    /**
     * Database migrácia dokončená
     */
    broadcastMigrationCompleted(migrationName: string, success: boolean, details?: string): void;
    /**
     * Získaj počet pripojených klientov
     */
    getConnectedClientsCount(): number;
    /**
     * Získaj zoznam pripojených užívateľov
     */
    getConnectedUsers(): Array<{
        userId?: string;
        userName?: string;
        socketId: string;
    }>;
    /**
     * Protokol vytvorený - špecifický event pre protokoly
     */
    broadcastProtocolCreated(rentalId: string, protocolType: 'handover' | 'return', protocolId: string, createdBy: string): void;
    /**
     * Protokol aktualizovaný
     */
    broadcastProtocolUpdated(rentalId: string, protocolType: 'handover' | 'return', protocolId: string, updatedBy: string, changes?: string[]): void;
    /**
     * Test broadcast pre všetkých klientov
     */
    broadcastTest(message: string): void;
}
/**
 * Inicializácia WebSocket service
 */
export declare function initializeWebSocketService(httpServer: HTTPServer): WebSocketService;
/**
 * Získanie existujúcej WebSocket service instance
 */
export declare function getWebSocketService(): WebSocketService | null;
//# sourceMappingURL=websocket-service.d.ts.map