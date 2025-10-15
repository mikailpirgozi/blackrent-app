/**
 * 👤 Profile Screen
 * User profile and settings
 * Enhanced with Light/Dark mode support
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppleDesign from '../../styles/apple-design-system';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { customer, logout } = useAuth();

  const menuItems = [
    { icon: 'person-outline', label: 'Osobné údaje', route: '/profile/personal', color: AppleDesign.Colors.systemBlue },
    { icon: 'calendar-outline', label: 'Moje rezervácie', route: '/profile/bookings', color: AppleDesign.Colors.systemGreen },
    { icon: 'heart-outline', label: 'Obľúbené', route: '/profile/favorites', color: AppleDesign.Colors.systemRed },
    { icon: 'card-outline', label: 'Platobné metódy', route: '/profile/payment', color: AppleDesign.Colors.systemPurple },
    { icon: 'language-outline', label: 'Jazyk', route: '/profile/language', color: AppleDesign.Colors.systemOrange },
    { icon: 'star-outline', label: 'Vernostný program', route: '/profile/loyalty', color: AppleDesign.Colors.systemYellow },
    { icon: 'shield-checkmark-outline', label: 'Bezpečnosť', route: '/profile/security', color: AppleDesign.Colors.systemIndigo },
    { icon: 'notifications-outline', label: 'Notifikácie', route: '/profile/notifications', color: AppleDesign.Colors.systemTeal },
    { icon: 'help-circle-outline', label: 'Pomoc a podpora', route: '/profile/help', color: AppleDesign.Colors.systemGray },
  ];

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => createDynamicStyles(theme, isDark), [theme, isDark]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login' as never);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, dynamicStyles.text]}>Profil</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, dynamicStyles.card]}>
          <View style={[styles.avatarContainer, dynamicStyles.avatarContainer]}>
            <Ionicons name="person" size={40} color={theme.brand.primary} />
          </View>
          <Text style={[styles.profileName, dynamicStyles.text]}>
            {customer ? `${customer.firstName} ${customer.lastName}` : 'Používateľ'}
          </Text>
          <Text style={[styles.profileEmail, dynamicStyles.secondaryText]}>
            {customer?.email || 'user@blackrent.sk'}
          </Text>
          <TouchableOpacity style={[styles.editProfileButton, { backgroundColor: theme.brand.primary }]}>
            <Text style={styles.editProfileButtonText}>Upraviť profil</Text>
          </TouchableOpacity>
        </View>

        {/* Theme Toggle Section */}
        <View style={[styles.themeSection, dynamicStyles.card]}>
          <ThemeToggle />
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, dynamicStyles.card]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuItem,
                dynamicStyles.menuItem,
                index === 0 && styles.menuItemFirst,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => router.push(item.route as never)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIconContainer, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.color} />
                </View>
                <Text style={[styles.menuItemLabel, dynamicStyles.text]}>{item.label}</Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDark ? theme.colors.dark.tertiaryLabel : theme.colors.tertiaryLabel} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={[styles.logoutButton, dynamicStyles.card]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Odhlásiť sa</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={[styles.versionText, dynamicStyles.tertiaryText]}>
            BlackRent Mobile v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.md,
    paddingBottom: AppleDesign.Spacing.md,
  },
  headerTitle: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: AppleDesign.Colors.systemBackground,
    marginHorizontal: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  themeSection: {
    backgroundColor: AppleDesign.Colors.systemBackground,
    marginHorizontal: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  profileName: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.lg,
  },
  editProfileButton: {
    paddingVertical: AppleDesign.Spacing.sm,
    paddingHorizontal: AppleDesign.Spacing.xl,
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
  },
  editProfileButtonText: {
    ...AppleDesign.Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: AppleDesign.Colors.systemBackground,
    marginHorizontal: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.large,
    overflow: 'hidden',
    marginBottom: AppleDesign.Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    paddingHorizontal: AppleDesign.Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  menuItemFirst: {
    borderTopLeftRadius: AppleDesign.BorderRadius.large,
    borderTopRightRadius: AppleDesign.BorderRadius.large,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: AppleDesign.BorderRadius.large,
    borderBottomRightRadius: AppleDesign.BorderRadius.large,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  menuItemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  logoutSection: {
    marginHorizontal: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.lg,
  },
  logoutButton: {
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    paddingVertical: AppleDesign.Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemRed,
    fontWeight: '600',
  },
  versionSection: {
    paddingVertical: AppleDesign.Spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.tertiaryLabel,
  },
});

/**
 * Create dynamic styles based on current theme
 */
function createDynamicStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: isDark 
        ? theme.colors.dark.systemGroupedBackground 
        : theme.colors.systemGroupedBackground,
    },
    card: {
      backgroundColor: isDark 
        ? theme.colors.dark.secondarySystemGroupedBackground 
        : theme.colors.systemBackground,
    },
    text: {
      color: theme.dynamicColors.text,
    },
    secondaryText: {
      color: theme.dynamicColors.secondaryText,
    },
    tertiaryText: {
      color: isDark ? theme.colors.dark.tertiaryLabel : theme.colors.tertiaryLabel,
    },
    avatarContainer: {
      backgroundColor: isDark 
        ? theme.colors.dark.tertiarySystemFill 
        : theme.colors.tertiarySystemFill,
    },
    menuItem: {
      borderBottomColor: isDark 
        ? theme.colors.dark.separator 
        : theme.colors.separator,
    },
  });
}

