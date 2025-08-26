"use strict";
/**
 * Insurance Repository
 * Spravuje všetky databázové operácie pre poistenia, poisťovne a škodové udalosti
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceRepository = void 0;
const BaseRepository_1 = require("../models/base/BaseRepository");
class InsuranceRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool);
    }
    // ============================================================================
    // INSURANCE METHODS
    // ============================================================================
    /**
     * Získa všetky poistenia
     */
    async getInsurances() {
        const client = await this.getClient();
        try {
            const result = await client.query(`
        SELECT 
          i.*,
          v.brand as vehicle_brand,
          v.model as vehicle_model,
          v.license_plate as vehicle_license_plate,
          ins.name as insurer_name
        FROM insurances i
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        LEFT JOIN insurers ins ON i.insurer_id = ins.id
        ORDER BY i.created_at DESC
      `);
            return result.rows.map(row => this.mapRowToInsurance(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Vytvorí nové poistenie
     */
    async createInsurance(insuranceData) {
        return this.executeTransaction(async (client) => {
            const result = await client.query(`INSERT INTO insurances (
          vehicle_id, rental_id, insurer_id, type, policy_number,
          start_date, end_date, premium, deductible, coverage,
          status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`, [
                insuranceData.vehicleId || null,
                insuranceData.rentalId || null,
                insuranceData.insurerId || null,
                insuranceData.type,
                insuranceData.policyNumber,
                insuranceData.startDate,
                insuranceData.endDate,
                insuranceData.premium,
                insuranceData.deductible || null,
                insuranceData.coverage ? JSON.stringify(insuranceData.coverage) : null,
                insuranceData.status || 'active',
                insuranceData.notes || null
            ]);
            return this.mapRowToInsurance(result.rows[0]);
        });
    }
    /**
     * Aktualizuje poistenie
     */
    async updateInsurance(id, insuranceData) {
        const client = await this.getClient();
        try {
            await client.query(`UPDATE insurances SET 
          vehicle_id = $1, type = $2, policy_number = $3, start_date = $4,
          end_date = $5, premium = $6, deductible = $7, coverage = $8,
          status = $9, notes = $10, insurer_id = $11, updated_at = CURRENT_TIMESTAMP
        WHERE id = $12`, [
                insuranceData.vehicleId,
                insuranceData.type,
                insuranceData.policyNumber,
                insuranceData.startDate,
                insuranceData.endDate,
                insuranceData.premium,
                insuranceData.deductible || null,
                insuranceData.coverage ? JSON.stringify(insuranceData.coverage) : null,
                insuranceData.status || 'active',
                insuranceData.notes || null,
                insuranceData.insurerId || null,
                id
            ]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže poistenie
     */
    async deleteInsurance(id) {
        const client = await this.getClient();
        try {
            await client.query('DELETE FROM insurances WHERE id = $1', [id]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    // ============================================================================
    // INSURER METHODS
    // ============================================================================
    /**
     * Získa všetky poisťovne
     */
    async getInsurers() {
        const client = await this.getClient();
        try {
            const result = await client.query('SELECT * FROM insurers ORDER BY name');
            return result.rows.map(row => this.mapRowToInsurer(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Vytvorí novú poisťovňu
     */
    async createInsurer(insurerData) {
        const client = await this.getClient();
        try {
            const result = await client.query('INSERT INTO insurers (name) VALUES ($1) RETURNING *', [insurerData.name]);
            return this.mapRowToInsurer(result.rows[0]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže poisťovňu
     */
    async deleteInsurer(id) {
        const client = await this.getClient();
        try {
            await client.query('DELETE FROM insurers WHERE id = $1', [id]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    // ============================================================================
    // INSURANCE CLAIM METHODS
    // ============================================================================
    /**
     * Získa škodové udalosti
     */
    async getInsuranceClaims(vehicleId) {
        const client = await this.getClient();
        try {
            let query = `
        SELECT 
          ic.*,
          v.brand as vehicle_brand,
          v.model as vehicle_model,
          v.license_plate as vehicle_license_plate,
          i.policy_number as insurance_policy_number,
          ins.name as insurer_name
        FROM insurance_claims ic
        LEFT JOIN vehicles v ON ic.vehicle_id = v.id
        LEFT JOIN insurances i ON ic.insurance_id = i.id
        LEFT JOIN insurers ins ON i.insurer_id = ins.id
      `;
            const params = [];
            if (vehicleId) {
                query += ' WHERE ic.vehicle_id = $1';
                params.push(vehicleId);
            }
            query += ' ORDER BY ic.created_at DESC';
            const result = await client.query(query, params);
            return result.rows.map(row => this.mapRowToInsuranceClaim(row));
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Vytvorí škodovú udalosť
     */
    async createInsuranceClaim(claimData) {
        return this.executeTransaction(async (client) => {
            const result = await client.query(`INSERT INTO insurance_claims (
          vehicle_id, insurance_id, claim_number, incident_date,
          reported_date, description, estimated_cost, actual_cost,
          status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`, [
                claimData.vehicleId,
                claimData.insuranceId || null,
                claimData.claimNumber,
                claimData.incidentDate,
                claimData.reportedDate,
                claimData.description,
                claimData.estimatedCost || null,
                claimData.actualCost || null,
                claimData.status || 'pending',
                claimData.notes || null
            ]);
            return this.mapRowToInsuranceClaim(result.rows[0]);
        });
    }
    /**
     * Aktualizuje škodovú udalosť
     */
    async updateInsuranceClaim(id, claimData) {
        const client = await this.getClient();
        try {
            await client.query(`UPDATE insurance_claims SET 
          vehicle_id = $1, insurance_id = $2, claim_number = $3,
          incident_date = $4, reported_date = $5, description = $6,
          estimated_cost = $7, actual_cost = $8, status = $9,
          notes = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $11`, [
                claimData.vehicleId,
                claimData.insuranceId || null,
                claimData.claimNumber,
                claimData.incidentDate,
                claimData.reportedDate,
                claimData.description,
                claimData.estimatedCost || null,
                claimData.actualCost || null,
                claimData.status || 'pending',
                claimData.notes || null,
                id
            ]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    /**
     * Zmaže škodovú udalosť
     */
    async deleteInsuranceClaim(id) {
        const client = await this.getClient();
        try {
            await client.query('DELETE FROM insurance_claims WHERE id = $1', [id]);
        }
        finally {
            this.releaseClient(client);
        }
    }
    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    /**
     * Mapuje databázový riadok na Insurance objekt
     */
    mapRowToInsurance(row) {
        return {
            id: row.id,
            vehicleId: row.vehicle_id || undefined,
            rentalId: row.rental_id || undefined,
            insurerId: row.insurer_id || undefined,
            type: row.type,
            policyNumber: row.policy_number,
            validFrom: new Date(row.valid_from || row.start_date),
            validTo: new Date(row.valid_to || row.end_date),
            price: row.premium || row.price,
            company: row.company || row.insurer_name || '',
            paymentFrequency: row.payment_frequency || 'monthly',
            filePath: row.file_path || undefined,
            filePaths: row.file_paths ? (typeof row.file_paths === 'string' ? JSON.parse(row.file_paths) : row.file_paths) : undefined,
            greenCardValidFrom: row.green_card_valid_from ? new Date(row.green_card_valid_from) : undefined,
            greenCardValidTo: row.green_card_valid_to ? new Date(row.green_card_valid_to) : undefined
        };
    }
    /**
     * Mapuje databázový riadok na Insurer objekt
     */
    mapRowToInsurer(row) {
        return {
            id: row.id,
            name: row.name,
            createdAt: row.created_at ? new Date(row.created_at) : new Date()
        };
    }
    /**
     * Mapuje databázový riadok na InsuranceClaim objekt
     */
    mapRowToInsuranceClaim(row) {
        return {
            id: row.id,
            vehicleId: row.vehicle_id,
            insuranceId: row.insurance_id || undefined,
            claimNumber: row.claim_number || undefined,
            incidentDate: new Date(row.incident_date),
            reportedDate: new Date(row.reported_date),
            description: row.description,
            location: row.location || undefined,
            incidentType: row.incident_type || 'other',
            estimatedDamage: row.estimated_damage || row.estimated_cost || undefined,
            deductible: row.deductible || undefined,
            payoutAmount: row.payout_amount || undefined,
            status: row.status || 'reported',
            filePaths: row.file_paths ? (typeof row.file_paths === 'string' ? JSON.parse(row.file_paths) : row.file_paths) : undefined,
            policeReportNumber: row.police_report_number || undefined,
            otherPartyInfo: row.other_party_info || undefined,
            notes: row.notes || undefined,
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
        };
    }
}
exports.InsuranceRepository = InsuranceRepository;
//# sourceMappingURL=InsuranceRepository.js.map