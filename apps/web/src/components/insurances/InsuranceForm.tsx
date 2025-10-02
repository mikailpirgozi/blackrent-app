import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useCreateInsurer,
  useInsurers,
} from '@/lib/react-query/hooks/useInsurers';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { Insurance, PaymentFrequency } from '@/types';

interface InsuranceFormProps {
  insurance?: Insurance | null;
  onSave: (insurance: Insurance) => void;
  onCancel: () => void;
}

export default function InsuranceForm({
  insurance,
  onSave,
  onCancel,
}: InsuranceFormProps) {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: insurers = [] } = useInsurers();
  const { data: vehicles = [] } = useVehicles();
  const createInsurerMutation = useCreateInsurer();

  // Helper functions for compatibility
  const createInsurer = async (insurer: { id: string; name: string }) => {
    return createInsurerMutation.mutateAsync(insurer);
  };
  const getEnhancedFilteredVehicles = () => vehicles; // Simple implementation for now
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

  const handleInputChange = (
    field: keyof Insurance,
    value: string | number | boolean | Date
  ) => {
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
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Selection */}
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vozidlo *</Label>
          <Select
            value={formData.vehicleId || ''}
            onValueChange={(value) => handleInputChange('vehicleId', value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Vyberte vozidlo..." />
            </SelectTrigger>
            <SelectContent>
              {getEnhancedFilteredVehicles()
                .slice()
                .sort((a, b) => {
                  const aText = `${a.brand} ${a.model} (${a.licensePlate})`;
                  const bText = `${b.brand} ${b.model} (${b.licensePlate})`;
                  return aText.localeCompare(bText, 'sk', { sensitivity: 'base' });
                })
                .map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Typ poistky */}
        <div className="space-y-2">
          <Label htmlFor="type">Typ poistky *</Label>
          <Select
            value={formData.type || ''}
            onValueChange={(value) => handleInputChange('type', value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Vyberte typ poistky..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PZP">PZP</SelectItem>
              <SelectItem value="PZP + Kasko">PZP + Kasko</SelectItem>
              <SelectItem value="Havarijná">Havarijná</SelectItem>
              <SelectItem value="GAP">GAP</SelectItem>
              <SelectItem value="Asistenčné služby">Asistenčné služby</SelectItem>
              <SelectItem value="Iné">Iné</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Číslo poistky */}
        <div className="space-y-2">
          <Label htmlFor="policyNumber">Číslo poistky *</Label>
          <Input
            id="policyNumber"
            value={formData.policyNumber || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange('policyNumber', e.target.value)}
            placeholder="Zadajte číslo poistky..."
            required
          />
        </div>

        {/* Poistovňa */}
        <div className="space-y-2">
          <Label htmlFor="company">Poistovňa *</Label>
          <Select
            value={formData.company || ''}
            onValueChange={(value) => {
              if (value === '__add_new__') {
                setAddingInsurer(true);
              } else {
                handleInputChange('company', value);
              }
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Vyberte poisťovňu..." />
            </SelectTrigger>
            <SelectContent>
              {insurers.map(insurer => (
                <SelectItem key={insurer.id} value={insurer.name}>
                  {insurer.name}
                </SelectItem>
              ))}
              <SelectItem value="__add_new__">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Pridať novú poisťovňu
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {addingInsurer && (
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Nová poisťovňa"
                value={newInsurerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewInsurerName(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                disabled={!newInsurerName.trim()}
                onClick={async () => {
                  try {
                    const id = uuidv4();
                    await createInsurer({ id, name: newInsurerName.trim() });
                    setFormData(prev => ({
                      ...prev,
                      company: newInsurerName.trim(),
                    }));
                    setNewInsurerName('');
                    setAddingInsurer(false);
                  } catch (error) {
                    console.error('Chyba pri vytváraní poisťovne:', error);
                    alert('Chyba pri vytváraní poisťovne');
                  }
                }}
              >
                Pridať
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddingInsurer(false);
                  setNewInsurerName('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Cena */}
        <div className="space-y-2">
          <Label htmlFor="price">Cena (€) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange('price', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>

        {/* Platná od */}
        <div className="space-y-2">
          <Label>Platná od *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.validFrom ? (
                  format(new Date(formData.validFrom), 'dd.MM.yyyy', { locale: sk })
                ) : (
                  <span>Vyberte dátum</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.validFrom ? new Date(formData.validFrom) : undefined}
                onSelect={(date) => handleInputChange('validFrom', date || new Date())}
                initialFocus
                locale={sk}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Platná do */}
        <div className="space-y-2">
          <Label>Platná do *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.validTo ? (
                  format(new Date(formData.validTo), 'dd.MM.yyyy', { locale: sk })
                ) : (
                  <span>Vyberte dátum</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.validTo ? new Date(formData.validTo) : undefined}
                onSelect={(date) => handleInputChange('validTo', date || new Date())}
                initialFocus
                locale={sk}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Frekvencia platenia */}
        <div className="space-y-2">
          <Label htmlFor="paymentFrequency">Frekvencia platenia *</Label>
          <Select
            value={formData.paymentFrequency || 'yearly'}
            onValueChange={(value) => handleInputChange('paymentFrequency', value as PaymentFrequency)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Vyberte frekvenciu..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mesačne</SelectItem>
              <SelectItem value="quarterly">Štvrťročne</SelectItem>
              <SelectItem value="biannual">Polročne</SelectItem>
              <SelectItem value="yearly">Ročne</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Zrušiť
        </Button>
        <Button type="submit">
          {insurance ? 'Uložiť zmeny' : 'Pridať poistku'}
        </Button>
      </div>
    </form>
  );
}
