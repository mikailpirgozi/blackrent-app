/**
 * 🔍 UNIFIED FILTER SYSTEM
 * 
 * Konsoliduje všetky filter systémy do jedného inteligentného systému:
 * - RentalFilters.tsx (základné filtre)
 * - RentalAdvancedFilters.tsx (pokročilé filtre)  
 * - EnhancedRentalSearch.tsx (search s suggestions)
 * - useOptimizedFilters.ts (performance optimalizácie)
 */

import { useMemo, useCallback } from 'react';
import { Rental, Vehicle, Customer } from '../types';
import { logger } from './smartLogger';

// 🎯 UNIFIED FILTER INTERFACE
export interface UnifiedFilterOptions {
  // Základné filtre (z RentalFilters)
  vehicle?: string;
  company?: string;
  customer?: string;
  status?: string;
  paid?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  searchQuery?: string;
  
  // Priority filtre (z RentalFilters)
  showActive?: boolean;
  showTodayReturns?: boolean;
  showTomorrowReturns?: boolean;
  showUnconfirmed?: boolean;
  showFuture?: boolean;
  showOldConfirmed?: boolean;
  showConfirmed?: boolean;
  showAll?: boolean;
  
  // Pokročilé filtre (z RentalAdvancedFilters)
  priceMin?: string;
  priceMax?: string;
  protocolStatus?: string;
  customerName?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  licensePlate?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  insuranceCompany?: string;
  insuranceType?: string;
  timeFilter?: string;
  priceRange?: string;
  paymentStatus?: string;
  showOnlyActive?: boolean;
  showOnlyOverdue?: boolean;
  showOnlyCompleted?: boolean;
  
  // Search funkcie (z EnhancedRentalSearch)
  enableSearch?: boolean;
  enableSuggestions?: boolean;
  searchFields?: string[];
  
  // Performance optimalizácie (z useOptimizedFilters)
  enableMemoization?: boolean;
  enableDebounce?: boolean;
  debounceMs?: number;
}

export interface FilterResult<T> {
  data: T[];
  stats: {
    total: number;
    filtered: number;
    hasFilters: boolean;
    performance: {
      filterTime: number;
      searchTime: number;
    };
  };
  suggestions?: SearchSuggestion[];
}

export interface SearchSuggestion {
  id: string;
  type: 'rental' | 'customer' | 'vehicle' | 'company';
  label: string;
  value: string;
  metadata?: any;
}

/**
 * 🎯 UNIFIED FILTER ENGINE
 * Hlavná trieda ktorá kombinuje všetky filter funkcie
 */
class UnifiedFilterEngine {
  private cache = new Map<string, any>();
  private stats = { hits: 0, misses: 0 };

  /**
   * 🔍 Hlavná filter metóda - kombinuje všetky systémy
   */
  async filter<T extends Rental>(
    data: T[],
    options: UnifiedFilterOptions,
    context?: {
      vehicles?: Vehicle[];
      customers?: Customer[];
      companies?: string[];
    }
  ): Promise<FilterResult<T>> {
    const startTime = performance.now();
    
    logger.debug('🔍 UNIFIED FILTER: Starting filter operation', {
      dataCount: data.length,
      options,
      enableMemoization: options.enableMemoization
    });

    // 🗄️ Check cache if memoization enabled
    const cacheKey = this.generateCacheKey(data, options);
    if (options.enableMemoization && this.cache.has(cacheKey)) {
      this.stats.hits++;
      logger.debug('🗄️ UNIFIED FILTER: Cache HIT');
      return this.cache.get(cacheKey);
    }

    // 🔍 Apply all filters
    let filteredData = [...data];
    const filterStartTime = performance.now();

    // 1. Basic filters (z RentalFilters)
    filteredData = this.applyBasicFilters(filteredData, options);
    
    // 2. Advanced filters (z RentalAdvancedFilters)  
    filteredData = this.applyAdvancedFilters(filteredData, options);
    
    // 3. Priority filters (z RentalFilters)
    filteredData = this.applyPriorityFilters(filteredData, options);
    
    // 4. Search filters (z EnhancedRentalSearch)
    const { data: searchFiltered, suggestions } = await this.applySearchFilters(
      filteredData, 
      options, 
      context
    );
    filteredData = searchFiltered;

    const filterTime = performance.now() - filterStartTime;
    const totalTime = performance.now() - startTime;

    // 📊 Create result
    const result: FilterResult<T> = {
      data: filteredData,
      stats: {
        total: data.length,
        filtered: filteredData.length,
        hasFilters: this.hasActiveFilters(options),
        performance: {
          filterTime,
          searchTime: totalTime - filterTime
        }
      },
      suggestions
    };

    // 🗄️ Cache result if memoization enabled
    if (options.enableMemoization) {
      this.cache.set(cacheKey, result);
      this.stats.misses++;
    }

    logger.debug('🔍 UNIFIED FILTER: Filter completed', {
      originalCount: data.length,
      filteredCount: filteredData.length,
      filterTime: `${filterTime.toFixed(2)}ms`,
      totalTime: `${totalTime.toFixed(2)}ms`,
      cacheHitRate: `${(this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)}%`
    });

    return result;
  }

