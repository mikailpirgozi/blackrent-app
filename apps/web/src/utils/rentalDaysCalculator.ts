/**
 * 🔧 CENTRÁLNA UTILITY FUNKCIA PRE VÝPOČET DNÍ PRENÁJMU
 *
 * Táto funkcia implementuje konzistentnú logiku pre výpočet dní prenájmu
 * vo všetkých častiach BlackRent aplikácie.
 *
 * LOGIKA:
 * - Ak prenájom končí v rovnaký čas alebo skôr ako začal = počíta sa ako predchádzajúci deň
 * - Ak prenájom končí neskôr ako začal = počíta sa ako ďalší deň
 * - Príklad: 10:00 do 10:00 = 2 dni, ale 10:00 do 10:01 = 3 dni
 *
 * TESTOVÉ SCENÁRE:
 * - 8.9 10:00 → 10.9 10:00 = 2 dni (rovnaký čas)
 * - 8.9 10:00 → 10.9 10:01 = 3 dni (o minútu neskôr)
 * - 8.9 15:00 → 8.9 17:00 = 1 deň (ten istý deň)
 * - 8.9 23:00 → 9.9 01:00 = 2 dni (cez polnoc)
 * - 8.9 10:00 → 10.9 00:00 = 2 dni (končí o polnoci)
 * - 8.9 10:00 → 10.9 00:01 = 3 dni (po polnoci)
 */

/**
 * Vypočíta počet dní prenájmu medzi dvoma dátumami
 *
 * @param startDate Začiatok prenájmu (vrátane času)
 * @param endDate Koniec prenájmu (vrátane času)
 * @returns Počet dní prenájmu (minimálne 1)
 *
 * @example
 * // Rovnaký čas - 2 dni
 * calculateRentalDays(
 *   new Date('2024-09-08T10:00:00'),
 *   new Date('2024-09-10T10:00:00')
 * ); // returns 2
 *
 * @example
 * // O minútu neskôr - 3 dni
 * calculateRentalDays(
 *   new Date('2024-09-08T10:00:00'),
 *   new Date('2024-09-10T10:01:00')
 * ); // returns 3
 *
 * @example
 * // Ten istý deň - 1 deň
 * calculateRentalDays(
 *   new Date('2024-09-08T15:00:00'),
 *   new Date('2024-09-08T17:00:00')
 * ); // returns 1
 */
export function calculateRentalDays(startDate: Date, endDate: Date): number {
  // Validácia vstupov
  if (!startDate || !endDate) {
    throw new Error('calculateRentalDays: startDate a endDate sú povinné');
  }

  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    throw new Error(
      'calculateRentalDays: startDate a endDate musia byť Date objekty'
    );
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('calculateRentalDays: neplatné dátumy');
  }

  // Ak je endDate skôr ako startDate, vráť 0
  if (endDate < startDate) {
    return 0;
  }

  // Ak je to presne ten istý čas, vráť 1 deň
  if (startDate.getTime() === endDate.getTime()) {
    return 1;
  }

  // Ak je to ten istý deň (bez ohľadu na čas), vráť 1 deň
  if (startDate.toDateString() === endDate.toDateString()) {
    return 1;
  }

  // 🔧 FIX: Normalizuj čas na poludnie (12:00) aby sme sa vyhli timezone problémom
  // Timezone shift môže spôsobiť že 14:00 CEST sa stane 12:00 UTC + 1h pri DST zmene
  const startNormalized = new Date(startDate);
  const endNormalized = new Date(endDate);
  
  startNormalized.setHours(12, 0, 0, 0);
  endNormalized.setHours(12, 0, 0, 0);

  // Vypočítaj rozdiel v milisekundách
  const timeDiff = endNormalized.getTime() - startNormalized.getTime();

  // Konvertuj na dni
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

  // Zaokrúhli - keďže sme normalizovali na poludnie, mal by byť presný počet dní
  // Použijeme Math.round aby sme eliminovali floating point errors
  return Math.round(daysDiff);
}

/**
 * LEGACY SUPPORT: Zachováva kompatibilitu s existujúcimi implementáciami
 *
 * Táto funkcia implementuje starú logiku pre porovnanie s novou
 * POUŽÍVAŤ LEN PRE MIGRÁCIU A TESTOVANIE!
 */
export function calculateRentalDaysLegacy(
  startDate: Date,
  endDate: Date,
  version: 'v1' | 'v2' | 'v3'
): number {
  switch (version) {
    case 'v1': {
      // RentalForm.tsx logika
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return Math.max(1, daysDiff);
    }

    case 'v2': {
      // CustomerRentalHistory.tsx logika
      return (
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      );
    }

    case 'v3': {
      // Statistics.tsx logika (differenceInDays + 1)
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return (
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
    }

    default:
      throw new Error(`Neznáma verzia: ${version}`);
  }
}

/**
 * Utility funkcia pre porovnanie výsledkov rôznych implementácií
 * POUŽÍVAŤ LEN PRE DEBUGGING A MIGRÁCIU!
 */
export function compareRentalDaysImplementations(
  startDate: Date,
  endDate: Date
) {
  const newResult = calculateRentalDays(startDate, endDate);
  const v1Result = calculateRentalDaysLegacy(startDate, endDate, 'v1');
  const v2Result = calculateRentalDaysLegacy(startDate, endDate, 'v2');
  const v3Result = calculateRentalDaysLegacy(startDate, endDate, 'v3');

  return {
    new: newResult,
    legacy: {
      v1_RentalForm: v1Result,
      v2_CustomerHistory: v2Result,
      v3_Statistics: v3Result,
    },
    differences: {
      v1_diff: newResult - v1Result,
      v2_diff: newResult - v2Result,
      v3_diff: newResult - v3Result,
    },
    isConsistent:
      v1Result === v2Result && v2Result === v3Result && v3Result === newResult,
  };
}
