/**
 * 🔍 ENHANCED RENTAL SEARCH
 * 
 * Pokročilé vyhľadávanie pre prenájmy s kompletnou filter funkcionalitou
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Typography,
  Button
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Rental } from '../../types';
import EnhancedSearchBar from '../common/EnhancedSearchBar';
import QuickFilters, { RENTAL_QUICK_FILTERS } from '../common/QuickFilters';
import MobileFilterDrawer from '../common/MobileFilterDrawer';
import type { QuickFilter, SearchSuggestion } from '../../hooks/useEnhancedSearch';

interface EnhancedRentalSearchProps {
  onResults: (results: Rental[]) => void;
  onQueryChange?: (query: string) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  placeholder?: string;
  showQuickFilters?: boolean;
  compact?: boolean;
}

const EnhancedRentalSearch: React.FC<EnhancedRentalSearchProps> = ({
  onResults,
  onQueryChange,
  onFiltersChange,
  placeholder = 'Hľadať prenájmy...',
  showQuickFilters = true,
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state } = useApp();
  
  // State
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  
  // Enhanced quick filters with counts
  const enhancedQuickFilters = useMemo<QuickFilter[]>(() => {
    if (!state.rentals) return RENTAL_QUICK_FILTERS;
    
    return RENTAL_QUICK_FILTERS.map(filter => {
      let count = 0;
      
      switch (filter.id) {
        case 'active':
          count = state.rentals?.filter(r => r.status === 'active').length || 0;
          break;
        case 'pending':
          count = state.rentals?.filter(r => r.status === 'pending').length || 0;
          break;
        case 'overdue':
          count = state.rentals?.filter(r => {
            const endDate = new Date(r.endDate);
            return endDate < new Date() && r.status === 'active';
          }).length || 0;
          break;
        case 'this_month':
          const thisMonth = new Date();
          count = state.rentals?.filter(r => {
            const startDate = new Date(r.startDate);
            return startDate.getMonth() === thisMonth.getMonth() &&
                   startDate.getFullYear() === thisMonth.getFullYear();
          }).length || 0;
          break;
        case 'high_value':
          count = state.rentals?.filter(r => r.totalPrice && r.totalPrice > 1000).length || 0;
          break;
      }
      
      return { ...filter, count };
    });
  }, [state.rentals]);

  // Search function
  const searchRentals = useCallback(async (query: string, quickFilter?: string): Promise<Rental[]> => {
    if (!state.rentals) return [];
    
    let filteredRentals = [...state.rentals];
    
    // Apply text search
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filteredRentals = filteredRentals.filter(rental => {
        const customer = state.customers?.find(c => c.id === rental.customerId);
        const vehicle = state.vehicles?.find(v => v.id === rental.vehicleId);
        
        return (
          customer?.name?.toLowerCase().includes(searchLower) ||
          customer?.email?.toLowerCase().includes(searchLower) ||
          customer?.phone?.toLowerCase().includes(searchLower) ||
          rental.id.toLowerCase().includes(searchLower) ||
          vehicle?.brand?.toLowerCase().includes(searchLower) ||
          vehicle?.model?.toLowerCase().includes(searchLower) ||
          vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
          rental.notes?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply quick filter
    if (quickFilter) {
      const currentDate = new Date();
      
      switch (quickFilter) {
        case 'active':
          filteredRentals = filteredRentals.filter(r => r.status === 'active');
          break;
        case 'pending':
          filteredRentals = filteredRentals.filter(r => r.status === 'pending');
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
            return startDate.getMonth() === currentDate.getMonth() &&
                   startDate.getFullYear() === currentDate.getFullYear();
          });
          break;
        case 'high_value':
          filteredRentals = filteredRentals.filter(r => r.totalPrice && r.totalPrice > 1000);
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
            return r.company?.toLowerCase().includes(value.toLowerCase());
          });
          break;
        case 'vehicle_type':
          filteredRentals = filteredRentals.filter(r => {
            const vehicle = state.vehicles?.find(v => v.id === r.vehicleId);
            return vehicle?.category === value;
          });
          break;
        case 'date_from':
          filteredRentals = filteredRentals.filter(r => 
            new Date(r.startDate) >= new Date(value)
          );
          break;
        case 'date_to':
          filteredRentals = filteredRentals.filter(r => 
            new Date(r.endDate) <= new Date(value)
          );
          break;
        case 'price_min':
          filteredRentals = filteredRentals.filter(r => 
            r.totalPrice && r.totalPrice >= parseFloat(value)
          );
          break;
        case 'price_max':
          filteredRentals = filteredRentals.filter(r => 
            r.totalPrice && r.totalPrice <= parseFloat(value)
          );
          break;
      }
    });
    
    return filteredRentals;
  }, [state.rentals, state.customers, state.vehicles, advancedFilters]);

  // Suggestions function
  const getSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!state.rentals || !state.customers || !state.vehicles) return [];
    
    const suggestions: SearchSuggestion[] = [];
    const searchLower = query.toLowerCase();
    
    // Customer suggestions
    const matchingCustomers = state.customers
      .filter(c => 
        c.name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      )
      .slice(0, 3);
    
    matchingCustomers.forEach(customer => {
      const rentalCount = state.rentals.filter(r => r.customerId === customer.id).length;
      suggestions.push({
        id: `customer-${customer.id}`,
        text: customer.name,
        type: 'suggestion',
        category: 'Zákazník',
        count: rentalCount
      });
    });
    
    // Vehicle suggestions  
    const matchingVehicles = state.vehicles
      .filter(v =>
        v.brand?.toLowerCase().includes(searchLower) ||
        v.model?.toLowerCase().includes(searchLower) ||
        v.licensePlate?.toLowerCase().includes(searchLower)
      )
      .slice(0, 3);
    
    matchingVehicles.forEach(vehicle => {
      const rentalCount = state.rentals.filter(r => r.vehicleId === vehicle.id).length;
      suggestions.push({
        id: `vehicle-${vehicle.id}`,
        text: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
        type: 'suggestion',
        category: 'Vozidlo',
        count: rentalCount
      });
    });
    
    return suggestions;
  }, [state.rentals, state.customers, state.vehicles]);

  // Handlers

  const handleQuickFilterChange = useCallback((filterId: string | null) => {
    setActiveQuickFilter(filterId);
    
    // Trigger search with current query
    const searchBar = document.querySelector('input[type="text"]') as HTMLInputElement;
    const currentQuery = searchBar?.value || '';
    
    searchRentals(currentQuery, filterId || undefined).then(results => {
      onResults(results);
    });
  }, [searchRentals, onResults]);

  const handleAdvancedFiltersChange = useCallback((filters: Record<string, any>) => {
    setAdvancedFilters(filters);
    onFiltersChange?.(filters);
  }, [onFiltersChange]);

  // Mobile filter sections
  const mobileFilterSections = useMemo(() => [
    {
      id: 'company',
      title: 'Firma',
      type: 'text' as const,
      placeholder: 'Názov firmy...',
      icon: '🏢'
    },
    {
      id: 'vehicle_type',
      title: 'Typ vozidla',
      type: 'select' as const,
      options: [
        { label: 'Osobné', value: 'car' },
        { label: 'Nákladné', value: 'truck' },
        { label: 'Dodávka', value: 'van' },
        { label: 'Motorka', value: 'motorcycle' }
      ],
      icon: '🚗'
    },
    {
      id: 'date_from',
      title: 'Od dátumu',
      type: 'date' as const,
      icon: '📅'
    },
    {
      id: 'date_to', 
      title: 'Do dátumu',
      type: 'date' as const,
      icon: '📅'
    },
    {
      id: 'price_min',
      title: 'Min. cena',
      type: 'text' as const,
      placeholder: '0',
      icon: '💰'
    },
    {
      id: 'price_max',
      title: 'Max. cena',
      type: 'text' as const,
      placeholder: '999999',
      icon: '💰'
    }
  ], []);

  const hasActiveFilters = activeQuickFilter || 
    Object.values(advancedFilters).some(v => v && v !== 'all');

  return (
    <Box>
      {/* Search Bar */}
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ flex: 1 }}>
          <EnhancedSearchBar
            onSearch={searchRentals}
            suggestionFunction={getSuggestions}
            placeholder={placeholder}
            quickFilters={showQuickFilters ? enhancedQuickFilters : []}
            onQuickFilterChange={handleQuickFilterChange}
            onResultsChange={onResults}
            onQueryChange={onQueryChange}
            showResultCount
            showPerformanceStats={!compact}
            debounceDelay={300}
            maxSuggestions={6}
            enableHistory
            storageKey="rental_search_history"
          />
        </Box>
        
        {/* Mobile Filter Button */}
        {isMobile && (
          <Tooltip title="Pokročilé filtre">
            <IconButton
              onClick={() => setShowMobileFilters(true)}
              sx={{
                mt: 0.5,
                bgcolor: hasActiveFilters ? 'primary.main' : 'background.paper',
                color: hasActiveFilters ? 'primary.contrastText' : 'text.primary',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: hasActiveFilters ? 'primary.dark' : 'action.hover'
                }
              }}
            >
              <TuneIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Quick Filters - Desktop */}
      {!isMobile && showQuickFilters && (
        <Box sx={{ mt: 2 }}>
          <QuickFilters
            filters={enhancedQuickFilters}
            activeFilter={activeQuickFilter}
            onFilterSelect={handleQuickFilterChange}
            compact={compact}
          />
        </Box>
      )}

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filtre prenájmov"
        quickFilters={enhancedQuickFilters}
        activeQuickFilter={activeQuickFilter}
        onQuickFilterChange={handleQuickFilterChange}
        filterSections={mobileFilterSections}
        filters={advancedFilters}
        onFiltersChange={handleAdvancedFiltersChange}
        onApply={handleAdvancedFiltersChange}
        onReset={() => {
          setAdvancedFilters({});
          setActiveQuickFilter(null);
        }}
        resultCount={state.rentals?.length}
        hasActiveFilters={Boolean(hasActiveFilters)}
      />

      {/* Results info */}
      {!compact && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            mt: 1,
            color: 'text.secondary',
            textAlign: 'right'
          }}
        >
          {hasActiveFilters ? 'Filtrované výsledky' : `${state.rentals?.length || 0} prenájmov`}
        </Typography>
      )}
    </Box>
  );
};

export default memo(EnhancedRentalSearch);