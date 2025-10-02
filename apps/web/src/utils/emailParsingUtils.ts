// 📧 EMAIL PARSING UTILITY - Zdieľaná parsing logika pre frontend aj backend
// Extrahované z src/components/rentals/EmailParser.tsx

// Simple logger for debugging
const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(`[EMAIL-PARSER] ${message}`, ...args);
    }
  },
};

export interface ParsedEmailData {
  orderNumber?: string;
  orderDate?: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  handoverLocation?: string;
  handoverDate?: string;
  returnDate?: string;
  vehicleName?: string;
  vehicleCode?: string;
  vehiclePrice?: number;
  dailyKilometers?: number;
  extraKilometerRate?: number;
  fuelLevel?: number;
  returnConditions?: string;
  startOdometer?: number;
  notes?: string;
  insuranceInfo?: string;
}

/**
 * 🎯 HLAVNÁ PARSING FUNKCIA - identická s EmailParser.tsx
 * Parsuje email text a vracia štruktúrované dáta
 */
export function parseEmailText(text: string): ParsedEmailData {
  const data: ParsedEmailData = {};

  // Parsovanie čísla objednávky
  const orderNumberMatch = text.match(/Číslo objednávky\s+([A-Z]+\d+)/i);
  if (orderNumberMatch) {
    data.orderNumber = orderNumberMatch[1]!!;
  }

  // Parsovanie dátumu objednávky
  const orderDateMatch = text.match(
    /Objednávka prijatá\s+(\d{2}\.\d{2}\.\d{4})/
  );
  if (orderDateMatch) {
    data.orderDate = orderDateMatch[1]!!;
  }

  // Parsovanie spôsobu úhrady
  const paymentMethodMatch = text.match(/Spôsob úhrady\s+(.+)/);
  if (paymentMethodMatch) {
    data.paymentMethod = paymentMethodMatch[1]!!.trim();
  }

  // Parsovanie odoberateľa (zákazníka)
  const customerMatch = text.match(/Odoberateľ\s+(.+)/);
  if (customerMatch) {
    data.customerName = customerMatch[1]!.trim();
  }

  // Parsovanie emailu
  const emailMatch = text.match(/E-mail\s+(.+)/);
  if (emailMatch) {
    data.customerEmail = emailMatch[1]!.trim();
  }

  // Parsovanie telefónu
  const phoneMatch = text.match(/Telefon\s+(.+)/);
  if (phoneMatch) {
    data.customerPhone = phoneMatch[1]!.trim();
  }

  // Parsovanie kontaktnej adresy
  const addressMatch = text.match(/Kontaktná adresa\s+(.+)/);
  if (addressMatch) {
    data.customerAddress = addressMatch[1]!.trim();
  }

  // Parsovanie miesta vyzdvihnutia
  const pickupMatch = text.match(/Miesto vyzdvihnutia\s+(.+)/);
  if (pickupMatch) {
    data.handoverLocation = pickupMatch[1]!.trim();
  }

  // Parsovanie miesta odovzdania (ak je iné)
  const dropoffMatch = text.match(/Miesto odovzdania\s+(.+)/);
  if (dropoffMatch && dropoffMatch[1]!.trim() !== data.handoverLocation) {
    data.handoverLocation = dropoffMatch[1]!.trim(); // Použije miesto odovzdania ak je iné
  }

  // Parsovanie času rezervácie (komplex formát)
  const reservationTimeMatch = text.match(/Čas rezervácie\s+(.+)/);
  if (reservationTimeMatch) {
    const timeStr = reservationTimeMatch[1]!.trim();

    // Pattern: "DD.MM.YYYY HH:MM:SS - DD.MM.YYYY HH:MM:SS"
    const dateRangePattern =
      /(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2}:\d{2})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2}:\d{2})/;
    const dateRangeMatch = timeStr.match(dateRangePattern);

    if (dateRangeMatch) {
      // ZACHOVAJ PRESNÝ FORMÁT - konvertuj DD.MM.YYYY na YYYY-MM-DD pre PostgreSQL
      const startDay = dateRangeMatch[1]!.split('.').reverse().join('-');
      const endDay = dateRangeMatch[3]!.split('.').reverse().join('-');
      data.handoverDate = `${startDay.replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)} ${dateRangeMatch[2]}`;
      data.returnDate = `${endDay.replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)} ${dateRangeMatch[4]}`;
    } else {
      // Alternatívny pattern: "YYYY-MM-DD HH:MM:SS - YYYY-MM-DD HH:MM:SS"
      const isoDateRangePattern =
        /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/;
      const isoDateRangeMatch = timeStr.match(isoDateRangePattern);

      if (isoDateRangeMatch) {
        // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
        data.handoverDate = `${isoDateRangeMatch[1]!} ${isoDateRangeMatch[2]}`;
        data.returnDate = `${isoDateRangeMatch[3]} ${isoDateRangeMatch[4]}`;
      }
    }
  }

  // Parsovanie vozidla (komplexné)
  const vehicleMatch = text.match(/(?:Vozidlo|Vehicle|Auto)\s+([^\n]+)/i);
  if (vehicleMatch) {
    logger.debug('🚗 Parsing vehicle line:', vehicleMatch[1]!);

    // Ak obsahuje tabuľkový formát
    if (vehicleMatch[1]!.includes('Cena') || vehicleMatch[1]!.includes('Spolu')) {
      const parts = vehicleMatch[1]!.split(/\s+/).filter(part => part.trim());
      logger.debug('🔍 Vehicle parts (table format):', parts);

      // Nájdi ŠPZ (6-7 znakov, len písmená a čísla)
      const spzIndex = parts.findIndex(part =>
        /^[A-Z0-9]{6,7}$/.test(part.trim())
      );
      logger.debug(
        '🔍 SPZ index:',
        spzIndex,
        'SPZ:',
        spzIndex >= 0 ? parts[spzIndex]! : 'not found'
      );

      if (spzIndex > 0) {
        // Názov auta je všetko pred ŠPZ
        data.vehicleName = parts.slice(0, spzIndex).join(' ');
        data.vehicleCode = parts[spzIndex]!;

        // Cena a suma sú za ŠPZ
        if (parts.length > spzIndex + 2) {
          const priceStr = parts[spzIndex + 1]!
            .replace(',', '.')
            .replace('€', '')
            .trim();
          data.vehiclePrice = parseFloat(priceStr);
        }

        logger.debug('✅ Parsed vehicle:', {
          name: data.vehicleName,
          code: data.vehicleCode,
          price: data.vehiclePrice,
        });
      } else {
        logger.debug('❌ Could not find SPZ in vehicle line');
      }
    } else {
      const vehicleLine = vehicleMatch[1]!.trim();
      logger.debug('🔍 Parsing vehicle line:', vehicleLine);

      const parts = vehicleLine.split(/\s+/).filter(part => part.trim());
      logger.debug('🔍 Vehicle parts:', parts);

      // Nájdi ŠPZ (6-7 znakov, len písmená a čísla)
      const spzIndex = parts.findIndex(part =>
        /^[A-Z0-9]{6,7}$/.test(part.trim())
      );
      logger.debug(
        '🔍 SPZ index:',
        spzIndex,
        'SPZ:',
        spzIndex >= 0 ? parts[spzIndex]! : 'not found'
      );

      if (spzIndex > 0) {
        // Názov auta je všetko pred ŠPZ
        data.vehicleName = parts.slice(0, spzIndex).join(' ');
        data.vehicleCode = parts[spzIndex]!;

        // Cena a suma sú za ŠPZ
        if (parts.length > spzIndex + 2) {
          const priceStr = parts[spzIndex + 1]!
            .replace(',', '.')
            .replace('€', '')
            .trim();
          data.vehiclePrice = parseFloat(priceStr);
        }

        logger.debug('✅ Parsed vehicle:', {
          name: data.vehicleName,
          code: data.vehicleCode,
          price: data.vehiclePrice,
        });
      } else {
        logger.debug('❌ Could not find SPZ in vehicle line');
      }
    }
  }

  // Parsovanie kilometrov - VŠETKY sa považujú za denné km
  logger.debug('🔍 DEBUG: Searching for kilometers in text...');

  // NAJVYŠŠIA PRIORITA: Špecifické patterny pre "Počet povolených km"
  const specificKmMatch = text.match(/Počet povolených km\s+(\d+)\s*km/i);
  logger.debug('🔍 DEBUG: specificKmMatch result:', specificKmMatch);

  if (specificKmMatch) {
    data.dailyKilometers = parseInt(specificKmMatch[1]!);
    logger.debug(
      `🚗 Parsed "Počet povolených km": ${data.dailyKilometers} km/day (interpreted as daily)`
    );
  } else {
    logger.debug('🔍 DEBUG: specificKmMatch failed, trying other patterns...');
    // Prioritne hľadáme explicitne denné km patterny
    const explicitDailyKmMatch =
      text.match(/(\d+)\s*km\s*\/\s*de[ňn]/i) ||
      text.match(/(\d+)\s*km\s*na\s*de[ňn]/i) ||
      text.match(/denný\s*limit[:\s]*(\d+)\s*km/i) ||
      text.match(/denne[:\s]*(\d+)\s*km/i) ||
      text.match(/(\d+)\s*km\s*daily/i);
    logger.debug(
      '🔍 DEBUG: explicitDailyKmMatch result:',
      explicitDailyKmMatch
    );

    if (explicitDailyKmMatch) {
      data.dailyKilometers = parseInt(explicitDailyKmMatch[1]!);
      logger.debug(
        `🚗 Parsed explicit daily km: ${data.dailyKilometers} km/day`
      );
    } else {
      logger.debug(
        '🔍 DEBUG: explicitDailyKmMatch failed, trying general patterns...'
      );
      // Ak nie sú explicitne denné, hľadáme ostatné všeobecné km patterny a považujeme ich za denné
      const generalKmMatch =
        text.match(/Povolené\s+km[:\s]+(\d+)/i) ||
        text.match(/Kilometrov[:\s]+(\d+)/i) ||
        text.match(/Limit\s+km[:\s]+(\d+)/i) ||
        text.match(/(\d+)\s*km/i); // Všeobecný pattern pre číslo + km (najnižšia priorita)
      logger.debug('🔍 DEBUG: generalKmMatch result:', generalKmMatch);

      if (generalKmMatch) {
        data.dailyKilometers = parseInt(generalKmMatch[1]!);
        logger.debug(
          `🚗 Parsed general km as daily: ${data.dailyKilometers} km/day (interpreted as daily)`
        );
      } else {
        logger.debug('🔍 DEBUG: No kilometer patterns matched!');
      }
    }
  }

  // Parsovanie ceny za extra km
  const extraKmMatch =
    text.match(/Cena\s+za\s+km[:\s]+([\d,]+)\s*€/i) ||
    text.match(/Extra\s+km[:\s]+([\d,]+)\s*€/i) ||
    text.match(/Nadlimitn[ý]\s+km[:\s]+([\d,]+)\s*€/i);
  if (extraKmMatch) {
    const extraKmStr = extraKmMatch[1]!.replace(',', '.');
    data.extraKilometerRate = parseFloat(extraKmStr);
  }

  // Parsovanie úrovne paliva
  const fuelMatch =
    text.match(/Palivo[:\s]+(\d+)%/i) ||
    text.match(/Fuel[:\s]+(\d+)%/i) ||
    text.match(/Nádrž[:\s]+(\d+)%/i);
  if (fuelMatch) {
    data.fuelLevel = parseInt(fuelMatch[1]!);
  }

  // Parsovanie stavu tachometra
  const odometerMatch =
    text.match(/Tachometer[:\s]+([\d\s]+)\s*km/i) ||
    text.match(/Kilometrov[:\s]+([\d\s]+)\s*km/i) ||
    text.match(/Stav[:\s]+([\d\s]+)\s*km/i);
  if (odometerMatch) {
    const odometerStr = odometerMatch[1]!.replace(/\s/g, '');
    data.startOdometer = parseInt(odometerStr);
  }

  // Parsovanie podmienok vrátenia
  const conditionsMatch =
    text.match(/Podmienky\s+vrátenia[:\s]+([^.]+)/i) ||
    text.match(/Return\s+conditions[:\s]+([^.]+)/i);
  if (conditionsMatch) {
    data.returnConditions = conditionsMatch[1]!.trim();
  }

  // Parsovanie poznámok
  const notesMatch =
    text.match(/Poznámky[:\s]+([^.]+)/i) ||
    text.match(/Notes[:\s]+([^.]+)/i) ||
    text.match(/Dodatočné\s+informácie[:\s]+([^.]+)/i);
  if (notesMatch) {
    data.notes = notesMatch[1]!.trim();
  }

  // Parsovanie informácií o poistení
  const insuranceMatch =
    text.match(/Poistenie[:\s]+([^.]+)/i) ||
    text.match(/Insurance[:\s]+([^.]+)/i);
  if (insuranceMatch) {
    data.insuranceInfo = insuranceMatch[1]!.trim();
  }

  return data;
}

/**
 * 🔄 HELPER: Konvertuje ParsedEmailData na backend formát
 */
export function convertToRentalData(
  parsed: ParsedEmailData
): Record<string, unknown> {
  return {
    orderNumber: parsed.orderNumber,
    customerName: parsed.customerName,
    customerEmail: parsed.customerEmail,
    customerPhone: parsed.customerPhone,
    vehicleName: parsed.vehicleName,
    vehicleCode: parsed.vehicleCode,
    totalPrice: parsed.vehiclePrice || 0,
    dailyKilometers: parsed.dailyKilometers || 0,
    paymentMethod: parsed.paymentMethod || 'Prevod',
    handoverPlace: parsed.handoverLocation,
    // Parsovanie dátumov
    startDate: parsed.handoverDate ? new Date(parsed.handoverDate) : null,
    endDate: parsed.returnDate ? new Date(parsed.returnDate) : null,
    // Dodatočné údaje
    deposit: 0, // TODO: Pridať parsing pre depozit
    extraKilometerRate: parsed.extraKilometerRate || 0,
    fuelLevel: parsed.fuelLevel || 100,
    startOdometer: parsed.startOdometer || 0,
    notes: parsed.notes,
    insuranceInfo: parsed.insuranceInfo,
  };
}
