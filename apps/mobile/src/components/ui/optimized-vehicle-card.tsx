/**
 * 🚗 Optimalizovaný Vehicle Card komponent
 * Používa React.memo pre performance optimalizáciu
 */

import React, { memo, useCallback } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SmartImage } from './smart-image';
import { theme } from '../../styles/theme';
import { BaseCard, BaseText } from './base-components';
import type { Vehicle } from '../../types';

// ===================================
// 🎯 PROPS INTERFACE
// ===================================
interface OptimizedVehicleCardProps {
  vehicle: Vehicle;
  onPress: (vehicle: Vehicle) => void;
  showFavorite?: boolean;
  onFavoritePress?: (vehicleId: string) => void;
  isFavorite?: boolean;
  compact?: boolean;
}

// ===================================
// 🚗 OPTIMIZED VEHICLE CARD
// ===================================
const OptimizedVehicleCard: React.FC<OptimizedVehicleCardProps> = memo(({
  vehicle,
  onPress,
  showFavorite = false,
  onFavoritePress,
  isFavorite = false,
  compact = false,
}) => {
  // Memoized handlers
  const handlePress = useCallback(() => {
    onPress(vehicle);
  }, [onPress, vehicle]);

  const handleFavoritePress = useCallback(() => {
    if (onFavoritePress) {
      onFavoritePress(vehicle.id);
    }
  }, [onFavoritePress, vehicle.id]);

  // Memoized price calculation
  const pricePerDay = React.useMemo(() => {
    return vehicle.pricePerDay?.toFixed(0) || '0';
  }, [vehicle.pricePerDay]);

  // Memoized availability status
  const availabilityStatus = React.useMemo(() => {
    return (vehicle as any).available ? 'Dostupné' : 'Nedostupné';
  }, [(vehicle as any).available]);

  // Memoized rating display
  const ratingDisplay = React.useMemo(() => {
    if (!vehicle.rating) return null;
    if (typeof vehicle.rating === 'number') {
      return (vehicle.rating as number).toFixed(1);
    }
    if (vehicle.rating && typeof vehicle.rating === 'object' && 'average' in vehicle.rating) {
      return (vehicle.rating as any).average?.toFixed(1);
    }
    return null;
  }, [vehicle.rating]);

  return (
    <BaseCard variant="default" style={[styles.card, compact && styles.compactCard]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <SmartImage
            images={[vehicle.images?.[0] || 'assets/placeholder-car.jpg']}
            style={[styles.image, ...(compact ? [styles.compactImage] : [])]}
          />
          
          {/* Favorite Button */}
          {showFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? theme.semantic.error : theme.colors.secondaryLabel}
              />
            </TouchableOpacity>
          )}

          {/* Availability Badge */}
          <View style={[
            styles.availabilityBadge,
            (vehicle as any).available ? styles.availableBadge : styles.unavailableBadge
          ]}>
            <BaseText
              variant="caption2"
              color={(vehicle as any).available ? 'success' : 'error'}
              style={styles.availabilityText}
            >
              {availabilityStatus}
            </BaseText>
          </View>
        </View>

        {/* Content Container */}
        <View style={[styles.content, compact && styles.compactContent]}>
          {/* Vehicle Info */}
          <View style={styles.vehicleInfo}>
            <BaseText
              variant={compact ? 'subheadline' : 'headline'}
              color="primary"
              numberOfLines={1}
              style={styles.vehicleName}
            >
              {vehicle.make} {vehicle.model}
            </BaseText>
            
            {!compact && (
              <BaseText
                variant="footnote"
                color="secondary"
                numberOfLines={1}
                style={styles.vehicleDetails}
              >
                {vehicle.year} • {(vehicle as any).fuelType} • {vehicle.transmission}
              </BaseText>
            )}
          </View>

          {/* Price and Rating Row */}
          <View style={styles.bottomRow}>
            {/* Price */}
            <View style={styles.priceContainer}>
              <BaseText variant="headline" color="brand" style={styles.price}>
                €{pricePerDay}
              </BaseText>
              <BaseText variant="caption2" color="secondary">
                /deň
              </BaseText>
            </View>

            {/* Rating */}
            {ratingDisplay && (
              <View style={styles.ratingContainer}>
                <Ionicons
                  name="star"
                  size={14}
                  color={theme.semantic.warning}
                />
                <BaseText variant="caption1" color="secondary" style={styles.ratingText}>
                  {ratingDisplay}
                </BaseText>
              </View>
            )}
          </View>

          {/* Location (if not compact) */}
          {!compact && vehicle.location && (
            <View style={styles.locationContainer}>
              <Ionicons
                name="location-outline"
                size={12}
                color={theme.colors.tertiaryLabel}
              />
              <BaseText
                variant="caption2"
                color="muted"
                numberOfLines={1}
                style={styles.locationText}
              >
                {vehicle.location?.city || 'Neznáme'}
              </BaseText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </BaseCard>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.vehicle.id === nextProps.vehicle.id &&
    prevProps.vehicle.pricePerDay === nextProps.vehicle.pricePerDay &&
    (prevProps.vehicle as any).available === (nextProps.vehicle as any).available &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.compact === nextProps.compact &&
    prevProps.showFavorite === nextProps.showFavorite
  );
});

// ===================================
// 🎨 STYLES
// ===================================
const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    overflow: 'hidden',
  },
  compactCard: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: theme.borderRadius.card,
    borderTopRightRadius: theme.borderRadius.card,
  },
  compactImage: {
    height: 140,
  },
  favoriteButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: theme.spacing.sm,
    ...theme.shadows.button,
  },
  availabilityBadge: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  availableBadge: {
    backgroundColor: theme.semantic.success,
  },
  unavailableBadge: {
    backgroundColor: theme.semantic.error,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    padding: theme.spacing.lg,
  },
  compactContent: {
    padding: theme.spacing.md,
  },
  vehicleInfo: {
    marginBottom: theme.spacing.md,
  },
  vehicleName: {
    marginBottom: theme.spacing.xs,
  },
  vehicleDetails: {
    // Additional styles if needed
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    marginRight: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: theme.spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
});

// Set display name for debugging
OptimizedVehicleCard.displayName = 'OptimizedVehicleCard';

export default OptimizedVehicleCard;
export { OptimizedVehicleCard };
export type { OptimizedVehicleCardProps };
