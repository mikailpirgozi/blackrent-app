import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Collapse,
  Tabs,
  Tab,
  Divider,
  Dialog,
  useTheme,
  useMediaQuery,
  Stack,
  Fab,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
// Using HTML5 date inputs instead of MUI date pickers for simplicity
import {
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  CheckCircle as AvailableIcon,
  Cancel as RentedIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  Close as CloseIcon,
  Person as CustomerIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Euro as PriceIcon,
  CalendarMonth as DateIcon,
  LocationOn as LocationIcon,
  Receipt as OrderIcon,
  AccountBalance as DepositIcon,
  Speed as KilometersIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Today as TodayIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { sk } from 'date-fns/locale';
import { API_BASE_URL } from '../../services/api';
import { Rental, VehicleUnavailability, VehicleCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../utils/performance';

// Custom isToday function to avoid hot reload issues
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

interface VehicleAvailability {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  status: 'available' | 'rented' | 'flexible' | 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection';
  rentalId?: string;
  customerName?: string;
  unavailabilityId?: string;
  unavailabilityReason?: string;
  unavailabilityType?: string;
  unavailabilityPriority?: number;
}

interface CalendarDay {
  date: string;
  vehicles: VehicleAvailability[];
}

interface MaintenanceFormData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection';
  notes?: string;
  priority: 1 | 2 | 3;
  recurring: boolean;
}

interface AvailabilityCalendarProps {
  searchQuery?: string;
  isMobile?: boolean;
  selectedCompany?: string;
  // 🚗 MULTI-SELECT CATEGORY FILTER: Array of selected categories  
  categoryFilter?: string | VehicleCategory[]; // Support both single and multi-select
  availableFromDate?: string;
  availableToDate?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ 
  searchQuery: propSearchQuery = '', 
  isMobile: propIsMobile,
  selectedCompany: propSelectedCompany,
  categoryFilter: propCategoryFilter,
  availableFromDate: propAvailableFromDate,
  availableToDate: propAvailableToDate
}) => {
  const { state, getFilteredVehicles } = useApp();
  const { state: authState } = useAuth();
  
  // MOBILNÁ RESPONSIBILITA - používame prop ak je poskytnutý
  const theme = useTheme();
  const fallbackIsMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const isMobile = propIsMobile !== undefined ? propIsMobile : fallbackIsMobile;
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [unavailabilities, setUnavailabilities] = useState<VehicleUnavailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Rental details popup state
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [rentalDetailsOpen, setRentalDetailsOpen] = useState(false);
  const [loadingRentalDetails, setLoadingRentalDetails] = useState(false);
  
  // Maintenance management state
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<VehicleUnavailability | null>(null);
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);
  const [clickedDate, setClickedDate] = useState<string | null>(null);
  const [clickedVehicleId, setClickedVehicleId] = useState<string | null>(null);
  
  const [maintenanceFormData, setMaintenanceFormData] = useState<MaintenanceFormData>({
    vehicleId: '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'maintenance',
    notes: '',
    priority: 2,
    recurring: false,
  });
  
  // View mode: 'navigation' (prev/next months) or 'range' (custom date range)
  const [viewMode, setViewMode] = useState<'navigation' | 'range'>('navigation');
  const [fromDate, setFromDate] = useState<Date | null>(new Date());
  const [toDate, setToDate] = useState<Date | null>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // +30 days
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(propSearchQuery || '');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Update search query when prop changes
  useEffect(() => {
    setSearchQuery(propSearchQuery || '');
  }, [propSearchQuery]);


  const [brandFilter, setBrandFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  
  // Date range availability filter
  const [availableFromDate, setAvailableFromDate] = useState<string>('');
  const [availableToDate, setAvailableToDate] = useState<string>('');
  
  // OPTIMALIZÁCIA: Cache pre availability data
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [cacheKey, setCacheKey] = useState<string>('');
  
  // MOBILNÝ KALENDÁR - vybraný dátum a počet zobrazených dní
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [visibleDays, setVisibleDays] = useState(14);

  // Mobilný kalendár - týždňová navigácia
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  // Mobilný kalendár - mesačná navigácia
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  
  // Mobilný kalendár - prepínanie medzi týždenným a mesačným zobrazením
  const [mobileViewMode, setMobileViewMode] = useState<'week' | 'month'>('week');

  // Individual view modes pre každé vozidlo na desktop
  const [vehicleViewModes, setVehicleViewModes] = useState<Record<string, 'week' | 'month'>>({});
  
  // Individual navigation offsets pre každé vozidlo
  const [vehicleWeekOffsets, setVehicleWeekOffsets] = useState<Record<string, number>>({});
  const [vehicleMonthOffsets, setVehicleMonthOffsets] = useState<Record<string, number>>({});

  // Funkcia na generovanie kalendárnych dní pre neobmedzenú navigáciu
  const generateCalendarDays = (offset: number, daysCount: number) => {
    const startDate = new Date(Date.now() + offset * daysCount * 24 * 60 * 60 * 1000);
    const days = [];
    
    for (let i = 0; i < daysCount; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = format(currentDate, 'yyyy-MM-dd');
      
      // Nájdeme existujúce dáta pre tento dátum alebo vytvoríme prázdne
      const existingDay = categoryFilteredCalendarData.find(day => day.date === dateString);
      
      days.push(existingDay || {
        date: dateString,
        vehicles: [] // Prázdne vozidlá pre budúce dátumy
      });
    }
    
    return days;
  };

  // Helper funkcie pre individuálne vozidlá
  const getVehicleViewMode = (vehicleId: string): 'week' | 'month' => {
    return vehicleViewModes[vehicleId] || mobileViewMode; // Fallback na globálny mode
  };

  const setVehicleViewMode = (vehicleId: string, mode: 'week' | 'month') => {
    setVehicleViewModes(prev => ({ ...prev, [vehicleId]: mode }));
    // Reset offsets pri zmene módu
    setVehicleWeekOffsets(prev => ({ ...prev, [vehicleId]: 0 }));
    setVehicleMonthOffsets(prev => ({ ...prev, [vehicleId]: 0 }));
  };

  const getVehicleOffset = (vehicleId: string, mode: 'week' | 'month'): number => {
    if (mode === 'week') {
      return vehicleWeekOffsets[vehicleId] || currentWeekOffset;
    } else {
      return vehicleMonthOffsets[vehicleId] || currentMonthOffset;
    }
  };

  const setVehicleOffset = (vehicleId: string, mode: 'week' | 'month', offset: number) => {
    if (mode === 'week') {
      setVehicleWeekOffsets(prev => ({ ...prev, [vehicleId]: offset }));
    } else {
      setVehicleMonthOffsets(prev => ({ ...prev, [vehicleId]: offset }));
    }
  };

  // Function to fetch rental details
  const fetchRentalDetails = async (rentalId: string) => {
    try {
      setLoadingRentalDetails(true);
      
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const response = await fetch(`${API_BASE_URL}/rentals/${rentalId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setSelectedRental(data.data);
        setRentalDetailsOpen(true);
      } else {
        console.error('Error fetching rental details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching rental details:', error);
    } finally {
      setLoadingRentalDetails(false);
    }
  };

  // Handle click on status chip - different actions based on status
  const handleStatusClick = (vehicleStatus: VehicleAvailability, date: string) => {
    if ((vehicleStatus.status === 'rented' || vehicleStatus.status === 'flexible') && vehicleStatus.rentalId) {
      // Show rental details for rented and flexible rentals
      fetchRentalDetails(vehicleStatus.rentalId);
    } else if (vehicleStatus.status === 'available') {
      // Add maintenance for available vehicles
      handleCellClick(date, vehicleStatus.vehicleId, vehicleStatus.status);
    } else if (vehicleStatus.unavailabilityId && ['maintenance', 'service', 'repair', 'blocked', 'cleaning', 'inspection'].includes(vehicleStatus.status)) {
      // Edit existing maintenance
      const maintenance = unavailabilities.find(u => u.id === vehicleStatus.unavailabilityId);
      if (maintenance) {
        handleMaintenanceEdit(maintenance);
      }
    }
  };

  // Close rental details dialog
  const handleCloseRentalDetails = () => {
    setRentalDetailsOpen(false);
    setSelectedRental(null);
  };

  // Maintenance management functions
  const fetchUnavailabilities = useCallback(async () => {
    try {
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const response = await fetch(`${API_BASE_URL}/vehicle-unavailability`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      if (data.success) {
        setUnavailabilities(data.data || []);
      } else {
        console.error('Error fetching unavailabilities:', data.error);
      }
    } catch (err) {
      console.error('Error fetching unavailabilities:', err);
    }
  }, []);

  const handleCellClick = useCallback((date: string, vehicleId: string, currentStatus: string) => {
    // Only allow adding maintenance to available vehicles
    if (currentStatus === 'available') {
      setClickedDate(date);
      setClickedVehicleId(vehicleId);
      setMaintenanceFormData({
        vehicleId,
        startDate: date,
        endDate: date,
        reason: '',
        type: 'maintenance',
        notes: '',
        priority: 2,
        recurring: false,
      });
      setEditingMaintenance(null);
      setMaintenanceDialogOpen(true);
    }
  }, []);

  const handleMaintenanceEdit = (unavailability: VehicleUnavailability) => {
    setEditingMaintenance(unavailability);
    setMaintenanceFormData({
      vehicleId: unavailability.vehicleId,
      startDate: format(new Date(unavailability.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(unavailability.endDate), 'yyyy-MM-dd'),
      reason: unavailability.reason,
      type: unavailability.type,
      notes: unavailability.notes || '',
      priority: unavailability.priority,
      recurring: unavailability.recurring,
    });
    setMaintenanceDialogOpen(true);
  };

  const handleMaintenanceClose = useCallback(() => {
    setMaintenanceDialogOpen(false);
    setEditingMaintenance(null);
    setClickedDate(null);
    setClickedVehicleId(null);
    setError(null);
    setSuccess(null);
  }, []);

  const handleMaintenanceSubmit = async () => {
    try {
      setSubmittingMaintenance(true);
      setError(null);

      // Validation
      if (!maintenanceFormData.vehicleId || !maintenanceFormData.startDate || !maintenanceFormData.endDate || !maintenanceFormData.reason.trim()) {
        setError('Všetky povinné polia musia byť vyplnené');
        return;
      }

      if (new Date(maintenanceFormData.endDate) < new Date(maintenanceFormData.startDate)) {
        setError('Dátum ukončenia nemôže byť skorší ako dátum začiatku');
        return;
      }

      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const url = editingMaintenance 
        ? `${API_BASE_URL}/vehicle-unavailability/${editingMaintenance.id}`
        : `${API_BASE_URL}/vehicle-unavailability`;
      
      const method = editingMaintenance ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(maintenanceFormData),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingMaintenance ? 'Nedostupnosť úspešne aktualizovaná' : 'Nedostupnosť úspešne vytvorená');
        await fetchUnavailabilities();
        await fetchCalendarData();
        setTimeout(() => {
          handleMaintenanceClose();
        }, 1500);
      } else {
        setError(data.error || 'Chyba pri ukladaní nedostupnosti');
      }
    } catch (err) {
      console.error('Error saving maintenance:', err);
      setError('Chyba pri ukladaní nedostupnosti');
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  const handleMaintenanceDelete = async (id: string) => {
    if (!window.confirm('Naozaj chcete zmazať túto nedostupnosť?')) {
      return;
    }

    try {
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const response = await fetch(`${API_BASE_URL}/vehicle-unavailability/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Nedostupnosť úspešne zmazaná');
        await fetchUnavailabilities();
        await fetchCalendarData();
      } else {
        setError(data.error || 'Chyba pri mazaní nedostupnosti');
      }
    } catch (err) {
      console.error('Error deleting maintenance:', err);
      setError('Chyba pri mazaní nedostupnosti');
    }
  };

  const fetchCalendarData = useCallback(async (forceMonth = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // 🔧 OPRAVA: Cache validation s kontrolou na hard refresh
      const now = Date.now();
      const currentCacheKey = `${viewMode}-${currentDate.getTime()}-${fromDate?.getTime()}-${toDate?.getTime()}`;
      
      // 🔧 OPRAVA: Nepoužívaj cache pri hard refresh alebo ak nie sú načítané vehicles z AppContext
      const isHardRefresh = !state.vehicles.length || performance.navigation?.type === 1;
      const cacheValid = !isHardRefresh && lastFetchTime && cacheKey === currentCacheKey && (now - lastFetchTime) < 2 * 60 * 1000; // 2 min cache
      
      if (cacheValid && state.vehicles.length > 0) {
        console.log('⚡ Používam cached availability data...');
        setLoading(false);
        return;
      }
      
      // 🔧 OPRAVA: Čakaj na načítanie vehicles z AppContext pri hard refresh
      if (isHardRefresh && !state.vehicles.length) {
        console.log('⏳ Hard refresh detected, čakám na načítanie vehicles z AppContext...');
        // Krátka pauza aby sa AppContext stihol načítať
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Ak stále nie sú načítané vehicles, pokračuj ale bez cache
        if (!state.vehicles.length) {
          console.log('⚠️ Vehicles ešte nie sú načítané z AppContext, pokračujem bez cache...');
        }
      }
      
      console.log('🚀 Fetching fresh availability data...');
      
      // Používame správny API URL podľa prostredia
      let apiUrl = `${API_BASE_URL}/availability/calendar`;
      
      if (viewMode === 'range' && fromDate && toDate) {
        // Custom date range mode
        const startDate = format(fromDate, 'yyyy-MM-dd');
        const endDate = format(toDate, 'yyyy-MM-dd');
        apiUrl += `?startDate=${startDate}&endDate=${endDate}`;
        console.log('🗓️ Fetching calendar data for range:', { startDate, endDate });
      } else {
        // Navigation mode
        const today = new Date();
        const isToday = 
          currentDate.getFullYear() === today.getFullYear() && 
          currentDate.getMonth() === today.getMonth() && 
          currentDate.getDate() === today.getDate();
        
        if (forceMonth || !isToday) {
          // Len ak navigujeme do konkrétneho mesiaca alebo nie je dnes
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
          apiUrl += `?year=${year}&month=${month}`;
          console.log('🗓️ Fetching calendar data for month:', { year, month });
        } else {
          console.log('🗓️ Fetching default calendar data (today + 30 days)');
        }
      }
      
      // Custom fetch pre availability API s timeout
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      // Vytvoríme AbortController pre timeout (5 sekúnd - zvýšené pre lepší výkon)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Calendar data received:', data.data);
        setCalendarData(data.data.calendar || []);
        
        // 🔧 OPRAVA: Získaj vehicles z AppContext, ale len ak sú načítané
        const contextVehicles = getFilteredVehicles();
        if (contextVehicles.length > 0) {
          setVehicles(contextVehicles);
          console.log('✅ Using vehicles from AppContext:', contextVehicles.length);
        } else {
          // Fallback na API vehicles ak AppContext ešte nie je ready
          setVehicles(data.data.vehicles || []);
          console.log('⚠️ Using vehicles from API as fallback:', data.data.vehicles?.length || 0);
        }
        
        setUnavailabilities(data.data.unavailabilities || []);
        
        // OPTIMALIZÁCIA: Update cache len ak nie je hard refresh
        if (!isHardRefresh) {
          setLastFetchTime(now);
          setCacheKey(currentCacheKey);
        }
      } else {
        setError(data.error || 'Chyba pri načítaní dát');
      }
    } catch (err: any) {
      console.error('❌ Calendar fetch error:', err);
      setError('Chyba pri načítaní kalendárnych dát');
      
      // 🔧 OPRAVA: Pri hard refresh nešuraj mock dáta, namiesto toho zobraz chybu
      const contextVehicles = getFilteredVehicles();
      if (contextVehicles.length > 0) {
        setVehicles(contextVehicles);
        console.log('⚠️ API error, ale mám vehicles z AppContext:', contextVehicles.length);
        
        // Vytvor prázdny kalendár namiesto mock dát
        const emptyCalendar = eachDayOfInterval({
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        }).map(date => ({
          date: format(date, 'yyyy-MM-dd'),
          vehicles: contextVehicles.map(vehicle => ({
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            licensePlate: vehicle.licensePlate,
            status: 'available' as const, // Všetky vozidlá označiť ako dostupné kvôli API chybe
            customerName: undefined
          }))
        }));
        setCalendarData(emptyCalendar);
      } else {
        console.log('❌ API error a žiadne vehicles v AppContext');
        setVehicles([]);
        setCalendarData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, fromDate, toDate, getFilteredVehicles]);

  useEffect(() => {
    // 🔧 OPRAVA: Čakaj na načítanie AppContext dát pred fetchovaním calendar data
    if (state?.dataLoaded?.vehicles && authState?.isAuthenticated) {
      if (viewMode === 'navigation') {
        const isCurrentMonth = 
          currentDate.getFullYear() === new Date().getFullYear() && 
          currentDate.getMonth() === new Date().getMonth();
        
        fetchCalendarData(!isCurrentMonth);
      } else {
        // Range mode - fetch when dates change
        fetchCalendarData();
      }
    } else {
      console.log('⏳ Čakám na AppContext dáta pred načítaním kalendára...', {
        vehiclesLoaded: state?.dataLoaded?.vehicles,
        isAuthenticated: authState?.isAuthenticated,
        vehiclesCount: state?.vehicles?.length || 0
      });
    }
  }, [fetchCalendarData, state?.dataLoaded?.vehicles, authState?.isAuthenticated]);

  // Load unavailabilities on component mount
  useEffect(() => {
    fetchUnavailabilities();
  }, [fetchUnavailabilities]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleRefresh = useCallback(() => {
    if (viewMode === 'navigation') {
      const isCurrentMonth = 
        currentDate.getFullYear() === new Date().getFullYear() && 
        currentDate.getMonth() === new Date().getMonth();
      
      fetchCalendarData(!isCurrentMonth);
    } else {
      fetchCalendarData();
    }
  }, [viewMode, currentDate, fetchCalendarData]);

  const handleViewModeChange = useCallback((event: React.SyntheticEvent, newValue: 'navigation' | 'range') => {
    setViewMode(newValue);
  }, []);

  const handleQuickRange = useCallback((days: number) => {
    const today = new Date();
    setFromDate(today);
    setToDate(new Date(today.getTime() + days * 24 * 60 * 60 * 1000));
  }, []);

  // Filter functions - memoized
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setBrandFilter('all');
    setCompanyFilter('all');
    setAvailableFromDate('');
    setAvailableToDate('');
  }, []);

  // Dummy functions pre backward compatibility
  const toggleFilters = useCallback(() => {
    // Filter UI je teraz v parent komponente
  }, []);
  
  const [showFilters] = useState(false);
  const [statusFilter] = useState('all');
  const setStatusFilter = useCallback((value: any) => {
    // Status filter je teraz v parent komponente  
  }, []);

  // Get unique values for filter dropdowns - memoized
  const uniqueBrands = useMemo(() => 
    Array.from(new Set(vehicles.map(v => v.brand).filter(Boolean))).sort(), 
    [vehicles]
  );
  
  const uniqueCompanies = useMemo(() => 
    Array.from(new Set(vehicles.map(v => v.company).filter(Boolean))).sort(), 
    [vehicles]
  );

  // Filter vehicles based on current filters - memoized with debounced search
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Search filter with debounced query - safe string handling
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        const matches = [
          vehicle.brand?.toLowerCase(),
          vehicle.model?.toLowerCase(), 
          vehicle.licensePlate?.toLowerCase(),
          `${vehicle.brand} ${vehicle.model}`.toLowerCase()
        ].some(field => field?.includes(query));
        
        if (!matches) return false;
      }

      // Company filter - použiť prop ak je k dispozícii, inak fallback na local state
      const activeCompanyFilter = propSelectedCompany || companyFilter;
      if (activeCompanyFilter && activeCompanyFilter !== 'all' && vehicle.company !== activeCompanyFilter) {
        return false;
      }

      // Brand filter
      if (brandFilter !== 'all' && vehicle.brand !== brandFilter) {
        return false;
      }

      // Date range availability filter - používať prop values ak sú poskytnuté
      const activeDateFrom = propAvailableFromDate || availableFromDate;
      const activeDateTo = propAvailableToDate || availableToDate;
      
      if (activeDateFrom && activeDateTo) {
        const fromDate = new Date(activeDateFrom);
        const toDate = new Date(activeDateTo);
        
        // Check if vehicle is available for the ENTIRE period (všetky dni musia byť dostupné)
        const allDaysInPeriod = [];
        for (let currentDate = new Date(fromDate); currentDate <= toDate; currentDate.setDate(currentDate.getDate() + 1)) {
          allDaysInPeriod.push(new Date(currentDate));
        }
        
        const isAvailableForEntirePeriod = allDaysInPeriod.every(dayDate => {
          const dayString = dayDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          const dayData = calendarData.find(d => d.date === dayString);
          
          // Ak nemáme dáta pre tento deň, predpokladáme že vozidlo je DOSTUPNÉ (nie nedostupné)
          if (!dayData) return true; 
          
          const vehicleStatus = dayData.vehicles.find(v => v.vehicleId === vehicle.id);
          
          // Ak nemáme status pre vozidlo v tento deň, predpokladáme dostupnosť
          if (!vehicleStatus) return true;
          
          // Vozidlo je "dostupné" ak je available ALEBO flexible (možno prepísať)
          return vehicleStatus.status === 'available' || vehicleStatus.status === 'flexible';
        });
        
        if (!isAvailableForEntirePeriod) return false;
      }

      return true;
    });
  }, [vehicles, debouncedSearchQuery, brandFilter, companyFilter, propSelectedCompany, availableFromDate, availableToDate, calendarData, propAvailableFromDate, propAvailableToDate]);

  // Filter calendar data to show only filtered vehicles - memoized
  const filteredCalendarData = useMemo(() => {
    return calendarData.map(dayData => ({
      ...dayData,
      vehicles: dayData.vehicles.filter(v => filteredVehicles.some(fv => fv.id === v.vehicleId))
    }));
  }, [calendarData, filteredVehicles]);
  


  // 🚗 MULTI-SELECT CATEGORY FILTER: Apply category filter - memoized
  const categoryFilteredCalendarData = useMemo(() => {
    // Ak nie je žiadny filter, vrátime všetky dáta
    if (!propCategoryFilter) {
      return filteredCalendarData;
    }
    
    // Support both single string and multi-select array
    const selectedCategories: VehicleCategory[] = Array.isArray(propCategoryFilter) 
      ? propCategoryFilter 
      : propCategoryFilter === 'all' 
        ? [] 
        : [propCategoryFilter as VehicleCategory];
    
    // Ak nie sú vybrané žiadne kategórie, vrátime všetky dáta
    if (selectedCategories.length === 0) {
      return filteredCalendarData;
    }
    
    // Nájdeme vozidlá ktoré spĺňajú vybrané kategórie
    const eligibleVehicleIds = new Set<string>();
    
    filteredVehicles.forEach(vehicle => {
      // Filtruj podľa vehicle.category property
      if (vehicle.category && selectedCategories.includes(vehicle.category)) {
        eligibleVehicleIds.add(vehicle.id);
      }
    });
    
    console.log('🚗 Category Filter Debug:', {
      selectedCategories,
      totalVehicles: filteredVehicles.length,
      eligibleVehicles: eligibleVehicleIds.size,
      sampleVehicleCategories: filteredVehicles.slice(0, 3).map(v => ({ id: v.id, category: v.category, licensePlate: v.licensePlate })),
      allVehicleCategories: filteredVehicles.map(v => v.category).slice(0, 10),
      eligibleVehicleIdsList: Array.from(eligibleVehicleIds).slice(0, 5)
    });
    
    // Filtrujeme calendar data aby obsahovali len eligible vozidlá
    return filteredCalendarData.map(dayData => ({
      ...dayData,
      vehicles: dayData.vehicles.filter(v => eligibleVehicleIds.has(v.vehicleId))
    }));
  }, [filteredCalendarData, propCategoryFilter, filteredVehicles]);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'rented': return 'error';
      case 'flexible': return 'warning'; // 🔄 NOVÉ: Oranžová farba pre flexibilné
      case 'maintenance': return 'warning';
      case 'service': return 'primary';
      case 'repair': return 'error';
      case 'blocked': return 'secondary';
      case 'cleaning': return 'info';
      case 'inspection': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <AvailableIcon fontSize="small" />;
      case 'rented': return <RentedIcon fontSize="small" />;
      case 'flexible': return <CarIcon fontSize="small" />; // 🔄 NOVÉ: Ikona pre flexibilné
      case 'maintenance': return <MaintenanceIcon fontSize="small" />;
      case 'service': return <MaintenanceIcon fontSize="small" />;
      case 'repair': return <MaintenanceIcon fontSize="small" />;
      case 'blocked': return <RentedIcon fontSize="small" />;
      case 'cleaning': return <RefreshIcon fontSize="small" />;
      case 'inspection': return <AvailableIcon fontSize="small" />;
      default: return <CarIcon fontSize="small" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Dostupné';
      case 'rented': return 'Obsadené';
      case 'flexible': return 'Flexibilné';
      case 'maintenance': return 'Údržba';
      case 'service': return 'Servis';
      case 'repair': return 'Oprava';
      case 'blocked': return 'Blokované';
      case 'cleaning': return 'Čistenie';
      case 'inspection': return 'Kontrola';
      default: return status;
    }
  };

  // Helper functions for maintenance
  const getMaintenanceTypeIcon = (type: string) => {
    return getStatusIcon(type);
  };

  const getMaintenanceTypeLabel = (type: string) => {
    return getStatusText(type);
  };

  const getMaintenanceTypeColor = (type: string) => {
    return getStatusColor(type);
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Kritická';
      case 2: return 'Normálna';
      case 3: return 'Nízka';
      default: return 'Normálna';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'error';
      case 2: return 'primary';
      case 3: return 'success';
      default: return 'primary';
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  // 🔧 OPRAVA: Lepšie loading states pre hard refresh
  if (loading || (!state?.dataLoaded?.vehicles && authState?.isAuthenticated)) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          {!state?.dataLoaded?.vehicles ? 
            'Načítavam vozidlá z databázy...' : 
            'Načítavam kalendár dostupnosti...'
          }
        </Typography>
      </Box>
    );
  }

  // 🔧 OPRAVA: Ak nie sú načítané žiadne vozidlá, zobraz info správu
  if (!loading && state?.dataLoaded?.vehicles && (!vehicles || vehicles.length === 0)) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={3}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          📋 Žiadne vozidlá na zobrazenie
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
          Buď nemáte prístup k žiadnym vozidlám alebo žiadne vozidlá nie sú v systéme zaregistrované.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleRefresh} 
          sx={{ mt: 2 }}
          startIcon={<RefreshIcon />}
        >
          Skúsiť znova
        </Button>
      </Box>
    );
  }

  // MOBILNÝ KALENDÁRNY VIEW KOMPONENT
  const MobileCalendarView = () => (
    <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
      {/* Mobilný header - OPTIMALIZOVANÝ */}
      <Box sx={{ mb: { xs: 1, sm: 2 }, textAlign: 'center' }}>
        <Typography variant={isSmallMobile ? "h6" : "h5"} gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
          📅 Dostupnosť vozidiel
          </Typography>
        
        {/* Mobilná navigácia - KOMPAKTNEJŠIA */}
        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ mb: { xs: 1, sm: 2 } }}>
          <IconButton onClick={handlePrevMonth} size={isSmallMobile ? "small" : "medium"}>
            <PrevIcon />
          </IconButton>
          <Typography 
            variant={isSmallMobile ? "subtitle1" : "h6"} 
            sx={{ 
              minWidth: { xs: '150px', sm: '200px' }, 
              textAlign: 'center',
              fontSize: { xs: '0.9rem', sm: '1.25rem' }
            }}
          >
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth} size={isSmallMobile ? "small" : "medium"}>
            <NextIcon />
          </IconButton>
        </Stack>
        
        <Stack 
          direction="row" 
          spacing={{ xs: 0.5, sm: 1 }} 
          justifyContent="center" 
          flexWrap="wrap" 
          sx={{ mb: { xs: 1, sm: 1.5 } }}
        >
          <Button 
            size={isSmallMobile ? "small" : "medium"} 
            onClick={handleToday} 
            variant="outlined"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}
          >
            Dnes
          </Button>
          <Button 
            size={isSmallMobile ? "small" : "medium"} 
            onClick={handleRefresh} 
            variant="outlined"
            sx={{ minWidth: 'auto', px: { xs: 1, sm: 2 } }}
          >
            <RefreshIcon fontSize={isSmallMobile ? "small" : "medium"} />
          </Button>
          <Button 
            size={isSmallMobile ? "small" : "medium"}
            onClick={() => {
              setMaintenanceFormData({
                vehicleId: '',
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
                reason: '',
                type: 'maintenance',
                notes: '',
                priority: 2,
                recurring: false,
              });
              setEditingMaintenance(null);
              setMaintenanceDialogOpen(true);
            }}
            variant="contained"
            startIcon={<AddIcon fontSize={isSmallMobile ? "small" : "medium"} />}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}
          >
            Pridať
          </Button>
        </Stack>
        </Box>

      {/* Mobilný search - OPTIMALIZOVANÝ */}
      <TextField
        fullWidth
        size={isSmallMobile ? "small" : "medium"}
        label="🔍 Hľadať vozidlo"
        placeholder={isSmallMobile ? "BMW, BA123AB..." : "BMW, X5, BA123AB..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoComplete="off"
        inputProps={{
          autoComplete: 'off',
          spellCheck: 'false'
        }}
        sx={{ 
          mb: { xs: 1.5, sm: 2 },
          '& .MuiInputBase-input': {
            fontSize: { xs: '16px', sm: '14px' }, // Prevents zoom on iOS
            padding: { xs: '8px 12px', sm: '12px 14px' }
          },
          '& .MuiInputLabel-root': {
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }
        }}
      />

      {/* 🔄 NOVÉ: Filter tlačidlo */}
      <Box sx={{ mb: { xs: 1, sm: 1.5 }, display: 'flex', justifyContent: 'center' }}>
        <Button
          size={isSmallMobile ? "small" : "medium"}
          onClick={toggleFilters}
          variant="outlined"
          startIcon={<FilterIcon fontSize={isSmallMobile ? "small" : "medium"} />}
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Filtre {showFilters ? '▲' : '▼'}
        </Button>
      </Box>

      {/* 🔄 NOVÉ: Filter sekcia */}
      <Collapse in={showFilters}>
        <Card sx={{ mb: { xs: 1.5, sm: 2 }, bgcolor: '#f5f5f5' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              🔍 Filtre dostupnosti
            </Typography>
            
            <Grid container spacing={2}>
              {/* Status filter */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size={isSmallMobile ? "small" : "medium"}>
                  <InputLabel>Status vozidla</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    label="Status vozidla"
                  >
                    <MenuItem value="all">🌐 Všetky stavy</MenuItem>
                    <MenuItem disabled sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      ━━━ 📋 PRENÁJMY ━━━
                    </MenuItem>
                    <MenuItem value="available">🟢 Voľné vozidlá</MenuItem>
                    <MenuItem value="rented">🔴 Klasické prenájmy</MenuItem>
                    <MenuItem value="flexible">🟠 Flexibilné prenájmy</MenuItem>
                    <MenuItem disabled sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      ━━━ 🔧 SERVIS ━━━
                    </MenuItem>
                    <MenuItem value="maintenance">🔧 Údržba</MenuItem>
                    <MenuItem value="service">⚙️ Servis</MenuItem>
                    <MenuItem value="blocked">🚫 Blokované</MenuItem>
                    <MenuItem value="cleaning">🧽 Čistenie</MenuItem>
                    <MenuItem value="inspection">🔍 Kontrola</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Brand filter */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size={isSmallMobile ? "small" : "medium"}>
                  <InputLabel>Značka</InputLabel>
                  <Select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    label="Značka"
                  >
                    <MenuItem value="all">🌐 Všetky značky</MenuItem>
                    {uniqueBrands.map(brand => (
                      <MenuItem key={brand} value={brand}>
                        🚗 {brand}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Reset button */}
              <Grid item xs={12}>
                <Button
                  fullWidth
                  size={isSmallMobile ? "small" : "medium"}
                  onClick={handleResetFilters}
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Resetovať filtre
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* 🔄 NOVÉ: Legenda farieb */}
      <Box sx={{ mb: { xs: 1, sm: 1.5 }, px: { xs: 0.5, sm: 0 } }}>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 500 }}>
          📊 Legenda:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="caption">Voľné</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
            <Typography variant="caption">Klasické</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff9800' }} />
            <Typography variant="caption">Flexibilné</Typography>
          </Box>
        </Box>
      </Box>

            {/* Mobilný kalendár - horizontálne scrollovanie dní */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
                      </Box>
      ) : (
        <>
                  {/* 🔧 OPRAVA: Zobraziť informáciu ak nie sú filtrované vozidlá */}
        {filteredVehicles.length === 0 && (
          <Alert severity="info" sx={{ mb: 2, mx: { xs: 0.5, sm: 0 } }}>
            <Typography variant="body2">
              🔍 Žiadne vozidlá nevyhovujú zadaným filtrom. Skúste zmeniť filter alebo vyhľadávanie.
            </Typography>
          </Alert>
        )}

                 {/* Horizontálne scrollovanie dní - OPTIMALIZOVANÉ */}
         {filteredVehicles.length > 0 && (
         <>
         <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Typography 
            variant={isSmallMobile ? "caption" : "subtitle2"} 
            gutterBottom 
            sx={{ 
              px: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 500
            }}
          >
            📅 Vyberte dátum:
          </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                overflowX: 'auto', 
                gap: { xs: 0.5, sm: 1 }, 
                pb: { xs: 0.5, sm: 1 },
                px: { xs: 0.5, sm: 0 },
                '&::-webkit-scrollbar': { height: { xs: 2, sm: 4 } },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'primary.main', borderRadius: 2 }
              }}
            >
                             {categoryFilteredCalendarData.slice(0, visibleDays).map(dayData => {
                const day = new Date(dayData.date);
                 const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                 
                                  // Počítaj dostupnosť pre tento deň
                 const totalVehicles = dayData.vehicles.length;
                 const availableCount = dayData.vehicles.filter(v => v.status === 'available').length;
                 const rentedCount = dayData.vehicles.filter(v => v.status === 'rented').length;
                 const flexibleCount = dayData.vehicles.filter(v => v.status === 'flexible').length;

                return (
                                       <Button
                      key={dayData.date}
                      variant={selectedDate === dayData.date ? "contained" : "outlined"}
                      size={isSmallMobile ? "small" : "medium"}
                      onClick={() => setSelectedDate(dayData.date)}
                      sx={{
                        minWidth: { xs: 60, sm: 70 },
                        flexDirection: 'column',
                        py: { xs: 0.5, sm: 1 },
                        px: { xs: 0.5, sm: 1 },
                        border: isToday ? '2px solid' : '1px solid',
                        borderColor: isToday ? 'primary.main' : 'grey.300',
                        position: 'relative',
                        height: { xs: 'auto', sm: 'auto' }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, lineHeight: 1 }}>
                        {format(day, 'EEE')}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.2 }}>
                        {format(day, 'dd')}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, lineHeight: 1 }}>
                        {format(day, 'MMM')}
                      </Typography>
                     
                                           {/* Indikátor obsadenosti - ROZŠÍRENÝ */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 0.15, sm: 0.2 }, 
                        mt: { xs: 0.25, sm: 0.5 },
                        justifyContent: 'center'
                      }}>
                        <Box sx={{ 
                          width: { xs: 3, sm: 4 }, 
                          height: { xs: 3, sm: 4 }, 
                          borderRadius: '50%', 
                          bgcolor: availableCount > 0 ? 'success.main' : 'grey.300' 
                        }} />
                        <Box sx={{ 
                          width: { xs: 3, sm: 4 }, 
                          height: { xs: 3, sm: 4 }, 
                          borderRadius: '50%', 
                          bgcolor: rentedCount > 0 ? 'error.main' : 'grey.300' 
                        }} />
                        <Box sx={{ 
                          width: { xs: 3, sm: 4 }, 
                          height: { xs: 3, sm: 4 }, 
                          borderRadius: '50%', 
                          bgcolor: flexibleCount > 0 ? '#ff9800' : 'grey.300' 
                        }} />
                      </Box>
                   </Button>
                 );
              })}
                         </Box>
             
             {/* Load More tlačidlo */}
                           {visibleDays < categoryFilteredCalendarData.length && (
               <Box sx={{ textAlign: 'center', mt: 1 }}>
                 <Button
                                size="small"
                                variant="outlined"
                                       onClick={() => setVisibleDays(prev => Math.min(prev + 7, categoryFilteredCalendarData.length))}
                 >
                                       Zobraziť viac dní ({categoryFilteredCalendarData.length - visibleDays} zostáva)
                 </Button>
               </Box>
             )}
           </Box>

                                        {/* Mobilné vozidlá pre vybraný dátum - VYLEPŠENÉ */}
          <Box sx={{ px: { xs: 1, sm: 0 } }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: { xs: 1, sm: 1.5 },
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: { xs: '0.8rem', sm: '0.9rem' }
              }}
            >
              📋 Vozidlá na {format(new Date(selectedDate), 'd. MMMM', { locale: sk })}:
            </Typography>
            
            <Stack spacing={{ xs: 1, sm: 1.5 }}>
              {filteredVehicles.map(vehicle => {
                const selectedDayData = categoryFilteredCalendarData.find(day => 
                  day.date === selectedDate
                );
                const vehicleStatus = selectedDayData?.vehicles.find(v => v.vehicleId === vehicle.id);
                
                return (
                  <Card 
                    key={vehicle.id} 
                    onClick={() => {
                      if (vehicleStatus?.status === 'rented' || vehicleStatus?.status === 'flexible') {
                        if (vehicleStatus.rentalId) {
                          fetchRentalDetails(vehicleStatus.rentalId);
                        }
                      }
                    }}
                    sx={{ 
                      border: '2px solid',
                      borderColor: vehicleStatus?.status === 'available' ? '#4caf50' :
                                 vehicleStatus?.status === 'rented' ? '#f44336' : 
                                 vehicleStatus?.status === 'flexible' ? '#ff9800' : '#ff9800',
                      backgroundColor: vehicleStatus?.status === 'available' ? '#e8f5e8' : 
                                     vehicleStatus?.status === 'rented' ? '#ffebee' :
                                     vehicleStatus?.status === 'flexible' ? '#fff8f0' : '#fff3e0',
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      cursor: (vehicleStatus?.status === 'rented' || vehicleStatus?.status === 'flexible') ? 'pointer' : 'default',
                      '&:hover': (vehicleStatus?.status === 'rented' || vehicleStatus?.status === 'flexible') ? {
                        transform: 'scale(1.02)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      } : {},
                      '&:active': { transform: 'scale(0.98)' }
                    }}
                  >
                    <CardContent sx={{ 
                      p: { xs: 2, sm: 2.5 }, 
                      '&:last-child': { pb: { xs: 2, sm: 2.5 } }
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: { xs: 1.5, sm: 2 }
                      }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="h6"
                            sx={{ 
                              fontSize: { xs: '1rem', sm: '1.1rem' },
                              fontWeight: 700,
                              color: '#1976d2',
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {vehicle.brand} {vehicle.model}
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              fontWeight: 500,
                              color: '#666',
                              mb: 0.25
                            }}
                          >
                            📋 {vehicle.licensePlate}
                          </Typography>
                          {vehicleStatus?.customerName && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block',
                                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                color: '#888',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              👤 {vehicleStatus.customerName}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          gap: 0.5
                        }}>
                          <Chip
                            label={getStatusText(vehicleStatus?.status || 'available')}
                            size="medium"
                            sx={{
                              bgcolor: vehicleStatus?.status === 'available' ? '#4caf50' :
                                     vehicleStatus?.status === 'rented' ? '#f44336' :
                                     vehicleStatus?.status === 'flexible' ? '#ff9800' : '#ff9800',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              height: { xs: 28, sm: 32 },
                              minWidth: { xs: 70, sm: 85 },
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              '&:hover': { transform: 'scale(1.05)' }
                            }}
                            onClick={() => vehicleStatus && handleStatusClick(vehicleStatus, selectedDate)}
                          />
                          {vehicleStatus?.status === 'available' && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.65rem', 
                                color: '#4caf50',
                                fontWeight: 600
                              }}
                            >
                              ✅ Voľné
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                      );
                    })}
            </Stack>
          </Box>
        </>
        )}


    </Box>
  );

  return (
    <>
    {/* Mobilný vs Desktop view */}
    {isMobile ? (
      /* JEDNODUCHÝ MOBILNÝ KALENDÁR - bez komplexného scrollovania */
      <Box sx={{ p: 0 }}>
        {/* Mobilný kalendár - jednoduchý card layout */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          px: 1
        }}>
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} sx={{ 
              overflow: 'hidden', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2
            }}>
              <CardContent sx={{ p: 1.5 }}>
                {/* Vozidlo header */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 1.5,
                  pb: 1,
                  borderBottom: '1px solid #e0e0e0',
                  minHeight: '50px'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'flex-start',
                    minHeight: '40px',
                    flex: 1,
                    pt: 0.5
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      fontSize: '1rem',
                      color: '#1976d2',
                      mb: 0.5,
                      lineHeight: 1.2
                    }}>
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#666', 
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      fontWeight: 600
                    }}>
                      {vehicle.licensePlate}
                    </Typography>
                  </Box>
                  <Box sx={{ pt: 0.5 }}>
                    <Chip 
                      label={vehicle.status}
                      size="small"
                      color={vehicle.status === 'available' ? 'success' : 
                             vehicle.status === 'rented' ? 'primary' : 'warning'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>

                {/* Status pre aktuálny týždeň/mesiac s navigáciou */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 1,
                  minHeight: '32px'
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600,
                    color: '#333'
                  }}>
                    {mobileViewMode === 'week' 
                      ? `Dostupnosť (${format(new Date(Date.now() + currentWeekOffset * 7 * 24 * 60 * 60 * 1000), 'd.M.')} - ${format(new Date(Date.now() + (currentWeekOffset * 7 + 6) * 24 * 60 * 60 * 1000), 'd.M.')}):` 
                      : `Dostupnosť (${format(new Date(Date.now() + currentMonthOffset * 30 * 24 * 60 * 60 * 1000), 'd.M.')} - ${format(new Date(Date.now() + (currentMonthOffset * 30 + 29) * 24 * 60 * 60 * 1000), 'd.M.')}):` 
                    }
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      size="small"
                      onClick={() => {
                        if (mobileViewMode === 'week') {
                          setCurrentWeekOffset(prev => prev - 1);
                        } else {
                          setCurrentMonthOffset(prev => prev - 1);
                        }
                      }}
                      sx={{ 
                        width: 28, 
                        height: 28,
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => {
                        if (mobileViewMode === 'week') {
                          setCurrentWeekOffset(prev => prev + 1);
                        } else {
                          setCurrentMonthOffset(prev => prev + 1);
                        }
                      }}
                      sx={{ 
                        width: 28, 
                        height: 28,
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridTemplateRows: mobileViewMode === 'month' ? 'repeat(5, 1fr)' : '1fr',
                  gap: 0.25,
                  mb: 1.5,
                  minHeight: mobileViewMode === 'month' ? '140px' : '35px'
                }}>
                  {(mobileViewMode === 'week' 
                    ? generateCalendarDays(currentWeekOffset, 7)
                    : generateCalendarDays(currentMonthOffset, 30)
                  ).map((day) => {
                    const vehicleStatus = day.vehicles.find(v => v.vehicleId === vehicle.id);
                    const isAvailable = !vehicleStatus || vehicleStatus.status === 'available';
                    const isRented = vehicleStatus?.status === 'rented';
                    const isFlexible = vehicleStatus?.status === 'flexible';
                    const isMaintenance = vehicleStatus?.status === 'maintenance' || vehicleStatus?.status === 'service' || vehicleStatus?.status === 'blocked';
                    const dayIsToday = isToday(new Date(day.date));
                    
                    return (
                      <Box 
                        key={day.date}
                        sx={{ 
                          textAlign: 'center',
                          p: 0.25,
                          borderRadius: 0.5,
                          backgroundColor: 
                            dayIsToday ? '#e3f2fd' :
                            isRented ? '#ffebee' :
                            isFlexible ? '#fff8f0' :
                            isMaintenance ? '#fff3e0' : '#e8f5e8',
                          border: dayIsToday ? '2px solid #1976d2' : '1px solid #e0e0e0'
                        }}
                      >
                        <Typography variant="caption" sx={{ 
                          fontWeight: dayIsToday ? 700 : 600,
                          fontSize: '0.7rem',
                          color: dayIsToday ? '#1976d2' : '#333',
                          display: 'block',
                          lineHeight: 1.1
                        }}>
                          {format(new Date(day.date), 'd')}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: dayIsToday ? '#1976d2' : '#666',
                          fontSize: '0.6rem',
                          lineHeight: 1
                        }}>
                          {format(new Date(day.date), 'EE', { locale: sk })}
                        </Typography>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%',
                          backgroundColor: 
                            isRented ? '#f44336' :
                            isFlexible ? '#ff9800' :
                            isMaintenance ? '#ff9800' : '#4caf50',
                          mx: 'auto',
                          mt: 0.25
                        }} />
                      </Box>
                );
              })}
                </Box>

                {/* Akcie pre vozidlo */}
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75
                }}>
                  {/* Hlavné akcie */}
                  <Box sx={{ 
                    display: 'flex',
                    gap: 0.5,
                    justifyContent: 'center'
                  }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setEditingMaintenance(null);
                        setMaintenanceDialogOpen(true);
                      }}
                      sx={{ fontSize: '0.75rem', flex: 1 }}
                    >
                      Blokovať
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => {
                        // Otvorenie detailu vozidla
                        console.log('Detail vozidla:', vehicle);
                      }}
                      sx={{ fontSize: '0.75rem', flex: 1 }}
                    >
                      Detail
                    </Button>
                  </Box>
                  
                  {/* Prepínače pre zobrazenie */}
                  <Box sx={{ 
                    display: 'flex',
                    gap: 0.5,
                    justifyContent: 'center'
                  }}>
                    <Button
                      size="small"
                      variant={mobileViewMode === 'week' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setMobileViewMode('week');
                        setCurrentWeekOffset(0);
                      }}
                      sx={{ fontSize: '0.7rem', flex: 1 }}
                    >
                      Týždeň
                    </Button>
                    <Button
                      size="small"
                      variant={mobileViewMode === 'month' ? 'contained' : 'outlined'}
                      onClick={() => setMobileViewMode('month')}
                      sx={{ fontSize: '0.7rem', flex: 1 }}
                    >
                      30 dní
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    ) : (
    /* DESKTOP CARD-BASED KALENDÁR - inšpirovaný mobilnou verziou */
    <Box sx={{ p: 0 }}>
      {/* Desktop header s prepínačmi */}
      <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontWeight: 600,
              color: '#1976d2'
            }}>
              <CalendarIcon sx={{ mr: 1 }} />
              Prehľad Dostupnosti
          </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                variant={mobileViewMode === 'week' ? 'contained' : 'outlined'}
                onClick={() => {
                  setMobileViewMode('week');
                  setCurrentWeekOffset(0);
                }}
                sx={{ minWidth: 120 }}
              >
                Týždenný
              </Button>
              <Button
                variant={mobileViewMode === 'month' ? 'contained' : 'outlined'}
                onClick={() => setMobileViewMode('month')}
                sx={{ minWidth: 120 }}
              >
                Mesačný
              </Button>
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>
        </Box>
      </CardContent>
    </Card>

      {/* 🔧 OPRAVA: Desktop info ak nie sú filtrované vozidlá */}
      {filteredVehicles.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            🔍 Žiadne vozidlá nevyhovujú zadaným filtrom. Skúste zmeniť filter alebo vyhľadávanie.
          </Typography>
        </Alert>
      )}

      {/* Desktop kalendár - card layout pre vozidlá */}
      {filteredVehicles.length > 0 && (
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
        gap: 1.5
      }}>
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} sx={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }
          }}>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              {/* Vozidlo header */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 1.5,
                pb: 1.5,
                borderBottom: '2px solid #f0f0f0',
                minHeight: '60px'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'flex-start',
                  minHeight: '45px',
                  pt: 0.5
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    fontSize: '1.1rem',
                    color: '#1976d2',
                    mb: 0.5,
                    lineHeight: 1.2
                  }}>
                    {vehicle.brand} {vehicle.model}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666', 
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}>
                    {vehicle.licensePlate}
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 1,
                  pt: 0.5
                }}>
                  <Chip 
                    label={vehicle.status}
                    size="small"
                    color={
                      vehicle.status === 'available' ? 'success' : 
                      vehicle.status === 'rented' ? 'primary' : 'warning'
                    }
                    sx={{ fontWeight: 600 }}
                  />
                  
                  {/* Navigation pre individual vozidlo */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      size="small"
                      onClick={() => {
                        const currentMode = getVehicleViewMode(vehicle.id);
                        const currentOffset = getVehicleOffset(vehicle.id, currentMode);
                        setVehicleOffset(vehicle.id, currentMode, currentOffset - 1);
                      }}
                      sx={{ 
                        width: 32, 
                        height: 32,
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => {
                        const currentMode = getVehicleViewMode(vehicle.id);
                        const currentOffset = getVehicleOffset(vehicle.id, currentMode);
                        setVehicleOffset(vehicle.id, currentMode, currentOffset + 1);
                      }}
                      sx={{ 
                        width: 32, 
                        height: 32,
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              {/* Dostupnosť kalendár */}
              <Typography variant="subtitle2" sx={{ 
                mb: 1, 
                fontWeight: 600,
                color: '#333',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1.3
              }}>
                {(() => {
                  const vehicleMode = getVehicleViewMode(vehicle.id);
                  const vehicleOffset = getVehicleOffset(vehicle.id, vehicleMode);
                  const daysCount = vehicleMode === 'week' ? 7 : 30;
                  const startDate = new Date(Date.now() + vehicleOffset * daysCount * 24 * 60 * 60 * 1000);
                  const endDate = new Date(startDate.getTime() + (daysCount - 1) * 24 * 60 * 60 * 1000);
                  return `Dostupnosť (${format(startDate, 'd.M.')} - ${format(endDate, 'd.M.')}):`;
                })()}
              </Typography>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gridTemplateRows: getVehicleViewMode(vehicle.id) === 'month' ? 'repeat(5, 1fr)' : '1fr',
                gap: 0.5,
                mb: 1.5,
                minHeight: getVehicleViewMode(vehicle.id) === 'month' ? '200px' : '50px'
              }}>
                {(() => {
                  const vehicleMode = getVehicleViewMode(vehicle.id);
                  const vehicleOffset = getVehicleOffset(vehicle.id, vehicleMode);
                  const daysCount = vehicleMode === 'week' ? 7 : 30;
                  return generateCalendarDays(vehicleOffset, daysCount);
                })().map((day) => {
                  const vehicleStatus = day.vehicles.find(v => v.vehicleId === vehicle.id);
                  const isAvailable = !vehicleStatus || vehicleStatus.status === 'available';
                  const isRented = vehicleStatus?.status === 'rented';
                  const isFlexible = vehicleStatus?.status === 'flexible';
                  const isMaintenance = vehicleStatus?.status === 'maintenance' || vehicleStatus?.status === 'service' || vehicleStatus?.status === 'blocked';
                  const dayIsToday = isToday(new Date(day.date));
                  
                  return (
                    <Box 
                      key={day.date}
                      sx={{ 
                        textAlign: 'center',
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: 
                          dayIsToday ? '#e3f2fd' :
                          isRented ? '#ffebee' :
                          isFlexible ? '#fff8f0' :
                          isMaintenance ? '#fff3e0' : '#e8f5e8',
                        border: dayIsToday ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ 
                        fontWeight: dayIsToday ? 700 : 600,
                        fontSize: '0.9rem',
                        color: dayIsToday ? '#1976d2' : '#333',
                        display: 'block',
                        lineHeight: 1.2,
                        mb: 0.5
                      }}>
                        {format(new Date(day.date), 'd')}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: dayIsToday ? '#1976d2' : '#666',
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        mb: 0.5
                      }}>
                        {format(new Date(day.date), 'EE', { locale: sk })}
                      </Typography>
                      <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%',
                        backgroundColor: 
                          isRented ? '#f44336' :
                          isFlexible ? '#ff9800' :
                          isMaintenance ? '#ff9800' : '#4caf50',
                        mt: 'auto'
                      }} />
                    </Box>
                  );
                })}
              </Box>

              {/* Akcie pre vozidlo */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                justifyContent: 'center',
                mt: 'auto'
              }}>
                {/* Hlavné akcie */}
                <Box sx={{ 
                  display: 'flex',
                  gap: 0.5,
                  justifyContent: 'center'
                }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setEditingMaintenance(null);
                      setMaintenanceDialogOpen(true);
                    }}
                    sx={{ minWidth: 100 }}
                  >
                    Blokovať
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      // Otvorenie detailu vozidla
                      console.log('Detail vozidla:', vehicle);
                    }}
                    sx={{ minWidth: 100 }}
                  >
                    Detail
                  </Button>
                </Box>
                
                {/* Prepínače pre zobrazenie */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.5,
                  justifyContent: 'center'
                }}>
                  <Button
                    size="small"
                    variant={getVehicleViewMode(vehicle.id) === 'week' ? 'contained' : 'outlined'}
                    onClick={() => setVehicleViewMode(vehicle.id, 'week')}
                    sx={{ 
                      minWidth: 70, 
                      fontSize: '0.7rem',
                      height: 28
                    }}
                  >
                    Týždeň
                  </Button>
                  <Button
                    size="small"
                    variant={getVehicleViewMode(vehicle.id) === 'month' ? 'contained' : 'outlined'}
                    onClick={() => setVehicleViewMode(vehicle.id, 'month')}
                    sx={{ 
                      minWidth: 70, 
                      fontSize: '0.7rem',
                      height: 28
                    }}
                  >
                    30 dní
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      )}
    </Box>
    )}

    {/* Maintenance/Unavailability Dialog */}
    <Dialog 
      open={maintenanceDialogOpen} 
      onClose={() => setMaintenanceDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {editingMaintenance ? 'Upraviť nedostupnosť' : 'Vytvoriť nedostupnosť vozidla'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Vozidlo</InputLabel>
            <Select
              value={maintenanceFormData.vehicleId}
              onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
              label="Vozidlo"
            >
              {filteredVehicles.map(vehicle => (
                <MenuItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Od dátumu"
            type="date"
            value={maintenanceFormData.startDate}
            onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          
          <TextField
            label="Do dátumu"
            type="date"
            value={maintenanceFormData.endDate}
            onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, endDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          
          <TextField
            label="Dôvod nedostupnosti"
            multiline
            rows={3}
            value={maintenanceFormData.reason}
            onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, reason: e.target.value }))}
            fullWidth
            placeholder="Napríklad: Servis, Oprava, Čistenie..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setMaintenanceDialogOpen(false)}>
          Zrušiť
        </Button>
        <Button 
          onClick={handleMaintenanceSubmit} 
          variant="contained" 
          disabled={submittingMaintenance}
          startIcon={submittingMaintenance ? <CircularProgress size={20} /> : null}
        >
          {submittingMaintenance ? 'Ukladám...' : (editingMaintenance ? 'Uložiť' : 'Pridať')}
        </Button>
        {editingMaintenance && (
          <Button 
            onClick={() => handleMaintenanceDelete(editingMaintenance.id)} 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Zmazať
          </Button>
        )}
      </DialogActions>
    </Dialog>

    {/* 🔄 NOVÉ: Rental Details Dialog */}
    <Dialog 
      open={rentalDetailsOpen} 
      onClose={handleCloseRentalDetails}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            📋 Detail prenájmu
          </Box>
          {selectedRental?.isFlexible && (
            <Chip
              label="FLEXIBILNÝ"
              size="small"
              sx={{
                bgcolor: '#ff9800',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {loadingRentalDetails ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Načítavam detail prenájmu...</Typography>
          </Box>
        ) : selectedRental ? (
          <Grid container spacing={3}>
            {/* Základné informácie */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
                👤 Zákazník
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography><strong>Meno:</strong> {selectedRental.customerName}</Typography>
                <Typography><strong>Objednávka:</strong> {selectedRental.orderNumber || 'N/A'}</Typography>
                <Typography><strong>Status:</strong> 
                  <Chip 
                    size="small" 
                    label={selectedRental.status?.toUpperCase() || 'NEZNÁMY'}
                    color={selectedRental.status === 'active' ? 'success' : 'default'}
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>
            </Grid>

            {/* Dátumy */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
                📅 Termíny
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography><strong>Od:</strong> {selectedRental.startDate ? format(new Date(selectedRental.startDate), 'dd.MM.yyyy', { locale: sk }) : 'N/A'}</Typography>
                <Typography><strong>Do:</strong> {selectedRental.endDate ? format(new Date(selectedRental.endDate), 'dd.MM.yyyy', { locale: sk }) : 'N/A'}</Typography>
                {selectedRental.isFlexible && selectedRental.flexibleEndDate && (
                  <Typography sx={{ color: '#ff9800' }}>
                    <strong>🟠 Odhadovaný koniec:</strong> {format(new Date(selectedRental.flexibleEndDate), 'dd.MM.yyyy', { locale: sk })}
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Flexibilné nastavenia */}
            {selectedRental.isFlexible && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: '#ff9800' }}>
                  🟠 Flexibilné nastavenia
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Typ prenájmu:</strong> {selectedRental.rentalType?.toUpperCase() || 'FLEXIBLE'}</Typography>
                    <Typography><strong>Priorita prepísania:</strong> {selectedRental.flexibleSettings?.overridePriority || 5}/10</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Možno prepísať:</strong> {selectedRental.flexibleSettings?.canBeOverridden ? '✅ Áno' : '❌ Nie'}</Typography>
                    <Typography><strong>Automatické predĺženie:</strong> {selectedRental.flexibleSettings?.autoExtend ? '✅ Áno' : '❌ Nie'}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            )}

            {/* Finančné informácie */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
                💰 Financie
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography><strong>Celková cena:</strong> {selectedRental.totalPrice?.toFixed(2) || '0.00'} €</Typography>
                <Typography><strong>Záloha:</strong> {selectedRental.deposit?.toFixed(2) || '0.00'} €</Typography>
                <Typography><strong>Zaplatené:</strong> {selectedRental.paid ? '✅ Áno' : '❌ Nie'}</Typography>
                <Typography><strong>Spôsob platby:</strong> {selectedRental.paymentMethod || 'N/A'}</Typography>
              </Box>
            </Grid>

            {/* Dodatočné informácie */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
                🚗 Prenájom
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography><strong>Místo odovzdania:</strong> {selectedRental.handoverPlace || 'N/A'}</Typography>
                <Typography><strong>Povolené km:</strong> {selectedRental.allowedKilometers || 'N/A'}</Typography>
                <Typography><strong>Denné km:</strong> {selectedRental.dailyKilometers || 'N/A'}</Typography>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Typography>Prenájom sa nenašiel.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseRentalDetails}>
          Zavrieť
        </Button>
        {selectedRental && (
          <Button 
            variant="contained" 
            onClick={() => {
              // Tu by sme mohli pridať navigáciu na editáciu prenájmu
              console.log('Edit rental:', selectedRental.id);
            }}
          >
            Upraviť prenájom
          </Button>
        )}
      </DialogActions>
    </Dialog>
    </>
  );
};

export default AvailabilityCalendar; 