/**
 * 📈 Analytics & Reports System
 * Detailné reporty a štatistiky pre autopožičovne
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';
import { AppleCard } from '../apple-card/apple-card';
import { AppleButton } from '../apple-button/apple-button';

// Hooks
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { logger } from '../../../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsData {
  revenue: {
    total: number;
    net: number; // Po 20% provízii
    growth: number;
    monthlyData: { month: string; revenue: number; bookings: number }[];
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    growth: number;
    conversionRate: number;
    averageValue: number;
  };
  vehicles: {
    total: number;
    active: number;
    averageUtilization: number;
    topPerformers: {
      id: string;
      name: string;
      revenue: number;
      bookings: number;
      utilization: number;
    }[];
  };
  customers: {
    total: number;
    returning: number;
    newCustomers: number;
    averageRating: number;
    demographics: {
      ageGroups: { range: string; percentage: number }[];
      locations: { city: string; percentage: number }[];
    };
  };
  seasonal: {
    peakMonths: string[];
    lowMonths: string[];
    weekdayVsWeekend: { weekday: number; weekend: number };
  };
}

interface AnalyticsReportsProps {
  onExportReport?: (reportType: string, period: string) => void;
}

export function AnalyticsReports({ onExportReport }: AnalyticsReportsProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'revenue' | 'bookings' | 'vehicles' | 'customers'>('overview');

  // Mock data - v reálnej aplikácii by sa načítalo z API
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      // Simulácia načítania dát z API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        revenue: {
          total: 45680,
          net: 36544, // 80% po provízii
          growth: 23.5,
          monthlyData: [
            { month: 'Jan', revenue: 3200, bookings: 18 },
            { month: 'Feb', revenue: 3800, bookings: 22 },
            { month: 'Mar', revenue: 4200, bookings: 25 },
            { month: 'Apr', revenue: 3900, bookings: 21 },
            { month: 'Máj', revenue: 4500, bookings: 28 },
            { month: 'Jún', revenue: 5200, bookings: 32 },
            { month: 'Júl', revenue: 6100, bookings: 38 },
            { month: 'Aug', revenue: 5800, bookings: 35 },
            { month: 'Sep', revenue: 4800, bookings: 29 },
            { month: 'Okt', revenue: 4100, bookings: 24 },
            { month: 'Nov', revenue: 3600, bookings: 20 },
            { month: 'Dec', revenue: 2600, bookings: 15 },
          ],
        },
        bookings: {
          total: 307,
          completed: 278,
          cancelled: 29,
          growth: 18.2,
          conversionRate: 85.4,
          averageValue: 148.7,
        },
        vehicles: {
          total: 12,
          active: 11,
          averageUtilization: 73.2,
          topPerformers: [
            { id: '1', name: 'BMW 3 Series', revenue: 8940, bookings: 67, utilization: 89 },
            { id: '2', name: 'Audi A4', revenue: 7650, bookings: 58, utilization: 82 },
            { id: '3', name: 'Mercedes C-Class', revenue: 6890, bookings: 45, utilization: 76 },
            { id: '4', name: 'VW Passat', revenue: 5420, bookings: 42, utilization: 68 },
            { id: '5', name: 'Škoda Superb', revenue: 4980, bookings: 38, utilization: 65 },
          ],
        },
        customers: {
          total: 189,
          returning: 67,
          newCustomers: 122,
          averageRating: 4.6,
          demographics: {
            ageGroups: [
              { range: '18-25', percentage: 15 },
              { range: '26-35', percentage: 42 },
              { range: '36-45', percentage: 28 },
              { range: '46-55', percentage: 12 },
              { range: '55+', percentage: 3 },
            ],
            locations: [
              { city: 'Bratislava', percentage: 45 },
              { city: 'Košice', percentage: 18 },
              { city: 'Prešov', percentage: 12 },
              { city: 'Žilina', percentage: 10 },
              { city: 'Ostatné', percentage: 15 },
            ],
          },
        },
        seasonal: {
          peakMonths: ['Jún', 'Júl', 'August'],
          lowMonths: ['December', 'Január', 'Február'],
          weekdayVsWeekend: { weekday: 62, weekend: 38 },
        },
      };
      
      setAnalyticsData(mockData);
      logger.info('Analytics data loaded successfully');
      
    } catch (error) {
      logger.error('Failed to load analytics data:', error);
      Alert.alert('Chyba', 'Nepodarilo sa načítať analytické dáta');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (period: typeof selectedPeriod) => {
    setSelectedPeriod(period);
    haptic.light();
  };

  const handleReportChange = (report: typeof selectedReport) => {
    setSelectedReport(report);
    haptic.light();
  };

  const handleExportReport = (reportType: string) => {
    haptic.medium();
    
    Alert.alert(
      'Export reportu',
      `Chcete exportovať ${reportType} report za ${selectedPeriod}?`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'PDF',
          onPress: () => {
            onExportReport?.(reportType, selectedPeriod);
            logger.info(`Exporting ${reportType} report as PDF for ${selectedPeriod}`);
          },
        },
        {
          text: 'Excel',
          onPress: () => {
            onExportReport?.(reportType, selectedPeriod);
            logger.info(`Exporting ${reportType} report as Excel for ${selectedPeriod}`);
          },
        },
      ]
    );
  };

  const periods = [
    { id: 'week', name: 'Týždeň' },
    { id: 'month', name: 'Mesiac' },
    { id: 'quarter', name: 'Štvrťrok' },
    { id: 'year', name: 'Rok' },
  ] as const;

  const reports = [
    { id: 'overview', name: 'Prehľad', icon: 'analytics' },
    { id: 'revenue', name: 'Príjmy', icon: 'trending-up' },
    { id: 'bookings', name: 'Rezervácie', icon: 'calendar' },
    { id: 'vehicles', name: 'Vozidlá', icon: 'car' },
    { id: 'customers', name: 'Zákazníci', icon: 'people' },
  ] as const;

  if (isLoading || !analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppleDesign.Colors.systemBlue} />
        <Text style={styles.loadingText}>Načítavam analytické dáta...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <OptimizedFadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analýzy a reporty</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExportReport(selectedReport)}
          >
            <Ionicons name="download-outline" size={20} color="white" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </OptimizedFadeIn>

      {/* Period Selector */}
      <OptimizedSlideIn delay={100} direction="up">
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive,
              ]}
              onPress={() => handlePeriodChange(period.id)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.id && styles.periodButtonTextActive,
                ]}
              >
                {period.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </OptimizedSlideIn>

      {/* Report Selector */}
      <OptimizedSlideIn delay={200} direction="up">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.reportScroll}
          contentContainerStyle={styles.reportContainer}
        >
          {reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[
                styles.reportButton,
                selectedReport === report.id && styles.reportButtonActive,
              ]}
              onPress={() => handleReportChange(report.id)}
            >
              <Ionicons
                name={report.icon as any}
                size={20}
                color={
                  selectedReport === report.id
                    ? 'white'
                    : AppleDesign.Colors.secondaryLabel
                }
              />
              <Text
                style={[
                  styles.reportButtonText,
                  selectedReport === report.id && styles.reportButtonTextActive,
                ]}
              >
                {report.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </OptimizedSlideIn>

      {/* Report Content */}
      <ScrollView style={styles.reportContent}>
        {selectedReport === 'overview' && (
          <OverviewReport data={analyticsData} />
        )}
        {selectedReport === 'revenue' && (
          <RevenueReport data={analyticsData.revenue} />
        )}
        {selectedReport === 'bookings' && (
          <BookingsReport data={analyticsData.bookings} />
        )}
        {selectedReport === 'vehicles' && (
          <VehiclesReport data={analyticsData.vehicles} />
        )}
        {selectedReport === 'customers' && (
          <CustomersReport data={analyticsData.customers} />
        )}
      </ScrollView>
    </View>
  );
}

