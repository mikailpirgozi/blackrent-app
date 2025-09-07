/**
 * 🍞 ENHANCED ERROR TOAST COMPONENT
 *
 * Vylepšená verzia error toast s:
 * - User-friendly messages
 * - Contextual suggestions
 * - Better positioning
 * - Recovery actions
 */

import {
  BugReport as BugReportIcon,
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { ErrorContext } from '../../utils/enhancedErrorMessages';
import {
  getEnhancedErrorMessage,
  getRecoverySuggestions,
} from '../../utils/enhancedErrorMessages';
import type { EnhancedError } from '../../utils/errorHandling';

interface EnhancedErrorToastProps {
  error: EnhancedError | null;
  context?: ErrorContext;
  onClose: () => void;
  onRetry?: () => void;
  autoHideDuration?: number;
  position?: 'top' | 'bottom';
}

export const EnhancedErrorToast: React.FC<EnhancedErrorToastProps> = ({
  error,
  context = {},
  onClose,
  onRetry,
  autoHideDuration = 8000, // Longer for better UX
  position = 'top',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Show toast when error appears
  useEffect(() => {
    if (error) {
      setOpen(true);
      setShowDetails(false);
      setShowTechnicalDetails(false);
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

  // Handle retry with enhanced feedback
  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      setOpen(false);
      setTimeout(onClose, 300);
    } catch (err) {
      console.error('Retry failed:', err);
      // Error handling už sa zvládne v parent komponente
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle page refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  if (!error) return null;

  const enhancedMessage = getEnhancedErrorMessage(error, context);
  const suggestions = getRecoverySuggestions(error);

  // Determine toast positioning
  const anchorOrigin =
    position === 'top'
      ? { vertical: 'top' as const, horizontal: 'right' as const }
      : { vertical: 'bottom' as const, horizontal: 'center' as const };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      sx={{
        // Better positioning for mobile
        ...(isMobile &&
          position === 'top' && {
            top: 24,
            left: 16,
            right: 16,
            transform: 'none !important',
          }),
        ...(isMobile &&
          position === 'bottom' && {
            bottom: 80, // Above mobile navigation
            left: 16,
            right: 16,
            transform: 'none !important',
          }),
        // Desktop positioning
        ...(!isMobile &&
          position === 'top' && {
            top: 24,
            right: 24,
          }),
        zIndex: theme.zIndex.snackbar + 1,
      }}
    >
      <Alert
        severity={enhancedMessage.severity}
        onClose={handleClose}
        sx={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 480,
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,

          '& .MuiAlert-message': {
            width: '100%',
            padding: 0,
          },

          '& .MuiAlert-action': {
            alignItems: 'flex-start',
            paddingTop: 1,
          },

          // Enhanced icon styling
          '& .MuiAlert-icon': {
            fontSize: 24,
            marginTop: 0.5,
          },
        }}
        action={
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              sx={{
                color: 'inherit',
                opacity: 0.8,
                '&:hover': { opacity: 1 },
              }}
            >
              {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{
                color: 'inherit',
                opacity: 0.8,
                '&:hover': { opacity: 1 },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        }
      >
        <Box>
          {/* Main error message */}
          <Box sx={{ mb: showDetails ? 1.5 : 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <span style={{ fontSize: 18 }}>{enhancedMessage.emoji}</span>
              {enhancedMessage.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.4 }}>
              {enhancedMessage.message}
            </Typography>
          </Box>

          {/* Connection status indicator */}
          {enhancedMessage.category === 'network' && (
            <Chip
              size="small"
              label={isOnline ? 'Online' : 'Offline'}
              color={isOnline ? 'success' : 'error'}
              sx={{
                mb: showDetails ? 1 : 0,
                fontSize: '0.7rem',
              }}
            />
          )}

          {/* Expandable details */}
          <Collapse in={showDetails} unmountOnExit>
            <Box sx={{ mt: 1.5 }}>
              {/* Suggestion */}
              <Typography
                variant="body2"
                sx={{
                  mb: 1.5,
                  padding: 1.5,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                }}
              >
                💡 <strong>Návrh:</strong> {enhancedMessage.suggestion}
              </Typography>

              {/* Recovery suggestions */}
              {suggestions.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, mb: 1, display: 'block' }}
                  >
                    Možné riešenia:
                  </Typography>
                  <Stack spacing={0.5}>
                    {suggestions.map((suggestion, index) => (
                      <Typography
                        key={index}
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          opacity: 0.8,
                          fontSize: '0.75rem',
                        }}
                      >
                        <Box
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            backgroundColor: 'currentColor',
                            flexShrink: 0,
                          }}
                        />
                        {suggestion}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Action buttons */}
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                {onRetry && enhancedMessage.actionLabel && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleRetry}
                    disabled={isRetrying}
                    startIcon={isRetrying ? undefined : <RefreshIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      minWidth: 120,
                    }}
                  >
                    {isRetrying ? 'Skúšam...' : enhancedMessage.actionLabel}
                  </Button>
                )}

                {enhancedMessage.category === 'unknown' && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleRefresh}
                    startIcon={<RefreshIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                    }}
                  >
                    Obnoviť stránku
                  </Button>
                )}
              </Stack>

              {/* Technical details toggle */}
              <Button
                size="small"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                startIcon={<BugReportIcon />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                {showTechnicalDetails ? 'Skryť' : 'Zobraziť'} technické detaily
              </Button>

              <Collapse in={showTechnicalDetails} unmountOnExit>
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    backgroundColor: alpha(theme.palette.grey[500], 0.1),
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    wordBreak: 'break-all',
                    opacity: 0.8,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}
                  >
                    Technické info:
                  </Typography>
                  <Typography variant="caption" component="div">
                    Error: {error.technicalMessage}
                  </Typography>
                  {error.originalError && 'status' in error.originalError && (
                    <Typography variant="caption" component="div">
                      Status:{' '}
                      {(error.originalError as { status: number }).status}
                    </Typography>
                  )}
                  <Typography variant="caption" component="div">
                    Type: {error.errorType}
                  </Typography>
                  <Typography variant="caption" component="div">
                    Retryable: {error.isRetryable ? 'Yes' : 'No'}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          </Collapse>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default EnhancedErrorToast;
