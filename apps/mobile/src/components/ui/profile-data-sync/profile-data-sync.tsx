/**
 * 👤 Profile Data Sync Component
 * Synchronizes user profile data for ultra-fast booking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';
import { AppleCard } from '../apple-card/apple-card';

// Hooks
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { logger } from '../../../utils/logger';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  driverLicense: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: {
    type: 'card' | 'bank_transfer' | 'cash';
    lastFour: string;
    expiryDate?: string;
  };
  preferences: {
    pickupLocation: string;
    insuranceLevel: 'basic' | 'premium' | 'full';
    additionalDriver: boolean;
  };
}

interface ProfileDataSyncProps {
  onProfileUpdate: (profile: UserProfile) => void;
  onCancel: () => void;
  initialProfile?: Partial<UserProfile>;
}

export function ProfileDataSync({
  onProfileUpdate,
  onCancel,
  initialProfile,
}: ProfileDataSyncProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: initialProfile?.firstName || 'Mária',
    lastName: initialProfile?.lastName || 'Kováčová',
    email: initialProfile?.email || 'maria.kovacova@email.com',
    phone: initialProfile?.phone || '+421 900 123 456',
    driverLicense: initialProfile?.driverLicense || 'SK123456789',
    dateOfBirth: initialProfile?.dateOfBirth || '1990-05-15',
    address: {
      street: initialProfile?.address?.street || 'Hlavná 123',
      city: initialProfile?.address?.city || 'Bratislava',
      postalCode: initialProfile?.address?.postalCode || '811 01',
      country: initialProfile?.address?.country || 'Slovensko',
    },
    paymentMethod: {
      type: initialProfile?.paymentMethod?.type || 'card',
      lastFour: initialProfile?.paymentMethod?.lastFour || '1234',
      expiryDate: initialProfile?.paymentMethod?.expiryDate || '12/25',
    },
    preferences: {
      pickupLocation: initialProfile?.preferences?.pickupLocation || 'Bratislava - Hlavná stanica',
      insuranceLevel: initialProfile?.preferences?.insuranceLevel || 'premium',
      additionalDriver: initialProfile?.preferences?.additionalDriver || false,
    },
  });

  const [editableProfile, setEditableProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate loading profile data from storage/API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('Profile data loaded successfully');
    } catch (error) {
      logger.error('Error loading profile data:', error);
      Alert.alert('Chyba', 'Nepodarilo sa načítať údaje profilu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    haptic.light();
    setIsEditing(true);
    setEditableProfile(profile);
  };

  const handleSave = async () => {
    haptic.medium();
    setIsLoading(true);
    
    try {
      // Validate required fields
      if (!editableProfile.firstName || !editableProfile.lastName || !editableProfile.email) {
        Alert.alert('Chyba', 'Prosím vyplňte všetky povinné polia');
        return;
      }

      // Simulate saving profile data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(editableProfile);
      setIsEditing(false);
      onProfileUpdate(editableProfile);
      
      haptic.success();
      logger.info('Profile data updated successfully');
      
    } catch (error) {
      haptic.error();
      logger.error('Error saving profile data:', error);
      Alert.alert('Chyba', 'Nepodarilo sa uložiť údaje profilu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    haptic.light();
    setIsEditing(false);
    setEditableProfile(profile);
  };

  const updateProfileField = (field: keyof UserProfile, value: any) => {
    setEditableProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateAddressField = (field: keyof UserProfile['address'], value: string) => {
    setEditableProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const updatePreferencesField = (field: keyof UserProfile['preferences'], value: any) => {
    setEditableProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  if (isLoading && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppleDesign.Colors.systemBlue} />
        <Text style={styles.loadingText}>Načítavam údaje profilu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <OptimizedFadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.title}>Údaje profilu</Text>
            <Text style={styles.subtitle}>
              Tieto údaje sa použijú pre rýchlu rezerváciu
            </Text>
          </View>
        </OptimizedFadeIn>

        {/* Personal Information */}
        <OptimizedSlideIn delay={100} direction="up">
          <AppleCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.sectionTitle}>Osobné údaje</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Meno *</Text>
              <TextInput
                style={styles.textInput}
                value={isEditing ? editableProfile.firstName : profile.firstName}
                onChangeText={(text) => updateProfileField('firstName', text)}
                editable={isEditing}
                placeholder="Zadajte meno"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priezvisko *</Text>
              <TextInput
                style={styles.textInput}
                value={isEditing ? editableProfile.lastName : profile.lastName}
                onChangeText={(text) => updateProfileField('lastName', text)}
                editable={isEditing}
                placeholder="Zadajte priezvisko"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                value={isEditing ? editableProfile.email : profile.email}
                onChangeText={(text) => updateProfileField('email', text)}
                editable={isEditing}
                placeholder="Zadajte email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefón</Text>
              <TextInput
                style={styles.textInput}
                value={isEditing ? editableProfile.phone : profile.phone}
                onChangeText={(text) => updateProfileField('phone', text)}
                editable={isEditing}
                placeholder="+421 900 000 000"
                keyboardType="phone-pad"
              />
            </View>
          </AppleCard>
        </OptimizedSlideIn>

        {/* Driver Information */}
        <OptimizedSlideIn delay={200} direction="up">
          <AppleCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.sectionTitle}>Vodičské údaje</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Číslo vodičáku</Text>
              <TextInput
                style={styles.textInput}
                value={isEditing ? editableProfile.driverLicense : profile.driverLicense}
                onChangeText={(text) => updateProfileField('driverLicense', text)}
                editable={isEditing}
                placeholder="SK123456789"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dátum narodenia</Text>
              <TextInput
                style={styles.textInput}
                value={isEditing ? editableProfile.dateOfBirth : profile.dateOfBirth}
                onChangeText={(text) => updateProfileField('dateOfBirth', text)}
                editable={isEditing}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </AppleCard>
        </OptimizedSlideIn>

        {/* Address */}
        <OptimizedSlideIn delay={300} direction="up">
          <AppleCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.sectionTitle}>Adresa</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ulica</Text>
              <TextInput
                style={styles.textInput}
                value={isEditing ? editableProfile.address.street : profile.address.street}
                onChangeText={(text) => updateAddressField('street', text)}
                editable={isEditing}
                placeholder="Hlavná 123"
              />
            </View>
            
            <View style={styles.addressRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Mesto</Text>
                <TextInput
                  style={styles.textInput}
                  value={isEditing ? editableProfile.address.city : profile.address.city}
                  onChangeText={(text) => updateAddressField('city', text)}
                  editable={isEditing}
                  placeholder="Bratislava"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: AppleDesign.Spacing.sm }]}>
                <Text style={styles.inputLabel}>PSČ</Text>
                <TextInput
                  style={styles.textInput}
                  value={isEditing ? editableProfile.address.postalCode : profile.address.postalCode}
                  onChangeText={(text) => updateAddressField('postalCode', text)}
                  editable={isEditing}
                  placeholder="811 01"
                />
              </View>
            </View>
          </AppleCard>
        </OptimizedSlideIn>

        {/* Payment Method */}
        <OptimizedSlideIn delay={400} direction="up">
          <AppleCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.sectionTitle}>Platobná metóda</Text>
            </View>
            
            <View style={styles.paymentMethod}>
              <Ionicons name="card" size={24} color={AppleDesign.Colors.systemBlue} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentType}>
                  {profile.paymentMethod.type === 'card' ? 'Kreditná karta' : 
                   profile.paymentMethod.type === 'bank_transfer' ? 'Bankový prevod' : 'Hotovosť'}
                </Text>
                <Text style={styles.paymentDetails}>
                  **** {profile.paymentMethod.lastFour}
                  {profile.paymentMethod.expiryDate && ` • ${profile.paymentMethod.expiryDate}`}
                </Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="pencil" size={16} color={AppleDesign.Colors.systemBlue} />
              </TouchableOpacity>
            </View>
          </AppleCard>
        </OptimizedSlideIn>

        {/* Preferences */}
        <OptimizedSlideIn delay={500} direction="up">
          <AppleCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={20} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.sectionTitle}>Predvoľby</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Predvolené miesto vyzdvihnutia</Text>
              <TextInput
                style={styles.textInput}
                value={isEditing ? editableProfile.preferences.pickupLocation : profile.preferences.pickupLocation}
                onChangeText={(text) => updatePreferencesField('pickupLocation', text)}
                editable={isEditing}
                placeholder="Bratislava - Hlavná stanica"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Úroveň poistenia</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'basic', label: 'Základné' },
                  { value: 'premium', label: 'Rozšírené' },
                  { value: 'full', label: 'Plné' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.radioOption}
                    onPress={() => updatePreferencesField('insuranceLevel', option.value)}
                  >
                    <View style={styles.radioButton}>
                      {(isEditing ? editableProfile.preferences.insuranceLevel : profile.preferences.insuranceLevel) === option.value && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </AppleCard>
        </OptimizedSlideIn>
      </ScrollView>

      {/* Action Buttons */}
      <OptimizedSlideIn delay={600} direction="up">
        <View style={styles.actionContainer}>
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Zrušiť</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isLoading && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Uložiť</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
              >
                <Ionicons name="pencil" size={20} color={AppleDesign.Colors.systemBlue} />
                <Text style={styles.editButtonText}>Upraviť údaje</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => onProfileUpdate(profile)}
              >
                <Text style={styles.continueButtonText}>Pokračovať</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
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
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: AppleDesign.Spacing.md,
  },
  
  // Header
  header: {
    padding: AppleDesign.Spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.sm,
  },
  subtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  
  // Sections
  section: {
    margin: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.sm,
  },
  sectionTitle: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  
  // Inputs
  inputGroup: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  inputLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
    marginBottom: AppleDesign.Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: AppleDesign.Colors.systemGray4,
    borderRadius: AppleDesign.BorderRadius.medium,
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.md,
    fontSize: 16,
    color: AppleDesign.Colors.label,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  addressRow: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.sm,
  },
  
  // Payment Method
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
  },
  paymentDetails: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: AppleDesign.Spacing.xs,
  },
  editIconButton: {
    padding: AppleDesign.Spacing.sm,
  },
  
  // Radio Group
  radioGroup: {
    gap: AppleDesign.Spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AppleDesign.Colors.systemGray4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  radioLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  
  // Actions
  actionContainer: {
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.systemGray5,
  },
  editActions: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.systemGray4,
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: AppleDesign.Colors.label,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: AppleDesign.Colors.systemGray4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  viewActions: {
    gap: AppleDesign.Spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.systemBlue,
    gap: AppleDesign.Spacing.sm,
  },
  editButtonText: {
    color: AppleDesign.Colors.systemBlue,
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
