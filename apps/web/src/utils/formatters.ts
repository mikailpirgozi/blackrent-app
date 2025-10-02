// Date formatting utilities
export function formatDate(date: string | Date): string {
  if (!date) return 'N/A';

  try {
    // ZACHOVAJ PRESNÝ DÁTUM BEZ TIMEZONE KONVERZIE
    if (typeof date === 'string') {
      // Ak je string vo formáte YYYY-MM-DD HH:MM:SS, vráť len dátum
      const match = date.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/
      );
      if (match) {
        const [, year, month, day] = match;
        return `${day}.${month}.${year}`;
      }

      // Ak je string v ISO formáte s timezone - extrahuj len dátum
      if (date.includes('T')) {
        const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          const [, year, month, day] = dateMatch;
          return `${day}.${month}.${year}`;
        }
      }
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'N/A';

    // Použij lokálne hodnoty
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}.${month}.${year}`;
  } catch {
    return 'N/A';
  }
}

export function formatDateTime(date: string | Date): string {
  if (!date) return 'N/A';

  try {
    // ZACHOVAJ PRESNÝ ČAS BEZ AKEJKOĽVEK TIMEZONE KONVERZIE
    if (typeof date === 'string') {
      // Ak je string vo formáte YYYY-MM-DD HH:MM:SS, vráť presne tak ako je
      const match = date.match(
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/
      );
      if (match) {
        const [, year, month, day, hour, minute] = match;
        return `${day}.${month}.${year} ${hour}:${minute}`;
      }

      // Ak je string v ISO formáte (2025-09-08T08:00:00.000Z alebo 2025-09-08T08:00:00Z)
      // Backend vracia LOKÁLNY čas v ISO formáte s Z na konci
      // T08:00:00.000Z znamená 08:00 lokálny čas, NIE UTC!
      if (date.includes('T')) {
        // Parsuj čas priamo zo stringu - ignoruj Z na konci
        const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        if (isoMatch) {
          const [, year, month, day, hour, minute] = isoMatch;
          // Vráť presne tie hodnoty ktoré sú v stringu
          return `${day}.${month}.${year} ${hour}:${minute}`;
        }
      }

      // Ak nič z toho nezafungovalo, skús Date objekt ako poslednú možnosť
      // ALE NIKDY HO NEPOUŽÍVAJ PRE ISO FORMÁTY!
      if (!date.includes('T') && !date.match(/^\d{4}-\d{2}-\d{2}\s/)) {
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          const hour = String(dateObj.getHours()).padStart(2, '0');
          const minute = String(dateObj.getMinutes()).padStart(2, '0');
          return `${day}.${month}.${year} ${hour}:${minute}`;
        }
      }
    }

    // Pre Date objekty - použij lokálne hodnoty
    if (date instanceof Date && !isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');

      return `${day}.${month}.${year} ${hour}:${minute}`;
    }

    return 'N/A';
  } catch {
    return 'N/A';
  }
}

export function formatTime(date: string | Date): string {
  if (!date) return 'N/A';

  try {
    // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
    if (typeof date === 'string') {
      // Ak je string vo formáte YYYY-MM-DD HH:MM:SS, vráť len čas
      const match = date.match(
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/
      );
      if (match) {
        const [, , , , hour, minute] = match;
        return `${hour}:${minute}`;
      }

      // Ak je string v ISO formáte - extrahuj len čas
      // Backend vracia LOKÁLNY čas v ISO formáte s Z na konci
      // T08:00:00.000Z znamená 08:00 lokálny čas, NIE UTC!
      if (date.includes('T')) {
        const timeMatch = date.match(/T(\d{2}):(\d{2})/);
        if (timeMatch) {
          const [, hour, minute] = timeMatch;
          // Vráť presne tie hodnoty ktoré sú v stringu
          return `${hour}:${minute}`;
        }
      }
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'N/A';

    // Použij lokálne hodnoty
    const hour = String(dateObj.getHours()).padStart(2, '0');
    const minute = String(dateObj.getMinutes()).padStart(2, '0');

    return `${hour}:${minute}`;
  } catch {
    return 'N/A';
  }
}

// Currency formatting utilities
export function formatCurrency(amount: number | string): string {
  if (amount === null || amount === undefined || amount === '') return '0,00 €';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '0,00 €';

  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function formatNumber(number: number | string): string {
  if (number === null || number === undefined || number === '') return '0';

  const numValue = typeof number === 'string' ? parseFloat(number) : number;

  if (isNaN(numValue)) return '0';

  return new Intl.NumberFormat('sk-SK').format(numValue);
}

// Duration formatting utilities
export function formatDuration(
  startDate: string | Date,
  endDate: string | Date
): string {
  if (!startDate || !endDate) return 'N/A';

  try {
    // Parse dates consistently with timezone handling
    const parseDate = (date: string | Date): Date => {
      if (typeof date === 'string') {
        // YYYY-MM-DD HH:MM:SS format
        const match = date.match(
          /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/
        );
        if (match) {
          const [, year, month, day, hour, minute, second] = match;
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
          );
        }
        // ISO format - use UTC time
        if (date.includes('T')) {
          return new Date(date);
        }
        return new Date(date);
      }
      return date;
    };

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 deň';
    if (diffDays < 5) return `${diffDays} dni`;
    return `${diffDays} dní`;
  } catch {
    return 'N/A';
  }
}

// Text formatting utilities
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Slovak phone number formatting
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+421 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith('421')) {
    const national = cleaned.substring(3);
    return `+421 ${national.substring(0, 3)} ${national.substring(3, 6)} ${national.substring(6)}`;
  }

  // Return original if doesn't match expected format
  return phone;
}

// Status formatting
export function getStatusDisplayText(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Aktívny',
    completed: 'Dokončený',
    pending: 'Čakajúci',
    cancelled: 'Zrušený',
    draft: 'Koncept',
    confirmed: 'Potvrdený',
    paid: 'Zaplatené',
    unpaid: 'Nezaplatené',
    overdue: 'Po termíne',
  };

  return statusMap[status.toLowerCase()] || capitalizeFirst(status);
}

/**
 * 🕐 TIMEZONE-SAFE DATE PARSING FOR DATETIMEPICKER
 * Parsuje dátum bez timezone konverzie pre použitie v DateTimePicker komponentoch
 */
export function parseTimezoneFreeDateString(
  dateValue: string | Date
): Date | null {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return dateValue;
  }

  // Ak je string vo formáte "YYYY-MM-DD HH:MM:SS", parsuj ho ako lokálny čas
  const match = dateValue.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/
  );
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    // Vytvor Date objekt s explicitnými hodnotami - bez timezone konverzie
    return new Date(
      parseInt(year),
      parseInt(month) - 1, // Mesiace sú 0-indexed
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  }

  // Fallback pre iné formáty
  return new Date(dateValue);
}
