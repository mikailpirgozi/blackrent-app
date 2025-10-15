/**
 * 🚗 Catalog Screen
 * Vehicle catalog with search, filters, and real API data
 * Enhanced with Light/Dark mode support
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppleDesign from '../../styles/apple-design-system';

import { useInfiniteVehicles } from '../../hooks/api/use-vehicles';
import { EnhancedVehicleCard } from '../../components/ui/enhanced-vehicle-card';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { useTheme } from '../../contexts/ThemeContext';
import type { Vehicle } from '../../types/vehicle';
import { FilterModal, type FilterValues } from '../../components/vehicle/FilterModal';

export default function CatalogScreen() {
  const router = useRouter();
  const { t } = useTranslation(['catalog', 'common']);
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteVehicles({
    search: searchQuery || undefined,
    limit: 20,
    ...filters,
  });
  
  // Flatten pages into single vehicle array
  const vehicles = data?.pages.flatMap((page: { vehicles: Vehicle[] }) => page.vehicles) || [];

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleVehiclePress = useCallback((vehicleId: string) => {
    router.push(`/vehicle/${vehicleId}`);
  }, [router]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleFilterPress = useCallback(() => {
    setShowFilters(true);
  }, []);

  const handleApplyFilters = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => createDynamicStyles(theme, isDark), [theme, isDark]);

  if (isLoading && !data) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <View style={styles.loadingContainer} testID="catalog-loading">
          <ActivityIndicator size="large" color={theme.brand.primary} />
          <Text style={[styles.loadingText, dynamicStyles.secondaryText]}>
            {t('catalog:loadingVehicles')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <View style={styles.errorContainer} testID="catalog-error">
          <Ionicons name="alert-circle" size={48} color={theme.semantic.error} />
          <Text style={[styles.errorText, dynamicStyles.text]}>
            {t('catalog:errorLoading')}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>{t('common:buttons.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={AppleDesign.Colors.systemBlue} />
        <Text style={styles.footerLoaderText}>{t('catalog:loadMore')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, dynamicStyles.text]}>
          {t('catalog:title')}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, dynamicStyles.searchInput]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={isDark ? theme.colors.dark.tertiaryLabel : theme.colors.tertiaryLabel} 
          />
          <TextInput
            style={[styles.searchInput, dynamicStyles.text]}
            placeholder={t('catalog:searchPlaceholder')}
            placeholderTextColor={isDark ? theme.colors.dark.tertiaryLabel : theme.colors.placeholderText}
            value={searchQuery}
            onChangeText={handleSearch}
            testID="search-input"
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, dynamicStyles.searchInput]}
          onPress={handleFilterPress}
          testID="filter-button"
        >
          <Ionicons name="options" size={24} color={theme.brand.primary} />
        </TouchableOpacity>
      </View>

      {/* Vehicle List with Infinite Scroll */}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EnhancedVehicleCard
            vehicle={item}
            onPress={() => handleVehiclePress(item.id)}
          />
        )}
        contentContainerStyle={styles.vehicleList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!data}
            onRefresh={handleRefresh}
            tintColor={theme.brand.primary}
            testID="catalog-refresh"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer} testID="catalog-empty">
            <Ionicons 
              name="car-outline" 
              size={64} 
              color={isDark ? theme.colors.dark.tertiaryLabel : theme.colors.tertiaryLabel} 
            />
            <Text style={[styles.emptyText, dynamicStyles.text]}>
              {t('catalog:noVehicles')}
            </Text>
            <Text style={[styles.emptySubtext, dynamicStyles.secondaryText]}>
              {t('catalog:noVehiclesDescription')}
            </Text>
          </View>
        }
        ListFooterComponent={renderFooter}
        testID="catalog-list"
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={handleCloseFilters}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },
  
  // Header
  header: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
  },
  headerTitle: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.md,
    gap: AppleDesign.Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.input,
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    gap: AppleDesign.Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: AppleDesign.Colors.label,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.input,
  },
  
  // Content
  vehicleList: {
    padding: AppleDesign.Spacing.lg,
  },
  
  // Footer Loader
  footerLoader: {
    paddingVertical: AppleDesign.Spacing.lg,
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  footerLoaderText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  loadingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
    paddingHorizontal: AppleDesign.Spacing.xl,
  },
  errorText: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.md,
    paddingHorizontal: AppleDesign.Spacing.xl,
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.button,
  },
  retryButtonText: {
    ...AppleDesign.Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.xxl,
    gap: AppleDesign.Spacing.md,
  },
  emptyText: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  emptySubtext: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
  },
});

/**
 * Create dynamic styles based on current theme
 */
function createDynamicStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.dynamicColors.background,
    },
    text: {
      color: theme.dynamicColors.text,
    },
    secondaryText: {
      color: theme.dynamicColors.secondaryText,
    },
    searchInput: {
      backgroundColor: isDark 
        ? theme.colors.dark.tertiarySystemFill 
        : theme.colors.tertiarySystemFill,
    },
  });
}

