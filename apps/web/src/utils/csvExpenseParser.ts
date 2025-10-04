// ✅ FÁZA 3.2: CSV parsing utilities pre expenses
import type { Expense } from '@/types';

/**
 * Parsuje dátum string z CSV do Date objektu
 */
export function parseExpenseCSVDate(dateStr: string): Date {
  // MM/YYYY → 01.MM.YYYY
  if (/^\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [month, year] = dateStr.split('/');
    return new Date(parseInt(year!), parseInt(month!) - 1, 1);
  }

  // DD.MM.YYYY
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('.');
    return new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!));
  }

  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
    return new Date(dateStr);
  }

  // Fallback - aktuálny dátum
  console.warn(
    `Nepodarilo sa parsovať dátum: ${dateStr}, používam aktuálny dátum`
  );
  return new Date();
}

/**
 * Mapuje kategóriu string na validnú kategóriu
 */
export function mapExpenseCategory(categoryStr: string): string {
  if (!categoryStr) return 'other';

  const normalized = categoryStr.trim().toLowerCase();

  const categoryMap: Record<string, string> = {
    fuel: 'fuel',
    palivo: 'fuel',
    benzín: 'fuel',
    nafta: 'fuel',
    tankovanie: 'fuel',

    service: 'service',
    servis: 'service',
    oprava: 'service',
    údržba: 'service',
    maintenance: 'service',

    insurance: 'insurance',
    poistenie: 'insurance',
    kasko: 'insurance',
    pzp: 'insurance',
    havarijné: 'insurance',

    other: 'other',
    iné: 'other',
    ostatné: 'other',
  };

  return categoryMap[normalized] || 'other';
}

/**
 * Parsuje amount string z CSV
 */
export function parseExpenseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') return 0;

  // Odstráň whitespace a nahraď čiarku bodkou
  const cleaned = amountStr.trim().replace(',', '.');

  // Odstráň všetky non-numeric okrem bodky a mínusu
  const numericOnly = cleaned.replace(/[^\d.-]/g, '');

  const parsed = parseFloat(numericOnly);

  if (isNaN(parsed)) {
    console.warn(`Neplatná suma "${amountStr}", nastavujem na 0`);
    return 0;
  }

  return parsed;
}

/**
 * Validuje expense dáta z CSV
 */
export function validateExpenseCSVRow(
  data: string[],
  rowIndex: number
): { valid: boolean; error?: string } {
  // Minimálne description musí byť vyplnené
  const description = data[1]?.trim();

  if (!description) {
    return {
      valid: false,
      error: `Riadok ${rowIndex}: Chýba popis nákladu`,
    };
  }

  // Ďalšie polia sú voliteľné
  return { valid: true };
}

/**
 * Parsuje CSV row do Expense objektu
 */
export function parseExpenseCSVRow(
  fields: string[],
  rowIndex: number
): Partial<Expense> | null {
  // Format: [id, description, amount, date, category, company, vehicleId, vehicleLicensePlate, note]
  const [, description, amount, date, category, company, vehicleId, , note] =
    fields;

  // Validácia
  const validation = validateExpenseCSVRow(fields, rowIndex);
  if (!validation.valid) {
    console.warn(validation.error);
    return null;
  }

  return {
    description: description!.trim(),
    amount: parseExpenseAmount(amount || '0'),
    date: date ? parseExpenseCSVDate(date.trim()) : new Date(),
    category: mapExpenseCategory(category || 'other'),
    vehicleId:
      vehicleId && vehicleId.trim() !== '' ? vehicleId.trim() : undefined,
    company:
      company && company.trim() !== '' ? company.trim() : 'Neznáma firma',
    note: note && note.trim() !== '' ? note.trim() : undefined,
  };
}
