import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Autocomplete,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { Rental, Vehicle, Customer } from '../../types';
import { apiService } from '../../services/api';

interface EditRentalDialogProps {
  open: boolean;
  rental: Rental | null;
  vehicles: Vehicle[];
  customers: Customer[];
  onClose: () => void;
  onSave: (updatedRental: Partial<Rental>) => void;
}

const EditRentalDialog: React.FC<EditRentalDialogProps> = ({
  open,
  rental,
  vehicles,
  customers,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Rental>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rental && open) {
      setFormData({
        customerName: rental.customerName,
        customerEmail: rental.customerEmail,
        customerPhone: rental.customerPhone,
        vehicleId: rental.vehicleId,
        vehicleName: rental.vehicleName,
        vehicleCode: rental.vehicleCode,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalPrice: rental.totalPrice,
        deposit: rental.deposit,
        handoverPlace: rental.handoverPlace,
        dailyKilometers: rental.dailyKilometers,
        paymentMethod: rental.paymentMethod,
        notes: rental.notes,
      });
      setError(null);
    }
  }, [rental, open]);

  const handleSave = async () => {
    if (!rental) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.customerName || !formData.startDate || !formData.endDate || !formData.totalPrice) {
        setError('Vyplňte všetky povinné polia');
        return;
      }

      // Update rental via API
      await apiService.updatePendingRental(rental.id, formData);
      
      onSave(formData);
      onClose();
    } catch (err: any) {
      console.error('Error updating rental:', err);
      setError('Nepodarilo sa uložiť zmeny');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Rental, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
  const selectedCustomer = customers.find(c => c.name === formData.customerName);

  if (!rental) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Upraviť prenájom - {rental.orderNumber}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Customer Info */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Zákazník
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Meno zákazníka *"
              value={formData.customerName || ''}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefón"
              value={formData.customerPhone || ''}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
            />
          </Grid>

          {/* Vehicle Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Vozidlo
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Autocomplete
              options={vehicles}
              getOptionLabel={(option) => `${option.brand} ${option.model} (${option.licensePlate})`}
              value={selectedVehicle || null}
              onChange={(_, newValue) => {
                handleInputChange('vehicleId', newValue?.id || '');
                handleInputChange('vehicleName', newValue ? `${newValue.brand} ${newValue.model}` : '');
                handleInputChange('vehicleCode', newValue?.licensePlate || '');
              }}
              renderInput={(params) => (
                <TextField {...params} label="Vyberte vozidlo" fullWidth />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Kód vozidla"
              value={formData.vehicleCode || ''}
              onChange={(e) => handleInputChange('vehicleCode', e.target.value)}
            />
          </Grid>

          {/* Rental Dates */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Termín prenájmu
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Začiatok prenájmu *"
              value={formData.startDate ? dayjs(formData.startDate) : null}
              onChange={(newValue) => handleInputChange('startDate', newValue?.toDate())}
              slots={{
                textField: TextField,
              }}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Koniec prenájmu *"
              value={formData.endDate ? dayjs(formData.endDate) : null}
              onChange={(newValue) => handleInputChange('endDate', newValue?.toDate())}
              slots={{
                textField: TextField,
              }}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />
          </Grid>

          {/* Financial Info */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Ceny a platba
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Celková cena *"
              type="number"
              value={formData.totalPrice || ''}
              onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value) || 0)}
              InputProps={{ endAdornment: '€' }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Depozit"
              type="number"
              value={formData.deposit || ''}
              onChange={(e) => handleInputChange('deposit', parseFloat(e.target.value) || 0)}
              InputProps={{ endAdornment: '€' }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Spôsob platby</InputLabel>
              <Select
                value={formData.paymentMethod || 'cash'}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              >
                <MenuItem value="cash">Hotovosť</MenuItem>
                <MenuItem value="bank_transfer">Prevod</MenuItem>
                <MenuItem value="vrp">VRP</MenuItem>
                <MenuItem value="direct_to_owner">Priamo majiteľovi</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Additional Info */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Dodatočné informácie
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Miesto odovzdania"
              value={formData.handoverPlace || ''}
              onChange={(e) => handleInputChange('handoverPlace', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Denný km limit"
              type="number"
              value={formData.dailyKilometers || ''}
              onChange={(e) => handleInputChange('dailyKilometers', parseInt(e.target.value) || 0)}
              InputProps={{ endAdornment: 'km' }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Poznámky"
              multiline
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Zrušiť
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Ukladám...' : 'Uložiť zmeny'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditRentalDialog;