/**
 * 🎉 SUCCESS TOAST COMPONENT
 * 
 * Pleasant success notifications:
 * - Protocol status loaded
 * - Data synced
 * - Actions completed
 * - Smooth animations
 */

import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  Snackbar, 
  Box, 
  Typography, 
  IconButton,
  Chip,
  Fade,
  Slide
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  CloudDone as CloudDoneIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface SuccessToastProps {
  message: string | null;
  onClose: () => void;
  icon?: 'check' | 'speed' | 'cloud' | 'refresh';
  autoHideDuration?: number;
  showStats?: {
    count?: number;
    duration?: number;
  };
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  onClose,
  icon = 'check',
  autoHideDuration = 4000,
  showStats
}) => {
  const [open, setOpen] = useState(false);

  // Show toast when message appears
  useEffect(() => {
    if (message) {
      setOpen(true);
    }
  }, [message]);

  // Handle close
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  // Get icon based on type
  const getIcon = () => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (icon) {
      case 'speed':
        return <SpeedIcon {...iconProps} />;
      case 'cloud':
        return <CloudDoneIcon {...iconProps} />;
      case 'refresh':
        return <RefreshIcon {...iconProps} />;
      default:
        return <CheckCircleIcon {...iconProps} />;
    }
  };

  if (!message) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'left' } as any}
    >
      <Alert
        severity="success"
        variant="filled"
        onClose={handleClose}
        icon={getIcon()}
        sx={{
          minWidth: 280,
          maxWidth: 400,
          '& .MuiAlert-message': {
            width: '100%'
          },
          '& .MuiAlert-icon': {
            animation: 'pulse 1.5s ease-in-out',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' }
            }
          }
        }}
        action={
          <IconButton size="small" onClick={handleClose} sx={{ color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {message}
          </Typography>
          
          {/* Stats display */}
          {showStats && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {showStats.count !== undefined && (
                <Fade in timeout={800}>
                  <Chip
                    size="small"
                    label={`${showStats.count} záznamov`}
                    variant="outlined"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'inherit',
                      borderColor: 'rgba(255,255,255,0.3)',
                      fontSize: '0.7rem'
                    }}
                  />
                </Fade>
              )}
              
              {showStats.duration !== undefined && (
                <Fade in timeout={1000}>
                  <Chip
                    size="small"
                    label={`${showStats.duration}ms`}
                    variant="outlined"
                    icon={<SpeedIcon fontSize="small" />}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'inherit',
                      borderColor: 'rgba(255,255,255,0.3)',
                      fontSize: '0.7rem'
                    }}
                  />
                </Fade>
              )}
            </Box>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};