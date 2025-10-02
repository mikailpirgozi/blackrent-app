/**
 * 🚗 CategoryGrid Component
 * Booking.com style vehicle categories grid
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';

export interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  count?: number;
  description?: string;
}

interface CategoryGridProps {
  categories?: Category[];
  onCategoryPress?: (category: Category) => void;
  style?: any;
}

const defaultCategories: Category[] = [
  {
    id: 'luxury',
    name: 'Luxusné',
    icon: 'diamond-outline',
    color: '#AF52DE', // systemPurple
    count: 24,
    description: 'Premium vozidlá',
  },
  {
    id: 'sport',
    name: 'Športové',
    icon: 'flash-outline',
    color: '#FF9500', // systemOrange
    count: 18,
    description: 'Výkonné autá',
  },
  {
    id: 'economy',
    name: 'Economy',
    icon: 'leaf-outline',
    color: '#34C759', // systemGreen
    count: 42,
    description: 'Úsporné vozidlá',
  },
  {
    id: 'suv',
    name: 'SUV',
    icon: 'car-outline',
    color: '#007AFF', // systemBlue
    count: 31,
    description: 'Veľké vozidlá',
  },
  {
    id: 'electric',
    name: 'Elektrické',
    icon: 'battery-charging-outline',
    color: '#5AC8FA', // systemTeal
    count: 16,
    description: 'Ekologické autá',
  },
  {
    id: 'van',
    name: 'Dodávky',
    icon: 'bus-outline',
    color: '#5856D6', // systemIndigo
    count: 12,
    description: 'Nákladné vozidlá',
  },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories = defaultCategories,
  onCategoryPress,
  style,
}) => {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();

  const handleCategoryPress = (category: Category) => {
    haptic.light();
    onCategoryPress?.(category);
    // Navigate to catalog with category filter
    router.push({
      pathname: '/(tabs)/catalog',
      params: { category: category.id },
    });
  };

  return (
    <View style={[styles.container, style]}>
      <OptimizedFadeIn delay={200}>
        <Text style={styles.sectionTitle}>
          {t('categories.title', 'Kategórie vozidiel')}
        </Text>
      </OptimizedFadeIn>

      <View style={styles.grid}>
        {categories.map((category, index) => (
          <OptimizedSlideIn
            key={category.id}
            delay={300 + index * 50}
            direction="up"
          >
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              {/* Icon Container */}
              <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                <Ionicons
                  name={category.icon}
                  size={28}
                  color={category.color}
                />
              </View>

              {/* Category Info */}
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>
                  {category.name}
                </Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
                {category.count && (
                  <Text style={styles.categoryCount}>
                    {category.count} vozidiel
                  </Text>
                )}
              </View>

              {/* Arrow */}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={AppleDesign.Colors.tertiaryLabel}
              />
            </TouchableOpacity>
          </OptimizedSlideIn>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
    paddingVertical: AppleDesign.Spacing.lg,
  },
  sectionTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  grid: {
    gap: AppleDesign.Spacing.md,
  },
  categoryCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...AppleDesign.Shadows.card,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    marginBottom: 2,
  },
  categoryDescription: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: 4,
  },
  categoryCount: {
    ...AppleDesign.Typography.caption2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
});
