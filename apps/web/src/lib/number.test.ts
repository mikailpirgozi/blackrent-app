import { describe, expect, it } from 'vitest';
import { parseNumber } from './number';

describe('parseNumber', () => {
  it('parsuje validné čísla s bodkou', () => {
    expect(parseNumber('12.34')).toBe(12.34);
    expect(parseNumber('123')).toBe(123);
    expect(parseNumber('0.5')).toBe(0.5);
    expect(parseNumber('0')).toBe(0);
  });

  it('parsuje slovenský formát s čiarkou', () => {
    expect(parseNumber('12,34')).toBe(12.34);
    expect(parseNumber('1,5')).toBe(1.5);
    expect(parseNumber('0,25')).toBe(0.25);
  });

  it('odstráni whitespaces', () => {
    expect(parseNumber(' 123 ')).toBe(123);
    expect(parseNumber('  12.34  ')).toBe(12.34);
    expect(parseNumber('\t12,34\n')).toBe(12.34);
  });

  it('vráti null pre nevalidné vstupy', () => {
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
    expect(parseNumber('12.34.56')).toBeNull();
    expect(parseNumber('12,34,56')).toBeNull();
  });

  it('spracováva záporné čísla', () => {
    expect(parseNumber('-12.34')).toBe(-12.34);
    expect(parseNumber('-12,34')).toBe(-12.34);
    expect(parseNumber(' -123 ')).toBe(-123);
  });

  it('spracováva veľké čísla', () => {
    expect(parseNumber('123456.789')).toBe(123456.789);
    expect(parseNumber('123456,789')).toBe(123456.789);
  });

  it('vráti null pre null/undefined vstupy', () => {
    expect(parseNumber(null as unknown as string)).toBeNull();
    expect(parseNumber(undefined as unknown as string)).toBeNull();
  });
});
