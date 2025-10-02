import type { Rental } from '../types';

/**
 * 🔄 CLONE & CONTINUE PRENÁJMOV - UTILITY FUNKCIE
 *
 * Implementuje inteligentný výpočet nasledujúceho obdobia prenájmu
 * a vytvorenie kópie prenájmu s resetovanými statusmi.
 */

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface CloneResult {
  newStartDate: Date;
  newEndDate: Date;
  periodType: PeriodType;
  originalDuration: number;
}

/**
 * Vypočíta nasledujúce obdobie prenájmu na základe pôvodných dátumov
 *
 * @param startDate Začiatok pôvodného prenájmu
 * @param endDate Koniec pôvodného prenájmu
 * @returns CloneResult s novými dátumami a typom obdobia
 */
export function calculateNextRentalPeriod(
  startDate: Date | string,
  endDate: Date | string
): CloneResult {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Výpočet dĺžky prenájmu v dňoch
  const durationMs = end.getTime() - start.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  let periodType: PeriodType;
  let newStartDate: Date;
  let newEndDate: Date;

  // Inteligentné rozpoznanie typu obdobia
  if (durationDays === 1) {
    // Denný prenájom - posun o deň
    periodType = 'daily';
    newStartDate = new Date(end);
    newStartDate.setDate(newStartDate.getDate() + 1);
    newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + 1);
  } else if (durationDays === 7) {
    // Týždenný prenájom - posun o týždeň
    periodType = 'weekly';
    newStartDate = new Date(end);
    newStartDate.setDate(newStartDate.getDate() + 1);
    newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + 7);
  } else if (durationDays >= 28 && durationDays <= 31) {
    // Mesačný prenájom (28-31 dní)
    periodType = 'monthly';

    // NOVÝ ZAČIATOK: Rovnaký dátum a čas ako pôvodný koniec (bez +1 deň)
    newStartDate = new Date(end);

    // NOVÝ KONIEC: Posun o mesiac od nového začiatku, zachovaj presný čas
    newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    const originalEndDay = end.getDate();
    const lastDayOfOriginalMonth = new Date(
      end.getFullYear(),
      end.getMonth() + 1,
      0
    ).getDate();

    if (originalEndDay === lastDayOfOriginalMonth) {
      // Ak bol pôvodný koniec na posledný deň mesiaca, nastav na posledný deň nasledujúceho mesiaca
      const targetMonth = newStartDate.getMonth() + 1; // Mesiac po novom začiatku
      const lastDayOfTargetMonth = new Date(
        newStartDate.getFullYear(),
        targetMonth + 1,
        0
      ).getDate();

      // Vytvor nový dátum pre cieľový mesiac s posledným dňom
      newEndDate = new Date(newStartDate);
      newEndDate.setDate(1); // Najprv nastav na 1. deň aby sa predišlo overflow
      newEndDate.setMonth(targetMonth); // Potom nastav mesiac
      newEndDate.setDate(lastDayOfTargetMonth); // Nakonec nastav správny deň
    } else {
      // Zachovaj pôvodný deň v mesiaci, čas zostáva rovnaký
      const maxDayInNewMonth = new Date(
        newEndDate.getFullYear(),
        newEndDate.getMonth() + 1,
        0
      ).getDate();
      const targetDay = Math.min(originalEndDay, maxDayInNewMonth);
      newEndDate.setDate(targetDay);
    }
  } else {
    // Vlastná dĺžka - posun o deň a zachovaj pôvodnú dĺžku
    periodType = 'custom';
    newStartDate = new Date(end);
    newStartDate.setDate(newStartDate.getDate() + 1);
    newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + durationDays);
  }

  return {
    newStartDate,
    newEndDate,
    periodType,
    originalDuration: durationDays,
  };
}

/**
 * Vytvorí kópiu prenájmu s novými dátumami a resetovanými statusmi
 *
 * @param original Pôvodný prenájom
 * @param cloneResult Výsledok výpočtu nového obdobia
 * @returns Partial<Rental> pripravený na uloženie
 */
