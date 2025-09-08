import {
  PhotoLibrary as GalleryIcon,
  PictureAsPdf as PDFIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useMemo, useRef, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import { useInfiniteRentals } from '../../hooks/useInfiniteRentals';
// import { usePermissions } from '../../hooks/usePermissions'; // Unused

// 🚀 EXTRACTED: Import all our refactored components and hooks
import { useCompanies } from '@/lib/react-query/hooks/useCompanies';
import { useCustomers } from '@/lib/react-query/hooks/useCustomers';
import { useBulkProtocolStatus } from '@/lib/react-query/hooks/useProtocols';
import {
  useCreateRental,
  useRentals,
  useUpdateRental,
} from '@/lib/react-query/hooks/useRentals';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { useRentalActions } from '../../hooks/useRentalActions';
import { useRentalFilters } from '../../hooks/useRentalFilters';
import { useRentalProtocols } from '../../hooks/useRentalProtocols';

// 🚀 EXTRACTED: Helper functions moved to utils

// 🚀 EXTRACTED: Types
import type {
  Company,
  Customer,
  ProtocolImage,
  ProtocolVideo,
  Rental,
  Vehicle,
} from '../../types';
import { ITEMS_PER_PAGE } from '../../types/rental-types';
import { logger } from '../../utils/logger';

// Local protocol data interface to match useRentalProtocols
interface ProtocolData {
  id: string;
  rentalId: string;
  createdAt: string;
  completedAt?: string;
  status: string;
  images?: ProtocolImage[];
  videos?: ProtocolVideo[];
  signatures?: Record<string, unknown>;
  notes?: string;
  [key: string]: unknown;
}
// 🔄 CLONE FUNCTIONALITY
import {
  calculateNextRentalPeriod,
  createClonedRental,
} from '../../utils/rentalCloneUtils';
// import { formatCurrency, formatDate } from '../../utils/rentalHelpers'; // Unused
import { Can } from '../common/PermissionGuard';
import {
  DefaultCard,
  ErrorButton,
  PrimaryButton,
  SecondaryButton,
} from '../ui';
import { RentalActions } from './components/RentalActions';
import { RentalExport } from './components/RentalExport';
import { RentalFilters } from './components/RentalFilters';
import { RentalProtocols } from './components/RentalProtocols';
import { RentalStats } from './components/RentalStats';
import { RentalTable } from './components/RentalTable';

// Constants (removed unused constants)

export default function RentalList() {
  // ⚡ PERFORMANCE: Only log renders in development with throttling
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);

  if (process.env.NODE_ENV === 'development') {
    renderCountRef.current++;
    const now = Date.now();
    // Only log every 500ms to prevent spam
    if (now - lastRenderTimeRef.current > 500) {
      logger.debug('RentalList render', {
        timestamp: now,
        renderCount: renderCountRef.current,
      });
      lastRenderTimeRef.current = now;
    }
  }

  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: vehicles = [] } = useVehicles();
  const { data: customers = [] } = useCustomers();
  const { data: companies = [] } = useCompanies();
  const createRentalMutation = useCreateRental();
  const updateRentalMutation = useUpdateRental();

  // Helper functions for compatibility
  const createRental = useCallback(
    (rental: Rental) => {
      return createRentalMutation.mutateAsync(rental);
    },
    [createRentalMutation]
  );

  const updateRental = useCallback(
    (rental: Rental) => {
      return updateRentalMutation.mutateAsync(rental);
    },
    [updateRentalMutation]
  );

  // 📋 PROTOCOL MENU STATE
  const [protocolMenuOpen, setProtocolMenuOpen] = useState(false);
  const [selectedProtocolRental, setSelectedProtocolRental] =
    useState<Rental | null>(null);
  const [selectedProtocolType, setSelectedProtocolType] = useState<
    'handover' | 'return' | null
  >(null);
  // const permissions = usePermissions(); // Unused for now
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🚀 REACT QUERY: Use React Query for rentals with instant updates
  const {
    data: allRentals = [],
    isLoading: rentalsLoading,
    error: rentalsError,
  } = useRentals();

  // 🚀 INFINITE SCROLL: Keep infinite scroll for performance but use React Query data
  const {
    rentals: paginatedRentals,
    loading: paginatedLoading,
    error: paginatedError,
    hasMore,
    totalCount,
    searchTerm,
    setSearchTerm,
    loadMore,
    refresh,
    updateFilters,
  } = useInfiniteRentals();

  // 🚀 HYBRID: Use React Query data when available, fallback to infinite scroll
  const rentals = allRentals.length > 0 ? allRentals : paginatedRentals;
  const loading = rentalsLoading || paginatedLoading;
  const error = rentalsError || paginatedError;

  // 🔍 DEBUG: Základné informácie o komponente - OPTIMIZED: Only log once
  const debugLoggedRef = useRef(false);
  if (process.env.NODE_ENV === 'development' && !debugLoggedRef.current) {
    logger.debug('🚀 RentalList LOADED:', {
      isMobile,
      screenWidth:
        typeof window !== 'undefined' ? window.innerWidth : 'unknown',
      breakpoint: theme.breakpoints.values.md,
    });
    debugLoggedRef.current = true;
  }

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
          hasHandoverProtocol:
            protocolType === 'handover'
              ? true
              : prev[rentalId]?.hasHandoverProtocol || false,
          hasReturnProtocol:
            protocolType === 'return'
              ? true
              : prev[rentalId]?.hasReturnProtocol || false,
          handoverProtocolId:
            protocolType === 'handover'
              ? data.id
              : prev[rentalId]?.handoverProtocolId,
          returnProtocolId:
            protocolType === 'return'
              ? data.id
              : prev[rentalId]?.returnProtocolId,
        },
      }));

      // ✅ REFRESH RENTALS: Aktualizuj aj rental list pre zobrazenie zelených ikoniek
      // Note: updateRentalInList expects full Rental object, so we'll rely on protocol status map instead
      // The UI will update automatically based on protocolStatusMap changes

      logger.debug(
        '✅ Protocol update completed - UI should refresh immediately'
      );
    },
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
    resetFilters,
  } = useRentalFilters({
    rentals: rentals, // Use hybrid rentals data
    vehicles: (vehicles || []) as unknown as Record<string, unknown>[],
    protocols: protocolsHook.protocols,
  });

  // 🚀 SERVER-SIDE SEARCH: Sync search between useRentalFilters and useInfiniteRentals
  React.useEffect(() => {
    if (debouncedSearchQuery !== searchTerm) {
      logger.debug('🔍 SEARCH: Syncing search term:', debouncedSearchQuery);
      setSearchTerm(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchTerm, setSearchTerm]);

  // 🚀 SERVER-SIDE FILTERING: Sync filters between useRentalFilters and useInfiniteRentals - OPTIMIZED
  const previousFiltersRef = useRef<string>('');
  React.useEffect(() => {
    const serverFilters = {
      // Map FilterState to RentalFilters format
      dateFrom: advancedFilters.dateFrom,
      dateTo: advancedFilters.dateTo,
      company:
        advancedFilters.company.length > 0
          ? advancedFilters.company.join(',')
          : undefined,
      status:
        advancedFilters.status.length > 0
          ? advancedFilters.status.join(',')
          : undefined,
      paymentMethod:
        advancedFilters.paymentMethod.length > 0
          ? advancedFilters.paymentMethod.join(',')
          : undefined,
      protocolStatus:
        advancedFilters.protocolStatus.length > 0
          ? advancedFilters.protocolStatus.join(',')
          : undefined,
      vehicleBrand: advancedFilters.vehicleBrand || undefined,
      priceMin: advancedFilters.priceMin || undefined,
      priceMax: advancedFilters.priceMax || undefined,
      sortBy: advancedFilters.sortBy,
      sortOrder: advancedFilters.sortOrder,
    };

    // OPTIMIZED: Only sync if filters actually changed
    const filtersString = JSON.stringify(serverFilters);
    if (filtersString !== previousFiltersRef.current) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('🔧 FILTERS: Syncing filters to server:', serverFilters);
      }
      updateFilters(serverFilters);
      previousFiltersRef.current = filtersString;
    }
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
  const toggleFilterValue = useCallback(
    (filterKey: keyof typeof advancedFilters, value: string) => {
      logger.debug(`🎯 TOGGLE FILTER: ${filterKey} = ${value}`);

      const currentValues = advancedFilters[filterKey] as string[];
      const newValues = Array.isArray(currentValues)
        ? currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
        : [value];

      const newFilters = {
        ...advancedFilters,
        [filterKey]: newValues,
      };

      logger.debug(`🎯 NEW FILTERS:`, newFilters);
      setAdvancedFilters(newFilters);
    },
    [advancedFilters, setAdvancedFilters]
  );

  const isFilterValueSelected = useCallback(
    (filterKey: keyof typeof advancedFilters, value: string): boolean => {
      const currentValues = advancedFilters[filterKey] as string[];
      return Array.isArray(currentValues) && currentValues.includes(value);
    },
    [advancedFilters]
  );

  const {
    openDialog,
    setOpenDialog,
    editingRental,
    setEditingRental,
    // importError, // Unused for now
    setImportError,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCancel,
    handleViewRental,
    savedScrollPosition,
    restoreScrollPosition,
  } = useRentalActions({
    onEdit: rental => {
      logger.debug('🔍 External edit handler called', { rentalId: rental.id });
    },
    onDelete: id => {
      logger.debug('🗑️ External delete handler called', { rentalId: id });
    },
    onScrollRestore: () => {
      logger.debug('📜 External scroll restore handler called');
    },
  });

  // 🔄 CLONE RENTAL HANDLER - Backend API verzia
  const handleCloneRental = useCallback(
    async (rental: Rental) => {
      try {
        logger.info('🔄 Starting rental clone via API', {
          rentalId: rental.id,
        });

        // Volaj backend API pre klonovanie
        const response = await fetch(`/api/rentals/${rental.id}/clone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token')}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Chyba pri kopírovaní prenájmu');
        }

        const result = await response.json();
        logger.info('✅ Clone API response', { result });

        if (result.success && result.data) {
          // Otvor edit formulár s novým prenájmom z API
          handleEdit(result.data);

          // Refresh zoznamu prenájmov aby sa zobrazil nový
          refresh();

          logger.info('✅ Clone operation completed successfully', {
            originalId: rental.id,
            newId: result.data.id,
            message: result.message,
          });
        } else {
          throw new Error(result.error || 'Neočakávaná odpoveď z API');
        }
      } catch (error) {
        logger.error('❌ Clone failed', { error, rentalId: rental.id });

        // Fallback na lokálnu logiku ak API zlyhá
        logger.info('🔄 Falling back to local clone logic');
        try {
          const cloneResult = calculateNextRentalPeriod(
            rental.startDate,
            rental.endDate
          );
          const clonedRental = createClonedRental(rental, cloneResult);

          handleEdit({
            ...rental,
            ...clonedRental,
            id: '', // Use empty string instead of undefined
          } as Rental);

          logger.info('✅ Local clone fallback completed');
        } catch (fallbackError) {
          logger.error('❌ Local clone fallback also failed', {
            fallbackError,
          });
          // TODO: Pridať error notification pre používateľa
        }
      }
    },
    [handleEdit, refresh]
  );

  // This was moved above to fix the dependency issue

  // Create separate refs for mobile and desktop scroll containers
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const scrollHandlerRef = useRef<((event: Event) => void) | null>(null);

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

    logger.debug(
      '📜 INFINITE SCROLL: Saved position before load more:',
      savedScrollPosition.current
    );

    // 🚀 INFINITE SCROLL: Load more rentals
    loadMore();
  }, [isMobile, savedScrollPosition, loadMore]);

  // 🎯 UNIFIED SCROLL HANDLER: Auto-trigger loading at 75%
  const createScrollHandler = useCallback(() => {
    return (event: Event) => {
      // Skip if already loading or no more data
      if (loading || !hasMore) {
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
        if ('scrollOffset' in event && typeof event.scrollOffset === 'number') {
          // Virtual scroll from React Window (mobile)
          const totalHeight = rentals.length * 160; // itemSize * count
          const viewportHeight = 600;
          const maxScroll = Math.max(1, totalHeight - viewportHeight);
          scrollPercentage = event.scrollOffset / maxScroll;

          if (process.env.NODE_ENV === 'development') {
            logger.debug(
              `📱 Virtual scroll: ${Math.round(scrollPercentage * 100)}%`
            );
          }
        } else if (event.target || event.currentTarget) {
          // Native scroll from container (desktop)
          const target = event.target || event.currentTarget;
          if (
            target &&
            'scrollTop' in target &&
            'scrollHeight' in target &&
            'clientHeight' in target
          ) {
            const { scrollTop, scrollHeight, clientHeight } = target as {
              scrollTop: number;
              scrollHeight: number;
              clientHeight: number;
            };
            const maxScroll = Math.max(1, scrollHeight - clientHeight);
            scrollPercentage = scrollTop / maxScroll;

            if (process.env.NODE_ENV === 'development') {
              logger.debug(
                `💻 Desktop scroll: ${Math.round(scrollPercentage * 100)}%`
              );
            }
          }
        }

        // Trigger infinite loading at threshold
        if (scrollPercentage >= SCROLL_THRESHOLD) {
          logger.debug(
            `🚀 INFINITE SCROLL: Triggered at ${Math.round(scrollPercentage * 100)}%`
          );
          handleLoadMore();
        }
      }, DEBOUNCE_DELAY);
    };
  }, [loading, hasMore, rentals.length, handleLoadMore]);

  // ⚡ OPTIMIZED: Memoized vehicle lookup map for performance
  const vehicleLookupMap = useMemo(() => {
    const map = new Map();
    // Použiť všetky vozidlá vrátane vyradených pre historické prenájmy
    (vehicles || []).forEach(vehicle => {
      map.set(vehicle.id, vehicle);
    });
    return map;
  }, [vehicles]);

  // ⚡ OPTIMIZED: Helper function using lookup map
  const getVehicleByRental = useCallback(
    (rental: Rental) => {
      return rental.vehicleId
        ? vehicleLookupMap.get(rental.vehicleId) || null
        : null;
    },
    [vehicleLookupMap]
  );

  // 📱 MOBILE CARD RENDERER - removed (unused)

  // ⚡ REACT QUERY: Načítaj bulk protocol status
  const { data: bulkProtocolStatus, isLoading: isLoadingBulkStatus } =
    useBulkProtocolStatus();

  // Použiť ref pre tracking či už boli dáta nastavené
  const protocolStatusSetRef = React.useRef(false);

  // Aktualizuj protocol status map keď sa načítajú dáta - jednorazovo
  React.useEffect(() => {
    // Kontrola: načítané dáta + ešte neboli nastavené + nie je loading
    if (
      bulkProtocolStatus &&
      !protocolStatusSetRef.current &&
      !isLoadingBulkStatus
    ) {
      // Backend vracia array, musíme transformovať na objekt s rentalId kľúčmi
      const isArray = Array.isArray(bulkProtocolStatus);
      const statusCount = isArray
        ? bulkProtocolStatus.length
        : Object.keys(bulkProtocolStatus).length;

      // Kontrola či máme nejaké dáta
      if (statusCount > 0) {
        console.log('🔍 Setting protocol status from React Query:', {
          totalCount: statusCount,
          isArray,
          sample: isArray
            ? bulkProtocolStatus.slice(0, 3)
            : Object.entries(bulkProtocolStatus).slice(0, 3),
        });

        // Transformuj array na objekt ak je potrebné
        type ProtocolStatus = {
          hasHandoverProtocol: boolean;
          hasReturnProtocol: boolean;
          handoverProtocolId?: string;
          returnProtocolId?: string;
          handoverCreatedAt?: Date;
          returnCreatedAt?: Date;
        };

        type ProtocolStatusItem = ProtocolStatus & {
          rentalId: string;
        };

        const protocolStatusMap = isArray
          ? (bulkProtocolStatus as ProtocolStatusItem[]).reduce(
              (
                acc: Record<string, ProtocolStatus>,
                status: ProtocolStatusItem
              ) => {
                acc[status.rentalId] = {
                  hasHandoverProtocol: status.hasHandoverProtocol,
                  hasReturnProtocol: status.hasReturnProtocol,
                  handoverProtocolId: status.handoverProtocolId,
                  returnProtocolId: status.returnProtocolId,
                  handoverCreatedAt: status.handoverCreatedAt,
                  returnCreatedAt: status.returnCreatedAt,
                };
                return acc;
              },
              {}
            )
          : bulkProtocolStatus;

        // Nastav dáta
        protocolsHook.setProtocolStatusMap(protocolStatusMap);
        protocolsHook.setProtocolStatusLoaded(true);

        // Označ že dáta boli nastavené
        protocolStatusSetRef.current = true;

        console.log(
          `✅ React Query: Protocol status set for ${statusCount} rentals`
        );
      }
    }
  }, [bulkProtocolStatus, isLoadingBulkStatus, protocolsHook]); // Stabilné dependencies

  // ⚡ TRIGGER BACKGROUND LOADING po načítaní rentals - už nepotrebujeme
  // React Query sa postará o načítanie automaticky

  // 🎯 INFINITE SCROLL: Setup scroll event listeners
  React.useEffect(() => {
    // Always create fresh scroll handler with current values
    scrollHandlerRef.current = createScrollHandler();

    const desktopContainer = desktopScrollRef.current;
    const handler = scrollHandlerRef.current;

    // Capture timer refs at effect start for cleanup
    const debounceTimer = debounceTimerRef.current;
    const throttleTimer = throttleTimerRef.current;

    // Setup desktop scroll listener
    if (!isMobile && desktopContainer && handler) {
      desktopContainer.addEventListener('scroll', handler, { passive: true });
    }

    // Setup mobile handler reference (used by React Window)
    if (isMobile && handler) {
      (
        window as Window & {
          __unifiedRentalScrollHandler?: (event: Event) => void;
        }
      ).__unifiedRentalScrollHandler = handler;
    }

    return () => {
      // Cleanup timers using captured values
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }

      // Remove desktop scroll listener
      if (!isMobile && desktopContainer && handler) {
        desktopContainer.removeEventListener('scroll', handler);
      }

      // Remove mobile handler reference
      if (isMobile) {
        delete (
          window as Window & {
            __unifiedRentalScrollHandler?: (event: Event) => void;
          }
        ).__unifiedRentalScrollHandler;
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
      const protocol =
        protocolsHook.protocols[selectedProtocolRental.id]?.[
          selectedProtocolType
        ];
      if (protocol) {
        try {
          const token =
            localStorage.getItem('blackrent_token') ||
            sessionStorage.getItem('blackrent_token');
          let pdfUrl: string;

          if (protocol.pdfUrl) {
            pdfUrl = protocol.pdfUrl as string;
          } else {
            // Generate PDF URL - používaj relatívne /api v dev (Vite proxy)
            const baseUrl =
              import.meta.env.VITE_API_URL ||
              (import.meta.env.DEV ? '' : 'http://localhost:3001');
            pdfUrl = `${baseUrl}/api/protocols/${selectedProtocolType}/${protocol.id}/pdf?token=${token || ''}`;
          }

          // Open PDF in new tab
          window.open(pdfUrl, '_blank');
        } catch (error) {
          console.error('❌ Error downloading PDF:', error);
        }
      }
    }
    handleCloseProtocolMenu();
  }, [
    selectedProtocolRental,
    selectedProtocolType,
    protocolsHook,
    handleCloseProtocolMenu,
  ]);

  const handleViewGallery = useCallback(async () => {
    if (!selectedProtocolRental || !selectedProtocolType) return;

    try {
      logger.debug(
        '🔍 Opening gallery for protocol:',
        selectedProtocolType,
        'rental:',
        selectedProtocolRental.id
      );

      // Zatvor protocol menu najprv
      handleCloseProtocolMenu();

      // Načítaj protokol ak nie je načítaný
      let protocol =
        protocolsHook.protocols[selectedProtocolRental.id]?.[
          selectedProtocolType
        ];

      if (!protocol) {
        logger.debug('📥 Loading protocol for gallery...');
        const freshProtocolData = await protocolsHook.loadProtocolsForRental(
          selectedProtocolRental.id
        );
        protocol = freshProtocolData?.[selectedProtocolType];
      }

      if (!protocol) {
        alert('Protokol nebol nájdený!');
        return;
      }

      // Parsovanie obrázkov z protokolu
      const parseImages = (imageData: unknown): ProtocolImage[] => {
        if (!imageData) return [];

        if (typeof imageData === 'string') {
          try {
            const parsed = JSON.parse(imageData);
            return Array.isArray(parsed) ? (parsed as ProtocolImage[]) : [];
          } catch (error) {
            console.warn('⚠️ Failed to parse image data as JSON:', imageData);
            return [];
          }
        }

        if (Array.isArray(imageData)) {
          return imageData as ProtocolImage[];
        }

        return [];
      };

      const parseVideos = (videoData: unknown): ProtocolVideo[] => {
        if (!videoData) return [];

        if (typeof videoData === 'string') {
          try {
            const parsed = JSON.parse(videoData);
            return Array.isArray(parsed) ? (parsed as ProtocolVideo[]) : [];
          } catch (error) {
            console.warn('⚠️ Failed to parse video data as JSON:', videoData);
            return [];
          }
        }

        if (Array.isArray(videoData)) {
          return videoData as ProtocolVideo[];
        }

        return [];
      };

      const images = [
        ...parseImages(protocol.vehicleImages),
        ...parseImages(protocol.documentImages),
        ...parseImages(protocol.damageImages),
      ];

      const videos = [
        ...parseVideos(protocol.vehicleVideos),
        ...parseVideos(protocol.documentVideos),
        ...parseVideos(protocol.damageVideos),
      ];

      logger.debug('🖼️ Gallery data prepared:', {
        imagesCount: images.length,
        videosCount: videos.length,
      });

      if (images.length === 0 && videos.length === 0) {
        alert('Nenašli sa žiadne obrázky pre tento protokol!');
        return;
      }

      // Nastav galériu cez protocolsHook
      protocolsHook.setGalleryImages(images);
      protocolsHook.setGalleryVideos(videos);
      const vehicle = getVehicleByRental(selectedProtocolRental);
      protocolsHook.setGalleryTitle(
        `${selectedProtocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'} - ${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Neznáme vozidlo'}`
      );
      protocolsHook.galleryOpenRef.current = true;

      logger.debug('✅ Gallery opened successfully with protocol data');
    } catch (error) {
      console.error('❌ Error opening gallery:', error);
      alert('Chyba pri otváraní galérie!');
    }
  }, [
    selectedProtocolRental,
    selectedProtocolType,
    protocolsHook,
    handleCloseProtocolMenu,
    getVehicleByRental,
  ]);

  // Error handling
  if (error) {
    return (
      <DefaultCard sx={{ textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Chyba pri načítavaní prenájmov
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {typeof error === 'string'
            ? error
            : error?.message || 'Neznáma chyba'}
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
        isLoading={loading}
        onQuickFilter={handleQuickFilter}
      />

      {/* 🚀 EXTRACTED: Action buttons moved to RentalActions component */}
      <Can create="rentals">
        <RentalActions isMobile={isMobile} handleAdd={handleAdd} />
      </Can>

      {/* 🚀 EXTRACTED: Export/Import moved to RentalExport component */}
      <RentalExport
        filteredRentals={filteredRentals}
        state={{
          customers: (customers || []) as Customer[],
          companies: (companies || []) as Company[],
          vehicles: (vehicles || []) as Vehicle[],
          rentals: rentals || [],
        }}
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
        handleAdvancedFiltersChange={filters => {
          // Type assertion to handle FilterState compatibility
          setAdvancedFilters(filters as typeof advancedFilters);
        }}
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
        paginatedRentals={searchTerm ? rentals : filteredRentals}
        isMobile={isMobile}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleCloneRental={handleCloneRental} // 🔄 NOVÉ: Clone funkcionalita
        handleOpenProtocolMenu={(rental, type) => {
          logger.debug('📋 Opening protocol menu', rental.id, type);

          // Kontrola existencie protokolu cez protocolStatusMap (rýchlejšie a spoľahlivejšie)
          const protocolStatus = protocolsHook.protocolStatusMap[rental.id];
          const hasProtocol =
            type === 'handover'
              ? protocolStatus?.hasHandoverProtocol
              : protocolStatus?.hasReturnProtocol;

          logger.debug('🔍 Protocol check:', {
            rentalId: rental.id,
            type,
            hasProtocol,
            protocolStatus,
            mapSize: Object.keys(protocolsHook.protocolStatusMap).length,
            isLoaded: protocolsHook.protocolStatusLoaded,
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
        filteredRentals={filteredRentals}
        desktopScrollRef={desktopScrollRef}
        mobileScrollRef={mobileScrollRef}
        isLoadingProtocolStatus={protocolsHook.isLoadingProtocolStatus}
        protocolStatusLoaded={protocolsHook.protocolStatusLoaded}
        handleCheckProtocols={rental => {
          protocolsHook.loadProtocolsForRental(rental.id);
        }}
        loadingProtocols={protocolsHook.loadingProtocols}
        VirtualizedRentalRow={React.Fragment as React.ComponentType<unknown>}
        onScroll={({ scrollOffset }) => {
          // 🎯 UNIFIED: Use the new unified scroll handler
          const windowWithHandler = window as Window & {
            __unifiedRentalScrollHandler?: (event: Event) => void;
          };
          if (windowWithHandler.__unifiedRentalScrollHandler) {
            // Create a proper Event-like object
            const scrollEvent = {
              scrollOffset,
              target: null,
              currentTarget: null,
              bubbles: false,
              cancelable: false,
              composed: false,
              defaultPrevented: false,
              eventPhase: 0,
              isTrusted: false,
              preventDefault: () => {},
              stopImmediatePropagation: () => {},
              stopPropagation: () => {},
              timeStamp: Date.now(),
              type: 'scroll',
              cancelBubble: false,
              composedPath: () => [],
              initEvent: () => {},
              NONE: 0,
              CAPTURING_PHASE: 1,
              AT_TARGET: 2,
              BUBBLING_PHASE: 3,
              returnValue: true,
              srcElement: null,
            } as unknown as Event;
            windowWithHandler.__unifiedRentalScrollHandler(scrollEvent);
          }
        }}
      />

      {/* Load more button for desktop */}
      {!loading && hasMore && (
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'center',
            p: 3,
          }}
        >
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
      {!hasMore && rentals.length > 0 && (
        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            backgroundColor: 'rgba(76, 175, 80, 0.08)',
            borderRadius: 2,
            m: 2,
          }}
        >
          <Typography variant="body1" color="success.main" fontWeight={500}>
            ✅ Všetky prenájmy načítané ({rentals.length} celkom)
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
        handleSave={async rental => {
          try {
            if (rental.id && editingRental?.id) {
              // Existujúci prenájom s ID - update
              await updateRental(rental as unknown as Rental);
              logger.info('✅ Rental updated successfully:', rental.id);
            } else {
              // Nový prenájom bez ID alebo klonovaný prenájom - create
              await createRental(rental as unknown as Rental);
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
            const errorMessage =
              error instanceof Error ? error.message : 'Neznáma chyba';
            alert(`Chyba pri ukladaní prenájmu: ${errorMessage}`);
          }
        }}
        handleCancel={handleCancel}
        handleSaveHandover={async protocolData => {
          try {
            logger.debug(
              '💾 Handover protocol already saved, updating UI:',
              protocolData
            );

            // React Query vracia priamo protocol objekt
            const rentalId =
              protocolData?.rentalId ||
              (protocolData?.rental as { id?: string })?.id;

            if (rentalId) {
              // ✅ VOLAJ PROTOCOL UPDATE CALLBACK pre okamžitú aktualizáciu
              await protocolsHook.onProtocolUpdate?.(
                rentalId as string,
                'handover',
                protocolData as unknown as ProtocolData
              );
            }

            protocolsHook.setOpenHandoverDialog(false);
            protocolsHook.setSelectedRentalForProtocol(null);

            logger.debug('✅ Handover protocol UI updated successfully');
          } catch (error) {
            console.error('❌ Error updating handover protocol UI:', error);
            alert('Chyba pri aktualizácii protokolu. Skúste to znovu.');
          }
        }}
        handleSaveReturn={async protocolData => {
          try {
            logger.debug(
              '💾 Return protocol already saved, updating UI:',
              protocolData
            );

            // React Query vracia priamo protocol objekt
            const rentalId =
              protocolData?.rentalId ||
              (protocolData?.rental as { id?: string })?.id;

            if (rentalId) {
              // ✅ VOLAJ PROTOCOL UPDATE CALLBACK pre okamžitú aktualizáciu
              await protocolsHook.onProtocolUpdate?.(
                rentalId as string,
                'return',
                protocolData as unknown as ProtocolData
              );
            }

            protocolsHook.setOpenReturnDialog(false);
            protocolsHook.setSelectedRentalForProtocol(null);

            logger.debug('✅ Return protocol UI updated successfully');
          } catch (error) {
            console.error('❌ Error updating return protocol UI:', error);
            alert(
              'Protokol bol uložený, ale UI sa nepodarilo aktualizovať. Obnovte stránku.'
            );
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
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {selectedProtocolType === 'handover' ? '🚗→' : '←🚗'}
          {selectedProtocolType === 'handover'
            ? 'Odovzdávací protokol'
            : 'Preberací protokol'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <ErrorButton
              fullWidth
              startIcon={<PDFIcon />}
              onClick={handleDownloadPDF}
              sx={{
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
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
                fontSize: { xs: '1rem', sm: '0.875rem' },
              }}
            >
              🖼️ Zobraziť fotky
            </PrimaryButton>

            <SecondaryButton
              fullWidth
              onClick={handleCloseProtocolMenu}
              sx={{
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
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
