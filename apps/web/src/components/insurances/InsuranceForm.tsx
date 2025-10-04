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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Plus, X, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useCreateInsurer,
  useDeleteInsurer,
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
  const deleteInsurerMutation = useDeleteInsurer();

  // Helper functions for compatibility
  const createInsurer = async (insurer: { id: string; name: string }) => {
    return createInsurerMutation.mutateAsync(insurer);
  };
  const getEnhancedFilteredVehicles = () => vehicles; // Simple implementation for now
  const [addingInsurer, setAddingInsurer] = useState(false);
  const [newInsurerName, setNewInsurerName] = useState('');
  const [manageInsurersOpen, setManageInsurersOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [insurerToDelete, setInsurerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formData, setFormData] = useState<Partial<Insurance>>({
    vehicleId: '',
    type: '',
    policyNumber: '',
    validFrom: undefined,
    validTo: undefined,
    price: 0,
    company: '',
    paymentFrequency: 'yearly',
    deductibleAmount: undefined,
    deductiblePercentage: undefined,
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
      // 💰 SPOLUÚČASŤ: Zahrnúť nové polia (voliteľné)
      ...(formData.deductibleAmount !== undefined && {
        deductibleAmount: formData.deductibleAmount,
      }),
      ...(formData.deductiblePercentage !== undefined && {
        deductiblePercentage: formData.deductiblePercentage,
      }),
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
            onValueChange={value => handleInputChange('vehicleId', value)}
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
                  return aText.localeCompare(bText, 'sk', {
                    sensitivity: 'base',
                  });
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
            onValueChange={value => handleInputChange('type', value)}
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
              <SelectItem value="Asistenčné služby">
                Asistenčné služby
              </SelectItem>
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
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => handleInputChange('policyNumber', e.target.value)}
            placeholder="Zadajte číslo poistky..."
            required
          />
        </div>

        {/* Poistovňa */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="company">Poistovňa *</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setManageInsurersOpen(true)}
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              Spravovať
            </Button>
          </div>
          <Select
            value={formData.company || ''}
            onValueChange={value => {
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
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => setNewInsurerName(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                disabled={!newInsurerName.trim()}
                onClick={async () => {
                  try {
                    const trimmedName = newInsurerName.trim();

                    // 🔍 Kontrola duplicít
                    const duplicate = insurers.find(
                      ins =>
                        ins.name.toLowerCase() === trimmedName.toLowerCase()
                    );

                    if (duplicate) {
                      alert(
                        `Poisťovňa "${trimmedName}" už existuje! Prosím vyber ju zo zoznamu.`
                      );
                      return;
                    }

                    const id = uuidv4();
                    await createInsurer({ id, name: trimmedName });
                    setFormData(prev => ({
                      ...prev,
                      company: trimmedName,
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
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => handleInputChange('price', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>

        {/* Platnosť poistky */}
        <div className="col-span-full">
          <DateRangePicker
            label="Platnosť poistky *"
            placeholder="Vyberte obdobie platnosti"
            value={{
              from: formData.validFrom ? new Date(formData.validFrom) : null,
              to: formData.validTo ? new Date(formData.validTo) : null,
            }}
            onChange={value => {
              if (value.from) handleInputChange('validFrom', value.from);
              if (value.to) handleInputChange('validTo', value.to);
            }}
            required
          />
        </div>

        {/* Frekvencia platenia */}
        <div className="space-y-2">
          <Label htmlFor="paymentFrequency">Frekvencia platenia *</Label>
          <Select
            value={formData.paymentFrequency || 'yearly'}
            onValueChange={value =>
              handleInputChange('paymentFrequency', value as PaymentFrequency)
            }
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

        {/* 💰 SPOLUÚČASŤ: Výška v EUR */}
        <div className="space-y-2">
          <Label htmlFor="deductibleAmount">
            Spoluúčasť (€)
            <span className="text-muted-foreground text-xs ml-2">
              voliteľné
            </span>
          </Label>
          <Input
            id="deductibleAmount"
            type="number"
            value={formData.deductibleAmount ?? ''}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) =>
              handleInputChange(
                'deductibleAmount',
                e.target.value ? parseFloat(e.target.value) : ''
              )
            }
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* 💰 SPOLUÚČASŤ: Výška v % */}
        <div className="space-y-2">
          <Label htmlFor="deductiblePercentage">
            Spoluúčasť (%)
            <span className="text-muted-foreground text-xs ml-2">
              voliteľné
            </span>
          </Label>
          <Input
            id="deductiblePercentage"
            type="number"
            value={formData.deductiblePercentage ?? ''}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) =>
              handleInputChange(
                'deductiblePercentage',
                e.target.value ? parseFloat(e.target.value) : ''
              )
            }
            placeholder="0.00"
            step="0.01"
            min="0"
            max="100"
          />
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

      {/* Manage Insurers Dialog */}
      <Dialog
        open={manageInsurersOpen}
        onOpenChange={setManageInsurersOpen}
        modal={true}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e: Event) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Spravovať poisťovne</DialogTitle>
            <DialogDescription>
              Vymazanie poisťovne je možné len ak nie je priradená k žiadnej
              poistke.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {insurers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Zatiaľ nie sú vytvorené žiadne poisťovne.
              </p>
            ) : (
              insurers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, 'sk'))
                .map(insurer => (
                  <div
                    key={insurer.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-medium">{insurer.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setInsurerToDelete(insurer);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManageInsurersOpen(false)}
            >
              Zavrieť
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať poisťovňu?</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chceš vymazať poisťovňu{' '}
              <strong>{insurerToDelete?.name}</strong>?
              <br />
              Táto akcia je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!insurerToDelete) return;

                try {
                  await deleteInsurerMutation.mutateAsync(insurerToDelete.id);

                  // Ak bola vymazaná poisťovňa ktorá je aktuálne vybraná, vyčistiť selection
                  if (formData.company === insurerToDelete.name) {
                    setFormData(prev => ({ ...prev, company: '' }));
                  }

                  setInsurerToDelete(null);
                  setDeleteConfirmOpen(false);
                } catch (error) {
                  console.error('Chyba pri vymazávaní poisťovne:', error);
                  alert(
                    error instanceof Error
                      ? error.message
                      : 'Chyba pri vymazávaní poisťovne. Skontroluj či nie je priradená k žiadnej poistke.'
                  );
                }
              }}
            >
              Vymazať
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
