import type { Request } from 'express';

// 🚗 VEHICLE CATEGORIES: Typy kategórií vozidiel pre lepšie filtrovanie
export type VehicleCategory = 
  | 'nizka-trieda'      // 🚗 Nízka trieda (Škoda Fabia, Hyundai i20, Dacia Logan)
  | 'stredna-trieda'    // 🚙 Stredná trieda (VW Golf, Opel Astra, Ford Focus)
  | 'vyssia-stredna'    // 🚘 Vyššia stredná (BMW 3, Audi A4, Mercedes C)
  | 'luxusne'           // 💎 Luxusné (BMW 7, Mercedes S, Audi A8)
  | 'sportove'          // 🏎️ Športové (BMW M, AMG, Audi RS)
  | 'suv'               // 🚜 SUV (BMW X5, Audi Q7, Mercedes GLE)
  | 'viacmiestne'       // 👨‍👩‍👧‍👦 Viacmiestne (VW Sharan, Ford Galaxy, 7+ sedadiel)  
  | 'dodavky';          // 📦 Dodávky (Sprinter, Transit, Crafter)

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  licensePlate: string;
  vin?: string; // 🆔 VIN číslo vozidla (17-miestny identifikačný kód)
  company?: string;  // 🛡️ BULLETPROOF: Optional pre zabránenie fallback
  category?: VehicleCategory; // 🚗 Kategória vozidla pre filtrovanie (OPTIONAL počas migrácie)
  pricing: PricingTier[];
  commission: Commission;
  status: VehicleStatus;
  ownerCompanyId?: string; // 🏢 ID vlastníckej firmy
  assignedMechanicId?: string; // 🔨 ID priradeného mechanika
  stk?: Date; // 📋 STK platnosť do
  createdAt?: Date;
  // 🚗 NOVÉ: Extra kilometer rate pre každé vozidlo
  extraKilometerRate?: number; // Cena za každý km nad povolený limit
}

export interface PricingTier {
  id: string;
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

// 🚗 ROZŠÍRENIE: Pricing configuration s extra km rate
export interface VehiclePricing {
  tiers: PricingTier[];
  extraKilometerRate: number; // Cena za každý km nad povolený limit
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
  | 'transferred'
  | 'private';

export interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
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
  vehicleVin?: string; // 🆔 VIN číslo vozidla (z JOIN s vehicles)
  vehicleName?: string; // 🚗 NOVÉ: Vehicle name field (brand + model)
  customerId?: string;
  customer?: Customer;
  customerName: string;
  startDate: Date | string; // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
  endDate: Date | string; // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
  totalPrice: number;
  commission: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  // 🏢 CRITICAL FIX: Historická firma z času vytvorenia prenájmu (NIKDY sa nemení!)
  company: string;
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
      oldValue: unknown;
      newValue: unknown;
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
  customerEmail?: string; // 📧 Email zákazníka pre protokoly
  customerPhone?: string; // 📞 Telefón zákazníka pre protokoly
  pickupLocation?: string;
  returnLocation?: string;
  vehicleCode?: string;
  // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
  isFlexible?: boolean;  // Hlavný indikátor flexibilného prenájmu
  flexibleEndDate?: Date; // Orientačný koniec pre flexible prenájmy
  // 📧 NOVÉ: Automatické spracovanie emailov
  sourceType?: 'manual' | 'email_auto' | 'api_auto';
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'spam';
  emailContent?: string;
  autoProcessedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'vrp' | 'direct_to_owner';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  vehicleId?: string;
  company: string;
  category: string; // názov kategórie (FK na expense_categories.name)
  note?: string;
}

// Rozšírený typ pre dynamické kategórie nákladov
export interface ExpenseCategory {
  id: string;
  name: string; // jedinečný identifikátor (používa sa ako FK)
  displayName: string; // zobrazovaný názov
  description?: string;
  icon: string; // Material UI icon name
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  isDefault: boolean; // základné kategórie nemožno zmazať
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Zachováme pôvodný typ pre backward compatibility
export type ExpenseCategoryName = 'service' | 'insurance' | 'fuel' | 'other';

// Pravidelné náklady
export interface RecurringExpense {
  id: string;
  name: string; // názov pravidelného nákladu
  description: string; // popis pre generované náklady
  amount: number; // mesačná suma
  category: string; // kategória (FK na expense_categories.name)
  company: string; // firma
  vehicleId?: string; // voliteľné priradenie k vozidlu
  note?: string; // voliteľná poznámka
  
  // Nastavenia pravidelnosi
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date; // od kedy začať generovanie
  endDate?: Date; // voliteľný koniec
  dayOfMonth: number; // ktorý deň v mesiaci (1-28)
  
