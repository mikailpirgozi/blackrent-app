import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  TableSortLabel,
  Collapse,
  Tooltip,
  TableFooter,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import ResponsiveTable, { ResponsiveTableColumn } from '../common/ResponsiveTable';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  History as HistoryIcon,
  WarningAmber as WarningAmberIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Assignment as HandoverProtocolIcon,
  AssignmentReturn as ReturnProtocolIcon,
  AssignmentTurnedIn as ProtocolCompleteIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Rental, PaymentMethod, Vehicle } from '../../types';
import { format, differenceInCalendarDays, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { sk } from 'date-fns/locale';
import RentalForm from './RentalForm';
import HandoverProtocolForm from '../protocols/HandoverProtocolForm';
import ReturnProtocolForm from '../protocols/ReturnProtocolForm';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import useMediaQuery from '@mui/material/useMediaQuery';
import Fab from '@mui/material/Fab';

type SortField = 'vehicle' | 'company' | 'customerName' | 'startDate' | 'endDate' | 'totalPrice' | 'commission' | 'paymentMethod' | 'paid' | 'status';
type SortDirection = 'asc' | 'desc';

const getPaymentMethodText = (method: PaymentMethod) => {
  switch (method) {
    case 'cash':
      return 'Hotovosť';
    case 'bank_transfer':
      return 'Bankový prevod';
    case 'vrp':
      return 'VRP';
    case 'direct_to_owner':
      return 'Priamo majiteľovi';
    default:
      return method;
  }
};

const getPaymentMethodColor = (method: PaymentMethod) => {
  switch (method) {
    case 'cash':
      return 'success';
    case 'bank_transfer':
      return 'primary';
    case 'vrp':
      return 'warning';
    case 'direct_to_owner':
      return 'info';
    default:
      return 'default';
  }
};

const getRentalStatus = (rental: Rental) => {
  const now = new Date();
  
  // Zabezpečíme, že dátumy sú Date objekty
  const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
  const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
  
  // Kontrola platnosti dátumov
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { label: 'Neplatné dátumy', color: 'error' };
  }
  
  if (rental.confirmed) return { label: 'Prenájom potvrdený', color: 'success' };
  if (isBefore(now, startDate)) return { label: 'Čaká na prenájom', color: 'default' };
  if (isWithinInterval(now, { start: startDate, end: endDate })) return { label: 'Prenájom prebieha', color: 'primary' };
  if (isAfter(now, endDate)) return { label: 'Prenájom ukončený', color: 'warning' };
  return { label: 'Neznámy stav', color: 'default' };
};

// Cached date values to avoid recreating them on every call
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

// Optimized priority calculation with memoization via WeakMap
const priorityCache = new WeakMap<Rental, number>();

