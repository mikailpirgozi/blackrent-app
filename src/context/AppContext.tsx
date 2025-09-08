import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer } from 'react';

// 🔄 PHASE 2: Server state imports removed - moved to React Query
import type { VehicleCategory, VehicleStatus } from '../types';

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
  showRemoved?: boolean; // 🗑️ Vyradené vozidlá
  showTempRemoved?: boolean; // ⏸️ Dočasne vyradené vozidlá

  // Meta options
  includeAll?: boolean; // For admin override
  includeRemoved?: boolean; // Pre zahrnutie vyradených vozidiel (pre historické prenájmy)
  includePrivate?: boolean; // Pre zahrnutie súkromných vozidiel v administrácii
}

// 🔄 PHASE 2: UI STATE ONLY - server state moved to React Query
interface AppState {
  // UI STATE ONLY
  selectedVehicleIds: string[];
  openModals: Record<string, boolean>;
  filterState: {
    search: string;
    category: string;
    company: string;
    status: string;
  };
  tableLayout: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    pageSize: number;
  };

  // REMOVE ALL SERVER STATE - moved to React Query
  // vehicles: Vehicle[]; ❌
  // rentals: Rental[]; ❌
  // expenses: Expense[]; ❌
  // insurances: Insurance[]; ❌
  // settlements: Settlement[]; ❌
  // companies: Company[]; ❌
  // insurers: Insurer[]; ❌
  // customers: Customer[]; ❌
  // vehicleDocuments: VehicleDocument[]; ❌
  // insuranceClaims: InsuranceClaim[]; ❌
  // protocols: Array<...>; ❌
  // loading: boolean; ❌
  // error: string | null; ❌
  // dataLoaded: {...}; ❌
  // lastLoadTime: number | null; ❌
}

// 🔄 PHASE 2: UI ACTIONS ONLY - server actions moved to React Query
type AppAction =
  | { type: 'SET_SELECTED_VEHICLE_IDS'; payload: string[] }
  | { type: 'TOGGLE_MODAL'; payload: { modalId: string; isOpen: boolean } }
  | { type: 'SET_FILTER_STATE'; payload: Partial<AppState['filterState']> }
  | { type: 'SET_TABLE_LAYOUT'; payload: Partial<AppState['tableLayout']> }
  | { type: 'CLEAR_UI_STATE' };

