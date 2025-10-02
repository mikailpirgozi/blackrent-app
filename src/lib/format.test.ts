import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney } from './format';

describe('formatMoney', () => {
  it('formátuje centy na eurá s lokalizáciou sk-SK', () => {
    expect(formatMoney(12345)).toBe('123,45\u00A0€');
    expect(formatMoney(0)).toBe('0,00\u00A0€');
    expect(formatMoney(100)).toBe('1,00\u00A0€');
    expect(formatMoney(50)).toBe('0,50\u00A0€');
  });

  it('funguje s rôznymi menami', () => {
    expect(formatMoney(12345, 'USD', 'en-US')).toBe('$123.45');
    expect(formatMoney(12345, 'CZK', 'cs-CZ')).toBe('123,45\u00A0Kč');
  });

  it('spracováva záporné hodnoty', () => {
    expect(formatMoney(-12345)).toBe('-123,45\u00A0€');
  });

  it('spracováva veľké čísla', () => {
    expect(formatMoney(123456789)).toBe('1\u00A0234\u00A0567,89\u00A0€');
  });
});

describe('formatDate', () => {
  it('formátuje ISO dátum na slovenský formát', () => {
    const result = formatDate('2025-08-30T12:00:00Z');
    expect(result).toBe('30. 8. 2025');
  });

  it('funguje s rôznymi lokalizáciami', () => {
    const iso = '2025-08-30T12:00:00Z';
    expect(formatDate(iso, 'en-US')).toBe('8/30/2025');
    expect(formatDate(iso, 'cs-CZ')).toBe('30. 8. 2025');
  });

  it('spracováva rôzne ISO formáty', () => {
    expect(formatDate('2025-01-01T00:00:00Z')).toBe('1. 1. 2025');
    expect(formatDate('2025-12-31T12:00:00Z')).toBe('31. 12. 2025');
  });

  it('spracováva ISO bez Z suffix', () => {
    expect(formatDate('2025-08-30T12:00:00')).toBe('30. 8. 2025');
  });
});
