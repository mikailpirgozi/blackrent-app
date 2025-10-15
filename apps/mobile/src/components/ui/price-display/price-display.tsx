/**
 * 💰 Price Display Component
 * Displays formatted price with currency
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import AppleDesign from '../../../styles/apple-design-system';

interface PriceDisplayProps {
  price: number;
  currency?: string;
  period?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showDecimals?: boolean;
}

export function PriceDisplay({
  price,
  currency = '€',
  period = '/deň',
  size = 'medium',
  style,
  showDecimals = false,
}: PriceDisplayProps) {
  const formattedPrice = showDecimals
    ? price.toFixed(2)
    : Math.round(price).toString();

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  const periodSizeStyles = {
    small: styles.periodSmall,
    medium: styles.periodMedium,
    large: styles.periodLarge,
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.price, sizeStyles[size]]}>
        {formattedPrice}
        {currency}
      </Text>
      {period && (
        <Text style={[styles.period, periodSizeStyles[size]]}>
          {period}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontWeight: '700',
    color: AppleDesign.Colors.label,
  },
  small: {
    fontSize: 14,
  },
  medium: {
    fontSize: 20,
  },
  large: {
    fontSize: 28,
  },
  period: {
    fontWeight: '400',
    color: AppleDesign.Colors.secondaryLabel,
  },
  periodSmall: {
    fontSize: 12,
  },
  periodMedium: {
    fontSize: 14,
  },
  periodLarge: {
    fontSize: 16,
  },
});



