/**
 * ===================================================================
 * LEASING VALIDATION SCHEMAS - Zod schemas pre API validáciu
 * ===================================================================
 * Created: 2025-10-02
 * Description: Validačné schémy pre všetky leasing endpointy
 * ===================================================================
 */

import { z } from 'zod';

// ===================================================================
// ENUMS
// ===================================================================

export const PaymentTypeSchema = z.enum(['anuita', 'lineárne', 'len_úrok']);
export const LoanCategorySchema = z.enum(['autoúver', 'operatívny_leasing', 'pôžička']);
export const EarlyRepaymentPenaltyTypeSchema = z.enum(['percent_principal', 'fixed_amount']);
export const LeasingDocumentTypeSchema = z.enum(['contract', 'payment_schedule', 'photo', 'other']);

// ===================================================================
// CREATE LEASING SCHEMA
// ===================================================================

export const createLeasingSchema = z.object({
  vehicleId: z.string().uuid('Vehicle ID musí byť platné UUID'),
  
  // Základné info - POVINNÉ
  leasingCompany: z.string().min(1, 'Leasingová spoločnosť je povinná').max(255),
  loanCategory: LoanCategorySchema,
  paymentType: PaymentTypeSchema.default('anuita'),
  
  // Finančné údaje - POVINNÉ
  initialLoanAmount: z.number().positive('Výška úveru musí byť kladné číslo'),
  totalInstallments: z.number().int().positive('Počet splátok musí byť kladné celé číslo'),
  firstPaymentDate: z.string().datetime().or(z.date()),
  monthlyFee: z.number().nonnegative('Mesačný poplatok nemôže byť záporný').default(0),
  
  // Finančné údaje - VOLITEĽNÉ (môžu byť vypočítané)
  interestRate: z.number().nonnegative('Úroková sadzba nemôže byť záporná').optional(),
  rpmn: z.number().nonnegative('RPMN nemôže byť záporné').optional(),
  monthlyPayment: z.number().positive('Mesačná splátka musí byť kladná').optional(),
  
  // Predčasné splatenie - VOLITEĽNÉ
  earlyRepaymentPenalty: z.number().nonnegative('Pokuta nemôže byť záporná').default(0),
  earlyRepaymentPenaltyType: EarlyRepaymentPenaltyTypeSchema.default('percent_principal'),
  
  // Nadobúdacia cena - VOLITEĽNÉ
  acquisitionPriceWithoutVAT: z.number().positive('Cena bez DPH musí byť kladná').optional(),
  acquisitionPriceWithVAT: z.number().positive('Cena s DPH musí byť kladná').optional(),
  isNonDeductible: z.boolean().default(false),
}).refine(
  (data) => {
    // Musí mať aspoň 2 z 3: interestRate, monthlyPayment, initialLoanAmount
    const hasInterestRate = data.interestRate !== undefined;
    const hasMonthlyPayment = data.monthlyPayment !== undefined;
    const hasLoanAmount = data.initialLoanAmount !== undefined;
    
    const count = [hasInterestRate, hasMonthlyPayment, hasLoanAmount].filter(Boolean).length;
    return count >= 2;
  },
  {
    message: 'Musíš zadať aspoň 2 z 3 hodnôt: úroková sadzba, mesačná splátka alebo výška úveru',
  }
);

// ===================================================================
// UPDATE LEASING SCHEMA
// ===================================================================

export const updateLeasingSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  leasingCompany: z.string().min(1).max(255).optional(),
  loanCategory: LoanCategorySchema.optional(),
  paymentType: PaymentTypeSchema.optional(),
  
  initialLoanAmount: z.number().positive().optional(),
  interestRate: z.number().nonnegative().optional(),
  rpmn: z.number().nonnegative().optional(),
  monthlyPayment: z.number().positive().optional(),
  monthlyFee: z.number().nonnegative().optional(),
  
  totalInstallments: z.number().int().positive().optional(),
  firstPaymentDate: z.string().datetime().or(z.date()).optional(),
  
  earlyRepaymentPenalty: z.number().nonnegative().optional(),
  earlyRepaymentPenaltyType: EarlyRepaymentPenaltyTypeSchema.optional(),
  
  acquisitionPriceWithoutVAT: z.number().positive().optional(),
  acquisitionPriceWithVAT: z.number().positive().optional(),
  isNonDeductible: z.boolean().optional(),
});

