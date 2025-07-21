import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Grid,
  useMediaQuery,
  useTheme,
  Tooltip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as HandoverIcon,
  AssignmentReturn as ReturnIcon,
  PictureAsPdf as PDFIcon,
  PhotoLibrary as GalleryIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Euro as EuroIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Rental } from '../../types';

export type CardViewMode = 'grid' | 'list' | 'compact' | 'detailed';

interface RentalCardViewProps {
  rentals: Rental[];
  viewMode: CardViewMode;
  onEdit: (rental: Rental) => void;
  onDelete: (rentalId: string) => void;
  onCreateHandover: (rental: Rental) => void;
  onCreateReturn: (rental: Rental) => void;
  onViewPDF: (protocolId: string, type: 'handover' | 'return', title: string) => void;
  onOpenGallery: (rental: Rental, protocolType: 'handover' | 'return') => void;
  onViewProtocols: (rental: Rental) => void;
  protocols: Record<string, { handover?: any; return?: any }>;
  loadingProtocols: string[];
}

const RentalCardView: React.FC<RentalCardViewProps> = ({
  rentals,
  viewMode,
  onEdit,
  onDelete,
  onCreateHandover,
  onCreateReturn,
  onViewPDF,
  onOpenGallery,
  onViewProtocols,
  protocols,
  loadingProtocols
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'aktívny':
      case 'active':
        return 'success';
      case 'dokončený':
      case 'completed':
        return 'default';
      case 'zrušený':
      case 'cancelled':
        return 'error';
      case 'po termíne':
      case 'overdue':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'aktívny':
      case 'active':
        return <CheckCircleIcon fontSize="small" />;
      case 'dokončený':
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'zrušený':
      case 'cancelled':
        return <ErrorIcon fontSize="small" />;
      case 'po termíne':
      case 'overdue':
        return <PendingIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  const renderCompactCard = (rental: Rental) => {
    const hasHandover = protocols[rental.id]?.handover;
    const hasReturn = protocols[rental.id]?.return;
    const isActive = rental.status?.toLowerCase() === 'aktívny' || rental.status?.toLowerCase() === 'active';
    const isFinished = rental.status?.toLowerCase() === 'dokončený' || rental.status?.toLowerCase() === 'completed';

    return (
      <Card
        key={rental.id}
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: '1px solid',
          borderColor: isActive ? '#4caf50' : 'divider',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            borderColor: isActive ? '#4caf50' : 'primary.main'
          },
          position: 'relative',
          overflow: 'visible'
        }}
        onClick={() => onEdit(rental)}
      >
        {/* Status indicator */}
        <Box sx={{
          position: 'absolute',
          top: -8,
          right: 16,
          zIndex: 1
        }}>
          <Chip
            label={rental.status}
            color={getStatusColor(rental.status)}
            size="small"
            icon={getStatusIcon(rental.status)}
            sx={{
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
        </Box>

        {/* Protocol status indicator */}
        <Box sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 1
        }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {hasHandover && (
              <Chip
                icon={<HandoverIcon />}
                label=""
                color="success"
                size="small"
                sx={{
                  minWidth: 32,
                  height: 24,
                  '& .MuiChip-icon': { fontSize: 16 }
                }}
              />
            )}
            {hasReturn && (
              <Chip
                icon={<ReturnIcon />}
                label=""
                color="primary"
                size="small"
                sx={{
                  minWidth: 32,
                  height: 24,
                  '& .MuiChip-icon': { fontSize: 16 }
                }}
              />
            )}
          </Box>
        </Box>

        <CardContent sx={{ p: 2, pt: 4 }}>
          {/* Vehicle info */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CarIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
              {rental.vehicle?.licensePlate || 'N/A'}
            </Typography>
          </Box>

          {/* Customer */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body2" fontWeight="medium">
                {rental.customerName}
              </Typography>
            </Box>
          </Box>

          {/* Dates */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ScheduleIcon color="action" fontSize="small" />
              <Typography variant="body2" fontWeight="medium">
                {format(new Date(rental.startDate), 'dd.MM.yyyy', { locale: sk })}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
              do {format(new Date(rental.endDate), 'dd.MM.yyyy', { locale: sk })}
            </Typography>
          </Box>

          {/* Price */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EuroIcon color="success" fontSize="small" />
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {rental.totalPrice?.toFixed(2)}€
              </Typography>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            mt: 2,
            justifyContent: 'flex-end'
          }}>
            <Tooltip title="Upraviť">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onEdit(rental); }}
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vymazať">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete(rental.id); }}
                sx={{ 
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderDetailedCard = (rental: Rental) => {
    const hasHandover = protocols[rental.id]?.handover;
    const hasReturn = protocols[rental.id]?.return;
    const isActive = rental.status?.toLowerCase() === 'aktívny' || rental.status?.toLowerCase() === 'active';

    return (
      <Card
        key={rental.id}
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: '1px solid',
          borderColor: isActive ? '#4caf50' : 'divider',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            borderColor: isActive ? '#4caf50' : 'primary.main'
          },
          position: 'relative',
          overflow: 'visible'
        }}
        onClick={() => onEdit(rental)}
      >
        {/* Status indicator */}
        <Box sx={{
          position: 'absolute',
          top: -8,
          right: 16,
          zIndex: 1
        }}>
          <Chip
            label={rental.status}
            color={getStatusColor(rental.status)}
            size="small"
            icon={getStatusIcon(rental.status)}
            sx={{
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
        </Box>

        {/* Protocol status indicator */}
        <Box sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 1
        }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {hasHandover && (
              <Chip
                icon={<HandoverIcon />}
                label=""
                color="success"
                size="small"
                sx={{
                  minWidth: 32,
                  height: 24,
                  '& .MuiChip-icon': { fontSize: 16 }
                }}
              />
            )}
            {hasReturn && (
              <Chip
                icon={<ReturnIcon />}
                label=""
                color="primary"
                size="small"
                sx={{
                  minWidth: 32,
                  height: 24,
                  '& .MuiChip-icon': { fontSize: 16 }
                }}
              />
            )}
          </Box>
        </Box>

        <CardContent sx={{ p: 3, pt: 4 }}>
          {/* Vehicle info */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CarIcon color="primary" fontSize="small" />
              <Typography variant="h6" fontWeight="bold" color="primary">
                {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
              {rental.vehicle?.licensePlate || 'N/A'}
            </Typography>
          </Box>

          {/* Customer and company */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body1" fontWeight="medium">
                {rental.customerName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {rental.vehicle?.company || 'N/A'}
              </Typography>
            </Box>
          </Box>

          {/* Dates */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon color="action" fontSize="small" />
              <Typography variant="body2" fontWeight="medium">
                Obdobie prenájmu
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
              {format(new Date(rental.startDate), 'dd.MM.yyyy', { locale: sk })} - {format(new Date(rental.endDate), 'dd.MM.yyyy', { locale: sk })}
            </Typography>
          </Box>

          {/* Price and commission */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EuroIcon color="success" fontSize="small" />
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {rental.totalPrice?.toFixed(2)}€
              </Typography>
            </Box>
            {rental.commission && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                Provízia: {rental.commission?.toFixed(2)}€
              </Typography>
            )}
          </Box>

          {/* Payment info */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {rental.paymentMethod} - {rental.paid ? 'Uhradené' : 'Neuhradené'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Protocol actions */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {!hasHandover && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<HandoverIcon />}
                onClick={(e) => { e.stopPropagation(); onCreateHandover(rental); }}
                sx={{ flex: 1 }}
              >
                Preberací protokol
              </Button>
            )}
            {hasHandover && !hasReturn && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ReturnIcon />}
                onClick={(e) => { e.stopPropagation(); onCreateReturn(rental); }}
                sx={{ flex: 1 }}
              >
                Protokol vrátenia
              </Button>
            )}
          </Box>

          {/* Protocol actions for existing protocols */}
          {(hasHandover || hasReturn) && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onViewProtocols(rental); 
                }}
                disabled={loadingProtocols.includes(rental.id)}
                sx={{ flex: 1 }}
              >
                Zobraziť protokoly
              </Button>
              {hasHandover && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PDFIcon />}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onViewPDF(hasHandover.id, 'handover', 'Preberací protokol'); 
                  }}
                  sx={{ flex: 1 }}
                >
                  PDF
                </Button>
              )}
              {hasReturn && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PDFIcon />}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onViewPDF(hasReturn.id, 'return', 'Protokol vrátenia'); 
                  }}
                  sx={{ flex: 1 }}
                >
                  PDF
                </Button>
              )}
              {(hasHandover?.images?.length > 0 || hasReturn?.images?.length > 0) && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<GalleryIcon />}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onOpenGallery(rental, hasHandover ? 'handover' : 'return'); 
                  }}
                  sx={{ flex: 1 }}
                >
                  Galéria
                </Button>
              )}
            </Box>
          )}

          {/* Protocol details when loaded */}
          {protocols[rental.id] && (
            <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Detaily protokolov:
              </Typography>
              {hasHandover && (
                <Box sx={{ mb: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.dark' }}>
                    ✅ Preberací protokol
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vytvorený: {format(new Date(hasHandover.createdAt), 'dd.MM.yyyy HH:mm', { locale: sk })}
                  </Typography>
                </Box>
              )}
              {hasReturn && (
                <Box sx={{ mb: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.dark' }}>
                    ✅ Protokol vrátenia
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vytvorený: {format(new Date(hasReturn.createdAt), 'dd.MM.yyyy HH:mm', { locale: sk })}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Protocol details when loaded */}
          {protocols[rental.id] && (
            <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                Detaily protokolov:
              </Typography>
              {hasHandover && (
                <Box sx={{ mb: 1, p: 0.5, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, color: 'success.dark' }}>
                    ✅ Preberací protokol
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                    {format(new Date(hasHandover.createdAt), 'dd.MM.yyyy HH:mm', { locale: sk })}
                  </Typography>
                </Box>
              )}
              {hasReturn && (
                <Box sx={{ mb: 1, p: 0.5, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, color: 'success.dark' }}>
                    ✅ Protokol vrátenia
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                    {format(new Date(hasReturn.createdAt), 'dd.MM.yyyy HH:mm', { locale: sk })}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            justifyContent: 'flex-end'
          }}>
            <Tooltip title="Upraviť">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onEdit(rental); }}
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vymazať">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete(rental.id); }}
                sx={{ 
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCard = (rental: Rental) => {
    switch (viewMode) {
      case 'compact':
        return renderCompactCard(rental);
      case 'detailed':
        return renderDetailedCard(rental);
      default:
        return renderCompactCard(rental);
    }
  };

  const getGridSize = () => {
    switch (viewMode) {
      case 'compact':
        return { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 };
      case 'detailed':
        return { xs: 12, sm: 12, md: 6, lg: 4, xl: 3 };
      default:
        return { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 };
    }
  };

  return (
    <Grid container spacing={{ xs: 1, md: 2 }}>
      {rentals.map((rental) => (
        <Grid item key={rental.id} {...getGridSize()}>
          {renderCard(rental)}
        </Grid>
      ))}
    </Grid>
  );
};

export default RentalCardView; 