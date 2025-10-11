import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useCompanies } from '@/lib/react-query/hooks/useCompanies';
import { useExpenses } from '@/lib/react-query/hooks/useExpenses';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { Expense, ExpenseCategory } from '@/types';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
  categories?: ExpenseCategory[];
}

export default function ExpenseForm({
  expense,
  onSave,
  onCancel,
  categories = [],
}: ExpenseFormProps) {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: companies = [] } = useCompanies();
  const { data: vehicles = [] } = useVehicles();
  const { data: expenses = [] } = useExpenses();

  // Helper functions for compatibility
  const createCompany = async (company: {
    id: string;
    name: string;
    commissionRate?: number;
    isActive?: boolean;
    createdAt?: Date;
  }) => {
    // TODO: Implement createCompany in React Query hooks
    console.warn(
      'createCompany not yet implemented in React Query hooks',
      company
    );
  };
  const getFilteredVehicles = () => vehicles;
  const allVehicles = getFilteredVehicles();
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  // KOMPLETNE NOVÁ DÁTUMOVÁ LOGIKA - JEDNODUCHÁ A ROBUSTNÁ
  const getDefaultDate = (): Date => {
    return new Date(2024, 0, 1); // 1. január 2024 - vždy platný
  };

  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    date: getDefaultDate(),
    vehicleId: '',
    company: '',
    category: 'other',
    note: '',
  });

  // Jednoduchá a bezpečná funkcia na získanie dátumu
  const getSafeDate = (date: Date | string | undefined): Date => {
    if (!date) return getDefaultDate();

    try {
      if (typeof date === 'string') {
        // Pre string formát YYYY-MM-DD
        const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          const day = parseInt(match[3]);

          // Validácia a oprava
          const validYear = year >= 1900 && year <= 2100 ? year : 2024;
          const validMonth = month >= 1 && month <= 12 ? month : 1;
          const validDay = day >= 1 && day <= 31 ? day : 1;

          const result = new Date(validYear, validMonth - 1, validDay);
          return isNaN(result.getTime()) ? getDefaultDate() : result;
        }
        return getDefaultDate();
      }

      // Pre Date objekt
      if (date instanceof Date) {
        return isNaN(date.getTime()) ? getDefaultDate() : date;
      }

      return getDefaultDate();
    } catch {
      return getDefaultDate();
    }
  };

  // Jednoduchá funkcia na získanie string hodnoty pre input
  const getDateString = (date: Date | string | undefined): string => {
    try {
      const safeDate = getSafeDate(date);
      const year = safeDate.getFullYear();
      const month = String(safeDate.getMonth() + 1).padStart(2, '0');
      const day = String(safeDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '2024-01-01';
    }
  };

  // Filtrovanie vozidiel podľa vybranej firmy
  const getVehiclesForCompany = (companyName: string) => {
    if (!companyName) return allVehicles;
    return allVehicles.filter(vehicle => vehicle.company === companyName);
  };

  useEffect(() => {
    if (expense) {
      setFormData({
        ...expense,
        date: getSafeDate(expense.date),
      });
    }
  }, [expense]);

  const handleInputChange = (
    field: keyof Expense,
    value: string | number | Date | undefined
  ) => {
    setFormData(prev => {
      const newData = { ...prev };

      // Špeciálne spracovanie pre dátum
      if (field === 'date') {
        newData[field] = getSafeDate(value);
      } else {
        newData[field] = value;
      }

      // Ak sa zmenila firma, vymaž vybrané vozidlo
      if (field === 'company' && prev.company !== value) {
        newData.vehicleId = '';
      }

      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const completeExpense: Expense = {
      id: expense?.id || uuidv4(),
      description: formData.description || '',
      amount: formData.amount || 0,
      date: getSafeDate(formData.date),
      vehicleId: formData.vehicleId || undefined,
      company: formData.company || '',
      category: formData.category || 'other',
      note: formData.note || undefined,
    };
    onSave(completeExpense);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        <TextField
          fullWidth
          label="Popis"
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          required
        />

        <TextField
          fullWidth
          label="Suma (€) - voliteľné"
          type="number"
          value={formData.amount || ''}
          onChange={e =>
            handleInputChange(
              'amount',
              e.target.value ? parseFloat(e.target.value) : 0
            )
          }
          placeholder="Zadajte sumu alebo nechajte prázdne"
        />

        <TextField
          fullWidth
          label="Dátum"
          type="date"
          value={getDateString(formData.date)}
          onChange={e => {
            handleInputChange('date', e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          required
        />

        <FormControl fullWidth>
          <InputLabel>Kategória</InputLabel>
          <Select
            value={formData.category}
            onChange={e => handleInputChange('category', e.target.value)}
            label="Kategória"
            required
          >
            {categories.map(cat => (
              <MenuItem key={cat.name} value={cat.name}>
                {cat.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Firma</InputLabel>
          <Select
            value={formData.company}
            onChange={e => {
              const value = e.target.value;
              if (value !== '__add_new__') {
                handleInputChange('company', value);
              }
            }}
            label="Firma"
            required
          >
            <MenuItem value="">
              <em>Vyberte firmu</em>
            </MenuItem>
            {companies
              .filter(c => c.isActive !== false)
              .map(company => (
                <MenuItem key={company.id} value={company.name}>
                  {company.name}
                </MenuItem>
              ))}
            <MenuItem
              value="__add_new__"
              onClick={() => setAddingCompany(true)}
            >
              <em>+ Pridať novú firmu</em>
            </MenuItem>
          </Select>
          {addingCompany && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                autoFocus
                size="small"
                label="Nová firma"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
              />
              <Button
                variant="contained"
                size="small"
                disabled={!newCompanyName.trim()}
                onClick={async () => {
                  try {
                    const id = uuidv4();
                    await createCompany({
                      id,
                      name: newCompanyName.trim(),
                      commissionRate: 20.0,
                      isActive: true,
                      createdAt: new Date(),
                    });
                    setFormData(prev => ({
                      ...prev,
                      company: newCompanyName.trim(),
                    }));
                    setNewCompanyName('');
                    setAddingCompany(false);
                  } catch (error) {
                    console.error('Chyba pri vytváraní firmy:', error);
                    alert('Chyba pri vytváraní firmy');
                  }
                }}
              >
                Pridať
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAddingCompany(false);
                  setNewCompanyName('');
                }}
              >
                Zrušiť
              </Button>
            </Box>
          )}
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Vozidlo (voliteľné)</InputLabel>
          <Select
            value={formData.vehicleId || ''}
            onChange={e =>
              handleInputChange('vehicleId', e.target.value || undefined)
            }
            label="Vozidlo (voliteľné)"
            disabled={!formData.company}
          >
            <MenuItem value="">
              {formData.company ? 'Bez vozidla' : 'Najprv vyberte firmu'}
            </MenuItem>
            {getVehiclesForCompany(formData.company || '').map(vehicle => (
              <MenuItem key={vehicle.id} value={vehicle.id}>
                {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Poznámka (voliteľné)"
          value={formData.note || ''}
          onChange={e => handleInputChange('note', e.target.value)}
          multiline
          rows={3}
          placeholder="Zadajte dodatočné informácie k nákladu..."
        />
      </Box>

      <Box
        sx={{
          gridColumn: '1 / -1',
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          mt: 3,
        }}
      >
        <Button variant="outlined" onClick={onCancel}>
          Zrušiť
        </Button>
        <Button type="submit" variant="contained">
          {expense ? 'Uložiť zmeny' : 'Pridať náklad'}
        </Button>
      </Box>
    </Box>
  );
}
