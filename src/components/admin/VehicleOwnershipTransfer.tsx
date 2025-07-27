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
  AccordionDetails
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  DirectionsCar as CarIcon,
  Business as CompanyIcon,
  CalendarToday as DateIcon
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
  
  // History dialog states
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [ownershipHistory, setOwnershipHistory] = useState<OwnershipHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<any>(null);

  const transferReasons = [
    { value: 'sale', label: 'Predaj' },
    { value: 'acquisition', label: 'Kúpa' },
    { value: 'lease_end', label: 'Ukončenie leasingu' },
    { value: 'lease_transfer', label: 'Transfer leasingu' },
    { value: 'merger', label: 'Fúzia firiem' },
    { value: 'administrative', label: 'Administratívna zmena' },
    { value: 'manual_transfer', label: 'Manuálny transfer' }
  ];

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
        
        // Refresh vehicles data
        window.location.reload(); // Simple refresh, môžeme neskôr optimalizovať
        
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

  const handleShowHistory = async (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    setSelectedVehicleForHistory(vehicle);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/ownership-history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOwnershipHistory(data.data.ownershipHistory);
      } else {
        console.error('Failed to load ownership history:', data.error);
        setOwnershipHistory([]);
      }

    } catch (error) {
      console.error('History loading error:', error);
      setOwnershipHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const currentOwnerCompany = companies.find(c => c.id === selectedVehicle?.ownerCompanyId);

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TransferIcon />
        Vehicle Ownership Transfer
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔄 Transfer vlastníctva vozidla
          </Typography>

          <Stack spacing={3}>
            {/* Vehicle Selection */}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <CarIcon fontSize="small" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1">
                            {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Súčasný majiteľ: {ownerCompany?.name || 'Neznámy'}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowHistory(vehicle.id);
                          }}
                          startIcon={<HistoryIcon />}
                        >
                          História
                        </Button>
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

            {/* New Owner Selection */}
            <FormControl fullWidth>
              <InputLabel>Nový majiteľ</InputLabel>
              <Select
                value={newOwnerCompanyId}
                onChange={(e) => setNewOwnerCompanyId(e.target.value)}
                label="Nový majiteľ"
                disabled={!selectedVehicleId}
              >
                {companies
                  .filter(c => c.id !== currentOwnerCompany?.id) // Exclude current owner
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

            {/* Transfer Details */}
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
              sx={{ alignSelf: 'flex-start' }}
            >
              {loading ? 'Spracovávam...' : 'Transferovať vlastníctvo'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Ownership History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            História vlastníctva - {selectedVehicleForHistory?.brand} {selectedVehicleForHistory?.model}
          </Box>
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {ownershipHistory.length === 0 ? (
                <Typography color="textSecondary">
                  Žiadna história vlastníctva nenájdená.
                </Typography>
              ) : (
                ownershipHistory.map((entry, index) => (
                  <Card key={entry.id} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {entry.ownerCompanyName}
                        </Typography>
                        <Chip
                          label={index === 0 ? 'Aktuálny' : 'Historický'}
                          color={index === 0 ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        <strong>Platnosť:</strong> {format(new Date(entry.validFrom), 'dd.MM.yyyy', { locale: sk })}
                        {entry.validTo && ` - ${format(new Date(entry.validTo), 'dd.MM.yyyy', { locale: sk })}`}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        <strong>Dôvod:</strong> {transferReasons.find(r => r.value === entry.transferReason)?.label || entry.transferReason}
                      </Typography>
                      
                      {entry.transferNotes && (
                        <Typography variant="body2" color="textSecondary">
                          <strong>Poznámky:</strong> {entry.transferNotes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Zavrieť
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleOwnershipTransfer; 