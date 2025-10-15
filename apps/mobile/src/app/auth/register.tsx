/**
 * Register Screen
 * Customer registration with validation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import AppleDesign from '../../styles/apple-design-system';
import { ApiError } from '../../config/api';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useTranslation(['auth', 'common']);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate form
   */
  const validateForm = useCallback(() => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert(t('common:errors.error'), t('auth:errors.fillAllFields'));
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common:errors.error'), t('auth:errors.invalidEmail'));
      return false;
    }

    // Password validation
    if (password.length < 8) {
      Alert.alert(t('common:errors.error'), t('auth:errors.passwordTooShort'));
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert(t('common:errors.error'), t('auth:errors.passwordNoUppercase'));
      return false;
    }

    if (!/[0-9]/.test(password)) {
      Alert.alert(t('common:errors.error'), t('auth:errors.passwordNoNumber'));
      return false;
    }

    // Password confirmation
    if (password !== confirmPassword) {
      Alert.alert(t('common:errors.error'), t('auth:errors.passwordsDoNotMatch'));
      return false;
    }

    return true;
  }, [firstName, lastName, email, password, confirmPassword, t]);

  /**
   * Handle registration
   */
  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await register(
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
        phone.trim() || undefined
      );

      // Navigation handled by root layout based on auth state
      router.replace('/');
    } catch (error) {
      const apiError = error as ApiError;

      let errorMessage = t('auth:errors.registrationFailed');

      if (apiError.code === 'EMAIL_EXISTS') {
        errorMessage = t('auth:errors.emailExists');
      } else if (apiError.code === 'WEAK_PASSWORD') {
        errorMessage = t('auth:errors.weakPassword');
      } else if (apiError.code === 'NETWORK_ERROR') {
        errorMessage = t('common:errors.networkError');
      }

      Alert.alert(t('common:errors.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, register, email, password, firstName, lastName, phone, router, t]);

  /**
   * Navigate to login
   */
  const handleLogin = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth:register.title')}</Text>
            <Text style={styles.subtitle}>{t('auth:register.subtitle')}</Text>
          </View>

          {/* First Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth:fields.firstName')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color={AppleDesign.Colors.tertiaryLabel}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth:placeholders.firstName')}
                placeholderTextColor={AppleDesign.Colors.placeholderText}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                textContentType="givenName"
                editable={!isLoading}
                testID="first-name-input"
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth:fields.lastName')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color={AppleDesign.Colors.tertiaryLabel}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth:placeholders.lastName')}
                placeholderTextColor={AppleDesign.Colors.placeholderText}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                textContentType="familyName"
                editable={!isLoading}
                testID="last-name-input"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth:fields.email')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={AppleDesign.Colors.tertiaryLabel}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth:placeholders.email')}
                placeholderTextColor={AppleDesign.Colors.placeholderText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isLoading}
                testID="email-input"
              />
            </View>
          </View>

          {/* Phone (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('auth:fields.phone')} <Text style={styles.optional}>({t('common:labels.optional')})</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="call-outline"
                size={20}
                color={AppleDesign.Colors.tertiaryLabel}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth:placeholders.phone')}
                placeholderTextColor={AppleDesign.Colors.placeholderText}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                editable={!isLoading}
                testID="phone-input"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth:fields.password')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={AppleDesign.Colors.tertiaryLabel}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth:placeholders.password')}
                placeholderTextColor={AppleDesign.Colors.placeholderText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                editable={!isLoading}
                testID="password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                testID="toggle-password"
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={AppleDesign.Colors.tertiaryLabel}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>{t('auth:hints.passwordRequirements')}</Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth:fields.confirmPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={AppleDesign.Colors.tertiaryLabel}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth:placeholders.confirmPassword')}
                placeholderTextColor={AppleDesign.Colors.placeholderText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                textContentType="newPassword"
                editable={!isLoading}
                testID="confirm-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                testID="toggle-confirm-password"
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={AppleDesign.Colors.tertiaryLabel}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            testID="register-button"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerButtonText}>{t('auth:register.registerButton')}</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth:register.hasAccount')}</Text>
            <TouchableOpacity onPress={handleLogin} disabled={isLoading} testID="login-link">
              <Text style={styles.loginLink}>{t('auth:register.loginLink')}</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>{t('auth:register.termsAcceptance')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: AppleDesign.Spacing.xl,
    paddingTop: AppleDesign.Spacing.xxl,
  },

  // Header
  header: {
    marginBottom: AppleDesign.Spacing.xl,
  },
  title: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.xs,
  },
  subtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },

  // Input
  inputContainer: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  label: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  optional: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.tertiaryLabel,
    fontWeight: '400',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.input,
    paddingHorizontal: AppleDesign.Spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: AppleDesign.Spacing.sm,
  },
  input: {
    flex: 1,
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  eyeButton: {
    padding: AppleDesign.Spacing.xs,
  },
  hint: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: AppleDesign.Spacing.xs,
  },

  // Register Button
  registerButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: AppleDesign.Spacing.md,
    ...AppleDesign.Shadows.small,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    fontWeight: '700',
  },

  // Login Link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.xs,
    marginTop: AppleDesign.Spacing.xl,
  },
  loginText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  loginLink: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },

  // Terms
  terms: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.tertiaryLabel,
    textAlign: 'center',
    marginTop: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.xl,
  },
});


