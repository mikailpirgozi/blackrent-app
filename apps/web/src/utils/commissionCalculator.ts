/**
 * 💰 COMMISSION CALCULATOR UTILITY
 * Centrálna logika pre počítanie provízií prenájmov
 * 
 * BUSINESS RULES:
 * - Percentuálna provízia: počíta sa z totalPrice (základná cena + extra km)
 * - Fixná provízia: OSTÁVA FIXNÁ bez ohľadu na extra km poplatky
 * - Custom commission má prioritu pred vehicle commission
 */

import type { Rental, Vehicle, Commission } from '../types';

export interface CommissionConfig {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface CommissionResult {
  commission: number;
  type: 'percentage' | 'fixed';
  rate: number;
  basePrice: number;
  calculatedFrom: 'custom' | 'vehicle' | 'default';
}

/**
 * 🎯 HLAVNÁ FUNKCIA: Vypočíta províziu pre prenájom
 * 
 * @param totalPrice - Celková cena prenájmu (základná cena + extra km)
 * @param customCommission - Custom provízia z prenájmu (má prioritu)
 * @param vehicleCommission - Provízia z vozidla (fallback)
 * @returns CommissionResult s detailným rozpisom
 */
export function calculateCommission(
  totalPrice: number,
  customCommission?: CommissionConfig | null,
  vehicleCommission?: CommissionConfig | null
): CommissionResult {
  // Priority: custom > vehicle > 0
  let commissionConfig: CommissionConfig | null = null;
  let calculatedFrom: 'custom' | 'vehicle' | 'default' = 'default';

  if (customCommission?.value && customCommission.value > 0) {
    commissionConfig = customCommission;
    calculatedFrom = 'custom';
  } else if (vehicleCommission?.value && vehicleCommission.value > 0) {
    commissionConfig = vehicleCommission;
    calculatedFrom = 'vehicle';
  }

  // Ak nie je žiadna provízia, vráť 0
  if (!commissionConfig) {
    return {
      commission: 0,
      type: 'fixed',
      rate: 0,
      basePrice: totalPrice,
      calculatedFrom: 'default',
    };
  }

  let commission = 0;

  if (commissionConfig.type === 'percentage') {
    // 📊 PERCENTUÁLNA PROVÍZIA: počíta sa z totalPrice
    commission = (totalPrice * commissionConfig.value) / 100;
  } else {
    // 💰 FIXNÁ PROVÍZIA: ostáva fixná bez ohľadu na extra km
    commission = commissionConfig.value;
  }

  return {
    commission: Math.round(commission * 100) / 100,
    type: commissionConfig.type,
    rate: commissionConfig.value,
    basePrice: totalPrice,
    calculatedFrom,
  };
}

/**
 * 🔄 HELPER: Vypočíta komisiu z rental objektu
 */
export function calculateCommissionFromRental(rental: Rental): CommissionResult {
  return calculateCommission(
    rental.totalPrice || 0,
    rental.customCommission,
    rental.vehicle?.commission
  );
}

/**
 * 🔄 HELPER: Vypočíta novú províziu po pridaní extra km poplatku
 * 
 * @param currentRental - Aktuálny prenájom
 * @param extraKmCharge - Doplatok za extra km
 * @returns Nová provízia a totalPrice
 */
export function calculateCommissionWithExtraKm(
  currentRental: Rental,
  extraKmCharge: number
): { newTotalPrice: number; newCommission: number } {
  const newTotalPrice = currentRental.totalPrice + extraKmCharge;

  // Zisti ktorá provízia sa používa
  const commissionConfig = currentRental.customCommission?.value
    ? currentRental.customCommission
    : currentRental.vehicle?.commission;

  if (!commissionConfig) {
    return {
      newTotalPrice,
      newCommission: currentRental.commission || 0,
    };
  }

  let newCommission = currentRental.commission || 0;

  if (commissionConfig.type === 'percentage') {
    // 📊 PERCENTUÁLNA: prepočítaj z novej ceny
    newCommission = (newTotalPrice * commissionConfig.value) / 100;
  }
  // 💰 FIXNÁ: ostáva rovnaká (nerobíme nič)

  return {
    newTotalPrice,
    newCommission: Math.round(newCommission * 100) / 100,
  };
}

/**
 * 🔄 HELPER: Validácia že provízia je správne vypočítaná
 * Používa sa pre debugging a kontrolu dát
 */
export function validateCommission(rental: Rental): {
  isValid: boolean;
  expectedCommission: number;
  actualCommission: number;
  difference: number;
  message?: string;
} {
  const result = calculateCommissionFromRental(rental);
  const actualCommission = rental.commission || 0;
  const difference = Math.abs(result.commission - actualCommission);

  // Tolerancia 0.01 EUR kvôli zaokrúhľovaniu
  const isValid = difference < 0.01;

  return {
    isValid,
    expectedCommission: result.commission,
    actualCommission,
    difference,
    message: isValid
      ? 'Provízia je správna'
      : `Provízia nesedí! Očakávané: ${result.commission}€, Aktuálne: ${actualCommission}€ (rozdiel: ${difference}€)`,
  };
}

/**
 * 📊 FORMAT: Formátuje províziu pre zobrazenie
 */
export function formatCommission(commission: number): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(commission);
}

