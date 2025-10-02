/**
 * 🟢 AvailabilityBadge Component
 * Vehicle availability status badge with delivery info
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

interface AvailabilityInfo {
  status: 'available' | 'limited' | 'unavailable';
  deliveryAvailable: boolean;
  deliveryFree: boolean;
  deliveryPrice?: number;
}

interface AvailabilityBadgeProps {
  availability: AvailabilityInfo;
  showDelivery?: boolean;
  compact?: boolean;
  style?: any;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  availability,
  showDelivery = true,
  compact = false,
  style,
}) => {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    switch (availability.status) {
      case 'available':
        return {
          color: AppleDesign.Colors.systemGreen,
          backgroundColor: AppleDesign.Colors.systemGreen + '20',
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          text: t('availability.available', 'Dostupné'),
        };
      case 'limited':
        return {
          color: AppleDesign.Colors.systemOrange,
          backgroundColor: AppleDesign.Colors.systemOrange + '20',
          icon: 'time' as keyof typeof Ionicons.glyphMap,
          text: t('availability.limited', 'Obmedzené'),
        };
      case 'unavailable':
        return {
          color: AppleDesign.Colors.systemRed,
          backgroundColor: AppleDesign.Colors.systemRed + '20',
          icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
          text: t('availability.unavailable', 'Nedostupné'),
        };
      default:
        return {
          color: AppleDesign.Colors.systemGray,
          backgroundColor: AppleDesign.Colors.systemGray + '20',
          icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
          text: t('availability.unknown', 'Neznáme'),
        };
    }
  };

  const getDeliveryConfig = () => {
    if (!availability.deliveryAvailable) {
      return null;
    }

    if (availability.deliveryFree) {
      return {
        color: AppleDesign.Colors.systemGreen,
        backgroundColor: AppleDesign.Colors.systemGreen + '20',
        icon: 'car' as keyof typeof Ionicons.glyphMap,
        text: t('delivery.free', 'Dovoz zdarma'),
      };
    }

    return {
      color: AppleDesign.Colors.systemBlue,
      backgroundColor: AppleDesign.Colors.systemBlue + '20',
      icon: 'car' as keyof typeof Ionicons.glyphMap,
      text: availability.deliveryPrice 
        ? t('delivery.paid', { price: availability.deliveryPrice, defaultValue: 'Dovoz €{{price}}' })
        : t('delivery.available', 'Dovoz možný'),
    };
  };

  const statusConfig = getStatusConfig();
  const deliveryConfig = getDeliveryConfig();

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={[styles.compactBadge, { backgroundColor: statusConfig.backgroundColor }]}>
          <Ionicons
            name={statusConfig.icon}
            size={12}
            color={statusConfig.color}
          />
          <Text style={[styles.compactText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
        </View>
        {showDelivery && deliveryConfig && (
          <View style={[styles.compactBadge, { backgroundColor: deliveryConfig.backgroundColor }]}>
            <Ionicons
              name={deliveryConfig.icon}
              size={12}
              color={deliveryConfig.color}
            />
            <Text style={[styles.compactText, { color: deliveryConfig.color }]}>
              {deliveryConfig.text}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Status Badge */}
      <View style={[styles.badge, { backgroundColor: statusConfig.backgroundColor }]}>
        <Ionicons
          name={statusConfig.icon}
          size={16}
          color={statusConfig.color}
        />
        <Text style={[styles.badgeText, { color: statusConfig.color }]}>
          {statusConfig.text}
        </Text>
      </View>

      {/* Delivery Badge */}
      {showDelivery && deliveryConfig && (
        <View style={[styles.badge, { backgroundColor: deliveryConfig.backgroundColor }]}>
          <Ionicons
            name={deliveryConfig.icon}
            size={16}
            color={deliveryConfig.color}
          />
          <Text style={[styles.badgeText, { color: deliveryConfig.color }]}>
            {deliveryConfig.text}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: AppleDesign.Spacing.xs,
  },
  compactContainer: {
    gap: AppleDesign.Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.xs,
    borderRadius: 12,
    gap: 4,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  badgeText: {
    ...AppleDesign.Typography.caption1,
    fontWeight: '600',
  },
  compactText: {
    ...AppleDesign.Typography.caption2,
    fontWeight: '600',
    fontSize: 10,
  },
});