  /**
   * 🔧 Basic filters (z RentalFilters.tsx)
   */
  private applyBasicFilters<T extends Rental>(data: T[], options: UnifiedFilterOptions): T[] {
    let filtered = data;

    if (options.vehicle && options.vehicle !== 'all') {
      filtered = filtered.filter(rental => rental.vehicleId === options.vehicle);
    }

    if (options.company && options.company !== 'all') {
      filtered = filtered.filter(rental => rental.company === options.company);
    }

    if (options.customer && options.customer !== 'all') {
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(options.customer!.toLowerCase())
      );
    }

    if (options.status && options.status !== 'all') {
      filtered = filtered.filter(rental => rental.status === options.status);
    }

    if (options.paid && options.paid !== 'all') {
      const isPaid = options.paid === 'paid';
      filtered = filtered.filter(rental => rental.paid === isPaid);
    }

    if (options.dateFrom) {
      filtered = filtered.filter(rental => 
        new Date(rental.startDate) >= new Date(options.dateFrom!)
      );
    }

    if (options.dateTo) {
      filtered = filtered.filter(rental => 
        new Date(rental.endDate) <= new Date(options.dateTo!)
      );
    }

    if (options.paymentMethod && options.paymentMethod !== 'all') {
      filtered = filtered.filter(rental => rental.paymentMethod === options.paymentMethod);
    }