// REMOVE ALL SERVER ACTIONS - moved to React Query
// | { type: 'SET_LOADING'; payload: boolean } ❌
// | { type: 'SET_ERROR'; payload: string | null } ❌
// | { type: 'SET_VEHICLES'; payload: Vehicle[] } ❌
// | { type: 'SET_RENTALS'; payload: Rental[] } ❌
// | { type: 'SET_EXPENSES'; payload: Expense[] } ❌
// | { type: 'SET_INSURANCES'; payload: Insurance[] } ❌
// | { type: 'SET_CUSTOMERS'; payload: Customer[] } ❌
// | { type: 'SET_COMPANIES'; payload: Company[] } ❌
// | { type: 'SET_INSURERS'; payload: Insurer[] } ❌
// | { type: 'SET_SETTLEMENTS'; payload: Settlement[] } ❌
// | { type: 'SET_VEHICLE_DOCUMENTS'; payload: VehicleDocument[] } ❌
// | { type: 'SET_PROTOCOLS'; payload: Array<...> } ❌
// | { type: 'ADD_VEHICLE'; payload: Vehicle } ❌
// | { type: 'UPDATE_VEHICLE'; payload: Vehicle } ❌
// | { type: 'DELETE_VEHICLE'; payload: string } ❌
// | { type: 'CLEAR_VEHICLES' } ❌
// | { type: 'ADD_RENTAL'; payload: Rental } ❌
// | { type: 'UPDATE_RENTAL'; payload: Rental } ❌
// | { type: 'DELETE_RENTAL'; payload: string } ❌
// | { type: 'ADD_EXPENSE'; payload: Expense } ❌
// | { type: 'UPDATE_EXPENSE'; payload: Expense } ❌
// | { type: 'DELETE_EXPENSE'; payload: string } ❌
// | { type: 'ADD_INSURANCE'; payload: Insurance } ❌
// | { type: 'UPDATE_INSURANCE'; payload: Insurance } ❌
// | { type: 'DELETE_INSURANCE'; payload: string } ❌
// | { type: 'ADD_SETTLEMENT'; payload: Settlement } ❌
// | { type: 'DELETE_SETTLEMENT'; payload: string } ❌
// | { type: 'ADD_COMPANY'; payload: Company } ❌
// | { type: 'DELETE_COMPANY'; payload: string } ❌
// | { type: 'ADD_INSURER'; payload: Insurer } ❌
// | { type: 'DELETE_INSURER'; payload: string } ❌
// | { type: 'ADD_CUSTOMER'; payload: Customer } ❌
// | { type: 'UPDATE_CUSTOMER'; payload: Customer } ❌
// | { type: 'DELETE_CUSTOMER'; payload: string } ❌
// | { type: 'ADD_VEHICLE_DOCUMENT'; payload: VehicleDocument } ❌
// | { type: 'UPDATE_VEHICLE_DOCUMENT'; payload: VehicleDocument } ❌
// | { type: 'DELETE_VEHICLE_DOCUMENT'; payload: string } ❌
// | { type: 'SET_INSURANCE_CLAIMS'; payload: InsuranceClaim[] } ❌
// | { type: 'ADD_INSURANCE_CLAIM'; payload: InsuranceClaim } ❌
// | { type: 'UPDATE_INSURANCE_CLAIM'; payload: InsuranceClaim } ❌
// | { type: 'DELETE_INSURANCE_CLAIM'; payload: string } ❌
// | { type: 'CLEAR_ALL_DATA' } ❌
// | { type: 'LOAD_DATA'; payload: AppState } ❌
// | { type: 'SET_DATA_LOADED'; payload: { type: keyof AppState['dataLoaded']; loaded: boolean } } ❌
// | { type: 'SET_LAST_LOAD_TIME'; payload: number } ❌
// | { type: 'REFRESH_BULK_DATA' } ❌

// 🔄 PHASE 2: UI STATE ONLY - server state moved to React Query
const initialState: AppState = {
  // UI STATE ONLY
  selectedVehicleIds: [],
  openModals: {},
  filterState: {
    search: '',
    category: 'all',
    company: 'all',
    status: 'all',
  },
  tableLayout: {
    sortBy: 'brand',
    sortOrder: 'asc',
    pageSize: 25,
  },
};

// 🔄 PHASE 2: UI REDUCER ONLY - server actions moved to React Query
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SELECTED_VEHICLE_IDS':
      return { ...state, selectedVehicleIds: action.payload };
    case 'TOGGLE_MODAL':
      return {
        ...state,
        openModals: {
          ...state.openModals,
          [action.payload.modalId]: action.payload.isOpen,
        },
      };
    case 'SET_FILTER_STATE':
      return {
        ...state,
        filterState: { ...state.filterState, ...action.payload },
      };
    case 'SET_TABLE_LAYOUT':
      return {
        ...state,
        tableLayout: { ...state.tableLayout, ...action.payload },
      };
    case 'CLEAR_UI_STATE':
      return initialState;
    default:
      return state;
  }
}

