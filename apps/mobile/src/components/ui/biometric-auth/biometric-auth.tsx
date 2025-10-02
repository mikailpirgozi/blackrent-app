/**
 * 🔐 Biometric Authentication Component
 * Fingerprint and Face ID authentication for secure payments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';

interface BiometricAuthProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
  showCancel?: boolean;
}

interface BiometricType {
  type: 'fingerprint' | 'facial' | 'iris' | 'voice';
  available: boolean;
  enrolled: boolean;
}

export function BiometricAuth({
  onSuccess,
  onError,
  onCancel,
  title = 'Biometrické overenie',
  subtitle = 'Použite otlačok prsta alebo Face ID pre dokončenie platby',
  showCancel = true,
}: BiometricAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<BiometricType[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    checkBiometricAvailability();
    startPulseAnimation();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const types: BiometricType[] = [
        {
          type: 'fingerprint',
          available: supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
          enrolled: isEnrolled,
        },
        {
          type: 'facial',
          available: supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
          enrolled: isEnrolled,
        },
        {
          type: 'iris',
          available: supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS),
          enrolled: isEnrolled,
        },
        {
          type: 'voice',
          available: false, // VOICE not available in expo-local-authentication
          enrolled: false,
        },
      ];

      setBiometricTypes(types);
      setIsAvailable(hasHardware && isEnrolled);
    } catch {
      //       onError('Nepodarilo sa skontrolovať dostupnosť biometrického overenia');
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

  const handleBiometricAuth = async () => {
    if (!isAvailable) {
      onError('Biometrické overenie nie je dostupné na tomto zariadení');
      return;
    }

    setIsLoading(true);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: title,
        cancelLabel: 'Zrušiť',
        fallbackLabel: 'Použiť heslo',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onSuccess();
      } else if (result.error === 'user_cancel') {
        onCancel();
      } else {
        onError('Biometrické overenie zlyhalo. Skúste to znovu.');
      }
    } catch {
      //       onError('Nepodarilo sa dokončiť biometrické overenie');
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricIcon = () => {
    const availableType = biometricTypes.find(type => type.available && type.enrolled);
    
    switch (availableType?.type) {
      case 'facial':
        return 'scan';
      case 'fingerprint':
        return 'finger-print';
      case 'iris':
        return 'eye';
      case 'voice':
        return 'mic';
      default:
        return 'shield-checkmark';
    }
  };

  const getBiometricText = () => {
    const availableType = biometricTypes.find(type => type.available && type.enrolled);
    
    switch (availableType?.type) {
      case 'facial':
        return 'Použite Face ID';
      case 'fingerprint':
        return 'Použite otlačok prsta';
      case 'iris':
        return 'Použite rozoznávanie oka';
      case 'voice':
        return 'Použite rozoznávanie hlasu';
      default:
        return 'Biometrické overenie';
    }
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <OptimizedFadeIn delay={0}>
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color={AppleDesign.Colors.systemOrange} />
            <Text style={styles.errorTitle}>Biometrické overenie nie je dostupné</Text>
            <Text style={styles.errorText}>
              Na tomto zariadení nie je nastavené biometrické overenie alebo nie je podporované.
            </Text>
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() => {
                Alert.alert(
                  'Alternatívne overenie',
                  'Môžete použiť PIN kód alebo heslo pre dokončenie platby.',
                  [
                    { text: 'Zrušiť', onPress: onCancel },
                    { text: 'Pokračovať', onPress: onSuccess },
                  ]
                );
              }}
            >
              <Text style={styles.fallbackButtonText}>Použiť alternatívne overenie</Text>
            </TouchableOpacity>
          </View>
        </OptimizedFadeIn>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OptimizedFadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </OptimizedFadeIn>

      <OptimizedSlideIn delay={200} direction="up">
        <View style={styles.biometricContainer}>
          <Animated.View
            style={[
              styles.biometricIconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Ionicons
              name={getBiometricIcon()}
              size={64}
              color={AppleDesign.Colors.systemBlue}
            />
          </Animated.View>
          
          <Text style={styles.biometricText}>{getBiometricText()}</Text>
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.loadingText}>Overujem...</Text>
            </View>
          )}
        </View>
      </OptimizedSlideIn>

      <OptimizedSlideIn delay={400} direction="up">
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.authButton,
              isLoading && styles.authButtonDisabled,
            ]}
            onPress={handleBiometricAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name={getBiometricIcon()} size={20} color="white" />
                <Text style={styles.authButtonText}>
                  {isLoading ? 'Overujem...' : 'Overiť biometrické údaje'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {showCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Zrušiť</Text>
            </TouchableOpacity>
          )}
        </View>
      </OptimizedSlideIn>

      <OptimizedFadeIn delay={600}>
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={16} color={AppleDesign.Colors.systemGreen} />
          <Text style={styles.securityText}>
            Vaše biometrické údaje sú bezpečne uložené a nikdy sa neopúšťajú zariadenie
          </Text>
        </View>
      </OptimizedFadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
    padding: AppleDesign.Spacing.lg,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xxl,
  },
  title: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  subtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Biometric Container
  biometricContainer: {
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xxl,
  },
  biometricIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppleDesign.Colors.systemBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.lg,
  },
  biometricText: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.sm,
  },
  loadingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Actions
  actionContainer: {
    gap: AppleDesign.Spacing.md,
  },
  authButton: {
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
  authButtonDisabled: {
    backgroundColor: AppleDesign.Colors.systemGray4,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: AppleDesign.Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: AppleDesign.Colors.systemBlue,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Security Info
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: AppleDesign.Spacing.xl,
    paddingHorizontal: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.sm,
  },
  securityText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    flex: 1,
  },
  
  // Error State
  errorContainer: {
    alignItems: 'center',
    padding: AppleDesign.Spacing.xl,
  },
  errorTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.sm,
  },
  errorText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: AppleDesign.Spacing.xl,
  },
  fallbackButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    paddingHorizontal: AppleDesign.Spacing.xl,
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  fallbackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
