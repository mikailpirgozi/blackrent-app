/**
 * Utility funkcie pre výpočty prenájmov
 */

/**
 * Vypočíta počet dní prenájmu na základe začiatočného a konečného dátumu
 *
 * Logika:
 * - Ak je prenájom v ten istý deň (napr. 8.9 08:00 - 8.9 17:00) = 1 deň
 * - Ak je prenájom cez noc (napr. 8.9 08:00 - 9.9 08:00) = 1 deň (presne 24h)
 * - Ak je prenájom dlhší ako 24h (napr. 8.9 08:00 - 9.9 17:00) = 2 dni
 * - Ak je prenájom dlhší ako 48h (napr. 8.9 08:00 - 10.9 17:00) = 3 dni
 *
 * @param startDate Začiatočný dátum a čas prenájmu
 * @param endDate Konečný dátum a čas prenájmu
 * @returns Počet dní prenájmu (minimálne 1)
 */
export const calculateRentalDays = (startDate: Date, endDate: Date): number => {
  // Konvertuj na Date objekty ak sú stringy
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  // Vypočítaj rozdiel v milisekundách
  const timeDiff = end.getTime() - start.getTime();

  // Konvertuj na hodiny
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  // Konvertuj na dni (zaokrúhli nahor)
  const daysDiff = Math.ceil(hoursDiff / 24);

  // Minimálne 1 deň (aj pre prenájmy v ten istý deň)
  return Math.max(1, daysDiff);
};

/**
 * Formátuje dátum pre zobrazenie v UI
 */
export const formatRentalDate = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Vypočíta celkovú cenu prenájmu
 */
export const calculateTotalPrice = (
  dailyPrice: number,
  days: number,
  discount?: { type: 'percentage' | 'fixed'; value: number }
): number => {
  let total = dailyPrice * days;

  if (discount) {
    if (discount.type === 'percentage') {
      total = total * (1 - discount.value / 100);
    } else {
      total = total - discount.value;
    }
  }

  return Math.max(0, total);
};
