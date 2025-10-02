/**
 * 📱 SMS Verification Component
 * Two-factor authentication via SMS code
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';

// Hooks
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { logger } from '../../../utils/logger';

interface SMSVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: (code: string) => void;
  onVerificationError: (error: string) => void;
  onCancel: () => void;
  onResendCode: () => void;
  title?: string;
  subtitle?: string;
  codeLength?: number;
}

export function SMSVerification({
  phoneNumber,
  onVerificationSuccess,
  onVerificationError,
  onCancel,
  onResendCode,
  title = 'SMS overenie',
  subtitle = 'Zadajte 6-miestny kód z SMS',
  codeLength = 6,
}: SMSVerificationProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  
  const [code, setCode] = useState<string[]>(new Array(codeLength).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Auto-verify when code is complete
    if (code.every(digit => digit !== '') && code.join('').length === codeLength) {
      handleVerifyCode();
    }
  }, [code]);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    
    if (value.length > 1) {
      // Handle paste operation
      const pastedCode = value.slice(0, codeLength);
      for (let i = 0; i < codeLength; i++) {
        newCode[i] = pastedCode[i] || '';
      }
      setCode(newCode);
      
      // Focus last filled input or next empty input
      const nextIndex = Math.min(pastedCode.length, codeLength - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single digit input
      newCode[index] = value;
      setCode(newCode);
      
      // Move to next input
      if (value && index < codeLength - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    
    haptic.light();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const enteredCode = code.join('');
    
    if (enteredCode.length !== codeLength) {
      onVerificationError('Prosím zadajte kompletný kód');
      return;
    }

    setIsVerifying(true);
    haptic.medium();

    try {
      // Simulate SMS verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock verification logic
      const isValidCode = enteredCode === '123456' || enteredCode.match(/^\d{6}$/);
      
      if (isValidCode) {
        haptic.success();
        logger.info(`SMS verification successful for ${phoneNumber}`);
        onVerificationSuccess(enteredCode);
      } else {
        haptic.error();
        onVerificationError('Neplatný kód. Skúste to znovu.');
        clearCode();
      }
    } catch (error) {
      haptic.error();
      logger.error('SMS verification error:', error);
      onVerificationError('Chyba pri overovaní kódu. Skúste to znovu.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    haptic.light();

    try {
      // Simulate resending SMS
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onResendCode();
      
      // Reset timer
      setResendTimer(60);
      setCanResend(false);
      clearCode();
      
      haptic.success();
      logger.info(`SMS code resent to ${phoneNumber}`);
      
      Alert.alert(
        'Kód odoslaný',
        `Nový overovací kód bol odoslaný na číslo ${phoneNumber}`
      );
    } catch (error) {
      haptic.error();
      logger.error('SMS resend error:', error);
      Alert.alert('Chyba', 'Nepodarilo sa odoslať nový kód. Skúste to znovu.');
    } finally {
      setIsResending(false);
    }
  };

  const clearCode = () => {
    setCode(new Array(codeLength).fill(''));
    inputRefs.current[0]?.focus();
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    if (phone.length >= 4) {
      return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
    }
    return phone;
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
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>
      </OptimizedFadeIn>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <OptimizedSlideIn delay={100} direction="up">
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble" size={48} color={AppleDesign.Colors.systemBlue} />
          </View>
        </OptimizedSlideIn>

        {/* Instructions */}
        <OptimizedFadeIn delay={200}>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>{subtitle}</Text>
            <Text style={styles.instructionsText}>
              Kód bol odoslaný na číslo {formatPhoneNumber(phoneNumber)}
            </Text>
          </View>
        </OptimizedFadeIn>

        {/* Code Input */}
        <OptimizedSlideIn delay={300} direction="up">
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  isVerifying && styles.codeInputDisabled,
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={codeLength}
                selectTextOnFocus
                editable={!isVerifying}
                autoFocus={index === 0}
              />
            ))}
          </View>
        </OptimizedSlideIn>

        {/* Verification Status */}
        {isVerifying && (
          <OptimizedFadeIn delay={400}>
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.verifyingText}>Overujem kód...</Text>
            </View>
          </OptimizedFadeIn>
        )}

        {/* Resend Code */}
        <OptimizedSlideIn delay={500} direction="up">
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={isResending}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={AppleDesign.Colors.systemBlue} />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color={AppleDesign.Colors.systemBlue} />
                    <Text style={styles.resendButtonText}>Odoslať nový kód</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimerText}>
                Nový kód môžete požiadať za {resendTimer}s
              </Text>
            )}
          </View>
        </OptimizedSlideIn>

        {/* Manual Verify Button */}
        <OptimizedSlideIn delay={600} direction="up">
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (code.join('').length !== codeLength || isVerifying) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={code.join('').length !== codeLength || isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.verifyButtonText}>Overiť kód</Text>
              </>
            )}
          </TouchableOpacity>
        </OptimizedSlideIn>

        {/* Help */}
        <OptimizedFadeIn delay={700}>
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Nedostali ste SMS? Skontrolujte si priečinok spam alebo skúste znovu.
            </Text>
            <TouchableOpacity style={styles.helpButton}>
              <Ionicons name="help-circle" size={16} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.helpButtonText}>Potrebujem pomoc</Text>
            </TouchableOpacity>
          </View>
        </OptimizedFadeIn>
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
  
  // Content
  content: {
    flex: 1,
    padding: AppleDesign.Spacing.lg,
    alignItems: 'center',
  },
  
  // Icon
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppleDesign.Colors.systemBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xl,
  },
  
  // Instructions
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xl,
  },
  instructionsTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  instructionsText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  
  // Code Input
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.xl,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: AppleDesign.Colors.systemGray4,
    borderRadius: AppleDesign.BorderRadius.medium,
    backgroundColor: AppleDesign.Colors.systemBackground,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: AppleDesign.Colors.label,
  },
  codeInputFilled: {
    borderColor: AppleDesign.Colors.systemBlue,
    backgroundColor: AppleDesign.Colors.systemBlue + '10',
  },
  codeInputDisabled: {
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderColor: AppleDesign.Colors.systemGray4,
  },
  
  // Verification Status
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
    marginBottom: AppleDesign.Spacing.lg,
  },
  verifyingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  
  // Resend
  resendContainer: {
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xl,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.sm,
    paddingHorizontal: AppleDesign.Spacing.md,
  },
  resendButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  resendTimerText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Verify Button
  verifyButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.lg,
    paddingHorizontal: AppleDesign.Spacing.xl,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
    marginBottom: AppleDesign.Spacing.xl,
    minWidth: 200,
    shadowColor: AppleDesign.Colors.systemBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonDisabled: {
    backgroundColor: AppleDesign.Colors.systemGray4,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Help
  helpContainer: {
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  helpText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.xs,
  },
  helpButtonText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
});
