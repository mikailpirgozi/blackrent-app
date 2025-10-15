/**
 * Custom useLanguage Hook
 * Manages language switching and persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, isSupportedLanguage } from '../config';
import type { SupportedLanguage } from '../../config/constants';

export interface UseLanguageReturn {
  currentLanguage: SupportedLanguage;
  changeLanguage: (lng: SupportedLanguage) => Promise<void>;
  isSupportedLanguage: (lng: string) => boolean;
  isChanging: boolean;
}

/**
 * Hook for managing application language
 * @returns Language utilities and current language state
 * 
 * @example
 * const { currentLanguage, changeLanguage } = useLanguage();
 * await changeLanguage('en');
 */
export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    getCurrentLanguage() as SupportedLanguage
  );

  useEffect(() => {
    // Listen for language changes
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng as SupportedLanguage);
      setIsChanging(false);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const handleChangeLanguage = useCallback(async (lng: SupportedLanguage) => {
    if (lng === currentLanguage) {
      return; // Already in this language
    }

    setIsChanging(true);
    
    try {
      await changeLanguage(lng);
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsChanging(false);
    }
  }, [currentLanguage]);

  return {
    currentLanguage,
    changeLanguage: handleChangeLanguage,
    isSupportedLanguage,
    isChanging,
  };
}

export default useLanguage;



