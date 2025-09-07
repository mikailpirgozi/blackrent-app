import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as HandoverProtocolIcon,
  Phone as PhoneIcon,
  AssignmentReturn as ReturnProtocolIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import { memo } from 'react';
import PriceDisplay from './components/PriceDisplay';

import type { Rental } from '../../types';
import { formatTime } from '../../utils/formatters';

interface RentalMobileCardProps {
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

const RentalMobileCard = memo<RentalMobileCardProps>(
  ({
    rental,
    onEdit,
    onDelete,
    onShowDetail,
    onProtocol,
    // formatPrice, // TODO: Implement price formatting
    formatDate,
    getRentalPriority,
    getRentalBackgroundColor,
  }) => {
    const priority = getRentalPriority(rental);

    return (
      <Card
        sx={{
          mb: 2,
          background: getRentalBackgroundColor(rental),
          border: '1px solid',
          borderColor: priority <= 3 ? 'warning.main' : 'divider',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
          },
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Header with priority and vehicle */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`P${priority}`}
                size="small"
                color={
                  priority <= 3
                    ? 'error'
                    : priority <= 5
                      ? 'warning'
                      : 'default'
                }
              />
              {rental.vehicle ? (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    {rental.vehicle.licensePlate}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rental.vehicle.brand} {rental.vehicle.model}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant="subtitle1"
                  color="error"
                  sx={{ fontSize: '0.9rem' }}
                >
                  Bez vozidla
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => onShowDetail(rental)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onEdit(rental)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Customer info */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              👤 {rental.customerName}
            </Typography>
            {(rental.customerPhone || rental.customer?.phone) && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 0.5,
                }}
              >
                <PhoneIcon sx={{ fontSize: 12 }} />
                {rental.customerPhone || rental.customer?.phone}
              </Typography>
            )}
          </Box>

          {/* Company */}
          {rental.vehicle?.company && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              🏢 {rental.vehicle.company}
            </Typography>
          )}

          {/* Date range */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Od:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDate(rental.startDate)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.65rem' }}
              >
                {formatTime(rental.startDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Do:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDate(rental.endDate)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.65rem' }}
              >
                {formatTime(rental.endDate)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Price and status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box>
              <PriceDisplay
                rental={rental}
                variant="mobile"
                showExtraKm={true}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                alignItems: 'flex-end',
              }}
            >
              <Chip
                label={rental.paid ? 'Zaplatené' : 'Nezaplatené'}
                size="small"
                color={rental.paid ? 'success' : 'error'}
                variant={rental.paid ? 'filled' : 'outlined'}
              />
              <Chip
                label={rental.confirmed ? 'Potvrdené' : 'Nepotvrdené'}
                size="small"
                color={rental.confirmed ? 'success' : 'warning'}
                variant={rental.confirmed ? 'filled' : 'outlined'}
              />
            </Box>
          </Box>

          {/* Order number and handover place */}
          {(rental.orderNumber || rental.handoverPlace) && (
            <Box sx={{ mb: 1 }}>
              {rental.orderNumber && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  📋 Obj. č.: {rental.orderNumber}
                </Typography>
              )}
              {rental.handoverPlace && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  📍 {rental.handoverPlace}
                </Typography>
              )}
            </Box>
          )}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<HandoverProtocolIcon />}
              onClick={() => onProtocol(rental, 'handover')}
              sx={{ flex: 1 }}
            >
              Prevzatie
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReturnProtocolIcon />}
              onClick={() => onProtocol(rental, 'return')}
              sx={{ flex: 1 }}
            >
              Vrátenie
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(rental.id)}
            >
              Zmazať
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }
);

RentalMobileCard.displayName = 'RentalMobileCard';

export default RentalMobileCard;
