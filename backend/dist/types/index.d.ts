export interface Vehicle {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    company: string;
    pricing: PricingTier[];
    commission: Commission;
    status: VehicleStatus;
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
    deposit?: number;
    allowedKilometers?: number;
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
    policyNumber: string;
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
export type UserRole = 'admin' | 'user';
export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
    createdAt: Date;
}
export type UserWithoutPassword = Omit<User, 'password'>;
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
import { Request } from 'express';
export interface AuthRequest extends Request {
    user?: Omit<User, 'password'>;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
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
    damageImages: ProtocolImage[];
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
    damageImages: ProtocolImage[];
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