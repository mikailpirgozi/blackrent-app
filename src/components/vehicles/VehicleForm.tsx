import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { Vehicle, PricingTier } from '../../types';
import { useApp } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

export default function VehicleForm({ vehicle, onSave, onCancel }: VehicleFormProps) {
  const { state, createCompany } = useApp();
  const defaultPricing = [
    { id: '1', minDays: 0, maxDays: 1, pricePerDay: 0 },
    { id: '2', minDays: 2, maxDays: 3, pricePerDay: 0 },
    { id: '3', minDays: 4, maxDays: 7, pricePerDay: 0 },
    { id: '4', minDays: 8, maxDays: 14, pricePerDay: 0 },
    { id: '5', minDays: 15, maxDays: 22, pricePerDay: 0 },
    { id: '6', minDays: 23, maxDays: 30, pricePerDay: 0 },
    { id: '7', minDays: 31, maxDays: 9999, pricePerDay: 0 },
  ];
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    brand: '',
    model: '',
    licensePlate: '',
    company: '',
    pricing: defaultPricing,
    commission: { type: 'percentage', value: 20 },
    status: 'available',
  });
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    }
  }, [vehicle]);

  const handleInputChange = (field: keyof Vehicle, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePricingChange = (index: number, field: keyof PricingTier, value: any) => {
    const newPricing = [...(formData.pricing || [])];
    newPricing[index] = { ...newPricing[index], [field]: value };
    setFormData(prev => ({ ...prev, pricing: newPricing }));
  };

  const _addPricingTier = () => {
    const newPricing = [...(formData.pricing || [])];
    const lastTier = newPricing[newPricing.length - 1];
    newPricing.push({
      id: uuidv4(),
      minDays: lastTier ? lastTier.maxDays + 1 : 1,
      maxDays: lastTier ? lastTier.maxDays + 3 : 3,
      pricePerDay: 0,
    });
    setFormData(prev => ({ ...prev, pricing: newPricing }));
  };

  const _removePricingTier = (index: number) => {
    const newPricing = [...(formData.pricing || [])];
    newPricing.splice(index, 1);
    setFormData(prev => ({ ...prev, pricing: newPricing }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const completeVehicle: Vehicle = {
      id: vehicle?.id || uuidv4(),
      brand: formData.brand || '',
      model: formData.model || '',
      licensePlate: formData.licensePlate || '',
      company: formData.company || '',
      pricing: formData.pricing || [],
      commission: formData.commission || { type: 'percentage', value: 20 },
      status: formData.status || 'available',
    };
    onSave(completeVehicle);
  };

  const allCompanies = Array.from(new Set([
    ...state.companies.map(c => c.name),
    ...state.vehicles.map(v => v.company)
  ])).filter(Boolean).sort((a, b) => a.localeCompare(b));

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TextField
          fullWidth
          label="Značka"
          value={formData.brand}
          onChange={(e) => handleInputChange('brand', e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="Model"
          value={formData.model}
          onChange={(e) => handleInputChange('model', e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="ŠPZ"
          value={formData.licensePlate}
          onChange={(e) => handleInputChange('licensePlate', e.target.value)}
          required
        />
        {/* Firma/Autopožičovňa - Select s možnosťou pridať */}
        <FormControl fullWidth required>
          <InputLabel>Firma/Autopožičovňa</InputLabel>
          <Select
            value={formData.company || ''}
            label="Firma/Autopožičovňa"
            onChange={(e) => handleInputChange('company', e.target.value)}
            renderValue={(selected) => selected || 'Vyberte firmu'}
          >
            {allCompanies.map((company) => (
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
                    await createCompany({ id, name: newCompanyName.trim() });
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
          <InputLabel>Stav</InputLabel>
          <Select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            label="Stav"
          >
            <MenuItem value="available">Dostupné</MenuItem>
            <MenuItem value="rented">Prenajaté</MenuItem>
            <MenuItem value="maintenance">Údržba</MenuItem>
            <MenuItem value="temporarily_removed">Dočasne vyradené</MenuItem>
            <MenuItem value="removed">Vyradené</MenuItem>
            <MenuItem value="transferred">Prepisané</MenuItem>
          </Select>
        </FormControl>
        <FormControl component="fieldset">
          <Typography variant="subtitle1" gutterBottom>
            Provízia
          </Typography>
          <RadioGroup
            row
            value={formData.commission?.type}
            onChange={(e) => handleInputChange('commission', { 
              ...formData.commission, 
              type: e.target.value as 'percentage' | 'fixed' 
            })}
          >
            <FormControlLabel value="percentage" control={<Radio />} label="Percentá" />
            <FormControlLabel value="fixed" control={<Radio />} label="Fixná suma" />
          </RadioGroup>
          <TextField
            fullWidth
            label={formData.commission?.type === 'percentage' ? 'Percentá (%)' : 'Suma (€)'}
            type="number"
            value={formData.commission?.value}
            onChange={(e) => handleInputChange('commission', { 
              ...formData.commission, 
              value: parseFloat(e.target.value) 
            })}
            sx={{ mt: 1 }}
          />
        </FormControl>

        <Box sx={{ gridColumn: '1 / -1' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Cenotvorba</Typography>
              </Box>
              {formData.pricing?.map((tier, index) => (
                <Box key={tier.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label={(() => {
                      switch(index) {
                        case 0: return '0-1 dni';
                        case 1: return '2-3 dni';
                        case 2: return '4-7 dni';
                        case 3: return '8-14 dni';
                        case 4: return '15-22 dní';
                        case 5: return '23-30 dní';
                        case 6: return '31-9999 dní';
                        default: return '';
                      }
                    })()}
                    type="number"
                    value={tier.pricePerDay}
                    onChange={(e) => handlePricingChange(index, 'pricePerDay', parseFloat(e.target.value))}
                    sx={{ width: 150 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel}>
            Zrušiť
          </Button>
          <Button type="submit" variant="contained">
            {vehicle ? 'Uložiť zmeny' : 'Pridať vozidlo'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 