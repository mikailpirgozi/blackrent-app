/**
 * ===================================================================
 * LEASING REPOSITORY - Databázové operácie pre leasingy
 * ===================================================================
 * Created: 2025-10-02
 * Description: Repozitár pre všetky databázové operácie s leasingmi
 * ===================================================================
 */

import type { Pool } from 'pg';
import type {
  EarlyRepaymentPenaltyType,
  Leasing,
  LeasingDocument,
  LeasingDocumentType,
  LoanCategory,
  PaymentScheduleItem,
  PaymentType,
} from '../types';

// ===================================================================
// TYPES
// ===================================================================

export interface CreateLeasingInput {
  vehicleId: string;
  leasingCompany: string;
  loanCategory: LoanCategory;
  paymentType: PaymentType;
  initialLoanAmount: number;
  currentBalance: number;
  interestRate?: number;
  rpmn?: number;
  monthlyPayment?: number;
  monthlyFee: number;
  totalMonthlyPayment?: number;
  totalInstallments: number;
  remainingInstallments: number;
  paidInstallments: number;
  firstPaymentDate: Date | string;
  earlyRepaymentPenalty: number;
  earlyRepaymentPenaltyType: EarlyRepaymentPenaltyType;
  acquisitionPriceWithoutVAT?: number;
  acquisitionPriceWithVAT?: number;
  isNonDeductible: boolean;
}

export interface UpdateLeasingInput {
  vehicleId?: string;
  leasingCompany?: string;
  loanCategory?: LoanCategory;
  paymentType?: PaymentType;
  initialLoanAmount?: number;
  currentBalance?: number;
  interestRate?: number;
  rpmn?: number;
  monthlyPayment?: number;
  monthlyFee?: number;
  totalMonthlyPayment?: number;
  totalInstallments?: number;
  remainingInstallments?: number;
  paidInstallments?: number;
  firstPaymentDate?: Date | string;
  lastPaidDate?: Date | string;
  earlyRepaymentPenalty?: number;
  earlyRepaymentPenaltyType?: EarlyRepaymentPenaltyType;
  acquisitionPriceWithoutVAT?: number;
  acquisitionPriceWithVAT?: number;
  isNonDeductible?: boolean;
}

