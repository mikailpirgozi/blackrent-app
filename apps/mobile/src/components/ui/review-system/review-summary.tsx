/**
 * 🌟 Review Summary Component
 * Display overall ratings and statistics
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';

export interface ReviewSummaryData {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: {
    cleanliness: number;
    condition: number;
    service: number;
    communication: number;
    overall: number;
  };
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recommendationPercentage: number;
}

interface ReviewSummaryProps {
  data: ReviewSummaryData;
  onWriteReview?: () => void;
  onViewAllReviews?: () => void;
  showWriteButton?: boolean;
}

export function ReviewSummary({
  data,
  onWriteReview,
  onViewAllReviews,
  showWriteButton = true,
}: ReviewSummaryProps) {
  const { t } = useTranslation();

  const renderStars = (rating: number, size: number = 20) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <Ionicons
            key={`full-${index}`}
            name="star"
            size={size}
            color={AppleDesign.Colors.systemYellow}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <Ionicons
            name="star-half"
            size={size}
            color={AppleDesign.Colors.systemYellow}
          />
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <Ionicons
            key={`empty-${index}`}
            name="star-outline"
            size={size}
            color={AppleDesign.Colors.systemGray3}
          />
        ))}
      </View>
    );
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <View style={styles.ratingBarContainer}>
        <Text style={styles.ratingBarLabel}>{rating}</Text>
        <Ionicons name="star" size={12} color={AppleDesign.Colors.systemYellow} />
        <View style={styles.ratingBarTrack}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  const renderCriterionRating = (label: string, rating: number, icon: string) => {
    return (
      <View style={styles.criterionContainer}>
        <View style={styles.criterionHeader}>
          <Ionicons name={icon as any} size={16} color={AppleDesign.Colors.systemBlue} />
          <Text style={styles.criterionLabel}>{label}</Text>
        </View>
        <View style={styles.criterionRating}>
          {renderStars(rating, 14)}
          <Text style={styles.criterionRatingText}>{rating.toFixed(1)}</Text>
        </View>
      </View>
    );
  };

  if (data.totalReviews === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={48} color={AppleDesign.Colors.systemGray3} />
          <Text style={styles.emptyTitle}>Žiadne recenzie</Text>
          <Text style={styles.emptyText}>
            Buďte prvý, kto ohodnotí toto vozidlo!
          </Text>
          {showWriteButton && (
            <TouchableOpacity style={styles.writeReviewButton} onPress={onWriteReview}>
              <Text style={styles.writeReviewButtonText}>Napísať recenziu</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Overall Rating */}
      <View style={styles.overallSection}>
        <View style={styles.overallRating}>
          <Text style={styles.ratingNumber}>{data.averageRating.toFixed(1)}</Text>
          {renderStars(data.averageRating, 24)}
          <Text style={styles.reviewCount}>
            {data.totalReviews} {data.totalReviews === 1 ? 'recenzia' : 'recenzií'}
          </Text>
        </View>
        
        {showWriteButton && (
          <TouchableOpacity style={styles.writeReviewButton} onPress={onWriteReview}>
            <Ionicons name="create-outline" size={16} color={AppleDesign.Colors.systemBlue} />
            <Text style={styles.writeReviewButtonText}>Napísať recenziu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rating Distribution */}
      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Rozdelenie hodnotení</Text>
        {[5, 4, 3, 2, 1].map((rating) => (
          <View key={rating}>
            {renderRatingBar(rating, data.ratingDistribution[rating as keyof typeof data.ratingDistribution], data.totalReviews)}
          </View>
        ))}
      </View>

      {/* Detailed Ratings */}
      <View style={styles.detailedSection}>
        <Text style={styles.sectionTitle}>Detailné hodnotenie</Text>
        <View style={styles.criteriaGrid}>
          {renderCriterionRating('Čistota', data.ratingBreakdown.cleanliness, 'sparkles')}
          {renderCriterionRating('Stav', data.ratingBreakdown.condition, 'build')}
          {renderCriterionRating('Služby', data.ratingBreakdown.service, 'people')}
          {renderCriterionRating('Komunikácia', data.ratingBreakdown.communication, 'chatbubbles')}
        </View>
      </View>

      {/* Recommendation */}
      <View style={styles.recommendationSection}>
        <View style={styles.recommendationContainer}>
          <Ionicons name="thumbs-up" size={20} color={AppleDesign.Colors.systemGreen} />
          <Text style={styles.recommendationText}>
            {data.recommendationPercentage.toFixed(0)}% zákazníkov odporúča
          </Text>
        </View>
      </View>

      {/* View All Button */}
      {onViewAllReviews && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllReviews}>
          <Text style={styles.viewAllButtonText}>Zobraziť všetky recenzie</Text>
          <Ionicons name="chevron-forward" size={16} color={AppleDesign.Colors.systemBlue} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderRadius: AppleDesign.BorderRadius.lg,
    padding: AppleDesign.Spacing.lg,
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overallSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  overallRating: {
    alignItems: 'center',
    flex: 1,
  },
  ratingNumber: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xs,
  },
  reviewCount: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.systemBlue + '20',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    borderRadius: AppleDesign.BorderRadius.md,
  },
  writeReviewButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
    marginLeft: AppleDesign.Spacing.xs,
  },
  distributionSection: {
    marginBottom: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  sectionTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.md,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  ratingBarLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    width: 20,
    textAlign: 'center',
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: AppleDesign.Colors.systemGray5,
    borderRadius: 4,
    marginHorizontal: AppleDesign.Spacing.sm,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: AppleDesign.Colors.systemYellow,
  },
  ratingBarCount: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    width: 30,
    textAlign: 'right',
  },
  detailedSection: {
    marginBottom: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  criteriaGrid: {
    gap: AppleDesign.Spacing.md,
  },
  criterionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  criterionLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    marginLeft: AppleDesign.Spacing.sm,
  },
  criterionRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criterionRatingText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginLeft: AppleDesign.Spacing.sm,
    fontWeight: '600',
  },
  recommendationSection: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.systemGreen + '20',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    borderRadius: AppleDesign.BorderRadius.md,
  },
  recommendationText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemGreen,
    fontWeight: '600',
    marginLeft: AppleDesign.Spacing.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.md,
    backgroundColor: AppleDesign.Colors.systemGray6,
  },
  viewAllButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
    marginRight: AppleDesign.Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.xxl,
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
    marginBottom: AppleDesign.Spacing.lg,
  },
});
