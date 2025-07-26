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



  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { sk } from 'date-fns/locale';
import { API_BASE_URL } from '../../services/api';
import { Rental, VehicleUnavailability } from '../../types';
import { useApp } from '../../context/AppContext';

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
  status: 'available' | 'rented' | 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection';
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

const AvailabilityCalendar: React.FC = () => {
  const { state } = useApp();
  
  // MOBILNÁ RESPONSIBILITA
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search input for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'rented' | 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection'>('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Date range availability filter
  const [availableFromDate, setAvailableFromDate] = useState<string>('');
  const [availableToDate, setAvailableToDate] = useState<string>('');
  
  // OPTIMALIZÁCIA: Cache pre availability data
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [cacheKey, setCacheKey] = useState<string>('');
  
  // MOBILNÝ KALENDÁR - vybraný dátum a počet zobrazených dní
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [visibleDays, setVisibleDays] = useState(14);

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
    if (vehicleStatus.status === 'rented' && vehicleStatus.rentalId) {
      // Show rental details
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
      
      // OPTIMALIZÁCIA: Cache validation
      const now = Date.now();
      const currentCacheKey = `${viewMode}-${currentDate.getTime()}-${fromDate?.getTime()}-${toDate?.getTime()}`;
      const cacheValid = lastFetchTime && cacheKey === currentCacheKey && (now - lastFetchTime) < 2 * 60 * 1000; // 2 min cache
      
      if (cacheValid) {
        console.log('⚡ Používam cached availability data...');
        setLoading(false);
        return;
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
        setVehicles(data.data.vehicles || []);
        setUnavailabilities(data.data.unavailabilities || []);
        
        // OPTIMALIZÁCIA: Update cache
        setLastFetchTime(now);
        setCacheKey(currentCacheKey);
      } else {
        setError(data.error || 'Chyba pri načítaní dát');
      }
    } catch (err: any) {
      console.error('❌ Calendar fetch error:', err);
      setError('Chyba pri načítaní kalendárnych dát');
      
      // Ak backend nefunguje, zobrazíme aspoň základné dáta
      const mockVehicles = [
        { id: '1', brand: 'BMW', model: 'X3', licensePlate: 'BA-123-AB' },
        { id: '2', brand: 'Audi', model: 'A4', licensePlate: 'BA-456-CD' },
        { id: '3', brand: 'Mercedes', model: 'C-Class', licensePlate: 'BA-789-EF' }
      ];
      setVehicles(mockVehicles);
      
      // Mock kalendárne dáta pre celý mesiac
      const mockCalendar = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      }).map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        vehicles: mockVehicles.map(vehicle => ({
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          licensePlate: vehicle.licensePlate,
          status: Math.random() > 0.7 ? 'available' : (Math.random() > 0.5 ? 'rented' : 'maintenance') as 'available' | 'rented' | 'maintenance',
          customerName: Math.random() > 0.6 ? `Zákazník ${Math.floor(Math.random() * 100)}` : undefined
        }))
      }));
      setCalendarData(mockCalendar);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, fromDate, toDate]);

  useEffect(() => {
    if (viewMode === 'navigation') {
      const isCurrentMonth = 
        currentDate.getFullYear() === new Date().getFullYear() && 
        currentDate.getMonth() === new Date().getMonth();
      
      fetchCalendarData(!isCurrentMonth);
    } else {
      // Range mode - fetch when dates change
    fetchCalendarData();
    }
  }, [fetchCalendarData]);

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
    setStatusFilter('all');
    setBrandFilter('all');
    setCompanyFilter('all');
    setAvailableFromDate('');
    setAvailableToDate('');
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

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
      // Search filter with debounced query
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        const matches = [
          vehicle.brand?.toLowerCase(),
          vehicle.model?.toLowerCase(), 
          vehicle.licensePlate?.toLowerCase(),
          `${vehicle.brand} ${vehicle.model}`.toLowerCase()
        ].some(field => field?.includes(query));
        
        if (!matches) return false;
      }

      // Brand filter
      if (brandFilter !== 'all' && vehicle.brand !== brandFilter) {
        return false;
      }

      // Company filter
      if (companyFilter !== 'all' && vehicle.company !== companyFilter) {
        return false;
      }

      // Date range availability filter
      if (availableFromDate && availableToDate) {
        const fromDate = new Date(availableFromDate);
        const toDate = new Date(availableToDate);
        
        // Check if vehicle is available for the entire period
        const isAvailableInPeriod = calendarData.some(dayData => {
          const dayDate = new Date(dayData.date);
          if (dayDate >= fromDate && dayDate <= toDate) {
            const vehicleStatus = dayData.vehicles.find(v => v.vehicleId === vehicle.id);
            return vehicleStatus?.status === 'available';
          }
          return false;
        });
        
        if (!isAvailableInPeriod) return false;
      }

      return true;
    });
  }, [vehicles, debouncedSearchQuery, brandFilter, companyFilter, availableFromDate, availableToDate, calendarData]);

  // Filter calendar data to show only filtered vehicles - memoized
  const filteredCalendarData = useMemo(() => {
    return calendarData.map(dayData => ({
      ...dayData,
      vehicles: dayData.vehicles.filter(v => filteredVehicles.some(fv => fv.id === v.vehicleId))
    }));
  }, [calendarData, filteredVehicles]);

  // Additional status filtering for the status filter - memoized
  const statusFilteredCalendarData = useMemo(() => {
    return statusFilter === 'all' 
      ? filteredCalendarData
      : filteredCalendarData.map(dayData => ({
          ...dayData,
          vehicles: dayData.vehicles.filter(v => v.status === statusFilter)
        }));
  }, [filteredCalendarData, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'rented': return 'error';
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Načítavam kalendár dostupnosti...
        </Typography>
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

            {/* Mobilný kalendár - horizontálne scrollovanie dní */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Horizontálne scrollovanie dní - OPTIMALIZOVANÉ */}
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
                             {statusFilteredCalendarData.slice(0, visibleDays).map(dayData => {
                 const day = new Date(dayData.date);
                 const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                 
                                  // Počítaj dostupnosť pre tento deň
                 const totalVehicles = dayData.vehicles.length;
                 const availableCount = dayData.vehicles.filter(v => v.status === 'available').length;
                 const rentedCount = dayData.vehicles.filter(v => v.status === 'rented').length;

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
                     
                                           {/* Indikátor obsadenosti - OPTIMALIZOVANÝ */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 0.2, sm: 0.25 }, 
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
                      </Box>
                   </Button>
                 );
              })}
                         </Box>
             
             {/* Load More tlačidlo */}
             {visibleDays < statusFilteredCalendarData.length && (
               <Box sx={{ textAlign: 'center', mt: 1 }}>
                 <Button
                   size="small"
                   variant="outlined"
                   onClick={() => setVisibleDays(prev => Math.min(prev + 7, statusFilteredCalendarData.length))}
                 >
                   Zobraziť viac dní ({statusFilteredCalendarData.length - visibleDays} zostáva)
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
                const selectedDayData = statusFilteredCalendarData.find(day => 
                  day.date === selectedDate
                );
                const vehicleStatus = selectedDayData?.vehicles.find(v => v.vehicleId === vehicle.id);
                
                return (
                  <Card 
                    key={vehicle.id} 
                    sx={{ 
                      border: '2px solid',
                      borderColor: vehicleStatus?.status === 'available' ? '#4caf50' :
                                 vehicleStatus?.status === 'rented' ? '#f44336' : '#ff9800',
                      backgroundColor: vehicleStatus?.status === 'available' ? '#e8f5e8' : 
                                     vehicleStatus?.status === 'rented' ? '#ffebee' : '#fff3e0',
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
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
                                     vehicleStatus?.status === 'rented' ? '#f44336' : '#ff9800',
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
      /* MOBILNÝ BOOKING.COM STYLE KALENDÁR */
      <Box sx={{ p: 0 }}>
        {/* Mobilný header s vylepšenou responsivitou */}
        <Box sx={{ mb: { xs: 1.5, sm: 2 }, px: { xs: 0.5, sm: 1 } }}>
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center" 
            sx={{ 
              mb: { xs: 1, sm: 1.5 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: { xs: 1, sm: 0 }
            }}
          >
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              minWidth: 'fit-content'
            }}>
              📅 Dostupnosť
            </Typography>
            <Stack 
              direction="row" 
              spacing={{ xs: 0.25, sm: 0.5 }}
              sx={{ flexShrink: 0 }}
            >
              <IconButton 
                onClick={handleToday} 
                size="small" 
                sx={{ 
                  bgcolor: 'primary.light',
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
              >
                <TodayIcon fontSize="small" />
              </IconButton>
              <IconButton 
                onClick={handleRefresh} 
                size="small" 
                sx={{ 
                  bgcolor: 'primary.light',
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
              <Button 
                size="small" 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setMaintenanceDialogOpen(true)}
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  px: { xs: 1, sm: 1.5 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  height: { xs: 32, sm: 36 }
                }}
              >
                {isSmallMobile ? '+' : 'Pridať'}
              </Button>
            </Stack>
          </Stack>
          <TextField
            fullWidth
            size="small"
            label="🔍 Hľadať vozidlo"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              '& .MuiInputBase-input': { 
                fontSize: { xs: '14px', sm: '16px' },
                padding: { xs: '8px 12px', sm: '10px 14px' }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }
            }}
          />
        </Box>

        {/* Mobilný horizontálny kalendár s vylepšenou responsivitou */}
        <Card sx={{ 
          overflow: 'hidden', 
          mx: { xs: 0.5, sm: 1 }, 
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
          borderRadius: { xs: 2, sm: 3 }
        }}>
          <CardContent sx={{ p: 0 }}>
            {/* Sticky header s dátumami - vylepšený */}
            <Box sx={{ 
              display: 'flex',
              borderBottom: '2px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              position: 'sticky',
              top: 0,
              zIndex: 1000
            }}>
              <Box sx={{ 
                minWidth: { xs: 100, sm: 120 },
                p: { xs: 0.75, sm: 1 },
                borderRight: '2px solid #e0e0e0',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 700, 
                  color: '#1976d2', 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  lineHeight: 1.2
                }}>
                  🚗 Vozidlá
                </Typography>
              </Box>
              <Box 
                id="mobile-header-scroll"
                sx={{ 
                  display: 'flex',
                  flex: 1,
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': { height: 4 }
                }}
                onScroll={(e) => {
                  const scrollLeft = e.currentTarget.scrollLeft;
                  document.querySelectorAll('.mobile-row').forEach((row) => {
                    row.scrollLeft = scrollLeft;
                  });
                }}
              >
                {statusFilteredCalendarData.map((day, index) => (
                  <Box 
                    key={day.date}
                    data-today={isToday(new Date(day.date))}
                    sx={{ 
                      minWidth: { xs: 44, sm: 50 },
                      p: { xs: 0.5, sm: 0.75 },
                      borderRight: index < statusFilteredCalendarData.length - 1 ? '1px solid #e0e0e0' : 'none',
                      textAlign: 'center',
                      backgroundColor: isToday(new Date(day.date)) ? '#e3f2fd' : '#f8f9fa',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: isToday(new Date(day.date)) ? '#bbdefb' : '#e0e0e0'
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                    onClick={() => {
                      // Scroll to today functionality
                      if (isToday(new Date(day.date))) {
                        const element = document.querySelector(`[data-today="true"]`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                        }
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ 
                      fontWeight: 700, 
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      color: isToday(new Date(day.date)) ? '#1976d2' : '#333',
                      display: 'block',
                      lineHeight: 1.1
                    }}>
                      {format(new Date(day.date), 'd')}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: isToday(new Date(day.date)) ? '#1976d2' : '#666', 
                      fontSize: { xs: '0.55rem', sm: '0.6rem' },
                      lineHeight: 1
                    }}>
                      {format(new Date(day.date), 'EEE', { locale: sk })}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Vozidlá rows - vylepšené pre mobil */}
            <Box>
              {filteredVehicles.map((vehicle, vehicleIndex) => (
                <Box 
                  key={vehicle.id}
                  sx={{ 
                    display: 'flex',
                    borderBottom: vehicleIndex < filteredVehicles.length - 1 ? '1px solid #e0e0e0' : 'none',
                    minHeight: { xs: 44, sm: 50 },
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <Box sx={{ 
                    minWidth: { xs: 100, sm: 120 },
                    p: { xs: 0.75, sm: 1 },
                    borderRight: '2px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    position: 'sticky',
                    left: 0,
                    zIndex: 10
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      color: '#1976d2',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                      mb: 0.25
                    }}>
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666', 
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      fontFamily: 'monospace',
                      fontWeight: 600
                    }}>
                      {vehicle.licensePlate}
                    </Typography>
                  </Box>
                  
                  <Box 
                    className="mobile-row"
                    sx={{ display: 'flex', flex: 1, overflowX: 'auto' }}
                    onScroll={(e) => {
                      const scrollLeft = e.currentTarget.scrollLeft;
                      const headerScroll = document.getElementById('mobile-header-scroll');
                      if (headerScroll) headerScroll.scrollLeft = scrollLeft;
                      document.querySelectorAll('.mobile-row').forEach((row) => {
                        if (row !== e.currentTarget) row.scrollLeft = scrollLeft;
                      });
                    }}
                  >
                    {statusFilteredCalendarData.map((day, dayIndex) => {
                      const vehicleStatus = day.vehicles.find(v => v.vehicleId === vehicle.id);
                      return (
                        <Box 
                          key={day.date}
                          sx={{ 
                            minWidth: { xs: 44, sm: 50 },
                            borderRight: dayIndex < statusFilteredCalendarData.length - 1 ? '1px solid #e0e0e0' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            backgroundColor: 
                              vehicleStatus?.status === 'rented' ? '#ffebee' :
                              vehicleStatus?.unavailabilityReason ? '#fff3e0' : 
                              vehicleStatus?.status === 'available' ? '#e8f5e8' : '#ffffff',
                            '&:hover': {
                              backgroundColor: 
                                vehicleStatus?.status === 'rented' ? '#ffcdd2' :
                                vehicleStatus?.unavailabilityReason ? '#ffe0b2' : 
                                vehicleStatus?.status === 'available' ? '#c8e6c9' : '#f5f5f5'
                            },
                            transition: 'background-color 0.2s ease',
                            minHeight: { xs: 44, sm: 50 }
                          }}
                          onClick={() => vehicleStatus && handleStatusClick(vehicleStatus, day.date)}
                        >
                          {vehicleStatus?.status === 'rented' && (
                            <Box sx={{ 
                              position: 'absolute',
                              top: { xs: 1, sm: 2 }, 
                              left: { xs: 1, sm: 2 }, 
                              right: { xs: 1, sm: 2 }, 
                              bottom: { xs: 1, sm: 2 },
                              backgroundColor: '#f44336',
                              borderRadius: { xs: 0.5, sm: 1 },
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: { xs: '0.4rem', sm: '0.5rem' },
                              fontWeight: 700,
                              boxShadow: '0 2px 4px rgba(244,67,54,0.3)'
                            }}>
                              {isSmallMobile ? 'P' : 'PRENÁJOM'}
                            </Box>
                          )}
                          {vehicleStatus?.unavailabilityReason && (
                            <Box sx={{ 
                              position: 'absolute',
                              top: { xs: 1, sm: 2 }, 
                              left: { xs: 1, sm: 2 }, 
                              right: { xs: 1, sm: 2 }, 
                              bottom: { xs: 1, sm: 2 },
                              backgroundColor: '#ff9800',
                              borderRadius: { xs: 0.5, sm: 1 },
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: { xs: '0.35rem', sm: '0.45rem' },
                              fontWeight: 700,
                              boxShadow: '0 2px 4px rgba(255,152,0,0.3)'
                            }}>
                              {isSmallMobile 
                                ? (vehicleStatus.unavailabilityType?.charAt(0).toUpperCase() || 'N')
                                : (vehicleStatus.unavailabilityType?.toUpperCase() || 'NEDOSTUPNÉ')
                              }
                            </Box>
                          )}
                          {vehicleStatus?.status === 'available' && !vehicleStatus?.unavailabilityReason && (
                            <Box sx={{ 
                              width: { xs: 4, sm: 6 }, 
                              height: { xs: 4, sm: 6 },
                              borderRadius: '50%',
                              backgroundColor: '#4caf50',
                              boxShadow: '0 1px 3px rgba(76,175,80,0.4)'
                            }} />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    ) : (
    <Card>
      <CardContent>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
            <Typography variant="h6" display="flex" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }}>
            <CalendarIcon sx={{ mr: 1 }} />
              Prehľad Dostupnosti
          </Typography>
          
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* View Mode Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={viewMode} onChange={handleViewModeChange} centered>
            <Tab label="📅 Navigácia mesiacov" value="navigation" />
            <Tab label="📊 Vlastný rozsah" value="range" />
          </Tabs>
        </Box>

        {/* Navigation Mode Controls */}
        {viewMode === 'navigation' && (
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
            <IconButton onClick={handlePrevMonth} size="small">
              <PrevIcon />
            </IconButton>
            
            <Typography 
              variant="h6"
              sx={{ 
                minWidth: { xs: 150, md: 200 }, 
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: { xs: '0.9rem', md: '1.25rem' }
              }}
              onClick={handleToday}
            >
              {format(currentDate, 'MMMM yyyy', { locale: sk })}
            </Typography>
            
            <IconButton onClick={handleNextMonth} size="small">
              <NextIcon />
            </IconButton>
          </Box>
        )}

        {/* Date Range Mode Controls */}
        {viewMode === 'range' && (
          <Card sx={{ mb: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                📊 Vlastný dátumový rozsah
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Od dátumu"
                    type="date"
                    value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value) : null;
                      setFromDate(newDate);
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Do dátumu"
                    type="date"
                    value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value) : null;
                      setToDate(newDate);
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                    <Button size="small" variant="outlined" onClick={() => handleQuickRange(7)}>
                      Dnes + 7 dní
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleQuickRange(14)}>
                      Dnes + 14 dní
                    </Button>  
                    <Button size="small" variant="outlined" onClick={() => handleQuickRange(30)}>
                      Dnes + 30 dní
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error} - Zobrazujem testovacie dáta
          </Alert>
        )}

        {/* Search Bar - Always Visible */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="medium"
                  label="🔍 Vyhľadať vozidlo"
                  placeholder="Zadajte značku, model alebo ŠPZ (napr. BMW, X5, BA123AB...)"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Optimalizované - len ak sa hodnota skutočne zmenila
                    if (value !== searchQuery) {
                      setSearchQuery(value);
                    }
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.1rem'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" gap={1} flexWrap="wrap">
                  {searchQuery && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={() => setSearchQuery('')}
                      color="secondary"
                      variant="outlined"
                    >
                      Vyčistiť hľadanie
                    </Button>
                  )}
                  <Button
                    size="small"
                    onClick={toggleFilters}
                    startIcon={<FilterIcon />}
                    endIcon={showFilters ? <CollapseIcon /> : <ExpandIcon />}
                    variant={showFilters ? "contained" : "outlined"}
                  >
                    Rozšírené filtre
                  </Button>
                  <Button
                    size="small"
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
                    startIcon={<AddIcon />}
                    variant="contained"
                    color="primary"
                  >
                    Vytvoriť nedostupnosť
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Advanced Filters Panel - Collapsible */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" display="flex" alignItems="center">
                  <FilterIcon sx={{ mr: 1 }} />
                  Rozšírené filtre
                        </Typography>
                {(statusFilter !== 'all' || brandFilter !== 'all' || companyFilter !== 'all' || availableFromDate || availableToDate) && (
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      setStatusFilter('all');
                      setBrandFilter('all');
                      setCompanyFilter('all');
                      setAvailableFromDate('');
                      setAvailableToDate('');
                    }}
                    color="secondary"
                  >
                    Vyčistiť filtre
                  </Button>
                )}
              </Box>

              <Grid container spacing={2}>
                {/* Status Filter */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stav vozidiel</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Stav vozidiel"
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <MenuItem value="all">📋 Všetky stavy</MenuItem>
                      <MenuItem value="available">✅ Dostupné</MenuItem>
                      <MenuItem value="rented">🔴 Obsadené</MenuItem>
                      <MenuItem value="maintenance">🔧 Údržba</MenuItem>
                      <MenuItem value="service">⚙️ Servis</MenuItem>
                      <MenuItem value="repair">🔨 Oprava</MenuItem>
                      <MenuItem value="blocked">🚫 Blokované</MenuItem>
                      <MenuItem value="cleaning">🧽 Čistenie</MenuItem>
                      <MenuItem value="inspection">✅ Kontrola</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Brand Filter */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Značka vozidiel</InputLabel>
                    <Select
                      value={brandFilter}
                      label="Značka vozidiel"
                      onChange={(e) => setBrandFilter(e.target.value)}
                    >
                      <MenuItem value="all">🚗 Všetky značky</MenuItem>
                      {uniqueBrands.map(brand => (
                        <MenuItem key={brand} value={brand}>
                          {brand}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Company Filter */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={companyFilter}
                      label="Firma"
                      onChange={(e) => setCompanyFilter(e.target.value)}
                    >
                      <MenuItem value="all">🏢 Všetky firmy</MenuItem>
                      {uniqueCompanies.map(company => (
                        <MenuItem key={company} value={company}>
                          {company}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date Range Availability Filter */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Voľné od-do</InputLabel>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                      <TextField
                        size="small"
                        type="date"
                        value={availableFromDate}
                        onChange={(e) => setAvailableFromDate(e.target.value)}
                        sx={{ flex: 1 }}
                        inputProps={{ style: { fontSize: '0.75rem' } }}
                      />
                      <TextField
                        size="small"
                        type="date"
                        value={availableToDate}
                        onChange={(e) => setAvailableToDate(e.target.value)}
                        sx={{ flex: 1 }}
                        inputProps={{ style: { fontSize: '0.75rem' } }}
                      />
                    </Box>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        {/* BOOKING.COM STYLE PROFESSIONAL CALENDAR */}
        <Card sx={{ 
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: 2
        }}>
          <CardContent sx={{ p: 0 }}>
            {filteredVehicles.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={6}>
                <SearchIcon color="disabled" sx={{ fontSize: 64 }} />
                <Typography variant="h5" color="textSecondary" textAlign="center">
                  Žiadne vozidlá nevyhovujú filtrom
                        </Typography>
                <Typography variant="body1" color="textSecondary" textAlign="center">
                  Skúste upraviť filtre alebo vyčistiť vyhľadávanie
                </Typography>
                <Button variant="contained" onClick={handleResetFilters} sx={{ mt: 1 }}>
                  Vyčistiť všetky filtre
                </Button>
                      </Box>
            ) : (
              <>
                {/* HEADER S DÁTUMAMI - HORIZONTÁLNE */}
                <Box sx={{ 
                  display: 'flex',
                  borderBottom: '2px solid #e0e0e0',
                  backgroundColor: '#f8f9fa',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>
                  {/* Vozidlá header */}
                  <Box sx={{ 
                    minWidth: 360,
                    maxWidth: 360,
                    p: 2.5,
                    borderRight: '2px solid #e0e0e0',
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                      🚗 Vozidlá ({filteredVehicles.length})
                    </Typography>
                  </Box>
                  
                  {/* Dátumy header - horizontálne scroll */}
                  <Box 
                    id="calendar-header-scroll"
                    sx={{ 
                      display: 'flex',
                      flex: 1,
                      overflowX: 'auto',
                      '&::-webkit-scrollbar': { height: 8 },
                      '&::-webkit-scrollbar-thumb': { 
                        backgroundColor: '#1976d2', 
                        borderRadius: 4,
                        '&:hover': { backgroundColor: '#1565c0' }
                      },
                      '&::-webkit-scrollbar-track': { backgroundColor: '#f5f5f5' }
                    }}
                    onScroll={(e) => {
                      // Sync scroll with vehicle rows
                      const scrollLeft = e.currentTarget.scrollLeft;
                      const vehicleRows = document.querySelectorAll('.vehicle-calendar-row');
                      vehicleRows.forEach((row) => {
                        row.scrollLeft = scrollLeft;
                      });
                    }}
                  >
                    {statusFilteredCalendarData.map((day, index) => (
                      <Box 
                        key={day.date}
                        sx={{ 
                          minWidth: 80,
                          maxWidth: 80,
                          p: 1.5,
                          borderRight: index < statusFilteredCalendarData.length - 1 ? '1px solid #e0e0e0' : 'none',
                          textAlign: 'center',
                          backgroundColor: isToday(new Date(day.date)) ? '#e3f2fd' : '#f8f9fa',
                          transition: 'background-color 0.2s',
                          '&:hover': { backgroundColor: '#e1f5fe' }
                        }}
                      >
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.95rem',
                          color: isToday(new Date(day.date)) ? '#1976d2' : '#333'
                        }}>
                          {format(new Date(day.date), 'd')}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: isToday(new Date(day.date)) ? '#1976d2' : '#666', 
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {format(new Date(day.date), 'EEE', { locale: sk })}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* VOZIDLÁ ROWS - BOOKING.COM STYLE */}
                <Box>
                  {filteredVehicles.map((vehicle, vehicleIndex) => (
                    <Box 
                      key={vehicle.id}
                      sx={{ 
                        display: 'flex',
                        borderBottom: vehicleIndex < filteredVehicles.length - 1 ? '1px solid #e0e0e0' : 'none',
                        '&:hover': { backgroundColor: '#f8f9fa' },
                        minHeight: 70,
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {/* VOZIDLO INFO - STICKY LEFT */}
                      <Box sx={{ 
                        minWidth: 360,
                        maxWidth: 360,
                        p: 2,
                        borderRight: '2px solid #e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff',
                        position: 'sticky',
                        left: 0,
                        zIndex: 10,
                        boxShadow: '2px 0 4px rgba(0,0,0,0.05)'
                      }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          mb: 0.5,
                          fontSize: '1.1rem',
                          color: '#1976d2'
                        }}>
                          {vehicle.brand} {vehicle.model}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#666',
                          fontWeight: 500,
                          mb: 0.25
                        }}>
                          📋 {vehicle.licensePlate}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#888',
                          fontSize: '0.75rem'
                        }}>
                          🏢 {vehicle.company}
                        </Typography>
                      </Box>
                      
                      {/* KALENDÁR GRID PRE VOZIDLO */}
                      <Box 
                        className="vehicle-calendar-row"
                        sx={{ 
                          display: 'flex',
                          flex: 1,
                          overflowX: 'auto'
                        }}
                        onScroll={(e) => {
                          // Sync scroll with header
                          const scrollLeft = e.currentTarget.scrollLeft;
                          const headerScroll = document.getElementById('calendar-header-scroll');
                          if (headerScroll) {
                            headerScroll.scrollLeft = scrollLeft;
                          }
                          // Sync with other vehicle rows
                          const otherRows = document.querySelectorAll('.vehicle-calendar-row');
                          otherRows.forEach((row) => {
                            if (row !== e.currentTarget) {
                              row.scrollLeft = scrollLeft;
                            }
                          });
                        }}
                      >
                        {statusFilteredCalendarData.map((day, dayIndex) => {
                          const vehicleStatus = day.vehicles.find(v => v.vehicleId === vehicle.id);
                          
                return (
                            <Box 
                              key={day.date}
                              sx={{ 
                                minWidth: 80,
                                maxWidth: 80,
                                borderRight: dayIndex < statusFilteredCalendarData.length - 1 ? '1px solid #e0e0e0' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                backgroundColor: 
                                  vehicleStatus?.status === 'rented' ? '#ffebee' :
                                  vehicleStatus?.unavailabilityReason ? '#fff3e0' : 
                                  vehicleStatus?.status === 'available' ? '#e8f5e8' : '#ffffff',
                                transition: 'all 0.2s ease',
                                '&:hover': { 
                                  backgroundColor: 
                                    vehicleStatus?.status === 'rented' ? '#ffcdd2' :
                                    vehicleStatus?.unavailabilityReason ? '#ffe0b2' :
                                    vehicleStatus?.status === 'available' ? '#c8e6c9' : '#f0f0f0',
                                  transform: 'scale(1.02)'
                                }
                              }}
                              onClick={() => vehicleStatus && handleStatusClick(vehicleStatus, day.date)}
                            >
                              {/* PRENÁJOM BLOCK */}
                              {vehicleStatus?.status === 'rented' && (
                                <Box sx={{ 
                                  position: 'absolute',
                                  top: 6,
                                  left: 6,
                                  right: 6,
                                  bottom: 6,
                                  backgroundColor: '#f44336',
                                  borderRadius: 1.5,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  textAlign: 'center',
                                  boxShadow: '0 2px 8px rgba(244,67,54,0.3)',
                                  overflow: 'hidden'
                                }}>
                                  <Box>PRENÁJOM</Box>
                                  {vehicleStatus.customerName && (
                                    <Box sx={{ 
                                      fontSize: '0.55rem',
                                      mt: 0.25,
                                      opacity: 0.9,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '100%'
                                    }}>
                                      {vehicleStatus.customerName}
                                    </Box>
                                  )}
                                </Box>
                              )}
                              
                              {/* NEDOSTUPNOSŤ BLOCK */}
                              {vehicleStatus?.unavailabilityReason && (
                                <Box sx={{ 
                                  position: 'absolute',
                                  top: 6,
                                  left: 6,
                                  right: 6,
                                  bottom: 6,
                                  backgroundColor: '#ff9800',
                                  borderRadius: 1.5,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  textAlign: 'center',
                                  boxShadow: '0 2px 8px rgba(255,152,0,0.3)',
                                  overflow: 'hidden'
                                }}>
                                  <Box>{vehicleStatus.unavailabilityType?.toUpperCase() || 'NEDOSTUPNÉ'}</Box>
                                  <Box sx={{ 
                                    fontSize: '0.5rem',
                                    mt: 0.25,
                                    opacity: 0.9,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%'
                                  }}>
                                    {vehicleStatus.unavailabilityReason}
                                  </Box>
                                </Box>
                              )}
                              
                              {/* DOSTUPNÉ INDICATOR */}
                              {vehicleStatus?.status === 'available' && !vehicleStatus?.unavailabilityReason && (
                                <Box sx={{ 
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: '#4caf50',
                                  boxShadow: '0 2px 4px rgba(76,175,80,0.3)',
                                  transition: 'transform 0.2s',
                                  '&:hover': { transform: 'scale(1.2)' }
                                }} />
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        <Box mt={2} display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
          <Box display="flex" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} gap={2} flexWrap="wrap">
            <Typography variant="caption" color="textSecondary" textAlign={{ xs: 'center', md: 'left' }}>
              Zobrazuje sa: <strong>{filteredVehicles.length}</strong> z {vehicles.length} vozidiel
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
              •  {calendarData.length} dní
                      </Typography>
            {(searchQuery || statusFilter !== 'all' || brandFilter !== 'all' || companyFilter !== 'all') && (
                              <Chip
                label="Filtrované" 
                                size="small"
                color="primary" 
                                variant="outlined"
                icon={<FilterIcon />}
              />
            )}
          </Box>
          <Typography variant="caption" color="textSecondary" textAlign={{ xs: 'center', md: 'right' }} sx={{ display: { xs: 'none', sm: 'block' } }}>
            💡 Tip: Horizontálne scrollujte pre zobrazenie všetkých vozidiel
          </Typography>
        </Box>
      </CardContent>
    </Card>
    )}

    {/* Rental Details Dialog */}
    <Dialog open={rentalDetailsOpen} onClose={handleCloseRentalDetails} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <OrderIcon />
          Detaily nájmu
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loadingRentalDetails ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Načítavam detaily nájmu...
          </Typography>
        </Box>
        ) : selectedRental && selectedRental.id ? (
          <Grid container spacing={2}>
            {/* Order Information */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <OrderIcon />
                    {selectedRental.orderNumber ? `Objednávka #${selectedRental.orderNumber}` : `Prenájom #${selectedRental.id.slice(0, 8)}`}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <DateIcon />
                    <Typography variant="subtitle2">Dátumy nájmu:</Typography>
                  </Box>
                  <Typography variant="body2">
                    Od: {format(new Date(selectedRental.startDate), 'dd.MM.yyyy', { locale: sk })}
                  </Typography>
                  <Typography variant="body2">
                    Do: {format(new Date(selectedRental.endDate), 'dd.MM.yyyy', { locale: sk })}
                  </Typography>
                  
                  {selectedRental.handoverPlace && (
                    <>
                      <Box display="flex" alignItems="center" gap={1} mt={2} mb={1}>
                        <LocationIcon />
                        <Typography variant="subtitle2">Miesto odovzdania:</Typography>
                      </Box>
                      <Typography variant="body2">
                        {selectedRental.handoverPlace}
                      </Typography>
                    </>
                  )}
      </CardContent>
    </Card>
            </Grid>

            {/* Customer Information */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <CustomerIcon />
                    Zákazník
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {selectedRental.customerName}
                  </Typography>
                  {selectedRental.customerPhone && (
                    <Typography variant="body2" display="flex" alignItems="center" gap={0.5} mb={0.5}>
                      <PhoneIcon fontSize="small" />
                      {selectedRental.customerPhone}
                    </Typography>
                  )}
                  {selectedRental.customerEmail && (
                    <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                      <EmailIcon fontSize="small" />
                      {selectedRental.customerEmail}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Price Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <PriceIcon />
                    Cena
                  </Typography>
                  <Typography variant="body2">
                    <strong>Celková cena: {selectedRental.totalPrice} €</strong>
                  </Typography>
                  {selectedRental.commission > 0 && (
                    <Typography variant="body2">
                      Provízia: {selectedRental.commission} €
                    </Typography>
                  )}
                  <Typography variant="body2">
                    Platba: {selectedRental.paymentMethod === 'cash' ? 'Hotovosť' : 
                            selectedRental.paymentMethod === 'bank_transfer' ? 'Prevod' : 
                            selectedRental.paymentMethod}
                  </Typography>
                  <Typography variant="body2">
                    Stav: {selectedRental.paid ? '✅ Zaplatené' : '❌ Nezaplatené'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Additional Information */}
            {(selectedRental.deposit || selectedRental.allowedKilometers) && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                      <DepositIcon />
                      Dodatočné info
                    </Typography>
                    {selectedRental.deposit && (
                      <Typography variant="body2">
                        Depozit: {selectedRental.deposit} €
                      </Typography>
                    )}
                    {selectedRental.allowedKilometers && (
                      <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                        <KilometersIcon fontSize="small" />
                        Povolené km: {selectedRental.allowedKilometers}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Notes */}
            {selectedRental.notes && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Poznámky
                    </Typography>
                    <Typography variant="body2">
                      {selectedRental.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        ) : (
          <Box display="flex" justifyContent="center" p={4}>
            <Typography variant="body2" color="textSecondary">
              Žiadne detaily nájmu pre tento vozidlo.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseRentalDetails} color="primary">
          Zavrieť
        </Button>
      </DialogActions>
    </Dialog>

    {/* Maintenance Management Dialog */}
    <Dialog open={maintenanceDialogOpen} onClose={handleMaintenanceClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingMaintenance ? 'Upraviť nedostupnosť' : 'Pridať nedostupnosť vozidla'}
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            {maintenanceFormData.vehicleId && clickedVehicleId ? (
              <TextField
                label="Vozidlo"
                value={state.vehicles.find(v => v.id === maintenanceFormData.vehicleId)?.brand + ' ' + state.vehicles.find(v => v.id === maintenanceFormData.vehicleId)?.model + ' (' + state.vehicles.find(v => v.id === maintenanceFormData.vehicleId)?.licensePlate + ')' || 'Neznáme vozidlo'}
                fullWidth
                disabled
                variant="outlined"
              />
            ) : (
              <Autocomplete
                options={state.vehicles}
                getOptionLabel={(vehicle) => `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
                value={state.vehicles.find(v => v.id === maintenanceFormData.vehicleId) || null}
                onChange={(event, newValue) => {
                  setMaintenanceFormData(prev => ({
                    ...prev,
                    vehicleId: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vyberte vozidlo *"
                    variant="outlined"
                    required
                    error={!maintenanceFormData.vehicleId}
                    helperText={!maintenanceFormData.vehicleId ? 'Vyberte vozidlo' : ''}
                  />
                )}
                fullWidth
              />
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Dátum začiatku"
              type="date"
              value={maintenanceFormData.startDate}
              onChange={(e) => {
                const value = e.target.value;
                if (value !== maintenanceFormData.startDate) {
                  setMaintenanceFormData(prev => ({ ...prev, startDate: value }));
                }
              }}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Dátum ukončenia"
              type="date"
              value={maintenanceFormData.endDate}
              onChange={(e) => {
                const value = e.target.value;
                if (value !== maintenanceFormData.endDate) {
                  setMaintenanceFormData(prev => ({ ...prev, endDate: value }));
                }
              }}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Typ nedostupnosti</InputLabel>
              <Select
                value={maintenanceFormData.type}
                label="Typ nedostupnosti"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value !== maintenanceFormData.type) {
                    setMaintenanceFormData(prev => ({ ...prev, type: value as any }));
                  }
                }}
              >
                <MenuItem value="maintenance">🔧 Údržba</MenuItem>
                <MenuItem value="service">⚙️ Servis</MenuItem>
                <MenuItem value="repair">🔨 Oprava</MenuItem>
                <MenuItem value="blocked">🚫 Blokované</MenuItem>
                <MenuItem value="cleaning">🧽 Čistenie</MenuItem>
                <MenuItem value="inspection">✅ Kontrola</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Priorita</InputLabel>
              <Select
                value={maintenanceFormData.priority}
                label="Priorita"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value !== maintenanceFormData.priority) {
                    setMaintenanceFormData(prev => ({ ...prev, priority: value as any }));
                  }
                }}
              >
                <MenuItem value={1}>🔴 Kritická</MenuItem>
                <MenuItem value={2}>🟡 Normálna</MenuItem>
                <MenuItem value={3}>🟢 Nízka</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Dôvod nedostupnosti"
              value={maintenanceFormData.reason}
              onChange={(e) => {
                const value = e.target.value;
                // Optimalizované - len ak sa hodnota skutočne zmenila
                if (value !== maintenanceFormData.reason) {
                  setMaintenanceFormData(prev => ({ ...prev, reason: value }));
                }
              }}
              fullWidth
              required
              placeholder="Napr. Pravidelný servis, Oprava brzd, Čistenie..."
              // Optimalizácia pre rýchle písanie
              inputProps={{
                autoComplete: 'off',
                spellCheck: 'false'
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Poznámky"
              value={maintenanceFormData.notes}
              onChange={(e) => {
                const value = e.target.value;
                // Optimalizované - len ak sa hodnota skutočne zmenila
                if (value !== maintenanceFormData.notes) {
                  setMaintenanceFormData(prev => ({ ...prev, notes: value }));
                }
              }}
              fullWidth
              // Optimalizácia pre rýchle písanie
              inputProps={{
                autoComplete: 'off',
                spellCheck: 'false'
              }}
              multiline
              rows={3}
              placeholder="Dodatočné informácie..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleMaintenanceClose}>
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
    </>
  );
};

export default AvailabilityCalendar; 