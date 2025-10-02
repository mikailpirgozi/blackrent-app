import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../../hooks/use-translation';
import { supportedLanguages, SupportedLanguage } from '../../../i18n';
import { logger } from '../../../utils/logger';

const { width } = Dimensions.get('window');

// Language flags mapping
const languageFlags: Record<SupportedLanguage, string> = {
  sk: '🇸🇰',
  en: '🇺🇸',
  de: '🇩🇪',
  cz: '🇨🇿',
  hu: '🇭🇺',
};

// Native language names
const nativeLanguageNames: Record<SupportedLanguage, string> = {
  sk: 'Slovenčina',
  en: 'English',
  de: 'Deutsch',
  cz: 'Čeština',
  hu: 'Magyar',
};

export interface LanguageSwitcherProps {
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show country flags */
  showFlags?: boolean;
  /** Show native language names */
  showNativeNames?: boolean;
  /** Custom style for container */
  style?: any;
  /** Callback when language changes */
  onLanguageChange?: (language: SupportedLanguage) => void;
}

/**
 * 🌍 Language Switcher Component
 * 
 * Allows users to switch between supported languages.
 * Supports different sizes, flags, and native names display.
 * 
 * @example
 * <LanguageSwitcher 
 *   size="large"
 *   showFlags={true}
 *   showNativeNames={true}
 * />
 */
export function LanguageSwitcher({
  size = 'medium',
  showFlags = true,
  showNativeNames = false,
  style,
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { getCurrentLanguage, changeLanguage } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = getCurrentLanguage();

  const handleLanguageSelect = async (language: SupportedLanguage) => {
    if (language === currentLanguage || isChanging) return;

    try {
      setIsChanging(true);
      await changeLanguage(language);
      onLanguageChange?.(language);
      setIsModalVisible(false);
      logger.info(`Language switched to: ${language}`);
    } catch (error) {
      logger.error('Failed to change language:', error as Error);
    } finally {
      setIsChanging(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingHorizontal: 8, paddingVertical: 4 },
          text: { fontSize: 12 },
          flag: { fontSize: 16 },
        };
      case 'large':
        return {
          container: { paddingHorizontal: 16, paddingVertical: 12 },
          text: { fontSize: 16 },
          flag: { fontSize: 24 },
        };
      default:
        return {
          container: { paddingHorizontal: 12, paddingVertical: 8 },
          text: { fontSize: 14 },
          flag: { fontSize: 20 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderLanguageOption = (lang: SupportedLanguage, isSelected: boolean = false) => (
    <TouchableOpacity
      key={lang}
      style={[
        styles.languageOption,
        isSelected && styles.selectedLanguageOption,
        isChanging && styles.disabledOption,
      ]}
      onPress={() => handleLanguageSelect(lang)}
      disabled={isChanging}
    >
      {showFlags && (
        <Text style={[styles.flag, { fontSize: sizeStyles.flag.fontSize }]}>
          {languageFlags[lang]}
        </Text>
      )}
      <View style={styles.languageInfo}>
        <Text style={[
          styles.languageName,
          sizeStyles.text,
          isSelected && styles.selectedLanguageText,
        ]}>
          {supportedLanguages[lang]}
        </Text>
        {showNativeNames && (
          <Text style={[
            styles.nativeLanguageName,
            { fontSize: sizeStyles.text.fontSize - 2 },
            isSelected && styles.selectedNativeText,
          ]}>
            {nativeLanguageNames[lang]}
          </Text>
        )}
      </View>
      {isSelected && (
        <Ionicons 
          name="checkmark" 
          size={20} 
          color="#10b981" 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.trigger, sizeStyles.container]}
        onPress={() => setIsModalVisible(true)}
        disabled={isChanging}
      >
        {showFlags && (
          <Text style={[styles.flag, { fontSize: sizeStyles.flag.fontSize }]}>
            {languageFlags[currentLanguage]}
          </Text>
        )}
        <Text style={[styles.currentLanguage, sizeStyles.text]}>
          {showNativeNames ? nativeLanguageNames[currentLanguage] : supportedLanguages[currentLanguage]}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color="#6b7280" 
        />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vyberte jazyk</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.languageList}>
              {Object.keys(supportedLanguages).map((lang) =>
                renderLanguageOption(lang as SupportedLanguage, lang === currentLanguage)
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    minWidth: 120,
  },
  flag: {
    marginRight: 8,
  },
  currentLanguage: {
    flex: 1,
    color: '#374151',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: Math.min(width - 32, 320),
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  selectedLanguageOption: {
    backgroundColor: '#f0fdf4',
  },
  disabledOption: {
    opacity: 0.5,
  },
  languageInfo: {
    flex: 1,
    marginLeft: 8,
  },
  languageName: {
    color: '#374151',
    fontWeight: '500',
  },
  selectedLanguageText: {
    color: '#10b981',
    fontWeight: '600',
  },
  nativeLanguageName: {
    color: '#6b7280',
    marginTop: 2,
  },
  selectedNativeText: {
    color: '#059669',
  },
});

export default LanguageSwitcher;
