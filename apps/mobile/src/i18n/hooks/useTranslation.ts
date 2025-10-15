/**
 * Custom useTranslation Hook
 * Type-safe wrapper around react-i18next useTranslation
 */

import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { Namespace } from '../config';

/**
 * Custom hook for translations with namespace support
 * @param ns - Namespace(s) to use
 * @returns Translation function and i18n instance
 * 
 * @example
 * const { t } = useTranslation('catalog');
 * <Text>{t('catalog:title')}</Text>
 */
export function useTranslation(ns?: Namespace | Namespace[]) {
  const translation = useI18nextTranslation(ns);
  
  return translation;
}

export default useTranslation;



