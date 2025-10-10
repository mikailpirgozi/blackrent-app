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

import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as AvailableIcon,
  DirectionsCar as CarIcon,
  FilterList as FilterIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  Cancel as UnavailableIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { addDays, format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // Migrated to React Query
import { useAuth } from '../../context/AuthContext';
// 🔄 PHASE 4: Migrated to React Query
import { useRentals } from '../../lib/react-query/hooks/useRentals';
import { useVehicles } from '../../lib/react-query/hooks/useVehicles';
import { apiService } from '../../services/api';
import type { Vehicle, VehicleCategory } from '../../types';
import { logger } from '../../utils/smartLogger';
// 🔄 PHASE 2: UnifiedCache removed - migrating to React Query
import { PrimaryButton, SecondaryButton, WarningButton } from '../ui';

import AddUnavailabilityModal from './AddUnavailabilityModal';

interface AvailabilityData {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  brand: string;
  category: VehicleCategory | 'other'; // ✅ FIXED: Allow 'other' for undefined categories
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
  canLoadPast: boolean;
  isLoadingPast: boolean;
  currentPastDays: number;
  maxPastDays: number; // Max 30 dní do minulosti
}

interface SmartAvailabilityDashboardProps {
  isMobile?: boolean;
}

const SmartAvailabilityDashboard: React.FC<SmartAvailabilityDashboardProps> = ({
  isMobile: propIsMobile,
}) => {
  // const { state } = useApp(); // Migrated to React Query
  const { state: authState } = useAuth();

  // React Query hooks for server state
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: rentals = [], isLoading: rentalsLoading } = useRentals();
  const theme = useTheme();
  const fallbackIsMobile = useMediaQuery(theme.breakpoints.down('md'), {
    noSsr: true,
  });
  const isMobile = propIsMobile !== undefined ? propIsMobile : fallbackIsMobile;

  // State
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>(
    []
  );
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // 🚫 UNAVAILABILITY MODAL STATE
  const [unavailabilityModalOpen, setUnavailabilityModalOpen] = useState(false);
  const [
    selectedVehicleForUnavailability,
    setSelectedVehicleForUnavailability,
  ] = useState<Vehicle | undefined>();
  const [selectedDateForUnavailability, setSelectedDateForUnavailability] =
    useState<Date | undefined>();
  const [editingUnavailability, setEditingUnavailability] = useState<
    | {
        id: string;
        vehicleId: string;
        startDate: Date;
        endDate: Date;
        type: string;
        reason: string;
        notes: string;
        priority: number;
        recurring: boolean;
      }
    | undefined
  >(undefined);

  // ⚡ PROGRESSIVE LOADING STATE
  const [loadMoreState, setLoadMoreState] = useState<LoadMoreState>({
    canLoadMore: true,
    isLoadingMore: false,
    currentDays: 14, // Start with 14 days
    maxDays: 180, // 6 months max
    canLoadPast: true,
    isLoadingPast: false,
    currentPastDays: 0, // Start with 0 past days
    maxPastDays: 30, // Max 30 days in the past
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
    minAvailabilityPercent: 0,
  });

  // Derived data - filter out removed vehicles for availability view
  const availableVehicles = useMemo(
    () =>
      (vehicles || [])
        .filter(
          vehicle =>
            vehicle.status !== 'removed' &&
            vehicle.status !== 'temporarily_removed'
        )
        .sort((a, b) => {
          // Sort alphabetically by brand, then model, then license plate
          const brandCompare = a.brand.localeCompare(b.brand, 'sk');
          if (brandCompare !== 0) return brandCompare;

          const modelCompare = a.model.localeCompare(b.model, 'sk');
          if (modelCompare !== 0) return modelCompare;

          return a.licensePlate.localeCompare(b.licensePlate, 'sk');
        }),
    [vehicles]
  );
  const availableBrands = useMemo(
    () =>
      [
        ...new Set(availableVehicles.map(v => v.brand).filter(Boolean)),
      ].sort() as string[],
    [availableVehicles]
  );
  const availableCategories = useMemo(
    () =>
      [
        ...new Set(availableVehicles.map(v => v.category).filter(Boolean)),
      ].sort(),
    [availableVehicles]
  );
  const availableCompanies = useMemo(
    () =>
      [
        ...new Set(availableVehicles.map(v => v.company).filter(Boolean)),
      ].sort() as string[],
    [availableVehicles]
  );

  /**
   * ⚡ REAL API: Smart availability calculation with real data
   */
  const calculateAvailability = useCallback(
    async (
      filters: FilterOptions,
      forceRefresh: boolean = false
    ): Promise<AvailabilityData[]> => {
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
        vehiclesCount: availableVehicles.length,
        forceRefresh,
      });

      // 🗄️ UNIFIED CACHE: Try to get cached availability data (skip if forceRefresh)
      const cacheKey = `availability-${dateFrom}-${dateTo}`;
      // 🔄 PHASE 4: Using unified cache system
      const cachedData = null; // Will be handled by unified cache in API calls

      let calendarData: Array<{
        date: string;
        vehicles: Array<{
          vehicleId: number;
          status: string;
          customer_name?: string;
          rental_id?: string;
          reason?: string;
          customerName?: string;
          rentalId?: string;
          unavailabilityReason?: string;
        }>;
      }> = [];
      if (cachedData && !forceRefresh) {
        logger.cache('Using cached availability data for calculation');
        // 🔄 PHASE 4: Cache handled by unified system
        calendarData = [];
      } else {
        // 🚀 REAL API: Load calendar data with unavailabilities
        try {
          logger.api('Loading calendar data from API with unavailabilities', {
            dateFrom,
            dateTo,
            vehiclesCount: availableVehicles.length,
            forceRefresh,
          });

          const response = await apiService.get<{
            calendar: Array<{
              date: string;
              vehicles: Array<{
                vehicleId: number;
                status: string;
                customer_name?: string;
                rental_id?: string;
                reason?: string;
                customerName?: string;
                rentalId?: string;
                unavailabilityReason?: string;
              }>;
            }>;
          }>(`/availability/calendar?startDate=${dateFrom}&endDate=${dateTo}`);

          if (response.calendar) {
            calendarData = response.calendar;
            logger.performance('Calendar data loaded from API', {
              calendarDays: calendarData.length,
              vehicles: availableVehicles.length,
              cacheKey,
            });

            // Cache the API data
            // 🔄 PHASE 4: Cache handled by unified system in API calls
          } else {
            throw new Error('No calendar data received from API');
          }
        } catch (error) {
          logger.error(
            'Failed to load calendar data from API, using fallback',
            error
          );

          // ⚡ FALLBACK: Use existing vehicle/rental data to calculate availability
          calendarData = dateRange.map(date => {
            const dayRentals =
              rentals?.filter(rental => {
                const startDate = new Date(rental.startDate);
                const endDate = new Date(rental.endDate);
                const currentDate = new Date(date);
                return currentDate >= startDate && currentDate <= endDate;
              }) || [];

            return {
              date,
              vehicles: availableVehicles.map(vehicle => {
                const vehicleRental = dayRentals.find(
                  rental => rental.vehicleId === vehicle.id
                );

                return {
                  vehicleId: parseInt(vehicle.id),
                  status: vehicleRental ? 'rented' : 'available',
                  customer_name: vehicleRental?.customerName,
                  rental_id: vehicleRental?.id,
                  reason: vehicleRental ? 'Prenájom' : undefined,
                };
              }),
            };
          });

          logger.performance('Availability calculated from fallback data', {
            calendarDays: calendarData.length,
            vehicles: availableVehicles.length,
            rentals: rentals?.length || 0,
            cacheKey,
          });

          // ⚠️ Store fallback data in cache
          // 🔄 PHASE 4: Cache handled by unified system in API calls
        }
      }

      // Process each vehicle
      const result: AvailabilityData[] = availableVehicles.map(vehicle => {
        const dailyStatus = dateRange.map(date => {
          // Find calendar data for this vehicle and date
          const dayData = calendarData.find(
            cal => format(parseISO(cal.date), 'yyyy-MM-dd') === date
          );

          const vehicleStatus = dayData?.vehicles?.find(
            v => v.vehicleId === parseInt(vehicle.id)
          );

          if (!vehicleStatus) {
            return {
              date,
              status: 'available' as const,
              reason: undefined,
              customerName: undefined,
              rentalId: undefined,
            };
          }

          return {
            date,
            status:
              (vehicleStatus.status as
                | 'available'
                | 'rented'
                | 'maintenance'
                | 'service'
                | 'blocked') || 'available',
            reason:
              vehicleStatus.unavailabilityReason ||
              (vehicleStatus.status === 'rented' ? 'Prenájom' : undefined),
            customerName: vehicleStatus.customerName,
            rentalId: vehicleStatus.rentalId,
          };
        });

        const availableDays = dailyStatus.filter(
          day => day.status === 'available'
        ).length;
        const totalDays = dailyStatus.length;
        const availabilityPercent =
          totalDays > 0 ? Math.round((availableDays / totalDays) * 100) : 0;

        return {
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          licensePlate: vehicle.licensePlate,
          brand: vehicle.brand,
          category: vehicle.category || 'other',
          company: vehicle.company || '',
          location:
            ((vehicle as unknown as Record<string, unknown>)
              .location as string) || '',
          dailyStatus,
          availableDays,
          totalDays,
          availabilityPercent,
        };
      });

      return result;
    },
    [availableVehicles, rentals]
  );

  /**
   * Apply filters to availability data
   */
  const filteredData = useMemo(() => {
    return availabilityData.filter(vehicle => {
      // Category filter - handle 'other' category
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(vehicle.category as VehicleCategory)
      ) {
        return false;
      }

      // Brand filter
      if (
        filters.brands.length > 0 &&
        !filters.brands.includes(vehicle.brand)
      ) {
        return false;
      }

      // Company filter
      if (
        filters.companies.length > 0 &&
        !filters.companies.includes(vehicle.company)
      ) {
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
  const loadAvailabilityData = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        const data = await calculateAvailability(filters, forceRefresh);
        setAvailabilityData(data);

        logger.performance('Availability data calculated', {
          vehiclesProcessed: data.length,
          dateRange: `${filters.dateFrom} to ${filters.dateTo}`,
          averageAvailability: Math.round(
            data.reduce((sum, v) => sum + v.availabilityPercent, 0) /
              data.length
          ),
          forceRefresh,
        });
      } catch (error) {
        logger.error('Failed to load availability data', error);
      }
    },
    [calculateAvailability, filters]
  );

  // 🚫 UNAVAILABILITY SUCCESS HANDLER
  const handleUnavailabilitySuccess = useCallback(() => {
    // 🔄 PHASE 2: Cache invalidation removed - React Query handles cache automatically

    // Also clear specific cache keys that might be used
    const { dateFrom, dateTo } = filters;
    const cacheKey = `availability-${dateFrom}-${dateTo}`;
    logger.cache(`Manually clearing cache key: ${cacheKey}`);

    // Refresh availability data with force refresh to bypass cache
    loadAvailabilityData(true);

    // Clear selected data
    setSelectedVehicleForUnavailability(undefined);
    setSelectedDateForUnavailability(undefined);
    setEditingUnavailability(undefined);
  }, [loadAvailabilityData, filters]);

  // 🔍 LOAD UNAVAILABILITY FOR EDIT
  const loadUnavailabilityForEdit = useCallback(
    async (
      vehicleId: string,
      clickedDate: string,
      status: string,
      reason: string
    ) => {
      try {
        // Get all unavailabilities for this vehicle
        const response = await apiService.get<
          Array<{
            id: string;
            startDate: string;
            endDate: string;
            type: string;
            reason: string;
            notes?: string;
            priority?: number;
            recurring?: boolean;
          }>
        >(`/vehicle-unavailability?vehicleId=${parseInt(vehicleId)}`);

        // Find the unavailability that includes the clicked date
        const clickedDateObj = parseISO(clickedDate);
        const unavailability = response.find(u => {
          const startDate = new Date(u.startDate);
          const endDate = new Date(u.endDate);
          return (
            clickedDateObj >= startDate &&
            clickedDateObj <= endDate &&
            u.type === status
          );
        });

        if (unavailability) {
          setEditingUnavailability({
            id: unavailability.id,
            vehicleId: vehicleId,
            startDate: new Date(unavailability.startDate),
            endDate: new Date(unavailability.endDate),
            type: unavailability.type,
            reason: unavailability.reason,
            notes: unavailability.notes || '',
            priority: unavailability.priority || 2,
            recurring: unavailability.recurring || false,
          });
          setSelectedVehicleForUnavailability(undefined);
          setSelectedDateForUnavailability(undefined);
          setUnavailabilityModalOpen(true);
        } else {
          // Fallback - create basic editing object
          setEditingUnavailability({
            id: `fallback-${vehicleId}-${clickedDate}`,
            vehicleId: vehicleId,
            startDate: parseISO(clickedDate),
            endDate: parseISO(clickedDate),
            type: status,
            reason: reason,
            notes: '',
            priority: 2,
            recurring: false,
          });
          setSelectedVehicleForUnavailability(undefined);
          setSelectedDateForUnavailability(undefined);
          setUnavailabilityModalOpen(true);
        }
      } catch (error) {
        console.error('Error loading unavailability for edit:', error);
        // Fallback - create basic editing object
        setEditingUnavailability({
          id: `error-${vehicleId}-${clickedDate}`,
          vehicleId: vehicleId,
          startDate: parseISO(clickedDate),
          endDate: parseISO(clickedDate),
          type: status,
          reason: reason,
          notes: '',
          priority: 2,
          recurring: false,
        });
        setSelectedVehicleForUnavailability(undefined);
        setSelectedDateForUnavailability(undefined);
        setUnavailabilityModalOpen(true);
      }
    },
    []
  );

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
      const newEndDate = addDays(
        today,
        Math.min(newTotalDays, loadMoreState.maxDays)
      );

      // Update filters to include more days
      const newFilters = {
        ...filters,
        dateTo: format(newEndDate, 'yyyy-MM-dd'),
      };

      logger.performance('Loading more days', {
        currentDays: loadMoreState.currentDays,
        additionalDays,
        newTotalDays: Math.min(newTotalDays, loadMoreState.maxDays),
      });

      // ⚡ IMPORTANT: Always fetch fresh API data for extended range
      const newData = await calculateAvailability(newFilters);
      setAvailabilityData(newData);
      setFilters(newFilters);

      setLoadMoreState(prev => ({
        ...prev,
        currentDays: Math.min(newTotalDays, prev.maxDays),
        canLoadMore: newTotalDays < prev.maxDays,
        isLoadingMore: false,
      }));
    } catch (error) {
      logger.error('Failed to load more days', error);
      setLoadMoreState(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [loadMoreState, filters, calculateAvailability]);

  /**
   * ⚡ PROGRESSIVE LOADING: Load past days (only on demand)
   */
  const loadPastDays = useCallback(async () => {
    if (loadMoreState.isLoadingPast || !loadMoreState.canLoadPast) return;

    const additionalPastDays = 7; // Load 7 past days each time
    const newTotalPastDays = loadMoreState.currentPastDays + additionalPastDays;

    if (newTotalPastDays > loadMoreState.maxPastDays) {
      setLoadMoreState(prev => ({ ...prev, canLoadPast: false }));
      return;
    }

    setLoadMoreState(prev => ({ ...prev, isLoadingPast: true }));

    try {
      const today = new Date();
      const newStartDate = addDays(
        today,
        -Math.min(newTotalPastDays, loadMoreState.maxPastDays)
      );

      // Update filters to include past days
      const newFilters = {
        ...filters,
        dateFrom: format(newStartDate, 'yyyy-MM-dd'),
      };

      logger.performance('Loading past days', {
        currentPastDays: loadMoreState.currentPastDays,
        additionalPastDays,
        newTotalPastDays: Math.min(newTotalPastDays, loadMoreState.maxPastDays),
      });

      // ⚡ IMPORTANT: Always fetch fresh API data for extended past range
      const newData = await calculateAvailability(newFilters);
      setAvailabilityData(newData);
      setFilters(newFilters);

      setLoadMoreState(prev => ({
        ...prev,
        currentPastDays: Math.min(newTotalPastDays, prev.maxPastDays),
        canLoadPast: newTotalPastDays < prev.maxPastDays,
        isLoadingPast: false,
      }));
    } catch (error) {
      logger.error('Failed to load past days', error);
      setLoadMoreState(prev => ({ ...prev, isLoadingPast: false }));
    }
  }, [loadMoreState, filters, calculateAvailability]);

  /**
   * Quick filter presets
   */
  const applyQuickFilter = useCallback(
    (preset: 'today' | 'week' | 'month' | 'available-only') => {
      const today = new Date();

      switch (preset) {
        case 'today': {
          const newFilters1 = {
            ...filters,
            dateFrom: format(today, 'yyyy-MM-dd'),
            dateTo: format(today, 'yyyy-MM-dd'),
          };
          setFilters(newFilters1);
          setLoadMoreState(prev => ({
            ...prev,
            currentDays: 1,
            canLoadMore: true,
          }));
          break;
        }
        case 'week': {
          const newFilters7 = {
            ...filters,
            dateFrom: format(today, 'yyyy-MM-dd'),
            dateTo: format(addDays(today, 7), 'yyyy-MM-dd'),
          };
          setFilters(newFilters7);
          setLoadMoreState(prev => ({
            ...prev,
            currentDays: 7,
            canLoadMore: true,
          }));
          break;
        }
        case 'month': {
          const newFilters30 = {
            ...filters,
            dateFrom: format(today, 'yyyy-MM-dd'),
            dateTo: format(addDays(today, 30), 'yyyy-MM-dd'),
          };
          setFilters(newFilters30);
          setLoadMoreState(prev => ({
            ...prev,
            currentDays: 30,
            canLoadMore: true,
          }));
          break;
        }
        case 'available-only': {
          setFilters(prev => ({
            ...prev,
            availableOnly: !prev.availableOnly,
          }));
          break;
        }
      }
    },
    [filters]
  );

  /**
   * Get vehicle status color (same as AvailabilityCalendar)
   */
  const getVehicleStatusColor = (
    status: string,
    unavailabilityType?: string
  ): string => {
    switch (status) {
      case 'available':
        return '#4caf50'; // Zelená - dostupné
      case 'rented':
        return '#f44336'; // Červená - prenajatý cez platformu
      case 'maintenance':
        return '#ff9800'; // Oranžová - údržba
      case 'unavailable':
        // Rozlíšenie podľa typu nedostupnosti
        switch (unavailabilityType) {
          case 'private_rental':
            return '#9c27b0'; // Fialová - prenájom mimo platformy
          case 'service':
            return '#2196f3'; // Modrá - servis
          case 'repair':
            return '#ff5722'; // Tmavo oranžová - oprava
          case 'blocked':
            return '#607d8b'; // Sivá - blokované
          case 'cleaning':
            return '#00bcd4'; // Cyan - čistenie
          case 'inspection':
            return '#795548'; // Hnedá - kontrola
          default:
            return '#9e9e9e'; // Svetlo sivá - nedostupné (všeobecne)
        }
      default:
        return '#9e9e9e'; // Svetlo sivá - neznámy stav
    }
  };

  /**
   * Get status color and icon
   */
  const getStatusDisplay = (status: string, unavailabilityType?: string) => {
    switch (status) {
      case 'available':
        return {
          color: 'success',
          icon: <AvailableIcon fontSize="small" />,
          label: 'Dostupné',
        };
      case 'rented':
        return {
          color: 'error',
          icon: <UnavailableIcon fontSize="small" />,
          label: 'Prenajatý (platforma)',
        };
      case 'maintenance':
        return {
          color: 'warning',
          icon: <UnifiedIcon name="maintenance" fontSize="small" />,
          label: 'Údržba',
        };
      case 'service':
        return {
          color: 'info',
          icon: <UnifiedIcon name="maintenance" fontSize="small" />,
          label: 'Servis',
        };
      case 'unavailable':
        switch (unavailabilityType) {
          case 'private_rental':
            return {
              color: 'secondary',
              icon: <UnavailableIcon fontSize="small" />,
              label: 'Súkromný prenájom',
            };
          case 'service':
            return {
              color: 'info',
              icon: <UnifiedIcon name="maintenance" fontSize="small" />,
              label: 'Servis',
            };
          case 'repair':
            return {
              color: 'warning',
              icon: <UnifiedIcon name="maintenance" fontSize="small" />,
              label: 'Oprava',
            };
          case 'blocked':
            return {
              color: 'secondary',
              icon: <UnavailableIcon fontSize="small" />,
              label: 'Blokované',
            };
          case 'cleaning':
            return {
              color: 'info',
              icon: <UnifiedIcon name="maintenance" fontSize="small" />,
              label: 'Čistenie',
            };
          case 'inspection':
            return {
              color: 'warning',
              icon: <UnifiedIcon name="maintenance" fontSize="small" />,
              label: 'Kontrola',
            };
          default:
            return {
              color: 'secondary',
              icon: <UnavailableIcon fontSize="small" />,
              label: 'Nedostupné',
            };
        }
      case 'blocked':
        return {
          color: 'secondary',
          icon: <UnavailableIcon fontSize="small" />,
          label: 'Blokované',
        };
      default:
        return {
          color: 'default',
          icon: <CarIcon fontSize="small" />,
          label: status,
        };
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
                  bgcolor: getVehicleStatusColor(day.status),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold',
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
    if (vehicles && rentals && authState?.isAuthenticated) {
      loadAvailabilityData();
    }
  }, [
    loadAvailabilityData,
    vehicles,
    rentals,
    authState?.isAuthenticated,
    filters,
  ]);

  // Loading state
  const isLoading = vehiclesLoading || rentalsLoading;
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <UnifiedIcon name="refresh" sx={{ animation: 'spin 1s linear infinite', mr: 2 }} />
        <Typography>Načítavam dostupnosť vozidiel...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      {/* Header with quick filters */}
      <Box sx={{ mb: 2 }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} gutterBottom>
          🚗 Smart Dostupnosť Vozidiel
        </Typography>

        {/* Quick Filter Buttons */}
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={1}
          sx={{ mb: 2 }}
          flexWrap="wrap"
        >
          {/* 🚫 ADD UNAVAILABILITY BUTTON */}
          <WarningButton
            size="small"
            startIcon={<UnifiedIcon name="add" />}
            onClick={() => {
              setSelectedVehicleForUnavailability(undefined);
              setSelectedDateForUnavailability(undefined);
              setUnavailabilityModalOpen(true);
            }}
            sx={{ mr: 2 }}
          >
            Pridať nedostupnosť
          </WarningButton>

          <SecondaryButton
            size="small"
            onClick={() => applyQuickFilter('today')}
            sx={{
              backgroundColor:
                filters.dateTo === format(new Date(), 'yyyy-MM-dd')
                  ? '#1976d2'
                  : 'transparent',
              color:
                filters.dateTo === format(new Date(), 'yyyy-MM-dd')
                  ? 'white'
                  : '#1976d2',
            }}
          >
            Dnes
          </SecondaryButton>
          <SecondaryButton
            size="small"
            onClick={() => applyQuickFilter('week')}
            sx={{
              backgroundColor:
                filters.dateTo === format(addDays(new Date(), 7), 'yyyy-MM-dd')
                  ? '#1976d2'
                  : 'transparent',
              color:
                filters.dateTo === format(addDays(new Date(), 7), 'yyyy-MM-dd')
                  ? 'white'
                  : '#1976d2',
            }}
          >
            7 dní
          </SecondaryButton>
          <SecondaryButton
            size="small"
            onClick={() => applyQuickFilter('month')}
            sx={{
              backgroundColor:
                filters.dateTo === format(addDays(new Date(), 30), 'yyyy-MM-dd')
                  ? '#1976d2'
                  : 'transparent',
              color:
                filters.dateTo === format(addDays(new Date(), 30), 'yyyy-MM-dd')
                  ? 'white'
                  : '#1976d2',
            }}
          >
            30 dní
          </SecondaryButton>
          <SecondaryButton
            size="small"
            onClick={() => applyQuickFilter('available-only')}
            sx={{
              backgroundColor: filters.availableOnly
                ? '#2e7d32'
                : 'transparent',
              color: filters.availableOnly ? 'white' : '#2e7d32',
            }}
          >
            {filters.availableOnly ? '✓ Len dostupné' : 'Len dostupné'}
          </SecondaryButton>
          <SecondaryButton
            size="small"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filtre
          </SecondaryButton>
        </Stack>

        {/* Summary */}
        <Typography variant="body2" color="text.secondary">
          Zobrazujem {filteredData.length} vozidiel z {availabilityData.length}{' '}
          • Obdobie: {format(parseISO(filters.dateFrom), 'dd.MM.yyyy')} -{' '}
          {format(parseISO(filters.dateTo), 'dd.MM.yyyy')} • Priemer
          dostupnosti:{' '}
          {Math.round(
            filteredData.reduce((sum, v) => sum + v.availabilityPercent, 0) /
              Math.max(filteredData.length, 1)
          )}
          %
        </Typography>
      </Box>

      {/* Mobile Card View */}
      {isMobile ? (
        <Stack spacing={1}>
          {filteredData.map(vehicle => (
            <Card key={vehicle.vehicleId} variant="outlined" sx={{ p: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
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
                      color={
                        vehicle.availabilityPercent >= 80
                          ? 'success'
                          : vehicle.availabilityPercent >= 50
                            ? 'warning'
                            : 'error'
                      }
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>
                <Typography
                  variant="h6"
                  color={
                    vehicle.availabilityPercent >= 80
                      ? 'success.main'
                      : vehicle.availabilityPercent >= 50
                        ? 'warning.main'
                        : 'error.main'
                  }
                >
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
              {filteredData.map(vehicle => (
                <TableRow key={vehicle.vehicleId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {vehicle.vehicleName}
                    </Typography>
                  </TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={vehicle.category}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{vehicle.company}</TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={
                          vehicle.availabilityPercent >= 80
                            ? 'success.main'
                            : vehicle.availabilityPercent >= 50
                              ? 'warning.main'
                              : 'error.main'
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
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      {vehicle.dailyStatus.slice(0, 14).map((day, index) => {
                        const statusDisplay = getStatusDisplay(day.status);
                        const vehicleData = availableVehicles.find(
                          v => v.id === vehicle.vehicleId
                        );

                        return (
                          <Tooltip
                            key={index}
                            title={`${format(parseISO(day.date), 'dd.MM', { locale: sk })}: ${statusDisplay.label}${day.reason ? ` (${day.reason})` : ''} - ${day.status === 'available' ? 'Kliknite pre pridanie nedostupnosti' : day.status === 'rented' ? 'Prenájom (nie je možné upraviť)' : 'Kliknite pre úpravu nedostupnosti'}`}
                          >
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: 0.5,
                                bgcolor: getVehicleStatusColor(day.status),
                                border:
                                  day.status === 'available'
                                    ? '1px solid'
                                    : 'none',
                                borderColor: 'success.main',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.2)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  zIndex: 1,
                                },
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                if (vehicleData) {
                                  if (day.status === 'available') {
                                    // Create new unavailability
                                    setSelectedVehicleForUnavailability(
                                      vehicleData
                                    );
                                    setSelectedDateForUnavailability(
                                      parseISO(day.date)
                                    );
                                    setEditingUnavailability(undefined);
                                    setUnavailabilityModalOpen(true);
                                  } else if (day.status !== 'rented') {
                                    // Edit existing unavailability (not rental)
                                    // Load full unavailability data from API
                                    loadUnavailabilityForEdit(
                                      vehicleData.id,
                                      day.date,
                                      day.status,
                                      day.reason || ''
                                    );
                                  }
                                }
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

      {/* ⚡ PROGRESSIVE LOADING: Load More/Past Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
        {/* Load Past Days Button */}
        {loadMoreState.canLoadPast && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={loadPastDays}
            disabled={loadMoreState.isLoadingPast}
            startIcon={
              loadMoreState.isLoadingPast ? (
                <UnifiedIcon name="refresh" sx={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <UnifiedIcon name="arrowLeft" />
              )
            }
            size="large"
          >
            {loadMoreState.isLoadingPast
              ? 'Načítavam minulosť...'
              : `Načítať 7 dní do minulosti (${loadMoreState.currentPastDays}/${loadMoreState.maxPastDays})`}
          </Button>
        )}

        {/* Load Future Days Button */}
        {loadMoreState.canLoadMore && (
          <Button
            variant="outlined"
            onClick={loadMoreDays}
            disabled={loadMoreState.isLoadingMore}
            startIcon={
              loadMoreState.isLoadingMore ? (
                <UnifiedIcon name="refresh" sx={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <UnifiedIcon name="arrowRight" />
              )
            }
            size="large"
          >
            {loadMoreState.isLoadingMore
              ? 'Načítavam budúcnosť...'
              : `Načítať 14 dní do budúcnosti (${loadMoreState.currentDays}/${loadMoreState.maxDays})`}
          </Button>
        )}
      </Box>

      {/* Max days reached info */}
      {!loadMoreState.canLoadMore &&
        loadMoreState.currentDays >= loadMoreState.maxDays && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              📅 Dosiahli ste maximálny rozsah {loadMoreState.maxDays} dní (6
              mesiacov)
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
                  onChange={e =>
                    setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Do dátumu"
                  type="date"
                  value={filters.dateTo}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, dateTo: e.target.value }))
                  }
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
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    categories: e.target.value as VehicleCategory[],
                  }))
                }
                renderValue={selected => selected.join(', ')}
              >
                {availableCategories.map(category => (
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
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    brands: e.target.value as string[],
                  }))
                }
                renderValue={selected => selected.join(', ')}
              >
                {availableBrands.map(brand => (
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
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    companies: e.target.value as string[],
                  }))
                }
                renderValue={selected => selected.join(', ')}
              >
                {availableCompanies.map(company => (
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
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      availableOnly: e.target.checked,
                    }))
                  }
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
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  minAvailabilityPercent: parseInt(e.target.value) || 0,
                }))
              }
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <SecondaryButton onClick={() => setFilterDialogOpen(false)}>
            Zrušiť
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              setFilterDialogOpen(false);
              loadAvailabilityData();
            }}
          >
            Aplikovať
          </PrimaryButton>
        </DialogActions>
      </Dialog>

      {/* Empty State */}
      {filteredData.length === 0 && !isLoading && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
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

      {/* 🚫 ADD UNAVAILABILITY MODAL */}
      <AddUnavailabilityModal
        open={unavailabilityModalOpen}
        onClose={() => {
          setUnavailabilityModalOpen(false);
          setSelectedVehicleForUnavailability(undefined);
          setSelectedDateForUnavailability(undefined);
          setEditingUnavailability(undefined);
        }}
        onSuccess={handleUnavailabilitySuccess}
        preselectedVehicle={selectedVehicleForUnavailability}
        preselectedDate={selectedDateForUnavailability}
        editingUnavailability={editingUnavailability}
      />
    </Box>
  );
};

export default SmartAvailabilityDashboard;
