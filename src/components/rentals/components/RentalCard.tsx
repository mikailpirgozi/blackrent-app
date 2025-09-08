import {
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  Edit as EditIcon,
  Euro as EuroIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  // Stack, // TODO: Implement stack layout
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';

// import { useApp } from '../../../context/AppContext'; // Migrated to React Query
import { useVehicles } from '../../../lib/react-query/hooks/useVehicles';
import type { Rental } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface RentalCardProps {
  rental: Rental;
  onEdit: (rental: Rental) => void;
  index: number;
}

export function RentalCard({ rental, onEdit }: RentalCardProps) {
  // const { state } = useApp(); // Migrated to React Query
  const { data: vehicles = [] } = useVehicles();

  // Nájdi vehicle pre tento rental
  const vehicle = vehicles.find(v => v.id === rental.vehicleId);

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
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        '&:hover': {
          boxShadow: 2,
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <CarIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {vehicle
                  ? `${vehicle.brand} ${vehicle.model}`
                  : 'Neznáme vozidlo'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {vehicle?.licensePlate || 'Bez ŠPZ'}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={rental.status}
              size="small"
              color={
                getStatusColor(rental.status) as
                  | 'default'
                  | 'primary'
                  | 'secondary'
                  | 'error'
                  | 'info'
                  | 'success'
                  | 'warning'
              }
              variant="outlined"
            />
            <IconButton
              size="small"
              onClick={() => onEdit(rental)}
              sx={{ ml: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Customer info */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {rental.customerName || 'Neznámy zákazník'}
          </Typography>
        </Box>

        {/* Date range */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
          </Typography>
        </Box>

        {/* Price */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <EuroIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(rental.totalPrice)}
          </Typography>
          {rental.paymentMethod && (
            <Chip
              label={rental.paymentMethod}
              size="small"
              variant="outlined"
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>

        {/* Company */}
        {vehicle?.company && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Firma: {vehicle.company}
            </Typography>
          </Box>
        )}

        {/* Additional info for flexible rentals */}
        {rental.isFlexible && (
          <Chip
            label="Flexibilný prenájom"
            size="small"
            color="info"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
