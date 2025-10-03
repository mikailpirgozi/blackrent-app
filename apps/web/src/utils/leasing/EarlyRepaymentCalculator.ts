/**
 * ===================================================================
 * EARLY REPAYMENT CALCULATOR - Kalkulačka predčasného splatenia
 * ===================================================================
 * Created: 2025-10-02
 * Description: Výpočet pokuty a celkovej sumy pri predčasnom splatení
 * ===================================================================
 */

import type { EarlyRepaymentPenaltyType } from '@/types/leasing-types';

// ===================================================================
// INTERFACES
// ===================================================================

/**
 * Input pre výpočet predčasného splatenia
 */
export interface EarlyRepaymentInput {
  currentBalance: number; // Aktuálny zostatok istiny
  penaltyRate: number; // % z istiny alebo fixná suma
  penaltyType: EarlyRepaymentPenaltyType; // Typ pokuty
}

/**
 * Výsledok výpočtu predčasného splatenia
 */
export interface EarlyRepaymentResult {
  currentPrincipalBalance: number; // Aktuálny zostatok istiny
  penalty: number; // Pokuta
  totalAmount: number; // Celková suma na zaplatenie
  penaltyType: EarlyRepaymentPenaltyType;
  penaltyRate: number;
  calculatedAt: Date;

  // Breakdown pre UI
  breakdown: {
    principal: number; // Zostatok istiny
    penaltyAmount: number; // Pokuta
    total: number; // Celkom
  };
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Zaokrúhli číslo na 2 desatinné miesta (pre peniaze)
 */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

// ===================================================================
// CALCULATION FUNCTIONS
// ===================================================================

/**
 * Vypočíta pokutu za predčasné splatenie
 *
 * @param currentBalance - Aktuálny zostatok istiny
 * @param penaltyRate - % z istiny alebo fixná suma
 * @param penaltyType - Typ pokuty ('percent_principal' alebo 'fixed_amount')
 * @returns Výška pokuty
 */
export function calculatePenalty(
  currentBalance: number,
  penaltyRate: number,
  penaltyType: EarlyRepaymentPenaltyType
): number {
  if (penaltyType === 'percent_principal') {
    // Percentuálna pokuta z istiny
    // Napr.: 15000 € * 3% = 450 €
    return roundMoney(currentBalance * (penaltyRate / 100));
  }

  if (penaltyType === 'fixed_amount') {
    // Fixná pokuta
    return roundMoney(penaltyRate);
  }

  throw new Error(`Unknown penalty type: ${penaltyType}`);
}

/**
 * Vypočíta celkovú sumu na zaplatenie pri predčasnom splatení
 */
export function calculateEarlyRepayment(
  input: EarlyRepaymentInput
): EarlyRepaymentResult {
  const { currentBalance, penaltyRate, penaltyType } = input;

  // Validácia
  if (currentBalance < 0) {
    throw new Error('Aktuálny zostatok nemôže byť záporný');
  }

  if (penaltyRate < 0) {
    throw new Error('Pokuta nemôže byť záporná');
  }

  // Vypočítaj pokutu
  const penalty = calculatePenalty(currentBalance, penaltyRate, penaltyType);

  // Celková suma = zostatok + pokuta
  const totalAmount = roundMoney(currentBalance + penalty);

  return {
    currentPrincipalBalance: roundMoney(currentBalance),
    penalty,
    totalAmount,
    penaltyType,
    penaltyRate,
    calculatedAt: new Date(),
    breakdown: {
      principal: roundMoney(currentBalance),
      penaltyAmount: penalty,
      total: totalAmount,
    },
  };
}

/**
 * Vypočíta úsporu oproti normálnemu splácaniu
 *
 * @param currentBalance - Aktuálny zostatok istiny
 * @param remainingInstallments - Zostávajúci počet splátok
 * @param monthlyPayment - Mesačná splátka
 * @param penalty - Pokuta za predčasné splatenie
 * @returns Úspora oproti normálnemu splácaniu
 */
export function calculateEarlyRepaymentSavings(
  currentBalance: number,
  remainingInstallments: number,
  monthlyPayment: number,
  penalty: number
): {
  normalTotal: number; // Celková suma pri normálnom splatení
  earlyTotal: number; // Celková suma pri predčasnom splatení
  savings: number; // Úspora
  savingsPercentage: number; // % úspory
} {
  // Celková suma pri normálnom splatení
  const normalTotal = roundMoney(monthlyPayment * remainingInstallments);

  // Celková suma pri predčasnom splatení
  const earlyTotal = roundMoney(currentBalance + penalty);

  // Úspora
  const savings = roundMoney(normalTotal - earlyTotal);
  const savingsPercentage =
    normalTotal > 0 ? roundMoney((savings / normalTotal) * 100) : 0;

  return {
    normalTotal,
    earlyTotal,
    savings,
    savingsPercentage,
  };
}

/**
 * Zistí či sa oplatí predčasné splatenie
 * (ak úspora > pokuta)
 */
export function isEarlyRepaymentWorthIt(
  savings: number,
  penalty: number
): {
  isWorthIt: boolean;
  reason: string;
  netBenefit: number; // Čistý benefit (úspora - pokuta)
} {
  const netBenefit = roundMoney(savings - penalty);

  if (netBenefit > 0) {
    return {
      isWorthIt: true,
      reason: `Ušetríš ${netBenefit} € oproti normálnemu splácaniu`,
      netBenefit,
    };
  }

  if (netBenefit === 0) {
    return {
      isWorthIt: false,
      reason: 'Úspora je rovnaká ako pokuta - žiadny benefit',
      netBenefit: 0,
    };
  }

  return {
    isWorthIt: false,
    reason: `Predčasné splatenie je drahšie o ${Math.abs(netBenefit)} €`,
    netBenefit,
  };
}

// ===================================================================
// COMPARE SCENARIOS
// ===================================================================

/**
 * Porovná rôzne scenáre predčasného splatenia
 * (užitočné pre UI - "What if" analysis)
 */
export function compareEarlyRepaymentScenarios(
  currentBalance: number,
  penaltyRates: number[], // Array of penalty rates to compare
  penaltyType: EarlyRepaymentPenaltyType
): Array<{
  penaltyRate: number;
  penalty: number;
  totalAmount: number;
}> {
  return penaltyRates.map(rate => {
    const penalty = calculatePenalty(currentBalance, rate, penaltyType);
    return {
      penaltyRate: rate,
      penalty,
      totalAmount: roundMoney(currentBalance + penalty),
    };
  });
}

// ===================================================================
// EXPORT DEFAULT
// ===================================================================

export default {
  calculatePenalty,
  calculateEarlyRepayment,
  calculateEarlyRepaymentSavings,
  isEarlyRepaymentWorthIt,
  compareEarlyRepaymentScenarios,
};
