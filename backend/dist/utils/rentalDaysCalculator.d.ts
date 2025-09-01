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
export declare function calculateRentalDays(startDate: Date, endDate: Date): number;
/**
 * LEGACY SUPPORT: Zachováva kompatibilitu s existujúcimi implementáciami
 *
 * Táto funkcia implementuje starú logiku pre porovnanie s novou
 * POUŽÍVAŤ LEN PRE MIGRÁCIU A TESTOVANIE!
 */
export declare function calculateRentalDaysLegacy(startDate: Date, endDate: Date, version: 'v1' | 'v2' | 'v3'): number;
/**
 * Utility funkcia pre porovnanie výsledkov rôznych implementácií
 * POUŽÍVAŤ LEN PRE DEBUGGING A MIGRÁCIU!
 */
export declare function compareRentalDaysImplementations(startDate: Date, endDate: Date): {
    new: number;
    legacy: {
        v1_RentalForm: number;
        v2_CustomerHistory: number;
        v3_Statistics: number;
    };
    differences: {
        v1_diff: number;
        v2_diff: number;
        v3_diff: number;
    };
    isConsistent: boolean;
};
//# sourceMappingURL=rentalDaysCalculator.d.ts.map