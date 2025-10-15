/**
 * 🏠 Home Screen
 * Main landing screen with featured vehicles and quick actions
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppleDesign from '../../styles/apple-design-system';
import { EnhancedVehicleCard } from '../../components/ui/enhanced-vehicle-card';
import { HeroSearchBar } from '../../components/ui/hero-search-bar';
import { useVehicles } from '../../hooks/mock-api-hooks';

export default function HomeScreen() {
  const router = useRouter();
  const { data: vehiclesData } = useVehicles();
  const vehicles = vehiclesData?.data || [];
  const featuredVehicles = vehicles.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>BlackRent</Text>
            <Text style={styles.headerSubtitle}>Prenájom vozidiel</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color={AppleDesign.Colors.systemBlue} />
          </TouchableOpacity>
        </View>

        {/* Hero Search */}
        <View style={styles.searchSection}>
          <HeroSearchBar />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Rýchle akcie</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="car-outline" size={24} color={AppleDesign.Colors.systemBlue} />
              </View>
              <Text style={styles.quickActionLabel}>Katalóg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="calendar-outline" size={24} color={AppleDesign.Colors.systemGreen} />
              </View>
              <Text style={styles.quickActionLabel}>Rezervácie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="star-outline" size={24} color={AppleDesign.Colors.systemOrange} />
              </View>
              <Text style={styles.quickActionLabel}>Obľúbené</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="gift-outline" size={24} color={AppleDesign.Colors.systemPurple} />
              </View>
              <Text style={styles.quickActionLabel}>Zľavy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Vehicles */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Odporúčané vozidlá</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.seeAllButton}>Zobraziť všetky</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.vehicleList}>
            {featuredVehicles.map((vehicle) => (
              <EnhancedVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPress={() => {}}
              />
            ))}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.md,
    paddingBottom: AppleDesign.Spacing.md,
  },
  headerTitle: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  searchSection: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.lg,
  },
  quickActionsSection: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.lg,
  },
  sectionTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.md,
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuredSection: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  seeAllButton: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  vehicleList: {
    gap: AppleDesign.Spacing.md,
  },
});

