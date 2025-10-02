/**
 * 🏆 Loyalty Program Profile Page
 * User's loyalty program dashboard and management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LoyaltyDashboard } from '../../components/ui/loyalty-dashboard/loyalty-dashboard';
import { LoyaltyWidget, LoyaltyBadge } from '../../components/ui/loyalty-widget/loyalty-widget';
import { 
  loyaltyService, 
  TIER_LEVELS,
  type UserLoyalty 
} from '../../services/loyalty-service';
import { logger } from '../../utils/logger';
import { useTranslation } from '../../hooks/use-translation';

export default function LoyaltyProfileScreen() {
  const { t } = useTranslation();
  const [userId] = useState('demo_user_123');
  const [loyalty, setLoyalty] = useState<UserLoyalty | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load loyalty data
  useEffect(() => {
    loadLoyaltyData();
  }, [refreshKey]);

  const loadLoyaltyData = async () => {
    try {
      const loyaltyData = await loyaltyService.getUserLoyalty(userId);
      setLoyalty(loyaltyData);
    } catch (error) {
      logger.error('Failed to load loyalty data:', error as Error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '600', color: '#333' }}>
          {t('profile.loyalty', 'Loyalty Program')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Current Status Card */}
        {loyalty && (
          <View style={{
            backgroundColor: '#fff',
            margin: 16,
            borderRadius: 12,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              {t('loyalty.currentStatus', 'Aktuálny stav')}
            </Text>
            
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <LoyaltyBadge 
                tier={loyalty.currentTier} 
                points={loyalty.totalPoints}
                size="large"
              />
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#666', fontSize: 16 }}>
                {t('loyalty.totalPoints', 'Celkové body')}:
              </Text>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>
                {loyalty.totalPoints.toLocaleString()}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#666', fontSize: 16 }}>
                {t('loyalty.availablePoints', 'Dostupné body')}:
              </Text>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>
                {loyalty.availablePoints.toLocaleString()}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#666', fontSize: 16 }}>
                {t('loyalty.currentTier', 'Aktuálny level')}:
              </Text>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>
                {TIER_LEVELS[loyalty.currentTier].name}
              </Text>
            </View>
            
            {loyalty.nextTier && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#666', fontSize: 16 }}>
                  {t('loyalty.pointsToNext', 'Body do ďalšieho levelu')}:
                </Text>
                <Text style={{ fontWeight: '600', fontSize: 16, color: '#007AFF' }}>
                  {loyalty.pointsToNextTier.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tier Benefits */}
        <View style={{
          backgroundColor: '#fff',
          margin: 16,
          marginTop: 0,
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
            {t('loyalty.tierBenefits', 'Výhody levelov')}
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(TIER_LEVELS).map(([tier, data]) => (
              <View 
                key={tier}
                style={{
                  backgroundColor: loyalty?.currentTier === tier ? '#e3f2fd' : '#f8f9fa',
                  borderRadius: 8,
                  padding: 12,
                  minWidth: '45%',
                  borderWidth: loyalty?.currentTier === tier ? 2 : 1,
                  borderColor: loyalty?.currentTier === tier ? '#007AFF' : '#e5e7eb',
                }}
              >
                <LoyaltyBadge 
                  tier={tier as any} 
                  points={data.minPoints}
                  size="small"
                />
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  marginTop: 8,
                  color: loyalty?.currentTier === tier ? '#007AFF' : '#333'
                }}>
                  {data.name}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {data.minPoints.toLocaleString()}+ bodov
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Full Loyalty Dashboard */}
        <View style={{ margin: 16, marginTop: 0 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 16,
            paddingHorizontal: 4,
          }}>
            {t('loyalty.dashboard', 'Dashboard')}
          </Text>
          
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <LoyaltyDashboard 
              userId={userId}
              onRewardRedeem={(reward) => {
                Alert.alert(
                  t('loyalty.rewardRedeemed', 'Odmena uplatnená!'), 
                  `${t('loyalty.youRedeemed', 'Uplatnili ste')}: ${reward.name}`
                );
                setRefreshKey(prev => prev + 1);
              }}
              onPointsEarn={(transaction) => {
                Alert.alert(
                  t('loyalty.pointsEarned', 'Body získané!'), 
                  `+${transaction.points} ${t('loyalty.points', 'bodov')}`
                );
              }}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
