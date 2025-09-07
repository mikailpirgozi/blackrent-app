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

import {
  Business as BusinessIcon,
  DirectionsCar as CarIcon,
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Fade,
  IconButton,
  Typography,
} from '@mui/material';
import React, { memo } from 'react';
import { formatDateTime } from '../../utils/formatters';
import PriceDisplay from './components/PriceDisplay';

interface MobileRentalRowProps {
  rental: Record<string, unknown>;
  vehicle: Record<string, unknown>;
  index: number;
  totalRentals: number;
  hasHandover: boolean;
  hasReturn: boolean;
  isLoadingProtocolStatus: boolean;
  protocolStatusLoaded: boolean;
  onEdit: (rental: Record<string, unknown>) => void;
  onOpenProtocolMenu: (
    rental: Record<string, unknown>,
    type: 'handover' | 'return'
  ) => void;
  onCheckProtocols: (rental: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  onClone?: (rental: Record<string, unknown>) => void; // 🔄 NOVÉ: Clone funkcionalita
}

export const MobileRentalRow = memo<MobileRentalRowProps>(
  ({
    rental,
    vehicle,
    index,
    // totalRentals, // TODO: Implement total rentals display
    hasHandover,
    hasReturn,
    isLoadingProtocolStatus,
    protocolStatusLoaded,
    onEdit,
    onOpenProtocolMenu,
    onCheckProtocols,
    onDelete,
    onClone, // 🔄 NOVÉ: Clone funkcionalita
  }) => {
    // 🎯 Memoized handlers to prevent recreation
    const handleCardClick = React.useCallback(() => {
      onEdit(rental);
    }, [rental, onEdit]);

    const handleHandoverClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenProtocolMenu(rental, 'handover');
      },
      [rental, onOpenProtocolMenu]
    );

