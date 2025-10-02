/**
 * ⚡ Ultra-Fast Booking Flow
 * 2-step booking for registered users with biometric authentication
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';
import { AppleCard } from '../apple-card/apple-card';
import { PriceDisplay } from '../price-display';

// Hooks
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { logger } from '../../../utils/logger';

interface UltraFastBookingProps {
  vehicleId: string;
  vehicleName: string;
  vehiclePrice: number;
  vehicleImage?: string;
  onBookingComplete: (bookingId: string) => void;
  onCancel: () => void;
}

interface BookingStep {
  id: 'vehicle' | 'confirmation';
  title: string;
  description: string;
  completed: boolean;
}

export function UltraFastBooking({
  vehicleName,
  vehiclePrice,
  onBookingComplete,
  onCancel,
}: UltraFastBookingProps) {
  // const { t } = useTranslation(); // TODO: Add translations
  const haptic = useHapticFeedback();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  const [userProfile] = useState({
    firstName: 'Mária',
    lastName: 'Kováčová',
    email: 'maria.kovacova@email.com',
    phone: '+421 900 123 456',
    driverLicense: 'SK123456789',
    savedPaymentMethod: '**** 1234',
  });

  const steps: BookingStep[] = [
    {
      id: 'vehicle',
      title: 'Výber vozidla',
      description: 'Potvrďte vozidlo a dátumy',
      completed: currentStep > 0,
    },
    {
      id: 'confirmation',
      title: 'Potvrdenie',
      description: 'Biometrické overenie a platba',
      completed: false,
    },
  ];

  const calculateDays = () => {
    const diffTime = Math.abs(
      selectedDates.endDate.getTime() - selectedDates.startDate.getTime()
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = () => {
    const days = calculateDays();
    return vehiclePrice * days;
  };

  const handleStepComplete = async () => {
    haptic.medium();
    
    if (currentStep === 0) {
      // Step 1: Vehicle selection - move to confirmation
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Step 2: Biometric confirmation and payment
      await handleBiometricConfirmation();
    }
  };

  const handleBiometricConfirmation = async () => {
    setIsLoading(true);
    
    try {
      // Simulate biometric authentication
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      haptic.success();
      
      // Generate booking ID
      const _bookingId = `BR-${Date.now()}`;
      
      logger.info(`Ultra-fast booking completed: ${bookingId}`);
      
      // Show success message
      Alert.alert(
        'Rezervácia dokončená! 🎉',
        `Vaša rezervácia ${bookingId} bola úspešne vytvorená. Potvrdenie bolo odoslané na email.`,
        [
          {
            text: 'OK',
            onPress: () => onBookingComplete(bookingId),
          },
        ]
      );
      
    } catch {
      haptic.error();
      Alert.alert(
        'Chyba pri platbe',
        'Nepodarilo sa dokončiť platbu. Skúste to znovu.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date) => {
    setSelectedDates(prev => ({
      ...prev,
      [field]: date,
    }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <OptimizedFadeIn delay={0}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Ionicons name="close" size={24} color={AppleDesign.Colors.label} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rýchla rezervácia</Text>
          <View style={styles.placeholder} />
        </View>
      </OptimizedFadeIn>

      {/* Progress Steps */}
      <OptimizedSlideIn delay={100} direction="up">
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepContainer}>
              <View style={[
                styles.stepIndicator,
                index <= currentStep && styles.stepIndicatorActive,
                step.completed && styles.stepIndicatorCompleted,
              ]}>
                {step.completed ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    index <= currentStep && styles.stepNumberActive,
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <View style={styles.stepContentContainer}>
                <Text style={[
                  styles.stepTitle,
                  index <= currentStep && styles.stepTitleActive,
                ]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDescription}>
                  {step.description}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View style={[
                  styles.stepConnector,
                  index < currentStep && styles.stepConnectorActive,
                ]} />
              )}
            </View>
          ))}
        </View>
      </OptimizedSlideIn>

      {/* Step Content */}
      <View style={styles.stepContentContainer}>
        {currentStep === 0 && (
          <OptimizedFadeIn delay={200}>
            <VehicleSelectionStep
              vehicleName={vehicleName}
              vehiclePrice={vehiclePrice}
              selectedDates={selectedDates}
              onDateChange={handleDateChange}
              totalPrice={calculateTotalPrice()}
              days={calculateDays()}
            />
          </OptimizedFadeIn>
        )}

        {currentStep === 1 && (
          <OptimizedFadeIn delay={200}>
            <ConfirmationStep
              vehicleName={vehicleName}
              selectedDates={selectedDates}
              totalPrice={calculateTotalPrice()}
              days={calculateDays()}
              userProfile={userProfile}
            />
          </OptimizedFadeIn>
        )}
      </View>

      {/* Action Buttons */}
      <OptimizedSlideIn delay={300} direction="up">
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isLoading && styles.actionButtonDisabled,
            ]}
            onPress={handleStepComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.actionButtonText}>
                  {currentStep === 0 ? 'Pokračovať' : 'Potvrdiť a zaplatiť'}
                </Text>
                <Ionicons
                  name={currentStep === 0 ? "arrow-forward" : "finger-print"}
                  size={20}
                  color="white"
                />
              </>
            )}
          </TouchableOpacity>
          
          {currentStep === 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentStep(0)}
            >
              <Text style={styles.backButtonText}>Späť</Text>
            </TouchableOpacity>
          )}
        </View>
      </OptimizedSlideIn>
    </View>
  );
}