// 🔄 PHASE 2: UI CONTEXT ONLY - server methods moved to React Query
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // UI HELPER METHODS
  setSelectedVehicleIds: (ids: string[]) => void;
  toggleModal: (modalId: string, isOpen: boolean) => void;
  setFilterState: (filters: Partial<AppState['filterState']>) => void;
  setTableLayout: (layout: Partial<AppState['tableLayout']>) => void;
  clearUIState: () => void;

  // REMOVE ALL SERVER METHODS - moved to React Query
  // getFilteredVehicles: () => Vehicle[]; ❌
  // getFilteredRentals: () => Rental[]; ❌
  // getFilteredExpenses: () => Expense[]; ❌
  // getFilteredInsurances: () => Insurance[]; ❌
  // getFilteredSettlements: () => Settlement[]; ❌
  // getFilteredCompanies: () => Company[]; ❌
  // getEnhancedFilteredVehicles: (options?: FilterOptions) => Vehicle[]; ❌
  // getEnhancedFilteredRentals: (options?: FilterOptions) => Rental[]; ❌
  // getEnhancedFilteredExpenses: (options?: FilterOptions) => Expense[]; ❌
  // getFullyFilteredVehicles: (uiFilters: Omit<FilterOptions, 'permissions'>) => Vehicle[]; ❌
  // createVehicle: (vehicle: Vehicle) => Promise<void>; ❌
  // updateVehicle: (vehicle: Vehicle) => Promise<void>; ❌
  // deleteVehicle: (id: string) => Promise<void>; ❌
  // createRental: (rental: Rental) => Promise<void>; ❌
  // updateRental: (rental: Rental) => Promise<void>; ❌
  // deleteRental: (id: string) => Promise<void>; ❌
  // createExpense: (expense: Expense) => Promise<void>; ❌
  // updateExpense: (expense: Expense) => Promise<void>; ❌
  // deleteExpense: (id: string) => Promise<void>; ❌
  // createInsurance: (insurance: Insurance) => Promise<void>; ❌
  // updateInsurance: (insurance: Insurance) => Promise<void>; ❌
  // deleteInsurance: (id: string) => Promise<void>; ❌
  // refreshBulkData: () => void; ❌
  // createSettlement: (settlement: Settlement) => Promise<void>; ❌
  // deleteSettlement: (id: string) => Promise<void>; ❌
  // createCustomer: (customer: Customer) => Promise<void>; ❌
  // updateCustomer: (customer: Customer) => Promise<void>; ❌
  // deleteCustomer: (id: string) => Promise<void>; ❌
  // createCompany: (company: Company) => Promise<void>; ❌
  // deleteCompany: (id: string) => Promise<void>; ❌
  // createInsurer: (insurer: Insurer) => Promise<void>; ❌
  // deleteInsurer: (id: string) => Promise<void>; ❌
  // createVehicleDocument: (document: VehicleDocument) => Promise<void>; ❌
  // updateVehicleDocument: (document: VehicleDocument) => Promise<void>; ❌
  // deleteVehicleDocument: (id: string) => Promise<void>; ❌
  // createInsuranceClaim: (claim: InsuranceClaim) => Promise<void>; ❌
  // updateInsuranceClaim: (claim: InsuranceClaim) => Promise<void>; ❌
  // deleteInsuranceClaim: (id: string) => Promise<void>; ❌
  // loadData: () => Promise<void>; ❌
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// 🔄 PHASE 2: UI PROVIDER ONLY - server state moved to React Query
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // UI HELPER METHODS
  const setSelectedVehicleIds = (ids: string[]) => {
    dispatch({ type: 'SET_SELECTED_VEHICLE_IDS', payload: ids });
  };

  const toggleModal = (modalId: string, isOpen: boolean) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: { modalId, isOpen } });
  };

  const setFilterState = (filters: Partial<AppState['filterState']>) => {
    dispatch({ type: 'SET_FILTER_STATE', payload: filters });
  };

  const setTableLayout = (layout: Partial<AppState['tableLayout']>) => {
    dispatch({ type: 'SET_TABLE_LAYOUT', payload: layout });
  };

  const clearUIState = () => {
    dispatch({ type: 'CLEAR_UI_STATE' });
  };

  // REMOVE ALL SERVER STATE IMPLEMENTATIONS - moved to React Query

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setSelectedVehicleIds,
        toggleModal,
        setFilterState,
        setTableLayout,
        clearUIState,
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