  // Status a kontrola
  isActive: boolean;
  lastGeneratedDate?: Date; // kedy sa naposledy vygeneroval
  nextGenerationDate?: Date; // kedy sa má vygenerovať ďalší
  totalGenerated: number; // počet vygenerovaných nákladov
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Log vygenerovaných nákladov
export interface RecurringExpenseGeneration {
  id: string;
  recurringExpenseId: string;
  generatedExpenseId: string;
  generationDate: Date; // pre ktorý mesiac
  generatedAt: Date;
  generatedBy: string; // 'system' alebo user ID
}

// Company documents (zmluvy, faktúry)
export interface CompanyDocument {
  id: string;
  companyId: number;
  documentType: 'contract' | 'invoice';
  documentMonth?: number; // 1-12 pre faktúry
  documentYear?: number; // rok pre faktúry
  documentName: string;
  description?: string;
  filePath: string; // R2 storage path
  fileSize?: number;
  fileType?: string;
  originalFilename?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export type PaymentFrequency = 'monthly' | 'quarterly' | 'biannual' | 'yearly';

export type DocumentType = 'stk' | 'ek' | 'vignette' | 'technical_certificate';

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
  vehicleId?: string; // Voliteľné pre spätnu kompatibilitu
  rentalId?: number;
  insurerId?: number;
  type: string;
  policyNumber: string;
  validFrom: Date;
  validTo: Date;
  price: number;
  company?: string;
  paymentFrequency: PaymentFrequency;
  filePath?: string; // Zachováme pre backward compatibility
  filePaths?: string[]; // Nové pole pre viacero súborov
  coverageAmount?: number;
  // 🟢 BIELA KARTA: Platnosť zelenej karty (manuálne zadávané)
  greenCardValidFrom?: Date;
  greenCardValidTo?: Date;
  // 🚗 KASKO: Stav kilometrov pri poistení (pre Kasko poistenie)
  kmState?: number;
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
  startDate: Date | string; // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
  endDate: Date | string; // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
  reason: string;
  type: 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection' | 'rented' | 'private_rental';
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
export type UserRole = 'admin' | 'user' | 'employee' | 'temp_worker' | 'mechanic' | 'sales_rep' | 'company_owner';

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
  linkedInvestorId?: string; // Prepojenie na investora pre automatické prístupy
  createdAt: Date;
  updatedAt?: Date;
}

export type UserWithoutPassword = Omit<User, 'password'>;

// Company interface
export interface Company {
  id: string;
  name: string;
  businessId?: string; // IČO (IC)
  taxId?: string; // DIČ (DIC)
  address?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  commissionRate: number; // % provízia (legacy field)
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  // 🆕 ROZŠÍRENÉ POLIA PRE MAJITEĽOV
  personalIban?: string; // Súkromný IBAN
  businessIban?: string; // Firemný IBAN  
  ownerName?: string; // Meno a priezvisko majiteľa
  contactEmail?: string; // Kontaktný email
  contactPhone?: string; // Kontaktný telefón
  defaultCommissionRate?: number; // Default provízia pre nové vozidlá
  protocolDisplayName?: string; // Fakturačná firma pre protokoly
}

// 🤝 SPOLUINVESTORSKÝ SYSTÉM
export interface CompanyInvestor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  personalId?: string; // Rodné číslo/ID
  address?: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CompanyInvestorShare {
  id: string;
  companyId: string;
  investorId: string;
  ownershipPercentage: number; // % podiel (0-100)
  investmentAmount?: number; // Suma investície
  investmentDate: Date;
  isPrimaryContact: boolean;
  profitSharePercentage?: number; // % z príjmov (môže byť iný ako ownership)
  createdAt: Date;
  // Rozšírené info pre UI
  investor?: CompanyInvestor;
  company?: Company;
}

// Permission system interfaces
export interface Permission {
  resource: 'vehicles' | 'rentals' | 'customers' | 'finances' | 'users' | 'companies' | 'maintenance' | 'protocols' | 'pricing' | 'expenses' | 'insurances' | 'settlements' | 'statistics' | '*';
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

// Nový systém práv pre firmy
export interface UserPermission {
  id: string;
  userId: string;
  companyId: string;
  permissions: CompanyPermissions;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CompanyPermissions {
  vehicles: ResourcePermission;
  rentals: ResourcePermission;
  expenses: ResourcePermission;
  settlements: ResourcePermission;
  customers: ResourcePermission;
  insurances: ResourcePermission;
  maintenance: ResourcePermission;
  protocols: ResourcePermission;
  statistics: ResourcePermission;
}

export interface ResourcePermission {
  read: boolean;
  write: boolean;
  delete: boolean;
  approve?: boolean; // pre schvaľovanie
}

export interface UserCompanyAccess {
  companyId: string;
  companyName: string;
  permissions: CompanyPermissions;
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
export interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  _meta?: Record<string, unknown>;
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
    insuranceDetails?: Record<string, unknown>;
  };
  pdfUrl?: string;
  emailSent?: boolean;
  emailSentAt?: Date;
  createdBy: string;
  notes?: string;
  quickMode?: boolean; // 🚀 QUICK MODE support
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
    insuranceDetails?: Record<string, unknown>;
  };
  pdfUrl?: string;
  emailSent?: boolean;
  emailSentAt?: Date;
  createdBy: string;
  notes?: string;
}

