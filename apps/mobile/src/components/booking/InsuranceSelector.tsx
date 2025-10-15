/**
 * Insurance Selector Component
 * Allows users to select insurance coverage for vehicle rental
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppleDesign } from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import type { Insurance } from '../../types/booking';

interface InsuranceSelectorProps {
  onInsuranceSelect: (insurance: Insurance | null) => void;
  selectedInsurance?: Insurance;
  numberOfDays: number;
}

// Mock insurance options - will be fetched from API
const INSURANCE_OPTIONS: Insurance[] = [
  {
    id: 'basic',
    name: 'Základné poistenie',
    description: 'Základné krytie škôd s vyššou spoluúčasťou',
    price: 10,
    coverageAmount: 50000,
    deductible: 1000,
  },
  {
    id: 'standard',
    name: 'Štandardné poistenie',
    description: 'Rozšírené krytie s nižšou spoluúčasťou',
    price: 20,
    coverageAmount: 100000,
    deductible: 500,
  },
  {
    id: 'premium',
    name: 'Premium poistenie',
    description: 'Plné krytie bez spoluúčasti',
    price: 35,
    coverageAmount: 200000,
    deductible: 0,
  },
];

export const InsuranceSelector: React.FC<InsuranceSelectorProps> = ({
  onInsuranceSelect,
  selectedInsurance,
  numberOfDays,
}) => {
  const { t } = useTranslation(['booking', 'common']);
  const [selected, setSelected] = useState<Insurance | null>(selectedInsurance || null);

  const handleSelect = useCallback((insurance: Insurance) => {
    const newSelection = selected?.id === insurance.id ? null : insurance;
    setSelected(newSelection);
    onInsuranceSelect(newSelection);
  }, [selected, onInsuranceSelect]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('booking:steps.insurance.selectInsurance')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('booking:steps.insurance.subtitle')}
        </Text>
      </View>

      {/* Insurance Options */}
      <View style={styles.optionsContainer}>
        {INSURANCE_OPTIONS.map((insurance) => {
          const isSelected = selected?.id === insurance.id;
          const totalPrice = insurance.price * numberOfDays;

          return (
            <TouchableOpacity
              key={insurance.id}
              style={[
                styles.insuranceCard,
                isSelected && styles.insuranceCardSelected,
              ]}
              onPress={() => handleSelect(insurance)}
              activeOpacity={0.7}
            >
              {/* Header */}
              <View style={styles.insuranceHeader}>
                <View style={styles.insuranceHeaderLeft}>
                  <Text style={[styles.insuranceName, isSelected && styles.insuranceNameSelected]}>
                    {insurance.name}
                  </Text>
                  {insurance.id === 'standard' && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>
                        {t('booking:steps.insurance.recommended')}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={[
                  styles.checkCircle,
                  isSelected && styles.checkCircleSelected,
                ]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </View>
              </View>

              {/* Description */}
              <Text style={styles.insuranceDescription}>{insurance.description}</Text>

              {/* Details */}
              <View style={styles.insuranceDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="shield-checkmark" size={16} color={AppleDesign.Colors.systemBlue} />
                  <Text style={styles.detailText}>
                    {t('booking:steps.insurance.coverage')}: {insurance.coverageAmount.toLocaleString()}€
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="wallet" size={16} color={AppleDesign.Colors.systemOrange} />
                  <Text style={styles.detailText}>
                    {t('booking:steps.insurance.deductible')}: {insurance.deductible === 0 ? t('booking:steps.insurance.noDeductible') : `${insurance.deductible}€`}
                  </Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.pricePerDay}>
                  {insurance.price}€ / {t('common:perDay')}
                </Text>
                <Text style={styles.totalPrice}>
                  {t('booking:priceBreakdown.total')}: {totalPrice}€
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Skip Option */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          setSelected(null);
          onInsuranceSelect(null);
        }}
      >
        <Text style={styles.skipButtonText}>
          {t('booking:steps.insurance.skipInsurance')}
        </Text>
        <Text style={styles.skipButtonSubtext}>
          {t('booking:steps.insurance.skipInsuranceNote')}
        </Text>
      </TouchableOpacity>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color={AppleDesign.Colors.systemBlue} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>{t('booking:steps.insurance.infoTitle')}</Text>
          <Text style={styles.infoText}>{t('booking:steps.insurance.infoText')}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: AppleDesign.Spacing.xl,
  },

  // Header
  header: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  headerTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.xs,
  },
  headerSubtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },

  // Options
  optionsContainer: {
    gap: AppleDesign.Spacing.md,
  },

  // Insurance Card
  insuranceCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...AppleDesign.Shadows.small,
  },
  insuranceCardSelected: {
    borderColor: AppleDesign.Colors.systemBlue,
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.05)',
  },

  // Insurance Header
  insuranceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.sm,
  },
  insuranceHeaderLeft: {
    flex: 1,
  },
  insuranceName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: 4,
  },
  insuranceNameSelected: {
    color: AppleDesign.Colors.systemBlue,
  },
  recommendedBadge: {
    backgroundColor: AppleDesign.Colors.systemGreen,
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: 4,
    borderRadius: AppleDesign.BorderRadius.small,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    ...AppleDesign.Typography.caption2,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Check Circle
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AppleDesign.Colors.systemGray4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderColor: AppleDesign.Colors.systemBlue,
  },

  // Description
  insuranceDescription: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.md,
  },

  // Details
  insuranceDetails: {
    gap: AppleDesign.Spacing.sm,
    marginBottom: AppleDesign.Spacing.md,
    paddingTop: AppleDesign.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  detailText: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.label,
  },

  // Price
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: AppleDesign.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
  },
  pricePerDay: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  totalPrice: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },

  // Skip Button
  skipButton: {
    marginTop: AppleDesign.Spacing.lg,
    padding: AppleDesign.Spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  skipButtonSubtext: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.tertiaryLabel,
    marginTop: 4,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
    marginTop: AppleDesign.Spacing.lg,
    padding: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.1)',
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
});