    return filtered;
  }

  /**
   * 🚀 Advanced filters (z RentalAdvancedFilters.tsx)
   */
  private applyAdvancedFilters<T extends Rental>(data: T[], options: UnifiedFilterOptions): T[] {
    let filtered = data;

    if (options.priceMin) {
      const minPrice = parseFloat(options.priceMin);
      filtered = filtered.filter(rental => (rental.totalPrice || 0) >= minPrice);
    }

    if (options.priceMax) {
      const maxPrice = parseFloat(options.priceMax);
      filtered = filtered.filter(rental => (rental.totalPrice || 0) <= maxPrice);
    }

    if (options.protocolStatus && options.protocolStatus !== 'all') {
      filtered = filtered.filter(rental => {
        // Logic for protocol status filtering
        return true; // Placeholder
      });
    }

    if (options.vehicleBrand && options.vehicleBrand !== 'all') {
      filtered = filtered.filter(rental => {
        // Need vehicle data for brand filtering
        return true; // Placeholder
      });
    }

    if (options.timeFilter && options.timeFilter !== 'all') {
      filtered = this.applyTimeFilter(filtered, options.timeFilter);
    }

    if (options.showOnlyActive) {
      filtered = filtered.filter(rental => rental.status === 'active');
    }

    if (options.showOnlyOverdue) {
      filtered = filtered.filter(rental => {
        const endDate = new Date(rental.endDate);
        return endDate < new Date() && rental.status !== 'finished';
      });
    }

    if (options.showOnlyCompleted) {
      filtered = filtered.filter(rental => rental.status === 'finished');
    }

    return filtered;
  }

  /**
   * ⭐ Priority filters (z RentalFilters.tsx)
   */
  private applyPriorityFilters<T extends Rental>(data: T[], options: UnifiedFilterOptions): T[] {
    let filtered = data;

    if (options.showActive) {
      filtered = filtered.filter(rental => rental.status === 'active');
    }

    if (options.showTodayReturns) {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(rental => 
        new Date(rental.endDate).toISOString().split('T')[0] === today
      );
    }

    if (options.showTomorrowReturns) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      filtered = filtered.filter(rental => 
        new Date(rental.endDate).toISOString().split('T')[0] === tomorrowStr
      );
    }

    if (options.showUnconfirmed) {
      filtered = filtered.filter(rental => rental.status === 'pending');
    }

    if (options.showFuture) {
      const now = new Date();
      filtered = filtered.filter(rental => 
        new Date(rental.startDate) > now
      );
    }

    return filtered;
  }

  /**
   * 🔍 Search filters (z EnhancedRentalSearch.tsx)
   */
  private async applySearchFilters<T extends Rental>(
    data: T[], 
    options: UnifiedFilterOptions,
    context?: {
      vehicles?: Vehicle[];
      customers?: Customer[];
      companies?: string[];
    }
  ): Promise<{ data: T[]; suggestions?: SearchSuggestion[] }> {
    
    if (!options.searchQuery || !options.enableSearch) {
      return { data };
    }

    const query = options.searchQuery.toLowerCase();
    let suggestions: SearchSuggestion[] = [];

    // Generate suggestions if enabled
    if (options.enableSuggestions && context) {
      suggestions = this.generateSuggestions(query, context);
    }

    // Apply search filter
    const searchFields = options.searchFields || [
      'customerName', 'customerEmail', 'customerPhone', 
      'company', 'licensePlate', 'notes'
    ];

    const filtered = data.filter(rental => {
      return searchFields.some(field => {
        const value = (rental as any)[field];
        return value && value.toString().toLowerCase().includes(query);
      });
    });

    return { data: filtered, suggestions };
  }

  /**
   * 💡 Generate search suggestions
   */
  private generateSuggestions(
    query: string,
    context: {
      vehicles?: Vehicle[];
      customers?: Customer[];
      companies?: string[];
    }
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Customer suggestions
    if (context.customers) {
      context.customers
        .filter(customer => 
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query)
        )
        .slice(0, 5)
        .forEach(customer => {
          suggestions.push({
            id: customer.id,
            type: 'customer',
            label: customer.name,
            value: customer.name,
            metadata: { email: customer.email }
          });
        });
    }

    // Vehicle suggestions
    if (context.vehicles) {
      context.vehicles
        .filter(vehicle => 
          vehicle.licensePlate.toLowerCase().includes(query) ||
          vehicle.brand.toLowerCase().includes(query) ||
          vehicle.model.toLowerCase().includes(query)
        )
        .slice(0, 5)
        .forEach(vehicle => {
          suggestions.push({
            id: vehicle.id,
            type: 'vehicle',
            label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
            value: vehicle.licensePlate,
            metadata: { brand: vehicle.brand, model: vehicle.model }
          });
        });
    }

    // Company suggestions
    if (context.companies) {
      context.companies
        .filter(company => company.toLowerCase().includes(query))
        .slice(0, 3)
        .forEach(company => {
          suggestions.push({
            id: company,
            type: 'company',
            label: company,
            value: company
          });
        });
    }

    return suggestions;
  }

  /**
   * ⏰ Apply time-based filters
   */
  private applyTimeFilter<T extends Rental>(data: T[], timeFilter: string): T[] {
    const now = new Date();
    
    switch (timeFilter) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        return data.filter(rental => 
          new Date(rental.startDate).toISOString().split('T')[0] === today ||
          new Date(rental.endDate).toISOString().split('T')[0] === today
        );
        
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return data.filter(rental => 
          new Date(rental.startDate) >= weekAgo
        );
        
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return data.filter(rental => 
          new Date(rental.startDate) >= monthAgo
        );
        
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return data.filter(rental => 
          new Date(rental.startDate) >= quarterAgo
        );
        
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return data.filter(rental => 
          new Date(rental.startDate) >= yearAgo
        );
        
      default:
        return data;
    }
  }

  /**
   * 🔑 Generate cache key for memoization
   */
  private generateCacheKey(data: any[], options: UnifiedFilterOptions): string {
    const dataHash = data.length; // Simple hash based on length
    const optionsHash = JSON.stringify(options);
    return `filter_${dataHash}_${btoa(optionsHash).slice(0, 10)}`;
  }

  /**
   * ❓ Check if any filters are active
   */
  private hasActiveFilters(options: UnifiedFilterOptions): boolean {
    const filterValues = Object.entries(options).filter(([key, value]) => {
      if (key.startsWith('enable') || key.endsWith('Ms')) return false;
      return value && value !== 'all' && value !== '' && value !== false;
    });
    
    return filterValues.length > 0;
  }

  /**
   * 🧹 Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.debug('🗄️ UNIFIED FILTER: Cache cleared');
  }

  /**
   * 📊 Get performance stats
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHits: this.stats.hits,
      cacheMisses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0
    };
  }
}

// 🎯 SINGLETON INSTANCE
export const unifiedFilterEngine = new UnifiedFilterEngine();

/**
 * 🪝 React Hook pre unified filtering
 */
