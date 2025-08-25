/**
 * ⚡ MOBILE RENTAL ROW COMPONENT
 * 
 * Memory-optimized rental row pre mobile view:
 * - React.memo pre prevent unnecessary re-renders
 * - Optimized props structure
 * - Memoized callbacks
 */

import React, { memo } from 'react';
import { Box, Typography, Chip, Fade, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';

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
  // 🎯 Memoized styles to prevent recalculation
  const rowStyles = React.useMemo(() => ({
    display: 'flex',
    borderBottom: index < totalRentals - 1 ? '1px solid #e0e0e0' : 'none',
    '&:hover': { backgroundColor: '#f8f9fa' },
    minHeight: 60, // Zmenšené z 80 na 60px pre kompaktnejšie zobrazenie
    cursor: 'pointer'
  }), [index, totalRentals]);

  // 🎯 Memoized protocol chip styles
  const chipStyles = React.useMemo(() => ({
    handover: {
      height: { xs: 32, sm: 28 },
      fontSize: { xs: '0.8rem', sm: '0.75rem' },
      bgcolor: hasHandover ? '#4caf50' : '#ccc',
      color: 'white',
      fontWeight: 700,
      minWidth: { xs: 44, sm: 42 },
      maxWidth: { xs: 60, sm: 60 },
      cursor: hasHandover ? 'pointer' : 'default',
      borderRadius: { xs: 2, sm: 2.5 },
      boxShadow: hasHandover ? '0 2px 8px rgba(76,175,80,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
      transform: hasHandover ? 'scale(1)' : 'scale(0.95)',
      opacity: hasHandover ? 1 : 0.7,
      '&:hover': hasHandover ? {
        bgcolor: '#388e3c',
        transform: 'scale(1.1)',
        boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
        animation: 'bounce 0.6s ease'
      } : {
        transform: 'scale(0.98)',
        opacity: 0.8
      },
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '@keyframes bounce': {
        '0%, 20%, 60%, 100%': { transform: 'scale(1.1)' },
        '40%': { transform: 'scale(1.15)' },
        '80%': { transform: 'scale(1.05)' }
      }
    },
    return: {
      height: { xs: 32, sm: 28 },
      fontSize: { xs: '0.8rem', sm: '0.75rem' },
      bgcolor: hasReturn ? '#4caf50' : '#ccc',
      color: 'white',
      fontWeight: 700,
      minWidth: { xs: 44, sm: 42 },
      maxWidth: { xs: 60, sm: 60 },
      cursor: hasReturn ? 'pointer' : 'default',
      borderRadius: { xs: 2, sm: 2.5 },
      boxShadow: hasReturn ? '0 2px 8px rgba(76,175,80,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
      transform: hasReturn ? 'scale(1)' : 'scale(0.95)',
      opacity: hasReturn ? 1 : 0.7,
      '&:hover': hasReturn ? {
        bgcolor: '#388e3c',
        transform: 'scale(1.1)',
        boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
        animation: 'bounce 0.6s ease'
      } : {
        transform: 'scale(0.98)',
        opacity: 0.8
      },
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }), [hasHandover, hasReturn]);

  // 🎯 Memoized handlers to prevent recreation
  const handleRowClick = React.useCallback(() => {
    onEdit(rental);
  }, [rental, onEdit]);

  const handleHandoverClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Vždy zavolaj onOpenProtocolMenu - nech sa rozhodne či vytvoriť alebo zobraziť
    onOpenProtocolMenu(rental, 'handover');
  }, [rental, onOpenProtocolMenu]);

  const handleReturnClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Vždy zavolaj onOpenProtocolMenu - nech sa rozhodne či vytvoriť alebo zobraziť
    onOpenProtocolMenu(rental, 'return');
  }, [rental, onOpenProtocolMenu]);

  const handleProtocolCheck = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCheckProtocols(rental);
  }, [rental, onCheckProtocols]);

  return (
    <Box sx={rowStyles} onClick={handleRowClick}>
      {/* Vozidlo info - sticky left */}
      <Box sx={{ 
        width: { xs: 120, sm: 140 },
        maxWidth: { xs: 120, sm: 140 },
        p: { xs: 1, sm: 1.5 },
        borderRight: '2px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        position: 'sticky',
        left: 0,
        zIndex: 10,
        overflow: 'hidden'
      }}>
        <Typography variant="subtitle2" sx={{ 
          fontWeight: 600, 
          fontSize: { xs: '0.75rem', sm: '0.8rem' },
          color: '#1976d2',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mb: 0.5
        }}>
          {vehicle?.licensePlate || 'N/A'}
        </Typography>
        <Typography variant="caption" sx={{ 
          color: '#666',
          fontSize: { xs: '0.6rem', sm: '0.65rem' },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {vehicle?.brand} {vehicle?.model}
        </Typography>
        {(rental.vehicleVin || vehicle?.vin) && (
          <Typography variant="caption" sx={{
            color: '#888',
            fontSize: { xs: '0.55rem', sm: '0.6rem' },
            fontFamily: 'monospace'
          }}>
            VIN: {(rental.vehicleVin || vehicle?.vin)?.slice(-6)}
          </Typography>
        )}
      </Box>

      {/* Detaily & Status */}
      <Box sx={{ 
        flex: 1,
        p: { xs: 0.75, sm: 1 }, // Zmenšené padding pre kompaktnejšie zobrazenie
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden'
      }}>
        <Box>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 600,
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            color: '#333',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.25
          }}>
            👤 {rental.customerName}
          </Typography>
          {(rental.customerPhone || rental.customer?.phone) && (
            <Typography variant="caption" sx={{ 
              color: '#666',
              fontSize: { xs: '0.55rem', sm: '0.6rem' },
              display: 'block',
              mb: 0.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              📞 {rental.customerPhone || rental.customer?.phone}
            </Typography>
          )}
          <Typography variant="caption" sx={{ 
            color: '#666',
            fontSize: { xs: '0.6rem', sm: '0.65rem' },
            display: 'block',
            mb: { xs: 0.25, sm: 0.5 },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            📅 {format(new Date(rental.startDate), 'd.M.yy HH:mm')} - {format(new Date(rental.endDate), 'd.M.yy HH:mm')}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: '#4caf50',
            fontSize: { xs: '0.65rem', sm: '0.7rem' },
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            💰 {rental.totalPrice?.toFixed(2)}€
          </Typography>
        </Box>
        
        {/* Protokoly a Delete tlačidlo v jednom riadku */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, sm: 0.75 }, 
          mt: { xs: 0.25, sm: 0.5 }, // Zmenšené top margin pre kompaktnejšie zobrazenie
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Fade in timeout={600}>
            <Chip
              size="small"
              label={hasHandover ? '🚗→' : '⏳→'}
              title={hasHandover ? 'Kliknite pre zobrazenie protokolu' : 'Vytvoriť odovzdávací protokol'}
              onClick={handleHandoverClick}
              sx={{
                ...chipStyles.handover,
                bgcolor: hasHandover ? '#4caf50' : '#ff9800',
                '&:hover': hasHandover ? {
                  bgcolor: '#388e3c',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                  animation: 'bounce 0.6s ease'
                } : {
                  bgcolor: '#f57c00',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255,152,0,0.4)'
                }
              }}
            />
          </Fade>
          
          <Fade in timeout={800}>
            <Chip
              size="small"
              label={hasReturn ? '←🚗' : '⏳←'}
              title={hasReturn ? 'Kliknite pre zobrazenie protokolu' : 'Vytvoriť preberací protokol'}
              onClick={handleReturnClick}
              sx={{
                ...chipStyles.return,
                bgcolor: hasReturn ? '#4caf50' : '#ff9800',
                '&:hover': hasReturn ? {
                  bgcolor: '#388e3c',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                  animation: 'bounce 0.6s ease'
                } : {
                  bgcolor: '#f57c00',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255,152,0,0.4)'
                }
              }}
            />
          </Fade>
          
          {/* Loading or fallback button */}
          {isLoadingProtocolStatus ? (
            <Chip
              size="small"
              label="⏳"
              title="Načítavam protocol status..."
              sx={{
                height: { xs: 32, sm: 28 },
                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                bgcolor: '#ff9800',
                color: 'white',
                fontWeight: 700,
                minWidth: { xs: 44, sm: 42 },
                maxWidth: { xs: 60, sm: 60 },
                borderRadius: { xs: 2, sm: 2.5 },
                boxShadow: '0 2px 8px rgba(255,152,0,0.3)',
                animation: 'pulse 2s infinite'
              }}
            />
          ) : (
            !protocolStatusLoaded && (
              <Chip
                size="small"
                label="🔍"
                title="Skontrolovať protokoly"
                onClick={handleProtocolCheck}
                sx={{
                  height: { xs: 32, sm: 28 },
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  bgcolor: '#2196f3',
                  color: 'white',
                  fontWeight: 700,
                  minWidth: { xs: 44, sm: 42 },
                  maxWidth: { xs: 60, sm: 60 },
                  cursor: 'pointer',
                  borderRadius: { xs: 2, sm: 2.5 },
                  boxShadow: '0 2px 8px rgba(33,150,243,0.3)',
                  '&:hover': {
                    bgcolor: '#1976d2',
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                  },
                  transition: 'all 0.2s ease'
                }}
              />
            )
          )}
          
          {/* Delete Button - presunúť vedľa protokolov */}
          {onDelete && (
            <IconButton
              size="small"
              title="Zmazať prenájom"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(rental.id);
              }}
              sx={{ 
                bgcolor: '#f44336', 
                color: 'white',
                width: { xs: 32, sm: 28 },
                height: { xs: 32, sm: 28 },
                ml: { xs: 0.5, sm: 1 },
                '&:hover': { 
                  bgcolor: '#d32f2f',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
});

MobileRentalRow.displayName = 'MobileRentalRow';