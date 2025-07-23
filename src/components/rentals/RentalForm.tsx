import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useApp } from '../../context/AppContext';
import { Rental, PaymentMethod, Vehicle, RentalPayment, Customer } from '../../types';
import { differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import EditIcon from '@mui/icons-material/Edit';
import PercentIcon from '@mui/icons-material/Percent';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AddIcon from '@mui/icons-material/Add';
import EmailParser from './EmailParser';

interface RentalFormProps {
  rental?: Rental | null;
  onSave: (rental: Rental) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RentalForm({ rental, onSave, onCancel, isLoading = false }: RentalFormProps) {
  const { state, dispatch, createCustomer, updateCustomer } = useApp();
  const [formData, setFormData] = useState<Partial<Rental>>({
    vehicleId: '',
    customerId: '',
    customerName: '',
    startDate: new Date(),
    endDate: new Date(),
    paymentMethod: 'cash',
    orderNumber: '',
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [extraKmCharge, setExtraKmCharge] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [paid, setPaid] = useState(false);
  const [handoverPlace, setHandoverPlace] = useState('');
  const [addingPlace, setAddingPlace] = useState(false);
  const [newPlace, setNewPlace] = useState('');
  const defaultPlaces = [
    'Bratislava',
    'Košice',
    'Žilina',
    'Trnava',
    'Nitra',
    'Banská Bystrica',
    'Prešov',
    'Trenčín',
  ];
  const [places, setPlaces] = useState<string[]>(defaultPlaces);
  const [payments, setPayments] = useState<RentalPayment[]>(rental?.payments || []);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RentalPayment | null>(null);
  const [showDiscountCommission, setShowDiscountCommission] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Získam zoznam zákazníkov
  const customerOptions = (state.customers || []).map(c => ({
    label: c.name,
    id: c.id,
    customer: c
  }));

  // Oprava vehicleOptions a Autocomplete pre výber vozidla
  const vehicleOptions = state.vehicles.map(v => ({
    label: `${v.brand} ${v.model} (${v.licensePlate})`,
    id: v.id
  }));

  useEffect(() => {
    if (rental) {
      setFormData(rental);
      setCalculatedPrice(rental.totalPrice);
      setCalculatedCommission(rental.commission);
      if (rental.extraKmCharge) {
        setExtraKmCharge(rental.extraKmCharge);
      }
      if (rental.deposit) {
        setDeposit(rental.deposit);
      }
      if (typeof rental.paid === 'boolean') setPaid(rental.paid);
      if (rental.handoverPlace) setHandoverPlace(rental.handoverPlace);
      if (rental.handoverPlace && !defaultPlaces.includes(rental.handoverPlace)) {
        setPlaces(prev => [...prev, rental.handoverPlace!]);
      }
      if (rental.payments) {
        setPayments(rental.payments);
      }
      
      // Nastav selectedVehicle ak existuje
      if (rental.vehicleId) {
        const vehicle = state.vehicles.find(v => v.id === rental.vehicleId);
        setSelectedVehicle(vehicle || null);
      }
      
      // Nastavenie zákazníka - najprv skúsim nájsť podľa customerId, potom podľa customerName
      if (rental.customerId) {
        const customer = (state.customers || []).find(c => c.id === rental.customerId);
        if (customer) {
          setSelectedCustomer(customer);
        } else if (rental.customerName) {
          // Ak sa nenájde zákazník podľa ID, skúsim nájsť podľa mena
          const customerByName = (state.customers || []).find(c => c.name === rental.customerName);
          if (customerByName) {
            setSelectedCustomer(customerByName);
            // Aktualizujem customerId v formData
            setFormData(prev => ({ ...prev, customerId: customerByName.id }));
          }
        }
      } else if (rental.customerName) {
        // Ak nemá customerId, ale má customerName, skúsim nájsť zákazníka podľa mena
        const customerByName = (state.customers || []).find(c => c.name === rental.customerName);
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
  }, [rental, state.customers, state.vehicles]);

  // Sleduj zmeny vo vehicleId a aktualizuj selectedVehicle
  useEffect(() => {
    if (formData.vehicleId) {
      const vehicle = state.vehicles.find(v => v.id === formData.vehicleId);
      if (vehicle && vehicle.id !== selectedVehicle?.id) {
        setSelectedVehicle(vehicle);
      }
    } else if (selectedVehicle) {
      setSelectedVehicle(null);
    }
  }, [formData.vehicleId, state.vehicles, selectedVehicle?.id]);

  const handleInputChange = (field: keyof Rental, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name
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
        customerName: customer.name
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
      await updateCustomer(customer);
      setSelectedCustomer(customer);
      setEditCustomerDialogOpen(false);
      setEditingCustomer(null);
      alert('Zákazník bol úspešne upravený!');
    } catch (error) {
      console.error('Chyba pri aktualizácii zákazníka:', error);
    }
  };

  const handleEmailParseSuccess = async (rentalData: Partial<Rental>, customerData?: Customer) => {
    // Pridanie nového zákazníka ak neexistuje
    if (customerData) {
      const existingCustomer = (state.customers || []).find(c => 
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
    setFormData(prev => ({
      ...prev,
      ...rentalData,
      customerName: rentalData.customerName || prev.customerName,
      orderNumber: rentalData.orderNumber || prev.orderNumber,
    }));

    // Nastav selectedVehicle ak bolo parsované vozidlo
    if (rentalData.vehicleId) {
      const vehicle = state.vehicles.find(v => v.id === rentalData.vehicleId);
      setSelectedVehicle(vehicle || null);
    }

    // Nastavenie zákazníka ak bol nájdený alebo vytvorený
    if (customerData) {
      const finalCustomer = (state.customers || []).find(c => 
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

    // Nastavenie miesta odovzdania ak bolo parsované
    if (rentalData.handoverPlace) {
      setHandoverPlace(rentalData.handoverPlace);
      if (!places.includes(rentalData.handoverPlace)) {
        setPlaces(prev => [...prev, rentalData.handoverPlace!]);
      }
    }

    alert('Dáta z emailu boli úspešne načítané do formulára!');
  };

  useEffect(() => {
    if (!formData.vehicleId || !formData.startDate || !formData.endDate) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    const vehicle = state.vehicles.find(v => v.id === formData.vehicleId);
    if (!vehicle) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    // Výpočet dní prenájmu - iba dátumy, ignoruje čas
    // od 10.10 do 10.10 = 1 deň, od 10.10 do 11.10 = 1 deň, od 10.10 do 12.10 = 2 dni
    
    // Extrahovanie roku, mesiaca a dňa z dátumov (ignoruje čas)
    const startDate = formData.startDate instanceof Date ? formData.startDate : new Date(formData.startDate || '');
    const endDate = formData.endDate instanceof Date ? formData.endDate : new Date(formData.endDate || '');
    
    // Vytvorenie čistých dátumov bez času
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const daysDifference = differenceInDays(endDateOnly, startDateOnly);
    const days = Math.max(1, daysDifference);
    
    const pricingTier = vehicle.pricing?.find(
      tier => days >= tier.minDays && days <= tier.maxDays
    );

    if (pricingTier && vehicle.pricing && vehicle.pricing.length > 0) {
      let basePrice = days * pricingTier.pricePerDay;
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
      let extra = extraKmCharge > 0 ? extraKmCharge : 0;
      // Výsledná cena
      const totalPrice = Math.max(0, basePrice - discount + extra);
      setCalculatedPrice(totalPrice);

      // Provízia
      let commission = 0;
      if (formData.customCommission?.value && formData.customCommission.value > 0) {
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
  }, [formData.vehicleId, formData.startDate, formData.endDate, formData.discount, extraKmCharge, formData.customCommission, state.vehicles]);

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
    
    const vehicle = formData.vehicleId ? state.vehicles.find(v => v.id === formData.vehicleId) : undefined;
    
    // Validácia - musí byť zadané meno zákazníka
    if (!formData.customerName?.trim()) {
      alert('Meno zákazníka je povinné');
      return;
    }

    // Ak máme customerName ale nemáme customerId, vytvorím nového zákazníka
    let finalCustomer = selectedCustomer;
    let finalCustomerId = formData.customerId;
    
    if (formData.customerName && !formData.customerId) {
      // Skontrolujem, či už existuje zákazník s týmto menom
      const existingCustomer = (state.customers || []).find(c => c.name === formData.customerName);
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

    const completeRental: Rental = {
      id: rental?.id || uuidv4(),
      vehicleId: formData.vehicleId || undefined,
      vehicle: vehicle,
      customerId: finalCustomerId || undefined,
      customer: finalCustomer || undefined,
      customerName: formData.customerName || '',
      startDate: formData.startDate || new Date(),
      endDate: formData.endDate || new Date(),
      totalPrice: calculatedPrice,
      commission: calculatedCommission,
      paymentMethod: formData.paymentMethod || 'cash',
      createdAt: rental?.createdAt || new Date(),
      discount: formData.discount?.value && formData.discount.value > 0 ? formData.discount : undefined,
      customCommission: formData.customCommission?.value && formData.customCommission.value > 0 ? formData.customCommission : undefined,
      extraKmCharge: extraKmCharge > 0 ? extraKmCharge : undefined,
      deposit: deposit > 0 ? deposit : undefined,
      paid,
      status: rental?.status || 'pending',
      handoverPlace: handoverPlace.trim() || undefined,
      payments: payments,
      orderNumber: formData.orderNumber || '',
    };
    onSave(completeRental);
  };

  const availableVehicles = state.vehicles.filter(v => v.status === 'available');

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, opacity: isLoading ? 0.6 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
      {/* Email Parser komponent */}
      <EmailParser
        onParseSuccess={handleEmailParseSuccess}
        vehicles={state.vehicles}
        customers={state.customers || []}
      />
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Vozidlo */}
        <FormControl fullWidth>
          <Autocomplete
            options={vehicleOptions}
            getOptionLabel={option => option.label}
            value={vehicleOptions.find(v => v.id === formData.vehicleId) || null}
            onChange={(_, newValue) => {
              const vehicleId = newValue ? newValue.id : '';
              handleInputChange('vehicleId', vehicleId);
              
              // Nájdi vozidlo a nastav ho
              if (vehicleId) {
                const vehicle = state.vehicles.find(v => v.id === vehicleId);
                setSelectedVehicle(vehicle || null);
              } else {
                setSelectedVehicle(null);
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label={!formData.vehicleId ? "Vozidlo (voliteľné)" : undefined} fullWidth />
            )}
          />
        </FormControl>

        {/* Informácia o majiteľovi vozidla */}
        {selectedVehicle && (
          <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Informácie o vozidle:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                label={`Majiteľ: ${selectedVehicle.company}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`ŠPZ: ${selectedVehicle.licensePlate}`}
                color="secondary"
                variant="outlined"
              />
              <Chip
                label={`Provízia: ${selectedVehicle.commission.type === 'percentage' ? selectedVehicle.commission.value + '%' : selectedVehicle.commission.value + '€'}`}
                color="info"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
              ✓ Platba automaticky nastavená priamo majiteľovi vozidla
            </Typography>
          </Box>
        )}

        {/* TextField pre zadanie mena zákazníka */}
        <TextField
          fullWidth
          label="Meno zákazníka"
          value={formData.customerName || ''}
          onChange={(e) => {
            const name = e.target.value;
            setFormData(prev => ({ ...prev, customerName: name }));
            // Ak sa zadá meno, ktoré už existuje, automaticky ho vyberiem
            const existingCustomer = (state.customers || []).find(c => c.name === name);
            if (existingCustomer) {
              handleCustomerChange(existingCustomer);
            } else {
              // Ak sa nenájde existujúci zákazník, vyčistím customerId
              setFormData(prev => ({ ...prev, customerId: '' }));
              setSelectedCustomer(null);
            }
          }}
          placeholder="Zadajte meno zákazníka alebo vyberte z existujúcich"
          helperText={formData.customerId ? "Vybraný zákazník z existujúcich" : "Ak zákazník neexistuje, bude automaticky vytvorený pri uložení"}
          required
        />

        {/* Výber z existujúcich zákazníkov */}
        <FormControl fullWidth>
          <InputLabel>Výber z existujúcich zákazníkov</InputLabel>
          <Select
            value={formData.customerId || ''}
            onChange={(e) => {
              const customerId = e.target.value;
              if (customerId === '__add_new__') {
                handleAddCustomer();
                return;
              }
              const customer = (state.customers || []).find(c => c.id === customerId);
              handleCustomerChange(customer || null);
            }}
            label="Výber z existujúcich zákazníkov"
          >
            <MenuItem value="">
              <em>-- Vyberte zákazníka --</em>
            </MenuItem>
            {customerOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
            <MenuItem value="__add_new__">
              <em>+ Pridať nového zákazníka</em>
            </MenuItem>
          </Select>
        </FormControl>


        {/* Kontaktné údaje zákazníka */}
        {selectedCustomer && (
          <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Kontaktné údaje:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedCustomer.phone && (
                <Chip
                  icon={<PhoneIcon />}
                  label={selectedCustomer.phone}
                  onClick={() => handleCallCustomer(selectedCustomer.phone)}
                  clickable
                  color="primary"
                />
              )}
              {selectedCustomer.email && (
                <Chip
                  icon={<EmailIcon />}
                  label={selectedCustomer.email}
                  onClick={() => handleEmailCustomer(selectedCustomer.email)}
                  clickable
                  color="primary"
                />
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleEditCustomer(selectedCustomer)}
                sx={{ ml: 1 }}
              >
                Upraviť zákazníka
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  dispatch({ type: 'UPDATE_CUSTOMER', payload: selectedCustomer });
                  alert('Zákazník bol úspešne uložený!');
                }}
                sx={{ ml: 1 }}
              >
                Uložiť zákazníka
              </Button>
            </Box>
          </Box>
        )}

        {/* Informácia o novom zákazníkovi */}
        {formData.customerName && !selectedCustomer && (
          <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Nový zákazník:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.customerName} - bude automaticky vytvorený pri uložení prenájmu
            </Typography>
          </Box>
        )}

        {/* Číslo objednávky - odstránený FormControl a InputLabel */}
        <TextField
          fullWidth
          label="Číslo objednávky"
          value={formData.orderNumber || ''}
          onChange={e => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          required={false}
        />

        <TextField
          fullWidth
          label="Dátum od"
          type="date"
          value={formData.startDate ? (() => {
            const date = new Date(formData.startDate);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
          })() : ''}
          onChange={(e) => {
            // Iba dátum bez času - vytvorí dátum s rokom, mesiacom, dňom
            const dateValue = e.target.value;
            if (dateValue) {
              const [year, month, day] = dateValue.split('-').map(Number);
              const date = new Date(year, month - 1, day); // mesiac je 0-indexovaný
              handleInputChange('startDate', date);
            }
          }}
          InputLabelProps={{ shrink: true }}
          required
        />

        <TextField
          fullWidth
          label="Dátum do"
          type="date"
          value={formData.endDate ? (() => {
            const date = new Date(formData.endDate);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
          })() : ''}
          onChange={(e) => {
            // Iba dátum bez času - vytvorí dátum s rokom, mesiacom, dňom
            const dateValue = e.target.value;
            if (dateValue) {
              const [year, month, day] = dateValue.split('-').map(Number);
              const date = new Date(year, month - 1, day); // mesiac je 0-indexovaný
              handleInputChange('endDate', date);
            }
          }}
          InputLabelProps={{ shrink: true }}
          required
        />

        <FormControl fullWidth>
          <InputLabel>Spôsob platby</InputLabel>
          <Select
            value={formData.paymentMethod}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            label="Spôsob platby"
            required
          >
            <MenuItem value="cash">Hotovosť</MenuItem>
            <MenuItem value="bank_transfer">Bankový prevod</MenuItem>
            <MenuItem value="vrp">VRP</MenuItem>
            <MenuItem value="direct_to_owner">Priamo majiteľovi</MenuItem>
          </Select>
        </FormControl>

        {/* Miesto odovzdania */}
        <FormControl fullWidth>
          <InputLabel>Miesto odovzdania vozidla</InputLabel>
          <Select
            value={handoverPlace}
            label="Miesto odovzdania vozidla"
            onChange={e => setHandoverPlace(e.target.value)}
          >
            {places.map((place) => (
              <MenuItem key={place} value={place}>{place}</MenuItem>
            ))}
            <MenuItem value="__add_new__" onClick={() => setAddingPlace(true)}>
              <em>+ Pridať nové miesto</em>
            </MenuItem>
          </Select>
          {addingPlace && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                autoFocus
                size="small"
                label="Nové miesto"
                value={newPlace}
                onChange={e => setNewPlace(e.target.value)}
              />
              <Button
                variant="contained"
                size="small"
                disabled={!newPlace.trim()}
                onClick={() => {
                  setPlaces(prev => [...prev, newPlace.trim()]);
                  setHandoverPlace(newPlace.trim());
                  setNewPlace('');
                  setAddingPlace(false);
                }}
              >Pridať</Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAddingPlace(false);
                  setNewPlace('');
                }}
              >Zrušiť</Button>
            </Box>
          )}
        </FormControl>

        {/* Výška depozitu */}
        <TextField
          fullWidth
          label="Výška depozitu (€)"
          type="number"
          value={deposit}
          onChange={(e) => setDeposit(Number(e.target.value) || 0)}
          InputProps={{
            startAdornment: <span style={{ marginRight: 8 }}>€</span>,
          }}
          placeholder="0"
        />

        {/* Uhradené */}
        <FormControl fullWidth>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <input
              type="checkbox"
              checked={paid}
              onChange={e => setPaid(e.target.checked)}
              id="paid-checkbox"
              style={{ marginRight: 8 }}
            />
            <label htmlFor="paid-checkbox">Prenájom uhradený</label>
          </Box>
        </FormControl>
      </Box>

      <Box sx={{ gridColumn: '1 / -1', mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Výpočet ceny
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Typography>
                Celková cena: <strong>{calculatedPrice.toFixed(2)} €</strong>
              </Typography>
              <Typography>
                Provízia: <strong>{calculatedCommission.toFixed(2)} €</strong>
              </Typography>
            </Box>
            {/* Nadpis sekcie s ikonou na zobrazenie/skrytie zľavy/provízie */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                Zľava / Provízia
              </Typography>
              <IconButton onClick={() => setShowDiscountCommission((prev) => !prev)}>
                {showDiscountCommission ? <PercentIcon /> : <EditIcon />}
              </IconButton>
            </Box>
            {/* Polia pre zľavu a províziu - zobrazia sa až po kliknutí */}
            {showDiscountCommission && (
              <>
                {/* Zľava */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <FormControl sx={{ minWidth: 80 }} size="small">
                    <InputLabel>Zľava</InputLabel>
                    <Select
                      value={formData.discount?.type || ''}
                      label="Zľava"
                      onChange={e => handleInputChange('discount', { ...formData.discount, type: e.target.value })}
                    >
                      <MenuItem value="percentage">%</MenuItem>
                      <MenuItem value="fixed">€</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Hodnota"
                    type="number"
                    value={formData.discount?.value || ''}
                    onChange={e => handleInputChange('discount', { ...formData.discount, value: Number(e.target.value) })}
                    size="small"
                    sx={{ maxWidth: 100 }}
                  />
                </Box>
                {/* Provízia */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <FormControl sx={{ minWidth: 120 }} size="small">
                    <InputLabel>Provízia</InputLabel>
                    <Select
                      value={formData.customCommission?.type || ''}
                      label="Provízia"
                      onChange={e => handleInputChange('customCommission', { ...formData.customCommission, type: e.target.value })}
                    >
                      <MenuItem value="percentage">%</MenuItem>
                      <MenuItem value="fixed">€</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Hodnota"
                    type="number"
                    value={formData.customCommission?.value || ''}
                    onChange={e => handleInputChange('customCommission', { ...formData.customCommission, value: Number(e.target.value) })}
                    size="small"
                    sx={{ maxWidth: 100 }}
                  />
                </Box>
              </>
            )}
            {/* Doplatok za km */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography>Doplatok za km (€):</Typography>
              <TextField
                type="number"
                size="small"
                value={extraKmCharge}
                onChange={e => setExtraKmCharge(Number(e.target.value))}
                sx={{ width: 120 }}
                inputProps={{ min: 0 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Pridám sekciu Platby pod výpočet ceny */}
      <Box sx={{ gridColumn: '1 / -1', mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Platby (splátky)
            </Typography>
            <Button variant="outlined" onClick={handleAddPayment} sx={{ mb: 2 }}>
              Pridať platbu
            </Button>
            {payments.length === 0 ? (
              <Typography color="text.secondary">Žiadne platby</Typography>
            ) : (
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    <Box component="th">Dátum</Box>
                    <Box component="th">Suma (€)</Box>
                    <Box component="th">Stav</Box>
                    <Box component="th">Spôsob platby</Box>
                    <Box component="th">Faktúra</Box>
                    <Box component="th">Poznámka</Box>
                    <Box component="th">Akcie</Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {payments.map(payment => (
                    <Box component="tr" key={payment.id}>
                      <Box component="td">{new Date(payment.date).toLocaleDateString()}</Box>
                      <Box component="td">{payment.amount.toFixed(2)}</Box>
                      <Box component="td">{payment.isPaid ? 'Zaplatené' : 'Nezaplatené'}</Box>
                      <Box component="td">{payment.paymentMethod}</Box>
                      <Box component="td">{payment.invoiceNumber}</Box>
                      <Box component="td">{payment.note}</Box>
                      <Box component="td">
                        <Button size="small" onClick={() => handleEditPayment(payment)}>Upraviť</Button>
                        <Button size="small" color="error" onClick={() => handleDeletePayment(payment.id)}>Vymazať</Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Dialóg na pridanie/upravenie platby */}
      {paymentDialogOpen && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card sx={{ minWidth: 320 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{editingPayment?.id ? 'Upraviť platbu' : 'Pridať platbu'}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Dátum"
                  type="date"
                  value={editingPayment?.date ? new Date(editingPayment.date).toISOString().split('T')[0] : ''}
                  onChange={e => setEditingPayment(p => p ? { ...p, date: new Date(e.target.value) } : null)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Suma (€)"
                  type="number"
                  value={editingPayment?.amount || ''}
                  onChange={e => setEditingPayment(p => p ? { ...p, amount: Number(e.target.value) } : null)}
                />
                <FormControl>
                  <InputLabel>Spôsob platby</InputLabel>
                  <Select
                    value={editingPayment?.paymentMethod || 'cash'}
                    label="Spôsob platby"
                    onChange={e => setEditingPayment(p => p ? { ...p, paymentMethod: e.target.value as PaymentMethod } : null)}
                  >
                    <MenuItem value="cash">Hotovosť</MenuItem>
                    <MenuItem value="bank_transfer">Bankový prevod</MenuItem>
                    <MenuItem value="vrp">VRP</MenuItem>
                    <MenuItem value="direct_to_owner">Priamo majiteľovi</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Faktúra"
                  value={editingPayment?.invoiceNumber || ''}
                  onChange={e => setEditingPayment(p => p ? { ...p, invoiceNumber: e.target.value } : null)}
                />
                <TextField
                  label="Poznámka"
                  value={editingPayment?.note || ''}
                  onChange={e => setEditingPayment(p => p ? { ...p, note: e.target.value } : null)}
                />
                <FormControl>
                  <InputLabel>Stav</InputLabel>
                  <Select
                    value={editingPayment?.isPaid ? 'paid' : 'unpaid'}
                    label="Stav"
                    onChange={e => setEditingPayment(p => p ? { ...p, isPaid: e.target.value === 'paid' } : null)}
                  >
                    <MenuItem value="paid">Zaplatené</MenuItem>
                    <MenuItem value="unpaid">Nezaplatené</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="outlined" onClick={() => { setPaymentDialogOpen(false); setEditingPayment(null); }}>Zrušiť</Button>
                <Button variant="contained" onClick={() => editingPayment && handleSavePayment(editingPayment)}>Uložiť</Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Dialóg na editáciu zákazníka */}
      {editCustomerDialogOpen && editingCustomer && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 3, minWidth: 320, maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              Upraviť zákazníka: {editingCustomer.name}
            </Typography>
            <Box component="form" onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              const phone = formData.get('phone') as string;
              
              if (!name?.trim()) {
                alert('Meno zákazníka je povinné');
                return;
              }

              const updatedCustomer: Customer = {
                ...editingCustomer,
                name: name.trim(),
                email: email?.trim() || '',
                phone: phone?.trim() || '',
              };
              
              handleSaveEditedCustomer(updatedCustomer);
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  name="name"
                  label="Meno zákazníka"
                  defaultValue={editingCustomer.name}
                  required
                />
                
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  defaultValue={editingCustomer.email}
                />
                
                <TextField
                  fullWidth
                  name="phone"
                  label="Telefón"
                  defaultValue={editingCustomer.phone}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => {
                  setEditCustomerDialogOpen(false);
                  setEditingCustomer(null);
                }}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="contained">
                  Uložiť zmeny
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Dialóg na pridanie/upravenie zákazníka */}
      {customerDialogOpen && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 3, minWidth: 320, maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              Nový zákazník
            </Typography>
            <Box component="form" onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              const phone = formData.get('phone') as string;
              
              if (!name?.trim()) {
                alert('Meno zákazníka je povinné');
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
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  name="name"
                  label="Meno zákazníka"
                  required
                />
                
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                />
                
                <TextField
                  fullWidth
                  name="phone"
                  label="Telefón"
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => setCustomerDialogOpen(false)}>
                  Zrušiť
                </Button>
                <Button type="submit" variant="contained">
                  Pridať zákazníka
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
          Zrušiť
        </Button>
        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading && <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />}
          {isLoading ? 'Ukladá sa...' : (rental ? 'Uložiť zmeny' : 'Vytvoriť prenájom')}
        </Button>
      </Box>
    </Box>
  );
} 