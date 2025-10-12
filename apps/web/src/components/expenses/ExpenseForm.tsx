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
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaskedDateInput } from '@/components/ui/MaskedDateInput';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useCompanies,
  useCreateCompany,
} from '@/lib/react-query/hooks/useCompanies';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { Expense, ExpenseCategory } from '../../types';
// ✅ FIX: Import timezone-safe date utilities
import { parseDate } from '@/utils/dateUtils';
// ✅ FIX: Import toast hook
import { useExpenseToast } from '@/hooks/useExpenseToast';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSave: (_expense: Expense) => void;
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

  // ✅ FIX: Toast notifications
  const toastNotify = useExpenseToast();

  // Helper functions for compatibility
  // ✅ FIX: Use proper mutation hook for companies
  const createCompanyMutation = useCreateCompany();

  const createCompany = async (company: {
    id: string;
    name: string;
    commissionRate: number;
    isActive: boolean;
    createdAt: Date;
  }) => {
    return createCompanyMutation.mutateAsync(company);
  };
  const getFilteredVehicles = () => vehicles;
  const allVehicles = getFilteredVehicles();
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    date: undefined,
    vehicleId: '',
    company: '',
    category: 'other',
    note: '',
  });

  // ✅ FÁZA 2.3: Optimalizovaný companies select - useMemo namiesto triple .map()
  const uniqueCompanies = useMemo(() => {
    const companySet = new Set<string>();

    // Prioritizuj companies (najmenej záznamov)
    companies.forEach(c => {
      if (c.name) companySet.add(c.name);
    });

    // Pridaj len unikátne z vehicles (stredná veľkosť)
    vehicles.forEach(v => {
      if (v.company && !companySet.has(v.company)) {
        companySet.add(v.company);
      }
    });

    // ✅ VYNECHANÉ: expenses.map() - zbytočné (568+ iterácií)
    // Companies a vehicles už majú všetky potrebné firmy

    return Array.from(companySet).sort();
  }, [companies, vehicles]); // ✅ Expenses už nie sú v dependencies!

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
    <Card>
      <CardHeader>
        <CardTitle>
          {expense ? 'Upraviť náklad' : 'Pridať nový náklad'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Popis *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('description', e.target.value)
                }
                required
                placeholder="Zadajte popis nákladu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Suma (€) - voliteľné</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(
                    'amount',
                    e.target.value ? parseFloat(e.target.value) : 0
                  )
                }
                placeholder="Zadajte sumu alebo nechajte prázdne"
              />
            </div>

            <div className="space-y-2">
              <Label>Dátum *</Label>
              <MaskedDateInput
                value={parseDate(
                  formData.date as string | Date | null | undefined
                )}
                onChange={date => handleInputChange('date', date || undefined)}
              />
            </div>

            <SearchableSelect
              label="Kategória"
              required
              value={formData.category || ''}
              onValueChange={value => handleInputChange('category', value)}
              options={
                categories.length > 0
                  ? categories.map(category => ({
                      value: category.name,
                      label: category.displayName,
                      searchText: category.name,
                    }))
                  : [
                      { value: 'service', label: 'Servis' },
                      { value: 'insurance', label: 'Poistenie' },
                      { value: 'fuel', label: 'Palivo' },
                      { value: 'other', label: 'Iné' },
                    ]
              }
              placeholder="Vyberte kategóriu"
              searchPlaceholder="Hľadať kategóriu..."
              emptyMessage="Žiadna kategória nenájdená."
            />

            <div>
              <SearchableSelect
                label="Firma"
                required
                value={formData.company || ''}
                onValueChange={value => handleInputChange('company', value)}
                options={uniqueCompanies.map(company => ({
                  value: company,
                  label: company,
                }))}
                placeholder="Vyberte firmu"
                searchPlaceholder="Hľadať firmu..."
                emptyMessage="Žiadna firma nenájdená."
                showAddNew
                onAddNew={() => setAddingCompany(true)}
                addNewLabel="+ Pridať novú firmu"
              />
              {addingCompany && (
                <div className="flex gap-2 mt-2">
                  <Input
                    autoFocus
                    placeholder="Nová firma"
                    value={newCompanyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewCompanyName(e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    size="sm"
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
                        toastNotify.error('Chyba pri vytváraní firmy');
                      }
                    }}
                  >
                    Pridať
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAddingCompany(false);
                      setNewCompanyName('');
                    }}
                  >
                    Zrušiť
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle">Vozidlo (voliteľné)</Label>
              <Select
                value={formData.vehicleId || ''}
                onValueChange={(value: string) =>
                  handleInputChange('vehicleId', value || undefined)
                }
                disabled={!formData.company}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      formData.company ? 'Bez vozidla' : 'Najprv vyberte firmu'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-vehicle">
                    {formData.company ? 'Bez vozidla' : 'Najprv vyberte firmu'}
                  </SelectItem>
                  {getVehiclesForCompany(formData.company || '').map(
                    vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Poznámka (voliteľné)</Label>
              <textarea
                id="note"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.note || ''}
                onChange={e => handleInputChange('note', e.target.value)}
                placeholder="Zadajte dodatočné informácie k nákladu..."
                rows={3}
              />
            </div>
          </div>

          <div className="col-span-full flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={onCancel}>
              Zrušiť
            </Button>
            <Button type="submit">
              {expense ? 'Uložiť zmeny' : 'Pridať náklad'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
