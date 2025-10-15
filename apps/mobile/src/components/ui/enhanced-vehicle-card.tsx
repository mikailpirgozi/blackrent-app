/**
 * EnhancedVehicleCard Component
 * Displays vehicle information with modern Apple-style design
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, type TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Vehicle } from '../../types/vehicle';
import { AppleDesign } from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { formatCurrency } from '../../i18n/utils/formatters';

interface EnhancedVehicleCardProps extends TouchableOpacityProps {
  vehicle: Vehicle;
  onPress?: () => void;
}

/**
 * Get placeholder image for vehicle
 * Returns a placeholder image URL based on vehicle category
 */
function getVehiclePlaceholderImage(category?: string): string {
  // Map categories to Unsplash car images
  const categoryImages: Record<string, string> = {
    'nizka-trieda': 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop&auto=format',
    'stredna-trieda': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop&auto=format',
    'vyssia-stredna': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop&auto=format',
    'luxusne': 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=400&h=300&fit=crop&auto=format',
    'sportove': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&auto=format',
    'suv': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=300&fit=crop&auto=format',
    'viacmiestne': 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=400&h=300&fit=crop&auto=format',
    'dodavky': 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=400&h=300&fit=crop&auto=format',
  };

  return categoryImages[category || 'stredna-trieda'] || categoryImages['stredna-trieda'];
}

/**
 * Get vehicle status badge config
 */
function getStatusBadge(status: string): { icon: keyof typeof Ionicons.glyphMap; color: string; textKey: string } {
  switch (status) {
    case 'available':
      return { icon: 'checkmark-circle', color: AppleDesign.Colors.systemGreen, textKey: 'common:status.available' };
    case 'rented':
      return { icon: 'car', color: AppleDesign.Colors.systemOrange, textKey: 'common:status.rented' };
    case 'maintenance':
      return { icon: 'construct', color: AppleDesign.Colors.systemYellow, textKey: 'common:status.maintenance' };
    default:
      return { icon: 'remove-circle', color: AppleDesign.Colors.systemRed, textKey: 'common:status.unavailable' };
  }
}

/**
 * Get lowest price from pricing tiers
 */
function getLowestPrice(vehicle: Vehicle): number {
  if (!vehicle.pricing || vehicle.pricing.length === 0) {
    return 0;
  }
  return Math.min(...vehicle.pricing.map((tier) => tier.pricePerDay));
}

export function EnhancedVehicleCard({ vehicle, onPress, ...props }: EnhancedVehicleCardProps) {
  const { t } = useTranslation(['common', 'catalog']);
  
  // Get vehicle image (use first image or placeholder)
  const imageUrl = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images[0] 
    : getVehiclePlaceholderImage(vehicle.category);
  
  // Get vehicle display name
  const vehicleName = vehicle.name || `${vehicle.brand} ${vehicle.model}`;
  
  // Get lowest price
  const lowestPrice = getLowestPrice(vehicle);
  
  // Get status badge
  const statusBadge = getStatusBadge(vehicle.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`vehicle-card-${vehicle.id}`}
      {...props}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
          <Ionicons name={statusBadge.icon} size={12} color="white" />
          <Text style={styles.statusText}>{t(statusBadge.textKey)}</Text>
        </View>
        
        {/* Year Badge (if available) */}
        {vehicle.year && (
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{vehicle.year}</Text>
          </View>
        )}
      </View>

      {/* Content Container */}
      <View style={styles.content}>
        {/* Vehicle Name */}
        <Text style={styles.vehicleName} numberOfLines={1}>
          {vehicleName}
        </Text>
        
        {/* Category & License Plate */}
        <View style={styles.metaRow}>
          {vehicle.category && (
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag-outline" size={12} color={AppleDesign.Colors.secondaryLabel} />
              <Text style={styles.categoryText}>{t(`catalog:categories.${vehicle.category}`)}</Text>
            </View>
          )}
          <Text style={styles.licensePlate}>{vehicle.licensePlate}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Price & Action Row */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>{formatCurrency(lowestPrice)}</Text>
            <Text style={styles.priceLabel}>{t('catalog:perDay')}</Text>
          </View>
          
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{t('common:buttons.viewDetails')}</Text>
            <Ionicons name="chevron-forward" size={16} color={AppleDesign.Colors.systemBlue} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.card,
    marginBottom: AppleDesign.Spacing.md,
    overflow: 'hidden',
    ...AppleDesign.Shadows.card,
  },
  
  // Image
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  
  // Status Badge
  statusBadge: {
    position: 'absolute',
    top: AppleDesign.Spacing.sm,
    left: AppleDesign.Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppleDesign.BorderRadius.badge,
  },
  statusText: {
    ...AppleDesign.Typography.caption2,
    color: 'white',
    fontWeight: '600',
  },
  
  // Year Badge
  yearBadge: {
    position: 'absolute',
    top: AppleDesign.Spacing.sm,
    right: AppleDesign.Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppleDesign.BorderRadius.badge,
  },
  yearText: {
    ...AppleDesign.Typography.caption2,
    color: 'white',
    fontWeight: '600',
  },
  
  // Content
  content: {
    padding: AppleDesign.Spacing.md,
  },
  vehicleName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    marginBottom: AppleDesign.Spacing.xs,
  },
  
  // Meta Row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppleDesign.Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.badge,
  },
  categoryText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  licensePlate: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.tertiaryLabel,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: AppleDesign.Colors.separator,
    marginVertical: AppleDesign.Spacing.sm,
  },
  
  // Price Row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },
  priceLabel: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
});

