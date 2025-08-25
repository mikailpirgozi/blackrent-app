/**
 * 📱 MOBILE RENTAL ROW COMPONENT - ENHANCED VERSION
 * 
 * Optimalizovaný pre mobilné zariadenia s kartovým dizajnom:
 * - Zachováva všetky existujúce funkcie
 * - Väčšie fonty a tlačidlá (touch-friendly)
 * - Lepšie rozloženie informácií
 * - Kartový dizajn namiesto tabuľkového riadku
 * - React.memo pre performance
 */

import React, { memo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Fade,
  IconButton,
  Card,
  CardContent,
  Collapse,
  Divider,
  Button
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Euro as EuroIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface MobileRentalRowProps {
  rental: any;
  vehicle: any;
  index: number;
  totalRentals: number;
  hasHandover: boolean;
  hasReturn: boolean;
  isLoadingProtocolStatus: boolean;
  protocolStatusLoaded: boolean;
  onEdit: (rental: any) => void;
  onOpenProtocolMenu: (rental: any, type: 'handover' | 'return') => void;
  onCheckProtocols: (rental: any) => void;
  onDelete?: (id: string) => void;
}

export const MobileRentalRow = memo<MobileRentalRowProps>(({
  rental,
  vehicle,
  index,
  totalRentals,
  hasHandover,
  hasReturn,
  isLoadingProtocolStatus,
  protocolStatusLoaded,
  onEdit,
  onOpenProtocolMenu,
  onCheckProtocols,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false);

  // 🎯 Memoized handlers to prevent recreation
  const handleCardClick = React.useCallback(() => {
    onEdit(rental);
  }, [rental, onEdit]);

  const handleExpandClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  }, [expanded]);

  const handleHandoverClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenProtocolMenu(rental, 'handover');
  }, [rental, onOpenProtocolMenu]);

  const handleReturnClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenProtocolMenu(rental, 'return');
  }, [rental, onOpenProtocolMenu]);

  const handleProtocolCheck = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCheckProtocols(rental);
  }, [rental, onCheckProtocols]);

  const handleDeleteClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(rental.id);
  }, [rental.id, onDelete]);

  // 🎨 Status helpers
  const getStatusColor = () => {
    switch (rental.status) {
      case 'active': return '#4caf50';
      case 'finished': return '#2196f3';
      case 'pending': return '#ff9800';
      default: return '#757575';
    }
  };

  const getStatusLabel = () => {
    switch (rental.status) {
      case 'active': return 'AKTÍVNY';
      case 'finished': return 'UKONČENÝ';
      case 'pending': return 'ČAKAJÚCI';
      default: return 'NOVÝ';
    }
  };

  // 🔄 Detekcia flexibilného prenájmu
  const isFlexible = rental.isFlexible || false;

  return (
    <Fade in timeout={300 + index * 50}>
      <Card 
        sx={{ 
          mb: 2,
          mx: 1, // Malé okraje po stranách
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: isFlexible ? '2px solid #ff9800' : '1px solid rgba(0,0,0,0.08)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: isFlexible ? '#fff8f0' : 'white',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)'
          },
          '&:active': {
            transform: 'translateY(0px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* 🚗 HLAVIČKA S VOZIDLOM A STATUSOM */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                fontSize: '1.1rem', // Väčší font
                color: '#1976d2',
                mb: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CarIcon fontSize="small" />
                {vehicle?.licensePlate || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#666',
                fontSize: '0.9rem', // Väčší font
                mb: 1
              }}>
                {vehicle?.brand} {vehicle?.model}
              </Typography>
              {(rental.vehicleVin || vehicle?.vin) && (
                <Typography variant="caption" sx={{
                  color: '#888',
                  fontSize: '0.75rem', // Väčší font
                  fontFamily: 'monospace',
                  display: 'block'
                }}>
                  VIN: {(rental.vehicleVin || vehicle?.vin)?.slice(-8)}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Chip
                label={getStatusLabel()}
                size="medium" // Väčší chip
                sx={{
                  bgcolor: getStatusColor(),
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem', // Väčší font
                  height: 32 // Väčšia výška
                }}
              />
              {isFlexible && (
                <Chip
                  label="FLEXIBILNÝ"
                  size="medium"
                  sx={{
                    bgcolor: '#ff9800',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 28
                  }}
                />
              )}
            </Box>
          </Box>

          {/* 👤 ZÁKAZNÍK */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 600,
              fontSize: '1rem', // Väčší font
              color: '#333',
              mb: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: '#4caf50' 
              }} />
              {rental.customerName}
            </Typography>
            
            {(rental.customerPhone || rental.customer?.phone) && (
              <Typography variant="body2" sx={{ 
                color: '#666',
                fontSize: '0.85rem', // Väčší font
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5
              }}>
                <PhoneIcon fontSize="small" />
                {rental.customerPhone || rental.customer?.phone}
              </Typography>
            )}
          </Box>

          {/* 📅 DÁTUMY A CENA */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
            p: 2,
            bgcolor: '#f8f9fa',
            borderRadius: 2
          }}>
            <Box>
              <Typography variant="body2" sx={{ 
                color: '#666',
                fontSize: '0.8rem',
                mb: 0.5
              }}>
                Obdobie prenájmu
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 600,
                fontSize: '0.85rem', // Väčší font
                color: '#333'
              }}>
                {format(new Date(rental.startDate), 'd.M.yyyy HH:mm', { locale: sk })}
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: 600,
                fontSize: '0.85rem', // Väčší font
                color: '#333'
              }}>
                {format(new Date(rental.endDate), 'd.M.yyyy HH:mm', { locale: sk })}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ 
                color: '#666',
                fontSize: '0.8rem',
                mb: 0.5
              }}>
                Celková cena
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                fontSize: '1.2rem', // Väčší font
                color: '#4caf50',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                <EuroIcon fontSize="small" />
                {rental.totalPrice?.toFixed(2)}
              </Typography>
              {rental.extraKmCharge && rental.extraKmCharge > 0 && (
                <Typography variant="caption" sx={{ 
                  display: 'block',
                  fontSize: '0.7rem',
                  color: '#ff9800',
                  fontWeight: 600,
                  mt: 0.5
                }}>
                  +{rental.extraKmCharge.toFixed(2)}€ extra km
                </Typography>
              )}
            </Box>
          </Box>

          {/* 🔧 PROTOKOLY - VEĽKÉ TLAČIDLÁ */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 2
          }}>
            <Button
              variant={hasHandover ? "contained" : "outlined"}
              size="large"
              fullWidth
              onClick={handleHandoverClick}
              startIcon={hasHandover ? <CheckIcon /> : <ScheduleIcon />}
              sx={{
                height: 48, // Veľké tlačidlo pre touch
                fontSize: '0.9rem',
                fontWeight: 600,
                bgcolor: hasHandover ? '#4caf50' : 'transparent',
                borderColor: hasHandover ? '#4caf50' : '#ff9800',
                color: hasHandover ? 'white' : '#ff9800',
                '&:hover': {
                  bgcolor: hasHandover ? '#388e3c' : 'rgba(255,152,0,0.1)',
                  transform: 'scale(1.02)',
                  boxShadow: hasHandover 
                    ? '0 4px 12px rgba(76,175,80,0.3)' 
                    : '0 4px 12px rgba(255,152,0,0.2)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {hasHandover ? 'Odovzdané' : 'Odovzdať'}
            </Button>
            
            <Button
              variant={hasReturn ? "contained" : "outlined"}
              size="large"
              fullWidth
              onClick={handleReturnClick}
              startIcon={hasReturn ? <CheckIcon /> : <ScheduleIcon />}
              sx={{
                height: 48, // Veľké tlačidlo pre touch
                fontSize: '0.9rem',
                fontWeight: 600,
                bgcolor: hasReturn ? '#4caf50' : 'transparent',
                borderColor: hasReturn ? '#4caf50' : '#ff9800',
                color: hasReturn ? 'white' : '#ff9800',
                '&:hover': {
                  bgcolor: hasReturn ? '#388e3c' : 'rgba(255,152,0,0.1)',
                  transform: 'scale(1.02)',
                  boxShadow: hasReturn 
                    ? '0 4px 12px rgba(76,175,80,0.3)' 
                    : '0 4px 12px rgba(255,152,0,0.2)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {hasReturn ? 'Prevzaté' : 'Prevziať'}
            </Button>
          </Box>

          {/* 🔍 PROTOKOL CHECK & LOADING */}
          {isLoadingProtocolStatus && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                variant="outlined"
                size="medium"
                disabled
                sx={{
                  borderColor: '#ff9800',
                  color: '#ff9800',
                  fontSize: '0.85rem'
                }}
              >
                Načítavam protokoly...
              </Button>
            </Box>
          )}

          {!protocolStatusLoaded && !isLoadingProtocolStatus && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                variant="outlined"
                size="medium"
                onClick={handleProtocolCheck}
                sx={{
                  borderColor: '#2196f3',
                  color: '#2196f3',
                  fontSize: '0.85rem',
                  '&:hover': {
                    bgcolor: 'rgba(33,150,243,0.1)'
                  }
                }}
              >
                Skontrolovať protokoly
              </Button>
            </Box>
          )}

          {/* 💰 PLATBA STATUS */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip
              label={rental.paid ? '💰 UHRADENÉ' : '⏰ NEUHRADENÉ'}
              size="medium"
              sx={{
                height: 32,
                fontSize: '0.8rem',
                bgcolor: rental.paid ? '#4caf50' : '#f44336',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>

          {/* 📋 ROZŠÍRENÉ DETAILY */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton
              onClick={handleExpandClick}
              sx={{
                color: '#666',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              <Typography variant="caption" sx={{ ml: 1, fontSize: '0.8rem' }}>
                {expanded ? 'Menej' : 'Viac detailov'}
              </Typography>
            </IconButton>
            
            {onDelete && (
              <IconButton
                onClick={handleDeleteClick}
                sx={{
                  color: '#f44336',
                  width: 44, // Väčšie tlačidlo pre touch
                  height: 44,
                  '&:hover': { 
                    bgcolor: 'rgba(244,67,54,0.1)',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>

          {/* 📄 ROZŠÍRENÉ INFORMÁCIE */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ pt: 1 }}>
              {vehicle?.company && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BusinessIcon fontSize="small" sx={{ color: '#666' }} />
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                    Firma: <strong>{vehicle.company}</strong>
                  </Typography>
                </Box>
              )}
              
              {rental.notes && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5, fontSize: '0.85rem' }}>
                    Poznámky:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333',
                    bgcolor: '#f5f5f5',
                    p: 1.5,
                    borderRadius: 1,
                    fontSize: '0.85rem'
                  }}>
                    {rental.notes}
                  </Typography>
                </Box>
              )}
              
              <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem' }}>
                ID: {rental.id?.slice(-8)}
              </Typography>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Fade>
  );
});

MobileRentalRow.displayName = 'MobileRentalRow';