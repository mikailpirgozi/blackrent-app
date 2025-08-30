import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { sk } from 'date-fns/locale';

import { Rental, Vehicle } from '../../../types';

// CSV Export utility
export const exportRentalsToCSV = (rentals: Rental[], vehicles: Vehicle[]) => {
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  const csvData = rentals.map(rental => {
    const vehicle = vehicleMap.get(rental.vehicleId || '');
    return {
      ID: rental.id,
      Zákazník: rental.customerName || '',
      Vozidlo: vehicle ? `${vehicle.brand} ${vehicle.model}` : '',
      ŠPZ: vehicle?.licensePlate || '',
      Firma: vehicle?.company || '',
      Od: rental.startDate
        ? format(
            rental.startDate instanceof Date
              ? rental.startDate
              : parseISO(rental.startDate),
            'dd.MM.yyyy',
            { locale: sk }
          )
        : '',
      Do: rental.endDate
        ? format(
            rental.endDate instanceof Date
              ? rental.endDate
              : parseISO(rental.endDate),
            'dd.MM.yyyy',
            { locale: sk }
          )
        : '',
      Cena: rental.totalPrice || 0,
      Stav: rental.status || '',
      Platba: rental.paymentMethod || '',
      Poznámky: rental.notes || '',
    };
  });

  const csv = [
    Object.keys(csvData[0] || {}).join(','),
    ...csvData.map(row => Object.values(row).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `prenajmy-${format(new Date(), 'yyyy-MM-dd')}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Filter utilities
export const applyRentalFilters = (
  rentals: Rental[],
  searchQuery: string,
  filters: any,
  vehicles: Vehicle[]
) => {
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  return rentals.filter(rental => {
    const vehicle = vehicleMap.get(rental.vehicleId || '');

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const searchableText = [
        rental.customerName,
        rental.notes,
        vehicle?.brand,
        vehicle?.model,
        vehicle?.licensePlate,
        vehicle?.company,
        rental.customerEmail,
        rental.customerPhone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(searchLower)) return false;
    }

    // Status filter
    if (filters.status?.length > 0 && !filters.status.includes(rental.status)) {
      return false;
    }

    // Payment method filter
    if (
      filters.paymentMethod?.length > 0 &&
      !filters.paymentMethod.includes(rental.paymentMethod)
    ) {
      return false;
    }

    // Company filter
    if (
      filters.company?.length > 0 &&
      vehicle &&
      !filters.company.includes(vehicle.company)
    ) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      if (!rental.startDate || !rental.endDate) return false;
      const rentalStart =
        rental.startDate instanceof Date
          ? rental.startDate
          : parseISO(rental.startDate);
      const rentalEnd =
        rental.endDate instanceof Date
          ? rental.endDate
          : parseISO(rental.endDate);

      if (filters.dateFrom) {
        const filterStart = startOfDay(parseISO(filters.dateFrom));
        if (rentalEnd < filterStart) return false;
      }

      if (filters.dateTo) {
        const filterEnd = endOfDay(parseISO(filters.dateTo));
        if (rentalStart > filterEnd) return false;
      }
    }

    // Price range filter
    if (filters.priceMin && rental.totalPrice < parseFloat(filters.priceMin)) {
      return false;
    }

    if (filters.priceMax && rental.totalPrice > parseFloat(filters.priceMax)) {
      return false;
    }

    return true;
  });
};

// Get unique values for filter dropdowns
export const getUniqueFilterValues = (
  rentals: Rental[],
  vehicles: Vehicle[]
) => {
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  const statuses = new Set<string>();
  const paymentMethods = new Set<string>();
  const companies = new Set<string>();
  const vehicleBrands = new Set<string>();

  rentals.forEach(rental => {
    if (rental.status) statuses.add(rental.status);
    if (rental.paymentMethod) paymentMethods.add(rental.paymentMethod);

    const vehicle = vehicleMap.get(rental.vehicleId || '');
    if (vehicle?.company) companies.add(vehicle.company);
    if (vehicle?.brand) vehicleBrands.add(vehicle.brand);
  });

  return {
    statuses: Array.from(statuses).sort(),
    paymentMethods: Array.from(paymentMethods).sort(),
    companies: Array.from(companies).sort(),
    vehicleBrands: Array.from(vehicleBrands).sort(),
  };
};

// Protocol status utilities
export const getProtocolStatusText = (
  rental: Rental,
  protocols: Record<string, any>
) => {
  const hasHandover = !!protocols[rental.id]?.handover;
  const hasReturn = !!protocols[rental.id]?.return;

  if (hasHandover && hasReturn) return 'Kompletné';
  if (hasHandover) return 'Odovzdávací';
  if (hasReturn) return 'Preberací';
  return 'Žiadne';
};

// Vehicle lookup utilities
export const createVehicleLookupMap = (vehicles: Vehicle[]) => {
  const map = new Map();
  vehicles.forEach(vehicle => {
    map.set(vehicle.id, vehicle);
  });
  return map;
};

export const getVehicleByRental = (
  rental: Rental,
  vehicleMap: Map<string, Vehicle>
) => {
  return rental.vehicleId ? vehicleMap.get(rental.vehicleId) || null : null;
};
