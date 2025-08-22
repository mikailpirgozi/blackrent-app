import { Request } from 'express';
export type VehicleCategory = 'nizka-trieda' | 'stredna-trieda' | 'vyssia-stredna' | 'luxusne' | 'sportove' | 'suv' | 'viacmiestne' | 'dodavky';
export interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year?: number;
    licensePlate: string;
    vin?: string;
    company?: string;
    category?: VehicleCategory;
    pricing: PricingTier[];
    commission: Commission;
    status: VehicleStatus;
    ownerCompanyId?: string;
    assignedMechanicId?: string;
    stk?: Date;
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
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'temporarily_removed' | 'removed' | 'transferred';
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
    vehicleVin?: string;
    customerId?: string;
    customer?: Customer;
    customerName: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    commission: number;
    paymentMethod: PaymentMethod;
    createdAt: Date;
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
            oldValue: any;
            newValue: any;
        }[];
    }[];
    orderNumber?: string;
    deposit?: number;
    allowedKilometers?: number;
    dailyKilometers?: number;
    extraKilometerRate?: number;
    returnConditions?: string;
    fuelLevel?: number;
    odometer?: number;
    returnFuelLevel?: number;
    returnOdometer?: number;
    actualKilometers?: number;
    fuelRefillCost?: number;
    handoverProtocolId?: string;
    returnProtocolId?: string;
    customerEmail?: string;
    customerPhone?: string;
    pickupLocation?: string;
    returnLocation?: string;
    vehicleCode?: string;
    vehicleName?: string;
    isFlexible?: boolean;
    flexibleEndDate?: Date;
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
    category: string;
    note?: string;
}
export interface ExpenseCategory {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    icon: string;
    color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}
export type ExpenseCategoryName = 'service' | 'insurance' | 'fuel' | 'other';
export interface RecurringExpense {
    id: string;
    name: string;
    description: string;
    amount: number;
    category: string;
    company: string;
    vehicleId?: string;
    note?: string;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate?: Date;
    dayOfMonth: number;
    isActive: boolean;
    lastGeneratedDate?: Date;
    nextGenerationDate?: Date;
    totalGenerated: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}
export interface RecurringExpenseGeneration {
    id: string;
    recurringExpenseId: string;
    generatedExpenseId: string;
    generationDate: Date;
    generatedAt: Date;
    generatedBy: string;
}
export interface CompanyDocument {
    id: string;
    companyId: number;
    documentType: 'contract' | 'invoice';
    documentMonth?: number;
    documentYear?: number;
    documentName: string;
    description?: string;
    filePath: string;
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
    vehicleId?: string;
    rentalId?: number;
    insurerId?: number;
    type: string;
    policyNumber: string;
    validFrom: Date;
    validTo: Date;
    price: number;
    company?: string;
    paymentFrequency: PaymentFrequency;
    filePath?: string;
    filePaths?: string[];
    coverageAmount?: number;
    greenCardValidFrom?: Date;
    greenCardValidTo?: Date;
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
    priority: 1 | 2 | 3;
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
export type UserRole = 'admin' | 'employee' | 'temp_worker' | 'mechanic' | 'sales_rep' | 'company_owner';
export interface User {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    password: string;
    role: UserRole;
    companyId?: string;
    employeeNumber?: string;
    hireDate?: Date;
    isActive: boolean;
    lastLogin?: Date;
    permissions?: Permission[];
    signatureTemplate?: string;
    linkedInvestorId?: string;
    createdAt: Date;
    updatedAt?: Date;
}
export type UserWithoutPassword = Omit<User, 'password'>;
export interface Company {
    id: string;
    name: string;
    businessId?: string;
    taxId?: string;
    address?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    contractStartDate?: Date;
    contractEndDate?: Date;
    commissionRate: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
    personalIban?: string;
    businessIban?: string;
    ownerName?: string;
    contactEmail?: string;
    contactPhone?: string;
    defaultCommissionRate?: number;
    protocolDisplayName?: string;
}
export interface CompanyInvestor {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    personalId?: string;
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
    ownershipPercentage: number;
    investmentAmount?: number;
    investmentDate: Date;
    isPrimaryContact: boolean;
    profitSharePercentage?: number;
    createdAt: Date;
    investor?: CompanyInvestor;
    company?: Company;
}
export interface Permission {
    resource: 'vehicles' | 'rentals' | 'customers' | 'finances' | 'users' | 'companies' | 'maintenance' | 'protocols' | 'pricing' | 'expenses' | 'insurances' | '*';
    actions: ('read' | 'create' | 'update' | 'delete')[];
    conditions?: {
        ownOnly?: boolean;
        companyOnly?: boolean;
        maxAmount?: number;
        approvalRequired?: boolean;
        readOnlyFields?: string[];
    };
}
export interface PermissionCheck {
    userId: string;
    userRole: UserRole;
    companyId?: string;
    resource: string;
    action: string;
    targetCompanyId?: string;
    amount?: number;
}
export interface PermissionResult {
    hasAccess: boolean;
    requiresApproval: boolean;
    reason?: string;
}
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
    approve?: boolean;
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
    quickMode?: boolean;
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
//# sourceMappingURL=index.d.ts.map