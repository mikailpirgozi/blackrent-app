/**
 * 🎯 Recommended Vehicles Component
 * AI-powered vehicle recommendations with reasoning
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { SmartImage } from '../smart-image';
import { PersonalizedRecommendation } from '../../../services/personalization-service';

// Mock vehicle data - in production, fetch from API
const mockVehicles: { [key: string]: any } = {
  '1': {
    id: '1',
    make: 'BMW',
    model: 'X5',
    pricePerDay: 85,
    rating: 4.8,
    images: ['assets/images/vehicles/hero-image-1.webp'],
    location: 'Bratislava',
  },
  '2': {
    id: '2',
    make: 'Audi',
    model: 'Q7',
    pricePerDay: 95,
    rating: 4.6,
    images: ['assets/images/vehicles/hero-image-2.webp'],
    location: 'Bratislava',
  },
  '3': {
    id: '3',
    make: 'Mercedes',
    model: 'GLE',
    pricePerDay: 90,
    rating: 4.9,
    images: ['assets/images/vehicles/hero-image-3.webp'],
    location: 'Košice',
  },
};

interface RecommendedVehiclesProps {
  recommendations: PersonalizedRecommendation[];
  onVehiclePress: (vehicleId: string) => void;
  onSeeAllPress: () => void;
}

export function RecommendedVehicles({
  recommendations,
  onVehiclePress,
  onSeeAllPress,
}: RecommendedVehiclesProps) {
  const { t } = useTranslation();

  const _getRecommendationIcon = (type: PersonalizedRecommendation['type']) => {
    switch (type) {
      case 'similar_to_history':
        return 'time';
      case 'price_match':
        return 'pricetag';
      case 'feature_match':
        return 'checkmark-circle';
      case 'trending':
        return 'trending-up';
      case 'new_arrival':
        return 'sparkles';
      default:
        return 'star';
    }
  };

  const _getRecommendationColor = (type: PersonalizedRecommendation['type']) => {
    switch (type) {
      case 'similar_to_history':
        return AppleDesign.Colors.systemBlue;
      case 'price_match':
        return AppleDesign.Colors.systemGreen;
      case 'feature_match':
        return AppleDesign.Colors.systemPurple;
      case 'trending':
        return AppleDesign.Colors.systemOrange;
      case 'new_arrival':
        return AppleDesign.Colors.systemYellow;
      default:
        return AppleDesign.Colors.systemGray;
    }
  };


  if (recommendations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={48} color={AppleDesign.Colors.systemGray3} />
        <Text style={styles.emptyTitle}>Žiadne odporúčania</Text>
        <Text style={styles.emptyText}>
          Začnite vyhľadávať vozidlá a my vám pripravíme personalizované odporúčania.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="star" size={20} color={AppleDesign.Colors.systemBlue} />
          <Text style={styles.title}>Odporúčané pre vás</Text>
        </View>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>Zobraziť všetko</Text>
        </TouchableOpacity>
      </View>

      {/* Recommendations List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {recommendations.slice(0, 5).map((item, index) => (
          <React.Fragment key={item.vehicleId}>
            <RecommendationCard
              recommendation={item}
              vehicle={mockVehicles[item.vehicleId]}
              onPress={() => onVehiclePress(item.vehicleId)}
            />
            {index < recommendations.slice(0, 5).length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Individual recommendation card component
 */
function RecommendationCard({ 
  recommendation, 
  vehicle,
  onPress 
}: { 
  recommendation: PersonalizedRecommendation; 
  vehicle?: any;
  onPress: () => void;
}) {
  if (!vehicle) return null;
  return (
    <TouchableOpacity
      style={styles.recommendationCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Vehicle Image */}
      <SmartImage
        images={vehicle.images}
        style={styles.vehicleImage}
      />

      {/* Vehicle Info */}
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName} numberOfLines={1}>
          {vehicle.make} {vehicle.model}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            €{vehicle.pricePerDay}/deň
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color={AppleDesign.Colors.systemYellow} />
            <Text style={styles.rating}>
              {vehicle.rating ? vehicle.rating.toFixed(1) : '4.5'}
            </Text>
          </View>
        </View>

        {/* Recommendation Reason */}
        <View style={styles.reasonsContainer}>
          <Text style={styles.reasonText} numberOfLines={2}>
            {recommendation.reasons[0] || 'Odporúčané pre vás'}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              {Math.round(recommendation.score * 100)}% match
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: AppleDesign.Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
    marginBottom: AppleDesign.Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginLeft: AppleDesign.Spacing.sm,
  },
  seeAllText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
  },
  separator: {
    width: AppleDesign.Spacing.md,
  },
  recommendationCard: {
    width: 280,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderRadius: AppleDesign.BorderRadius.lg,
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  recommendationBadge: {
    position: 'absolute',
    top: AppleDesign.Spacing.sm,
    left: AppleDesign.Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    position: 'absolute',
    top: AppleDesign.Spacing.sm,
    right: AppleDesign.Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.xs,
    borderRadius: AppleDesign.BorderRadius.sm,
  },
  scoreTextWhite: {
    ...AppleDesign.Typography.caption2,
    color: 'white',
    fontWeight: '600',
  },
  vehicleInfo: {
    padding: AppleDesign.Spacing.md,
  },
  vehicleName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xs,
  },
  price: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginLeft: AppleDesign.Spacing.xs,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  scoreContainer: {
    backgroundColor: AppleDesign.Colors.systemBlue + '20',
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.xs,
    borderRadius: AppleDesign.BorderRadius.small,
  },
  scoreText: {
    ...AppleDesign.Typography.caption2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  location: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.sm,
  },
  reasonsContainer: {
    gap: AppleDesign.Spacing.xs,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppleDesign.Colors.systemBlue,
    marginRight: AppleDesign.Spacing.sm,
  },
  reasonText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.xxl,
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
  },
  emptyTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginTop: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.sm,
  },
  emptyText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
});
