/**
 * 🔍 ENHANCED RENTAL SEARCH
 *
 * Pokročilé vyhľadávanie pre prenájmy s kompletnou filter funkcionalitou
 */

import React, { memo, useCallback, useMemo, useState } from 'react';

import type {
  QuickFilter,
  SearchSuggestion,
} from '../../hooks/useEnhancedSearch';
import { useCustomers } from '../../lib/react-query/hooks/useCustomers';
import { useRentals } from '../../lib/react-query/hooks/useRentals';
import { useVehicles } from '../../lib/react-query/hooks/useVehicles';
import type { Rental } from '../../types';
import { searchInTexts } from '../../utils/textNormalization';
import EnhancedSearchBar from '../common/EnhancedSearchBar';
import QuickFilters, { RENTAL_QUICK_FILTERS } from '../common/QuickFilters';

interface EnhancedRentalSearchProps {
  onResults: (_results: Rental[]) => void;
  onQueryChange?: (_query: string) => void;
  onFiltersChange?: (_filters: Record<string, unknown>) => void;
  placeholder?: string;
  showQuickFilters?: boolean;
  compact?: boolean;
}

const EnhancedRentalSearch: React.FC<EnhancedRentalSearchProps> = ({
  onResults,
  onQueryChange,
  placeholder = 'Hľadať prenájmy...',
  showQuickFilters = true,
  compact = false,
}) => {
  // Use Tailwind breakpoints instead of MUI theme
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // React Query hooks for server state
  const { data: rentals = [] } = useRentals();
  const { data: customers = [] } = useCustomers();
  const { data: vehicles = [] } = useVehicles();

  // State
  const [advancedFilters] = useState<Record<string, unknown>>({});
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(
    null
  );

  // Enhanced quick filters with counts
  const enhancedQuickFilters = useMemo<QuickFilter[]>(() => {
    if (!rentals) return RENTAL_QUICK_FILTERS;

    return RENTAL_QUICK_FILTERS.map(filter => {
      let count = 0;

      switch (filter.id) {
        case 'active':
          count = rentals?.filter(r => r.status === 'active').length || 0;
          break;
        case 'pending':
          count = rentals?.filter(r => r.status === 'pending').length || 0;
          break;
        case 'overdue':
          count =
            rentals?.filter(r => {
              const endDate = new Date(r.endDate);
              return endDate < new Date() && r.status === 'active';
            }).length || 0;
          break;
        case 'this_month': {
          const thisMonth = new Date();
          count =
            rentals?.filter(r => {
              const startDate = new Date(r.startDate);
              return (
                startDate.getMonth() === thisMonth.getMonth() &&
                startDate.getFullYear() === thisMonth.getFullYear()
              );
            }).length || 0;
          break;
        }
        case 'high_value':
          count =
            rentals?.filter(r => r.totalPrice && r.totalPrice > 1000).length ||
            0;
          break;
      }

      return { ...filter, count };
    });
  }, [rentals]);

  // Search function for rentals
  const searchRentals = useCallback(
    async (query: string, quickFilter?: string): Promise<Rental[]> => {
      if (!rentals) return [];

      let filteredRentals = [...rentals];

      // Apply text search with diacritics normalization
      if (query.trim()) {
        filteredRentals = filteredRentals.filter(rental => {
          const customer = customers?.find(c => c.id === rental.customerId);
          const vehicle = vehicles?.find(v => v.id === rental.vehicleId);

          // 🔤 DIACRITICS NORMALIZATION: Vyhľadávanie bez ohľadu na diakritiku
          return searchInTexts(
            [
              customer?.name,
              customer?.email,
              customer?.phone,
              rental.id,
              rental.customerName, // Pridané pre priame vyhľadávanie v rental
              rental.customerEmail,
              rental.customerPhone,
              vehicle?.brand,
              vehicle?.model,
              vehicle?.licensePlate,
              vehicle?.company,
              rental.notes,
            ],
            query
          );
        });
      }

      // Apply quick filter
      if (quickFilter) {
        const currentDate = new Date();

        switch (quickFilter) {
          case 'active':
            filteredRentals = filteredRentals.filter(
              r => r.status === 'active'
            );
            break;
          case 'pending':
            filteredRentals = filteredRentals.filter(
              r => r.status === 'pending'
            );
            break;
          case 'overdue':
            filteredRentals = filteredRentals.filter(r => {
              const endDate = new Date(r.endDate);
              return endDate < currentDate && r.status === 'active';
            });
            break;
          case 'this_month':
            filteredRentals = filteredRentals.filter(r => {
              const startDate = new Date(r.startDate);
              return (
                startDate.getMonth() === currentDate.getMonth() &&
                startDate.getFullYear() === currentDate.getFullYear()
              );
            });
            break;
          case 'high_value':
            filteredRentals = filteredRentals.filter(
              r => r.totalPrice && r.totalPrice > 1000
            );
            break;
        }
      }

      // Apply advanced filters
      Object.entries(advancedFilters).forEach(([key, value]) => {
        if (!value || value === 'all') return;

        switch (key) {
          case 'company':
            filteredRentals = filteredRentals.filter(r => {
              // Company filter - check rental.company property directly
              return r.company
                ?.toLowerCase()
                .includes(String(value).toLowerCase());
            });
            break;
          case 'vehicle_type':
            filteredRentals = filteredRentals.filter(r => {
              const vehicle = vehicles?.find(v => v.id === r.vehicleId);
              return vehicle?.category === value;
            });
            break;
          case 'date_from':
            filteredRentals = filteredRentals.filter(
              r => new Date(r.startDate) >= new Date(String(value))
            );
            break;
          case 'date_to':
            filteredRentals = filteredRentals.filter(
              r => new Date(r.endDate) <= new Date(String(value))
            );
            break;
          case 'price_min':
            filteredRentals = filteredRentals.filter(
              r => r.totalPrice && r.totalPrice >= parseFloat(String(value))
            );
            break;
          case 'price_max':
            filteredRentals = filteredRentals.filter(
              r => r.totalPrice && r.totalPrice <= parseFloat(String(value))
            );
            break;
        }
      });

      return filteredRentals;
    },
    [rentals, customers, vehicles, advancedFilters]
  );

  // Search function for EnhancedSearchBar (returns Record<string, unknown>[])
  const searchForSuggestions = useCallback(
    async (
      query: string,
      quickFilter?: string
    ): Promise<Record<string, unknown>[]> => {
      const results = await searchRentals(query, quickFilter);

      // Convert Rental[] to Record<string, unknown>[]
      return results.map(rental => ({
        id: rental.id,
        text: `${rental.customerName} - ${rental.id}`,
        type: 'suggestion' as const,
        category: 'Prenájom',
        count: 1,
      }));
    },
    [searchRentals]
  );

  // Suggestions function
  const getSuggestions = useCallback(
    async (query: string): Promise<SearchSuggestion[]> => {
      if (!rentals || !customers || !vehicles) return [];

      const suggestions: SearchSuggestion[] = [];
      const searchLower = query.toLowerCase();

      // Customer suggestions
      const matchingCustomers = customers
        .filter(
          c =>
            c.name?.toLowerCase().includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower)
        )
        .slice(0, 3);

      matchingCustomers.forEach(customer => {
        const rentalCount = rentals.filter(
          r => r.customerId === customer.id
        ).length;
        suggestions.push({
          id: `customer-${customer.id}`,
          text: customer.name,
          type: 'suggestion',
          category: 'Zákazník',
          count: rentalCount,
        });
      });

      // Vehicle suggestions
      const matchingVehicles = vehicles
        .filter(
          v =>
            v.brand?.toLowerCase().includes(searchLower) ||
            v.model?.toLowerCase().includes(searchLower) ||
            v.licensePlate?.toLowerCase().includes(searchLower)
        )
        .slice(0, 3);

      matchingVehicles.forEach(vehicle => {
        const rentalCount = rentals.filter(
          r => r.vehicleId === vehicle.id
        ).length;
        suggestions.push({
          id: `vehicle-${vehicle.id}`,
          text: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
          type: 'suggestion',
          category: 'Vozidlo',
          count: rentalCount,
        });
      });

      return suggestions;
    },
    [rentals, customers, vehicles]
  );

  // Handlers

  const handleQuickFilterChange = useCallback(
    (filterId: string | null) => {
      setActiveQuickFilter(filterId);

      // Trigger search with current query
      const searchBar = document.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement | null;
      const currentQuery = searchBar?.value || '';

      searchRentals(currentQuery, filterId || undefined).then(results => {
        onResults(results);
      });
    },
    [searchRentals, onResults]
  );


  const hasActiveFilters =
    activeQuickFilter ||
    Object.values(advancedFilters).some(v => v && v !== 'all');

  return (
    <div>
      {/* Search Bar */}
      <div className="flex flex-row gap-2 items-start">
        <div className="flex-1">
          <EnhancedSearchBar
            onSearch={searchForSuggestions}
            suggestionFunction={getSuggestions}
            placeholder={placeholder}
            quickFilters={showQuickFilters ? enhancedQuickFilters : []}
            onQuickFilterChange={handleQuickFilterChange}
            {...(onQueryChange && { onQueryChange })}
            showResultCount
            showPerformanceStats={!compact}
            debounceDelay={300}
            maxSuggestions={6}
            enableHistory
            storageKey="rental_search_history"
          />
        </div>

      </div>

      {/* Quick Filters - Desktop */}
      {!isMobile && showQuickFilters && (
        <div className="mt-4">
          <QuickFilters
            filters={enhancedQuickFilters}
            activeFilter={activeQuickFilter}
            onFilterSelect={handleQuickFilterChange}
            compact={compact}
          />
        </div>
      )}


      {/* Results info */}
      {!compact && (
        <p className="block mt-2 text-sm text-muted-foreground text-right">
          {hasActiveFilters
            ? 'Filtrované výsledky'
            : `${rentals?.length || 0} prenájmov`}
        </p>
      )}
    </div>
  );
};

export default memo(EnhancedRentalSearch);
