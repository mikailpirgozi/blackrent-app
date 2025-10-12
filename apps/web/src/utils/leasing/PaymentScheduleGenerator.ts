/**
 * ===================================================================
 * PAYMENT SCHEDULE GENERATOR - Generovanie splátkového kalendára
 * ===================================================================
 * Created: 2025-10-02
 * Description: Hlavná funkcia pre generovanie kompletného splátkového kalendára
 * ===================================================================
 */

import type { PaymentType } from '@/types/leasing-types';
import type { ScheduleItem } from './LeasingCalculator';
import {
  generateAnnuitySchedule,
  generateInterestOnlySchedule,
  generateLinearSchedule,
} from './LeasingCalculator';

// ===================================================================
// INTERFACES
// ===================================================================

/**
 * Input pre generovanie splátkového kalendára
 */
export interface GenerateScheduleInput {
  loanAmount: number; // Výška úveru
  interestRate: number; // Úroková sadzba % p.a.
  totalInstallments: number; // Počet splátok
  firstPaymentDate: Date; // Dátum prvej splátky
  paymentType: PaymentType; // Typ splácania
  monthlyFee?: number; // Mesačný poplatok (optional)
}

/**
 * Rozšírená položka kalendára s computed fields
 */
export interface EnhancedScheduleItem extends ScheduleItem {
  // Status pre UI
  status: 'paid' | 'overdue' | 'due_soon' | 'upcoming';
  daysUntilDue: number;

  // Formatted strings pre UI
  formattedDueDate: string;
  formattedPrincipal: string;
  formattedInterest: string;
  formattedTotal: string;
  formattedRemaining: string;
}

/**
 * Zhrnutie splátkového kalendára
 */
