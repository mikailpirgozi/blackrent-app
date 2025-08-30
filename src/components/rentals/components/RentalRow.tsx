import {
  Edit as EditIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { Box, Typography, Chip, IconButton, Paper, Grid } from '@mui/material';
import React from 'react';

import { useApp } from '../../../context/AppContext';
import { Rental } from '../../../types';
import { formatDate, formatCurrency } from '../../../utils/formatters';

interface RentalRowProps {
  rental: Rental;
  onEdit: (rental: Rental) => void;
  index: number;
}

export function RentalRow({ rental, onEdit, index }: RentalRowProps) {
  const { state } = useApp();

  // Nájdi vehicle pre tento rental
  const vehicle = state.vehicles.find(v => v.id === rental.vehicleId);

  // Status color mapping
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        '&:hover': {
          backgroundColor: 'action.hover',
          boxShadow: 1,
        },
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
      }}
      onClick={() => onEdit(rental)}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Vehicle info */}
        <Grid item xs={12} sm={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <CarIcon color="action" fontSize="small" />
            <Box>
              <Typography variant="subtitle2" fontWeight="medium">
                {vehicle
                  ? `${vehicle.brand} ${vehicle.model}`
                  : 'Neznáme vozidlo'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {vehicle?.licensePlate || 'Bez ŠPZ'}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Customer */}
        <Grid item xs={12} sm={2}>
          <Typography variant="body2" noWrap>
            {rental.customerName || 'Neznámy zákazník'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Zákazník
          </Typography>
        </Grid>

        {/* Date range */}
        <Grid item xs={12} sm={2}>
          <Typography variant="body2" noWrap>
            {formatDate(rental.startDate)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            - {formatDate(rental.endDate)}
          </Typography>
        </Grid>

        {/* Price */}
        <Grid item xs={12} sm={1.5}>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(rental.totalPrice)}
          </Typography>
          {rental.paymentMethod && (
            <Typography variant="caption" color="text.secondary">
              {rental.paymentMethod}
            </Typography>
          )}
        </Grid>

        {/* Status */}
        <Grid item xs={12} sm={1.5}>
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Chip
              label={rental.status}
              size="small"
              color={getStatusColor(rental.status) as any}
              variant="outlined"
            />
            {rental.isFlexible && (
              <Chip
                label="Flexibilný"
                size="small"
                color="info"
                variant="outlined"
              />
            )}
          </Box>
        </Grid>

        {/* Company */}
        <Grid item xs={12} sm={1.5}>
          <Typography variant="body2" noWrap>
            {vehicle?.company || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Firma
          </Typography>
        </Grid>

        {/* Actions */}
        <Grid item xs={12} sm={0.5}>
          <Box display="flex" justifyContent="flex-end">
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onEdit(rental);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
