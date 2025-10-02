/**
 * 🌟 Review Service
 * Handle review submission, moderation, and management
 */

import { ReviewData, Review, ReviewSummaryData } from '../components/ui/review-system';

export interface ReviewSubmissionResult {
  success: boolean;
  reviewId?: string;
  error?: string;
}

export interface ReviewModerationResult {
  approved: boolean;
  reason?: string;
  moderatedAt: string;
  moderatedBy: string;
}

class ReviewService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

  /**
   * Submit a new review
   */
  async submitReview(reviewData: ReviewData): Promise<ReviewSubmissionResult> {
    try {
      // Upload photos first if any
      const photoUrls = await this.uploadReviewPhotos(reviewData.photos);
      
      const response = await fetch(`${this.baseUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          ...reviewData,
          photos: photoUrls,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        reviewId: result.id,
      };
    } catch (error) {
            return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get reviews for a vehicle
   */
  async getVehicleReviews(vehicleId: string, page = 1, limit = 10): Promise<{
    reviews: Review[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reviews/vehicle/${vehicleId}?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
            return {
        reviews: [],
        hasMore: false,
        total: 0,
      };
    }
  }

  /**
   * Get review summary for a vehicle
   */
  async getVehicleReviewSummary(vehicleId: string): Promise<ReviewSummaryData> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/vehicle/${vehicleId}/summary`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
            return {
        totalReviews: 0,
        averageRating: 0,
        ratingBreakdown: {
          cleanliness: 0,
          condition: 0,
          service: 0,
          communication: 0,
          overall: 0,
        },
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
        recommendationPercentage: 0,
      };
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
            return false;
    }
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: string, reason: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ reason }),
      });

      return response.ok;
    } catch (error) {
            return false;
    }
  }

  /**
   * Upload review photos
   */
  private async uploadReviewPhotos(photos: string[]): Promise<string[]> {
    if (photos.length === 0) return [];

    try {
      const uploadPromises = photos.map(async (photo) => {
        const formData = new FormData();
        formData.append('photo', {
          uri: photo,
          type: 'image/jpeg',
          name: `review_photo_${Date.now()}.jpg`,
        } as any);

        const response = await fetch(`${this.baseUrl}/upload/review-photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        return result.url;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
            return [];
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    // This would typically get the token from your auth store
    // For now, return a mock token
    return 'mock-auth-token';
  }

  /**
   * Auto-moderate review content
   */
  async moderateReview(reviewData: ReviewData): Promise<ReviewModerationResult> {
    try {
      // Basic content moderation rules
      const inappropriateWords = [
        'spam', 'fake', 'scam', 'terrible', 'awful', 'horrible',
        // Add more words as needed
      ];

      const comment = reviewData.comment.toLowerCase();
      const hasInappropriateContent = inappropriateWords.some(word => 
        comment.includes(word)
      );

      // Check for suspicious patterns
      const hasExcessiveCaps = (reviewData.comment.match(/[A-Z]/g) || []).length > 
        reviewData.comment.length * 0.5;
      
      const hasRepeatedChars = /(.)\1{4,}/.test(reviewData.comment);

      const isApproved = !hasInappropriateContent && !hasExcessiveCaps && !hasRepeatedChars;

      return {
        approved: isApproved,
        reason: isApproved ? undefined : 'Content flagged for manual review',
        moderatedAt: new Date().toISOString(),
        moderatedBy: 'auto-moderator',
      };
    } catch (error) {
            return {
        approved: false,
        reason: 'Moderation error',
        moderatedAt: new Date().toISOString(),
        moderatedBy: 'auto-moderator',
      };
    }
  }

  /**
   * Get mock review data for development
   */
  getMockReviews(vehicleId: string): Review[] {
    return [
      {
        id: '1',
        userId: 'user1',
        userName: 'Marián Novák',
        userAvatar: undefined,
        bookingId: 'booking1',
        createdAt: '2024-01-15T10:30:00Z',
        ratings: {
          cleanliness: 5,
          condition: 4,
          service: 5,
          communication: 5,
          overall: 5,
        },
        comment: 'Výborná skúsenosť! Auto bolo čisté, v perfektnom stave a komunikácia s autopožičovňou bola na najvyššej úrovni. Určite odporúčam!',
        photos: [],
        wouldRecommend: true,
        isVerified: true,
        helpfulCount: 12,
        reportCount: 0,
        companyResponse: {
          message: 'Ďakujeme za pozitívnu recenziu! Tešíme sa na vašu ďalšiu návštevu.',
          respondedAt: '2024-01-16T09:15:00Z',
          respondedBy: 'AutoRent Team',
        },
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Jana Svobodová',
        userAvatar: undefined,
        bookingId: 'booking2',
        createdAt: '2024-01-10T14:20:00Z',
        ratings: {
          cleanliness: 4,
          condition: 4,
          service: 3,
          communication: 4,
          overall: 4,
        },
        comment: 'Celkovo spokojnosť, auto fungovalo bez problémov. Jediné mínus bola trochu pomalšia komunikácia pri preberaní.',
        photos: [],
        wouldRecommend: true,
        isVerified: true,
        helpfulCount: 8,
        reportCount: 0,
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Peter Kováč',
        userAvatar: undefined,
        bookingId: 'booking3',
        createdAt: '2024-01-05T16:45:00Z',
        ratings: {
          cleanliness: 5,
          condition: 5,
          service: 5,
          communication: 5,
          overall: 5,
        },
        comment: 'Fantastické auto na dovolenku! Všetko prebehlo hladko, auto bolo ako nové. Profesionálny prístup a rýchle vybavenie.',
        photos: [],
        wouldRecommend: true,
        isVerified: true,
        helpfulCount: 15,
        reportCount: 0,
      },
    ];
  }

  /**
   * Get mock review summary for development
   */
  getMockReviewSummary(vehicleId: string): ReviewSummaryData {
    return {
      totalReviews: 24,
      averageRating: 4.6,
      ratingBreakdown: {
        cleanliness: 4.8,
        condition: 4.5,
        service: 4.4,
        communication: 4.6,
        overall: 4.6,
      },
      ratingDistribution: {
        5: 15,
        4: 6,
        3: 2,
        2: 1,
        1: 0,
      },
      recommendationPercentage: 95.8,
    };
  }
}

export const reviewService = new ReviewService();