// Vehicle Selection Step Component
function VehicleSelectionStep({
  vehicleName,
  vehiclePrice,
  selectedDates,
  onDateChange: _onDateChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  totalPrice,
  days,
}: {
  vehicleName: string;
  vehiclePrice: number;
  vehicleImage?: string;
  selectedDates: { startDate: Date; endDate: Date };
  onDateChange: (field: 'startDate' | 'endDate', date: Date) => void;
  totalPrice: number;
  days: number;
}) {
  // const { t } = useTranslation(); // TODO: Add translations

  return (
    <View style={styles.stepContentContainer}>
      <AppleCard style={styles.vehicleCard}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{vehicleName}</Text>
          <PriceDisplay
            price={totalPrice}
            basePrice={vehiclePrice}
            totalPrice={totalPrice}
            size="large"
            showBreakdown={false}
          />
        </View>
      </AppleCard>

      <View style={styles.datesSection}>
        <Text style={styles.sectionTitle}>Dátumy prenájmu</Text>
        <View style={styles.datesRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              // In real app, this would open date picker and call onDateChange
              Alert.alert('Dátum vyzdvihnutia', 'Vyberte dátum vyzdvihnutia');
              // onDateChange('startDate', new Date());
            }}
          >
            <Text style={styles.dateLabel}>Vyzdvihnutie</Text>
            <Text style={styles.dateValue}>
              {selectedDates.startDate.toLocaleDateString('sk-SK')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              // In real app, this would open date picker and call onDateChange
              Alert.alert('Dátum vrátenia', 'Vyberte dátum vrátenia');
              // onDateChange('endDate', new Date());
            }}
          >
            <Text style={styles.dateLabel}>Vrátenie</Text>
            <Text style={styles.dateValue}>
              {selectedDates.endDate.toLocaleDateString('sk-SK')}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.daysInfo}>
          Celkom: {days} {days === 1 ? 'deň' : 'dní'}
        </Text>
      </View>
    </View>
  );
}

// Confirmation Step Component
function ConfirmationStep({
  vehicleName,
  selectedDates,
  totalPrice,
  days,
  userProfile,
}: {
  vehicleName: string;
  selectedDates: { startDate: Date; endDate: Date };
  totalPrice: number;
  days: number;
  userProfile: any;
}) {
  // const { t } = useTranslation(); // TODO: Add translations

  return (
    <View style={styles.stepContentContainer}>
      <AppleCard style={styles.confirmationCard}>
        <Text style={styles.confirmationTitle}>Potvrdenie rezervácie</Text>
        
        <View style={styles.confirmationDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vozidlo:</Text>
            <Text style={styles.detailValue}>{vehicleName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Obdobie:</Text>
            <Text style={styles.detailValue}>
              {selectedDates.startDate.toLocaleDateString('sk-SK')} - {selectedDates.endDate.toLocaleDateString('sk-SK')}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Počet dní:</Text>
            <Text style={styles.detailValue}>{days} dní</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Zákazník:</Text>
            <Text style={styles.detailValue}>
              {userProfile.firstName} {userProfile.lastName}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{userProfile.email}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Platba:</Text>
            <Text style={styles.detailValue}>{userProfile.savedPaymentMethod}</Text>
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Celková suma:</Text>
            <Text style={styles.totalValue}>€{totalPrice}</Text>
          </View>
        </View>
      </AppleCard>

      <View style={styles.biometricInfo}>
        <Ionicons name="finger-print" size={24} color={AppleDesign.Colors.systemBlue} />
        <Text style={styles.biometricText}>
          Pre dokončenie rezervácie použite biometrické overenie
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.systemGray5,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppleDesign.Colors.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  
  // Progress Steps
  progressContainer: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.lg,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppleDesign.Colors.systemGray4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  stepIndicatorActive: {
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  stepIndicatorCompleted: {
    backgroundColor: AppleDesign.Colors.systemGreen,
  },
  stepNumber: {
    color: AppleDesign.Colors.secondaryLabel,
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  stepTitleActive: {
    color: AppleDesign.Colors.label,
  },
  stepDescription: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  stepConnector: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemGray4,
  },
  stepConnectorActive: {
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  
  // Step Content
  stepContentContainer: {
    flex: 1,
    padding: AppleDesign.Spacing.lg,
  },
  
  // Vehicle Selection
  vehicleCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  vehicleInfo: {
    padding: AppleDesign.Spacing.lg,
  },
  vehicleName: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.sm,
  },
  
  // Dates Section
  datesSection: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  sectionTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.md,
  },
  datesRow: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
  },
  dateButton: {
    flex: 1,
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.medium,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.systemGray4,
  },
  dateLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.xs,
  },
  dateValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
  },
  daysInfo: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: AppleDesign.Spacing.sm,
    textAlign: 'center',
  },
  
  // Confirmation
  confirmationCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  confirmationTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
    textAlign: 'center',
  },
  confirmationDetails: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  detailLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  detailValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.systemGray5,
    paddingTop: AppleDesign.Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  totalValue: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },
  
  // Biometric Info
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemBlue + '10',
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
  },
  biometricText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Actions
  actionContainer: {
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.systemGray5,
    gap: AppleDesign.Spacing.md,
  },
  actionButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
    shadowColor: AppleDesign.Colors.systemBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonDisabled: {
    backgroundColor: AppleDesign.Colors.systemGray4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: AppleDesign.Spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: AppleDesign.Colors.systemBlue,
    fontSize: 16,
    fontWeight: '500',
  },
});
