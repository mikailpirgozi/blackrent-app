/**
 * ===================================================================
 * LEASING SOLVER - Smart dopočítanie chybajúcich údajov
 * ===================================================================
 * Created: 2025-10-02
 * Description: Automatické dopočítanie úroku, splátky alebo výšky úveru
 * ===================================================================
 */

import type { PaymentType } from '@/types/leasing-types';
import { calculateAnnuityPayment } from './LeasingCalculator';
import { calculateRPMN } from './RPMNCalculator';

// ===================================================================
// INTERFACES
// ===================================================================

/**
 * Input pre solver - obsahuje len čo používateľ zadal
 */
export interface SolverInput {
  loanAmount?: number; // Výška úveru (bez processing fee)
  processingFee?: number; // Poplatok za spracovanie (jednorazový)
  interestRate?: number; // Úroková sadzba % p.a.
  monthlyPayment?: number; // Mesačná splátka
  totalInstallments: number; // Počet splátok (POVINNÉ)
  paymentType: PaymentType; // Typ splácania (POVINNÉ)
  monthlyFee?: number; // Mesačný poplatok
}

/**
 * Výsledok solvera
 */
export interface SolverResult {
  // Dopočítané hodnoty
  loanAmount: number;
  effectiveLoanAmount: number; // Úver + processing fee
  interestRate: number;
  monthlyPayment: number;
  totalMonthlyPayment: number;
  rpmn?: number; // Vypočítané RPMN

  // Metadata
  isValid: boolean; // Či sú dáta validné
  canCalculate: boolean; // Či máme dosť dát na výpočet
  missingFields: string[]; // Chybajúce polia
  calculatedFields: string[]; // Dopočítané polia
  errors: string[]; // Chybové hlášky
}

// ===================================================================
// VALIDATION
// ===================================================================

/**
 * Validuje vstupné dáta a zistí čo chýba
 */
export function validateSolverInput(input: SolverInput): {
  isValid: boolean;
  canCalculate: boolean;
  missingFields: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const missingFields: string[] = [];

  // Povinné polia
  if (!input.totalInstallments || input.totalInstallments <= 0) {
    errors.push('Počet splátok musí byť väčší ako 0');
  }

  if (!input.paymentType) {
    errors.push('Typ splácania je povinný');
  }

  // Zisti čo chýba
  if (!input.loanAmount) missingFields.push('loanAmount');
  if (!input.interestRate && input.interestRate !== 0)
    missingFields.push('interestRate');
  if (!input.monthlyPayment) missingFields.push('monthlyPayment');

  // Pre výpočet potrebujeme aspoň 2 z 3 hodnôt (loan, rate, payment)
  const providedCount = [
    input.loanAmount,
    input.interestRate !== undefined,
    input.monthlyPayment,
  ].filter(Boolean).length;

  const canCalculate = providedCount >= 2 && errors.length === 0;

  return {
    isValid: errors.length === 0,
    canCalculate,
    missingFields,
    errors,
  };
}

// ===================================================================
// SOLVER FUNCTIONS
// ===================================================================

/**
 * Dopočíta úrokovú sadzbu z mesačnej splátky (Newton-Raphson method)
 *
 * Pre anuitu: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Hľadáme r pomocou iteratívnej aproximácie
 *
 * @param loanAmount - Výška úveru
 * @param monthlyPayment - Mesačná splátka (bez poplatku)
 * @param totalInstallments - Počet splátok
 * @returns Úroková sadzba % p.a. (alebo null ak sa nepodarilo vypočítať)
 */
