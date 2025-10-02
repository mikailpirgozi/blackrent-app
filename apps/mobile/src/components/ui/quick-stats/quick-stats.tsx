/**
 * 📊 QuickStats Component
 * Premium statistics display with gradients and animations
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';

const { width: screenWidth } = Dimensions.get('window');

export interface Stat {
  id: string;
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface QuickStatsProps {
  stats?: Stat[];
  style?: any;
}

const defaultStats: Stat[] = [
  {
    id: 'vehicles',
    value: '500+',
    label: 'Vozidiel',
    icon: 'car',
    color: '#007AFF', // systemBlue
  },
  {
    id: 'locations',
    value: '50+',
    label: 'Miest',
    icon: 'location',
    color: '#34C759', // systemGreen
  },
  {
    id: 'customers',
    value: '10K+',
    label: 'Spokojných zákazníkov',
    icon: 'people',
    color: '#FF9500', // systemOrange
  },
  {
    id: 'rating',
    value: '4.8',
    label: 'Hodnotenie',
    icon: 'star',
    color: '#FFCC00', // systemYellow
  },
];

export const QuickStats: React.FC<QuickStatsProps> = ({
  stats = defaultStats,
  style,
}) => {
  const { t } = useTranslation();

  const getGradientColors = (color: string) => {
    switch (color) {
      case '#007AFF':
        return ['#007AFF', '#5AC8FA'];
      case '#34C759':
        return ['#34C759', '#30D158'];
      case '#FF9500':
        return ['#FF9500', '#FFCC00'];
      case '#FFCC00':
        return ['#FFCC00', '#FFD60A'];
      default:
        return [color, color];
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Enhanced Title with Gradient Background */}
      <OptimizedFadeIn delay={600}>
        <LinearGradient
          colors={['#007AFF', '#5AC8FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleContainer}
        >
          <Text style={styles.sectionTitle}>
            {t('stats.title', 'BlackRent v číslach')}
          </Text>
        </LinearGradient>
      </OptimizedFadeIn>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <OptimizedSlideIn
            key={stat.id}
            delay={700 + index * 100}
            direction="up"
          >
            <LinearGradient
              colors={getGradientColors(stat.color) as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              {/* Background Pattern */}
              <View style={styles.backgroundPattern}>
                <View style={[styles.patternCircle, styles.circle1]} />
                <View style={[styles.patternCircle, styles.circle2]} />
                <View style={[styles.patternCircle, styles.circle3]} />
              </View>

              {/* Content */}
              <View style={styles.statContent}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={stat.icon}
                    size={32}
                    color="white"
                  />
                </View>

                {/* Value */}
                <Text style={styles.statValue}>
                  {stat.value}
                </Text>

                {/* Label */}
                <Text style={styles.statLabel}>
                  {stat.label}
                </Text>
              </View>
            </LinearGradient>
          </OptimizedSlideIn>
        ))}
      </View>

      {/* Enhanced Trust Indicators */}
      <OptimizedFadeIn delay={1100}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 249, 250, 0.95)']}
          style={styles.trustIndicators}
        >
          <Text style={styles.trustTitle}>
            {t('trust.title', 'Prečo si vybrať BlackRent?')}
          </Text>
          
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <LinearGradient
                colors={['#34C759', '#30D158']}
                style={styles.trustIconContainer}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color="white"
                />
              </LinearGradient>
              <Text style={styles.trustText}>
                {t('trust.verified', 'Overené autopožičovne')}
              </Text>
            </View>
            
            <View style={styles.trustItem}>
              <LinearGradient
                colors={['#007AFF', '#5AC8FA']}
                style={styles.trustIconContainer}
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color="white"
                />
              </LinearGradient>
              <Text style={styles.trustText}>
                {t('trust.secure', 'Bezpečné platby')}
              </Text>
            </View>
            
            <View style={styles.trustItem}>
              <LinearGradient
                colors={['#FF9500', '#FFCC00']}
                style={styles.trustIconContainer}
              >
                <Ionicons
                  name="headset"
                  size={20}
                  color="white"
                />
              </LinearGradient>
              <Text style={styles.trustText}>
                {t('trust.support', '24/7 podpora')}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </OptimizedFadeIn>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
    paddingVertical: AppleDesign.Spacing.xl,
  },
  titleContainer: {
    borderRadius: AppleDesign.BorderRadius.xl,
    paddingVertical: AppleDesign.Spacing.lg,
    paddingHorizontal: AppleDesign.Spacing.xl,
    marginBottom: AppleDesign.Spacing.xl,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionTitle: {
    ...AppleDesign.Typography.title1,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: AppleDesign.Spacing.xl,
  },
  statCard: {
    borderRadius: AppleDesign.BorderRadius.xl,
    width: (screenWidth - AppleDesign.Spacing.screenPadding * 2 - AppleDesign.Spacing.md) / 2,
    height: 140,
    marginBottom: AppleDesign.Spacing.lg,
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 60,
    height: 60,
    top: -20,
    right: -15,
  },
  circle2: {
    width: 40,
    height: 40,
    bottom: -10,
    left: -10,
  },
  circle3: {
    width: 25,
    height: 25,
    top: 30,
    right: 20,
  },
  statContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppleDesign.Spacing.lg,
    zIndex: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: AppleDesign.Spacing.md,
  },
  statValue: {
    ...AppleDesign.Typography.largeTitle,
    color: 'white',
    fontWeight: '800',
    marginBottom: AppleDesign.Spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    ...AppleDesign.Typography.caption1,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
  },
  trustIndicators: {
    borderRadius: AppleDesign.BorderRadius.xl,
    padding: AppleDesign.Spacing.xl,
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  trustTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: AppleDesign.Spacing.lg,
  },
  trustGrid: {
    gap: AppleDesign.Spacing.lg,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.sm,
  },
  trustIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  trustText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    flex: 1,
  },
});
