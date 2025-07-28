import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
}

export default function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const { state, dispatch, createCompany } = useApp();
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

  useEffect(() => {
    if (expense) {
      setFormData(expense);
    }
  }, [expense]);

  const handleInputChange = (field: keyof Expense, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TextField
          fullWidth
          label="Popis"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          required
        />

        <TextField
          fullWidth
          label="Suma (€) - voliteľné"
          type="number"
          value={formData.amount || ''}
          onChange={(e) => handleInputChange('amount', e.target.value ? parseFloat(e.target.value) : 0)}
          placeholder="Zadajte sumu alebo nechajte prázdne"
        />

        <TextField
          fullWidth
          label="Dátum"
          type="date"
          value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
          onChange={(e) => handleInputChange('date', new Date(e.target.value))}
          InputLabelProps={{ shrink: true }}
          required
        />

        <FormControl fullWidth>
          <InputLabel>Kategória</InputLabel>
          <Select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            label="Kategória"
            required
          >
            <MenuItem value="service">Servis</MenuItem>
            <MenuItem value="insurance">Poistenie</MenuItem>
            <MenuItem value="fuel">Palivo</MenuItem>
            <MenuItem value="other">Iné</MenuItem>
          </Select>
        </FormControl>

        {/* Firma - Select s možnosťou pridať */}
        <FormControl fullWidth required>
          <InputLabel>Firma</InputLabel>
          <Select
            value={formData.company || ''}
            label="Firma"
            onChange={(e) => handleInputChange('company', e.target.value)}
            renderValue={(selected) => selected || 'Vyberte firmu'}
          >
            {Array.from(new Set([
              ...state.companies.map(c => c.name),
              ...state.vehicles.map(v => v.company),
              ...state.expenses.map(e => e.company)
            ])).filter(Boolean).sort((a, b) => a!.localeCompare(b!)).map((company) => (
              <MenuItem key={company} value={company}>
                {company}
              </MenuItem>
            ))}
            <MenuItem value="__add_new__" onClick={() => setAddingCompany(true)}>
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
                onChange={(e) => setNewCompanyName(e.target.value)}
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
                      commissionRate: 20.00,
                      isActive: true,
                      createdAt: new Date()
                    });
                    setFormData((prev) => ({ ...prev, company: newCompanyName.trim() }));
                    setNewCompanyName('');
                    setAddingCompany(false);
                  } catch (error) {
                    console.error('Chyba pri vytváraní firmy:', error);
                    alert('Chyba pri vytváraní firmy');
                  }
                }}
              >Pridať</Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAddingCompany(false);
                  setNewCompanyName('');
                }}
              >Zrušiť</Button>
            </Box>
          )}
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Vozidlo (voliteľné)</InputLabel>
          <Select
            value={formData.vehicleId || ''}
            onChange={(e) => handleInputChange('vehicleId', e.target.value || undefined)}
            label="Vozidlo (voliteľné)"
          >
            <MenuItem value="">Všetky vozidlá</MenuItem>
            {state.vehicles.map((vehicle) => (
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
          onChange={(e) => handleInputChange('note', e.target.value)}
          multiline
          rows={3}
          placeholder="Zadajte dodatočné informácie k nákladu..."
        />
      </Box>

      <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
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