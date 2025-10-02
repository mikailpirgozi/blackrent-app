/**
 * 🚗 EnhancedVehicleCard Component
 * Advanced vehicle card with ratings, availability, and quick actions
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { OptimizedFadeIn } from '../optimized-animations';
import { SmartImage } from '../smart-image';
import { PriceDisplay } from '../price-display';
import { RatingDisplay } from './rating-display';
import { AvailabilityBadge } from './availability-badge';

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  images: string[];
  pricePerDay: number;
  priceLevels?: {
    '1-2d': number;
    '3-6d': number;
    '7-13d': number;
    '14-29d': number;
    '30d+': number;
  };
  rating: {
    average: number;
    count: number;
  };
  features: {
    seats: number;
    transmission: 'manual' | 'automatic';
    fuel: string;
    doors: number;
    airConditioning: boolean;
    gps: boolean;
    bluetooth: boolean;
  };
  location: {
    city: string;
    distance?: number;
  };
  availability: {
    status: 'available' | 'limited' | 'unavailable';
    deliveryAvailable: boolean;
    deliveryFree: boolean;
    deliveryPrice?: number;
  };
  isPopular?: boolean;
  isFavorite?: boolean;
}

interface EnhancedVehicleCardProps {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
  onFavoritePress?: (vehicle: Vehicle) => void;
  onSharePress?: (vehicle: Vehicle) => void;
  onComparePress?: (vehicle: Vehicle) => void;
  showQuickActions?: boolean;
  style?: any;
}

export const EnhancedVehicleCard: React.FC<EnhancedVehicleCardProps> = ({
  vehicle,
  onPress,
  onFavoritePress,
  onSharePress,
  onComparePress,
  showQuickActions = true,
  style,
}) => {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const [imageIndex, setImageIndex] = useState(0);

  const handlePress = () => {
    haptic.light();
    onPress?.(vehicle);
  };

  const handleFavoritePress = () => {
    haptic.medium();
    onFavoritePress?.(vehicle);
  };

  const handleSharePress = () => {
    haptic.light();
    onSharePress?.(vehicle);
  };

  const handleComparePress = () => {
    haptic.light();
    onComparePress?.(vehicle);
  };

  const handleImageSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right' && imageIndex < vehicle.images.length - 1) {
      setImageIndex(imageIndex + 1);
    } else if (direction === 'left' && imageIndex > 0) {
      setImageIndex(imageIndex - 1);
    }
  };

  return (
    <OptimizedFadeIn delay={0}>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <SmartImage
            images={[vehicle.images[imageIndex]]}
            style={styles.vehicleImage}
          />
          
          {/* Image Navigation */}
          {vehicle.images.length > 1 && (
            <View style={styles.imageNavigation}>
              <TouchableOpacity
                style={[styles.navButton, imageIndex === 0 && styles.navButtonDisabled]}
                onPress={() => handleImageSwipe('left')}
                disabled={imageIndex === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={imageIndex === 0 ? AppleDesign.Colors.tertiaryLabel : 'white'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, imageIndex === vehicle.images.length - 1 && styles.navButtonDisabled]}
                onPress={() => handleImageSwipe('right')}
                disabled={imageIndex === vehicle.images.length - 1}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={imageIndex === vehicle.images.length - 1 ? AppleDesign.Colors.tertiaryLabel : 'white'}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Image Indicators */}
          {vehicle.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {vehicle.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === imageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Badges */}
          <View style={styles.badges}>
            <AvailabilityBadge availability={vehicle.availability} />
            {vehicle.isPopular && (
              <View style={styles.popularBadge}>
                <Ionicons name="flame" size={12} color="white" />
                <Text style={styles.popularText}>
                  {t('vehicle.popular', 'Populárne')}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          {showQuickActions && (
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionButton, vehicle.isFavorite && styles.actionButtonActive]}
                onPress={handleFavoritePress}
              >
                <Ionicons
                  name={vehicle.isFavorite ? 'heart' : 'heart-outline'}
                  size={16}
                  color={vehicle.isFavorite ? AppleDesign.Colors.systemRed : 'white'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSharePress}
              >
                <Ionicons name="share-outline" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleComparePress}
              >
                <Ionicons name="git-compare-outline" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Price Display */}
          <View style={styles.priceContainer}>
            <PriceDisplay
              price={vehicle.pricePerDay}
              priceLevels={vehicle.priceLevels}
              compact={true}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.vehicleName} numberOfLines={1}>
                {vehicle.name}
              </Text>
              <Text style={styles.vehicleCategory}>
                {vehicle.category}
              </Text>
            </View>
            <RatingDisplay
              rating={vehicle.rating.average}
              count={vehicle.rating.count}
              compact={true}
            />
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons
                name="people-outline"
                size={14}
                color={AppleDesign.Colors.secondaryLabel}
              />
              <Text style={styles.featureText}>
                {vehicle.features.seats} {t('vehicle.seats', 'miest')}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="car-outline"
                size={14}
                color={AppleDesign.Colors.secondaryLabel}
              />
              <Text style={styles.featureText}>
                {vehicle.features.transmission === 'automatic' 
                  ? t('vehicle.automatic', 'Automat') 
                  : t('vehicle.manual', 'Manuál')}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="location-outline"
                size={14}
                color={AppleDesign.Colors.secondaryLabel}
              />
              <Text style={styles.featureText}>
                {vehicle.location.city}
                {vehicle.location.distance && ` (${vehicle.location.distance}km)`}
              </Text>
            </View>
          </View>

          {/* Additional Features */}
          <View style={styles.additionalFeatures}>
            {vehicle.features.airConditioning && (
              <View style={styles.featureBadge}>
                <Ionicons name="snow-outline" size={12} color={AppleDesign.Colors.systemBlue} />
                <Text style={styles.featureBadgeText}>AC</Text>
              </View>
            )}
            {vehicle.features.gps && (
              <View style={styles.featureBadge}>
                <Ionicons name="navigate-outline" size={12} color={AppleDesign.Colors.systemBlue} />
                <Text style={styles.featureBadgeText}>GPS</Text>
              </View>
            )}
            {vehicle.features.bluetooth && (
              <View style={styles.featureBadge}>
                <Ionicons name="bluetooth-outline" size={12} color={AppleDesign.Colors.systemBlue} />
                <Text style={styles.featureBadgeText}>BT</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </OptimizedFadeIn>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    overflow: 'hidden',
    ...AppleDesign.Shadows.card,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  imageNavigation: {
    position: 'absolute',
    top: '50%',
    left: AppleDesign.Spacing.md,
    right: AppleDesign.Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    transform: [{ translateY: -12 }],
  },
  navButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: AppleDesign.Spacing.xs,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: AppleDesign.Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: 'white',
  },
  badges: {
    position: 'absolute',
    top: AppleDesign.Spacing.md,
    left: AppleDesign.Spacing.md,
    gap: AppleDesign.Spacing.xs,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.systemOrange,
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    ...AppleDesign.Typography.caption2,
    color: 'white',
    fontWeight: '600',
  },
  quickActions: {
    position: 'absolute',
    top: AppleDesign.Spacing.md,
    right: AppleDesign.Spacing.md,
    gap: AppleDesign.Spacing.xs,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: AppleDesign.Spacing.xs,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  priceContainer: {
    position: 'absolute',
    bottom: AppleDesign.Spacing.md,
    right: AppleDesign.Spacing.md,
  },
  content: {
    padding: AppleDesign.Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: AppleDesign.Spacing.md,
  },
  vehicleName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: 2,
  },
  vehicleCategory: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textTransform: 'capitalize',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: AppleDesign.Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  featureText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    fontSize: 11,
  },
  additionalFeatures: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.xs,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.systemBlue + '20',
    paddingHorizontal: AppleDesign.Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  featureBadgeText: {
    ...AppleDesign.Typography.caption2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
    fontSize: 10,
  },
});
