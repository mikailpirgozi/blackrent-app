import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Vehicle, Rental, Expense, Insurance, Settlement, Customer, Company, Insurer } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface AppState {
  vehicles: Vehicle[];
  rentals: Rental[];
  expenses: Expense[];
  insurances: Insurance[];
  settlements: Settlement[];
  companies: Company[];
  insurers: Insurer[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
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
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'LOAD_DATA'; payload: AppState };

const initialState: AppState = {
  vehicles: [],
  rentals: [],
  expenses: [],
  insurances: [],
  settlements: [],
  companies: [],
  insurers: [],
  customers: [],
  loading: false,
  error: null,
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
    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        loading: state.loading,
        error: state.error
      };
    case 'LOAD_DATA':
      return action.payload;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Filtered data based on user permissions
  getFilteredVehicles: () => Vehicle[];
  getFilteredRentals: () => Rental[];
  getFilteredExpenses: () => Expense[];
  getFilteredInsurances: () => Insurance[];
  getFilteredSettlements: () => Settlement[];
  getFilteredCompanies: () => Company[];
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
  createSettlement: (settlement: Settlement) => Promise<void>;
  createCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  createCompany: (company: Company) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  createInsurer: (insurer: Insurer) => Promise<void>;
  deleteInsurer: (id: string) => Promise<void>;
  loadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { state: authState } = useAuth();

  const getFilteredVehicles = (): Vehicle[] => {
    return state.vehicles || [];
  };

  const getFilteredRentals = (): Rental[] => {
    return state.rentals || [];
  };

  const getFilteredExpenses = (): Expense[] => {
    return state.expenses || [];
  };

  const getFilteredInsurances = (): Insurance[] => {
    return state.insurances || [];
  };

  const getFilteredSettlements = (): Settlement[] => {
    return state.settlements || [];
  };

  const getFilteredCompanies = (): Company[] => {
    return state.companies || [];
  };

  // Funkcia na načítanie dát z API
  const loadData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log('Načítavam dáta z API...');
      
      // Load data from API
      const [vehicles, rentals, expenses, insurances, customers, companies, insurers, settlements] = await Promise.all([
        apiService.getVehicles(),
        apiService.getRentals(),
        apiService.getExpenses(),
        apiService.getInsurances(),
        apiService.getCustomers(),
        apiService.getCompanies(),
        apiService.getInsurers(),
        apiService.getSettlements() // FIXED: Robust implementation with graceful error handling
      ]);
      
      console.log('Dáta úspešne načítané:', { 
        vehicles: vehicles.length, 
        rentals: rentals.length, 
        expenses: expenses.length,
        insurances: insurances.length,
        customers: customers.length,
        companies: companies.length,
        insurers: insurers.length,
        settlements: settlements.length // permanently fixed!
      });
      
      dispatch({ type: 'SET_VEHICLES', payload: vehicles });
      dispatch({ type: 'SET_RENTALS', payload: rentals });
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
      dispatch({ type: 'SET_INSURANCES', payload: insurances });
      dispatch({ type: 'SET_CUSTOMERS', payload: customers });
      dispatch({ type: 'SET_COMPANIES', payload: companies });
      dispatch({ type: 'SET_INSURERS', payload: insurers });
      dispatch({ type: 'SET_SETTLEMENTS', payload: settlements });
      
    } catch (error: any) {
      console.error('Chyba pri načítavaní dát:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Chyba pri načítavaní dát' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Načítaj dáta len keď je používateľ prihlásený a nie je loading
  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading && authState.token) {
      console.log('Používateľ je prihlásený, načítavam dáta...');
      loadData();
    } else if (!authState.isAuthenticated && !authState.isLoading) {
      // Vymaž dáta ak sa používateľ odhlásil
      console.log('Používateľ nie je prihlásený, mažem dáta...');
      dispatch({ type: 'CLEAR_ALL_DATA' });
    }
  }, [authState.isAuthenticated, authState.isLoading, authState.token]);

  // API helper methods
  const createVehicle = async (vehicle: Vehicle): Promise<void> => {
    try {
      await apiService.createVehicle(vehicle);
      dispatch({ type: 'ADD_VEHICLE', payload: vehicle });
    } catch (error) {
      console.error('Chyba pri vytváraní vozidla:', error);
      throw error;
    }
  };

  const updateVehicle = async (vehicle: Vehicle): Promise<void> => {
    try {
      await apiService.updateVehicle(vehicle);
      dispatch({ type: 'UPDATE_VEHICLE', payload: vehicle });
    } catch (error) {
      console.error('Chyba pri aktualizácii vozidla:', error);
      throw error;
    }
  };

  const deleteVehicle = async (id: string): Promise<void> => {
    try {
      await apiService.deleteVehicle(id);
      dispatch({ type: 'DELETE_VEHICLE', payload: id });
    } catch (error) {
      console.error('Chyba pri mazaní vozidla:', error);
      throw error;
    }
  };

  const createRental = async (rental: Rental): Promise<void> => {
    try {
      await apiService.createRental(rental);
      dispatch({ type: 'ADD_RENTAL', payload: rental });
    } catch (error) {
      console.error('Chyba pri vytváraní prenájmu:', error);
      throw error;
    }
  };

  const updateRental = async (rental: Rental): Promise<void> => {
    try {
      await apiService.updateRental(rental);
      dispatch({ type: 'UPDATE_RENTAL', payload: rental });
    } catch (error) {
      console.error('Chyba pri aktualizácii prenájmu:', error);
      throw error;
    }
  };

  const deleteRental = async (id: string): Promise<void> => {
    try {
      console.log(`🗑️ AppContext: Mazanie prenájmu ID: ${id}`);
      await apiService.deleteRental(id);
      console.log(`✅ AppContext: Prenájom ${id} úspešne vymazaný z API`);
      dispatch({ type: 'DELETE_RENTAL', payload: id });
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

  const createSettlement = async (settlement: Settlement): Promise<void> => {
    try {
      await apiService.createSettlement(settlement);
      dispatch({ type: 'ADD_SETTLEMENT', payload: settlement });
    } catch (error) {
      console.error('Chyba pri vytváraní vyúčtovania:', error);
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
        createSettlement,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        createCompany,
        deleteCompany,
        createInsurer,
        deleteInsurer,
        loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 