// Overview Report Component
function OverviewReport({ data }: { data: AnalyticsData }) {
  return (
    <View style={styles.reportSection}>
      <OptimizedSlideIn delay={300} direction="up">
        <View style={styles.kpiGrid}>
          <AppleCard style={styles.kpiCard}>
            <View style={styles.kpiContent}>
              <View style={[styles.kpiIcon, { backgroundColor: AppleDesign.Colors.systemGreen + '20' }]}>
                <Ionicons name="trending-up" size={24} color={AppleDesign.Colors.systemGreen} />
              </View>
              <Text style={styles.kpiValue}>€{data.revenue.net.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Čistý príjem</Text>
              <Text style={[styles.kpiGrowth, { color: AppleDesign.Colors.systemGreen }]}>
                +{data.revenue.growth}%
              </Text>
            </View>
          </AppleCard>

          <AppleCard style={styles.kpiCard}>
            <View style={styles.kpiContent}>
              <View style={[styles.kpiIcon, { backgroundColor: AppleDesign.Colors.systemBlue + '20' }]}>
                <Ionicons name="calendar" size={24} color={AppleDesign.Colors.systemBlue} />
              </View>
              <Text style={styles.kpiValue}>{data.bookings.total}</Text>
              <Text style={styles.kpiLabel}>Rezervácie</Text>
              <Text style={[styles.kpiGrowth, { color: AppleDesign.Colors.systemGreen }]}>
                +{data.bookings.growth}%
              </Text>
            </View>
          </AppleCard>

          <AppleCard style={styles.kpiCard}>
            <View style={styles.kpiContent}>
              <View style={[styles.kpiIcon, { backgroundColor: AppleDesign.Colors.systemPurple + '20' }]}>
                <Ionicons name="speedometer" size={24} color={AppleDesign.Colors.systemPurple} />
              </View>
              <Text style={styles.kpiValue}>{data.vehicles.averageUtilization}%</Text>
              <Text style={styles.kpiLabel}>Využitie</Text>
              <Text style={styles.kpiSubtext}>{data.vehicles.active}/{data.vehicles.total} aktívnych</Text>
            </View>
          </AppleCard>

          <AppleCard style={styles.kpiCard}>
            <View style={styles.kpiContent}>
              <View style={[styles.kpiIcon, { backgroundColor: AppleDesign.Colors.systemYellow + '20' }]}>
                <Ionicons name="star" size={24} color={AppleDesign.Colors.systemYellow} />
              </View>
              <Text style={styles.kpiValue}>{data.customers.averageRating}</Text>
              <Text style={styles.kpiLabel}>Hodnotenie</Text>
              <Text style={styles.kpiSubtext}>{data.customers.total} zákazníkov</Text>
            </View>
          </AppleCard>
        </View>
      </OptimizedSlideIn>

      <OptimizedSlideIn delay={400} direction="up">
        <AppleCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Mesačné príjmy</Text>
          <SimpleBarChart data={data.revenue.monthlyData} />
        </AppleCard>
      </OptimizedSlideIn>

      <OptimizedSlideIn delay={500} direction="up">
        <AppleCard style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Kľúčové poznatky</Text>
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <Ionicons name="trending-up" size={16} color={AppleDesign.Colors.systemGreen} />
              <Text style={styles.insightText}>
                Príjmy rastú o {data.revenue.growth}% oproti minulému obdobiu
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="calendar" size={16} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.insightText}>
                Najlepšie mesiace: {data.seasonal.peakMonths.join(', ')}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="people" size={16} color={AppleDesign.Colors.systemPurple} />
              <Text style={styles.insightText}>
                {((data.customers.returning / data.customers.total) * 100).toFixed(1)}% zákazníkov sa vracia
              </Text>
            </View>
          </View>
        </AppleCard>
      </OptimizedSlideIn>
    </View>
  );
}

