/**
 * Vehicle Repository
 * Spravuje všetky databázové operácie pre vozidlá
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
import { Pool } from 'pg';
import { Vehicle } from '../types';
import { BaseRepository } from '../models/base/BaseRepository';
export declare class VehicleRepository extends BaseRepository {
    private vehicleCache;
    private readonly VEHICLE_CACHE_TTL;
    constructor(pool: Pool);
    /**
     * Získa všetky vozidlá s cache systémom
     */
    getVehicles(includeRemoved?: boolean, includePrivate?: boolean): Promise<Vehicle[]>;
    /**
     * Načíta vozidlá priamo z databázy (bez cache)
     */
    private getVehiclesFresh;
    /**
     * Získa jedno vozidlo podľa ID
     */
    getVehicle(id: string): Promise<Vehicle | null>;
    /**
     * Vytvorí nové vozidlo - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
     */
    createVehicle(vehicleData: {
        brand: string;
        model: string;
        licensePlate: string;
        vin?: string;
        company: string;
        pricing: any[];
        commission: any;
        status: string;
        year?: number;
    }): Promise<Vehicle>;
    /**
     * Aktualizuje vozidlo - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
     */
    updateVehicle(vehicle: Vehicle): Promise<void>;
    /**
     * Zmaže vozidlo
     */
    deleteVehicle(id: string): Promise<void>;
    /**
     * Získa vozidlá s pagináciou
     */
    getVehiclesPaginated(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        company?: string;
        category?: string;
    }): Promise<{
        vehicles: Vehicle[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Invaliduje vehicle cache
     */
    private invalidateVehicleCache;
}
//# sourceMappingURL=VehicleRepository%202.d.ts.map