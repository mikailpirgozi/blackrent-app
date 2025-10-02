import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { Customer } from '../../types';

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

export default function CustomerForm({
  customer,
  onSave,
  onCancel,
}: CustomerFormProps) {
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
    <form onSubmit={handleSubmit} className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {customer ? 'Upraviť zákazníka' : 'Nový zákazník'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name">Meno zákazníka *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefón</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={onCancel}>
              Zrušiť
            </Button>
            <Button type="submit">
              {customer ? 'Uložiť zmeny' : 'Pridať zákazníka'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
