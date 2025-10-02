/**
 * 📊 Admin Dashboard
 * Kompletný dashboard pre autopožičovne s KPI metrikami
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Apple Design System
import AppleDesign from '../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../../components/ui/optimized-animations';
import { AppleCard } from '../../components/ui/apple-card/apple-card';

// Hooks
import { useTranslation } from '../../hooks/use-translation';
import { useHapticFeedback } from '../../utils/haptic-feedback';
import { logger } from '../../utils/logger';

interface DashboardMetrics {
  totalRevenue: number;
  netRevenue: number; // Po 20% provízii
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  vehicleUtilization: number;
  averageRating: number;
  totalVehicles: number;
  activeBookings: number;
  pendingBookings: number;
  completedBookings: number;
}

interface TopVehicle {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  utilization: number;
}

interface RecentBooking {
  id: string;
  vehicleName: string;
  customerName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalPrice: number;
}

export default function AdminDashboard() {
  const haptic = useHapticFeedback();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  
  // Mock data - v reálnej aplikácii by sa načítalo z API
  const [metrics] = useState<DashboardMetrics>({
    totalRevenue: 15420,
    netRevenue: 12336, // 80% po provízii
    todayBookings: 3,
    weekBookings: 18,
    monthBookings: 67,
    vehicleUtilization: 78,
    averageRating: 4.6,
    totalVehicles: 12,
    activeBookings: 8,
    pendingBookings: 4,
    completedBookings: 156,
  });

  const [topVehicles] = useState<TopVehicle[]>([
    {
      id: '1',
      name: 'BMW 3 Series',
      bookings: 23,
      revenue: 4580,
      utilization: 89,
    },
    {
      id: '2',
      name: 'Audi A4',
      bookings: 19,
      revenue: 3820,
      utilization: 76,
    },
    {
      id: '3',
      name: 'Mercedes C-Class',
      bookings: 15,
      revenue: 3600,
      utilization: 68,
    },
  ]);

  const [recentBookings] = useState<RecentBooking[]>([
    {
      id: 'BK001',
      vehicleName: 'BMW 3 Series',
      customerName: 'Mária Kováčová',
      startDate: '2024-01-15',
      endDate: '2024-01-18',
      status: 'active',
      totalPrice: 267,
    },
    {
      id: 'BK002',
      vehicleName: 'Audi A4',
      customerName: 'Peter Novák',
      startDate: '2024-01-16',
      endDate: '2024-01-19',
      status: 'confirmed',
      totalPrice: 285,
    },
    {
      id: 'BK003',
      vehicleName: 'Mercedes C-Class',
      customerName: 'Jana Svobodová',
      startDate: '2024-01-14',
      endDate: '2024-01-16',
      status: 'completed',
      totalPrice: 240,
    },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    haptic.light();
    
    try {
      // Simulácia načítania dát
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // V reálnej aplikácii by sa tu volalo API
      logger.info('Dashboard data refreshed');
      
    } catch (error) {
      logger.error('Failed to refresh dashboard data:', error);
      Alert.alert('Chyba', 'Nepodarilo sa načítať najnovšie dáta');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePeriodChange = (period: 'today' | 'week' | 'month') => {
    setSelectedPeriod(period);
    haptic.light();
    
    // V reálnej aplikácii by sa tu načítali dáta pre vybrané obdobie
    logger.info(`Period changed to: ${period}`);
  };

  const handleQuickAction = (action: string) => {
    haptic.medium();
    
    switch (action) {
      case 'add_vehicle':
        router.push('/admin/vehicles/add' as any);
        break;
      case 'manage_bookings':
        router.push('/admin/bookings' as any);
        break;
      case 'view_analytics':
        router.push('/admin/analytics' as any);
        break;
      case 'customer_support':
        router.push('/admin/support' as any);
        break;
      default:
        Alert.alert('Funkcia', `${action} bude implementovaná`);
    }
  };

  const getStatusColor = (status: RecentBooking['status']) => {
    switch (status) {
      case 'pending':
        return AppleDesign.Colors.systemOrange;
      case 'confirmed':
        return AppleDesign.Colors.systemBlue;
      case 'active':
        return AppleDesign.Colors.systemGreen;
      case 'completed':
        return AppleDesign.Colors.systemGray;
      case 'cancelled':
        return AppleDesign.Colors.systemRed;
      default:
        return AppleDesign.Colors.systemGray;
    }
  };

  const getStatusText = (status: RecentBooking['status']) => {
    switch (status) {
      case 'pending':
        return 'Čaká';
      case 'confirmed':
        return 'Potvrdené';
      case 'active':
        return 'Aktívne';
      case 'completed':
        return 'Dokončené';
      case 'cancelled':
        return 'Zrušené';
      default:
        return 'Neznáme';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={AppleDesign.Colors.systemBlue}
          />
        }
      >
        {/* Header */}
        <OptimizedFadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Prehľad vašej autopožičovne
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/admin/settings' as any)}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={AppleDesign.Colors.systemBlue}
              />
            </TouchableOpacity>
          </View>
        </OptimizedFadeIn>

        {/* Period Selector */}
        <OptimizedSlideIn delay={100} direction="up">
          <View style={styles.periodSelector}>
            {(['today', 'week', 'month'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => handlePeriodChange(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period === 'today' ? 'Dnes' : period === 'week' ? 'Týždeň' : 'Mesiac'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </OptimizedSlideIn>

        {/* Key Metrics */}
        <OptimizedSlideIn delay={200} direction="up">
          <View style={styles.metricsGrid}>
            <AppleCard style={styles.metricCard}>
              <View style={styles.metricContent}>
                <View style={[styles.metricIcon, { backgroundColor: AppleDesign.Colors.systemGreen + '20' }]}>
                  <Ionicons name="trending-up" size={24} color={AppleDesign.Colors.systemGreen} />
                </View>
                <Text style={styles.metricValue}>€{metrics.netRevenue.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Čistý príjem</Text>
                <Text style={styles.metricSubtext}>
                  z €{metrics.totalRevenue.toLocaleString()} celkom
                </Text>
              </View>
            </AppleCard>

            <AppleCard style={styles.metricCard}>
              <View style={styles.metricContent}>
                <View style={[styles.metricIcon, { backgroundColor: AppleDesign.Colors.systemBlue + '20' }]}>
                  <Ionicons name="calendar" size={24} color={AppleDesign.Colors.systemBlue} />
                </View>
                <Text style={styles.metricValue}>
                  {selectedPeriod === 'today' ? metrics.todayBookings : 
                   selectedPeriod === 'week' ? metrics.weekBookings : 
                   metrics.monthBookings}
                </Text>
                <Text style={styles.metricLabel}>Rezervácie</Text>
                <Text style={styles.metricSubtext}>
                  {selectedPeriod === 'today' ? 'dnes' : 
                   selectedPeriod === 'week' ? 'tento týždeň' : 
                   'tento mesiac'}
                </Text>
              </View>
            </AppleCard>

            <AppleCard style={styles.metricCard}>
              <View style={styles.metricContent}>
                <View style={[styles.metricIcon, { backgroundColor: AppleDesign.Colors.systemPurple + '20' }]}>
                  <Ionicons name="speedometer" size={24} color={AppleDesign.Colors.systemPurple} />
                </View>
                <Text style={styles.metricValue}>{metrics.vehicleUtilization}%</Text>
                <Text style={styles.metricLabel}>Využitie vozidiel</Text>
                <Text style={styles.metricSubtext}>
                  {metrics.totalVehicles} vozidiel celkom
                </Text>
              </View>
            </AppleCard>

            <AppleCard style={styles.metricCard}>
              <View style={styles.metricContent}>
                <View style={[styles.metricIcon, { backgroundColor: AppleDesign.Colors.systemYellow + '20' }]}>
                  <Ionicons name="star" size={24} color={AppleDesign.Colors.systemYellow} />
                </View>
                <Text style={styles.metricValue}>{metrics.averageRating}</Text>
                <Text style={styles.metricLabel}>Hodnotenie</Text>
                <Text style={styles.metricSubtext}>
                  z {metrics.completedBookings} recenzií
                </Text>
              </View>
            </AppleCard>
          </View>
        </OptimizedSlideIn>

        {/* Quick Actions */}
        <OptimizedSlideIn delay={300} direction="up">
          <AppleCard style={styles.quickActionsCard}>
            <Text style={styles.sectionTitle}>Rýchle akcie</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('add_vehicle')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: AppleDesign.Colors.systemBlue + '20' }]}>
                  <Ionicons name="car-outline" size={24} color={AppleDesign.Colors.systemBlue} />
                </View>
                <Text style={styles.quickActionText}>Pridať vozidlo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('manage_bookings')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: AppleDesign.Colors.systemGreen + '20' }]}>
                  <Ionicons name="calendar-outline" size={24} color={AppleDesign.Colors.systemGreen} />
                </View>
                <Text style={styles.quickActionText}>Rezervácie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('view_analytics')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: AppleDesign.Colors.systemPurple + '20' }]}>
                  <Ionicons name="analytics-outline" size={24} color={AppleDesign.Colors.systemPurple} />
                </View>
                <Text style={styles.quickActionText}>Analýzy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('customer_support')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: AppleDesign.Colors.systemOrange + '20' }]}>
                  <Ionicons name="headset-outline" size={24} color={AppleDesign.Colors.systemOrange} />
                </View>
                <Text style={styles.quickActionText}>Podpora</Text>
              </TouchableOpacity>
            </View>
          </AppleCard>
        </OptimizedSlideIn>

        {/* Top Vehicles */}
        <OptimizedSlideIn delay={400} direction="up">
          <AppleCard style={styles.topVehiclesCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top vozidlá</Text>
              <TouchableOpacity onPress={() => router.push('/admin/vehicles' as any)}>
                <Text style={styles.seeAllText}>Zobraziť všetky</Text>
              </TouchableOpacity>
            </View>
            
            {topVehicles.map((vehicle, index) => (
              <View key={vehicle.id} style={styles.topVehicleItem}>
                <View style={styles.topVehicleRank}>
                  <Text style={styles.topVehicleRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topVehicleInfo}>
                  <Text style={styles.topVehicleName}>{vehicle.name}</Text>
                  <Text style={styles.topVehicleStats}>
                    {vehicle.bookings} rezervácií • €{vehicle.revenue} • {vehicle.utilization}% využitie
                  </Text>
                </View>
                <View style={styles.topVehicleUtilization}>
                  <View
                    style={[
                      styles.utilizationBar,
                      { width: `${vehicle.utilization}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </AppleCard>
        </OptimizedSlideIn>

        {/* Recent Bookings */}
        <OptimizedSlideIn delay={500} direction="up">
          <AppleCard style={styles.recentBookingsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nedávne rezervácie</Text>
              <TouchableOpacity onPress={() => router.push('/admin/bookings' as any)}>
                <Text style={styles.seeAllText}>Zobraziť všetky</Text>
              </TouchableOpacity>
            </View>
            
            {recentBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingItem}
                onPress={() => router.push(`/admin/bookings/${booking.id}` as any)}
              >
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingVehicle}>{booking.vehicleName}</Text>
                  <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
                  <Text style={styles.bookingDates}>
                    {new Date(booking.startDate).toLocaleDateString('sk-SK')} - {new Date(booking.endDate).toLocaleDateString('sk-SK')}
                  </Text>
                </View>
                <View style={styles.bookingMeta}>
                  <View
                    style={[
                      styles.bookingStatus,
                      { backgroundColor: getStatusColor(booking.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bookingStatusText,
                        { color: getStatusColor(booking.status) },
                      ]}
                    >
                      {getStatusText(booking.status)}
                    </Text>
                  </View>
                  <Text style={styles.bookingPrice}>€{booking.totalPrice}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </AppleCard>
        </OptimizedSlideIn>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
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
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.lg,
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
    marginTop: AppleDesign.Spacing.xs,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppleDesign.Colors.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.medium,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: AppleDesign.Spacing.sm,
    alignItems: 'center',
    borderRadius: AppleDesign.BorderRadius.small,
  },
  periodButtonActive: {
    backgroundColor: AppleDesign.Colors.systemBackground,
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.lg,
  },
  metricCard: {
    width: '48%',
  },
  metricContent: {
    padding: AppleDesign.Spacing.lg,
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  metricValue: {
    ...AppleDesign.Typography.title1,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.xs,
  },
  metricLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: AppleDesign.Spacing.xs,
  },
  metricSubtext: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  
  // Quick Actions
  quickActionsCard: {
    marginHorizontal: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.lg,
  },
  sectionTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppleDesign.Spacing.md,
  },
  quickActionButton: {
    width: '48%',
    alignItems: 'center',
    padding: AppleDesign.Spacing.lg,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  quickActionText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Top Vehicles
  topVehiclesCard: {
    marginHorizontal: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.lg,
  },
  seeAllText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  topVehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.lg,
  },
  topVehicleRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppleDesign.Colors.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  topVehicleRankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  topVehicleInfo: {
    flex: 1,
    marginRight: AppleDesign.Spacing.md,
  },
  topVehicleName: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  topVehicleStats: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  topVehicleUtilization: {
    width: 60,
    height: 4,
    backgroundColor: AppleDesign.Colors.systemGray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  utilizationBar: {
    height: '100%',
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  
  // Recent Bookings
  recentBookingsCard: {
    marginHorizontal: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.lg,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: AppleDesign.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.systemGray6,
  },
  bookingInfo: {
    flex: 1,
    marginRight: AppleDesign.Spacing.md,
  },
  bookingVehicle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  bookingCustomer: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.xs,
  },
  bookingDates: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  bookingMeta: {
    alignItems: 'flex-end',
  },
  bookingStatus: {
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.xs,
    borderRadius: AppleDesign.BorderRadius.small,
    marginBottom: AppleDesign.Spacing.xs,
  },
  bookingStatusText: {
    ...AppleDesign.Typography.caption1,
    fontWeight: '600',
  },
  bookingPrice: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  
  // Bottom Spacing
  bottomSpacing: {
    height: AppleDesign.Spacing.xl,
  },
});
