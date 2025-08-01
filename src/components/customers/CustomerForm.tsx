import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { Customer } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleInputChange = (field: keyof Customer, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      alert('Meno zákazníka je povinné');
      return;
    }

    const completeCustomer: Customer = {
      id: customer?.id || uuidv4(),
      name: formData.name.trim(),
      email: formData.email?.trim() || '',
      phone: formData.phone?.trim() || '',
      createdAt: customer?.createdAt || new Date(),
    };
    
    onSave(completeCustomer);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {customer ? 'Upraviť zákazníka' : 'Nový zákazník'}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Meno zákazníka"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            
            <TextField
              fullWidth
              label="Telefón"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="outlined" onClick={onCancel}>
              Zrušiť
            </Button>
            <Button type="submit" variant="contained">
              {customer ? 'Uložiť zmeny' : 'Pridať zákazníka'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 