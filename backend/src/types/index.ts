export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  licensePlate: string;
  company: string;
  pricing: PricingTier[];
  commission: Commission;
  status: VehicleStatus;
  ownerCompanyId?: string; // 🏢 ID vlastníckej firmy
  assignedMechanicId?: string; // 🔨 ID priradeného mechanika
  createdAt?: Date;
}

export interface PricingTier {
  id: string;
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

export interface Commission {
  type: 'percentage' | 'fixed';
  value: number;
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
  // Rozšírené polia pre kompletný rental systém
  deposit?: number;
  allowedKilometers?: number;
  dailyKilometers?: number; // NEW: Denné km pre automatický prepočet
  extraKilometerRate?: number;
  returnConditions?: string;
  fuelLevel?: number;
  odometer?: number;
  returnFuelLevel?: number;
  returnOdometer?: number;
  actualKilometers?: number;
  fuelRefillCost?: number;
  // Protokoly
  handoverProtocolId?: string;
  returnProtocolId?: string;
  // Dáta z emailu a lokácie
  pickupLocation?: string;
  returnLocation?: string;
  vehicleCode?: string;
  vehicleName?: string;
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
  filePath?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InsuranceClaim {
  id: string;
  vehicleId: string;
  insuranceId?: string;
  incidentDate: Date;
  reportedDate: Date;
  claimNumber?: string;
  description: string;
  location?: string;
  incidentType: 'accident' | 'theft' | 'vandalism' | 'weather' | 'other';
  estimatedDamage?: number;
  deductible?: number;
  payoutAmount?: number;
  status: 'reported' | 'investigating' | 'approved' | 'rejected' | 'closed';
  filePaths?: string[];
  policeReportNumber?: string;
  otherPartyInfo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
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
  filePath?: string;
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



export interface Insurer {
  id: string;
  name: string;
  createdAt?: Date;
}

// Auth types
export type UserRole = 'admin' | 'employee' | 'temp_worker' | 'mechanic' | 'sales_rep' | 'company_owner';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string; // Meno zamestnanca
  lastName?: string; // Priezvisko zamestnanca
  password: string;
  role: UserRole;
  companyId?: string; // Prepojenie na firmu
  employeeNumber?: string; // Zamestnanecké číslo
  hireDate?: Date; // Dátum nástupu
  isActive: boolean; // Aktívny používateľ
  lastLogin?: Date; // Posledné prihlásenie
  permissions?: Permission[]; // Custom permissions
  signatureTemplate?: string; // Base64 signature template for employees
  createdAt: Date;
  updatedAt?: Date;
}

export type UserWithoutPassword = Omit<User, 'password'>;

// Company interface
export interface Company {
  id: string;
  name: string;
  businessId?: string; // IČO
  taxId?: string; // DIČ
  address?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  commissionRate: number; // % provízia
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Permission system interfaces
export interface Permission {
  resource: 'vehicles' | 'rentals' | 'customers' | 'finances' | 'users' | 'companies' | 'maintenance' | 'protocols' | 'pricing' | '*';
  actions: ('read' | 'create' | 'update' | 'delete')[];
  conditions?: {
    ownOnly?: boolean;        // len vlastné záznamy
    companyOnly?: boolean;    // len firma vlastníka
    maxAmount?: number;       // finančný limit
    approvalRequired?: boolean; // vyžaduje schválenie
    readOnlyFields?: string[]; // read-only polia
  };
}

export interface PermissionCheck {
  userId: string;
  userRole: UserRole;
  companyId?: string;
  resource: string;
  action: string;
  targetCompanyId?: string; // pre company-scoped resources
  amount?: number; // pre finančné operácie
}

export interface PermissionResult {
  hasAccess: boolean;
  requiresApproval: boolean;
  reason?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  message?: string;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Express request with user
import { Request } from 'express';
export interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  user?: T;
}

export interface VehicleCondition {
  odometer: number;
  fuelLevel: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  exteriorCondition: string;
  interiorCondition: string;
  notes?: string;
}

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
  signature: string;
  signerName: string;
  signerRole: 'customer' | 'employee';
  timestamp: Date;
  location: string;
  ipAddress?: string;
}

export interface HandoverProtocol {
  id: string;
  rentalId: string;
  type: 'handover';
  status: 'draft' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  location: string;
  vehicleCondition: VehicleCondition;
  vehicleImages: ProtocolImage[];
  vehicleVideos: ProtocolVideo[];
  documentImages: ProtocolImage[];
  documentVideos: ProtocolVideo[];
  damageImages: ProtocolImage[];
  damageVideos: ProtocolVideo[];
  damages: ProtocolDamage[];
  signatures: ProtocolSignature[];
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
  };
  pdfUrl?: string;
  emailSent?: boolean;
  emailSentAt?: Date;
  createdBy: string;
  notes?: string;
}

export interface ReturnProtocol {
  id: string;
  rentalId: string;
  handoverProtocolId: string;
  type: 'return';
  status: 'draft' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  location: string;
  vehicleCondition: VehicleCondition;
  vehicleImages: ProtocolImage[];
  vehicleVideos: ProtocolVideo[];
  documentImages: ProtocolImage[];
  documentVideos: ProtocolVideo[];
  damageImages: ProtocolImage[];
  damageVideos: ProtocolVideo[];
  damages: ProtocolDamage[];
  newDamages: ProtocolDamage[];
  signatures: ProtocolSignature[];
  kilometersUsed: number;
  kilometerOverage: number;
  kilometerFee: number;
  fuelUsed: number;
  fuelFee: number;
  totalExtraFees: number;
  depositRefund: number;
  additionalCharges: number;
  finalRefund: number;
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
  };
  pdfUrl?: string;
  emailSent?: boolean;
  emailSentAt?: Date;
  createdBy: string;
  notes?: string;
} 