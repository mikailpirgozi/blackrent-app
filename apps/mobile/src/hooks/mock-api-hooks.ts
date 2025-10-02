/**
 * Mock API hooks for development without backend
 * These hooks return mock data without making any network requests
 */

import { Vehicle } from '@blackrent/shared';

// Mock data
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'BMW X5 2023',
    brand: 'BMW',
    model: 'X5',
    type: 'suv',
    pricePerDay: 89,
    deposit: 500,
    available: true,
    rating: 4.8,
    reviewsCount: 124,
    company: {
      id: 'company-1',
      name: 'Premium Cars SK',
      rating: 4.8,
      reviewsCount: 124,
    },
    location: {
      city: 'Bratislava',
      address: 'Hlavná 1, Bratislava',
      coordinates: { lat: 48.1486, lng: 17.1077 },
    },
    features: ['GPS', 'Klimatizácia', 'Bluetooth', 'Kožené sedadlá'],
    seats: 5,
    doors: 4,
    transmission: 'automatic',
    fuelType: 'gasoline',
    images: [
      'assets/images/vehicles/vehicle-1.webp',
    ],
    year: 2023,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Audi A4 2023',
    brand: 'Audi',
    model: 'A4',
    type: 'premium',
    pricePerDay: 65,
    deposit: 400,
    available: true,
    rating: 4.7,
    reviewsCount: 89,
    company: {
      id: 'company-2',
      name: 'Luxury Drive SK',
      rating: 4.7,
      reviewsCount: 89,
    },
    location: {
      city: 'Bratislava',
      address: 'Štúrova 20, Bratislava',
      coordinates: { lat: 48.1486, lng: 17.1077 },
    },
    features: ['GPS', 'Klimatizácia', 'Kožené sedadlá', 'Parkovacie senzory'],
    seats: 5,
    doors: 4,
    transmission: 'automatic',
    fuelType: 'gasoline',
    images: [
      'assets/images/vehicles/vehicle-card.webp',
    ],
    year: 2023,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Tesla Model S',
    brand: 'Tesla',
    model: 'Model S',
    type: 'electric',
    pricePerDay: 120,
    deposit: 800,
    available: true,
    rating: 4.9,
    reviewsCount: 156,
    company: {
      id: 'company-3',
      name: 'Electric Cars SK',
      rating: 4.9,
      reviewsCount: 156,
    },
    location: {
      city: 'Bratislava',
      address: 'Mierová 10, Bratislava',
      coordinates: { lat: 48.1486, lng: 17.1077 },
    },
    features: ['Autopilot', 'Supercharging', 'Premium Audio', 'Panoramatická strecha'],
    seats: 5,
    doors: 4,
    transmission: 'automatic',
    fuelType: 'electric',
    images: [
      'assets/images/vehicles/tesla-model-s.webp',
    ],
    year: 2023,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Škoda Octavia',
    brand: 'Škoda',
    model: 'Octavia',
    type: 'standard',
    pricePerDay: 55,
    deposit: 400,
    available: true,
    rating: 4.5,
    reviewsCount: 203,
    company: {
      id: 'company-4',
      name: 'Family Rent SK',
      rating: 4.5,
      reviewsCount: 203,
    },
    location: {
      city: 'Žilina',
      address: 'Národná 15, Žilina',
      coordinates: { lat: 49.2233, lng: 18.7408 },
    },
    features: ['GPS', 'Klimatizácia', 'Veľký kufor', 'Bluetooth'],
    seats: 5,
    doors: 4,
    transmission: 'manual',
    fuelType: 'diesel',
    images: [
      'assets/images/vehicles/hero-image-4.webp',
    ],
    year: 2022,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Volkswagen Golf',
    brand: 'Volkswagen',
    model: 'Golf',
    type: 'economy',
    pricePerDay: 45,
    deposit: 300,
    available: true,
    rating: 4.6,
    reviewsCount: 89,
    company: {
      id: 'company-5',
      name: 'Budget Rent SK',
      rating: 4.6,
      reviewsCount: 89,
    },
    location: {
      city: 'Košice',
      address: 'Hlavná 5, Košice',
      coordinates: { lat: 48.7164, lng: 21.2611 },
    },
    features: ['GPS', 'Klimatizácia', 'USB porty'],
    seats: 5,
    doors: 4,
    transmission: 'manual',
    fuelType: 'gasoline',
    images: [
      'assets/images/vehicles/hero-image-2.webp',
    ],
    year: 2021,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Hyundai i30',
    brand: 'Hyundai',
    model: 'i30',
    type: 'economy',
    pricePerDay: 40,
    deposit: 250,
    available: true,
    rating: 4.4,
    reviewsCount: 156,
    company: {
      id: 'company-6',
      name: 'City Cars SK',
      rating: 4.4,
      reviewsCount: 156,
    },
    location: {
      city: 'Prešov',
      address: 'Hlavná 25, Prešov',
      coordinates: { lat: 49.0014, lng: 21.2393 },
    },
    features: ['GPS', 'Klimatizácia', 'Bluetooth', 'USB porty'],
    seats: 5,
    doors: 4,
    transmission: 'manual',
    fuelType: 'gasoline',
    images: [
      'assets/images/vehicles/hero-image-6.webp',
    ],
    year: 2021,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock hook implementations that don't make network requests
export const useFeaturedVehicles = (limit = 3) => {
  // Using mock featured vehicles
  return {
    data: MOCK_VEHICLES.slice(0, limit),
    isLoading: false,
    error: null,
  };
};

export const useVehicles = (params: any = {}) => {
  // Using mock vehicles with params
  
  // Simulate pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  let filteredVehicles = [...MOCK_VEHICLES];
  
  // Apply search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredVehicles = filteredVehicles.filter(
      v =>
        v.name.toLowerCase().includes(searchLower) ||
        v.brand.toLowerCase().includes(searchLower) ||
        v.model.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply sorting
  if (params.sort) {
    filteredVehicles.sort((a, b) => {
      switch (params.sort) {
        case 'price_asc':
          return a.pricePerDay - b.pricePerDay;
        case 'price_desc':
          return b.pricePerDay - a.pricePerDay;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }
  
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);
  const total = filteredVehicles.length;
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: {
      data: paginatedVehicles,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      _meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    },
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

export const useVehicleById = (id: string) => {
  // Using mock vehicle by ID
  
  const vehicle = MOCK_VEHICLES.find(v => v.id === id);
  
  return {
    data: vehicle,
    isLoading: false,
    error: vehicle ? null : new Error(`Vehicle with ID ${id} not found`),
  };
};

// Export mock vehicle data for other components
export { MOCK_VEHICLES };
