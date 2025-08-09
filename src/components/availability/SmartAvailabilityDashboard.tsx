/**
 * 🎯 SMART AVAILABILITY DASHBOARD
 * 
 * Optimalizovaný pre najčastejší use case: "Aké autá máme dostupné od dnes na X dní?"
 * 
 * Features:
 * - Table view optimalizovaný pre mobile
 * - Smart filtering (kategória, značka, lokácia, firma)
 * - Dôvod nedostupnosti (servis, maintenance, prenájom)
 * - Maximálne využitie priestoru
 * - Unified cache integration
 * - Real-time updates
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format, addDays, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';

import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/smartLogger';
import { cacheHelpers, smartInvalidation } from '../../utils/unifiedCache';
import { VehicleCategory } from '../../types';
import { apiService } from '../../services/api';

interface AvailabilityData {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  brand: string;
  category: VehicleCategory;
  company: string;
  location?: string;
  dailyStatus: Array<{
    date: string;
    status: 'available' | 'rented' | 'maintenance' | 'service' | 'blocked';
    reason?: string;
    customerName?: string;
    rentalId?: string;
  }>;
  availableDays: number;
  totalDays: number;
  availabilityPercent: number;
}

interface FilterOptions {
  dateFrom: string;
  dateTo: string;
  categories: VehicleCategory[];
  brands: string[];
  companies: string[];
  locations: string[];
  availableOnly: boolean;
  minAvailabilityPercent: number;
}

interface LoadMoreState {
  canLoadMore: boolean;
  isLoadingMore: boolean;
  currentDays: number;
  maxDays: number; // 6 mesiacov = ~180 dní
}

interface SmartAvailabilityDashboardProps {
  isMobile?: boolean;
}

const SmartAvailabilityDashboard: React.FC<SmartAvailabilityDashboardProps> = ({
  isMobile: propIsMobile
}) => {
  const { state } = useApp();
  const { state: authState } = useAuth();
  const theme = useTheme();
  const fallbackIsMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const isMobile = propIsMobile !== undefined ? propIsMobile : fallbackIsMobile;

  // State
  const [loading, setLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // ⚡ PROGRESSIVE LOADING STATE
  const [loadMoreState, setLoadMoreState] = useState<LoadMoreState>({
    canLoadMore: true,
    isLoadingMore: false,
    currentDays: 14, // Start with 14 days
    maxDays: 180 // 6 months max
  });
  
  // Smart defaults for filters
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: format(new Date(), 'yyyy-MM-dd'), // Today
    dateTo: format(addDays(new Date(), 14), 'yyyy-MM-dd'), // +14 days (initial load)
    categories: [],
    brands: [],
    companies: [],
    locations: [],
    availableOnly: false,
    minAvailabilityPercent: 0
  });

  // Derived data
  const availableVehicles = state.vehicles || [];
  const availableBrands = useMemo(() => 
    [...new Set(availableVehicles.map(v => v.brand).filter(Boolean))].sort(),
    [availableVehicles]
  );
  const availableCategories = useMemo(() => 
    [...new Set(availableVehicles.map(v => v.category).filter(Boolean))].sort(),
    [availableVehicles]
  );
  const availableCompanies = useMemo(() => 
    [...new Set(availableVehicles.map(v => v.company).filter(Boolean))].sort(),
    [availableVehicles]
  );

  /**
   * ⚡ REAL API: Smart availability calculation with real data
   */
  const calculateAvailability = useCallback(async (filters: FilterOptions): Promise<AvailabilityData[]> => {
    const { dateFrom, dateTo } = filters;
    const startDate = parseISO(dateFrom);
    const endDate = parseISO(dateTo);
    
    // Generate date range
    const dateRange: string[] = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dateRange.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }

    logger.performance('Calculating availability', { 
      dateFrom, 
      dateTo, 
      daysCount: dateRange.length,
      vehiclesCount: availableVehicles.length 
    });

    // 🗄️ UNIFIED CACHE: Try to get cached availability data
    const cacheKey = `availability-${dateFrom}-${dateTo}`;
    const cachedData = cacheHelpers.calendar.get(cacheKey);

    let calendarData: any[] = [];
    if (cachedData) {
      logger.cache('Using cached availability data for calculation');
      calendarData = cachedData.calendar || [];
    } else {
      // ⚡ REAL API CALL: Fetch fresh data from /availability/calendar
      try {
        logger.api('Fetching fresh availability data from API', { dateFrom, dateTo });
        
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/availability/calendar?` + 
          `startDate=${dateFrom}&endDate=${dateTo}&fields=calendar,vehicles,unavailabilities&optimize=true`,
          {
            headers: {
              'Authorization': `Bearer ${authState?.token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API responded with ${response.status}: ${response.statusText}`);
        }

        const apiData = await response.json();
        
        if (!apiData.success) {
          throw new Error(apiData.error || 'API returned unsuccessful response');
        }

        calendarData = apiData.data.calendar || [];
        
        // ⚡ CACHE: Store fresh data for future use (5 minutes TTL)
        cacheHelpers.calendar.set(cacheKey, apiData.data);
        
        logger.performance('Real API data loaded successfully', {
          calendarDays: calendarData.length,
          vehicles: apiData.data.vehicles?.length || 0,
          unavailabilities: apiData.data.unavailabilities?.length || 0,
          cacheKey
        });
        
      } catch (error) {
        logger.error('Failed to fetch availability data from API', { error, dateFrom, dateTo });
        
        // ⚠️ FALLBACK: Return empty data structure to prevent crashes
        calendarData = [];
        
        // Optional: Show user-friendly error message
        throw new Error('Nepodarilo sa načítať dáta dostupnosti. Skúste to znovu.');
      }
    }

    // Process each vehicle
    const result: AvailabilityData[] = availableVehicles.map(vehicle => {
      const dailyStatus = dateRange.map(date => {
        // Find calendar data for this vehicle and date
        const dayData = calendarData.find(cal => 
          format(parseISO(cal.date), 'yyyy-MM-dd') === date
        );
        
        const vehicleStatus = dayData?.vehicles?.find((v: any) => v.vehicleId === vehicle.id);
        
        if (!vehicleStatus) {
          return {
            date,
            status: 'available' as const,
            reason: undefined,
            customerName: undefined,
            rentalId: undefined
          };
        }

        return {
          date,
          status: vehicleStatus.status || 'available',
          reason: vehicleStatus.unavailability_reason || vehicleStatus.rental_type,
          customerName: vehicleStatus.customer_name,
          rentalId: vehicleStatus.rental_id
        };
      });

      const availableDays = dailyStatus.filter(day => day.status === 'available').length;
      const totalDays = dailyStatus.length;
      const availabilityPercent = totalDays > 0 ? Math.round((availableDays / totalDays) * 100) : 0;

      return {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        licensePlate: vehicle.licensePlate,
        brand: vehicle.brand,
        category: vehicle.category || 'other',
        company: vehicle.company || '',
        location: (vehicle as any).location || '',
        dailyStatus,
        availableDays,
        totalDays,
        availabilityPercent
      };
    });

    return result;
  }, [availableVehicles]);

  /**
   * Apply filters to availability data
   */
  const filteredData = useMemo(() => {
    return availabilityData.filter(vehicle => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(vehicle.category)) {
        return false;
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(vehicle.brand)) {
        return false;
      }

      // Company filter
      if (filters.companies.length > 0 && !filters.companies.includes(vehicle.company)) {
        return false;
      }

      // Available only filter
      if (filters.availableOnly && vehicle.availabilityPercent < 100) {
        return false;
      }

      // Minimum availability percent filter
      if (vehicle.availabilityPercent < filters.minAvailabilityPercent) {
        return false;
      }

      return true;
    });
  }, [availabilityData, filters]);

  /**
   * Load availability data
   */
  const loadAvailabilityData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await calculateAvailability(filters);
      setAvailabilityData(data);
      
      logger.performance('Availability data calculated', {
        vehiclesProcessed: data.length,
        dateRange: `${filters.dateFrom} to ${filters.dateTo}`,
        averageAvailability: Math.round(
          data.reduce((sum, v) => sum + v.availabilityPercent, 0) / data.length
        )
      });
    } catch (error) {
      logger.error('Failed to load availability data', error);
    } finally {
      setLoading(false);
    }
  }, [calculateAvailability, filters]);

  /**
   * ⚡ PROGRESSIVE LOADING: Load more days
   */
  const loadMoreDays = useCallback(async () => {
    if (loadMoreState.isLoadingMore || !loadMoreState.canLoadMore) return;
    
    const additionalDays = 14; // Load 14 more days each time
    const newTotalDays = loadMoreState.currentDays + additionalDays;
    
    if (newTotalDays > loadMoreState.maxDays) {
      // Reached maximum, load remaining days only
      const remainingDays = loadMoreState.maxDays - loadMoreState.currentDays;
      if (remainingDays <= 0) return;
      
      setLoadMoreState(prev => ({ ...prev, canLoadMore: false }));
    }
    
    setLoadMoreState(prev => ({ ...prev, isLoadingMore: true }));
    
    try {
      const today = new Date();
      const newEndDate = addDays(today, Math.min(newTotalDays, loadMoreState.maxDays));
      
      // Update filters to include more days
      const newFilters = {
        ...filters,
        dateTo: format(newEndDate, 'yyyy-MM-dd')
      };
      
      logger.performance('Loading more days', { 
        currentDays: loadMoreState.currentDays, 
        additionalDays, 
        newTotalDays: Math.min(newTotalDays, loadMoreState.maxDays) 
      });
      
      // ⚡ IMPORTANT: Always fetch fresh API data for extended range
      const newData = await calculateAvailability(newFilters);
      setAvailabilityData(newData);
      setFilters(newFilters);
      
      setLoadMoreState(prev => ({
        ...prev,
        currentDays: Math.min(newTotalDays, prev.maxDays),
        canLoadMore: newTotalDays < prev.maxDays,
        isLoadingMore: false
      }));
      
    } catch (error) {
      logger.error('Failed to load more days', error);
      setLoadMoreState(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [loadMoreState, filters, calculateAvailability]);

  /**
   * Quick filter presets
   */
  const applyQuickFilter = useCallback((preset: 'today' | 'week' | 'month' | 'available-only') => {
    const today = new Date();
    
    switch (preset) {
      case 'today':
        const newFilters1 = {
          ...filters,
          dateFrom: format(today, 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd')
        };
        setFilters(newFilters1);
        setLoadMoreState(prev => ({ ...prev, currentDays: 1, canLoadMore: true }));
        break;
      case 'week':
        const newFilters7 = {
          ...filters,
          dateFrom: format(today, 'yyyy-MM-dd'),
          dateTo: format(addDays(today, 7), 'yyyy-MM-dd')
        };
        setFilters(newFilters7);
        setLoadMoreState(prev => ({ ...prev, currentDays: 7, canLoadMore: true }));
        break;
      case 'month':
        const newFilters30 = {
          ...filters,
          dateFrom: format(today, 'yyyy-MM-dd'),
          dateTo: format(addDays(today, 30), 'yyyy-MM-dd')
        };
        setFilters(newFilters30);
        setLoadMoreState(prev => ({ ...prev, currentDays: 30, canLoadMore: true }));
        break;
      case 'available-only':
        setFilters(prev => ({
          ...prev,
          availableOnly: !prev.availableOnly
        }));
        break;
    }
  }, [filters]);

  /**
   * Get status color and icon
   */
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'available':
        return { color: 'success', icon: <AvailableIcon fontSize="small" />, label: 'Dostupné' };
      case 'rented':
        return { color: 'error', icon: <UnavailableIcon fontSize="small" />, label: 'Prenajatý' };
      case 'maintenance':
        return { color: 'warning', icon: <MaintenanceIcon fontSize="small" />, label: 'Servis' };
      case 'service':
        return { color: 'info', icon: <MaintenanceIcon fontSize="small" />, label: 'Údržba' };
      case 'blocked':
        return { color: 'secondary', icon: <UnavailableIcon fontSize="small" />, label: 'Blokovaný' };
      default:
        return { color: 'default', icon: <CarIcon fontSize="small" />, label: status };
    }
  };

  /**
   * Render availability timeline for mobile
   */
  const renderMobileTimeline = (vehicle: AvailabilityData) => {
    const maxDaysToShow = 7; // Show max 7 days on mobile
    const visibleDays = vehicle.dailyStatus.slice(0, maxDaysToShow);
    
    return (
      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
        {visibleDays.map((day, index) => {
          const statusDisplay = getStatusDisplay(day.status);
          return (
            <Tooltip 
              key={index}
              title={`${format(parseISO(day.date), 'dd.MM', { locale: sk })}: ${statusDisplay.label}${day.reason ? ` (${day.reason})` : ''}`}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: day.status === 'available' ? 'success.light' : 'error.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {format(parseISO(day.date), 'd')}
              </Box>
            </Tooltip>
          );
        })}
        {vehicle.dailyStatus.length > maxDaysToShow && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Typography variant="caption" color="text.secondary">
              +{vehicle.dailyStatus.length - maxDaysToShow} dní
            </Typography>
          </Box>
        )}
      </Stack>
    );
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    if (state?.dataLoaded?.vehicles && authState?.isAuthenticated) {
      loadAvailabilityData();
    }
  }, [loadAvailabilityData, state?.dataLoaded?.vehicles, authState?.isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <RefreshIcon sx={{ animation: 'spin 1s linear infinite', mr: 2 }} />
        <Typography>Načítavam dostupnosť vozidiel...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      {/* Header with quick filters */}
      <Box sx={{ mb: 2 }}>
        <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
          🚗 Smart Dostupnosť Vozidiel
        </Typography>
        
        {/* Quick Filter Buttons */}
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={1} 
          sx={{ mb: 2 }}
          flexWrap="wrap"
        >
          <Button 
            size="small" 
            variant={filters.dateTo === format(new Date(), 'yyyy-MM-dd') ? "contained" : "outlined"}
            onClick={() => applyQuickFilter('today')}
          >
            Dnes
          </Button>
          <Button 
            size="small" 
            variant={filters.dateTo === format(addDays(new Date(), 7), 'yyyy-MM-dd') ? "contained" : "outlined"}
            onClick={() => applyQuickFilter('week')}
          >
            7 dní
          </Button>
          <Button 
            size="small" 
            variant={filters.dateTo === format(addDays(new Date(), 30), 'yyyy-MM-dd') ? "contained" : "outlined"}
            onClick={() => applyQuickFilter('month')}
          >
            30 dní
          </Button>
          <Button 
            size="small" 
            variant={filters.availableOnly ? "contained" : "outlined"}
            color={filters.availableOnly ? "success" : "primary"}
            onClick={() => applyQuickFilter('available-only')}
          >
            {filters.availableOnly ? "✓ Len dostupné" : "Len dostupné"}
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filtre
          </Button>
        </Stack>

        {/* Summary */}
        <Typography variant="body2" color="text.secondary">
          Zobrazujem {filteredData.length} vozidiel z {availabilityData.length} • 
          Obdobie: {format(parseISO(filters.dateFrom), 'dd.MM.yyyy')} - {format(parseISO(filters.dateTo), 'dd.MM.yyyy')} •
          Priemer dostupnosti: {Math.round(
            filteredData.reduce((sum, v) => sum + v.availabilityPercent, 0) / Math.max(filteredData.length, 1)
          )}%
        </Typography>
      </Box>

      {/* Mobile Card View */}
      {isMobile ? (
        <Stack spacing={1}>
          {filteredData.map((vehicle) => (
            <Card key={vehicle.vehicleId} variant="outlined" sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {vehicle.vehicleName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {vehicle.licensePlate} • {vehicle.company}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      size="small" 
                      label={`${vehicle.availableDays}/${vehicle.totalDays} dní`}
                      color={vehicle.availabilityPercent >= 80 ? 'success' : 
                             vehicle.availabilityPercent >= 50 ? 'warning' : 'error'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>
                <Typography variant="h6" color={
                  vehicle.availabilityPercent >= 80 ? 'success.main' : 
                  vehicle.availabilityPercent >= 50 ? 'warning.main' : 'error.main'
                }>
                  {vehicle.availabilityPercent}%
                </Typography>
              </Box>
              {renderMobileTimeline(vehicle)}
            </Card>
          ))}
        </Stack>
      ) : (
        /* Desktop Table View */
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vozidlo</TableCell>
                <TableCell>EČV</TableCell>
                <TableCell>Kategória</TableCell>
                <TableCell>Firma</TableCell>
                <TableCell align="center">Dostupnosť</TableCell>
                <TableCell align="center">Timeline</TableCell>
                <TableCell align="center">Akcie</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((vehicle) => (
                <TableRow key={vehicle.vehicleId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {vehicle.vehicleName}
                    </Typography>
                  </TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>
                    <Chip size="small" label={vehicle.category} variant="outlined" />
                  </TableCell>
                  <TableCell>{vehicle.company}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={
                          vehicle.availabilityPercent >= 80 ? 'success.main' : 
                          vehicle.availabilityPercent >= 50 ? 'warning.main' : 'error.main'
                        }
                      >
                        {vehicle.availabilityPercent}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({vehicle.availableDays}/{vehicle.totalDays})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {vehicle.dailyStatus.slice(0, 14).map((day, index) => {
                        const statusDisplay = getStatusDisplay(day.status);
                        return (
                          <Tooltip 
                            key={index}
                            title={`${format(parseISO(day.date), 'dd.MM', { locale: sk })}: ${statusDisplay.label}${day.reason ? ` (${day.reason})` : ''}`}
                          >
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: 0.5,
                                bgcolor: day.status === 'available' ? 'success.light' : 'error.light',
                                border: day.status === 'available' ? '1px solid' : 'none',
                                borderColor: 'success.main'
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small">
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ⚡ PROGRESSIVE LOADING: Load More Button */}
      {loadMoreState.canLoadMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={loadMoreDays}
            disabled={loadMoreState.isLoadingMore}
            startIcon={loadMoreState.isLoadingMore ? <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} /> : <AddIcon />}
            size="large"
          >
            {loadMoreState.isLoadingMore 
              ? 'Načítavam ďalších 14 dní...' 
              : `Načítať ďalších 14 dní (${loadMoreState.currentDays}/${loadMoreState.maxDays})`
            }
          </Button>
        </Box>
      )}

      {/* Max days reached info */}
      {!loadMoreState.canLoadMore && loadMoreState.currentDays >= loadMoreState.maxDays && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            📅 Dosiahli ste maximálny rozsah {loadMoreState.maxDays} dní (6 mesiacov)
          </Typography>
        </Box>
      )}

      {/* Filter Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Filtre dostupnosti</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Date Range */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Od dátumu"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Do dátumu"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Categories */}
            <FormControl fullWidth>
              <InputLabel>Kategórie</InputLabel>
              <Select
                multiple
                value={filters.categories}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  categories: e.target.value as VehicleCategory[] 
                }))}
                renderValue={(selected) => selected.join(', ')}
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Brands */}
            <FormControl fullWidth>
              <InputLabel>Značky</InputLabel>
              <Select
                multiple
                value={filters.brands}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  brands: e.target.value as string[] 
                }))}
                renderValue={(selected) => selected.join(', ')}
              >
                {availableBrands.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Companies */}
            <FormControl fullWidth>
              <InputLabel>Firmy</InputLabel>
              <Select
                multiple
                value={filters.companies}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  companies: e.target.value as string[] 
                }))}
                renderValue={(selected) => selected.join(', ')}
              >
                {availableCompanies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Options */}
            <FormControlLabel
              control={
                <Switch
                  checked={filters.availableOnly}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    availableOnly: e.target.checked 
                  }))}
                />
              }
              label="Zobraziť len dostupné vozidlá"
            />

            {/* Minimum Availability */}
            <TextField
              fullWidth
              label="Minimálna dostupnosť (%)"
              type="number"
              value={filters.minAvailabilityPercent}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                minAvailabilityPercent: parseInt(e.target.value) || 0 
              }))}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button 
            onClick={() => {
              setFilterDialogOpen(false);
              loadAvailabilityData();
            }}
            variant="contained"
          >
            Aplikovať
          </Button>
        </DialogActions>
      </Dialog>

      {/* Empty State */}
      {filteredData.length === 0 && !loading && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'text.secondary' 
          }}
        >
          <CarIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Žiadne vozidlá nevyhovujú filtrom
          </Typography>
          <Typography variant="body2">
            Skúste zmeniť filtre alebo rozšíriť dátumový rozsah
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SmartAvailabilityDashboard;
