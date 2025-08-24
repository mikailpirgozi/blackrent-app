import React, { useCallback, useMemo, useRef } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
  Typography,
  Card,
  Button,
  CircularProgress
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Can } from '../common/PermissionGuard';
import { useInfiniteRentals } from '../../hooks/useInfiniteRentals';
import { logger } from '../../utils/logger';
import { apiService } from '../../services/api';

// 🚀 EXTRACTED: Import all our refactored components and hooks
import { RentalFilters } from './components/RentalFilters';
import { RentalTable } from './components/RentalTable';
import { RentalProtocols } from './components/RentalProtocols';
import { RentalActions } from './components/RentalActions';
import { RentalExport } from './components/RentalExport';
import { RentalStats } from './components/RentalStats';
import { useRentalFilters } from '../../hooks/useRentalFilters';
import { useRentalActions } from '../../hooks/useRentalActions';
import { useRentalProtocols } from '../../hooks/useRentalProtocols';

// 🚀 EXTRACTED: Helper functions moved to utils
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getPaymentMethodLabel
} from '../../utils/rentalHelpers';

// 🚀 EXTRACTED: Types
import { FilterState, ITEMS_PER_PAGE } from '../../types/rental-types';
import { Rental } from '../../types';

// Constants
const SCROLL_THRESHOLD = 0.75;
const DEBOUNCE_DELAY = 150;
const THROTTLE_DELAY = 100;

