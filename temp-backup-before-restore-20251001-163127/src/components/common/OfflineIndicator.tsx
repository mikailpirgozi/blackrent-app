// 📵 Offline Indicator Component
// Shows offline status with elegant animations and retry options

import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  CloudOff as CloudOffIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  // Fade,
  Slide,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePWA } from '../../hooks/usePWA';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showDetails = false,
  autoHide = false,
  hideDelay = 5000,
}) => {
  const theme = useTheme();
  const { isOnline, networkQuality, wasOffline, reconnectedAt } =
    useNetworkStatus();
  const { isOffline: pwaOffline } = usePWA();

  const [showIndicator, setShowIndicator] = useState(!isOnline);
  const [expanded, setExpanded] = useState(false);
  const [pendingActions, setPendingActions] = useState<number>(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Show/hide indicator based on connection status
  useEffect(() => {
    if (!isOnline || pwaOffline) {
      setShowIndicator(true);
    } else if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, hideDelay);
      return () => clearTimeout(timer);
    } else {
      setShowIndicator(false);
    }
  }, [isOnline, pwaOffline, autoHide, hideDelay]);

  // Listen for service worker messages about pending actions
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PENDING_ACTIONS':
            setPendingActions(payload.count || 0);
            break;
          case 'SYNC_COMPLETE':
            setLastSync(new Date());
            setPendingActions(0);
            break;
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      // Try to fetch a simple endpoint to test connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        // Connection restored, trigger sync if available
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          // Background sync (if supported)
          if ('sync' in registration) {
            (
              registration as ServiceWorkerRegistration & {
                sync?: { register: (tag: string) => Promise<void> };
              }
            ).sync?.register('blackrent-sync');
          }
        }
      }
    } catch (error) {
      console.log('Retry failed:', error);
    } finally {
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (!showIndicator) {
    return null;
  }

  const isOffline = !isOnline || pwaOffline;
  const showReconnected = isOnline && wasOffline && reconnectedAt;

  return (
    <Slide direction={position === 'top' ? 'down' : 'up'} in={showIndicator}>
      <Box
        sx={{
          position: 'fixed',
          [position]: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          p: 1,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            background: isOffline
              ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.9)}, ${alpha(theme.palette.error.dark, 0.9)})`
              : `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.9)}, ${alpha(theme.palette.success.dark, 0.9)})`,
            color: 'white',
            mx: 'auto',
            maxWidth: 600,
            borderRadius: 2,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Main Status Bar */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            p={2}
            sx={{
              cursor: showDetails ? 'pointer' : 'default',
            }}
            onClick={showDetails ? handleToggleExpanded : undefined}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  animation: isOffline ? 'pulse 2s infinite' : undefined,
                }}
              >
                {isOffline ? <OfflineIcon /> : <OnlineIcon />}
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {isOffline
                    ? 'Aplikácia je offline'
                    : showReconnected
                      ? 'Pripojenie obnovené!'
                      : 'Pripojené'}
                </Typography>

                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {isOffline
                    ? 'Niektoré funkcie sú obmedzené'
                    : `Kvalita siete: ${networkQuality}`}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {pendingActions > 0 && (
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                  }}
                >
                  <ScheduleIcon fontSize="small" />
                  <Typography variant="body2">
                    {pendingActions} čakajúcich
                  </Typography>
                </Box>
              )}

              {isOffline && (
                <IconButton
                  color="inherit"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  size="small"
                >
                  <UnifiedIcon name="refresh" sx={{
                      animation: isRetrying
                        ? 'spin 1s linear infinite'
                        : undefined,
                    }} />
                </IconButton>
              )}

              {showDetails && (
                <IconButton
                  color="inherit"
                  onClick={handleToggleExpanded}
                  size="small"
                >
                  {expanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Progress bar for retrying */}
          {isRetrying && (
            <LinearProgress
              sx={{
                '& .MuiLinearProgress-bar': {
                  background: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          )}

          {/* Expanded Details */}
          {showDetails && (
            <Collapse in={expanded}>
              <Box
                sx={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  p: 2,
                  background: 'rgba(0, 0, 0, 0.1)',
                }}
              >
                <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                  {/* Network Status */}
                  <Box
                    sx={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      p: 1.5,
                      flex: '1 1 200px',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CloudOffIcon fontSize="small" />
                      <Typography variant="subtitle2">Sieť</Typography>
                    </Box>
                    <Typography variant="body2">
                      Status: {isOffline ? 'Offline' : 'Online'}
                    </Typography>
                    {!isOffline && (
                      <Typography variant="body2">
                        Kvalita: {networkQuality}
                      </Typography>
                    )}
                  </Box>

                  {/* Pending Actions */}
                  <Box
                    sx={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      p: 1.5,
                      flex: '1 1 200px',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ScheduleIcon fontSize="small" />
                      <Typography variant="subtitle2">Akcie</Typography>
                    </Box>
                    <Typography variant="body2">
                      Čakajúce: {pendingActions}
                    </Typography>
                    {lastSync && (
                      <Typography variant="body2">
                        Posledný sync: {lastSync.toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UnifiedIcon name="refresh" />}
                    onClick={handleRetry}
                    disabled={isRetrying}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      '&:hover': {
                        borderColor: 'white',
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    {isRetrying ? 'Skúšam...' : 'Skúsiť znovu'}
                  </Button>

                  {pendingActions > 0 && isOnline && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SyncIcon />}
                      onClick={async () => {
                        if ('serviceWorker' in navigator) {
                          const registration =
                            await navigator.serviceWorker.ready;
                          // Background sync (if supported)
                          if ('sync' in registration) {
                            (
                              registration as ServiceWorkerRegistration & {
                                sync?: {
                                  register: (tag: string) => Promise<void>;
                                };
                              }
                            ).sync?.register('blackrent-sync');
                          }
                        }
                      }}
                      sx={{
                        color: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        '&:hover': {
                          borderColor: 'white',
                          background: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Synchronizovať
                    </Button>
                  )}
                </Box>

                <Alert
                  severity={isOffline ? 'warning' : 'success'}
                  sx={{
                    mt: 2,
                    '& .MuiAlert-root': {
                      color: 'inherit',
                    },
                  }}
                >
                  {isOffline
                    ? 'Vaše akcie budú synchronizované po obnovení pripojenia.'
                    : 'Všetko funguje správne. Akcie sa synchronizujú automaticky.'}
                </Alert>
              </Box>
            </Collapse>
          )}
        </Paper>

        {/* Global Styles for Animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Box>
    </Slide>
  );
};

export default OfflineIndicator;
