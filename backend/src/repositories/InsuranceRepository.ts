/**
 * Insurance Repository
 * Spravuje všetky databázové operácie pre poistenia, poisťovne a škodové udalosti
 * Extrahované z postgres-database.ts - ZACHOVÁVA PRESNE ROVNAKÚ FUNKCIONALITU
 */

import type { Pool } from 'pg';

import { BaseRepository } from '../models/base/BaseRepository';
import type { Insurance, InsuranceClaim, Insurer, PaymentFrequency } from '../types';


export class InsuranceRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  // ============================================================================
  // INSURANCE METHODS
  // ============================================================================

  /**
   * Získa všetky poistenia
   */
  async getInsurances(): Promise<Insurance[]> {
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
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí nové poistenie
   */
  async createInsurance(insuranceData: {
    vehicleId?: string;
    rentalId?: number;
    insurerId?: string;
    type: string;
    policyNumber: string;
    startDate: Date;
    endDate: Date;
    premium: number;
    deductible?: number;
    coverage?: {
      liability: boolean;
      collision: boolean;
      comprehensive: boolean;
      personalInjury: boolean;
      propertyDamage: boolean;
    };
    status?: string;
    notes?: string;
  }): Promise<Insurance> {
    return this.executeTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO insurances (
          vehicle_id, rental_id, insurer_id, type, policy_number,
          start_date, end_date, premium, deductible, coverage,
          status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
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
        ]
      );

      return this.mapRowToInsurance(result.rows[0]);
    });
  }

  /**
   * Aktualizuje poistenie
   */
  async updateInsurance(id: string, insuranceData: {
    vehicleId: string;
    type: string;
    policyNumber: string;
    startDate: Date;
    endDate: Date;
    premium: number;
    deductible?: number;
    coverage?: {
      liability: boolean;
      collision: boolean;
      comprehensive: boolean;
      personalInjury: boolean;
      propertyDamage: boolean;
    };
    status?: string;
    notes?: string;
    insurerId?: string;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE insurances SET 
          vehicle_id = $1, type = $2, policy_number = $3, start_date = $4,
          end_date = $5, premium = $6, deductible = $7, coverage = $8,
          status = $9, notes = $10, insurer_id = $11, updated_at = CURRENT_TIMESTAMP
        WHERE id = $12`,
        [
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
        ]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže poistenie
   */
  async deleteInsurance(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM insurances WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // INSURER METHODS
  // ============================================================================

  /**
   * Získa všetky poisťovne
   */
  async getInsurers(): Promise<Insurer[]> {
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM insurers ORDER BY name');
      return result.rows.map(row => this.mapRowToInsurer(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí novú poisťovňu
   */
  async createInsurer(insurerData: { name: string }): Promise<Insurer> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'INSERT INTO insurers (name) VALUES ($1) RETURNING *',
        [insurerData.name]
      );
      return this.mapRowToInsurer(result.rows[0]);
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže poisťovňu
   */
  async deleteInsurer(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM insurers WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // INSURANCE CLAIM METHODS
  // ============================================================================

  /**
   * Získa škodové udalosti
   */
  async getInsuranceClaims(vehicleId?: string): Promise<InsuranceClaim[]> {
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
      
      const params: (string | number | boolean)[] = [];
      if (vehicleId) {
        query += ' WHERE ic.vehicle_id = $1';
        params.push(vehicleId);
      }
      
      query += ' ORDER BY ic.created_at DESC';
      
      const result = await client.query(query, params);
      return result.rows.map(row => this.mapRowToInsuranceClaim(row));
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Vytvorí škodovú udalosť
   */
  async createInsuranceClaim(claimData: {
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
  }): Promise<InsuranceClaim> {
    return this.executeTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO insurance_claims (
          vehicle_id, insurance_id, claim_number, incident_date,
          reported_date, description, estimated_cost, actual_cost,
          status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
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
        ]
      );

      return this.mapRowToInsuranceClaim(result.rows[0]);
    });
  }

  /**
   * Aktualizuje škodovú udalosť
   */
  async updateInsuranceClaim(id: string, claimData: {
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
  }): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `UPDATE insurance_claims SET 
          vehicle_id = $1, insurance_id = $2, claim_number = $3,
          incident_date = $4, reported_date = $5, description = $6,
          estimated_cost = $7, actual_cost = $8, status = $9,
          notes = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $11`,
        [
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
        ]
      );
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Zmaže škodovú udalosť
   */
  async deleteInsuranceClaim(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('DELETE FROM insurance_claims WHERE id = $1', [id]);
    } finally {
      this.releaseClient(client);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Mapuje databázový riadok na Insurance objekt
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToInsurance(row: Record<string, unknown>): Insurance {
    return {
      id: String(row.id),
      vehicleId: row.vehicle_id ? String(row.vehicle_id) : undefined,
      rentalId: row.rental_id ? Number(row.rental_id) : undefined,
      insurerId: row.insurer_id ? Number(row.insurer_id) : undefined,
      type: String(row.type),
      policyNumber: String(row.policy_number),
      validFrom: new Date((row.valid_from || row.start_date) as string | number | Date),
      validTo: new Date((row.valid_to || row.end_date) as string | number | Date),
      price: Number(row.premium || row.price),
      company: String(row.company || row.insurer_name || ''),
      paymentFrequency: (row.payment_frequency || 'monthly') as PaymentFrequency,
      filePath: row.file_path ? String(row.file_path) : undefined,
      filePaths: row.file_paths ? (typeof row.file_paths === 'string' ? JSON.parse(row.file_paths as string) : row.file_paths as string[]) : undefined,
      greenCardValidFrom: row.green_card_valid_from ? new Date(row.green_card_valid_from as string | number | Date) : undefined,
      greenCardValidTo: row.green_card_valid_to ? new Date(row.green_card_valid_to as string | number | Date) : undefined
    };
  }

  /**
   * Mapuje databázový riadok na Insurer objekt
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToInsurer(row: Record<string, unknown>): Insurer {
    return {
      id: String(row.id),
      name: String(row.name),
      createdAt: row.created_at ? new Date(row.created_at as string | number | Date) : new Date()
    };
  }

  /**
   * Mapuje databázový riadok na InsuranceClaim objekt
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToInsuranceClaim(row: Record<string, unknown>): InsuranceClaim {
    return {
      id: String(row.id),
      vehicleId: String(row.vehicle_id),
      insuranceId: row.insurance_id ? String(row.insurance_id) : undefined,
      claimNumber: row.claim_number ? String(row.claim_number) : undefined,
      incidentDate: new Date(row.incident_date as string | number | Date),
      reportedDate: new Date(row.reported_date as string | number | Date),
      description: String(row.description),
      location: row.location ? String(row.location) : undefined,
      incidentType: (row.incident_type || 'other') as 'accident' | 'theft' | 'vandalism' | 'weather' | 'other',
      estimatedDamage: row.estimated_damage ? Number(row.estimated_damage) : row.estimated_cost ? Number(row.estimated_cost) : undefined,
      deductible: row.deductible ? Number(row.deductible) : undefined,
      payoutAmount: row.payout_amount ? Number(row.payout_amount) : undefined,
      status: (row.status || 'reported') as 'reported' | 'investigating' | 'approved' | 'rejected' | 'closed',
      filePaths: row.file_paths ? (typeof row.file_paths === 'string' ? JSON.parse(row.file_paths as string) : row.file_paths as string[]) : undefined,
      policeReportNumber: row.police_report_number ? String(row.police_report_number) : undefined,
      otherPartyInfo: row.other_party_info ? String(row.other_party_info) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: new Date(row.created_at as string | number | Date),
      updatedAt: row.updated_at ? new Date(row.updated_at as string | number | Date) : undefined
    };
  }
}
