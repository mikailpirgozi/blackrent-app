/**
 * Settlement Repository
 * Spravuje všetky databázové operácie pre vyúčtovania
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import type { Pool } from 'pg';
import { BaseRepository } from '../models/base/BaseRepository';
import type { Settlement } from '../types';
export declare class SettlementRepository extends BaseRepository {
    constructor(pool: Pool);
    /**
     * Získa všetky vyúčtovania
     */
    getSettlements(): Promise<Settlement[]>;
    /**
     * Získa vyúčtovanie podľa ID
     */
    getSettlement(id: string): Promise<Settlement | null>;
    /**
     * Vytvorí nové vyúčtovanie
     */
    createSettlement(settlementData: {
        companyId: string;
        periodStart: Date;
        periodEnd: Date;
        totalRevenue: number;
        totalExpenses: number;
        commission: number;
        netAmount: number;
        status?: string;
        notes?: string;
        details?: {
            breakdown: Array<{
                type: 'rental' | 'commission' | 'expense' | 'other';
                amount: number;
                description: string;
            }>;
            notes?: string;
        };
    }): Promise<Settlement>;
    /**
     * Aktualizuje vyúčtovanie
     */
    updateSettlement(id: string, settlementData: {
        periodStart?: Date;
        periodEnd?: Date;
        totalRevenue?: number;
        totalExpenses?: number;
        commission?: number;
        netAmount?: number;
        status?: string;
        notes?: string;
        details?: {
            breakdown: Array<{
                type: 'rental' | 'commission' | 'expense' | 'other';
                amount: number;
                description: string;
            }>;
            notes?: string;
        };
    }): Promise<void>;
    /**
     * Zmaže vyúčtovanie
     */
    deleteSettlement(id: string): Promise<void>;
    /**
     * Mapuje databázový riadok na Settlement objekt
     */
    private mapRowToSettlement;
    /**
     * Konvertuje camelCase na snake_case
     */
    private camelToSnake;
}
//# sourceMappingURL=SettlementRepository.d.ts.map