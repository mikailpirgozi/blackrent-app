/**
 * Vehicle Detail Screen
 * Displays comprehensive vehicle information with gallery, specs, and booking CTA
 * Enhanced with Light/Dark mode support
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  FlatList,
  type ListRenderItem,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicleById } from '../../hooks/api/use-vehicles';
import { AppleDesign } from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../i18n/utils/formatters';
import type { Vehicle, PricingTier } from '../../types/vehicle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

/**
 * Get vehicle placeholder image
 */
function getVehiclePlaceholderImage(category?: string, index: number = 0): string {
  const categoryImages: Record<string, string[]> = {
    'nizka-trieda': [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    ],
    'stredna-trieda': [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop',
    ],
    'suv': [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=600&fit=crop',
    ],
  };

  const images = categoryImages[category || 'stredna-trieda'] || categoryImages['stredna-trieda'];
  return images[index % images.length];
}

/**
 * Image Gallery Component
 */
interface ImageGalleryProps {
  images: string[];
  vehicleName: string;
}

function ImageGallery({ images, vehicleName }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderImage: ListRenderItem<string> = ({ item }) => (
    <Image
      source={{ uri: item }}
      style={styles.galleryImage}
      resizeMode="cover"
    />
  );

  const onScroll = useCallback((event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentIndex(index);
  }, []);

  return (
    <View style={styles.galleryContainer}>
      <FlatList
        data={images}
        renderItem={renderImage}
        keyExtractor={(_, index) => `image-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      
      {/* Image Counter */}
      <View style={styles.imageCounter}>
        <Text style={styles.imageCounterText}>
          {currentIndex + 1} / {images.length}
        </Text>
      </View>
    </View>
  );
}

/**
 * Dynamic styles based on theme
 */
function createDynamicStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.dynamicColors.background,
    },
    text: {
      color: theme.dynamicColors.text,
    },
    secondaryText: {
      color: theme.dynamicColors.secondaryText,
    },
    divider: {
      backgroundColor: theme.dynamicColors.separator,
    },
    headerButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
    },
    bottomBar: {
      backgroundColor: theme.dynamicColors.cardBackground,
      borderTopColor: theme.dynamicColors.separator,
    },
  });
}

/**
 * Pricing Tier Card
 */
interface PricingTierCardProps {
  tier: PricingTier;
  isDark: boolean;
  theme: any;
}

function PricingTierCard({ tier, isDark, theme }: PricingTierCardProps) {
  const { t } = useTranslation(['vehicle', 'common']);
  
  const daysText = tier.maxDays === 999 
    ? `${tier.minDays}+ ${t('common:time.day_many')}`
    : `${tier.minDays}-${tier.maxDays} ${t('common:time.day_many')}`;

  return (
    <View style={[
      styles.pricingTierCard,
      { backgroundColor: isDark ? theme.colors.dark.tertiarySystemFill : theme.colors.tertiarySystemFill }
    ]}>
      <View style={styles.pricingTierHeader}>
        <Text style={[styles.pricingTierDays, { color: theme.dynamicColors.secondaryText }]}>
          {daysText}
        </Text>
        <Text style={[styles.pricingTierPrice, { color: theme.dynamicColors.text }]}>
          {formatCurrency(tier.pricePerDay)} {t('vehicle:perDay')}
        </Text>
      </View>
    </View>
  );
}

/**
 * Main Vehicle Detail Screen
 */
export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation(['vehicle', 'catalog', 'common']);
  const { theme, isDark } = useTheme();
  
  const { data: vehicle, isLoading, error } = useVehicleById(id);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => createDynamicStyles(theme, isDark), [theme, isDark]);

  const handleBookNow = useCallback(() => {
    router.push(`/booking/${id}`);
  }, [id, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
          <Text style={[styles.loadingText, dynamicStyles.text]}>
            {t('common:labels.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.semantic.error} />
          <Text style={[styles.errorTitle, dynamicStyles.text]}>
            {t('common:errors.notFound')}
          </Text>
          <Text style={[styles.errorText, dynamicStyles.secondaryText]}>
            {t('vehicle:vehicleNotFound')}
          </Text>
          <TouchableOpacity 
            style={[styles.errorButton, { backgroundColor: theme.brand.primary }]} 
            onPress={handleBack}
          >
            <Text style={styles.errorButtonText}>{t('common:buttons.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Prepare data
  const vehicleName = vehicle.name || `${vehicle.brand} ${vehicle.model}`;
  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : Array.from({ length: 3 }, (_, i) => getVehiclePlaceholderImage(vehicle.category, i));
  
  const lowestPrice = vehicle.pricing && vehicle.pricing.length > 0
    ? Math.min(...vehicle.pricing.map(tier => tier.pricePerDay))
    : 0;

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, dynamicStyles.headerButton]} 
          onPress={handleBack}
          testID="back-button"
        >
          <Ionicons name="chevron-back" size={28} color={theme.dynamicColors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.favoriteButton, dynamicStyles.headerButton]} 
          testID="favorite-button"
        >
          <Ionicons name="heart-outline" size={24} color={theme.dynamicColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <ImageGallery images={images} vehicleName={vehicleName} />

        {/* Vehicle Info */}
        <View style={styles.infoContainer}>
          {/* Title & Category */}
          <View style={styles.titleSection}>
            <Text style={[styles.vehicleName, dynamicStyles.text]}>{vehicleName}</Text>
            {vehicle.category && (
              <View style={[styles.categoryBadge, { backgroundColor: `${theme.brand.primary}20` }]}>
                <Text style={[styles.categoryText, { color: theme.brand.primary }]}>
                  {t(`catalog:categories.${vehicle.category}`)}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            {vehicle.year && (
              <View style={styles.statItem}>
                <Ionicons 
                  name="calendar-outline" 
                  size={20} 
                  color={theme.dynamicColors.secondaryText} 
                />
                <Text style={[styles.statText, dynamicStyles.secondaryText]}>
                  {vehicle.year}
                </Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Ionicons 
                name="car-outline" 
                size={20} 
                color={theme.dynamicColors.secondaryText} 
              />
              <Text style={[styles.statText, dynamicStyles.secondaryText]}>
                {vehicle.licensePlate}
              </Text>
            </View>
            {vehicle.status && (
              <View style={styles.statItem}>
                <Ionicons 
                  name={vehicle.status === 'available' ? 'checkmark-circle' : 'time-outline'} 
                  size={20} 
                  color={vehicle.status === 'available' ? theme.semantic.success : theme.semantic.warning} 
                />
                <Text style={[styles.statText, dynamicStyles.secondaryText]}>
                  {t(`common:status.${vehicle.status}`)}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, dynamicStyles.divider]} />

          {/* Pricing Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              {t('vehicle:pricing.title')}
            </Text>
            <Text style={[styles.sectionSubtitle, dynamicStyles.secondaryText]}>
              {t('vehicle:pricing.subtitle')}
            </Text>
            
            {vehicle.pricing && vehicle.pricing.length > 0 ? (
              <View style={styles.pricingTiers}>
                {vehicle.pricing.map((tier, index) => (
                  <PricingTierCard key={`tier-${index}`} tier={tier} isDark={isDark} theme={theme} />
                ))}
              </View>
            ) : (
              <View style={[
                styles.pricingTierCard,
                { backgroundColor: isDark ? theme.colors.dark.tertiarySystemFill : theme.colors.tertiarySystemFill }
              ]}>
                <Text style={[styles.pricingTierPrice, dynamicStyles.text]}>
                  {formatCurrency(lowestPrice)} {t('vehicle:perDay')}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, dynamicStyles.divider]} />

          {/* Vehicle Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              {t('vehicle:details.title')}
            </Text>
            
            <View style={styles.detailsGrid}>
              {vehicle.vin && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, dynamicStyles.secondaryText]}>
                    {t('vehicle:details.vin')}
                  </Text>
                  <Text style={[styles.detailValue, dynamicStyles.text]}>
                    {vehicle.vin}
                  </Text>
                </View>
              )}
              {vehicle.ownerCompanyId && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, dynamicStyles.secondaryText]}>
                    {t('vehicle:details.company')}
                  </Text>
                  <Text style={[styles.detailValue, dynamicStyles.text]}>
                    {vehicle.company || vehicle.ownerCompanyId}
                  </Text>
                </View>
              )}
              {vehicle.extraKilometerRate && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, dynamicStyles.secondaryText]}>
                    {t('vehicle:details.extraKmRate')}
                  </Text>
                  <Text style={[styles.detailValue, dynamicStyles.text]}>
                    {formatCurrency(vehicle.extraKilometerRate)} / km
                  </Text>
                </View>
              )}
              {vehicle.stk && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, dynamicStyles.secondaryText]}>
                    {t('vehicle:details.stk')}
                  </Text>
                  <Text style={[styles.detailValue, dynamicStyles.text]}>
                    {new Date(vehicle.stk).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, dynamicStyles.divider]} />

          {/* Commission Info */}
          {vehicle.commission && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                {t('vehicle:commission.title')}
              </Text>
              <View style={[
                styles.commissionCard,
                { backgroundColor: `${theme.brand.primary}10` }
              ]}>
                <Text style={[styles.commissionText, { color: theme.brand.primary }]}>
                  {vehicle.commission.type === 'percentage'
                    ? `${vehicle.commission.value}%`
                    : formatCurrency(vehicle.commission.value)}
                </Text>
              </View>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, dynamicStyles.bottomBar]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, dynamicStyles.secondaryText]}>
            {t('vehicle:from')}
          </Text>
          <Text style={[styles.priceAmount, dynamicStyles.text]}>
            {formatCurrency(lowestPrice)} {t('vehicle:perDay')}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.bookButton, { backgroundColor: theme.brand.primary }]}
          onPress={handleBookNow}
          testID="book-now-button"
        >
          <Text style={styles.bookButtonText}>{t('common:buttons.bookNow')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  
  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingTop: 50,
    paddingBottom: AppleDesign.Spacing.md,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...AppleDesign.Shadows.small,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...AppleDesign.Shadows.small,
  },
  
  // Loading/Error states
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: AppleDesign.Spacing.xl,
    gap: AppleDesign.Spacing.md,
  },
  errorTitle: {
    ...AppleDesign.Typography.title1,
    color: AppleDesign.Colors.label,
    textAlign: 'center',
  },
  errorText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: AppleDesign.Spacing.lg,
    paddingHorizontal: AppleDesign.Spacing.xl,
    paddingVertical: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
  },
  errorButtonText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    fontWeight: '600',
  },
  
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Gallery
  galleryContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
  },
  imageCounter: {
    position: 'absolute',
    bottom: AppleDesign.Spacing.md,
    right: AppleDesign.Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AppleDesign.BorderRadius.badge,
  },
  imageCounterText: {
    ...AppleDesign.Typography.caption1,
    color: 'white',
    fontWeight: '600',
  },
  
  // Info Container
  infoContainer: {
    padding: AppleDesign.Spacing.lg,
  },
  
  // Title Section
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.md,
  },
  vehicleName: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    flex: 1,
    marginRight: AppleDesign.Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AppleDesign.BorderRadius.badge,
  },
  categoryText: {
    ...AppleDesign.Typography.caption1,
    color: 'white',
    fontWeight: '600',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Sections
  divider: {
    height: 1,
    backgroundColor: AppleDesign.Colors.separator,
    marginVertical: AppleDesign.Spacing.lg,
  },
  section: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  sectionTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    marginBottom: AppleDesign.Spacing.xs,
  },
  sectionSubtitle: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.md,
  },
  
  // Pricing
  pricingTiers: {
    gap: AppleDesign.Spacing.sm,
  },
  pricingTierCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.card,
    padding: AppleDesign.Spacing.md,
  },
  pricingTierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingTierDays: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  pricingTierPrice: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },
  
  // Details
  detailsGrid: {
    gap: AppleDesign.Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  detailValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  
  // Commission
  commissionCard: {
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.card,
    padding: AppleDesign.Spacing.md,
    alignItems: 'center',
  },
  commissionText: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    paddingBottom: AppleDesign.Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
    ...AppleDesign.Shadows.large,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  priceAmount: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },
  bookButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    paddingHorizontal: AppleDesign.Spacing.xl,
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.button,
    ...AppleDesign.Shadows.small,
  },
  bookButtonText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    fontWeight: '700',
  },
});
