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
  // Rozšírené polia pre kompletnú funkcionalitu
  deposit?: number;
  allowedKilometers?: number;
  dailyKilometers?: number; // NEW: Denné km pre automatický prepočet
  extraKilometerRate?: number; // Cena za nadlimitný km
  returnConditions?: string;
  fuelLevel?: number; // Úroveň paliva pri prevzatí (%)
  odometer?: number; // Stav tachometra pri prevzatí
  returnFuelLevel?: number; // Úroveň paliva pri vrátení (%)
  returnOdometer?: number; // Stav tachometra pri vrátení
  actualKilometers?: number; // Skutočne najazdené km
  fuelRefillCost?: number; // Cena za dotankovanie
  damageCost?: number; // Cena za poškodenia
  additionalCosts?: number; // Ďalšie náklady
  finalPrice?: number; // Finálna cena po zúčtovaní
  notes?: string; // Poznámky k prenájmu
  // Dáta z emailu
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  pickupLocation?: string;
  returnLocation?: string;
  reservationTime?: string;
  vehicleCode?: string; // ŠPZ z emailu
  vehicleName?: string; // Názov vozidla z emailu
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

export type PaymentFrequency = 'monthly' | 'quarterly' | 'biannual' | 'yearly';

export type DocumentType = 'stk' | 'ek' | 'vignette';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  documentType: DocumentType;
  validFrom?: Date;
  validTo: Date;
  documentNumber?: string;
  price?: number;
  notes?: string;
}

export interface Insurance {
  id: string;
  vehicleId: string;
  type: string;
  policyNumber: string;
  validFrom: Date;
  validTo: Date;
  price: number;
  company: string;
  paymentFrequency: PaymentFrequency;
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

export interface VehicleUnavailability {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection';
  notes?: string;
  priority: 1 | 2 | 3; // 1=critical, 2=normal, 3=low
  recurring: boolean;
  recurringConfig?: {
    interval: 'days' | 'weeks' | 'months' | 'years';
    value: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
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
  firstName?: string; // Meno zamestnanca
  lastName?: string; // Priezvisko zamestnanca
  role: UserRole;
  companyId?: string; // For company users - restrict to specific company
  permissions: Permission[];
  signatureTemplate?: string; // Base64 signature template for employees
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
  type: 'vehicle' | 'damage' | 'document' | 'fuel' | 'odometer';
  description?: string;
  timestamp: Date;
  compressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
}

export interface ProtocolVideo {
  id: string;
  url: string;
  type: 'vehicle' | 'damage' | 'document' | 'fuel' | 'odometer';
  description?: string;
  timestamp: Date;
  compressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
  duration?: number;
}

export interface ProtocolDamage {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  images: ProtocolImage[];
  location: string;
  timestamp: Date;
  fromPreviousProtocol?: boolean;
}

export interface ProtocolSignature {
  id: string;
  signature: string; // base64 encoded signature
  signerName: string;
  signerRole: 'customer' | 'employee';
  timestamp: Date;
  location: string;
  ipAddress?: string;
}

export interface VehicleCondition {
  odometer: number;
  fuelLevel: number; // percentage 0-100
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  exteriorCondition: string;
  interiorCondition: string;
  notes?: string;
}

export interface HandoverProtocol {
  id: string;
  rentalId: string;
  rental: Rental;
  
  // Basic info
  type: 'handover';
  status: 'draft' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  location: string;
  
  // Vehicle condition
  vehicleCondition: VehicleCondition;
  
  // Media
  vehicleImages: ProtocolImage[];
  vehicleVideos: ProtocolVideo[];
  documentImages: ProtocolImage[];
  documentVideos: ProtocolVideo[];
  damageImages: ProtocolImage[];
  damageVideos: ProtocolVideo[];
  
  // Damages
  damages: ProtocolDamage[];
  
  // Signatures
  signatures: ProtocolSignature[];
  
  // Rental data snapshot
  rentalData: {
    orderNumber: string;
    vehicle: Vehicle;
    customer: Customer;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    deposit: number;
    currency: string;
    allowedKilometers?: number;
    extraKilometerRate?: number;
    insuranceDetails?: any;
    pickupLocation?: string;
    returnLocation?: string;
    returnConditions?: string;
  };
  
  // PDF and email
  pdfUrl?: string;
  emailSent?: boolean;
  emailSentAt?: Date;
  
  createdBy: string;
  notes?: string;
}

export interface ReturnProtocol {
  id: string;
  rentalId: string;
  rental: Rental;
  handoverProtocolId: string;
  handoverProtocol: HandoverProtocol;
  
  // Basic info
  type: 'return';
  status: 'draft' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  location: string;
  
  // Vehicle condition
  vehicleCondition: VehicleCondition;
  
  // Media
  vehicleImages: ProtocolImage[];
  vehicleVideos: ProtocolVideo[];
  documentImages: ProtocolImage[];
  documentVideos: ProtocolVideo[];
  damageImages: ProtocolImage[];
  damageVideos: ProtocolVideo[];
  
  // Damages
  damages: ProtocolDamage[];
  newDamages: ProtocolDamage[];
  
  // Signatures
  signatures: ProtocolSignature[];
  
  // Kilometer and fuel calculations
  kilometersUsed: number;
  kilometerOverage: number;
  kilometerFee: number;
  fuelUsed: number;
  fuelFee: number;
  totalExtraFees: number;
  
  // Refund calculation
  depositRefund: number;
  additionalCharges: number;
  finalRefund: number;
  
  // Rental data snapshot
  rentalData: {
    orderNumber: string;
    vehicle: Vehicle;
    customer: Customer;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    deposit: number;
    currency: string;
    allowedKilometers?: number;
    extraKilometerRate?: number;
    insuranceDetails?: any;
    pickupLocation?: string;
    returnLocation?: string;
    returnConditions?: string;
  };
  
  // PDF and email
  pdfUrl?: string;
  emailSent?: boolean;
  emailSentAt?: Date;
  
  createdBy: string;
  notes?: string;
} 