/**
 * 🎯 Personalized Offers Component
 * Display personalized offers and deals
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { PersonalizedOffer } from '../../../services/personalization-service';

interface PersonalizedOffersProps {
  offers: PersonalizedOffer[];
  onOfferPress: (offer: PersonalizedOffer) => void;
  onSeeAllPress: () => void;
}

export function PersonalizedOffers({
  offers,
  onOfferPress,
  onSeeAllPress,
}: PersonalizedOffersProps) {
  const { t } = useTranslation();

  const _formatTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Zostáva ${diffDays} ${diffDays === 1 ? 'deň' : diffDays < 5 ? 'dni' : 'dní'}`;
    } else if (diffHours > 0) {
      return `Zostáva ${diffHours} ${diffHours === 1 ? 'hodina' : diffHours < 5 ? 'hodiny' : 'hodín'}`;
    } else {
      return 'Končí čoskoro';
    }
  };

  const _getOfferGradient = (discount: number) => {
    if (discount >= 25) {
      return [AppleDesign.Colors.systemRed, AppleDesign.Colors.systemOrange];
    } else if (discount >= 15) {
      return [AppleDesign.Colors.systemOrange, AppleDesign.Colors.systemYellow];
    } else {
      return [AppleDesign.Colors.systemBlue, AppleDesign.Colors.systemPurple];
    }
  };


  if (offers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="pricetag-outline" size={48} color={AppleDesign.Colors.systemGray3} />
        <Text style={styles.emptyTitle}>Žiadne ponuky</Text>
        <Text style={styles.emptyText}>
          Personalizované ponuky sa zobrazia na základe vašej aktivity.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="pricetag" size={20} color={AppleDesign.Colors.systemOrange} />
          <Text style={styles.title}>Špeciálne ponuky</Text>
        </View>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>Zobraziť všetko</Text>
        </TouchableOpacity>
      </View>

      {/* Offers List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {offers.map((item, index) => (
          <React.Fragment key={item.id}>
            <OfferCard offer={item} onPress={() => onOfferPress(item)} />
            {index < offers.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Individual offer card component
 */
function OfferCard({ 
  offer, 
  onPress 
}: { 
  offer: PersonalizedOffer; 
  onPress: () => void;
}) {
  const _getOfferGradient = (discount: number): string[] => {
    if (discount >= 30) {
      return [AppleDesign.Colors.systemRed, AppleDesign.Colors.systemOrange];
    } else if (discount >= 20) {
      return [AppleDesign.Colors.systemOrange, AppleDesign.Colors.systemYellow];
    } else if (discount >= 10) {
      return [AppleDesign.Colors.systemGreen, AppleDesign.Colors.systemBlue];
    } else {
      return [AppleDesign.Colors.systemBlue, AppleDesign.Colors.systemPurple];
    }
  };

  const _formatTimeRemaining = (validUntilString: string): string => {
    try {
      const validUntil = new Date(validUntilString);
      const now = new Date();
      const diff = validUntil.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours < 24) {
        return `${hours}h zostáva`;
      } else {
        const days = Math.floor(hours / 24);
        return `${days}d zostáva`;
      }
    } catch (error) {
      return '24h zostáva'; // fallback
    }
  };

  const gradient = getOfferGradient(offer.discount);
  const timeRemaining = formatTimeRemaining(offer.validUntil);

  return (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient as any}
        style={styles.offerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{offer.discount}%</Text>
        </View>

        {/* Offer Content */}
        <View style={styles.offerContent}>
          <Text style={styles.offerTitle} numberOfLines={2}>
            {offer.title}
          </Text>
          <Text style={styles.offerDescription} numberOfLines={2}>
            {offer.description}
          </Text>

          {/* Time Remaining */}
          <View style={styles.timeContainer}>
            <Ionicons name="time" size={14} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.timeText}>{timeRemaining}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Použiť</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: AppleDesign.Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
    marginBottom: AppleDesign.Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginLeft: AppleDesign.Spacing.sm,
  },
  seeAllText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
  },
  separator: {
    width: AppleDesign.Spacing.md,
  },
  offerCard: {
    width: 300,
    height: 200,
    borderRadius: AppleDesign.BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  offerGradient: {
    flex: 1,
    padding: AppleDesign.Spacing.lg,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: AppleDesign.Spacing.md,
    right: AppleDesign.Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    borderRadius: AppleDesign.BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  discountText: {
    ...AppleDesign.Typography.title3,
    color: 'white',
    fontWeight: '700',
  },
  offerContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  offerTitle: {
    ...AppleDesign.Typography.title2,
    color: 'white',
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.sm,
    lineHeight: 28,
  },
  offerDescription: {
    ...AppleDesign.Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: AppleDesign.Spacing.md,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  timeText: {
    ...AppleDesign.Typography.caption1,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: AppleDesign.Spacing.xs,
    fontWeight: '500',
  },
  conditionsContainer: {
    marginBottom: AppleDesign.Spacing.md,
  },
  conditionsTitle: {
    ...AppleDesign.Typography.caption1,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  conditionText: {
    ...AppleDesign.Typography.caption2,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.lg,
    alignSelf: 'flex-start',
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    ...AppleDesign.Typography.body,
    fontWeight: '600',
    marginRight: AppleDesign.Spacing.sm,
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
    width: 80,
    height: 80,
    top: -20,
    right: -10,
  },
  circle2: {
    width: 50,
    height: 50,
    bottom: -10,
    left: -15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.xxl,
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
  },
  emptyTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginTop: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.sm,
  },
  emptyText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
});
