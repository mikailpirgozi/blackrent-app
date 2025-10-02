import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTranslation } from '../../../hooks/use-translation';

export interface TranslatedTextProps extends Omit<TextProps, 'children'> {
  /** Text to be translated */
  text: string;
  /** Translation context for better accuracy */
  context?: 'ui' | 'error' | 'success' | 'navigation' | 'form' | 'booking' | 'vehicle' | 'profile';
  /** Interpolation values for dynamic content */
  values?: Record<string, string | number>;
  /** Fallback text if translation fails */
  fallback?: string;
}

/**
 * 🌍 TranslatedText Component
 * 
 * Automatically translates text based on current language settings.
 * Supports context-aware translations and dynamic interpolation.
 * 
 * @example
 * <TranslatedText 
 *   text="Vitajte v BlackRent" 
 *   context="ui"
 *   style={styles.title}
 * />
 * 
 * @example
 * <TranslatedText 
 *   text="Rezervácia pre {{count}} osôb" 
 *   context="booking"
 *   values={{ count: 4 }}
 * />
 */
export function TranslatedText({ 
  text, 
  context = 'ui', 
  values, 
  fallback,
  style,
  ...textProps 
}: TranslatedTextProps) {
  const { translate, isReady } = useTranslation();

  // Create translation key based on context and text
  const getTranslationKey = (originalText: string, ctx: string): string => {
    // Convert text to a key format (lowercase, replace spaces with dots)
    const keyText = originalText
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
    
    return `${ctx}.${keyText}`;
  };

  if (!isReady) {
    // Show original text while i18n is loading
    return (
      <Text style={style} {...textProps}>
        {fallback || text}
      </Text>
    );
  }

  const translationKey = getTranslationKey(text, context);
  const translatedText = translate(translationKey, values);
  
  // If translation key doesn't exist, use original text as fallback
  const displayText = translatedText === translationKey 
    ? (fallback || text) 
    : translatedText;

  return (
    <Text style={style} {...textProps}>
      {displayText}
    </Text>
  );
}

export default TranslatedText;
