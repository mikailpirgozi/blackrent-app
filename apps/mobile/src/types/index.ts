// ============================================================================
// CENTRALIZED TYPE DEFINITIONS
// ============================================================================
// This file contains all shared type definitions used across the mobile app.
// All types should be imported from here to ensure consistency.

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'company_owner' | 'owner' | 'employee';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
}

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  type: 'sedan' | 'suv' | 'hatchback' | 'coupe' | 'convertible' | 'truck' | 'van';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  seats: number;
  doors: number;
  pricePerDay: number;
  pricePerKm?: number;
  currency: string;
  images: string[];
  thumbnails?: string[];
  features: string[];
  description?: string;
  location: {
    city: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  availability: {
    isAvailable: boolean;
    availableFrom?: string;
    availableUntil?: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFilters {
  type?: Vehicle['type'][];
  fuelType?: Vehicle['fuelType'][];
  transmission?: Vehicle['transmission'][];
  priceRange?: {
    min: number;
    max: number;
  };
  seats?: {
    min: number;
    max: number;
  };
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  features?: string[];
}

export interface VehicleSearchParams {
  query?: string;
  filters?: VehicleFilters;
  sortBy?: 'price' | 'rating' | 'distance' | 'newest';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface Booking {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  userId: string;
  user: User;
  startDate: string;
  endDate: string;
  pickupLocation: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  returnLocation: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupLocation: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  returnLocation: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notes?: string;
}

// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Location {
  address: string;
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationSuggestion {
  id: string;
  address: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  clientSecret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingUpdates: boolean;
  promotionalOffers: boolean;
  reminderNotifications: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'promotion' | 'reminder' | 'system';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'phone' | 'date' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  options?: Array<{
    label: string;
    value: string | number;
  }>;
}

export interface FormError {
  field: string;
  message: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

// Re-export all auth types for backward compatibility
export * from './auth';
