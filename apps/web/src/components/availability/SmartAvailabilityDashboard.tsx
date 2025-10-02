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

import {
  Plus as AddIcon,
  ArrowLeft as ArrowBackIcon,
  ArrowRight as ArrowForwardIcon,
  CheckCircle as AvailableIcon,
  Car as CarIcon,
  Filter as FilterIcon,
  Wrench as MaintenanceIcon,
  RefreshCw as RefreshIcon,
  X as UnavailableIcon,
  Eye as ViewIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    reason?: string | undefined;
    customerName?: string | undefined;
    rentalId?: string | undefined;
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
  
  // Custom hook for mobile detection using Tailwind breakpoints
  const [fallbackIsMobile, setFallbackIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setFallbackIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
      ].sort() as VehicleCategory[],
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
          customer_name?: string | undefined;
          rental_id?: string | undefined;
          reason?: string | undefined;
          customerName?: string | undefined;
          rentalId?: string | undefined;
          unavailabilityReason?: string | undefined;
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
                  customer_name: vehicleRental?.customerName || undefined,
                  rental_id: vehicleRental?.id || undefined,
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
              (vehicleStatus.status === 'rented' ? 'Prenájom' : undefined) || undefined,
            customerName: vehicleStatus.customerName || undefined,
            rentalId: vehicleStatus.rentalId || undefined,
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
          icon: <AvailableIcon className="h-4 w-4" />,
          label: 'Dostupné',
        };
      case 'rented':
        return {
          color: 'error',
          icon: <UnavailableIcon className="h-4 w-4" />,
          label: 'Prenajatý (platforma)',
        };
      case 'maintenance':
        return {
          color: 'warning',
          icon: <MaintenanceIcon className="h-4 w-4" />,
          label: 'Údržba',
        };
      case 'service':
        return {
          color: 'info',
          icon: <MaintenanceIcon className="h-4 w-4" />,
          label: 'Servis',
        };
      case 'unavailable':
        switch (unavailabilityType) {
          case 'private_rental':
            return {
              color: 'secondary',
              icon: <UnavailableIcon className="h-4 w-4" />,
              label: 'Súkromný prenájom',
            };
          case 'service':
            return {
              color: 'info',
              icon: <MaintenanceIcon className="h-4 w-4" />,
              label: 'Servis',
            };
          case 'repair':
            return {
              color: 'warning',
              icon: <MaintenanceIcon className="h-4 w-4" />,
              label: 'Oprava',
            };
          case 'blocked':
            return {
              color: 'secondary',
              icon: <UnavailableIcon className="h-4 w-4" />,
              label: 'Blokované',
            };
          case 'cleaning':
            return {
              color: 'info',
              icon: <MaintenanceIcon className="h-4 w-4" />,
              label: 'Čistenie',
            };
          case 'inspection':
            return {
              color: 'warning',
              icon: <MaintenanceIcon className="h-4 w-4" />,
              label: 'Kontrola',
            };
          default:
            return {
              color: 'secondary',
              icon: <UnavailableIcon className="h-4 w-4" />,
              label: 'Nedostupné',
            };
        }
      case 'blocked':
        return {
          color: 'secondary',
          icon: <UnavailableIcon className="h-4 w-4" />,
          label: 'Blokované',
        };
      default:
        return {
          color: 'default',
          icon: <CarIcon className="h-4 w-4" />,
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
      <div className="flex gap-2 mt-4">
        {visibleDays.map((day, index) => {
          const statusDisplay = getStatusDisplay(day.status);
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs text-white font-bold"
                    style={{ backgroundColor: getVehicleStatusColor(day.status) }}
                  >
                    {format(parseISO(day.date), 'd')}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {`${format(parseISO(day.date), 'dd.MM', { locale: sk })}: ${statusDisplay.label}${day.reason ? ` (${day.reason})` : ''}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        {vehicle.dailyStatus.length > maxDaysToShow && (
          <div className="flex items-center ml-4">
            <span className="text-sm text-gray-500">
              +{vehicle.dailyStatus.length - maxDaysToShow} dní
            </span>
          </div>
        )}
      </div>
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
      <div className="flex justify-center items-center min-h-[200px]">
        <RefreshIcon className="animate-spin mr-2 h-4 w-4" />
        <span>Načítavam dostupnosť vozidiel...</span>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'p-2' : 'p-4'}`}>
      {/* Header with quick filters */}
      <div className="mb-4">
        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-4`}>
          🚗 Smart Dostupnosť Vozidiel
        </h2>

        {/* Quick Filter Buttons */}
        <div className={`${isMobile ? 'flex flex-col' : 'flex flex-row flex-wrap'} gap-2 mb-4`}>
          {/* 🚫 ADD UNAVAILABILITY BUTTON */}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedVehicleForUnavailability(undefined);
              setSelectedDateForUnavailability(undefined);
              setUnavailabilityModalOpen(true);
            }}
            className="mr-2"
          >
            <AddIcon className="h-4 w-4 mr-2" />
            Pridať nedostupnosť
          </Button>

          <Button
            size="sm"
            variant={filters.dateTo === format(new Date(), 'yyyy-MM-dd') ? 'default' : 'outline'}
            onClick={() => applyQuickFilter('today')}
          >
            Dnes
          </Button>
          <Button
            size="sm"
            variant={filters.dateTo === format(addDays(new Date(), 7), 'yyyy-MM-dd') ? 'default' : 'outline'}
            onClick={() => applyQuickFilter('week')}
          >
            7 dní
          </Button>
          <Button
            size="sm"
            variant={filters.dateTo === format(addDays(new Date(), 30), 'yyyy-MM-dd') ? 'default' : 'outline'}
            onClick={() => applyQuickFilter('month')}
          >
            30 dní
          </Button>
          <Button
            size="sm"
            variant={filters.availableOnly ? 'default' : 'outline'}
            onClick={() => applyQuickFilter('available-only')}
            className={filters.availableOnly ? 'bg-green-600 hover:bg-green-700' : 'text-green-600 border-green-600 hover:bg-green-50'}
          >
            {filters.availableOnly ? '✓ Len dostupné' : 'Len dostupné'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterDialogOpen(true)}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filtre
          </Button>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-600">
          Zobrazujem {filteredData.length} vozidiel z {availabilityData.length}{' '}
          • Obdobie: {format(parseISO(filters.dateFrom), 'dd.MM.yyyy')} -{' '}
          {format(parseISO(filters.dateTo), 'dd.MM.yyyy')} • Priemer
          dostupnosti:{' '}
          {Math.round(
            filteredData.reduce((sum, v) => sum + v.availabilityPercent, 0) /
              Math.max(filteredData.length, 1)
          )}
          %
        </p>
      </div>

      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-2">
          {filteredData.map(vehicle => (
            <Card key={vehicle.vehicleId} className="p-4 border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-base font-bold">
                    {vehicle.vehicleName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {vehicle.licensePlate} • {vehicle.company}
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant={
                        vehicle.availabilityPercent >= 80
                          ? 'default'
                          : vehicle.availabilityPercent >= 50
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-xs"
                    >
                      {vehicle.availableDays}/{vehicle.totalDays} dní
                    </Badge>
                  </div>
                </div>
                <div
                  className={`text-xl font-bold ${
                    vehicle.availabilityPercent >= 80
                      ? 'text-green-600'
                      : vehicle.availabilityPercent >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {vehicle.availabilityPercent}%
                </div>
              </div>
              {renderMobileTimeline(vehicle)}
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>{/* Removed className="h-8 px-3 text-sm" */}
            <TableHeader>
              <TableRow>
                <TableHead>Vozidlo</TableHead>
                <TableHead>EČV</TableHead>
                <TableHead>Kategória</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead className="text-center">Dostupnosť</TableHead>
                <TableHead className="text-center">Timeline</TableHead>
                <TableHead className="text-center">Akcie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map(vehicle => (
                <TableRow key={vehicle.vehicleId} className="hover:bg-gray-50">
                  <TableCell>
                    <span className="text-sm font-medium">
                      {vehicle.vehicleName}
                    </span>
                  </TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {vehicle.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{vehicle.company}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          vehicle.availabilityPercent >= 80
                            ? 'text-green-600'
                            : vehicle.availabilityPercent >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {vehicle.availabilityPercent}%
                      </span>
                      <span className="text-xs text-gray-500">
                        ({vehicle.availableDays}/{vehicle.totalDays})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      {vehicle.dailyStatus.slice(0, 14).map((day, index) => {
                        const statusDisplay = getStatusDisplay(day.status);
                        const vehicleData = availableVehicles.find(
                          v => v.id === vehicle.vehicleId
                        );

                        return (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-4 h-4 rounded cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md hover:z-10 ${
                                    day.status === 'available' ? 'border border-green-600' : ''
                                  }`}
                                  style={{ backgroundColor: getVehicleStatusColor(day.status) }}
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
                              </TooltipTrigger>
                              <TooltipContent>
                                {`${format(parseISO(day.date), 'dd.MM', { locale: sk })}: ${statusDisplay.label}${day.reason ? ` (${day.reason})` : ''} - ${day.status === 'available' ? 'Kliknite pre pridanie nedostupnosti' : day.status === 'rented' ? 'Prenájom (nie je možné upraviť)' : 'Kliknite pre úpravu nedostupnosti'}`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="ghost">
                      <ViewIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ⚡ PROGRESSIVE LOADING: Load More/Past Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        {/* Load Past Days Button */}
        {loadMoreState.canLoadPast && (
          <Button
            variant="outline"
            onClick={loadPastDays}
            disabled={loadMoreState.isLoadingPast}
            size="lg"
          >
            {loadMoreState.isLoadingPast ? (
              <RefreshIcon className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <ArrowBackIcon className="mr-2 h-4 w-4" />
            )}
            {loadMoreState.isLoadingPast
              ? 'Načítavam minulosť...'
              : `Načítať 7 dní do minulosti (${loadMoreState.currentPastDays}/${loadMoreState.maxPastDays})`}
          </Button>
        )}

        {/* Load Future Days Button */}
        {loadMoreState.canLoadMore && (
          <Button
            variant="outline"
            onClick={loadMoreDays}
            disabled={loadMoreState.isLoadingMore}
            size="lg"
          >
            {loadMoreState.isLoadingMore ? (
              <RefreshIcon className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <ArrowForwardIcon className="mr-2 h-4 w-4" />
            )}
            {loadMoreState.isLoadingMore
              ? 'Načítavam budúcnosť...'
              : `Načítať 14 dní do budúcnosti (${loadMoreState.currentDays}/${loadMoreState.maxDays})`}
          </Button>
        )}
      </div>

      {/* Max days reached info */}
      {!loadMoreState.canLoadMore &&
        loadMoreState.currentDays >= loadMoreState.maxDays && (
          <div className="flex justify-center mt-4">
            <p className="text-sm text-gray-600">
              📅 Dosiahli ste maximálny rozsah {loadMoreState.maxDays} dní (6
              mesiacov)
            </p>
          </div>
        )}

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className={`${isMobile ? 'h-full max-w-full overflow-y-auto' : 'max-w-md'} w-full`}>
          <DialogHeader>
            <DialogTitle>Filtre dostupnosti</DialogTitle>
            <DialogDescription>
              Nastavte filtre pre zobrazenie dostupnosti vozidiel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from">Od dátumu</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="date-to">Do dátumu</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilters(prev => ({ ...prev, dateTo: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <Label>Kategórie</Label>
              <Select
                value={filters.categories.length > 0 ? filters.categories.join(',') : ''}
                onValueChange={(value) => {
                  const categories = value ? value.split(',') as VehicleCategory[] : [];
                  setFilters(prev => ({ ...prev, categories }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte kategórie" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brands */}
            <div>
              <Label>Značky</Label>
              <Select
                value={filters.brands.length > 0 ? filters.brands.join(',') : ''}
                onValueChange={(value) => {
                  const brands = value ? value.split(',') : [];
                  setFilters(prev => ({ ...prev, brands }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte značky" />
                </SelectTrigger>
                <SelectContent>
                  {availableBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Companies */}
            <div>
              <Label>Firmy</Label>
              <Select
                value={filters.companies.length > 0 ? filters.companies.join(',') : ''}
                onValueChange={(value) => {
                  const companies = value ? value.split(',') : [];
                  setFilters(prev => ({ ...prev, companies }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte firmy" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map(company => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Switch
                id="available-only"
                checked={filters.availableOnly}
                onCheckedChange={(checked) =>
                  setFilters(prev => ({
                    ...prev,
                    availableOnly: checked,
                  }))
                }
              />
              <Label htmlFor="available-only">Zobraziť len dostupné vozidlá</Label>
            </div>

            {/* Minimum Availability */}
            <div>
              <Label htmlFor="min-availability">Minimálna dostupnosť (%)</Label>
              <Input
                id="min-availability"
                type="number"
                value={filters.minAvailabilityPercent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters(prev => ({
                    ...prev,
                    minAvailabilityPercent: parseInt(e.target.value) || 0,
                  }))
                }
                min={0}
                max={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button
              onClick={() => {
                setFilterDialogOpen(false);
                loadAvailabilityData();
              }}
            >
              Aplikovať
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredData.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-600">
          <CarIcon className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Žiadne vozidlá nevyhovujú filtrom
          </h3>
          <p className="text-sm">
            Skúste zmeniť filtre alebo rozšíriť dátumový rozsah
          </p>
        </div>
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
    </div>
  );
};

export default SmartAvailabilityDashboard;
