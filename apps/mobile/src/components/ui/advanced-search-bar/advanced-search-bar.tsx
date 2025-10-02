/**
 * 🔍 AdvancedSearchBar Component
 * Google Maps integrated search with autocomplete and filters
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Keyboard,
} from 'react-native';

import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { OptimizedFadeIn } from '../optimized-animations';

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'location' | 'vehicle' | 'brand' | 'recent';
  icon: keyof typeof Ionicons.glyphMap;
}

interface AdvancedSearchBarProps {
  onSearch?: (query: string) => void;
  onLocationSelect?: (location: string) => void;
  onFilterPress?: () => void;
  onSortPress?: () => void;
  placeholder?: string;
  showFilters?: boolean;
  filterCount?: number;
  style?: any;
}

// Mock search suggestions (in real app, these would come from Google Places API)
const mockSuggestions: SearchSuggestion[] = [
  {
    id: '1',
    title: 'Bratislava',
    subtitle: 'Hlavné mesto, Slovensko',
    type: 'location',
    icon: 'location-outline',
  },
  {
    id: '2',
    title: 'BMW 3 Series',
    subtitle: 'Luxusné sedan',
    type: 'vehicle',
    icon: 'car-outline',
  },
  {
    id: '3',
    title: 'Tesla',
    subtitle: 'Elektrické vozidlá',
    type: 'brand',
    icon: 'flash-outline',
  },
  {
    id: '4',
    title: 'Nitra',
    subtitle: 'Nitriansky kraj, Slovensko',
    type: 'location',
    icon: 'location-outline',
  },
  {
    id: '5',
    title: 'Mercedes-Benz',
    subtitle: 'Prémiová značka',
    type: 'brand',
    icon: 'diamond-outline',
  },
];

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  onSearch,
  onLocationSelect,
  onFilterPress,
  onSortPress,
  placeholder = 'Hľadať vozidlá, lokality...',
  showFilters = true,
  filterCount = 0,
  style,
}) => {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    if (text.length > 0) {
      // Filter suggestions based on search query
      const filtered = mockSuggestions.filter(
        suggestion =>
          suggestion.title.toLowerCase().includes(text.toLowerCase()) ||
          suggestion.subtitle?.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    haptic.light();
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    if (suggestion.type === 'location') {
      onLocationSelect?.(suggestion.title);
    } else {
      onSearch?.(suggestion.title);
    }
  };

  const handleSearchSubmit = () => {
    haptic.medium();
    setShowSuggestions(false);
    Keyboard.dismiss();
    onSearch?.(searchQuery);
  };

  const handleFilterPress = () => {
    haptic.light();
    onFilterPress?.();
  };

  const handleSortPress = () => {
    haptic.light();
    onSortPress?.();
  };

  const handleFocus = () => {
    if (searchQuery.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for suggestion tap
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.suggestionIcon, { backgroundColor: getSuggestionColor(item.type) + '20' }]}>
        <Ionicons
          name={item.icon}
          size={20}
          color={getSuggestionColor(item.type)}
        />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <Ionicons
        name="arrow-up-outline"
        size={16}
        color={AppleDesign.Colors.tertiaryLabel}
      />
    </TouchableOpacity>
  );

  const _getSuggestionColor = (type: string) => {
    switch (type) {
      case 'location': return AppleDesign.Colors.systemBlue;
      case 'vehicle': return AppleDesign.Colors.systemGreen;
      case 'brand': return AppleDesign.Colors.systemOrange;
      case 'recent': return AppleDesign.Colors.systemPurple;
      default: return AppleDesign.Colors.systemGray;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Input Container */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={AppleDesign.Colors.tertiaryLabel}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={AppleDesign.Colors.tertiaryLabel}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={AppleDesign.Colors.tertiaryLabel}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter and Sort Buttons */}
        {showFilters && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleFilterPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="filter"
                size={20}
                color={AppleDesign.Colors.systemBlue}
              />
              {filterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{filterCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={handleSortPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="swap-vertical"
                size={20}
                color={AppleDesign.Colors.systemBlue}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <OptimizedFadeIn delay={0}>
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          </View>
        </OptimizedFadeIn>
      )}
    </View>
  );
};

const _getSuggestionColor = (type: string) => {
  switch (type) {
    case 'location': return AppleDesign.Colors.systemBlue;
    case 'vehicle': return AppleDesign.Colors.systemGreen;
    case 'brand': return AppleDesign.Colors.systemOrange;
    case 'recent': return AppleDesign.Colors.systemPurple;
    default: return AppleDesign.Colors.systemGray;
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
    paddingVertical: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBackground,
    gap: AppleDesign.Spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.medium,
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    ...AppleDesign.Shadows.card,
  },
  searchInput: {
    flex: 1,
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    marginLeft: AppleDesign.Spacing.sm,
    marginRight: AppleDesign.Spacing.sm,
  },
  clearButton: {
    padding: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.sm,
  },
  filterButton: {
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.medium,
    padding: AppleDesign.Spacing.sm,
    position: 'relative',
    ...AppleDesign.Shadows.card,
  },
  sortButton: {
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.medium,
    padding: AppleDesign.Spacing.sm,
    ...AppleDesign.Shadows.card,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: AppleDesign.Colors.systemRed,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...AppleDesign.Typography.caption2,
    color: 'white',
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    marginHorizontal: AppleDesign.Spacing.screenPadding,
    maxHeight: 300,
    ...AppleDesign.Shadows.modal,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
  },
  suggestionSubtitle: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: 2,
  },
});