export interface ScheduleSummary {
  totalInstallments: number;
  totalPrincipal: number;
  totalInterest: number;
  totalFees: number;
  totalAmount: number;
  firstPaymentDate: Date | undefined;
  lastPaymentDate: Date | undefined;
  averageMonthlyPayment: number;
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Zaokrúhli číslo na 2 desatinné miesta
 */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formátuje peniaze s € symbolom
 */
function formatMoney(value: number): string {
  return `${value.toFixed(2)} €`;
}

/**
 * Formátuje dátum (DD.MM.YYYY)
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Vypočíta počet dní medzi dvoma dátumami
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Určí status splátky podľa dátumu splatnosti
 */
function getPaymentStatus(
  dueDate: Date,
  isPaid: boolean,
  today: Date = new Date()
): 'paid' | 'overdue' | 'due_soon' | 'upcoming' {
  if (isPaid) return 'paid';

  const daysUntilDue = daysBetween(today, dueDate);

  if (daysUntilDue < 0) return 'overdue'; // Po splatnosti
  if (daysUntilDue <= 2) return 'due_soon'; // Splatné do 2 dní
  return 'upcoming'; // Nadchádzajúce
}

// ===================================================================
// MAIN GENERATOR FUNCTION
// ===================================================================

/**
 * Hlavná funkcia pre generovanie splátkového kalendára
 * Automaticky vyberie správny generator podľa typu splácania
 */
export function generatePaymentSchedule(
  input: GenerateScheduleInput
): ScheduleItem[] {
  const {
    loanAmount,
    interestRate,
    totalInstallments,
    firstPaymentDate,
    paymentType,
    monthlyFee = 0,
  } = input;

  // Validácia
  if (loanAmount <= 0) {
    throw new Error('Výška úveru musí byť väčšia ako 0');
  }

  if (interestRate < 0) {
    throw new Error('Úroková sadzba nemôže byť záporná');
  }

  if (totalInstallments <= 0) {
    throw new Error('Počet splátok musí byť väčší ako 0');
  }

  if (monthlyFee < 0) {
    throw new Error('Mesačný poplatok nemôže byť záporný');
  }

  // Vyber správny generator podľa typu
  switch (paymentType) {
    case 'anuita':
      return generateAnnuitySchedule(
        loanAmount,
        interestRate,
        totalInstallments,
        firstPaymentDate,
        monthlyFee
      );

    case 'lineárne':
      return generateLinearSchedule(
        loanAmount,
        interestRate,
        totalInstallments,
        firstPaymentDate,
        monthlyFee
      );

    case 'len_úrok':
      return generateInterestOnlySchedule(
        loanAmount,
        interestRate,
        totalInstallments,
        firstPaymentDate,
        monthlyFee
      );

    default:
      throw new Error(`Unknown payment type: ${paymentType}`);
  }
}

/**
 * Generuje rozšírený splátkový kalendár s computed fields
 */
export function generateEnhancedSchedule(
  input: GenerateScheduleInput,
  paidInstallments: number[] = []
): EnhancedScheduleItem[] {
  const schedule = generatePaymentSchedule(input);
  const today = new Date();

  return schedule.map(item => {
    const isPaid = paidInstallments.includes(item.installmentNumber);
    const status = getPaymentStatus(item.dueDate, isPaid, today);
    const daysUntilDue = daysBetween(today, item.dueDate);

    return {
      ...item,
      status,
      daysUntilDue,
      formattedDueDate: formatDate(item.dueDate),
      formattedPrincipal: formatMoney(item.principal),
      formattedInterest: formatMoney(item.interest),
      formattedTotal: formatMoney(item.totalPayment),
      formattedRemaining: formatMoney(item.remainingBalance),
    };
  });
}

/**
 * Vypočíta zhrnutie splátkového kalendára
 */
export function calculateScheduleSummary(
  schedule: ScheduleItem[]
): ScheduleSummary {
  if (schedule.length === 0) {
    throw new Error('Splátkový kalendár je prázdny');
  }

  const totalPrincipal = schedule.reduce(
    (sum, item) => sum + item.principal,
    0
  );
  const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
  const totalFees = schedule.reduce((sum, item) => sum + item.monthlyFee, 0);
  const totalAmount = schedule.reduce(
    (sum, item) => sum + item.totalPayment,
    0
  );

  const firstPaymentDate = schedule[0]?.dueDate;
  const lastPaymentDate = schedule[schedule.length - 1]?.dueDate;

  const averageMonthlyPayment = roundMoney(totalAmount / schedule.length);

  return {
    totalInstallments: schedule.length,
    totalPrincipal: roundMoney(totalPrincipal),
    totalInterest: roundMoney(totalInterest),
    totalFees: roundMoney(totalFees),
    totalAmount: roundMoney(totalAmount),
    firstPaymentDate,
    lastPaymentDate,
    averageMonthlyPayment,
  };
}

/**
 * Filtruje splátkový kalendár podľa statusu
 */
export function filterScheduleByStatus(
  schedule: EnhancedScheduleItem[],
  statuses: Array<'paid' | 'overdue' | 'due_soon' | 'upcoming'>
): EnhancedScheduleItem[] {
  return schedule.filter(item => statuses.includes(item.status));
}

/**
 * Získa nadchádzajúce splátky v danom období
 */
export function getUpcomingPayments(
  schedule: EnhancedScheduleItem[],
  daysAhead: number = 30
): EnhancedScheduleItem[] {
  return schedule.filter(
    item =>
      item.status !== 'paid' &&
      item.daysUntilDue >= 0 &&
      item.daysUntilDue <= daysAhead
  );
}

/**
 * Získa splátky po splatnosti
 */
export function getOverduePayments(
  schedule: EnhancedScheduleItem[]
): EnhancedScheduleItem[] {
  return filterScheduleByStatus(schedule, ['overdue']);
}

/**
 * Získa zaplatené splátky
 */
export function getPaidPayments(
  schedule: EnhancedScheduleItem[]
): EnhancedScheduleItem[] {
  return filterScheduleByStatus(schedule, ['paid']);
}

/**
 * Vypočíta aktuálny zostatok úveru na základe zaplatených splátok
 */
export function calculateCurrentBalance(
  schedule: ScheduleItem[],
  paidInstallments: number[]
): number {
  // Nájdi poslednú zaplaténú splátku
  const lastPaidNumber = Math.max(...paidInstallments, 0);

  if (lastPaidNumber === 0) {
    // Žiadna splátka nebola zaplatená - zostatok = počiatočná suma
    const firstItem = schedule[0];
    return firstItem ? firstItem.remainingBalance + firstItem.principal : 0;
  }

  // Nájdi poslednú zaplaténú položku v kalendári
  const lastPaidItem = schedule.find(
    item => item.installmentNumber === lastPaidNumber
  );

  return lastPaidItem ? lastPaidItem.remainingBalance : 0;
}

/**
 * Vypočíta progress splácania (v %)
 */
export function calculatePaymentProgress(
  totalInstallments: number,
  paidInstallments: number
): {
  percentage: number;
  paidCount: number;
  remainingCount: number;
} {
  const percentage = roundMoney((paidInstallments / totalInstallments) * 100);

  return {
    percentage: Math.min(100, Math.max(0, percentage)),
    paidCount: paidInstallments,
    remainingCount: totalInstallments - paidInstallments,
  };
}

// ===================================================================
// EXPORT DEFAULT
// ===================================================================

export default {
  generatePaymentSchedule,
  generateEnhancedSchedule,
  calculateScheduleSummary,
  filterScheduleByStatus,
  getUpcomingPayments,
  getOverduePayments,
  getPaidPayments,
  calculateCurrentBalance,
  calculatePaymentProgress,
};
