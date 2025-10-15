/**
 * 🍎 Apple Card Component
 * iOS-style card component following Apple's design guidelines
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import AppleDesign from '../../../styles/apple-design-system';

interface AppleCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  flat?: boolean;
  testID?: string;
}

export function AppleCard({ 
  children, 
  style, 
  elevated = false, 
  flat = false,
  testID,
}: AppleCardProps) {
  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    flat && styles.flat,
    style,
  ];

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.card,
    padding: AppleDesign.Spacing.lg,
    ...AppleDesign.Shadows.card,
  },
  elevated: {
    ...AppleDesign.Shadows.large,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
  },
});

