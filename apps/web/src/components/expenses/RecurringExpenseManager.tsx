import {
  Plus as AddIcon,
  X as CancelIcon,
  Building2 as CompanyIcon,
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  Euro as EuroIcon,
  Calendar as EventIcon,
  Play as GenerateIcon,
  Repeat as RepeatIcon,
  Save as SaveIcon,
  Car as VehicleIcon,
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Typography } from '../ui/typography';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { DateRangePicker } from '../ui/date-range-picker';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import { useCompanies } from '@/lib/react-query/hooks/useCompanies';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { apiService } from '../../services/api';
import type { ExpenseCategory, RecurringExpense, Vehicle } from '../../types';
import { logger } from '@/utils/smartLogger';
// ✅ FIX: Import timezone-safe date utilities
import { parseDate, formatDateToString } from '@/utils/dateUtils';

interface RecurringExpenseManagerProps {
  open: boolean;
  onClose: () => void;
  onExpensesChanged?: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Mesačne', icon: '📅' },
  { value: 'quarterly', label: 'Štvrťročne', icon: '📆' },
  { value: 'yearly', label: 'Ročne', icon: '🗓️' },
];

const RecurringExpenseManager: React.FC<RecurringExpenseManagerProps> = ({
  open,
  onClose,
  onExpensesChanged,
}) => {
  // React Query hooks
  const { data: vehicles = [] } = useVehicles();
  const { data: companies = [] } = useCompanies();

  // Helper functions for compatibility
  const getFilteredVehicles = () => vehicles;
  const allVehicles = getFilteredVehicles();

  // Načítanie firiem z React Query
  // const activeCompanies = companies?.filter(c => c.isActive !== false) || [];

  // Filtrovanie vozidiel podľa vybranej firmy
  const getVehiclesForCompany = (companyName: string): Vehicle[] => {
    if (!companyName) return allVehicles;
    return allVehicles.filter(vehicle => vehicle.company === companyName);
  };

  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] =
    useState<RecurringExpense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    amount: number;
    category: string;
    company: string;
    vehicleId: string;
    note: string;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    startDate?: string;
    endDate?: string;
    dayOfMonth: number;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    amount: 0,
    category: 'other',
    company: '',
    vehicleId: '',
    note: '',
    frequency: 'monthly',
    startDate: undefined,
    endDate: undefined,
    dayOfMonth: 1,
    isActive: true,
  });

  // Načítanie dát
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recurring, categories] = await Promise.all([
        apiService.getRecurringExpenses(),
        apiService.getExpenseCategories(),
      ]);
      setRecurringExpenses(recurring);
      setExpenseCategories(categories);
    } catch (error: unknown) {
      setError('Chyba pri načítavaní dát: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: 0,
      category:
        expenseCategories.length > 0 ? expenseCategories[0]!.name : 'other',
      company: '',
      vehicleId: '',
      note: '',
      frequency: 'monthly',
      startDate: undefined,
      endDate: undefined,
      dayOfMonth: 1,
      isActive: true,
    });
    setEditingRecurring(null);
  };

  // Handlers
  const handleAddRecurring = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEditRecurring = (recurring: RecurringExpense) => {
    // ✅ FIX: Timezone-safe dátum konverzia
    const startDateStr = (() => {
      try {
        const date = parseDate(recurring.startDate);
        if (!date || isNaN(date.getTime())) {
          return formatDateToString(new Date()).split(' ')[0]!;
        }
        return formatDateToString(date).split(' ')[0]!;
      } catch (_error) {
        return formatDateToString(new Date()).split(' ')[0]!;
      }
    })();

    const endDateStr = (() => {
      if (!recurring.endDate) return '';
      try {
        const date = parseDate(recurring.endDate);
        if (!date || isNaN(date.getTime())) return '';
        return formatDateToString(date).split(' ')[0]!;
      } catch (_error) {
        return '';
      }
    })();

    setFormData({
      name: recurring.name,
      description: recurring.description,
      amount: recurring.amount,
      category: recurring.category,
      company: recurring.company,
      vehicleId: recurring.vehicleId ?? '',
      note: recurring.note ?? '',
      frequency: recurring.frequency,
      startDate: startDateStr,
      endDate: endDateStr || '',
      dayOfMonth: recurring.dayOfMonth,
      isActive: recurring.isActive,
    });
    setEditingRecurring(recurring);
    setFormOpen(true);
  };

  const handleDeleteRecurring = async (recurring: RecurringExpense) => {
    if (
      window.confirm(
        `Naozaj chcete zmazať pravidelný náklad "${recurring.name}"?\n\nToto neovplyvní už vygenerované náklady.`
      )
    ) {
      setLoading(true);
      setError(null);
      try {
        await apiService.deleteRecurringExpense(recurring.id);
        setSuccess('Pravidelný náklad úspešne zmazaný');
        await loadData();
      } catch (error: unknown) {
        setError('Chyba pri mazaní: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerateNow = async (recurring: RecurringExpense) => {
    if (
      window.confirm(
        `Vygenerovať náklad "${recurring.name}" pre aktuálny mesiac?`
      )
    ) {
      setLoading(true);
      setError(null);
      try {
        // Volanie API pre generovanie nákladu
        const response = await apiService.post<{
          generatedExpenseId: string;
        }>(`/recurring-expenses/${recurring.id}/generate`, {
          targetDate: new Date().toISOString(),
        });

        if (response) {
          setSuccess('Náklad úspešne vygenerovaný');

          // Aktualizuj stav recurring expense
          setRecurringExpenses(prev =>
            prev.map(r =>
              r.id === recurring.id
                ? {
                    ...r,
                    totalGenerated: (r.totalGenerated || 0) + 1,
                    lastGeneratedDate: new Date(),
                  }
                : r
            )
          );

          // Zavolaj callback pre refresh expenses
          onExpensesChanged?.();

          // Načítaj dáta s oneskorením
          window.setTimeout(() => {
            loadData();
          }, 500);
        }
      } catch (error: unknown) {
        setError('Chyba pri generovaní: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerateAll = async () => {
    if (
      window.confirm(
        'Vygenerovať všetky splatné pravidelné náklady?\n\nToto vytvorí nové náklady pre všetky aktívne pravidelné náklady ktorých nextGenerationDate už nastal.'
      )
    ) {
      setLoading(true);
      setError(null);
      try {
        const result = await apiService.generateAllRecurringExpenses();

        if (result.generated > 0) {
          setSuccess(
            `✅ Generovanie úspešné!\n\n` +
              `Vytvorených: ${result.generated}\n` +
              `Preskočených: ${result.skipped}\n` +
              (result.errors.length > 0 ? `Chýb: ${result.errors.length}` : '')
          );
        } else {
          setSuccess(
            `ℹ️ Žiadne náklady neboli vygenerované.\n\n` +
              `Všetky pravidelné náklady sú už aktuálne alebo nie sú ešte splatné.`
          );
        }

        await loadData();
        onExpensesChanged?.();
      } catch (error: unknown) {
        const errorMsg =
          error instanceof Error ? error.message : 'Neznáma chyba';
        setError(`❌ Chyba pri generovaní: ${errorMsg}`);
        logger.error('Generate all recurring expenses failed', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = async () => {
    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.category ||
      !formData.company.trim()
    ) {
      setError('Vyplňte všetky povinné polia');
      return;
    }

    if (formData.amount <= 0) {
      setError('Suma musí byť väčšia ako 0');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (editingRecurring) {
        // ✅ AKTUALIZÁCIA - čakaj na server response
        const updatedRecurring: RecurringExpense = {
          ...editingRecurring,
          name: formData.name.trim(),
          description: formData.description.trim(),
          amount: formData.amount,
          category: formData.category,
          company: formData.company.trim(),
          vehicleId: formData.vehicleId || undefined,
          note: formData.note.trim() || undefined,
          frequency: formData.frequency,
          startDate: new Date(formData.startDate || new Date()),
          endDate: formData.endDate ? new Date(formData.endDate!) : undefined,
          dayOfMonth: formData.dayOfMonth,
          isActive: formData.isActive,
          updatedAt: new Date(),
        };

        // ✅ Čakaj na server response
        await apiService.updateRecurringExpense(updatedRecurring);

        // ✅ Aktualizuj state až po úspešnom uložení
        logger.debug('Updating recurring expense in state:', updatedRecurring);
        setRecurringExpenses(prev =>
          prev.map(r => (r.id === editingRecurring.id ? updatedRecurring : r))
        );

        setSuccess('✅ Pravidelný náklad úspešne aktualizovaný');
        setFormOpen(false);
        resetForm();
        onExpensesChanged?.();
      } else {
        // ✅ VYTVORENIE
        const newRecurring = await apiService.createRecurringExpense({
          name: formData.name.trim(),
          description: formData.description.trim(),
          amount: formData.amount,
          category: formData.category,
          company: formData.company.trim(),
          vehicleId: formData.vehicleId || undefined,
          note: formData.note.trim() || undefined,
          frequency: formData.frequency,
          startDate: new Date(formData.startDate || new Date()),
          endDate: formData.endDate ? new Date(formData.endDate!) : undefined,
          dayOfMonth: formData.dayOfMonth,
          isActive: formData.isActive,
        });

        if (newRecurring && newRecurring.id) {
          logger.debug('Created recurring expense:', newRecurring);

          // ✅ Pridaj nový náklad do stavu
          setRecurringExpenses(prev => [...prev, newRecurring]);

          setSuccess('✅ Pravidelný náklad úspešne vytvorený');
          setFormOpen(false);
          resetForm();
          onExpensesChanged?.();
        } else {
          throw new Error('Nepodarilo sa vytvoriť pravidelný náklad');
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Neznáma chyba';
      setError(`❌ Chyba pri ukladaní: ${errorMessage}`);
      logger.error('Save recurring expense failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    resetForm();
    setError(null);
  };

  const getFrequencyText = (frequency: string) => {
    const option = FREQUENCY_OPTIONS.find(f => f.value === frequency);
    return option?.label || frequency;
  };

  const getNextGenerationText = (date?: Date | null) => {
    if (!date || date === null) return 'Nie je nastavené';

    // Validácia dátumu
    let validDate: Date;
    try {
      validDate = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(validDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (_error) {
      console.warn('Invalid date received:', date);
      return 'Neplatný dátum';
    }

    const now = new Date();
    const isOverdue = validDate < now;
    return (
      <span
        style={{
          color: isOverdue ? '#d32f2f' : '#1976d2',
          fontWeight: isOverdue ? 600 : 400,
        }}
      >
        {format(validDate, 'dd.MM.yyyy', { locale: sk })}
        {isOverdue && ' (splatné)'}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-muted/50 border-b pb-4">
            <RepeatIcon className="h-5 w-5 text-primary" />
            Pravidelné mesačné náklady
          </DialogTitle>
          <DialogDescription>
            Spravujte pravidelné náklady, ktoré sa majú automaticky generovať v
            stanovených intervaloch.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {/* Error/Success alerts */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Header s tlačidlami */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <Typography variant="h3" className="font-semibold">
              Pravidelné náklady ({recurringExpenses.length})
            </Typography>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleGenerateAll}
                disabled={loading}
                className="border-green-500 text-green-600 hover:border-green-700 hover:bg-green-50"
              >
                <GenerateIcon className="h-4 w-4 mr-2" />
                Vygenerovať všetky splatné
              </Button>
              <Button
                variant="default"
                onClick={handleAddRecurring}
                disabled={loading}
              >
                <AddIcon className="h-4 w-4 mr-2" />
                Pridať pravidelný náklad
              </Button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center my-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Zoznam pravidelných nákladov */}
          <div className="shadow-lg rounded-lg border border-border">
            <div className="divide-y divide-border">
              {recurringExpenses.map((recurring, index) => {
                const category = expenseCategories.find(
                  c => c.name === recurring.category
                );
                const vehicle = recurring.vehicleId
                  ? allVehicles.find(
                      (v: Vehicle) => v.id === recurring.vehicleId
                    )
                  : null;
                const isOverdue =
                  recurring.nextGenerationDate &&
                  recurring.nextGenerationDate < new Date();

                return (
                  <React.Fragment key={recurring.id}>
                    <div
                      className={`py-4 px-4 ${
                        isOverdue
                          ? 'bg-orange-50 hover:bg-orange-100'
                          : 'hover:bg-muted/50'
                      } transition-colors`}
                    >
                      <div className="flex-1">
                        {/* Primary content */}
                        <div className="flex items-center gap-2 mb-2">
                          <Typography variant="h3" className="font-semibold">
                            {recurring.name}
                          </Typography>
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold"
                          >
                            {category?.displayName || recurring.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getFrequencyText(recurring.frequency)}
                          </Badge>
                          {!recurring.isActive && (
                            <Badge variant="destructive" className="text-xs">
                              Neaktívny
                            </Badge>
                          )}
                        </div>

                        {/* Secondary content */}
                        <div className="mt-2">
                          <Typography
                            variant="body1"
                            className="mb-2 font-medium"
                          >
                            {recurring.description}
                          </Typography>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <EuroIcon className="h-4 w-4 text-muted-foreground" />
                              <Typography
                                variant="body2"
                                className="font-semibold text-primary"
                              >
                                {recurring.amount.toFixed(2)}€
                              </Typography>
                            </div>
                            <div className="flex items-center gap-1">
                              <CompanyIcon className="h-4 w-4 text-muted-foreground" />
                              <Typography
                                variant="body2"
                                className="text-muted-foreground"
                              >
                                {recurring.company}
                              </Typography>
                            </div>
                            {vehicle && (
                              <div className="flex items-center gap-1">
                                <VehicleIcon className="h-4 w-4 text-muted-foreground" />
                                <Typography
                                  variant="body2"
                                  className="text-muted-foreground"
                                >
                                  {vehicle.brand} {vehicle.model}
                                </Typography>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <EventIcon className="h-4 w-4 text-muted-foreground" />
                              <Typography
                                variant="body2"
                                className="text-muted-foreground"
                              >
                                Ďalší:{' '}
                                {getNextGenerationText(
                                  recurring.nextGenerationDate
                                )}
                              </Typography>
                            </div>
                          </div>

                          {recurring.note && (
                            <Typography
                              variant="body2"
                              className="mt-1 italic text-muted-foreground p-2 bg-muted rounded"
                            >
                              {recurring.note}
                            </Typography>
                          )}

                          <div className="mt-1 flex gap-1 flex-wrap">
                            <Typography
                              variant="caption"
                              className="text-muted-foreground"
                            >
                              Vygenerované: {recurring.totalGenerated}x
                            </Typography>
                            {recurring.lastGeneratedDate && (
                              <Typography
                                variant="caption"
                                className="text-muted-foreground"
                              >
                                | Posledný:{' '}
                                {(() => {
                                  try {
                                    const date =
                                      typeof recurring.lastGeneratedDate ===
                                      'string'
                                        ? new Date(recurring.lastGeneratedDate)
                                        : recurring.lastGeneratedDate;
                                    return isNaN(date.getTime())
                                      ? 'Neplatný dátum'
                                      : format(date, 'dd.MM.yyyy', {
                                          locale: sk,
                                        });
                                  } catch (_error) {
                                    return 'Neplatný dátum';
                                  }
                                })()}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              className="text-muted-foreground"
                            >
                              | Každý {recurring.dayOfMonth}. deň v mesiaci
                            </Typography>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 flex-wrap">
                        <TooltipProvider>
                          {recurring.isActive && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateNow(recurring)}
                                  disabled={loading}
                                  className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                                >
                                  <GenerateIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Vygenerovať teraz</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRecurring(recurring)}
                                disabled={loading}
                                className="bg-gray-50 hover:bg-gray-100"
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upraviť</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRecurring(recurring)}
                                disabled={loading}
                                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                              >
                                <DeleteIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Zmazať</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    {index < recurringExpenses.length - 1 && <Separator />}
                  </React.Fragment>
                );
              })}

              {recurringExpenses.length === 0 && !loading && (
                <div className="w-full text-center py-8">
                  <Typography variant="body1" className="text-muted-foreground">
                    Žiadne pravidelné náklady nenájdené
                  </Typography>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/50">
            <Button onClick={onClose} variant="outline">
              Zavrieť
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RepeatIcon className="h-5 w-5" />
              {editingRecurring
                ? 'Upraviť pravidelný náklad'
                : 'Pridať pravidelný náklad'}
            </DialogTitle>
            <DialogDescription>
              {editingRecurring
                ? 'Upravte nastavenia existujúceho pravidelného nákladu.'
                : 'Vytvorte nový pravidelný náklad s definovanou frekvenciou a podmienkami.'}
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Názov *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Názov pre identifikáciu (napr. 'Poistenie BMW X5')"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Suma (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount || ''}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setFormData(prev => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                  min={0}
                  step={0.01}
                />
              </div>

              <div className="col-span-full space-y-2">
                <Label htmlFor="description">Popis nákladu *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  required
                  placeholder="Tento text sa použije v generovaných nákladoch"
                />
              </div>

              <div className="col-span-full sm:col-span-1 md:col-span-1 space-y-2">
                <Label htmlFor="category">Kategória *</Label>
                <Select
                  value={formData.category}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kategóriu" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(category => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-full sm:col-span-1 md:col-span-1 space-y-2">
                <Label htmlFor="company">Firma *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {formData.company || 'Vyberte firmu...'}
                      <CompanyIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Hľadať firmu..." />
                      <CommandEmpty>Žiadne firmy nenájdené.</CommandEmpty>
                      <CommandGroup>
                        {companies.map(company => (
                          <CommandItem
                            key={company.name}
                            value={company.name}
                            onSelect={currentValue => {
                              setFormData(prev => ({
                                ...prev,
                                company: currentValue,
                                // Vymaž vybrané vozidlo ak sa zmenila firma
                                vehicleId:
                                  prev.company === currentValue
                                    ? prev.vehicleId
                                    : '',
                              }));
                            }}
                          >
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-full sm:col-span-1 md:col-span-1 space-y-2">
                <Label htmlFor="vehicle">Vozidlo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={!formData.company}
                    >
                      {(() => {
                        const selectedVehicle = getVehiclesForCompany(
                          formData.company
                        ).find(v => v.id === formData.vehicleId);
                        return selectedVehicle
                          ? `${selectedVehicle.brand} ${selectedVehicle.model} - ${selectedVehicle.licensePlate}`
                          : 'Bez vozidla';
                      })()}
                      <VehicleIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Hľadať vozidlo..." />
                      <CommandEmpty>
                        {formData.company
                          ? 'Žiadne vozidlá nenájdené pre túto firmu'
                          : 'Najprv vyberte firmu'}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() =>
                            setFormData(prev => ({
                              ...prev,
                              vehicleId: '',
                            }))
                          }
                        >
                          Bez vozidla
                        </CommandItem>
                        {getVehiclesForCompany(formData.company).map(
                          vehicle => (
                            <CommandItem
                              key={vehicle.id}
                              value={vehicle.id}
                              onSelect={() =>
                                setFormData(prev => ({
                                  ...prev,
                                  vehicleId: vehicle.id,
                                }))
                              }
                            >
                              {vehicle.brand} {vehicle.model} -{' '}
                              {vehicle.licensePlate}
                            </CommandItem>
                          )
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.company && (
                  <p className="text-sm text-muted-foreground">
                    Vozidlá pre firmu: {formData.company}
                  </p>
                )}
              </div>

              <div className="col-span-full sm:col-span-1 md:col-span-1 space-y-2">
                <Label htmlFor="frequency">Frekvencia *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      frequency: value as 'monthly' | 'quarterly' | 'yearly',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte frekvenciu" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-full">
                <DateRangePicker
                  label="Platnosť pravidelného nákladu *"
                  placeholder="Vyberte obdobie platnosti"
                  value={{
                    from: formData.startDate
                      ? new Date(formData.startDate)
                      : null,
                    to: formData.endDate ? new Date(formData.endDate) : null,
                  }}
                  onChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      startDate: value.from
                        ? value.from.toISOString().split('T')[0]
                        : '',
                      endDate: value.to
                        ? value.to.toISOString().split('T')[0]
                        : '',
                    }));
                  }}
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Koncový dátum je voliteľný - nechajte prázdny pre nekonečnú
                  platnosť
                </p>
              </div>

              <div className="col-span-full sm:col-span-1 space-y-2">
                <Label htmlFor="dayOfMonth">Deň v mesiaci *</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  value={formData.dayOfMonth}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setFormData(prev => ({
                      ...prev,
                      dayOfMonth: parseInt(e.target.value) || 1,
                    }))
                  }
                  min={1}
                  max={28}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Deň kedy sa má vygenerovať náklad (1-28)
                </p>
              </div>

              <div className="col-span-full sm:col-span-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={checked =>
                      setFormData(prev => ({
                        ...prev,
                        isActive: checked,
                      }))
                    }
                  />
                  <Label htmlFor="isActive">Aktívny</Label>
                </div>
              </div>

              <div className="col-span-full space-y-2">
                <Label htmlFor="note">Poznámka</Label>
                <Input
                  id="note"
                  value={formData.note}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Voliteľná poznámka pre generované náklady"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 gap-2">
            <Button onClick={handleFormCancel} variant="outline">
              <CancelIcon className="h-4 w-4 mr-2" />
              Zrušiť
            </Button>
            <Button
              onClick={handleFormSubmit}
              variant="default"
              disabled={
                loading ||
                !formData.name.trim() ||
                !formData.description.trim() ||
                !formData.category ||
                !formData.company.trim() ||
                formData.amount <= 0
              }
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {editingRecurring ? 'Aktualizovať' : 'Vytvoriť'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default RecurringExpenseManager;
