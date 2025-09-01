/**
 * Insurance Repository
 * Spravuje všetky databázové operácie pre poistenia, poisťovne a škodové udalosti
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import { Pool } from 'pg';
import { Insurance, Insurer, InsuranceClaim } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
export declare class InsuranceRepository extends BaseRepository {
    constructor(pool: Pool);
    /**
     * Získa všetky poistenia
     */
    getInsurances(): Promise<Insurance[]>;
    /**
     * Vytvorí nové poistenie
     */
    createInsurance(insuranceData: {
        vehicleId?: string;
        rentalId?: number;
        insurerId?: string;
        type: string;
        policyNumber: string;
        startDate: Date;
        endDate: Date;
        premium: number;
        deductible?: number;
        coverage?: any;
        status?: string;
        notes?: string;
    }): Promise<Insurance>;
    /**
     * Aktualizuje poistenie
     */
    updateInsurance(id: string, insuranceData: {
        vehicleId: string;
        type: string;
        policyNumber: string;
        startDate: Date;
        endDate: Date;
        premium: number;
        deductible?: number;
        coverage?: any;
        status?: string;
        notes?: string;
        insurerId?: string;
    }): Promise<void>;
    /**
     * Zmaže poistenie
     */
    deleteInsurance(id: string): Promise<void>;
    /**
     * Získa všetky poisťovne
     */
    getInsurers(): Promise<Insurer[]>;
    /**
     * Vytvorí novú poisťovňu
     */
    createInsurer(insurerData: {
        name: string;
    }): Promise<Insurer>;
    /**
     * Zmaže poisťovňu
     */
    deleteInsurer(id: string): Promise<void>;
    /**
     * Získa škodové udalosti
     */
    getInsuranceClaims(vehicleId?: string): Promise<InsuranceClaim[]>;
    /**
     * Vytvorí škodovú udalosť
     */
    createInsuranceClaim(claimData: {
        vehicleId: string;
        insuranceId?: string;
        claimNumber: string;
        incidentDate: Date;
        reportedDate: Date;
        description: string;
        estimatedCost?: number;
        actualCost?: number;
        status?: string;
        notes?: string;
    }): Promise<InsuranceClaim>;
    /**
     * Aktualizuje škodovú udalosť
     */
    updateInsuranceClaim(id: string, claimData: {
        vehicleId: string;
        insuranceId?: string;
        claimNumber: string;
        incidentDate: Date;
        reportedDate: Date;
        description: string;
        estimatedCost?: number;
        actualCost?: number;
        status?: string;
        notes?: string;
    }): Promise<void>;
    /**
     * Zmaže škodovú udalosť
     */
    deleteInsuranceClaim(id: string): Promise<void>;
    /**
     * Mapuje databázový riadok na Insurance objekt
     */
    private mapRowToInsurance;
    /**
     * Mapuje databázový riadok na Insurer objekt
     */
    private mapRowToInsurer;
    /**
     * Mapuje databázový riadok na InsuranceClaim objekt
     */
    private mapRowToInsuranceClaim;
}
//# sourceMappingURL=InsuranceRepository%202.d.ts.map