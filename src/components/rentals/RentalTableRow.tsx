import React, { memo } from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assignment as HandoverProtocolIcon,
  AssignmentReturn as ReturnProtocolIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Rental } from '../../types';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface RentalTableRowProps {
  rental: Rental;
  onEdit: (rental: Rental) => void;
  onDelete: (id: string) => void;
  onShowDetail: (rental: Rental) => void;
  onProtocol: (rental: Rental, type: 'handover' | 'return') => void;
  formatPrice: (price: number | string | undefined) => string;
  formatDate: (date: Date | string) => string;
  getRentalPriority: (rental: Rental) => number;
  getRentalBackgroundColor: (rental: Rental) => string;
}

const RentalTableRow = memo<RentalTableRowProps>(({ 
  rental, 
  onEdit, 
  onDelete, 
  onShowDetail, 
  onProtocol,
  formatPrice, 
  formatDate,
  getRentalPriority,
  getRentalBackgroundColor
}) => {
  const priority = getRentalPriority(rental);
  
  return (
    <TableRow 
      hover
      sx={{ 
        backgroundColor: getRentalBackgroundColor(rental),
        '&:hover': { 
          backgroundColor: 'rgba(0, 0, 0, 0.04)' 
        }
      }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={priority}
            size="small"
            color={priority <= 3 ? 'error' : priority <= 5 ? 'warning' : 'default'}
            sx={{ minWidth: 30 }}
          />
          {rental.vehicle ? (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {rental.vehicle.licensePlate}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {rental.vehicle.brand} {rental.vehicle.model}
              </Typography>
              {(rental.vehicleVin || rental.vehicle.vin) && (
                <Typography variant="caption" sx={{
                  color: '#888',
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  display: 'block'
                }}>
                  VIN: {(rental.vehicleVin || rental.vehicle.vin)?.slice(-8)}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="error">
              Bez vozidla
            </Typography>
          )}
        </Box>
      </TableCell>
      
      <TableCell>
        <Typography variant="body2">
          {rental.vehicle?.company || 'N/A'}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {rental.customerName}
          </Typography>
          {(rental.customerPhone || rental.customer?.phone) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">
                {rental.customerPhone || rental.customer?.phone}
              </Typography>
            </Box>
          )}
        </Box>
      </TableCell>
      
      <TableCell>
        <Typography variant="body2">
          {format(new Date(rental.startDate), 'dd.MM.yyyy', { locale: sk })}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
          {format(new Date(rental.startDate), 'HH:mm', { locale: sk })}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Typography variant="body2">
          {format(new Date(rental.endDate), 'dd.MM.yyyy', { locale: sk })}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
          {format(new Date(rental.endDate), 'HH:mm', { locale: sk })}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          €{formatPrice(rental.totalPrice)}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Typography variant="body2">
          €{formatPrice(rental.commission)}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Chip
          label={rental.paid ? 'Zaplatené' : 'Nezaplatené'}
          size="small"
          color={rental.paid ? 'success' : 'error'}
          variant={rental.paid ? 'filled' : 'outlined'}
        />
      </TableCell>
      
      <TableCell>
        <Chip
          label={rental.confirmed ? 'Potvrdené' : 'Nepotvrdené'}
          size="small"
          color={rental.confirmed ? 'success' : 'warning'}
          variant={rental.confirmed ? 'filled' : 'outlined'}
        />
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Detail">
            <IconButton size="small" onClick={() => onShowDetail(rental)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Upraviť">
            <IconButton size="small" onClick={() => onEdit(rental)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vymazať">
            <IconButton size="small" onClick={() => onDelete(rental.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Protokol prevzatia">
            <IconButton size="small" onClick={() => onProtocol(rental, 'handover')}>
              <HandoverProtocolIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Protokol vrátenia">
            <IconButton size="small" onClick={() => onProtocol(rental, 'return')}>
              <ReturnProtocolIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
});

RentalTableRow.displayName = 'RentalTableRow';

export default RentalTableRow; 