export interface LeasingFilters {
  vehicleId?: string;
  leasingCompany?: string;
  loanCategory?: LoanCategory;
  status?: 'active' | 'completed';
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateDocumentInput {
  type: LeasingDocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface CreatePaymentScheduleItemInput {
  installmentNumber: number;
  dueDate: Date | string;
  principal: number;
  interest: number;
  monthlyFee: number;
  totalPayment: number;
  remainingBalance: number;
}

// ===================================================================
// LEASING REPOSITORY CLASS
// ===================================================================

export class LeasingRepository {
  constructor(private pool: Pool) {}

  // ===================================================================
  // CRUD OPERÁCIE - LEASINGS
  // ===================================================================

  /**
   * Získaj všetky leasingy s filtrami (s JOIN na vehicles pre kompletné info)
   */
  async getLeasings(filters: LeasingFilters = {}): Promise<Leasing[]> {
    let query = `
      SELECT 
        l.id, l.vehicle_id as "vehicleId", l.leasing_company as "leasingCompany",
        l.loan_category as "loanCategory", l.payment_type as "paymentType",
        l.initial_loan_amount as "initialLoanAmount", l.current_balance as "currentBalance",
        l.interest_rate as "interestRate", l.rpmn, l.monthly_payment as "monthlyPayment",
        l.monthly_fee as "monthlyFee", l.total_monthly_payment as "totalMonthlyPayment",
        l.total_installments as "totalInstallments", l.remaining_installments as "remainingInstallments",
        l.paid_installments as "paidInstallments", l.first_payment_date as "firstPaymentDate",
        l.last_paid_date as "lastPaidDate", l.early_repayment_penalty as "earlyRepaymentPenalty",
        l.early_repayment_penalty_type as "earlyRepaymentPenaltyType",
        l.acquisition_price_without_vat as "acquisitionPriceWithoutVAT",
        l.acquisition_price_with_vat as "acquisitionPriceWithVAT",
        l.is_non_deductible as "isNonDeductible",
        l.contract_document_url as "contractDocumentUrl",
        l.payment_schedule_url as "paymentScheduleUrl",
        l.photos_zip_url as "photosZipUrl",
        l.created_at as "createdAt", l.updated_at as "updatedAt",
        -- Vehicle data (JOIN)
        v.id as "vehicle_id", v.brand as "vehicle_brand", v.model as "vehicle_model",
        v.license_plate as "vehicle_licensePlate", v.company as "vehicle_company",
        v.year as "vehicle_year"
      FROM leasings l
      LEFT JOIN vehicles v ON l.vehicle_id::integer = v.id
      WHERE 1=1
    `;
    
    const params: unknown[] = [];
    let paramIndex = 1;
    
    if (filters.vehicleId) {
      query += ` AND l.vehicle_id = $${paramIndex++}`;
      params.push(filters.vehicleId);
    }
    
    if (filters.leasingCompany) {
      query += ` AND l.leasing_company ILIKE $${paramIndex++}`;
      params.push(`%${filters.leasingCompany}%`);
    }
    
    if (filters.loanCategory) {
      query += ` AND l.loan_category = $${paramIndex++}`;
      params.push(filters.loanCategory);
    }
    
    if (filters.status === 'active') {
      query += ` AND l.remaining_installments > 0`;
    } else if (filters.status === 'completed') {
      query += ` AND l.remaining_installments = 0`;
    }
    
    if (filters.searchQuery) {
      query += ` AND (l.leasing_company ILIKE $${paramIndex++} OR l.loan_category ILIKE $${paramIndex++} OR v.brand ILIKE $${paramIndex++} OR v.model ILIKE $${paramIndex++} OR v.license_plate ILIKE $${paramIndex++})`;
      params.push(`%${filters.searchQuery}%`, `%${filters.searchQuery}%`, `%${filters.searchQuery}%`, `%${filters.searchQuery}%`, `%${filters.searchQuery}%`);
    }
    
    query += ` ORDER BY l.created_at DESC`;
    
    // Pagination
    const pageSize = filters.pageSize || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * pageSize;
    
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(pageSize, offset);
    
    const result = await this.pool.query(query, params);
    
    // Map rows to include vehicle object
    return result.rows.map((row: {
      vehicle_id?: string;
      vehicle_brand?: string;
      vehicle_model?: string;
      vehicle_licensePlate?: string;
      vehicle_company?: string;
      vehicle_year?: number;
      [key: string]: unknown;
    }) => {
      const { 
        vehicle_id, 
        vehicle_brand, 
        vehicle_model, 
        vehicle_licensePlate, 
        vehicle_company,
        vehicle_year,
        ...leasingData 
      } = row;
      
      return {
        ...leasingData,
        vehicle: vehicle_id ? {
          id: vehicle_id,
          brand: vehicle_brand || '',
          model: vehicle_model || '',
          licensePlate: vehicle_licensePlate || '',
          company: vehicle_company,
          year: vehicle_year,
        } : undefined,
      } as unknown as Leasing;
    });
  }

  /**
   * Získaj leasing podľa ID
   */
  async getLeasing(id: string): Promise<Leasing | null> {
    const result = await this.pool.query(
      `SELECT 
        id, vehicle_id as "vehicleId", leasing_company as "leasingCompany",
        loan_category as "loanCategory", payment_type as "paymentType",
        initial_loan_amount as "initialLoanAmount", current_balance as "currentBalance",
        interest_rate as "interestRate", rpmn, monthly_payment as "monthlyPayment",
        monthly_fee as "monthlyFee", total_monthly_payment as "totalMonthlyPayment",
        total_installments as "totalInstallments", remaining_installments as "remainingInstallments",
        paid_installments as "paidInstallments", first_payment_date as "firstPaymentDate",
        last_paid_date as "lastPaidDate", early_repayment_penalty as "earlyRepaymentPenalty",
        early_repayment_penalty_type as "earlyRepaymentPenaltyType",
        acquisition_price_without_vat as "acquisitionPriceWithoutVAT",
        acquisition_price_with_vat as "acquisitionPriceWithVAT",
        is_non_deductible as "isNonDeductible",
        contract_document_url as "contractDocumentUrl",
        payment_schedule_url as "paymentScheduleUrl",
        photos_zip_url as "photosZipUrl",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM leasings
      WHERE id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Vytvor nový leasing
   * Note: Tento súbor bude pokračovať v ďalšom kroku kvôli dĺžke
   */
  async createLeasing(input: CreateLeasingInput): Promise<Leasing> {
    const result = await this.pool.query(
      `INSERT INTO leasings (
        vehicle_id, leasing_company, loan_category, payment_type,
        initial_loan_amount, current_balance, interest_rate, rpmn,
        monthly_payment, monthly_fee, total_monthly_payment,
        total_installments, remaining_installments, paid_installments,
        first_payment_date, early_repayment_penalty, early_repayment_penalty_type,
        acquisition_price_without_vat, acquisition_price_with_vat, is_non_deductible
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *`,
      [
        input.vehicleId,
        input.leasingCompany,
        input.loanCategory,
        input.paymentType,
        input.initialLoanAmount,
        input.currentBalance,
        input.interestRate,
        input.rpmn,
        input.monthlyPayment,
        input.monthlyFee,
        input.totalMonthlyPayment,
        input.totalInstallments,
        input.remainingInstallments,
        input.paidInstallments,
        input.firstPaymentDate,
        input.earlyRepaymentPenalty,
        input.earlyRepaymentPenaltyType,
        input.acquisitionPriceWithoutVAT,
        input.acquisitionPriceWithVAT,
        input.isNonDeductible,
      ]
    );
    
    const leasing = await this.getLeasing(result.rows[0].id);
    return leasing!;
  }

  /**
   * Aktualizuj leasing
   */
  async updateLeasing(id: string, input: UpdateLeasingInput): Promise<Leasing | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramIndex++}`);
        values.push(value);
      }
    });
    
    if (fields.length === 0) {
      return this.getLeasing(id);
    }
    
    values.push(id);
    
    await this.pool.query(
      `UPDATE leasings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values
    );
    
    return this.getLeasing(id);
  }

  /**
   * Zmaž leasing
   */
  async deleteLeasing(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM leasings WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  // ===================================================================
  // PAYMENT SCHEDULE OPERÁCIE
  // ===================================================================

  /**
   * Získaj splátkový kalendár
   */
  async getPaymentSchedule(leasingId: string): Promise<PaymentScheduleItem[]> {
    const result = await this.pool.query(
      `SELECT 
        id, leasing_id as "leasingId", installment_number as "installmentNumber",
        due_date as "dueDate", principal, interest, monthly_fee as "monthlyFee",
        total_payment as "totalPayment", remaining_balance as "remainingBalance",
        is_paid as "isPaid", paid_date as "paidDate", created_at as "createdAt"
      FROM payment_schedule
      WHERE leasing_id = $1
      ORDER BY installment_number ASC`,
      [leasingId]
    );
    
    return result.rows;
  }

  /**
   * Vytvor položku splátkového kalendára
   */
  async createPaymentScheduleItem(
    leasingId: string,
    item: CreatePaymentScheduleItemInput
  ): Promise<PaymentScheduleItem> {
    const result = await this.pool.query(
      `INSERT INTO payment_schedule (
        leasing_id, installment_number, due_date, principal, interest,
        monthly_fee, total_payment, remaining_balance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        leasingId,
        item.installmentNumber,
        item.dueDate,
        item.principal,
        item.interest,
        item.monthlyFee,
        item.totalPayment,
        item.remainingBalance,
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      leasingId: row.leasing_id,
      installmentNumber: row.installment_number,
      dueDate: row.due_date,
      principal: parseFloat(row.principal),
      interest: parseFloat(row.interest),
      monthlyFee: parseFloat(row.monthly_fee),
      totalPayment: parseFloat(row.total_payment),
      remainingBalance: parseFloat(row.remaining_balance),
      isPaid: row.is_paid,
      paidDate: row.paid_date,
      createdAt: row.created_at,
    };
  }

  /**
   * Označ splátku ako uhradenú
   */
  async markPaymentAsPaid(
    leasingId: string,
    installmentNumber: number,
    paidDate?: Date | string
  ): Promise<PaymentScheduleItem | null> {
    const date = paidDate || new Date();
    
    const result = await this.pool.query(
      `UPDATE payment_schedule 
      SET is_paid = true, paid_date = $1 
      WHERE leasing_id = $2 AND installment_number = $3
      RETURNING *`,
      [date, leasingId, installmentNumber]
    );
    
    if (result.rows.length === 0) return null;
    
    // Update leasing counters
    await this.updateLeasingCounters(leasingId);
    
    const row = result.rows[0];
    return {
      id: row.id,
      leasingId: row.leasing_id,
      installmentNumber: row.installment_number,
      dueDate: row.due_date,
      principal: parseFloat(row.principal),
      interest: parseFloat(row.interest),
      monthlyFee: parseFloat(row.monthly_fee),
      totalPayment: parseFloat(row.total_payment),
      remainingBalance: parseFloat(row.remaining_balance),
      isPaid: row.is_paid,
      paidDate: row.paid_date,
      createdAt: row.created_at,
    };
  }

  /**
   * Zruš označenie úhrady splátky
   */
  async unmarkPayment(
    leasingId: string,
    installmentNumber: number
  ): Promise<PaymentScheduleItem | null> {
    const result = await this.pool.query(
      `UPDATE payment_schedule 
      SET is_paid = false, paid_date = NULL 
      WHERE leasing_id = $1 AND installment_number = $2
      RETURNING *`,
      [leasingId, installmentNumber]
    );
    
    if (result.rows.length === 0) return null;
    
    // Update leasing counters
    await this.updateLeasingCounters(leasingId);
    
    const row = result.rows[0];
    return {
      id: row.id,
      leasingId: row.leasing_id,
      installmentNumber: row.installment_number,
      dueDate: row.due_date,
      principal: parseFloat(row.principal),
      interest: parseFloat(row.interest),
      monthlyFee: parseFloat(row.monthly_fee),
      totalPayment: parseFloat(row.total_payment),
      remainingBalance: parseFloat(row.remaining_balance),
      isPaid: row.is_paid,
      paidDate: row.paid_date,
      createdAt: row.created_at,
    };
  }

  /**
   * Bulk označenie splátok ako uhradených
   */
  async bulkMarkPayments(
    leasingId: string,
    installmentNumbers: number[],
    paidDate?: Date | string
  ): Promise<PaymentScheduleItem[]> {
    const date = paidDate || new Date();
    
    const result = await this.pool.query(
      `UPDATE payment_schedule 
      SET is_paid = true, paid_date = $1 
      WHERE leasing_id = $2 AND installment_number = ANY($3)
      RETURNING *`,
      [date, leasingId, installmentNumbers]
    );
    
    // Update leasing counters
    await this.updateLeasingCounters(leasingId);
    
    return result.rows.map((row: unknown) => {
      const r = row as {
        id: string;
        leasing_id: string;
        installment_number: number;
        due_date: Date;
        principal: string;
        interest: string;
        monthly_fee: string;
        total_payment: string;
        remaining_balance: string;
        is_paid: boolean;
        paid_date: Date | null;
        created_at: Date;
      };
      
      return {
        id: r.id,
        leasingId: r.leasing_id,
        installmentNumber: r.installment_number,
        dueDate: r.due_date,
        principal: parseFloat(r.principal),
        interest: parseFloat(r.interest),
        monthlyFee: parseFloat(r.monthly_fee),
        totalPayment: parseFloat(r.total_payment),
        remainingBalance: parseFloat(r.remaining_balance),
        isPaid: r.is_paid,
        paidDate: r.paid_date || undefined,
        createdAt: r.created_at,
      };
    });
  }

  /**
   * Aktualizuj počítadlá v leasing tabuľke po zmene úhrad
   */
  private async updateLeasingCounters(leasingId: string): Promise<void> {
    await this.pool.query(
      `UPDATE leasings SET
        paid_installments = (
          SELECT COUNT(*) FROM payment_schedule 
          WHERE leasing_id = $1 AND is_paid = true
        ),
        remaining_installments = (
          SELECT COUNT(*) FROM payment_schedule 
          WHERE leasing_id = $1 AND is_paid = false
        ),
        current_balance = (
          SELECT COALESCE(remaining_balance, 0) FROM payment_schedule 
          WHERE leasing_id = $1 AND is_paid = true
          ORDER BY installment_number DESC LIMIT 1
        ),
        last_paid_date = (
          SELECT MAX(paid_date) FROM payment_schedule 
          WHERE leasing_id = $1 AND is_paid = true
        )
      WHERE id = $1`,
      [leasingId]
    );
  }

  // ===================================================================
  // DOCUMENT OPERÁCIE
  // ===================================================================

  /**
   * Získaj dokumenty leasingu
   */
  async getLeasingDocuments(leasingId: string): Promise<LeasingDocument[]> {
    const result = await this.pool.query(
      `SELECT 
        id, leasing_id as "leasingId", type, file_name as "fileName",
        file_url as "fileUrl", file_size as "fileSize", mime_type as "mimeType",
        uploaded_at as "uploadedAt"
      FROM leasing_documents
      WHERE leasing_id = $1
      ORDER BY uploaded_at DESC`,
      [leasingId]
    );
    
    return result.rows;
  }

  /**
   * Vytvor dokument
   */
  async createLeasingDocument(
    leasingId: string,
    input: CreateDocumentInput
  ): Promise<LeasingDocument> {
    const result = await this.pool.query(
      `INSERT INTO leasing_documents (
        leasing_id, type, file_name, file_url, file_size, mime_type
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [leasingId, input.type, input.fileName, input.fileUrl, input.fileSize, input.mimeType]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      leasingId: row.leasing_id,
      type: row.type,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      uploadedAt: row.uploaded_at,
    };
  }

  /**
   * Zmaž dokument
   */
  async deleteLeasingDocument(leasingId: string, documentId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM leasing_documents WHERE id = $1 AND leasing_id = $2',
      [documentId, leasingId]
    );
    return result.rowCount! > 0;
  }

  // ===================================================================
  // DASHBOARD
  // ===================================================================

  /**
   * Získaj dashboard overview
   */
  async getLeasingDashboard(): Promise<unknown> {
    // Total debt
    const totalDebtResult = await this.pool.query(
      'SELECT SUM(current_balance) as total FROM leasings WHERE remaining_installments > 0'
    );
    const totalDebt = parseFloat(totalDebtResult.rows[0]?.total || '0');
    
    // Monthly costs
    const monthlyCostsResult = await this.pool.query(
      'SELECT SUM(total_monthly_payment) as total FROM leasings WHERE remaining_installments > 0'
    );
    const monthlyTotalCost = parseFloat(monthlyCostsResult.rows[0]?.total || '0');
    
    // Upcoming payments (7, 14, 30 days)
    const upcomingPaymentsResult = await this.pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE due_date <= NOW() + INTERVAL '7 days' AND due_date > NOW() AND is_paid = false) as within_7_days,
        COUNT(*) FILTER (WHERE due_date <= NOW() + INTERVAL '14 days' AND due_date > NOW() AND is_paid = false) as within_14_days,
        COUNT(*) FILTER (WHERE due_date <= NOW() + INTERVAL '30 days' AND due_date > NOW() AND is_paid = false) as within_30_days
      FROM payment_schedule`
    );
    
    // Overdue payments
    const overdueResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM payment_schedule 
      WHERE is_paid = false AND due_date < NOW()`
    );
    
    // Active vs completed leasings
    const activeResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM leasings WHERE remaining_installments > 0'
    );
    const completedResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM leasings WHERE remaining_installments = 0'
    );
    
    return {
      totalDebt,
      monthlyTotalCost,
      upcomingPayments: {
        within7Days: parseInt(upcomingPaymentsResult.rows[0]?.within_7_days || '0'),
        within14Days: parseInt(upcomingPaymentsResult.rows[0]?.within_14_days || '0'),
        within30Days: parseInt(upcomingPaymentsResult.rows[0]?.within_30_days || '0'),
      },
      overduePayments: parseInt(overdueResult.rows[0]?.count || '0'),
      activeLeasingsCount: parseInt(activeResult.rows[0]?.count || '0'),
      completedLeasingsCount: parseInt(completedResult.rows[0]?.count || '0'),
    };
  }
}

