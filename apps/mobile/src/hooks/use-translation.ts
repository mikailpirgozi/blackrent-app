/**
 * 🌍 BlackRent Mobile - Translation Hook
 * Wrapper around react-i18next for type-safe translations
 */

import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

export interface TranslationHook {
  t: TFunction;
  i18n: ReturnType<typeof useI18nextTranslation>['i18n'];
  ready: boolean;
}

/**
 * Custom hook for translations
 * @returns Translation function and i18n instance
 */
export function useTranslation(): TranslationHook {
  const { t, i18n, ready } = useI18nextTranslation();

  return {
    t,
    i18n,
    ready,
  };
}

/**
 * Get translation function without hook
 * Useful for non-component contexts
 */
export function getTranslation() {
  const { t } = useI18nextTranslation();
  return t;
}

export default useTranslation;



