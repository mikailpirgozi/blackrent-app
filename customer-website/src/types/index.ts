// Vehicle types
export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  category: 'personal' | 'suv' | 'van' | 'luxury'
  fuel_type: string
  transmission: 'manual' | 'automatic'
  seats: number
  doors: number
  price_per_day: number
  deposit: number
  company_id: string
  company_name: string
  license_plate: string
  description?: string
  features: string[]
  images: VehicleImage[]
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface VehicleImage {
  id: string
  vehicle_id: string
  image_url: string
  thumbnail_url?: string
  alt_text?: string
  sort_order: number
  is_primary: boolean
}

// Customer types
export interface Customer {
  id: string
  email: string
  full_name: string
  phone: string
  country: string
  city: string
  zip: string
  address_line1: string
  birth_date?: string
  id_document_type?: string
  id_document_number?: string
  driver_license_number?: string
  driver_license_country?: string
  driver_license_expiry?: string
  marketing_opt_in: boolean
  email_verified: boolean
  created_at: string
}

// Booking types
export interface Booking {
  id: string
  customer_account_id?: string
  vehicle_id: string
  company_id: string
  start_date: string
  end_date: string
  total_days: number
  base_price: number
  extras_price: number
  delivery_fee: number
  insurance_fee: number
  after_hours_fee: number
  tax_amount: number
  deposit_amount: number
  total_amount: number
  currency: string
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  booking_status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  extras: BookingExtra[]
  special_requests?: string
  created_at: string
  updated_at: string
}

export interface BookingExtra {
  id: string
  name: string
  price: number
  quantity: number
}

// Company types
export interface Company {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  zip: string
  country: string
  is_active: boolean
  created_at: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Form types
export interface BookingFormData {
  // Customer info
  full_name: string
  email: string
  phone: string
  country: string
  city: string
  zip: string
  address_line1: string
  
  // Optional customer info
  birth_date?: string
  id_document_type?: string
  id_document_number?: string
  driver_license_number?: string
  driver_license_country?: string
  driver_license_expiry?: string
  
  // Booking details
  vehicle_id: string
  start_date: string
  end_date: string
  extras: BookingExtra[]
  special_requests?: string
  payment_method: 'card' | 'bank_transfer' | 'on_pickup'
  marketing_opt_in: boolean
}

// Filter types
export interface VehicleFilters {
  category?: string[]
  fuel_type?: string[]
  transmission?: string[]
  price_min?: number
  price_max?: number
  seats_min?: number
  company_id?: string[]
  features?: string[]
}
