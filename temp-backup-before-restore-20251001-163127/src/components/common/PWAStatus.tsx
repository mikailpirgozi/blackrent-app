// 📊 PWA Status Component
// Shows PWA state, offline status, and management options

import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  ClearAll as ClearCacheIcon,
  Info as InfoIcon,
  GetApp as InstallIcon,
  CloudDone as InstalledIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  // Switch,
  // FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { usePWA } from '../../hooks/usePWA';

interface PWAStatusProps {
  showDetailed?: boolean;
  position?: 'fixed' | 'relative';
}

export const PWAStatus: React.FC<PWAStatusProps> = ({
  showDetailed = false,
  position = 'relative',
}) => {
  const {
    isInstalled,
    isInstallable,
    isOffline,
    isUpdateAvailable,
    promptInstall,
    updateServiceWorker,
    clearCache,
    checkForUpdates,
    getVersion,
  } = usePWA();

  const { networkQuality } = useNetworkStatus();
  const isSlowConnection = networkQuality === 'slow';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [version, setVersion] = useState<string>('');
  const [, setLoading] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShowInfo = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      const versionInfo = await getVersion();
      setVersion(versionInfo);
      setShowDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      await promptInstall();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      await updateServiceWorker();
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      await clearCache();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      await checkForUpdates();
    } finally {
      setLoading(false);
    }
  };

  // Get status color and icon
  const getStatusInfo = () => {
    if (isOffline) {
      return {
        color: 'error' as const,
        icon: <OfflineIcon fontSize="small" />,
        label: 'Offline',
        description: 'Bez internetového pripojenia',
      };
    }

    if (isInstalled) {
      return {
        color: 'success' as const,
        icon: <InstalledIcon fontSize="small" />,
        label: 'Nainštalované',
        description: 'Aplikácia je nainštalovaná',
      };
    }

    if (isInstallable) {
      return {
        color: 'primary' as const,
        icon: <InstallIcon fontSize="small" />,
        label: 'Môže sa nainštalovať',
        description: 'Kliknite pre inštaláciu',
      };
    }

    return {
      color: 'default' as const,
      icon: <OnlineIcon fontSize="small" />,
      label: 'Online',
      description: 'Štandardný web prehliadač',
    };
  };

  const statusInfo = getStatusInfo();

  // Simple chip version
  if (!showDetailed) {
    return (
      <Box
        sx={
          position === 'fixed'
            ? {
                position: 'fixed',
                top: 16,
                right: 80, // Moved left to avoid profile overlap
                zIndex: 1300,
                '@media (max-width: 600px)': {
                  right: 16, // On mobile, move closer to edge
                  top: 80, // Move down to avoid mobile header
                },
              }
            : {}
        }
      >
        <Tooltip title={statusInfo.description}>
          <Badge
            variant="dot"
            color={isUpdateAvailable ? 'error' : 'default'}
            invisible={!isUpdateAvailable}
          >
            <Chip
              icon={statusInfo.icon}
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
              onClick={isInstallable ? handleInstall : handleMenuClick}
              clickable
              sx={{
                fontWeight: 500,
                '& .MuiChip-icon': {
                  marginLeft: 1,
                },
                '@media (max-width: 600px)': {
                  fontSize: '0.75rem', // Smaller on mobile
                  height: 28,
                },
              }}
            />
          </Badge>
        </Tooltip>
      </Box>
    );
  }

  // Detailed version
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        {/* Connection Status */}
        <Chip
          icon={isOffline ? <OfflineIcon /> : <OnlineIcon />}
          label={isOffline ? 'Offline' : `Online (${networkQuality})`}
          color={isOffline ? 'error' : isSlowConnection ? 'warning' : 'success'}
          variant="outlined"
        />

        {/* PWA Status */}
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.label}
          color={statusInfo.color}
          onClick={isInstallable ? handleInstall : handleMenuClick}
          clickable={isInstallable}
        />

        {/* Update Available */}
        {isUpdateAvailable && (
          <Chip
            icon={<UpdateIcon />}
            label="Update dostupný"
            color="info"
            onClick={handleUpdate}
            clickable
          />
        )}

        {/* Settings Menu */}
        <IconButton onClick={handleMenuClick} size="small">
          <UnifiedIcon name="settings" />
        </IconButton>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {isInstallable && (
          <MenuItem onClick={handleInstall}>
            <ListItemIcon>
              <InstallIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Nainštalovať aplikáciu" />
          </MenuItem>
        )}

        {isUpdateAvailable && (
          <MenuItem onClick={handleUpdate}>
            <ListItemIcon>
              <UpdateIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Aktualizovať aplikáciu" />
          </MenuItem>
        )}

        <MenuItem onClick={handleCheckUpdates}>
          <ListItemIcon>
            <UnifiedIcon name="refresh" fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Skontrolovať aktualizácie" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleClearCache}>
          <ListItemIcon>
            <ClearCacheIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Vymazať cache" />
        </MenuItem>

        <MenuItem onClick={handleShowInfo}>
          <ListItemIcon>
            <UnifiedIcon name="info" fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Informácie o aplikácii" />
        </MenuItem>
      </Menu>

      {/* Info Dialog */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <UnifiedIcon name="info" color="primary" />
            Informácie o BlackRent PWA
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              BlackRent je Progressive Web App (PWA) s pokročilými funkciami
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Status aplikácie:
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {statusInfo.icon}
                <Typography variant="body2">
                  {statusInfo.description}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Sieťové pripojenie:
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {isOffline ? (
                  <OfflineIcon color="error" />
                ) : (
                  <OnlineIcon color="success" />
                )}
                <Typography variant="body2">
                  {isOffline
                    ? 'Offline režim'
                    : `Online - kvalita: ${networkQuality}`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Verzia:
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                {version || 'Načítavam...'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Funkcie:
              </Typography>
              <Box sx={{ pl: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  ✅ Offline podpora
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  ✅ Automatické cache
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  ✅ Background sync
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  ✅ Rýchle načítanie
                </Typography>
                {isInstalled && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    ✅ Standalone režim
                  </Typography>
                )}
              </Box>
            </Box>

            {isInstalled && (
              <Alert severity="success">
                🎉 Aplikácia je úspešne nainštalovaná a beží v standalone
                režime!
              </Alert>
            )}

            {isInstallable && (
              <Alert severity="info">
                💡 Môžete si nainštalovať aplikáciu pre lepší zážitok
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Zavrieť</Button>
          {isInstallable && (
            <Button
              variant="contained"
              onClick={handleInstall}
              startIcon={<InstallIcon />}
            >
              Nainštalovať
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PWAStatus;