export const useUnifiedFilters = <T extends Rental>(
  data: T[],
  options: UnifiedFilterOptions,
  context?: {
    vehicles?: Vehicle[];
    customers?: Customer[];
    companies?: string[];
  }
) => {
  return useMemo(async () => {
    if (!data || data.length === 0) {
      return {
        data: [],
        stats: {
          total: 0,
          filtered: 0,
          hasFilters: false,
          performance: { filterTime: 0, searchTime: 0 }
        }
      };
    }

    return await unifiedFilterEngine.filter(data, options, context);
  }, [data, options, context]);
};

/**
 * 🔄 Compatibility wrappers pre postupnú migráciu
 */
export const compatibilityFilters = {
  // Wrapper pre RentalFilters.tsx
  applyBasicFilters: (data: Rental[], filters: any) => {
    return unifiedFilterEngine.filter(data, {
      vehicle: filters.filterVehicle,
      company: filters.filterCompany,
      customer: filters.filterCustomer,
      status: filters.filterStatus,
      paid: filters.filterPaid,
      dateFrom: filters.filterDateFrom,
      dateTo: filters.filterDateTo,
      paymentMethod: filters.filterPaymentMethod,
      searchQuery: filters.searchQuery,
      showActive: filters.showActive,
      showTodayReturns: filters.showTodayReturns,
      showTomorrowReturns: filters.showTomorrowReturns,
      showUnconfirmed: filters.showUnconfirmed,
      showFuture: filters.showFuture,
      showOldConfirmed: filters.showOldConfirmed,
      showConfirmed: filters.showConfirmed,
      showAll: filters.showAll,
      enableMemoization: true
    });
  },

  // Wrapper pre RentalAdvancedFilters.tsx
  applyAdvancedFilters: (data: Rental[], filters: any) => {
    return unifiedFilterEngine.filter(data, {
      ...filters,
      enableMemoization: true,
      enableSearch: true,
      enableSuggestions: true
    });
  },

  // Wrapper pre EnhancedRentalSearch.tsx
  applySearchFilters: (data: Rental[], query: string, context: any) => {
    return unifiedFilterEngine.filter(data, {
      searchQuery: query,
      enableSearch: true,
      enableSuggestions: true,
      enableMemoization: true,
      debounceMs: 300
    }, context);
  }
};
