/**
 * 🌟 Reviews List Component
 * Display vehicle reviews with photos, ratings, and moderation
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';

const { width: screenWidth } = Dimensions.get('window');

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bookingId?: string;
  createdAt: string;
  ratings: {
    cleanliness: number;
    condition: number;
    service: number;
    communication: number;
    overall: number;
  };
  comment: string;
  photos: string[];
  wouldRecommend: boolean;
  isVerified: boolean;
  helpfulCount: number;
  reportCount: number;
  companyResponse?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
}

interface ReviewsListProps {
  reviews: Review[];
  onLoadMore?: () => void;
  onReportReview?: (reviewId: string) => void;
  onMarkHelpful?: (reviewId: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
}

export function ReviewsList({
  reviews,
  onLoadMore,
  onReportReview,
  onMarkHelpful,
  isLoading = false,
  hasMore = false,
}: ReviewsListProps) {
  const { t } = useTranslation();
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handlePhotoPress = (photos: string[], index: number) => {
    setSelectedPhotos(photos);
    setCurrentPhotoIndex(index);
    setPhotoModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? AppleDesign.Colors.systemYellow : AppleDesign.Colors.systemGray3}
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item: review }: { item: Review }) => {
    const _averageRating = Object.values(review.ratings).reduce((sum, rating) => sum + rating, 0) / 5;

    return (
      <View style={styles.reviewCard}>
        {/* User Info */}
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {review.userAvatar ? (
                <Image source={{ uri: review.userAvatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={20} color={AppleDesign.Colors.systemGray} />
              )}
            </View>
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{review.userName}</Text>
                {review.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color={AppleDesign.Colors.systemBlue} />
                )}
              </View>
              <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
            </View>
          </View>
          
          {/* Overall Rating */}
          <View style={styles.overallRating}>
            {renderStars(review.ratings.overall, 18)}
            <Text style={styles.ratingNumber}>{review.ratings.overall.toFixed(1)}</Text>
          </View>
        </View>

        {/* Detailed Ratings */}
        <View style={styles.detailedRatings}>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Čistota</Text>
            {renderStars(review.ratings.cleanliness, 14)}
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Stav</Text>
            {renderStars(review.ratings.condition, 14)}
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Služby</Text>
            {renderStars(review.ratings.service, 14)}
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Komunikácia</Text>
            {renderStars(review.ratings.communication, 14)}
          </View>
        </View>

        {/* Comment */}
        <Text style={styles.reviewComment}>{review.comment}</Text>

        {/* Photos */}
        {review.photos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosContainer}
            contentContainerStyle={styles.photosContent}
          >
            {review.photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handlePhotoPress(review.photos, index)}
              >
                <Image source={{ uri: photo }} style={styles.reviewPhoto} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Recommendation */}
        <View style={styles.recommendationContainer}>
          <View style={[
            styles.recommendationBadge,
            review.wouldRecommend ? styles.recommendationPositive : styles.recommendationNegative
          ]}>
            <Ionicons
              name={review.wouldRecommend ? 'thumbs-up' : 'thumbs-down'}
              size={14}
              color={review.wouldRecommend ? AppleDesign.Colors.systemGreen : AppleDesign.Colors.systemRed}
            />
            <Text style={[
              styles.recommendationText,
              review.wouldRecommend ? styles.recommendationTextPositive : styles.recommendationTextNegative
            ]}>
              {review.wouldRecommend ? 'Odporúča' : 'Neodporúča'}
            </Text>
          </View>
        </View>

        {/* Company Response */}
        {review.companyResponse && (
          <View style={styles.companyResponse}>
            <View style={styles.companyResponseHeader}>
              <Ionicons name="business" size={16} color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.companyResponseTitle}>Odpoveď autopožičovne</Text>
              <Text style={styles.companyResponseDate}>
                {formatDate(review.companyResponse.respondedAt)}
              </Text>
            </View>
            <Text style={styles.companyResponseText}>{review.companyResponse.message}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onMarkHelpful?.(review.id)}
          >
            <Ionicons name="thumbs-up-outline" size={16} color={AppleDesign.Colors.systemGray} />
            <Text style={styles.actionButtonText}>
              Užitočné ({review.helpfulCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReportReview?.(review.id)}
          >
            <Ionicons name="flag-outline" size={16} color={AppleDesign.Colors.systemGray} />
            <Text style={styles.actionButtonText}>Nahlásiť</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={48} color={AppleDesign.Colors.systemGray3} />
            <Text style={styles.emptyTitle}>Žiadne recenzie</Text>
            <Text style={styles.emptyText}>
              Buďte prvý, kto ohodnotí toto vozidlo!
            </Text>
          </View>
        }
      />

      {/* Photo Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.photoModalContainer}>
          <SafeAreaView style={styles.photoModalContent}>
            <TouchableOpacity
              style={styles.photoModalClose}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: currentPhotoIndex * screenWidth, y: 0 }}
            >
              {selectedPhotos.map((photo, index) => (
                <View key={index} style={styles.photoModalSlide}>
                  <Image source={{ uri: photo }} style={styles.photoModalImage} />
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.photoModalIndicator}>
              <Text style={styles.photoModalIndicatorText}>
                {currentPhotoIndex + 1} / {selectedPhotos.length}
              </Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: AppleDesign.Colors.systemBackground,
    marginBottom: AppleDesign.Spacing.md,
    padding: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.lg,
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppleDesign.Colors.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xs,
  },
  userName: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginRight: AppleDesign.Spacing.xs,
  },
  reviewDate: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  overallRating: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xs,
  },
  ratingNumber: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '600',
  },
  detailedRatings: {
    marginBottom: AppleDesign.Spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppleDesign.Spacing.xs,
  },
  ratingLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    width: 80,
  },
  reviewComment: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    lineHeight: 22,
    marginBottom: AppleDesign.Spacing.md,
  },
  photosContainer: {
    marginBottom: AppleDesign.Spacing.md,
  },
  photosContent: {
    paddingRight: AppleDesign.Spacing.md,
  },
  reviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: AppleDesign.BorderRadius.md,
    marginRight: AppleDesign.Spacing.sm,
  },
  recommendationContainer: {
    marginBottom: AppleDesign.Spacing.md,
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.xs,
    borderRadius: AppleDesign.BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  recommendationPositive: {
    backgroundColor: AppleDesign.Colors.systemGreen + '20',
  },
  recommendationNegative: {
    backgroundColor: AppleDesign.Colors.systemRed + '20',
  },
  recommendationText: {
    ...AppleDesign.Typography.caption1,
    fontWeight: '600',
    marginLeft: AppleDesign.Spacing.xs,
  },
  recommendationTextPositive: {
    color: AppleDesign.Colors.systemGreen,
  },
  recommendationTextNegative: {
    color: AppleDesign.Colors.systemRed,
  },
  companyResponse: {
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.md,
    padding: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.md,
  },
  companyResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  companyResponseTitle: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
    marginLeft: AppleDesign.Spacing.xs,
    flex: 1,
  },
  companyResponseDate: {
    ...AppleDesign.Typography.caption2,
    color: AppleDesign.Colors.secondaryLabel,
  },
  companyResponseText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: AppleDesign.Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppleDesign.Colors.separator,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: AppleDesign.Spacing.xl,
  },
  actionButtonText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.systemGray,
    marginLeft: AppleDesign.Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  photoModalContent: {
    flex: 1,
  },
  photoModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalSlide: {
    width: screenWidth,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalImage: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 0.75,
    resizeMode: 'contain',
  },
  photoModalIndicator: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoModalIndicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
