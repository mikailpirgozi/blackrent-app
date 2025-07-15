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
//# sourceMappingURL=index.d.ts.map