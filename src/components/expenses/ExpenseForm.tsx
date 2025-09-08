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

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import { useCompanies } from '@/lib/react-query/hooks/useCompanies';
import { useExpenses } from '@/lib/react-query/hooks/useExpenses';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { Expense, ExpenseCategory } from '../../types';

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
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    date: new Date(),
    vehicleId: '',
    company: '',
    category: 'other',
    note: '',
  });

  // Filtrovanie vozidiel podľa vybranej firmy
  const getVehiclesForCompany = (companyName: string) => {
    if (!companyName) return allVehicles;
    return allVehicles.filter(vehicle => vehicle.company === companyName);
  };

  useEffect(() => {
    if (expense) {
      setFormData(expense);
    }
  }, [expense]);

  const handleInputChange = (
    field: keyof Expense,
    value: string | number | Date | undefined
  ) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

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
      date: formData.date || new Date(),
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
          value={
            formData.date
              ? new Date(formData.date).toISOString().split('T')[0]
              : ''
          }
          onChange={e => handleInputChange('date', new Date(e.target.value))}
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
            {categories.length > 0 ? (
              categories.map(category => (
                <MenuItem key={category.name} value={category.name}>
                  {category.displayName}
                </MenuItem>
              ))
            ) : (
              // Fallback na základné kategórie ak sa nenačítali
              <>
                <MenuItem value="service">Servis</MenuItem>
                <MenuItem value="insurance">Poistenie</MenuItem>
                <MenuItem value="fuel">Palivo</MenuItem>
                <MenuItem value="other">Iné</MenuItem>
              </>
            )}
          </Select>
        </FormControl>

        {/* Firma - Select s možnosťou pridať */}
        <FormControl fullWidth required>
          <InputLabel>Firma</InputLabel>
          <Select
            value={formData.company || ''}
            label="Firma"
            onChange={e => handleInputChange('company', e.target.value)}
            renderValue={selected => selected || 'Vyberte firmu'}
          >
            {Array.from(
              new Set([
                ...companies.map(c => c.name),
                ...vehicles.map(v => v.company),
                ...expenses.map(e => e.company),
              ])
            )
              .filter(Boolean)
              .sort((a, b) => a!.localeCompare(b!))
              .map(company => (
                <MenuItem key={company} value={company}>
                  {company}
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
