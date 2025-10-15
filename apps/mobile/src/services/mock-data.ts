/**
 * Mock Data for Development & Testing
 * Use this when backend is not available or for rapid prototyping
 */

import type { Vehicle } from '../types/vehicle';

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'mock-1',
    brand: 'BMW',
    model: '320d',
    year: 2023,
    category: 'vyssia-stredna',
    licensePlate: 'BA-123-AB',
    vin: 'WBADT43452G123456',
    transmission: 'automatic',
    fuelType: 'diesel',
    seats: 5,
    doors: 4,
    color: 'Čierna',
    mileage: 15000,
    status: 'available',
    location: 'Bratislava',
    pricing: [
      { days: 1, pricePerDay: 85 },
      { days: 3, pricePerDay: 80 },
      { days: 7, pricePerDay: 75 },
      { days: 14, pricePerDay: 70 },
    ],
    images: [],
    features: ['Klimatizácia', 'Navigácia', 'Parkovací asistent', 'Tempomat'],
    description: 'Luxusný sedan s nízkou spotrebou a špičkovou výbavou.',
    companyId: 'mock-company-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-10-14T12:00:00Z',
  },
  {
    id: 'mock-2',
    brand: 'Mercedes-Benz',
    model: 'E 220d',
    year: 2023,
    category: 'luxusne',
    licensePlate: 'BA-456-CD',
    vin: 'WDD2130421A123456',
    transmission: 'automatic',
    fuelType: 'diesel',
    seats: 5,
    doors: 4,
    color: 'Strieborná',
    mileage: 8000,
    status: 'available',
    location: 'Bratislava',
    pricing: [
      { days: 1, pricePerDay: 120 },
      { days: 3, pricePerDay: 110 },
      { days: 7, pricePerDay: 100 },
      { days: 14, pricePerDay: 95 },
    ],
    images: [],
    features: [
      'Kožené sedadlá',
      'Panoráma strecha',
      'Massage sedadlá',
      'Keyless entry',
      'LED svetlá',
    ],
    description: 'Prémiový executive sedan s maximálnym komfortom.',
    companyId: 'mock-company-1',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-10-14T12:00:00Z',
  },
  {
    id: 'mock-3',
    brand: 'Škoda',
    model: 'Octavia',
    year: 2022,
    category: 'stredna-trieda',
    licensePlate: 'BA-789-EF',
    vin: 'TMBEF7NE0K0123456',
    transmission: 'manual',
    fuelType: 'petrol',
    seats: 5,
    doors: 5,
    color: 'Biela',
    mileage: 35000,
    status: 'available',
    location: 'Košice',
    pricing: [
      { days: 1, pricePerDay: 45 },
      { days: 3, pricePerDay: 42 },
      { days: 7, pricePerDay: 38 },
      { days: 14, pricePerDay: 35 },
    ],
    images: [],
    features: ['Klimatizácia', 'Bluetooth', 'USB', 'Airbags'],
    description: 'Spoľahlivý rodinný automobil s priestorným batožinovým priestorom.',
    companyId: 'mock-company-2',
    createdAt: '2023-11-10T10:00:00Z',
    updatedAt: '2024-10-14T12:00:00Z',
  },
  {
    id: 'mock-4',
    brand: 'Audi',
    model: 'Q5',
    year: 2023,
    category: 'suv',
    licensePlate: 'BA-321-GH',
    vin: 'WAUZZZ8R7KA123456',
    transmission: 'automatic',
    fuelType: 'diesel',
    seats: 5,
    doors: 5,
    color: 'Modrá',
    mileage: 12000,
    status: 'available',
    location: 'Bratislava',
    pricing: [
      { days: 1, pricePerDay: 95 },
      { days: 3, pricePerDay: 90 },
      { days: 7, pricePerDay: 85 },
      { days: 14, pricePerDay: 80 },
    ],
    images: [],
    features: [
      'Quattro pohon',
      'Virtual cockpit',
      'Parkovacia kamera',
      'Adaptívny tempomat',
      'Vyhrieva sedadlá',
    ],
    description: 'Prémiové SUV s pohonom všetkých kolies a modernou technológiou.',
    companyId: 'mock-company-1',
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-10-14T12:00:00Z',
  },
  {
    id: 'mock-5',
    brand: 'Volkswagen',
    model: 'Golf',
    year: 2022,
    category: 'nizka-trieda',
    licensePlate: 'BA-654-IJ',
    vin: 'WVWZZZ1KZ1W123456',
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 5,
    doors: 5,
    color: 'Červená',
    mileage: 28000,
    status: 'available',
    location: 'Žilina',
    pricing: [
      { days: 1, pricePerDay: 40 },
      { days: 3, pricePerDay: 38 },
      { days: 7, pricePerDay: 35 },
      { days: 14, pricePerDay: 32 },
    ],
    images: [],
    features: ['Klimatizácia', 'Start-stop', 'Bluetooth', 'Cruise control'],
    description: 'Kompaktný hatchback ideálny pre mestskú jazdu.',
    companyId: 'mock-company-2',
    createdAt: '2023-09-15T10:00:00Z',
    updatedAt: '2024-10-14T12:00:00Z',
  },
  {
    id: 'mock-6',
    brand: 'Tesla',
    model: 'Model 3',
    year: 2023,
    category: 'sportove',
    licensePlate: 'BA-111-TL',
    vin: '5YJ3E1EA1KF123456',
    transmission: 'automatic',
    fuelType: 'electric',
    seats: 5,
    doors: 4,
    color: 'Čierna',
    mileage: 5000,
    status: 'available',
    location: 'Bratislava',
    pricing: [
      { days: 1, pricePerDay: 150 },
      { days: 3, pricePerDay: 140 },
      { days: 7, pricePerDay: 130 },
      { days: 14, pricePerDay: 120 },
    ],
    images: [],
    features: [
      'Autopilot',
      'Supercharger prístup',
      'Premium audio',
      'Glass roof',
      'OTA updates',
    ],
    description: 'Elektrický sedan s najnovšou technológiou a autonómnym jazdením.',
    companyId: 'mock-company-1',
    createdAt: '2024-05-10T10:00:00Z',
    updatedAt: '2024-10-14T12:00:00Z',
  },
  {
    id: 'mock-7',
    brand: 'Ford',
    model: 'Transit Custom',
    year: 2022,
    category: 'dodavky',
    licensePlate: 'BA-999-VN',
    vin: 'WF0YXXTTGYJK12345',
    transmission: 'manual',
    fuelType: 'diesel',
    seats: 3,
    doors: 4,
    color: 'Biela',
    mileage: 45000,
    status: 'available',
    location: 'Trnava',
    pricing: [
      { days: 1, pricePerDay: 65 },
      { days: 3, pricePerDay: 60 },
      { days: 7, pricePerDay: 55 },
      { days: 14, pricePerDay: 50 },
    ],
    images: [],
    features: ['Veľký nákladový priestor', 'Cruise control', 'Bluetooth', 'DAB rádio'],
    description: 'Praktická dodávka pre prepravu tovaru a sťahovanie.',
    companyId: 'mock-company-2',
    createdAt: '2023-08-05T10:00:00Z',
    updatedAt: '2024-10-14T12:00:00Z',
  },
  {
    id: 'mock-8',
    brand: 'Volkswagen',
    model: 'Transporter',
    year: 2023,
    category: 'viacmiestne',
    licensePlate: 'BA-777-VP',
    vin: 'WV2ZZZ7HZ1H123456',
    transmission: 'automatic',
    fuelType: 'diesel',
    seats: 9,
    doors: 5,
    color: 'Strieborná',
    mileage: 18000,
    status: 'available',
    location: 'Bratislava',
    pricing: [
      { days: 1, pricePerDay: 80 },
      { days: 3, pricePerDay: 75 },
      { days: 7, pricePerDay: 70 },
      { days: 14, pricePerDay: 65 },
    ],
    images: [],
    features: [
      '9 sedadiel',
      'Klimatizácia vzadu',
      'Sklápacie sedadlá',
      'USB porty',
      'Parkovací senzor',
    ],
    description: '9-miestny minibus ideálny pre rodinné výlety alebo firemné akcie.',
    companyId: 'mock-company-1',
    createdAt: '2024-04-01T10:00:00Z',
    updatedAt: '2024-10-14T12:00:00Z',
  },
];

/**
 * Get mock vehicles (simulates API call)
 */
export function getMockVehicles(filters?: {
  category?: string;
  brand?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Vehicle[] {
  let filtered = [...MOCK_VEHICLES];

  if (filters?.category && filters.category !== 'all') {
    filtered = filtered.filter((v) => v.category === filters.category);
  }

  if (filters?.brand && filters.brand !== 'all') {
    filtered = filtered.filter((v) => v.brand === filters.brand);
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.brand.toLowerCase().includes(search) ||
        v.model.toLowerCase().includes(search) ||
        v.licensePlate?.toLowerCase().includes(search)
    );
  }

  const offset = filters?.offset || 0;
  const limit = filters?.limit || filtered.length;

  return filtered.slice(offset, offset + limit);
}

/**
 * Get mock vehicle by ID
 */
export function getMockVehicleById(id: string): Vehicle | undefined {
  return MOCK_VEHICLES.find((v) => v.id === id);
}

/**
 * Get available brands from mock data
 */
export function getMockBrands(): string[] {
  return [...new Set(MOCK_VEHICLES.map((v) => v.brand))].sort();
}

