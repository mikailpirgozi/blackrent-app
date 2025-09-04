import { Edit as EditIcon, Percent as PercentIcon } from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import React, { useEffect, useState } from 'react';

import { apiService } from '../../services/api';
import type { Customer, Rental, Vehicle } from '../../types';
import { calculateRentalDays } from '../../utils/rentalDaysCalculator';

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
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Rental>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [showDiscountCommission, setShowDiscountCommission] = useState(false);

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
        discount: rental.discount,
        customCommission: rental.customCommission,
        // 🔄 OPRAVA: Pridané isFlexible pole
        isFlexible: rental.isFlexible || false,
        flexibleEndDate: rental.flexibleEndDate,
      });
      setCalculatedPrice(rental.totalPrice || 0);
      setCalculatedCommission(rental.commission || 0);
      setError(null);
    }
  }, [rental, open]);

  // ✅ MIGRÁCIA: Zakomentovaná stará implementácia nahradená centrálnou funkciou

  // Auto-calculate price and commission when relevant fields change
  useEffect(() => {
    // 🔄 OPRAVA: Pre flexibilné prenájmy neprepočítavaj automaticky ceny
    if (formData.isFlexible) {
      return;
    }

    if (!formData.vehicleId || !formData.startDate || !formData.endDate) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (!vehicle) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    // Calculate rental days
    const startDate =
      formData.startDate instanceof Date
        ? formData.startDate
        : new Date(formData.startDate || '');
    const endDate =
      formData.endDate instanceof Date
        ? formData.endDate
        : new Date(formData.endDate || '');

    // Removed unused startDateOnly and endDateOnly variables

    // ✅ MIGRÁCIA: Používame centrálnu utility funkciu calculateRentalDays
    const days = calculateRentalDays(startDate, endDate);

    // Find pricing tier
    const pricingTier = vehicle.pricing?.find(
      p => days >= p.minDays && days <= p.maxDays
    );
    if (!pricingTier) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    // Calculate base price
    const basePrice = pricingTier.pricePerDay * days;

    // Apply discount
    let discount = 0;
    if (formData.discount?.value && formData.discount.value > 0) {
      if (formData.discount.type === 'percentage') {
        discount = (basePrice * formData.discount.value) / 100;
      } else {
        discount = formData.discount.value;
      }
    }

    const basePriceAfterDiscount = Math.max(0, basePrice - discount);
    setCalculatedPrice(basePriceAfterDiscount);

    // Calculate commission
    let commission = 0;
    if (
      formData.customCommission?.value &&
      formData.customCommission.value > 0
    ) {
      if (formData.customCommission.type === 'percentage') {
        commission =
          (basePriceAfterDiscount * formData.customCommission.value) / 100;
      } else {
        commission = formData.customCommission.value;
      }
    } else if (vehicle.commission) {
      if (vehicle.commission.type === 'percentage') {
        commission = (basePriceAfterDiscount * vehicle.commission.value) / 100;
      } else {
        commission = vehicle.commission.value;
      }
    }
    setCalculatedCommission(commission);

    // Update formData with calculated price
    setFormData(prev => ({
      ...prev,
      totalPrice: basePriceAfterDiscount,
      commission: commission,
    }));
  }, [
    formData.vehicleId,
    formData.startDate,
    formData.endDate,
    formData.discount,
    formData.customCommission,
    formData.isFlexible,
    vehicles,
  ]);

  // 🔧 OPRAVA: Prepočítaj províziu pri manuálnej zmene ceny
  useEffect(() => {
    if (!calculatedPrice || calculatedPrice <= 0) {
      setCalculatedCommission(0);
      return;
    }

    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (!vehicle) {
      setCalculatedCommission(0);
      return;
    }

    // Calculate commission based on manually entered price
    let commission = 0;
    if (
      formData.customCommission?.value &&
      formData.customCommission.value > 0
    ) {
      if (formData.customCommission.type === 'percentage') {
        commission = (calculatedPrice * formData.customCommission.value) / 100;
      } else {
        commission = formData.customCommission.value;
      }
    } else if (vehicle.commission) {
      if (vehicle.commission.type === 'percentage') {
        commission = (calculatedPrice * vehicle.commission.value) / 100;
      } else {
        commission = vehicle.commission.value;
      }
    }
    setCalculatedCommission(commission);
  }, [
    calculatedPrice,
    formData.customCommission,
    formData.vehicleId,
    vehicles,
  ]);

  const handleSave = async () => {
    if (!rental) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (
        !formData.customerName ||
        !formData.startDate ||
        !formData.endDate ||
        !formData.totalPrice
      ) {
        setError('Vyplňte všetky povinné polia');
        return;
      }

      // Update rental via API with calculated values
      const updatedData = {
        ...formData,
        totalPrice: calculatedPrice,
        commission: calculatedCommission,
        discount:
          formData.discount?.value && formData.discount.value > 0
            ? formData.discount
            : undefined,
        customCommission:
          formData.customCommission?.value &&
          formData.customCommission.value > 0
            ? formData.customCommission
            : undefined,
        // 🔄 OPRAVA: Pridané isFlexible pole
        isFlexible: formData.isFlexible || false,
        flexibleEndDate: formData.flexibleEndDate,
      };

      await apiService.updatePendingRental(rental.id, updatedData);

      onSave(updatedData);
      onClose();
    } catch (err: unknown) {
      console.error('Error updating rental:', err);
      setError('Nepodarilo sa uložiť zmeny');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Rental, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
  // const selectedCustomer = customers.find(
  //   c => c.name === formData.customerName
  // );

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
              onChange={e => handleInputChange('customerName', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.customerEmail || ''}
              onChange={e => handleInputChange('customerEmail', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefón"
              value={formData.customerPhone || ''}
              onChange={e => handleInputChange('customerPhone', e.target.value)}
            />
          </Grid>

          {/* Vehicle Selection */}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              gutterBottom
              color="primary"
              sx={{ mt: 2 }}
            >
              Vozidlo
            </Typography>
          </Grid>

          <Grid item xs={12} md={8}>
            <Autocomplete
              options={vehicles}
              getOptionLabel={option =>
                `${option.brand} ${option.model} (${option.licensePlate})`
              }
              value={selectedVehicle || null}
              onChange={(_, newValue) => {
                handleInputChange('vehicleId', newValue?.id || '');
                handleInputChange(
                  'vehicleName',
                  newValue ? `${newValue.brand} ${newValue.model}` : ''
                );
                handleInputChange('vehicleCode', newValue?.licensePlate || '');
              }}
              renderInput={params => (
                <TextField {...params} label="Vyberte vozidlo" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Kód vozidla"
              value={formData.vehicleCode || ''}
              onChange={e => handleInputChange('vehicleCode', e.target.value)}
            />
          </Grid>

          {/* Rental Dates */}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              gutterBottom
              color="primary"
              sx={{ mt: 2 }}
            >
              Termín prenájmu
            </Typography>
          </Grid>

          {/* 🔄 OPRAVA: Typ prenájmu */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Typ prenájmu</InputLabel>
              <Select
                value={formData.isFlexible ? 'flexible' : 'standard'}
                onChange={e => {
                  const isFlexible = e.target.value === 'flexible';
                  handleInputChange('isFlexible', isFlexible);

                  // Pri zmene na štandardný prenájom prepočítaj ceny
                  if (
                    !isFlexible &&
                    formData.vehicleId &&
                    formData.startDate &&
                    formData.endDate
                  ) {
                    // Trigger price recalculation by updating a dependency
                    setFormData(prev => ({ ...prev, isFlexible: false }));
                  }
                }}
                label="Typ prenájmu"
              >
                <MenuItem value="standard">🔒 Štandardný prenájom</MenuItem>
                <MenuItem value="flexible">🔄 Flexibilný prenájom</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 🔄 OPRAVA: Flexibilný prenájom indikátor */}
          {formData.isFlexible && (
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'warning.light',
                  border: '2px solid',
                  borderColor: 'warning.main',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="warning.dark">
                  🔄 Flexibilný prenájom - cena sa nastavuje manuálne
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Začiatok prenájmu *"
              value={formData.startDate ? new Date(formData.startDate) : null}
              onChange={newValue => handleInputChange('startDate', newValue)}
              ampm={false}
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
              label={
                formData.isFlexible
                  ? 'Koniec prenájmu (voliteľné)'
                  : 'Koniec prenájmu *'
              }
              value={formData.endDate ? new Date(formData.endDate) : null}
              onChange={newValue => handleInputChange('endDate', newValue)}
              ampm={false}
              slots={{
                textField: TextField,
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: !formData.isFlexible,
                  helperText: formData.isFlexible
                    ? 'Pre flexibilný prenájom môžete nechať prázdne'
                    : undefined,
                },
              }}
            />
          </Grid>

          {/* 🔄 OPRAVA: Flexibilný dátum konca */}
          {formData.isFlexible && (
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Odhadovaný dátum vrátenia"
                value={
                  formData.flexibleEndDate
                    ? new Date(formData.flexibleEndDate)
                    : null
                }
                onChange={newValue =>
                  handleInputChange('flexibleEndDate', newValue)
                }
                ampm={false}
                slots={{
                  textField: TextField,
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText:
                      'Orientačný dátum ukončenia pre flexibilný prenájom',
                  },
                }}
              />
            </Grid>
          )}

          {/* Financial Info */}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              gutterBottom
              color="primary"
              sx={{ mt: 2 }}
            >
              Ceny a platba
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Celková cena *"
              type="number"
              value={calculatedPrice || ''}
              onChange={e =>
                setCalculatedPrice(parseFloat(e.target.value) || 0)
              }
              InputProps={{ endAdornment: '€' }}
              helperText={
                formData.isFlexible
                  ? 'Manuálne nastavená cena pre flexibilný prenájom'
                  : 'Automaticky prepočítaná podľa zľavy'
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Depozit"
              type="number"
              value={formData.deposit || ''}
              onChange={e =>
                handleInputChange('deposit', parseFloat(e.target.value) || 0)
              }
              InputProps={{ endAdornment: '€' }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Spôsob platby</InputLabel>
              <Select
                value={formData.paymentMethod || 'cash'}
                onChange={e =>
                  handleInputChange('paymentMethod', e.target.value)
                }
              >
                <MenuItem value="cash">Hotovosť</MenuItem>
                <MenuItem value="bank_transfer">Prevod</MenuItem>
                <MenuItem value="vrp">VRP</MenuItem>
                <MenuItem value="direct_to_owner">Priamo majiteľovi</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Price Calculation Summary */}
          <Grid item xs={12}>
            <Card sx={{ mt: 2, mb: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" color="primary">
                      Celková cena:{' '}
                      <strong>{calculatedPrice.toFixed(2)} €</strong>
                    </Typography>
                    <Typography>
                      Provízia:{' '}
                      <strong>{calculatedCommission.toFixed(2)} €</strong>
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() =>
                      setShowDiscountCommission(!showDiscountCommission)
                    }
                  >
                    {showDiscountCommission ? <PercentIcon /> : <EditIcon />}
                  </IconButton>
                </Box>

                {showDiscountCommission && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Zľava / Provízia
                    </Typography>

                    {/* Discount */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <FormControl sx={{ minWidth: 80 }} size="small">
                        <InputLabel>Zľava</InputLabel>
                        <Select
                          value={formData.discount?.type || ''}
                          label="Zľava"
                          onChange={e =>
                            handleInputChange('discount', {
                              ...formData.discount,
                              type: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="percentage">%</MenuItem>
                          <MenuItem value="fixed">€</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Hodnota"
                        type="number"
                        value={formData.discount?.value || ''}
                        onChange={e =>
                          handleInputChange('discount', {
                            ...formData.discount,
                            value: Number(e.target.value),
                          })
                        }
                        size="small"
                        sx={{ maxWidth: 100 }}
                      />
                    </Box>

                    {/* Commission */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Provízia</InputLabel>
                        <Select
                          value={formData.customCommission?.type || ''}
                          label="Provízia"
                          onChange={e =>
                            handleInputChange('customCommission', {
                              ...formData.customCommission,
                              type: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="percentage">%</MenuItem>
                          <MenuItem value="fixed">€</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Hodnota"
                        type="number"
                        value={formData.customCommission?.value || ''}
                        onChange={e =>
                          handleInputChange('customCommission', {
                            ...formData.customCommission,
                            value: Number(e.target.value),
                          })
                        }
                        size="small"
                        sx={{ maxWidth: 100 }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Info */}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              gutterBottom
              color="primary"
              sx={{ mt: 2 }}
            >
              Dodatočné informácie
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Miesto odovzdania"
              value={formData.handoverPlace || ''}
              onChange={e => handleInputChange('handoverPlace', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Denný km limit"
              type="number"
              value={formData.dailyKilometers || ''}
              onChange={e =>
                handleInputChange(
                  'dailyKilometers',
                  parseInt(e.target.value) || 0
                )
              }
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
              onChange={e => handleInputChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Zrušiť
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? 'Ukladám...' : 'Uložiť zmeny'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditRentalDialog;
