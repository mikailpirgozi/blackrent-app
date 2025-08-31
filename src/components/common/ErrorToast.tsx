/**
 * 🍞 ERROR TOAST COMPONENT
 *
 * User-friendly error notifications:
 * - Network errors
 * - Retry indicators
 * - Connection status
 * - Auto-dismiss
 */

import {
  Close as CloseIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  Alert,
  Snackbar,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { EnhancedError } from '../../utils/errorHandling';

interface ErrorToastProps {
  error: EnhancedError | null;
  onClose: () => void;
  onRetry?: () => void;
  autoHideDuration?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onClose,
  onRetry,
  autoHideDuration = 6000,
}) => {
  const [open, setOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { isOnline, networkQuality, wasOffline } = useNetworkStatus();

  // Show toast when error appears
  useEffect(() => {
    if (error) {
      setOpen(true);
    }
  }, [error]);

  // Handle close
  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setOpen(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  // Handle retry
  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      setOpen(false);
      setTimeout(onClose, 300);
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  // Get alert severity based on error type
  const getSeverity = () => {
    if (!error) return 'info';

    switch (error.errorType) {
      case 'connection':
        return 'warning';
      case 'server':
        return 'error';
      case 'timeout':
        return 'warning';
      default:
        return 'error';
    }
  };

  // Get connection icon
  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOffIcon fontSize="small" />;

    switch (networkQuality) {
      case 'slow':
        return <WifiIcon fontSize="small" sx={{ color: 'orange' }} />;
      case 'medium':
        return <WifiIcon fontSize="small" sx={{ color: 'green' }} />;
      case 'fast':
        return <WifiIcon fontSize="small" sx={{ color: 'blue' }} />;
      default:
        return <WifiIcon fontSize="small" />;
    }
  };

  if (!error) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={error.isRetryable ? null : autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity={getSeverity()}
        variant="filled"
        onClose={handleClose}
        sx={{
          minWidth: 300,
          maxWidth: 500,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Connection status */}
            <Chip
              icon={getConnectionIcon()}
              label={isOnline ? networkQuality : 'offline'}
              size="small"
              variant="outlined"
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'inherit',
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            />

            {/* Retry button */}
            {error.isRetryable && onRetry && (
              <IconButton
                size="small"
                onClick={handleRetry}
                disabled={isRetrying || !isOnline}
                sx={{ color: 'inherit' }}
              >
                <RefreshIcon
                  fontSize="small"
                  sx={{
                    animation: isRetrying ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            )}

            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {error.userMessage}
          </Typography>

          {/* Progress bar for retrying */}
          {isRetrying && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'rgba(255,255,255,0.8)',
                  },
                }}
              />
              <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.8 }}>
                Skúšam znova...
              </Typography>
            </Box>
          )}

          {/* Network status indicator */}
          {wasOffline && isOnline && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon fontSize="small" />
              <Typography variant="caption">Pripojenie obnovené</Typography>
            </Box>
          )}

          {/* Technical details (development mode) */}
          {process.env.NODE_ENV === 'development' && (
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: 'block',
                opacity: 0.7,
                fontFamily: 'monospace',
                fontSize: '0.7rem',
              }}
            >
              {error.technicalMessage}
            </Typography>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};
