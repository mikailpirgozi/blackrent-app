import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Can } from '../common/PermissionGuard';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Grid,
  Divider,
  Fade
} from '@mui/material';
import {

  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Assignment as HandoverIcon,
  AssignmentReturn as ReturnIcon,
  PictureAsPdf as PDFIcon,
  PhotoLibrary as GalleryIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,

  List as ListIcon

} from '@mui/icons-material';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { Rental } from '../../types';
import { useRentalUpdates, useProtocolUpdates } from '../../hooks/useWebSocket';
import { logger } from '../../utils/smartLogger';
import { useInfiniteRentals } from '../../hooks/useInfiniteRentals';
import { MobileRentalRow } from './MobileRentalRow';
import { getMobileStyles, TOUCH_TARGETS } from '../../utils/mobileResponsive';

import { v4 as uuidv4 } from 'uuid';
import { FixedSizeList as List } from 'react-window';
// Moved to RentalDialogs component:
// import RentalForm from './RentalForm';
// import PDFViewer from '../common/PDFViewer';
// import ProtocolGallery from '../common/ProtocolGallery';
// import ReturnProtocolForm from '../protocols/ReturnProtocolForm';
import { RentalStats } from './components/RentalStats';
import { getBaseUrl } from '../../utils/apiUrl';
import { RentalFilters } from './components/RentalFilters';
import { RentalTable } from './components/RentalTable';
import { RentalProtocols } from './components/RentalProtocols';
import { RentalActions } from './components/RentalActions';
import { RentalExport } from './components/RentalExport';
// 🚀 LAZY LOADING: Moved to RentalDialogs component
// const HandoverProtocolForm = React.lazy(() => import('../protocols/HandoverProtocolForm'));

// 🚀 EXTRACTED: Helper functions moved to utils
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getPaymentMethodLabel
} from '../../utils/rentalHelpers';



// Constants
const ITEMS_PER_PAGE = 50; // Number of items loaded per page

// Types
interface FilterState {
  // Základné filtre - arrays pre multi-select
  status: string[];
  paymentMethod: string[];
  company: string[];
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  protocolStatus: string[];
  
  // Rozšírené filtre
  customerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  licensePlate: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  insuranceCompany: string;
  insuranceType: string;
  
  // Časové filtre
  timeFilter: string;
  
  // Cenové filtre
  priceRange: string;
  
  // Stav platby
  paymentStatus: string;
  
  // Zobrazenie
  showOnlyActive: boolean;
  showOnlyOverdue: boolean;
  showOnlyCompleted: boolean;
}



// 🎯 SNAPSHOT: Komponent pre zobrazenie majiteľa vozidla (ZAMRAZENÝ k dátumu prenájmu)
const VehicleOwnerDisplay: React.FC<{
  rental: Rental;
}> = ({ rental }) => {
  // 🛡️ OPRAVENÉ: Používa vehicle.company pretože rental.company už neexistuje v DB
  const { state } = useApp();
  const vehicle = state.vehicles.find(v => v.id === rental.vehicleId);
  if (!vehicle?.company) {
    return (
      <Typography variant="body2" color="error">
        ⚠️ CHYBA: Bez majiteľa
      </Typography>
    );
  }
  
  const ownerName = vehicle.company;

  return (
    <Typography variant="body2" color="text.secondary">
      {ownerName}
    </Typography>
  );
};