    const handleReturnClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenProtocolMenu(rental, 'return');
      },
      [rental, onOpenProtocolMenu]
    );

    const handleProtocolCheck = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCheckProtocols(rental);
      },
      [rental, onCheckProtocols]
    );

    const handleDeleteClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(rental.id);
      },
      [rental.id, onDelete]
    );

    // 🔄 CLONE HANDLER
    const handleCloneClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClone) onClone(rental);
      },
      [rental, onClone]
    );

    // 🎨 Status helpers
    const getStatusColor = () => {
      switch (rental.status) {
        case 'active':
          return '#4caf50';
        case 'finished':
          return '#2196f3';
        case 'pending':
          return '#ff9800';
        default:
          return '#757575';
      }
    };

    const getStatusLabel = () => {
      switch (rental.status) {
        case 'active':
          return 'AKTÍVNY';
        case 'finished':
          return 'UKONČENÝ';
        case 'pending':
          return 'ČAKAJÚCI';
        default:
          return 'NOVÝ';
      }
    };

    // 🔄 Detekcia flexibilného prenájmu
    const isFlexible = rental.isFlexible || false;

    return (
      <Fade in timeout={300 + index * 50}>
        <Card
          sx={{
            mb: 1.5, // Menší spacing medzi kartami
            borderRadius: 2, // Menší border radius
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', // Jemnejší shadow
            border: isFlexible
              ? '2px solid #ff9800'
              : '1px solid rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: isFlexible ? '#fff8f0' : 'white',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              transform: 'translateY(-1px)', // Menší hover efekt
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          }}
          onClick={handleCardClick}
        >
          <CardContent sx={{ p: 2 }}>
            {/* 🚗 HLAVIČKA S VOZIDLOM A STATUSOM */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1.5,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#1976d2',
                    mb: 0.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CarIcon fontSize="small" />
                  {vehicle?.licensePlate || 'N/A'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontSize: '0.85rem',
                    mb: 0.25,
                  }}
                >
                  {vehicle?.brand} {vehicle?.model}
                </Typography>
                {/* 🏢 FIRMA - VŽDY VIDITEĽNÁ */}
                {vehicle?.company && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ff9800',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mb: 0.25,
                    }}
                  >
                    <BusinessIcon fontSize="small" />
                    {vehicle.company}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                <Chip
                  label={getStatusLabel()}
                  size="medium" // Väčší chip
                  sx={{
                    bgcolor: getStatusColor(),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem', // Väčší font
                    height: 32, // Väčšia výška
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
                      height: 28,
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* 👤 ZÁKAZNÍK - KOMPAKTNEJŠIE */}
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: '#333',
                  mb: 0.25,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: '#4caf50',
                  }}
                />
                {rental.customerName}
              </Typography>

              {/* 📞 TELEFÓN A EMAIL - V JEDNOM RIADKU */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                {(rental.customerPhone || rental.customer?.phone) && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <PhoneIcon fontSize="small" />
                    {rental.customerPhone || rental.customer?.phone}
                  </Typography>
                )}

                {(rental.customerEmail || rental.customer?.email) && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <EmailIcon fontSize="small" />
                    {rental.customerEmail || rental.customer?.email}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* 📅 DÁTUMY A CENA - KOMPAKTNEJŠIE */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                p: 1.5,
                bgcolor: '#f8f9fa',
                borderRadius: 2,
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontSize: '0.75rem',
                    mb: 0.25,
                  }}
                >
                  Obdobie prenájmu
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#1976d2',
                    lineHeight: 1.3,
                    mb: 0.25,
                  }}
                >
                  📅 {formatDateTime(rental.startDate)}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#f57c00',
                    lineHeight: 1.3,
                  }}
                >
                  🏁 {formatDateTime(rental.endDate)}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontSize: '0.75rem',
                    mb: 0.25,
                  }}
                >
                  Celková cena
                </Typography>
                <PriceDisplay
                  rental={rental}
                  variant="mobile"
                  showExtraKm={true}
                />
              </Box>
            </Box>

            {/* 🔧 PROTOKOLY - KOMPAKTNEJŠIE TLAČIDLÁ */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Button
                variant={hasHandover ? 'contained' : 'outlined'}
                size="large"
                fullWidth
                onClick={handleHandoverClick}
                startIcon={hasHandover ? <CheckIcon /> : <ScheduleIcon />}
                sx={{
                  height: 42, // Kompaktnejšie tlačidlo
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  bgcolor: hasHandover ? '#4caf50' : 'transparent',
                  borderColor: hasHandover ? '#4caf50' : '#ff9800',
                  color: hasHandover ? 'white' : '#ff9800',
                  '&:hover': {
                    bgcolor: hasHandover ? '#388e3c' : 'rgba(255,152,0,0.1)',
                    transform: 'scale(1.02)',
                    boxShadow: hasHandover
                      ? '0 4px 12px rgba(76,175,80,0.3)'
                      : '0 4px 12px rgba(255,152,0,0.2)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {hasHandover ? 'Odovzdané' : 'Odovzdať'}
              </Button>

              <Button
                variant={hasReturn ? 'contained' : 'outlined'}
                size="large"
                fullWidth
                onClick={handleReturnClick}
                startIcon={hasReturn ? <CheckIcon /> : <ScheduleIcon />}
                sx={{
                  height: 42, // Kompaktnejšie tlačidlo
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  bgcolor: hasReturn ? '#4caf50' : 'transparent',
                  borderColor: hasReturn ? '#4caf50' : '#ff9800',
                  color: hasReturn ? 'white' : '#ff9800',
                  '&:hover': {
                    bgcolor: hasReturn ? '#388e3c' : 'rgba(255,152,0,0.1)',
                    transform: 'scale(1.02)',
                    boxShadow: hasReturn
                      ? '0 4px 12px rgba(76,175,80,0.3)'
                      : '0 4px 12px rgba(255,152,0,0.2)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {hasReturn ? 'Prevzaté' : 'Prevziať'}
              </Button>
            </Box>

            {/* 📝 POZNÁMKY - AK EXISTUJÚ */}
            {rental.notes && (
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#333',
                    bgcolor: '#f5f5f5',
                    p: 1.5,
                    borderRadius: 1,
                    fontSize: '0.8rem',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  📝 {rental.notes}
                </Typography>
              </Box>
            )}

            {/* 🔍 PROTOKOL CHECK & PLATBA STATUS & DELETE - KOMPAKTNE V JEDNOM RIADKU */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Protokol check */}
              {isLoadingProtocolStatus ? (
                <Button
                  variant="outlined"
                  size="small"
                  disabled
                  sx={{
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    fontSize: '0.75rem',
                    height: 32,
                  }}
                >
                  Načítavam...
                </Button>
              ) : !protocolStatusLoaded ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleProtocolCheck}
                  sx={{
                    borderColor: '#2196f3',
                    color: '#2196f3',
                    fontSize: '0.75rem',
                    height: 32,
                    '&:hover': {
                      bgcolor: 'rgba(33,150,243,0.1)',
                    },
                  }}
                >
                  Skontrolovať
                </Button>
              ) : (
                <Box /> // Prázdny box pre spacing
              )}

              {/* Platba status + Delete tlačidlo v jednom riadku */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={rental.paid ? 'Uhradené' : 'Neuhradené'}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    bgcolor: rental.paid ? '#4caf50' : '#f44336',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />

                {/* 🔄 CLONE TLAČIDLO - VEDĽA PLATBY */}
                {onClone && (
                  <IconButton
                    onClick={handleCloneClick}
                    title="Kopírovať prenájom na ďalšie obdobie"
                    sx={{
                      color: '#4caf50',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: 'rgba(76,175,80,0.1)',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                )}

                {/* 🗑️ DELETE TLAČIDLO - VEDĽA PLATBY */}
                {onDelete && (
                  <IconButton
                    onClick={handleDeleteClick}
                    sx={{
                      color: '#f44336',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: 'rgba(244,67,54,0.1)',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    );
  }
);

MobileRentalRow.displayName = 'MobileRentalRow';
