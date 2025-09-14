/**
 * Protocol Repository
 * Spravuje všetky databázové operácie pre protokoly (handover a return)
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import type { Pool } from 'pg';
import { BaseRepository } from '../models/base/BaseRepository';
import type { HandoverProtocol, ReturnProtocol, VehicleCondition } from '../types';
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
        vehicleCondition: VehicleCondition;
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
        vehicleCondition: VehicleCondition;
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
        vehicleCondition: VehicleCondition;
        fuelLevel: number;
        mileage: number;
        damages?: Array<{
            type: 'scratch' | 'dent' | 'stain' | 'missing_item' | 'other';
            location: string;
            severity: 'minor' | 'major';
            description: string;
            cost?: number;
        }>;
        photos?: string[];
        notes?: string;
        signature?: string;
        createdBy?: string;
    }): Promise<ReturnProtocol>;
    /**
     * Aktualizuje return protokol
     */
    updateReturnProtocol(id: string, protocolData: {
        vehicleCondition: VehicleCondition;
        fuelLevel: number;
        mileage: number;
        damages?: Array<{
            type: 'scratch' | 'dent' | 'stain' | 'missing_item' | 'other';
            location: string;
            severity: 'minor' | 'major';
            description: string;
            cost?: number;
        }>;
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
    getAllProtocolsForStats(): Promise<Array<{
        id: string;
        type: 'handover' | 'return';
        rentalId: string;
        createdAt: Date;
        status: string;
    }>>;
    /**
     * Získa bulk protocol status
     */
    getBulkProtocolStatus(rentalIds: string[]): Promise<Array<{
        rentalId: string;
        hasHandover: boolean;
        hasReturn: boolean;
        handoverStatus?: string;
        returnStatus?: string;
    }>>;
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
//# sourceMappingURL=ProtocolRepository.d.ts.map