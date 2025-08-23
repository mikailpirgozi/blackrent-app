import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { Vehicle, Rental, Expense, Insurance, Settlement, Customer, Company, Insurer, VehicleDocument, InsuranceClaim, VehicleCategory, VehicleStatus } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import { usePermissionsContext } from './PermissionsContext';
import logger from '../utils/logger';
import { logger as smartLogger } from '../utils/smartLogger';
import { cacheHelpers, smartInvalidation } from '../utils/unifiedCache';

// 🚀 ENHANCED FILTER SYSTEM - TYPES
interface FilterOptions {
  // Permission filters (always applied)
  permissions?: {
    userRole: string;
    companyAccess: string[];
  };
  
  // UI filters (optional)
  search?: string;
  category?: VehicleCategory | 'all';
  brand?: string;
  model?: string;  
  company?: string;
  status?: VehicleStatus | 'all';
  
  // Advanced filters
  dateRange?: { start: Date; end: Date };
  priceRange?: { min: number; max: number };
  
  // Status group filters (for backwards compatibility)
  showAvailable?: boolean;
  showRented?: boolean;
  showMaintenance?: boolean;
  showOther?: boolean;
  
  // Meta options
  includeAll?: boolean; // For admin override
}

interface AppState {
  vehicles: Vehicle[];
  rentals: Rental[];
  expenses: Expense[];
  insurances: Insurance[];
  settlements: Settlement[];
  companies: Company[];
  insurers: Insurer[];
  customers: Customer[];
  vehicleDocuments: VehicleDocument[];
  insuranceClaims: InsuranceClaim[];
  protocols: Array<{
    id: string;
    type: 'handover' | 'return';
    rentalId: string;
    createdBy: string;
    createdAt: Date;
    rentalData?: any;
  }>;
  loading: boolean;
  error: string | null;
  // OPTIMALIZÁCIA: Cache stav pre rýchlejšie načítanie
  dataLoaded: {
    vehicles: boolean;
    rentals: boolean;
    expenses: boolean;
    insurances: boolean;
    settlements: boolean;
    companies: boolean;
    insurers: boolean;
    customers: boolean;
    vehicleDocuments: boolean;
    insuranceClaims: boolean;
    protocols: boolean;
  };
  lastLoadTime: number | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'SET_RENTALS'; payload: Rental[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_INSURANCES'; payload: Insurance[] }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'SET_COMPANIES'; payload: Company[] }
  | { type: 'SET_INSURERS'; payload: Insurer[] }
  | { type: 'SET_SETTLEMENTS'; payload: Settlement[] }
  | { type: 'SET_VEHICLE_DOCUMENTS'; payload: VehicleDocument[] }
  | { type: 'SET_PROTOCOLS'; payload: Array<{
      id: string;
      type: 'handover' | 'return';
      rentalId: string;
      createdBy: string;
      createdAt: Date;
      rentalData?: any;
    }> }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'DELETE_VEHICLE'; payload: string }
  | { type: 'CLEAR_VEHICLES' }
  | { type: 'ADD_RENTAL'; payload: Rental }
  | { type: 'UPDATE_RENTAL'; payload: Rental }
  | { type: 'DELETE_RENTAL'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_INSURANCE'; payload: Insurance }
  | { type: 'UPDATE_INSURANCE'; payload: Insurance }
  | { type: 'DELETE_INSURANCE'; payload: string }
  | { type: 'ADD_SETTLEMENT'; payload: Settlement }
  | { type: 'DELETE_SETTLEMENT'; payload: string }
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'DELETE_COMPANY'; payload: string }
  | { type: 'ADD_INSURER'; payload: Insurer }
  | { type: 'DELETE_INSURER'; payload: string }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_VEHICLE_DOCUMENT'; payload: VehicleDocument }
  | { type: 'UPDATE_VEHICLE_DOCUMENT'; payload: VehicleDocument }
  | { type: 'DELETE_VEHICLE_DOCUMENT'; payload: string }
  | { type: 'SET_INSURANCE_CLAIMS'; payload: InsuranceClaim[] }
  | { type: 'ADD_INSURANCE_CLAIM'; payload: InsuranceClaim }
  | { type: 'UPDATE_INSURANCE_CLAIM'; payload: InsuranceClaim }
  | { type: 'DELETE_INSURANCE_CLAIM'; payload: string }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'LOAD_DATA'; payload: AppState }
  | { type: 'SET_DATA_LOADED'; payload: { type: keyof AppState['dataLoaded']; loaded: boolean } }
  | { type: 'SET_LAST_LOAD_TIME'; payload: number };

