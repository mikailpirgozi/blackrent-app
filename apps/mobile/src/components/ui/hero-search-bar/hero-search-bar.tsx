/**
 * 🔍 HeroSearchBar Component
 * Booking.com style hero search bar with location, dates, and guests
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { OptimizedFadeIn } from '../optimized-animations';

interface HeroSearchBarProps {
  onLocationPress?: () => void;
  onDatesPress?: () => void;
  onGuestsPress?: () => void;
  onSearchPress?: () => void;
  style?: any;
}

export const HeroSearchBar: React.FC<HeroSearchBarProps> = ({
  onLocationPress,
  onDatesPress,
  onGuestsPress,
  onSearchPress,
  style,
}) => {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<string>('');
  const [selectedGuests, setSelectedGuests] = useState<string>('');

  const handleLocationPress = () => {
    haptic.light();
    onLocationPress?.();
    // Navigate to location picker
    router.push('/(tabs)/catalog');
  };

  const handleDatesPress = () => {
    haptic.light();
    onDatesPress?.();
    // Navigate to date picker
    router.push('/(tabs)/catalog');
  };

  const handleGuestsPress = () => {
    haptic.light();
    onGuestsPress?.();
    // Navigate to guests selector
    router.push('/(tabs)/catalog');
  };

  const handleSearchPress = () => {
    haptic.medium();
    onSearchPress?.();
    // Navigate to search results
    router.push('/(tabs)/catalog');
  };

  return (
    <OptimizedFadeIn delay={100}>
      <View style={[styles.container, style]}>
        {/* Search Card */}
        <View style={styles.searchCard}>
          {/* Location */}
          <TouchableOpacity
            style={styles.searchItem}
            onPress={handleLocationPress}
            activeOpacity={0.7}
          >
            <View style={styles.searchItemContent}>
              <Ionicons
                name="location-outline"
                size={24}
                color={AppleDesign.Colors.systemBlue}
              />
              <View style={styles.searchItemText}>
                <Text style={styles.searchItemLabel}>
                  {t('search.location')}
                </Text>
                <Text style={styles.searchItemValue}>
                  {selectedLocation || t('search.locationPlaceholder')}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={AppleDesign.Colors.tertiaryLabel}
            />
          </TouchableOpacity>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Dates */}
          <TouchableOpacity
            style={styles.searchItem}
            onPress={handleDatesPress}
            activeOpacity={0.7}
          >
            <View style={styles.searchItemContent}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={AppleDesign.Colors.systemBlue}
              />
              <View style={styles.searchItemText}>
                <Text style={styles.searchItemLabel}>
                  {t('search.dates')}
                </Text>
                <Text style={styles.searchItemValue}>
                  {selectedDates || t('search.datesPlaceholder')}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={AppleDesign.Colors.tertiaryLabel}
            />
          </TouchableOpacity>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Guests */}
          <TouchableOpacity
            style={styles.searchItem}
            onPress={handleGuestsPress}
            activeOpacity={0.7}
          >
            <View style={styles.searchItemContent}>
              <Ionicons
                name="people-outline"
                size={24}
                color={AppleDesign.Colors.systemBlue}
              />
              <View style={styles.searchItemText}>
                <Text style={styles.searchItemLabel}>
                  {t('search.guests')}
                </Text>
                <Text style={styles.searchItemValue}>
                  {selectedGuests || t('search.guestsPlaceholder')}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={AppleDesign.Colors.tertiaryLabel}
            />
          </TouchableOpacity>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchPress}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color="white" />
          <Text style={styles.searchButtonText}>
            {t('search.searchVehicles')}
          </Text>
        </TouchableOpacity>
      </View>
    </OptimizedFadeIn>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
    paddingVertical: AppleDesign.Spacing.lg,
  },
  searchCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    marginBottom: AppleDesign.Spacing.lg,
    ...AppleDesign.Shadows.card,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    minHeight: 60,
  },
  searchItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchItemText: {
    marginLeft: AppleDesign.Spacing.md,
    flex: 1,
  },
  searchItemLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: 2,
  },
  searchItemValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
  },
  separator: {
    height: 0.5,
    backgroundColor: AppleDesign.Colors.separator,
    marginLeft: AppleDesign.Spacing.lg + 24 + AppleDesign.Spacing.md, // Icon width + margin
  },
  searchButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.medium,
    paddingVertical: AppleDesign.Spacing.md,
    paddingHorizontal: AppleDesign.Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...AppleDesign.Shadows.button,
  },
  searchButtonText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    marginLeft: AppleDesign.Spacing.sm,
  },
});
