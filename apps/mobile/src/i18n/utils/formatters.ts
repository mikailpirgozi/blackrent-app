/**
 * Locale-aware Formatters
 * Currency, date, number formatting based on current language
 */

import { format as dateFnsFormat, parseISO } from 'date-fns';
import { sk, cs, de, enUS } from 'date-fns/locale';
import { CURRENCY, DATE_FORMATS } from '../../config/constants';
import type { SupportedLanguage } from '../../config/constants';

// Locale mapping for date-fns
const LOCALE_MAP = {
  sk: sk,
  cs: cs,
  de: de,
  en: enUS,
  pl: enUS, // Fallback to English for Polish
  hu: enUS, // Fallback to English for Hungarian
} as const;

/**
 * Format currency based on locale
 * @param amount - Amount to format
 * @param locale - Language locale
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(120.50, 'sk') // "120,50 €"
 * formatCurrency(120.50, 'en') // "€120.50"
 */
export function formatCurrency(amount: number, locale: SupportedLanguage = 'sk'): string {
  const formattedAmount = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY.CODE,
    minimumFractionDigits: CURRENCY.DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY.DECIMAL_PLACES,
  }).format(amount);

  return formattedAmount;
}

/**
 * Format number based on locale
 * @param value - Number to format
 * @param locale - Language locale
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234.56, 'sk') // "1 234,56"
 * formatNumber(1234.56, 'en') // "1,234.56"
 */
export function formatNumber(
  value: number,
  locale: SupportedLanguage = 'sk',
  decimals?: number
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date based on locale
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @param locale - Language locale
 * @param formatString - Optional custom format string
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-12-25', 'sk') // "25.12.2024"
 * formatDate('2024-12-25', 'en') // "Dec 25, 2024"
 */
export function formatDate(
  date: Date | string | number,
  locale: SupportedLanguage = 'sk',
  formatString?: string
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  const localeObj = LOCALE_MAP[locale];
  
  const format = formatString || (locale === 'en' ? 'MMM dd, yyyy' : DATE_FORMATS.DISPLAY);

  return dateFnsFormat(dateObj, format, { locale: localeObj });
}

/**
 * Format date with time based on locale
 * @param date - Date to format
 * @param locale - Language locale
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime('2024-12-25T14:30:00', 'sk') // "25.12.2024 14:30"
 * formatDateTime('2024-12-25T14:30:00', 'en') // "Dec 25, 2024 2:30 PM"
 */
export function formatDateTime(
  date: Date | string | number,
  locale: SupportedLanguage = 'sk'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  const localeObj = LOCALE_MAP[locale];
  
  const format = locale === 'en' ? 'MMM dd, yyyy h:mm a' : DATE_FORMATS.DISPLAY_WITH_TIME;

  return dateFnsFormat(dateObj, format, { locale: localeObj });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to compare
 * @param locale - Language locale
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime(Date.now() - 3600000, 'sk') // "pred 1 hodinou"
 * formatRelativeTime(Date.now() + 86400000, 'en') // "in 1 day"
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: SupportedLanguage = 'sk'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSec = Math.abs(Math.floor(diffMs / 1000));
  const isPast = diffMs < 0;

  // Define time units in seconds
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (diffSec < minute) {
    value = diffSec;
    unit = 'second';
  } else if (diffSec < hour) {
    value = Math.floor(diffSec / minute);
    unit = 'minute';
  } else if (diffSec < day) {
    value = Math.floor(diffSec / hour);
    unit = 'hour';
  } else if (diffSec < week) {
    value = Math.floor(diffSec / day);
    unit = 'day';
  } else if (diffSec < month) {
    value = Math.floor(diffSec / week);
    unit = 'week';
  } else if (diffSec < year) {
    value = Math.floor(diffSec / month);
    unit = 'month';
  } else {
    value = Math.floor(diffSec / year);
    unit = 'year';
  }

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return formatter.format(isPast ? -value : value, unit);
}

/**
 * Format price range
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param locale - Language locale
 * @returns Formatted price range string
 * 
 * @example
 * formatPriceRange(50, 100, 'sk') // "50 € - 100 €"
 * formatPriceRange(50, 100, 'en') // "€50 - €100"
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  locale: SupportedLanguage = 'sk'
): string {
  const min = formatCurrency(minPrice, locale);
  const max = formatCurrency(maxPrice, locale);
  return `${min} - ${max}`;
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param locale - Language locale
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(25.5, 'sk') // "25,5 %"
 * formatPercentage(25.5, 'en') // "25.5%"
 */
export function formatPercentage(
  value: number,
  locale: SupportedLanguage = 'sk',
  decimals = 1
): string {
  const formatted = formatNumber(value, locale, decimals);
  return locale === 'sk' ? `${formatted} %` : `${formatted}%`;
}