export function createClonedRental(
  original: Rental,
  cloneResult: CloneResult
): Omit<Rental, 'id'> & { id?: string } {
  return {
    // Nové dátumy
    startDate: cloneResult.newStartDate,
    endDate: cloneResult.newEndDate,

    // Zachované údaje o zákazníkovi
    ...(original.customerId !== undefined && { customerId: original.customerId }),
    ...(original.customer !== undefined && { customer: original.customer }),
    customerName: original.customerName,
    ...(original.customerEmail !== undefined && { customerEmail: original.customerEmail }),
    ...(original.customerPhone !== undefined && { customerPhone: original.customerPhone }),
    customerAddress: original.customerAddress ?? '',

    // Zachované údaje o vozidle
    ...(original.vehicleId !== undefined && { vehicleId: original.vehicleId }),
    ...(original.vehicle !== undefined && { vehicle: original.vehicle }),
    ...(original.vehicleVin !== undefined && { vehicleVin: original.vehicleVin }),
    ...(original.vehicleCode !== undefined && { vehicleCode: original.vehicleCode }),
    ...(original.vehicleName !== undefined && { vehicleName: original.vehicleName }),

    // Zachované cenové údaje
    totalPrice: original.totalPrice,
    commission: original.commission,
    ...(original.discount !== undefined && { discount: original.discount }),
    ...(original.customCommission !== undefined && { customCommission: original.customCommission }),
    ...(original.extraKmCharge !== undefined && { extraKmCharge: original.extraKmCharge }),
    extraKilometerRate: original.extraKilometerRate ?? 0,

    // Zachované podmienky prenájmu
    ...(original.deposit !== undefined && { deposit: original.deposit }),
    ...(original.allowedKilometers !== undefined && { allowedKilometers: original.allowedKilometers }),
    ...(original.dailyKilometers !== undefined && { dailyKilometers: original.dailyKilometers }),
    ...(original.returnConditions !== undefined && { returnConditions: original.returnConditions }),

    // Zachované lokácie a nastavenia
    ...(original.handoverPlace !== undefined && { handoverPlace: original.handoverPlace }),
    ...(original.pickupLocation !== undefined && { pickupLocation: original.pickupLocation }),
    ...(original.returnLocation !== undefined && { returnLocation: original.returnLocation }),
    paymentMethod: original.paymentMethod,

    // Zachované flexibilné nastavenia
    ...(original.isFlexible !== undefined && { isFlexible: original.isFlexible }),
    ...(original.flexibleEndDate !== undefined && { flexibleEndDate: original.flexibleEndDate }),

    // Zachované firemné údaje
    ...(original.company !== undefined && { company: original.company }),

    // Zachované poznámky a dodatočné info
    ...(original.notes !== undefined && { notes: original.notes }),
    sourceType: original.sourceType || 'manual',

    // 🆕 DOPLNENÉ: Ďalšie dôležité údaje ktoré sa majú kopírovať
    ...(original.reservationTime !== undefined && { reservationTime: original.reservationTime }), // Čas rezervácie
    ...(original.isPrivateRental !== undefined && { isPrivateRental: original.isPrivateRental }), // Súkromný prenájom
    orderNumber: original.orderNumber ?? '', // Číslo objednávky - KOPÍRUJ

    // RESETOVANÉ STATUSY A PROTOKOLY
    status: 'pending' as const,
    paid: false,
    confirmed: false,
    approvalStatus: 'pending' as const,

    // Resetované protokoly
    handoverProtocolId: '',
    returnProtocolId: '',

    // Resetované merania a náklady (budú sa vyplňovať nové)
    fuelLevel: 0,
    odometer: 0,
    returnFuelLevel: 0,
    returnOdometer: 0,
    actualKilometers: 0,
    fuelRefillCost: 0,
    damageCost: 0,
    additionalCosts: 0,
    finalPrice: 0,

    // Resetované platby a história
    payments: [],
    history: [],

    // Nové ID bude vygenerované pri uložení
    // id: '', // Vynecháme úplne pre exactOptionalPropertyTypes
    createdAt: new Date(),
    // orderNumber sa kopíruje z originálneho prenájmu (riadok 180)
  };
}

/**
 * Formátuje typ obdobia pre zobrazenie používateľovi
 *
 * @param periodType Typ obdobia
 * @returns Slovenský popis typu obdobia
 */
export function formatPeriodType(periodType: PeriodType): string {
  switch (periodType) {
    case 'daily':
      return 'Denný prenájom';
    case 'weekly':
      return 'Týždenný prenájom';
    case 'monthly':
      return 'Mesačný prenájom';
    case 'custom':
      return 'Vlastná dĺžka';
    default:
      return 'Neznámy typ';
  }
}

/**
 * Kontroluje či sú nové dátumy validné
 *
 * @param cloneResult Výsledok výpočtu nového obdobia
 * @returns true ak sú dátumy validné
 */
export function validateCloneDates(cloneResult: CloneResult): boolean {
  const now = new Date();

  // Nový začiatok nesmie byť v minulosti
  if (cloneResult.newStartDate < now) {
    return false;
  }

  // Koniec musí byť po začiatku
  if (cloneResult.newEndDate <= cloneResult.newStartDate) {
    return false;
  }

  return true;
}

/**
 * Vytvorí popis clone operácie pre používateľa
 *
 * @param original Pôvodný prenájom
 * @param cloneResult Výsledok výpočtu
 * @returns Popis operácie
 */
export function getCloneDescription(
  original: Rental,
  cloneResult: CloneResult
): string {
  const originalStart = new Date(original.startDate).toLocaleDateString(
    'sk-SK'
  );
  const originalEnd = new Date(original.endDate).toLocaleDateString('sk-SK');
  const newStart = cloneResult.newStartDate.toLocaleDateString('sk-SK');
  const newEnd = cloneResult.newEndDate.toLocaleDateString('sk-SK');

  return `Kopírovanie prenájmu z ${originalStart} - ${originalEnd} na ${newStart} - ${newEnd} (${formatPeriodType(cloneResult.periodType)})`;
}