// Revenue Report Component
function RevenueReport({ data }: { data: AnalyticsData['revenue'] }) {
  return (
    <View style={styles.reportSection}>
      <OptimizedSlideIn delay={300} direction="up">
        <AppleCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Príjmový súhrn</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>€{data.total.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Celkový príjem</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>€{data.net.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Čistý príjem</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: AppleDesign.Colors.systemGreen }]}>
                +{data.growth}%
              </Text>
              <Text style={styles.summaryLabel}>Rast</Text>
            </View>
          </View>
        </AppleCard>
      </OptimizedSlideIn>

      <OptimizedSlideIn delay={400} direction="up">
        <AppleCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Mesačný vývoj príjmov</Text>
          <SimpleBarChart data={data.monthlyData} />
        </AppleCard>
      </OptimizedSlideIn>
    </View>
  );
}

// Bookings Report Component
function BookingsReport({ data }: { data: AnalyticsData['bookings'] }) {
  return (
    <View style={styles.reportSection}>
      <OptimizedSlideIn delay={300} direction="up">
        <AppleCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Rezervácie súhrn</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.total}</Text>
              <Text style={styles.summaryLabel}>Celkom</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: AppleDesign.Colors.systemGreen }]}>
                {data.completed}
              </Text>
              <Text style={styles.summaryLabel}>Dokončené</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: AppleDesign.Colors.systemRed }]}>
                {data.cancelled}
              </Text>
              <Text style={styles.summaryLabel}>Zrušené</Text>
            </View>
          </View>
        </AppleCard>
      </OptimizedSlideIn>

      <OptimizedSlideIn delay={400} direction="up">
        <AppleCard style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Kľúčové metriky</Text>
          <View style={styles.metricsList}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Konverzný pomer</Text>
              <Text style={styles.metricValue}>{data.conversionRate}%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Priemerná hodnota</Text>
              <Text style={styles.metricValue}>€{data.averageValue}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Rast rezervácií</Text>
              <Text style={[styles.metricValue, { color: AppleDesign.Colors.systemGreen }]}>
                +{data.growth}%
              </Text>
            </View>
          </View>
        </AppleCard>
      </OptimizedSlideIn>
    </View>
  );
}

