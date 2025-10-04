// ✅ FÁZA 2.4: Decimal.js pre presné kalkulácie s peniazmi
// Zabezpečuje že nedôjde k floating point chybám pri súčtoch

import Decimal from 'decimal.js';

/**
 * Parsuje amount do Decimal objektu
 */
export function parseAmount(
  value: string | number | Decimal | undefined | null
): Decimal {
  if (value === undefined || value === null) return new Decimal(0);
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

/**
 * Formátuje amount na string s 2 desatinnými miestami
 */
export function formatAmount(
  value: Decimal | number | string | undefined | null
): string {
  if (value === undefined || value === null) return '0.00';
  return new Decimal(value).toFixed(2);
}

/**
 * Sčíta viacero amounts - vráti Decimal
 */
export function addAmounts(
  ...amounts: (Decimal | number | string | undefined | null)[]
): Decimal {
  return amounts.reduce<Decimal>((sum, amount) => {
    if (amount === undefined || amount === null) return sum;
    return sum.plus(new Decimal(amount));
  }, new Decimal(0));
}

/**
 * Odpočíta amounts - vráti Decimal
 */
export function subtractAmounts(
  base: Decimal | number | string,
  ...amounts: (Decimal | number | string | undefined | null)[]
): Decimal {
  let result = new Decimal(base);
  amounts.forEach(amount => {
    if (amount !== undefined && amount !== null) {
      result = result.minus(amount);
    }
  });
  return result;
}

/**
 * Vynásobí amount číslom - vráti Decimal
 */
export function multiplyAmount(
  amount: Decimal | number | string,
  multiplier: number | string
): Decimal {
  return new Decimal(amount).times(multiplier);
}

/**
 * Vydelí amount číslom - vráti Decimal
 */
export function divideAmount(
  amount: Decimal | number | string,
  divisor: number | string
): Decimal {
  return new Decimal(amount).dividedBy(divisor);
}

/**
 * Zaokrúhli amount na 2 desatinné miesta - vráti Decimal
 */
export function roundAmount(amount: Decimal | number | string): Decimal {
  return new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Porovná dve amounts - vráti true ak sú rovnaké
 */
export function isEqualAmount(
  amount1: Decimal | number | string,
  amount2: Decimal | number | string
): boolean {
  return new Decimal(amount1).equals(new Decimal(amount2));
}

/**
 * Formatuje amount s EUR symbolom
 */
export function formatCurrency(
  value: Decimal | number | string | undefined | null
): string {
  return `${formatAmount(value)}€`;
}

/**
 * Parsuje string na Decimal - používaj pre input fields
 */
export function parseAmountFromInput(value: string): Decimal {
  // Remove whitespace and convert comma to dot
  const cleaned = value.trim().replace(',', '.');
  // Remove any non-numeric characters except dot and minus
  const numericOnly = cleaned.replace(/[^\d.-]/g, '');

  if (!numericOnly || numericOnly === '-') return new Decimal(0);

  try {
    return new Decimal(numericOnly);
  } catch {
    return new Decimal(0);
  }
}
