/**
 * Handover Protocol Screen
 * Vehicle condition documentation at pickup
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../i18n/hooks/useTranslation';
import { PhotoCapture } from '../../../components/protocol/PhotoCapture';
import { SignaturePad } from '../../../components/protocol/SignaturePad';
import type { ProtocolPhoto, ProtocolFormData } from '../../../types/protocol';

export default function HandoverProtocolScreen() {
  const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
  const router = useRouter();
  const { t } = useTranslation(['protocol', 'common']);

  // Form state
  const [photos, setPhotos] = useState<ProtocolPhoto[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [formData, setFormData] = useState<ProtocolFormData>({
    odometer: '',
    fuelLevel: 100,
    cleanlinessLevel: 'excellent',
    damages: [],
    notes: '',
    checklist: {
      spareTire: true,
      jack: true,
      triangleWarning: true,
      firstAidKit: true,
      fireExtinguisher: true,
      reflectiveVest: true,
      vehicleDocuments: true,
      keys: 2,
    },
  });

  const handleInputChange = useCallback((field: keyof ProtocolFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleChecklistChange = useCallback((item: keyof typeof formData.checklist, value: boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, [item]: value },
    }));
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (!formData.odometer) {
      Alert.alert(t('common:errors.general'), 'Prosím zadajte stav tachometra');
      return;
    }

    if (photos.length < 5) {
      Alert.alert(t('common:errors.general'), 'Prosím pridajte minimálne 5 fotografií');
      return;
    }

    if (!signature) {
      Alert.alert(t('common:errors.general'), 'Prosím pridajte podpis');
      return;
    }

    // TODO: Submit to API
    Alert.alert(
      t('common:success'),
      'Protokol bol úspešne odoslaný',
      [
        {
          text: t('common:buttons.confirm'),
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={AppleDesign.Colors.label} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('protocol:handover.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('protocol:handover.subtitle')}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Vehicle Condition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('protocol:condition.title')}</Text>

            {/* Odometer */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('protocol:condition.odometer')}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={AppleDesign.Colors.placeholderText}
                keyboardType="numeric"
                value={formData.odometer}
                onChangeText={(text) => handleInputChange('odometer', text)}
              />
            </View>

            {/* Fuel Level */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t('protocol:condition.fuelLevel')}: {formData.fuelLevel}%
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>0%</Text>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${formData.fuelLevel}%` },
                    ]}
                  />
                </View>
                <Text style={styles.sliderValue}>100%</Text>
              </View>
            </View>

            {/* Cleanliness */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('protocol:condition.cleanliness')}</Text>
              <View style={styles.segmentedControl}>
                {(['excellent', 'good', 'fair', 'poor'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.segment,
                      formData.cleanlinessLevel === level && styles.segmentActive,
                    ]}
                    onPress={() => handleInputChange('cleanlinessLevel', level)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        formData.cleanlinessLevel === level && styles.segmentTextActive,
                      ]}
                    >
                      {t(`protocol:condition.cleanlinessLevels.${level}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('protocol:condition.notes')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('protocol:condition.notes')}
                placeholderTextColor={AppleDesign.Colors.placeholderText}
                multiline
                numberOfLines={4}
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
              />
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('protocol:checklist.title')}</Text>

            {Object.entries(formData.checklist).map(([key, value]) => {
              if (key === 'keys') {
                return (
                  <View key={key} style={styles.checklistItem}>
                    <Text style={styles.checklistLabel}>
                      {t(`protocol:checklist.${key}`)}
                    </Text>
                    <View style={styles.keysControl}>
                      <TouchableOpacity
                        style={styles.keysButton}
                        onPress={() =>
                          handleChecklistChange('keys', Math.max(1, (value as number) - 1))
                        }
                      >
                        <Ionicons name="remove" size={20} color={AppleDesign.Colors.systemBlue} />
                      </TouchableOpacity>
                      <Text style={styles.keysValue}>{value}</Text>
                      <TouchableOpacity
                        style={styles.keysButton}
                        onPress={() => handleChecklistChange('keys', (value as number) + 1)}
                      >
                        <Ionicons name="add" size={20} color={AppleDesign.Colors.systemBlue} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              return (
                <View key={key} style={styles.checklistItem}>
                  <Text style={styles.checklistLabel}>
                    {t(`protocol:checklist.${key}`)}
                  </Text>
                  <Switch
                    value={value as boolean}
                    onValueChange={(newValue) => handleChecklistChange(key as keyof typeof formData.checklist, newValue)}
                    trackColor={{
                      false: AppleDesign.Colors.separator,
                      true: AppleDesign.Colors.systemBlue,
                    }}
                  />
                </View>
              );
            })}
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <PhotoCapture
              photos={photos}
              onPhotosChange={setPhotos}
              requiredTypes={['front', 'back', 'left', 'right', 'odometer']}
            />
          </View>

          {/* Signature */}
          <View style={styles.section}>
            <SignaturePad
              title={t('protocol:signature.customerTitle')}
              signatureDataUrl={signature}
              onSignatureCapture={setSignature}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!signature || photos.length < 5 || !formData.odometer) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!signature || photos.length < 5 || !formData.odometer}
          >
            <Text style={styles.submitButtonText}>{t('protocol:actions.submit')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  backButton: {
    marginRight: AppleDesign.Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: 2,
  },

  // Content
  scrollContent: {
    padding: AppleDesign.Spacing.lg,
  },
  section: {
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.lg,
  },
  sectionTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.lg,
  },

  // Form
  formGroup: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  label: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.sm,
  },
  input: {
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.input,
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.md,
    fontSize: 17,
    color: AppleDesign.Colors.label,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Slider
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: AppleDesign.Colors.separator,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  sliderValue: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.button,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: AppleDesign.Spacing.sm,
    alignItems: 'center',
    borderRadius: AppleDesign.BorderRadius.button - 2,
  },
  segmentActive: {
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  segmentText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },

  // Checklist
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  checklistLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  keysControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  keysButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keysValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },

  // Submit
  submitButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
    paddingVertical: AppleDesign.Spacing.lg,
    alignItems: 'center',
    marginTop: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...AppleDesign.Typography.headline,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

