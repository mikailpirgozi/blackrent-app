/**
 * ===================================================================
 * LEASING CALCULATOR - Finančné výpočty pre leasingový systém
 * ===================================================================
 * Created: 2025-10-02
 * Description: Presné výpočty pre anuitu, lineárne splácanie a len úrok
 * ===================================================================
 */

import type { PaymentType } from '@/types/leasing-types';

// ===================================================================
// INTERFACES
// ===================================================================

/**
 * Input pre výpočet mesačnej splátky
 */
export interface PaymentCalculationInput {
  loanAmount: number; // Výška úveru
  interestRate: number; // Úroková sadzba % p.a.
  totalInstallments: number; // Počet splátok
  paymentType: PaymentType; // Typ splácania
  monthlyFee?: number; // Mesačný poplatok (optional)
}

/**
 * Výsledok výpočtu mesačnej splátky
 */
export interface PaymentCalculationResult {
  monthlyPayment: number; // Mesačná splátka (bez poplatku)
  monthlyFee: number; // Mesačný poplatok
  totalMonthlyPayment: number; // Celková mesačná splátka
  totalInterest: number; // Celkový úrok za celú dobu
  totalAmount: number; // Celková suma (istina + úrok + poplatky)
}

/**
 * Jedna položka splátkového kalendára
 */
export interface ScheduleItem {
  installmentNumber: number; // Poradové číslo splátky (1, 2, 3...)
  dueDate: Date; // Dátum splatnosti
  principal: number; // Istina
  interest: number; // Úrok
  monthlyFee: number; // Mesačný poplatok
  totalPayment: number; // Celková splátka
  remainingBalance: number; // Zostatok po tejto splátke
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Konvertuje ročnú úrokovú sadzbu na mesačnú
 */
function getMonthlyRate(annualRate: number): number {
  return annualRate / 12 / 100;
}

/**
 * Zaokrúhli číslo na 2 desatinné miesta (pre peniaze)
 */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Pridá mesiace k dátumu
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// ===================================================================
// ANUITA VÝPOČTY (rovnaká mesačná splátka)
// ===================================================================

/**
 * Vypočíta mesačnú splátku pre anuitu
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 *
 * @param loanAmount - Výška úveru
 * @param annualRate - Ročná úroková sadzba (%)
 * @param totalInstallments - Počet splátok
 * @returns Mesačná splátka (bez poplatku)
 */
export function calculateAnnuityPayment(
  loanAmount: number,
  annualRate: number,
  totalInstallments: number
): number {
  // Edge case: 0% úrok
  if (annualRate === 0) {
    return roundMoney(loanAmount / totalInstallments);
  }

  const r = getMonthlyRate(annualRate);
  const numerator = loanAmount * r * Math.pow(1 + r, totalInstallments);
  const denominator = Math.pow(1 + r, totalInstallments) - 1;

  return roundMoney(numerator / denominator);
}

/**
 * Generuje splátkový kalendár pre anuitu
 */
export function generateAnnuitySchedule(
  loanAmount: number,
  annualRate: number,
  totalInstallments: number,
  firstPaymentDate: Date,
  monthlyFee: number = 0
): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  const monthlyPayment = calculateAnnuityPayment(
    loanAmount,
    annualRate,
    totalInstallments
  );
  const r = getMonthlyRate(annualRate);
  let remainingBalance = loanAmount;

  for (let i = 1; i <= totalInstallments; i++) {
    // Úrok sa počítajé z aktuálneho zostatku
    const interest = roundMoney(remainingBalance * r);

    // Istina = splátka - úrok
    let principal = roundMoney(monthlyPayment - interest);

    // Pre poslednú splátku: istina = zostatok (kvôli zaokrúhleniam)
    if (i === totalInstallments) {
      principal = remainingBalance;
    }

    // Nový zostatok
    remainingBalance = roundMoney(remainingBalance - principal);

    // Dátum splatnosti
    const dueDate = addMonths(firstPaymentDate, i - 1);

    schedule.push({
      installmentNumber: i,
      dueDate,
      principal,
      interest,
      monthlyFee,
      totalPayment: roundMoney(principal + interest + monthlyFee),
      remainingBalance: Math.max(0, remainingBalance), // Zabráň zápornému číslu
    });
  }

  return schedule;
}

// ===================================================================
// LINEÁRNE SPLÁCANIE (klesajúca mesačná splátka)
// ===================================================================

/**
 * Vypočíta prvú mesačnú splátku pre lineárne splácanie (najvyššia)
 *
 * @param loanAmount - Výška úveru
 * @param annualRate - Ročná úroková sadzba (%)
 * @param totalInstallments - Počet splátok
 * @returns Prvá mesačná splátka (najvyššia)
 */
export function calculateLinearFirstPayment(
  loanAmount: number,
  annualRate: number,
  totalInstallments: number
): number {
  const r = getMonthlyRate(annualRate);
  const principal = loanAmount / totalInstallments;
  const firstInterest = loanAmount * r;

  return roundMoney(principal + firstInterest);
}

/**
 * Generuje splátkový kalendár pre lineárne splácanie
 * Istina je rovnaká každý mesiac, úrok klesá
 */
