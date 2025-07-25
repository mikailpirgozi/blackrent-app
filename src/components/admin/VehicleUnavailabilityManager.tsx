import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as MaintenanceIcon,
  Cancel as BlockedIcon,
  Engineering as ServiceIcon,
  Handyman as RepairIcon,
  CleaningServices as CleaningIcon,
  FactCheck as InspectionIcon,
  DirectionsCar as VehicleIcon,
  CalendarToday as CalendarIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { VehicleUnavailability, Vehicle } from '../../types';
import { useApp } from '../../context/AppContext';

interface VehicleUnavailabilityFormData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'maintenance' | 'service' | 'repair' | 'blocked' | 'cleaning' | 'inspection';
  notes?: string;
  priority: 1 | 2 | 3;
  recurring: boolean;
  recurringConfig?: {
    interval: 'days' | 'weeks' | 'months' | 'years';
    value: number;
  };
}

const VehicleUnavailabilityManager: React.FC = () => {
  const { state } = useApp();
  const [unavailabilities, setUnavailabilities] = useState<VehicleUnavailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VehicleUnavailability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<VehicleUnavailabilityFormData>({
    vehicleId: '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'maintenance',
    notes: '',
    priority: 2,
    recurring: false,
  });

  const fetchUnavailabilities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const response = await fetch('/api/vehicle-unavailability', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      if (data.success) {
        setUnavailabilities(data.data || []);
      } else {
        setError(data.error || 'Chyba pri načítavaní nedostupností');
      }
    } catch (err) {
      console.error('Error fetching unavailabilities:', err);
      setError('Chyba pri načítavaní nedostupností');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnavailabilities();
  }, []);

  const handleOpenDialog = (item?: VehicleUnavailability) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        vehicleId: item.vehicleId,
        startDate: format(new Date(item.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(item.endDate), 'yyyy-MM-dd'),
        reason: item.reason,
        type: item.type,
        notes: item.notes || '',
        priority: item.priority,
        recurring: item.recurring,
        recurringConfig: item.recurringConfig,
      });
    } else {
      setEditingItem(null);
      setFormData({
        vehicleId: '',
        startDate: '',
        endDate: '',
        reason: '',
        type: 'maintenance',
        notes: '',
        priority: 2,
        recurring: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validation
      if (!formData.vehicleId || !formData.startDate || !formData.endDate || !formData.reason.trim()) {
        setError('Všetky povinné polia musia byť vyplnené');
        return;
      }

      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setError('Dátum ukončenia nemôže byť skorší ako dátum začiatku');
        return;
      }

      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const url = editingItem 
        ? `/api/vehicle-unavailability/${editingItem.id}`
        : '/api/vehicle-unavailability';
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingItem ? 'Nedostupnosť úspešne aktualizovaná' : 'Nedostupnosť úspešne vytvorená');
        await fetchUnavailabilities();
        setTimeout(() => {
          handleCloseDialog();
        }, 1500);
      } else {
        setError(data.error || 'Chyba pri ukladaní nedostupnosti');
      }
    } catch (err) {
      console.error('Error saving unavailability:', err);
      setError('Chyba pri ukladaní nedostupnosti');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Naozaj chcete zmazať túto nedostupnosť?')) {
      return;
    }

    try {
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const response = await fetch(`/api/vehicle-unavailability/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Nedostupnosť úspešne zmazaná');
        await fetchUnavailabilities();
      } else {
        setError(data.error || 'Chyba pri mazaní nedostupnosti');
      }
    } catch (err) {
      console.error('Error deleting unavailability:', err);
      setError('Chyba pri mazaní nedostupnosti');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <MaintenanceIcon />;
      case 'service': return <ServiceIcon />;
      case 'repair': return <RepairIcon />;
      case 'blocked': return <BlockedIcon />;
      case 'cleaning': return <CleaningIcon />;
      case 'inspection': return <InspectionIcon />;
      default: return <MaintenanceIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'maintenance': return 'Údržba';
      case 'service': return 'Servis';
      case 'repair': return 'Oprava';
      case 'blocked': return 'Blokované';
      case 'cleaning': return 'Čistenie';
      case 'inspection': return 'Kontrola';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'info';
      case 'service': return 'primary';
      case 'repair': return 'error';
      case 'blocked': return 'secondary';
      case 'cleaning': return 'success';
      case 'inspection': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Kritická';
      case 2: return 'Normálna';
      case 3: return 'Nízka';
      default: return 'Normálna';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'error';
      case 2: return 'primary';
      case 3: return 'success';
      default: return 'primary';
    }
  };

  const getVehicleLabel = (vehicleId: string) => {
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'Neznáme vozidlo';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Načítavam nedostupnosti vozidiel...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <MaintenanceIcon />
              Správa nedostupností vozidiel
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Pridať nedostupnosť
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vozidlo</TableCell>
                  <TableCell>Typ</TableCell>
                  <TableCell>Dôvod</TableCell>
                  <TableCell>Dátumy</TableCell>
                  <TableCell>Priorita</TableCell>
                  <TableCell>Akcie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unavailabilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        Žiadne nedostupnosti vozidiel
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  unavailabilities.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <VehicleIcon fontSize="small" />
                          {getVehicleLabel(item.vehicleId)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(item.type)}
                          label={getTypeLabel(item.type)}
                          color={getTypeColor(item.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {item.reason}
                        </Typography>
                        {item.notes && (
                          <Typography variant="caption" color="textSecondary">
                            {item.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                          <CalendarIcon fontSize="small" />
                          <Typography variant="body2">
                            {format(new Date(item.startDate), 'dd.MM.yyyy', { locale: sk })} - {format(new Date(item.endDate), 'dd.MM.yyyy', { locale: sk })}
                          </Typography>
                        </Box>
                        {item.recurring && (
                          <Chip label="Opakujúce sa" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<PriorityIcon fontSize="small" />}
                          label={getPriorityLabel(item.priority)}
                          color={getPriorityColor(item.priority) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Upraviť">
                          <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Zmazať">
                          <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Upraviť nedostupnosť' : 'Pridať nedostupnosť'}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                value={state.vehicles.find(v => v.id === formData.vehicleId) || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, vehicleId: newValue?.id || '' }));
                }}
                options={state.vehicles}
                getOptionLabel={(option) => `${option.brand} ${option.model} (${option.licensePlate})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vozidlo"
                    required
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Dátum začiatku"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Dátum ukončenia"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Typ nedostupnosti</InputLabel>
                <Select
                  value={formData.type}
                  label="Typ nedostupnosti"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="maintenance">🔧 Údržba</MenuItem>
                  <MenuItem value="service">⚙️ Servis</MenuItem>
                  <MenuItem value="repair">🔨 Oprava</MenuItem>
                  <MenuItem value="blocked">🚫 Blokované</MenuItem>
                  <MenuItem value="cleaning">🧽 Čistenie</MenuItem>
                  <MenuItem value="inspection">✅ Kontrola</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priorita</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priorita"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value={1}>🔴 Kritická</MenuItem>
                  <MenuItem value={2}>🟡 Normálna</MenuItem>
                  <MenuItem value={3}>🟢 Nízka</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Dôvod nedostupnosti"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                fullWidth
                required
                placeholder="Napr. Pravidelný servis, Oprava brzd, Čistenie..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Poznámky"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                placeholder="Dodatočné informácie..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Zrušiť
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Ukladám...' : (editingItem ? 'Uložiť' : 'Pridať')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleUnavailabilityManager; 