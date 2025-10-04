/**
 * ===================================================================
 * LEASING MANAGEMENT SYSTEM - TYPESCRIPT TYPES
 * ===================================================================
 * Created: 2025-10-02
 * Description: Type definitions pre leasing systém
 * ===================================================================
 */

// ===================================================================
// ENUMS & CONSTANTS
// ===================================================================

/**
 * Typ splácania leasingu
 */
export type PaymentType = 'anuita' | 'lineárne' | 'len_úrok';

/**
 * Kategória úveru
 */
export type LoanCategory = 'autoúver' | 'operatívny_leasing' | 'pôžička';

/**
 * Typ pokuty za predčasné splatenie
 */
export type EarlyRepaymentPenaltyType = 'percent_principal' | 'fixed_amount';

/**
 * Typ dokumentu
 */
export type LeasingDocumentType =
  | 'contract'
  | 'payment_schedule'
  | 'photo'
  | 'other';

/**
 * Možné leasingové spoločnosti (pre dropdown)
 */
export const LEASING_COMPANIES = [
  'ČSOB Leasing',
  'Cofidis',
  'Home Credit',
  'UniCredit Leasing',
  'VB Leasing',
  'ČSOB',
  'Tatra banka',
  'Slovenská sporiteľňa',
  'VÚB banka',
  'Poštová banka',
  'mBank',
  'Iná spoločnosť',
] as const;

/**
 * Default penalty rates pre rôzne spoločnosti
 */
export const DEFAULT_PENALTY_RATES: Record<string, number> = {
  Cofidis: 5.0,
  ČSOB: 3.0,
  'ČSOB Leasing': 3.0,
  'Home Credit': 15.0,
  'UniCredit Leasing': 3.0,
  'VB Leasing': 3.0,
  'Tatra banka': 3.0,
  'Slovenská sporiteľňa': 3.0,
  'VÚB banka': 3.0,
  'Poštová banka': 3.0,
  mBank: 3.0,
  'Iná spoločnosť': 0.0,
};

// ===================================================================
// MAIN INTERFACES
// ===================================================================

/**
 * Hlavná tabuľka leasing
 */
export interface Leasing {
  id: string;
  vehicleId: string;

  // Joined data (pre UI)
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    company?: string; // Názov firmy priradenej k vozidlu
    year?: number;
  };

  // Základné info
  leasingCompany: string;
  loanCategory: LoanCategory;
  paymentType: PaymentType;

  // Finančné údaje
  initialLoanAmount: number; // Počiatočná výška úveru
  currentBalance: number; // Aktuálny zostatok
  interestRate?: number; // Úroková sadzba % p.a. (voliteľné)
  rpmn?: number; // RPMN % (voliteľné)
  monthlyPayment?: number; // Mesačná splátka (voliteľné)
  monthlyFee: number; // Mesačný poplatok (mesačný)
  processingFee: number; // Poplatok za spracovanie úveru (jednorazový)
  totalMonthlyPayment?: number; // Celková splátka (vypočítané)

  // Splátky
  totalInstallments: number; // Počiatočný počet splátok
  remainingInstallments: number; // Zostávajúci počet
  paidInstallments: number; // Uhradené splátky
  firstPaymentDate: Date | string; // Dátum prvej splátky
  lastPaymentDate?: Date | string; // Dátum poslednej splátky (vypočítané alebo zadané)
  lastPaidDate?: Date | string; // Dátum poslednej úhrady (tracking)

  // Predčasné splatenie
  earlyRepaymentPenalty: number; // % z istiny alebo fixed amount
  earlyRepaymentPenaltyType: EarlyRepaymentPenaltyType;

  // Nadobúdacia cena (voliteľné)
  acquisitionPriceWithoutVAT?: number;
  acquisitionPriceWithVAT?: number;
  isNonDeductible: boolean;

  // Document URLs (R2)
  contractDocumentUrl?: string;
  paymentScheduleUrl?: string;
  photosZipUrl?: string;

  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;

  // Computed fields (pre UI)
  progressPercentage?: number; // % splatené
  nextPaymentDue?: Date | string; // Najbližšia nesplatená splátka
  daysUntilNextPayment?: number; // Dní do najbližšej splátky
}

/**
 * Položka splátkového kalendára
 */
export interface PaymentScheduleItem {
  id: string;
  leasingId: string;

  installmentNumber: number; // Poradové číslo splátky (1, 2, 3...)
  dueDate: Date | string; // Dátum splatnosti

  principal: number; // Istina
  interest: number; // Úrok
  monthlyFee: number; // Poplatok
  totalPayment: number; // Celková splátka
  remainingBalance: number; // Zostatok po tejto splátke

  isPaid: boolean; // Uhradené?
  paidDate?: Date | string; // Kedy uhradené

  createdAt: Date | string;

  // Computed fields (pre UI)
  status?: 'paid' | 'overdue' | 'due_soon' | 'upcoming';
  daysUntilDue?: number;
}

/**
 * Dokument spojený s leasingom
 */
export interface LeasingDocument {
  id: string;
  leasingId: string;

  type: LeasingDocumentType;
  fileName: string;
  fileUrl: string; // R2 URL
  fileSize: number; // bytes
  mimeType: string;

  uploadedAt: Date | string;
}

// ===================================================================
// INPUT/OUTPUT TYPES (pre API a forms)
// ===================================================================

