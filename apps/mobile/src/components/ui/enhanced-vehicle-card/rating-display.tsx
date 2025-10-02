/**
 * ⭐ RatingDisplay Component
 * Star rating display with count and styling options
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';

interface RatingDisplayProps {
  rating: number;
  count?: number;
  maxRating?: number;
  compact?: boolean;
  showCount?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  count,
  maxRating = 5,
  compact = false,
  showCount = true,
  size = 'medium',
  style,
}) => {
  const { t } = useTranslation();

  const getStarSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'medium': return 16;
      case 'large': return 20;
      default: return 16;
    }
  };

  const getTextStyle = () => {
    switch (size) {
      case 'small': return AppleDesign.Typography.caption2;
      case 'medium': return AppleDesign.Typography.caption1;
      case 'large': return AppleDesign.Typography.body;
      default: return AppleDesign.Typography.caption1;
    }
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons
          key={`full-${i}`}
          name="star"
          size={getStarSize()}
          color={AppleDesign.Colors.systemYellow}
        />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <Ionicons
          key="half"
          name="star-half"
          size={getStarSize()}
          color={AppleDesign.Colors.systemYellow}
        />
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={getStarSize()}
          color={AppleDesign.Colors.tertiaryLabel}
        />
      );
    }

    return stars;
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Ionicons
          name="star"
          size={getStarSize()}
          color={AppleDesign.Colors.systemYellow}
        />
        <Text style={[getTextStyle(), styles.ratingText]}>
          {rating.toFixed(1)}
        </Text>
        {showCount && count && (
          <Text style={[getTextStyle(), styles.countText]}>
            ({count})
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      <View style={styles.textContainer}>
        <Text style={[getTextStyle(), styles.ratingText]}>
          {rating.toFixed(1)}
        </Text>
        {showCount && count && (
          <Text style={[getTextStyle(), styles.countText]}>
            ({count} {t('rating.reviews', 'recenzií')})
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.systemYellow + '20',
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  countText: {
    color: AppleDesign.Colors.secondaryLabel,
  },
});