// Vehicles Report Component
function VehiclesReport({ data }: { data: AnalyticsData['vehicles'] }) {
  return (
    <View style={styles.reportSection}>
      <OptimizedSlideIn delay={300} direction="up">
        <AppleCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Vozidlá súhrn</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.total}</Text>
              <Text style={styles.summaryLabel}>Celkom</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: AppleDesign.Colors.systemGreen }]}>
                {data.active}
              </Text>
              <Text style={styles.summaryLabel}>Aktívne</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.averageUtilization}%</Text>
              <Text style={styles.summaryLabel}>Priem. využitie</Text>
            </View>
          </View>
        </AppleCard>
      </OptimizedSlideIn>

      <OptimizedSlideIn delay={400} direction="up">
        <AppleCard style={styles.topPerformersCard}>
          <Text style={styles.topPerformersTitle}>Top vozidlá</Text>
          {data.topPerformers.map((vehicle, index) => (
            <View key={vehicle.id} style={styles.performerItem}>
              <View style={styles.performerRank}>
                <Text style={styles.performerRankText}>{index + 1}</Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{vehicle.name}</Text>
                <Text style={styles.performerStats}>
                  €{vehicle.revenue} • {vehicle.bookings} rezervácií • {vehicle.utilization}%
                </Text>
              </View>
            </View>
          ))}
        </AppleCard>
      </OptimizedSlideIn>
    </View>
  );
}

