import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Paper
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  DirectionsCar as CarIcon,
  Business as CompanyIcon,
  CalendarToday as DateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { apiService, API_BASE_URL } from '../../services/api';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface OwnershipHistory {
  id: string;
  ownerCompanyId: string;
  ownerCompanyName: string;
  validFrom: string;
  validTo: string | null;
  transferReason: string;
  transferNotes: string | null;
}

interface VehicleWithHistory {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  ownerCompanyId: string;
  history: OwnershipHistory[];
}

const VehicleOwnershipTransfer: React.FC = () => {
  const { state } = useApp();
  const vehicles = state.vehicles || [];
  const companies = state.companies || [];

  // Transfer form states
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [newOwnerCompanyId, setNewOwnerCompanyId] = useState('');
  const [transferReason, setTransferReason] = useState('sale');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferDate, setTransferDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // History states
  const [vehiclesWithHistory, setVehiclesWithHistory] = useState<VehicleWithHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<OwnershipHistory | null>(null);
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');

  const transferReasons = [
    { value: 'sale', label: 'Predaj' },
    { value: 'acquisition', label: 'Kúpa' },
    { value: 'lease_end', label: 'Ukončenie leasingu' },
    { value: 'lease_transfer', label: 'Transfer leasingu' },
    { value: 'merger', label: 'Fúzia firiem' },
    { value: 'administrative', label: 'Administratívna zmena' },
    { value: 'manual_transfer', label: 'Manuálny transfer' }
  ];

  // Načítanie histórie pre všetky vozidlá
  const loadAllVehicleHistories = async () => {
    setHistoryLoading(true);
    try {
      const vehiclesWithHistoryData: VehicleWithHistory[] = [];
      
      for (const vehicle of vehicles) {
        try {
          const response = await fetch(`${API_BASE_URL}/vehicles/${vehicle.id}/ownership-history`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            vehiclesWithHistoryData.push({
              id: vehicle.id,
              brand: vehicle.brand,
              model: vehicle.model,
              licensePlate: vehicle.licensePlate,
              ownerCompanyId: vehicle.ownerCompanyId || '',
              history: data.data.ownershipHistory || []
            });
          }
        } catch (error) {
          console.error(`Failed to load history for vehicle ${vehicle.id}:`, error);
        }
      }
      
      setVehiclesWithHistory(vehiclesWithHistoryData);
    } catch (error) {
      console.error('Failed to load vehicle histories:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Načítanie histórie pri mount
  useEffect(() => {
    if (vehicles.length > 0) {
      loadAllVehicleHistories();
    }
  }, [vehicles]);

  const handleTransferSubmit = async () => {
    if (!selectedVehicleId || !newOwnerCompanyId) {
      setMessage({ type: 'error', text: 'Vyberte vozidlo a novú firmu' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${selectedVehicleId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        },
        body: JSON.stringify({
          newOwnerCompanyId,
          transferReason,
          transferNotes: transferNotes.trim() || null,
          transferDate: new Date(transferDate).toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Transfer ownership úspešný!' 
        });
        
        // Reset form
        setSelectedVehicleId('');
        setNewOwnerCompanyId('');
        setTransferReason('sale');
        setTransferNotes('');
        setTransferDate(format(new Date(), 'yyyy-MM-dd'));
        
        // Refresh history
        await loadAllVehicleHistories();
        
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Transfer sa nepodaril' 
        });
      }

    } catch (error) {
      console.error('Transfer error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Chyba pri transfere ownership' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransfer = (transfer: OwnershipHistory) => {
    setEditingTransfer(transfer);
    setEditCompanyId(transfer.ownerCompanyId);
    setEditReason(transfer.transferReason);
    setEditNotes(transfer.transferNotes || '');
    setEditDate(format(new Date(transfer.validFrom), 'yyyy-MM-dd'));
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingTransfer) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/ownership-history/${editingTransfer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        },
        body: JSON.stringify({
          ownerCompanyId: editCompanyId,
          transferReason: editReason,
          transferNotes: editNotes.trim() || null,
          validFrom: new Date(editDate).toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Transfer úspešne upravený!' });
        setEditDialogOpen(false);
        await loadAllVehicleHistories();
      } else {
        setMessage({ type: 'error', text: data.error || 'Úprava sa nepodarila' });
      }

    } catch (error) {
      console.error('Edit error:', error);
      setMessage({ type: 'error', text: 'Chyba pri úprave transferu' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransfer = async (transfer: OwnershipHistory) => {
    if (!confirm(`Naozaj chcete vymazať tento transfer vlastníctva?\n\nFirma: ${transfer.ownerCompanyName}\nDátum: ${format(new Date(transfer.validFrom), 'dd.MM.yyyy')}`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/ownership-history/${transfer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Transfer úspešne vymazaný!' });
        await loadAllVehicleHistories();
      } else {
        setMessage({ type: 'error', text: data.error || 'Vymazanie sa nepodarilo' });
      }

    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Chyba pri vymazávaní transferu' });
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const currentOwnerCompany = companies.find(c => c.id === selectedVehicle?.ownerCompanyId);

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TransferIcon />
        Transfer vlastníctva vozidiel
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Ľavá strana - Nový transfer */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SwapHoriz />
                Nový transfer vlastníctva
              </Typography>

              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Vozidlo</InputLabel>
                  <Select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    label="Vozidlo"
                  >
                    {vehicles.map((vehicle) => {
                      const ownerCompany = companies.find(c => c.id === vehicle.ownerCompanyId);
                      return (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CarIcon fontSize="small" />
                            <Box>
                              <Typography variant="body1">
                                {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Majiteľ: {ownerCompany?.name || 'Neznámy'}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                {selectedVehicle && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Aktuálny majiteľ:</strong> {currentOwnerCompany?.name || 'Neznámy'}
                    </Typography>
                  </Alert>
                )}

                <FormControl fullWidth>
                  <InputLabel>Nový majiteľ</InputLabel>
                  <Select
                    value={newOwnerCompanyId}
                    onChange={(e) => setNewOwnerCompanyId(e.target.value)}
                    label="Nový majiteľ"
                    disabled={!selectedVehicleId}
                  >
                    {companies
                      .filter(c => c.id !== currentOwnerCompany?.id)
                      .map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CompanyIcon fontSize="small" />
                            {company.name}
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Dôvod transferu</InputLabel>
                    <Select
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      label="Dôvod transferu"
                    >
                      {transferReasons.map((reason) => (
                        <MenuItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Dátum transferu"
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <DateIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Box>

                <TextField
                  label="Poznámky (voliteľné)"
                  multiline
                  rows={3}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Ďalšie informácie o transfere..."
                />

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleTransferSubmit}
                  disabled={loading || !selectedVehicleId || !newOwnerCompanyId}
                  startIcon={loading ? <CircularProgress size={20} /> : <TransferIcon />}
                >
                  {loading ? 'Spracovávam...' : 'Transferovať vlastníctvo'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Pravá strana - História transferov */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon />
                  História transferov vlastníctva
                </Typography>
                <Tooltip title="Obnoviť históriu">
                  <IconButton onClick={loadAllVehicleHistories} disabled={historyLoading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={2} sx={{ maxHeight: '600px', overflow: 'auto' }}>
                  {vehiclesWithHistory.length === 0 ? (
                    <Typography color="textSecondary">
                      Žiadne vozidlá s históriou nenájdené.
                    </Typography>
                  ) : (
                    vehiclesWithHistory.map((vehicle) => (
                      <Accordion key={vehicle.id}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CarIcon />
                            <Typography variant="subtitle1">
                              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                            </Typography>
                            <Chip 
                              label={`${vehicle.history.length} transferov`}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={2}>
                            {vehicle.history.length === 0 ? (
                              <Typography color="textSecondary">
                                Žiadna história transferov.
                              </Typography>
                            ) : (
                              vehicle.history.map((transfer, index) => (
                                <Paper key={transfer.id} variant="outlined" sx={{ p: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CompanyIcon fontSize="small" />
                                        <Typography variant="subtitle2">
                                          {transfer.ownerCompanyName}
                                        </Typography>
                                        <Chip
                                          label={index === 0 ? 'Aktuálny' : 'Historický'}
                                          color={index === 0 ? 'primary' : 'default'}
                                          size="small"
                                        />
                                      </Box>
                                      
                                      <Typography variant="body2" color="textSecondary" gutterBottom>
                                        <strong>Platnosť:</strong> {format(new Date(transfer.validFrom), 'dd.MM.yyyy', { locale: sk })}
                                        {transfer.validTo && ` - ${format(new Date(transfer.validTo), 'dd.MM.yyyy', { locale: sk })}`}
                                      </Typography>
                                      
                                      <Typography variant="body2" color="textSecondary" gutterBottom>
                                        <strong>Dôvod:</strong> {transferReasons.find(r => r.value === transfer.transferReason)?.label || transfer.transferReason}
                                      </Typography>
                                      
                                      {transfer.transferNotes && (
                                        <Typography variant="body2" color="textSecondary">
                                          <strong>Poznámky:</strong> {transfer.transferNotes}
                                        </Typography>
                                      )}
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Tooltip title="Upraviť transfer">
                                        <IconButton 
                                          size="small" 
                                          onClick={() => handleEditTransfer(transfer)}
                                          color="primary"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Vymazať transfer">
                                        <IconButton 
                                          size="small" 
                                          onClick={() => handleDeleteTransfer(transfer)}
                                          color="error"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Paper>
                              ))
                            )}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Transfer Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Upraviť transfer vlastníctva
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Firma</InputLabel>
              <Select
                value={editCompanyId}
                onChange={(e) => setEditCompanyId(e.target.value)}
                label="Firma"
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CompanyIcon fontSize="small" />
                      {company.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Dôvod transferu</InputLabel>
              <Select
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                label="Dôvod transferu"
              >
                {transferReasons.map((reason) => (
                  <MenuItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Dátum platnosti"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Poznámky"
              multiline
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            startIcon={<CancelIcon />}
          >
            Zrušiť
          </Button>
          <Button 
            onClick={handleEditSubmit}
            variant="contained"
            disabled={loading || !editCompanyId || !editReason || !editDate}
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {loading ? 'Ukladám...' : 'Uložiť'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleOwnershipTransfer; 