export function solveForInterestRate(
  loanAmount: number,
  monthlyPayment: number,
  totalInstallments: number
): number | null {
  // Edge case: splátka = úver / počet splátok → 0% úrok
  const zeroInterestPayment = loanAmount / totalInstallments;
  if (Math.abs(monthlyPayment - zeroInterestPayment) < 0.01) {
    return 0;
  }

  // Edge case: splátka je príliš nízka → neplatné
  if (monthlyPayment < zeroInterestPayment) {
    return null; // Splátka je príliš nízka, nie je možné vyriešiť
  }

  // Newton-Raphson iterácia
  let rate = 0.05; // Začni s 5% ako odhad
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    const r = rate / 12; // Mesačná sadzba

    // f(r) = M - P * [r(1+r)^n] / [(1+r)^n - 1]
    const pow = Math.pow(1 + r, totalInstallments);
    const f = monthlyPayment - (loanAmount * r * pow) / (pow - 1);

    // f'(r) - derivácia
    const numerator =
      loanAmount *
      (pow * (totalInstallments * r + 1) - totalInstallments * r - 1);
    const denominator = Math.pow(pow - 1, 2);
    const fPrime = -numerator / denominator;

    // Nový odhad
    const newRate = rate - f / fPrime;

    // Konvergencia?
    if (Math.abs(newRate - rate) < tolerance) {
      return Math.round(newRate * 100 * 1000) / 1000; // Zaokrúhli na 3 desatinné miesta
    }

    rate = newRate;

    // Zabráň zápornej sadzbe
    if (rate < 0) rate = 0.001;
    if (rate > 1) rate = 1; // Max 100% p.a.
  }

  return null; // Nepodarilo sa konvergovať
}

/**
 * Dopočíta mesačnú splátku z úveru a úroku
 * (Jednoduchšie - už máme túto funkciu v LeasingCalculator)
 */
export function solveForMonthlyPayment(
  loanAmount: number,
  interestRate: number,
  totalInstallments: number,
  paymentType: PaymentType
): number {
  // Pre anuitu používame existujúcu funkciu
  if (paymentType === 'anuita') {
    return calculateAnnuityPayment(loanAmount, interestRate, totalInstallments);
  }

  // Pre lineárne - prvá splátka
  if (paymentType === 'lineárne') {
    const r = interestRate / 12 / 100;
    const principal = loanAmount / totalInstallments;
    const firstInterest = loanAmount * r;
    return Math.round((principal + firstInterest) * 100) / 100;
  }

  // Pre len úrok
  if (paymentType === 'len_úrok') {
    const r = interestRate / 12 / 100;
    return Math.round(loanAmount * r * 100) / 100;
  }

  throw new Error(`Unknown payment type: ${paymentType}`);
}

/**
 * Dopočíta výšku úveru z mesačnej splátky a úroku
 *
 * Pre anuitu: P = M * [(1+r)^n - 1] / [r(1+r)^n]
 */
export function solveForLoanAmount(
  monthlyPayment: number,
  interestRate: number,
  totalInstallments: number,
  paymentType: PaymentType
): number {
  const r = interestRate / 12 / 100;

  // Edge case: 0% úrok
  if (interestRate === 0) {
    return Math.round(monthlyPayment * totalInstallments * 100) / 100;
  }

  // Pre anuitu
  if (paymentType === 'anuita') {
    const pow = Math.pow(1 + r, totalInstallments);
    const loanAmount = (monthlyPayment * (pow - 1)) / (r * pow);
    return Math.round(loanAmount * 100) / 100;
  }

  // Pre lineárne - aproximácia (prvá splátka)
  if (paymentType === 'lineárne') {
    // P/n + P*r = M
    // P(1/n + r) = M
    // P = M / (1/n + r)
    const loanAmount = monthlyPayment / (1 / totalInstallments + r);
    return Math.round(loanAmount * 100) / 100;
  }

  // Pre len úrok
  if (paymentType === 'len_úrok') {
    // P * r = M
    // P = M / r
    const loanAmount = monthlyPayment / r;
    return Math.round(loanAmount * 100) / 100;
  }

  throw new Error(`Unknown payment type: ${paymentType}`);
}

// ===================================================================
// MAIN SOLVER FUNCTION
// ===================================================================

/**
 * Hlavná solver funkcia - automaticky dopočíta chybajúce údaje
 *
 * Podporované scenáre:
 * 1. Mám úver + splátku → dopočítaj úrok
 * 2. Mám úver + úrok → dopočítaj splátku
 * 3. Mám splátku + úrok → dopočítaj úver
 */
