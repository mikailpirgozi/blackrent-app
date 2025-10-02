/**
 * 🏆 Loyalty Widget Component
 * Compact loyalty display for headers and cards
 * Shows tier, points, and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  loyaltyService, 
  type UserLoyalty, 
  TIER_LEVELS,
  type TierLevel 
} from '../../../services/loyalty-service';
import { logger } from '../../../utils/logger';

// Component props
interface LoyaltyWidgetProps {
  userId: string;
  variant?: 'compact' | 'card' | 'header';
  showProgress?: boolean;
  showPoints?: boolean;
  onPress?: () => void;
  style?: any;
}

/**
 * Loyalty Widget Component
 */
export function LoyaltyWidget({
  userId,
  variant = 'compact',
  showProgress = true,
  showPoints = true,
  onPress,
  style,
}: LoyaltyWidgetProps) {
  // State
  const [loyalty, setLoyalty] = useState<UserLoyalty | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const progressValue = React.useRef(new Animated.Value(0)).current;
  const scaleValue = React.useRef(new Animated.Value(1)).current;

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
      const loyaltyData = await loyaltyService.getUserLoyalty(userId);
      setLoyalty(loyaltyData);
    } catch (error) {
      logger.error('Failed to load loyalty data for widget:', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  // Animated styles
  const progressAnimatedStyle = {
    width: progressValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };

  const scaleAnimatedStyle = {
    transform: [{ scale: scaleValue }],
  };

  if (loading) {
    return (
      <View style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: variant === 'compact' ? 8 : 12,
        },
        style,
      ]}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
          Načítava...
        </Text>
      </View>
    );
  }

  if (!loyalty) {
    return null;
  }

  const currentTierData = TIER_LEVELS[loyalty.currentTier];

  // Compact variant (for headers)
  if (variant === 'compact') {
    return (
      <Animated.View style={[scaleAnimatedStyle, style]}>
        <TouchableOpacity
          onPress={handlePress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: `${currentTierData.color}20`,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 16, marginRight: 6 }}>
            {currentTierData.icon}
          </Text>
          
          {showPoints && (
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: currentTierData.color,
            }}>
              {loyalty.availablePoints.toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Header variant (for navigation)
  if (variant === 'header') {
    return (
      <Animated.View style={[scaleAnimatedStyle, style]}>
        <TouchableOpacity
          onPress={handlePress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>
            {currentTierData.icon}
          </Text>
          
          <View>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#333',
            }}>
              {currentTierData.name}
            </Text>
            
            {showPoints && (
              <Text style={{
                fontSize: 10,
                color: '#666',
              }}>
                {loyalty.availablePoints} bodov
              </Text>
            )}
          </View>
          
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color="#666" 
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Card variant (full widget)
  return (
    <Animated.View style={[scaleAnimatedStyle, style]}>
      <TouchableOpacity onPress={handlePress}>
        <LinearGradient
          colors={[currentTierData.color, `${currentTierData.color}80`]}
          style={{
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>
              {currentTierData.icon}
            </Text>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#fff',
              }}>
                {currentTierData.name}
              </Text>
              
              {showPoints && (
                <Text style={{
                  fontSize: 14,
                  color: '#fff',
                  opacity: 0.9,
                }}>
                  {loyalty.availablePoints.toLocaleString()} bodov
                </Text>
              )}
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </View>

          {/* Progress bar */}
          {showProgress && loyalty.nextTier && (
            <View>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#fff',
                  opacity: 0.9,
                }}>
                  Do {TIER_LEVELS[loyalty.nextTier].name}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#fff',
                  opacity: 0.9,
                }}>
                  {loyalty.pointsToNextTier} bodov
                </Text>
              </View>
              
              <View style={{
                height: 6,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <Animated.View
                  style={[
                    progressAnimatedStyle,
                    {
                      height: '100%',
                      backgroundColor: '#fff',
                      borderRadius: 3,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Compact Loyalty Badge for quick display
 */
export function LoyaltyBadge({ 
  tier, 
  points, 
  size = 'medium' 
}: { 
  tier: TierLevel; 
  points?: number; 
  size?: 'small' | 'medium' | 'large';
}) {
  const tierData = TIER_LEVELS[tier];
  
  const sizeConfig = {
    small: { iconSize: 16, fontSize: 10, padding: 6 },
    medium: { iconSize: 20, fontSize: 12, padding: 8 },
    large: { iconSize: 24, fontSize: 14, padding: 10 },
  };
  
  const _config = sizeConfig[size];

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${tierData.color}20`,
      borderRadius: config.padding * 2,
      paddingHorizontal: config.padding,
      paddingVertical: config.padding / 2,
    }}>
      <Text style={{ fontSize: config.iconSize, marginRight: 4 }}>
        {tierData.icon}
      </Text>
      
      <Text style={{
        fontSize: config.fontSize,
        fontWeight: '600',
        color: tierData.color,
      }}>
        {tierData.name}
      </Text>
      
      {points !== undefined && (
        <Text style={{
          fontSize: config.fontSize - 1,
          color: tierData.color,
          marginLeft: 4,
          opacity: 0.8,
        }}>
          • {points.toLocaleString()}
        </Text>
      )}
    </View>
  );
}

export default LoyaltyWidget;