// ===================================================================
// PAYMENT SCHEDULE SCHEMAS
// ===================================================================

export const markPaymentSchema = z.object({
  installmentNumber: z.number().int().positive('Číslo splátky musí byť kladné'),
  paidDate: z.string().datetime().or(z.date()).optional(), // Default: dnes
});

export const bulkMarkPaymentsSchema = z.object({
  installmentNumbers: z.array(z.number().int().positive()).min(1, 'Musíš vybrať aspoň jednu splátku'),
  paidDate: z.string().datetime().or(z.date()).optional(), // Default: dnes
});

// ===================================================================
// DOCUMENT UPLOAD SCHEMA
// ===================================================================

export const uploadDocumentSchema = z.object({
  type: LeasingDocumentTypeSchema,
  fileName: z.string().min(1, 'Názov súboru je povinný'),
  fileUrl: z.string().url('Neplatná URL adresa súboru'),
  fileSize: z.number().positive('Veľkosť súboru musí byť kladná'),
  mimeType: z.string().min(1, 'MIME typ je povinný'),
});

// ===================================================================
// QUERY SCHEMAS
// ===================================================================

export const leasingFiltersSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  leasingCompany: z.string().optional(),
  loanCategory: LoanCategorySchema.optional(),
  status: z.enum(['active', 'completed']).optional(),
  searchQuery: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export const dashboardQuerySchema = z.object({
  days: z.enum(['7', '14', '30']).default('30'),
});

// ===================================================================
// RESPONSE SCHEMAS (pre validáciu outputu)
// ===================================================================

export const leasingResponseSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  leasingCompany: z.string(),
  loanCategory: LoanCategorySchema,
  paymentType: PaymentTypeSchema,
  
  initialLoanAmount: z.number(),
  currentBalance: z.number(),
  interestRate: z.number().optional(),
  rpmn: z.number().optional(),
  monthlyPayment: z.number().optional(),
  monthlyFee: z.number(),
  totalMonthlyPayment: z.number().optional(),
  
  totalInstallments: z.number(),
  remainingInstallments: z.number(),
  paidInstallments: z.number(),
  firstPaymentDate: z.string().or(z.date()),
  lastPaidDate: z.string().or(z.date()).optional(),
  
  earlyRepaymentPenalty: z.number(),
  earlyRepaymentPenaltyType: EarlyRepaymentPenaltyTypeSchema,
  
  acquisitionPriceWithoutVAT: z.number().optional(),
  acquisitionPriceWithVAT: z.number().optional(),
  isNonDeductible: z.boolean(),
  
  contractDocumentUrl: z.string().optional(),
  paymentScheduleUrl: z.string().optional(),
  photosZipUrl: z.string().optional(),
  
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export const paymentScheduleItemResponseSchema = z.object({
  id: z.string().uuid(),
  leasingId: z.string().uuid(),
  installmentNumber: z.number(),
  dueDate: z.string().or(z.date()),
  principal: z.number(),
  interest: z.number(),
  monthlyFee: z.number(),
  totalPayment: z.number(),
  remainingBalance: z.number(),
  isPaid: z.boolean(),
  paidDate: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()),
});

// ===================================================================
// TYPE EXPORTS
// ===================================================================

export type CreateLeasingInput = z.infer<typeof createLeasingSchema>;
export type UpdateLeasingInput = z.infer<typeof updateLeasingSchema>;
export type MarkPaymentInput = z.infer<typeof markPaymentSchema>;
export type BulkMarkPaymentsInput = z.infer<typeof bulkMarkPaymentsSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type LeasingFilters = z.infer<typeof leasingFiltersSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