/**
 * Input pre vytvorenie nového leasingu
 * (povinné len minimum polí, ostatné môžu byť vypočítané)
 */
export interface CreateLeasingInput {
  vehicleId: string;
  leasingCompany: string;
  loanCategory: LoanCategory;
  paymentType: PaymentType;

  // Finančné údaje - POVINNÉ
  initialLoanAmount: number;
  totalInstallments: number;
  firstPaymentDate: Date | string;
  monthlyFee: number;
  processingFee?: number; // Poplatok za spracovanie (voliteľné)
  lastPaymentDate?: Date | string; // Dátum poslednej splátky (voliteľné, môže byť vypočítané)

  // Finančné údaje - VOLITEĽNÉ (môžu byť vypočítané)
  interestRate?: number;
  rpmn?: number;
  monthlyPayment?: number;

  // Predčasné splatenie
  earlyRepaymentPenalty?: number;
  earlyRepaymentPenaltyType?: EarlyRepaymentPenaltyType;

  // Nadobúdacia cena
  acquisitionPriceWithoutVAT?: number;
  acquisitionPriceWithVAT?: number;
  isNonDeductible?: boolean;
}

/**
 * Input pre update leasingu
 */
export interface UpdateLeasingInput extends Partial<CreateLeasingInput> {
  id: string;
}

/**
 * Výsledok smart solvera (dopočítanie chybajúcich údajov)
 */
export interface SolvedLeasingData {
  interestRate?: number; // Dopočítaný úrok
  monthlyPayment?: number; // Dopočítaná splátka
  totalMonthlyPayment: number; // Celková splátka (splátka + poplatok)
  rpmn?: number; // Dopočítané RPMN
  isValid: boolean; // Či sú dáta validné
  errors?: string[]; // Chyby pri výpočte
}

/**
 * Výpočet predčasného splatenia
 */
export interface EarlyRepaymentCalculation {
  currentPrincipalBalance: number; // Aktuálny zostatok istiny
  penalty: number; // Pokuta
  totalAmount: number; // Celková suma na zaplatenie
  penaltyType: EarlyRepaymentPenaltyType;
  penaltyRate: number; // % alebo fixed amount
  calculatedAt: Date;
}

/**
 * Dashboard prehľad
 */
export interface LeasingDashboard {
  totalDebt: number; // Celkové zadlženie across all leasings
  monthlyTotalCost: number; // Celkové mesačné náklady
  upcomingPayments: {
    within7Days: number;
    within14Days: number;
    within30Days: number;
  };
  overduePayments: PaymentScheduleItem[];
  activeLeasingsCount: number;
  completedLeasingsCount: number;
}

/**
 * Bulk payment marking
 */
export interface BulkPaymentMarkInput {
  installmentNumbers: number[]; // Array of installment numbers to mark as paid
  paidDate?: Date | string; // Optional date (default: today)
}

/**
 * Filters pre leasing list
 */
export interface LeasingFilters {
  vehicleId?: string;
  leasingCompany?: string;
  loanCategory?: LoanCategory;
  status?: 'active' | 'completed';
  searchQuery?: string;
}

// ===================================================================
// VALIDATION HELPERS
// ===================================================================

/**
 * Validácia či má leasing dosť dát na výpočet
 */
export interface ValidationResult {
  isValid: boolean;
  canCalculate: boolean;
  missingFields: string[];
  errors: string[];
}

/**
 * Calculator input (pre finančné výpočty)
 */
export interface CalculationInput {
  loanAmount?: number;
  interestRate?: number; // % p.a.
  monthlyPayment?: number;
  totalInstallments?: number;
  paymentType: PaymentType;
  monthlyFee?: number;
}

// ===================================================================
// API RESPONSE TYPES
// ===================================================================

/**
 * API response pre leasing list
 */
export interface LeasingListResponse {
  leasings: Leasing[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * API response pre leasing detail
 */
export interface LeasingDetailResponse {
  leasing: Leasing;
  paymentSchedule: PaymentScheduleItem[];
  documents: LeasingDocument[];
  earlyRepaymentCalculation?: EarlyRepaymentCalculation;
}

/**
 * API response pre dashboard
 */
export interface DashboardResponse {
  dashboard: LeasingDashboard;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===================================================================
// UI STATE TYPES
// ===================================================================

/**
 * Form state pre leasing form
 */
export interface LeasingFormState {
  // Form values
  values: Partial<CreateLeasingInput>;

  // Calculated/computed values
  calculated: Partial<SolvedLeasingData>;

  // UI state
  isCalculating: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;

  // Smart suggestions
  suggestions?: {
    interestRate?: number;
    monthlyPayment?: number;
    defaultPenalty?: number;
  };
}

/**
 * Payment schedule UI state
 */
export interface PaymentScheduleUIState {
  selectedInstallments: number[];
  isBulkMode: boolean;
  isMarkingPayment: boolean;
  expandedMonths: string[]; // Array of YYYY-MM for expanded accordion items
}

// ===================================================================
// UTILITY TYPES
// ===================================================================

/**
 * Helper pre date range selections
 */
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Helper pre file upload
 */
export interface FileUpload {
  file: File;
  type: LeasingDocumentType;
  preview?: string; // Base64 preview pre images
}

/**
 * Progress tracking
 */
export interface LeasingProgress {
  percentage: number; // 0-100
  paidInstallments: number;
  totalInstallments: number;
  remainingAmount: number;
  paidAmount: number;
}
