/**
 * ===================================================================
 * RPMN CALCULATOR - Ročná percentuálna miera nákladov
 * ===================================================================
 * Created: 2025-10-02
 * Description: Presný výpočet RPMN zahŕňajúci všetky náklady úveru
 * ===================================================================
 */

/**
 * RPMN (Ročná percentuálna miera nákladov) zahŕňa:
 * 1. Úrokovú sadzbu
 * 2. Poplatok za spracovanie úveru (jednorazový)
 * 3. Mesačný poplatok (opakujúci sa)
 * 4. Všetky ostatné poplatky
 *
 * RPMN je VŽDY vyššie ako úroková sadzba!
 */

/**
 * Input pre RPMN výpočet
 */
export interface RPMNCalculationInput {
  loanAmount: number; // Výška úveru (bez processing fee)
  processingFee: number; // Jednorazový poplatok za spracovanie
  monthlyPayment: number; // Mesačná splátka (bez monthly fee)
  monthlyFee: number; // Mesačný poplatok
  totalInstallments: number; // Počet splátok
}

/**
 * Výsledok RPMN výpočtu
 */
export interface RPMNCalculationResult {
  rpmn: number; // RPMN % p.a.
  effectiveLoanAmount: number; // Efektívna výška úveru (s processing fee)
  totalCost: number; // Celkové náklady (všetky splátky + poplatky)
  totalInterestAndFees: number; // Celkový úrok + poplatky
}

/**
 * Zaokrúhli na 3 desatinné miesta
 */
function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Vypočíta RPMN pomocou Newton-Raphson metódy
 *
 * RPMN zohľadňuje:
 * - Výšku úveru + processing fee (efektívna suma)
 * - Mesačnú splátku + monthly fee (efektívna splátka)
 * - Všetky cash flows
 *
 * Formula:
 * 0 = -P + Σ(M / (1 + r)^n)
 *
 * P = efektívna výška úveru (loan + processing fee)
 * M = efektívna mesačná splátka (payment + monthly fee)
 * r = mesačná RPMN sadzba (hľadáme)
 * n = počet splátok
 */
export function calculateRPMN(
  input: RPMNCalculationInput
): RPMNCalculationResult {
  const {
    loanAmount,
    processingFee,
    monthlyPayment,
    monthlyFee,
    totalInstallments,
  } = input;

  // Efektívna výška úveru (úver + processing fee)
  const effectiveLoanAmount = loanAmount + processingFee;

  // Efektívna mesačná splátka (splátka + monthly fee)
  const effectiveMonthlyPayment = monthlyPayment + monthlyFee;

  // Celkové náklady
  const totalCost = effectiveMonthlyPayment * totalInstallments;

  // Celkový úrok + poplatky
  const totalInterestAndFees = totalCost - loanAmount; // Vrátené len istina, nie processing fee

  // Edge case: Ak sú processing fee a monthly fee 0, RPMN = úroková sadzba
  if (processingFee === 0 && monthlyFee === 0) {
    // Spätný výpočet úrokovej sadzby z mesačnej splátky
    const interestRate = solveForInterestRateFromPayment(
      loanAmount,
      monthlyPayment,
      totalInstallments
    );

    return {
      rpmn: interestRate || 0,
      effectiveLoanAmount: loanAmount,
      totalCost,
      totalInterestAndFees,
    };
  }

  // Newton-Raphson iterácia pre RPMN
  let rpmn = 0.1; // Začni s 10% ako odhad
  const maxIterations = 100;
  const tolerance = 0.00001;

  for (let i = 0; i < maxIterations; i++) {
    const r = rpmn / 12; // Mesačná RPMN sadzba

    // f(r) = -P + Σ(M / (1+r)^n)
    let presentValue = 0;
    let presentValueDerivative = 0;

    for (let n = 1; n <= totalInstallments; n++) {
      const discount = Math.pow(1 + r, n);
      presentValue += effectiveMonthlyPayment / discount;
      presentValueDerivative +=
        (-n * effectiveMonthlyPayment) / Math.pow(1 + r, n + 1);
    }

    const f = -effectiveLoanAmount + presentValue;
    const fPrime = presentValueDerivative;

    // Nový odhad
    const newRPMN = rpmn - f / fPrime;

    // Konvergencia?
    if (Math.abs(newRPMN - rpmn) < tolerance) {
      return {
        rpmn: round3(newRPMN * 100), // Konvertuj na %
        effectiveLoanAmount,
        totalCost,
        totalInterestAndFees,
      };
    }

    rpmn = newRPMN;

    // Zabráň zápornej sadzbe alebo príliš vysokej
    if (rpmn < 0) rpmn = 0.001;
    if (rpmn > 2) rpmn = 2; // Max 200% p.a.
  }

  // Ak sa nepodarilo konvergovať, vráť aproximáciu
  return {
    rpmn: round3(rpmn * 100),
    effectiveLoanAmount,
    totalCost,
    totalInterestAndFees,
  };
}

/**
 * Helper: Vypočíta úrokovú sadzbu z mesačnej splátky (pre edge case)
 */
function solveForInterestRateFromPayment(
  loanAmount: number,
  monthlyPayment: number,
  totalInstallments: number
): number | null {
  // Edge case: 0% úrok
  const zeroInterestPayment = loanAmount / totalInstallments;
  if (Math.abs(monthlyPayment - zeroInterestPayment) < 0.01) {
    return 0;
  }

  // Newton-Raphson
  let rate = 0.05; // 5% odhad
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    const r = rate / 12;
    const pow = Math.pow(1 + r, totalInstallments);
    const f = monthlyPayment - (loanAmount * r * pow) / (pow - 1);

    const numerator =
      loanAmount *
      (pow * (totalInstallments * r + 1) - totalInstallments * r - 1);
    const denominator = Math.pow(pow - 1, 2);
    const fPrime = -numerator / denominator;

    const newRate = rate - f / fPrime;

    if (Math.abs(newRate - rate) < tolerance) {
      return round3(newRate * 100);
    }

    rate = newRate;
    if (rate < 0) rate = 0.001;
    if (rate > 1) rate = 1;
  }

  return null;
}

/**
 * Vypočíta efektívnu výšku úveru (s processing fee)
 */
export function calculateEffectiveLoanAmount(
  loanAmount: number,
  processingFee: number
): number {
  return loanAmount + processingFee;
}

/**
 * Vypočíta zostatok processing fee (proporcionálne)
 * Pre predčasné splatenie
 */
export function calculateRemainingProcessingFee(
  processingFee: number,
  paidInstallments: number,
  totalInstallments: number
): number {
  const feePerInstallment = processingFee / totalInstallments;
  const remainingInstallments = totalInstallments - paidInstallments;
  return Math.round(feePerInstallment * remainingInstallments * 100) / 100;
}

/**
 * Vypočíta celkový zostatok (s processing fee)
 * Pre predčasné splatenie
 */
export function calculateTotalBalanceWithFees(
  principalBalance: number,
  processingFee: number,
  paidInstallments: number,
  totalInstallments: number
): number {
  const remainingProcessingFee = calculateRemainingProcessingFee(
    processingFee,
    paidInstallments,
    totalInstallments
  );

  return principalBalance + remainingProcessingFee;
}

export default {
  calculateRPMN,
  calculateEffectiveLoanAmount,
  calculateRemainingProcessingFee,
  calculateTotalBalanceWithFees,
};
