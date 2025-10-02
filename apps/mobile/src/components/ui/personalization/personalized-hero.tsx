/**
 * 🎯 Personalized Hero Component
 * Dynamic hero section with personalized message and quick actions
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';

const { width: screenWidth } = Dimensions.get('window');

interface PersonalizedHeroProps {
  message: string;
  userName?: string;
  onSearchPress: () => void;
  onOffersPress: () => void;
  onFavoritesPress: () => void;
}

export function PersonalizedHero({
  message,
  userName,
  onSearchPress,
  onOffersPress,
  onFavoritesPress,
}: PersonalizedHeroProps) {
  const { t } = useTranslation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dobré ráno';
    if (hour < 18) return 'Dobrý deň';
    return 'Dobrý večer';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[AppleDesign.Colors.systemBlue, AppleDesign.Colors.systemBlue + '80']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Greeting and Message */}
        <View style={styles.messageContainer}>
          {userName && (
            <Text style={styles.greeting}>
              {getGreeting()}, {userName}!
            </Text>
          )}
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={onSearchPress}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="search" size={24} color={AppleDesign.Colors.systemBlue} />
            </View>
            <Text style={styles.actionText}>Hľadať</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onOffersPress}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="pricetag" size={24} color={AppleDesign.Colors.systemOrange} />
            </View>
            <Text style={styles.actionText}>Ponuky</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onFavoritesPress}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="heart" size={24} color={AppleDesign.Colors.systemRed} />
            </View>
            <Text style={styles.actionText}>Obľúbené</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <View style={[styles.decorativeCircle, styles.circle1]} />
          <View style={[styles.decorativeCircle, styles.circle2]} />
          <View style={[styles.decorativeCircle, styles.circle3]} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: AppleDesign.Spacing.screenPadding,
    marginVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.large,
    overflow: 'hidden',
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    padding: AppleDesign.Spacing.lg,
    minHeight: 120,
    position: 'relative',
  },
  messageContainer: {
    marginBottom: AppleDesign.Spacing.md,
    zIndex: 2,
  },
  greeting: {
    ...AppleDesign.Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: AppleDesign.Spacing.xs,
  },
  message: {
    ...AppleDesign.Typography.title2,
    color: 'white',
    fontWeight: '700',
    lineHeight: 28,
    maxWidth: screenWidth - 120,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppleDesign.Spacing.sm,
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    ...AppleDesign.Typography.caption1,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  circle2: {
    width: 60,
    height: 60,
    bottom: -10,
    left: -10,
  },
  circle3: {
    width: 40,
    height: 40,
    top: 20,
    right: 60,
  },
});
