/**
 * FilterModal Component
 * Advanced filters for vehicle catalog with price range, category, brand, etc.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppleDesign } from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';

export interface FilterValues {
  priceMin?: string;
  priceMax?: string;
  category?: string;
  brand?: string;
  yearMin?: string;
  yearMax?: string;
  status?: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

const VEHICLE_CATEGORIES = [
  'nizka-trieda',
  'stredna-trieda',
  'vyssia-stredna',
  'luxusne',
  'sportove',
  'suv',
  'viacmiestne',
  'dodavky',
];

const VEHICLE_BRANDS = [
  'Škoda',
  'Volkswagen',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Toyota',
  'Hyundai',
  'Kia',
  'Peugeot',
  'Renault',
];

export function FilterModal({ visible, onClose, onApply, initialFilters = {} }: FilterModalProps) {
  const { t } = useTranslation(['catalog', 'common']);
  
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  const handleApply = useCallback(() => {
    onApply(filters);
    onClose();
  }, [filters, onApply, onClose]);

  const handleReset = useCallback(() => {
    setFilters({});
  }, []);

  const handleCategoryToggle = useCallback((category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  }, []);

  const handleBrandToggle = useCallback((brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brand: prev.brand === brand ? undefined : brand,
    }));
  }, []);

  const updateFilter = useCallback((key: keyof FilterValues, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={AppleDesign.Colors.label} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{t('catalog:filters.title')}</Text>
          
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>{t('catalog:filters.clearAll')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('catalog:filters.priceRange')}</Text>
            <View style={styles.priceInputs}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.inputLabel}>{t('common:labels.from')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={filters.priceMin}
                  onChangeText={(text) => updateFilter('priceMin', text)}
                  keyboardType="numeric"
                  placeholderTextColor={AppleDesign.Colors.placeholderText}
                />
                <Text style={styles.currencySymbol}>€</Text>
              </View>
              
              <Text style={styles.priceSeparator}>—</Text>
              
              <View style={styles.priceInputContainer}>
                <Text style={styles.inputLabel}>{t('common:labels.to')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="999"
                  value={filters.priceMax}
                  onChangeText={(text) => updateFilter('priceMax', text)}
                  keyboardType="numeric"
                  placeholderTextColor={AppleDesign.Colors.placeholderText}
                />
                <Text style={styles.currencySymbol}>€</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('catalog:filters.vehicleType')}</Text>
            <View style={styles.chipContainer}>
              {VEHICLE_CATEGORIES.map((category) => {
                const isSelected = filters.category === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                    onPress={() => handleCategoryToggle(category)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {t(`catalog:categories.${category}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Brand */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('catalog:filters.brand')}</Text>
            <View style={styles.chipContainer}>
              {VEHICLE_BRANDS.map((brand) => {
                const isSelected = filters.brand === brand;
                return (
                  <TouchableOpacity
                    key={brand}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                    onPress={() => handleBrandToggle(brand)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {brand}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Year Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('catalog:filters.year')}</Text>
            <View style={styles.priceInputs}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.inputLabel}>{t('common:labels.from')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2015"
                  value={filters.yearMin}
                  onChangeText={(text) => updateFilter('yearMin', text)}
                  keyboardType="numeric"
                  placeholderTextColor={AppleDesign.Colors.placeholderText}
                  maxLength={4}
                />
              </View>
              
              <Text style={styles.priceSeparator}>—</Text>
              
              <View style={styles.priceInputContainer}>
                <Text style={styles.inputLabel}>{t('common:labels.to')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024"
                  value={filters.yearMax}
                  onChangeText={(text) => updateFilter('yearMax', text)}
                  keyboardType="numeric"
                  placeholderTextColor={AppleDesign.Colors.placeholderText}
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>{t('catalog:filters.apply')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: AppleDesign.Spacing.lg,
  },
  section: {
    paddingVertical: AppleDesign.Spacing.lg,
  },
  sectionTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: AppleDesign.Colors.separator,
  },
  
  // Price Inputs
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  priceInputContainer: {
    flex: 1,
  },
  inputLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.xs,
  },
  input: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.input,
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.separator,
  },
  currencySymbol: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.tertiaryLabel,
    marginTop: AppleDesign.Spacing.xs,
  },
  priceSeparator: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.tertiaryLabel,
    marginTop: 20,
  },
  
  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppleDesign.Spacing.sm,
  },
  chip: {
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.badge,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.separator,
  },
  chipSelected: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderColor: AppleDesign.Colors.systemBlue,
  },
  chipText: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.label,
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Footer
  footer: {
    padding: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  applyButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
    paddingVertical: AppleDesign.Spacing.md,
    alignItems: 'center',
    ...AppleDesign.Shadows.small,
  },
  applyButtonText: {
    ...AppleDesign.Typography.headline,
    color: 'white',
    fontWeight: '700',
  },
});

