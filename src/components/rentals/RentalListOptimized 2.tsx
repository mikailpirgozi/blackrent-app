/**
 * 📋 RENTAL LIST OPTIMIZED
 * 
 * Optimalizovaná verzia RentalListNew s memoization a performance improvements
 */

import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse
} from '@mui/material';
import { useApp } from '../../context/AppContext';
import { Rental } from '../../types';
import { useOptimizedFilters } from '../../hooks/useOptimizedFilters';
import RentalTableHeader from './RentalTableHeader';
import OptimizedRentalRow from './OptimizedRentalRow';
import RentalAdvancedFilters, { FilterState } from './RentalAdvancedFilters';
import { EnhancedLoading } from '../common/EnhancedLoading';
import { memoizeCallback, useStableCallback } from '../../utils/memoizeCallback';
import type { FilterCriteria } from '../../utils/rentalFilters';

// Convert FilterState to FilterCriteria for optimized filters
const convertFilterStateToFilterCriteria = (filterState: FilterState, searchQuery: string): FilterCriteria => {
  return {
    searchQuery,
    status: filterState.status,
    paymentMethod: filterState.paymentMethod,
    company: filterState.company,
    dateFrom: filterState.dateFrom,
    dateTo: filterState.dateTo,
    priceMin: filterState.priceMin,
    priceMax: filterState.priceMax,
    protocolStatus: filterState.protocolStatus,
    vehicleBrand: filterState.vehicleBrand,
    insuranceCompany: filterState.insuranceCompany,
    insuranceType: filterState.insuranceType,
    customerType: 'all', // Default value
    rentalLocation: 'all', // Default value
    vehicleCategory: 'all', // Default value
  };
};

// Memoized table header component
const TableHeaderRow = memo(() => (
  <TableHead>
    <TableRow>
      <TableCell sx={{ fontWeight: 600 }}>Zákazník</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>Vozidlo</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>Termín</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>Firma</TableCell>
      <TableCell align="right" sx={{ fontWeight: 600 }}>Cena</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>Protokoly</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>Akcie</TableCell>
    </TableRow>
  </TableHead>
));

interface RentalListOptimizedProps {
  // Optional props pre customization
  showAddButton?: boolean;
  showFilters?: boolean;
  maxHeight?: number;
}