export default function RentalListNew() {
  // ⚡ PERFORMANCE: Only log renders in development
  if (process.env.NODE_ENV === 'development') {
    logger.render('RentalListNew render', { timestamp: Date.now() });
  }
  
  const { state, createRental, updateRental, deleteRental, getEnhancedFilteredVehicles } = useApp();
  const permissions = usePermissions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // 768px breakpoint
  const mobileStyles = getMobileStyles(theme);

  // 🔍 DEBUG: Základné informácie o komponente
  console.log('🚀 RentalListNew LOADED:', {
    isMobile,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
    breakpoint: theme.breakpoints.values.md
  });

  // State management
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  // const [selected, setSelected] = useState<string[]>([]); // Nepoužívané - odstránené
  const [protocols, setProtocols] = useState<Record<string, { handover?: any; return?: any }>>({});
  const [loadingProtocols, setLoadingProtocols] = useState<string[]>([]);
  const [, setImportError] = useState<string>('');
  // 🚀 EXTRACTED: fileInputRef moved to RentalActions component
  
  // Protocol dialog states
  const [openHandoverDialog, setOpenHandoverDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedRentalForProtocol, setSelectedRentalForProtocol] = useState<Rental | null>(null);
  const [openProtocolMenu, setOpenProtocolMenu] = useState(false);
  const [selectedProtocolType, setSelectedProtocolType] = useState<'handover' | 'return' | null>(null);
  
  // 🚀 GMAIL APPROACH: Replace state.rentals with paginated loading
  const {
    rentals: paginatedRentals,
    loading: paginatedLoading,
    hasMore,
    error: paginatedError,
    searchTerm: paginatedSearchTerm,
    setSearchTerm: setPaginatedSearchTerm,
    currentPage,
    loadMore,
    updateRentalInList,
    handleOptimisticDelete,
    updateFilters
  } = useInfiniteRentals();
  
      // Create separate refs for mobile and desktop scroll containers
    const mobileScrollRef = useRef<HTMLDivElement>(null);
    const desktopScrollRef = useRef<HTMLDivElement>(null);
    
    // 🎯 SCROLL PRESERVATION: Uloženie pozície pred editáciou
    const savedScrollPosition = useRef<number>(0);
    const virtualScrollPosition = useRef<number>(0);
    
    // 🎯 INFINITE SCROLL PRESERVATION: Uloženie pozície pred načítaním nových dát
    const infiniteScrollPosition = useRef<number>(0);
    const isLoadingMore = useRef<boolean>(false);
    
      // 🎯 OPTIMIZED SCROLL SETTINGS
  const SCROLL_THRESHOLD = 0.75; // 75% scroll triggers infinite loading
  const DEBOUNCE_DELAY = 150; // Reduced from 200ms for better responsiveness
  const THROTTLE_DELAY = 100; // Additional throttling for performance
  
  // 🎨 FAREBNÉ INDIKÁTORY - elegantné bodky namiesto pozadia
  const getStatusIndicator = useCallback((rental: Rental) => {
    const today = new Date();
    const endDate = new Date(rental.endDate);
    const startDate = new Date(rental.startDate);
    
    // 🔴 Červená: Preterminované (skončili a nemajú return protokol)
    if (endDate < today && !protocols[rental.id]?.return) {
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
  }, [protocols]);
    
    // 🎯 UNIFIED SCROLL HANDLER: Single handler for both desktop and mobile
    const scrollHandlerRef = useRef<((event: any) => void) | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastScrollTimeRef = useRef<number>(0);
    
    // 🎯 INFINITE SCROLL PRESERVATION: Wrapper pre loadMore s uložením pozície
    const handleLoadMore = useCallback(() => {
      // Uložiť aktuálnu scroll pozíciu pred načítaním
      if (isMobile && mobileScrollRef.current) {
        const virtualList = mobileScrollRef.current.querySelector('[data-testid="FixedSizeList"]');
        const reactWindowList = mobileScrollRef.current.querySelector('.ReactVirtualized__List');
        
        if (virtualList) {
          infiniteScrollPosition.current = virtualList.scrollTop || 0;
          console.log('📱 Saved infinite scroll position (mobile):', infiniteScrollPosition.current);
        } else if (reactWindowList) {
          infiniteScrollPosition.current = reactWindowList.scrollTop || 0;
          console.log('📱 Saved infinite scroll position (ReactWindow):', infiniteScrollPosition.current);
        }
      } else if (!isMobile && desktopScrollRef.current) {
        infiniteScrollPosition.current = desktopScrollRef.current.scrollTop;
        console.log('💻 Saved infinite scroll position (desktop):', infiniteScrollPosition.current);
      }
      
      isLoadingMore.current = true;
      loadMore();
    }, [isMobile, loadMore]);
    
    // Create unified scroll handler
    const createScrollHandler = useCallback(() => {
      return (event: any) => {
        // Early return if loading or no more data
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
              console.log(`💻 Native scroll: ${Math.round(scrollPercentage * 100)}%`);
            }
          }
          
          // Trigger infinite loading at threshold
          if (scrollPercentage >= SCROLL_THRESHOLD) {
            handleLoadMore();
          }
        }, DEBOUNCE_DELAY);
      };
    }, [paginatedLoading, hasMore, paginatedRentals.length, handleLoadMore]);
    
    // Setup scroll handlers
    useEffect(() => {
      // Always create fresh scroll handler with current values
      scrollHandlerRef.current = createScrollHandler();
      
      const mobileContainer = mobileScrollRef.current;
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
  
  // ⚡ BACKGROUND PROTOCOL LOADING STATE
  const [protocolStatusMap, setProtocolStatusMap] = useState<Record<string, {
    hasHandoverProtocol: boolean;
    hasReturnProtocol: boolean;
    handoverProtocolId?: string;
    returnProtocolId?: string;
  }>>({});
  const [isLoadingProtocolStatus, setIsLoadingProtocolStatus] = useState(false);
  const [protocolStatusLoaded, setProtocolStatusLoaded] = useState(false);
  
  // ⚡ OPTIMIZED: Real-time updates hook with debouncing
  const debouncedRefresh = useCallback(() => {
    // ⚡ PERFORMANCE: Debounce multiple rapid updates
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new Event('rental-list-refresh'));
    }, 100); // 100ms debounce
    
    return () => clearTimeout(timeoutId);
  }, []);

  useRentalUpdates(useCallback((type: string, rental?: Rental, rentalId?: string) => {
    logger.debug('WebSocket rental update', { type, rentalId, timestamp: Date.now() });
    
    // ⚡ SMART UPDATE: Aktualizuj konkrétny rental namiesto full refresh
    if (type === 'updated' && rental) {
      logger.performance('Smart rental update in list', { rentalId: rental.id });
      updateRentalInList(rental);
    } else if (type === 'created' && rental) {
      logger.performance('Smart rental create in list', { rentalId: rental.id });
      // Pre WebSocket create events, trigger refresh pre správne dáta zo servera
      debouncedRefresh();
    } else if (type === 'deleted' && rentalId) {
      logger.performance('Optimistic delete triggered', { reason: type, rentalId });
      handleOptimisticDelete(rentalId);
    }
  }, [debouncedRefresh, updateRentalInList, handleOptimisticDelete]));

  // 🔴 NEW: Protocol updates hook pre okamžité protocol zmeny
  useProtocolUpdates(useCallback((type: string, data: any) => {
    logger.debug('WebSocket protocol update', { type, protocolType: data.protocolType, rentalId: data.rentalId });
    
    // ⚡ PERFORMANCE: Okamžitá aktualizácia protokol statusu
    if (type === 'created') {
      logger.performance('Protocol created - refreshing rental list', { 
        protocolType: data.protocolType, 
        rentalId: data.rentalId 
      });
      
      // 🔴 OPTIMIZED: Len optimistic UI update - žiadny refresh potrebný
      setProtocolStatusMap(prev => ({
        ...prev,
        [data.rentalId]: {
          ...prev[data.rentalId],
          hasHandoverProtocol: data.protocolType === 'handover' ? true : (prev[data.rentalId]?.hasHandoverProtocol || false),
          hasReturnProtocol: data.protocolType === 'return' ? true : (prev[data.rentalId]?.hasReturnProtocol || false),
          handoverProtocolId: data.protocolType === 'handover' ? data.protocolId : prev[data.rentalId]?.handoverProtocolId,
          returnProtocolId: data.protocolType === 'return' ? data.protocolId : prev[data.rentalId]?.returnProtocolId,
        }
      }));
      
      // Protocol sa zobrazí okamžite bez refresh vďaka optimistic update
    }
  }, [debouncedRefresh]));

  // ⚡ OPTIMIZED: Memoized vehicle lookup map for performance (vrátane vyradených vozidiel)
  const vehicleLookupMap = useMemo(() => {
    const map = new Map();
    // Použiť všetky vozidlá vrátane vyradených pre historické prenájmy
    const allVehicles = getEnhancedFilteredVehicles({ includeRemoved: true, includeAll: true });
    allVehicles.forEach((vehicle: any) => {
      map.set(vehicle.id, vehicle);
    });
    return map;
  }, [state.vehicles]);

  // ⚡ OPTIMIZED: Helper function using lookup map
  const getVehicleByRental = useCallback((rental: Rental) => {
    return rental.vehicleId ? vehicleLookupMap.get(rental.vehicleId) || null : null;
  }, [vehicleLookupMap]);
  
  // 🎯 SNAPSHOT LOGIC: Už nepotrebujeme getVehicleOwnerAtDate - všetko je v rental.vehicleCompanySnapshot!
  
  // Search and filter state - LIVE SEARCH s debouncing
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 🚀 GMAIL APPROACH: Connect search with infinite rentals
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update infinite rentals search when debounced search changes
  useEffect(() => {
    setPaginatedSearchTerm(debouncedSearchQuery);
  }, [debouncedSearchQuery, setPaginatedSearchTerm]);



  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState({
    // Základné filtre - arrays pre multi-select
    status: [] as string[],
    paymentMethod: [] as string[],
    company: [] as string[],
    dateFrom: '',
    dateTo: '',
    priceMin: '',
    priceMax: '',
    protocolStatus: [] as string[],
    
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
    showOnlyCompleted: false
  });
  

  
  // Column visibility - nepoužívané, odstránené
  // const [visibleColumns, setVisibleColumns] = useState({
  //   vehicle: true,
  //   company: true,
  //   customer: true,
  //   dates: true,
  //   price: true,
  //   commission: true,
  //   payment: true,
  //   paid: true,
  //   status: true,
  //   protocols: true
  // });
  

  
  // PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string; type: 'handover' | 'return' } | null>(null);
  
  // Image gallery - using useRef to survive re-renders
  const galleryOpenRef = useRef(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<any[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  // const [, forceUpdate] = useState({}); // Nepoužívané - odstránené
  


  // 💾 IMAGE PARSING CACHE - cache pre parsed images aby sa neparovali zakaždým
  const [imageParsingCache] = useState(new Map<string, {
    images: any[];
    videos: any[];
    timestamp: number;
  }>());

  // Debug wrapper for setGalleryOpen
  const setGalleryOpen = (value: boolean) => {
    logger.debug('Gallery state change', { value, timestamp: Date.now() });
    galleryOpenRef.current = value;
    // forceUpdate({}); // Force re-render to update UI - odstránené
  };
  
  const galleryOpen = galleryOpenRef.current;

  // Optimalizovaná funkcia pre načítanie protokolov na požiadanie
  const loadProtocolsForRental = useCallback(async (rentalId: string) => {
    // Ak už sa načítavajú protokoly pre tento rental, počkaj
    if (loadingProtocols.includes(rentalId)) {
      return null;
    }
    
    logger.api('Loading protocols for rental', { rentalId });
    setLoadingProtocols(prev => [...prev, rentalId]);
    
    try {
      const data = await apiService.getProtocolsByRental(rentalId);
      
      // ✅ NAJNOVŠÍ PROTOKOL: Zoradiť podľa createdAt a vziať najnovší
      const latestHandover = data?.handoverProtocols?.length > 0 
        ? data.handoverProtocols.sort((a: any, b: any) => 
            new Date(b.createdAt || b.completedAt || 0).getTime() - 
            new Date(a.createdAt || a.completedAt || 0).getTime()
          )[0] 
        : undefined;
        
      const latestReturn = data?.returnProtocols?.length > 0 
        ? data.returnProtocols.sort((a: any, b: any) => 
            new Date(b.createdAt || b.completedAt || 0).getTime() - 
            new Date(a.createdAt || a.completedAt || 0).getTime()
          )[0] 
        : undefined;
      
      logger.api('Protocols API response', { 
        hasData: !!data, 
        handoverCount: data?.handoverProtocols?.length || 0,
        returnCount: data?.returnProtocols?.length || 0,
        rentalId 
      });
      
      const protocolData = {
        handover: latestHandover,
        return: latestReturn,
      };
      
      setProtocols(prev => ({
        ...prev,
        [rentalId]: protocolData
      }));
      
      // ⚡ RETURN načítané dáta pre okamžité použitie
      return protocolData;
    } catch (error) {
      logger.error('Failed to load protocols', { rentalId, error });
      return null;
    } finally {
      setLoadingProtocols(prev => prev.filter(id => id !== rentalId));
    }
  }, [loadingProtocols]);

  // Funkcia pre zobrazenie protokolov na požiadanie
  const handleViewProtocols = async (rental: Rental) => {
    logger.debug('Checking protocols for rental', {
      rentalId: rental.id,
      hasProtocols: !!protocols[rental.id],
      protocolCount: Object.keys(protocols).length
    });
    
    // Ak už sú protokoly načítané, nechaj ich zobrazené
    if (protocols[rental.id]) {
      logger.cache('Protocols already loaded, using cache');
      return;
    }
    
    logger.api('Loading protocols for rental', { rentalId: rental.id });
    await loadProtocolsForRental(rental.id);
    // Note: loadProtocolsForRental už updatuje protocols state, takže netreba žiadnu dodatočnú logiku
  };

  // Funkcia pre skrytie protokolov
  const handleHideProtocols = (rentalId: string) => {
    setProtocols(prev => {
      const newProtocols = { ...prev };
      delete newProtocols[rentalId];
      return newProtocols;
    });
  };





  // CSV Export/Import functions
  // 🚀 EXTRACTED: Export function moved to RentalActions component

  // 🚀 EXTRACTED: Import function moved to RentalActions component

  const handleAdd = useCallback(() => {
    setEditingRental(null);
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((rental: Rental) => {
    console.log('🔍 HANDLE EDIT DEBUG:', {
      rentalId: rental.id,
      totalPrice: rental.totalPrice,
      extraKmCharge: rental.extraKmCharge,
      commission: rental.commission,
      customerName: rental.customerName,
      isMobile: isMobile,
      screenWidth: window.innerWidth,
      mobileScrollRefExists: !!mobileScrollRef.current,
      desktopScrollRefExists: !!desktopScrollRef.current
    });
    
    // 🎯 SCROLL PRESERVATION: Uložiť aktuálnu pozíciu pred otvorením dialógu
    if (isMobile && mobileScrollRef.current) {
      // Pre mobile virtual scroll - uložiť offset z React Window
      const virtualList = mobileScrollRef.current.querySelector('[data-testid="FixedSizeList"]');
      const reactWindowList = mobileScrollRef.current.querySelector('.ReactVirtualized__List');
      
      console.log('📱 MOBILE SCROLL DEBUG:', {
        virtualListExists: !!virtualList,
        reactWindowListExists: !!reactWindowList,
        virtualListScrollTop: virtualList?.scrollTop,
        reactWindowListScrollTop: reactWindowList?.scrollTop
      });
      
      if (virtualList) {
        virtualScrollPosition.current = virtualList.scrollTop || 0;
        console.log('📱 Saved mobile scroll position (FixedSizeList):', virtualScrollPosition.current);
      } else if (reactWindowList) {
        virtualScrollPosition.current = reactWindowList.scrollTop || 0;
        console.log('📱 Saved mobile scroll position (ReactVirtualized):', virtualScrollPosition.current);
      }
    } else if (!isMobile && desktopScrollRef.current) {
      // Pre desktop native scroll
      savedScrollPosition.current = desktopScrollRef.current.scrollTop;
      console.log('💻 DESKTOP SCROLL DEBUG:', {
        scrollTop: desktopScrollRef.current.scrollTop,
        scrollHeight: desktopScrollRef.current.scrollHeight,
        clientHeight: desktopScrollRef.current.clientHeight
      });
      console.log('💻 Saved desktop scroll position:', savedScrollPosition.current);
    }
    
    setEditingRental(rental);
    setOpenDialog(true);
  }, [isMobile]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento prenájom?')) {
      try {
        await deleteRental(id);
        console.log('Prenájom úspešne vymazaný');
      } catch (error) {
        console.error('Chyba pri mazaní prenájmu:', error);
        // 🔴 REMOVED: Alert notification
      }
    }
  }, [deleteRental]);

  // Protocol handlers
  const handleViewRental = useCallback((rental: Rental) => {
    console.log('👁️ Viewing rental:', rental.id);
    handleEdit(rental);
  }, []);



  // 🎯 SCROLL PRESERVATION: Funkcia na obnovenie scroll pozície
  const restoreScrollPosition = useCallback(() => {
    // Malé oneskorenie aby sa DOM stihol aktualizovať
    setTimeout(() => {
      if (isMobile && mobileScrollRef.current) {
        // Pre mobile virtual scroll - obnoviť pozíciu cez React Window
        const virtualList = mobileScrollRef.current.querySelector('[data-testid="FixedSizeList"]');
        if (virtualList && virtualScrollPosition.current > 0) {
          virtualList.scrollTop = virtualScrollPosition.current;
          console.log('📱 Restored mobile scroll position:', virtualScrollPosition.current);
        }
        
        // Alternatívne riešenie pre React Window - scrollToItem
        const reactWindowList = mobileScrollRef.current.querySelector('.ReactVirtualized__List');
        if (reactWindowList && virtualScrollPosition.current > 0) {
          reactWindowList.scrollTop = virtualScrollPosition.current;
          console.log('📱 Restored React Window scroll position:', virtualScrollPosition.current);
        }
      } else if (!isMobile && desktopScrollRef.current && savedScrollPosition.current > 0) {
        // Pre desktop native scroll
        desktopScrollRef.current.scrollTop = savedScrollPosition.current;
        console.log('💻 Restored desktop scroll position:', savedScrollPosition.current);
      }
    }, 150); // Trochu dlhšie oneskorenie pre React Window
  }, [isMobile]);

  const handleSave = async (rental: Rental) => {
    try {
      if (editingRental) {
        await updateRental(rental);
        // 🔴 REMOVED: Success notification
      } else {
        await createRental(rental);
        // 🔴 REMOVED: Success notification
      }
      setOpenDialog(false);
      setEditingRental(null);
      
      // 🎯 SCROLL PRESERVATION: Obnoviť pozíciu po zatvorení dialógu
      restoreScrollPosition();
    } catch (error) {
      console.error('Chyba pri ukladaní prenájmu:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
      alert(`Chyba pri ukladaní prenájmu: ${errorMessage}`);
    }
  };



  // 🎯 SCROLL PRESERVATION: Funkcia pre zrušenie s obnovením pozície
  const handleCancel = useCallback(() => {
    setOpenDialog(false);
    setEditingRental(null);
    
    // 🎯 SCROLL PRESERVATION: Obnoviť pozíciu po zatvorení dialógu
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  // 🎯 INFINITE SCROLL PRESERVATION: Obnoviť pozíciu po načítaní nových dát
  const restoreInfiniteScrollPosition = useCallback(() => {
    if (!isLoadingMore.current || infiniteScrollPosition.current === 0) {
      return;
    }
    
    // Malé oneskorenie aby sa DOM stihol aktualizovať s novými dátami
    setTimeout(() => {
      if (isMobile && mobileScrollRef.current) {
        const virtualList = mobileScrollRef.current.querySelector('[data-testid="FixedSizeList"]');
        const reactWindowList = mobileScrollRef.current.querySelector('.ReactVirtualized__List');
        
        if (virtualList && infiniteScrollPosition.current > 0) {
          virtualList.scrollTop = infiniteScrollPosition.current;
          console.log('📱 Restored infinite scroll position (mobile):', infiniteScrollPosition.current);
        } else if (reactWindowList && infiniteScrollPosition.current > 0) {
          reactWindowList.scrollTop = infiniteScrollPosition.current;
          console.log('📱 Restored infinite scroll position (ReactWindow):', infiniteScrollPosition.current);
        }
      } else if (!isMobile && desktopScrollRef.current && infiniteScrollPosition.current > 0) {
        desktopScrollRef.current.scrollTop = infiniteScrollPosition.current;
        console.log('💻 Restored infinite scroll position (desktop):', infiniteScrollPosition.current);
      }
      
      isLoadingMore.current = false;
      infiniteScrollPosition.current = 0;
    }, 200); // Dlhšie oneskorenie pre načítanie nových dát
  }, [isMobile]);

  // 🎯 INFINITE SCROLL PRESERVATION: Obnoviť pozíciu po načítaní nových dát
  useEffect(() => {
    if (isLoadingMore.current && !paginatedLoading) {
      // Dáta sa načítali, obnoviť scroll pozíciu
      restoreInfiniteScrollPosition();
    }
  }, [paginatedRentals.length, paginatedLoading, restoreInfiniteScrollPosition]);

  // Monitor state changes - optimalized mobile debug logging
  React.useEffect(() => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 MOBILE DEBUG: openHandoverDialog state changed:', openHandoverDialog);
      if (!openHandoverDialog) {
        console.log('❌ MOBILE DEBUG: Handover Modal was closed! Investigating...');
        console.log('❌ MOBILE DEBUG: selectedRentalForProtocol:', selectedRentalForProtocol?.id);
        console.log('❌ MOBILE DEBUG: Current URL:', window.location.href);
      }
    }
  }, [openHandoverDialog, selectedRentalForProtocol]);

  // Monitor return dialog state changes
  React.useEffect(() => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 RETURN DEBUG: openReturnDialog state changed:', openReturnDialog);
      if (!openReturnDialog) {
        console.log('❌ RETURN DEBUG: Return Modal was closed! Investigating...');
        console.log('❌ RETURN DEBUG: selectedRentalForProtocol:', selectedRentalForProtocol?.id);
        console.log('❌ RETURN DEBUG: protocols loaded:', selectedRentalForProtocol ? !!protocols[selectedRentalForProtocol.id] : 'no rental selected');
        console.log('❌ RETURN DEBUG: handover protocol:', selectedRentalForProtocol ? protocols[selectedRentalForProtocol.id]?.handover?.id : 'no rental selected');
      } else {
        console.log('✅ RETURN DEBUG: Return Modal opened!');
        console.log('✅ RETURN DEBUG: selectedRentalForProtocol:', selectedRentalForProtocol?.id);
        console.log('✅ RETURN DEBUG: protocols loaded:', selectedRentalForProtocol ? !!protocols[selectedRentalForProtocol.id] : 'no rental selected');
        console.log('✅ RETURN DEBUG: handover protocol:', selectedRentalForProtocol ? protocols[selectedRentalForProtocol.id]?.handover?.id : 'no rental selected');
      }
    }
  }, [openReturnDialog, selectedRentalForProtocol, protocols]);

  // Handover Protocol handlers
  const handleCreateHandover = useCallback(async (rental: Rental) => {
    console.log('📝 Creating handover protocol for rental:', rental.id);
    // Optimalized: Mobile debug logs only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 MOBILE DEBUG: handleCreateHandover called');
      console.log('🔍 MOBILE DEBUG: rental object:', rental);
      console.log('🔍 MOBILE DEBUG: timestamp:', new Date().toISOString());
    }
    
    // logMobile('INFO', 'RentalList', 'Handover protocol creation started', {
    //   rentalId: rental.id,
    //   timestamp: Date.now(),
    //   url: window.location.href
    // });
    
    try {
      // ⚡ OPTIMALIZÁCIA: Použiť cached protocol status namiesto API volania
      const backgroundStatus = protocolStatusMap[rental.id];
      const fallbackProtocols = protocols[rental.id];
      
      // Kontrola či už existuje handover protokol (rovnaká logika ako v UI)
      const hasHandover = backgroundStatus 
        ? backgroundStatus.hasHandoverProtocol 
        : !!fallbackProtocols?.handover;
      
      if (hasHandover) {
        console.log('⚡ CACHED: Handover protocol already exists for rental:', rental.id);
        alert('⚠️ UPOZORNENIE: Pre toto vozidlo už existuje odovzdávací protokol!\n\nNemôžete vytvoriť ďalší odovzdávací protokol pre to isté vozidlo. Ak potrebujete upraviť protokol, kontaktujte administrátora.');
        return;
      }
      
      console.log('⚡ CACHED: No existing handover protocol, proceeding instantly...');
      console.log('🔍 MOBILE DEBUG: About to open modal');
      console.log('🔍 MOBILE DEBUG: setSelectedRentalForProtocol:', rental.id);
      console.log('🔍 MOBILE DEBUG: setOpenHandoverDialog(true)');
      
      // logMobile('INFO', 'RentalList', 'Opening handover modal', {
      //   rentalId: rental.id,
      //   timestamp: Date.now(),
      //   modalState: 'opening'
      // });
      
      setSelectedRentalForProtocol(rental);
      setOpenHandoverDialog(true);
      
      console.log('🔍 MOBILE DEBUG: Modal state set - should be open now');
      
      // logMobile('INFO', 'RentalList', 'Handover modal state set', {
      //   rentalId: rental.id,
      //   timestamp: Date.now(),
      //   openHandoverDialog: true,
      //   selectedRentalForProtocol: rental.id
      // });
      
    } catch (error) {
      console.error('❌ Error checking cached protocols:', error);
      
      // 🔄 FALLBACK: Ak cache zlyhá, použij starý spôsob
      console.log('🔄 Falling back to API call...');
      try {
        const protocolsData = await apiService.getProtocolsByRental(rental.id);
        console.log('📝 Fresh protocols data (fallback):', protocolsData);
        
        if (protocolsData.handoverProtocols && protocolsData.handoverProtocols.length > 0) {
          alert('⚠️ UPOZORNENIE: Pre toto vozidlo už existuje odovzdávací protokol!\n\nNemôžete vytvoriť ďalší odovzdávací protokol pre to isté vozidlo. Ak potrebujete upraviť protokol, kontaktujte administrátora.');
          console.warn('❌ Handover protocol already exists for rental:', rental.id);
          return;
        }
        
        console.log('✅ No existing handover protocol (fallback), proceeding...');
        setSelectedRentalForProtocol(rental);
        setOpenHandoverDialog(true);
      } catch (fallbackError) {
        console.error('❌ Fallback API call also failed:', fallbackError);
        // 🔴 REMOVED: alert('Chyba pri kontrole existujúcich protokolov. Skúste to znovu.');
      }
    }
  }, [protocolStatusMap, protocols]);

  const handleSaveHandover = async (protocolData: any) => {
    try {
      // Debug log
      console.log('handleSaveHandover - protocolData:', protocolData);
      const data = await apiService.createHandoverProtocol(protocolData);
      console.log('Handover protocol created:', data);
      
      // 🔴 REMOVED: Redundant protocol loading - WebSocket už triggeruje refresh

      // ✅ OPTIMISTIC UPDATE BULK-STATUS
      setProtocolStatusMap(prev => ({
        ...prev,
        [protocolData.rentalId]: {
          hasHandoverProtocol: true,
          hasReturnProtocol: prev[protocolData.rentalId]?.hasReturnProtocol || false,
        }
      }));

      // 🔴 REMOVED: Redundant bulk status refresh - WebSocket updates sú dostačujúce
      
      // 🔴 REMOVED: Alert notification that was causing UI issues
      setOpenHandoverDialog(false);
      setSelectedRentalForProtocol(null);
    } catch (error) {
      console.error('Chyba pri ukladaní handover protokolu:', error);
      // 🔴 REMOVED: alert('Chyba pri ukladaní protokolu. Skúste to znovu.');
    }
  };

  // Return Protocol handlers
  const handleCreateReturn = useCallback(async (rental: Rental) => {
    console.log('📝 Creating return protocol for rental:', rental.id);
    
    try {
      // ⚡ OPTIMALIZÁCIA: Použiť cached protocol status namiesto API volania
      const backgroundStatus = protocolStatusMap[rental.id];
      const fallbackProtocols = protocols[rental.id];
      
      // Kontrola či existuje handover protokol (rovnaká logika ako v UI)
      const hasHandover = backgroundStatus 
        ? backgroundStatus.hasHandoverProtocol 
        : !!fallbackProtocols?.handover;
        
      // Kontrola či už existuje return protokol
      const hasReturn = backgroundStatus 
        ? backgroundStatus.hasReturnProtocol 
        : !!fallbackProtocols?.return;
      
      if (!hasHandover) {
        console.log('⚡ CACHED: No handover protocol found for rental:', rental.id);
        alert('⚠️ UPOZORNENIE: Najprv musíte vytvoriť odovzdávací protokol!\n\nPreberací protokol nemožno vytvoriť bez existujúceho odovzdávacieho protokolu.');
        return;
      }
      
      if (hasReturn) {
        console.log('⚡ CACHED: Return protocol already exists for rental:', rental.id);
        alert('⚠️ UPOZORNENIE: Pre toto vozidlo už existuje preberací protokol!\n\nNemôžete vytvoriť ďalší preberací protokol pre to isté vozidlo. Ak potrebujete upraviť protokol, kontaktujte administrátora.');
        return;
      }
      
      console.log('⚡ CACHED: Handover protocol found, no return protocol exists. Loading handover protocol...');
      
      // ⚡ NAČÍTAJ HANDOVER PROTOKOL PRED OTVORENÍM RETURN DIALOGU
      const protocolData = await loadProtocolsForRental(rental.id);
      
      console.log('🔄 RETURN DEBUG: Protocol data returned from loadProtocolsForRental:', protocolData);
      
      if (!protocolData || !protocolData.handover) {
        console.error('❌ RETURN DEBUG: No handover protocol data returned!');
        // 🔴 REMOVED: alert('Chyba pri načítaní odovzdávacieho protokolu. Skúste to znovu.');
        return;
      }
      
      console.log('🔄 RETURN DEBUG: Setting selectedRentalForProtocol to:', rental.id);
      setSelectedRentalForProtocol(rental);
      
      console.log('🔄 RETURN DEBUG: Setting openReturnDialog to true');
      setOpenReturnDialog(true);
      
      console.log('🔄 RETURN DEBUG: Handover protocol available:', protocolData.handover.id);
      
    } catch (error) {
      console.error('❌ Error checking cached protocols:', error);
      
      // 🔄 FALLBACK: Ak cache zlyhá, použij starý spôsob
      console.log('🔄 Falling back to API call...');
      try {
        const protocolsData = await apiService.getProtocolsByRental(rental.id);
        console.log('📝 Fresh protocols data (fallback):', protocolsData);
        
        if (!protocolsData.handoverProtocols || protocolsData.handoverProtocols.length === 0) {
          alert('⚠️ UPOZORNENIE: Najprv musíte vytvoriť odovzdávací protokol!\n\nPreberací protokol nemožno vytvoriť bez existujúceho odovzdávacieho protokolu.');
          console.error('❌ No handover protocol found for rental:', rental.id);
          return;
        }
        
        if (protocolsData.returnProtocols && protocolsData.returnProtocols.length > 0) {
          alert('⚠️ UPOZORNENIE: Pre toto vozidlo už existuje preberací protokol!\n\nNemôžete vytvoriť ďalší preberací protokol pre to isté vozidlo. Ak potrebujete upraviť protokol, kontaktujte administrátora.');
          console.warn('❌ Return protocol already exists for rental:', rental.id);
          return;
        }
        
        console.log('✅ Handover protocol found, no return protocol exists (fallback). Loading protocols...');
        
        // ⚡ NAČÍTAJ PROTOKOLY PRED OTVORENÍM RETURN DIALOGU
        const protocolData = await loadProtocolsForRental(rental.id);
        
        console.log('🔄 RETURN DEBUG (fallback): Protocol data returned:', protocolData);
        
        if (!protocolData || !protocolData.handover) {
          console.error('❌ RETURN DEBUG (fallback): No handover protocol data returned!');
          // 🔴 REMOVED: alert('Chyba pri načítaní odovzdávacieho protokolu. Skúste to znovu.');
          return;
        }
        
        console.log('🔄 RETURN DEBUG (fallback): Setting selectedRentalForProtocol to:', rental.id);
        setSelectedRentalForProtocol(rental);
        
        console.log('🔄 RETURN DEBUG (fallback): Setting openReturnDialog to true');
        setOpenReturnDialog(true);
        
        console.log('🔄 RETURN DEBUG (fallback): Handover protocol available:', protocolData.handover.id);
      } catch (fallbackError) {
        console.error('❌ Fallback API call also failed:', fallbackError);
        // 🔴 REMOVED: alert('Chyba pri kontrole existujúcich protokolov. Skúste to znovu.');
      }
    }
  }, [protocolStatusMap, protocols, loadProtocolsForRental]);

    const handleSaveReturn = async (protocolData: any) => {
    try {
      // ✅ OPRAVENÉ: Protokol je už uložený v ReturnProtocolForm, iba aktualizujeme UI
      console.log('Return protocol already saved, updating UI:', protocolData);
      
      // 🔴 REMOVED: Redundant protocol loading - WebSocket už triggeruje refresh
      
      // 🔴 REMOVED: Alert notification that was causing UI issues
      setOpenReturnDialog(false);
      setSelectedRentalForProtocol(null);
    } catch (error) {
      console.error('Chyba pri aktualizácii UI po uložení return protokolu:', error);
      alert('Protokol bol uložený, ale UI sa nepodarilo aktualizovať. Obnovte stránku.');
    }
  };

  const handleViewPDF = (protocolId: string, type: 'handover' | 'return', title: string) => {
    setSelectedPdf({ url: protocolId, title, type });
    setPdfViewerOpen(true);
  };

  const handleClosePDF = () => {
    setPdfViewerOpen(false);
    setSelectedPdf(null);
  };

  // Image gallery handlers - OPTIMALIZED IMPLEMENTATION
  const handleOpenGallery = async (rental: Rental, protocolType: 'handover' | 'return') => {
    try {
      console.log('🔍 Opening gallery for protocol:', protocolType, 'rental:', rental.id);
      
      // Close protocol menu FIRST to prevent Dialog interference
      console.log('📋 Closing protocol menu before opening gallery...');
      handleCloseProtocolMenu();
      
      // ⚡ FIX: Získaj protokol priamo z API alebo cache
      let protocol = protocols[rental.id]?.[protocolType];
      
      if (!protocol) {
        console.log('📥 Loading protocol for gallery...');
        const startTime = Date.now();
        const freshProtocolData = await loadProtocolsForRental(rental.id);
        const loadTime = Date.now() - startTime;
        console.log(`⚡ Protocol loaded in ${loadTime}ms`);
        protocol = freshProtocolData?.[protocolType];
      }
      
      if (!protocol) {
        alert('Protokol nebol nájdený!');
        return;
      }

      // 🚀 CACHE CHECK: Skontroluj či už máme parsed images v cache
      const cacheKey = `${protocol.id}_${protocolType}`;
      const cachedData = imageParsingCache.get(cacheKey);
      const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity;
      
      let images: any[] = [];
      let videos: any[] = [];
      
      if (cachedData && cacheAge < 5 * 60 * 1000) { // 5min cache
        console.log('🎯 CACHE HIT: Using cached parsed images');
        images = cachedData.images;
        videos = cachedData.videos;
      } else {
        console.log('🔄 CACHE MISS: Parsing images from protocol data');
        const parseStart = Date.now();
        
        // ✅ PRIAMO Z DATABÁZY - žiadne brute-force
        // Parsovanie JSON stringov pre obrázky
        const parseImages = (imageData: any): any[] => {
          if (!imageData) return [];
          
          // Ak je to string, skús to parsovať ako JSON
          if (typeof imageData === 'string') {
            try {
              const parsed = JSON.parse(imageData);
              return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
              console.warn('⚠️ Failed to parse image data as JSON:', imageData);
              return [];
            }
          }
          
          // Ak je to už pole, vráť ho
          if (Array.isArray(imageData)) {
            return imageData;
          }
          
          return [];
        };

        images = [
          ...parseImages(protocol.vehicleImages),
          ...parseImages(protocol.documentImages),
          ...parseImages(protocol.damageImages)
        ];
        
        videos = [
          ...parseImages(protocol.vehicleVideos),
          ...parseImages(protocol.documentVideos),
          ...parseImages(protocol.damageVideos)
        ];
        
        // 💾 CACHE PARSED DATA
        imageParsingCache.set(cacheKey, {
          images,
          videos,
          timestamp: Date.now()
        });
        
        // 🖼️ PRELOAD IMAGES: Preload images do browser cache pre instant zobrazenie
        if (images.length > 0) {
          setTimeout(() => {
            images.forEach((img, index) => {
              if (img.url && typeof img.url === 'string') {
                // Pre base64 images preload nie je potrebný
                if (!img.url.startsWith('data:')) {
                  const preloadImg = new Image();
                  preloadImg.src = img.url;
                  console.log(`🎯 PRELOAD: Image ${index + 1}/${images.length} preloaded`);
                }
              }
            });
          }, 50); // Krátke delay aby sa main parsing stihol dokončiť
        }
        
        const parseTime = Date.now() - parseStart;
        console.log(`⚡ Images parsed and cached in ${parseTime}ms`);
      }

      console.log('🖼️ Gallery data prepared:', {
        imagesCount: images.length,
        videosCount: videos.length,
        cached: cachedData && cacheAge < 5 * 60 * 1000
      });

      if (images.length === 0 && videos.length === 0) {
        alert('Nenašli sa žiadne obrázky pre tento protokol!');
        return;
      }
      
      setGalleryImages(images);
      setGalleryVideos(videos);
      const vehicle = getVehicleByRental(rental);
      setGalleryTitle(`${protocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'} - ${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Neznáme vozidlo'}`);
      setGalleryOpen(true);
      
      console.log('✅ Gallery opened successfully with protocol data');
      
    } catch (error) {
      console.error('❌ Error opening gallery:', error);
      // 🔴 REMOVED: alert('Chyba pri otváraní galérie: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };




  const handleCloseGallery = () => {
    console.log('🖼️ Closing gallery');
    console.trace('🔍 Gallery close stack trace:');
    setGalleryOpen(false);
    setGalleryImages([]);
    setGalleryVideos([]);
    setGalleryTitle('');
  };

  // Protocol menu handlers
  const handleOpenProtocolMenu = async (rental: Rental, protocolType: 'handover' | 'return') => {
    console.log('🔄 Opening protocol menu for rental:', rental.id, 'type:', protocolType);
    
    setSelectedRentalForProtocol(rental);
    setSelectedProtocolType(protocolType);
    
    // ⚡ Najprv načítaj protokoly, POTOM otvor menu
    console.log('📋 Loading protocols before opening menu...');
    await handleViewProtocols(rental);
    
    // Menu sa otvorí až po načítaní protokolov
    console.log('✅ Protocols loaded, opening menu now');
    setOpenProtocolMenu(true);
  };

  const handleCloseProtocolMenu = () => {
    console.log('📋 Closing protocol menu, current state:', {
      openProtocolMenu,
      selectedRentalForProtocol: selectedRentalForProtocol?.id,
      selectedProtocolType,
      galleryOpen
    });
    
    console.log('📋 About to reset protocol menu state...');
    setOpenProtocolMenu(false);
    setSelectedRentalForProtocol(null);
    setSelectedProtocolType(null);
    console.log('📋 Protocol menu state reset completed');
  };

  const handleDownloadPDF = async () => {
    console.log('🔍 PDF DOWNLOAD: Starting...', {selectedRentalForProtocol, selectedProtocolType});
    console.log('🔍 PDF DOWNLOAD: All protocols:', protocols);
    console.log('🔍 PDF DOWNLOAD: Protocols for rental:', selectedRentalForProtocol?.id ? protocols[selectedRentalForProtocol.id] : 'No rental ID');
    
    if (selectedRentalForProtocol && selectedProtocolType) {
      const protocol = protocols[selectedRentalForProtocol.id]?.[selectedProtocolType];
      console.log('🔍 PDF DOWNLOAD: Protocol found:', protocol);
      
      if (protocol) {
        try {
          const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
          console.log('🔍 PDF DOWNLOAD: Token exists:', !!token, token ? `${token.substring(0, 20)}...` : 'null');
          
          let pdfUrl: string;
          
          if (protocol.pdfUrl) {
            // Ak má pdfUrl, otvor priamo
            console.log('✅ PDF DOWNLOAD: Using direct pdfUrl:', protocol.pdfUrl);
            pdfUrl = protocol.pdfUrl;
            window.open(pdfUrl, '_blank');
          } else {
            // Ak nemá pdfUrl, použij authenticated fetch pre generovanie PDF na požiadanie
            const apiBaseUrl = getBaseUrl();
                const proxyUrl = `${apiBaseUrl}/api/protocols/pdf/${protocol.id}`;
            console.log('⚡ PDF DOWNLOAD: Using proxy URL:', proxyUrl);
            
            const response = await fetch(proxyUrl, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('📡 PDF DOWNLOAD: Response status:', response.status, response.statusText);
            
            if (response.ok) {
              const blob = await response.blob();
              console.log('✅ PDF DOWNLOAD: Blob created, size:', blob.size);
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
              // Vyčisti URL po otvori
              setTimeout(() => URL.revokeObjectURL(url), 100);
              console.log('✅ PDF DOWNLOAD: Success!');
            } else {
              console.error('❌ Chyba pri načítaní PDF:', response.status, response.statusText);
              // 🔴 REMOVED: alert('Chyba pri otváraní PDF protokolu: ' + response.status);
            }
          }
        } catch (error) {
          console.error('❌ Chyba pri otváraní PDF:', error);
          // 🔴 REMOVED: alert('Chyba pri otváraní PDF protokolu: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
        }
      } else {
        console.error('❌ PDF DOWNLOAD: No protocol found for rental:', selectedRentalForProtocol.id, selectedProtocolType);
      }
    } else {
      console.error('❌ PDF DOWNLOAD: Missing rental or type:', {selectedRentalForProtocol, selectedProtocolType});
    }
    handleCloseProtocolMenu();
  };

  const handleViewGallery = () => {
    if (selectedRentalForProtocol && selectedProtocolType) {
      handleOpenGallery(selectedRentalForProtocol, selectedProtocolType);
    }
    // REMOVED: handleCloseProtocolMenu(); - now handled in handleOpenGallery
  };

  // New function to check all protocols for a rental
  const handleCheckProtocols = async (rental: Rental) => {
    console.log('🔍 Checking protocols for rental:', rental.id);
    
    // Load fresh protocol data directly from API
    console.log('📥 Loading fresh protocols from API...');
    let handoverProtocol: any = undefined;
    let returnProtocol: any = undefined;
    
    try {
      const data = await apiService.getProtocolsByRental(rental.id);
      console.log('🔍 Fresh API response:', data);
      
      // Get latest protocols
      handoverProtocol = data.handoverProtocols && data.handoverProtocols.length > 0 
        ? data.handoverProtocols.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : undefined;
      
      returnProtocol = data.returnProtocols && data.returnProtocols.length > 0
        ? data.returnProtocols.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] 
        : undefined;
        
      console.log('📋 Fresh handover:', handoverProtocol);
      console.log('📋 Fresh return:', returnProtocol);
      
      // Update protocols state with fresh data
      setProtocols(prev => ({
        ...prev,
        [rental.id]: {
          handover: handoverProtocol,
          return: returnProtocol,
        }
      }));
      
    } catch (error) {
      console.error('❌ Error loading protocols:', error);
      alert('❌ Chyba pri načítaní protokolov.');
      return;
    }
    
    const hasHandover = !!handoverProtocol;
    const hasReturn = !!returnProtocol;
    
    console.log('📋 Handover protocol:', hasHandover ? 'EXISTS' : 'NOT FOUND');
    console.log('📋 Return protocol:', hasReturn ? 'EXISTS' : 'NOT FOUND');
    
    // Silent protocol check - no actions, no alerts, just console logging
    // User can see protocol status in console if needed for debugging
  };

  const handleDeleteProtocol = async (rentalId: string, type: 'handover' | 'return') => {
    if (!window.confirm(`Naozaj chcete vymazať protokol ${type === 'handover' ? 'prevzatia' : 'vrátenia'}?`)) {
      return;
    }

    try {
      const protocol = protocols[rentalId]?.[type];
      if (!protocol?.id) {
        alert('Protokol sa nenašiel!');
        return;
      }

      // Vymazanie protokolu cez API
      await apiService.deleteProtocol(protocol.id, type);
      
      console.log(`Protokol ${type} pre prenájom ${rentalId} bol vymazaný`);
      
      // ✅ VYMAŽ LEN KONKRÉTNY TYP PROTOKOLU
      setProtocols(prev => ({
        ...prev,
        [rentalId]: {
          ...prev[rentalId],
          [type]: undefined
        }
      }));
      
      // 🔄 FORCE RELOAD protocols pre tento rental
      setLoadingProtocols(prev => prev.filter(id => id !== rentalId));
      await loadProtocolsForRental(rentalId);
    } catch (error) {
      console.error('Chyba pri mazaní protokolu:', error);
      // 🔴 REMOVED: alert('Chyba pri mazaní protokolu. Skúste to znovu.');
    }
  };

  // 📱 MOBILE CARD RENDERER - s action buttons
  const mobileCardRenderer = useCallback((rental: Rental, index: number) => {
    const vehicle = getVehicleByRental(rental);
    const hasHandover = !!protocols[rental.id]?.handover;
    const hasReturn = !!protocols[rental.id]?.return;
    const isLoadingProtocolStatus = loadingProtocols.includes(rental.id);

    return (
      <Card 
        key={rental.id}
        data-rental-item={`rental-${index}`} // 🎯 For item-based infinite scroll
        sx={{ 
          mb: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[2],
          '&:hover': { 
            boxShadow: theme.shadows[4],
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease'
          }
        }}
      >
        <CardContent>
          {/* Header with vehicle info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1.1rem' }}>
                {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Bez vozidla'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {vehicle?.licensePlate || 'Bez ŠPZ'} • {rental.customerName}
              </Typography>
            </Box>
            <Chip
              label={rental.status || 'Neznámy'}
              color={rental.status === 'active' ? 'success' : 'default'}
              size="small"
            />
          </Box>

          {/* Dates and price */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📅 {format(new Date(rental.startDate), 'dd.MM.yyyy')} - {format(new Date(rental.endDate), 'dd.MM.yyyy')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
              💰 {rental.totalPrice ? `€${rental.totalPrice}` : 'Nezadané'}
            </Typography>
          </Box>

          {/* Protocol status */}
          {(hasHandover || hasReturn) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Protokoly:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {hasHandover && (
                  <Chip label="✅ Prevzatie" size="small" color="success" />
                )}
                {hasReturn && (
                  <Chip label="✅ Vrátenie" size="small" color="success" />
                )}
              </Box>
            </Box>
          )}

          {/* ACTION BUTTONS - HLAVNÉ TLAČIDLÁ */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Can update="rentals">
              <Button
                size="small"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  console.log('🔥 EDIT BUTTON CLICKED:', rental.id);
                  handleEdit(rental); 
                }}
                sx={{ 
                  flex: 1,
                  minWidth: '100px',
                  bgcolor: theme.palette.primary.main,
                  '&:hover': { bgcolor: theme.palette.primary.dark }
                }}
              >
                Upraviť
              </Button>
            </Can>
            <Button
              size="small"
              variant="contained"
              startIcon={<HandoverIcon />}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (hasHandover) {
                  // handleOpenProtocolMenu(rental, 'handover');
                } else {
                  handleCreateHandover(rental);
                }
              }}
              sx={{ 
                flex: 1,
                minWidth: '120px',
                bgcolor: hasHandover ? theme.palette.success.main : theme.palette.warning.main,
                '&:hover': { bgcolor: hasHandover ? theme.palette.success.dark : theme.palette.warning.dark }
              }}
            >
              {hasHandover ? 'Zobraz prevzatie' : 'Prevzatie'}
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<ReturnIcon />}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (hasReturn) {
                  // handleOpenProtocolMenu(rental, 'return');
                } else {
                  handleCreateReturn(rental);
                }
              }}
              sx={{ 
                flex: 1,
                minWidth: '120px',
                bgcolor: hasReturn ? theme.palette.info.main : theme.palette.success.main,
                '&:hover': { bgcolor: hasReturn ? theme.palette.info.dark : theme.palette.success.dark }
              }}
            >
              {hasReturn ? 'Zobraz vrátenie' : 'Vrátenie'}
            </Button>
            <Can delete="rentals">
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={(e) => { e.stopPropagation(); handleDelete(rental.id); }}
                sx={{ minWidth: '80px' }}
              >
                Zmazať
              </Button>
            </Can>
          </Box>
        </CardContent>
      </Card>
    );
  }, [protocols, loadingProtocols, getVehicleByRental, theme, handleCreateHandover, handleCreateReturn, handleEdit, handleDelete]);

  // Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(() => {
    const rentals = paginatedRentals || [];
    const statuses = new Set(rentals.map(rental => rental.status).filter(Boolean));
    return Array.from(statuses).sort() as string[];
  }, [paginatedRentals]);

  const uniqueCompanies = useMemo(() => {
    const rentals = paginatedRentals || [];
    const companies = new Set(rentals.map(rental => {
      const vehicle = vehicleLookupMap.get(rental.vehicleId);
      return vehicle?.company;
    }).filter(Boolean));
    return Array.from(companies).sort() as string[];
  }, [paginatedRentals, vehicleLookupMap]);

  const uniquePaymentMethods = useMemo(() => {
    const rentals = paginatedRentals || [];
    const methods = new Set(rentals.map(rental => rental.paymentMethod).filter(Boolean));
    return Array.from(methods).sort() as string[];
  }, [paginatedRentals]);

  const uniqueVehicleBrands = useMemo(() => {
    const rentals = paginatedRentals || [];
    const brands = new Set(rentals.map(rental => {
      const vehicle = vehicleLookupMap.get(rental.vehicleId);
      return vehicle?.brand;
    }).filter(Boolean));
    return Array.from(brands).sort() as string[];
  }, [paginatedRentals, vehicleLookupMap]);

  const uniqueInsuranceCompanies = useMemo(() => {
    return [] as string[];
  }, []);

  const uniqueInsuranceTypes = useMemo(() => {
    return [] as string[];
  }, []);
  
  // 🎯 QUICK FILTER HANDLER - pre dashboard metriky
  const handleQuickFilter = useCallback((filterType: string) => {
    // Reset všetky filtre najprv - použijem správne typy pre updateFilters
    const baseFilters = {
      search: '',
      dateFilter: 'all',
      dateFrom: '',
      dateTo: '',
      company: 'all',
      status: 'all',
      protocolStatus: 'all',
      paymentMethod: 'all',
      paymentStatus: 'all',
      vehicleBrand: 'all',
      priceMin: '',
      priceMax: '',
    };

    let quickFilters = { ...baseFilters };

    // Aplikuj špecifický filter podľa typu
    switch (filterType) {
      case 'todayActivity':
        // Filtruj prenájmy ktoré sa dnes začínajú ALEBO končia
        quickFilters.dateFilter = 'today_activity';
        break;
        
      case 'tomorrowReturns':
        // Filtruj prenájmy ktoré sa zajtra končia
        quickFilters.dateFilter = 'tomorrow_returns';
        break;
        
      case 'weekActivity':
        // Filtruj prenájmy ktoré sa tento týždeň začínajú ALEBO končia
        quickFilters.dateFilter = 'week_activity';
        break;
        
      case 'overdue':
        // Filtruj preterminované prenájmy
        quickFilters.dateFilter = 'overdue';
        break;
        
      case 'newToday':
        // Filtruj prenájmy vytvorené dnes
        quickFilters.dateFilter = 'new_today';
        break;
        
      case 'startingToday':
        // Filtruj prenájmy ktoré dnes začínajú
        quickFilters.dateFilter = 'starting_today';
        break;
        
      case 'active':
        quickFilters.status = 'active';
        break;
        
      case 'unpaid':
        quickFilters.paymentStatus = 'unpaid';
        break;
        
      case 'pending':
        quickFilters.status = 'pending';
        break;
        
      case 'withHandover':
        quickFilters.protocolStatus = 'with_handover';
        break;
        
      case 'withoutReturn':
        quickFilters.protocolStatus = 'without_return';
        break;
        
      default:
        console.warn('Unknown quick filter type:', filterType);
        return;
    }

    // Aplikuj len server-side filtre cez updateFilters
    updateFilters(quickFilters);
    
    // Zobraz filtre aby používateľ videl čo sa aplikovalo
    setShowFilters(true);
    
    // 🐛 DEBUG: Zobraz v console čo sa posiela
    console.log('🎯 Quick filter applied:', { filterType, filters: quickFilters });
    logger.debug('Quick filter applied', { filterType, filters: quickFilters });
  }, [updateFilters]);
  
  // Reset all filters function
  const resetAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setPaginatedSearchTerm('');
    
    const resetFilters = {
      // Základné filtre - arrays pre multi-select
      status: [],
      paymentMethod: [],
      company: [],
      dateFrom: '',
      dateTo: '',
      priceMin: '',
      priceMax: '',
      protocolStatus: [],
      
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
      showOnlyCompleted: false
    };
    
    // 🚀 RESET NA SERVERI: Pošli reset aj na server
    handleAdvancedFiltersChange(resetFilters);
  };

  // Handle advanced filters change
  const handleAdvancedFiltersChange = (newFilters: FilterState) => {
    setAdvancedFilters(newFilters);
    
    // 🚀 PREPOJENIE: Pošli filtre na server cez useInfiniteRentals
    const serverFilters = {
      status: Array.isArray(newFilters.status) && newFilters.status.length > 0 
        ? newFilters.status[0] // Backend očakáva string, nie array
        : 'all',
      company: Array.isArray(newFilters.company) && newFilters.company.length > 0 
        ? newFilters.company[0] 
        : 'all',
      paymentMethod: Array.isArray(newFilters.paymentMethod) && newFilters.paymentMethod.length > 0 
        ? newFilters.paymentMethod[0] 
        : 'all',
      paymentStatus: newFilters.paymentStatus !== 'all' ? newFilters.paymentStatus : 'all',
      dateFrom: newFilters.dateFrom || '',
      dateTo: newFilters.dateTo || '',
      priceMin: newFilters.priceMin || '',
      priceMax: newFilters.priceMax || '',
      vehicleBrand: newFilters.vehicleBrand !== 'all' ? newFilters.vehicleBrand : 'all'
    };
    
    updateFilters(serverFilters);
  };

  // Multi-select helper functions
  const toggleFilterValue = (filterKey: keyof FilterState, value: string) => {
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
    
    // 🚀 AUTOMATICKÉ PREPOJENIE: Aktualizuj filtre na serveri
    handleAdvancedFiltersChange(newFilters);
  };

  const isFilterValueSelected = (filterKey: keyof FilterState, value: string): boolean => {
    const currentValues = advancedFilters[filterKey] as string[];
    return Array.isArray(currentValues) && currentValues.includes(value);
  };

  // Save filter preset
  const handleSaveFilterPreset = () => {
    // TODO: Implement preset saving
    logger.debug('Saving filter preset', { filters: advancedFilters });
  };
  
  // 🚀 OPTIMALIZÁCIA: Server-side filtering namiesto client-side
  const filteredRentals = useMemo(() => {
    // Server už vyfiltroval dáta cez useInfiniteRentals + getRentalsPaginated
    // Nepotrebujeme duplicitné client-side filtering!
    return paginatedRentals || [];
  }, [paginatedRentals]);
  
  // Get unique values for filters (already declared above)
  
  // 🚀 VIRTUALIZED RENTAL ROW for react-window
  const VirtualizedRentalRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rental = filteredRentals[index];
    if (!rental) return null;
    
    const vehicle = getVehicleByRental(rental);
    
    // ⚡ OPTIMALIZÁCIA: Použiť background loaded protocol status
    const backgroundStatus = protocolStatusMap[rental.id];
    const fallbackProtocols = protocols[rental.id];
    
    const hasHandover = backgroundStatus 
      ? backgroundStatus.hasHandoverProtocol 
      : !!fallbackProtocols?.handover;
    const hasReturn = backgroundStatus 
      ? backgroundStatus.hasReturnProtocol 
      : !!fallbackProtocols?.return;
      
    const isLoadingProtocolStatus = loadingProtocols.includes(rental.id);
    const protocolStatusLoaded = protocolStatusMap[rental.id] !== undefined;

    return (
      <div style={style}>
        <MobileRentalRow
          rental={rental}
          vehicle={vehicle}
          index={index}
          totalRentals={filteredRentals.length}
          hasHandover={hasHandover}
          hasReturn={hasReturn}
          isLoadingProtocolStatus={isLoadingProtocolStatus}
          protocolStatusLoaded={protocolStatusLoaded}
          onEdit={handleEdit}
          onOpenProtocolMenu={(rental, type) => {
            if (type === 'handover') {
              if (hasHandover) {
                handleOpenProtocolMenu(rental, 'handover');
              } else {
                handleCreateHandover(rental);
              }
            } else {
              if (hasReturn) {
                handleOpenProtocolMenu(rental, 'return');
              } else {
                handleCreateReturn(rental);
              }
            }
          }}
          onCheckProtocols={() => {}} // Simplified for now
          onDelete={handleDelete}
        />
      </div>
    );
  }, [filteredRentals, protocols, loadingProtocols, protocolStatusMap, getVehicleByRental, handleEdit, handleCreateHandover, handleCreateReturn, handleDelete, handleOpenProtocolMenu]);

  // Card renderer for mobile/card view (fallback)
  const renderRentalCard = useCallback((rental: Rental, index: number) => {
    const hasHandover = !!protocols[rental.id]?.handover;
    const hasReturn = !!protocols[rental.id]?.return;
    const isActive = rental.status === 'active';
    const isFinished = rental.status === 'finished';
    
    return (
      <Card 
        key={rental.id} 
        sx={{ 
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: isActive ? '2px solid #4caf50' : '1px solid rgba(0,0,0,0.12)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            borderColor: isActive ? '#4caf50' : 'primary.main'
          },
          position: 'relative',
          overflow: 'visible'
        }} 
        onClick={() => {
          console.log('🔥 CARD CLICKED FOR EDIT:', rental.id);
          handleEdit(rental);
        }}
      >
        {/* Status indicator */}
        <Box sx={{
          position: 'absolute',
          top: -8,
          right: 16,
          zIndex: 1
        }}>
          <Chip 
            label={rental.status} 
            color={isActive ? 'success' : isFinished ? 'default' : 'warning'}
            size="small"
            sx={{ 
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
        </Box>

        <CardContent sx={{ p: 3, pt: 4 }}>
          {/* Vehicle info */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CarIcon color="primary" fontSize="small" />
              <Typography variant="h6" fontWeight="bold" color="primary">
                {(() => {
                  const vehicle = getVehicleByRental(rental);
                  return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Bez vozidla';
                })()}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
              {(() => {
                const vehicle = getVehicleByRental(rental);
                return vehicle?.licensePlate || 'N/A';
              })()}
            </Typography>
          </Box>
          
          {/* Customer and company */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body1" fontWeight="medium">
                {rental.customerName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="action" fontSize="small" />
              <VehicleOwnerDisplay rental={rental} />
            
            </Box>
          </Box>
          
          {/* Dates */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon color="action" fontSize="small" />
              <Typography variant="body2" fontWeight="medium">
                Obdobie prenájmu
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, ml: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Od</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {format(new Date(rental.startDate), 'dd.MM.yyyy')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Do</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {format(new Date(rental.endDate), 'dd.MM.yyyy')}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Price and payment */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1
          }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Celková cena</Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {typeof rental.totalPrice === 'number' ? rental.totalPrice.toFixed(2) : '0.00'} €
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">Spôsob platby</Typography>
              <Typography variant="body2" fontWeight="medium">
                {rental.paymentMethod}
              </Typography>
            </Box>
          </Box>

          {/* PROTOKOLY - NOVÉ MOBILNÉ ZOBRAZENIE */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
              📋 Protokoly
            </Typography>
            
            {/* Protokolové tlačidlá - kompaktné */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {/* Odovzdávací protokol */}
              <Tooltip title={hasHandover ? "Odovzdávací protokol je vytvorený" : "Vytvoriť odovzdávací protokol"}>
                <IconButton
                  size="small"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleCreateHandover(rental); 
                  }}
                  color={hasHandover ? "success" : "primary"}
                  sx={{ 
                    bgcolor: hasHandover ? 'success.main' : 'primary.main',
                    color: 'white',
                    border: '2px solid',
                    borderColor: hasHandover ? 'success.main' : 'primary.main',
                    '&:hover': { 
                      bgcolor: hasHandover ? 'success.dark' : 'primary.dark',
                      borderColor: hasHandover ? 'success.dark' : 'primary.dark',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease',
                    width: 48,
                    height: 48
                  }}
                >
                  <HandoverIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Preberací protokol */}
              <Tooltip title={hasReturn ? "Preberací protokol je vytvorený" : hasHandover ? "Vytvoriť preberací protokol" : "Najprv vytvorte odovzdávací protokol"}>
                <IconButton
                  size="small"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleCreateReturn(rental); 
                  }}
                  color={hasReturn ? "warning" : "primary"}
                  disabled={!hasHandover}
                  sx={{ 
                    bgcolor: hasReturn ? 'warning.main' : hasHandover ? 'primary.main' : 'grey.400',
                    color: 'white',
                    border: '2px solid',
                    borderColor: hasReturn ? 'warning.main' : hasHandover ? 'primary.main' : 'grey.400',
                    '&:hover': { 
                      bgcolor: hasReturn ? 'warning.dark' : hasHandover ? 'primary.dark' : 'grey.400',
                      borderColor: hasReturn ? 'warning.dark' : hasHandover ? 'primary.dark' : 'grey.400',
                      transform: hasHandover ? 'scale(1.05)' : 'none'
                    },
                    transition: 'all 0.2s ease',
                    width: 48,
                    height: 48
                  }}
                >
                  <ReturnIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Zobraziť protokoly */}
              <Tooltip title="Zobraziť protokoly">
                <IconButton
                  size="small"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleViewProtocols(rental); 
                  }}
                  disabled={loadingProtocols.includes(rental.id)}
                  sx={{ 
                    bgcolor: 'info.main',
                    color: 'white',
                    border: '2px solid',
                    borderColor: 'info.main',
                    '&:hover': { 
                      bgcolor: 'info.dark',
                      borderColor: 'info.dark',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease',
                    width: 48,
                    height: 48
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Stav protokolov */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              justifyContent: 'center',
              mb: 2
            }}>
              <Chip
                icon={<HandoverIcon />}
                label={hasHandover ? "Prevzatie" : "Bez prevzatia"}
                color={hasHandover ? "success" : "error"}
                variant={hasHandover ? "filled" : "outlined"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<ReturnIcon />}
                label={hasReturn ? "Vrátenie" : hasHandover ? "Čaká" : "N/A"}
                color={hasReturn ? "success" : hasHandover ? "warning" : "error"}
                variant={hasReturn ? "filled" : "outlined"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {/* PDF a Galéria tlačidlá - zobrazené len ak existujú protokoly */}
            {(hasHandover || hasReturn) && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center' }}>
                  Stiahnuť a zobraziť
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {/* Preberací protokol PDF */}
                  {hasHandover && (
                    <Tooltip title="Stiahnuť preberací protokol PDF">
                      <IconButton
                        size="small"
                        component="a"
                        href={protocols[rental.id]?.handover?.pdfUrl}
                        target="_blank"
                        download
                        onClick={(e) => e.stopPropagation()}
                        sx={{ 
                          bgcolor: 'success.main',
                          color: 'white',
                          border: '2px solid',
                          borderColor: 'success.main',
                          '&:hover': { 
                            bgcolor: 'success.dark',
                            borderColor: 'success.dark',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease',
                          width: 40,
                          height: 40
                        }}
                      >
                        <PDFIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Vratný protokol PDF */}
                  {hasReturn && (
                    <Tooltip title="Stiahnuť vratný protokol PDF">
                      <IconButton
                        size="small"
                        component="a"
                        href={protocols[rental.id]?.return?.pdfUrl}
                        target="_blank"
                        download
                        onClick={(e) => e.stopPropagation()}
                        sx={{ 
                          bgcolor: 'warning.main',
                          color: 'white',
                          border: '2px solid',
                          borderColor: 'warning.main',
                          '&:hover': { 
                            bgcolor: 'warning.dark',
                            borderColor: 'warning.dark',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease',
                          width: 40,
                          height: 40
                        }}
                      >
                        <PDFIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Galéria preberacieho protokolu */}
                  {hasHandover && (
                    <Tooltip title="Galerie preberacieho protokolu">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGallery(rental, 'handover');
                        }}
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: 'white',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          '&:hover': { 
                            bgcolor: 'primary.dark',
                            borderColor: 'primary.dark',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease',
                          width: 40,
                          height: 40
                        }}
                      >
                        <GalleryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Galéria vratného protokolu */}
                  {hasReturn && (
                    <Tooltip title="Galerie vratného protokolu">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGallery(rental, 'return');
                        }}
                        sx={{ 
                          bgcolor: 'secondary.main',
                          color: 'white',
                          border: '2px solid',
                          borderColor: 'secondary.main',
                          '&:hover': { 
                            bgcolor: 'secondary.dark',
                            borderColor: 'secondary.dark',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease',
                          width: 40,
                          height: 40
                        }}
                      >
                        <GalleryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            )}
          </Box>
          
          {/* Ostatné akcie */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
            <Can update="rentals">
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleEdit(rental); 
                }}
                sx={{ 
                  flex: 1,
                  py: 1.5,
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    bgcolor: 'primary.light',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Upraviť
              </Button>
            </Can>
            <Can delete="rentals">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleDelete(rental.id); 
                }}
                sx={{ 
                  flex: 1,
                  py: 1.5,
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    bgcolor: 'error.light',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Zmazať
              </Button>
            </Can>
          </Box>
        </CardContent>
      </Card>
    );
  }, [handleEdit, handleCreateHandover, handleCreateReturn, handleDelete, protocols, handleOpenGallery, handleViewProtocols, loadingProtocols]);

  // ⚡ BACKGROUND PROTOCOL LOADING - načíta protocol status na pozadí bez spomalenia
  const loadProtocolStatusInBackground = useCallback(async () => {
    if (isLoadingProtocolStatus || protocolStatusLoaded) {
      return; // Už sa načítava alebo je načítané
    }

    console.log('🚀 BACKGROUND: Starting protocol status loading...');
    setIsLoadingProtocolStatus(true);
    
    try {
      const startTime = Date.now();
      const bulkProtocolStatus = await apiService.getBulkProtocolStatus();
      const loadTime = Date.now() - startTime;
      
      // Optimalized: Consolidated protocol status loading log
      console.log(`✅ Protocol status loaded: ${bulkProtocolStatus.length} rentals (${loadTime}ms)`);
      
      // Konvertuj array na map pre rýchly lookup
      const statusMap: Record<string, {
        hasHandoverProtocol: boolean;
        hasReturnProtocol: boolean;
      }> = {};
      
      bulkProtocolStatus.forEach((item: any) => {
        statusMap[item.rentalId] = {
          hasHandoverProtocol: item.hasHandoverProtocol,
          hasReturnProtocol: item.hasReturnProtocol,
        };
      });
      
      setProtocolStatusMap(statusMap);
      setProtocolStatusLoaded(true);
      
      // 🚀 SMART PRELOADING: Preload protokoly pre rentaly ktoré sú viditeľné a majú protokoly
      setTimeout(() => {
        preloadVisibleProtocols(statusMap);
      }, 100); // Krátke delay aby sa UI stihol updatnúť
      
    } catch (error) {
      console.error('❌ BACKGROUND: Failed to load protocol status:', error);
    } finally {
      setIsLoadingProtocolStatus(false);
    }
  }, [isLoadingProtocolStatus, protocolStatusLoaded]);

  // 🚀 SMART PROTOCOL PRELOADING - preloaduj protokoly pre viditeľné rentaly
  const preloadVisibleProtocols = useCallback(async (statusMap: Record<string, {hasHandoverProtocol: boolean, hasReturnProtocol: boolean}>) => {
    // Optimalized: Reduced preload logging
    
    // Získaj viditeľné rentaly (prvých 10-20)
    const visibleRentals = filteredRentals.slice(0, 15);
    
    let preloadCount = 0;
    const preloadPromises: Promise<void>[] = [];
    
    for (const rental of visibleRentals) {
      const status = statusMap[rental.id];
      
      // Ak rental má protokoly ale nie sú v cache, preloaduj ich
      if (status && (status.hasHandoverProtocol || status.hasReturnProtocol) && !protocols[rental.id]) {
        preloadPromises.push(
          loadProtocolsForRental(rental.id).then(() => {
            preloadCount++;
            // Only log individual preloads in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ PRELOAD: Protocol preloaded for rental ${rental.id} (${preloadCount})`);
            }
          }).catch((error) => {
            console.warn(`⚠️ PRELOAD: Failed to preload protocol for rental ${rental.id}:`, error);
          })
        );
        
        // Limit na 3 súčasných preload requestov aby sme nezaťažili server
        if (preloadPromises.length >= 3) {
          break;
        }
      }
    }
    
    // Optimalized: Single consolidated preload log
    console.log(`🎯 Smart preload: ${preloadPromises.length} protocols needed`);
    
    if (preloadPromises.length > 0) {
      
      try {
        // ⚡ Sequencial loading aby sme nezaťažili server
        for (const promise of preloadPromises) {
          await promise;
          // Krátka pauza medzi requestmi
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Only log success if protocols were actually preloaded
        if (preloadCount > 0) {
          console.log(`✅ Smart preload completed: ${preloadCount} protocols`);
        }
      } catch (error) {
        console.error('❌ PRELOAD: Some preload requests failed:', error);
      }
    }
  }, [filteredRentals, protocols, loadProtocolsForRental]);

  // ⚡ TRIGGER BACKGROUND LOADING po načítaní rentals
  React.useEffect(() => {
    if (paginatedRentals.length > 0 && !protocolStatusLoaded && !isLoadingProtocolStatus) {
      // Spusti na pozadí za 100ms aby sa nestratila rýchlosť UI
      const timer = setTimeout(() => {
        loadProtocolStatusInBackground();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [paginatedRentals.length, protocolStatusLoaded, isLoadingProtocolStatus, loadProtocolStatusInBackground]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* 🎨 LEGENDA FAREBNÝCH INDIKÁTOROV - VÝRAZNEJŠIA - SKRYTÁ NA MOBILE */}
      <Card sx={{ 
        mb: 2, 
        p: 2,
        backgroundColor: 'rgba(25, 118, 210, 0.02)',
        border: '1px solid rgba(25, 118, 210, 0.1)',
        display: { xs: 'none', md: 'block' } // Skryté na mobile
      }}>
        <Typography variant="h6" sx={{ 
          mb: 1.5, 
          fontWeight: 600,
          color: 'primary.main',
          fontSize: '1rem'
        }}>
          📍 Farebné indikátory stavov:
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: { xs: 1.5, sm: 2.5 },
          alignItems: 'center'
        }}>
          {[
            { color: '#f44336', label: 'Preterminované' },
            { color: '#ff9800', label: 'Dnes/zajtra vrátenie' },
            { color: '#ffc107', label: 'Nezaplatené' },
            { color: '#2196f3', label: 'Nové/začínajúce' },
            { color: '#4caf50', label: 'V poriadku' }
          ].map((item, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.75,
              p: 0.5,
              borderRadius: 1,
              backgroundColor: 'rgba(255,255,255,0.7)'
            }}>
              <Box sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: item.color,
                flexShrink: 0,
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
              <Typography variant="body2" sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                fontWeight: 500
              }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {/* 📊 EXTRACTED: RentalStats komponent */}
      <RentalStats
        rentals={filteredRentals}
        protocols={protocols}
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
        handleAdvancedFiltersChange={handleAdvancedFiltersChange}
        toggleFilterValue={toggleFilterValue}
        isFilterValueSelected={isFilterValueSelected}
        resetAllFilters={resetAllFilters}
        uniquePaymentMethods={uniquePaymentMethods}
        uniqueCompanies={uniqueCompanies}
        uniqueStatuses={uniqueStatuses}
        uniqueVehicleBrands={uniqueVehicleBrands}
        filteredRentalsCount={filteredRentals.length}
        totalRentalsCount={state.rentals?.length || 0}
      />
      {/* 🚀 EXTRACTED: RentalTable komponent */}
      <RentalTable
        paginatedRentals={paginatedRentals}
        isMobile={isMobile}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleCreateHandover={handleCreateHandover}
        handleCreateReturn={handleCreateReturn}
        handleOpenProtocolMenu={handleOpenProtocolMenu}
        handleViewRental={handleViewRental}
        // Desktop view props
        getVehicleByRental={getVehicleByRental}
        protocolStatusMap={protocolStatusMap}
        protocols={protocols}
        getStatusIndicator={getStatusIndicator}
        filteredRentals={filteredRentals}
        desktopScrollRef={desktopScrollRef}
        mobileScrollRef={mobileScrollRef}
        isLoadingProtocolStatus={isLoadingProtocolStatus}
        protocolStatusLoaded={protocolStatusLoaded}
        handleCheckProtocols={handleCheckProtocols}
        VirtualizedRentalRow={VirtualizedRentalRow}
      />
      {/* 🚀 EXTRACTED: All dialogs moved to RentalProtocols component */}
      <RentalProtocols
        // Dialog states
        openDialog={openDialog}
        openHandoverDialog={openHandoverDialog}
        openReturnDialog={openReturnDialog}
        openProtocolMenu={openProtocolMenu}
        pdfViewerOpen={pdfViewerOpen}
        galleryOpen={galleryOpen}
        
        // Selected data
        editingRental={editingRental}
        selectedRentalForProtocol={selectedRentalForProtocol}
        selectedProtocolType={selectedProtocolType}
        selectedPdf={selectedPdf}
        galleryImages={galleryImages}
        galleryVideos={galleryVideos}
        galleryTitle={galleryTitle}
        
        // Protocols data
        protocols={protocols}
        
        // Event handlers
        setOpenDialog={setOpenDialog}
        setOpenHandoverDialog={setOpenHandoverDialog}
        setOpenReturnDialog={setOpenReturnDialog}
        handleSave={handleSave}
        handleCancel={handleCancel}
        handleSaveHandover={handleSaveHandover}
        handleSaveReturn={handleSaveReturn}
        handleClosePDF={handleClosePDF}
        handleCloseGallery={handleCloseGallery}
        handleCloseProtocolMenu={handleCloseProtocolMenu}
        handleDownloadPDF={handleDownloadPDF}
        handleViewGallery={handleViewGallery}
      />

      {/* 🚀 GMAIL APPROACH: Invisible infinite scroll indicators */}
      {paginatedError && (
        <Alert severity="error" sx={{ m: 2 }}>
          Chyba pri načítavaní: {paginatedError}
        </Alert>
      )}
      
      {paginatedLoading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          p: 3,
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          borderRadius: 2,
          m: 2
        }}>
          <CircularProgress size={24} />
          <Typography variant="body1" sx={{ ml: 2, color: 'primary.main', fontWeight: 500 }}>
            Načítavam ďalšie prenájmy... (strana {currentPage + 1})
          </Typography>
        </Box>
      )}
      
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
    </Box>
  );
} 