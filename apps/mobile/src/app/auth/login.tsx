/**
 * Login Screen
 * Email/password login with OAuth options
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

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const { t } = useTranslation(['auth', 'common']);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle email/password login
   */
  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert(t('common:errors.error'), t('auth:errors.fillAllFields'));
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      
      // Navigation handled by root layout based on auth state
      router.replace('/');
    } catch (error) {
      const apiError = error as ApiError;
      
      let errorMessage = t('auth:errors.loginFailed');
      
      if (apiError.code === 'INVALID_CREDENTIALS') {
        errorMessage = t('auth:errors.invalidCredentials');
      } else if (apiError.code === 'NETWORK_ERROR') {
        errorMessage = t('common:errors.networkError');
      }

      Alert.alert(t('common:errors.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, router, t]);

  /**
   * Handle Google login
   */
  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      // TODO: Implement Google Sign-In SDK
      // const { idToken } = await GoogleSignin.signIn();
      // await loginWithGoogle(idToken);
      
      Alert.alert(t('common:info'), 'Google Sign-In coming soon!');
    } catch (error) {
      Alert.alert(t('common:errors.error'), t('auth:errors.oauthFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, t]);

  /**
   * Handle Apple login
   */
  const handleAppleLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      // TODO: Implement Apple Sign-In SDK
      // const { identityToken } = await AppleAuthentication.signInAsync();
      // await loginWithApple(identityToken);
      
      Alert.alert(t('common:info'), 'Apple Sign-In coming soon!');
    } catch (error) {
      Alert.alert(t('common:errors.error'), t('auth:errors.oauthFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [loginWithApple, t]);

  /**
   * Navigate to register
   */
  const handleRegister = useCallback(() => {
    router.push('/auth/register');
  }, [router]);

  /**
   * Navigate to forgot password
   */
  const handleForgotPassword = useCallback(() => {
    router.push('/auth/forgot-password');
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
            <Text style={styles.title}>{t('auth:login.title')}</Text>
            <Text style={styles.subtitle}>{t('auth:login.subtitle')}</Text>
          </View>

          {/* Email Input */}
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

          {/* Password Input */}
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
                textContentType="password"
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
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
            disabled={isLoading}
            testID="forgot-password-button"
          >
            <Text style={styles.forgotPasswordText}>{t('auth:login.forgotPassword')}</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            testID="login-button"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>{t('auth:login.loginButton')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth:login.orContinueWith')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth Buttons */}
          <View style={styles.oauthButtons}>
            {/* Google Button */}
            <TouchableOpacity
              style={styles.oauthButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              testID="google-login-button"
            >
              <Ionicons name="logo-google" size={24} color={AppleDesign.Colors.label} />
              <Text style={styles.oauthButtonText}>Google</Text>
            </TouchableOpacity>

            {/* Apple Button */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.oauthButton}
                onPress={handleAppleLogin}
                disabled={isLoading}
                testID="apple-login-button"
              >
                <Ionicons name="logo-apple" size={24} color={AppleDesign.Colors.label} />
                <Text style={styles.oauthButtonText}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>{t('auth:login.noAccount')}</Text>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              testID="register-link"
            >
              <Text style={styles.registerLink}>{t('auth:login.registerLink')}</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: AppleDesign.Spacing.xxl,
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
  
  // Forgot Password
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: AppleDesign.Spacing.xl,
  },
  forgotPasswordText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  
  // Login Button
  loginButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppleDesign.Shadows.small,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    fontWeight: '700',
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: AppleDesign.Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppleDesign.Colors.separator,
  },
  dividerText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.secondaryLabel,
    marginHorizontal: AppleDesign.Spacing.md,
  },
  
  // OAuth Buttons
  oauthButtons: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.xl,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.button,
    height: 50,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.separator,
  },
  oauthButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  
  // Register Link
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.xs,
  },
  registerText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  registerLink: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
});


