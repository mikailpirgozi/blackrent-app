import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Add as AddIcon,
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
  GetApp as ExportIcon,
  CloudDownload as DownloadIcon,
  List as ListIcon

} from '@mui/icons-material';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { Rental } from '../../types';
import { useRentalUpdates } from '../../hooks/useWebSocket';
import { logger } from '../../utils/smartLogger';
import { useInfiniteRentals } from '../../hooks/useInfiniteRentals';
import { MobileRentalRow } from './MobileRentalRow';
import { getMobileStyles, TOUCH_TARGETS } from '../../utils/mobileResponsive';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { FixedSizeList as List } from 'react-window';
import RentalForm from './RentalForm';
import PDFViewer from '../common/PDFViewer';
import ProtocolGallery from '../common/ProtocolGallery';
import ReturnProtocolForm from '../protocols/ReturnProtocolForm';
import { getBaseUrl } from '../../utils/apiUrl';
// 🚀 LAZY LOADING: Protocols loaded only when needed
const HandoverProtocolForm = React.lazy(() => import('../protocols/HandoverProtocolForm'));

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
  
  const { state, createRental, updateRental, deleteRental } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // 768px breakpoint
  const mobileStyles = getMobileStyles(theme);

  // State management
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  // const [selected, setSelected] = useState<string[]>([]); // Nepoužívané - odstránené
  const [protocols, setProtocols] = useState<Record<string, { handover?: any; return?: any }>>({});
  const [loadingProtocols, setLoadingProtocols] = useState<string[]>([]);
  const [, setImportError] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // 🚀 GMAIL APPROACH: Replace state.rentals with paginated loading
  const {
    rentals: paginatedRentals,
    loading: paginatedLoading,
    hasMore,
    error: paginatedError,
    searchTerm: paginatedSearchTerm,
    setSearchTerm: setPaginatedSearchTerm,
    currentPage,
    loadMore
  } = useInfiniteRentals();
  
      // Create a scrollable container ref for infinite scroll detection
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const rentalListRef = useRef<HTMLDivElement>(null); // 🎯 NEW: Ref for rental list container
    // 🚀 PRELOADING: Trigger at 70% scroll for seamless UX - users never see empty space
    // 📱 MOBILE: Use higher threshold for mobile devices to prevent early loading
    const scrollThreshold = isMobile ? 0.85 : 0.75; // 85% for mobile, 75% for desktop
    // 🎯 SIMPLIFIED: Use percentage-based but only for rental list content
    // Calculate based on number of items shown vs total
    const itemsPerPage = 50;
    const currentItemsShown = paginatedRentals.length;
    const triggerAtItem = Math.floor(currentItemsShown * 0.85); // Trigger at 85% of current items
    
    // Use simple scroll detection with item count check
    useEffect(() => {
      // 🎯 FIXED: Use rental list container, not main container
      const container = rentalListRef.current || scrollContainerRef.current;
      if (!container || !hasMore || paginatedLoading) return;
      
      let debounceTimer: NodeJS.Timeout;
      let isLoading = false;
      
      const handleScroll = (e?: any) => {
        if (isLoading) return;
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          let scrollPercentage = 0;
          
          // For mobile virtualized list
          if (isMobile && e && e.scrollOffset !== undefined) {
            const totalHeight = paginatedRentals.length * 160; // itemSize * count
            const viewportHeight = 600;
            const maxScroll = totalHeight - viewportHeight;
            scrollPercentage = e.scrollOffset / maxScroll;
            if (process.env.NODE_ENV === 'development') {
              console.log(`📱 Mobile virtual scroll: ${Math.round(scrollPercentage * 100)}%`);
            }
          } 
          // For desktop regular scroll
          else if (!isMobile && container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            scrollPercentage = scrollTop / (scrollHeight - clientHeight);
            if (process.env.NODE_ENV === 'development') {
              console.log(`💻 Desktop scroll: ${Math.round(scrollPercentage * 100)}%`);
            }
          }
          
          // 📱 MOBILE: Use 70% threshold for earlier loading on mobile
          // 💻 DESKTOP: Use 70% threshold for earlier loading
          // 🎯 UNIFIED: Use 70% threshold for both mobile and desktop
          const threshold = 0.70;
          
          // Trigger at appropriate threshold
          if (scrollPercentage >= threshold && !isLoading) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`📜 Infinite scroll triggered at ${Math.round(scrollPercentage * 100)}% (threshold: ${Math.round(threshold * 100)}%, ${isMobile ? 'mobile' : 'desktop'})`);
            }
            isLoading = true;
            loadMore();
            setTimeout(() => { isLoading = false; }, 3000);
          }
        }, 200);
      };
      
      // For desktop, listen to container scroll
      if (!isMobile && container) {
        container.addEventListener('scroll', handleScroll, { passive: true });
      }
      
      // Store handler for mobile virtualized list
      if (isMobile) {
        // Handler will be called from List's onScroll prop
        (window as any).__rentalListScrollHandler = handleScroll;
      }
      
      return () => {
        clearTimeout(debounceTimer);
        if (!isMobile && container) {
          container.removeEventListener('scroll', handleScroll);
        }
        if (isMobile) {
          delete (window as any).__rentalListScrollHandler;
        }
      };
    }, [rentalListRef, scrollContainerRef, loadMore, hasMore, paginatedLoading, paginatedRentals.length, isMobile]);
  
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
    
    // ⚡ PERFORMANCE: Smart updates with debouncing
    if (type === 'created' || type === 'updated' || type === 'deleted') {
      logger.performance('Rental list refresh triggered', { reason: type, rentalId });
      debouncedRefresh();
    }
  }, [debouncedRefresh]));

  // ⚡ OPTIMIZED: Memoized vehicle lookup map for performance
  const vehicleLookupMap = useMemo(() => {
    const map = new Map();
    state.vehicles.forEach(vehicle => {
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
  
  // Protocol dialogs
  const [openHandoverDialog, setOpenHandoverDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedRentalForProtocol, setSelectedRentalForProtocol] = useState<Rental | null>(null);
  
  // PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string; type: 'handover' | 'return' } | null>(null);
  
  // Image gallery - using useRef to survive re-renders
  const galleryOpenRef = useRef(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<any[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  // const [, forceUpdate] = useState({}); // Nepoužívané - odstránené
  
  // Protocol menu state
  const [protocolMenuOpen, setProtocolMenuOpen] = useState(false);
  const [selectedProtocolRental, setSelectedProtocolRental] = useState<Rental | null>(null);
  const [selectedProtocolType, setSelectedProtocolType] = useState<'handover' | 'return' | null>(null);

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
  function exportRentalsToCSV(rentals: Rental[]) {
    // Stĺpce v CSV súbori:
    // - id: unikátne ID prenájmu
    // - licensePlate: ŠPZ vozidla (podľa ktorej sa nájde auto a firma)
    // - company: názov firmy vozidla
    // - brand: značka vozidla
    // - model: model vozidla
    // - customerName: meno zákazníka
    // - customerEmail: email zákazníka (voliteľné)
    // - startDate: dátum začiatku prenájmu (formát ISO 8601 - 2025-01-03T23:00:00.000Z)
    // - endDate: dátum konca prenájmu (formát ISO 8601 - 2025-01-03T23:00:00.000Z)
    // - totalPrice: celková cena prenájmu v €
    // - commission: provízia v €
    // - paymentMethod: spôsob platby (cash/bank_transfer/vrp/direct_to_owner)
    // - discountType: typ zľavy (percentage/fixed) - voliteľné
    // - discountValue: hodnota zľavy - voliteľné
    // - customCommissionType: typ vlastnej provízie (percentage/fixed) - voliteľné
    // - customCommissionValue: hodnota vlastnej provízie - voliteľné
    // - extraKmCharge: doplatok za km v € - voliteľné
    // - paid: či je uhradené (1=áno, 0=nie)
    // - handoverPlace: miesto prevzatia - voliteľné
    // - confirmed: či je potvrdené (1=áno, 0=nie)
    const header = [
      'id','licensePlate','company','brand','model','customerName','customerEmail','startDate','endDate','totalPrice','commission','paymentMethod','discountType','discountValue','customCommissionType','customCommissionValue','extraKmCharge','paid','handoverPlace','confirmed'
    ];
    const rows = rentals.map(r => [
      r.id,
      r.vehicle?.licensePlate || '',
      r.vehicle?.company || '',
      r.vehicle?.brand || '',
      r.vehicle?.model || '',
      r.customerName,
      r.customer?.email || '',
      (() => {
        const startDate = r.startDate instanceof Date ? r.startDate : new Date(r.startDate);
        return !isNaN(startDate.getTime()) ? startDate.toISOString() : String(r.startDate);
      })(),
      (() => {
        const endDate = r.endDate instanceof Date ? r.endDate : new Date(r.endDate);
        return !isNaN(endDate.getTime()) ? endDate.toISOString() : String(r.endDate);
      })(),
      r.totalPrice,
      r.commission,
      r.paymentMethod,
      r.discount?.type || '',
      r.discount?.value ?? '',
      r.customCommission?.type || '',
      r.customCommission?.value ?? '',
      r.extraKmCharge ?? '',
      r.paid ? '1' : '0',
      r.handoverPlace || '',
      r.confirmed ? '1' : '0',
    ]);
    const csv = [header, ...rows].map(row => row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'prenajmy.csv');
  }

  // Import prenájmov z CSV
  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ReturnType<typeof Papa.parse>) => {
        try {
          const imported = [];
          const createdVehicles: any[] = [];
          const createdCustomers: any[] = [];
          const createdCompanies: any[] = [];
          
          // Najskôr spracujeme všetky riadky a vytvoríme zákazníkov, firmy a vozidlá ak je potrebné
          for (const row of results.data as any[]) {
            logger.debug('Processing CSV row', { rowIndex: results.data.indexOf(row) });
            
            // 1. VYTVORENIE ZÁKAZNÍKA AK NEEXISTUJE
            const customerName = row.customerName || 'Neznámy zákazník';
            const customerEmail = row.customerEmail || '';
            
            let existingCustomer = state.customers.find(c => 
              c.name.toLowerCase() === customerName.toLowerCase() ||
              (customerEmail && c.email === customerEmail)
            );
            
            // Skontroluj aj v aktuálne vytvorených zákazníkoch
            if (!existingCustomer) {
              existingCustomer = createdCustomers.find(c => 
                c.name.toLowerCase() === customerName.toLowerCase() ||
                (customerEmail && c.email === customerEmail)
              );
            }
            
            // Ak zákazník neexistuje, vytvor ho
            if (!existingCustomer && customerName !== 'Neznámy zákazník') {
              try {
                const newCustomer = {
                  id: uuidv4(),
                  name: customerName,
                  email: customerEmail,
                  phone: '',
                  address: '',
                  notes: '',
                  createdAt: new Date()
                };
                await apiService.createCustomer(newCustomer);
                createdCustomers.push(newCustomer);
                logger.info('Customer created during import', { customerName });
              } catch (error) {
                logger.error('Failed to create customer during import', { customerName, error });
              }
            }

            // 2. VYTVORENIE FIRMY AK NEEXISTUJE
            const companyName = row.company || 'Neznáma firma';
            let existingCompany = state.companies.find(c => 
              c.name.toLowerCase() === companyName.toLowerCase()
            );
            
            if (!existingCompany) {
              existingCompany = createdCompanies.find(c => 
                c.name.toLowerCase() === companyName.toLowerCase()
              );
            }
            
            if (!existingCompany && companyName !== 'Neznáma firma') {
              try {
                const newCompany = {
                  id: uuidv4(),
                  name: companyName,
                  address: '',
                  phone: '',
                  email: '',
                  commissionRate: 20.00,
                  isActive: true,
                  createdAt: new Date()
                };
                await apiService.createCompany(newCompany);
                createdCompanies.push(newCompany);
                logger.info('Company created during import', { companyName });
              } catch (error) {
                logger.error('Failed to create company during import', { companyName, error });
              }
            }

            // 3. VYTVORENIE VOZIDLA AK NEEXISTUJE
            const licensePlate = row.licensePlate;
            if (!licensePlate) {
              logger.warn('Missing license plate, skipping row', { rowIndex: results.data.indexOf(row) });
              continue;
            }
            
            let vehicle = state.vehicles.find(v => 
              v.licensePlate.toLowerCase() === licensePlate.toLowerCase()
            );
            
            if (!vehicle) {
              vehicle = createdVehicles.find(v => 
                v.licensePlate.toLowerCase() === licensePlate.toLowerCase()
              );
            }
            
            if (!vehicle) {
              try {
                const finalCompany = existingCompany || createdCompanies.find(c => 
                  c.name.toLowerCase() === companyName.toLowerCase()
                );
                
                if (!finalCompany) {
                  logger.warn('Missing company for vehicle, skipping', { licensePlate });
                  continue;
                }
                
                const newVehicle = {
                  id: uuidv4(),
                  licensePlate: licensePlate,
                  brand: row.brand || 'Neznáma značka',
                  model: row.model || 'Neznámy model',
                  companyId: finalCompany.id,
                  company: finalCompany.name,
                  year: new Date().getFullYear(),
                  fuelType: 'benzín',
                  transmission: 'manuál',
                  seats: 5,
                  dailyRate: Number(row.totalPrice) || 50,
                  commission: {
                    type: 'percentage' as const,
                    value: 20
                  },
                  pricing: [],
                  status: 'available' as const,
                  notes: ''
                };
                await apiService.createVehicle(newVehicle);
                createdVehicles.push(newVehicle);
                logger.info('Vehicle created during import', { licensePlate, brand: row.brand, model: row.model });
              } catch (error) {
                logger.error('Failed to create vehicle during import', { licensePlate, error });
                continue;
              }
            }

            // Parsuje dátumy - iba dátum bez času, zachováva formát pre export
            const parseDate = (dateStr: string) => {
              if (!dateStr) return new Date();
              
              // Skúsi ISO 8601 formát (YYYY-MM-DDTHH:mm:ss.sssZ alebo YYYY-MM-DD)
              // Ale iba ak má správny formát (obsahuje - alebo T)
              if (dateStr.includes('-') || dateStr.includes('T')) {
                const isoDate = new Date(dateStr);
                if (!isNaN(isoDate.getTime())) {
                  // Extrahuje iba dátum bez času
                  return new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
                }
              }
              
              // Fallback na formát s bodkami - podporuje "14.1." alebo "14.1.2025"
              let cleanDateStr = dateStr.trim();
              
              // Odstráni koncovú bodku ak je tam ("14.1." -> "14.1")
              if (cleanDateStr.endsWith('.')) {
                cleanDateStr = cleanDateStr.slice(0, -1);
              }
              
              const parts = cleanDateStr.split('.');
              if (parts.length === 2) {
                // Formát dd.M - automaticky pridá rok 2025
                const day = Number(parts[0]);
                const month = Number(parts[1]) - 1; // január = 0, február = 1, atď.
                
                // Validácia dátumu
                if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
                  return new Date(2025, month, day);
                }
              } else if (parts.length === 3) {
                // Formát dd.M.yyyy - ak je tam rok
                const day = Number(parts[0]);
                const month = Number(parts[1]) - 1;
                const year = Number(parts[2]);
                
                // Validácia dátumu
                if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
                  return new Date(year, month, day);
                }
              }
              
              // Ak nič nefunguje, vráti dnešný dátum
              console.warn(`Nepodarilo sa parsovať dátum: "${dateStr}", používam dnešný dátum`);
              return new Date();
            };

            // Priradenie zákazníka na základe existujúceho alebo novo vytvoreného
            const finalCustomer = existingCustomer || createdCustomers.find(c => 
              c.name.toLowerCase() === customerName.toLowerCase() ||
              (customerEmail && c.email === customerEmail)
            );

            // Automatické priradenie majiteľa na základe vozidla
            // Ak existuje vozidlo a nie je zadaný spôsob platby, nastav platbu priamo majiteľovi
            let finalPaymentMethod = row.paymentMethod || 'cash';
            
            // Ak je nájdené vozidlo na základe ŠPZ a nie je zadaný paymentMethod,
            // automaticky nastav platbu priamo majiteľovi vozidla
            if (vehicle && !row.paymentMethod) {
              finalPaymentMethod = 'direct_to_owner';
              logger.info('Auto-assigned direct payment to vehicle owner', { 
                licensePlate: vehicle.licensePlate, 
                company: vehicle.company 
              });
            }

            // Automatické počítanie provízie na základe vozidla ak nie je zadaná
            const finalCommission = Number(row.commission) || (vehicle?.commission ? 
              vehicle.commission.type === 'percentage' 
                ? (Number(row.totalPrice) || 0) * vehicle.commission.value / 100
                : vehicle.commission.value 
              : 0);
            
            if (!row.commission && vehicle?.commission) {
              logger.info('Auto-calculated commission for vehicle', {
                licensePlate: vehicle.licensePlate,
                commission: finalCommission,
                type: vehicle.commission.type,
                value: vehicle.commission.value
              });
            }

            // Log informácií o majiteľovi/firme vozidla
            if (vehicle) {
              logger.debug('Vehicle assigned to rental', { 
                licensePlate: vehicle.licensePlate, 
                owner: vehicle.company 
              });
            }

            const startDate = parseDate(row.startDate);
            const endDate = parseDate(row.endDate);
            
            // KONTROLA DUPLICÍT PRENÁJMU
            // Skontroluj, či už existuje prenájom s týmito parametrami
            const duplicateRental = state.rentals.find(existingRental => {
              // Kontrola podľa vozidla a dátumov
              if (vehicle?.id && existingRental.vehicleId === vehicle.id) {
                const existingStart = new Date(existingRental.startDate);
                const existingEnd = new Date(existingRental.endDate);
                
                // Ak sa dátumy zhodujú (rovnaký deň)
                if (existingStart.toDateString() === startDate.toDateString() && 
                    existingEnd.toDateString() === endDate.toDateString()) {
                  return true;
                }
              }
              return false;
            });
            
            if (duplicateRental) {
              logger.warn('Duplicate rental detected, skipping', {
                licensePlate: vehicle?.licensePlate,
                startDate: startDate.toLocaleDateString(),
                endDate: endDate.toLocaleDateString()
              });
              continue;
            }

            // Vytvorenie prenájmu
            const newRental = {
              id: row.id || uuidv4(),
              vehicleId: vehicle?.id || '',
              vehicle: vehicle,
              customerId: finalCustomer?.id || '',
              customer: finalCustomer,
              customerName: customerName,
              startDate: startDate,
              endDate: endDate,
              totalPrice: Number(row.totalPrice) || 0,
              commission: finalCommission,
              paymentMethod: finalPaymentMethod as any,
              discount: row.discountType ? {
                type: row.discountType as 'percentage' | 'fixed',
                value: Number(row.discountValue) || 0
              } : undefined,
              customCommission: row.customCommissionType ? {
                type: row.customCommissionType as 'percentage' | 'fixed',
                value: Number(row.customCommissionValue) || 0
              } : undefined,
              extraKmCharge: Number(row.extraKmCharge) || 0,
              paid: row.paid === '1' || row.paid === true,
              handoverPlace: row.handoverPlace || '',
              confirmed: row.confirmed === '1' || row.confirmed === true,
              status: 'active' as const,
              notes: '',
              createdAt: new Date()
            };

            try {
              await apiService.createRental(newRental);
              imported.push(newRental);
              logger.info('Rental imported successfully', {
                customer: customerName,
                licensePlate: vehicle?.licensePlate,
                startDate: startDate.toLocaleDateString(),
                endDate: endDate.toLocaleDateString()
              });
            } catch (error) {
              logger.error('Failed to create rental during import', { error });
            }
          }
          
          logger.info('CSV import completed successfully', { 
            importedCount: imported.length,
            totalRows: results.data.length 
          });
          setImportError('');
          
          // Refresh dát
          window.location.reload();
          
        } catch (error) {
          logger.error('CSV import failed', { error });
          setImportError('Chyba pri importe CSV súboru');
        }
        
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  }

  const handleAdd = useCallback(() => {
    setEditingRental(null);
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((rental: Rental) => {
    setEditingRental(rental);
    setOpenDialog(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento prenájom?')) {
      try {
        await deleteRental(id);
        console.log('Prenájom úspešne vymazaný');
      } catch (error) {
        console.error('Chyba pri mazaní prenájmu:', error);
        alert('Chyba pri mazaní prenájmu. Skúste to znovu.');
      }
    }
  }, [deleteRental]);

  const handleSave = async (rental: Rental) => {
    try {
      if (editingRental) {
        await updateRental(rental);
        alert('Prenájom bol úspešne aktualizovaný!');
      } else {
        await createRental(rental);
        alert('Prenájom bol úspešne pridaný!');
      }
      setOpenDialog(false);
      setEditingRental(null);
    } catch (error) {
      console.error('Chyba pri ukladaní prenájmu:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
      alert(`Chyba pri ukladaní prenájmu: ${errorMessage}`);
    }
  };

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
        alert('Chyba pri kontrole existujúcich protokolov. Skúste to znovu.');
      }
    }
  }, [protocolStatusMap, protocols]);

  const handleSaveHandover = async (protocolData: any) => {
    try {
      // Debug log
      console.log('handleSaveHandover - protocolData:', protocolData);
      const data = await apiService.createHandoverProtocol(protocolData);
      console.log('Handover protocol created:', data);
      
      // ✅ VYČISTI CACHE A ZNOVU NAČÍTAJ PROTOKOLY
      setProtocols(prev => {
        const newProtocols = { ...prev };
        delete newProtocols[protocolData.rentalId];
        return newProtocols;
      });
      await loadProtocolsForRental(protocolData.rentalId);

      // ✅ OPTIMISTIC UPDATE BULK-STATUS
      setProtocolStatusMap(prev => ({
        ...prev,
        [protocolData.rentalId]: {
          hasHandoverProtocol: true,
          hasReturnProtocol: prev[protocolData.rentalId]?.hasReturnProtocol || false,
        }
      }));

      // 🔄 REFRESH BULK-STATUS NA POZADÍ (zosúladenie s backendom)
      setTimeout(() => {
        try {
          // dočasne povoliť refresh aj keď už bolo raz načítané
          setProtocolStatusLoaded(false);
          loadProtocolStatusInBackground();
        } catch (e) {
          console.warn('Bulk-status refresh after handover failed:', e);
        }
      }, 100);
      
      alert('Odovzdávací protokol úspešne dokončený!');
      setOpenHandoverDialog(false);
      setSelectedRentalForProtocol(null);
    } catch (error) {
      console.error('Chyba pri ukladaní handover protokolu:', error);
      alert('Chyba pri ukladaní protokolu. Skúste to znovu.');
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
        alert('⚠️ UPOZORNENIE: Najprv musíte vytvoriť odovzdávací protokol!\n\nVrátny protokol nemožno vytvoriť bez existujúceho odovzdávacieho protokolu.');
        return;
      }
      
      if (hasReturn) {
        console.log('⚡ CACHED: Return protocol already exists for rental:', rental.id);
        alert('⚠️ UPOZORNENIE: Pre toto vozidlo už existuje vrátny protokol!\n\nNemôžete vytvoriť ďalší vrátny protokol pre to isté vozidlo. Ak potrebujete upraviť protokol, kontaktujte administrátora.');
        return;
      }
      
      console.log('⚡ CACHED: Handover protocol found, no return protocol exists. Loading handover protocol...');
      
      // ⚡ NAČÍTAJ HANDOVER PROTOKOL PRED OTVORENÍM RETURN DIALOGU
      const protocolData = await loadProtocolsForRental(rental.id);
      
      console.log('🔄 RETURN DEBUG: Protocol data returned from loadProtocolsForRental:', protocolData);
      
      if (!protocolData || !protocolData.handover) {
        console.error('❌ RETURN DEBUG: No handover protocol data returned!');
        alert('Chyba pri načítaní odovzdávacieho protokolu. Skúste to znovu.');
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
          alert('⚠️ UPOZORNENIE: Najprv musíte vytvoriť odovzdávací protokol!\n\nVrátny protokol nemožno vytvoriť bez existujúceho odovzdávacieho protokolu.');
          console.error('❌ No handover protocol found for rental:', rental.id);
          return;
        }
        
        if (protocolsData.returnProtocols && protocolsData.returnProtocols.length > 0) {
          alert('⚠️ UPOZORNENIE: Pre toto vozidlo už existuje vrátny protokol!\n\nNemôžete vytvoriť ďalší vrátny protokol pre to isté vozidlo. Ak potrebujete upraviť protokol, kontaktujte administrátora.');
          console.warn('❌ Return protocol already exists for rental:', rental.id);
          return;
        }
        
        console.log('✅ Handover protocol found, no return protocol exists (fallback). Loading protocols...');
        
        // ⚡ NAČÍTAJ PROTOKOLY PRED OTVORENÍM RETURN DIALOGU
        const protocolData = await loadProtocolsForRental(rental.id);
        
        console.log('🔄 RETURN DEBUG (fallback): Protocol data returned:', protocolData);
        
        if (!protocolData || !protocolData.handover) {
          console.error('❌ RETURN DEBUG (fallback): No handover protocol data returned!');
          alert('Chyba pri načítaní odovzdávacieho protokolu. Skúste to znovu.');
          return;
        }
        
        console.log('🔄 RETURN DEBUG (fallback): Setting selectedRentalForProtocol to:', rental.id);
        setSelectedRentalForProtocol(rental);
        
        console.log('🔄 RETURN DEBUG (fallback): Setting openReturnDialog to true');
        setOpenReturnDialog(true);
        
        console.log('🔄 RETURN DEBUG (fallback): Handover protocol available:', protocolData.handover.id);
      } catch (fallbackError) {
        console.error('❌ Fallback API call also failed:', fallbackError);
        alert('Chyba pri kontrole existujúcich protokolov. Skúste to znovu.');
      }
    }
  }, [protocolStatusMap, protocols, loadProtocolsForRental]);

    const handleSaveReturn = async (protocolData: any) => {
    try {
      // ✅ OPRAVENÉ: Protokol je už uložený v ReturnProtocolForm, iba aktualizujeme UI
      console.log('Return protocol already saved, updating UI:', protocolData);
      
      // ✅ VYČISTI CACHE A ZNOVU NAČÍTAJ PROTOKOLY
      setProtocols(prev => {
        const newProtocols = { ...prev };
        delete newProtocols[protocolData.rentalId];
        return newProtocols;
      });
      await loadProtocolsForRental(protocolData.rentalId);
      
      alert('Vrátny protokol úspešne dokončený!');
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
      alert('Chyba pri otváraní galérie: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
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
    
    setSelectedProtocolRental(rental);
    setSelectedProtocolType(protocolType);
    
    // ⚡ Najprv načítaj protokoly, POTOM otvor menu
    console.log('📋 Loading protocols before opening menu...');
    await handleViewProtocols(rental);
    
    // Menu sa otvorí až po načítaní protokolov
    console.log('✅ Protocols loaded, opening menu now');
    setProtocolMenuOpen(true);
  };

  const handleCloseProtocolMenu = () => {
    console.log('📋 Closing protocol menu, current state:', {
      protocolMenuOpen,
      selectedProtocolRental: selectedProtocolRental?.id,
      selectedProtocolType,
      galleryOpen
    });
    
    console.log('📋 About to reset protocol menu state...');
    setProtocolMenuOpen(false);
    setSelectedProtocolRental(null);
    setSelectedProtocolType(null);
    console.log('📋 Protocol menu state reset completed');
  };

  const handleDownloadPDF = async () => {
    console.log('🔍 PDF DOWNLOAD: Starting...', {selectedProtocolRental, selectedProtocolType});
    console.log('🔍 PDF DOWNLOAD: All protocols:', protocols);
    console.log('🔍 PDF DOWNLOAD: Protocols for rental:', selectedProtocolRental?.id ? protocols[selectedProtocolRental.id] : 'No rental ID');
    
    if (selectedProtocolRental && selectedProtocolType) {
      const protocol = protocols[selectedProtocolRental.id]?.[selectedProtocolType];
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
              alert('Chyba pri otváraní PDF protokolu: ' + response.status);
            }
          }
        } catch (error) {
          console.error('❌ Chyba pri otváraní PDF:', error);
          alert('Chyba pri otváraní PDF protokolu: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
        }
      } else {
        console.error('❌ PDF DOWNLOAD: No protocol found for rental:', selectedProtocolRental.id, selectedProtocolType);
      }
    } else {
      console.error('❌ PDF DOWNLOAD: Missing rental or type:', {selectedProtocolRental, selectedProtocolType});
    }
    handleCloseProtocolMenu();
  };

  const handleViewGallery = () => {
    if (selectedProtocolRental && selectedProtocolType) {
      handleOpenGallery(selectedProtocolRental, selectedProtocolType);
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
      alert('Chyba pri mazaní protokolu. Skúste to znovu.');
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
            <Button
              size="small"
              variant="contained"
              startIcon={<EditIcon />}
              onClick={(e) => { e.stopPropagation(); handleEdit(rental); }}
              sx={{ 
                flex: 1,
                minWidth: '100px',
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark }
              }}
            >
              Upraviť
            </Button>
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
  
  // Reset all filters function
  const resetAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setAdvancedFilters({
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
    });
  };

  // Handle advanced filters change
  const handleAdvancedFiltersChange = (newFilters: FilterState) => {
    setAdvancedFilters(newFilters);
  };

  // Multi-select helper functions
  const toggleFilterValue = (filterKey: keyof FilterState, value: string) => {
    const currentValues = advancedFilters[filterKey] as string[];
    const newValues = Array.isArray(currentValues) 
      ? currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      : [value];
    
    setAdvancedFilters({
      ...advancedFilters,
      [filterKey]: newValues
    });
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
        onClick={() => handleEdit(rental)}
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
                  size="medium"
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
                  <HandoverIcon fontSize="medium" />
                </IconButton>
              </Tooltip>

              {/* Vrátny protokol */}
              <Tooltip title={hasReturn ? "Vrátny protokol je vytvorený" : hasHandover ? "Vytvoriť vrátny protokol" : "Najprv vytvorte odovzdávací protokol"}>
                <IconButton
                  size="medium"
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
                  <ReturnIcon fontSize="medium" />
                </IconButton>
              </Tooltip>

              {/* Zobraziť protokoly */}
              <Tooltip title="Zobraziť protokoly">
                <IconButton
                  size="medium"
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
                  <VisibilityIcon fontSize="medium" />
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
    <Box ref={scrollContainerRef} sx={{ height: '100vh', overflow: 'auto' }}>
      {/* Enhanced Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', md: 'center' },
            gap: { xs: 2, md: 0 }
          }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ 
                mb: 1,
                fontSize: { xs: '1.75rem', md: '2.125rem' }
              }}>
                Prenájmy
              </Typography>
              <Typography variant="body1" sx={{ 
                opacity: 0.9,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}>
                Správa a prehľad všetkých prenájmov vozidiel
              </Typography>
            </Box>
                          <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' }, 
                gap: 2 
              }}>
              <Box sx={{ 
                textAlign: { xs: 'center', md: 'right' }, 
                mr: { xs: 0, md: 2 },
                mb: { xs: 2, md: 0 }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 2, md: 3 },
                  justifyContent: { xs: 'center', md: 'flex-end' }
                }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {filteredRentals.length}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      zobrazených
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="success.light">
                      {filteredRentals.filter(r => r.status === 'active').length}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      aktívnych
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="warning.light">
                      {filteredRentals.filter(r => protocols[r.id]?.handover && !protocols[r.id]?.return).length}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      čakajú na vrátenie
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                {isMobile ? 'Pridať' : 'Nový prenájom'}
              </Button>
              {/* CSV tlačidlá - len na desktope */}
              {!isMobile && (
                <>
                  <Button 
                    variant="outlined" 
                    color="info" 
                    startIcon={<ExportIcon />}
                    onClick={() => exportRentalsToCSV(filteredRentals)}
                    sx={{ ml: 2 }}
                  >
                    Export CSV
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    startIcon={<DownloadIcon />}
                    component="label"
                    sx={{ ml: 1 }}
                  >
                    Import CSV
                    <input type="file" accept=".csv" hidden onChange={handleImportCSV} ref={fileInputRef} />
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Moderné vyhľadávanie a filtre */}
      <Card sx={{ 
        mb: 3, 
        backgroundColor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Hlavný riadok s vyhľadávaním a tlačidlami */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' }, mb: 2 }}>
            {/* Search Input */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: { xs: 'none', md: 1 }, minWidth: { xs: '100%', md: 250 } }}>
              <TextField
                placeholder="Hľadať prenájmy..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.default',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      <SearchIcon fontSize="small" />
                    </Box>
                  )
                }}
              />
            </Box>

            {/* Tlačidlá v riadku na mobile, vedľa seba na desktop */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'row', md: 'row' }, 
              gap: 1, 
              flexWrap: 'wrap',
              justifyContent: { xs: 'space-between', md: 'flex-start' }
            }}>


              {/* 🚀 KOMPAKTNÉ FILTRE - len ikonka */}
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                size="small"
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: showFilters ? 'primary.main' : 'rgba(0,0,0,0.23)',
                  bgcolor: showFilters ? 'primary.main' : 'transparent',
                  color: showFilters ? 'white' : 'inherit',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: showFilters ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <FilterListIcon fontSize="small" />
              </IconButton>

              {/* Reset Button */}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={resetAllFilters}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  px: { xs: 1, md: 2 },
                  '&:hover': {
                    bgcolor: 'error.light',
                    color: 'white',
                    borderColor: 'error.main',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                Reset
              </Button>
            </Box>
          </Box>

          {/* Search results info */}
          {(searchQuery || 
            (Array.isArray(advancedFilters.status) && advancedFilters.status.length > 0) || 
            (Array.isArray(advancedFilters.paymentMethod) && advancedFilters.paymentMethod.length > 0) || 
            (Array.isArray(advancedFilters.company) && advancedFilters.company.length > 0) || 
            advancedFilters.dateFrom || advancedFilters.dateTo || advancedFilters.priceMin || advancedFilters.priceMax || 
            (Array.isArray(advancedFilters.protocolStatus) && advancedFilters.protocolStatus.length > 0)) && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Zobrazených: {filteredRentals.length} z {state.rentals?.length || 0} prenájmov
            </Typography>
          )}

          {/* 🚀 RÝCHLE FILTRE - len tie najdôležitejšie */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap', 
            mb: 2,
            alignItems: 'center'
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Rýchle filtre:
              {/* Počet označených filtrov */}
              {(() => {
                const totalSelected = 
                  (Array.isArray(advancedFilters.paymentMethod) ? advancedFilters.paymentMethod.length : 0) +
                  (Array.isArray(advancedFilters.status) ? advancedFilters.status.length : 0) +
                  (Array.isArray(advancedFilters.protocolStatus) ? advancedFilters.protocolStatus.length : 0);
                return totalSelected > 0 ? (
                  <Chip 
                    label={totalSelected} 
                    size="small" 
                    color="primary" 
                    variant="filled"
                    sx={{ 
                      ml: 1, 
                      height: 20, 
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }} 
                  />
                ) : null;
              })()}
            </Typography>
            
            {/* Spôsob platby */}
            {uniquePaymentMethods.slice(0, 3).map(method => {
              const getPaymentMethodLabel = (method: string) => {
                switch(method) {
                  case 'cash': return 'Hotovosť';
                  case 'bank_transfer': return 'Bankový prevod';
                  case 'direct_to_owner': return 'Priamo majiteľovi';
                  case 'card': return 'Kartou';
                  case 'crypto': return 'Kryptomeny';
                  default: return method;
                }
              };
              
              return (
                <Chip
                  key={method}
                  label={getPaymentMethodLabel(method)}
                  size="small"
                  variant={isFilterValueSelected('paymentMethod', method) ? 'filled' : 'outlined'}
                  color={isFilterValueSelected('paymentMethod', method) ? 'primary' : 'default'}
                  onClick={() => toggleFilterValue('paymentMethod', method)}
                  sx={{ 
                    borderRadius: 2,
                    '&:hover': { transform: 'translateY(-1px)' },
                    transition: 'all 0.2s ease',
                    // Výrazné zvýraznenie označených filtrov
                    ...(isFilterValueSelected('paymentMethod', method) && {
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                      border: '2px solid',
                      borderColor: 'primary.main'
                    })
                  }}
                />
              );
            })}

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Stav prenájmu */}
            <Chip
              label="Aktívne"
              size="small"
              variant={isFilterValueSelected('status', 'active') ? 'filled' : 'outlined'}
              color={isFilterValueSelected('status', 'active') ? 'success' : 'default'}
              onClick={() => toggleFilterValue('status', 'active')}
              sx={{ 
                borderRadius: 2,
                '&:hover': { transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
                // Výrazné zvýraznenie označených filtrov
                ...(isFilterValueSelected('status', 'active') && {
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                  border: '2px solid',
                  borderColor: 'success.main'
                })
              }}
            />
            <Chip
              label="Čakajúci"
              size="small"
              variant={isFilterValueSelected('status', 'pending') ? 'filled' : 'outlined'}
              color={isFilterValueSelected('status', 'pending') ? 'warning' : 'default'}
              onClick={() => toggleFilterValue('status', 'pending')}
              sx={{ 
                borderRadius: 2,
                '&:hover': { transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
                // Výrazné zvýraznenie označených filtrov
                ...(isFilterValueSelected('status', 'pending') && {
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(237, 108, 2, 0.3)',
                  border: '2px solid',
                  borderColor: 'warning.main'
                })
              }}
            />
            <Chip
              label="Ukončené"
              size="small"
              variant={isFilterValueSelected('status', 'completed') ? 'filled' : 'outlined'}
              color={isFilterValueSelected('status', 'completed') ? 'info' : 'default'}
              onClick={() => toggleFilterValue('status', 'completed')}
              sx={{ 
                borderRadius: 2,
                '&:hover': { transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
                // Výrazné zvýraznenie označených filtrov
                ...(isFilterValueSelected('status', 'completed') && {
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(2, 136, 209, 0.3)',
                  border: '2px solid',
                  borderColor: 'info.main'
                })
              }}
            />

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Stavy protokolov */}
            <Chip
              label="Bez protokolu"
              size="small"
              variant={isFilterValueSelected('protocolStatus', 'none') ? 'filled' : 'outlined'}
              color={isFilterValueSelected('protocolStatus', 'none') ? 'warning' : 'default'}
              onClick={() => toggleFilterValue('protocolStatus', 'none')}
              sx={{ 
                borderRadius: 2,
                '&:hover': { transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
                // Výrazné zvýraznenie označených filtrov
                ...(isFilterValueSelected('protocolStatus', 'none') && {
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(237, 108, 2, 0.3)',
                  border: '2px solid',
                  borderColor: 'warning.main'
                })
              }}
            />
            <Chip
              label="Kompletné"
              size="small"
              variant={isFilterValueSelected('protocolStatus', 'complete') ? 'filled' : 'outlined'}
              color={isFilterValueSelected('protocolStatus', 'complete') ? 'success' : 'default'}
              onClick={() => toggleFilterValue('protocolStatus', 'complete')}
              sx={{ 
                borderRadius: 2,
                '&:hover': { transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
                // Výrazné zvýraznenie označených filtrov
                ...(isFilterValueSelected('protocolStatus', 'complete') && {
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                  border: '2px solid',
                  borderColor: 'success.main'
                })
              }}
            />
          </Box>

          {/* Pokročilé filtre */}
          <Collapse in={showFilters}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" />
                Filtre
              </Typography>
              
              <Grid container spacing={3}>
                {/* Spôsob platby */}
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Spôsob platby</InputLabel>
                    <Select
                      multiple
                      value={Array.isArray(advancedFilters.paymentMethod) ? advancedFilters.paymentMethod : []}
                      onChange={(e) => handleAdvancedFiltersChange({ 
                        ...advancedFilters, 
                        paymentMethod: Array.isArray(e.target.value) ? e.target.value : [e.target.value]
                      })}
                      label="Spôsob platby"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const getPaymentMethodLabel = (method: string) => {
                              switch(method) {
                                case 'cash': return 'Hotovosť';
                                case 'bank_transfer': return 'Bankový prevod';
                                case 'direct_to_owner': return 'Priamo majiteľovi';
                                case 'card': return 'Kartou';
                                case 'crypto': return 'Kryptomeny';
                                default: return method;
                              }
                            };
                            return (
                              <Chip key={value} label={getPaymentMethodLabel(value)} size="small" />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {uniquePaymentMethods.map(method => {
                        const getPaymentMethodLabel = (method: string) => {
                          switch(method) {
                            case 'cash': return 'Hotovosť';
                            case 'bank_transfer': return 'Bankový prevod';
                            case 'direct_to_owner': return 'Priamo majiteľovi';
                            case 'card': return 'Kartou';
                            case 'crypto': return 'Kryptomeny';
                            default: return method;
                          }
                        };
                        return (
                          <MenuItem key={method} value={method}>
                            <Checkbox checked={isFilterValueSelected('paymentMethod', method)} />
                            {getPaymentMethodLabel(method)}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Stavy protokolov */}
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Stav protokolov</InputLabel>
                    <Select
                      multiple
                      value={Array.isArray(advancedFilters.protocolStatus) ? advancedFilters.protocolStatus : []}
                      onChange={(e) => handleAdvancedFiltersChange({ 
                        ...advancedFilters, 
                        protocolStatus: Array.isArray(e.target.value) ? e.target.value : [e.target.value]
                      })}
                      label="Stav protokolov"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const getStatusLabel = (status: string) => {
                              switch(status) {
                                case 'none': return 'Bez protokolu';
                                case 'partial': return 'Čiastočné';
                                case 'complete': return 'Kompletné';
                                default: return status;
                              }
                            };
                            return (
                              <Chip key={value} label={getStatusLabel(value)} size="small" />
                            );
                          })}
                        </Box>
                      )}
                    >
                      <MenuItem value="none">
                        <Checkbox checked={isFilterValueSelected('protocolStatus', 'none')} />
                        Bez protokolu
                      </MenuItem>
                      <MenuItem value="partial">
                        <Checkbox checked={isFilterValueSelected('protocolStatus', 'partial')} />
                        Čiastočné
                      </MenuItem>
                      <MenuItem value="complete">
                        <Checkbox checked={isFilterValueSelected('protocolStatus', 'complete')} />
                        Kompletné
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Firma */}
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Firma</InputLabel>
                    <Select
                      multiple
                      value={Array.isArray(advancedFilters.company) ? advancedFilters.company : []}
                      onChange={(e) => handleAdvancedFiltersChange({ 
                        ...advancedFilters, 
                        company: Array.isArray(e.target.value) ? e.target.value : [e.target.value]
                      })}
                      label="Firma"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {uniqueCompanies.map(company => (
                        <MenuItem key={company} value={company}>
                          <Checkbox checked={isFilterValueSelected('company', company)} />
                          {company}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Stav prenájmu */}
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Stav prenájmu</InputLabel>
                    <Select
                      multiple
                      value={Array.isArray(advancedFilters.status) ? advancedFilters.status : []}
                      onChange={(e) => handleAdvancedFiltersChange({ 
                        ...advancedFilters, 
                        status: Array.isArray(e.target.value) ? e.target.value : [e.target.value]
                      })}
                      label="Stav prenájmu"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const getStatusLabel = (status: string) => {
                              switch(status) {
                                case 'active': return 'Aktívne';
                                case 'pending': return 'Čakajúci';
                                case 'completed': return 'Ukončené';
                                case 'cancelled': return 'Zrušené';
                                default: return status;
                              }
                            };
                            return (
                              <Chip key={value} label={getStatusLabel(value)} size="small" />
                            );
                          })}
                        </Box>
                      )}
                    >
                      <MenuItem value="active">
                        <Checkbox checked={isFilterValueSelected('status', 'active')} />
                        Aktívne
                      </MenuItem>
                      <MenuItem value="pending">
                        <Checkbox checked={isFilterValueSelected('status', 'pending')} />
                        Čakajúci
                      </MenuItem>
                      <MenuItem value="completed">
                        <Checkbox checked={isFilterValueSelected('status', 'completed')} />
                        Ukončené
                      </MenuItem>
                      <MenuItem value="cancelled">
                        <Checkbox checked={isFilterValueSelected('status', 'cancelled')} />
                        Zrušené
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Dátum od */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Dátum od"
                    type="date"
                    value={advancedFilters.dateFrom || ''}
                    onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, dateFrom: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Dátum do */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Dátum do"
                    type="date"
                    value={advancedFilters.dateTo || ''}
                    onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, dateTo: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Content based on view mode */}
      {isMobile ? (
        /* MOBILNÝ BOOKING.COM STYLE PRENÁJMY */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Mobilný sticky header */}
            <Box sx={{ 
              display: 'flex',
              borderBottom: '2px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              position: 'sticky',
              top: 0,
              zIndex: 1000
            }}>
              <Box sx={{ 
                width: { xs: 120, sm: 140 },
                maxWidth: { xs: 120, sm: 140 },
                p: { xs: 1, sm: 1.5 },
                borderRight: '2px solid #e0e0e0',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 700, 
                  color: '#1976d2', 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  🚗 Prenájmy
                </Typography>
              </Box>
              <Box sx={{ 
                flex: 1,
                p: { xs: 1, sm: 1.5 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 700, 
                  color: '#666', 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  📅 Detaily & Status
                </Typography>
              </Box>
            </Box>

            {/* 🚀 VIRTUALIZED Mobilné prenájmy rows - pre performance */}
            <Box ref={isMobile ? rentalListRef : undefined} sx={{ height: 600, width: '100%' }}>
              <List
                height={600}
                width="100%"
                itemCount={filteredRentals.length}
                itemSize={160}
                itemData={filteredRentals}
                onScroll={({ scrollOffset }) => {
                  // 🎯 Track scroll position for mobile virtualized list
                  if (isMobile && rentalListRef.current) {
                    const scrollPercentage = scrollOffset / (filteredRentals.length * 160 - 600);
                    if (process.env.NODE_ENV === 'development') {
                      console.log(`📱 Mobile List scroll: ${Math.round(scrollPercentage * 100)}%`);
                    }
                  }
                  // Call the infinite scroll handler
                  if ((window as any).__rentalListScrollHandler) {
                    (window as any).__rentalListScrollHandler({ scrollOffset });
                  }
                }}
              >
                {VirtualizedRentalRow}
              </List>
            </Box>
            
            {/* FALLBACK: Tradičný rendering pre debug */}
            <Box sx={{ display: 'none' }}>
              {filteredRentals.slice(0, 5).map((rental, index) => {
                const vehicle = getVehicleByRental(rental);
                
                // 🔄 NOVÉ: Detekcia flexibilného prenájmu
                const isFlexible = rental.isFlexible || false;
                
                // ⚡ BACKGROUND PROTOCOL STATUS - použije background loaded data alebo fallback na starý systém
                const backgroundStatus = protocolStatusMap[rental.id];
                const fallbackProtocols = protocols[rental.id];
                
                const hasHandover = backgroundStatus 
                  ? backgroundStatus.hasHandoverProtocol 
                  : !!fallbackProtocols?.handover;
                const hasReturn = backgroundStatus 
                  ? backgroundStatus.hasReturnProtocol 
                  : !!fallbackProtocols?.return;
                
                return (
                                     <Box 
                     key={rental.id}
                     sx={{ 
                       display: 'flex',
                       borderBottom: index < filteredRentals.length - 1 ? '1px solid #e0e0e0' : 'none',
                       '&:hover': { backgroundColor: isFlexible ? '#fff3e0' : '#f8f9fa' },
                       minHeight: 80,
                       cursor: 'pointer',
                       // 🔄 NOVÉ: Štýlovanie pre flexibilné prenájmy
                       backgroundColor: isFlexible ? '#fff8f0' : 'transparent',
                       borderLeft: isFlexible ? '4px solid #ff9800' : 'none',
                       position: 'relative'
                     }}
                     onClick={() => handleEdit(rental)}
                   >
                    {/* Vozidlo info - sticky left - RESPONSIVE */}
                    <Box sx={{ 
                      width: { xs: 120, sm: 140 },
                      maxWidth: { xs: 120, sm: 140 },
                      p: { xs: 1, sm: 1.5 },
                      borderRight: '2px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      overflow: 'hidden'
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        color: '#1976d2',
                        lineHeight: 1.2,
                        wordWrap: 'break-word',
                        mb: { xs: 0.25, sm: 0.5 }
                      }}>
                        {vehicle?.brand} {vehicle?.model}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        mb: { xs: 0.25, sm: 0.5 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {vehicle?.licensePlate}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip
                          size="small"
                          label={rental.status === 'active' ? 'AKTÍVNY' : 
                                 rental.status === 'finished' ? 'DOKONČENÝ' : 
                                 rental.status === 'pending' ? 'ČAKAJÚCI' : 'NOVÝ'}
                          sx={{
                            height: { xs: 18, sm: 20 },
                            fontSize: { xs: '0.55rem', sm: '0.6rem' },
                            bgcolor: rental.status === 'active' ? '#4caf50' :
                                    rental.status === 'finished' ? '#2196f3' :
                                    rental.status === 'pending' ? '#ff9800' : '#666',
                            color: 'white',
                            fontWeight: 700,
                            minWidth: 'auto',
                            maxWidth: '100%',
                            overflow: 'hidden'
                          }}
                        />
                        {/* 🔄 NOVÉ: Flexibilný prenájom indikátor */}
                        {isFlexible && (
                          <Chip
                            size="small"
                            label="FLEXIBILNÝ"
                            sx={{
                              height: { xs: 16, sm: 18 },
                              fontSize: { xs: '0.5rem', sm: '0.55rem' },
                              bgcolor: '#ff9800',
                              color: 'white',
                              fontWeight: 700,
                              minWidth: 'auto',
                              maxWidth: '100%',
                              overflow: 'hidden'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {/* Detaily prenájmu - scrollable right - RESPONSIVE */}
                    <Box sx={{ 
                      flex: 1,
                      p: { xs: 1, sm: 1.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      minWidth: 0 // Allow shrinking
                    }}>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          color: '#333',
                          mb: { xs: 0.25, sm: 0.5 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          👤 {rental.customerName}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#666',
                          fontSize: { xs: '0.6rem', sm: '0.65rem' },
                          display: 'block',
                          mb: { xs: 0.25, sm: 0.5 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          📅 {format(new Date(rental.startDate), 'd.M.yy')} - {format(new Date(rental.endDate), 'd.M.yy')}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#4caf50',
                          fontSize: { xs: '0.65rem', sm: '0.7rem' },
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          💰 {rental.totalPrice?.toFixed(2)}€
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 0.25, sm: 0.5 }, 
                        mt: { xs: 0.5, sm: 1 }, 
                        justifyContent: 'flex-start',
                        flexWrap: 'wrap'
                      }}>
                        <Fade in timeout={600}>
                          <Chip
                            size="small"
                            label="🚗→"
                            title={hasHandover ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasHandover) {
                                // Open handover protocol menu only if exists
                                handleOpenProtocolMenu(rental, 'handover');
                              }
                              // Do nothing if protocol doesn't exist
                            }}
                            sx={{
                              height: { xs: 32, sm: 28 },
                              fontSize: { xs: '0.8rem', sm: '0.75rem' },
                              bgcolor: hasHandover ? '#4caf50' : '#ccc',
                              color: 'white',
                              fontWeight: 700,
                              minWidth: { xs: 44, sm: 42 },
                              maxWidth: { xs: 60, sm: 60 },
                              cursor: hasHandover ? 'pointer' : 'default',
                              borderRadius: { xs: 2, sm: 2.5 },
                              boxShadow: hasHandover ? '0 2px 8px rgba(76,175,80,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                              transform: hasHandover ? 'scale(1)' : 'scale(0.95)',
                              opacity: hasHandover ? 1 : 0.7,
                              '&:hover': hasHandover ? {
                                bgcolor: '#388e3c',
                                transform: 'scale(1.1)',
                                boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                                animation: 'bounce 0.6s ease'
                              } : {
                                transform: 'scale(0.98)',
                                opacity: 0.8
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '@keyframes bounce': {
                                '0%, 20%, 60%, 100%': { transform: 'scale(1.1)' },
                                '40%': { transform: 'scale(1.15)' },
                                '80%': { transform: 'scale(1.05)' }
                              }
                            }}
                          />
                        </Fade>
                        <Fade in timeout={800}>
                          <Chip
                            size="small"
                            label="←🚗"
                            title={hasReturn ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasReturn) {
                                // Open return protocol menu only if exists
                                handleOpenProtocolMenu(rental, 'return');
                              }
                              // Do nothing if protocol doesn't exist
                            }}
                            sx={{
                              height: { xs: 32, sm: 28 },
                              fontSize: { xs: '0.8rem', sm: '0.75rem' },
                              bgcolor: hasReturn ? '#4caf50' : '#ccc',
                              color: 'white',
                              fontWeight: 700,
                              minWidth: { xs: 44, sm: 42 },
                              maxWidth: { xs: 60, sm: 60 },
                              cursor: hasReturn ? 'pointer' : 'default',
                              borderRadius: { xs: 2, sm: 2.5 },
                              boxShadow: hasReturn ? '0 2px 8px rgba(76,175,80,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                              transform: hasReturn ? 'scale(1)' : 'scale(0.95)',
                              opacity: hasReturn ? 1 : 0.7,
                              '&:hover': hasReturn ? {
                                bgcolor: '#388e3c',
                                transform: 'scale(1.1)',
                                boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                                animation: 'bounce 0.6s ease'
                              } : {
                                transform: 'scale(0.98)',
                                opacity: 0.8
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '@keyframes bounce': {
                                '0%, 20%, 60%, 100%': { transform: 'scale(1.1)' },
                                '40%': { transform: 'scale(1.15)' },
                                '80%': { transform: 'scale(1.05)' }
                              }
                            }}
                          />
                        </Fade>
                        {/* ⚡ SMART PROTOCOL CHECK BUTTON - zobrazuje sa len ak je potrebné */}
                        {isLoadingProtocolStatus ? (
                          <Chip
                            size="small"
                            label="⏳"
                            title="Načítavam protocol status..."
                            sx={{
                              height: { xs: 32, sm: 28 },
                              fontSize: { xs: '0.8rem', sm: '0.75rem' },
                              bgcolor: '#ff9800',
                              color: 'white',
                              fontWeight: 700,
                              minWidth: { xs: 44, sm: 42 },
                              maxWidth: { xs: 60, sm: 60 },
                              borderRadius: { xs: 2, sm: 2.5 },
                              boxShadow: '0 2px 8px rgba(255,152,0,0.3)',
                              animation: 'pulse 2s infinite'
                            }}
                          />
                        ) : (
                          !protocolStatusLoaded && (
                            <Chip
                              size="small"
                              label="🔍"
                              title="Skontrolovať protokoly"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckProtocols(rental);
                              }}
                              sx={{
                                height: { xs: 32, sm: 28 },
                                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                                bgcolor: '#9c27b0',
                                color: 'white',
                                fontWeight: 700,
                                minWidth: { xs: 44, sm: 42 },
                                maxWidth: { xs: 60, sm: 60 },
                                cursor: 'pointer',
                                borderRadius: { xs: 2, sm: 2.5 },
                                boxShadow: '0 2px 8px rgba(156,39,176,0.3)',
                                '&:hover': {
                                  bgcolor: '#7b1fa2',
                                  transform: 'scale(1.1)',
                                  boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            />
                          )
                        )}
                        
                        <Chip
                          size="small"
                          label={rental.paid ? '💰' : '⏰'}
                          title={rental.paid ? 'Uhradené' : 'Neuhradené'}
                          sx={{
                            height: { xs: 32, sm: 28 },
                            fontSize: { xs: '0.8rem', sm: '0.75rem' },
                            bgcolor: rental.paid ? '#4caf50' : '#f44336',
                            color: 'white',
                            fontWeight: 700,
                            minWidth: { xs: 44, sm: 42 },
                            maxWidth: { xs: 60, sm: 60 },
                            borderRadius: { xs: 2, sm: 2.5 },
                            boxShadow: rental.paid ? '0 2px 8px rgba(76,175,80,0.3)' : '0 2px 8px rgba(244,67,54,0.3)'
                          }}
                        />
                      </Box>
                      
                      {/* Mobile Action Buttons Row */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 0.5, sm: 0.75 }, 
                        mt: { xs: 1, sm: 1.5 }, 
                        justifyContent: 'flex-start',
                        flexWrap: 'wrap'
                      }}>
                        {/* Edit Rental Button */}
                        <IconButton
                          size="small"
                          title="Upraviť prenájom"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(rental);
                          }}
                          sx={{ 
                            bgcolor: '#2196f3', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: '#1976d2',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Create/View Handover Protocol Button */}
                        <IconButton
                          size="small"
                          title={hasHandover ? "Zobraziť odovzdávací protokol" : "Vytvoriť odovzdávací protokol"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasHandover) {
                              handleOpenProtocolMenu(rental, 'handover');
                            } else {
                              handleCreateHandover(rental);
                            }
                          }}
                          sx={{ 
                            bgcolor: hasHandover ? '#4caf50' : '#ff9800', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: hasHandover ? '#388e3c' : '#f57c00',
                              transform: 'scale(1.1)',
                              boxShadow: hasHandover ? '0 4px 12px rgba(76,175,80,0.4)' : '0 4px 12px rgba(255,152,0,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <HandoverIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Create/View Return Protocol Button */}
                        <IconButton
                          size="small"
                          title={hasReturn ? "Zobraziť vrátny protokol" : "Vytvoriť vrátny protokol"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasReturn) {
                              handleOpenProtocolMenu(rental, 'return');
                            } else {
                              handleCreateReturn(rental);
                            }
                          }}
                          sx={{ 
                            bgcolor: hasReturn ? '#2196f3' : '#4caf50', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: hasReturn ? '#1976d2' : '#388e3c',
                              transform: 'scale(1.1)',
                              boxShadow: hasReturn ? '0 4px 12px rgba(33,150,243,0.4)' : '0 4px 12px rgba(76,175,80,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <ReturnIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Delete Rental Button */}
                        <IconButton
                          size="small"
                          title="Zmazať prenájom"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(rental.id);
                          }}
                          sx={{ 
                            bgcolor: '#f44336', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: '#d32f2f',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            
            {/* END OF FALLBACK - original mobile rendering disabled */}
          </CardContent>
        </Card>
      ) : (
        /* DESKTOP BOOKING.COM STYLE PRENÁJMY */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Desktop sticky header */}
            <Box sx={{ 
              display: 'flex',
              borderBottom: '3px solid #e0e0e0',
              backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              background: '#f8f9fa',
              position: 'sticky',
              top: 0,
              zIndex: 1000
            }}>
              <Box sx={{ 
                width: 260,
                maxWidth: 260,
                p: 2,
                borderRight: '2px solid #e0e0e0',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1rem' }}>
                  🚗 Vozidlo & Status
                </Typography>
              </Box>
              <Box sx={{ 
                width: 180,
                maxWidth: 180,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  👤 Zákazník
                </Typography>
              </Box>
              <Box sx={{ 
                width: 160,
                maxWidth: 160,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  📅 Obdobie
                </Typography>
              </Box>
              <Box sx={{ 
                width: 120,
                maxWidth: 120,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  💰 Cena
                </Typography>
              </Box>
              <Box sx={{ 
                width: 140,
                maxWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  📋 Protokoly
                </Typography>
              </Box>
              <Box sx={{ 
                width: 180,
                maxWidth: 180,
                p: 2,
                textAlign: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  ⚡ Akcie
                </Typography>
              </Box>
            </Box>

            {/* Desktop prenájmy rows */}
            <Box 
              ref={rentalListRef}
              sx={{ 
                maxHeight: 'calc(100vh - 400px)', // Adjust based on header/filter height
                overflowY: 'auto',
                overflowX: 'hidden',
                position: 'relative',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}
            >
              {filteredRentals.map((rental, index) => {
                const vehicle = getVehicleByRental(rental);
                
                // 🔄 NOVÉ: Detekcia flexibilného prenájmu
                const isFlexible = rental.isFlexible || false;
                
                // ⚡ BACKGROUND PROTOCOL STATUS - použije background loaded data alebo fallback na starý systém
                const backgroundStatus = protocolStatusMap[rental.id];
                const fallbackProtocols = protocols[rental.id];
                
                const hasHandover = backgroundStatus 
                  ? backgroundStatus.hasHandoverProtocol 
                  : !!fallbackProtocols?.handover;
                const hasReturn = backgroundStatus 
                  ? backgroundStatus.hasReturnProtocol 
                  : !!fallbackProtocols?.return;
                
                return (
                  <Box 
                    key={rental.id}
                    data-rental-item={`rental-${index}`} // 🎯 For item-based infinite scroll
                    sx={{ 
                      display: 'flex',
                      borderBottom: index < filteredRentals.length - 1 ? '1px solid #e0e0e0' : 'none',
                      '&:hover': { 
                        backgroundColor: isFlexible ? '#fff3e0' : '#f8f9fa',
                        transform: 'scale(1.002)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      },
                      minHeight: 80,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      // 🔄 NOVÉ: Štýlovanie pre flexibilné prenájmy
                      backgroundColor: isFlexible ? '#fff8f0' : 'transparent',
                      borderLeft: isFlexible ? '4px solid #ff9800' : 'none',
                      position: 'relative'
                    }}
                    onClick={() => handleEdit(rental)}
                  >
                    {/* Vozidlo & Status - sticky left - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 260, // FIXED WIDTH instead of minWidth
                      maxWidth: 260,
                      p: 2,
                      borderRight: '2px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                      overflow: 'hidden' // Prevent overflow
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        fontSize: '1rem',
                        color: '#1976d2',
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2
                      }}>
                        {vehicle?.brand} {vehicle?.model}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#666',
                        fontSize: '0.8rem',
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📋 {vehicle?.licensePlate} • 🏢 {vehicle?.company}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                        <Chip
                          size="small"
                          label={rental.status === 'active' ? 'AKTÍVNY' : 
                                 rental.status === 'finished' ? 'DOKONČENÝ' : 
                                 rental.status === 'pending' ? 'ČAKAJÚCI' : 'NOVÝ'}
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            bgcolor: rental.status === 'active' ? '#4caf50' :
                                    rental.status === 'finished' ? '#2196f3' :
                                    rental.status === 'pending' ? '#ff9800' : '#666',
                            color: 'white',
                            fontWeight: 700
                          }}
                        />
                        {/* 🔄 NOVÉ: Flexibilný prenájom indikátor */}
                        {isFlexible && (
                          <Chip
                            size="small"
                            label="FLEXIBILNÝ"
                            sx={{
                              height: 22,
                              fontSize: '0.65rem',
                              bgcolor: '#ff9800',
                              color: 'white',
                              fontWeight: 700
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {/* Zákazník - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 180,
                      maxWidth: 180,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'left',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: '#333',
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        👤 {rental.customerName}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📧 {rental.customerEmail || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Obdobie - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 160,
                      maxWidth: 160,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#333',
                        mb: 0.5
                      }}>
                        📅 {format(new Date(rental.startDate), 'd.M.yyyy')}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.7rem',
                        mb: 0.5
                      }}>
                        ↓
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#333'
                      }}>
                        📅 {format(new Date(rental.endDate), 'd.M.yyyy')}
                      </Typography>
                    </Box>

                    {/* Cena - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 120,
                      maxWidth: 120,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: '#4caf50',
                        mb: 0.5
                      }}>
                        {rental.totalPrice?.toFixed(2)}€
                      </Typography>
                      <Chip
                        size="small"
                        label={rental.paid ? 'UHRADENÉ' : 'NEUHRADENÉ'}
                        sx={{
                          height: 20,
                          fontSize: '0.6rem',
                          bgcolor: rental.paid ? '#4caf50' : '#f44336',
                          color: 'white',
                          fontWeight: 700
                        }}
                      />
                    </Box>

                    {/* Protokoly - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 140,
                      maxWidth: 140,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 1.5,
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Fade in timeout={600}>
                          <Chip
                            size="small"
                            label="🚗→"
                            title={hasHandover ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasHandover) {
                                handleOpenProtocolMenu(rental, 'handover');
                              }
                              // Do nothing if protocol doesn't exist
                            }}
                            sx={{
                              height: 28,
                              width: 42,
                              fontSize: '0.8rem',
                              bgcolor: hasHandover ? '#4caf50' : '#ccc',
                              color: 'white',
                              fontWeight: 700,
                              cursor: hasHandover ? 'pointer' : 'default',
                              transform: hasHandover ? 'scale(1)' : 'scale(0.95)',
                              opacity: hasHandover ? 1 : 0.7,
                              '&:hover': hasHandover ? {
                                bgcolor: '#388e3c',
                                transform: 'scale(1.15)',
                                boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                                animation: 'pulse 0.8s ease'
                              } : {
                                transform: 'scale(0.98)',
                                opacity: 0.8
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '@keyframes pulse': {
                                '0%': { transform: 'scale(1.15)' },
                                '50%': { transform: 'scale(1.25)' },
                                '100%': { transform: 'scale(1.15)' }
                              }
                            }}
                          />
                        </Fade>
                        <Fade in timeout={800}>
                          <Chip
                            size="small"
                            label="←🚗"
                            title={hasReturn ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasReturn) {
                                handleOpenProtocolMenu(rental, 'return');
                              }
                              // Do nothing if protocol doesn't exist
                            }}
                            sx={{
                              height: 28,
                              width: 42,
                              fontSize: '0.8rem',
                              bgcolor: hasReturn ? '#4caf50' : '#ccc',
                              color: 'white',
                              fontWeight: 700,
                              cursor: hasReturn ? 'pointer' : 'default',
                              transform: hasReturn ? 'scale(1)' : 'scale(0.95)',
                              opacity: hasReturn ? 1 : 0.7,
                              '&:hover': hasReturn ? {
                                bgcolor: '#388e3c',
                                transform: 'scale(1.15)',
                                boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                                animation: 'pulse 0.8s ease'
                              } : {
                                transform: 'scale(0.98)',
                                opacity: 0.8
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '@keyframes pulse': {
                                '0%': { transform: 'scale(1.15)' },
                                '50%': { transform: 'scale(1.25)' },
                                '100%': { transform: 'scale(1.15)' }
                              }
                            }}
                          />
                        </Fade>
                      </Box>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.7rem',
                        textAlign: 'center'
                      }}>
                        {hasHandover && hasReturn ? '✅ Kompletné' : 
                         hasHandover ? '🚗→ Odovzdané' : 
                         hasReturn ? '←🚗 Vrátené' : '⏳ Čaká'}
                      </Typography>
                      
                      {/* Protocol Check Button - in protocols column */}
                      {isLoadingProtocolStatus ? (
                        <IconButton
                          size="small"
                          title="Načítavam protocol status..."
                          disabled
                          sx={{ 
                            bgcolor: '#ff9800', 
                            color: 'white',
                            width: 28,
                            height: 28,
                            mt: 0.5,
                            animation: 'pulse 2s infinite'
                          }}
                        >
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      ) : (!protocolStatusLoaded && (
                        <IconButton
                          size="small"
                          title="Skontrolovať protokoly"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckProtocols(rental);
                          }}
                          sx={{ 
                            bgcolor: '#9c27b0', 
                            color: 'white',
                            width: 28,
                            height: 28,
                            mt: 0.5,
                            '&:hover': { 
                              bgcolor: '#7b1fa2',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      ))}
                    </Box>

                    {/* Akcie */}
                    <Box sx={{ 
                      width: 180,
                      maxWidth: 180,
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 1.5,
                      flexWrap: 'wrap'
                    }}>
                      <IconButton
                        size="medium"
                        title="Upraviť prenájom"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(rental);
                        }}
                        sx={{ 
                          ...mobileStyles.touchTarget,
                          bgcolor: '#2196f3', 
                          color: 'white', 
                          minWidth: TOUCH_TARGETS.COMFORTABLE,
                          minHeight: TOUCH_TARGETS.COMFORTABLE,
                          '&:hover': { 
                            bgcolor: '#1976d2',
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                          },
                          '&:active': {
                            transform: 'scale(0.95)',
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="medium"
                        title={hasHandover ? "Zobraziť odovzdávací protokol" : "Vytvoriť odovzdávací protokol"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasHandover) {
                            handleOpenProtocolMenu(rental, 'handover');
                          } else {
                            handleCreateHandover(rental);
                          }
                        }}
                        sx={{ 
                          ...mobileStyles.touchTarget,
                          bgcolor: hasHandover ? '#4caf50' : '#ff9800', 
                          color: 'white',
                          minWidth: TOUCH_TARGETS.COMFORTABLE,
                          minHeight: TOUCH_TARGETS.COMFORTABLE,
                          '&:hover': { 
                            bgcolor: hasHandover ? '#388e3c' : '#f57c00',
                            transform: 'scale(1.05)',
                            boxShadow: hasHandover ? '0 4px 12px rgba(76,175,80,0.4)' : '0 4px 12px rgba(255,152,0,0.4)'
                          },
                          '&:active': {
                            transform: 'scale(0.95)',
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <HandoverIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title={hasReturn ? "Zobraziť vrátny protokol" : "Vytvoriť vrátny protokol"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasReturn) {
                            handleOpenProtocolMenu(rental, 'return');
                          } else {
                            handleCreateReturn(rental);
                          }
                        }}
                        sx={{ 
                          bgcolor: hasReturn ? '#2196f3' : '#4caf50', 
                          color: 'white',
                          width: 36,
                          height: 36,
                          '&:hover': { 
                            bgcolor: hasReturn ? '#1976d2' : '#388e3c',
                            transform: 'scale(1.1)',
                            boxShadow: hasReturn ? '0 4px 12px rgba(33,150,243,0.4)' : '0 4px 12px rgba(76,175,80,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ReturnIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Zmazať prenájom"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(rental.id);
                        }}
                        sx={{ 
                          bgcolor: '#f44336', 
                          color: 'white',
                          width: 36,
                          height: 36,
                          '&:hover': { 
                            bgcolor: '#d32f2f',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Rental Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRental ? 'Upraviť prenájom' : 'Nový prenájom'}
        </DialogTitle>
        <DialogContent>
          <RentalForm
            rental={editingRental}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Handover Protocol Dialog */}
      <Dialog
        open={openHandoverDialog}
        onClose={() => {
          console.log('🚨 MOBILE DEBUG: Dialog onClose triggered!');
          console.log('🚨 MOBILE DEBUG: Modal closing via backdrop click or ESC');
          console.log('🚨 MOBILE DEBUG: timestamp:', new Date().toISOString());
          
          // Temporary alert for mobile debugging
          alert('🚨 MOBILE DEBUG: Dialog zatvorený! Dôvod: backdrop click alebo ESC key');
          
          // logMobile('WARN', 'RentalList', 'Handover modal closing via Dialog onClose', {
          //   timestamp: Date.now(),
          //   selectedRentalId: selectedRentalForProtocol?.id,
          //   reason: 'dialog_onClose'
          // });
          setOpenHandoverDialog(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Odovzdávací protokol</DialogTitle>
        <DialogContent>
          {selectedRentalForProtocol && (
            <React.Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Načítavam protokol...</Typography>
              </Box>
            }>
              <HandoverProtocolForm
                open={openHandoverDialog}
                rental={selectedRentalForProtocol}
                onSave={handleSaveHandover}
                onClose={() => {
                console.log('🚨 MOBILE DEBUG: HandoverProtocolForm onClose triggered!');
                console.log('🚨 MOBILE DEBUG: Modal closing via form close button');
                console.log('🚨 MOBILE DEBUG: timestamp:', new Date().toISOString());
                
                // logMobile('WARN', 'RentalList', 'Handover modal closing via HandoverProtocolForm onClose', {
                //   timestamp: Date.now(),
                //   selectedRentalId: selectedRentalForProtocol?.id,
                //   reason: 'form_onClose'
                // });
                setOpenHandoverDialog(false);
              }}
            />
            </React.Suspense>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Protocol Dialog */}
      <Dialog
        open={openReturnDialog}
        onClose={() => setOpenReturnDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Vrátny protokol</DialogTitle>
        <DialogContent>
          {selectedRentalForProtocol && (
            <ReturnProtocolForm
              open={openReturnDialog}
              onClose={() => setOpenReturnDialog(false)}
              rental={selectedRentalForProtocol}
              handoverProtocol={protocols[selectedRentalForProtocol.id]?.handover}
              onSave={handleSaveReturn}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer */}
      {selectedPdf && (
        <PDFViewer
          open={pdfViewerOpen}
          onClose={handleClosePDF}
          protocolId={selectedPdf.url}
          protocolType={selectedPdf.type}
          title={selectedPdf.title}
        />
      )}

      {/* New Protocol Gallery */}
      <ProtocolGallery
        open={galleryOpen}
        onClose={handleCloseGallery}
        images={galleryImages}
        videos={galleryVideos}
        title={galleryTitle}
      />

      {/* Protocol Menu Dialog */}
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
          {selectedProtocolType === 'handover' ? 'Odovzdávací protokol' : 'Vrátny protokol'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<PDFIcon />}
              onClick={handleDownloadPDF}
              sx={{ 
                bgcolor: '#f44336',
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(244,67,54,0.3)',
                '&:hover': {
                  bgcolor: '#d32f2f',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(244,67,54,0.4)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              📄 Stiahnuť PDF protokol
            </Button>
            
            <Button
              fullWidth
              variant="contained"
              startIcon={<GalleryIcon />}
              onClick={handleViewGallery}
              sx={{ 
                bgcolor: '#2196f3',
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(33,150,243,0.3)',
                '&:hover': {
                  bgcolor: '#1976d2',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(33,150,243,0.4)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              🖼️ Zobraziť fotky
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseProtocolMenu}
              sx={{ 
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '0.875rem' },
                fontWeight: 500,
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'rgba(0,0,0,0.04)'
                }
              }}
            >
              Zavrieť
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Button 
            variant="contained" 
            onClick={loadMore}
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