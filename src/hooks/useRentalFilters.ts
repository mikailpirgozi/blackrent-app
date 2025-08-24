import { useState, useCallback, useMemo, useEffect } from 'react';
import { Rental } from '../types';

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
}

interface UseRentalFiltersProps {
  rentals: Rental[];
  vehicles?: any[];
  protocols?: Record<string, { handover?: any; return?: any }>;
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
  protocols = {}
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
    const statuses = new Set(rentals.map(rental => rental.status).filter(Boolean) as string[]);
    return Array.from(statuses);
  }, [rentals]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(rentals.map(rental => {
      const vehicle = vehicleLookupMap.get(rental.vehicleId);
      return vehicle?.company;
    }).filter(Boolean));
    return Array.from(companies);
  }, [rentals, vehicleLookupMap]);

  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(rentals.map(rental => rental.paymentMethod).filter(Boolean));
    return Array.from(methods);
  }, [rentals]);

  const uniqueVehicleBrands = useMemo(() => {
    const brands = new Set(rentals.map(rental => {
      const vehicle = vehicleLookupMap.get(rental.vehicleId);
      return vehicle?.brand;
    }).filter(Boolean));
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
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(rental => {
        const vehicle = vehicleLookupMap.get(rental.vehicleId);
        
        return (
          rental.customerName?.toLowerCase().includes(query) ||
          rental.customer?.email?.toLowerCase().includes(query) ||
          rental.customer?.phone?.toLowerCase().includes(query) ||
          vehicle?.licensePlate?.toLowerCase().includes(query) ||
          vehicle?.brand?.toLowerCase().includes(query) ||
          vehicle?.model?.toLowerCase().includes(query) ||
          vehicle?.company?.toLowerCase().includes(query) ||
          rental.id?.toLowerCase().includes(query)
        );
      });
    }

    // Status filter
    if (advancedFilters.status.length > 0) {
      filtered = filtered.filter(rental => 
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
      filtered = filtered.filter(rental => 
        new Date(rental.startDate) >= fromDate
      );
    }

    if (advancedFilters.dateTo) {
      const toDate = new Date(advancedFilters.dateTo);
      filtered = filtered.filter(rental => 
        new Date(rental.endDate) <= toDate
      );
    }

    // Price range filter
    if (advancedFilters.priceMin) {
      const minPrice = parseFloat(advancedFilters.priceMin);
      filtered = filtered.filter(rental => 
        (rental.totalPrice || 0) >= minPrice
      );
    }

    if (advancedFilters.priceMax) {
      const maxPrice = parseFloat(advancedFilters.priceMax);
      filtered = filtered.filter(rental => 
        (rental.totalPrice || 0) <= maxPrice
      );
    }

    // Customer name filter
    if (advancedFilters.customerName.trim()) {
      const customerQuery = advancedFilters.customerName.toLowerCase().trim();
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(customerQuery)
      );
    }

    // Vehicle brand filter
    if (advancedFilters.vehicleBrand && advancedFilters.vehicleBrand !== 'all') {
      filtered = filtered.filter(rental => {
        const vehicle = vehicleLookupMap.get(rental.vehicleId);
        return vehicle?.brand === advancedFilters.vehicleBrand;
      });
    }

    // License plate filter
    if (advancedFilters.licensePlate.trim()) {
      const plateQuery = advancedFilters.licensePlate.toLowerCase().trim();
      filtered = filtered.filter(rental => {
        const vehicle = vehicleLookupMap.get(rental.vehicleId);
        return vehicle?.licensePlate?.toLowerCase().includes(plateQuery);
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
      filtered = filtered.filter(rental => 
        protocols[rental.id]?.return
      );
    }

    return filtered;
  }, [rentals, debouncedSearchQuery, advancedFilters, vehicleLookupMap, protocols]);

  // 🎯 QUICK FILTER HANDLER - pre dashboard metriky
  const handleQuickFilter = useCallback((filterType: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

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
      timeFilter: 'all',
      priceRange: 'all',
      paymentStatus: 'all',
      showOnlyActive: false,
      showOnlyOverdue: false,
      showOnlyCompleted: false,
    };

    let quickFilters = { ...baseFilters };

    switch (filterType) {
      case 'overdue':
        quickFilters.showOnlyOverdue = true;
        break;
      case 'todayActivity':
        const todayStr = today.toISOString().split('T')[0];
        quickFilters.dateFrom = todayStr;
        quickFilters.dateTo = todayStr;
        break;
      case 'tomorrowReturns':
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        quickFilters.dateTo = tomorrowStr;
        break;
      case 'active':
        quickFilters.showOnlyActive = true;
        break;
      case 'unpaid':
        quickFilters.paymentStatus = 'unpaid';
        break;
      case 'pending':
        quickFilters.status = ['pending'];
        break;
      case 'newToday':
        // Filter by creation date - would need additional logic
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
