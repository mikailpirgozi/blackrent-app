import {
  Edit2 as EditIcon,
  Mail as EmailIcon,
  Percent as PercentIcon,
  Phone as PhoneIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// MUI imports úspešne odstránené! ✅
import { UnifiedDateRangePicker } from '@/components/ui/unified-date-range-picker';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useCreateCustomer,
  useCustomers,
  useUpdateCustomer,
} from '@/lib/react-query/hooks/useCustomers';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { apiService } from '../../services/api';
import type {
  Customer,
  PaymentMethod,
  Rental,
  RentalPayment,
  Vehicle,
} from '../../types';
import { parseTimezoneFreeDateString } from '../../utils/formatters';
import { calculateRentalDays } from '../../utils/rentalDaysCalculator';
import PriceSummary from './components/PriceSummary';

import EmailParser from './EmailParser';

interface RentalFormProps {
  rental?: Rental | null;
  onSave: (_rental: Rental) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ✅ MIGRÁCIA: Používame centrálnu utility funkciu calculateRentalDays
// Stará implementácia bola nekonzistentná s ostatnými časťami aplikácie

export default function RentalForm({
  rental,
  onSave,
  onCancel,
  isLoading = false,
}: RentalFormProps) {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: customers = [] } = useCustomers();
  const { data: vehicles = [] } = useVehicles();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  // Helper functions for compatibility
  const createCustomer = async (customer: Customer) => {
    return createCustomerMutation.mutateAsync(customer);
  };
  const updateCustomer = async (customer: Customer) => {
    return updateCustomerMutation.mutateAsync(customer);
  };
  // ✅ FIX: Removed unused loadData and dispatch - not needed with React Query
  // Data loading is handled by useVehicles(), useCustomers() hooks
  // State updates are handled by local useState, not global dispatch

  // ═══════════════════════════════════════════════════════════════════
  // 📋 SECTION 1: FORM STATE
  // ═══════════════════════════════════════════════════════════════════
  const [formData, setFormData] = useState<Partial<Rental>>({
    vehicleId: '',
    customerId: '',
    customerName: '',
    startDate: undefined, // ✅ OPRAVENÉ: Žiadny preddefinovaný dátum
    endDate: undefined, // ✅ OPRAVENÉ: Žiadny preddefinovaný dátum
    paymentMethod: 'cash',
    orderNumber: '',
    // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
    isFlexible: false,
    // 🆕 NOVÉ: Súkromný prenájom mimo platformy
    isPrivateRental: false,
  } as Partial<Rental>);

