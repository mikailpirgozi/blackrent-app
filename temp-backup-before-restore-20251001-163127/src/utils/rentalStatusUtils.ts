/**
 * 🎯 CENTRÁLNA UTILITY PRE VÝPOČET STATUSU PRENÁJMU
 * 
 * Táto funkcia implementuje konzistentnú logiku pre určenie statusu prenájmu
 * založenú na aktuálnom dátume a čase.
 * 
 * LOGIKA:
 * - 'pending': Prenájom ešte nezačal (startDate > today)
 * - 'active': Prenájom je aktívny (startDate <= today <= endDate)
 * - 'finished': Prenájom skončil (endDate < today)
 * - 'cancelled': Prenájom bol zrušený (explicitne označený)
 * 
 * PRIKLADY:
 * - Dnes: 2024-01-15
 * - Prenájom: 2024-01-10 → 2024-01-20 = 'active'
 * - Prenájom: 2024-01-20 → 2024-01-25 = 'pending'
 * - Prenájom: 2024-01-05 → 2024-01-12 = 'finished'
 */

import { parseISO, isAfter, isBefore } from 'date-fns';
import type { Rental } from '../types';

export type RentalStatus = 'pending' | 'active' | 'finished';

/**
 * Vypočíta status prenájmu založený na aktuálnom dátume
 * 
 * @param rental Prenájom objekt
 * @param currentDate Aktuálny dátum (default: new Date())
 * @returns Status prenájmu
 */
export function calculateRentalStatus(
  rental: Rental,
  currentDate: Date = new Date()
): RentalStatus {
  // Ak je prenájom explicitne zrušený - nepoužívame cancelled status
  // if (rental.status === 'cancelled') {
  //   return 'cancelled';
  // }

  // Konvertuj dátumy na Date objekty
  const startDate = typeof rental.startDate === 'string' 
    ? parseISO(rental.startDate) 
    : rental.startDate;
  const endDate = typeof rental.endDate === 'string' 
    ? parseISO(rental.endDate) 
    : rental.endDate;

  // Validácia dátumov
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.warn('Invalid dates for rental:', rental.id, { startDate, endDate });
    return 'pending'; // Default pre neplatné dátumy
  }

  // Prenájom ešte nezačal
  if (isAfter(startDate, currentDate)) {
    return 'pending';
  }

  // Prenájom skončil
  if (isBefore(endDate, currentDate)) {
    return 'finished';
  }

  // Prenájom je aktívny (začal a ešte neskončil)
  return 'active';
}

/**
 * Vypočíta status pre viacero prenájmov naraz (optimalizované)
 * 
 * @param rentals Pole prenájmov
 * @param currentDate Aktuálny dátum (default: new Date())
 * @returns Map s statusmi prenájmov
 */
export function calculateRentalStatuses(
  rentals: Rental[],
  currentDate: Date = new Date()
): Map<string, RentalStatus> {
  const statusMap = new Map<string, RentalStatus>();
  
  rentals.forEach(rental => {
    statusMap.set(rental.id, calculateRentalStatus(rental, currentDate));
  });
  
  return statusMap;
}

/**
 * Filtruje prenájmy podľa statusu
 * 
 * @param rentals Pole prenájmov
 * @param status Požadovaný status
 * @param currentDate Aktuálny dátum (default: new Date())
 * @returns Filtrované prenájmy
 */
export function filterRentalsByStatus(
  rentals: Rental[],
  status: RentalStatus,
  currentDate: Date = new Date()
): Rental[] {
  return rentals.filter(rental => 
    calculateRentalStatus(rental, currentDate) === status
  );
}

/**
 * Získa počet prenájmov podľa statusu
 * 
 * @param rentals Pole prenájmov
 * @param currentDate Aktuálny dátum (default: new Date())
 * @returns Objekt s počtami prenájmov podľa statusu
 */
export function getRentalStatusCounts(
  rentals: Rental[],
  currentDate: Date = new Date()
): Record<RentalStatus, number> {
  const counts: Record<RentalStatus, number> = {
    pending: 0,
    active: 0,
    finished: 0,
  };

  rentals.forEach(rental => {
    const status = calculateRentalStatus(rental, currentDate);
    counts[status]++;
  });

  return counts;
}

/**
 * Získa text pre status prenájmu (pre UI)
 * 
 * @param status Status prenájmu
 * @returns Text pre zobrazenie
 */
export function getRentalStatusText(status: RentalStatus): string {
  switch (status) {
    case 'pending':
      return 'Čakajúci';
    case 'active':
      return 'Aktívny';
    case 'finished':
      return 'Ukončený';
    default:
      return 'Neznámy';
  }
}

/**
 * Získa farbu pre status prenájmu (pre UI)
 * 
 * @param status Status prenájmu
 * @returns CSS trieda pre farbu
 */
export function getRentalStatusColor(status: RentalStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'finished':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Kontroluje či je prenájom preterminovaný (skončil ale nemá return protokol)
 * 
 * @param rental Prenájom objekt
 * @param protocols Protokoly prenájmu
 * @param currentDate Aktuálny dátum (default: new Date())
 * @returns True ak je prenájom preterminovaný
 */
export function isRentalOverdue(
  rental: Rental,
  protocols: Record<string, any> = {},
  currentDate: Date = new Date()
): boolean {
  const status = calculateRentalStatus(rental, currentDate);
  
  // Prenájom je preterminovaný ak skončil ale nemá return protokol
  return status === 'finished' && !protocols[rental.id]?.return;
}

/**
 * Získa prioritu prenájmu pre zoradenie
 * 
 * @param rental Prenájom objekt
 * @param currentDate Aktuálny dátum (default: new Date())
 * @returns Priorita (nižšie číslo = vyššia priorita)
 */
export function getRentalPriority(
  rental: Rental,
  currentDate: Date = new Date()
): number {
  const status = calculateRentalStatus(rental, currentDate);
  
  switch (status) {
    case 'active':
      return 1; // Najvyššia priorita
    case 'pending':
      return 2;
    case 'finished':
      return 3; // Najnižšia priorita
    default:
      return 4;
  }
}
