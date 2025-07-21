import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as HandoverIcon,
  AssignmentReturn as ReturnIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PictureAsPdf as PDFIcon,
  PhotoLibrary as GalleryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Rental } from '../../types';

interface RentalCardViewProps {
  rentals: Rental[];
  protocols: Record<string, { handover?: any; return?: any }>;
  loadingProtocols: string[];
  onEdit: (rental: Rental) => void;
  onDelete: (id: string) => void;
  onCreateHandover: (rental: Rental) => void;
  onCreateReturn: (rental: Rental) => void;
  onViewProtocols: (rental: Rental) => void;
  onOpenGallery: (rental: Rental, type: 'handover' | 'return') => void;
}

const RentalCardView: React.FC<RentalCardViewProps> = ({
  rentals,
  protocols,
  loadingProtocols,
  onEdit,
  onDelete,
  onCreateHandover,
  onCreateReturn,
  onViewProtocols,
  onOpenGallery
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getRentalStatus = (rental: Rental) => {
    const now = new Date();
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);

    if (now < startDate) return { status: 'future', label: 'Budúci', color: 'info' as const };
    if (now >= startDate && now <= endDate) return { status: 'active', label: 'Aktívny', color: 'success' as const };
    return { status: 'completed', label: 'Ukončený', color: 'default' as const };
  };

  const renderProtocolStatus = (rental: Rental) => {
    const hasHandover = !!protocols[rental.id]?.handover;
    const hasReturn = !!protocols[rental.id]?.return;

    return (
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
        <Chip
          icon={hasHandover ? <CheckCircleIcon /> : <ErrorIcon />}
          label="Prevzatie"
          size="small"
          color={hasHandover ? 'success' : 'default'}
          variant={hasHandover ? 'filled' : 'outlined'}
        />
        <Chip
          icon={hasReturn ? <CheckCircleIcon /> : <ErrorIcon />}
          label="Vrátenie"
          size="small"
          color={hasReturn ? 'success' : 'default'}
          variant={hasReturn ? 'filled' : 'outlined'}
        />
      </Box>
    );
  };

  return (
    <Grid container spacing={2}>
      {rentals.map((rental) => {
        const status = getRentalStatus(rental);
        const hasHandover = !!protocols[rental.id]?.handover;
        const hasReturn = !!protocols[rental.id]?.return;

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={rental.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rental.vehicle?.licensePlate || 'N/A'}
                    </Typography>
                  </Box>
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>

                {/* Customer */}
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  {rental.customerName}
                </Typography>

                {/* Dates */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Od: {format(new Date(rental.startDate), 'dd.MM.yyyy', { locale: sk })}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Do: {format(new Date(rental.endDate), 'dd.MM.yyyy', { locale: sk })}
                  </Typography>
                </Box>

                {/* Price */}
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  {typeof rental.totalPrice === 'number' ? rental.totalPrice.toFixed(2) : '0.00'} €
                </Typography>

                {/* Protocol Status */}
                {renderProtocolStatus(rental)}

                {/* Actions */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 2,
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`
                }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Prevzatie vozidla">
                      <IconButton
                        size="small"
                        onClick={() => onCreateHandover(rental)}
                        color={hasHandover ? 'success' : 'primary'}
                        sx={{ 
                          bgcolor: hasHandover ? 'success.light' : 'primary.light',
                          color: hasHandover ? 'success.contrastText' : 'primary.contrastText',
                          '&:hover': { 
                            bgcolor: hasHandover ? 'success.main' : 'primary.main' 
                          }
                        }}
                      >
                        <HandoverIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Vrátenie vozidla">
                      <IconButton
                        size="small"
                        onClick={() => onCreateReturn(rental)}
                        color={hasReturn ? 'success' : 'primary'}
                        sx={{ 
                          bgcolor: hasReturn ? 'success.light' : 'primary.light',
                          color: hasReturn ? 'success.contrastText' : 'primary.contrastText',
                          '&:hover': { 
                            bgcolor: hasReturn ? 'success.main' : 'primary.main' 
                          }
                        }}
                      >
                        <ReturnIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Upraviť">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(rental)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Vymazať">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(rental.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default RentalCardView; 