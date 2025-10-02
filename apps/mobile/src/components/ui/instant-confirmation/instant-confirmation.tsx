/**
 * ⚡ Instant Confirmation Component
 * Real-time booking confirmation with instant feedback
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';
import { AppleCard } from '../apple-card/apple-card';

// Hooks
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { logger } from '../../../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

interface BookingConfirmation {
  id: string;
  vehicleName: string;
  vehicleImage?: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  days: number;
  pickupLocation: string;
  dropoffLocation: string;
  customerName: string;
  customerEmail: string;
  status: 'confirmed' | 'processing' | 'completed';
  confirmationCode: string;
  qrCode?: string;
}

interface InstantConfirmationProps {
  booking: BookingConfirmation;
  onViewDetails: () => void;
  onDownloadPDF: () => void;
  onShare: () => void;
  onClose: () => void;
}

export function InstantConfirmation({
  booking,
  onViewDetails,
  onDownloadPDF,
  onShare,
  onClose,
}: InstantConfirmationProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkmarkAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  const steps = [
    { id: 'payment', title: 'Spracovanie platby', icon: 'card' },
    { id: 'confirmation', title: 'Vytvorenie rezervácie', icon: 'checkmark-circle' },
    { id: 'notification', title: 'Odoslanie potvrdenia', icon: 'mail' },
    { id: 'completed', title: 'Rezervácia dokončená', icon: 'checkmark-done' },
  ];

  useEffect(() => {
    simulateBookingProcess();
    startPulseAnimation();
  }, []);

  const simulateBookingProcess = async () => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      setProgress((i + 1) / steps.length);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (i === steps.length - 1) {
        // Final step - show success animation
        haptic.success();
        animateCheckmark();
      } else {
        haptic.light();
      }
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateCheckmark = () => {
    Animated.spring(checkmarkAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sk-SK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <OptimizedFadeIn delay={0}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={AppleDesign.Colors.label} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Potvrdenie rezervácie</Text>
            <View style={styles.placeholder} />
          </View>
        </OptimizedFadeIn>

        {/* Success Animation */}
        <OptimizedSlideIn delay={100} direction="up">
          <View style={styles.successContainer}>
            <Animated.View
              style={[
                styles.successIcon,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.checkmarkContainer,
                  {
                    transform: [
                      { scale: checkmarkAnim },
                      { rotate: checkmarkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })},
                    ],
                  },
                ]}
              >
                <Ionicons name="checkmark" size={48} color="white" />
              </Animated.View>
            </Animated.View>
            
            <Text style={styles.successTitle}>Rezervácia potvrdená! 🎉</Text>
            <Text style={styles.successSubtitle}>
              Vaša rezervácia bola úspešne vytvorená
            </Text>
          </View>
        </OptimizedSlideIn>

        {/* Progress Steps */}
        <OptimizedSlideIn delay={200} direction="up">
          <AppleCard style={styles.progressCard}>
            <Text style={styles.progressTitle}>Stav rezervácie</Text>
            
            {steps.map((step, index) => (
              <View key={step.id} style={styles.stepContainer}>
                <View style={[
                  styles.stepIcon,
                  index <= currentStep && styles.stepIconActive,
                  index < currentStep && styles.stepIconCompleted,
                ]}>
                  {index < currentStep ? (
                    <Ionicons name="checkmark" size={16} color="white" />
                  ) : index === currentStep ? (
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <Ionicons name={step.icon as any} size={16} color="white" />
                    </Animated.View>
                  ) : (
                    <Ionicons name={step.icon as any} size={16} color={AppleDesign.Colors.systemGray4} />
                  )}
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    index <= currentStep && styles.stepTitleActive,
                  ]}>
                    {step.title}
                  </Text>
                  {index === currentStep && (
                    <Text style={styles.stepStatus}>Prebieha...</Text>
                  )}
                </View>
                
                {index < steps.length - 1 && (
                  <View style={[
                    styles.stepConnector,
                    index < currentStep && styles.stepConnectorActive,
                  ]} />
                )}
              </View>
            ))}
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progress * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress * 100)}% dokončené
              </Text>
            </View>
          </AppleCard>
        </OptimizedSlideIn>

        {/* Booking Details */}
        <OptimizedSlideIn delay={300} direction="up">
          <AppleCard style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Detaily rezervácie</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Číslo rezervácie:</Text>
              <Text style={styles.detailValue}>{booking.confirmationCode}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vozidlo:</Text>
              <Text style={styles.detailValue}>{booking.vehicleName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Obdobie:</Text>
              <Text style={styles.detailValue}>
                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Čas vyzdvihnutia:</Text>
              <Text style={styles.detailValue}>
                {formatTime(booking.startDate)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Miesto vyzdvihnutia:</Text>
              <Text style={styles.detailValue}>{booking.pickupLocation}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Miesto vrátenia:</Text>
              <Text style={styles.detailValue}>{booking.dropoffLocation}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Zákazník:</Text>
              <Text style={styles.detailValue}>{booking.customerName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{booking.customerEmail}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Celková suma:</Text>
              <Text style={styles.totalValue}>€{booking.totalPrice}</Text>
            </View>
          </AppleCard>
        </OptimizedSlideIn>

        {/* Next Steps */}
        <OptimizedSlideIn delay={400} direction="up">
          <AppleCard style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>Ďalšie kroky</Text>
            
            <View style={styles.nextStepItem}>
              <Ionicons name="mail" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.nextStepText}>
                Potvrdenie bolo odoslané na {booking.customerEmail}
              </Text>
            </View>
            
            <View style={styles.nextStepItem}>
              <Ionicons name="calendar" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.nextStepText}>
                Rezervácia bola pridaná do vášho kalendára
              </Text>
            </View>
            
            <View style={styles.nextStepItem}>
              <Ionicons name="notifications" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.nextStepText}>
                Pripomienka bude odoslaná 24h pred vyzdvihnutím
              </Text>
            </View>
          </AppleCard>
        </OptimizedSlideIn>
      </ScrollView>

      {/* Action Buttons */}
      <OptimizedSlideIn delay={500} direction="up">
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onViewDetails}
          >
            <Ionicons name="eye" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Zobraziť detaily</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDownloadPDF}
            >
              <Ionicons name="download" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.secondaryButtonText}>PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onShare}
            >
              <Ionicons name="share" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.secondaryButtonText}>Zdieľať</Text>
            </TouchableOpacity>
          </View>
        </View>
      </OptimizedSlideIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
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
  closeButton: {
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
  
  // Success Animation
  successContainer: {
    alignItems: 'center',
    padding: AppleDesign.Spacing.xl,
    backgroundColor: AppleDesign.Colors.systemBackground,
    margin: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.large,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppleDesign.Colors.systemGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.lg,
    shadowColor: AppleDesign.Colors.systemGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkmarkContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  successSubtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  
  // Progress Card
  progressCard: {
    margin: AppleDesign.Spacing.lg,
    marginTop: 0,
  },
  progressTitle: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.lg,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppleDesign.Colors.systemGray4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  stepIconActive: {
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  stepIconCompleted: {
    backgroundColor: AppleDesign.Colors.systemGreen,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },
  stepTitleActive: {
    color: AppleDesign.Colors.label,
  },
  stepStatus: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.systemBlue,
    marginTop: AppleDesign.Spacing.xs,
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
  progressBarContainer: {
    marginTop: AppleDesign.Spacing.lg,
  },
  progressBar: {
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
  progressText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    marginTop: AppleDesign.Spacing.sm,
  },
  
  // Details Card
  detailsCard: {
    margin: AppleDesign.Spacing.lg,
    marginTop: 0,
  },
  detailsTitle: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
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
    flex: 1,
  },
  detailValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.systemGray5,
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
  
  // Next Steps Card
  nextStepsCard: {
    margin: AppleDesign.Spacing.lg,
    marginTop: 0,
  },
  nextStepsTitle: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
    gap: AppleDesign.Spacing.sm,
  },
  nextStepText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    flex: 1,
  },
  
  // Actions
  actionContainer: {
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.systemGray5,
    gap: AppleDesign.Spacing.md,
  },
  primaryButton: {
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
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.systemBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
  },
  secondaryButtonText: {
    color: AppleDesign.Colors.systemBlue,
    fontSize: 14,
    fontWeight: '500',
  },
});
