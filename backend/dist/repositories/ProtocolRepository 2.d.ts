/**
 * Protocol Repository
 * Spravuje všetky databázové operácie pre protokoly (handover a return)
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import { Pool } from 'pg';
import { HandoverProtocol, ReturnProtocol } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
export declare class ProtocolRepository extends BaseRepository {
    constructor(pool: Pool);
    /**
     * Získa handover protokoly pre prenájom
     */
    getHandoverProtocolsByRental(rentalId: string): Promise<HandoverProtocol[]>;
    /**
     * Získa handover protokol podľa ID
     */
    getHandoverProtocolById(id: string): Promise<HandoverProtocol | null>;
    /**
     * Vytvorí handover protokol
     */
    createHandoverProtocol(protocolData: {
        rentalId: string;
        vehicleCondition: any;
        fuelLevel: number;
        mileage: number;
        photos?: string[];
        notes?: string;
        signature?: string;
        createdBy?: string;
    }): Promise<HandoverProtocol>;
    /**
     * Aktualizuje handover protokol
     */
    updateHandoverProtocol(id: string, protocolData: {
        vehicleCondition: any;
        fuelLevel: number;
        mileage: number;
        photos?: string[];
        notes?: string;
        signature?: string;
    }): Promise<void>;
    /**
     * Zmaže handover protokol
     */
    deleteHandoverProtocol(id: string): Promise<void>;
    /**
     * Získa return protokoly pre prenájom
     */
    getReturnProtocolsByRental(rentalId: string): Promise<ReturnProtocol[]>;
    /**
     * Získa return protokol podľa ID
     */
    getReturnProtocolById(id: string): Promise<ReturnProtocol | null>;
    /**
     * Vytvorí return protokol
     */
    createReturnProtocol(protocolData: {
        rentalId: string;
        vehicleCondition: any;
        fuelLevel: number;
        mileage: number;
        damages?: any[];
        photos?: string[];
        notes?: string;
        signature?: string;
        createdBy?: string;
    }): Promise<ReturnProtocol>;
    /**
     * Aktualizuje return protokol
     */
    updateReturnProtocol(id: string, protocolData: {
        vehicleCondition: any;
        fuelLevel: number;
        mileage: number;
        damages?: any[];
        photos?: string[];
        notes?: string;
        signature?: string;
    }): Promise<void>;
    /**
     * Zmaže return protokol
     */
    deleteReturnProtocol(id: string): Promise<void>;
    /**
     * Získa všetky protokoly pre štatistiky
     */
    getAllProtocolsForStats(): Promise<any[]>;
    /**
     * Získa bulk protocol status
     */
    getBulkProtocolStatus(rentalIds: string[]): Promise<any[]>;
    /**
     * Nahrá protocol súbor
     */
    uploadProtocolFile(protocolId: string, protocolType: 'handover' | 'return', filePath: string): Promise<void>;
    /**
     * Nahrá protocol PDF
     */
    uploadProtocolPDF(protocolId: string, protocolType: 'handover' | 'return', pdfPath: string): Promise<void>;
    /**
     * Mapuje databázový riadok na HandoverProtocol objekt
     */
    private mapRowToHandoverProtocol;
    /**
     * Mapuje databázový riadok na ReturnProtocol objekt
     */
    private mapRowToReturnProtocol;
}
//# sourceMappingURL=ProtocolRepository%202.d.ts.map