  // ═══════════════════════════════════════════════════════════════════
  // 💰 SECTION 2: PRICING & PAYMENT STATE
  // ═══════════════════════════════════════════════════════════════════
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [manualPrice, setManualPrice] = useState<number | undefined>(undefined);
  const [useManualPricing, setUseManualPricing] = useState(false);
  const [extraKmCharge, setExtraKmCharge] = useState<number>(0);
  const [allowedKilometers, setAllowedKilometers] = useState<number>(0);
  // ✅ OPRAVENÉ: Flag pre zachovanie importovaných hodnôt - inicializuj na true ak existuje rental
  const [preserveImportedValues, setPreserveImportedValues] =
    useState(!!rental);
  const [dailyKilometers, setDailyKilometers] = useState<number>(0);
  const [extraKilometerRate, setExtraKilometerRate] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [paid, setPaid] = useState(false);
  const [payments, setPayments] = useState<RentalPayment[]>(
    rental?.payments || []
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RentalPayment | null>(
    null
  );
  const [showDiscountCommission, setShowDiscountCommission] = useState(false);

  // ═══════════════════════════════════════════════════════════════════
  // 📍 SECTION 3: LOCATION & PLACES STATE
  // ═══════════════════════════════════════════════════════════════════
  const defaultPlaces = useMemo(
    () => [
      'Bratislava',
      'Košice',
      'Žilina',
      'Trnava',
      'Nitra',
      'Banská Bystrica',
      'Prešov',
      'Trenčín',
    ],
    []
  );
  const [handoverPlace, setHandoverPlace] = useState('');
  const [addingPlace, setAddingPlace] = useState(false);
  const [newPlace, setNewPlace] = useState('');
  const [places, setPlaces] = useState<string[]>(defaultPlaces);

  // ═══════════════════════════════════════════════════════════════════
  // 👥 SECTION 4: CUSTOMER & VEHICLE MANAGEMENT STATE
  // ═══════════════════════════════════════════════════════════════════
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // ═══════════════════════════════════════════════════════════════════
  // 📊 SECTION 5: DATA OPTIONS
  // ═══════════════════════════════════════════════════════════════════
  const vehicleOptions = vehicles.map(v => ({
    label: `${v.brand} ${v.model} (${v.licensePlate})${v.vin ? ` - VIN: ${v.vin.slice(-8)}` : ''}`,
    id: v.id,
  }));

  useEffect(() => {
    if (rental) {
      // ✅ OPRAVENÉ: Nastaviť flag PRED nastavením formData aby sa zabránilo useEffect spusteniu
      setPreserveImportedValues(true);

      setFormData({
        ...rental,
        // 🔄 OPTIMALIZOVANÉ: Nastavenie flexibilných polí z existujúceho prenájmu (zjednodušené)
        isFlexible: rental.isFlexible || false,
        flexibleEndDate: rental.flexibleEndDate,
      } as Partial<Rental>);

      // 🐛 FIX: Správne nastavenie ceny - odčítaj doplatok za km z celkovej ceny
      const extraKm = rental.extraKmCharge || 0;
      const basePriceWithoutExtraKm = rental.totalPrice - extraKm;
      // Debug info removed for production
      setCalculatedPrice(basePriceWithoutExtraKm);

      // Calculate commission for existing rental if not already set
      let calculatedCommissionValue = rental.commission || 0;

      // If commission is 0 or missing, calculate it from vehicle data
      if (!calculatedCommissionValue || calculatedCommissionValue === 0) {
        const vehicle = vehicles.find(v => v.id === rental.vehicleId);
        if (vehicle?.commission) {
          if (
            rental.customCommission?.value &&
            rental.customCommission.value > 0
          ) {
            // Use custom commission if set
            if (rental.customCommission.type === 'percentage') {
              calculatedCommissionValue =
                (basePriceWithoutExtraKm * rental.customCommission.value) / 100;
            } else {
              calculatedCommissionValue = rental.customCommission.value;
            }
          } else {
            // Use vehicle's default commission
            if (vehicle.commission.type === 'percentage') {
              calculatedCommissionValue =
                (basePriceWithoutExtraKm * vehicle.commission.value) / 100;
            } else {
              calculatedCommissionValue = vehicle.commission.value;
            }
          }
        }
      }

      setCalculatedCommission(calculatedCommissionValue);

      // State update debug removed

      // 🔄 NOVÉ: Nastavenie manuálnej ceny pre flexibilné prenájmy
      if (rental.isFlexible) {
        setUseManualPricing(true);
        setManualPrice(rental.totalPrice);
      }
      if (rental.extraKmCharge) {
        setExtraKmCharge(rental.extraKmCharge);
      }
      if (rental.allowedKilometers) {
        setAllowedKilometers(rental.allowedKilometers);
        // Ak editujeme existujúci prenájom, pokúsime sa odvodiť denné km
        if (rental.startDate && rental.endDate) {
          const startDate =
            rental.startDate instanceof Date
              ? rental.startDate
              : parseTimezoneFreeDateString(rental.startDate) || new Date();
          const endDate =
            rental.endDate instanceof Date
              ? rental.endDate
              : parseTimezoneFreeDateString(rental.endDate) || new Date();
          const days = calculateRentalDays(startDate, endDate);
          const possibleDailyKm = Math.round(rental.allowedKilometers / days);
          // Nastavíme denné km len ak je to rozumné číslo (napr. deliteľné)
          if (possibleDailyKm * days === rental.allowedKilometers) {
            setDailyKilometers(possibleDailyKm);
            // Daily km derivation debug removed
          }
        }
      }
      if (
        rental.extraKilometerRate !== undefined &&
        rental.extraKilometerRate !== null
      ) {
        setExtraKilometerRate(rental.extraKilometerRate);
      }
      if (rental.deposit) {
        setDeposit(rental.deposit);
      }
      if (typeof rental.paid === 'boolean') setPaid(rental.paid);
      if (rental.handoverPlace) setHandoverPlace(rental.handoverPlace);
      if (
        rental.handoverPlace &&
        !defaultPlaces.includes(rental.handoverPlace)
      ) {
        setPlaces(prev => [...prev, rental.handoverPlace!]);
      }
      if (rental.payments) {
        setPayments(rental.payments);
      }

      // Nastav selectedVehicle ak existuje
      if (rental.vehicleId) {
        const vehicle = vehicles.find(v => v.id === rental.vehicleId);
        setSelectedVehicle(vehicle || null);
      }

      // Nastavenie zákazníka - najprv skúsim nájsť podľa customerId, potom podľa customerName
      if (rental.customerId) {
        const customer = (customers || []).find(
          c => c.id === rental.customerId
        );
        if (customer) {
          setSelectedCustomer(customer);
        } else if (rental.customerName) {
          // Ak sa nenájde zákazník podľa ID, skúsim nájsť podľa mena
          const customerByName = (customers || []).find(
            c => c.name === rental.customerName
          );
          if (customerByName) {
            setSelectedCustomer(customerByName);
            // Aktualizujem customerId v formData
            setFormData(prev => ({ ...prev, customerId: customerByName.id }));
          }
        }
      } else if (rental.customerName) {
        // Ak nemá customerId, ale má customerName, skúsim nájsť zákazníka podľa mena
        const customerByName = (customers || []).find(
          c => c.name === rental.customerName
        );
        if (customerByName) {
          setSelectedCustomer(customerByName);
          // Aktualizujem customerId v formData
          setFormData(prev => ({ ...prev, customerId: customerByName.id }));
        }
      }
    } else {
      // Reset pre nový prenájom
      setSelectedVehicle(null);
    }
  }, [rental, customers, vehicles, defaultPlaces]);

  // Sleduj zmeny vo vehicleId a aktualizuj selectedVehicle
  useEffect(() => {
    if (formData.vehicleId) {
      const vehicle = vehicles.find(v => v.id === formData.vehicleId);

      if (vehicle) {
        // Nastav selectedVehicle ak ešte nie je nastavené
        if (vehicle.id !== selectedVehicle?.id) {
          setSelectedVehicle(vehicle);
        }

        // 🚗 Automaticky nastav extraKilometerRate z vozidla
        if (
          vehicle.extraKilometerRate !== undefined &&
          !preserveImportedValues &&
          extraKilometerRate === 0
        ) {
          setExtraKilometerRate(vehicle.extraKilometerRate);
        }
      }
    } else if (selectedVehicle) {
      setSelectedVehicle(null);
    }
  }, [
    formData.vehicleId,
    vehicles,
    selectedVehicle?.id,
    preserveImportedValues,
    extraKilometerRate,
    selectedVehicle,
  ]);

  const handleInputChange = (field: keyof Rental, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Reset preserveImportedValues when user changes discount or commission
    if (field === 'discount' || field === 'customCommission') {
      // Reset debug removed
      setPreserveImportedValues(false);
    }
  };

  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        // Nechám customerName nezmenené, aby používateľ mohol pokračovať v písaní
      }));
    }
  };

  const handleAddCustomer = () => {
    setCustomerDialogOpen(true);
  };

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      await createCustomer(customer);
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
      }));
      setCustomerDialogOpen(false);
    } catch (error) {
      console.error('Chyba pri vytváraní zákazníka:', error);
    }
  };

  const handleCallCustomer = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleEmailCustomer = (email: string) => {
    if (email) {
      window.open(`mailto:${email}`, '_self');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditCustomerDialogOpen(true);
  };

  const handleSaveEditedCustomer = async (customer: Customer) => {
    try {
      setSavingCustomer(true);
      await updateCustomer(customer);
      setSelectedCustomer(customer);

      // 📧 CRITICAL FIX: Aktualizuj formData s novými customer údajmi
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
      }));

      // ✅ React Query automaticky refreshne dáta cez invalidateQueries v useUpdateCustomer

      setEditCustomerDialogOpen(false);
      setEditingCustomer(null);
      window.alert('Zákazník bol úspešne upravený!');
    } catch (error) {
      console.error('Chyba pri aktualizácii zákazníka:', error);
      window.alert('Chyba pri aktualizácii zákazníka. Skúste to znovu.');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleEmailParseSuccess = async (
    rentalData: Partial<Rental>,
    customerData?: Customer
  ) => {
    // Pridanie nového zákazníka ak neexistuje
    if (customerData) {
      const existingCustomer = (customers || []).find(
        c =>
          c.name.toLowerCase() === customerData.name.toLowerCase() ||
          c.email === customerData.email
      );

      if (!existingCustomer) {
        try {
          await createCustomer(customerData);
        } catch (error) {
          console.error('Chyba pri vytváraní zákazníka z emailu:', error);
        }
      }
    }

    // Aktualizácia formulára s parsovanými dátami
    setFormData(
      prev =>
        ({
          ...prev,
          ...rentalData,
          customerName: rentalData.customerName || prev.customerName,
          orderNumber: rentalData.orderNumber || prev.orderNumber,
        }) as Partial<Rental>
    );

    // Nastav selectedVehicle ak bolo parsované vozidlo
    if (rentalData.vehicleId) {
      const vehicle = vehicles.find(v => v.id === rentalData.vehicleId);
      setSelectedVehicle(vehicle || null);
    }

    // Nastavenie zákazníka ak bol nájdený alebo vytvorený
    if (customerData) {
      const finalCustomer =
        (customers || []).find(
          c =>
            c.name.toLowerCase() === customerData.name.toLowerCase() ||
            c.email === customerData.email
        ) || customerData;

      setSelectedCustomer(finalCustomer);
      setFormData(prev => ({
        ...prev,
        customerId: finalCustomer.id,
      }));
    }

    // Nastavenie ceny ak bola parsovaná
    if (rentalData.totalPrice) {
      setCalculatedPrice(rentalData.totalPrice);
    }

    // Nastavenie depozitu ak bol parsovaný
    if (rentalData.deposit) {
      setDeposit(rentalData.deposit);
    }

    // Nastavenie kilometrov a ceny za extra km z parsovaných dát
    if (rentalData.dailyKilometers) {
      // Všetky km z emailu sa nastavujú ako denné km (automaticky sa prepočítajú celkové)
      setDailyKilometers(rentalData.dailyKilometers);
      // Daily km from email debug removed
    }
    // Odstránená logika pre allowedKilometers - všetko sa teraz parsuje ako dailyKilometers
    if (rentalData.extraKilometerRate) {
      setExtraKilometerRate(rentalData.extraKilometerRate);
    }

    // Nastavenie miesta odovzdania ak bolo parsované
    if (rentalData.handoverPlace) {
      setHandoverPlace(rentalData.handoverPlace);
      if (!places.includes(rentalData.handoverPlace)) {
        setPlaces(prev => [...prev, rentalData.handoverPlace!]);
      }
    }

    window.alert('Dáta z emailu boli úspešne načítané do formulára!');
  };

  // NEW: Auto-calculate total kilometers based on daily km and rental duration
  useEffect(() => {
    if (dailyKilometers > 0 && formData.startDate && formData.endDate) {
      // Safe date conversion
      const startDate =
        formData.startDate instanceof Date
          ? formData.startDate
          : parseTimezoneFreeDateString(formData.startDate) || new Date();
      const endDate =
        formData.endDate instanceof Date
          ? formData.endDate
          : parseTimezoneFreeDateString(formData.endDate) || new Date();
      const rentalDays = calculateRentalDays(startDate, endDate);
      const totalKm = dailyKilometers * rentalDays;
      setAllowedKilometers(totalKm);
      // Auto-calculated km debug removed
    }
  }, [dailyKilometers, formData.startDate, formData.endDate]);

  useEffect(() => {
    // ✅ OPRAVENÉ: Neprepisuj importované hodnoty, ale povoľ prepočítavanie pri zmene discount/commission
    if (
      preserveImportedValues &&
      !formData.discount &&
      !formData.customCommission
    ) {
      // Skip debug removed
      return;
    }

    // Ak používateľ mení discount alebo commission, povoľ prepočítavanie
    if (
      preserveImportedValues &&
      (formData.discount || formData.customCommission)
    ) {
      // Allow debug removed
      setPreserveImportedValues(false);
    }

    // Effect run debug removed

    if (!formData.vehicleId || !formData.startDate || !formData.endDate) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (!vehicle) {
      // ✅ OPRAVENÉ: Neprepisuj ceny ak sú zachované importované hodnoty
      if (!preserveImportedValues) {
        setCalculatedPrice(0);
        setCalculatedCommission(0);
      }
      return;
    }

    // ✅ MIGRÁCIA: Používame centrálnu utility funkciu calculateRentalDays
    // Toto zabezpečí konzistentný výpočet dní pre cenu aj kilometre
    const startDate =
      formData.startDate instanceof Date
        ? formData.startDate
        : parseTimezoneFreeDateString(formData.startDate) || new Date();
    const endDate =
      formData.endDate instanceof Date
        ? formData.endDate
        : parseTimezoneFreeDateString(formData.endDate) || new Date();

    const days = calculateRentalDays(startDate, endDate);

    const pricingTier = vehicle.pricing?.find(
      (tier: { minDays: number; maxDays: number; pricePerDay: number }) =>
        days >= tier.minDays && days <= tier.maxDays
    );

    if (pricingTier && vehicle.pricing && vehicle.pricing.length > 0) {
      const basePrice = days * pricingTier.pricePerDay;
      // Zľava
      let discount = 0;
      if (formData.discount?.value && formData.discount.value > 0) {
        if (formData.discount.type === 'percentage') {
          discount = (basePrice * formData.discount.value) / 100;
        } else {
          discount = formData.discount.value;
        }
      }
      // Doplatok za km
      const extra = extraKmCharge > 0 ? extraKmCharge : 0;
      // 🐛 FIX: calculatedPrice = len základná cena (bez doplatku za km)
      const basePriceAfterDiscount = Math.max(0, basePrice - discount);
      setCalculatedPrice(basePriceAfterDiscount);
      // Celková cena = základná cena + doplatok za km
      const totalPrice = basePriceAfterDiscount + extra;

      // Provízia
      let commission = 0;
      if (
        formData.customCommission?.value &&
        formData.customCommission.value > 0
      ) {
        if (formData.customCommission.type === 'percentage') {
          commission = (totalPrice * formData.customCommission.value) / 100;
        } else {
          commission = formData.customCommission.value;
        }
      } else {
        if (vehicle.commission.type === 'percentage') {
          commission = (totalPrice * vehicle.commission.value) / 100;
        } else {
          commission = vehicle.commission.value;
        }
      }
      setCalculatedCommission(commission);
    } else {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
    }
  }, [
    formData.vehicleId,
    formData.startDate,
    formData.endDate,
    formData.discount,
    extraKmCharge,
    formData.customCommission,
    vehicles,
    preserveImportedValues,
  ]);

  const handleAddPayment = () => {
    setEditingPayment({
      id: uuidv4(),
      date: new Date(),
      amount: 0,
      isPaid: false,
      paymentMethod: 'cash',
      note: '',
      invoiceNumber: '',
    });
    setPaymentDialogOpen(true);
  };

  const handleEditPayment = (payment: RentalPayment) => {
    setEditingPayment(payment);
    setPaymentDialogOpen(true);
  };

  const handleDeletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleSavePayment = (payment: RentalPayment) => {
    setPayments(prev => {
      const exists = prev.find(p => p.id === payment.id);
      if (exists) {
        return prev.map(p => (p.id === payment.id ? payment : p));
      } else {
        return [...prev, payment];
      }
    });
    setPaymentDialogOpen(false);
    setEditingPayment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zabráň viacnásobnému odoslaniu formulára
    if (isLoading) {
      return;
    }

    const vehicle = formData.vehicleId
      ? vehicles.find(v => v.id === formData.vehicleId)
      : undefined;

    // Validácia - musí byť zadané meno zákazníka
    if (!formData.customerName?.trim()) {
      window.alert('Meno zákazníka je povinné');
      return;
    }

    // Validácia - vozidlo musí byť vybrané
    if (!formData.vehicleId?.trim()) {
      window.alert('Výber vozidla je povinný');
      return;
    }

    // 🔄 NOVÁ VALIDÁCIA: Pre flexibilné prenájmy
    if (formData.isFlexible) {
      if (!formData.flexibleEndDate) {
        window.alert(
          'Pre flexibilný prenájom je potrebné zadať odhadovaný dátum vrátenia'
        );
        return;
      }
      // Pre flexibilné prenájmy nastavíme endDate na flexibleEndDate + 1 rok
      if (!formData.endDate) {
        const flexEndDate = new Date(formData.flexibleEndDate);
        const oneYearLater = new Date(
          flexEndDate.getTime() + 365 * 24 * 60 * 60 * 1000
        );
        formData.endDate = oneYearLater;
      }
    } else {
      // Pre štandardné prenájmy je endDate povinné
      if (!formData.endDate) {
        window.alert('Dátum ukončenia je povinný pre štandardný prenájom');
        return;
      }
    }

    // Ak máme customerName ale nemáme customerId, vytvorím nového zákazníka
    let finalCustomer = selectedCustomer;
    let finalCustomerId = formData.customerId;

    if (formData.customerName && !formData.customerId) {
      // Skontrolujem, či už existuje zákazník s týmto menom
      const existingCustomer = (customers || []).find(
        c => c.name === formData.customerName
      );
      if (existingCustomer) {
        finalCustomer = existingCustomer;
        finalCustomerId = existingCustomer.id;
      } else {
        // Vytvorím nového zákazníka
        const newCustomer: Customer = {
          id: uuidv4(),
          name: formData.customerName,
          email: '',
          phone: '',
          createdAt: new Date(),
        };
        await createCustomer(newCustomer);
        finalCustomer = newCustomer;
        finalCustomerId = newCustomer.id;
      }
    }

    // 🆕 NOVÉ: Ak je súkromný prenájom, ulož ako nedostupnosť
    if (formData.isPrivateRental) {
      try {
        await apiService.createVehicleUnavailability({
          vehicleId: formData.vehicleId || '',
          startDate:
            formData.startDate instanceof Date
              ? formData.startDate
              : new Date(formData.startDate || new Date()),
          endDate:
            formData.endDate instanceof Date
              ? formData.endDate
              : new Date(formData.endDate || new Date()),
          reason: `Súkromný prenájom: ${formData.customerName}`,
          type: 'private_rental',
          notes: `Prenájom mimo BlackRent platformy. Zákazník: ${formData.customerName}. ${handoverPlace ? `Miesto: ${handoverPlace}` : ''}`,
          priority: 2,
        });

        // Refresh dostupnosti
        window.location.reload(); // Dočasné riešenie pre refresh
        return;
      } catch (error) {
        console.error('Chyba pri vytváraní súkromného prenájmu:', error);
        window.alert('Chyba pri vytváraní súkromného prenájmu');
        return;
      }
    }

    const completeRental = {
      id: rental?.id || uuidv4(),
      vehicleId: formData.vehicleId || undefined,
      vehicle: vehicle,
      customerId: finalCustomerId || undefined,
      customer: finalCustomer || undefined,
      customerName: formData.customerName || '',
      startDate: formData.startDate || new Date(),
      endDate: formData.endDate || new Date(),
      totalPrice:
        formData.isFlexible && useManualPricing && manualPrice !== undefined
          ? manualPrice
          : calculatedPrice + extraKmCharge,
      commission: calculatedCommission,
      paymentMethod: formData.paymentMethod || 'cash',
      createdAt: rental?.createdAt || new Date(),
      discount:
        formData.discount?.value && formData.discount.value > 0
          ? formData.discount
          : undefined,
      customCommission:
        formData.customCommission?.value && formData.customCommission.value > 0
          ? formData.customCommission
          : undefined,
      extraKmCharge: extraKmCharge > 0 ? extraKmCharge : undefined,
      allowedKilometers: allowedKilometers > 0 ? allowedKilometers : undefined,
      extraKilometerRate:
        extraKilometerRate !== undefined ? extraKilometerRate : undefined,
      deposit: deposit > 0 ? deposit : undefined,
      paid,
      status: rental?.status || 'pending',
      handoverPlace: handoverPlace.trim() || undefined,
      payments: payments,
      orderNumber: formData.orderNumber || '',
      // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
      isFlexible: formData.isFlexible || false,
      flexibleEndDate: formData.flexibleEndDate,
    };
    onSave(completeRental as Rental);
  };

  // Removed unused availableVehicles variable

  // ════════════════════════════════════════════════════════════════════════════════
  // 🎨 RENDER - MAIN FORM UI
  // ════════════════════════════════════════════════════════════════════════════════
  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-4 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Email Parser komponent */}
      <EmailParser
        onParseSuccess={handleEmailParseSuccess}
        vehicles={vehicles}
        customers={customers || []}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vozidlo */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="vehicle-select">Vozidlo *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="vehicle-select"
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                {formData.vehicleId
                  ? vehicleOptions.find(v => v.id === formData.vehicleId)?.label
                  : 'Vyberte vozidlo...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[500px] p-0"
              align="start"
              side="bottom"
              onWheel={e => e.stopPropagation()}
            >
              <Command shouldFilter={false} className="overflow-visible">
                <CommandInput
                  placeholder="Hľadať vozidlo podľa značky, modelu alebo ŠPZ..."
                  className="h-10"
                  onValueChange={searchValue => {
                    // Custom filtering
                    const filtered = vehicles.filter(v => {
                      const searchLower = searchValue.toLowerCase();
                      const vehicleText =
                        `${v.brand} ${v.model} ${v.licensePlate} ${v.vin || ''}`.toLowerCase();
                      return vehicleText.includes(searchLower);
                    });
                    // Store filtered results for rendering
                    setFilteredVehicles(filtered);
                  }}
                />
                <CommandList
                  className="max-h-[300px] overflow-y-auto scrollbar-thin"
                  style={{
                    overflowY: 'auto',
                    maxHeight: '300px',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <CommandEmpty>Žiadne vozidlo nenájdené.</CommandEmpty>
                  <CommandGroup>
                    {(filteredVehicles.length > 0
                      ? filteredVehicles
                      : vehicles
                    ).map(vehicle => (
                      <CommandItem
                        key={vehicle.id}
                        value={vehicle.id}
                        onSelect={() => {
                          handleInputChange('vehicleId', vehicle.id);
                          setSelectedVehicle(vehicle);
                          setPreserveImportedValues(false);
                          // Close popover
                          document.getElementById('vehicle-select')?.click();
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col w-full">
                          <span className="font-medium">
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              ŠPZ: {vehicle.licensePlate}
                            </span>
                            {vehicle.vin && (
                              <span className="text-xs text-muted-foreground">
                                VIN: ...{vehicle.vin.slice(-8)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Informácia o majiteľovi vozidla */}
        {selectedVehicle && (
          <div className="col-span-full mt-2">
            <p className="text-sm text-muted-foreground mb-1">
              Informácie o vozidle:
            </p>
            <div className="flex gap-2 flex-wrap items-center">
              <Badge variant="outline">
                Majiteľ: {selectedVehicle.company}
              </Badge>
              <Badge variant="outline" className="border-purple-500">
                ŠPZ: {selectedVehicle.licensePlate}
              </Badge>
              {selectedVehicle.vin && (
                <Badge variant="outline" className="font-mono text-xs">
                  VIN: {selectedVehicle.vin}
                </Badge>
              )}
              <Badge variant="outline" className="border-blue-500">
                Provízia:{' '}
                {selectedVehicle.commission.type === 'percentage'
                  ? selectedVehicle.commission.value + '%'
                  : selectedVehicle.commission.value + '€'}
              </Badge>
            </div>
            <p className="text-sm text-green-600 font-bold mt-2">
              ✓ Platba automaticky nastavená priamo majiteľovi vozidla
            </p>
          </div>
        )}

        {/* TextField pre zadanie mena zákazníka */}
        <div>
          <Label htmlFor="customer-name">Meno zákazníka *</Label>
          <Input
            id="customer-name"
            value={formData.customerName || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const name = e.target.value;
              setFormData(prev => ({ ...prev, customerName: name }));
              // Ak sa zadá meno, ktoré už existuje, automaticky ho vyberiem
              const existingCustomer = (customers || []).find(
                c => c.name === name
              );
              if (existingCustomer) {
                handleCustomerChange(existingCustomer);
              } else {
                // Ak sa nenájde existujúci zákazník, vyčistím customerId
                setFormData(prev => ({ ...prev, customerId: '' }));
                setSelectedCustomer(null);
              }
            }}
            placeholder="Zadajte meno zákazníka alebo vyberte z existujúcich"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formData.customerId
              ? 'Vybraný zákazník z existujúcich'
              : 'Ak zákazník neexistuje, bude automaticky vytvorený pri uložení'}
          </p>
        </div>

        {/* Výber z existujúcich zákazníkov s vyhľadávaním */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="customer-select">
            Výber z existujúcich zákazníkov
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="customer-select"
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                {selectedCustomer
                  ? selectedCustomer.name
                  : 'Vyberte zákazníka...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[500px] p-0"
              align="start"
              side="bottom"
              onWheel={e => e.stopPropagation()}
            >
              <Command shouldFilter={false} className="overflow-visible">
                <CommandInput
                  placeholder="Hľadať zákazníka podľa mena, emailu alebo telefónu..."
                  className="h-10"
                  onValueChange={searchValue => {
                    // Custom filtering
                    const filtered = customers.filter(c => {
                      const searchLower = searchValue.toLowerCase();
                      const customerText =
                        `${c.name} ${c.email || ''} ${c.phone || ''}`.toLowerCase();
                      return customerText.includes(searchLower);
                    });
                    // Store filtered results for rendering
                    setFilteredCustomers(filtered);
                  }}
                />
                <CommandList
                  className="max-h-[300px] overflow-y-auto scrollbar-thin"
                  style={{
                    overflowY: 'auto',
                    maxHeight: '300px',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <CommandEmpty>Žiadni zákazníci nenájdení.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="__add_new__"
                      onSelect={() => {
                        handleAddCustomer();
                        document.getElementById('customer-select')?.click();
                      }}
                      className="cursor-pointer border-b"
                    >
                      <div className="flex items-center gap-2 w-full py-1">
                        <span className="text-primary font-medium">
                          + Pridať nového zákazníka
                        </span>
                      </div>
                    </CommandItem>
                    {(filteredCustomers.length > 0
                      ? filteredCustomers
                      : customers
                    ).map(customer => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => {
                          handleCustomerChange(customer);
                          document.getElementById('customer-select')?.click();
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col w-full">
                          <span className="font-medium">{customer.name}</span>
                          <div className="flex gap-3 mt-1">
                            {customer.email && (
                              <span className="text-xs text-muted-foreground">
                                ✉ {customer.email}
                              </span>
                            )}
                            {customer.phone && (
                              <span className="text-xs text-muted-foreground">
                                ☎ {customer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground">
            Píšte pre vyhľadávanie alebo vyberte zo zoznamu
          </p>
        </div>

        {/* Kontaktné údaje zákazníka */}
        {selectedCustomer && (
          <div className="col-span-full mt-2">
            <p className="text-sm text-muted-foreground mb-1">
              Kontaktné údaje:
            </p>
            <div className="flex gap-2 flex-wrap items-center">
              {selectedCustomer.phone && (
                <Badge
                  variant="default"
                  className="cursor-pointer hover:bg-primary/90 flex items-center gap-1"
                  onClick={() => handleCallCustomer(selectedCustomer.phone)}
                >
                  <PhoneIcon className="w-3 h-3" />
                  {selectedCustomer.phone}
                </Badge>
              )}
              {selectedCustomer.email && (
                <Badge
                  variant="default"
                  className="cursor-pointer hover:bg-primary/90 flex items-center gap-1"
                  onClick={() => handleEmailCustomer(selectedCustomer.email)}
                >
                  <EmailIcon className="w-3 h-3" />
                  {selectedCustomer.email}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditCustomer(selectedCustomer)}
                className="ml-2"
              >
                Upraviť zákazníka
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (selectedCustomer) {
                    await updateCustomer(selectedCustomer);
                    window.alert('Zákazník bol úspešne uložený!');
                  }
                }}
                className="ml-2"
              >
                Uložiť zákazníka
              </Button>
            </div>
          </div>
        )}

        {/* Informácia o novom zákazníkovi */}
        {formData.customerName && !selectedCustomer && (
          <div className="col-span-full mt-2">
            <p className="text-sm text-muted-foreground mb-1">Nový zákazník:</p>
            <p className="text-sm text-muted-foreground">
              {formData.customerName} - bude automaticky vytvorený pri uložení
              prenájmu
            </p>
          </div>
        )}

        {/* Číslo objednávky - odstránený FormControl a InputLabel */}
        <div>
          <Label htmlFor="order-number">Číslo objednávky</Label>
          <Input
            id="order-number"
            value={formData.orderNumber || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, orderNumber: e.target.value }))
            }
          />
        </div>

        {/* Spôsob platby */}
        <div>
          <Label htmlFor="payment-method">Spôsob platby</Label>
          <Select
            value={formData.paymentMethod || 'cash'}
            onValueChange={value =>
              handleInputChange('paymentMethod', value as PaymentMethod)
            }
          >
            <SelectTrigger id="payment-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Hotovosť</SelectItem>
              <SelectItem value="bank_transfer">Bankový prevod</SelectItem>
              <SelectItem value="vrp">VRP</SelectItem>
              <SelectItem value="direct_to_owner">Priamo majiteľovi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <UnifiedDateRangePicker
          label="Dátum a čas prenájmu"
          value={{
            from: formData.startDate
              ? parseTimezoneFreeDateString(formData.startDate)
              : null,
            to: formData.endDate
              ? parseTimezoneFreeDateString(formData.endDate)
              : null,
          }}
          onChange={newValue => {
            if (newValue.from) {
              handleInputChange('startDate', newValue.from);
            }
            if (newValue.to) {
              handleInputChange('endDate', newValue.to);
            }
            // ✅ Povoliť prepočítanie cien pri zmene dátumu
            setPreserveImportedValues(false);
          }}
          required
          className="w-full col-span-full"
          defaultTime="08:00"
        />

        {/* 🔄 NOVÉ: Flexibilné prenájmy sekcia */}
        <div className="col-span-full mt-4 mb-4">
          <Card
            className={`p-4 ${
              formData.isFlexible
                ? 'bg-yellow-50 border-2 border-yellow-500 shadow-lg'
                : 'border'
            }`}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              🔄 Flexibilný prenájom
              <Badge
                className={
                  formData.isFlexible ? 'bg-yellow-500 text-white' : ''
                }
                variant={formData.isFlexible ? 'default' : 'secondary'}
              >
                {formData.isFlexible ? 'AKTÍVNY' : 'ŠTANDARDNÝ'}
              </Badge>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <div>
                  <Label htmlFor="rental-type">Typ prenájmu</Label>
                  <Select
                    value={formData.isFlexible ? 'flexible' : 'standard'}
                    onValueChange={(value: string) => {
                      const rentalType = value as 'standard' | 'flexible';
                      const isFlexible = rentalType === 'flexible';
                      handleInputChange('isFlexible', isFlexible);

                      // 🔄 OPTIMALIZOVANÉ: Automaticky zapnúť manuálnu cenotvorbu pre flexibilné prenájmy
                      if (isFlexible) {
                        setUseManualPricing(true);
                        if (manualPrice === undefined) {
                          setManualPrice(calculatedPrice || 0);
                        }
                        // 🔄 OPTIMALIZOVANÉ: Automaticky vyčistiť pole "Dátum do"
                        handleInputChange('endDate', undefined);
                      } else {
                        setUseManualPricing(false);
                      }
                    }}
                  >
                    <SelectTrigger id="rental-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        🔒 Štandardný prenájom
                      </SelectItem>
                      <SelectItem value="flexible">
                        🔄 Flexibilný prenájom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 🆕 NOVÉ: Súkromný prenájom checkbox */}
              <div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="private-rental"
                    checked={formData.isPrivateRental || false}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange('isPrivateRental', checked as boolean)
                    }
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="private-rental"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-sm">
                        🔒 Súkromný prenájom (mimo BlackRent platformy)
                      </span>
                      <Badge className="bg-purple-600 text-white text-xs">
                        FIALOVÁ FARBA
                      </Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Prenájom sa zobrazí vo fialovej farbe v dostupnosti a
                      nebude sa počítať do štatistík platformy
                    </p>
                  </div>
                </div>
              </div>

              {formData.isFlexible && (
                <>
                  <div className="md:col-span-1">
                    <DateTimePicker
                      label="Odhadovaný dátum a čas vrátenia"
                      value={
                        formData.flexibleEndDate
                          ? parseTimezoneFreeDateString(
                              formData.flexibleEndDate
                            )
                          : null
                      }
                      onChange={(newValue: Date | null) => {
                        handleInputChange('flexibleEndDate', newValue);
                      }}
                      className="w-full"
                      placeholder="Orientačný dátum ukončenia"
                    />
                  </div>

                  {/* Priorita prepísania odstránená - zjednodušené flexible rentals */}

                  <div className="col-span-full">
                    <Card className="p-4 bg-gray-50">
                      <h4 className="font-semibold mb-2">
                        💰 Cenotvorba pre flexibilný prenájom
                      </h4>

                      <div className="mb-4">
                        <Label htmlFor="pricing-type">Typ cenotvorby</Label>
                        <Select
                          value={useManualPricing ? 'manual' : 'automatic'}
                          onValueChange={(value: string) => {
                            const isManual = value === 'manual';
                            setUseManualPricing(isManual);
                            if (isManual && manualPrice === undefined) {
                              setManualPrice(calculatedPrice || 0);
                            }
                          }}
                        >
                          <SelectTrigger id="pricing-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="automatic">
                              🤖 Automatická (štandardná)
                            </SelectItem>
                            <SelectItem value="manual">
                              ✋ Manuálna (individuálna)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {useManualPricing && (
                        <div>
                          <Label htmlFor="manual-price">Manuálna cena</Label>
                          <div className="relative">
                            <Input
                              id="manual-price"
                              type="number"
                              value={manualPrice || ''}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                const value = parseFloat(e.target.value) || 0;
                                setManualPrice(value);
                              }}
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              €
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Zadajte individuálnu cenu pre tento flexibilný
                            prenájom
                          </p>
                        </div>
                      )}

                      {!useManualPricing && (
                        <p className="text-sm text-muted-foreground">
                          Automatická cena:{' '}
                          <strong className="font-semibold">
                            {calculatedPrice || 0}€
                          </strong>
                        </p>
                      )}
                    </Card>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Miesto odovzdania */}
        <div>
          <Label htmlFor="handover-place">Miesto odovzdania vozidla</Label>
          <Select
            value={handoverPlace}
            onValueChange={(value: string) => {
              if (value === '__add_new__') {
                setAddingPlace(true);
              } else {
                setHandoverPlace(value);
              }
            }}
          >
            <SelectTrigger id="handover-place">
              <SelectValue placeholder="Vyberte miesto" />
            </SelectTrigger>
            <SelectContent>
              {places.map(place => (
                <SelectItem key={place} value={place}>
                  {place}
                </SelectItem>
              ))}
              <SelectItem value="__add_new__">
                <em>+ Pridať nové miesto</em>
              </SelectItem>
            </SelectContent>
          </Select>
          {addingPlace && (
            <div className="flex gap-2 mt-2">
              <Input
                autoFocus
                placeholder="Nové miesto"
                value={newPlace}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPlace(e.target.value)
                }
              />
              <Button
                variant="default"
                size="sm"
                disabled={!newPlace.trim()}
                onClick={() => {
                  setPlaces(prev => [...prev, newPlace.trim()]);
                  setHandoverPlace(newPlace.trim());
                  setNewPlace('');
                  setAddingPlace(false);
                }}
              >
                Pridať
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddingPlace(false);
                  setNewPlace('');
                }}
              >
                Zrušiť
              </Button>
            </div>
          )}
        </div>

        {/* Denné kilometry - NOVÉ POLE */}
        <div>
          <Label htmlFor="daily-km">Denné kilometry</Label>
          <div className="relative">
            <Input
              id="daily-km"
              type="number"
              value={dailyKilometers}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const daily = Number(e.target.value) || 0;
                setDailyKilometers(daily);

                // Ak sú zadané denné km, vyčisti manuálne celkové km
                if (daily > 0) {
                  // Celkové km sa automaticky prepočítajú cez useEffect
                } else {
                  // Ak sú denné km 0, umožni manuálne zadanie celkových km
                  setAllowedKilometers(0);
                }
              }}
              placeholder="250"
              className={dailyKilometers > 0 ? 'bg-green-50' : ''}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              km/deň
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Automaticky sa prepočítajú na celkové km podľa dĺžky prenájmu
          </p>
        </div>

        {/* Povolené kilometry - CELKOVÉ */}
        <div>
          <Label htmlFor="allowed-km">
            {dailyKilometers > 0
              ? 'Celkové kilometry (automaticky)'
              : 'Celkové kilometry'}
          </Label>
          <div className="relative">
            <Input
              id="allowed-km"
              type="number"
              value={allowedKilometers}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                // Ak sú zadané denné km, nepovoľ manuálnu zmenu celkových
                if (dailyKilometers > 0) {
                  return; // Ignoruj zmenu
                }
                setAllowedKilometers(Number(e.target.value) || 0);
              }}
              readOnly={dailyKilometers > 0}
              placeholder="0 = neobmedzené"
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              km
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {dailyKilometers > 0
              ? `Automaticky: ${dailyKilometers} km/deň × ${
                  formData.startDate && formData.endDate
                    ? (() => {
                        // Safe date conversion for helper text
                        const startDate =
                          formData.startDate instanceof Date
                            ? formData.startDate
                            : parseTimezoneFreeDateString(formData.startDate) ||
                              new Date();
                        const endDate =
                          formData.endDate instanceof Date
                            ? formData.endDate
                            : parseTimezoneFreeDateString(formData.endDate) ||
                              new Date();
                        return calculateRentalDays(startDate, endDate);
                      })()
                    : '?'
                } dní`
              : '0 znamená neobmedzené kilometry'}
          </p>
        </div>

        {/* Cena za extra km */}
        <div>
          <Label htmlFor="extra-km-rate">Cena za extra km (€)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              €
            </span>
            <Input
              id="extra-km-rate"
              type="number"
              step="0.1"
              value={extraKilometerRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value.replace(',', '.'); // Nahraď čiarku bodkou
                setExtraKilometerRate(Number(value) || 0);
              }}
              placeholder="0"
              className="pl-8 pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              / km
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cena za každý kilometer nad povolený limit
          </p>
        </div>

        {/* Výška depozitu */}
        <div>
          <Label htmlFor="deposit">Výška depozitu (€)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              €
            </span>
            <Input
              id="deposit"
              type="number"
              value={deposit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDeposit(Number(e.target.value) || 0)
              }
              placeholder="0"
              className="pl-8"
            />
          </div>
        </div>

        {/* Uhradené */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="paid-checkbox"
            checked={paid}
            onCheckedChange={checked => setPaid(checked as boolean)}
          />
          <Label htmlFor="paid-checkbox" className="cursor-pointer">
            Prenájom uhradený
          </Label>
        </div>
      </div>

      <div className="col-span-full mt-6">
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Výpočet ceny</h3>
            <PriceSummary
              calculatedPrice={calculatedPrice}
              extraKmCharge={extraKmCharge}
              calculatedCommission={calculatedCommission}
              discount={formData.discount}
              showOriginalPrice={true}
            />
            {/* Nadpis sekcie s ikonou na zobrazenie/skrytie zľavy/provízie */}
            <div className="flex items-center mb-2">
              <h3 className="text-base font-semibold flex-grow">
                Zľava / Provízia
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDiscountCommission(prev => !prev)}
                className="h-8 w-8 p-0"
              >
                {showDiscountCommission ? (
                  <PercentIcon className="h-4 w-4" />
                ) : (
                  <EditIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            {/* Polia pre zľavu a províziu - zobrazia sa až po kliknutí */}
            {showDiscountCommission && (
              <>
                {/* Zľava */}
                <div className="flex gap-2 mb-2">
                  <div className="min-w-[80px]">
                    <Label htmlFor="discount-type">Zľava</Label>
                    <Select
                      value={formData.discount?.type || ''}
                      onValueChange={(value: string) =>
                        handleInputChange('discount', {
                          ...formData.discount,
                          type: value,
                        })
                      }
                    >
                      <SelectTrigger id="discount-type" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">€</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="max-w-[100px]">
                    <Label htmlFor="discount-value">Hodnota</Label>
                    <Input
                      id="discount-value"
                      type="number"
                      value={formData.discount?.value || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('discount', {
                          ...formData.discount,
                          value: Number(e.target.value),
                        })
                      }
                      className="h-9"
                    />
                  </div>
                </div>
                {/* Provízia */}
                <div className="flex gap-2 mb-2">
                  <div className="min-w-[120px]">
                    <Label htmlFor="commission-type">Provízia</Label>
                    <Select
                      value={formData.customCommission?.type || ''}
                      onValueChange={(value: string) =>
                        handleInputChange('customCommission', {
                          ...formData.customCommission,
                          type: value,
                        })
                      }
                    >
                      <SelectTrigger id="commission-type" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">€</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="max-w-[100px]">
                    <Label htmlFor="commission-value">Hodnota</Label>
                    <Input
                      id="commission-value"
                      type="number"
                      value={formData.customCommission?.value || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('customCommission', {
                          ...formData.customCommission,
                          value: Number(e.target.value),
                        })
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </>
            )}
            {/* Doplatok za km */}
            <div className="mt-4 flex gap-4 items-center">
              <span>Doplatok za km (€):</span>
              <Input
                type="number"
                value={extraKmCharge}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExtraKmCharge(Number(e.target.value))
                }
                className="w-[120px]"
                min={0}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pridám sekciu Platby pod výpočet ceny */}
      <div className="col-span-full mt-6">
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Platby (splátky)</h3>
            <Button
              variant="outline"
              onClick={handleAddPayment}
              className="mb-4"
            >
              Pridať platbu
            </Button>
            {payments.length === 0 ? (
              <p className="text-muted-foreground">Žiadne platby</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2">Dátum</th>
                    <th className="text-left p-2">Suma (€)</th>
                    <th className="text-left p-2">Stav</th>
                    <th className="text-left p-2">Spôsob platby</th>
                    <th className="text-left p-2">Faktúra</th>
                    <th className="text-left p-2">Poznámka</th>
                    <th className="text-left p-2">Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id} className="border-t">
                      <td className="p-2">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {(payment.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-2">
                        {payment.isPaid ? 'Zaplatené' : 'Nezaplatené'}
                      </td>
                      <td className="p-2">{payment.paymentMethod}</td>
                      <td className="p-2">{payment.invoiceNumber}</td>
                      <td className="p-2">{payment.note}</td>
                      <td className="p-2 space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPayment(payment)}
                        >
                          Upraviť
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          Vymazať
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialóg na pridanie/upravenie platby */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPayment?.id ? 'Upraviť platbu' : 'Pridať platbu'}
            </DialogTitle>
            <DialogDescription>
              {editingPayment?.id
                ? 'Upravte detaily platby'
                : 'Pridajte novú platbu k rezervácii'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div>
              <Label htmlFor="payment-date">Dátum</Label>
              <Input
                id="payment-date"
                type="date"
                value={
                  editingPayment?.date
                    ? new Date(editingPayment.date).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditingPayment(p =>
                    p ? { ...p, date: new Date(e.target.value) } : null
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="payment-amount">Suma (€)</Label>
              <Input
                id="payment-amount"
                type="number"
                value={editingPayment?.amount || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditingPayment(p =>
                    p ? { ...p, amount: Number(e.target.value) } : null
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="payment-method-dialog">Spôsob platby</Label>
              <Select
                value={editingPayment?.paymentMethod || 'cash'}
                onValueChange={(value: string) =>
                  setEditingPayment(p =>
                    p
                      ? {
                          ...p,
                          paymentMethod: value as PaymentMethod,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger id="payment-method-dialog">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Hotovosť</SelectItem>
                  <SelectItem value="bank_transfer">Bankový prevod</SelectItem>
                  <SelectItem value="vrp">VRP</SelectItem>
                  <SelectItem value="direct_to_owner">
                    Priamo majiteľovi
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoice-number">Faktúra</Label>
              <Input
                id="invoice-number"
                value={editingPayment?.invoiceNumber || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditingPayment(p =>
                    p ? { ...p, invoiceNumber: e.target.value } : null
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="payment-note">Poznámka</Label>
              <Input
                id="payment-note"
                value={editingPayment?.note || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditingPayment(p =>
                    p ? { ...p, note: e.target.value } : null
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="payment-status">Stav</Label>
              <Select
                value={editingPayment?.isPaid ? 'paid' : 'unpaid'}
                onValueChange={(value: string) =>
                  setEditingPayment(p =>
                    p ? { ...p, isPaid: value === 'paid' } : null
                  )
                }
              >
                <SelectTrigger id="payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Zaplatené</SelectItem>
                  <SelectItem value="unpaid">Nezaplatené</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDialogOpen(false);
                setEditingPayment(null);
              }}
            >
              Zrušiť
            </Button>
            <Button
              variant="default"
              onClick={() =>
                editingPayment && handleSavePayment(editingPayment)
              }
            >
              Uložiť
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialóg na editáciu zákazníka */}
      <Dialog
        open={editCustomerDialogOpen && !!editingCustomer}
        onOpenChange={setEditCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Upraviť zákazníka: {editingCustomer?.name}
            </DialogTitle>
            <DialogDescription>
              Upravte informácie o zákazníkovi
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              const phone = formData.get('phone') as string;

              if (!name?.trim()) {
                window.alert('Meno zákazníka je povinné');
                return;
              }

              const updatedCustomer: Customer = {
                ...editingCustomer!,
                name: name.trim(),
                email: email?.trim() || '',
                phone: phone?.trim() || '',
              };

              handleSaveEditedCustomer(updatedCustomer);
            }}
          >
            <div className="flex flex-col gap-4 py-4">
              <div>
                <Label htmlFor="edit-name">Meno zákazníka *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCustomer?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editingCustomer?.email}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefón</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  defaultValue={editingCustomer?.phone}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditCustomerDialogOpen(false);
                  setEditingCustomer(null);
                }}
              >
                Zrušiť
              </Button>
              <Button type="submit" variant="default" disabled={savingCustomer}>
                {savingCustomer && <Spinner className="w-5 h-5 mr-2" />}
                {savingCustomer ? 'Ukladám...' : 'Uložiť zmeny'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialóg na pridanie/upravenie zákazníka */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nový zákazník</DialogTitle>
            <DialogDescription>
              Pridajte nového zákazníka do systému
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              const phone = formData.get('phone') as string;

              if (!name?.trim()) {
                window.alert('Meno zákazníka je povinné');
                return;
              }

              const newCustomer: Customer = {
                id: uuidv4(),
                name: name.trim(),
                email: email?.trim() || '',
                phone: phone?.trim() || '',
                createdAt: new Date(),
              };

              handleSaveCustomer(newCustomer);
            }}
          >
            <div className="flex flex-col gap-4 py-4">
              <div>
                <Label htmlFor="new-name">Meno zákazníka *</Label>
                <Input id="new-name" name="name" required />
              </div>
              <div>
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="new-phone">Telefón</Label>
                <Input id="new-phone" name="phone" />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCustomerDialogOpen(false)}
              >
                Zrušiť
              </Button>
              <Button type="submit" variant="default">
                Pridať zákazníka
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="col-span-full flex gap-4 justify-end mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Zrušiť
        </Button>
        <Button type="submit" variant="default" disabled={isLoading}>
          {isLoading && <Spinner className="w-5 h-5 mr-2" />}
          {isLoading
            ? 'Ukladá sa...'
            : rental
              ? 'Uložiť zmeny'
              : 'Vytvoriť prenájom'}
        </Button>
      </div>
    </form>
  );
}
