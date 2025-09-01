/**
 * V2 Protocol Test Data Generator
 * Generuje testovací rental objekt s reálnymi dátami pre V2 protokol
 */

import type { Customer, Rental, Vehicle } from '../types';

// Reálne dáta z BMW X5 prenájmu (ID: 1606)
export const testRentalData: Rental = {
  id: '1606',
  customerId: '395',
  vehicleId: '209',
  startDate: new Date('2025-08-31T23:33:04.583Z'),
  endDate: new Date('2025-08-31T23:33:04.583Z'),
  totalPrice: 100.0,
  deposit: 110.0,
  currency: 'EUR',
  allowedKilometers: 125,
  extraKilometerRate: 0.3,
  customerName: 'Mikail Pirgozi',
  orderNumber: '123521',
  handoverPlace: 'Trenčín',
  pickupLocation: 'Trenčín',
  returnLocation: 'Trenčín',
  paymentMethod: 'cash',
  paid: false,
  status: 'pending',
  notes: '',
  createdAt: new Date('2025-08-31T23:33:29.039Z'),
  commission: 20.0,
  discount: null,
  customCommission: null,
  extraKmCharge: null,
  payments: [],
  history: [],
  confirmed: false,
  dailyKilometers: null,
  returnConditions: null,
  fuelLevel: null,
  odometer: null,
  returnFuelLevel: null,
  returnOdometer: null,
  actualKilometers: null,
  fuelRefillCost: null,
  handoverProtocolId: null,
  returnProtocolId: null,
  company: 'Miki',
  isFlexible: false,
  flexibleEndDate: null,
  customerEmail: 'pirgozi1@gmail.com',
  customerPhone: '421907751872',
  vehicleName: 'Bmw X5 - založena',
  vehicleCode: 'C95246',
  approvalStatus: 'approved',
  autoProcessedAt: null,
  emailContent: null,
  rentalType: 'standard',
  canBeOverridden: false,
  overridePriority: 5,
  notificationThreshold: 3,
  autoExtend: false,
  overrideHistory: [],
};

export const testVehicleData: Vehicle = {
  id: '209',
  companyId: '3',
  brand: 'Bmw',
  model: 'X5 - založena',
  year: 2024,
  licensePlate: 'C95246',
  vin: '', // Prázdne v databáze
  color: '',
  fuelType: '',
  transmission: '',
  category: 'suv',
  dailyRate: null,
  status: 'temporarily_removed',
  createdAt: new Date('2025-08-23T17:25:38.597Z'),
  company: 'Miki',
  pricing: [
    { id: '1', maxDays: 1, minDays: 0, pricePerDay: 100 },
    { id: '2', maxDays: 3, minDays: 2, pricePerDay: 90 },
    { id: '3', maxDays: 7, minDays: 4, pricePerDay: 80 },
    { id: '4', maxDays: 14, minDays: 8, pricePerDay: 70 },
    { id: '5', maxDays: 22, minDays: 15, pricePerDay: 60 },
    { id: '6', maxDays: 30, minDays: 23, pricePerDay: 50 },
    { id: '7', maxDays: 365, minDays: 31, pricePerDay: 40 },
  ],
  commission: { type: 'percentage', value: 20 },
};

export const testCustomerData: Customer = {
  id: '395',
  firstName: 'Mikail',
  lastName: 'Pirgozi',
  email: 'pirgozi1@gmail.com',
  phone: '421907751872',
  createdAt: new Date('2025-08-31T23:33:29.039Z'),
};

/**
 * Vytvorí kompletný rental objekt s vehicle a customer dátami
 * Simuluje to čo dostáva V1 protokol z API
 */
export function createTestRentalWithRelations(): Rental & {
  vehicle: Vehicle;
  customer: Customer;
} {
  return {
    ...testRentalData,
    vehicle: testVehicleData,
    customer: testCustomerData,
    // Dodatočné polia pre V1 kompatibilitu
    vehicleVin: testVehicleData.vin,
    customerAddress: '', // Nie je v databáze
  };
}

/**
 * Generuje HandoverProtocolDataV2 z rental dát
 * Rovnako ako V1 automaticky mapuje dáta
 */
export function generateV2ProtocolData(
  rental: Rental & { vehicle: Vehicle; customer: Customer }
) {
  return {
    protocolId: `test-protocol-${Date.now()}`,
    vehicleId: rental.vehicleId,
    customerId: rental.customerId,
    rentalId: rental.id,

    // Vehicle info - mapované z rental.vehicle
    vehicle: {
      licensePlate: rental.vehicle.licensePlate,
      brand: rental.vehicle.brand,
      model: rental.vehicle.model,
      year: rental.vehicle.year,
      vin: rental.vehicle.vin || rental.vehicleVin,
      status: rental.vehicle.status,
      company: rental.vehicle.company,
      companyName: rental.company, // Pre caching
    },

    // Customer info - mapované z rental.customer
    customer: {
      firstName: rental.customer.firstName,
      lastName: rental.customer.lastName,
      name: `${rental.customer.firstName} ${rental.customer.lastName}`, // V1 kompatibilita
      email: rental.customer.email,
      phone: rental.customer.phone,
      address: (rental as any).customerAddress || '', // Ak existuje
    },

    // Rental details - všetky V1 kompatibilné polia
    rental: {
      orderNumber: rental.orderNumber,
      startDate: rental.startDate,
      endDate: rental.endDate,
      startKm: rental.odometer || 0,
      location: rental.pickupLocation || rental.handoverPlace || '',
      pricePerDay: 100, // Z pricing
      totalPrice: rental.totalPrice,
      deposit: rental.deposit,
      allowedKilometers: rental.allowedKilometers,
      extraKilometerRate: rental.extraKilometerRate,
      pickupLocation: rental.pickupLocation,
      returnLocation: rental.returnLocation,
    },

    // Protocol specific fields (V2 interface)
    fuelLevel: rental.fuelLevel || 100,
    odometer: rental.odometer || undefined,
    condition: 'good' as const,
    depositPaymentMethod: (rental.paymentMethod as any) || 'cash',
    damages: [],
    notes: rental.notes || '',

    // Signatures - prázdne
    signatures: [],

    // V1 kompatibilné foto kategórie - prázdne
    vehicleImages: [],
    documentImages: [],
    damageImages: [],
    odometerImages: [],
    fuelImages: [],

    // V2 photos - prázdne
    photos: [],
  };
}

/**
 * Console helper pre debugging
 */
export function logTestData() {
  const rental = createTestRentalWithRelations();
  const v2Data = generateV2ProtocolData(rental);

  console.group('🧪 V2 Protocol Test Data');
  console.log('📋 Rental:', rental);
  console.log('🚗 Vehicle:', rental.vehicle);
  console.log('👤 Customer:', rental.customer);
  console.log('📝 V2 Protocol Data:', v2Data);
  console.groupEnd();

  return { rental, v2Data };
}
