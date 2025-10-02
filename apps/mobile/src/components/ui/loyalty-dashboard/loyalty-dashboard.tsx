/**
 * 🏆 Loyalty Dashboard Component
 * Beautiful loyalty program dashboard with tier progress and rewards
 * Gamification UI with animations and achievements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  loyaltyService, 
  type UserLoyalty, 
  type PointTransaction,
  type UserReward,
  TIER_LEVELS,
  REWARDS,
  type TierLevel,
  type RewardId 
} from '../../../services/loyalty-service';
import { TranslatedText } from '../translated-text/translated-text';
import { logger } from '../../../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

// Component props
interface LoyaltyDashboardProps {
  userId: string;
  onRewardRedeem?: (reward: UserReward) => void;
  onPointsEarn?: (transaction: PointTransaction) => void;
}

/**
 * Loyalty Dashboard Component
 */
export function LoyaltyDashboard({ 
  userId, 
  onRewardRedeem, 
  onPointsEarn 
}: LoyaltyDashboardProps) {
  // State
  const [loyalty, setLoyalty] = useState<UserLoyalty | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'rewards' | 'history'>('overview');

  // Animations
  const progressValue = React.useRef(new Animated.Value(0)).current;
  const cardScale = React.useRef(new Animated.Value(1)).current;

  // Load loyalty data
  useEffect(() => {
    loadLoyaltyData();
  }, [userId]);

  // Animate progress when loyalty data changes
  useEffect(() => {
    if (loyalty) {
      const progress = loyalty.nextTier 
        ? (loyalty.totalPoints - TIER_LEVELS[loyalty.currentTier].minPoints) / 
          (TIER_LEVELS[loyalty.nextTier].minPoints - TIER_LEVELS[loyalty.currentTier].minPoints)
        : 1;
      
      Animated.spring(progressValue, {
        toValue: Math.max(0, Math.min(1, progress)),
        useNativeDriver: false,
      }).start();
    }
  }, [loyalty]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      
      const [loyaltyData, transactionData, rewardData] = await Promise.all([
        loyaltyService.getUserLoyalty(userId),
        loyaltyService.getPointTransactions(userId, 20),
        loyaltyService.getUserRewards(userId),
      ]);
      
      setLoyalty(loyaltyData);
      setTransactions(transactionData);
      setRewards(rewardData);
      
    } catch (error) {
      logger.error('Failed to load loyalty data:', error as Error);
      Alert.alert('Chyba', 'Nepodarilo sa načítať loyalty dáta');
    } finally {
      setLoading(false);
    }
  };

  const handleRewardRedeem = async (rewardId: RewardId) => {
    try {
      if (!loyalty) return;

      const reward = REWARDS[rewardId];
      if (loyalty.availablePoints < reward.cost) {
        Alert.alert('Nedostatok bodov', `Potrebujete ${reward.cost} bodov na výmenu tejto odmeny.`);
        return;
      }

      Alert.alert(
        'Potvrdiť výmenu',
        `Chcete vymeniť ${reward.cost} bodov za ${reward.name}?`,
        [
          { text: 'Zrušiť', style: 'cancel' },
          {
            text: 'Vymeniť',
            onPress: async () => {
              try {
                const userReward = await loyaltyService.redeemReward(userId, rewardId);
                await loadLoyaltyData(); // Refresh data
                onRewardRedeem?.(userReward);
                
                Alert.alert('Úspech!', `Odmena ${reward.name} bola úspešne vymenená.`);
              } catch (error) {
                Alert.alert('Chyba', 'Nepodarilo sa vymeniť odmenu');
              }
            },
          },
        ]
      );
    } catch (error) {
      logger.error('Failed to redeem reward:', error as Error);
    }
  };

  // Animated styles
  const progressAnimatedStyle = {
    width: progressValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };

  const cardAnimatedStyle = {
    transform: [{ scale: cardScale }],
  };

  if (loading || !loyalty) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="trophy" size={48} color="#ccc" />
        <Text style={{ marginTop: 16, color: '#666' }}>Načítava loyalty program...</Text>
      </View>
    );
  }

  const currentTierData = TIER_LEVELS[loyalty.currentTier];
  const availableRewards = loyaltyService.getAvailableRewards(loyalty.availablePoints);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Tier Card */}
      <Animated.View style={[cardAnimatedStyle, { margin: 16 }]}>
        <LinearGradient
          colors={[currentTierData.color, `${currentTierData.color}80`]}
          style={{
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 32, marginRight: 12 }}>{currentTierData.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
                {currentTierData.name}
              </Text>
              <Text style={{ fontSize: 16, color: '#fff', opacity: 0.9 }}>
                {loyalty.totalPoints.toLocaleString()} bodov
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, color: '#fff', opacity: 0.8 }}>
                Dostupné
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
                {loyalty.availablePoints.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Progress to next tier */}
          {loyalty.nextTier && (
            <View>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                marginBottom: 8 
              }}>
                <Text style={{ fontSize: 14, color: '#fff', opacity: 0.9 }}>
                  Do {TIER_LEVELS[loyalty.nextTier].name}
                </Text>
                <Text style={{ fontSize: 14, color: '#fff', opacity: 0.9 }}>
                  {loyalty.pointsToNextTier} bodov
                </Text>
              </View>
              
              <View style={{
                height: 8,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <Animated.View
                  style={[
                    progressAnimatedStyle,
                    {
                      height: '100%',
                      backgroundColor: '#fff',
                      borderRadius: 4,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        {[
          { key: 'overview', label: 'Prehľad', icon: 'analytics' },
          { key: 'rewards', label: 'Odmeny', icon: 'gift' },
          { key: 'history', label: 'História', icon: 'time' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setSelectedTab(tab.key as any)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: selectedTab === tab.key ? currentTierData.color : 'transparent',
            }}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={selectedTab === tab.key ? '#fff' : '#666'} 
            />
            <Text style={{
              marginLeft: 6,
              fontSize: 14,
              fontWeight: selectedTab === tab.key ? '600' : '500',
              color: selectedTab === tab.key ? '#fff' : '#666',
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <View style={{ paddingHorizontal: 16 }}>
          {/* Benefits */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
              Vaše výhody
            </Text>
            {currentTierData.benefits.map((benefit, index) => (
              <View key={index} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: 8 
              }}>
                <Ionicons name="checkmark-circle" size={20} color={currentTierData.color} />
                <Text style={{ marginLeft: 8, flex: 1, color: '#333' }}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
              Štatistiky
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: currentTierData.color }}>
                  {loyalty.totalBookings}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                  Rezervácie
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: currentTierData.color }}>
                  {loyalty.streakDays}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                  Dní v rade
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: currentTierData.color }}>
                  {loyalty.referralCount}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                  Odporúčania
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {selectedTab === 'rewards' && (
        <View style={{ paddingHorizontal: 16 }}>
          {availableRewards.map((reward) => (
            <View
              key={reward.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                opacity: reward.affordable ? 1 : 0.6,
              }}
            >
              <Text style={{ fontSize: 32, marginRight: 12 }}>{reward.icon}</Text>
              
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                  {reward.name}
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginVertical: 2 }}>
                  {reward.description}
                </Text>
                <Text style={{ fontSize: 12, color: '#999' }}>
                  Platnosť: {reward.validDays} dní
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => handleRewardRedeem(reward.id)}
                disabled={!reward.affordable}
                style={{
                  backgroundColor: reward.affordable ? currentTierData.color : '#ccc',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  minWidth: 80,
                  alignItems: 'center',
                }}
              >
                <Text style={{ 
                  color: '#fff', 
                  fontWeight: '600', 
                  fontSize: 12 
                }}>
                  {reward.cost}
                </Text>
                <Text style={{ 
                  color: '#fff', 
                  fontSize: 10 
                }}>
                  bodov
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {selectedTab === 'history' && (
        <View style={{ paddingHorizontal: 16 }}>
          {transactions.length === 0 ? (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 32,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
                Zatiaľ žiadna história
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View
                key={transaction.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${currentTierData.color}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 18, color: currentTierData.color }}>
                    +{transaction.points}
                  </Text>
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#333' }}>
                    {transaction.description}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {new Date(transaction.timestamp).toLocaleDateString('sk-SK')}
                  </Text>
                </View>
                
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: currentTierData.color 
                }}>
                  +{transaction.points}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

export default LoyaltyDashboard;
