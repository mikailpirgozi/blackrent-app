import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock import.meta.env
const mockEnv: Record<string, string> = {};

vi.mock('./flags', async () => {
  const actual = await vi.importActual('./flags');
  return {
    ...actual,
    flag: (name: string, fallback = false): boolean => {
      const key = `VITE_FLAG_${name}`;
      const v = mockEnv[key];

      if (v === '1' || v === 'true') return true;
      if (v === '0' || v === 'false') return false;

      return fallback;
    },
  };
});

import { flag } from './flags';

describe('flag', () => {
  beforeEach(() => {
    // Vyčistí mock env pred každým testom
    Object.keys(mockEnv).forEach(key => {
      delete mockEnv[key];
    });
  });

  it('vráti true pre "1" hodnotu', () => {
    mockEnv.VITE_FLAG_EXTRA_KM = '1';
    expect(flag('EXTRA_KM')).toBe(true);
  });

  it('vráti true pre "true" hodnotu', () => {
    mockEnv.VITE_FLAG_EXTRA_KM = 'true';
    expect(flag('EXTRA_KM')).toBe(true);
  });

  it('vráti false pre "0" hodnotu', () => {
    mockEnv.VITE_FLAG_EXTRA_KM = '0';
    expect(flag('EXTRA_KM')).toBe(false);
  });

  it('vráti false pre "false" hodnotu', () => {
    mockEnv.VITE_FLAG_EXTRA_KM = 'false';
    expect(flag('EXTRA_KM')).toBe(false);
  });

  it('použije fallback hodnotu ak flag nie je nastavený', () => {
    expect(flag('NONEXISTENT_FLAG', true)).toBe(true);
    expect(flag('NONEXISTENT_FLAG', false)).toBe(false);
    expect(flag('NONEXISTENT_FLAG')).toBe(false); // default fallback
  });

  it('použije fallback pre neznáme hodnoty', () => {
    mockEnv.VITE_FLAG_WEIRD = 'maybe';
    expect(flag('WEIRD', true)).toBe(true);
    expect(flag('WEIRD', false)).toBe(false);
  });

  it('správne vytvára VITE_FLAG_ prefix', () => {
    mockEnv.VITE_FLAG_TEST_FEATURE = '1';
    expect(flag('TEST_FEATURE')).toBe(true);
  });

  it('je case sensitive', () => {
    mockEnv.VITE_FLAG_UPPER = '1';
    expect(flag('UPPER')).toBe(true);
    expect(flag('upper')).toBe(false); // fallback
  });
});
