/**
 * 🏆 Loyalty Service
 * Complete loyalty program with points, tiers, and rewards
 * Gamification system for better user engagement
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// Tier levels
export const TIER_LEVELS = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    color: '#CD7F32',
    icon: '🥉',
    benefits: [
      'Základné body za rezervácie',
      'Štandardná podpora',
      'Mesačné newslettery',
    ],
  },
  silver: {
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: [
      '1.5x body za rezervácie',
      'Prioritná podpora',
      'Exkluzívne ponuky',
      '5% zľava na všetky rezervácie',
    ],
  },
  gold: {
    name: 'Gold',
    minPoints: 5000,
    maxPoints: 14999,
    color: '#FFD700',
    icon: '🥇',
    benefits: [
      '2x body za rezervácie',
      'VIP podpora 24/7',
      'Bezplatné upgrady vozidiel',
      '10% zľava na všetky rezervácie',
      'Bezplatné zrušenie do 1 hodiny',
    ],
  },
  platinum: {
    name: 'Platinum',
    minPoints: 15000,
    maxPoints: Infinity,
    color: '#E5E4E2',
    icon: '💎',
    benefits: [
      '3x body za rezervácie',
      'Osobný account manager',
      'Bezplatné prémiové vozidlá',
      '15% zľava na všetky rezervácie',
      'Bezplatné zrušenie kedykoľvek',
      'Exkluzívne prístup k novým vozidlám',
    ],
  },
} as const;

export type TierLevel = keyof typeof TIER_LEVELS;

// Point earning activities
export const POINT_ACTIVITIES = {
  booking_completed: { points: 100, description: 'Dokončená rezervácia' },
  first_booking: { points: 500, description: 'Prvá rezervácia' },
  review_written: { points: 50, description: 'Napísaná recenzia' },
  photo_uploaded: { points: 25, description: 'Nahraná fotka' },
  referral_signup: { points: 200, description: 'Odporučenie priateľa' },
  referral_booking: { points: 300, description: 'Rezervácia od odporučeného' },
  birthday_bonus: { points: 100, description: 'Narodeninový bonus' },
  streak_7_days: { points: 150, description: '7-dňová séria' },
  streak_30_days: { points: 500, description: '30-dňová séria' },
  premium_booking: { points: 200, description: 'Prémiové vozidlo' },
  weekend_booking: { points: 50, description: 'Víkendová rezervácia' },
  early_booking: { points: 75, description: 'Rezervácia vopred (7+ dní)' },
} as const;

export type PointActivity = keyof typeof POINT_ACTIVITIES;

// Reward types
export const REWARDS = {
  discount_5: {
    id: 'discount_5',
    name: '5% zľava',
    description: '5% zľava na ďalšiu rezerváciu',
    cost: 500,
    type: 'discount' as const,
    value: 5,
    validDays: 30,
    icon: '🎫',
  },
  discount_10: {
    id: 'discount_10',
    name: '10% zľava',
    description: '10% zľava na ďalšiu rezerváciu',
    cost: 1000,
    type: 'discount' as const,
    value: 10,
    validDays: 30,
    icon: '🎟️',
  },
  free_upgrade: {
    id: 'free_upgrade',
    name: 'Bezplatný upgrade',
    description: 'Bezplatný upgrade na vyššiu kategóriu',
    cost: 1500,
    type: 'upgrade' as const,
    value: 1,
    validDays: 60,
    icon: '⬆️',
  },
  free_delivery: {
    id: 'free_delivery',
    name: 'Bezplatný dovoz',
    description: 'Bezplatný dovoz vozidla',
    cost: 800,
    type: 'delivery' as const,
    value: 1,
    validDays: 45,
    icon: '🚚',
  },
  priority_support: {
    id: 'priority_support',
    name: 'Prioritná podpora',
    description: 'Prioritná zákaznícka podpora na 30 dní',
    cost: 300,
    type: 'support' as const,
    value: 1,
    validDays: 30,
    icon: '🎧',
  },
} as const;

export type RewardId = keyof typeof REWARDS;
export type RewardType = 'discount' | 'upgrade' | 'delivery' | 'support';

// Interfaces
export interface UserLoyalty {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  currentTier: TierLevel;
  nextTier?: TierLevel;
  pointsToNextTier: number;
  joinDate: string;
  lastActivity: string;
  streakDays: number;
  totalBookings: number;
  totalSpent: number;
  referralCount: number;
}

export interface PointTransaction {
  id: string;
  userId: string;
  activity: PointActivity;
  points: number;
  description: string;
  timestamp: string;
  bookingId?: string;
  referralId?: string;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: RewardId;
  name: string;
  description: string;
  type: RewardType;
  value: number;
  cost: number;
  purchaseDate: string;
  expiryDate: string;
  used: boolean;
  usedDate?: string;
  bookingId?: string;
}

export interface LoyaltyStats {
  totalUsers: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  tierDistribution: Record<TierLevel, number>;
  topActivities: Array<{ activity: PointActivity; count: number }>;
  averagePointsPerUser: number;
}

// Storage keys
const STORAGE_KEYS = {
  userLoyalty: 'blackrent_loyalty_user_',
  pointTransactions: 'blackrent_loyalty_transactions_',
  userRewards: 'blackrent_loyalty_rewards_',
  loyaltyStats: 'blackrent_loyalty_stats',
} as const;

class LoyaltyService {
  private initialized = false;

  /**
   * Initialize loyalty service
   */
  async initialize(): Promise<void> {
    try {
      this.initialized = true;
      logger.info('Loyalty Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Loyalty Service:', error as Error);
      throw error;
    }
  }

  /**
   * Get user loyalty data
   */
  async getUserLoyalty(userId: string): Promise<UserLoyalty> {
    try {
      const key = `${STORAGE_KEYS.userLoyalty}${userId}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const loyalty: UserLoyalty = JSON.parse(stored);
        // Update calculated fields
        return this.updateCalculatedFields(loyalty);
      }

      // Create new user loyalty
      const newLoyalty: UserLoyalty = {
        userId,
        totalPoints: 0,
        availablePoints: 0,
        currentTier: 'bronze',
        pointsToNextTier: TIER_LEVELS.silver.minPoints,
        joinDate: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        streakDays: 0,
        totalBookings: 0,
        totalSpent: 0,
        referralCount: 0,
      };

      await this.saveUserLoyalty(newLoyalty);
      return newLoyalty;

    } catch (error) {
      logger.error('Failed to get user loyalty:', error as Error);
      throw error;
    }
  }

  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    activity: PointActivity,
    bookingId?: string,
    referralId?: string
  ): Promise<PointTransaction> {
    try {
      const loyalty = await this.getUserLoyalty(userId);
      const activityData = POINT_ACTIVITIES[activity];
      
      // Calculate points with tier multiplier
      const points = activityData.points;
      const tierMultiplier = this.getTierMultiplier(loyalty.currentTier);
      const calculatedPoints = Math.floor(points * tierMultiplier) as typeof points;

      // Create transaction
      const transaction: PointTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        activity,
        points: calculatedPoints,
        description: activityData.description,
        timestamp: new Date().toISOString(),
        bookingId,
        referralId,
      };

      // Update user loyalty
      loyalty.totalPoints += points;
      loyalty.availablePoints += points;
      loyalty.lastActivity = transaction.timestamp;
      
      // Update tier if needed
      const newTier = this.calculateTier(loyalty.totalPoints);
      if (newTier !== loyalty.currentTier) {
        loyalty.currentTier = newTier;
        logger.info(`User ${userId} promoted to ${newTier} tier`);
      }

      // Update calculated fields
      const updatedLoyalty = this.updateCalculatedFields(loyalty);
      
      // Save data
      await this.saveUserLoyalty(updatedLoyalty);
      await this.savePointTransaction(transaction);
      
      logger.info(`Awarded ${points} points to user ${userId} for ${activity}`);
      return transaction;

    } catch (error) {
      logger.error('Failed to award points:', error as Error);
      throw error;
    }
  }

  /**
   * Redeem reward
   */
  async redeemReward(userId: string, rewardId: RewardId): Promise<UserReward> {
    try {
      const loyalty = await this.getUserLoyalty(userId);
      const reward = REWARDS[rewardId];

      if (loyalty.availablePoints < reward.cost) {
        throw new Error('Insufficient points');
      }

      // Create user reward
      const userReward: UserReward = {
        id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        rewardId,
        name: reward.name,
        description: reward.description,
        type: reward.type,
        value: reward.value,
        cost: reward.cost,
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + reward.validDays * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
      };

      // Deduct points
      loyalty.availablePoints -= reward.cost;
      loyalty.lastActivity = userReward.purchaseDate;

      // Save data
      await this.saveUserLoyalty(loyalty);
      await this.saveUserReward(userReward);

      logger.info(`User ${userId} redeemed reward ${rewardId} for ${reward.cost} points`);
      return userReward;

    } catch (error) {
      logger.error('Failed to redeem reward:', error as Error);
      throw error;
    }
  }

  /**
   * Use reward
   */
  async useReward(userId: string, rewardId: string, bookingId: string): Promise<UserReward> {
    try {
      const _rewards = await this.getUserRewards(userId);
      const reward = rewards.find(r => r.id === rewardId && !r.used);

      if (!reward) {
        throw new Error('Reward not found or already used');
      }

      if (new Date(reward.expiryDate) < new Date()) {
        throw new Error('Reward has expired');
      }

      // Mark as used
      reward.used = true;
      reward.usedDate = new Date().toISOString();
      reward.bookingId = bookingId;

      await this.saveUserReward(reward);

      logger.info(`User ${userId} used reward ${rewardId} for booking ${bookingId}`);
      return reward;

    } catch (error) {
      logger.error('Failed to use reward:', error as Error);
      throw error;
    }
  }

  /**
   * Get user point transactions
   */
  async getPointTransactions(userId: string, limit = 50): Promise<PointTransaction[]> {
    try {
      const key = `${STORAGE_KEYS.pointTransactions}${userId}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (!stored) return [];

      const transactions: PointTransaction[] = JSON.parse(stored);
      return transactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      logger.error('Failed to get point transactions:', error as Error);
      return [];
    }
  }

  /**
   * Get user rewards
   */
  async getUserRewards(userId: string): Promise<UserReward[]> {
    try {
      const key = `${STORAGE_KEYS.userRewards}${userId}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (!stored) return [];

      const rewards: UserReward[] = JSON.parse(stored);
      return rewards.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    } catch (error) {
      logger.error('Failed to get user rewards:', error as Error);
      return [];
    }
  }

  /**
   * Get available rewards for user
   */
  getAvailableRewards(userPoints: number): Array<typeof REWARDS[RewardId] & { affordable: boolean }> {
    return Object.values(REWARDS).map(reward => ({
      ...reward,
      affordable: userPoints >= reward.cost,
    }));
  }

  /**
   * Calculate tier from points
   */
  calculateTier(points: number): TierLevel {
    if (points >= TIER_LEVELS.platinum.minPoints) return 'platinum';
    if (points >= TIER_LEVELS.gold.minPoints) return 'gold';
    if (points >= TIER_LEVELS.silver.minPoints) return 'silver';
    return 'bronze';
  }

  /**
   * Get tier multiplier for points
   */
  getTierMultiplier(tier: TierLevel): number {
    switch (tier) {
      case 'bronze': return 1.0;
      case 'silver': return 1.5;
      case 'gold': return 2.0;
      case 'platinum': return 3.0;
      default: return 1.0;
    }
  }

  /**
   * Update calculated fields
   */
  private updateCalculatedFields(loyalty: UserLoyalty): UserLoyalty {
    const currentTier = this.calculateTier(loyalty.totalPoints);
    const tiers = Object.keys(TIER_LEVELS) as TierLevel[];
    const currentTierIndex = tiers.indexOf(currentTier);
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : undefined;
    
    return {
      ...loyalty,
      currentTier,
      nextTier,
      pointsToNextTier: nextTier ? TIER_LEVELS[nextTier].minPoints - loyalty.totalPoints : 0,
    };
  }

  /**
   * Save user loyalty data
   */
  private async saveUserLoyalty(loyalty: UserLoyalty): Promise<void> {
    const key = `${STORAGE_KEYS.userLoyalty}${loyalty.userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(loyalty));
  }

  /**
   * Save point transaction
   */
  private async savePointTransaction(transaction: PointTransaction): Promise<void> {
    const key = `${STORAGE_KEYS.pointTransactions}${transaction.userId}`;
    const stored = await AsyncStorage.getItem(key);
    const transactions: PointTransaction[] = stored ? JSON.parse(stored) : [];
    
    transactions.push(transaction);
    
    // Keep only last 100 transactions
    if (transactions.length > 100) {
      transactions.splice(0, transactions.length - 100);
    }
    
    await AsyncStorage.setItem(key, JSON.stringify(transactions));
  }

  /**
   * Save user reward
   */
  private async saveUserReward(reward: UserReward): Promise<void> {
    const key = `${STORAGE_KEYS.userRewards}${reward.userId}`;
    const stored = await AsyncStorage.getItem(key);
    const rewards: UserReward[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = rewards.findIndex(r => r.id === reward.id);
    if (existingIndex >= 0) {
      rewards[existingIndex] = reward;
    } else {
      rewards.push(reward);
    }
    
    await AsyncStorage.setItem(key, JSON.stringify(rewards));
  }

  /**
   * Clear user data (for testing)
   */
  async clearUserData(userId: string): Promise<void> {
    try {
      const keys = [
        `${STORAGE_KEYS.userLoyalty}${userId}`,
        `${STORAGE_KEYS.pointTransactions}${userId}`,
        `${STORAGE_KEYS.userRewards}${userId}`,
      ];
      
      await AsyncStorage.multiRemove(keys);
      logger.info(`Cleared loyalty data for user ${userId}`);
    } catch (error) {
      logger.error('Failed to clear user data:', error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const loyaltyService = new LoyaltyService();