const getRentalPriority = (rental: Rental) => {
  // Check cache first
  if (priorityCache.has(rental)) {
    return priorityCache.get(rental)!;
  }

  // Kontrola či rental existuje
  if (!rental || !rental.startDate || !rental.endDate) {
    priorityCache.set(rental, 7);
    return 7; // Najnižšia priorita pre neplatné dáta
  }
  
  // Zabezpečíme, že dátumy sú Date objekty
  const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
  const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
  
  // Kontrola platnosti dátumov
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    priorityCache.set(rental, 7);
    return 7; // Neplatné dátumy - najnižšia priorita
  }
  
  let priority = 7; // default
  
  // Aktívne prenájmy - najvyššia priorita
  if (isWithinInterval(now, { start: startDate, end: endDate })) {
    priority = 1;
  }
  // Dnešné odovzdania/vrátenia
  else if (format(endDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    priority = 2;
  }
  // Zajtrajšie odovzdania
  else if (format(endDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
    priority = 3;
  }
  // Nepotvrdené ukončené (potrebujú pozornosť)
  else if (isAfter(now, endDate) && !rental.confirmed) {
    priority = 4;
  }
  // Budúce prenájmy
  else if (isBefore(now, startDate)) {
    priority = 5;
  }
  // Staré potvrdené (>30 dní)
  else if (rental.confirmed && isBefore(endDate, thirtyDaysAgo)) {
    priority = 6;
  }
  
  priorityCache.set(rental, priority);
  return priority;
};

const getRentalBackgroundColor = (rental: Rental) => {
  const priority = getRentalPriority(rental);
  switch (priority) {
    case 1: return 'rgba(76, 175, 80, 0.1)'; // Aktívne - zelená
    case 2: return 'rgba(255, 152, 0, 0.15)'; // Dnešné vrátania - oranžová
    case 3: return 'rgba(255, 193, 7, 0.1)'; // Zajtrajšie vrátania - žltá
    case 4: return 'rgba(244, 67, 54, 0.1)'; // Nepotvrdené ukončené - červená
    case 5: return 'rgba(33, 150, 243, 0.1)'; // Budúce - modrá
    case 6: return 'rgba(158, 158, 158, 0.1)'; // Staré potvrdené - sivá
    default: return 'transparent';
  }
};

// Funkcia na výpočet počtu dní prenájmu
const getRentalDays = (rental: Rental) => {
  if (!rental.startDate || !rental.endDate) return 0;
  
  const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
  const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export default function RentalList() {
  const { state, dispatch, createRental, updateRental, deleteRental, createVehicle, createCompany, createCustomer, getFilteredRentals } = useApp();
  
  // Helper funkcia na bezpečné formátovanie cien
  const formatPrice = useCallback((price: number | string | undefined): string => {
    if (typeof price === 'number') return price.toFixed(2);
    return (parseFloat(price as string) || 0).toFixed(2);
  }, []);

  // Memoized date formatter to avoid expensive formatting
  const formatDate = useCallback((date: Date | string): string => {
    const d = date instanceof Date ? date : new Date(date);
    return !isNaN(d.getTime()) ? format(d, 'dd.MM.yyyy', { locale: sk }) : 'Neplatný dátum';
  }, []);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaid, setFilterPaid] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showTodayReturns, setShowTodayReturns] = useState(true);
  const [showTomorrowReturns, setShowTomorrowReturns] = useState(true);
  const [showUnconfirmed, setShowUnconfirmed] = useState(true);
  const [showFuture, setShowFuture] = useState(true);
  const [showOldConfirmed, setShowOldConfirmed] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRentalDetail, setSelectedRentalDetail] = useState<Rental | null>(null);
  const [selectedHistoryRental, setSelectedHistoryRental] = useState<Rental | null>(null);


  // Nové stavy pre triedenie a zoskupovanie
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [groupBy, setGroupBy] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // Pridám stav pre filter nezaplatených splátok
  const [showUnpaidPaymentsOnly, setShowUnpaidPaymentsOnly] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  
  // State pre protokoly
  const [selectedRentalForProtocol, setSelectedRentalForProtocol] = useState<Rental | null>(null);
  const [protocolType, setProtocolType] = useState<'handover' | 'return' | null>(null);
  // Pridám stav pre všetky prenájmy
  const [showAll, setShowAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Export prenájmov do CSV
  function exportRentalsToCSV(rentals: Rental[]) {
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
    // - commission: provízia v €
    // - paymentMethod: spôsob platby (cash/bank_transfer/vrp/direct_to_owner)
    // - discountType: typ zľavy (percentage/fixed) - voliteľné
    // - discountValue: hodnota zľavy - voliteľné
    // - customCommissionType: typ vlastnej provízie (percentage/fixed) - voliteľné
    // - customCommissionValue: hodnota vlastnej provízie - voliteľné
    // - extraKmCharge: doplatok za km v € - voliteľné
    // - paid: či je uhradené (1=áno, 0=nie)
    // - handoverPlace: miesto prevzatia - voliteľné
    // - confirmed: či je potvrdené (1=áno, 0=nie)
    const header = [
      'id','licensePlate','company','brand','model','customerName','customerEmail','startDate','endDate','totalPrice','commission','paymentMethod','discountType','discountValue','customCommissionType','customCommissionValue','extraKmCharge','paid','handoverPlace','confirmed'
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
        const startDate = r.startDate instanceof Date ? r.startDate : new Date(r.startDate);
        return !isNaN(startDate.getTime()) ? startDate.toISOString() : String(r.startDate);
      })(),
      (() => {
        const endDate = r.endDate instanceof Date ? r.endDate : new Date(r.endDate);
        return !isNaN(endDate.getTime()) ? endDate.toISOString() : String(r.endDate);
      })(),
      r.totalPrice,
      r.commission,
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
    const csv = [header, ...rows].map(row => row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'prenajmy.csv');
  }

  // Import prenájmov z CSV
  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ReturnType<typeof Papa.parse>) => {
        try {
          const imported = [];
          const createdVehicles: Vehicle[] = [];
          const createdCustomers: any[] = [];
          const createdCompanies: any[] = [];
          
          // Najskôr spracujeme všetky riadky a vytvoríme zákazníkov, firmy a vozidlá ak je potrebné
          for (const row of results.data as any[]) {
            console.log('Processing row:', row);
            
            // 1. VYTVORENIE ZÁKAZNÍKA AK NEEXISTUJE
            const customerName = row.customerName || 'Neznámy zákazník';
            const customerEmail = row.customerEmail || '';
            
            let existingCustomer = state.customers.find(c => 
              c.name.toLowerCase() === customerName.toLowerCase() ||
              (customerEmail && c.email === customerEmail)
            );
            
            // Skontroluj aj v aktuálne vytvorených zákazníkoch
            if (!existingCustomer) {
              existingCustomer = createdCustomers.find(c => 
                c.name.toLowerCase() === customerName.toLowerCase() ||
                (customerEmail && c.email === customerEmail)
              );
            }
            
            // Ak zákazník neexistuje, vytvor ho
            if (!existingCustomer && customerName !== 'Neznámy zákazník') {
              try {
                const newCustomer = {
                  id: uuidv4(),
                  name: customerName,
                  email: customerEmail,
                  phone: '',
                  createdAt: new Date()
                };
                await createCustomer(newCustomer);
                createdCustomers.push(newCustomer);
                console.log(`Vytvorený nový zákazník: ${customerName}`);
              } catch (error) {
                console.error('Chyba pri vytváraní zákazníka:', error);
                // Pokračuj aj keď sa zákazník nevytvori
              }
            }
            
            // 2. VYTVORENIE FIRMY AK NEEXISTUJE
            const companyName = row.company || 'NEZNÁMA FIRMA';
            
            console.log('CSV row company field:', row.company, 'companyName:', companyName);
            
            let existingCompany = state.companies.find(c => c.name === companyName);
            
            // Skontroluj aj v aktuálne vytvorených firmách
            if (!existingCompany) {
              existingCompany = createdCompanies.find(c => c.name === companyName);
            }
            
            // Ak firma neexistuje, vytvor ju
            if (!existingCompany) {
              try {
                const newCompany = {
                  id: uuidv4(),
                  name: companyName,
                  createdAt: new Date()
                };
                
                console.log('Vytváram novú firmu:', newCompany);
                
                await createCompany(newCompany);
                createdCompanies.push(newCompany);
                console.log(`Vytvorená nová firma: ${companyName}`);
              } catch (error) {
                console.error('Chyba pri vytváraní firmy:', error);
                // Pokračuj aj keď sa firma nevytvori
              }
            } else {
              console.log('Firma už existuje:', existingCompany);
            }
            
            // 3. NÁJDENIE ALEBO VYTVORENIE VOZIDLA
            let vehicle = state.vehicles.find((v: Vehicle) => v.licensePlate === row.licensePlate);
            
            // Ak vozidlo neexistuje, vytvorí ho s údajmi z CSV
            if (!vehicle) {
              // Skontroluj či už neexistuje vozidlo s touto ŠPZ v aktuálnom importe
              const existingInCreated = createdVehicles.find(v => v.licensePlate === row.licensePlate);
              if (existingInCreated) {
                vehicle = existingInCreated;
              } else {
                // Vytvor nové vozidlo s rozumnými defaultnými hodnotami
                const newVehicle: Vehicle = {
                  id: uuidv4(),
                  brand: row.brand || 'Nezadaná značka',
                  model: row.model || 'Nezadaný model',
                  licensePlate: row.licensePlate || '',
                  company: companyName || 'Nezadaná firma',
                  pricing: [
                    { id: '1', minDays: 0, maxDays: 1, pricePerDay: 50 },
                    { id: '2', minDays: 2, maxDays: 3, pricePerDay: 45 },
                    { id: '3', minDays: 4, maxDays: 7, pricePerDay: 40 },
                    { id: '4', minDays: 8, maxDays: 14, pricePerDay: 35 },
                    { id: '5', minDays: 15, maxDays: 22, pricePerDay: 30 },
                    { id: '6', minDays: 23, maxDays: 30, pricePerDay: 25 },
                    { id: '7', minDays: 31, maxDays: 9999, pricePerDay: 20 },
                  ],
                  commission: { type: 'percentage' as const, value: 20 },
                  status: 'available' as const
                };

                console.log('🚗 Vytváram nové vozidlo:', newVehicle);
                await createVehicle(newVehicle);
                vehicle = newVehicle;
                createdVehicles.push(newVehicle);
                console.log(`Vytvorené nové vozidlo: ${row.licensePlate} - ${newVehicle.brand} ${newVehicle.model}`);
              }
            }

            // Parsuje dátumy - iba dátum bez času, zachováva formát pre export
            const parseDate = (dateStr: string) => {
              if (!dateStr) return new Date();
              
              // Skúsi ISO 8601 formát (YYYY-MM-DDTHH:mm:ss.sssZ alebo YYYY-MM-DD)
              // Ale iba ak má správny formát (obsahuje - alebo T)
              if (dateStr.includes('-') || dateStr.includes('T')) {
                const isoDate = new Date(dateStr);
                if (!isNaN(isoDate.getTime())) {
                  // Extrahuje iba dátum bez času
                  return new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
                }
              }
              
              // Fallback na formát s bodkami - podporuje "14.1." alebo "14.1.2025"
              let cleanDateStr = dateStr.trim();
              
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
                  return new Date(2025, month, day);
                }
              } else if (parts.length === 3) {
                // Formát dd.M.yyyy - ak je tam rok
                const day = Number(parts[0]);
                const month = Number(parts[1]) - 1;
                const year = Number(parts[2]);
                
                // Validácia dátumu
                if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
                  return new Date(year, month, day);
                }
              }
              
              // Ak nič nefunguje, vráti dnešný dátum
              console.warn(`Nepodarilo sa parsovať dátum: "${dateStr}", používam dnešný dátum`);
              return new Date();
            };

            // Priradenie zákazníka na základe existujúceho alebo novo vytvoreného
            const finalCustomer = existingCustomer || createdCustomers.find(c => 
              c.name.toLowerCase() === customerName.toLowerCase() ||
              (customerEmail && c.email === customerEmail)
            );

            // Automatické priradenie majiteľa na základe vozidla
            // Ak existuje vozidlo a nie je zadaný spôsob platby, nastav platbu priamo majiteľovi
            let finalPaymentMethod = row.paymentMethod || 'cash';
            
            // Ak je nájdené vozidlo na základe ŠPZ a nie je zadaný paymentMethod,
            // automaticky nastav platbu priamo majiteľovi vozidla
            if (vehicle && !row.paymentMethod) {
              finalPaymentMethod = 'direct_to_owner';
              console.log(`🏢 Automaticky nastavená platba priamo majiteľovi pre vozidlo ${vehicle.licensePlate} (${vehicle.company})`);
            }

            // Automatické počítanie provízie na základe vozidla ak nie je zadaná
            const finalCommission = Number(row.commission) || (vehicle?.commission ? 
              vehicle.commission.type === 'percentage' 
                ? (Number(row.totalPrice) || 0) * vehicle.commission.value / 100
                : vehicle.commission.value 
              : 0);
            
            if (!row.commission && vehicle?.commission) {
              console.log(`💰 Automaticky vypočítaná provízia pre vozidlo ${vehicle.licensePlate}: ${finalCommission}€ (${vehicle.commission.type}: ${vehicle.commission.value})`);
            }

            // Log informácií o majiteľovi/firme vozidla
            if (vehicle) {
              console.log(`🚗 Priradené vozidlo ${vehicle.licensePlate} - Majiteľ: ${vehicle.company}`);
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
                if (existingStart.toDateString() === startDate.toDateString() && 
                    existingEnd.toDateString() === endDate.toDateString()) {
                  return true;
                }
              }
              
              // Kontrola podľa zákazníka a dátumov (ak nie je vozidlo)
              if (existingRental.customerName?.toLowerCase() === customerName.toLowerCase()) {
                const existingStart = new Date(existingRental.startDate);
                const existingEnd = new Date(existingRental.endDate);
                
                if (existingStart.toDateString() === startDate.toDateString() && 
                    existingEnd.toDateString() === endDate.toDateString()) {
                  return true;
                }
              }
              
              return false;
            });
            
            // Ak nenašiel duplicitu, pridaj prenájom
            if (!duplicateRental) {
              const rental = {
                id: row.id || uuidv4(),
                vehicleId: vehicle?.id,
                vehicle: vehicle,
                customerId: finalCustomer?.id,
                customer: finalCustomer,
                customerName: customerName,
                startDate: startDate,
                endDate: endDate,
                totalPrice: Number(row.totalPrice) || 0,
                commission: finalCommission,
                paymentMethod: finalPaymentMethod,
                createdAt: new Date(),
                discount: row.discountType ? { type: row.discountType, value: Number(row.discountValue) } : undefined,
                customCommission: row.customCommissionType ? { type: row.customCommissionType, value: Number(row.customCommissionValue) } : undefined,
                extraKmCharge: row.extraKmCharge ? Number(row.extraKmCharge) : undefined,
                paid: row.paid === '1' || row.paid === 'true',
                handoverPlace: row.handoverPlace || '',
                confirmed: row.confirmed === '1' || row.confirmed === 'true',
                // Označí prenájmy s neúplnými údajmi
                needsUpdate: !vehicle || vehicle.brand === 'NEZNÁMA ZNAČKA' || vehicle.company === 'NEZNÁMA FIRMA',
              };
              
              imported.push(rental);
            } else {
              console.log(`🔄 Preskakujem duplicitný prenájom: ${customerName} (${vehicle?.licensePlate || 'bez vozidla'}) ${startDate.toDateString()}`);
            }
          }
          
          // Teraz vytvoríme všetky prenájmy cez API
          let needsUpdateCount = 0;
          for (const rental of imported) {
            if (rental.needsUpdate) {
              needsUpdateCount++;
            }
            // Odstráni needsUpdate pred uložením
            const { needsUpdate, ...rentalToSave } = rental;
            await createRental(rentalToSave);
          }
          
          setImportError('');
          const totalImported = imported.length;
          const totalProcessed = results.data.length;
          const skippedDuplicates = totalProcessed - totalImported;
          const vehiclesCreated = createdVehicles.length;
          
          let message = `Import prenájmov prebehol úspešne!\n\n`;
          message += `• Spracované riadky: ${totalProcessed}\n`;
          message += `• Importované prenájmy: ${totalImported}\n`;
          if (skippedDuplicates > 0) {
            message += `• Preskočené duplicity: ${skippedDuplicates}\n`;
          }
          if (vehiclesCreated > 0) {
            message += `• Vytvorené nové vozidlá: ${vehiclesCreated}\n`;
          }
          message += `• Automaticky priradení majitelia na základe ŠPZ vozidiel\n`;
          message += `• Automaticky vypočítané provízie podľa nastavení vozidiel\n`;
          if (needsUpdateCount > 0) {
            message += `• Prenájmy s neúplnými údajmi o vozidle: ${needsUpdateCount}\n`;
            message += `\nProsím, upravte prenájmy označené ako "NEZNÁMA ZNAČKA/FIRMA" a pridajte správne údaje o vozidlách.`;
          }
          
          alert(message);
        } catch (err: any) {
          setImportError('Chyba pri importe CSV: ' + err.message);
          console.error('Import error:', err);
        }
      },
      error: (err: any) => setImportError('Chyba pri čítaní CSV: ' + err.message)
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Výber všetkých/žiadnych prenájmov
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(filteredRentals.map((r: Rental) => r.id));
    } else {
      setSelected([]);
    }
  };
  // Výber jedného prenájmu
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelected((prev: string[]) => checked ? [...prev, id] : prev.filter((i: string) => i !== id));
  };
  // Hromadné mazanie
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (window.confirm(`Naozaj chcete vymazať ${selected.length} označených prenájmov?`)) {
      try {
        await Promise.all(selected.map(id => deleteRental(id)));
        setSelected([]);
      } catch (error) {
        console.error('Chyba pri mazaní prenájmov:', error);
      }
    }
  };

  // Filtrovanie a triedenie
  const filteredRentals = useMemo(() => {
    // Ak sú dáta ešte načítavané alebo nie sú dostupné, vráť prázdne pole
    if (state.loading || !getFilteredRentals() || getFilteredRentals().length === 0) {
      return [];
    }
    
    let rentals = getFilteredRentals();
    
    // Ak je showAll false a nie sú zaškrtnuté žiadne filtre, zobraz základné filtre
    if (!showAll && !showActive && !showTodayReturns && !showTomorrowReturns && !showUnconfirmed && !showFuture && !showOldConfirmed) {
      // Ak nie sú zaškrtnuté žiadne filtre, zobraz aspoň aktívne, dnešné a zajtrajšie
      rentals = rentals.filter((r: Rental) => {
        const priority = getRentalPriority(r);
        return priority <= 3; // Aktívne, dnešné vrátenia, zajtrajšie vrátenia
      });
    }
    
    if (!showAll) {
      // Simplified filter logic - avoid .some() checks that iterate through all rentals
      if (filterVehicle) rentals = rentals.filter((r: Rental) => r.vehicleId === filterVehicle);
      if (filterCompany) rentals = rentals.filter((r: Rental) => r.vehicle && r.vehicle.company === filterCompany);
      if (filterCustomer) {
        const q = filterCustomer.toLowerCase();
        rentals = rentals.filter((r: Rental) => r.customerName && r.customerName.toLowerCase().includes(q));
      }
      if (filterStatus) {
        rentals = rentals.filter((r: Rental) => getRentalStatus(r).label === filterStatus);
      }
      if (filterPaid) {
        const isPaidFilter = filterPaid === 'yes';
        rentals = rentals.filter((r: Rental) => r.paid === isPaidFilter);
      }
      if (filterPaymentMethod) rentals = rentals.filter((r: Rental) => r.paymentMethod === filterPaymentMethod);
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        rentals = rentals.filter((r: Rental) => {
          const startDate = r.startDate instanceof Date ? r.startDate : new Date(r.startDate);
          return !isNaN(startDate.getTime()) && startDate >= fromDate;
        });
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        rentals = rentals.filter((r: Rental) => {
          const endDate = r.endDate instanceof Date ? r.endDate : new Date(r.endDate);
          return !isNaN(endDate.getTime()) && endDate <= toDate;
        });
      }
      // Rýchle vyhľadávanie
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        rentals = rentals.filter((r: Rental) =>
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.vehicle && r.vehicle.licensePlate && r.vehicle.licensePlate.toLowerCase().includes(q)) ||
          (r.vehicle && r.vehicle.company && r.vehicle.company.toLowerCase().includes(q))
        );
      }
      if (!showConfirmed) rentals = rentals.filter((r: Rental) => !r.confirmed);
      
      // Nové filtre podľa priority - len ak máme dáta
      if (rentals.length > 0) {
        // Batch priority filtering - calculate priority once per rental and filter based on it
        const priorityFilters = [];
        if (!showActive) priorityFilters.push(1);
        if (!showTodayReturns) priorityFilters.push(2);
        if (!showTomorrowReturns) priorityFilters.push(3);
        if (!showUnconfirmed) priorityFilters.push(4);
        if (!showFuture) priorityFilters.push(5);
        if (!showOldConfirmed) priorityFilters.push(6);
        
        if (priorityFilters.length > 0) {
          const prioritySet = new Set(priorityFilters);
          rentals = rentals.filter((r: Rental) => !prioritySet.has(getRentalPriority(r)));
        }
      }

      // Filtrovanie podľa nezaplatených splátok
      if (showUnpaidPaymentsOnly) {
        if (rentals.some((r: Rental) => !r.payments || r.payments.length === 0)) rentals = rentals.filter((r: Rental) => r.payments && r.payments.some((p: any) => !p.isPaid));
      }
    }

    // Triedenie - najprv podľa priority, potom podľa zvoleného poľa
    rentals.sort((a: Rental, b: Rental) => {
      // Najprv triedenie podľa priority (nižšie číslo = vyššia priorita)
      const aPriority = getRentalPriority(a);
      const bPriority = getRentalPriority(b);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Ak majú rovnakú prioritu, triedi podľa zvoleného poľa
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'vehicle':
          aValue = a.vehicle ? `${a.vehicle.brand} ${a.vehicle.model}` : '';
          bValue = b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '';
          break;
        case 'company':
          aValue = a.vehicle ? a.vehicle.company : '';
          bValue = b.vehicle ? b.vehicle.company : '';
          break;
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'startDate':
          aValue = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
          bValue = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
          // Kontrola platnosti dátumov
          if (isNaN(aValue.getTime())) aValue = new Date(0);
          if (isNaN(bValue.getTime())) bValue = new Date(0);
          break;
        case 'endDate':
          aValue = a.endDate instanceof Date ? a.endDate : new Date(a.endDate);
          bValue = b.endDate instanceof Date ? b.endDate : new Date(b.endDate);
          // Kontrola platnosti dátumov
          if (isNaN(aValue.getTime())) aValue = new Date(0);
          if (isNaN(bValue.getTime())) bValue = new Date(0);
          break;
        case 'totalPrice':
          aValue = a.totalPrice;
          bValue = b.totalPrice;
          break;
        case 'commission':
          aValue = a.commission;
          bValue = b.commission;
          break;
        case 'paymentMethod':
          aValue = getPaymentMethodText(a.paymentMethod);
          bValue = getPaymentMethodText(b.paymentMethod);
          break;
        case 'paid':
          aValue = a.paid ? 1 : 0;
          bValue = b.paid ? 1 : 0;
          break;
        case 'status':
          aValue = getRentalStatus(a).label;
          bValue = getRentalStatus(b).label;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return rentals;
  }, [getFilteredRentals(), state.loading, showAll, showActive, showTodayReturns, showTomorrowReturns, showUnconfirmed, showFuture, showOldConfirmed, filterVehicle, filterCompany, filterCustomer, filterStatus, filterPaid, filterPaymentMethod, filterDateFrom, filterDateTo, searchQuery, showConfirmed, showUnpaidPaymentsOnly, sortField, sortDirection]);

  // Celkový počet prenájmov (skutočný počet v databáze)
  const totalRentalsCount = useMemo(() => {
    return getFilteredRentals() ? getFilteredRentals().length : 0;
  }, [getFilteredRentals()]);

  // Zoskupovanie
  const groupedRentals = useMemo(() => {
    if (!groupBy) return { '': filteredRentals };

    const groups: Record<string, Rental[]> = {};
    
    filteredRentals.forEach((rental: Rental) => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'company':
          groupKey = rental.vehicle ? rental.vehicle.company : 'Bez vozidla';
          break;
        case 'status':
          groupKey = getRentalStatus(rental).label;
          break;
        case 'paymentMethod':
          groupKey = getPaymentMethodText(rental.paymentMethod);
          break;
        case 'paid':
          groupKey = rental.paid ? 'Uhradené' : 'Neuhradené';
          break;
        case 'month':
          const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
          if (!isNaN(startDate.getTime())) {
            groupKey = format(startDate, 'MMMM yyyy', { locale: sk });
          } else {
            groupKey = 'Neplatné dátumy';
          }
          break;
        default:
          groupKey = '';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(rental);
    });

    return groups;
  }, [filteredRentals, groupBy]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey);
      } else {
        newExpanded.add(groupKey);
      }
      return newExpanded;
    });
  }, []);

  const handleAdd = useCallback(() => {
    setEditingRental(null);
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((rental: Rental) => {
    setEditingRental(rental);
    setOpenDialog(true);
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento prenájom?')) {
      try {
        console.log(`🗑️ Mazanie prenájmu ID: ${id}`);
        await deleteRental(id);
        console.log(`✅ Prenájom ${id} úspešne vymazaný`);
      } catch (error) {
        console.error('Chyba pri mazaní prenájmu:', error);
        
        // Ak je prenájom už vymazaný, aktualizujme frontend
        if (error instanceof Error && error.message.includes('Prenájom nenájdený')) {
          console.log('🔄 Prenájom už neexistuje, aktualizujem zoznam...');
          // Načítaj znovu dáta z API
          window.location.reload();
        } else {
          alert('Chyba pri mazaní prenájmu. Skúste znovu.');
        }
      }
    }
  };

  const handleSave = async (rental: Rental) => {
    setIsSaving(true);
    
    // Timeout pre mobilné zariadenia s pomalým spojením
    const timeoutId = setTimeout(() => {
      console.warn('Operácia prebieha dlhšie ako očakávané, možno je pomalé pripojenie...');
    }, 5000); // 5 sekúnd warning
    
    try {
      if (editingRental) {
        await updateRental(rental);
        alert('Prenájom bol úspešne aktualizovaný!');
      } else {
        await createRental(rental);
        alert('Prenájom bol úspešne pridaný!');
      }
      setOpenDialog(false);
      setEditingRental(null);
    } catch (error) {
      console.error('Chyba pri ukladaní prenájmu:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
      alert(`Chyba pri ukladaní prenájmu: ${errorMessage}`);
    } finally {
      clearTimeout(timeoutId);
      setIsSaving(false);
    }
  };

  // Rýchle akcie
  const handleShowOnlyActive = () => {
    setShowActive(true);
    setShowTodayReturns(true);
    setShowTomorrowReturns(true);
    setShowUnconfirmed(true);
    setShowFuture(false);
    setShowOldConfirmed(false);
    setShowConfirmed(false);
  };

  const handleShowOnlyToday = () => {
    setShowActive(true);
    setShowTodayReturns(true);
    setShowTomorrowReturns(false);
    setShowUnconfirmed(false);
    setShowFuture(false);
    setShowOldConfirmed(false);
    setShowConfirmed(false);
  };

  const handleConfirmAllTodayReturns = () => {
    const todayReturns = getFilteredRentals().filter((rental: Rental) => {
      const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
      return !isNaN(endDate.getTime()) && format(endDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') && !rental.confirmed;
    });
    
    if (todayReturns.length === 0) {
      alert('Žiadne dnešné vrátania na potvrdenie');
      return;
    }
    
    if (window.confirm(`Potvrdiť všetkých ${todayReturns.length} dnešných vrátaní?`)) {
      todayReturns.forEach((rental: Rental) => {
        dispatch({ type: 'UPDATE_RENTAL', payload: { ...rental, confirmed: true } });
      });
    }
  };

  const handleShowDetail = (rental: Rental) => {
    setSelectedRentalDetail(rental);
  };
  const handleCloseDetail = () => {
    setSelectedRentalDetail(null);
  };

  const handleShowHistory = (rental: Rental) => {
    setSelectedHistoryRental(rental);
  };
  const handleCloseHistory = () => {
    setSelectedHistoryRental(null);
  };

  // Handlery pre protokoly
  const handleCreateHandoverProtocol = (rental: Rental) => {
    setSelectedRentalForProtocol(rental);
    setProtocolType('handover');
  };

  const handleCreateReturnProtocol = (rental: Rental) => {
    setSelectedRentalForProtocol(rental);
    setProtocolType('return');
  };

  const handleCloseProtocolDialog = () => {
    setSelectedRentalForProtocol(null);
    setProtocolType(null);
  };

  const handleProtocolSubmit = async (protocolData: any) => {
    console.log('Creating protocol:', protocolType, protocolData);
    
    try {
      if (protocolType === 'handover' && selectedRentalForProtocol) {
        // Generovanie ID protokolu
        const protocolId = uuidv4();
        
        // Aktualizácia prenájmu s ID protokolu
        const updatedRental = {
          ...selectedRentalForProtocol,
          handoverProtocolId: protocolId
        };
        
        // Uloženie aktualizovaného prenájmu
        await updateRental(updatedRental);
        
        alert('Preberací protokol bol úspešne vytvorený!');
        console.log('Handover protocol data:', protocolData);
      } else if (protocolType === 'return' && selectedRentalForProtocol) {
        // Generovanie ID protokolu
        const protocolId = uuidv4();
        
        // Aktualizácia prenájmu s ID protokolu
        const updatedRental = {
          ...selectedRentalForProtocol,
          returnProtocolId: protocolId
        };
        
        // Uloženie aktualizovaného prenájmu
        await updateRental(updatedRental);
        
        alert('Vratný protokol bol úspešne vytvorený!');
        console.log('Return protocol data:', protocolData);
      }
      
      // Zatvorenie dialógu
      handleCloseProtocolDialog();
    } catch (error) {
      console.error('Chyba pri vytváraní protokolu:', error);
      alert('Chyba pri vytváraní protokolu. Skúste to znovu.');
    }
  };

  // Column definitions for ResponsiveTable
  const columns: ResponsiveTableColumn[] = useMemo(() => [
    {
      id: 'vehicle',
      label: 'Vozidlo',
      width: { xs: '120px', md: '150px' },
      render: (value, rental: Rental) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rental.vehicle?.licensePlate || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'company',
      label: 'Firma',
      width: { xs: '80px', md: '100px' },
      hideOnMobile: true,
      render: (value, rental: Rental) => rental.vehicle?.company || 'N/A'
    },
    {
      id: 'customerName',
      label: 'Zákazník',
      width: { xs: '100px', md: '130px' },
      render: (value) => value || 'N/A'
    },
    {
      id: 'startDate',
      label: 'Od',
      width: { xs: '80px', md: '100px' },
      render: (value) => {
        const date = value instanceof Date ? value : new Date(value);
        return !isNaN(date.getTime()) ? format(date, 'dd.MM.yyyy', { locale: sk }) : 'N/A';
      }
    },
    {
      id: 'endDate',
      label: 'Do',
      width: { xs: '80px', md: '100px' },
      render: (value) => {
        const date = value instanceof Date ? value : new Date(value);
        return !isNaN(date.getTime()) ? format(date, 'dd.MM.yyyy', { locale: sk }) : 'N/A';
      }
    },
    {
      id: 'totalPrice',
      label: 'Cena (€)',
      width: { xs: '80px', md: '100px' },
      render: (value) => (
        <Typography variant="body2" fontWeight="bold">
          {formatPrice(value)} €
        </Typography>
      )
    },
    {
      id: 'commission',
      label: 'Provízia (€)',
      width: '100px',
      hideOnMobile: true,
      render: (value) => (
        <Typography variant="body2" color="warning.main">
          {formatPrice(value)} €
        </Typography>
      )
    },
    {
      id: 'paymentMethod',
      label: 'Platba',
      width: { xs: '80px', md: '100px' },
      hideOnMobile: true,
      render: (value) => value ? (
        <Chip
          label={getPaymentMethodText(value)}
          color={getPaymentMethodColor(value) as any}
          size="small"
        />
      ) : <span>-</span>
    },
    {
      id: 'paid',
      label: 'Uhradené',
      width: '80px',
      hideOnMobile: true,
      hideOnTablet: true,
      render: (value, rental: Rental) => (
        <Select
          size="small"
          value={value ? 'yes' : 'no'}
          onChange={e => {
            const paid = e.target.value === 'yes';
            dispatch({ type: 'UPDATE_RENTAL', payload: { ...rental, paid } });
          }}
          sx={{ minWidth: 80 }}
          onClick={e => e.stopPropagation()}
        >
          <MenuItem value="yes">
            <Chip label="Áno" color="success" size="small" />
          </MenuItem>
          <MenuItem value="no">
            <Chip label="Nie" color="error" size="small" />
          </MenuItem>
        </Select>
      )
    },
    {
      id: 'status',
      label: 'Stav',
      width: '100px',
      hideOnMobile: true,
      hideOnTablet: true,
      render: (value, rental: Rental) => (
        <Box>
          <Chip
            label={getRentalStatus(rental).label}
            color={getRentalStatus(rental).color as any}
            size="small"
          />
          {getRentalStatus(rental).label === 'Prenájom ukončený' && !rental.confirmed && rental.paid && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              sx={{ ml: 1 }}
              onClick={e => { 
                e.stopPropagation(); 
                dispatch({ type: 'UPDATE_RENTAL', payload: { ...rental, confirmed: true } }); 
              }}
            >
              Potvrdiť ukončenie
            </Button>
          )}
        </Box>
      )
    },
    {
      id: 'actions',
      label: 'Akcie',
      width: { xs: '120px', md: '150px' },
      render: (value, rental: Rental) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); handleEdit(rental); }}
            sx={{ color: 'primary.main' }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); handleDelete(rental.id); }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); handleShowHistory(rental); }}
            sx={{ color: 'info.main' }}
            title="História zmien"
          >
            <HistoryIcon />
          </IconButton>
          {rental.vehicle && (
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); handleCreateHandoverProtocol(rental); }}
              sx={{ color: 'success.main' }}
              title="Preberací protokol"
            >
              <HandoverProtocolIcon />
            </IconButton>
          )}
          {rental.handoverProtocolId && (
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); handleCreateReturnProtocol(rental); }}
              sx={{ color: 'warning.main' }}
              title="Vratný protokol"
            >
              <ReturnProtocolIcon />
            </IconButton>
          )}
        </Box>
      )
    }
  ], [formatPrice, getPaymentMethodText, getPaymentMethodColor, getRentalStatus, dispatch, handleEdit, handleDelete, handleShowHistory, handleCreateHandoverProtocol, handleCreateReturnProtocol]);

  const renderRentalDetail = (rental: Rental) => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Detail prenájmu</Typography>
      <Typography><Typography component="span" fontWeight="bold">Vozidlo:</Typography> {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model} (${rental.vehicle.licensePlate})` : 'Bez vozidla'}</Typography>
      <Typography><Typography component="span" fontWeight="bold">Firma:</Typography> {rental.vehicle?.company || 'N/A'}</Typography>
      <Typography><Typography component="span" fontWeight="bold">Zákazník:</Typography> {rental.customerName}</Typography>
      <Typography><Typography component="span" fontWeight="bold">Od:</Typography> {(() => {
        const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
        return !isNaN(startDate.getTime()) ? format(startDate, 'dd.MM.yyyy', { locale: sk }) : 'Neplatný dátum';
      })()}</Typography>
      <Typography><Typography component="span" fontWeight="bold">Do:</Typography> {(() => {
        const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
        return !isNaN(endDate.getTime()) ? format(endDate, 'dd.MM.yyyy', { locale: sk }) : 'Neplatný dátum';
      })()}</Typography>
      <Typography><Typography component="span" fontWeight="bold">Dĺžka prenájmu:</Typography> {getRentalDays(rental)} dní</Typography>
      <Typography><Typography component="span" fontWeight="bold">Cena:</Typography> {formatPrice(rental.totalPrice)} €</Typography>
      <Typography><Typography component="span" fontWeight="bold">Provízia:</Typography> {formatPrice(rental.commission)} €</Typography>
      <Typography><Typography component="span" fontWeight="bold">Platba:</Typography> {getPaymentMethodText(rental.paymentMethod)}</Typography>
      <Typography><Typography component="span" fontWeight="bold">Uhradené:</Typography> {rental.paid ? 'Áno' : 'Nie'}</Typography>
      <Typography><Typography component="span" fontWeight="bold">Stav:</Typography> {getRentalStatus(rental).label}</Typography>
      {/* Tabuľka platieb */}
      {rental.payments && rental.payments.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Platby (splátky)</Typography>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr">
                <Box component="th">Dátum</Box>
                <Box component="th">Suma (€)</Box>
                <Box component="th">Stav</Box>
                <Box component="th">Spôsob platby</Box>
                <Box component="th">Faktúra</Box>
                <Box component="th">Poznámka</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {rental.payments && rental.payments.map(payment => (
                <Box component="tr" key={payment.id} sx={{ bgcolor: payment.isPaid ? 'success.light' : 'error.light' }}>
                  <Box component="td">{(() => {
                    const date = payment.date instanceof Date ? payment.date : new Date(payment.date);
                    return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Neplatný dátum';
                  })()}</Box>
                  <Box component="td">{formatPrice(payment.amount)}</Box>
                  <Box component="td" sx={{ fontWeight: 'bold', color: payment.isPaid ? 'success.main' : 'error.main' }}>{payment.isPaid ? 'Zaplatené' : 'Nezaplatené'}</Box>
                  <Box component="td">{getPaymentMethodText(payment.paymentMethod || 'cash')}</Box>
                  <Box component="td">{payment.invoiceNumber}</Box>
                  <Box component="td">{payment.note}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  // Pridám hook na detekciu mobilu
  const isMobile = useMediaQuery('(max-width:600px)');

  if (state.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Načítavam prenájmy...</Typography>
      </Box>
    );
  }

  // Zobrazenie chybovej správy
  if (state.error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Chyba pri načítavaní dát
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {state.error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Obnoviť stránku
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Prenájmy</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ 
              minWidth: isMobile ? 'auto' : 'auto',
              px: isMobile ? 2 : 3
            }}
          >
            {isMobile ? 'Pridať' : 'Nový prenájom'}
          </Button>

          
          {/* Mobilné tlačidlá */}
          {isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                color="primary"
                onClick={handleShowOnlyActive}
                sx={{ 
                  bgcolor: 'primary.light',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
                title="Len aktívne"
              >
                <FilterListIcon />
              </IconButton>
              <IconButton
                color="warning"
                onClick={handleShowOnlyToday}
                sx={{ 
                  bgcolor: 'warning.light',
                  '&:hover': { bgcolor: 'warning.main', color: 'white' }
                }}
                title="Len dnešné"
              >
                <WarningAmberIcon />
              </IconButton>
              <IconButton
                color="success"
                onClick={handleConfirmAllTodayReturns}
                sx={{ 
                  bgcolor: 'success.light',
                  '&:hover': { bgcolor: 'success.main', color: 'white' }
                }}
                title="Potvrdiť dnešné"
              >
                <HistoryIcon />
              </IconButton>
            </Box>
          )}
          
          {/* Desktop tlačidlá */}
          {!isMobile && (
            <>
              <Button variant="outlined" color="primary" onClick={handleShowOnlyActive}>Len aktívne</Button>
              <Button variant="outlined" color="warning" onClick={handleShowOnlyToday}>Len dnešné</Button>
              <Button variant="outlined" color="success" onClick={handleConfirmAllTodayReturns}>Potvrdiť dnešné</Button>
                              <Button variant="outlined" color="primary" onClick={() => exportRentalsToCSV(getFilteredRentals())}>Export prenájmov</Button>
              <Button variant="outlined" color="primary" component="label">
                Import prenájmov
                <input type="file" accept=".csv" hidden onChange={handleImportCSV} ref={fileInputRef} />
              </Button>
              <Button variant="outlined" color="error" onClick={handleDeleteSelected} disabled={selected.length === 0}>
                Vymazať označené
              </Button>
            </>
          )}
        </Box>
      </Box>
      {importError && (
        <Box sx={{ color: 'error.main', mb: 2 }}>{importError}</Box>
      )}

      {/* Vyhľadávacie pole */}
      <Box sx={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end', mb: 2 }}>
        <TextField
          label={isMobile ? "Vyhľadávanie..." : "Rýchle vyhľadávanie (zákazník, ŠPZ, firma)"}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{ 
            minWidth: isMobile ? '100%' : 320,
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? 2 : 1
            }
          }}
          placeholder={isMobile ? "Zákazník, ŠPZ, firma..." : undefined}
        />
      </Box>

      {/* Zaškrtávacie políčka - na desktope len 'Všetky prenájmy', na mobile všetky */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={showAll} onChange={e => setShowAll(e.target.checked)} />}
          label="Všetky prenájmy"
        />
        {isMobile && (
          <>
            <FormControlLabel
              control={<Checkbox checked={showActive} onChange={e => setShowActive(e.target.checked)} />}
              label="Aktívne prenájmy"
            />
            <FormControlLabel
              control={<Checkbox checked={showTodayReturns} onChange={e => setShowTodayReturns(e.target.checked)} />}
              label="Dnešné vrátenie"
            />
            <FormControlLabel
              control={<Checkbox checked={showTomorrowReturns} onChange={e => setShowTomorrowReturns(e.target.checked)} />}
              label="Zajtrajšie vrátenia"
            />
            <FormControlLabel
              control={<Checkbox checked={showUnconfirmed} onChange={e => setShowUnconfirmed(e.target.checked)} />}
              label="Nepotvrdené ukončené"
            />
            <FormControlLabel
              control={<Checkbox checked={showFuture} onChange={e => setShowFuture(e.target.checked)} />}
              label="Budúce prenájmy"
            />
            <FormControlLabel
              control={<Checkbox checked={showOldConfirmed} onChange={e => setShowOldConfirmed(e.target.checked)} />}
              label="Staré ukončené (>30 dní)"
            />
          </>
        )}
      </Box>
      {/* Filtre */}
      {isMobile ? (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setShowFiltersMobile((prev) => !prev)}
            sx={{ mb: 1 }}
          >
            {showFiltersMobile ? 'Skryť filtre' : 'Zobraziť filtre'}
          </Button>
          <Collapse in={showFiltersMobile}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Vozidlo</InputLabel>
                    <Select
                      value={filterVehicle}
                      label="Vozidlo"
                      onChange={e => setFilterVehicle(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {state.vehicles.map((v: any) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.brand} {v.model} ({v.licensePlate})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={filterCompany}
                      label="Firma"
                      onChange={e => setFilterCompany(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {Array.from(new Set(state.vehicles.map((v: any) => v.company))).map((company: any) => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Zákazník"
                    value={filterCustomer}
                    onChange={e => setFilterCustomer(e.target.value)}
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Spôsob platby</InputLabel>
                    <Select
                      value={filterPaymentMethod}
                      label="Spôsob platby"
                      onChange={e => setFilterPaymentMethod(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="cash">Hotovosť</MenuItem>
                      <MenuItem value="bank_transfer">Bankový prevod</MenuItem>
                      <MenuItem value="vrp">VRP</MenuItem>
                      <MenuItem value="direct_to_owner">Priamo majiteľovi</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Dátum od"
                    type="date"
                    value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="Dátum do"
                    type="date"
                    value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Zoskupovať podľa</InputLabel>
                    <Select
                      value={groupBy}
                      label="Zoskupovať podľa"
                      onChange={e => setGroupBy(e.target.value)}
                    >
                      <MenuItem value="">Bez zoskupovania</MenuItem>
                      <MenuItem value="company">Firma</MenuItem>
                      <MenuItem value="paymentMethod">Spôsob platby</MenuItem>
                      <MenuItem value="month">Mesiac</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showActive}
                        onChange={(e) => setShowActive(e.target.checked)}
                      />
                    }
                    label="Aktívne prenájmy"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showTodayReturns}
                        onChange={(e) => setShowTodayReturns(e.target.checked)}
                      />
                    }
                    label="Dnešné vrátenie"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showTomorrowReturns}
                        onChange={(e) => setShowTomorrowReturns(e.target.checked)}
                      />
                    }
                    label="Zajtrajšie vrátenia"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showUnconfirmed}
                        onChange={(e) => setShowUnconfirmed(e.target.checked)}
                      />
                    }
                    label="Nepotvrdené ukončené"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showFuture}
                        onChange={(e) => setShowFuture(e.target.checked)}
                      />
                    }
                    label="Budúce prenájmy"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showOldConfirmed}
                        onChange={(e) => setShowOldConfirmed(e.target.checked)}
                      />
                    }
                    label="Staré ukončené (>30 dní)"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Zobrazených: {filteredRentals.length} z {totalRentalsCount} prenájmov
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Collapse>
        </Box>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filtre a nastavenia</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Vozidlo</InputLabel>
                <Select
                  value={filterVehicle}
                  label="Vozidlo"
                  onChange={e => setFilterVehicle(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {state.vehicles.map((v: any) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.licensePlate})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Firma</InputLabel>
                <Select
                  value={filterCompany}
                  label="Firma"
                  onChange={e => setFilterCompany(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {Array.from(new Set(state.vehicles.map((v: any) => v.company))).map((company: any) => (
                    <MenuItem key={company} value={company}>{company}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Zákazník"
                value={filterCustomer}
                onChange={e => setFilterCustomer(e.target.value)}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Spôsob platby</InputLabel>
                <Select
                  value={filterPaymentMethod}
                  label="Spôsob platby"
                  onChange={e => setFilterPaymentMethod(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  <MenuItem value="cash">Hotovosť</MenuItem>
                  <MenuItem value="bank_transfer">Bankový prevod</MenuItem>
                  <MenuItem value="vrp">VRP</MenuItem>
                  <MenuItem value="direct_to_owner">Priamo majiteľovi</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Dátum od"
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Dátum do"
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Zoskupovať podľa</InputLabel>
                <Select
                  value={groupBy}
                  label="Zoskupovať podľa"
                  onChange={e => setGroupBy(e.target.value)}
                >
                  <MenuItem value="">Bez zoskupovania</MenuItem>
                  <MenuItem value="company">Firma</MenuItem>
                  <MenuItem value="paymentMethod">Spôsob platby</MenuItem>
                  <MenuItem value="month">Mesiac</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showActive}
                    onChange={(e) => setShowActive(e.target.checked)}
                  />
                }
                label="Aktívne prenájmy"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showTodayReturns}
                    onChange={(e) => setShowTodayReturns(e.target.checked)}
                  />
                }
                label="Dnešné vrátenie"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showTomorrowReturns}
                    onChange={(e) => setShowTomorrowReturns(e.target.checked)}
                  />
                }
                label="Zajtrajšie vrátenia"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showUnconfirmed}
                    onChange={(e) => setShowUnconfirmed(e.target.checked)}
                  />
                }
                label="Nepotvrdené ukončené"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showFuture}
                    onChange={(e) => setShowFuture(e.target.checked)}
                  />
                }
                label="Budúce prenájmy"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showOldConfirmed}
                    onChange={(e) => setShowOldConfirmed(e.target.checked)}
                  />
                }
                label="Staré ukončené (>30 dní)"
              />
              <Typography variant="body2" color="text.secondary">
                Zobrazených: {filteredRentals.length} z {totalRentalsCount} prenájmov
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Mobilné zobrazenie - karty */}
      {isMobile ? (
        <Box>
          {filteredRentals.map((rental) => (
            <Card 
              key={rental.id} 
              sx={{ 
                mb: 2, 
                background: getRentalBackgroundColor(rental),
                border: '1px solid',
                borderColor: getRentalPriority(rental) <= 3 ? 'warning.main' : 'divider',
                '&:hover': { 
                  boxShadow: 3,
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              onClick={() => handleShowDetail(rental)}
            >
              <CardContent sx={{ p: 2 }}>
                {/* Hlavička karty */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {rental.vehicle?.licensePlate || 'N/A'} • {rental.vehicle?.company || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Chip 
                      label={getPaymentMethodText(rental.paymentMethod)} 
                      color={getPaymentMethodColor(rental.paymentMethod) as any} 
                      size="small" 
                    />
                    <Chip 
                      label={getRentalStatus(rental).label} 
                      color={getRentalStatus(rental).color as any} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {/* Zákazník a dátumy */}
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {rental.customerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(() => {
                      const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
                      const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
                      const startStr = !isNaN(startDate.getTime()) ? format(startDate, 'dd.MM.yyyy', { locale: sk }) : 'Neplatný dátum';
                      const endStr = !isNaN(endDate.getTime()) ? format(endDate, 'dd.MM.yyyy', { locale: sk }) : 'Neplatný dátum';
                      const days = getRentalDays(rental);
                      return `${startStr} - ${endStr} (${days} dní)`;
                    })()}
                  </Typography>
                </Box>

                {/* Finančné informácie */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cena
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatPrice(rental.totalPrice)} €
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Provízia
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="warning.main">
                      {formatPrice(rental.commission)} €
                    </Typography>
                  </Box>
                </Box>

                {/* Stav uhradenia a akcie */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={rental.paid ? 'Zaplatené' : 'Nezaplatené'} 
                      color={rental.paid ? 'success' : 'error'} 
                      size="small" 
                      variant="outlined"
                    />
                    {getRentalStatus(rental).label === 'Prenájom ukončený' && !rental.confirmed && rental.paid && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          dispatch({ type: 'UPDATE_RENTAL', payload: { ...rental, confirmed: true } }); 
                        }}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Potvrdiť
                      </Button>
                    )}
                  </Box>
                  
                  {/* Akčné tlačidlá */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      size="medium" 
                      onClick={(e) => { e.stopPropagation(); handleEdit(rental); }} 
                      sx={{ 
                        color: 'white',
                        bgcolor: 'primary.main',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        '&:hover': { 
                          bgcolor: 'primary.dark', 
                          borderColor: 'primary.dark',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="medium" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(rental.id); }} 
                      sx={{ 
                        color: 'white',
                        bgcolor: 'error.main',
                        border: '1px solid',
                        borderColor: 'error.main',
                        '&:hover': { 
                          bgcolor: 'error.dark', 
                          borderColor: 'error.dark',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="medium" 
                      onClick={(e) => { e.stopPropagation(); handleCreateHandoverProtocol(rental); }} 
                      sx={{ 
                        color: 'white',
                        bgcolor: 'success.main',
                        border: '1px solid',
                        borderColor: 'success.main',
                        '&:hover': { 
                          bgcolor: 'success.dark', 
                          borderColor: 'success.dark',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="Preberací protokol"
                    >
                      <HandoverProtocolIcon fontSize="small" />
                    </IconButton>
                    {rental.handoverProtocolId && (
                      <IconButton 
                        size="medium" 
                        onClick={(e) => { e.stopPropagation(); handleCreateReturnProtocol(rental); }} 
                        sx={{ 
                          color: 'white',
                          bgcolor: 'warning.main',
                          border: '1px solid',
                          borderColor: 'warning.main',
                          '&:hover': { 
                            bgcolor: 'warning.dark', 
                            borderColor: 'warning.dark',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        title="Vratný protokol"
                      >
                        <ReturnProtocolIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton 
                      size="medium" 
                      onClick={(e) => { e.stopPropagation(); handleShowHistory(rental); }} 
                      sx={{ 
                        color: 'white',
                        bgcolor: 'info.main',
                        border: '1px solid',
                        borderColor: 'info.main',
                        '&:hover': { 
                          bgcolor: 'info.dark', 
                          borderColor: 'info.dark',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="História zmien"
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <ResponsiveTable
              columns={columns}
              data={filteredRentals}
              selectable={true}
              selected={selected}
              onSelectionChange={setSelected}
              onRowClick={handleShowDetail}
              getRowColor={getRentalBackgroundColor}
              emptyMessage="Žiadne prenájmy"
            />
          </CardContent>
        </Card>
      )}

      <Dialog
        open={openDialog}
        onClose={isSaving ? () => {} : () => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRental ? 'Upraviť prenájom' : 'Nový prenájom'}
          {isSaving && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent>
          <RentalForm
            rental={editingRental}
            onSave={handleSave}
            onCancel={isSaving ? () => {} : () => setOpenDialog(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedRentalDetail}
        onClose={handleCloseDetail}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detail prenájmu</DialogTitle>
        <DialogContent>
          {selectedRentalDetail && renderRentalDetail(selectedRentalDetail)}
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button onClick={handleCloseDetail} variant="outlined">Zavrieť</Button>
        </Box>
      </Dialog>

      <Dialog
        open={!!selectedHistoryRental}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>História zmien prenájmu</DialogTitle>
        <DialogContent>
          {selectedHistoryRental?.history && selectedHistoryRental.history.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dátum</TableCell>
                  <TableCell>Používateľ</TableCell>
                  <TableCell>Zmeny</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedHistoryRental.history.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{(() => {
                      const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
                      return !isNaN(date.getTime()) ? format(date, 'dd.MM.yyyy HH:mm') : 'Neplatný dátum';
                    })()}</TableCell>
                    <TableCell>{entry.user}</TableCell>
                    <TableCell>
                      {entry.changes.map((c, i) => (
                        <div key={i}>
                          <b>{c.field}:</b> {String(c.oldValue)} → {String(c.newValue)}
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography>Žiadne zmeny.</Typography>
          )}
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button onClick={handleCloseHistory} variant="outlined">Zavrieť</Button>
        </Box>
      </Dialog>



      {isMobile && (
        <Fab 
          color="primary" 
          aria-label="Pridať"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1201,
            boxShadow: 4,
            width: 56,
            height: 56
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialógy pre protokoly */}
      <Dialog
        open={!!selectedRentalForProtocol && protocolType === 'handover'}
        onClose={handleCloseProtocolDialog}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#1e1e1e',
            color: 'white',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedRentalForProtocol && protocolType === 'handover' && (
            <HandoverProtocolForm
              open={!!selectedRentalForProtocol}
              rental={selectedRentalForProtocol}
              onSave={handleProtocolSubmit}
              onClose={handleCloseProtocolDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedRentalForProtocol && protocolType === 'return'}
        onClose={handleCloseProtocolDialog}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#1e1e1e',
            color: 'white',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedRentalForProtocol && protocolType === 'return' && selectedRentalForProtocol.handoverProtocolId && (
            <ReturnProtocolForm
              open={!!selectedRentalForProtocol}
              rental={selectedRentalForProtocol}
              handoverProtocol={{
                id: selectedRentalForProtocol.handoverProtocolId,
                rentalId: selectedRentalForProtocol.id,
                rental: selectedRentalForProtocol,
                type: 'handover' as const,
                status: 'completed' as const,
                createdAt: new Date(),
                location: selectedRentalForProtocol.handoverPlace || '',
                vehicleCondition: {
                  odometer: selectedRentalForProtocol.odometer || 0,
                  fuelLevel: selectedRentalForProtocol.fuelLevel || 100,
                  fuelType: 'gasoline' as const,
                  exteriorCondition: 'Dobrý',
                  interiorCondition: 'Dobrý',
                  notes: selectedRentalForProtocol.returnConditions || '',
                },
                vehicleImages: [],
                vehicleVideos: [],
                documentImages: [],
                damageImages: [],
                damages: [],
                signatures: [],
                rentalData: {
                  orderNumber: selectedRentalForProtocol.orderNumber || '',
                  vehicle: selectedRentalForProtocol.vehicle || {} as any,
                  customer: selectedRentalForProtocol.customer || {} as any,
                  startDate: selectedRentalForProtocol.startDate,
                  endDate: selectedRentalForProtocol.endDate,
                  totalPrice: selectedRentalForProtocol.totalPrice,
                  deposit: selectedRentalForProtocol.deposit || 0,
                  currency: 'EUR',
                  allowedKilometers: selectedRentalForProtocol.allowedKilometers || 0,
                  extraKilometerRate: selectedRentalForProtocol.extraKilometerRate || 0,
                },
                emailSent: false,
                createdBy: 'admin'
              }}
              onSave={handleProtocolSubmit}
              onClose={handleCloseProtocolDialog}
            />
          )}
          {selectedRentalForProtocol && protocolType === 'return' && !selectedRentalForProtocol.handoverProtocolId && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Nie je možné vytvoriť vratný protokol
              </Typography>
              <Typography variant="body1" sx={{ color: 'gray', mb: 3 }}>
                Pred vytvorením vratného protokolu musí byť vytvorený preberací protokol.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setProtocolType('handover');
                  }}
                >
                  Vytvoriť preberací protokol
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCloseProtocolDialog}
                >
                  Zavrieť
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 