// Customers Report Component
function CustomersReport({ data }: { data: AnalyticsData['customers'] }) {
  return (
    <View style={styles.reportSection}>
      <OptimizedSlideIn delay={300} direction="up">
        <AppleCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Zákazníci súhrn</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data.total}</Text>
              <Text style={styles.summaryLabel}>Celkom</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: AppleDesign.Colors.systemBlue }]}>
                {data.returning}
              </Text>
              <Text style={styles.summaryLabel}>Vracajúci sa</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: AppleDesign.Colors.systemGreen }]}>
                {data.newCustomers}
              </Text>
              <Text style={styles.summaryLabel}>Noví</Text>
            </View>
          </View>
        </AppleCard>
      </OptimizedSlideIn>

      <OptimizedSlideIn delay={400} direction="up">
        <AppleCard style={styles.demographicsCard}>
          <Text style={styles.demographicsTitle}>Vekové skupiny</Text>
          {data.demographics.ageGroups.map((group) => (
            <View key={group.range} style={styles.demographicItem}>
              <Text style={styles.demographicLabel}>{group.range}</Text>
              <View style={styles.demographicBar}>
                <View
                  style={[
                    styles.demographicFill,
                    { width: `${group.percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.demographicValue}>{group.percentage}%</Text>
            </View>
          ))}
        </AppleCard>
      </OptimizedSlideIn>
    </View>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data }: { data: { month: string; revenue: number; bookings: number }[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((item, index) => (
          <View key={index} style={styles.chartBarContainer}>
            <View
              style={[
                styles.chartBar,
                {
                  height: (item.revenue / maxRevenue) * 120,
                  backgroundColor: AppleDesign.Colors.systemBlue,
                },
              ]}
            />
            <Text style={styles.chartBarLabel}>{item.month}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  loadingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.md,
  },
  headerTitle: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.xs,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.md,
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
  
  // Report Selector
  reportScroll: {
    marginBottom: AppleDesign.Spacing.md,
  },
  reportContainer: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.sm,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.xs,
  },
  reportButtonActive: {
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  reportButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },
  reportButtonTextActive: {
    color: 'white',
  },
  
  // Report Content
  reportContent: {
    flex: 1,
    paddingHorizontal: AppleDesign.Spacing.lg,
  },
  reportSection: {
    paddingBottom: AppleDesign.Spacing.xl,
  },
  
  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.lg,
  },
  kpiCard: {
    width: (screenWidth - AppleDesign.Spacing.lg * 2 - AppleDesign.Spacing.md) / 2,
  },
  kpiContent: {
    padding: AppleDesign.Spacing.lg,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  kpiValue: {
    ...AppleDesign.Typography.title1,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.xs,
  },
  kpiLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: AppleDesign.Spacing.xs,
  },
  kpiGrowth: {
    ...AppleDesign.Typography.caption1,
    fontWeight: '600',
  },
  kpiSubtext: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  
  // Chart Card
  chartCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  chartTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  chartContainer: {
    height: 160,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingHorizontal: AppleDesign.Spacing.sm,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderRadius: 2,
    marginBottom: AppleDesign.Spacing.sm,
  },
  chartBarLabel: {
    ...AppleDesign.Typography.caption2,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  
  // Summary Card
  summaryCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  summaryTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.xs,
  },
  summaryLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  
  // Metrics Card
  metricsCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  metricsTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  metricsList: {
    gap: AppleDesign.Spacing.md,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  metricValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  
  // Top Performers Card
  topPerformersCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  topPerformersTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  performerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppleDesign.Colors.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  performerRankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  performerStats: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Demographics Card
  demographicsCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  demographicsTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  demographicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
    gap: AppleDesign.Spacing.md,
  },
  demographicLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    width: 60,
  },
  demographicBar: {
    flex: 1,
    height: 8,
    backgroundColor: AppleDesign.Colors.systemGray5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  demographicFill: {
    height: '100%',
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  demographicValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  
  // Insights Card
  insightsCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  insightsTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  insightsList: {
    gap: AppleDesign.Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AppleDesign.Spacing.sm,
  },
  insightText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    flex: 1,
    lineHeight: 22,
  },
});
