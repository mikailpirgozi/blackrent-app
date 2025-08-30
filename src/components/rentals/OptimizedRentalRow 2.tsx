/**
 * 📋 OPTIMIZED RENTAL ROW
 *
 * Memoized rental row komponent s optimalizovaným rendering
 */

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  DirectionsCar as HandoverIcon,
  CarRental as ReturnIcon,
  PictureAsPdf as PDFIcon,
  PhotoLibrary as GalleryIcon,
} from '@mui/icons-material';
import {
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Avatar,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { memo, useCallback } from 'react';

import { Rental } from '../../types';
import { VehicleLookup } from '../../utils/rentalFilters';

import RentalStatusChip from './RentalStatusChip';

interface OptimizedRentalRowProps {
  rental: Rental;
  vehicleLookup: VehicleLookup;
  onEdit: (rental: Rental) => void;
  onDelete: (rental: Rental) => void;
  onView: (rental: Rental) => void;
  onHandover: (rental: Rental) => void;
  onReturn: (rental: Rental) => void;
  onViewPDF: (rental: Rental) => void;
  onViewGallery: (rental: Rental) => void;
  hasHandoverProtocol?: boolean;
  hasReturnProtocol?: boolean;
}

const OptimizedRentalRow: React.FC<OptimizedRentalRowProps> = ({
  rental,
  vehicleLookup,
  onEdit,
  onDelete,
  onView,
  onHandover,
  onReturn,
  onViewPDF,
  onViewGallery,
  hasHandoverProtocol = false,
  hasReturnProtocol = false,
}) => {
  // Memoized vehicle data
  const vehicle = vehicleLookup[rental.vehicleId || ''] || {};

  // Memoized handlers
  const handleEdit = useCallback(() => onEdit(rental), [onEdit, rental]);
  const handleDelete = useCallback(() => onDelete(rental), [onDelete, rental]);
  const handleView = useCallback(() => onView(rental), [onView, rental]);
  const handleHandover = useCallback(
    () => onHandover(rental),
    [onHandover, rental]
  );
  const handleReturn = useCallback(() => onReturn(rental), [onReturn, rental]);
  const handleViewPDF = useCallback(
    () => onViewPDF(rental),
    [onViewPDF, rental]
  );
  const handleViewGallery = useCallback(
    () => onViewGallery(rental),
    [onViewGallery, rental]
  );

  // Memoized formatted dates
  const startDate = format(rental.startDate, 'dd.MM.yyyy', { locale: sk });
  const endDate = format(rental.endDate, 'dd.MM.yyyy', { locale: sk });

  // Customer initials for avatar
  const getCustomerInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??'
    );
  };

  return (
    <TableRow
      hover
      sx={{
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      {/* Customer */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.75rem',
              fontWeight: 600,
              bgcolor: 'primary.main',
            }}
          >
            {getCustomerInitials(rental.customerName || '')}
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, lineHeight: 1.2 }}
            >
              {rental.customerName || 'Nezadané'}
            </Typography>
            {rental.customerPhone && (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', lineHeight: 1 }}
              >
                {rental.customerPhone}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>

      {/* Vehicle */}
      <TableCell>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {vehicle.brand} {vehicle.model}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {vehicle.licensePlate}
          </Typography>
        </Box>
      </TableCell>

      {/* Dates */}
      <TableCell>
        <Box>
          <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
            {startDate}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            → {endDate}
          </Typography>
        </Box>
      </TableCell>

      {/* Status */}
      <TableCell>
        <RentalStatusChip status={rental.status || 'pending'} />
      </TableCell>

      {/* Company */}
      <TableCell>
        <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
          {vehicle.company || 'Nezadané'}
        </Typography>
      </TableCell>

      {/* Price */}
      <TableCell align="right">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          €{rental.totalPrice?.toFixed(2) || '0.00'}
        </Typography>
      </TableCell>

      {/* Protocols */}
      <TableCell>
        <Stack direction="row" spacing={0.5}>
          {hasHandoverProtocol && (
            <Tooltip title="Odovzdávací protokol">
              <IconButton size="small" onClick={handleViewPDF}>
                <PDFIcon fontSize="small" color="success" />
              </IconButton>
            </Tooltip>
          )}
          {hasReturnProtocol && (
            <Tooltip title="Preberací protokol">
              <IconButton size="small" onClick={handleViewPDF}>
                <PDFIcon fontSize="small" color="info" />
              </IconButton>
            </Tooltip>
          )}
          {!hasHandoverProtocol && !hasReturnProtocol && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Žiadne
            </Typography>
          )}
        </Stack>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Zobraziť">
            <IconButton size="small" onClick={handleView}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Upraviť">
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Odovzdať">
            <IconButton
              size="small"
              onClick={handleHandover}
              color={hasHandoverProtocol ? 'success' : 'default'}
            >
              <HandoverIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Prevziať">
            <IconButton
              size="small"
              onClick={handleReturn}
              color={hasReturnProtocol ? 'info' : 'default'}
            >
              <ReturnIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Galéria">
            <IconButton size="small" onClick={handleViewGallery}>
              <GalleryIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zmazať">
            <IconButton size="small" onClick={handleDelete} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// Export with deep memo comparison
export default memo(OptimizedRentalRow, (prevProps, nextProps) => {
  // Compare rental object
  if (prevProps.rental.id !== nextProps.rental.id) return false;
  if (prevProps.rental.status !== nextProps.rental.status) return false;
  if (prevProps.rental.customerName !== nextProps.rental.customerName)
    return false;
  if (prevProps.rental.totalPrice !== nextProps.rental.totalPrice) return false;

  // Compare vehicle data (if it changed)
  const prevVehicle = prevProps.vehicleLookup[prevProps.rental.vehicleId || ''];
  const nextVehicle = nextProps.vehicleLookup[nextProps.rental.vehicleId || ''];
  if (prevVehicle !== nextVehicle) return false;

  // Compare protocol status
  if (prevProps.hasHandoverProtocol !== nextProps.hasHandoverProtocol)
    return false;
  if (prevProps.hasReturnProtocol !== nextProps.hasReturnProtocol) return false;

  // Compare callbacks (should be memoized in parent)
  if (prevProps.onEdit !== nextProps.onEdit) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;

  return true;
});
