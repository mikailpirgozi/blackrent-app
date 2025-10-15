/**
 * Booking Types
 * TypeScript types for booking flow
 */

export interface BookingDates {
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
}

export interface Insurance {
  id: string;
  name: string;
  description: string;
  price: number;
  coverageAmount: number;
  deductible: number;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType: 'per_day' | 'one_time';
  quantity: number;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  driverLicense: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  numberOfDays: number;
  subtotal: number;
  insuranceTotal: number;
  addOnsTotal: number;
  discount?: number;
  depositAmount: number;
  totalPrice: number;
}

export interface BookingData {
  vehicleId: string;
  dates: BookingDates;
  insurance?: Insurance;
  addOns: AddOn[];
  customerInfo?: CustomerInfo;
  priceBreakdown: PriceBreakdown;
  pickupLocation?: string;
  deliveryAddress?: string;
  notes?: string;
}

export type BookingStep = 'dates' | 'insurance' | 'addons' | 'customer' | 'payment';

export interface BookingState {
  currentStep: BookingStep;
  data: Partial<BookingData>;
  isValid: boolean;
}

