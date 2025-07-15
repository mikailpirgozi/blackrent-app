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

// Protokoly
export interface ProtocolImage {
  id: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  compressedUrl?: string;
  compressedSize?: number;
  category: 'vehicle' | 'documents' | 'damage';
  description?: string;
}

export interface ProtocolVideo {
  id: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  compressedUrl?: string;
  compressedSize?: number;
  thumbnailUrl?: string;
  duration?: number;
  description?: string;
}

export interface ProtocolDamage {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  location: string;
  images: string[]; // IDs of ProtocolImage
  isExisting?: boolean; // true ak už existovalo v handover protokole
}

export interface HandoverProtocol {
  id: string;
  rentalId: string;
  rental?: Rental;
  createdAt: Date;
  createdBy: string; // user ID
  customerSignature: string; // base64 encoded signature
  employeeSignature?: string; // base64 encoded signature
  signedAt: Date;
  signedLocation: string;
  
  // Stav vozidla pri odovzdávaní
  vehicleCondition: string;
  fuelLevel?: number; // 0-100%
  kmReading?: number;
  keysCounted?: number;
  
  // Prílohy
  images: ProtocolImage[];
  videos: ProtocolVideo[];
  damages: ProtocolDamage[];
  
  // Dokumenty
  documentsSigned?: boolean;
  
  // Metadáta
  notes?: string;
  handoverPlace: string;
  
  // PDF a email
  pdfGenerated: boolean;
  pdfUrl?: string;
  emailSent: boolean;
  emailSentAt?: Date;
}

export interface ReturnProtocol {
  id: string;
  rentalId: string;
  handoverProtocolId: string;
  rental?: Rental;
  handoverProtocol?: HandoverProtocol;
  createdAt: Date;
  createdBy: string; // user ID
  customerSignature: string; // base64 encoded signature
  signedAt: Date;
  signedLocation: string;
  
  // Stav vozidla pri vrátení
  vehicleCondition: string;
  fuelLevel: number; // 0-100%
  kmReading: number;
  kmOverage?: number; // počet km nad limit
  kmSurchargeAmount?: number; // suma doplatku za km
  
  // Prílohy
  images: ProtocolImage[];
  videos: ProtocolVideo[];
  damages: ProtocolDamage[];
  newDamages: ProtocolDamage[]; // nové poškodenia oproti handover
  
  // Metadáta
  notes?: string;
  returnPlace: string;
  
  // Financie
  additionalCharges?: {
    fuel?: number;
    damages?: number;
    cleaning?: number;
    other?: number;
  };
  depositRefunded?: boolean;
  depositRefundAmount?: number;
  
  // PDF a email
  pdfGenerated: boolean;
  pdfUrl?: string;
  emailSent: boolean;
  emailSentAt?: Date;
} 