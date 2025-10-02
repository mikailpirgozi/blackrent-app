/**
 * 🚫 ADD UNAVAILABILITY MODAL
 *
 * Modal pre pridávanie nedostupnosti vozidiel
 * - Výber vozidla
 * - Typ nedostupnosti (prenájom mimo systém / servis)
 * - Dátumový rozsah
 * - Poznámky
 */

import {
  Square as BlockIcon,
  Car as RentedIcon,
  Wrench as ServiceIcon,
  AlertTriangle as WarningIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Button,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { addDays, format, isAfter } from 'date-fns';
import React, { useEffect, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // Migrated to React Query
import { useVehicles } from '../../lib/react-query/hooks/useVehicles';
import { apiService } from '../../services/api';
import type { Vehicle } from '../../types';

interface AddUnavailabilityModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedVehicle?: Vehicle | undefined;
  preselectedDate?: Date | undefined;
  editingUnavailability?: {
    id: string;
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    type: string;
    reason: string;
    notes?: string | undefined;
    priority?: number | undefined;
    recurring?: boolean | undefined;
  } | undefined;
}

interface UnavailabilityFormData {
  vehicleId: string;
  startDate: Date | null;
  endDate: Date | null;
  type: 'rented' | 'service' | 'maintenance' | 'repair' | 'blocked';
  reason: string;
  notes: string;
  priority: 1 | 2 | 3;
  recurring: boolean;
}

const UNAVAILABILITY_TYPES = [
  {
    value: 'rented' as const,
    label: 'Prenajatý mimo systém',
    icon: <RentedIcon />,
    color: '#ff9800',
    description:
      'Vozidlo si prenajal majiteľ alebo je prenajatý cez inú platformu',
  },
  {
    value: 'service' as const,
    label: 'Servis',
    icon: <ServiceIcon />,
    color: '#f44336',
    description: 'Vozidlo je v servise alebo na oprave',
  },
  {
    value: 'maintenance' as const,
    label: 'Údržba',
    icon: <ServiceIcon />,
    color: '#9c27b0',
    description: 'Plánovaná údržba vozidla',
  },
  {
    value: 'blocked' as const,
    label: 'Blokované',
    icon: <BlockIcon />,
    color: '#607d8b',
    description: 'Vozidlo je dočasne blokované',
  },
];

const PRIORITY_LEVELS = [
  { value: 1, label: 'Kritická', color: '#f44336' },
  { value: 2, label: 'Normálna', color: '#ff9800' },
  { value: 3, label: 'Nízka', color: '#4caf50' },
];

const AddUnavailabilityModal: React.FC<AddUnavailabilityModalProps> = ({
  open,
  onClose,
  onSuccess,
  preselectedVehicle,
  preselectedDate,
  editingUnavailability,
}) => {
  // const { getFilteredVehicles } = useApp(); // Migrated to React Query
  const { data: vehicles = [] } = useVehicles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingUnavailabilities, setExistingUnavailabilities] = useState<
    Record<string, unknown>[]
  >([]);

  const [formData, setFormData] = useState<UnavailabilityFormData>({
    vehicleId: '',
    startDate: null,
    endDate: null,
    type: 'rented',
    reason: '',
    notes: '',
    priority: 2,
    recurring: false,
  });

  const availableVehicles = vehicles;

  // Initialize form with preselected data or editing data
  useEffect(() => {
    if (open) {
      if (editingUnavailability) {
        // Editing existing unavailability
        setFormData({
          vehicleId: editingUnavailability.vehicleId.toString(),
          startDate: editingUnavailability.startDate,
          endDate: editingUnavailability.endDate,
          type: editingUnavailability.type as
            | 'rented'
            | 'service'
            | 'maintenance'
            | 'repair'
            | 'blocked',
          reason: editingUnavailability.reason,
          notes: editingUnavailability.notes || '',
          priority: (editingUnavailability.priority || 2) as 1 | 2 | 3,
          recurring: editingUnavailability.recurring || false,
        });
      } else {
        // Creating new unavailability - use preselected data
        if (preselectedVehicle) {
          setFormData(prev => ({
            ...prev,
            vehicleId: preselectedVehicle.id,
          }));
        }
        if (preselectedDate) {
          setFormData(prev => ({
            ...prev,
            startDate: preselectedDate,
            endDate: addDays(preselectedDate, 1), // Default to next day
          }));
        }
      }
    }
  }, [open, preselectedVehicle, preselectedDate, editingUnavailability]);

  // Auto-generate reason based on type
  useEffect(() => {
    const typeConfig = UNAVAILABILITY_TYPES.find(
      t => t.value === formData.type
    );
    if (typeConfig && !formData.reason) {
      setFormData(prev => ({
        ...prev,
        reason: typeConfig.description,
      }));
    }
  }, [formData.type, formData.reason]);

  // Load existing unavailabilities when vehicle changes
  useEffect(() => {
    if (formData.vehicleId && open) {
      loadExistingUnavailabilities(formData.vehicleId);
    }
  }, [formData.vehicleId, open]);

  const loadExistingUnavailabilities = async (vehicleId: string) => {
    try {
      const response = await apiService.get<{
        data: Record<string, unknown>[];
      }>(`/vehicle-unavailability?vehicleId=${vehicleId}`);
      setExistingUnavailabilities(response.data || []);
    } catch (err) {
      console.error('Error loading existing unavailabilities:', err);
      setExistingUnavailabilities([]);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (
        !formData.vehicleId ||
        !formData.startDate ||
        !formData.endDate ||
        !formData.reason
      ) {
        setError('Všetky povinné polia musia byť vyplnené');
        return;
      }

      if (isAfter(formData.startDate, formData.endDate)) {
        setError('Dátum začiatku musí byť pred dátumom konca');
        return;
      }

      if (editingUnavailability) {
        // Update existing unavailability
        await apiService.put(
          `/vehicle-unavailability/${editingUnavailability.id}`,
          {
            vehicleId: parseInt(formData.vehicleId),
            startDate: formData.startDate.toISOString(),
            endDate: formData.endDate.toISOString(),
            type: formData.type,
            reason: formData.reason,
            notes: formData.notes,
            priority: formData.priority,
            recurring: formData.recurring,
          }
        );
      } else {
        // Create new unavailability
        await apiService.post('/vehicle-unavailability', {
          vehicleId: parseInt(formData.vehicleId), // Convert string ID to integer for database
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          type: formData.type,
          reason: formData.reason,
          notes: formData.notes,
          priority: formData.priority,
          recurring: formData.recurring,
        });
      }

      onSuccess();
      handleClose();
    } catch (error: unknown) {
      console.error('Error creating unavailability:', error);

      // Handle specific error codes
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as {
          response?: { data?: { code?: string; error?: string } };
        };
        if (err.response?.data?.code === 'DUPLICATE_UNAVAILABILITY') {
          setError(err.response.data.error || 'Duplicitná nedostupnosť');
        } else {
          setError(
            err.response?.data?.error || 'Chyba pri vytváraní nedostupnosti'
          );
        }
      } else {
        setError('Chyba pri vytváraní nedostupnosti');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingUnavailability) return;

    // Check if this is a valid UUID (not a temporary/fallback ID)
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        editingUnavailability.id
      );

    if (!isValidUUID) {
      setError(
        'Nemožno zrušiť túto nedostupnosť. Skúste obnoviť stránku a skúsiť znovu.'
      );
      return;
    }

    if (!window.confirm('Naozaj chcete zrušiť túto nedostupnosť?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.delete(
        `/vehicle-unavailability/${editingUnavailability.id}`
      );
      onSuccess();
      handleClose();
    } catch (error: unknown) {
      console.error('Error deleting unavailability:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { error?: string } } };
        setError(err.response?.data?.error || 'Chyba pri rušení nedostupnosti');
      } else {
        setError('Chyba pri rušení nedostupnosti');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vehicleId: '',
      startDate: null,
      endDate: null,
      type: 'rented',
      reason: '',
      notes: '',
      priority: 2,
      recurring: false,
    });
    setError(null);
    onClose();
  };

  const selectedVehicle = availableVehicles.find(
    (v: Vehicle) => v.id === formData.vehicleId
  );
  const selectedType = UNAVAILABILITY_TYPES.find(
    t => t.value === formData.type
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BlockIcon className="h-5 w-5 text-primary" />
            {editingUnavailability
              ? '✏️ Upraviť nedostupnosť'
              : '🚫 Pridať nedostupnosť vozidla'}
          </DialogTitle>
          <DialogDescription>
            {editingUnavailability
              ? 'Upravte informácie o nedostupnosti vozidla'
              : 'Pridajte novú nedostupnosť pre vybrané vozidlo'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label htmlFor="vehicle-select">Vozidlo *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !formData.vehicleId && "text-muted-foreground"
                    )}
                  >
                    {selectedVehicle
                      ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.licensePlate})`
                      : "Vyberte vozidlo..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Hľadať vozidlo..." />
                    <CommandList>
                      <CommandEmpty>Žiadne vozidlo sa nenašlo.</CommandEmpty>
                      <CommandGroup>
                        {availableVehicles.map((vehicle: Vehicle) => (
                          <CommandItem
                            key={vehicle.id}
                            value={`${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate}`}
                            onSelect={() => {
                              setFormData(prev => ({
                                ...prev,
                                vehicleId: vehicle.id,
                              }));
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {vehicle.brand} {vehicle.model}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {vehicle.licensePlate} • {vehicle.company}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {!formData.vehicleId && (
                <p className="text-sm text-red-500">Vozidlo je povinné</p>
              )}
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="type-select">Typ nedostupnosti *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    type: value as
                      | 'rented'
                      | 'service'
                      | 'maintenance'
                      | 'repair'
                      | 'blocked',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vyberte typ nedostupnosti..." />
                </SelectTrigger>
                <SelectContent>
                  {UNAVAILABILITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div style={{ color: type.color }}>{type.icon}</div>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Dátum začiatku *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      {formData.startDate ? (
                        format(formData.startDate, 'dd.MM.yyyy')
                      ) : (
                        "Vyberte dátum začiatku"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate || undefined}
                      onSelect={(date) =>
                        setFormData(prev => ({
                          ...prev,
                          startDate: date || null,
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {!formData.startDate && (
                  <p className="text-sm text-red-500">Dátum začiatku je povinný</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">Dátum konca *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      {formData.endDate ? (
                        format(formData.endDate, 'dd.MM.yyyy')
                      ) : (
                        "Vyberte dátum konca"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) =>
                        setFormData(prev => ({
                          ...prev,
                          endDate: date || null,
                        }))
                      }
                      disabled={(date) =>
                        formData.startDate ? date < formData.startDate : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {!formData.endDate && (
                  <p className="text-sm text-red-500">Dátum konca je povinný</p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Dôvod *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData(prev => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Stručný popis dôvodu nedostupnosti"
                className={cn(!formData.reason && "border-red-500")}
              />
              {!formData.reason && (
                <p className="text-sm text-red-500">Dôvod je povinný</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priorita</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    priority: parseInt(value) as 1 | 2 | 3,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vyberte prioritu..." />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map(priority => (
                    <SelectItem key={priority.value} value={priority.value.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: priority.color }}
                        />
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData(prev => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Dodatočné informácie..."
              />
            </div>

            {/* Existing Unavailabilities */}
            {selectedVehicle && existingUnavailabilities.length > 0 && (
              <div className="space-y-2">
                <Alert>
                  <WarningIcon className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">
                      Existujúce nedostupnosti pre toto vozidlo:
                    </div>
                    <div className="space-y-2">
                      {existingUnavailabilities
                        .slice(0, 3)
                        .map(
                          (unavail: Record<string, unknown>, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Badge variant="outline" className="text-xs">
                                {String(unavail.type || 'N/A')}
                              </Badge>
                              <span className="text-sm">
                                {format(
                                  new Date(String(unavail.start_date)),
                                  'dd.MM.yyyy'
                                )}{' '}
                                -{' '}
                                {format(
                                  new Date(String(unavail.end_date)),
                                  'dd.MM.yyyy'
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {String(unavail.reason || 'N/A')}
                              </span>
                            </div>
                          )
                        )}
                      {existingUnavailabilities.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          ... a ďalších {existingUnavailabilities.length - 3}{' '}
                          nedostupností
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Summary */}
            {selectedVehicle && formData.startDate && formData.endDate && (
              <div className="space-y-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="font-medium mb-2">
                      Súhrn nedostupnosti:
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="default">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </Badge>
                      <Badge
                        variant="secondary"
                        style={{ 
                          backgroundColor: selectedType?.color, 
                          color: 'white' 
                        }}
                      >
                        {selectedType?.label}
                      </Badge>
                      <Badge variant="outline">
                        {format(formData.startDate, 'dd.MM.yyyy')} - {format(formData.endDate, 'dd.MM.yyyy')}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formData.reason}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button onClick={handleClose} disabled={loading} variant="outline">
              Zrušiť
            </Button>

            {editingUnavailability && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Ruším...' : 'Zrušiť nedostupnosť'}
              </Button>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.vehicleId ||
              !formData.startDate ||
              !formData.endDate ||
              !formData.reason
            }
          >
            {loading
              ? editingUnavailability
                ? 'Upravujem...'
                : 'Vytváram...'
              : editingUnavailability
                ? 'Uložiť zmeny'
                : 'Vytvoriť nedostupnosť'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUnavailabilityModal;
