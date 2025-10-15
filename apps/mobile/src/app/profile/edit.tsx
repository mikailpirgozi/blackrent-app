/**
 * Edit Profile Screen
 * Update customer profile information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

export default function EditProfileScreen() {
  const router = useRouter();
  const { customer, updateProfile, logout } = useAuth();
  const { t } = useTranslation(['profile', 'common']);

  const [firstName, setFirstName] = useState(customer?.firstName || '');
  const [lastName, setLastName] = useState(customer?.lastName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFirstName(customer.firstName);
      setLastName(customer.lastName);
      setPhone(customer.phone || '');
    }
  }, [customer]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('common:errors.error'), t('profile:errors.fillRequired'));
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile(firstName.trim(), lastName.trim(), phone.trim() || undefined);
      Alert.alert(t('common:success'), t('profile:success.updated'));
      router.back();
    } catch (error) {
      Alert.alert(t('common:errors.error'), t('profile:errors.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile:logout.title'),
      t('profile:logout.confirmation'),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('profile:logout.confirm'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile:personalInfo')}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('profile:fields.firstName')}</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('profile:fields.lastName')}</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('profile:fields.email')}</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={customer?.email}
              editable={false}
            />
            <Text style={styles.hint}>{t('profile:hints.emailNotEditable')}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('profile:fields.phone')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              editable={!isLoading}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>{t('common:buttons.save')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Ionicons name="log-out-outline" size={20} color={AppleDesign.Colors.systemRed} />
          <Text style={styles.logoutButtonText}>{t('profile:logout.button')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  content: {
    padding: AppleDesign.Spacing.lg,
  },
  section: {
    marginBottom: AppleDesign.Spacing.xl,
  },
  sectionTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.lg,
  },
  inputContainer: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  label: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  input: {
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.input,
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.md,
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  hint: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: AppleDesign.Spacing.xs,
  },
  saveButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.lg,
    ...AppleDesign.Shadows.small,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.md,
  },
  logoutButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemRed,
    fontWeight: '600',
  },
});