const initialState: AppState = {
  vehicles: [],
  rentals: [],
  expenses: [],
  insurances: [],
  settlements: [],
  companies: [],
  insurers: [],
  customers: [],
  vehicleDocuments: [],
  insuranceClaims: [],
  protocols: [],
  loading: false,
  error: null,
  // OPTIMALIZÁCIA: Cache stav
  dataLoaded: {
    vehicles: false,
    rentals: false,
    expenses: false,
    insurances: false,
    settlements: false,
    companies: false,
    insurers: false,
    customers: false,
    vehicleDocuments: false,
    insuranceClaims: false,
    protocols: false,
  },
  lastLoadTime: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_VEHICLES':
      return { ...state, vehicles: action.payload };
    case 'SET_RENTALS':
      return { ...state, rentals: action.payload };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    case 'SET_INSURANCES':
      return { ...state, insurances: action.payload };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'SET_COMPANIES':
      return { ...state, companies: action.payload };
    case 'SET_INSURERS':
      return { ...state, insurers: action.payload };
    case 'SET_SETTLEMENTS':
      return { ...state, settlements: action.payload };
    case 'SET_VEHICLE_DOCUMENTS':
      return { ...state, vehicleDocuments: action.payload };
    case 'SET_INSURANCE_CLAIMS':
      return { ...state, insuranceClaims: action.payload };
    case 'SET_PROTOCOLS':
      return { ...state, protocols: action.payload };
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [...state.vehicles, action.payload] };
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map(v => v.id === action.payload.id ? action.payload : v)
      };
    case 'DELETE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.filter(v => v.id !== action.payload)
      };
    case 'CLEAR_VEHICLES':
      return { ...state, vehicles: [] };
    case 'ADD_RENTAL':
      return { ...state, rentals: [...state.rentals, action.payload] };
    case 'UPDATE_RENTAL':
      return {
        ...state,
        rentals: state.rentals.map(r => r.id === action.payload.id ? action.payload : r)
      };
    case 'DELETE_RENTAL':
      return {
        ...state,
        rentals: state.rentals.filter(r => r.id !== action.payload)
      };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e)
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload)
      };
    case 'ADD_INSURANCE':
      return { ...state, insurances: [...state.insurances, action.payload] };
    case 'UPDATE_INSURANCE':
      return {
        ...state,
        insurances: state.insurances.map(i => i.id === action.payload.id ? action.payload : i)
      };
    case 'DELETE_INSURANCE':
      return {
        ...state,
        insurances: state.insurances.filter(i => i.id !== action.payload)
      };
    case 'ADD_SETTLEMENT':
      return { ...state, settlements: [...state.settlements, action.payload] };
    case 'DELETE_SETTLEMENT':
      return {
        ...state,
        settlements: state.settlements.filter(s => s.id !== action.payload)
      };
    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.payload] };
    case 'DELETE_COMPANY':
      return { ...state, companies: state.companies.filter(c => c.id !== action.payload) };
    case 'ADD_INSURER':
      return { ...state, insurers: [...state.insurers, action.payload] };
    case 'DELETE_INSURER':
      return { ...state, insurers: state.insurers.filter(i => i.id !== action.payload) };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload)
      };
    case 'ADD_VEHICLE_DOCUMENT':
      return { ...state, vehicleDocuments: [...state.vehicleDocuments, action.payload] };
    case 'UPDATE_VEHICLE_DOCUMENT':
      return {
        ...state,
        vehicleDocuments: state.vehicleDocuments.map(doc => doc.id === action.payload.id ? action.payload : doc)
      };
    case 'DELETE_VEHICLE_DOCUMENT':
      return {
        ...state,
        vehicleDocuments: state.vehicleDocuments.filter(doc => doc.id !== action.payload)
      };
    case 'ADD_INSURANCE_CLAIM':
      return { ...state, insuranceClaims: [...state.insuranceClaims, action.payload] };
    case 'UPDATE_INSURANCE_CLAIM':
      return {
        ...state,
        insuranceClaims: state.insuranceClaims.map(claim => claim.id === action.payload.id ? action.payload : claim)
      };
    case 'DELETE_INSURANCE_CLAIM':
      return {
        ...state,
        insuranceClaims: state.insuranceClaims.filter(claim => claim.id !== action.payload)
      };
    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        loading: state.loading,
        error: state.error
      };
    case 'LOAD_DATA':
      return action.payload;
    case 'SET_DATA_LOADED':
      return {
        ...state,
        dataLoaded: {
          ...state.dataLoaded,
          [action.payload.type]: action.payload.loaded,
        },
      };
    case 'SET_LAST_LOAD_TIME':
      return {
        ...state,
        lastLoadTime: action.payload,
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // 📜 LEGACY: Filtered data based on user permissions (BACKWARDS COMPATIBLE)
  getFilteredVehicles: () => Vehicle[];
  getFilteredRentals: () => Rental[];
  getFilteredExpenses: () => Expense[];
  getFilteredInsurances: () => Insurance[];
  getFilteredSettlements: () => Settlement[];
  getFilteredCompanies: () => Company[];
  // 🚀 ENHANCED: Advanced filtering with options
  getEnhancedFilteredVehicles: (options?: FilterOptions) => Vehicle[];
  getEnhancedFilteredRentals: (options?: FilterOptions) => Rental[];
  getEnhancedFilteredExpenses: (options?: FilterOptions) => Expense[];
  // 🎯 HELPERS: Convenience functions for common use cases
  getFullyFilteredVehicles: (uiFilters: Omit<FilterOptions, 'permissions'>) => Vehicle[];
  // API helper methods
  createVehicle: (vehicle: Vehicle) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  createRental: (rental: Rental) => Promise<void>;
  updateRental: (rental: Rental) => Promise<void>;
  deleteRental: (id: string) => Promise<void>;
  createExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  createInsurance: (insurance: Insurance) => Promise<void>;
  updateInsurance: (insurance: Insurance) => Promise<void>;
  deleteInsurance: (id: string) => Promise<void>;
  createSettlement: (settlement: Settlement) => Promise<void>;
  deleteSettlement: (id: string) => Promise<void>;
  createCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  createCompany: (company: Company) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  createInsurer: (insurer: Insurer) => Promise<void>;
  deleteInsurer: (id: string) => Promise<void>;
  createVehicleDocument: (document: VehicleDocument) => Promise<void>;
  updateVehicleDocument: (document: VehicleDocument) => Promise<void>;
  deleteVehicleDocument: (id: string) => Promise<void>;
  createInsuranceClaim: (claim: InsuranceClaim) => Promise<void>;
  updateInsuranceClaim: (claim: InsuranceClaim) => Promise<void>;
  deleteInsuranceClaim: (id: string) => Promise<void>;
  loadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { state: authState } = useAuth();
  const { userCompanyAccess } = usePermissionsContext();

  // Helper funkcia na získanie povolených company names
  const getAccessibleCompanyNames = (): string[] => {
    if (!authState.user || authState.user.role === 'admin') {
      // Admin vidí všetky firmy
      return state.companies.map(c => c.name);
    }
    
    // Ostatní používatelia vidia len firmy, na ktoré majú oprávnenia
    return userCompanyAccess.map(access => access.companyName);
  };

  const getFilteredVehicles = (): Vehicle[] => {
    if (!authState.user || authState.user.role === 'admin') {
      return state.vehicles || [];
    }
    
    const accessibleCompanyNames = getAccessibleCompanyNames();
    return (state.vehicles || []).filter(vehicle => 
      vehicle.company && accessibleCompanyNames.includes(vehicle.company)
    );
  };

  const getFilteredRentals = (): Rental[] => {
    if (!authState.user || authState.user.role === 'admin') {
      return state.rentals || [];
    }
    
    const accessibleCompanyNames = getAccessibleCompanyNames();
    return (state.rentals || []).filter(rental => {
      // Filtruj podľa vehicle.company
      if (rental.vehicle && rental.vehicle.company) {
        return accessibleCompanyNames.includes(rental.vehicle.company);
      }
      return false; // Ak nemá vehicle alebo company, nezobrazuj
    });
  };

  const getFilteredExpenses = (): Expense[] => {
    if (!authState.user || authState.user.role === 'admin') {
      return state.expenses || [];
    }
    
    const accessibleCompanyNames = getAccessibleCompanyNames();
    return (state.expenses || []).filter(expense => 
      accessibleCompanyNames.includes(expense.company)
    );
  };

  const getFilteredInsurances = (): Insurance[] => {
    if (!authState.user || authState.user.role === 'admin') {
      return state.insurances || [];
    }
    
    const accessibleCompanyNames = getAccessibleCompanyNames();
    return (state.insurances || []).filter(insurance => 
      accessibleCompanyNames.includes(insurance.company)
    );
  };

  const getFilteredSettlements = (): Settlement[] => {
    if (!authState.user || authState.user.role === 'admin') {
      return state.settlements || [];
    }
    
    const accessibleCompanyNames = getAccessibleCompanyNames();
    return (state.settlements || []).filter(settlement => 
      accessibleCompanyNames.includes(settlement.company || '')
    );
  };

  const getFilteredCompanies = (): Company[] => {
    if (!authState.user || authState.user.role === 'admin') {
      return state.companies || [];
    }
    
    const accessibleCompanyNames = getAccessibleCompanyNames();
    return (state.companies || []).filter(company => 
      accessibleCompanyNames.includes(company.name)
    );
  };

  // 🚀 ENHANCED FILTER SYSTEM - IMPLEMENTATIONS
  
  const getEnhancedFilteredVehicles = (options: FilterOptions = {}): Vehicle[] => {
    let vehicles = state.vehicles || [];
    
    // 1️⃣ PERMISSION LAYER (always applied unless admin override)
    if (!options.includeAll && (!authState.user || authState.user.role !== 'admin')) {
      const accessibleCompanyNames = getAccessibleCompanyNames();
      vehicles = vehicles.filter(vehicle => 
        vehicle.company && accessibleCompanyNames.includes(vehicle.company)
      );
    }
    
    // 2️⃣ SEARCH LAYER
    if (options.search) {
      const query = options.search.toLowerCase();
      vehicles = vehicles.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.licensePlate.toLowerCase().includes(query) ||
        (vehicle.vin && vehicle.vin.toLowerCase().includes(query)) ||
        (vehicle.company && vehicle.company.toLowerCase().includes(query))
      );
    }
    
    // 3️⃣ CATEGORY LAYER  
    if (options.category && options.category !== 'all') {
      vehicles = vehicles.filter(vehicle => vehicle.category === options.category);
    }
    
    // 4️⃣ BRAND LAYER
    if (options.brand) {
      vehicles = vehicles.filter(vehicle => 
        vehicle.brand.toLowerCase().includes(options.brand!.toLowerCase())
      );
    }
    
    // 5️⃣ MODEL LAYER
    if (options.model) {
      vehicles = vehicles.filter(vehicle => 
        vehicle.model.toLowerCase().includes(options.model!.toLowerCase())
      );
    }
    
    // 6️⃣ STATUS LAYER
    if (options.status && options.status !== 'all') {
      vehicles = vehicles.filter(vehicle => vehicle.status === options.status);
    }
    
    // 7️⃣ COMPANY LAYER
    if (options.company) {
      vehicles = vehicles.filter(vehicle => vehicle.company === options.company);
    }
    
    // 8️⃣ STATUS GROUP LAYERS (for backwards compatibility)
    if (options.showAvailable !== undefined && !options.showAvailable) {
      vehicles = vehicles.filter(vehicle => vehicle.status !== 'available');
    }
    if (options.showRented !== undefined && !options.showRented) {
      vehicles = vehicles.filter(vehicle => vehicle.status !== 'rented');
    }
    if (options.showMaintenance !== undefined && !options.showMaintenance) {
      vehicles = vehicles.filter(vehicle => vehicle.status !== 'maintenance');
    }
    if (options.showOther !== undefined && !options.showOther) {
      vehicles = vehicles.filter(vehicle => ['available', 'rented', 'maintenance'].includes(vehicle.status));
    }
    
    return vehicles;
  };

  const getEnhancedFilteredRentals = (options: FilterOptions = {}): Rental[] => {
    let rentals = state.rentals || [];
    
    // 1️⃣ PERMISSION LAYER
    if (!options.includeAll && (!authState.user || authState.user.role !== 'admin')) {
      const accessibleCompanyNames = getAccessibleCompanyNames();
      rentals = rentals.filter(rental => {
        if (rental.vehicle && rental.vehicle.company) {
          return accessibleCompanyNames.includes(rental.vehicle.company);
        }
        return false;
      });
    }
    
    // 2️⃣ SEARCH LAYER
    if (options.search) {
      const query = options.search.toLowerCase();
      rentals = rentals.filter(rental =>
        (rental.vehicle && rental.vehicle.brand.toLowerCase().includes(query)) ||
        (rental.vehicle && rental.vehicle.model.toLowerCase().includes(query)) ||
        (rental.vehicle && rental.vehicle.licensePlate.toLowerCase().includes(query)) ||
        (rental.customer && rental.customer.name.toLowerCase().includes(query))
      );
    }
    
    return rentals;
  };

  const getEnhancedFilteredExpenses = (options: FilterOptions = {}): Expense[] => {
    let expenses = state.expenses || [];
    
    // 1️⃣ PERMISSION LAYER
    if (!options.includeAll && (!authState.user || authState.user.role !== 'admin')) {
      const accessibleCompanyNames = getAccessibleCompanyNames();
      expenses = expenses.filter(expense => 
        accessibleCompanyNames.includes(expense.company)
      );
    }
    
    // 2️⃣ SEARCH LAYER
    if (options.search) {
      const query = options.search.toLowerCase();
      expenses = expenses.filter(expense =>
        expense.description.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        expense.company.toLowerCase().includes(query)
      );
    }
    
    return expenses;
  };

  // 🎯 HELPER FUNCTIONS for easier usage
  const getFullyFilteredVehicles = (uiFilters: Omit<FilterOptions, 'permissions'>): Vehicle[] => {
    return getEnhancedFilteredVehicles({
      ...uiFilters,
      // Always apply permissions unless explicitly overridden
      includeAll: authState.user?.role === 'admin' && uiFilters.includeAll
    });
  };

  // Funkcia na načítanie dát z API - OPTIMALIZOVANÁ s BULK endpointom
  const loadData = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      logger.perf('🚀 Načítavam dáta z BULK API (najrýchlejšie riešenie)...');
      const startTime = Date.now();
      
      // ⚡ PHASE 3: SINGLE BULK API CALL - všetky dáta jedným requestom
      // logger.debug('📦 BULK: Vykonávam jediný API request...'); // VERBOSE: Disabled - already logged by API service
      const bulkData = await apiService.getBulkData();
      
      const bulkTime = Date.now() - startTime;
      // Optimalized: Reduced bulk logging - already logged by API service
      if (process.env.NODE_ENV === 'development') {
        logger.perf(`✅ BULK: Všetky dáta načítané v ${bulkTime}ms jedným requestom!`);
        logger.perf('📊 BULK: Metadata:', bulkData.metadata);
      }
      
      // 🗄️ UNIFIED CACHE: Store data in unified cache system
      cacheHelpers.vehicles.set(bulkData.vehicles);
      cacheHelpers.rentals.set(bulkData.rentals);
      cacheHelpers.customers.set(bulkData.customers);
      cacheHelpers.companies.set(bulkData.companies);
      
      // Dispatch všetkých dát naraz
      dispatch({ type: 'SET_VEHICLES', payload: bulkData.vehicles });
      dispatch({ type: 'SET_RENTALS', payload: bulkData.rentals });
      dispatch({ type: 'SET_CUSTOMERS', payload: bulkData.customers });
      dispatch({ type: 'SET_COMPANIES', payload: bulkData.companies });
      dispatch({ type: 'SET_INSURERS', payload: bulkData.insurers });
      dispatch({ type: 'SET_EXPENSES', payload: bulkData.expenses });
      dispatch({ type: 'SET_INSURANCES', payload: bulkData.insurances });
      dispatch({ type: 'SET_SETTLEMENTS', payload: bulkData.settlements });
      dispatch({ type: 'SET_VEHICLE_DOCUMENTS', payload: bulkData.vehicleDocuments });
      dispatch({ type: 'SET_INSURANCE_CLAIMS', payload: bulkData.insuranceClaims });
      
      // 📊 Load protocols for employee statistics (separate API call)
      try {
        logger.perf('📊 Načítavam protokoly pre štatistiky...');
        const protocolsStartTime = Date.now();
        const protocols = await apiService.getAllProtocolsForStats();
        const protocolsTime = Date.now() - protocolsStartTime;
        
        dispatch({ type: 'SET_PROTOCOLS', payload: protocols });
        dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'protocols', loaded: true } });
        
        logger.perf(`✅ Protokoly načítané v ${protocolsTime}ms (${protocols.length} protokolov)`);
      } catch (error) {
        console.error('❌ Chyba pri načítaní protokolov pre štatistiky:', error);
        // Don't fail the whole load process if protocols fail
        dispatch({ type: 'SET_PROTOCOLS', payload: [] });
        dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'protocols', loaded: false } });
      }
      
      // Označ všetky dáta ako načítané
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'vehicles', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'rentals', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'customers', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'companies', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'insurers', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'expenses', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'insurances', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'settlements', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'vehicleDocuments', loaded: true } });
      dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'insuranceClaims', loaded: true } });
      
      // Nastav čas načítania pre cache
      dispatch({ type: 'SET_LAST_LOAD_TIME', payload: Date.now() });
      
    } catch (error: any) {
      console.error('Chyba pri načítavaní BULK dát:', error);
      
      // FALLBACK: Ak BULK API zlyhá, použij starý spôsob
      console.log('🔄 FALLBACK: Bulk API zlyhal, používam individuálne API calls...');
      try {
        await loadDataFallback();
      } catch (fallbackError) {
        console.error('❌ FALLBACK tiež zlyhal:', fallbackError);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Chyba pri načítavaní dát' });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // FALLBACK funkcia - pôvodný spôsob načítania
  const loadDataFallback = async (): Promise<void> => {
    console.log('📦 FALLBACK: Načítavam dáta individuálnymi API calls...');
    
    // OPTIMALIZÁCIA: Načítaj najdôležitejšie dáta PRVÉ
    console.log('📦 1. Načítavam kľúčové dáta (vehicles, customers)...');
    const [vehicles, customers] = await Promise.all([
      apiService.getVehicles(),
      apiService.getCustomers()
    ]);
    
    // OKAMŽITE dispatch kľúčových dát
    dispatch({ type: 'SET_VEHICLES', payload: vehicles });
    dispatch({ type: 'SET_CUSTOMERS', payload: customers });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'vehicles', loaded: true } });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'customers', loaded: true } });
    
    // OPTIMALIZÁCIA: Načítaj ostatné dáta PARALELNE
    console.log('📦 2. Načítavam ostatné dáta paralelne...');
    const [rentals, expenses, insurances, companies, insurers, settlements, vehicleDocuments, insuranceClaims] = await Promise.all([
      apiService.getRentals(),
      apiService.getExpenses(),
      apiService.getInsurances(),
      apiService.getCompanies(),
      apiService.getInsurers(),
      apiService.getSettlements(),
      apiService.getVehicleDocuments(),
      apiService.getInsuranceClaims()
    ]);
    
    console.log('✅ FALLBACK: Dáta úspešne načítané individuálne:', { 
      vehicles: vehicles.length, 
      rentals: rentals.length
    });
    
    // Dispatch všetkých dát naraz
    dispatch({ type: 'SET_RENTALS', payload: rentals });
    dispatch({ type: 'SET_EXPENSES', payload: expenses });
    dispatch({ type: 'SET_INSURANCES', payload: insurances });
    dispatch({ type: 'SET_COMPANIES', payload: companies });
    dispatch({ type: 'SET_INSURERS', payload: insurers });
    dispatch({ type: 'SET_SETTLEMENTS', payload: settlements });
    dispatch({ type: 'SET_VEHICLE_DOCUMENTS', payload: vehicleDocuments });
    dispatch({ type: 'SET_INSURANCE_CLAIMS', payload: insuranceClaims });
    
    // Označ všetky dáta ako načítané
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'rentals', loaded: true } });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'expenses', loaded: true } });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'insurances', loaded: true } });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'companies', loaded: true } });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'insurers', loaded: true } });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'settlements', loaded: true } });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'vehicleDocuments', loaded: true } });
    dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'insuranceClaims', loaded: true } });
  };

  // 🗄️ UNIFIED CACHE: Smart data loading with unified cache system
  useEffect(() => {
    const loadDataSafely = async () => {
      if (authState.isAuthenticated && !authState.isLoading && authState.token) {
        
        // 🚀 UNIFIED CACHE: Check if we have cached data
        const cachedVehicles = cacheHelpers.vehicles.get();
        const cachedRentals = cacheHelpers.rentals.get();
        const cachedCustomers = cacheHelpers.customers.get();
        const cachedCompanies = cacheHelpers.companies.get();
        
        if (cachedVehicles && cachedRentals && cachedCustomers && cachedCompanies) {
          smartLogger.cache('Using unified cached data - no API calls needed');
          
          // Load from unified cache
          dispatch({ type: 'SET_VEHICLES', payload: cachedVehicles });
          dispatch({ type: 'SET_RENTALS', payload: cachedRentals });
          dispatch({ type: 'SET_CUSTOMERS', payload: cachedCustomers });
          dispatch({ type: 'SET_COMPANIES', payload: cachedCompanies });
          
          // Mark data as loaded
          dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'vehicles', loaded: true } });
          dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'rentals', loaded: true } });
          dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'customers', loaded: true } });
          dispatch({ type: 'SET_DATA_LOADED', payload: { type: 'companies', loaded: true } });
          
        } else {
          smartLogger.cache('Cache miss - loading fresh data from API');
          await loadData();
        }
        
      } else if (!authState.isAuthenticated && !authState.isLoading) {
        // Clear data and cache when user logs out
        console.log('Používateľ nie je prihlásený, mažem dáta a cache...');
        dispatch({ type: 'CLEAR_ALL_DATA' });
        
        // Clear unified cache
        cacheHelpers.vehicles.invalidate();
        cacheHelpers.rentals.invalidate();
        cacheHelpers.customers.invalidate();
        cacheHelpers.companies.invalidate();
      }
    };

    loadDataSafely();
  }, [authState.isAuthenticated, authState.isLoading, authState.token, loadData]);

  // API helper methods
  const createVehicle = async (vehicle: Vehicle): Promise<void> => {
    try {
      await apiService.createVehicle(vehicle);
      dispatch({ type: 'ADD_VEHICLE', payload: vehicle });
      
      // 🗄️ UNIFIED CACHE: Smart invalidation
      smartInvalidation.onVehicleChange();
    } catch (error) {
      console.error('Chyba pri vytváraní vozidla:', error);
      throw error;
    }
  };

  const updateVehicle = async (vehicle: Vehicle): Promise<void> => {
    try {
      await apiService.updateVehicle(vehicle);
      
      // 🗄️ UNIFIED CACHE: Aggressive invalidation - clear ALL vehicle-related cache
      cacheHelpers.vehicles.invalidate();
      smartInvalidation.onVehicleChange();
      
      // 🔄 REFRESH: Reload ALL vehicles to ensure fresh data
      console.log('🔄 Reloading all vehicles after update...');
      const freshVehicles = await apiService.getVehicles();
      dispatch({ type: 'SET_VEHICLES', payload: freshVehicles });
      
      console.log('✅ All vehicles reloaded with fresh data');
    } catch (error) {
      console.error('Chyba pri aktualizácii vozidla:', error);
      throw error;
    }
  };

  const deleteVehicle = async (id: string): Promise<void> => {
    try {
      await apiService.deleteVehicle(id);
      dispatch({ type: 'DELETE_VEHICLE', payload: id });
      
      // 🗄️ UNIFIED CACHE: Smart invalidation
      smartInvalidation.onVehicleChange();
    } catch (error) {
      console.error('Chyba pri mazaní vozidla:', error);
      throw error;
    }
  };

  const createRental = async (rental: Rental): Promise<void> => {
    try {
      // 🚀 OPTIMISTIC CREATE: Okamžite pridaj do UI pred API callom
      dispatch({ type: 'ADD_RENTAL', payload: rental });
      
      // Trigger paginated list update cez custom event
      window.dispatchEvent(new CustomEvent('rental-optimistic-update', { 
        detail: { rental, action: 'create' }
      }));
      
      logger.debug('⚡ Optimistic create applied for rental:', rental.id);
      
      // Server API call na pozadí
      const createdRental = await apiService.createRental(rental);
      
      // Aktualizuj s real dátami zo servera (môže mať iné ID)
      if (createdRental.id !== rental.id) {
        dispatch({ type: 'UPDATE_RENTAL', payload: { ...rental, id: createdRental.id } });
        window.dispatchEvent(new CustomEvent('rental-optimistic-update', { 
          detail: { rental: { ...rental, id: createdRental.id }, action: 'update' }
        }));
      }
      
      logger.debug('✅ Server create confirmed for rental:', createdRental.id);
      
      // 🗄️ UNIFIED CACHE: Smart invalidation
      smartInvalidation.onRentalChange();
      
    } catch (error) {
      console.error('❌ Chyba pri vytváraní prenájmu:', error);
      
      // 🔄 ROLLBACK: Odstráň z UI pri chybe
      dispatch({ type: 'DELETE_RENTAL', payload: rental.id });
      window.dispatchEvent(new CustomEvent('rental-optimistic-update', { 
        detail: { rental, action: 'delete' }
      }));
      logger.debug('🔄 Optimistic create rolled back for rental:', rental.id);
      
      throw error;
    }
  };

  const updateRental = async (rental: Rental): Promise<void> => {
    // 🚀 DUAL OPTIMISTIC UPDATE: Aktualizuj oba state systémy
    const originalRental = state.rentals.find(r => r.id === rental.id);
    
    try {
      // 1. Okamžitá UI aktualizácia v oboch systémoch
      dispatch({ type: 'UPDATE_RENTAL', payload: rental });
      
      // 2. Trigger paginated list update cez custom event
      window.dispatchEvent(new CustomEvent('rental-optimistic-update', { 
        detail: { rental, action: 'update' }
      }));
      
      logger.debug('⚡ Dual optimistic update applied for rental:', rental.id);
      
      // 3. Server API call na pozadí
      await apiService.updateRental(rental);
      logger.debug('✅ Server update confirmed for rental:', rental.id);
      
      // 4. Cache invalidation
      smartInvalidation.onRentalChange();
      
    } catch (error) {
      console.error('❌ Chyba pri aktualizácii prenájmu:', error);
      
      // 🔄 ROLLBACK: Vráť pôvodné dáta v oboch systémoch
      if (originalRental) {
        dispatch({ type: 'UPDATE_RENTAL', payload: originalRental });
        window.dispatchEvent(new CustomEvent('rental-optimistic-update', { 
          detail: { rental: originalRental, action: 'rollback' }
        }));
        logger.debug('🔄 Dual optimistic update rolled back for rental:', rental.id);
      }
      
      throw error;
    }
  };

  const deleteRental = async (id: string): Promise<void> => {
    try {
      console.log(`🗑️ AppContext: Mazanie prenájmu ID: ${id}`);
      await apiService.deleteRental(id);
      console.log(`✅ AppContext: Prenájom ${id} úspešne vymazaný z API`);
      dispatch({ type: 'DELETE_RENTAL', payload: id });
      
      // 🗄️ UNIFIED CACHE: Smart invalidation
      smartInvalidation.onRentalChange();
    } catch (error) {
      console.error('Chyba pri mazaní prenájmu:', error);
      
      // Ak je prenájom už vymazaný, aktualizujme dáta
      if (error instanceof Error && error.message.includes('Prenájom nenájdený')) {
        console.log('🔄 AppContext: Prenájom už neexistuje, aktualizujem dáta...');
        // Načítaj znovu všetky dáta z API
        await loadData();
      }
      
      throw error;
    }
  };

  const createExpense = async (expense: Expense): Promise<void> => {
    try {
      await apiService.createExpense(expense);
      dispatch({ type: 'ADD_EXPENSE', payload: expense });
    } catch (error) {
      console.error('Chyba pri vytváraní nákladu:', error);
      throw error;
    }
  };

  const updateExpense = async (expense: Expense): Promise<void> => {
    try {
      await apiService.updateExpense(expense);
      dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
    } catch (error) {
      console.error('Chyba pri aktualizácii nákladu:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    try {
      await apiService.deleteExpense(id);
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní nákladu:', error);
      throw error;
    }
  };

  const createInsurance = async (insurance: Insurance): Promise<void> => {
    try {
      await apiService.createInsurance(insurance);
      dispatch({ type: 'ADD_INSURANCE', payload: insurance });
    } catch (error) {
      console.error('Chyba pri vytváraní poistky:', error);
      throw error;
    }
  };

  const updateInsurance = async (insurance: Insurance): Promise<void> => {
    try {
      await apiService.updateInsurance(insurance);
      dispatch({ type: 'UPDATE_INSURANCE', payload: insurance });
    } catch (error) {
      console.error('Chyba pri aktualizácii poistky:', error);
      throw error;
    }
  };

  const deleteInsurance = async (id: string): Promise<void> => {
    try {
      await apiService.deleteInsurance(id);
      dispatch({ type: 'DELETE_INSURANCE', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní poistky:', error);
      throw error;
    }
  };

  const createSettlement = async (settlement: Settlement): Promise<void> => {
    try {
      await apiService.createSettlement(settlement);
      dispatch({ type: 'ADD_SETTLEMENT', payload: settlement });
    } catch (error) {
      console.error('Chyba pri vytváraní vyúčtovania:', error);
      throw error;
    }
  };

  const deleteSettlement = async (id: string): Promise<void> => {
    try {
      await apiService.deleteSettlement(id);
      dispatch({ type: 'DELETE_SETTLEMENT', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní vyúčtovania:', error);
      throw error;
    }
  };

  const createCustomer = async (customer: Customer): Promise<void> => {
    try {
      await apiService.createCustomer(customer);
      dispatch({ type: 'ADD_CUSTOMER', payload: customer });
    } catch (error) {
      console.error('Chyba pri vytváraní zákazníka:', error);
      throw error;
    }
  };

  const updateCustomer = async (customer: Customer): Promise<void> => {
    try {
      await apiService.updateCustomer(customer);
      dispatch({ type: 'UPDATE_CUSTOMER', payload: customer });
    } catch (error) {
      console.error('Chyba pri aktualizácii zákazníka:', error);
      throw error;
    }
  };

  const createCompany = async (company: Company): Promise<void> => {
    try {
      await apiService.createCompany(company);
      dispatch({ type: 'ADD_COMPANY', payload: company });
    } catch (error) {
      console.error('Chyba pri vytváraní firmy:', error);
      throw error;
    }
  };

  const deleteCompany = async (id: string): Promise<void> => {
    try {
      await apiService.deleteCompany(id);
      dispatch({ type: 'DELETE_COMPANY', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní firmy:', error);
      throw error;
    }
  };

  const createInsurer = async (insurer: Insurer): Promise<void> => {
    try {
      await apiService.createInsurer(insurer);
      dispatch({ type: 'ADD_INSURER', payload: insurer });
    } catch (error) {
      console.error('Chyba pri vytváraní poisťovne:', error);
      throw error;
    }
  };

  const deleteInsurer = async (id: string): Promise<void> => {
    try {
      await apiService.deleteInsurer(id);
      dispatch({ type: 'DELETE_INSURER', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní poisťovne:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      await apiService.deleteCustomer(id);
      dispatch({ type: 'DELETE_CUSTOMER', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní zákazníka:', error);
      throw error;
    }
  };

  const createVehicleDocument = async (document: VehicleDocument): Promise<void> => {
    try {
      await apiService.createVehicleDocument(document);
      dispatch({ type: 'ADD_VEHICLE_DOCUMENT', payload: document });
    } catch (error) {
      console.error('Chyba pri vytváraní dokumentu vozidla:', error);
      throw error;
    }
  };

  const updateVehicleDocument = async (document: VehicleDocument): Promise<void> => {
    try {
      await apiService.updateVehicleDocument(document);
      dispatch({ type: 'UPDATE_VEHICLE_DOCUMENT', payload: document });
    } catch (error) {
      console.error('Chyba pri aktualizácii dokumentu vozidla:', error);
      throw error;
    }
  };

  const deleteVehicleDocument = async (id: string): Promise<void> => {
    try {
      await apiService.deleteVehicleDocument(id);
      dispatch({ type: 'DELETE_VEHICLE_DOCUMENT', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní dokumentu vozidla:', error);
      throw error;
    }
  };

  const createInsuranceClaim = async (claim: InsuranceClaim): Promise<void> => {
    try {
      await apiService.createInsuranceClaim(claim);
      dispatch({ type: 'ADD_INSURANCE_CLAIM', payload: claim });
    } catch (error) {
      console.error('Chyba pri vytváraní poistnej udalosti:', error);
      throw error;
    }
  };

  const updateInsuranceClaim = async (claim: InsuranceClaim): Promise<void> => {
    try {
      await apiService.updateInsuranceClaim(claim);
      dispatch({ type: 'UPDATE_INSURANCE_CLAIM', payload: claim });
    } catch (error) {
      console.error('Chyba pri aktualizácii poistnej udalosti:', error);
      throw error;
    }
  };

  const deleteInsuranceClaim = async (id: string): Promise<void> => {
    try {
      await apiService.deleteInsuranceClaim(id);
      dispatch({ type: 'DELETE_INSURANCE_CLAIM', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní poistnej udalosti:', error);
      throw error;
    }
  };



  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        getFilteredVehicles,
        getFilteredRentals,
        getFilteredExpenses,
        getFilteredInsurances,
        getFilteredSettlements,
        getFilteredCompanies,
        // 🚀 ENHANCED FILTER FUNCTIONS
        getEnhancedFilteredVehicles,
        getEnhancedFilteredRentals,
        getEnhancedFilteredExpenses,
        // 🎯 HELPER FUNCTIONS
        getFullyFilteredVehicles,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        createRental,
        updateRental,
        deleteRental,
        createExpense,
        updateExpense,
        deleteExpense,
        createInsurance,
        updateInsurance,
        deleteInsurance,
        createSettlement,
        deleteSettlement,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        createCompany,
        deleteCompany,
        createInsurer,
        deleteInsurer,
        createVehicleDocument,
        updateVehicleDocument,
        deleteVehicleDocument,
        createInsuranceClaim,
        updateInsuranceClaim,
        deleteInsuranceClaim,
        loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// 🚀 EXPORT ENHANCED FILTER TYPES for component usage
export type { FilterOptions };

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 