export default function RentalList() {
  // ⚡ PERFORMANCE: Only log renders in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('RentalList render', { timestamp: Date.now() });
  }
  
  const { state, deleteRental, createRental, updateRental } = useApp();
  const permissions = usePermissions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🚀 INFINITE SCROLL: Use infinite rentals hook instead of state.rentals
  const {
    rentals: paginatedRentals,
    loading: paginatedLoading,
    error: paginatedError,
    hasMore,
    totalCount,
    currentPage,
    searchTerm,
    setSearchTerm,
    loadMore,
    refresh,
    updateFilters,
    updateRentalInList,
    handleOptimisticDelete
  } = useInfiniteRentals();

  // 🔍 DEBUG: Základné informácie o komponente
  console.log('🚀 RentalList LOADED:', {
    isMobile,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
    breakpoint: theme.breakpoints.values.md
  });

  // 🚀 EXTRACTED: Use protocol hook first
  const protocolsHook = useRentalProtocols({
    onProtocolUpdate: (rentalId, protocolType, data) => {
      console.log('📋 Protocol updated', { rentalId, protocolType });
      // Refresh rentals after protocol update would be handled here
    }
  });

  // 🚀 INFINITE SCROLL: Now using useInfiniteRentals hook

  // 🚀 EXTRACTED: Use our custom hooks
  const {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    showFilters,
    setShowFilters,
    advancedFilters,
    setAdvancedFilters,
    filteredRentals,
    uniqueStatuses,
    uniqueCompanies,
    uniquePaymentMethods,
    uniqueVehicleBrands,
    uniqueInsuranceCompanies,
    uniqueInsuranceTypes,
    handleQuickFilter,
    resetFilters
  } = useRentalFilters({
    rentals: paginatedRentals,
    vehicles: state.vehicles || [],
    protocols: protocolsHook.protocols
  });

  // 🚀 SERVER-SIDE SEARCH: Sync search between useRentalFilters and useInfiniteRentals
  React.useEffect(() => {
    if (debouncedSearchQuery !== searchTerm) {
      console.log('🔍 SEARCH: Syncing search term:', debouncedSearchQuery);
      setSearchTerm(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchTerm, setSearchTerm]);

  // 🚀 SERVER-SIDE FILTERING: Sync filters between useRentalFilters and useInfiniteRentals
  React.useEffect(() => {
    const serverFilters = {
      // Map FilterState to RentalFilters format
      dateFrom: advancedFilters.dateFrom,
      dateTo: advancedFilters.dateTo,
      company: advancedFilters.company.length > 0 ? advancedFilters.company.join(',') : undefined,
      status: advancedFilters.status.length > 0 ? advancedFilters.status.join(',') : undefined,
      paymentMethod: advancedFilters.paymentMethod.length > 0 ? advancedFilters.paymentMethod.join(',') : undefined,
      protocolStatus: advancedFilters.protocolStatus.length > 0 ? advancedFilters.protocolStatus.join(',') : undefined,
      vehicleBrand: advancedFilters.vehicleBrand || undefined,
      priceMin: advancedFilters.priceMin || undefined,
      priceMax: advancedFilters.priceMax || undefined,
    };

    console.log('🔧 FILTERS: Syncing filters to server:', serverFilters);
    updateFilters(serverFilters);
  }, [advancedFilters, updateFilters]);

  // 🚀 ENHANCED RESET: Reset both local and server-side filters
  const handleResetAllFilters = useCallback(() => {
    console.log('🔄 RESET: Resetting all filters');
    resetFilters(); // Reset local filters
    setSearchTerm(''); // Reset server search
    updateFilters({}); // Reset server filters
    refresh(); // Refresh data
  }, [resetFilters, setSearchTerm, updateFilters, refresh]);

  // 🚀 MULTI-SELECT FILTER HELPERS: For server-side filtering
  const toggleFilterValue = useCallback((filterKey: keyof typeof advancedFilters, value: string) => {
    console.log(`🎯 TOGGLE FILTER: ${filterKey} = ${value}`);
    
    const currentValues = advancedFilters[filterKey] as string[];
    const newValues = Array.isArray(currentValues) 
      ? currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      : [value];
    
    const newFilters = {
      ...advancedFilters,
      [filterKey]: newValues
    };
    
    console.log(`🎯 NEW FILTERS:`, newFilters);
    setAdvancedFilters(newFilters);
  }, [advancedFilters, setAdvancedFilters]);

  const isFilterValueSelected = useCallback((filterKey: keyof typeof advancedFilters, value: string): boolean => {
    const currentValues = advancedFilters[filterKey] as string[];
    return Array.isArray(currentValues) && currentValues.includes(value);
  }, [advancedFilters]);

  const {
    openDialog,
    setOpenDialog,
    editingRental,
    setEditingRental,
    importError,
    setImportError,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCancel,
    handleViewRental,
    savedScrollPosition,
    restoreScrollPosition
  } = useRentalActions({
    onEdit: (rental) => {
      console.log('🔍 External edit handler called', { rentalId: rental.id });
    },
    onDelete: (id) => {
      console.log('🗑️ External delete handler called', { rentalId: id });
    },
    onScrollRestore: () => {
      console.log('📜 External scroll restore handler called');
    }
  });

  // This was moved above to fix the dependency issue

  // Create separate refs for mobile and desktop scroll containers
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const scrollHandlerRef = useRef<((event: any) => void) | null>(null);

  // 🎯 INFINITE SCROLL: Auto-loading at 75% scroll
  const SCROLL_THRESHOLD = 0.75;
  const DEBOUNCE_DELAY = 150;
  const THROTTLE_DELAY = 100;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  // 🎯 INFINITE SCROLL PRESERVATION: Wrapper pre loadMore s uložením pozície
  const handleLoadMore = useCallback(() => {
    // Uložiť aktuálnu scroll pozíciu pred načítaním
    if (isMobile && mobileScrollRef.current) {
      savedScrollPosition.current = mobileScrollRef.current.scrollTop;
    } else if (!isMobile && desktopScrollRef.current) {
      savedScrollPosition.current = desktopScrollRef.current.scrollTop;
    }
    
    console.log('📜 INFINITE SCROLL: Saved position before load more:', savedScrollPosition.current);
    
    // 🚀 INFINITE SCROLL: Load more rentals
    loadMore();
  }, [isMobile, savedScrollPosition, loadMore]);

  // 🎯 UNIFIED SCROLL HANDLER: Auto-trigger loading at 75%
  const createScrollHandler = useCallback(() => {
    return (event: any) => {
      // Skip if already loading or no more data
      if (paginatedLoading || !hasMore) {
        return;
      }
      
      // 🚀 PERFORMANCE: Throttle scroll events
      const now = Date.now();
      if (now - lastScrollTimeRef.current < THROTTLE_DELAY) {
        return;
      }
      lastScrollTimeRef.current = now;
      
      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        let scrollPercentage = 0;
        
        // Calculate scroll percentage based on event type
        if (event.scrollOffset !== undefined) {
          // Virtual scroll from React Window (mobile)
          const totalHeight = paginatedRentals.length * 160; // itemSize * count
          const viewportHeight = 600;
          const maxScroll = Math.max(1, totalHeight - viewportHeight);
          scrollPercentage = event.scrollOffset / maxScroll;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`📱 Virtual scroll: ${Math.round(scrollPercentage * 100)}%`);
          }
        } else if (event.target || event.currentTarget) {
          // Native scroll from container (desktop)
          const target = event.target || event.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = target;
          const maxScroll = Math.max(1, scrollHeight - clientHeight);
          scrollPercentage = scrollTop / maxScroll;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`💻 Desktop scroll: ${Math.round(scrollPercentage * 100)}%`);
          }
        }
        
        // Trigger infinite loading at threshold
        if (scrollPercentage >= SCROLL_THRESHOLD) {
          console.log(`🚀 INFINITE SCROLL: Triggered at ${Math.round(scrollPercentage * 100)}%`);
          handleLoadMore();
        }
      }, DEBOUNCE_DELAY);
    };
  }, [paginatedLoading, hasMore, paginatedRentals.length, handleLoadMore]);

  // 🎨 FAREBNÉ INDIKÁTORY - elegantné bodky namiesto pozadia
  const getStatusIndicator = useCallback((rental: Rental) => {
    const today = new Date();
    const endDate = new Date(rental.endDate);
    const startDate = new Date(rental.startDate);
    
    // 🔴 Červená: Preterminované (skončili a nemajú return protokol)
    if (endDate < today && !protocolsHook.protocols[rental.id]?.return) {
      return { color: '#f44336', label: 'Preterminované', priority: 1 };
    }
    
    // 🟠 Oranžová: Dnes/zajtra vrátenie
    const isToday = endDate.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = endDate.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return { color: '#ff9800', label: 'Dnes vrátenie', priority: 2 };
    }
    if (isTomorrow) {
      return { color: '#ff9800', label: 'Zajtra vrátenie', priority: 3 };
    }
    
    // 🟡 Žltá: Nezaplatené
    if (!rental.paid) {
      return { color: '#ffc107', label: 'Nezaplatené', priority: 4 };
    }
    
    // 🔵 Modrá: Nové/začínajúce dnes
    const isStartingToday = startDate.toDateString() === today.toDateString();
    const isNewToday = new Date(rental.createdAt).toDateString() === today.toDateString();
    
    if (isStartingToday) {
      return { color: '#2196f3', label: 'Začína dnes', priority: 5 };
    }
    if (isNewToday) {
      return { color: '#2196f3', label: 'Nový dnes', priority: 6 };
    }
    
    // 🟢 Zelená: Všetko v poriadku (default)
    return { color: '#4caf50', label: 'V poriadku', priority: 7 };
  }, [protocolsHook.protocols]);

  // ⚡ OPTIMIZED: Memoized vehicle lookup map for performance
  const vehicleLookupMap = useMemo(() => {
    const map = new Map();
    // Použiť všetky vozidlá vrátane vyradených pre historické prenájmy
    (state.vehicles || []).forEach(vehicle => {
      map.set(vehicle.id, vehicle);
    });
    return map;
  }, [state.vehicles]);

  // ⚡ OPTIMIZED: Helper function using lookup map
  const getVehicleByRental = useCallback((rental: Rental) => {
    return rental.vehicleId ? vehicleLookupMap.get(rental.vehicleId) || null : null;
  }, [vehicleLookupMap]);

  // 📱 MOBILE CARD RENDERER - s action buttons
  const mobileCardRenderer = useCallback((rental: Rental, index: number) => {
    const vehicle = getVehicleByRental(rental);
    const hasHandover = !!protocolsHook.protocols[rental.id]?.handover;
    const hasReturn = !!protocolsHook.protocols[rental.id]?.return;
    const statusIndicator = getStatusIndicator(rental);
    
    return (
      <Card
        key={rental.id}
        sx={{
          mb: 2,
          p: 2,
          borderLeft: `4px solid ${statusIndicator.color}`,
          position: 'relative',
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Neznáme vozidlo'}
          </Typography>
          <Typography variant="caption" sx={{ color: statusIndicator.color, fontWeight: 600 }}>
            {statusIndicator.label}
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          📅 {formatDate(rental.startDate.toString())} - {formatDate(rental.endDate.toString())}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'success.main' }}>
          💰 {formatCurrency(rental.totalPrice)}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          👤 {rental.customerName}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" onClick={() => handleEdit(rental)}>
            Upraviť
          </Button>
          <Button size="small" variant="outlined" onClick={() => protocolsHook.handleCreateHandover(rental)}>
            Prevzatie
          </Button>
          <Button size="small" variant="outlined" onClick={() => protocolsHook.handleCreateReturn(rental)}>
            Vrátenie
          </Button>
        </Box>
      </Card>
    );
  }, [getVehicleByRental, protocolsHook.protocols, getStatusIndicator, theme, handleEdit, protocolsHook.handleCreateHandover, protocolsHook.handleCreateReturn]);

  // ⚡ TRIGGER BACKGROUND LOADING po načítaní rentals
  React.useEffect(() => {
    if (paginatedRentals.length > 0 && !protocolsHook.protocolStatusLoaded && !protocolsHook.isLoadingProtocolStatus) {
      // Spusti na pozadí za 100ms aby sa nestratila rýchlosť UI
      const timer = setTimeout(() => {
        protocolsHook.loadProtocolStatusInBackground();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [paginatedRentals.length, protocolsHook.protocolStatusLoaded, protocolsHook.isLoadingProtocolStatus, protocolsHook.loadProtocolStatusInBackground]);

  // 🎯 INFINITE SCROLL: Setup scroll event listeners
  React.useEffect(() => {
    // Always create fresh scroll handler with current values
    scrollHandlerRef.current = createScrollHandler();
    
    const desktopContainer = desktopScrollRef.current;
    const handler = scrollHandlerRef.current;
    
    // Setup desktop scroll listener
    if (!isMobile && desktopContainer && handler) {
      desktopContainer.addEventListener('scroll', handler, { passive: true });
    }
    
    // Setup mobile handler reference (used by React Window)
    if (isMobile && handler) {
      (window as any).__unifiedRentalScrollHandler = handler;
    }
    
    return () => {
      // Cleanup timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      
      // Remove desktop scroll listener
      if (!isMobile && desktopContainer && handler) {
        desktopContainer.removeEventListener('scroll', handler);
      }
      
      // Remove mobile handler reference
      if (isMobile) {
        delete (window as any).__unifiedRentalScrollHandler;
      }
    };
  }, [isMobile, createScrollHandler]);

  // Error handling
  if (paginatedError) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Chyba pri načítavaní prenájmov
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {paginatedError}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Obnoviť stránku
        </Button>
      </Card>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* 📊 EXTRACTED: RentalStats komponent */}
      <RentalStats
        rentals={filteredRentals}
        protocols={protocolsHook.protocols}
        isLoading={paginatedLoading}
        onQuickFilter={handleQuickFilter}
      />

      {/* 🚀 EXTRACTED: Action buttons moved to RentalActions component */}
      <Can create="rentals">
        <RentalActions
          isMobile={isMobile}
          handleAdd={handleAdd}
        />
      </Can>

      {/* 🚀 EXTRACTED: Export/Import moved to RentalExport component */}
      <RentalExport
        filteredRentals={filteredRentals}
        state={state}
        isMobile={isMobile}
        setImportError={setImportError}
      />
        
      {/* 🚀 EXTRACTED: RentalFilters komponent */}
      <RentalFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        advancedFilters={advancedFilters}
        handleAdvancedFiltersChange={setAdvancedFilters}
        toggleFilterValue={toggleFilterValue}
        isFilterValueSelected={isFilterValueSelected}
        resetAllFilters={handleResetAllFilters}
        uniquePaymentMethods={uniquePaymentMethods}
        uniqueCompanies={uniqueCompanies}
        uniqueStatuses={uniqueStatuses}
        uniqueVehicleBrands={uniqueVehicleBrands}
        uniqueInsuranceCompanies={uniqueInsuranceCompanies}
        uniqueInsuranceTypes={uniqueInsuranceTypes}
        filteredRentalsCount={filteredRentals.length}
        totalRentalsCount={totalCount || 0}
        showFiltersMobile={false}
        setShowFiltersMobile={() => {}}
      />

      {/* 🚀 EXTRACTED: RentalTable komponent */}
      <RentalTable
        paginatedRentals={filteredRentals}
        isMobile={isMobile}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleCreateHandover={protocolsHook.handleCreateHandover}
        handleCreateReturn={protocolsHook.handleCreateReturn}
        handleOpenProtocolMenu={(rental, type) => {
          console.log('Open protocol menu', rental.id, type);
        }}
        handleViewRental={handleViewRental}
        getVehicleByRental={getVehicleByRental}
        protocolStatusMap={protocolsHook.protocolStatusMap}
        protocols={protocolsHook.protocols}
        getStatusIndicator={getStatusIndicator}
        filteredRentals={filteredRentals}
        desktopScrollRef={desktopScrollRef}
        mobileScrollRef={mobileScrollRef}
        isLoadingProtocolStatus={protocolsHook.isLoadingProtocolStatus}
        protocolStatusLoaded={protocolsHook.protocolStatusLoaded}
        handleCheckProtocols={(rental) => {
          protocolsHook.loadProtocolsForRental(rental.id);
        }}
        VirtualizedRentalRow={null}
        onScroll={({ scrollOffset }) => {
          // 🎯 UNIFIED: Use the new unified scroll handler
          if ((window as any).__unifiedRentalScrollHandler) {
            (window as any).__unifiedRentalScrollHandler({ scrollOffset });
          }
        }}
      />

      {/* Load more button for desktop */}
      {!paginatedLoading && hasMore && (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', p: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleLoadMore}
            size="medium"
            startIcon={<RefreshIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Načítať ďalších {ITEMS_PER_PAGE} prenájmov
          </Button>
        </Box>
      )}
      
      {/* End of data indicator */}
      {!hasMore && paginatedRentals.length > 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          p: 3, 
          backgroundColor: 'rgba(76, 175, 80, 0.08)',
          borderRadius: 2,
          m: 2
        }}>
          <Typography variant="body1" color="success.main" fontWeight={500}>
            ✅ Všetky prenájmy načítané ({paginatedRentals.length} celkom)
          </Typography>
        </Box>
      )}

      {/* 🚀 EXTRACTED: All dialogs moved to RentalProtocols component */}
      <RentalProtocols
        openDialog={openDialog}
        openHandoverDialog={protocolsHook.openHandoverDialog}
        openReturnDialog={protocolsHook.openReturnDialog}
        openProtocolMenu={protocolsHook.openProtocolMenu}
        pdfViewerOpen={protocolsHook.pdfViewerOpen}
        galleryOpen={protocolsHook.galleryOpenRef.current}
        editingRental={editingRental}
        selectedRentalForProtocol={protocolsHook.selectedRentalForProtocol}
        selectedProtocolType={protocolsHook.selectedProtocolType}
        selectedPdf={protocolsHook.selectedPdf}
        galleryImages={protocolsHook.galleryImages}
        galleryVideos={protocolsHook.galleryVideos}
        galleryTitle={protocolsHook.galleryTitle}
        protocols={protocolsHook.protocols}
        setOpenDialog={setOpenDialog}
        setOpenHandoverDialog={protocolsHook.setOpenHandoverDialog}
        setOpenReturnDialog={protocolsHook.setOpenReturnDialog}
        handleSave={async (rental) => {
          try {
            if (editingRental) {
              await updateRental(rental);
              console.log('✅ Rental updated successfully:', rental.id);
            } else {
              await createRental(rental);
              console.log('✅ Rental created successfully');
            }
            setOpenDialog(false);
            setEditingRental(null);
            
            // 🎯 SCROLL PRESERVATION: Obnoviť pozíciu po zatvorení dialógu
            restoreScrollPosition();
            
            // Refresh infinite rentals data
            refresh();
          } catch (error) {
            console.error('❌ Error saving rental:', error);
            const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
            alert(`Chyba pri ukladaní prenájmu: ${errorMessage}`);
          }
        }}
        handleCancel={handleCancel}
        handleSaveHandover={async (protocolData) => {
          try {
            console.log('💾 Saving handover protocol:', protocolData);
            const data = await apiService.createHandoverProtocol(protocolData);
            console.log('✅ Handover protocol created:', data);
            
            // ✅ OPTIMISTIC UPDATE BULK-STATUS
            protocolsHook.setProtocolStatusMap((prev: Record<string, any>) => ({
              ...prev,
              [protocolData.rentalId]: {
                hasHandoverProtocol: true,
                hasReturnProtocol: prev[protocolData.rentalId]?.hasReturnProtocol || false,
              }
            }));

            protocolsHook.setOpenHandoverDialog(false);
            protocolsHook.setSelectedRentalForProtocol(null);
          } catch (error) {
            console.error('❌ Error saving handover protocol:', error);
            alert('Chyba pri ukladaní protokolu. Skúste to znovu.');
          }
        }}
        handleSaveReturn={async (protocolData) => {
          try {
            console.log('💾 Return protocol already saved, updating UI:', protocolData);
            
            protocolsHook.setOpenReturnDialog(false);
            protocolsHook.setSelectedRentalForProtocol(null);
          } catch (error) {
            console.error('❌ Error updating UI after return protocol save:', error);
            alert('Protokol bol uložený, ale UI sa nepodarilo aktualizovať. Obnovte stránku.');
          }
        }}
        handleClosePDF={protocolsHook.handleClosePDF}
        handleCloseGallery={protocolsHook.handleCloseGallery}
        handleCloseProtocolMenu={protocolsHook.handleCloseProtocolMenu}
        handleDownloadPDF={protocolsHook.handleDownloadPDF}
        handleViewGallery={protocolsHook.handleViewGallery}
      />
    </Box>
  );
}
