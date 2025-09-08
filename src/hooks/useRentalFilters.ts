import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Rental } from '../types';
import { textContains } from '../utils/textNormalization';

// Filter state interface
export interface FilterState {
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

  // Zoraďovanie
  sortBy: 'created_at' | 'start_date' | 'end_date';
  sortOrder: 'asc' | 'desc';
}

interface UseRentalFiltersProps {
  rentals: Rental[];
  vehicles?: Record<string, unknown>[];
  protocols?: Record<
    string,
    { handover?: Record<string, unknown>; return?: Record<string, unknown> }
  >;
}

interface UseRentalFiltersReturn {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;

  // Filter state
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  advancedFilters: FilterState;
  setAdvancedFilters: (filters: FilterState) => void;

  // Filtered data
  filteredRentals: Rental[];

  // Filter options
  uniqueStatuses: string[];
  uniqueCompanies: string[];
  uniquePaymentMethods: string[];
  uniqueVehicleBrands: string[];
  uniqueInsuranceCompanies: string[];
  uniqueInsuranceTypes: string[];

  // Quick filter handlers
  handleQuickFilter: (filterType: string) => void;
  resetFilters: () => void;
}

export const useRentalFilters = ({
  rentals,
  vehicles = [],
  protocols = {},
}: UseRentalFiltersProps): UseRentalFiltersReturn => {
  // Search state - LIVE SEARCH s debouncing
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
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
    vehicleBrand: '',
    vehicleModel: '',
    licensePlate: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    insuranceCompany: '',
    insuranceType: '',

    // Časové filtre
    timeFilter: 'all',

    // Cenové filtre
    priceRange: 'all',

    // Stav platby
    paymentStatus: 'all',

    // Zobrazenie
    showOnlyActive: false,
    showOnlyOverdue: false,
    showOnlyCompleted: false,

    // Zoraďovanie
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ⚡ OPTIMIZED: Memoized vehicle lookup map for performance
  const vehicleLookupMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach(vehicle => {
      map.set(vehicle.id, vehicle);
    });
    return map;
  }, [vehicles]);

  // Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(
      rentals.map(rental => rental.status).filter(Boolean) as string[]
    );
    return Array.from(statuses);
  }, [rentals]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(
      rentals
        .map(rental => {
          const vehicle = vehicleLookupMap.get(rental.vehicleId);
          return vehicle?.company;
        })
        .filter(Boolean)
    );
    return Array.from(companies);
  }, [rentals, vehicleLookupMap]);

  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(
      rentals.map(rental => rental.paymentMethod).filter(Boolean)
    );
    return Array.from(methods);
  }, [rentals]);

  const uniqueVehicleBrands = useMemo(() => {
    const brands = new Set(
      rentals
        .map(rental => {
          const vehicle = vehicleLookupMap.get(rental.vehicleId);
          return vehicle?.brand;
        })
        .filter(Boolean)
    );
    return Array.from(brands);
  }, [rentals, vehicleLookupMap]);

  const uniqueInsuranceCompanies = useMemo(() => {
    return [] as string[];
  }, []);

  const uniqueInsuranceTypes = useMemo(() => {
    return [] as string[];
  }, []);

  // Filter rentals based on search and filters
  const filteredRentals = useMemo(() => {
    let filtered = [...rentals];

    // Search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.trim();
      filtered = filtered.filter(rental => {
        const vehicle = vehicleLookupMap.get(rental.vehicleId);

        return (
          textContains(rental.customerName, query) ||
          textContains(rental.customer?.email, query) ||
          textContains(rental.customer?.phone, query) ||
          textContains(vehicle?.licensePlate, query) ||
          textContains(vehicle?.brand, query) ||
          textContains(vehicle?.model, query) ||
          textContains(vehicle?.company, query) ||
          textContains(rental.id, query)
        );
      });
    }

    // Status filter
    if (advancedFilters.status.length > 0) {
      filtered = filtered.filter(
        rental =>
          rental.status && advancedFilters.status.includes(rental.status)
      );
    }

    // Payment method filter
    if (advancedFilters.paymentMethod.length > 0) {
      filtered = filtered.filter(rental =>
        advancedFilters.paymentMethod.includes(rental.paymentMethod)
      );
    }

    // Company filter
    if (advancedFilters.company.length > 0) {
      filtered = filtered.filter(rental => {
        const vehicle = vehicleLookupMap.get(rental.vehicleId);
        return vehicle && advancedFilters.company.includes(vehicle.company);
      });
    }

    // Date range filter
    if (advancedFilters.dateFrom) {
      const fromDate = new Date(advancedFilters.dateFrom);
      filtered = filtered.filter(
        rental => new Date(rental.startDate) >= fromDate
      );
    }

    if (advancedFilters.dateTo) {
      const toDate = new Date(advancedFilters.dateTo);
      filtered = filtered.filter(rental => new Date(rental.endDate) <= toDate);
    }

    // Price range filter
    if (advancedFilters.priceMin) {
      const minPrice = parseFloat(advancedFilters.priceMin);
      filtered = filtered.filter(
        rental => (rental.totalPrice || 0) >= minPrice
      );
    }

    if (advancedFilters.priceMax) {
      const maxPrice = parseFloat(advancedFilters.priceMax);
      filtered = filtered.filter(
        rental => (rental.totalPrice || 0) <= maxPrice
      );
    }

    // Customer name filter
    if (advancedFilters.customerName.trim()) {
      const customerQuery = advancedFilters.customerName.trim();
      filtered = filtered.filter(rental =>
        textContains(rental.customerName, customerQuery)
      );
    }

    // Vehicle brand filter
    if (
      advancedFilters.vehicleBrand &&
      advancedFilters.vehicleBrand !== 'all'
    ) {
      filtered = filtered.filter(rental => {
        const vehicle = vehicleLookupMap.get(rental.vehicleId);
        return vehicle?.brand === advancedFilters.vehicleBrand;
      });
    }

    // License plate filter
    if (advancedFilters.licensePlate.trim()) {
      const plateQuery = advancedFilters.licensePlate.trim();
      filtered = filtered.filter(rental => {
        const vehicle = vehicleLookupMap.get(rental.vehicleId);
        return textContains(vehicle?.licensePlate, plateQuery);
      });
    }

    // Payment status filter
    if (advancedFilters.paymentStatus !== 'all') {
      if (advancedFilters.paymentStatus === 'paid') {
        filtered = filtered.filter(rental => rental.paid);
      } else if (advancedFilters.paymentStatus === 'unpaid') {
        filtered = filtered.filter(rental => !rental.paid);
      }
    }

    // Show only active filter
    if (advancedFilters.showOnlyActive) {
      const today = new Date();
      filtered = filtered.filter(rental => {
        const startDate = new Date(rental.startDate);
        const endDate = new Date(rental.endDate);
        return startDate <= today && endDate >= today;
      });
    }

    // Show only overdue filter
    if (advancedFilters.showOnlyOverdue) {
      const today = new Date();
      filtered = filtered.filter(rental => {
        const endDate = new Date(rental.endDate);
        return endDate < today && !protocols[rental.id]?.return;
      });
    }

    // Show only completed filter
    if (advancedFilters.showOnlyCompleted) {
      filtered = filtered.filter(rental => protocols[rental.id]?.return);
    }

    // 🎯 CUSTOM TIME FILTERS - pre rýchle filtre z dashboard
    if (advancedFilters.timeFilter && advancedFilters.timeFilter !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Calculate week boundaries
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay())); // Najbližšia nedeľa
      endOfWeek.setHours(23, 59, 59, 999);

      switch (advancedFilters.timeFilter) {
        case 'todayActivity':
          // Prenájmy ktoré sa dnes začínajú ALEBO končia
          filtered = filtered.filter(rental => {
            const startDate = new Date(rental.startDate);
            const endDate = new Date(rental.endDate);
            const isToday = (date: Date) => {
              return date.toDateString() === today.toDateString();
            };
            return isToday(startDate) || isToday(endDate);
          });
          break;

        case 'tomorrowReturns':
          // Prenájmy ktoré sa zajtra končia
          filtered = filtered.filter(rental => {
            const endDate = new Date(rental.endDate);
            return endDate.toDateString() === tomorrow.toDateString();
          });
          break;

        case 'weekActivity':
          // Prenájmy ktoré sa tento týždeň začínajú ALEBO končia
          filtered = filtered.filter(rental => {
            const startDate = new Date(rental.startDate);
            const endDate = new Date(rental.endDate);

            const startsThisWeek = startDate >= today && startDate <= endOfWeek;
            const endsThisWeek = endDate >= today && endDate <= endOfWeek;

            return startsThisWeek || endsThisWeek;
          });
          break;

        case 'newToday':
          // Prenájmy vytvorené dnes
          filtered = filtered.filter(rental => {
            if (!rental.createdAt) return false;
            const createdDate = new Date(rental.createdAt);
            return createdDate.toDateString() === today.toDateString();
          });
          break;

        default:
          break;
      }
    }

    return filtered;
  }, [
    rentals,
    debouncedSearchQuery,
    advancedFilters,
    vehicleLookupMap,
    protocols,
  ]);

  // 🎯 QUICK FILTER HANDLER - pre dashboard metriky
  const handleQuickFilter = useCallback((filterType: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Calculate week boundaries
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay())); // Najbližšia nedeľa
    endOfWeek.setHours(23, 59, 59, 999);

    // Reset all filters first
    const baseFilters: FilterState = {
      status: [],
      paymentMethod: [],
      company: [],
      dateFrom: '',
      dateTo: '',
      priceMin: '',
      priceMax: '',
      protocolStatus: [],
      customerName: '',
      vehicleBrand: '',
      vehicleModel: '',
      licensePlate: '',
      customerEmail: '',
      customerPhone: '',
      customerCompany: '',
      insuranceCompany: '',
      insuranceType: '',
      timeFilter: filterType, // Set the time filter type
      priceRange: 'all',
      paymentStatus: 'all',
      showOnlyActive: false,
      showOnlyOverdue: false,
      showOnlyCompleted: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
    };

    const quickFilters = { ...baseFilters };

    switch (filterType) {
      case 'overdue':
        // Preterminované - prenájmy ktoré mali skončiť ale ešte sa nevrátili
        quickFilters.showOnlyOverdue = true;
        break;

      case 'todayActivity':
        // Dnes odovzdanie/vrátenie - prenájmy ktoré sa dnes začínajú ALEBO končia
        // Potrebujeme custom filter pre toto, nie len dateFrom/dateTo
        quickFilters.timeFilter = 'todayActivity';
        break;

      case 'tomorrowReturns': {
        // Zajtra vrátenie - prenájmy ktoré sa zajtra končia
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        quickFilters.dateTo = tomorrowStr;
        quickFilters.timeFilter = 'tomorrowReturns';
        break;
      }

      case 'weekActivity':
        // Tento týždeň odovzdanie/vrátenie - prenájmy ktoré sa tento týždeň začínajú ALEBO končia
        quickFilters.timeFilter = 'weekActivity';
        break;

      case 'active':
        // Aktívne prenájmy - prenájmy ktoré práve prebiehajú
        quickFilters.showOnlyActive = true;
        break;

      case 'unpaid':
        // Nezaplatené prenájmy
        quickFilters.paymentStatus = 'unpaid';
        break;

      case 'pending':
        // Čakajúce prenájmy
        quickFilters.status = ['pending'];
        break;

      case 'newToday':
        // Nové dnes - prenájmy vytvorené dnes
        quickFilters.timeFilter = 'newToday';
        break;

      default:
        break;
    }

    setAdvancedFilters(prev => ({
      ...prev,
      ...quickFilters,
      showOnlyActive: quickFilters.showOnlyActive || false,
      showOnlyOverdue: quickFilters.showOnlyOverdue || false,
      showOnlyCompleted: quickFilters.showOnlyCompleted || false,
    }));

    // Show filters panel
    setShowFilters(true);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setAdvancedFilters({
      status: [],
      paymentMethod: [],
      company: [],
      dateFrom: '',
      dateTo: '',
      priceMin: '',
      priceMax: '',
      protocolStatus: [],
      customerName: '',
      vehicleBrand: '',
      vehicleModel: '',
      licensePlate: '',
      customerEmail: '',
      customerPhone: '',
      customerCompany: '',
      insuranceCompany: '',
      insuranceType: '',
      timeFilter: 'all',
      priceRange: 'all',
      paymentStatus: 'all',
      showOnlyActive: false,
      showOnlyOverdue: false,
      showOnlyCompleted: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    setShowFilters(false);
  }, []);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,

    // Filter state
    showFilters,
    setShowFilters,
    advancedFilters,
    setAdvancedFilters,

    // Filtered data
    filteredRentals,

    // Filter options
    uniqueStatuses,
    uniqueCompanies,
    uniquePaymentMethods,
    uniqueVehicleBrands,
    uniqueInsuranceCompanies,
    uniqueInsuranceTypes,

    // Quick filter handlers
    handleQuickFilter,
    resetFilters,
  };
};
