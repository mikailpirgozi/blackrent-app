/**
 * Booking Flow Screen
 * Multi-step booking process for vehicle rental
 * Enhanced with Light/Dark mode support
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppleDesign } from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { useTheme } from '../../contexts/ThemeContext';
import { useVehicleById } from '../../hooks/api/use-vehicles';
import type { BookingData, BookingStep } from '../../types/booking';
import { DateSelectionStep } from '../../components/booking/DateSelectionStep';
import { InsuranceSelectionStep } from '../../components/booking/InsuranceSelectionStep';
import { AddOnsSelectionStep } from '../../components/booking/AddOnsSelectionStep';

// Import booking step components (will create next)
// import { CustomerInfoStep } from '../../components/booking/CustomerInfoStep';
// import { PaymentStep } from '../../components/booking/PaymentStep';

const STEPS: BookingStep[] = ['dates', 'insurance', 'addons', 'customer', 'payment'];

export default function BookingScreen() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { t } = useTranslation(['booking', 'common']);
  const { theme, isDark } = useTheme();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    vehicleId,
    addOns: [],
  });

  const { data: vehicle, isLoading, error } = useVehicleById(vehicleId || '');

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => createDynamicStyles(theme, isDark), [theme, isDark]);

  const currentStep = STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [isLastStep]);

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      router.back();
    } else {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [isFirstStep, router]);

  const handleUpdateBookingData = useCallback((data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  }, []);

  const progressPercentage = useMemo(() => {
    return ((currentStepIndex + 1) / STEPS.length) * 100;
  }, [currentStepIndex]);

  const getStepTitle = useCallback((step: BookingStep): string => {
    switch (step) {
      case 'dates':
        return t('booking:steps.dates.title');
      case 'insurance':
        return t('booking:steps.insurance.title');
      case 'addons':
        return t('booking:steps.addons.title');
      case 'customer':
        return t('booking:steps.customer.title');
      case 'payment':
        return t('booking:steps.payment.title');
      default:
        return '';
    }
  }, [t]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
          <Text style={[styles.loadingText, dynamicStyles.text]}>{t('common:loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !vehicle) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.semantic.error} />
          <Text style={[styles.errorText, dynamicStyles.text]}>
            {t('booking:errors.vehicleNotFound')}
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.brand.primary }]} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>{t('common:buttons.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={isDark ? theme.colors.dark.label : theme.colors.label} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, dynamicStyles.text]}>
            {getStepTitle(currentStep)}
          </Text>
          <Text style={[styles.headerSubtitle, dynamicStyles.secondaryText]}>
            {t('booking:stepProgress', { current: currentStepIndex + 1, total: STEPS.length })}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, dynamicStyles.progressBackground]}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: theme.brand.primary }]} />
        </View>
      </View>

      {/* Vehicle Info Card */}
      <View style={[styles.vehicleInfoCard, dynamicStyles.card]}>
        <View style={styles.vehicleInfoLeft}>
          <Text style={[styles.vehicleName, dynamicStyles.text]}>
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text style={[styles.vehicleCategory, dynamicStyles.secondaryText]}>
            {vehicle.category}
          </Text>
        </View>
        <View style={styles.vehicleInfoRight}>
          <Text style={[styles.vehiclePrice, { color: theme.brand.primary }]}>
            {vehicle.pricing[0]?.pricePerDay || 0}€
          </Text>
          <Text style={[styles.vehiclePriceLabel, dynamicStyles.secondaryText]}>
            / {t('common:perDay')}
          </Text>
        </View>
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 'dates' && (
          <DateSelectionStep
            vehicleId={vehicleId || ''}
            initialDates={bookingData.dates}
            onDatesChange={(dates) => handleUpdateBookingData({ dates: dates || undefined })}
            unavailableDates={[]} // TODO: Fetch from API
          />
        )}

        {currentStep === 'insurance' && bookingData.dates && (
          <InsuranceSelectionStep
            dates={bookingData.dates}
            initialInsurance={bookingData.insurance}
            onInsuranceChange={(insurance) => handleUpdateBookingData({ insurance: insurance || undefined })}
          />
        )}

        {currentStep === 'addons' && bookingData.dates && (
          <AddOnsSelectionStep
            dates={bookingData.dates}
            initialAddOns={bookingData.addOns || []}
            onAddOnsChange={(addOns) => handleUpdateBookingData({ addOns })}
          />
        )}

        {currentStep === 'customer' && (
          <View style={styles.stepPlaceholder}>
            <Ionicons name="person-outline" size={64} color={AppleDesign.Colors.tertiaryLabel} />
            <Text style={styles.stepPlaceholderText}>
              {getStepTitle(currentStep)} - Coming soon
            </Text>
          </View>
        )}

        {currentStep === 'payment' && (
          <View style={styles.stepPlaceholder}>
            <Ionicons name="card-outline" size={64} color={AppleDesign.Colors.tertiaryLabel} />
            <Text style={styles.stepPlaceholderText}>
              {getStepTitle(currentStep)} - Coming soon
            </Text>
          </View>
        )}

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Current Step: {currentStep}</Text>
            <Text style={styles.debugText}>Step {currentStepIndex + 1} of {STEPS.length}</Text>
            <Text style={styles.debugText}>Vehicle: {vehicle.brand} {vehicle.model}</Text>
            {bookingData.dates && (
              <Text style={styles.debugText}>
                Dates: {bookingData.dates.numberOfDays} days
              </Text>
            )}
            {bookingData.insurance && (
              <Text style={styles.debugText}>
                Insurance: {bookingData.insurance.name}
              </Text>
            )}
            {bookingData.addOns && bookingData.addOns.length > 0 && (
              <Text style={styles.debugText}>
                Add-ons: {bookingData.addOns.length} selected
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.footerButtonSecondary]}
          onPress={handleBack}
        >
          <Text style={styles.footerButtonTextSecondary}>
            {isFirstStep ? t('common:buttons.cancel') : t('common:buttons.back')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, styles.footerButtonPrimary]}
          onPress={handleNext}
        >
          <Text style={styles.footerButtonTextPrimary}>
            {isLastStep ? t('booking:confirmBooking') : t('common:buttons.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  loadingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: AppleDesign.Spacing.xl,
    gap: AppleDesign.Spacing.lg,
  },
  errorText: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    textAlign: 'center',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  
  // Progress Bar
  progressBarContainer: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: AppleDesign.Colors.systemGray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: 2,
  },
  
  // Vehicle Info
  vehicleInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.md,
    padding: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    ...AppleDesign.Shadows.small,
  },
  vehicleInfoLeft: {
    flex: 1,
  },
  vehicleName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  vehicleCategory: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: 2,
  },
  vehicleInfoRight: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },
  vehiclePriceLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.tertiaryLabel,
  },
  
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: AppleDesign.Spacing.lg,
  },
  
  // Step Placeholder
  stepPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: AppleDesign.Spacing.xxl * 2,
    gap: AppleDesign.Spacing.md,
  },
  stepPlaceholderText: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepPlaceholderSubtext: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  
  // Debug
  debugContainer: {
    marginTop: AppleDesign.Spacing.xl,
    padding: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemYellowLight || 'rgba(255, 204, 0, 0.1)',
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.xs,
  },
  debugText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.label,
    fontFamily: 'monospace',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
    padding: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  footerButton: {
    flex: 1,
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonPrimary: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    ...AppleDesign.Shadows.medium,
  },
  footerButtonSecondary: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.separator,
  },
  footerButtonTextPrimary: {
    ...AppleDesign.Typography.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerButtonTextSecondary: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  backButton: {
    marginTop: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    paddingHorizontal: AppleDesign.Spacing.xl,
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
  },
  backButtonText: {
    ...AppleDesign.Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

/**
 * Create dynamic styles based on current theme
 */
function createDynamicStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.dynamicColors.background,
    },
    text: {
      color: theme.dynamicColors.text,
    },
    secondaryText: {
      color: theme.dynamicColors.secondaryText,
    },
    header: {
      backgroundColor: isDark 
        ? theme.colors.dark.systemBackground 
        : theme.colors.systemBackground,
      borderBottomColor: isDark 
        ? theme.colors.dark.separator 
        : theme.colors.separator,
    },
    card: {
      backgroundColor: isDark 
        ? theme.colors.dark.secondarySystemGroupedBackground 
        : theme.colors.systemBackground,
    },
    progressBackground: {
      backgroundColor: isDark 
        ? theme.colors.dark.tertiarySystemFill 
        : theme.colors.tertiarySystemFill,
    },
  });
}

