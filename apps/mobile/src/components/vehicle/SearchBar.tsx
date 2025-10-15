/**
 * SearchBar Component
 * Advanced search with autocomplete, recent searches, and voice input
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
  Keyboard,
  Modal,
  type ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDebounce } from '../../hooks/use-debounce';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import AppleDesign from '../../styles/apple-design-system';

const RECENT_SEARCHES_KEY = '@blackrent:recent_searches';
const MAX_RECENT_SEARCHES = 10;

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  testID?: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'category' | 'brand';
  icon?: string;
}

/**
 * Popular vehicle brands for suggestions
 */
const POPULAR_BRANDS = [
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volkswagen',
  'Škoda',
  'Toyota',
  'Ford',
  'Renault',
  'Peugeot',
  'Hyundai',
];

/**
 * Vehicle categories for suggestions
 */
const VEHICLE_CATEGORIES = [
  { key: 'nizka-trieda', label: 'Economy' },
  { key: 'stredna-trieda', label: 'Standard' },
  { key: 'suv', label: 'SUV' },
  { key: 'luxusne', label: 'Luxury' },
  { key: 'sportove', label: 'Sport' },
];

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  autoFocus = false,
  onFocus,
  onBlur,
  testID = 'search-bar',
}: SearchBarProps) {
  const { t } = useTranslation(['common', 'catalog']);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const debouncedSearchText = useDebounce(value, 300);

  /**
   * Load recent searches from storage
   */
  useEffect(() => {
    loadRecentSearches();
  }, []);

  /**
   * Generate suggestions based on search text
   */
  useEffect(() => {
    if (debouncedSearchText.trim().length === 0) {
      // Show recent searches when empty
      const recentSuggestions: SearchSuggestion[] = recentSearches.map((text, index) => ({
        id: `recent-${index}`,
        text,
        type: 'recent',
        icon: 'time-outline',
      }));
      setSuggestions(recentSuggestions);
      return;
    }

    const searchLower = debouncedSearchText.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Match brands
    const matchingBrands = POPULAR_BRANDS.filter((brand) =>
      brand.toLowerCase().includes(searchLower)
    );
    matchingBrands.forEach((brand) => {
      newSuggestions.push({
        id: `brand-${brand}`,
        text: brand,
        type: 'brand',
        icon: 'car-outline',
      });
    });

    // Match categories
    const matchingCategories = VEHICLE_CATEGORIES.filter(
      (cat) =>
        cat.label.toLowerCase().includes(searchLower) ||
        cat.key.toLowerCase().includes(searchLower)
    );
    matchingCategories.forEach((cat) => {
      newSuggestions.push({
        id: `category-${cat.key}`,
        text: cat.label,
        type: 'category',
        icon: 'grid-outline',
      });
    });

    // Add current search as suggestion if not empty
    if (searchLower.length > 0) {
      newSuggestions.unshift({
        id: `search-${searchLower}`,
        text: debouncedSearchText,
        type: 'suggestion',
        icon: 'search-outline',
      });
    }

    setSuggestions(newSuggestions.slice(0, 8));
  }, [debouncedSearchText, recentSearches]);

  /**
   * Load recent searches from AsyncStorage
   */
  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  /**
   * Save search to recent searches
   */
  const saveRecentSearch = async (searchText: string) => {
    if (!searchText.trim()) return;

    try {
      // Remove duplicates and add to front
      const updated = [
        searchText,
        ...recentSearches.filter((s) => s !== searchText),
      ].slice(0, MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  /**
   * Clear all recent searches
   */
  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
      setSuggestions([]);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  /**
   * Handle input focus
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
    onFocus?.();
  }, [onFocus]);

  /**
   * Handle input blur
   */
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow tap on suggestion
    setTimeout(() => setShowSuggestions(false), 200);
    onBlur?.();
  }, [onBlur]);

  /**
   * Handle search submit
   */
  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
    if (value.trim()) {
      saveRecentSearch(value.trim());
      onSubmit?.(value.trim());
    }
    setShowSuggestions(false);
  }, [value, onSubmit]);

  /**
   * Handle suggestion tap
   */
  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      onChangeText(suggestion.text);
      saveRecentSearch(suggestion.text);
      onSubmit?.(suggestion.text);
      Keyboard.dismiss();
      setShowSuggestions(false);
    },
    [onChangeText, onSubmit]
  );

  /**
   * Handle clear button
   */
  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  /**
   * Render suggestion item
   */
  const renderSuggestion: ListRenderItem<SearchSuggestion> = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      testID={`suggestion-${item.id}`}
    >
      <Ionicons
        name={item.icon as keyof typeof Ionicons.glyphMap}
        size={20}
        color={AppleDesign.Colors.secondaryLabel}
        style={styles.suggestionIcon}
      />
      <Text style={styles.suggestionText}>{item.text}</Text>
      {item.type === 'recent' && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            const updated = recentSearches.filter((s) => s !== item.text);
            setRecentSearches(updated);
            AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
          }}
          testID={`remove-${item.id}`}
        >
          <Ionicons name="close" size={16} color={AppleDesign.Colors.tertiaryLabel} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? AppleDesign.Colors.systemBlue : AppleDesign.Colors.tertiaryLabel}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || t('catalog:searchPlaceholder')}
          placeholderTextColor={AppleDesign.Colors.placeholderText}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          testID={testID}
        />
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            testID="clear-search"
          >
            <Ionicons name="close-circle" size={20} color={AppleDesign.Colors.tertiaryLabel} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Modal */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={renderSuggestion}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              value.trim().length === 0 && recentSearches.length > 0 ? (
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsHeaderText}>
                    {t('common:labels.recentSearches')}
                  </Text>
                  <TouchableOpacity onPress={clearRecentSearches} testID="clear-recent">
                    <Text style={styles.clearAllText}>{t('common:buttons.clearAll')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            testID="suggestions-list"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  
  // Search Input
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.input,
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    gap: AppleDesign.Spacing.sm,
  },
  searchContainerFocused: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderWidth: 2,
    borderColor: AppleDesign.Colors.systemBlue,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: AppleDesign.Colors.label,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  
  // Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderRadius: AppleDesign.BorderRadius.card,
    maxHeight: 400,
    ...AppleDesign.Shadows.large,
    overflow: 'hidden',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  suggestionsHeaderText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  clearAllText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  suggestionIcon: {
    marginRight: AppleDesign.Spacing.sm,
  },
  suggestionText: {
    flex: 1,
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  removeButton: {
    padding: AppleDesign.Spacing.xs,
  },
});



