// 🍞 Error Toast Container
// Displays error messages as elegant toast notifications

import {
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import React, { useMemo } from 'react';

import { useError } from '../../context/ErrorContext';
import type { AppError, ErrorSeverity } from '../../types/errors';

// Toast severity mapping
const getSeverityColor = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'critical':
      return 'error';
    default:
      return 'info';
  }
};

// Error icon mapping
const getErrorIcon = (error: AppError) => {
  switch (error.category) {
    case 'network':
      return <WifiOffIcon fontSize="small" />;
    default:
      return undefined;
  }
};

// Individual Error Toast Component
interface ErrorToastProps {
  error: AppError;
  onDismiss: (id: string) => void;
  isOnline: boolean;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  isOnline,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const severity = getSeverityColor(error.severity);
  const icon = getErrorIcon(error);

  const handleRetry = async () => {
    // TODO: Implement retry logic based on error context
    console.log('Retrying action for error:', error.id);
    onDismiss(error.id);
  };

  const handleDismiss = () => {
    onDismiss(error.id);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Alert
      severity={severity}
      icon={icon}
      sx={{
        mb: 1,
        minWidth: 300,
        maxWidth: 500,
        '& .MuiAlert-message': { width: '100%' },
        '& .MuiAlert-action': { alignItems: 'flex-start', pt: 0.5 },
      }}
      action={
        <Box>
          {error.details && (
            <IconButton size="small" onClick={toggleExpanded} sx={{ mr: 0.5 }}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {error.retry && !isOnline && (
            <IconButton
              size="small"
              onClick={handleRetry}
              sx={{ mr: 0.5 }}
              disabled={!isOnline}
            >
              <RefreshIcon />
            </IconButton>
          )}
          <IconButton size="small" onClick={handleDismiss}>
            <CloseIcon />
          </IconButton>
        </Box>
      }
    >
      <AlertTitle sx={{ mb: error.details ? 1 : 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {error.message}
          </Typography>
          <Chip
            label={error.category}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Stack>
      </AlertTitle>

      <Collapse in={expanded}>
        {error.details && (
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            {error.details}
          </Typography>
        )}

        {error.context && Object.keys(error.context).length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Technické detaily:
            </Typography>
            <Box
              component="pre"
              sx={{
                fontSize: '0.7rem',
                mt: 0.5,
                p: 1,
                bgcolor: 'rgba(0,0,0,0.1)',
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 100,
              }}
            >
              {JSON.stringify(error.context, null, 2)}
            </Box>
          </Box>
        )}

        {error.retry && (
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
            disabled={!isOnline}
            sx={{ mt: 1 }}
          >
            Skúsiť znovu
          </Button>
        )}
      </Collapse>

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1,
          opacity: 0.6,
          fontSize: '0.7rem',
        }}
      >
        {error.timestamp.toLocaleTimeString()}
      </Typography>
    </Alert>
  );
};

// Network Status Indicator
const NetworkStatusIndicator: React.FC<{ isOnline: boolean }> = ({
  isOnline,
}) => (
  <Box
    sx={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 2000,
      display: isOnline ? 'none' : 'flex',
      alignItems: 'center',
      gap: 1,
      p: 1,
      bgcolor: 'warning.main',
      color: 'warning.contrastText',
      borderRadius: 1,
      boxShadow: 2,
    }}
  >
    <WifiOffIcon fontSize="small" />
    <Typography variant="body2">Offline</Typography>
  </Box>
);

// Main Error Toast Container
export const ErrorToastContainer: React.FC = () => {
  const { errors, dismissError, isOnline } = useError();

  // Sort errors by severity and timestamp
  const sortedErrors = useMemo(() => {
    const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
    return [...errors].sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [errors]);

  // Get the most recent error for Snackbar positioning
  // const latestError = sortedErrors[0]; // Currently not used

  return (
    <>
      <NetworkStatusIndicator isOnline={isOnline} />

      <Snackbar
        open={sortedErrors.length > 0}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          top: { xs: 80, sm: 24 },
          '& .MuiSnackbarContent-root': {
            p: 0,
            bgcolor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <Stack spacing={1} sx={{ minWidth: 300 }}>
          {sortedErrors.map(error => (
            <ErrorToast
              key={error.id}
              error={error}
              onDismiss={dismissError}
              isOnline={isOnline}
            />
          ))}

          {sortedErrors.length > 3 && (
            <Alert severity="info" sx={{ opacity: 0.8 }}>
              <Typography variant="body2">
                + {sortedErrors.length - 3} ďalších chýb
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  // Dismiss older errors
                  sortedErrors.slice(3).forEach(error => {
                    dismissError(error.id);
                  });
                }}
                sx={{ mt: 0.5 }}
              >
                Skryť staršie
              </Button>
            </Alert>
          )}
        </Stack>
      </Snackbar>
    </>
  );
};

export default ErrorToastContainer;