export function generateLinearSchedule(
  loanAmount: number,
  annualRate: number,
  totalInstallments: number,
  firstPaymentDate: Date,
  monthlyFee: number = 0
): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  const r = getMonthlyRate(annualRate);
  const principal = roundMoney(loanAmount / totalInstallments);
  let remainingBalance = loanAmount;

  for (let i = 1; i <= totalInstallments; i++) {
    // Úrok sa počítajé z aktuálneho zostatku
    const interest = roundMoney(remainingBalance * r);

    // Pre poslednú splátku: istina = zostatok (kvôli zaokrúhleniam)
    const actualPrincipal =
      i === totalInstallments ? remainingBalance : principal;

    // Nový zostatok
    remainingBalance = roundMoney(remainingBalance - actualPrincipal);

    // Dátum splatnosti
    const dueDate = addMonths(firstPaymentDate, i - 1);

    schedule.push({
      installmentNumber: i,
      dueDate,
      principal: actualPrincipal,
      interest,
      monthlyFee,
      totalPayment: roundMoney(actualPrincipal + interest + monthlyFee),
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  return schedule;
}

// ===================================================================
// LEN ÚROK (rovnaká mesačná splátka, istina sa nesplácá)
// ===================================================================

/**
 * Vypočíta mesačnú splátku pre "len úrok"
 * Istina sa nesplácá, len úrok
 *
 * @param loanAmount - Výška úveru
 * @param annualRate - Ročná úroková sadzba (%)
 * @returns Mesačná splátka (len úrok)
 */
export function calculateInterestOnlyPayment(
  loanAmount: number,
  annualRate: number
): number {
  const r = getMonthlyRate(annualRate);
  return roundMoney(loanAmount * r);
}

/**
 * Generuje splátkový kalendár pre "len úrok"
 * Istina = 0 každý mesiac, zostatok je konštantný
 * Na konci: celá istina na splatenie (mimo kalendára)
 */
export function generateInterestOnlySchedule(
  loanAmount: number,
  annualRate: number,
  totalInstallments: number,
  firstPaymentDate: Date,
  monthlyFee: number = 0
): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  const monthlyInterest = calculateInterestOnlyPayment(loanAmount, annualRate);

  for (let i = 1; i <= totalInstallments; i++) {
    const dueDate = addMonths(firstPaymentDate, i - 1);

    // Principal = 0, zostatok je stále rovnaký (loanAmount)
    // Posledná splátka: principal = loanAmount (celá istina)
    const principal = i === totalInstallments ? loanAmount : 0;
    const remainingBalance = i === totalInstallments ? 0 : loanAmount;

    schedule.push({
      installmentNumber: i,
      dueDate,
      principal,
      interest: monthlyInterest,
      monthlyFee,
      totalPayment: roundMoney(principal + monthlyInterest + monthlyFee),
      remainingBalance,
    });
  }

  return schedule;
}

// ===================================================================
// UNIVERZÁLNA FUNKCIA (pre všetky typy)
// ===================================================================

/**
 * Univerzálna funkcia pre výpočet mesačnej splátky
 * Automaticky vyberie správny výpočet podľa typu splácania
 */
export function calculateMonthlyPayment(
  input: PaymentCalculationInput
): PaymentCalculationResult {
  const {
    loanAmount,
    interestRate,
    totalInstallments,
    paymentType,
    monthlyFee = 0,
  } = input;

  let monthlyPayment: number;
  let schedule: ScheduleItem[];

  // Vyber správny výpočet podľa typu
  switch (paymentType) {
    case 'anuita':
      monthlyPayment = calculateAnnuityPayment(
        loanAmount,
        interestRate,
        totalInstallments
      );
      schedule = generateAnnuitySchedule(
        loanAmount,
        interestRate,
        totalInstallments,
        new Date(),
        monthlyFee
      );
      break;

    case 'lineárne':
      monthlyPayment = calculateLinearFirstPayment(
        loanAmount,
        interestRate,
        totalInstallments
      );
      schedule = generateLinearSchedule(
        loanAmount,
        interestRate,
        totalInstallments,
        new Date(),
        monthlyFee
      );
      break;

    case 'len_úrok':
      monthlyPayment = calculateInterestOnlyPayment(loanAmount, interestRate);
      schedule = generateInterestOnlySchedule(
        loanAmount,
        interestRate,
        totalInstallments,
        new Date(),
        monthlyFee
      );
      break;

    default:
      throw new Error(`Unknown payment type: ${paymentType}`);
  }

  // Vypočítaj celkový úrok a celkovú sumu
  const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
  const totalFees = monthlyFee * totalInstallments;
  const totalAmount = loanAmount + totalInterest + totalFees;

  return {
    monthlyPayment: roundMoney(monthlyPayment),
    monthlyFee,
    totalMonthlyPayment: roundMoney(monthlyPayment + monthlyFee),
    totalInterest: roundMoney(totalInterest),
    totalAmount: roundMoney(totalAmount),
  };
}

/**
 * Univerzálna funkcia pre generovanie splátkového kalendára (legacy)
 */
export function generatePaymentScheduleLegacy(
  loanAmount: number,
  interestRate: number,
  totalInstallments: number,
  firstPaymentDate: Date,
  paymentType: PaymentType,
  monthlyFee: number = 0
): ScheduleItem[] {
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

// ===================================================================
// EXPORT DEFAULT
// ===================================================================

export default {
  // Anuita
  calculateAnnuityPayment,
  generateAnnuitySchedule,

  // Lineárne
  calculateLinearFirstPayment,
  generateLinearSchedule,

  // Len úrok
  calculateInterestOnlyPayment,
  generateInterestOnlySchedule,

  // Univerzálne
  calculateMonthlyPayment,
  generatePaymentScheduleLegacy,
};
