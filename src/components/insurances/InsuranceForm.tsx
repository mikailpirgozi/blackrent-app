import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Autocomplete,
} from '@mui/material';
import { useApp } from '../../context/AppContext';
import { Insurance, PaymentFrequency } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface InsuranceFormProps {
  insurance?: Insurance | null;
  onSave: (insurance: Insurance) => void;
  onCancel: () => void;
}

export default function InsuranceForm({ insurance, onSave, onCancel }: InsuranceFormProps) {
  const { state, dispatch, createInsurer } = useApp();
  const [addingInsurer, setAddingInsurer] = useState(false);
  const [newInsurerName, setNewInsurerName] = useState('');
  const [formData, setFormData] = useState<Partial<Insurance>>({
    vehicleId: '',
    type: '',
    policyNumber: '',
    validFrom: new Date(),
    validTo: new Date(),
    price: 0,
    company: '',
    paymentFrequency: 'yearly',
  });

  useEffect(() => {
    if (insurance) {
      setFormData(insurance);
    }
  }, [insurance]);

  const handleInputChange = (field: keyof Insurance, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const completeInsurance: Insurance = {
      id: insurance?.id || uuidv4(),
      vehicleId: formData.vehicleId || '',
      type: formData.type || '',
      policyNumber: formData.policyNumber || '',
      validFrom: formData.validFrom || new Date(),
      validTo: formData.validTo || new Date(),
      price: formData.price || 0,
      company: formData.company || '',
      paymentFrequency: formData.paymentFrequency || 'yearly',
    };
    onSave(completeInsurance);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Autocomplete
          fullWidth
          options={state.vehicles
            .slice()
            .sort((a, b) => {
              const aText = `${a.brand} ${a.model} (${a.licensePlate})`;
              const bText = `${b.brand} ${b.model} (${b.licensePlate})`;
              return aText.localeCompare(bText, 'sk', { sensitivity: 'base' });
            })}
          getOptionLabel={(vehicle) => `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
          value={state.vehicles.find(v => v.id === formData.vehicleId) || null}
          onChange={(_, newValue) => handleInputChange('vehicleId', newValue?.id || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Vozidlo"
              required
              placeholder="Začnite písať pre vyhľadanie vozidla..."
            />
          )}
          noOptionsText="Žiadne vozidlá nenájdené"
          filterOptions={(options, { inputValue }) => {
            const filtered = options.filter((option) => {
              const searchText = `${option.brand} ${option.model} ${option.licensePlate}`.toLowerCase();
              return searchText.includes(inputValue.toLowerCase());
            });
            return filtered;
          }}
        />

        {/* Typ poistky - Select s pridanou možnosťou PZP + Kasko */}
        <FormControl fullWidth required>
          <InputLabel>Typ poistky</InputLabel>
          <Select
            value={formData.type || ''}
            label="Typ poistky"
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            <MenuItem value="PZP">PZP</MenuItem>
            <MenuItem value="PZP + Kasko">PZP + Kasko</MenuItem>
            <MenuItem value="Havarijná">Havarijná</MenuItem>
            <MenuItem value="GAP">GAP</MenuItem>
            <MenuItem value="Asistenčné služby">Asistenčné služby</MenuItem>
            <MenuItem value="Iné">Iné</MenuItem>
          </Select>
        </FormControl>

        {/* Číslo poistky - nové pole */}
        <TextField
          fullWidth
          label="Číslo poistky"
          value={formData.policyNumber}
          onChange={(e) => handleInputChange('policyNumber', e.target.value)}
          required
        />

        {/* Poistovňa - Select s možnosťou pridať */}
        <FormControl fullWidth required>
          <InputLabel>Poistovňa</InputLabel>
          <Select
            value={formData.company || ''}
            label="Poistovňa"
            onChange={(e) => handleInputChange('company', e.target.value)}
            renderValue={(selected) => selected || 'Vyberte poisťovňu'}
          >
            {state.insurers.map((insurer) => (
              <MenuItem key={insurer.id} value={insurer.name}>
                {insurer.name}
              </MenuItem>
            ))}
            <MenuItem value="__add_new__" onClick={() => setAddingInsurer(true)}>
              <em>+ Pridať novú poisťovňu</em>
            </MenuItem>
          </Select>
          {addingInsurer && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                autoFocus
                size="small"
                label="Nová poisťovňa"
                value={newInsurerName}
                onChange={(e) => setNewInsurerName(e.target.value)}
              />
              <Button
                variant="contained"
                size="small"
                disabled={!newInsurerName.trim()}
                onClick={async () => {
                  try {
                    const id = uuidv4();
                    await createInsurer({ id, name: newInsurerName.trim() });
                    setFormData((prev) => ({ ...prev, company: newInsurerName.trim() }));
                    setNewInsurerName('');
                    setAddingInsurer(false);
                  } catch (error) {
                    console.error('Chyba pri vytváraní poisťovne:', error);
                    alert('Chyba pri vytváraní poisťovne');
                  }
                }}
              >Pridať</Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAddingInsurer(false);
                  setNewInsurerName('');
                }}
              >Zrušiť</Button>
            </Box>
          )}
        </FormControl>

        <TextField
          fullWidth
          label="Cena (€)"
          type="number"
          value={formData.price}
          onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
          required
        />

        <TextField
          fullWidth
          label="Platná od"
          type="date"
          value={
            formData.validFrom && !isNaN(new Date(formData.validFrom).getTime())
              ? new Date(formData.validFrom).toISOString().split('T')[0]
              : ''
          }
          onChange={(e) => handleInputChange('validFrom', new Date(e.target.value))}
          InputLabelProps={{ shrink: true }}
          required
        />

        <TextField
          fullWidth
          label="Platná do"
          type="date"
          value={
            formData.validTo && !isNaN(new Date(formData.validTo).getTime())
              ? new Date(formData.validTo).toISOString().split('T')[0]
              : ''
          }
          onChange={(e) => handleInputChange('validTo', new Date(e.target.value))}
          InputLabelProps={{ shrink: true }}
          required
        />

        <FormControl fullWidth>
          <InputLabel>Frekvencia platenia</InputLabel>
          <Select
            value={formData.paymentFrequency || 'yearly'}
            onChange={(e) => handleInputChange('paymentFrequency', e.target.value as PaymentFrequency)}
            label="Frekvencia platenia"
            required
          >
            <MenuItem value="monthly">Mesačne</MenuItem>
            <MenuItem value="quarterly">Štvrťročne</MenuItem>
            <MenuItem value="biannual">Polročne</MenuItem>
            <MenuItem value="yearly">Ročne</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="outlined" onClick={onCancel}>
          Zrušiť
        </Button>
        <Button type="submit" variant="contained">
          {insurance ? 'Uložiť zmeny' : 'Pridať poistku'}
        </Button>
      </Box>
    </Box>
  );
} 