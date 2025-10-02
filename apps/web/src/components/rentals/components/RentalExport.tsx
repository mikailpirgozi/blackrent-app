// Lucide icons (replacing MUI icons)
import {
  Upload as DownloadIcon,
  Download as ExportIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import React, { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { apiService } from '../../../services/api';
import type { Company, Customer, Rental, Vehicle } from '../../../types';
import { logger } from '../../../utils/logger';

interface RentalExportProps {
  filteredRentals: Rental[];
  state: {
    customers: Customer[];
    companies: Company[];
    vehicles: Vehicle[];
    rentals: Rental[];
  };
  isMobile: boolean;
  setImportError: (error: string) => void;
}

export const RentalExport: React.FC<RentalExportProps> = ({
  filteredRentals,
  state,
  // isMobile, // TODO: Implement mobile-specific layout
  setImportError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export prenájmov do CSV
  const exportRentalsToCSV = useCallback((rentals: Rental[]) => {
    // Stĺpce v CSV súbori:
    // - id: unikátne ID prenájmu
    // - licensePlate: ŠPZ vozidla (podľa ktorej sa nájde auto a firma)
    // - company: názov firmy vozidla
    // - brand: značka vozidla
    // - model: model vozidla
    // - customerName: meno zákazníka
    // - customerEmail: email zákazníka (voliteľné)
    // - startDate: dátum začiatku prenájmu (formát ISO 8601 - 2025-01-03T23:00:00.000Z)
    // - endDate: dátum konca prenájmu (formát ISO 8601 - 2025-01-03T23:00:00.000Z)
    // - totalPrice: celková cena prenájmu v €
    // - commission: provízia v € (vypočítaná rovnako ako v UI)
    // - paymentMethod: spôsob platby (cash/bank_transfer/vrp/direct_to_owner)
    // - discountType: typ zľavy (percentage/fixed) - voliteľné
    // - discountValue: hodnota zľavy - voliteľné
    // - customCommissionType: typ vlastnej provízie (percentage/fixed) - voliteľné
    // - customCommissionValue: hodnota vlastnej provízie - voliteľné
    // - extraKmCharge: doplatok za km v € - voliteľné
    // - paid: či je uhradené (1=áno, 0=nie)
    // - handoverPlace: miesto prevzatia - voliteľné
    // - confirmed: či je potvrdené (1=áno, 0=nie)

    // 🔧 HELPER: Výpočet provízie rovnako ako v UI
    const calculateCommission = (rental: Rental): number => {
      // ✅ OPRAVENÉ: totalPrice už obsahuje všetko (základná cena + doplatok za km)
      // Netreba pridávať extraKmCharge znovu!
      const totalPrice = rental.totalPrice;

      // Ak je nastavená customCommission, použije sa tá
      if (rental.customCommission?.value && rental.customCommission.value > 0) {
        if (rental.customCommission.type === 'percentage') {
          return (totalPrice * rental.customCommission.value) / 100;
        } else {
          return rental.customCommission.value;
        }
      }

      // Inak sa použije commission z vozidla
      if (rental.vehicle?.commission) {
        if (rental.vehicle.commission.type === 'percentage') {
          return (totalPrice * rental.vehicle.commission.value) / 100;
        } else {
          return rental.vehicle.commission.value;
        }
      }

      // Fallback na uloženú commission z databázy
      return rental.commission || 0;
    };

    const header = [
      'id',
      'licensePlate',
      'company',
      'brand',
      'model',
      'customerName',
      'customerEmail',
      'startDate',
      'endDate',
      'totalPrice',
      'commission',
      'paymentMethod',
      'discountType',
      'discountValue',
      'customCommissionType',
      'customCommissionValue',
      'extraKmCharge',
      'paid',
      'handoverPlace',
      'confirmed',
    ];
    const rows = rentals.map(r => [
      r.id,
      r.vehicle?.licensePlate || '',
      r.vehicle?.company || '',
      r.vehicle?.brand || '',
      r.vehicle?.model || '',
      r.customerName,
      r.customer?.email || '',
      (() => {
        const startDate =
          r.startDate instanceof Date ? r.startDate : new Date(r.startDate);
        return !isNaN(startDate.getTime())
          ? startDate.toISOString()
          : String(r.startDate);
      })(),
      (() => {
        const endDate =
          r.endDate instanceof Date ? r.endDate : new Date(r.endDate);
        return !isNaN(endDate.getTime())
          ? endDate.toISOString()
          : String(r.endDate);
      })(),
      r.totalPrice,
      calculateCommission(r), // 🔧 OPRAVENÉ: Používa vypočítanú províziu
      r.paymentMethod,
      r.discount?.type || '',
      r.discount?.value ?? '',
      r.customCommission?.type || '',
      r.customCommission?.value ?? '',
      r.extraKmCharge ?? '',
      r.paid ? '1' : '0',
      r.handoverPlace || '',
      r.confirmed ? '1' : '0',
    ]);
    const csv = [header, ...rows]
      .map(row =>
        row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'prenajmy.csv');
  }, []);

  // Import prenájmov z CSV
  const handleImportCSV = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: ReturnType<typeof Papa.parse>) => {
          try {
            const imported = [];
            const createdVehicles: Vehicle[] = [];
            const createdCustomers: Customer[] = [];
            const createdCompanies: Company[] = [];

            // 📦 BATCH PROCESSING: Pripravíme všetky prenájmy pre batch import
            const batchRentals = [];

            // Najskôr spracujeme všetky riadky a vytvoríme zákazníkov, firmy a vozidlá ak je potrebné
            for (const row of results.data as Record<string, unknown>[]) {
              logger.debug('Processing CSV row', {
                rowIndex: results.data.indexOf(row),
              });

              // 1. VYTVORENIE ZÁKAZNÍKA AK NEEXISTUJE
              const customerName = String(
                row.customerName || 'Neznámy zákazník'
              );
              const customerEmail = String(row.customerEmail || '');

              // 🔍 DETAILNÉ HĽADANIE ZÁKAZNÍKA S DIAKRITIKU
              console.log(
                `🔍 CUSTOMER SEARCH [${results.data.indexOf(row)}]:`,
                {
                  csvCustomerName: customerName,
                  csvCustomerNameLength: customerName.length,
                  availableCustomers: state.customers
                    .slice(0, 5)
                    .map(c => c.name),
                }
              );

              let existingCustomer = state.customers.find(
                c =>
                  c.name.toLowerCase() === customerName.toLowerCase() ||
                  (customerEmail && c.email === customerEmail)
              );

              // Ak nenašiel exact match, skús fuzzy match pre diakritiku
              if (!existingCustomer && customerName !== 'Neznámy zákazník') {
                const normalizeString = (str: string) =>
                  str
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // odstráni diakritiku
                    .trim();

                const normalizedCustomerName = normalizeString(customerName);
                console.log(
                  `🔍 FUZZY SEARCH for: "${customerName}" -> normalized: "${normalizedCustomerName}"`
                );

                existingCustomer = state.customers.find(c => {
                  const normalizedDbName = normalizeString(c.name);
                  const match = normalizedDbName === normalizedCustomerName;
                  if (match) {
                    console.log(
                      `✅ FUZZY MATCH: "${customerName}" -> "${c.name}" (ID: ${c.id})`
                    );
                  }
                  return match;
                });

                if (!existingCustomer) {
                  console.log(`❌ NO CUSTOMER FOUND for: "${customerName}"`);
                }
              } else if (existingCustomer) {
                console.log(
                  `✅ EXACT MATCH: "${customerName}" -> ID: ${existingCustomer.id}`
                );
              }

              // Skontroluj aj v aktuálne vytvorených zákazníkoch
              if (!existingCustomer) {
                existingCustomer = createdCustomers.find(
                  c =>
                    c.name.toLowerCase() === customerName.toLowerCase() ||
                    (customerEmail && c.email === customerEmail)
                );

                // Fuzzy match aj v vytvorených zákazníkoch
                if (!existingCustomer && customerName !== 'Neznámy zákazník') {
                  const normalizeString = (str: string) =>
                    str
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .trim();

                  const normalizedCustomerName = normalizeString(customerName);
                  existingCustomer = createdCustomers.find(c => {
                    const normalizedDbName = normalizeString(c.name);
                    return normalizedDbName === normalizedCustomerName;
                  });

                  if (existingCustomer) {
                    console.log(
                      `✅ FUZZY MATCH in created customers: "${customerName}" -> "${existingCustomer.name}"`
                    );
                  }
                }
              }

              // Ak zákazník neexistuje, vytvor ho
              if (!existingCustomer && customerName !== 'Neznámy zákazník') {
                try {
                  const newCustomer = {
                    id: uuidv4(),
                    name: customerName,
                    email: customerEmail,
                    phone: '',
                    address: '',
                    notes: '',
                    createdAt: new Date(),
                  };
                  await apiService.createCustomer(newCustomer);
                  createdCustomers.push(newCustomer);
                  logger.info('Customer created during import', {
                    customerName,
                  });
                } catch (error) {
                  logger.error('Failed to create customer during import', {
                    customerName,
                    error,
                  });
                }
              }

              // 2. VYTVORENIE FIRMY AK NEEXISTUJE
              const companyName = String(row.company || 'Neznáma firma');
              let existingCompany = state.companies.find(
                c => c.name.toLowerCase() === companyName.toLowerCase()
              );

              if (!existingCompany) {
                existingCompany = createdCompanies.find(
                  c => c.name.toLowerCase() === companyName.toLowerCase()
                );
              }

              if (!existingCompany && companyName !== 'Neznáma firma') {
                try {
                  const newCompany = {
                    id: uuidv4(),
                    name: companyName,
                    address: '',
                    phone: '',
                    email: '',
                    commissionRate: 20.0,
                    isActive: true,
                    createdAt: new Date(),
                  };
                  await apiService.createCompany(newCompany);
                  createdCompanies.push(newCompany);
                  logger.info('Company created during import', { companyName });
                } catch (error) {
                  logger.error('Failed to create company during import', {
                    companyName,
                    error,
                  });
                }
              }

              // 3. VYTVORENIE VOZIDLA AK NEEXISTUJE
              const licensePlate = String(row.licensePlate || '');
              if (!licensePlate) {
                logger.warn('Missing license plate, skipping row', {
                  rowIndex: results.data.indexOf(row),
                });
                continue;
              }

              let vehicle = state.vehicles.find(
                v => v.licensePlate.toLowerCase() === licensePlate.toLowerCase()
              );

              if (!vehicle) {
                vehicle = createdVehicles.find(
                  v =>
                    v.licensePlate.toLowerCase() === licensePlate.toLowerCase()
                );
              }

              if (!vehicle) {
                try {
                  const finalCompany =
                    existingCompany ||
                    createdCompanies.find(
                      c => c.name.toLowerCase() === companyName.toLowerCase()
                    );

                  if (!finalCompany) {
                    logger.warn('Missing company for vehicle, skipping', {
                      licensePlate,
                    });
                    continue;
                  }

                  const newVehicle: Vehicle = {
                    id: uuidv4(),
                    licensePlate: licensePlate,
                    brand: String(row.brand || 'Neznáma značka'),
                    model: String(row.model || 'Neznámy model'),
                    company: finalCompany.name,
                    year: new Date().getFullYear(),
                    commission: {
                      type: 'percentage' as const,
                      value: 20,
                    },
                    pricing: [],
                    status: 'available' as const,
                  };
                  await apiService.createVehicle(newVehicle);
                  createdVehicles.push(newVehicle);
                  logger.info('Vehicle created during import', {
                    licensePlate,
                    brand: row.brand,
                    model: row.model,
                  });
                } catch (error) {
                  logger.error('Failed to create vehicle during import', {
                    licensePlate,
                    error,
                  });
                  continue;
                }
              }

              // Parsuje dátumy - iba dátum bez času, zachováva formát pre export
              const parseDate = (dateStr: unknown) => {
                const dateString = String(dateStr || '');
                if (!dateString) return new Date();

                // Skúsi ISO 8601 formát (YYYY-MM-DDTHH:mm:ss.sssZ alebo YYYY-MM-DD)
                // Ale iba ak má správny formát (obsahuje - alebo T)
                if (dateString.includes('-') || dateString.includes('T')) {
                  const isoDate = new Date(dateString);
                  if (!isNaN(isoDate.getTime())) {
                    // ✅ OPRAVENÉ: Extrahuje dátum z UTC času, nie lokálneho
                    return new Date(
                      Date.UTC(
                        isoDate.getUTCFullYear(),
                        isoDate.getUTCMonth(),
                        isoDate.getUTCDate()
                      )
                    );
                  }
                }

                // Fallback na formát s bodkami - podporuje "14.1." alebo "14.1.2025"
                let cleanDateStr = dateString.trim();

                // Odstráni koncovú bodku ak je tam ("14.1." -> "14.1")
                if (cleanDateStr.endsWith('.')) {
                  cleanDateStr = cleanDateStr.slice(0, -1);
                }

                const parts = cleanDateStr.split('.');
                if (parts.length === 2) {
                  // Formát dd.M - automaticky pridá rok 2025
                  const day = Number(parts[0]);
                  const month = Number(parts[1]) - 1; // január = 0, február = 1, atď.

                  // Validácia dátumu
                  if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
                    // Vytvor dátum v UTC aby sa predišlo timezone konverzii
                    return new Date(Date.UTC(2025, month, day));
                  }
                } else if (parts.length === 3) {
                  // Formát dd.M.yyyy - ak je tam rok
                  const day = Number(parts[0]);
                  const month = Number(parts[1]) - 1;
                  const year = Number(parts[2]);

                  // Validácia dátumu
                  if (
                    day >= 1 &&
                    day <= 31 &&
                    month >= 0 &&
                    month <= 11 &&
                    year >= 1900 &&
                    year <= 2100
                  ) {
                    // Vytvor dátum v UTC aby sa predišlo timezone konverzii
                    return new Date(Date.UTC(year, month, day));
                  }
                }

                // Ak nič nefunguje, vráti dnešný dátum
                console.warn(
                  `Nepodarilo sa parsovať dátum: "${dateString}", používam dnešný dátum`
                );
                return new Date();
              };

              // Priradenie zákazníka na základe existujúceho alebo novo vytvoreného
              let finalCustomer =
                existingCustomer ||
                createdCustomers.find(
                  c =>
                    c.name.toLowerCase() === customerName.toLowerCase() ||
                    (customerEmail && c.email === customerEmail)
                );

              // Posledná šanca - fuzzy match pre finálne priradenie
              if (!finalCustomer && customerName !== 'Neznámy zákazník') {
                const normalizeString = (str: string) =>
                  str
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim();

                const normalizedCustomerName = normalizeString(customerName);
                finalCustomer = [...state.customers, ...createdCustomers].find(
                  c => {
                    const normalizedDbName = normalizeString(c.name);
                    return normalizedDbName === normalizedCustomerName;
                  }
                );

                if (finalCustomer) {
                  console.log(
                    `✅ FINAL FUZZY MATCH: "${customerName}" -> "${finalCustomer.name}" (ID: ${finalCustomer.id})`
                  );
                } else {
                  console.log(
                    `❌ FINAL: NO CUSTOMER FOUND for: "${customerName}"`
                  );
                }
              }

              // Automatické priradenie majiteľa na základe vozidla
              // Ak existuje vozidlo a nie je zadaný spôsob platby, nastav platbu priamo majiteľovi
              let finalPaymentMethod = String(row.paymentMethod || 'cash');

              // Ak je nájdené vozidlo na základe ŠPZ a nie je zadaný paymentMethod,
              // automaticky nastav platbu priamo majiteľovi vozidla
              if (vehicle && !row.paymentMethod) {
                finalPaymentMethod = 'direct_to_owner';
                logger.info('Auto-assigned direct payment to vehicle owner', {
                  licensePlate: vehicle.licensePlate,
                  company: vehicle.company,
                });
              }

              // ✅ OPRAVENÉ: Výpočet provízie rovnako ako v exporte
              const finalCommission = (() => {
                const totalPrice = Number(row.totalPrice) || 0;

                // 1. Ak je zadaná commission priamo v CSV, použije sa tá
                if (row.commission && Number(row.commission) > 0) {
                  return Number(row.commission);
                }

                // 2. Ak je zadaná customCommission v CSV, použije sa tá
                if (row.customCommissionType && row.customCommissionValue) {
                  if (row.customCommissionType === 'percentage') {
                    return (
                      (totalPrice * Number(row.customCommissionValue)) / 100
                    );
                  } else {
                    return Number(row.customCommissionValue);
                  }
                }

                // 3. Inak sa použije commission z vozidla
                if (vehicle?.commission) {
                  if (vehicle.commission.type === 'percentage') {
                    return (totalPrice * vehicle.commission.value) / 100;
                  } else {
                    return vehicle.commission.value;
                  }
                }

                // 4. Fallback na 0
                return 0;
              })();

              if (!row.commission && vehicle?.commission) {
                logger.info('Auto-calculated commission for vehicle', {
                  licensePlate: vehicle.licensePlate,
                  commission: finalCommission,
                  type: vehicle.commission.type,
                  value: vehicle.commission.value,
                });
              }

              // Log informácií o majiteľovi/firme vozidla
              if (vehicle) {
                logger.debug('Vehicle assigned to rental', {
                  licensePlate: vehicle.licensePlate,
                  owner: vehicle.company,
                });
              }

              const startDate = parseDate(row.startDate);
              const endDate = parseDate(row.endDate);

              // KONTROLA DUPLICÍT PRENÁJMU
              // Skontroluj, či už existuje prenájom s týmito parametrami
              const duplicateRental = state.rentals.find(existingRental => {
                // Kontrola podľa vozidla a dátumov
                if (vehicle?.id && existingRental.vehicleId === vehicle.id) {
                  const existingStart = new Date(existingRental.startDate);
                  const existingEnd = new Date(existingRental.endDate);

                  // Ak sa dátumy zhodujú (rovnaký deň)
                  if (
                    existingStart.toDateString() === startDate.toDateString() &&
                    existingEnd.toDateString() === endDate.toDateString()
                  ) {
                    return true;
                  }
                }
                return false;
              });

              if (duplicateRental) {
                logger.warn('Duplicate rental detected, skipping', {
                  licensePlate: vehicle?.licensePlate,
                  startDate: startDate.toLocaleDateString(),
                  endDate: endDate.toLocaleDateString(),
                });
                continue;
              }

              // 🔍 DEBUG: Parsovanie ceny z CSV
              const rawTotalPrice = row.totalPrice;
              const parsedTotalPrice = Number(row.totalPrice) || 0;

              console.log('🔍 CSV PRICE DEBUG:', {
                rowIndex: results.data.indexOf(row),
                customerName,
                rawTotalPrice,
                parsedTotalPrice,
                typeOfRaw: typeof rawTotalPrice,
                isNaN: isNaN(Number(rawTotalPrice)),
              });

              // Vytvorenie prenájmu
              const newRental = {
                id: String(row.id || uuidv4()),
                vehicleId: vehicle?.id || undefined,
                vehicle: vehicle,
                customerId: finalCustomer?.id || undefined,
                customer: finalCustomer,
                customerName: customerName,
                startDate: startDate,
                endDate: endDate,
                totalPrice: parsedTotalPrice,
                commission: finalCommission,
                paymentMethod: finalPaymentMethod as
                  | 'cash'
                  | 'bank_transfer'
                  | 'vrp'
                  | 'direct_to_owner',
                discount: row.discountType
                  ? {
                      type: row.discountType as 'percentage' | 'fixed',
                      value: Number(row.discountValue) || 0,
                    }
                  : undefined,
                customCommission: row.customCommissionType
                  ? {
                      type: row.customCommissionType as 'percentage' | 'fixed',
                      value: Number(row.customCommissionValue) || 0,
                    }
                  : undefined,
                extraKmCharge: Number(row.extraKmCharge) || 0,
                paid: row.paid === '1' || row.paid === true,
                handoverPlace: String(row.handoverPlace || ''),
                confirmed: row.confirmed === '1' || row.confirmed === true,
                status: 'active' as const,
                notes: '',
                createdAt: new Date(),
              };

              // 📦 BATCH: Pridaj prenájom do batch zoznamu namiesto okamžitého vytvorenia
              batchRentals.push(newRental);
              logger.debug('Rental prepared for batch import', {
                customer: customerName,
                licensePlate: vehicle?.licensePlate,
                totalPrice: parsedTotalPrice,
                startDate: startDate.toLocaleDateString(),
                endDate: endDate.toLocaleDateString(),
              });
            }

            // 🚀 BATCH IMPORT: Vytvor všetky prenájmy naraz
            if (batchRentals.length > 0) {
              try {
                logger.info(
                  `🚀 Starting batch import of ${batchRentals.length} rentals...`
                );

                // Vytvor prenájmy jeden po druhom namiesto batch importu
                for (const rental of batchRentals) {
                  try {
                    const createdRental = await apiService.createRental({
                      ...rental,
                      vehicle: rental.vehicle ?? {} as Vehicle,
                      customer: rental.customer ?? {} as Customer,
                      vehicleId: rental.vehicleId || '',
                      customerId: rental.customerId || '',
                      discount: rental.discount ?? { type: 'percentage' as const, value: 0 },
                      customCommission: rental.customCommission ?? { type: 'percentage' as const, value: 0 },
                    });
                    imported.push(createdRental);
                  } catch (error) {
                    logger.error('Failed to create rental', {
                      rental: rental.customerName,
                      error,
                    });
                  }
                }

                logger.info('✅ Batch import completed', {
                  processed: imported.length,
                  total: batchRentals.length,
                  successRate: (imported.length / batchRentals.length) * 100,
                });
              } catch (error) {
                logger.error('Batch import failed', { error });
                throw error;
              }
            }

            logger.info('CSV import completed successfully', {
              importedCount: imported.length,
              totalRows: results.data.length,
            });
            setImportError('');

            // Refresh dát
            window.location.reload();
          } catch (error) {
            logger.error('CSV import failed', { error });
            setImportError('Chyba pri importe CSV súboru');
          }

          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      });
    },
    [state, setImportError]
  );

  return (
    <div className="flex gap-2 md:gap-4 mb-6 mx-2 md:mx-0 flex-wrap items-center">
      {/* Export CSV */}
      <Button
        variant="outline"
        onClick={() => exportRentalsToCSV(filteredRentals)}
        className="min-w-[120px] text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-lg hidden md:inline-flex"
      >
        <ExportIcon className="w-4 h-4 mr-2" />
        Export CSV
      </Button>

      {/* Import CSV */}
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="min-w-[120px] text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-lg hidden md:inline-flex"
      >
        <DownloadIcon className="w-4 h-4 mr-2" />
        Import CSV
      </Button>
      <input
        type="file"
        accept=".csv"
        hidden
        onChange={handleImportCSV}
        ref={fileInputRef}
      />
    </div>
  );
};
