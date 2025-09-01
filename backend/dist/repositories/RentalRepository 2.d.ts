/**
 * Rental Repository
 * Spravuje všetky databázové operácie pre prenájmy
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import { Pool } from 'pg';
import { Rental } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
export declare class RentalRepository extends BaseRepository {
    private rentalCache;
    private readonly RENTAL_CACHE_TTL;
    constructor(pool: Pool);
    /**
     * Získa všetky prenájmy
     */
    getRentals(): Promise<Rental[]>;
    /**
     * Načíta prenájmy priamo z databázy (bez cache)
     */
    private getRentalsFresh;
    /**
     * Získa prenájmy pre dátumový rozsah
     */
    getRentalsForDateRange(startDate: Date, endDate: Date): Promise<Rental[]>;
    /**
     * Získa prenájmy s pagináciou
     */
    getRentalsPaginated(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        rentals: Rental[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Získa jeden prenájom podľa ID
     */
    getRental(id: string): Promise<Rental | null>;
    /**
     * Vytvorí nový prenájom - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
     */
    createRental(rentalData: {
        vehicleId?: string;
        customerId?: string;
        customerName: string;
        startDate: Date;
        endDate: Date;
        totalPrice: number;
        commission: number;
        paymentMethod: string;
        discount?: any;
        customCommission?: any;
        extraKmCharge?: number;
        paid?: boolean;
        status?: string;
        handoverPlace?: string;
        confirmed?: boolean;
        payments?: any;
        history?: any;
        orderNumber?: string;
        deposit?: number;
        allowedKilometers?: number;
        dailyKilometers?: number;
        extraKilometerRate?: number;
        returnConditions?: string;
        fuelLevel?: number;
        odometer?: number;
        returnFuelLevel?: number;
        returnOdometer?: number;
        actualKilometers?: number;
        fuelRefillCost?: number;
        handoverProtocolId?: string;
        returnProtocolId?: string;
        isFlexible?: boolean;
        flexibleEndDate?: Date;
        sourceType?: 'manual' | 'email_auto' | 'api_auto';
        approvalStatus?: 'pending' | 'approved' | 'rejected' | 'spam';
        emailContent?: string;
        autoProcessedAt?: Date;
        approvedBy?: string;
        approvedAt?: Date;
        rejectionReason?: string;
    }): Promise<Rental>;
    /**
     * Aktualizuje prenájom
     */
    updateRental(rental: Rental): Promise<void>;
    /**
     * Zmaže prenájom
     */
    deleteRental(id: string): Promise<void>;
    /**
     * Mapuje databázový riadok na Rental objekt
     */
    private mapRowToRental;
    /**
     * Invaliduje rental cache
     */
    private invalidateRentalCache;
}
//# sourceMappingURL=RentalRepository%202.d.ts.map