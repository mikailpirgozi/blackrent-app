import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Card
} from '@mui/material';
import { PrimaryButton, SecondaryButton, ErrorButton, WarningButton, DefaultCard } from '../ui';
import { 
  Refresh as RefreshIcon,
  PictureAsPdf as PDFIcon,
  PhotoLibrary as GalleryIcon
} from '@mui/icons-material';
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
  
  // 📋 PROTOCOL MENU STATE
  const [protocolMenuOpen, setProtocolMenuOpen] = useState(false);
  const [selectedProtocolRental, setSelectedProtocolRental] = useState<Rental | null>(null);
  const [selectedProtocolType, setSelectedProtocolType] = useState<'handover' | 'return' | null>(null);
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
  logger.debug('🚀 RentalList LOADED:', {
    isMobile,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
    breakpoint: theme.breakpoints.values.md
  });

  // 🚀 EXTRACTED: Use protocol hook first
  const protocolsHook = useRentalProtocols({
    onProtocolUpdate: async (rentalId, protocolType, data) => {
      logger.debug('📋 Protocol updated', { rentalId, protocolType });
      
      // ✅ OKAMŽITÁ AKTUALIZÁCIA: Vyčisti cache a znovu načítaj protokoly
      protocolsHook.setProtocols(prev => {
        const newProtocols = { ...prev };
        delete newProtocols[rentalId];
        return newProtocols;
      });
      
      // Znovu načítaj protokoly pre tento rental
      await protocolsHook.loadProtocolsForRental(rentalId);
      
      // ✅ OPTIMISTIC UPDATE: Okamžite aktualizuj protocol status
      protocolsHook.setProtocolStatusMap(prev => ({
        ...prev,
        [rentalId]: {
          hasHandoverProtocol: protocolType === 'handover' ? true : (prev[rentalId]?.hasHandoverProtocol || false),
          hasReturnProtocol: protocolType === 'return' ? true : (prev[rentalId]?.hasReturnProtocol || false),
          handoverProtocolId: protocolType === 'handover' ? data.id : prev[rentalId]?.handoverProtocolId,
          returnProtocolId: protocolType === 'return' ? data.id : prev[rentalId]?.returnProtocolId,
        }
      }));
      
      // ✅ REFRESH RENTALS: Aktualizuj aj rental list pre zobrazenie zelených ikoniek
      // Note: updateRentalInList expects full Rental object, so we'll rely on protocol status map instead
      // The UI will update automatically based on protocolStatusMap changes
      
      logger.debug('✅ Protocol update completed - UI should refresh immediately');
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
      logger.debug('🔍 SEARCH: Syncing search term:', debouncedSearchQuery);
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

    logger.debug('🔧 FILTERS: Syncing filters to server:', serverFilters);
    updateFilters(serverFilters);
  }, [advancedFilters, updateFilters]);

  // 🚀 ENHANCED RESET: Reset both local and server-side filters
  const handleResetAllFilters = useCallback(() => {
    logger.debug('🔄 RESET: Resetting all filters');
    resetFilters(); // Reset local filters
    setSearchTerm(''); // Reset server search
    updateFilters({}); // Reset server filters
    refresh(); // Refresh data
  }, [resetFilters, setSearchTerm, updateFilters, refresh]);

  // 🚀 MULTI-SELECT FILTER HELPERS: For server-side filtering
  const toggleFilterValue = useCallback((filterKey: keyof typeof advancedFilters, value: string) => {
    logger.debug(`🎯 TOGGLE FILTER: ${filterKey} = ${value}`);
    
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
    
    logger.debug(`🎯 NEW FILTERS:`, newFilters);
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
      logger.debug('🔍 External edit handler called', { rentalId: rental.id });
    },
    onDelete: (id) => {
      logger.debug('🗑️ External delete handler called', { rentalId: id });
    },
    onScrollRestore: () => {
      logger.debug('📜 External scroll restore handler called');
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
    
    logger.debug('📜 INFINITE SCROLL: Saved position before load more:', savedScrollPosition.current);
    
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
            logger.debug(`📱 Virtual scroll: ${Math.round(scrollPercentage * 100)}%`);
          }
        } else if (event.target || event.currentTarget) {
          // Native scroll from container (desktop)
          const target = event.target || event.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = target;
          const maxScroll = Math.max(1, scrollHeight - clientHeight);
          scrollPercentage = scrollTop / maxScroll;
          
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`💻 Desktop scroll: ${Math.round(scrollPercentage * 100)}%`);
          }
        }
        
        // Trigger infinite loading at threshold
        if (scrollPercentage >= SCROLL_THRESHOLD) {
          logger.debug(`🚀 INFINITE SCROLL: Triggered at ${Math.round(scrollPercentage * 100)}%`);
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
          <SecondaryButton size="small" onClick={() => handleEdit(rental)}>
            Upraviť
          </SecondaryButton>
          <SecondaryButton size="small" onClick={() => protocolsHook.handleCreateHandover(rental)}>
            Prevzatie
          </SecondaryButton>
          <SecondaryButton size="small" onClick={() => protocolsHook.handleCreateReturn(rental)}>
            Vrátenie
          </SecondaryButton>
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

  // 📋 PROTOCOL MENU HANDLERS
  const handleCloseProtocolMenu = useCallback(() => {
    setProtocolMenuOpen(false);
    setSelectedProtocolRental(null);
    setSelectedProtocolType(null);
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (selectedProtocolRental && selectedProtocolType) {
      const protocol = protocolsHook.protocols[selectedProtocolRental.id]?.[selectedProtocolType];
      if (protocol) {
        try {
          const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
          let pdfUrl: string;
          
          if (protocol.pdfUrl) {
            pdfUrl = protocol.pdfUrl;
          } else {
            // Generate PDF URL
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            pdfUrl = `${baseUrl}/api/protocols/${selectedProtocolType}/${protocol.id}/pdf?token=${token}`;
          }
          
          // Open PDF in new tab
          window.open(pdfUrl, '_blank');
        } catch (error) {
          console.error('❌ Error downloading PDF:', error);
        }
      }
    }
    handleCloseProtocolMenu();
  }, [selectedProtocolRental, selectedProtocolType, protocolsHook.protocols, handleCloseProtocolMenu]);

  const handleViewGallery = useCallback(async () => {
    if (!selectedProtocolRental || !selectedProtocolType) return;
    
    try {
      logger.debug('🔍 Opening gallery for protocol:', selectedProtocolType, 'rental:', selectedProtocolRental.id);
      
      // Zatvor protocol menu najprv
      handleCloseProtocolMenu();
      
      // Načítaj protokol ak nie je načítaný
      let protocol = protocolsHook.protocols[selectedProtocolRental.id]?.[selectedProtocolType];
      
      if (!protocol) {
        logger.debug('📥 Loading protocol for gallery...');
        const freshProtocolData = await protocolsHook.loadProtocolsForRental(selectedProtocolRental.id);
        protocol = freshProtocolData?.[selectedProtocolType];
      }
      
      if (!protocol) {
        alert('Protokol nebol nájdený!');
        return;
      }

      // Parsovanie obrázkov z protokolu
      const parseImages = (imageData: any): any[] => {
        if (!imageData) return [];
        
        if (typeof imageData === 'string') {
          try {
            const parsed = JSON.parse(imageData);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            console.warn('⚠️ Failed to parse image data as JSON:', imageData);
            return [];
          }
        }
        
        if (Array.isArray(imageData)) {
          return imageData;
        }
        
        return [];
      };

      const images = [
        ...parseImages(protocol.vehicleImages),
        ...parseImages(protocol.documentImages),
        ...parseImages(protocol.damageImages)
      ];
      
      const videos = [
        ...parseImages(protocol.vehicleVideos),
        ...parseImages(protocol.documentVideos),
        ...parseImages(protocol.damageVideos)
      ];

      logger.debug('🖼️ Gallery data prepared:', {
        imagesCount: images.length,
        videosCount: videos.length
      });

      if (images.length === 0 && videos.length === 0) {
        alert('Nenašli sa žiadne obrázky pre tento protokol!');
        return;
      }
      
      // Nastav galériu cez protocolsHook
      protocolsHook.setGalleryImages(images);
      protocolsHook.setGalleryVideos(videos);
      const vehicle = getVehicleByRental(selectedProtocolRental);
      protocolsHook.setGalleryTitle(`${selectedProtocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'} - ${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Neznáme vozidlo'}`);
      protocolsHook.galleryOpenRef.current = true;
      
      logger.debug('✅ Gallery opened successfully with protocol data');
      
    } catch (error) {
      console.error('❌ Error opening gallery:', error);
      alert('Chyba pri otváraní galérie!');
    }
  }, [selectedProtocolRental, selectedProtocolType, protocolsHook, handleCloseProtocolMenu, getVehicleByRental]);

  // Error handling
  if (paginatedError) {
    return (
      <DefaultCard sx={{ textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Chyba pri načítavaní prenájmov
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {paginatedError}
        </Typography>
        <PrimaryButton onClick={() => window.location.reload()}>
          Obnoviť stránku
        </PrimaryButton>
      </DefaultCard>
    );
  }

  return (
    <Box sx={{ p: { xs: 0, md: 0 } }}>
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
        paginatedRentals={searchTerm ? paginatedRentals : filteredRentals}
        isMobile={isMobile}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleCreateHandover={protocolsHook.handleCreateHandover}
        handleCreateReturn={protocolsHook.handleCreateReturn}
        handleOpenProtocolMenu={(rental, type) => {
          logger.debug('📋 Opening protocol menu', rental.id, type);
          
          // Kontrola existencie protokolu cez protocolStatusMap (rýchlejšie a spoľahlivejšie)
          const protocolStatus = protocolsHook.protocolStatusMap[rental.id];
          const hasProtocol = type === 'handover' 
            ? protocolStatus?.hasHandoverProtocol
            : protocolStatus?.hasReturnProtocol;
            
          logger.debug('🔍 Protocol check:', {
            rentalId: rental.id,
            type,
            hasProtocol,
            protocolStatus
          });
            
          if (hasProtocol) {
            // Najprv načítaj protokoly do state pre menu
            protocolsHook.loadProtocolsForRental(rental.id).then(() => {
              // Otvor protocol menu pre existujúci protokol
              setSelectedProtocolRental(rental);
              setSelectedProtocolType(type);
              setProtocolMenuOpen(true);
            });
          } else {
            // Vytvor nový protokol
            if (type === 'handover') {
              protocolsHook.handleCreateHandover(rental);
            } else if (type === 'return') {
              protocolsHook.handleCreateReturn(rental);
            }
          }
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
        loadingProtocols={protocolsHook.loadingProtocols}
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
          <PrimaryButton 
            onClick={handleLoadMore}
            size="medium"
            startIcon={<RefreshIcon />}
            sx={{ px: 3 }}
          >
            Načítať ďalších {ITEMS_PER_PAGE} prenájmov
          </PrimaryButton>
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
        protocolStatusMap={protocolsHook.protocolStatusMap}
        setOpenDialog={setOpenDialog}
        setOpenHandoverDialog={protocolsHook.setOpenHandoverDialog}
        setOpenReturnDialog={protocolsHook.setOpenReturnDialog}
        handleSave={async (rental) => {
          try {
            if (editingRental) {
              await updateRental(rental);
              logger.info('✅ Rental updated successfully:', rental.id);
            } else {
              await createRental(rental);
              logger.info('✅ Rental created successfully');
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
            logger.debug('💾 Handover protocol already saved, updating UI:', protocolData);
            
            // ✅ VOLAJ PROTOCOL UPDATE CALLBACK pre okamžitú aktualizáciu
            await protocolsHook.onProtocolUpdate?.(protocolData.rentalId, 'handover', protocolData);

            protocolsHook.setOpenHandoverDialog(false);
            protocolsHook.setSelectedRentalForProtocol(null);
            
            logger.debug('✅ Handover protocol UI updated successfully');
          } catch (error) {
            console.error('❌ Error updating handover protocol UI:', error);
            alert('Chyba pri aktualizácii protokolu. Skúste to znovu.');
          }
        }}
        handleSaveReturn={async (protocolData) => {
          try {
            logger.debug('💾 Return protocol already saved, updating UI:', protocolData);
            
            // ✅ VOLAJ PROTOCOL UPDATE CALLBACK pre okamžitú aktualizáciu
            await protocolsHook.onProtocolUpdate?.(protocolData.rentalId, 'return', protocolData);
            
            protocolsHook.setOpenReturnDialog(false);
            protocolsHook.setSelectedRentalForProtocol(null);
            
            logger.debug('✅ Return protocol UI updated successfully');
          } catch (error) {
            console.error('❌ Error updating return protocol UI:', error);
            alert('Protokol bol uložený, ale UI sa nepodarilo aktualizovať. Obnovte stránku.');
          }
        }}
        handleClosePDF={protocolsHook.handleClosePDF}
        handleCloseGallery={protocolsHook.handleCloseGallery}
        handleCloseProtocolMenu={protocolsHook.handleCloseProtocolMenu}
        handleDownloadPDF={protocolsHook.handleDownloadPDF}
        handleViewGallery={protocolsHook.handleViewGallery}
      />

      {/* 📋 PROTOCOL MENU DIALOG */}
      <Dialog
        open={protocolMenuOpen}
        onClose={handleCloseProtocolMenu}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {selectedProtocolType === 'handover' ? '🚗→' : '←🚗'}
          {selectedProtocolType === 'handover' ? 'Odovzdávací protokol' : 'Preberací protokol'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            <ErrorButton
              fullWidth
              startIcon={<PDFIcon />}
              onClick={handleDownloadPDF}
              sx={{ 
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' }
              }}
            >
              📄 Stiahnuť PDF protokol
            </ErrorButton>
            
            <PrimaryButton
              fullWidth
              startIcon={<GalleryIcon />}
              onClick={handleViewGallery}
              sx={{ 
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' }
              }}
            >
              🖼️ Zobraziť fotky
            </PrimaryButton>
            
            <SecondaryButton
              fullWidth
              onClick={handleCloseProtocolMenu}
              sx={{ 
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' }
              }}
            >
              Zavrieť
            </SecondaryButton>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
