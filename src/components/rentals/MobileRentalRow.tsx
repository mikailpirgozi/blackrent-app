/**
 * ⚡ MOBILE RENTAL ROW COMPONENT
 * 
 * Memory-optimized rental row pre mobile view:
 * - React.memo pre prevent unnecessary re-renders
 * - Optimized props structure
 * - Memoized callbacks
 */

import React, { memo } from 'react';
import { Box, Typography, Chip, Fade } from '@mui/material';
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
  onCheckProtocols
}) => {
  // 🎯 Memoized styles to prevent recalculation
  const rowStyles = React.useMemo(() => ({
    display: 'flex',
    borderBottom: index < totalRentals - 1 ? '1px solid #e0e0e0' : 'none',
    '&:hover': { backgroundColor: '#f8f9fa' },
    minHeight: 80,
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
    if (hasHandover) {
      onOpenProtocolMenu(rental, 'handover');
    }
  }, [hasHandover, rental, onOpenProtocolMenu]);

  const handleReturnClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasReturn) {
      onOpenProtocolMenu(rental, 'return');
    }
  }, [hasReturn, rental, onOpenProtocolMenu]);

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
      </Box>

      {/* Detaily & Status */}
      <Box sx={{ 
        flex: 1,
        p: { xs: 1, sm: 1.5 },
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
          <Typography variant="caption" sx={{ 
            color: '#666',
            fontSize: { xs: '0.6rem', sm: '0.65rem' },
            display: 'block',
            mb: { xs: 0.25, sm: 0.5 },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            📅 {format(new Date(rental.startDate), 'd.M.yy')} - {format(new Date(rental.endDate), 'd.M.yy')}
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
        
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.25, sm: 0.5 }, 
          mt: { xs: 0.5, sm: 1 }, 
          justifyContent: 'flex-start',
          flexWrap: 'wrap'
        }}>
          <Fade in timeout={600}>
            <Chip
              size="small"
              label={hasHandover ? '🚗→' : '⏳'}
              title={hasHandover ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
              onClick={handleHandoverClick}
              sx={chipStyles.handover}
            />
          </Fade>
          <Fade in timeout={800}>
            <Chip
              size="small"
              label={hasReturn ? '←🚗' : '⏳'}
              title={hasReturn ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
              onClick={handleReturnClick}
              sx={chipStyles.return}
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
        </Box>
      </Box>
    </Box>
  );
});

MobileRentalRow.displayName = 'MobileRentalRow';