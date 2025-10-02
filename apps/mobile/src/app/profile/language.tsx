/**
 * 🌍 Language & Translation Settings
 * Language selection and AI translation settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '../../hooks/use-translation';
import { supportedLanguages, SupportedLanguage } from '../../i18n';
import { LanguageSwitcher } from '../../components/ui/language-switcher/language-switcher';

const SUPPORTED_LANGUAGES = [
  { code: 'sk', name: 'Slovenčina', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'cz', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
];

export default function LanguageProfileScreen() {
  const { t, changeLanguage, getCurrentLanguage, isReady } = useTranslation();
  
  // Language switching state
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  
  // AI Translation settings
  const [aiTranslationEnabled, setAiTranslationEnabled] = useState(true);
  const [autoTranslateContent, setAutoTranslateContent] = useState(false);
  
  // Get current language
  const currentLanguage = getCurrentLanguage();
  const isInitialized = isReady;
  const aiLanguage = currentLanguage;

  const handleLanguageChange = async (languageCode: string) => {
    setIsChangingLanguage(true);
    try {
      await changeLanguage(languageCode as SupportedLanguage);
      Alert.alert(
        String(t('common.confirm')),
        'Language changed successfully'
      );
    } catch (error) {
      Alert.alert(
        String(t('common.error')),
        'Failed to change language'
      );
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const handleShowCacheStats = () => {
    Alert.alert(
      'Cache Statistics',
      `Translation cache is managed automatically by i18next.\nCurrent language: ${currentLanguage}\nInitialized: ${isInitialized ? 'Yes' : 'No'}`
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Translation cache is managed automatically by i18next and cannot be manually cleared.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '600', color: '#333' }}>
          {t('profile.language', 'Jazyk a preklad')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Language Selection */}
        <View style={{
          backgroundColor: '#fff',
          margin: 16,
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
            {t('language.selectLanguage', 'Vybrať jazyk')}
          </Text>
          
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            {t('language.selectLanguageDesc', 'Vyberte jazyk pre celú aplikáciu')}
          </Text>

          {SUPPORTED_LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              onPress={() => handleLanguageChange(language.code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: currentLanguage === language.code ? '#e3f2fd' : 'transparent',
                borderWidth: currentLanguage === language.code ? 2 : 1,
                borderColor: currentLanguage === language.code ? '#007AFF' : '#e5e7eb',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>
                {language.flag}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: currentLanguage === language.code ? '600' : '400',
                  color: currentLanguage === language.code ? '#007AFF' : '#333'
                }}>
                  {language.name}
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  {language.nativeName}
                </Text>
              </View>
              {currentLanguage === language.code && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Translation Settings */}
        <View style={{
          backgroundColor: '#fff',
          margin: 16,
          marginTop: 0,
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
            {t('language.aiTranslation', 'AI preklad')}
          </Text>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#f3f4f6',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500' }}>
                {t('language.enableAiTranslation', 'Povoliť AI preklad')}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                {t('language.enableAiTranslationDesc', 'Automaticky prekladať obsah pomocou AI')}
              </Text>
            </View>
            <Switch
              value={aiTranslationEnabled}
              onValueChange={setAiTranslationEnabled}
              trackColor={{ false: '#e5e7eb', true: '#007AFF' }}
              thumbColor={aiTranslationEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500' }}>
                {t('language.autoTranslateContent', 'Automaticky prekladať obsah')}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                {t('language.autoTranslateContentDesc', 'Prekladať popisy vozidiel a ďalší obsah')}
              </Text>
            </View>
            <Switch
              value={autoTranslateContent}
              onValueChange={setAutoTranslateContent}
              trackColor={{ false: '#e5e7eb', true: '#007AFF' }}
              thumbColor={autoTranslateContent ? '#fff' : '#f4f3f4'}
              disabled={!aiTranslationEnabled}
            />
          </View>
        </View>

        {/* Translation Status */}
        <View style={{
          backgroundColor: '#fff',
          margin: 16,
          marginTop: 0,
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
            {t('language.translationStatus', 'Stav prekladu')}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isInitialized ? '#28a745' : '#dc3545',
              marginRight: 8,
            }} />
            <Text style={{ fontSize: 16 }}>
              {t('language.systemStatus', 'Systém')}: {isInitialized ? t('language.ready', 'Pripravený') : t('language.notReady', 'Nepripravený')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, color: '#666' }}>
              {t('language.currentLanguage', 'Aktuálny jazyk')}: {aiLanguage.toUpperCase()}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={handleShowCacheStats}
              style={{
                flex: 1,
                backgroundColor: '#17a2b8',
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {t('language.showStats', 'Zobraziť štatistiky')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearCache}
              style={{
                flex: 1,
                backgroundColor: '#dc3545',
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {t('language.clearCache', 'Vymazať cache')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Switcher Demo */}
        <View style={{
          backgroundColor: '#fff',
          margin: 16,
          marginTop: 0,
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
            {t('language.quickSwitcher', 'Rýchly prepínač')}
          </Text>
          
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            {t('language.quickSwitcherDesc', 'Rýchlo prepínajte medzi jazykmi')}
          </Text>

          <LanguageSwitcher 
            size="large"
            showFlags={true}
            showNativeNames={true}
          />
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