const RentalListOptimized: React.FC<RentalListOptimizedProps> = ({
  showAddButton = true,
  showFilters = true,
  maxHeight = 600
}) => {
  console.log('🔄 RentalListOptimized render');
  
  const { state, createRental, updateRental, deleteRental } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterState>({
    // Základné filtre
    status: 'all',
    paymentMethod: 'all',
    company: 'all',
    dateFrom: '',
    dateTo: '',
    priceMin: '',
    priceMax: '',
    protocolStatus: 'all',
    
    // Rozšírené filtre
    customerName: '',
    vehicleBrand: 'all',
    vehicleModel: '',
    licensePlate: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    insuranceCompany: 'all',
    insuranceType: 'all',
    
    // Časové filtre
    timeFilter: 'all',
    
    // Cenové filtre
    priceRange: 'all',
    
    // Stav platby
    paymentStatus: 'all',
    
    // Zobrazenie
    showOnlyActive: false,
    showOnlyOverdue: false,
    showOnlyCompleted: false,
  });
  
  // Protocol status state (simplified)
  const [protocolStatus, setProtocolStatus] = useState<Record<string, {
    hasHandoverProtocol: boolean;
    hasReturnProtocol: boolean;
  }>>({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  
  // Use optimized filters hook
  const {
    filteredRentals,
    vehicleLookup,
    filterOptions,
    stats,
    debouncedSearch,
    measureFilterPerformance
  } = useOptimizedFilters({
    rentals: state.rentals || [],
    vehicles: state.vehicles || [],
    protocols: {}, // Simplified for demo
    filterCriteria: convertFilterStateToFilterCriteria(filterCriteria, searchQuery)
  });
  
  // Memoized handlers using custom hook
  const handlers = useMemo(() => ({
    onEdit: (rental: Rental) => {
      console.log('✏️ Edit rental:', rental.id);
      // Implementation here
    },
    onDelete: (rental: Rental) => {
      console.log('🗑️ Delete rental:', rental.id);
      // Implementation here
    },
    onView: (rental: Rental) => {
      console.log('👁️ View rental:', rental.id);
      // Implementation here
    },
    onHandover: (rental: Rental) => {
      console.log('📄 Handover for rental:', rental.id);
      // Implementation here
    },
    onReturn: (rental: Rental) => {
      console.log('📥 Return for rental:', rental.id);
      // Implementation here
    },
    onViewPDF: (rental: Rental) => {
      console.log('📊 View PDF for rental:', rental.id);
      // Implementation here
    },
    onViewGallery: (rental: Rental) => {
      console.log('🖼️ View gallery for rental:', rental.id);
      // Implementation here
    }
  }), []);
  
  // Stable callbacks to prevent re-renders
  const stableHandlers = {
    onEdit: useStableCallback(handlers.onEdit),
    onDelete: useStableCallback(handlers.onDelete),
    onView: useStableCallback(handlers.onView),
    onHandover: useStableCallback(handlers.onHandover),
    onReturn: useStableCallback(handlers.onReturn),
    onViewPDF: useStableCallback(handlers.onViewPDF),
    onViewGallery: useStableCallback(handlers.onViewGallery),
  };
  
  // Header handlers
  const handleSearchChange = useCallback((query: string) => {
    debouncedSearch(query, (debouncedQuery) => {
      setSearchQuery(debouncedQuery);
    });
  }, [debouncedSearch]);
  
  const handleToggleFilters = useCallback(() => {
    setShowAdvancedFilters(prev => !prev);
  }, []);
  
  const handleAddRental = useCallback(() => {
    console.log('➕ Add new rental');
    // Implementation here
  }, []);
  
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Refresh rentals data
      console.log('🔄 Refreshing rentals...');
      measureFilterPerformance();
    } finally {
      setIsLoading(false);
    }
  }, [measureFilterPerformance]);
  
  const handleExport = useCallback(() => {
    console.log('📤 Export rentals');
    // Implementation here
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterCriteria({
      // Základné filtre
      status: 'all',
      paymentMethod: 'all',
      company: 'all',
      dateFrom: '',
      dateTo: '',
      priceMin: '',
      priceMax: '',
      protocolStatus: 'all',
      
      // Rozšírené filtre
      customerName: '',
      vehicleBrand: 'all',
      vehicleModel: '',
      licensePlate: '',
      customerEmail: '',
      customerPhone: '',
      customerCompany: '',
      insuranceCompany: 'all',
      insuranceType: 'all',
      
      // Časové filtre
      timeFilter: 'all',
      
      // Cenové filtre
      priceRange: 'all',
      
      // Stav platby
      paymentStatus: 'all',
      
      // Zobrazenie
      showOnlyActive: false,
      showOnlyOverdue: false,
      showOnlyCompleted: false,
    });
  }, []);

  const handleSavePreset = useCallback(() => {
    console.log('💾 Save filter preset');
    // Implementation here
  }, []);
  
  // Effect pre performance monitoring
  useEffect(() => {
    console.log(`📊 Rental filter stats:`, stats);
  }, [stats]);
  
  // Loading state
  if (isLoading && filteredRentals.length === 0) {
    return <EnhancedLoading variant="page" message="Načítavam rezervácie..." />;
  }
  
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header */}
      <RentalTableHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        showFilters={showAdvancedFilters}
        onToggleFilters={handleToggleFilters}
        onAddRental={handleAddRental}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
        totalCount={stats.total}
        filteredCount={stats.filtered}
      />
      
      {/* Advanced Filters */}
      <Collapse in={showAdvancedFilters} unmountOnExit>
        <Box sx={{ mb: 3 }}>
          <RentalAdvancedFilters
            filters={filterCriteria}
            onFiltersChange={setFilterCriteria}
            onReset={handleResetFilters}
            onSavePreset={handleSavePreset}
            availableStatuses={filterOptions.statuses}
            availableCompanies={filterOptions.companies}
            availablePaymentMethods={filterOptions.paymentMethods}
            availableVehicleBrands={filterOptions.vehicleBrands}
            availableInsuranceCompanies={[]}
            availableInsuranceTypes={[]}
          />
        </Box>
      </Collapse>
      
      {/* Results Count */}
      {stats.hasFilters && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            📊 Zobrazených: <strong>{stats.filtered}</strong> z <strong>{stats.total}</strong> rezervácií
          </Typography>
        </Box>
      )}
      
      {/* Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: maxHeight,
          borderRadius: 3,
          boxShadow: theme.shadows[3]
        }}
      >
        <Table stickyHeader>
          <TableHeaderRow />
          <TableBody>
            {filteredRentals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      🔍 Žiadne rezervácie
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {stats.hasFilters 
                        ? 'Skúste zmeniť filtre alebo vyhľadávanie'
                        : 'Zatiaľ neboli vytvorené žiadne rezervácie'
                      }
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredRentals.map((rental) => (
                <OptimizedRentalRow
                  key={rental.id}
                  rental={rental}
                  vehicleLookup={vehicleLookup}
                  hasHandoverProtocol={protocolStatus[rental.id]?.hasHandoverProtocol || false}
                  hasReturnProtocol={protocolStatus[rental.id]?.hasReturnProtocol || false}
                  {...stableHandlers}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Performance debug info (len v development) */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            🏃‍♂️ Rendered {filteredRentals.length} rental rows | Filter efficiency: {((stats.total - stats.filtered) / stats.total * 100).toFixed(1)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default memo(RentalListOptimized);