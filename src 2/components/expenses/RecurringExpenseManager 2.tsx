import {
  Add as AddIcon,
  Cancel as CancelIcon,
  Business as CompanyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Euro as EuroIcon,
  Event as EventIcon,
  PlayArrow as GenerateIcon,
  Repeat as RepeatIcon,
  Save as SaveIcon,
  DirectionsCar as VehicleIcon,
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import { useCompanies } from '@/lib/react-query/hooks/useCompanies';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { apiService } from '../../services/api';
import type { ExpenseCategory, RecurringExpense, Vehicle } from '../../types';

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: 0,
    category: 'other',
    company: '',
    vehicleId: '',
    note: '',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
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
        expenseCategories.length > 0 ? expenseCategories[0].name : 'other',
      company: '',
      vehicleId: '',
      note: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
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
    // Bezpečná konverzia dátumov
    const startDateStr = (() => {
      try {
        const date =
          typeof recurring.startDate === 'string'
            ? new Date(recurring.startDate)
            : recurring.startDate;
        return isNaN(date.getTime())
          ? new Date().toISOString().split('T')[0]
          : date.toISOString().split('T')[0];
      } catch (error) {
        return new Date().toISOString().split('T')[0];
      }
    })();

    const endDateStr = (() => {
      if (!recurring.endDate) return '';
      try {
        const date =
          typeof recurring.endDate === 'string'
            ? new Date(recurring.endDate)
            : recurring.endDate;
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
      } catch (error) {
        return '';
      }
    })();

    setFormData({
      name: recurring.name,
      description: recurring.description,
      amount: recurring.amount,
      category: recurring.category,
      company: recurring.company,
      vehicleId: recurring.vehicleId || '',
      note: recurring.note || '',
      frequency: recurring.frequency,
      startDate: startDateStr,
      endDate: endDateStr,
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
          setTimeout(() => {
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
    if (window.confirm('Vygenerovať všetky splatné pravidelné náklady?')) {
      setLoading(true);
      setError(null);
      try {
        // TODO: Implement generateRecurringExpenses in API service
        console.warn('generateRecurringExpenses not implemented yet');
        const result = { generated: 0, skipped: 0 };
        setSuccess(
          `Generovanie dokončené: ${result.generated} vytvorených, ${result.skipped} preskočených`
        );
        await loadData();
        onExpensesChanged?.();
      } catch (error: unknown) {
        setError('Chyba pri generovaní: ' + (error as Error).message);
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
        // Aktualizácia
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
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          dayOfMonth: formData.dayOfMonth,
          isActive: formData.isActive,
          updatedAt: new Date(),
        };
        // 🚀 OPTIMISTIC UPDATE: Aktualizuj stav okamžite
        console.log('Updating recurring expense in state:', updatedRecurring);
        setRecurringExpenses(prev =>
          prev.map(r => (r.id === editingRecurring.id ? updatedRecurring : r))
        );

        // Zatvor dialog a resetuj form
        setFormOpen(false);
        resetForm();
        setEditingRecurring(null);

        setSuccess('Pravidelný náklad úspešne aktualizovaný');

        // Zavolaj callback ak existuje
        onExpensesChanged?.();

        // 🔄 API call na pozadí (bez čakania)
        apiService.updateRecurringExpense(updatedRecurring).catch(error => {
          console.error('Error updating recurring expense:', error);
          // V prípade chyby môžeme zobraziť notifikáciu
          setError(
            'Chyba pri ukladaní na serveri - zmeny sú dočasne len lokálne'
          );
        });
      } else {
        // Vytvorenie
        const newRecurring = await apiService.createRecurringExpense({
          name: formData.name.trim(),
          description: formData.description.trim(),
          amount: formData.amount,
          category: formData.category,
          company: formData.company.trim(),
          vehicleId: formData.vehicleId || undefined,
          note: formData.note.trim() || undefined,
          frequency: formData.frequency,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          dayOfMonth: formData.dayOfMonth,
          isActive: formData.isActive,
        });

        console.log('Created recurring expense:', newRecurring);

        // Pridaj nový náklad priamo do stavu PRED zatvorením dialogu
        if (newRecurring && newRecurring.id) {
          setRecurringExpenses(prev => {
            console.log('Previous state:', prev);
            const updated = [...prev, newRecurring];
            console.log('New state:', updated);
            return updated;
          });

          setSuccess('Pravidelný náklad úspešne vytvorený');

          // Zatvor dialog až po úspešnom pridaní
          setTimeout(() => {
            setFormOpen(false);
            resetForm();
          }, 100);

          // Zavolaj callback ak existuje
          onExpensesChanged?.();
        } else {
          throw new Error('Nepodarilo sa vytvoriť pravidelný náklad');
        }
      }
    } catch (error: unknown) {
      console.error('Error saving recurring expense:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Neznáma chyba';
      setError(`Chyba pri ukladaní: ${errorMessage}`);
      // Pri chybe nenačítavaj dáta a nerefreshuj
      setLoading(false);
      return;
    }

    setLoading(false);
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
    } catch (error) {
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <RepeatIcon sx={{ color: '#1976d2' }} />
        Pravidelné mesačné náklady
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Error/Success alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {/* Header s tlačidlami */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Pravidelné náklady ({recurringExpenses.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<GenerateIcon />}
              onClick={handleGenerateAll}
              disabled={loading}
              sx={{
                borderColor: '#4caf50',
                color: '#4caf50',
                '&:hover': {
                  borderColor: '#388e3c',
                  bgcolor: 'rgba(76, 175, 80, 0.04)',
                },
              }}
            >
              Vygenerovať všetky splatné
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRecurring}
              disabled={loading}
            >
              Pridať pravidelný náklad
            </Button>
          </Box>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Zoznam pravidelných nákladov */}
        <Box
          sx={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 1,
            border: '1px solid #e0e0e0',
          }}
        >
          <List>
            {recurringExpenses.map((recurring, index) => {
              const category = expenseCategories.find(
                c => c.name === recurring.category
              );
              const vehicle = recurring.vehicleId
                ? allVehicles.find((v: Vehicle) => v.id === recurring.vehicleId)
                : null;
              const isOverdue =
                recurring.nextGenerationDate &&
                recurring.nextGenerationDate < new Date();

              return (
                <React.Fragment key={recurring.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      backgroundColor: isOverdue ? '#fff3e0' : 'transparent',
                      '&:hover': {
                        backgroundColor: isOverdue ? '#ffe0b2' : '#f5f5f5',
                      },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      {/* Primary content */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {recurring.name}
                        </Typography>
                        <Chip
                          label={category?.displayName || recurring.category}
                          color={category?.color || 'primary'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={getFrequencyText(recurring.frequency)}
                          variant="outlined"
                          size="small"
                        />
                        {!recurring.isActive && (
                          <Chip
                            label="Neaktívny"
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>

                      {/* Secondary content */}
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{ mb: 1, fontWeight: 500 }}
                        >
                          {recurring.description}
                        </Typography>

                        <Grid
                          container
                          spacing={2}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          <Grid item xs={12} sm={6} md={3}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <EuroIcon
                                fontSize="small"
                                sx={{ color: 'text.secondary' }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: '#1976d2' }}
                              >
                                {recurring.amount.toFixed(2)}€
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <CompanyIcon
                                fontSize="small"
                                sx={{ color: 'text.secondary' }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {recurring.company}
                              </Typography>
                            </Box>
                          </Grid>
                          {vehicle && (
                            <Grid item xs={12} sm={6} md={3}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <VehicleIcon
                                  fontSize="small"
                                  sx={{ color: 'text.secondary' }}
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {vehicle.brand} {vehicle.model}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          <Grid item xs={12} sm={6} md={3}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <EventIcon
                                fontSize="small"
                                sx={{ color: 'text.secondary' }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Ďalší:{' '}
                                {getNextGenerationText(
                                  recurring.nextGenerationDate
                                )}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {recurring.note && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 1,
                              fontStyle: 'italic',
                              color: 'text.secondary',
                              p: 1,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 1,
                            }}
                          >
                            {recurring.note}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            mt: 1,
                            display: 'flex',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Vygenerované: {recurring.totalGenerated}x
                          </Typography>
                          {recurring.lastGeneratedDate && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
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
                                } catch (error) {
                                  return 'Neplatný dátum';
                                }
                              })()}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            | Každý {recurring.dayOfMonth}. deň v mesiaci
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {recurring.isActive && (
                          <Tooltip title="Vygenerovať teraz">
                            <IconButton
                              size="small"
                              onClick={() => handleGenerateNow(recurring)}
                              disabled={loading}
                              sx={{
                                backgroundColor: '#e8f5e8',
                                color: '#4caf50',
                                '&:hover': { backgroundColor: '#c8e6c9' },
                              }}
                            >
                              <GenerateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Upraviť">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRecurring(recurring)}
                            disabled={loading}
                            sx={{
                              backgroundColor: '#f5f5f5',
                              '&:hover': { backgroundColor: '#e0e0e0' },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Zmazať">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRecurring(recurring)}
                            disabled={loading}
                            sx={{
                              backgroundColor: '#ffebee',
                              color: '#d32f2f',
                              '&:hover': { backgroundColor: '#ffcdd2' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < recurringExpenses.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}

            {recurringExpenses.length === 0 && !loading && (
              <ListItem>
                <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Žiadne pravidelné náklady nenájdené
                  </Typography>
                </Box>
              </ListItem>
            )}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Button onClick={onClose} variant="outlined">
          Zavrieť
        </Button>
      </DialogActions>

      {/* Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={handleFormCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <RepeatIcon />
          {editingRecurring
            ? 'Upraviť pravidelný náklad'
            : 'Pridať pravidelný náklad'}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Názov *"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                required
                helperText="Názov pre identifikáciu (napr. 'Poistenie BMW X5')"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Suma (€) *"
                type="number"
                value={formData.amount || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis nákladu *"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
                helperText="Tento text sa použije v generovaných nákladoch"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Kategória</InputLabel>
                <Select
                  value={formData.category}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, category: e.target.value }))
                  }
                  label="Kategória"
                >
                  {expenseCategories.map(category => (
                    <MenuItem key={category.name} value={category.name}>
                      {category.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                fullWidth
                options={companies}
                getOptionLabel={option => option.name}
                value={companies.find(c => c.name === formData.company) || null}
                onChange={(_, newValue) => {
                  const newCompany = newValue?.name || '';
                  setFormData(prev => ({
                    ...prev,
                    company: newCompany,
                    // Vymaž vybrané vozidlo ak sa zmenila firma
                    vehicleId:
                      prev.company === newCompany ? prev.vehicleId : '',
                  }));
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Firma *"
                    required
                    placeholder="Začnite písať pre vyhľadanie firmy..."
                  />
                )}
                noOptionsText="Žiadne firmy nenájdené"
                filterOptions={(options, { inputValue }) => {
                  const filtered = options.filter(option =>
                    option.name.toLowerCase().includes(inputValue.toLowerCase())
                  );
                  return filtered;
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                fullWidth
                options={[
                  { id: '', brand: '', model: '', licensePlate: 'Bez vozidla' },
                  ...getVehiclesForCompany(formData.company),
                ]}
                getOptionLabel={option =>
                  option.id === ''
                    ? 'Bez vozidla'
                    : `${option.brand} ${option.model} - ${option.licensePlate}`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={
                  getVehiclesForCompany(formData.company).find(
                    v => v.id === formData.vehicleId
                  ) || {
                    id: '',
                    brand: '',
                    model: '',
                    licensePlate: 'Bez vozidla',
                  }
                }
                onChange={(_, newValue) =>
                  setFormData(prev => ({
                    ...prev,
                    vehicleId: newValue?.id || '',
                  }))
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Vozidlo"
                    placeholder="Začnite písať pre vyhľadanie vozidla..."
                    helperText={
                      formData.company
                        ? `Vozidlá pre firmu: ${formData.company}`
                        : 'Najprv vyberte firmu'
                    }
                  />
                )}
                noOptionsText={
                  formData.company
                    ? 'Žiadne vozidlá nenájdené pre túto firmu'
                    : 'Najprv vyberte firmu'
                }
                disabled={!formData.company}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const filtered = options.filter(option => {
                    if (option.id === '') return true; // Vždy zobraz "Bez vozidla"
                    const searchText =
                      `${option.brand} ${option.model} ${option.licensePlate}`.toLowerCase();
                    return searchText.includes(inputValue.toLowerCase());
                  });
                  return filtered;
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Frekvencia</InputLabel>
                <Select
                  value={formData.frequency}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      frequency: e.target.value as
                        | 'monthly'
                        | 'quarterly'
                        | 'yearly',
                    }))
                  }
                  label="Frekvencia"
                >
                  {FREQUENCY_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <span>{option.icon}</span>
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Začiatok platnosti"
                type="date"
                value={formData.startDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, startDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Koniec platnosti"
                type="date"
                value={formData.endDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                helperText="Voliteľné - nechajte prázdne pre nekonečne"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deň v mesiaci"
                type="number"
                value={formData.dayOfMonth}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    dayOfMonth: parseInt(e.target.value) || 1,
                  }))
                }
                inputProps={{ min: 1, max: 28 }}
                helperText="Deň kedy sa má vygenerovať náklad (1-28)"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                }
                label="Aktívny"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Poznámka"
                value={formData.note}
                onChange={e =>
                  setFormData(prev => ({ ...prev, note: e.target.value }))
                }
                multiline
                rows={2}
                helperText="Voliteľná poznámka pre generované náklady"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleFormCancel}
            variant="outlined"
            startIcon={<CancelIcon />}
          >
            Zrušiť
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={
              loading ||
              !formData.name.trim() ||
              !formData.description.trim() ||
              !formData.category ||
              !formData.company.trim() ||
              formData.amount <= 0
            }
          >
            {editingRecurring ? 'Aktualizovať' : 'Vytvoriť'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default RecurringExpenseManager;
