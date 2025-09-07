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
  Block as BlockIcon,
  DirectionsCar as RentedIcon,
  Build as ServiceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { addDays, format, isAfter } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';

import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import type { Vehicle } from '../../types';

interface AddUnavailabilityModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedVehicle?: Vehicle;
  preselectedDate?: Date;
  editingUnavailability?: {
    id: string;
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    type: string;
    reason: string;
    notes?: string;
    priority?: number;
    recurring?: boolean;
  };
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
  const { getFilteredVehicles } = useApp();
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

  const vehicles = getFilteredVehicles();

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

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
  const selectedType = UNAVAILABILITY_TYPES.find(
    t => t.value === formData.type
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pb: 1,
          }}
        >
          <BlockIcon color="primary" />
          <Typography variant="h6" component="span">
            {editingUnavailability
              ? '✏️ Upraviť nedostupnosť'
              : '🚫 Pridať nedostupnosť vozidla'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Vehicle Selection */}
            <Grid item xs={12}>
              <Autocomplete
                value={selectedVehicle || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    vehicleId: newValue?.id || '',
                  }));
                }}
                options={vehicles}
                getOptionLabel={vehicle =>
                  `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Vozidlo *"
                    placeholder="Vyberte vozidlo..."
                    error={!formData.vehicleId}
                  />
                )}
                renderOption={(props, vehicle) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.licensePlate} • {vehicle.company}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            {/* Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Typ nedostupnosti *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      type: e.target.value as
                        | 'rented'
                        | 'service'
                        | 'maintenance'
                        | 'repair'
                        | 'blocked',
                    }))
                  }
                  label="Typ nedostupnosti *"
                >
                  {UNAVAILABILITY_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box sx={{ color: type.color }}>{type.icon}</Box>
                        <Box>
                          <Typography variant="body1">{type.label}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid item xs={6}>
              <DatePicker
                label="Dátum začiatku *"
                value={formData.startDate}
                onChange={date =>
                  setFormData(prev => ({
                    ...prev,
                    startDate: date,
                  }))
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !formData.startDate,
                  },
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <DatePicker
                label="Dátum konca *"
                value={formData.endDate}
                onChange={date =>
                  setFormData(prev => ({
                    ...prev,
                    endDate: date,
                  }))
                }
                minDate={formData.startDate || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !formData.endDate,
                  },
                }}
              />
            </Grid>

            {/* Reason */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dôvod *"
                value={formData.reason}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                error={!formData.reason}
                helperText="Stručný popis dôvodu nedostupnosti"
              />
            </Grid>

            {/* Priority */}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priorita</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      priority: e.target.value as 1 | 2 | 3,
                    }))
                  }
                  label="Priorita"
                >
                  {PRIORITY_LEVELS.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: priority.color,
                          }}
                        />
                        {priority.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Poznámky"
                value={formData.notes}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Dodatočné informácie..."
              />
            </Grid>

            {/* Existing Unavailabilities */}
            {selectedVehicle && existingUnavailabilities.length > 0 && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'warning.light',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'warning.main',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <WarningIcon fontSize="small" />
                    Existujúce nedostupnosti pre toto vozidlo:
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {existingUnavailabilities
                      .slice(0, 3)
                      .map(
                        (unavail: Record<string, unknown>, index: number) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={String(unavail.type || 'N/A')}
                              size="small"
                              color="warning"
                            />
                            <Typography variant="body2">
                              {format(
                                new Date(String(unavail.start_date)),
                                'dd.MM.yyyy'
                              )}{' '}
                              -{' '}
                              {format(
                                new Date(String(unavail.end_date)),
                                'dd.MM.yyyy'
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {String(unavail.reason || 'N/A')}
                            </Typography>
                          </Box>
                        )
                      )}
                    {existingUnavailabilities.length > 3 && (
                      <Typography variant="body2" color="text.secondary">
                        ... a ďalších {existingUnavailabilities.length - 3}{' '}
                        nedostupností
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Summary */}
            {selectedVehicle && formData.startDate && formData.endDate && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Súhrn nedostupnosti:
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}
                  >
                    <Chip
                      label={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={selectedType?.label}
                      size="small"
                      sx={{ bgcolor: selectedType?.color, color: 'white' }}
                    />
                    <Chip
                      label={`${format(formData.startDate, 'dd.MM.yyyy')} - ${format(formData.endDate, 'dd.MM.yyyy')}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formData.reason}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Zrušiť
          </Button>

          {editingUnavailability && (
            <Button
              color="error"
              onClick={handleDelete}
              disabled={loading}
              sx={{ mr: 'auto' }}
            >
              {loading ? 'Ruším...' : 'Zrušiť nedostupnosť'}
            </Button>
          )}

          <Button
            variant="contained"
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
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddUnavailabilityModal;
