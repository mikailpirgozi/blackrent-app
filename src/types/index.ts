export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  company: string;
  pricing: PricingTier[];
  commission: Commission;
  status: VehicleStatus;
}

export interface PricingTier {
  id: string;
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

export interface Commission {
  type: 'percentage' | 'fixed';
  value: number; // percentage (0-100) or fixed amount in EUR
}

export type VehicleStatus =
  | 'available'
  | 'rented'
  | 'maintenance'
  | 'temporarily_removed'
  | 'removed'
  | 'transferred';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
}

export interface RentalPayment {
  id: string;
  date: Date;
  amount: number;
  isPaid: boolean;
  note?: string;
  paymentMethod?: PaymentMethod;
  invoiceNumber?: string;
}

export interface Rental {
  id: string;
  vehicleId?: string;
  vehicle?: Vehicle;
  customerId?: string;
  customer?: Customer;
  customerName: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  commission: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  customCommission?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  extraKmCharge?: number;
  paid?: boolean;
  status?: 'pending' | 'active' | 'finished';
  handoverPlace?: string;
  confirmed?: boolean;
  payments?: RentalPayment[];
  history?: {
    date: Date | string;
    user: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
  }[];
  orderNumber?: string;
  // Protokoly
  handoverProtocolId?: string;
  returnProtocolId?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'vrp' | 'direct_to_owner';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  vehicleId?: string;
  company: string;
  category: ExpenseCategory;
  note?: string;
}

export type ExpenseCategory = 'service' | 'insurance' | 'fuel' | 'other';

export interface Insurance {
  id: string;
  vehicleId: string;
  type: string;
  validFrom: Date;
  validTo: Date;
  price: number;
  company: string;
}

export interface Settlement {
  id: string;
  period: {
    from: Date;
    to: Date;
  };
  rentals: Rental[];
  expenses: Expense[];
  totalIncome: number;
  totalExpenses: number;
  totalCommission: number;
  profit: number;
  company?: string;
  vehicleId?: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt?: Date;
}

export interface Insurer {
  id: string;
  name: string;
  createdAt?: Date;
}

// Auth types
export type UserRole = 'admin' | 'employee' | 'company';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  companyId?: string; // For company users - restrict to specific company
  permissions: Permission[];
  createdAt: Date;
}

export interface Permission {
  resource: string; // 'vehicles', 'rentals', 'customers', 'expenses', 'settlements', 'insurances', 'statistics'
  actions: string[]; // 'read', 'create', 'update', 'delete'
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 