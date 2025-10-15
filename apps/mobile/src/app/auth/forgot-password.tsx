/**
 * Forgot Password Screen
 * Password reset request
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import AppleDesign from '../../styles/apple-design-system';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert(t('common:errors.error'), t('auth:errors.enterEmail'));
      return;
    }

    setIsLoading(true);
    // TODO: Implement password reset API
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
      Alert.alert(t('common:success'), t('auth:forgotPassword.successMessage'));
    }, 1500);
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={64} color={AppleDesign.Colors.systemGreen} />
          <Text style={styles.title}>{t('auth:forgotPassword.sentTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth:forgotPassword.sentSubtitle')}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>{t('common:buttons.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="lock-closed-outline" size={64} color={AppleDesign.Colors.systemBlue} />
        <Text style={styles.title}>{t('auth:forgotPassword.title')}</Text>
        <Text style={styles.subtitle}>{t('auth:forgotPassword.subtitle')}</Text>

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
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>{t('auth:forgotPassword.sendButton')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
          <Text style={styles.backLink}>{t('common:buttons.cancel')}</Text>
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
  content: {
    flex: 1,
    padding: AppleDesign.Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...AppleDesign.Typography.title1,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginTop: AppleDesign.Spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    marginTop: AppleDesign.Spacing.sm,
    marginBottom: AppleDesign.Spacing.xxl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.input,
    paddingHorizontal: AppleDesign.Spacing.md,
    height: 50,
    width: '100%',
    marginBottom: AppleDesign.Spacing.lg,
  },
  inputIcon: {
    marginRight: AppleDesign.Spacing.sm,
  },
  input: {
    flex: 1,
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  button: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    ...AppleDesign.Shadows.small,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    fontWeight: '700',
  },
  backLink: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
    marginTop: AppleDesign.Spacing.lg,
  },
});


