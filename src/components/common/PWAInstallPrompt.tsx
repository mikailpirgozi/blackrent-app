// 📱 PWA Install Prompt Component
// Provides elegant install prompt with animations and user guidance

import {
  Close as CloseIcon,
  GetApp as InstallIcon,
  PhoneIphone as PhoneIcon,
  Computer as DesktopIcon,
  Star as StarIcon,
  Wifi as WifiIcon,
  Speed as SpeedIcon,
  NotificationsActive as NotificationIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Slide,
  Paper,
  useTheme,
  useMediaQuery,
  Fab,
  Snackbar,
  Alert,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState, useEffect } from 'react';

import { usePWA } from '../../hooks/usePWA';

// Slide transition for dialog
const Transition = React.forwardRef<
  unknown,
  TransitionProps & { children: React.ReactElement }
>(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface PWAInstallPromptProps {
  autoShow?: boolean;
  delay?: number;
  onInstall?: (success: boolean) => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  autoShow = true,
  delay = 5000,
  onInstall,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  const [showDialog, setShowDialog] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Auto-show logic
  useEffect(() => {
    if (!autoShow || dismissed || isInstalled || !isInstallable) {
      return;
    }

    const timer = setTimeout(() => {
      setShowFab(true);

      // Show dialog after additional delay on mobile
      if (isMobile) {
        setTimeout(() => setShowDialog(true), 3000);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [autoShow, delay, dismissed, isInstalled, isInstallable, isMobile]);

  // Hide when installed
  useEffect(() => {
    if (isInstalled) {
      setShowDialog(false);
      setShowFab(false);
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!isInstallable) return;

    setInstalling(true);
    try {
      const success = await promptInstall();

      if (success) {
        setShowDialog(false);
        setShowFab(false);
        onInstall?.(true);
      }
    } catch (error) {
      console.error('Install failed:', error);
      onInstall?.(false);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowDialog(false);
    setDismissed(true);

    // Keep FAB visible for later access
    setTimeout(() => {
      setShowFab(true);
    }, 1000);
  };

  const handleFabClick = () => {
    setShowDialog(true);
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  const features = [
    {
      icon: <SpeedIcon color="primary" />,
      title: 'Rýchlejšie načítanie',
      description: 'Okamžité spustenie z plochy',
    },
    {
      icon: <WifiIcon color="primary" />,
      title: 'Offline prístup',
      description: 'Funguje aj bez internetu',
    },
    {
      icon: <NotificationIcon color="primary" />,
      title: 'Notifikácie',
      description: 'Oznámenia priamo na zariadenie',
    },
  ];

  return (
    <>
      {/* Install Dialog */}
      <Dialog
        open={showDialog}
        onClose={handleDismiss}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.secondary.light}15 100%)`,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1}>
              {isMobile ? (
                <PhoneIcon color="primary" />
              ) : (
                <DesktopIcon color="primary" />
              )}
              <Typography variant="h6" component="div">
                Nainštalovať BlackRent
              </Typography>
            </Box>
            <IconButton onClick={handleDismiss} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box textAlign="center" mb={3}>
            <Box
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'white',
                animation: 'pulse 2s infinite',
              }}
            >
              🚗
            </Box>

            <Typography variant="h6" gutterBottom>
              Získajte najlepší zážitok
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Nainštalujte si BlackRent ako aplikáciu pre{' '}
              {isMobile ? 'mobilné zariadenie' : 'počítač'} a užívajte si všetky
              výhody.
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            {features.map((feature, index) => (
              <Box
                key={index}
                display="flex"
                alignItems="center"
                gap={2}
                py={1}
                sx={{
                  '&:not(:last-child)': {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `${theme.palette.primary.main}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {feature.icon}
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {isMobile && (
            <Paper
              sx={{
                p: 2,
                background: theme.palette.info.light + '20',
                border: `1px solid ${theme.palette.info.light}`,
              }}
            >
              <Typography variant="body2" color="info.dark" textAlign="center">
                💡 <strong>Tip:</strong> Po inštalácii nájdete BlackRent na
                ploche a v zozname aplikácií
              </Typography>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleDismiss} color="inherit" sx={{ mr: 1 }}>
            Neskôr
          </Button>
          <Button
            onClick={handleInstall}
            variant="contained"
            size="large"
            disabled={installing}
            startIcon={installing ? null : <InstallIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {installing ? 'Inštalujem...' : 'Nainštalovať'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      {showFab && (
        <Fab
          color="primary"
          onClick={handleFabClick}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            animation: 'bounce 2s infinite',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
          aria-label="Nainštalovať aplikáciu"
        >
          <InstallIcon />
        </Fab>
      )}

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-15px); }
          70% { transform: translateY(-5px); }
          90% { transform: translateY(-2px); }
        }
      `}</style>
    </>
  );
};

// Simple Install Button Component
interface PWAInstallButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'outlined',
  size = 'medium',
  fullWidth = false,
  children,
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleInstall}
      disabled={installing}
      startIcon={<InstallIcon />}
      sx={{ textTransform: 'none' }}
    >
      {children || (installing ? 'Inštalujem...' : 'Nainštalovať aplikáciu')}
    </Button>
  );
};

export default PWAInstallPrompt;
