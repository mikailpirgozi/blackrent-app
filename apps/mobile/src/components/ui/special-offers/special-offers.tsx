/**
 * 🎁 SpecialOffers Component
 * Booking.com style special offers and deals
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';
import { SmartImage } from '../smart-image';

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  image?: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLimited?: boolean;
}

interface SpecialOffersProps {
  offers?: SpecialOffer[];
  onOfferPress?: (offer: SpecialOffer) => void;
  style?: any;
}

const defaultOffers: SpecialOffer[] = [
  {
    id: 'weekend-deal',
    title: 'Víkendová zľava',
    description: 'Prenájom na víkend s 25% zľavou',
    discount: '-25%',
    validUntil: '31.12.2024',
    color: '#FF3B30', // systemRed
    icon: 'calendar-outline',
    isLimited: true,
  },
  {
    id: 'first-booking',
    title: 'Prvá rezervácia',
    description: 'Zľava 20% pre nových zákazníkov',
    discount: '-20%',
    validUntil: 'Bez obmedzenia',
    color: '#34C759', // systemGreen
    icon: 'gift-outline',
  },
  {
    id: 'long-term',
    title: 'Dlhodobý prenájom',
    description: 'Prenájom na 7+ dní so zľavou',
    discount: '-30%',
    validUntil: '15.01.2025',
    color: '#007AFF', // systemBlue
    icon: 'time-outline',
  },
  {
    id: 'luxury-cars',
    title: 'Luxusné vozidlá',
    description: 'Prémiové autá s výhodnou cenou',
    discount: '-15%',
    validUntil: '28.02.2025',
    color: '#AF52DE', // systemPurple
    icon: 'diamond-outline',
    isLimited: true,
  },
];

export const SpecialOffers: React.FC<SpecialOffersProps> = ({
  offers = defaultOffers,
  onOfferPress,
  style,
}) => {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();

  const handleOfferPress = (offer: SpecialOffer) => {
    haptic.light();
    onOfferPress?.(offer);
    // Navigate to catalog with offer filter
    router.push({
      pathname: '/(tabs)/catalog',
      params: { offer: offer.id },
    });
  };

  return (
    <View style={[styles.container, style]}>
      <OptimizedFadeIn delay={400}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>
            {String(t('offers.title', 'Špeciálne ponuky'))}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/store')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>
              {String(t('common.seeAll', 'Zobraziť všetky'))}
            </Text>
          </TouchableOpacity>
        </View>
      </OptimizedFadeIn>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {offers.map((offer, index) => (
          <OptimizedSlideIn
            key={offer.id}
            delay={500 + index * 100}
            direction="left"
          >
            <TouchableOpacity
              style={[styles.offerCard, { borderLeftColor: offer.color }]}
              onPress={() => handleOfferPress(offer)}
              activeOpacity={0.8}
            >
              {/* Limited Badge */}
              {offer.isLimited && (
                <View style={[styles.limitedBadge, { backgroundColor: offer.color }]}>
                  <Text style={styles.limitedText}>
                    {String(t('offers.limited', 'Obmedzené'))}
                  </Text>
                </View>
              )}

              {/* Offer Header */}
              <View style={styles.offerHeader}>
                <View style={[styles.iconContainer, { backgroundColor: offer.color + '20' }]}>
                  <Ionicons
                    name={offer.icon}
                    size={24}
                    color={offer.color}
                  />
                </View>
                <View style={[styles.discountBadge, { backgroundColor: offer.color }]}>
                  <Text style={styles.discountText}>
                    {offer.discount}
                  </Text>
                </View>
              </View>

              {/* Offer Content */}
              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>
                  {offer.title}
                </Text>
                <Text style={styles.offerDescription}>
                  {offer.description}
                </Text>
                <Text style={styles.validUntil}>
                  {String(t('offers.validUntil', 'Platné do'))}: {offer.validUntil}
                </Text>
              </View>

              {/* Action Arrow */}
              <View style={styles.actionContainer}>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={offer.color}
                />
              </View>
            </TouchableOpacity>
          </OptimizedSlideIn>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: AppleDesign.Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
    marginBottom: AppleDesign.Spacing.lg,
  },
  sectionTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  seeAllText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  scrollView: {
    paddingLeft: AppleDesign.Spacing.screenPadding,
  },
  scrollContent: {
    paddingRight: AppleDesign.Spacing.screenPadding,
  },
  offerCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    marginRight: AppleDesign.Spacing.md,
    width: 280,
    borderLeftWidth: 4,
    position: 'relative',
    ...AppleDesign.Shadows.card,
  },
  limitedBadge: {
    position: 'absolute',
    top: AppleDesign.Spacing.sm,
    right: AppleDesign.Spacing.sm,
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  limitedText: {
    ...AppleDesign.Typography.caption2,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  discountText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    fontWeight: '700',
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    marginBottom: AppleDesign.Spacing.xs,
  },
  offerDescription: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.sm,
    lineHeight: 22,
  },
  validUntil: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.tertiaryLabel,
    marginBottom: AppleDesign.Spacing.md,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
});