export function solveLeasingData(input: SolverInput): SolverResult {
  const validation = validateSolverInput(input);
  const calculatedFields: string[] = [];

  // Ak nie je validné, vráť chyby
  if (!validation.isValid || !validation.canCalculate) {
    return {
      loanAmount: input.loanAmount || 0,
      effectiveLoanAmount: (input.loanAmount || 0) + (input.processingFee || 0),
      interestRate: input.interestRate || 0,
      monthlyPayment: input.monthlyPayment || 0,
      totalMonthlyPayment: 0,
      isValid: validation.isValid,
      canCalculate: validation.canCalculate,
      missingFields: validation.missingFields,
      calculatedFields: [],
      errors: validation.errors,
    };
  }

  // Inicializuj výsledok
  let loanAmount = input.loanAmount || 0;
  const processingFee = input.processingFee || 0;
  const effectiveLoanAmount = loanAmount + processingFee; // KĽÚČOVÉ: Efektívna suma úveru
  let interestRate = input.interestRate ?? 0;
  let monthlyPayment = input.monthlyPayment || 0;
  const monthlyFee = input.monthlyFee || 0;

  // Scenár 1: Mám úver + splátku → dopočítaj úrok
  if (
    loanAmount &&
    monthlyPayment &&
    !input.interestRate &&
    input.interestRate !== 0
  ) {
    const calculatedRate = solveForInterestRate(
      loanAmount,
      monthlyPayment,
      input.totalInstallments
    );
    if (calculatedRate !== null) {
      interestRate = calculatedRate;
      calculatedFields.push('interestRate');
    } else {
      return {
        loanAmount,
        effectiveLoanAmount: loanAmount + (input.processingFee || 0),
        interestRate: 0,
        monthlyPayment,
        totalMonthlyPayment: monthlyPayment + monthlyFee,
        isValid: false,
        canCalculate: false,
        missingFields: validation.missingFields,
        calculatedFields: [],
        errors: ['Nepodarilo sa vypočítať úrokovú sadzbu z daných údajov'],
      };
    }
  }

  // Scenár 2: Mám úver + úrok → dopočítaj splátku
  if (loanAmount && input.interestRate !== undefined && !monthlyPayment) {
    monthlyPayment = solveForMonthlyPayment(
      loanAmount,
      interestRate,
      input.totalInstallments,
      input.paymentType
    );
    calculatedFields.push('monthlyPayment');
  }

  // Scenár 3: Mám splátku + úrok → dopočítaj úver
  if (monthlyPayment && input.interestRate !== undefined && !loanAmount) {
    loanAmount = solveForLoanAmount(
      monthlyPayment,
      interestRate,
      input.totalInstallments,
      input.paymentType
    );
    calculatedFields.push('loanAmount');
  }

  // Vypočítaj celkovú mesačnú splátku
  const totalMonthlyPayment =
    Math.round((monthlyPayment + monthlyFee) * 100) / 100;

  // Vypočítaj RPMN (ak máme všetky potrebné údaje)
  let rpmn: number | undefined;
  if (loanAmount && monthlyPayment && interestRate !== undefined) {
    try {
      const rpmnResult = calculateRPMN({
        loanAmount,
        processingFee,
        monthlyPayment,
        monthlyFee,
        totalInstallments: input.totalInstallments,
      });

      rpmn = rpmnResult.rpmn;
      calculatedFields.push('rpmn');
    } catch (error) {
      console.warn('RPMN calculation failed:', error);
    }
  }

  return {
    loanAmount,
    effectiveLoanAmount,
    interestRate,
    monthlyPayment,
    totalMonthlyPayment,
    rpmn,
    isValid: true,
    canCalculate: true,
    missingFields: [],
    calculatedFields,
    errors: [],
  };
}

// ===================================================================
// EXPORT DEFAULT
// ===================================================================

export default {
  validateSolverInput,
  solveForInterestRate,
  solveForMonthlyPayment,
  solveForLoanAmount,
  solveLeasingData,
};
